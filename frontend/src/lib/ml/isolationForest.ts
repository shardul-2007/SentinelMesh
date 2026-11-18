import { createRng, NON_FEATURE_KEYWORDS } from './csvProcessor';
import { IsolationForestArtifact } from './types';

interface IsoNode {
  external: boolean;
  size: number;
  featureIdx?: number;
  splitValue?: number;
  left?: IsoNode;
  right?: IsoNode;
}

const EULER_MASCHERONI = 0.5772156649;

function averagePathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * (Math.log(n - 1) + EULER_MASCHERONI) - (2 * (n - 1)) / n;
}

function buildIsoTree(
  X: number[][],
  indices: number[],
  height: number,
  heightLimit: number,
  rng: () => number
): IsoNode {
  if (height >= heightLimit || indices.length <= 1) {
    return { external: true, size: indices.length };
  }

  const numFeats = X[0].length;
  // Pick a random feature with non-zero variance across indices
  const tried = new Set<number>();
  let chosenFeat = -1;
  let minVal = Infinity;
  let maxVal = -Infinity;

  while (tried.size < numFeats) {
    const f = Math.floor(rng() * numFeats);
    if (tried.has(f)) continue;
    tried.add(f);

    let lo = Infinity;
    let hi = -Infinity;
    for (const idx of indices) {
      const v = X[idx][f];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (hi - lo > 1e-9) {
      chosenFeat = f;
      minVal = lo;
      maxVal = hi;
      break;
    }
  }

  if (chosenFeat === -1) {
    return { external: true, size: indices.length };
  }

  const splitValue = minVal + rng() * (maxVal - minVal);
  const leftIdx: number[] = [];
  const rightIdx: number[] = [];
  for (const idx of indices) {
    if (X[idx][chosenFeat] < splitValue) leftIdx.push(idx);
    else rightIdx.push(idx);
  }

  if (!leftIdx.length || !rightIdx.length) {
    return { external: true, size: indices.length };
  }

  return {
    external: false,
    size: indices.length,
    featureIdx: chosenFeat,
    splitValue,
    left: buildIsoTree(X, leftIdx, height + 1, heightLimit, rng),
    right: buildIsoTree(X, rightIdx, height + 1, heightLimit, rng),
  };
}

function pathLength(node: IsoNode, x: number[], currentHeight = 0): number {
  if (node.external) {
    return currentHeight + averagePathLength(node.size);
  }
  if (x[node.featureIdx!] < node.splitValue!) {
    return pathLength(node.left!, x, currentHeight + 1);
  }
  return pathLength(node.right!, x, currentHeight + 1);
}

/**
 * Fit an Isolation Forest on numerical network traffic features and compute
 * genuine anomaly flags and scores.
 */
export function runIsolationForest(params: {
  rows: Record<string, any>[];
  featureColumns: string[];
  labelColumn?: string | null;
  contamination?: number;
  nEstimators?: number;
  seed?: number;
  datasetName: string;
  isSyntheticDemo: boolean;
}): {
  artifact: IsolationForestArtifact;
  anomalyStatuses: ('ANOMALY' | 'NORMAL')[];
  anomalyScores: number[];
  rawScores: number[];
} {
  const {
    rows,
    featureColumns,
    labelColumn = null,
    contamination = 0.18,
    nEstimators = 80,
    seed = 42,
    datasetName,
    isSyntheticDemo,
  } = params;

  if (!rows || rows.length < 5) {
    throw new Error('At least 5 rows are required for Isolation Forest anomaly detection.');
  }

  const safeFeatures = featureColumns.filter((f) => {
    if (f === labelColumn) return false;
    const lower = f.toLowerCase();
    return !NON_FEATURE_KEYWORDS.some((kw) => lower.includes(kw));
  });

  if (!safeFeatures.length) {
    throw new Error('No valid numerical features available for Isolation Forest.');
  }

  // Median imputation + StandardScaler
  const medians: number[] = [];
  const means: number[] = [];
  const stds: number[] = [];

  for (const col of safeFeatures) {
    const vals: number[] = [];
    for (const r of rows) {
      const n = Number(r[col]);
      if (r[col] !== null && r[col] !== undefined && r[col] !== '' && Number.isFinite(n)) {
        vals.push(n);
      }
    }
    vals.sort((a, b) => a - b);
    const med = vals.length ? vals[Math.floor(vals.length / 2)] : 0;
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const variance = vals.length ? vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length : 1;
    const std = Math.sqrt(variance) > 1e-9 ? Math.sqrt(variance) : 1;
    medians.push(med);
    means.push(mean);
    stds.push(std);
  }

  const X: number[][] = rows.map((r) =>
    safeFeatures.map((col, fIdx) => {
      const raw = r[col];
      const n = Number(raw);
      const imputed = raw !== null && raw !== undefined && raw !== '' && Number.isFinite(n) ? n : medians[fIdx];
      return (imputed - means[fIdx]) / stds[fIdx];
    })
  );

  const rng = createRng(seed);
  const sampleSize = Math.min(256, X.length);
  const heightLimit = Math.ceil(Math.log2(Math.max(sampleSize, 2)));
  const cPsi = Math.max(averagePathLength(sampleSize), 1e-6);

  const trees: IsoNode[] = [];
  const allIndices = Array.from({ length: X.length }, (_, i) => i);

  for (let t = 0; t < nEstimators; t++) {
    // Subsample without replacement
    const pool = [...allIndices];
    const sub: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      const j = i + Math.floor(rng() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      sub.push(pool[i]);
    }
    trees.push(buildIsoTree(X, sub, 0, heightLimit, rng));
  }

  // Raw anomaly score s(x, psi) = 2^(-E[h(x)] / c(psi)) -> higher means more anomalous
  const rawScores = X.map((x) => {
    let sumLen = 0;
    for (const tree of trees) {
      sumLen += pathLength(tree, x, 0);
    }
    const avgLen = sumLen / trees.length;
    return Number(Math.pow(2, -avgLen / cPsi).toFixed(5));
  });

  // Apply contamination quantile threshold
  const clampedCont = Math.min(0.49, Math.max(0.01, contamination));
  const sortedScores = [...rawScores].sort((a, b) => a - b);
  const threshIdx = Math.max(0, Math.min(sortedScores.length - 1, Math.floor((1 - clampedCont) * sortedScores.length)));
  const threshold = sortedScores[threshIdx];

  const minRaw = sortedScores[0];
  const maxRaw = sortedScores[sortedScores.length - 1];
  const denom = maxRaw - minRaw > 1e-9 ? maxRaw - minRaw : 1;

  const anomalyScores = rawScores.map((s) => Number((((s - minRaw) / denom) * 100).toFixed(2)));
  const anomalyStatuses: ('ANOMALY' | 'NORMAL')[] = rawScores.map((s) =>
    s >= threshold ? 'ANOMALY' : 'NORMAL'
  );

  const anomalyCount = anomalyStatuses.filter((s) => s === 'ANOMALY').length;
  const meanScore = anomalyScores.reduce((a, b) => a + b, 0) / Math.max(anomalyScores.length, 1);

  const artifact: IsolationForestArtifact = {
    modelType: 'IsolationForest',
    trainedAt: new Date().toISOString(),
    datasetName,
    isSyntheticDemo,
    features: safeFeatures,
    hyperparameters: {
      contamination: clampedCont,
      nEstimators,
      sampleSize,
      seed,
    },
    summary: {
      totalRecords: rows.length,
      anomalyCount,
      normalCount: rows.length - anomalyCount,
      anomalyRatePct: Number(((anomalyCount / Math.max(rows.length, 1)) * 100).toFixed(2)),
      meanAnomalyScore: Number(meanScore.toFixed(2)),
      thresholdRawScore: threshold,
    },
  };

  return { artifact, anomalyStatuses, anomalyScores, rawScores };
}
