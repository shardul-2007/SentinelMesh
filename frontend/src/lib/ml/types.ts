export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertInvestigationStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'INVESTIGATED'
  | 'FALSE_POSITIVE'
  | 'RESOLVED';

export type IncidentInvestigationStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'CONTAINED'
  | 'CLOSED';

export interface ColumnSummary {
  column: string;
  kind: 'numeric' | 'categorical';
  missingCount: number;
  missingPct: number;
  infiniteCount: number;
  uniqueValues: number;
}

export interface ColumnMapping {
  src_ip: string | null;
  dst_ip: string | null;
  src_port: string | null;
  dst_port: string | null;
  protocol: string | null;
  timestamp: string | null;
  label: string | null;
  record_id: string | null;
}

export interface DatasetMetadata {
  filename: string;
  nRows: number;
  nCols: number;
  numericColumns: string[];
  categoricalColumns: string[];
  totalMissingCells: number;
  duplicateRows: number;
  columnSummary: ColumnSummary[];
  suggestedMapping: ColumnMapping;
  candidateMlFeatures: string[];
  isSyntheticDemo: boolean;
}

export interface FeatureBaseline {
  mean: number;
  std: number;
  median: number;
  p05: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface FeatureDeviation {
  feature: string;
  value: number;
  datasetMedian: number;
  datasetMean: number;
  p95: number;
  zScore: number;
  absZ: number;
}

export interface ClassMetricsRow {
  className: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface RandomForestMetrics {
  accuracy: number;
  precisionWeighted: number;
  recallWeighted: number;
  f1Weighted: number;
  precisionMacro: number;
  recallMacro: number;
  f1Macro: number;
  classes: string[];
  confusionMatrix: number[][];
  classificationReport: ClassMetricsRow[];
  trainSamples: number;
  testSamples: number;
  totalSamples: number;
  classDistribution: Record<string, number>;
}

export interface RandomForestArtifact {
  modelType: 'RandomForestClassifier';
  trainedAt: string;
  datasetName: string;
  isSyntheticDemo: boolean;
  labelColumn: string;
  features: string[];
  classes: string[];
  metrics: RandomForestMetrics;
  featureImportances: { feature: string; importance: number }[];
  warnings: string[];
  hyperparameters: {
    nEstimators: number;
    maxDepth: number;
    testSize: number;
    classWeight: 'balanced';
    seed: number;
  };
  // Internal serialized trees for inference
  trees: any[];
  medians: Record<string, number>;
}

export interface IsolationForestArtifact {
  modelType: 'IsolationForest';
  trainedAt: string;
  datasetName: string;
  isSyntheticDemo: boolean;
  features: string[];
  hyperparameters: {
    contamination: number;
    nEstimators: number;
    sampleSize: number;
    seed: number;
  };
  summary: {
    totalRecords: number;
    anomalyCount: number;
    normalCount: number;
    anomalyRatePct: number;
    meanAnomalyScore: number;
    thresholdRawScore: number;
  };
}

export interface HybridDetectionRecord {
  rowIndex: number;
  recordId: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  srcPort: string;
  dstPort: string;
  protocol: string;
  predictedCategory: string;
  rfVoteProportion: number | null;
  anomalyStatus: 'ANOMALY' | 'NORMAL';
  anomalyScore: number; // 0-100 normalized outlier score (not calibrated probability)
  rawIsoScore: number;
  heuristicFlags: string[];
  detectionMethod: string;
  isSuspicious: boolean;
  severity: SeverityLevel;
  detectionReason: string;
  recommendedAction: string;
  topDeviations: FeatureDeviation[];
}

export interface SecurityAlertItem {
  alertId: string;
  recordId: string;
  rowIndex: number;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  srcPort: string;
  dstPort: string;
  protocol: string;
  detectionCategory: string;
  anomalyStatus: 'ANOMALY' | 'NORMAL';
  anomalyScore: number;
  severity: SeverityLevel;
  detectionMethod: string;
  detectionReason: string;
  relevantFeatures: string;
  recommendedAction: string;
  investigationStatus: AlertInvestigationStatus;
  analystNote: string;
}

export interface CorrelatedIncidentItem {
  incidentId: string;
  groupingKey: string;
  relatedRecordCount: number;
  sourceHosts: string;
  destinationHosts: string;
  protocols: string;
  predictedCategories: string;
  highestSeverity: SeverityLevel;
  avgAnomalyScore: number;
  firstSeen: string;
  lastSeen: string;
  topReasons: string;
  sampleRecordIds: string[];
  investigationStatus: IncidentInvestigationStatus;
  analystNote: string;
}

export interface HybridAnalysisOutput {
  results: HybridDetectionRecord[];
  cleanedRows: Record<string, any>[];
  cleaningReport: {
    initialRows: number;
    finalRows: number;
    infiniteValuesReplaced: number;
    duplicatesRemoved: number;
    remainingMissingCells: number;
  };
  baselines: Record<string, FeatureBaseline>;
  isoArtifact: IsolationForestArtifact;
  usedSupervised: boolean;
  supervisedSkipReason: string | null;
  activeFeatures: string[];
  summary: {
    totalRecords: number;
    normalRecords: number;
    suspiciousRecords: number;
    potentialAttackRecords: number | null;
    anomalyCount: number;
    highCriticalAlerts: number;
    severityCounts: Record<SeverityLevel, number>;
    usedSupervised: boolean;
  };
}
