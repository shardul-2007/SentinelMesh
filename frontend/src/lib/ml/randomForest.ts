import { createRng, NON_FEATURE_KEYWORDS } from './csvProcessor';
import { ClassMetricsRow, RandomForestArtifact, RandomForestMetrics } from './types';

interface TreeNode {
  leaf: boolean;
  prediction?: number;
  proba?: number[];
  featureIdx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function giniImpurity(weightsByClass: number[], totalWeight: number): number {
  if (totalWeight <= 0) return 0;
  let sumSq = 0;
  for (let c = 0; c < weightsByClass.length; c++) {
    const p = weightsByClass[c] / totalWeight;
    sumSq += p * p;
  }
  return 1 - sumSq;
}

function buildDecisionTree(
  X: number[][],
  y: number[],
  sampleIndices: number[],
  numClasses: number,
  classWeights: number[],
  maxDepth: number,
  minSamplesSplit: number,
  maxFeatures: number,
  rng: () => number,
  featureGainAccum: number[],
  depth = 0
): TreeNode {
  const counts = new Array(numClasses).fill(0);
  let totalW = 0;
  for (const idx of sampleIndices) {
    const cls = y[idx];
    counts[cls] += classWeights[cls];
    totalW += classWeights[cls];
  }

  let bestClass = 0;
  let bestCount = -1;
  const proba = new Array(numClasses).fill(0);
  let nonZeroClasses = 0;
  for (let c = 0; c < numClasses; c++) {
    proba[c] = totalW > 0 ? counts[c] / totalW : 0;
    if (counts[c] > 0) nonZeroClasses++;
    if (counts[c] > bestCount) {
      bestCount = counts[c];
      bestClass = c;
    }
  }

  if (depth >= maxDepth || sampleIndices.length < minSamplesSplit || nonZeroClasses <= 1) {
    return { leaf: true, prediction: bestClass, proba };
  }

  const numFeatures = X[0].length;
  const parentGini = giniImpurity(counts, totalW);

  // Random feature subset without replacement (sqrt(p))
  const featPool = Array.from({ length: numFeatures }, (_, i) => i);
  for (let i = featPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [featPool[i], featPool[j]] = [featPool[j], featPool[i]];
  }
  const chosenFeats = featPool.slice(0, Math.min(maxFeatures, numFeatures));

  let bestGain = 1e-7;
  let bestFeat = -1;
  let bestThresh = 0;

  for (const fIdx of chosenFeats) {
    // Collect candidate quantile thresholds for speed & precision
    const vals: number[] = [];
    for (const idx of sampleIndices) {
      vals.push(X[idx][fIdx]);
    }
    vals.sort((a, b) => a - b);
    const minV = vals[0];
    const maxV = vals[vals.length - 1];
    if (maxV - minV < 1e-9) continue;

    // Evaluate up to 12 evenly spaced quantile cutpoints
    const nBins = Math.min(12, vals.length - 1);
    const tested = new Set<number>();
    for (let b = 1; b <= nBins; b++) {
      const pos = Math.floor((b / (nBins + 1)) * vals.length);
      const thresh = vals[pos];
      if (tested.has(thresh)) continue;
      tested.add(thresh);

      const leftW = new Array(numClasses).fill(0);
      const rightW = new Array(numClasses).fill(0);
      let lTot = 0;
      let rTot = 0;

      for (const idx of sampleIndices) {
        const cls = y[idx];
        const w = classWeights[cls];
        if (X[idx][fIdx] <= thresh) {
          leftW[cls] += w;
          lTot += w;
        } else {
          rightW[cls] += w;
          rTot += w;
        }
      }

      if (lTot <= 0 || rTot <= 0) continue;
      const gLeft = giniImpurity(leftW, lTot);
      const gRight = giniImpurity(rightW, rTot);
      const weightedGini = (lTot / totalW) * gLeft + (rTot / totalW) * gRight;
      const gain = parentGini - weightedGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeat = fIdx;
        bestThresh = thresh;
      }
    }
  }

  if (bestFeat === -1) {
    return { leaf: true, prediction: bestClass, proba };
  }

  // Accumulate weighted Gini importance
  featureGainAccum[bestFeat] += bestGain * totalW;

  const leftIndices: number[] = [];
  const rightIndices: number[] = [];
  for (const idx of sampleIndices) {
    if (X[idx][bestFeat] <= bestThresh) leftIndices.push(idx);
    else rightIndices.push(idx);
  }

  if (!leftIndices.length || !rightIndices.length) {
    return { leaf: true, prediction: bestClass, proba };
  }

  return {
    leaf: false,
    featureIdx: bestFeat,
    threshold: bestThresh,
    left: buildDecisionTree(
      X,
      y,
      leftIndices,
      numClasses,
      classWeights,
      maxDepth,
      minSamplesSplit,
      maxFeatures,
      rng,
      featureGainAccum,
      depth + 1
    ),
    right: buildDecisionTree(
      X,
      y,
      rightIndices,
      numClasses,
      classWeights,
      maxDepth,
      minSamplesSplit,
      maxFeatures,
      rng,
      featureGainAccum,
      depth + 1
    ),
  };
}

function predictTreeProba(node: TreeNode, x: number[]): number[] {
  let cur = node;
  while (!cur.leaf) {
    if (x[cur.featureIdx!] <= cur.threshold!) {
      cur = cur.left!;
    } else {
      cur = cur.right!;
    }
  }
  return cur.proba!;
}

/**
 * Train and evaluate a genuine Random Forest Classifier on a stratified
 * held-out train/test split with balanced class weights and zero data leakage.
 */
export function trainRandomForestClassifier(params: {
  rows: Record<string, any>[];
  featureColumns: string[];
  labelColumn: string;
  nEstimators?: number;
  maxDepth?: number;
  testSize?: number;
  seed?: number;
  datasetName: string;
  isSyntheticDemo: boolean;
}): RandomForestArtifact {
  const {
    rows,
    featureColumns,
    labelColumn,
    nEstimators = 35,
    maxDepth = 10,
    testSize = 0.25,
    seed = 42,
    datasetName,
    isSyntheticDemo,
  } = params;

  if (!labelColumn || !rows.length || !(labelColumn in rows[0])) {
    throw new Error(`Target label column '${labelColumn}' not found in dataset.`);
  }

  // Filter rows with valid non-empty labels
  const validRows = rows.filter(
    (r) =>
      r[labelColumn] !== null &&
      r[labelColumn] !== undefined &&
      String(r[labelColumn]).trim() !== '' &&
      String(r[labelColumn]).trim().toLowerCase() !== 'nan'
  );

  if (validRows.length < 12) {
    throw new Error('At least 12 labeled rows are required to train and evaluate a Random Forest classifier.');
  }

  // Strict leakage guard
  const safeFeatures = featureColumns.filter((f) => {
    if (f === labelColumn) return false;
    const lower = f.toLowerCase();
    return !NON_FEATURE_KEYWORDS.some((kw) => lower.includes(kw));
  });
  if (!safeFeatures.length) {
    throw new Error('No valid non-label numerical features remain after leakage filtering.');
  }

  const labelStrings = validRows.map((r) => String(r[labelColumn]).trim());
  const classCounts: Record<string, number> = {};
  for (const lbl of labelStrings) {
    classCounts[lbl] = (classCounts[lbl] || 0) + 1;
  }
  const classes = Object.keys(classCounts).sort();
  if (classes.length < 2) {
    throw new Error(
      `Target column '${labelColumn}' has only ${classes.length} unique class (${classes.join(', ')}). At least 2 classes are required.`
    );
  }

  const warnings: string[] = [];
  const countsArr = Object.values(classCounts);
  const maxC = Math.max(...countsArr);
  const minC = Math.min(...countsArr);
  if (maxC / Math.max(minC, 1) >= 5) {
    warnings.push(
      `Class imbalance detected (${(maxC / Math.max(minC, 1)).toFixed(1)}:1 majority-to-minority ratio). ` +
        `Balanced class weighting is enabled; evaluate Macro F1 alongside Accuracy.`
    );
  }

  const classToIdx: Record<string, number> = {};
  classes.forEach((c, i) => {
    classToIdx[c] = i;
  });

  const rng = createRng(seed);

  // Stratified train/test split by class
  const byClass: Record<number, number[]> = {};
  labelStrings.forEach((lbl, idx) => {
    const cIdx = classToIdx[lbl];
    if (!byClass[cIdx]) byClass[cIdx] = [];
    byClass[cIdx].push(idx);
  });

  const trainIdx: number[] = [];
  const testIdx: number[] = [];
  for (const cIdx of Object.keys(byClass).map(Number)) {
    const idxs = [...byClass[cIdx]];
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    const nTest = idxs.length >= 2 ? Math.max(1, Math.round(idxs.length * testSize)) : 0;
    for (let i = 0; i < idxs.length; i++) {
      if (i < nTest) testIdx.push(idxs[i]);
      else trainIdx.push(idxs[i]);
    }
  }

  // Fit median imputer strictly on training rows to avoid test leakage
  const medians: Record<string, number> = {};
  for (const col of safeFeatures) {
    const vals: number[] = [];
    for (const idx of trainIdx) {
      const v = Number(validRows[idx][col]);
      if (validRows[idx][col] !== null && validRows[idx][col] !== undefined && Number.isFinite(v)) {
        vals.push(v);
      }
    }
    vals.sort((a, b) => a - b);
    medians[col] = vals.length ? vals[Math.floor(vals.length / 2)] : 0;
  }

  const extractMatrix = (indices: number[]): number[][] =>
    indices.map((idx) =>
      safeFeatures.map((col) => {
        const raw = validRows[idx][col];
        const v = Number(raw);
        return raw !== null && raw !== undefined && raw !== '' && Number.isFinite(v) ? v : medians[col];
      })
    );

  const XTrain = extractMatrix(trainIdx);
  const yTrain = trainIdx.map((idx) => classToIdx[labelStrings[idx]]);
  const XTest = extractMatrix(testIdx);
  const yTest = testIdx.map((idx) => classToIdx[labelStrings[idx]]);

  // Balanced class weights: n_samples / (n_classes * count_c)
  const trainClassCounts = new Array(classes.length).fill(0);
  for (const c of yTrain) trainClassCounts[c]++;
  const classWeights = trainClassCounts.map((cnt) =>
    cnt > 0 ? yTrain.length / (classes.length * cnt) : 1.0
  );

  const maxFeatures = Math.max(1, Math.round(Math.sqrt(safeFeatures.length)));
  const featureGainAccum = new Array(safeFeatures.length).fill(0);
  const trees: TreeNode[] = [];

  for (let t = 0; t < nEstimators; t++) {
    // Bootstrap sample
    const bootIdx: number[] = [];
    for (let i = 0; i < XTrain.length; i++) {
      bootIdx.push(Math.floor(rng() * XTrain.length));
    }
    trees.push(
      buildDecisionTree(
        XTrain,
        yTrain,
        bootIdx,
        classes.length,
        classWeights,
        maxDepth,
        4,
        maxFeatures,
        rng,
        featureGainAccum
      )
    );
  }

  // Evaluate on held-out test set
  const yPred: number[] = XTest.map((x) => {
    const avgProba = new Array(classes.length).fill(0);
    for (const tree of trees) {
      const p = predictTreeProba(tree, x);
      for (let c = 0; c < classes.length; c++) avgProba[c] += p[c] / trees.length;
    }
    let bestC = 0;
    for (let c = 1; c < classes.length; c++) {
      if (avgProba[c] > avgProba[bestC]) bestC = c;
    }
    return bestC;
  });

  const confusionMatrix: number[][] = Array.from({ length: classes.length }, () =>
    new Array(classes.length).fill(0)
  );
  let correct = 0;
  for (let i = 0; i < yTest.length; i++) {
    confusionMatrix[yTest[i]][yPred[i]]++;
    if (yTest[i] === yPred[i]) correct++;
  }

  const accuracy = yTest.length > 0 ? correct / yTest.length : 0;

  const classificationReport: ClassMetricsRow[] = [];
  let sumP = 0;
  let sumR = 0;
  let sumF1 = 0;
  let wP = 0;
  let wR = 0;
  let wF1 = 0;

  for (let c = 0; c < classes.length; c++) {
    const tp = confusionMatrix[c][c];
    let fp = 0;
    let fn = 0;
    let support = 0;
    for (let j = 0; j < classes.length; j++) {
      support += confusionMatrix[c][j];
      if (j !== c) {
        fn += confusionMatrix[c][j];
        fp += confusionMatrix[j][c];
      }
    }
    const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
    const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

    classificationReport.push({
      className: classes[c],
      precision: Number(prec.toFixed(4)),
      recall: Number(rec.toFixed(4)),
      f1Score: Number(f1.toFixed(4)),
      support,
    });

    sumP += prec;
    sumR += rec;
    sumF1 += f1;
    wP += prec * support;
    wR += rec * support;
    wF1 += f1 * support;
  }

  const nC = classes.length;
  const nTest = Math.max(yTest.length, 1);

  const metrics: RandomForestMetrics = {
    accuracy: Number(accuracy.toFixed(4)),
    precisionMacro: Number((sumP / nC).toFixed(4)),
    recallMacro: Number((sumR / nC).toFixed(4)),
    f1Macro: Number((sumF1 / nC).toFixed(4)),
    precisionWeighted: Number((wP / nTest).toFixed(4)),
    recallWeighted: Number((wR / nTest).toFixed(4)),
    f1Weighted: Number((wF1 / nTest).toFixed(4)),
    classes,
    confusionMatrix,
    classificationReport,
    trainSamples: XTrain.length,
    testSamples: XTest.length,
    totalSamples: validRows.length,
    classDistribution: classCounts,
  };

  // Normalize feature importances
  const totalGain = featureGainAccum.reduce((a, b) => a + b, 0) || 1;
  const featureImportances = safeFeatures
    .map((f, idx) => ({
      feature: f,
      importance: Number((featureGainAccum[idx] / totalGain).toFixed(5)),
    }))
    .sort((a, b) => b.importance - a.importance);

  return {
    modelType: 'RandomForestClassifier',
    trainedAt: new Date().toISOString(),
    datasetName,
    isSyntheticDemo,
    labelColumn,
    features: safeFeatures,
    classes,
    metrics,
    featureImportances,
    warnings,
    hyperparameters: {
      nEstimators,
      maxDepth,
      testSize,
      classWeight: 'balanced',
      seed,
    },
    trees,
    medians,
  };
}

export function predictRandomForest(
  rows: Record<string, any>[],
  artifact: RandomForestArtifact
): { predictions: string[]; voteProportions: number[] } {
  const missing = artifact.features.filter((f) => rows.length > 0 && !(f in rows[0]));
  if (missing.length > 0) {
    throw new Error(`Dataset is missing required feature columns for loaded Random Forest: ${missing.join(', ')}`);
  }

  const predictions: string[] = [];
  const voteProportions: number[] = [];

  for (const row of rows) {
    const x = artifact.features.map((col) => {
      const raw = row[col];
      const v = Number(raw);
      return raw !== null && raw !== undefined && raw !== '' && Number.isFinite(v)
        ? v
        : artifact.medians[col] ?? 0;
    });

    const avgProba = new Array(artifact.classes.length).fill(0);
    for (const tree of artifact.trees as TreeNode[]) {
      const p = predictTreeProba(tree, x);
      for (let c = 0; c < artifact.classes.length; c++) {
        avgProba[c] += p[c] / artifact.trees.length;
      }
    }

    let bestC = 0;
    for (let c = 1; c < avgProba.length; c++) {
      if (avgProba[c] > avgProba[bestC]) bestC = c;
    }

    predictions.push(artifact.classes[bestC]);
    voteProportions.push(Number(avgProba[bestC].toFixed(4)));
  }

  return { predictions, voteProportions };
}
