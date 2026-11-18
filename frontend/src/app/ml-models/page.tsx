'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  BarChart2,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useMLNetwork } from '@/lib/ml/mlContext';

export default function MLModelCenterPage() {
  const {
    rawRows,
    metadata,
    columnMapping,
    rfArtifact,
    isoArtifact,
    loadSyntheticDemo,
    trainRandomForest,
    clearRandomForest,
    runIsoOnly,
  } = useMLNetwork();

  const [labelCol, setLabelCol] = useState<string>(columnMapping?.label || 'label');
  const [nEstimators, setNEstimators] = useState<number>(35);
  const [maxDepth, setMaxDepth] = useState<number>(10);
  const [testSize, setTestSize] = useState<number>(0.25);
  const [isoCont, setIsoCont] = useState<number>(0.2);
  const [isoTrees, setIsoTrees] = useState<number>(80);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const allCols = rawRows && rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const effectiveLabel = allCols.includes(labelCol)
    ? labelCol
    : columnMapping?.label && allCols.includes(columnMapping.label)
    ? columnMapping.label
    : allCols[allCols.length - 1] || '';

  const handleTrainRf = () => {
    setErr(null);
    setMsg(null);
    try {
      const art = trainRandomForest({
        labelColumn: effectiveLabel,
        nEstimators,
        maxDepth,
        testSize,
      });
      setMsg(
        `Random Forest trained on ${art.metrics.trainSamples} rows & evaluated on ${art.metrics.testSamples} held-out test rows — Accuracy: ${(art.metrics.accuracy * 100).toFixed(2)}%, Macro F1: ${art.metrics.f1Macro.toFixed(4)}.`
      );
    } catch (e: any) {
      setErr(e?.message || 'Random Forest training failed.');
    }
  };

  const handleTrainIso = () => {
    setErr(null);
    setMsg(null);
    try {
      const art = runIsoOnly({ contamination: isoCont, nEstimators: isoTrees });
      setMsg(
        `Isolation Forest fitted on ${art.summary.totalRecords} flows — flagged ${art.summary.anomalyCount} (${art.summary.anomalyRatePct}%) as statistical anomalies.`
      );
    } catch (e: any) {
      setErr(e?.message || 'Isolation Forest fitting failed.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      <Header
        title="ML Model Center"
        subtitle="Train, evaluate, inspect, and manage Random Forest (Supervised) and Isolation Forest (Unsupervised) models"
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {msg && (
          <div className="p-3.5 rounded-xl bg-[#15803D]/10 border border-[#15803D]/25 text-xs text-[#15803D] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{msg}</span>
          </div>
        )}
        {err && (
          <div className="p-3.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/25 text-xs text-[#DC2626] font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Model Availability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Supervised Threat Classifier
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  rfArtifact
                    ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/25'
                    : 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25'
                }`}
              >
                {rfArtifact ? 'TRAINED & ACTIVE' : 'NOT TRAINED'}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#172B4D]">RandomForestClassifier (Balanced Gini)</h2>
            <p className="text-xs text-[#64748B]">
              {rfArtifact
                ? `Trained on '${rfArtifact.datasetName}' (${rfArtifact.metrics.trainSamples} train / ${rfArtifact.metrics.testSamples} test rows, ${rfArtifact.features.length} features, ${rfArtifact.classes.length} classes).`
                : 'Requires a labeled dataset with at least 2 distinct target classes.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Unsupervised Anomaly Detector
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isoArtifact
                    ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/25'
                    : 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/25'
                }`}
              >
                {isoArtifact ? 'FITTED & ACTIVE' : 'NOT FITTED'}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#172B4D]">IsolationForest (Path-Length Outliers)</h2>
            <p className="text-xs text-[#64748B]">
              {isoArtifact
                ? `Fitted on '${isoArtifact.datasetName}' — flagged ${isoArtifact.summary.anomalyCount}/${isoArtifact.summary.totalRecords} records (${isoArtifact.summary.anomalyRatePct}%) at contamination=${isoArtifact.hyperparameters.contamination}.`
                : 'Learns baseline traffic density from numerical flow features without needing labels.'}
            </p>
          </div>
        </div>

        {/* Training Controls */}
        {!metadata ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-dashed border-[#CBD5E1] text-center space-y-3">
            <Cpu className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#172B4D]">Load a Dataset to Train Models</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Upload a CSV in AI/ML Traffic Analysis or load the 1,200-flow synthetic demo dataset to train and evaluate Random Forest and Isolation Forest live.
            </p>
            <button
              type="button"
              onClick={loadSyntheticDemo}
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-[#FFFFFF] text-xs font-bold hover:bg-[#1D4ED8]"
            >
              Load Synthetic Demo Dataset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Train Random Forest */}
            <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Train Supervised Random Forest</h3>
                <p className="text-xs text-[#64748B]">
                  Fits median imputer strictly on train split, excludes label &amp; ID columns, and evaluates on held-out test split.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Target Label Column</label>
                  <select
                    value={effectiveLabel}
                    onChange={(e) => setLabelCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] font-mono"
                  >
                    {allCols.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                    Held-Out Test Split ({Math.round(testSize * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0.15}
                    max={0.4}
                    step={0.05}
                    value={testSize}
                    onChange={(e) => setTestSize(parseFloat(e.target.value))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                    Trees (n_estimators = {nEstimators})
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={75}
                    step={5}
                    value={nEstimators}
                    onChange={(e) => setNEstimators(parseInt(e.target.value, 10))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                    Max Depth ({maxDepth})
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={16}
                    step={1}
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTrainRf}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] text-xs font-bold transition"
                >
                  <Play className="w-3.5 h-3.5" /> Train &amp; Evaluate Random Forest
                </button>
                {rfArtifact && (
                  <button
                    type="button"
                    onClick={clearRandomForest}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E5E7EB] hover:border-[#DC2626] text-xs font-bold text-[#DC2626]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </section>

            {/* Fit Isolation Forest */}
            <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Fit Unsupervised Isolation Forest</h3>
                <p className="text-xs text-[#64748B]">
                  Builds randomized isolation trees (subsample ψ=256) on standardized numerical features to surface outliers.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                    Contamination ({Math.round(isoCont * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0.02}
                    max={0.45}
                    step={0.01}
                    value={isoCont}
                    onChange={(e) => setIsoCont(parseFloat(e.target.value))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                    iTrees ({isoTrees})
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={150}
                    step={10}
                    value={isoTrees}
                    onChange={(e) => setIsoTrees(parseInt(e.target.value, 10))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleTrainIso}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#172B4D] hover:bg-[#0F172A] text-[#FFFFFF] text-xs font-bold transition"
              >
                <Play className="w-3.5 h-3.5" /> Fit Isolation Forest Baseline
              </button>
            </section>
          </div>
        )}

        {/* Evaluation Metrics, Confusion Matrix & Feature Importances */}
        {rfArtifact && (
          <section className="space-y-5">
            {rfArtifact.isSyntheticDemo && (
              <div className="p-3 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs text-[#172B4D] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                <span>
                  <strong>Evaluation Scope Note:</strong> Metrics below were computed on the held-out test split of the
                  synthetic demonstration dataset — NOT presented as real-world CIC-IDS2017 or production accuracy.
                </span>
              </div>
            )}

            {rfArtifact.warnings.map((w, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#D97706]/10 border border-[#D97706]/25 text-xs text-[#92400E]">
                {w}
              </div>
            ))}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Test Accuracy</p>
                <p className="text-2xl font-extrabold text-[#15803D] mt-1">
                  {(rfArtifact.metrics.accuracy * 100).toFixed(2)}%
                </p>
                <p className="text-[11px] text-[#64748B]">{rfArtifact.metrics.testSamples} held-out test rows</p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Precision (Weighted)</p>
                <p className="text-2xl font-extrabold text-[#2563EB] mt-1">
                  {(rfArtifact.metrics.precisionWeighted * 100).toFixed(2)}%
                </p>
                <p className="text-[11px] text-[#64748B]">Macro: {(rfArtifact.metrics.precisionMacro * 100).toFixed(2)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Recall (Weighted)</p>
                <p className="text-2xl font-extrabold text-[#0284C7] mt-1">
                  {(rfArtifact.metrics.recallWeighted * 100).toFixed(2)}%
                </p>
                <p className="text-[11px] text-[#64748B]">Macro: {(rfArtifact.metrics.recallMacro * 100).toFixed(2)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">F1-Score (Weighted)</p>
                <p className="text-2xl font-extrabold text-[#172B4D] mt-1">
                  {(rfArtifact.metrics.f1Weighted * 100).toFixed(2)}%
                </p>
                <p className="text-[11px] text-[#64748B]">Macro: {(rfArtifact.metrics.f1Macro * 100).toFixed(2)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Confusion Matrix */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#172B4D]">Confusion Matrix (Actual Rows × Predicted Columns)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs font-mono border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-[#64748B] border-b border-[#E5E7EB]">Actual \ Pred</th>
                        {rfArtifact.metrics.classes.map((cls) => (
                          <th key={cls} className="p-2 text-[10px] text-[#64748B] border-b border-[#E5E7EB]">
                            {cls}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rfArtifact.metrics.confusionMatrix.map((row, rIdx) => {
                        const rowMax = Math.max(...row, 1);
                        return (
                          <tr key={rfArtifact.metrics.classes[rIdx]}>
                            <td className="p-2 text-left font-bold text-[#172B4D] border-b border-[#F1F5F9]">
                              {rfArtifact.metrics.classes[rIdx]}
                            </td>
                            {row.map((val, cIdx) => {
                              const isDiag = rIdx === cIdx;
                              const intensity = val / rowMax;
                              const bg = isDiag
                                ? `rgba(37, 99, 235, ${0.12 + intensity * 0.55})`
                                : val > 0
                                ? `rgba(220, 38, 38, ${0.12 + intensity * 0.45})`
                                : '#F8FAFC';
                              return (
                                <td
                                  key={cIdx}
                                  className="p-2 border border-[#E5E7EB] font-bold"
                                  style={{ backgroundColor: bg, color: intensity > 0.65 && isDiag ? '#FFFFFF' : '#172B4D' }}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feature Importances */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#2563EB]" />
                  Top Random Forest Feature Importances (Gini)
                </h3>
                <div className="space-y-2">
                  {rfArtifact.featureImportances.slice(0, 10).map((fi) => {
                    const maxImp = Math.max(rfArtifact.featureImportances[0]?.importance || 0.01, 0.01);
                    const pct = (fi.importance / maxImp) * 100;
                    return (
                      <div key={fi.feature} className="space-y-0.5 text-xs">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="font-semibold text-[#172B4D]">{fi.feature}</span>
                          <span className="text-[#64748B]">{(fi.importance * 100).toFixed(2)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Per-Class Classification Report */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#172B4D]">Per-Class Classification Report</h3>
              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">Precision</th>
                      <th className="px-3 py-2">Recall</th>
                      <th className="px-3 py-2">F1-Score</th>
                      <th className="px-3 py-2">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {rfArtifact.metrics.classificationReport.map((row) => (
                      <tr key={row.className} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 font-sans font-bold text-[#172B4D]">{row.className}</td>
                        <td className="px-3 py-2">{(row.precision * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2">{(row.recall * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 font-bold text-[#2563EB]">{(row.f1Score * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2">{row.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Model Limitations Disclosure */}
        <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-2 text-xs text-[#64748B]">
          <h3 className="text-sm font-bold text-[#172B4D]">Model Limitations &amp; Responsible ML Disclosure</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Random Forest classification only recognizes classes present in the training labels; tree vote share is not a calibrated attack probability.</li>
            <li>Isolation Forest surfaces statistical deviations relative to the loaded dataset baseline; anomalous traffic may be benign operational spikes rather than confirmed attacks.</li>
            <li>For real-world enterprise deployment, models must be trained and validated on representative institutional flow captures (e.g., Zeek/Suricata) with ongoing concept-drift monitoring.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
