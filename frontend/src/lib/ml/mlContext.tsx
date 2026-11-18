'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  cleanAndEnrichRows,
  generateSyntheticDemoRows,
  inspectRows,
  parseCsvText,
} from './csvProcessor';
import {
  buildCorrelatedIncidents,
  buildStructuredAlerts,
  runHybridDetectionEngine,
} from './hybridEngine';
import { runIsolationForest } from './isolationForest';
import { trainRandomForestClassifier } from './randomForest';
import {
  AlertInvestigationStatus,
  ColumnMapping,
  CorrelatedIncidentItem,
  DatasetMetadata,
  HybridAnalysisOutput,
  IncidentInvestigationStatus,
  IsolationForestArtifact,
  RandomForestArtifact,
  SecurityAlertItem,
} from './types';

interface MLContextValue {
  rawRows: Record<string, any>[] | null;
  metadata: DatasetMetadata | null;
  columnMapping: ColumnMapping | null;
  selectedFeatures: string[];
  rfArtifact: RandomForestArtifact | null;
  isoArtifact: IsolationForestArtifact | null;
  analysisOutput: HybridAnalysisOutput | null;
  alerts: SecurityAlertItem[];
  incidents: CorrelatedIncidentItem[];
  selectedRecordId: string | null;
  isBusy: boolean;
  lastError: string | null;

  setColumnMapping: (m: ColumnMapping) => void;
  setSelectedFeatures: (f: string[]) => void;
  setSelectedRecordId: (id: string | null) => void;
  uploadCsv: (csvText: string, filename: string) => void;
  loadSyntheticDemo: () => void;
  runCompleteDemoWorkflow: () => void;
  trainRandomForest: (opts: {
    labelColumn: string;
    nEstimators: number;
    maxDepth: number;
    testSize: number;
  }) => RandomForestArtifact;
  clearRandomForest: () => void;
  runIsoOnly: (opts: { contamination: number; nEstimators: number }) => IsolationForestArtifact;
  runHybridAnalysis: (opts: {
    contamination: number;
    dropDuplicates: boolean;
    autoTrainRf: boolean;
  }) => HybridAnalysisOutput;
  updateAlertTriage: (alertId: string, status: AlertInvestigationStatus, note: string) => void;
  updateIncidentTriage: (incidentId: string, status: IncidentInvestigationStatus, note: string) => void;
}

const MLContext = createContext<MLContextValue | undefined>(undefined);

const ALERT_STORAGE_KEY = 'sentinelmesh_ml_alert_triage_v1';
const INCIDENT_STORAGE_KEY = 'sentinelmesh_ml_incident_triage_v1';

function readStorage<T>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage<T>(key: string, data: Record<string, T>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

export function MLNetworkProvider({ children }: { children: React.ReactNode }) {
  const [rawRows, setRawRows] = useState<Record<string, any>[] | null>(null);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [rfArtifact, setRfArtifact] = useState<RandomForestArtifact | null>(null);
  const [isoArtifact, setIsoArtifact] = useState<IsolationForestArtifact | null>(null);
  const [analysisOutput, setAnalysisOutput] = useState<HybridAnalysisOutput | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>([]);
  const [incidents, setIncidents] = useState<CorrelatedIncidentItem[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const [alertTriageStore, setAlertTriageStore] = useState<
    Record<string, { status: AlertInvestigationStatus; note: string }>
  >({});
  const [incidentTriageStore, setIncidentTriageStore] = useState<
    Record<string, { status: IncidentInvestigationStatus; note: string }>
  >({});

  useEffect(() => {
    setAlertTriageStore(readStorage(ALERT_STORAGE_KEY));
    setIncidentTriageStore(readStorage(INCIDENT_STORAGE_KEY));
  }, []);

  const uploadCsv = useCallback((csvText: string, filename: string) => {
    setLastError(null);
    try {
      const { rows, metadata: meta } = parseCsvText(csvText, filename);
      setRawRows(rows);
      setMetadata(meta);
      setColumnMapping(meta.suggestedMapping);
      setSelectedFeatures(meta.candidateMlFeatures);
      setAnalysisOutput(null);
      setAlerts([]);
      setIncidents([]);
      setSelectedRecordId(null);
    } catch (err: any) {
      setLastError(err?.message || 'Failed to parse CSV file.');
      throw err;
    }
  }, []);

  const loadSyntheticDemo = useCallback(() => {
    setLastError(null);
    const rows = generateSyntheticDemoRows(1200, 42);
    const meta = inspectRows(rows, 'synthetic_network_traffic.csv (SYNTHETIC DEMO)');
    meta.isSyntheticDemo = true;
    setRawRows(rows);
    setMetadata(meta);
    setColumnMapping(meta.suggestedMapping);
    setSelectedFeatures(meta.candidateMlFeatures);
    setAnalysisOutput(null);
    setAlerts([]);
    setIncidents([]);
    setSelectedRecordId(null);
  }, []);

  const runCompleteDemoWorkflow = useCallback(() => {
    setIsBusy(true);
    setLastError(null);
    try {
      const rows = generateSyntheticDemoRows(1200, 42);
      const meta = inspectRows(rows, 'synthetic_network_traffic.csv (SYNTHETIC DEMO)');
      meta.isSyntheticDemo = true;
      const mapping = meta.suggestedMapping;
      const feats = meta.candidateMlFeatures;

      const { cleanedRows, activeFeatures } = cleanAndEnrichRows(rows, feats, false);
      const trainedRf = trainRandomForestClassifier({
        rows: cleanedRows,
        featureColumns: activeFeatures,
        labelColumn: mapping.label || 'label',
        nEstimators: 35,
        maxDepth: 10,
        testSize: 0.25,
        seed: 42,
        datasetName: meta.filename,
        isSyntheticDemo: true,
      });

      const hybrid = runHybridDetectionEngine({
        rows,
        selectedFeatures: feats,
        columnMapping: mapping,
        classifierArtifact: trainedRf,
        contamination: 0.22,
        nEstimatorsIso: 80,
        dropDuplicates: false,
        datasetName: meta.filename,
        isSyntheticDemo: true,
      });

      const savedA = readStorage<{ status: AlertInvestigationStatus; note: string }>(ALERT_STORAGE_KEY);
      const savedI = readStorage<{ status: IncidentInvestigationStatus; note: string }>(INCIDENT_STORAGE_KEY);
      const builtAlerts = buildStructuredAlerts(hybrid, savedA);
      const builtIncidents = buildCorrelatedIncidents(hybrid.results, savedI);

      setRawRows(rows);
      setMetadata(meta);
      setColumnMapping(mapping);
      setSelectedFeatures(feats);
      setRfArtifact(trainedRf);
      setIsoArtifact(hybrid.isoArtifact);
      setAnalysisOutput(hybrid);
      setAlerts(builtAlerts);
      setIncidents(builtIncidents);
      setSelectedRecordId(builtAlerts[0]?.recordId || null);
    } catch (err: any) {
      setLastError(err?.message || 'Demo workflow failed.');
    } finally {
      setIsBusy(false);
    }
  }, []);

  const trainRandomForest = useCallback(
    (opts: { labelColumn: string; nEstimators: number; maxDepth: number; testSize: number }) => {
      if (!rawRows || !metadata) {
        throw new Error('Load a dataset before training a Random Forest classifier.');
      }
      setLastError(null);
      const { cleanedRows, activeFeatures } = cleanAndEnrichRows(rawRows, selectedFeatures, false);
      const trained = trainRandomForestClassifier({
        rows: cleanedRows,
        featureColumns: activeFeatures,
        labelColumn: opts.labelColumn,
        nEstimators: opts.nEstimators,
        maxDepth: opts.maxDepth,
        testSize: opts.testSize,
        seed: 42,
        datasetName: metadata.filename,
        isSyntheticDemo: metadata.isSyntheticDemo,
      });
      setRfArtifact(trained);
      if (columnMapping) {
        setColumnMapping({ ...columnMapping, label: opts.labelColumn });
      }
      return trained;
    },
    [rawRows, metadata, selectedFeatures, columnMapping]
  );

  const clearRandomForest = useCallback(() => {
    setRfArtifact(null);
  }, []);

  const runIsoOnly = useCallback(
    (opts: { contamination: number; nEstimators: number }) => {
      if (!rawRows || !metadata) {
        throw new Error('Load a dataset before running Isolation Forest.');
      }
      const { cleanedRows, activeFeatures } = cleanAndEnrichRows(rawRows, selectedFeatures, false);
      const out = runIsolationForest({
        rows: cleanedRows,
        featureColumns: activeFeatures,
        labelColumn: columnMapping?.label,
        contamination: opts.contamination,
        nEstimators: opts.nEstimators,
        datasetName: metadata.filename,
        isSyntheticDemo: metadata.isSyntheticDemo,
      });
      setIsoArtifact(out.artifact);
      return out.artifact;
    },
    [rawRows, metadata, selectedFeatures, columnMapping]
  );

  const runHybridAnalysis = useCallback(
    (opts: { contamination: number; dropDuplicates: boolean; autoTrainRf: boolean }) => {
      if (!rawRows || !metadata || !columnMapping) {
        throw new Error('Upload a CSV or load synthetic demo data first.');
      }
      setIsBusy(true);
      setLastError(null);
      try {
        let activeRf = rfArtifact;
        if (opts.autoTrainRf && columnMapping.label) {
          try {
            const { cleanedRows, activeFeatures } = cleanAndEnrichRows(
              rawRows,
              selectedFeatures,
              opts.dropDuplicates
            );
            activeRf = trainRandomForestClassifier({
              rows: cleanedRows,
              featureColumns: activeFeatures,
              labelColumn: columnMapping.label,
              nEstimators: 35,
              maxDepth: 10,
              testSize: 0.25,
              seed: 42,
              datasetName: metadata.filename,
              isSyntheticDemo: metadata.isSyntheticDemo,
            });
            setRfArtifact(activeRf);
          } catch {
            activeRf = null;
          }
        }

        const hybrid = runHybridDetectionEngine({
          rows: rawRows,
          selectedFeatures,
          columnMapping,
          classifierArtifact: activeRf,
          contamination: opts.contamination,
          nEstimatorsIso: 80,
          dropDuplicates: opts.dropDuplicates,
          datasetName: metadata.filename,
          isSyntheticDemo: metadata.isSyntheticDemo,
        });

        const builtAlerts = buildStructuredAlerts(hybrid, alertTriageStore);
        const builtIncidents = buildCorrelatedIncidents(hybrid.results, incidentTriageStore);

        setIsoArtifact(hybrid.isoArtifact);
        setAnalysisOutput(hybrid);
        setAlerts(builtAlerts);
        setIncidents(builtIncidents);
        setSelectedRecordId(builtAlerts[0]?.recordId || null);
        return hybrid;
      } catch (err: any) {
        setLastError(err?.message || 'Analysis failed.');
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [rawRows, metadata, columnMapping, selectedFeatures, rfArtifact, alertTriageStore, incidentTriageStore]
  );

  const updateAlertTriage = useCallback(
    (alertId: string, status: AlertInvestigationStatus, note: string) => {
      setAlertTriageStore((prev) => {
        const next = { ...prev, [alertId]: { status, note } };
        writeStorage(ALERT_STORAGE_KEY, next);
        return next;
      });
      setAlerts((prev) =>
        prev.map((a) => (a.alertId === alertId ? { ...a, investigationStatus: status, analystNote: note } : a))
      );
    },
    []
  );

  const updateIncidentTriage = useCallback(
    (incidentId: string, status: IncidentInvestigationStatus, note: string) => {
      setIncidentTriageStore((prev) => {
        const next = { ...prev, [incidentId]: { status, note } };
        writeStorage(INCIDENT_STORAGE_KEY, next);
        return next;
      });
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.incidentId === incidentId ? { ...inc, investigationStatus: status, analystNote: note } : inc
        )
      );
    },
    []
  );

  return (
    <MLContext.Provider
      value={{
        rawRows,
        metadata,
        columnMapping,
        selectedFeatures,
        rfArtifact,
        isoArtifact,
        analysisOutput,
        alerts,
        incidents,
        selectedRecordId,
        isBusy,
        lastError,
        setColumnMapping,
        setSelectedFeatures,
        setSelectedRecordId,
        uploadCsv,
        loadSyntheticDemo,
        runCompleteDemoWorkflow,
        trainRandomForest,
        clearRandomForest,
        runIsoOnly,
        runHybridAnalysis,
        updateAlertTriage,
        updateIncidentTriage,
      }}
    >
      {children}
    </MLContext.Provider>
  );
}

export function useMLNetwork() {
  const ctx = useContext(MLContext);
  if (!ctx) throw new Error('useMLNetwork must be used inside MLNetworkProvider');
  return ctx;
}
