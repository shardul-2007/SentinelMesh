'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Upload,
  Play,
  ShieldAlert,
  CheckCircle2,
  Database,
  Cpu,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useMLNetwork } from '@/lib/ml/mlContext';
import { ColumnMapping, SeverityLevel } from '@/lib/ml/types';

const SEV_BADGE: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
  HIGH: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/30',
  MEDIUM: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30',
  LOW: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30',
};

export default function NetworkMLPage() {
  const {
    rawRows,
    metadata,
    columnMapping,
    selectedFeatures,
    rfArtifact,
    isoArtifact,
    analysisOutput,
    incidents,
    isBusy,
    lastError,
    setColumnMapping,
    setSelectedFeatures,
    uploadCsv,
    loadSyntheticDemo,
    runCompleteDemoWorkflow,
    runHybridAnalysis,
  } = useMLNetwork();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inspectTab, setInspectTab] = useState<'preview' | 'schema' | 'stats'>('preview');
  const [contamination, setContamination] = useState<number>(0.22);
  const [dropDuplicates, setDropDuplicates] = useState<boolean>(false);
  const [autoTrainRf, setAutoTrainRf] = useState<boolean>(true);

  // Table filter & pagination state
  const [sevFilter, setSevFilter] = useState<string>('ALL');
  const [anomFilter, setAnomFilter] = useState<string>('ALL');
  const [searchQ, setSearchQ] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        uploadCsv(String(reader.result || ''), file.name);
        setPage(1);
      } catch (err: any) {
        setUploadError(err?.message || 'Could not parse uploaded CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (role: keyof ColumnMapping, val: string) => {
    if (!columnMapping) return;
    setColumnMapping({ ...columnMapping, [role]: val === '(None)' ? null : val });
  };

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleRunAnalysis = () => {
    setUploadError(null);
    try {
      runHybridAnalysis({
        contamination,
        dropDuplicates,
        autoTrainRf,
      });
      setPage(1);
    } catch (err: any) {
      setUploadError(err?.message || 'Analysis failed.');
    }
  };

  // Filtered detection results
  const filteredResults = useMemo(() => {
    if (!analysisOutput) return [];
    const q = searchQ.trim().toLowerCase();
    return analysisOutput.results.filter((r) => {
      if (sevFilter !== 'ALL' && r.severity !== sevFilter) return false;
      if (anomFilter !== 'ALL' && r.anomalyStatus !== anomFilter) return false;
      if (q) {
        return (
          r.recordId.toLowerCase().includes(q) ||
          r.srcIp.toLowerCase().includes(q) ||
          r.dstIp.toLowerCase().includes(q) ||
          r.dstPort.toLowerCase().includes(q) ||
          r.predictedCategory.toLowerCase().includes(q) ||
          r.detectionReason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analysisOutput, sevFilter, anomFilter, searchQ]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const pagedResults = filteredResults.slice((page - 1) * pageSize, page * pageSize);

  // Build traffic timeline buckets (12 buckets across observed timestamps)
  const timelineBuckets = useMemo(() => {
    if (!analysisOutput) return [];
    const valid = analysisOutput.results
      .map((r) => ({ ms: Date.parse(r.timestamp), susp: r.isSuspicious }))
      .filter((x) => Number.isFinite(x.ms));
    if (valid.length < 2) return [];
    const minMs = Math.min(...valid.map((v) => v.ms));
    const maxMs = Math.max(...valid.map((v) => v.ms));
    const span = Math.max(maxMs - minMs, 1000);
    const nBins = 12;
    const bins = Array.from({ length: nBins }, (_, i) => ({
      label: new Date(minMs + (i / nBins) * span).toISOString().slice(11, 16),
      normal: 0,
      suspicious: 0,
    }));
    for (const v of valid) {
      const idx = Math.min(nBins - 1, Math.floor(((v.ms - minMs) / span) * nBins));
      if (v.susp) bins[idx].suspicious++;
      else bins[idx].normal++;
    }
    return bins;
  }, [analysisOutput]);

  // Category & Protocol distributions
  const categoryCounts = useMemo(() => {
    if (!analysisOutput) return [];
    const map: Record<string, number> = {};
    for (const r of analysisOutput.results) {
      const k = analysisOutput.usedSupervised ? r.predictedCategory : r.anomalyStatus;
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [analysisOutput]);

  const protocolCounts = useMemo(() => {
    if (!analysisOutput) return [];
    const map: Record<string, { normal: number; susp: number }> = {};
    for (const r of analysisOutput.results) {
      if (r.protocol === 'N/A') continue;
      if (!map[r.protocol]) map[r.protocol] = { normal: 0, susp: 0 };
      if (r.isSuspicious) map[r.protocol].susp++;
      else map[r.protocol].normal++;
    }
    return Object.entries(map);
  }, [analysisOutput]);

  // Numeric feature summary statistics for Traffic Statistics tab
  const numericStats = useMemo(() => {
    if (!rawRows || !metadata) return [];
    return metadata.numericColumns.slice(0, 12).map((col) => {
      const vals = rawRows
        .map((r) => Number(r[col]))
        .filter((v) => Number.isFinite(v))
        .sort((a, b) => a - b);
      if (!vals.length) return { col, count: 0, mean: 0, median: 0, min: 0, max: 0 };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      return {
        col,
        count: vals.length,
        mean: Number(mean.toFixed(2)),
        median: Number(vals[Math.floor(vals.length / 2)].toFixed(2)),
        min: Number(vals[0].toFixed(2)),
        max: Number(vals[vals.length - 1].toFixed(2)),
      };
    });
  }, [rawRows, metadata]);

  const allCols = metadata ? ['(None)', ...Object.keys(rawRows?.[0] || {})] : ['(None)'];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      <Header
        title="AI/ML Network Traffic Analysis"
        subtitle="PRASUNEX Innovathon 2026 (AI/ML Track) — CSV Ingestion, Random Forest Classification & Isolation Forest Anomaly Detection"
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Synthetic Demo Notice */}
        {metadata?.isSyntheticDemo && (
          <div className="p-3.5 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/25 text-xs text-[#172B4D] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
            <div>
              <strong>SYNTHETIC DEMONSTRATION DATA ACTIVE:</strong> Analyzing 1,200 locally generated synthetic network
              flow records created for reproducible evaluation — <em>not</em> live production traffic. Upload any
              CIC-IDS2017, UNSW-NB15, or custom NetFlow CSV below to analyze external data.
            </div>
          </div>
        )}

        {(uploadError || lastError) && (
          <div className="p-3.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/25 text-xs text-[#DC2626] font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError || lastError}</span>
          </div>
        )}

        {/* Top System & ML Model Status Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Active Dataset</p>
            <p className="text-xl font-extrabold text-[#172B4D] mt-1">
              {metadata ? `${metadata.nRows.toLocaleString()} flows` : 'None Loaded'}
            </p>
            <p className="text-xs text-[#64748B] mt-1 truncate">
              {metadata ? `${metadata.filename} (${metadata.nCols} cols)` : 'Upload a CSV or launch synthetic demo'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Supervised Classifier (Random Forest)
            </p>
            <p className={`text-xl font-extrabold mt-1 ${rfArtifact ? 'text-[#15803D]' : 'text-[#D97706]'}`}>
              {rfArtifact ? `Macro F1: ${rfArtifact.metrics.f1Macro.toFixed(2)}` : 'Not Trained'}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {rfArtifact
                ? `Test Acc: ${(rfArtifact.metrics.accuracy * 100).toFixed(1)}% (${rfArtifact.metrics.testSamples} test rows, ${rfArtifact.classes.length} classes)`
                : 'Requires a labeled CSV (auto-trains on demo)'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Anomaly Detector (Isolation Forest)
            </p>
            <p className={`text-xl font-extrabold mt-1 ${isoArtifact ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
              {isoArtifact ? `${isoArtifact.summary.anomalyRatePct.toFixed(1)}% Outliers` : 'Idle'}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {isoArtifact
                ? `${isoArtifact.summary.anomalyCount.toLocaleString()} anomalies | contamination=${isoArtifact.hyperparameters.contamination}`
                : 'Runs automatically on numerical features'}
            </p>
          </div>
        </div>

        {/* Ingestion & One-Click Demo Controls */}
        <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#2563EB]" />
                Network Flow Dataset Ingestion (CSV)
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Compatible with CIC-IDS2017, UNSW-NB15, and custom NetFlow CSV files. Headers are auto-trimmed and mapped.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#2563EB] text-xs font-bold text-[#172B4D] transition shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Upload CSV File</span>
                <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={loadSyntheticDemo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#2563EB] text-xs font-bold text-[#172B4D] transition"
              >
                <Database className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Load Synthetic Demo CSV</span>
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={runCompleteDemoWorkflow}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-[#FFFFFF] transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isBusy ? 'Running ML Pipeline...' : 'Run Complete Synthetic Demo (Train + Analyze)'}</span>
              </button>
            </div>
          </div>

          {!metadata && (
            <div className="p-8 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center space-y-2">
              <Activity className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-bold text-[#172B4D]">No Network Traffic Dataset Loaded Yet</h3>
              <p className="text-xs text-[#64748B] max-w-xl mx-auto">
                SENTINELMESH never fabricates dashboard statistics. Upload a network traffic CSV or click{' '}
                <strong>Run Complete Synthetic Demo</strong> above to train Random Forest &amp; Isolation Forest live
                and populate all analytics, alerts, incidents, and reports.
              </p>
            </div>
          )}

          {/* Dataset Preview / Schema / Traffic Stats Tabs */}
          {metadata && rawRows && (
            <div className="pt-3 border-t border-[#E5E7EB] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-[#F7F8FA] p-1 rounded-lg border border-[#E5E7EB]">
                  {(['preview', 'schema', 'stats'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setInspectTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                        inspectTab === tab
                          ? 'bg-[#FFFFFF] text-[#2563EB] shadow-xs border border-[#E5E7EB]'
                          : 'text-[#64748B] hover:text-[#172B4D]'
                      }`}
                    >
                      {tab === 'preview'
                        ? 'Preview (First 10 Rows)'
                        : tab === 'schema'
                        ? `Column Schema (${metadata.nCols})`
                        : 'Traffic Statistics'}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[#64748B]">
                  Missing cells: <strong>{metadata.totalMissingCells}</strong> &bull; Duplicates:{' '}
                  <strong>{metadata.duplicateRows}</strong> &bull; Numeric cols:{' '}
                  <strong>{metadata.numericColumns.length}</strong>
                </span>
              </div>

              {inspectTab === 'preview' && (
                <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B]">
                      <tr>
                        {Object.keys(rawRows[0]).slice(0, 10).map((col) => (
                          <th key={col} className="px-3 py-2 font-semibold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] font-mono text-[11px]">
                      {rawRows.slice(0, 10).map((r, i) => (
                        <tr key={i} className="hover:bg-[#F8FAFC]">
                          {Object.keys(rawRows[0]).slice(0, 10).map((col) => (
                            <td key={col} className="px-3 py-1.5 whitespace-nowrap text-[#172B4D]">
                              {r[col] === null || r[col] === undefined ? 'null' : String(r[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {inspectTab === 'schema' && (
                <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Column</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Missing</th>
                        <th className="px-3 py-2">Infinite</th>
                        <th className="px-3 py-2">Unique</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {metadata.columnSummary.map((cs) => (
                        <tr key={cs.column} className="hover:bg-[#F8FAFC]">
                          <td className="px-3 py-1.5 font-mono font-semibold text-[#172B4D]">{cs.column}</td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                cs.kind === 'numeric'
                                  ? 'bg-[#2563EB]/10 text-[#2563EB]'
                                  : 'bg-[#64748B]/10 text-[#64748B]'
                              }`}
                            >
                              {cs.kind}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 font-mono">{cs.missingCount} ({cs.missingPct}%)</td>
                          <td className="px-3 py-1.5 font-mono">{cs.infiniteCount}</td>
                          <td className="px-3 py-1.5 font-mono">{cs.uniqueValues}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {inspectTab === 'stats' && (
                <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B]">
                      <tr>
                        <th className="px-3 py-2">Numeric Feature</th>
                        <th className="px-3 py-2">Count</th>
                        <th className="px-3 py-2">Mean</th>
                        <th className="px-3 py-2">Median</th>
                        <th className="px-3 py-2">Min</th>
                        <th className="px-3 py-2">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] font-mono text-[11px]">
                      {numericStats.map((s) => (
                        <tr key={s.col} className="hover:bg-[#F8FAFC]">
                          <td className="px-3 py-1.5 font-semibold text-[#172B4D]">{s.col}</td>
                          <td className="px-3 py-1.5">{s.count}</td>
                          <td className="px-3 py-1.5">{s.mean.toLocaleString()}</td>
                          <td className="px-3 py-1.5">{s.median.toLocaleString()}</td>
                          <td className="px-3 py-1.5">{s.min.toLocaleString()}</td>
                          <td className="px-3 py-1.5">{s.max.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Column Role Mapping & ML Controls */}
              {columnMapping && (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {(
                      [
                        ['src_ip', 'Source IP'],
                        ['dst_ip', 'Destination IP'],
                        ['dst_port', 'Destination Port'],
                        ['protocol', 'Protocol'],
                        ['timestamp', 'Timestamp'],
                        ['label', 'Target Label (Optional)'],
                        ['src_port', 'Source Port'],
                        ['record_id', 'Record ID'],
                      ] as [keyof ColumnMapping, string][]
                    ).map(([role, label]) => (
                      <div key={role}>
                        <label className="block text-[11px] font-bold text-[#64748B] mb-1">{label}</label>
                        <select
                          value={columnMapping[role] || '(None)'}
                          onChange={(e) => handleMappingChange(role, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-xs text-[#172B4D]"
                        >
                          {allCols.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] mb-1.5">
                      Numerical ML Input Features ({selectedFeatures.length} selected — target label strictly excluded):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {metadata.numericColumns
                        .filter((c) => c !== columnMapping.label)
                        .map((feat) => {
                          const active = selectedFeatures.includes(feat);
                          return (
                            <button
                              key={feat}
                              type="button"
                              onClick={() => toggleFeature(feat)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition ${
                                active
                                  ? 'bg-[#2563EB] text-[#FFFFFF] border-[#2563EB]'
                                  : 'bg-[#FFFFFF] text-[#64748B] border-[#E5E7EB] hover:border-[#2563EB]'
                              }`}
                            >
                              {feat}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E5E7EB]">
                    <div className="flex flex-wrap items-center gap-5 text-xs">
                      <label className="flex items-center gap-2 font-semibold text-[#172B4D]">
                        <span>Contamination: {(contamination * 100).toFixed(0)}%</span>
                        <input
                          type="range"
                          min={0.02}
                          max={0.45}
                          step={0.01}
                          value={contamination}
                          onChange={(e) => setContamination(parseFloat(e.target.value))}
                          className="accent-[#2563EB]"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-[#172B4D]">
                        <input
                          type="checkbox"
                          checked={dropDuplicates}
                          onChange={(e) => setDropDuplicates(e.target.checked)}
                          className="accent-[#2563EB]"
                        />
                        Remove duplicates
                      </label>
                      <label className="flex items-center gap-1.5 text-[#172B4D]">
                        <input
                          type="checkbox"
                          checked={autoTrainRf}
                          disabled={!columnMapping.label}
                          onChange={(e) => setAutoTrainRf(e.target.checked)}
                          className="accent-[#2563EB]"
                        />
                        Train Random Forest on label column
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy || selectedFeatures.length === 0}
                      onClick={handleRunAnalysis}
                      className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-[#FFFFFF] text-xs font-bold transition shadow-sm"
                    >
                      Start ML Traffic Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ANALYSIS RESULTS DASHBOARD */}
        {analysisOutput && (
          <>
            {/* 5 Executive KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Total Analyzed</p>
                <p className="text-2xl font-extrabold text-[#172B4D] mt-1">
                  {analysisOutput.summary.totalRecords.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Network traffic flows</p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Normal Traffic</p>
                <p className="text-2xl font-extrabold text-[#15803D] mt-1">
                  {analysisOutput.summary.normalRecords.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {((analysisOutput.summary.normalRecords / Math.max(analysisOutput.summary.totalRecords, 1)) * 100).toFixed(1)}% baseline aligned
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Suspicious Records</p>
                <p className="text-2xl font-extrabold text-[#D97706] mt-1">
                  {analysisOutput.summary.suspiciousRecords.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {analysisOutput.summary.anomalyCount.toLocaleString()} IsoForest anomalies
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Potential Attacks (RF)</p>
                <p className="text-2xl font-extrabold text-[#EA580C] mt-1">
                  {analysisOutput.summary.potentialAttackRecords !== null
                    ? analysisOutput.summary.potentialAttackRecords.toLocaleString()
                    : 'N/A'}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {analysisOutput.usedSupervised ? 'Supervised non-benign' : 'Unsupervised-only mode'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">High &amp; Critical Alerts</p>
                <p className="text-2xl font-extrabold text-[#DC2626] mt-1">
                  {analysisOutput.summary.highCriticalAlerts.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">{incidents.length} correlated incidents</p>
              </div>
            </div>

            {!analysisOutput.usedSupervised && (
              <div className="p-3.5 rounded-xl bg-[#D97706]/10 border border-[#D97706]/30 text-xs text-[#92400E]">
                <strong>Unsupervised + Heuristics Mode:</strong> {analysisOutput.supervisedSkipReason} No supervised
                categories were invented.
              </div>
            )}

            {/* Traffic Timeline + Severity & Category Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Timeline */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                    Traffic Analysis &amp; Alert Timeline
                  </h3>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-[#64748B]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]/70" /> Normal
                    </span>
                    <span className="flex items-center gap-1 text-[#64748B]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" /> Suspicious
                    </span>
                  </div>
                </div>
                {timelineBuckets.length > 0 ? (
                  <div className="h-44 flex items-end gap-1.5 pt-4">
                    {(() => {
                      const maxTot = Math.max(...timelineBuckets.map((b) => b.normal + b.suspicious), 1);
                      return timelineBuckets.map((b, idx) => {
                        const normH = Math.round((b.normal / maxTot) * 100);
                        const suspH = Math.round((b.suspicious / maxTot) * 100);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <div
                              className="w-full flex flex-col justify-end rounded-t overflow-hidden bg-[#F1F5F9]"
                              style={{ height: '132px' }}
                              title={`${b.label} UTC — Normal: ${b.normal}, Suspicious: ${b.suspicious}`}
                            >
                              {b.suspicious > 0 && (
                                <div className="w-full bg-[#DC2626]" style={{ height: `${Math.max(4, suspH)}%` }} />
                              )}
                              {b.normal > 0 && (
                                <div className="w-full bg-[#2563EB]/75" style={{ height: `${Math.max(4, normH)}%` }} />
                              )}
                            </div>
                            <span className="text-[9px] font-mono text-[#64748B]">{b.label}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] py-12 text-center">
                    No parseable timestamp column mapped for timeline visualization.
                  </p>
                )}
              </div>

              {/* Severity Distribution */}
              <div className="lg:col-span-3 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#172B4D]">Severity Distribution</h3>
                <div className="space-y-3 pt-1">
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as SeverityLevel[]).map((sev) => {
                    const cnt = analysisOutput.summary.severityCounts[sev];
                    const pct = (cnt / Math.max(analysisOutput.summary.totalRecords, 1)) * 100;
                    const barColor =
                      sev === 'CRITICAL'
                        ? 'bg-[#DC2626]'
                        : sev === 'HIGH'
                        ? 'bg-[#EA580C]'
                        : sev === 'MEDIUM'
                        ? 'bg-[#D97706]'
                        : 'bg-[#15803D]';
                    return (
                      <div key={sev} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-[#172B4D]">{sev}</span>
                          <span className="font-mono text-[#64748B]">
                            {cnt.toLocaleString()} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category & Protocol Breakdown */}
              <div className="lg:col-span-3 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#172B4D]">
                  {analysisOutput.usedSupervised ? 'Predicted Categories (RF)' : 'Anomaly Status'}
                </h3>
                <div className="space-y-2">
                  {categoryCounts.slice(0, 6).map(([cat, cnt]) => {
                    const pct = (cnt / Math.max(analysisOutput.summary.totalRecords, 1)) * 100;
                    return (
                      <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-[#F1F5F9]">
                        <span className="font-semibold text-[#172B4D] truncate pr-2">{cat}</span>
                        <span className="font-mono text-[#64748B]">
                          {cnt} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
                {protocolCounts.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase text-[#64748B] mb-1">Protocols</p>
                    <div className="flex flex-wrap gap-1.5">
                      {protocolCounts.map(([proto, c]) => (
                        <span
                          key={proto}
                          className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E5E7EB] text-[11px] font-mono text-[#172B4D]"
                        >
                          {proto}: {c.normal + c.susp} ({c.susp} susp)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Navigation Strip to Alerts, Investigation, Model Center, Reports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/ml-alerts"
                className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#2563EB] flex items-center justify-between transition shadow-xs"
              >
                <div>
                  <p className="text-xs font-bold text-[#172B4D]">Alert Management</p>
                  <p className="text-[11px] text-[#64748B]">Triage ALT-0001+ &amp; mark investigated</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2563EB]" />
              </Link>
              <Link
                href="/ml-incidents"
                className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#2563EB] flex items-center justify-between transition shadow-xs"
              >
                <div>
                  <p className="text-xs font-bold text-[#172B4D]">Incident Investigation</p>
                  <p className="text-[11px] text-[#64748B]">Correlated hosts &amp; Z-score XAI</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2563EB]" />
              </Link>
              <Link
                href="/ml-models"
                className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#2563EB] flex items-center justify-between transition shadow-xs"
              >
                <div>
                  <p className="text-xs font-bold text-[#172B4D]">ML Model Center</p>
                  <p className="text-[11px] text-[#64748B]">Confusion Matrix &amp; Importances</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2563EB]" />
              </Link>
              <Link
                href="/ml-reports"
                className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#2563EB] flex items-center justify-between transition shadow-xs"
              >
                <div>
                  <p className="text-xs font-bold text-[#172B4D]">Reports &amp; Edu Use Case</p>
                  <p className="text-[11px] text-[#64748B]">Download CSV, JSON &amp; PDF reports</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2563EB]" />
              </Link>
            </div>

            {/* Filterable Paginated Detection Results Table */}
            <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D]">
                    Analyzed Network Flow Records ({filteredResults.length.toLocaleString()} matching)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Cleaned: {analysisOutput.cleaningReport.finalRows} rows &bull; Inf replaced:{' '}
                    {analysisOutput.cleaningReport.infiniteValuesReplaced} &bull; Duplicates removed:{' '}
                    {analysisOutput.cleaningReport.duplicatesRemoved}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={searchQ}
                      onChange={(e) => {
                        setSearchQ(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search IP, Port, ID, Reason..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] text-xs text-[#172B4D] w-52"
                    />
                  </div>
                  <select
                    value={sevFilter}
                    onChange={(e) => {
                      setSevFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-semibold text-[#172B4D]"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                  <select
                    value={anomFilter}
                    onChange={(e) => {
                      setAnomFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-semibold text-[#172B4D]"
                  >
                    <option value="ALL">All Anomaly Status</option>
                    <option value="ANOMALY">ANOMALY</option>
                    <option value="NORMAL">NORMAL</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">Record ID</th>
                      <th className="px-3 py-2">Source → Dest</th>
                      <th className="px-3 py-2">Proto</th>
                      <th className="px-3 py-2">Predicted Class</th>
                      <th className="px-3 py-2">Anomaly Score</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {pagedResults.map((r) => (
                      <tr key={r.recordId} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                          {r.recordId}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap text-[#172B4D]">
                          {r.srcIp} → {r.dstIp}:{r.dstPort}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px]">{r.protocol}</td>
                        <td className="px-3 py-2 font-semibold text-[#172B4D] whitespace-nowrap">
                          {r.predictedCategory}
                        </td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          <span className={r.anomalyStatus === 'ANOMALY' ? 'text-[#DC2626] font-bold' : 'text-[#64748B]'}>
                            {r.anomalyScore.toFixed(1)}/100 ({r.anomalyStatus})
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEV_BADGE[r.severity]}`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-[#64748B] max-w-md truncate" title={r.detectionReason}>
                          {r.detectionReason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filteredResults.length} rows)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-[#E5E7EB] bg-[#FFFFFF] disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-[#E5E7EB] bg-[#FFFFFF] disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
