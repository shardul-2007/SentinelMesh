import { cleanAndEnrichRows, computeBaselines } from './csvProcessor';
import { runIsolationForest } from './isolationForest';
import { predictRandomForest } from './randomForest';
import {
  AlertInvestigationStatus,
  ColumnMapping,
  CorrelatedIncidentItem,
  FeatureBaseline,
  FeatureDeviation,
  HybridAnalysisOutput,
  HybridDetectionRecord,
  IncidentInvestigationStatus,
  IsolationForestArtifact,
  RandomForestArtifact,
  SecurityAlertItem,
  SeverityLevel,
} from './types';

const BENIGN_TOKENS = new Set(['benign', 'normal', '0', '0.0', 'false', 'clean', 'safe', 'legitimate']);

const SENSITIVE_PORTS: Record<number, string> = {
  23: 'Telnet',
  135: 'MSRPC',
  139: 'NetBIOS',
  445: 'SMB',
  1433: 'MSSQL',
  3389: 'RDP',
  4444: 'Reverse Shell / Metasploit Default',
  5900: 'VNC',
  6379: 'Redis',
  8443: 'Alt-HTTPS / C2 Common',
};

export const SEVERITY_RANK: Record<SeverityLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export const SYSTEM_LIMITATIONS: string[] = [
  'Batch CSV analysis only: Analyzes uploaded or synthetic demonstration CSV flow records; live NIC packet capture (PCAP sniffing) is not implemented in this MVP.',
  'Unsupervised anomaly detection (Isolation Forest) identifies statistical deviations from the dataset baseline, which may include benign operational spikes rather than confirmed attacks.',
  'Supervised classification (Random Forest) requires a labeled dataset and only classifies categories observed during training; tree vote proportions are not calibrated probabilities.',
  'Incident correlation uses transparent rule-based host/protocol aggregation, not a graph neural network or distributed enterprise SIEM.',
  'Independent AI/ML cybersecurity prototype (not an officially integrated PRASUNEX product or School ERP); performs no destructive network blocking.',
];

export function isBenignLabel(label: string | null | undefined): boolean {
  if (!label) return true;
  return BENIGN_TOKENS.has(String(label).trim().toLowerCase());
}

function evaluateHeuristics(
  row: Record<string, any>,
  baselines: Record<string, FeatureBaseline>,
  mapping: ColumnMapping
): string[] {
  const flags: string[] = [];

  // 1. Sensitive destination port
  if (mapping.dst_port && row[mapping.dst_port] !== null && row[mapping.dst_port] !== undefined) {
    const port = Math.trunc(Number(row[mapping.dst_port]));
    if (SENSITIVE_PORTS[port]) {
      flags.push(`Sensitive destination port ${port} (${SENSITIVE_PORTS[port]})`);
    }
  }

  // 2. High failed connection count
  for (const col of ['failed_conn_count', 'failed_connections', 'auth_failures']) {
    if (col in row && Number(row[col]) >= 15) {
      flags.push(`High failed connection count (${Math.trunc(Number(row[col]))})`);
    }
  }

  // 3. SYN flood volume
  if ('syn_flag_count' in row && baselines.syn_flag_count) {
    const synVal = Number(row.syn_flag_count);
    if (synVal >= Math.max(50, baselines.syn_flag_count.p95) && synVal > 10) {
      flags.push(`Elevated SYN flag volume (${Math.trunc(synVal)})`);
    }
  }

  // 4. Rate spikes (> 2.5 sigma & >= p95)
  const rateChecks: [string, string][] = [
    ['packet_rate', 'Unusually high packet rate'],
    ['byte_rate', 'Unexpected traffic byte rate'],
    ['bytes_sent', 'Large outbound byte volume'],
  ];
  for (const [col, desc] of rateChecks) {
    if (col in row && baselines[col]) {
      const val = Number(row[col]);
      const st = baselines[col];
      const z = (val - st.mean) / st.std;
      if (z >= 2.5 && val >= st.p95) {
        flags.push(`${desc} (${val.toLocaleString(undefined, { maximumFractionDigits: 1 })}, +${z.toFixed(1)}σ)`);
      }
    }
  }

  // 5. Outbound asymmetry ratio
  if ('bytes_asymmetry_ratio' in row && Number(row.bytes_asymmetry_ratio) >= 25) {
    flags.push(`Highly asymmetric outbound ratio (${Number(row.bytes_asymmetry_ratio).toFixed(1)}x sent vs recv)`);
  }

  return flags;
}

function getTopDeviations(
  row: Record<string, any>,
  baselines: Record<string, FeatureBaseline>,
  features: string[],
  topN = 6
): FeatureDeviation[] {
  const list: FeatureDeviation[] = [];
  for (const col of features) {
    const st = baselines[col];
    if (!st) continue;
    const raw = row[col];
    if (raw === null || raw === undefined || raw === '') continue;
    const val = Number(raw);
    if (!Number.isFinite(val)) continue;
    const z = (val - st.mean) / st.std;
    list.push({
      feature: col,
      value: Number(val.toFixed(2)),
      datasetMedian: Number(st.median.toFixed(2)),
      datasetMean: Number(st.mean.toFixed(2)),
      p95: Number(st.p95.toFixed(2)),
      zScore: Number(z.toFixed(2)),
      absZ: Math.abs(z),
    });
  }
  list.sort((a, b) => b.absZ - a.absZ);
  return list.slice(0, topN);
}

function computeSeverity(
  isSupThreat: boolean,
  anomalyStatus: 'ANOMALY' | 'NORMAL',
  anomalyScore: number,
  heuristicCount: number
): SeverityLevel {
  const isAnom = anomalyStatus === 'ANOMALY';
  if (isSupThreat && (isAnom || heuristicCount >= 2)) return 'CRITICAL';
  if (isAnom && anomalyScore >= 85 && heuristicCount >= 2) return 'CRITICAL';
  if (isSupThreat) return 'HIGH';
  if (isAnom && (heuristicCount >= 1 || anomalyScore >= 75)) return 'HIGH';
  if (isAnom || heuristicCount >= 1) return 'MEDIUM';
  return 'LOW';
}

function recommendAction(
  severity: SeverityLevel,
  predCat: string,
  anomalyStatus: 'ANOMALY' | 'NORMAL',
  flags: string[]
): string {
  if (severity === 'LOW') return 'No immediate action required; continue baseline monitoring.';
  const cat = predCat.toLowerCase();
  const fStr = flags.join(' ').toLowerCase();
  if (cat.includes('ddos') || cat.includes('flood') || fStr.includes('syn')) {
    return 'Verify traffic surge against expected portal load; inspect upstream rate-limiting and firewall SYN logs.';
  }
  if (cat.includes('scan') || cat.includes('probe')) {
    return 'Inspect source host for unauthorized port enumeration and review exposed institutional service ports.';
  }
  if (cat.includes('brute') || fStr.includes('failed connection')) {
    return 'Audit authentication logs on target service (SSH/RDP/ERP DB) for repeated login failures and account lockouts.';
  }
  if (cat.includes('exfil') || fStr.includes('asymmetric') || fStr.includes('outbound')) {
    return 'Investigate outbound transfer destination and verify data export authorization with host owner / DLP logs.';
  }
  if (anomalyStatus === 'ANOMALY') {
    return 'Compare deviated flow metrics against host baseline to separate benign operational spikes from suspicious activity.';
  }
  return 'Correlate host activity with adjacent network logs and validate against authorized services.';
}

export function runHybridDetectionEngine(params: {
  rows: Record<string, any>[];
  selectedFeatures: string[];
  columnMapping: ColumnMapping;
  classifierArtifact: RandomForestArtifact | null;
  contamination?: number;
  nEstimatorsIso?: number;
  dropDuplicates?: boolean;
  datasetName: string;
  isSyntheticDemo: boolean;
}): HybridAnalysisOutput {
  const {
    rows,
    selectedFeatures,
    columnMapping,
    classifierArtifact,
    contamination = 0.2,
    nEstimatorsIso = 80,
    dropDuplicates = false,
    datasetName,
    isSyntheticDemo,
  } = params;

  const { cleanedRows, activeFeatures: rawActive, cleaningReport } = cleanAndEnrichRows(
    rows,
    selectedFeatures,
    dropDuplicates
  );

  const activeFeatures = rawActive.filter((f) => f !== columnMapping.label);
  const baselines = computeBaselines(cleanedRows, activeFeatures);

  // 1. Isolation Forest
  const isoOut = runIsolationForest({
    rows: cleanedRows,
    featureColumns: activeFeatures,
    labelColumn: columnMapping.label,
    contamination,
    nEstimators: nEstimatorsIso,
    datasetName,
    isSyntheticDemo,
  });

  // 2. Random Forest (only when trained & feature-compatible)
  let usedSupervised = false;
  let supervisedSkipReason: string | null = null;
  let rfPreds: string[] | null = null;
  let rfVotes: number[] | null = null;

  if (classifierArtifact) {
    try {
      const out = predictRandomForest(cleanedRows, classifierArtifact);
      rfPreds = out.predictions;
      rfVotes = out.voteProportions;
      usedSupervised = true;
    } catch (err: any) {
      supervisedSkipReason = err?.message || 'Loaded Random Forest schema does not match current dataset.';
    }
  } else {
    supervisedSkipReason =
      'No supervised Random Forest model is currently trained. Train one in ML Model Center on a labeled dataset.';
  }

  // 3. Per-record hybrid assembly
  const results: HybridDetectionRecord[] = cleanedRows.map((row, idx) => {
    const recIdCol = columnMapping.record_id || 'record_id';
    const recordId = String(row[recIdCol] ?? `REC-${String(idx + 1).padStart(5, '0')}`);
    const aStatus = isoOut.anomalyStatuses[idx];
    const aScore = isoOut.anomalyScores[idx];
    const rawIso = isoOut.rawScores[idx];

    const predictedCategory = usedSupervised && rfPreds ? rfPreds[idx] : 'N/A (No Supervised Model)';
    const rfVoteProportion = usedSupervised && rfVotes ? rfVotes[idx] : null;
    const isSupThreat = usedSupervised && !isBenignLabel(predictedCategory);

    const heuristicFlags = evaluateHeuristics(row, baselines, columnMapping);
    const topDeviations = getTopDeviations(row, baselines, activeFeatures, 6);
    const severity = computeSeverity(isSupThreat, aStatus, aScore, heuristicFlags.length);

    const methods: string[] = [];
    if (isSupThreat) methods.push('RandomForest');
    if (aStatus === 'ANOMALY') methods.push('IsolationForest');
    if (heuristicFlags.length > 0) methods.push('Heuristics');
    const detectionMethod =
      methods.length > 0
        ? methods.join(' + ')
        : usedSupervised
        ? 'Hybrid (RF + IsoForest)'
        : 'Unsupervised (IsoForest)';

    const isSuspicious = isSupThreat || aStatus === 'ANOMALY' || severity === 'HIGH' || severity === 'CRITICAL' || heuristicFlags.length >= 2;

    const reasons: string[] = [];
    if (isSupThreat) {
      reasons.push(
        `Random Forest classified traffic as '${predictedCategory}' (RF vote share: ${((rfVoteProportion || 0) * 100).toFixed(1)}%)`
      );
    }
    if (aStatus === 'ANOMALY') {
      reasons.push(`Isolation Forest flagged statistical anomaly (score: ${aScore.toFixed(1)}/100)`);
    }
    if (heuristicFlags.length > 0) {
      reasons.push(...heuristicFlags.slice(0, 3));
    }
    const detectionReason =
      reasons.length > 0
        ? `${reasons.join('; ')}.`
        : 'Traffic features align with learned baseline; no suspicious patterns detected.';

    const getField = (col: string | null) =>
      col && row[col] !== null && row[col] !== undefined && row[col] !== '' ? String(row[col]) : 'N/A';

    return {
      rowIndex: idx,
      recordId,
      timestamp: getField(columnMapping.timestamp),
      srcIp: getField(columnMapping.src_ip),
      dstIp: getField(columnMapping.dst_ip),
      srcPort: getField(columnMapping.src_port),
      dstPort: getField(columnMapping.dst_port),
      protocol: getField(columnMapping.protocol),
      predictedCategory,
      rfVoteProportion,
      anomalyStatus: aStatus,
      anomalyScore: aScore,
      rawIsoScore: rawIso,
      heuristicFlags,
      detectionMethod,
      isSuspicious,
      severity,
      detectionReason,
      recommendedAction: recommendAction(severity, predictedCategory, aStatus, heuristicFlags),
      topDeviations,
    };
  });

  const severityCounts: Record<SeverityLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  let suspiciousRecords = 0;
  let anomalyCount = 0;
  let potentialAttackCount = 0;

  for (const r of results) {
    severityCounts[r.severity]++;
    if (r.isSuspicious) suspiciousRecords++;
    if (r.anomalyStatus === 'ANOMALY') anomalyCount++;
    if (usedSupervised && !isBenignLabel(r.predictedCategory)) potentialAttackCount++;
  }

  return {
    results,
    cleanedRows,
    cleaningReport,
    baselines,
    isoArtifact: isoOut.artifact,
    usedSupervised,
    supervisedSkipReason,
    activeFeatures,
    summary: {
      totalRecords: results.length,
      normalRecords: results.length - suspiciousRecords,
      suspiciousRecords,
      potentialAttackRecords: usedSupervised ? potentialAttackCount : null,
      anomalyCount,
      highCriticalAlerts: severityCounts.HIGH + severityCounts.CRITICAL,
      severityCounts,
      usedSupervised,
    },
  };
}

export function buildStructuredAlerts(
  output: HybridAnalysisOutput,
  savedTriage: Record<string, { status: AlertInvestigationStatus; note: string }> = {}
): SecurityAlertItem[] {
  const flagged = output.results
    .filter((r) => r.isSuspicious || r.severity !== 'LOW')
    .sort((a, b) => {
      const sDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (sDiff !== 0) return sDiff;
      return b.anomalyScore - a.anomalyScore;
    });

  const previewFeats = output.activeFeatures.slice(0, 4);

  return flagged.map((r, idx) => {
    const alertId = `ALT-${String(idx + 1).padStart(4, '0')}`;
    const raw = output.cleanedRows[r.rowIndex] || {};
    const featParts = previewFeats
      .filter((f) => raw[f] !== null && raw[f] !== undefined)
      .map((f) => `${f}=${Number(raw[f]).toLocaleString(undefined, { maximumFractionDigits: 1 })}`);

    const detCat =
      r.predictedCategory === 'N/A (No Supervised Model)'
        ? r.anomalyStatus === 'ANOMALY'
          ? 'Statistical Anomaly'
          : 'Heuristic Alert'
        : r.predictedCategory;

    const triage = savedTriage[alertId];
    return {
      alertId,
      recordId: r.recordId,
      rowIndex: r.rowIndex,
      timestamp: r.timestamp,
      srcIp: r.srcIp,
      dstIp: r.dstIp,
      srcPort: r.srcPort,
      dstPort: r.dstPort,
      protocol: r.protocol,
      detectionCategory: detCat,
      anomalyStatus: r.anomalyStatus,
      anomalyScore: r.anomalyScore,
      severity: r.severity,
      detectionMethod: r.detectionMethod,
      detectionReason: r.detectionReason,
      relevantFeatures: featParts.join(', ') || 'N/A',
      recommendedAction: r.recommendedAction,
      investigationStatus: triage?.status || 'OPEN',
      analystNote: triage?.note || '',
    };
  });
}

export function buildCorrelatedIncidents(
  results: HybridDetectionRecord[],
  savedTriage: Record<string, { status: IncidentInvestigationStatus; note: string }> = {}
): CorrelatedIncidentItem[] {
  const suspicious = results.filter((r) => r.isSuspicious || r.severity !== 'LOW');
  if (!suspicious.length) return [];

  const hasSrc = suspicious.some((r) => r.srcIp !== 'N/A');
  const hasDst = suspicious.some((r) => r.dstIp !== 'N/A');

  const groups = new Map<string, HybridDetectionRecord[]>();
  for (const r of suspicious) {
    const key =
      hasSrc && hasDst
        ? `${r.srcIp} -> ${r.dstIp} (${r.protocol})`
        : hasSrc
        ? `${r.srcIp} [${r.protocol}]`
        : `${r.predictedCategory} [${r.protocol}]`;
    const list = groups.get(key) || [];
    list.push(r);
    groups.set(key, list);
  }

  const rawIncidents: Omit<CorrelatedIncidentItem, 'incidentId' | 'investigationStatus' | 'analystNote'>[] = [];
  groups.forEach((recs, key) => {
    let highest: SeverityLevel = 'LOW';
    const srcs = new Set<string>();
    const dsts = new Set<string>();
    const protos = new Set<string>();
    const cats = new Set<string>();
    const tsList: string[] = [];
    const reasons = new Set<string>();
    let sumAnom = 0;

    for (const r of recs) {
      if (SEVERITY_RANK[r.severity] > SEVERITY_RANK[highest]) highest = r.severity;
      if (r.srcIp !== 'N/A') srcs.add(r.srcIp);
      if (r.dstIp !== 'N/A') dsts.add(r.dstIp);
      if (r.protocol !== 'N/A') protos.add(r.protocol);
      if (r.predictedCategory !== 'N/A (No Supervised Model)') cats.add(r.predictedCategory);
      if (r.timestamp !== 'N/A') tsList.push(r.timestamp);
      if (reasons.size < 2) reasons.add(r.detectionReason);
      sumAnom += r.anomalyScore;
    }

    tsList.sort();
    rawIncidents.push({
      groupingKey: key,
      relatedRecordCount: recs.length,
      sourceHosts: Array.from(srcs).slice(0, 5).join(', ') || 'N/A',
      destinationHosts: Array.from(dsts).slice(0, 5).join(', ') || 'N/A',
      protocols: Array.from(protos).join(', ') || 'N/A',
      predictedCategories: Array.from(cats).join(', ') || 'Unclassified Anomaly',
      highestSeverity: highest,
      avgAnomalyScore: Number((sumAnom / recs.length).toFixed(2)),
      firstSeen: tsList.length ? tsList[0] : 'N/A',
      lastSeen: tsList.length ? tsList[tsList.length - 1] : 'N/A',
      topReasons: Array.from(reasons).join(' | '),
      sampleRecordIds: recs.slice(0, 15).map((r) => r.recordId),
    });
  });

  rawIncidents.sort((a, b) => {
    const sDiff = SEVERITY_RANK[b.highestSeverity] - SEVERITY_RANK[a.highestSeverity];
    if (sDiff !== 0) return sDiff;
    return b.relatedRecordCount - a.relatedRecordCount;
  });

  return rawIncidents.map((inc, idx) => {
    const incidentId = `INC-${String(idx + 1).padStart(4, '0')}`;
    const triage = savedTriage[incidentId];
    return {
      incidentId,
      ...inc,
      investigationStatus: triage?.status || 'OPEN',
      analystNote: triage?.note || '',
    };
  });
}

// ============================================================================
// CSV, JSON & Pure-TypeScript Valid %PDF-1.4 Security Report Exports
// ============================================================================

export function buildCsvString(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join(' | ') : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(','));
  }
  return lines.join('\n');
}

export function buildReportPayload(params: {
  datasetName: string;
  isSyntheticDemo: boolean;
  output: HybridAnalysisOutput;
  alerts: SecurityAlertItem[];
  incidents: CorrelatedIncidentItem[];
  rfArtifact: RandomForestArtifact | null;
}) {
  const { datasetName, isSyntheticDemo, output, alerts, incidents, rfArtifact } = params;
  const triageCounts: Record<string, number> = {};
  for (const a of alerts) {
    triageCounts[a.investigationStatus] = (triageCounts[a.investigationStatus] || 0) + 1;
  }
  return {
    reportTitle: 'SENTINELMESH Cybersecurity Threat Analysis Report',
    competition: 'PRASUNEX INNOVATHON 2026 — Round 3 (AI/ML Track)',
    generatedAtUtc: new Date().toISOString(),
    dataset: {
      filename: datasetName,
      isSyntheticDemo,
      dataSourceNotice: isSyntheticDemo
        ? 'SYNTHETIC DEMONSTRATION DATA (locally generated, not real production traffic)'
        : 'User-uploaded CSV network traffic dataset',
      totalRecordsAnalyzed: output.summary.totalRecords,
    },
    detectionSummary: output.summary,
    alertTriageSummary: triageCounts,
    models: {
      supervisedRandomForest: rfArtifact
        ? {
            trainedAt: rfArtifact.trainedAt,
            datasetName: rfArtifact.datasetName,
            testAccuracy: rfArtifact.metrics.accuracy,
            testF1Macro: rfArtifact.metrics.f1Macro,
            testF1Weighted: rfArtifact.metrics.f1Weighted,
            testSamples: rfArtifact.metrics.testSamples,
            featuresCount: rfArtifact.features.length,
          }
        : null,
      unsupervisedIsolationForest: output.isoArtifact,
    },
    correlatedIncidents: incidents.slice(0, 25),
    topAlerts: alerts.slice(0, 50),
    limitations: SYSTEM_LIMITATIONS,
  };
}

/**
 * Generate a lightweight, standards-compliant %PDF-1.4 binary Uint8Array
 * completely natively in TypeScript (zero external npm packages needed).
 */
export function generateSimplePdfBytes(payload: ReturnType<typeof buildReportPayload>): Uint8Array {
  const sanitize = (s: string) =>
    s
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const wrap = (text: string, maxLen = 88): string[] => {
    const words = text.split(/\s+/);
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxLen) {
        if (cur) out.push(cur);
        cur = w;
      } else {
        cur = (cur + ' ' + w).trim();
      }
    }
    if (cur) out.push(cur);
    return out;
  };

  const lines: string[] = [
    'SENTINELMESH - CYBERSECURITY THREAT ANALYSIS REPORT',
    'PRASUNEX INNOVATHON 2026 | Round 3 - AI/ML Track',
    `Generated: ${payload.generatedAtUtc}`,
    '----------------------------------------------------------------------------------------',
    '1. DATASET & DETECTION SUMMARY',
    `Dataset: ${payload.dataset.filename}`,
    `Source Classification: ${payload.dataset.dataSourceNotice}`,
    `Total Records: ${payload.detectionSummary.totalRecords} | Normal: ${payload.detectionSummary.normalRecords} | Suspicious: ${payload.detectionSummary.suspiciousRecords}`,
    `Potential Attacks (RF): ${payload.detectionSummary.potentialAttackRecords ?? 'N/A'} | Isolation Forest Anomalies: ${payload.detectionSummary.anomalyCount}`,
    `Severity -> CRITICAL: ${payload.detectionSummary.severityCounts.CRITICAL} | HIGH: ${payload.detectionSummary.severityCounts.HIGH} | MEDIUM: ${payload.detectionSummary.severityCounts.MEDIUM} | LOW: ${payload.detectionSummary.severityCounts.LOW}`,
    '',
    '2. MACHINE LEARNING MODELS',
    payload.models.supervisedRandomForest
      ? `RandomForestClassifier -> Test Acc: ${(payload.models.supervisedRandomForest.testAccuracy * 100).toFixed(2)}% | Macro F1: ${payload.models.supervisedRandomForest.testF1Macro} | Weighted F1: ${payload.models.supervisedRandomForest.testF1Weighted}`
      : 'RandomForestClassifier -> Not active for this analysis.',
    `IsolationForest -> Contamination: ${payload.models.unsupervisedIsolationForest.hyperparameters.contamination} | Flagged: ${payload.models.unsupervisedIsolationForest.summary.anomalyCount}/${payload.models.unsupervisedIsolationForest.summary.totalRecords}`,
    '',
    `3. CORRELATED INCIDENTS (${payload.correlatedIncidents.length} total)`,
  ];

  payload.correlatedIncidents.slice(0, 6).forEach((inc) => {
    lines.push(
      ...wrap(
        `[${inc.incidentId} | ${inc.investigationStatus}] ${inc.highestSeverity} | ${inc.groupingKey} | Flows: ${inc.relatedRecordCount} | Categories: ${inc.predictedCategories}`
      )
    );
  });

  lines.push('', `4. TOP SECURITY ALERTS (showing up to 8 of ${payload.topAlerts.length})`);
  payload.topAlerts.slice(0, 8).forEach((a) => {
    lines.push(
      ...wrap(
        `- ${a.alertId} [${a.severity} | ${a.investigationStatus}] ${a.srcIp} -> ${a.dstIp}:${a.dstPort} (${a.protocol}) | ${a.detectionCategory} | Anomaly: ${a.anomalyScore}/100`
      )
    );
  });

  lines.push('', '5. HONEST SCOPE & LIMITATIONS DISCLOSURE');
  payload.limitations.forEach((lim) => {
    lines.push(...wrap(`- ${lim}`));
  });

  // Paginate lines (52 lines per page)
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += 52) {
    pages.push(lines.slice(i, i + 52));
  }

  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Font
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];
  let nextObjNum = 4;

  for (let p = 0; p < pages.length; p++) {
    pageObjNums.push(nextObjNum++);
    contentObjNums.push(nextObjNum++);
  }

  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`
  );
  objects.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`);

  for (let p = 0; p < pages.length; p++) {
    const streamLines = ['BT', '/F1 9 Tf', '42 755 Td', '13 TL'];
    pages[p].forEach((ln, idx) => {
      if (idx === 0) streamLines.push(`(${sanitize(ln)}) Tj`);
      else streamLines.push(`T* (${sanitize(ln)}) Tj`);
    });
    streamLines.push('ET');
    const stream = streamLines.join('\n');

    objects.push(
      `${pageObjNums[p]} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjNums[p]} 0 R >>\nendobj\n`
    );
    objects.push(
      `${contentObjNums[p]} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
