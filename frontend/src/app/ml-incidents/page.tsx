'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  SearchCheck,
  Save,
  Play,
  Activity,
  Info,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useMLNetwork } from '@/lib/ml/mlContext';
import { IncidentInvestigationStatus, SeverityLevel } from '@/lib/ml/types';

const INC_STATUSES: IncidentInvestigationStatus[] = ['OPEN', 'INVESTIGATING', 'CONTAINED', 'CLOSED'];

const SEV_BADGE: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
  HIGH: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/30',
  MEDIUM: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30',
  LOW: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30',
};

export default function MLIncidentsPage() {
  const {
    metadata,
    analysisOutput,
    incidents,
    selectedRecordId,
    setSelectedRecordId,
    updateIncidentTriage,
    runCompleteDemoWorkflow,
  } = useMLNetwork();

  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('ALL');
  const [incStatus, setIncStatus] = useState<IncidentInvestigationStatus>('INVESTIGATING');
  const [incNote, setIncNote] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const activeIncident = useMemo(
    () => (selectedIncidentId === 'ALL' ? null : incidents.find((i) => i.incidentId === selectedIncidentId) || null),
    [incidents, selectedIncidentId]
  );

  const handleSelectIncident = (iid: string) => {
    setSelectedIncidentId(iid);
    setSavedNotice(null);
    const found = incidents.find((i) => i.incidentId === iid);
    if (found) {
      setIncStatus(found.investigationStatus);
      setIncNote(found.analystNote);
      if (found.sampleRecordIds[0]) {
        setSelectedRecordId(found.sampleRecordIds[0]);
      }
    }
  };

  const handleSaveIncident = () => {
    if (!activeIncident) return;
    updateIncidentTriage(activeIncident.incidentId, incStatus, incNote);
    setSavedNotice(`Updated ${activeIncident.incidentId} status to '${incStatus}'.`);
  };

  const candidateRecords = useMemo(() => {
    if (!analysisOutput) return [];
    if (activeIncident) {
      const idSet = new Set(activeIncident.sampleRecordIds);
      const matched = analysisOutput.results.filter((r) => idSet.has(r.recordId));
      if (matched.length > 0) return matched;
    }
    const susp = analysisOutput.results.filter((r) => r.isSuspicious);
    return (susp.length ? susp : analysisOutput.results).slice(0, 200);
  }, [analysisOutput, activeIncident]);

  const activeRecord = useMemo(() => {
    if (!candidateRecords.length) return null;
    return candidateRecords.find((r) => r.recordId === selectedRecordId) || candidateRecords[0];
  }, [candidateRecords, selectedRecordId]);

  const relatedHostRecords = useMemo(() => {
    if (!analysisOutput || !activeRecord || activeRecord.srcIp === 'N/A') return [];
    return analysisOutput.results
      .filter((r) => r.srcIp === activeRecord.srcIp && r.recordId !== activeRecord.recordId)
      .slice(0, 20);
  }, [analysisOutput, activeRecord]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      <Header
        title="Incident Investigation & Forensic XAI"
        subtitle="Rule-based correlated host incidents, persistent incident status tracking, and evidence-backed feature deviation analysis"
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {metadata?.isSyntheticDemo && (
          <div className="p-3 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs text-[#172B4D] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            <span>Correlated incidents generated from the synthetic demonstration dataset using transparent rule-based host/protocol grouping.</span>
          </div>
        )}

        {!analysisOutput ? (
          <div className="p-10 rounded-2xl bg-[#FFFFFF] border border-dashed border-[#CBD5E1] text-center space-y-4">
            <SearchCheck className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <h2 className="text-base font-bold text-[#172B4D]">No Analysis Loaded for Investigation</h2>
            <p className="text-xs text-[#64748B] max-w-lg mx-auto">
              Run traffic analysis first to correlate suspicious host events and inspect record-level ML explanations.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={runCompleteDemoWorkflow}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-[#FFFFFF] text-xs font-bold hover:bg-[#1D4ED8]"
              >
                <Play className="w-3.5 h-3.5" /> Run Synthetic Demo Workflow
              </button>
              <Link
                href="/network-ml"
                className="px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-xs font-bold text-[#172B4D]"
              >
                Go to Traffic Analysis
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: Correlated Incidents Table */}
            <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[#172B4D]">
                    1. Correlated Security Incidents ({incidents.length} host/protocol groups)
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Deterministic aggregation by source/destination host pair and protocol (not a graph neural network). Click an incident to inspect &amp; update status.
                  </p>
                </div>
                {selectedIncidentId !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => handleSelectIncident('ALL')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Show All Flagged Records
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Incident ID</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Max Severity</th>
                      <th className="px-3 py-2">Host Pair &amp; Protocol</th>
                      <th className="px-3 py-2">Flows</th>
                      <th className="px-3 py-2">Categories</th>
                      <th className="px-3 py-2">Observed Window</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {incidents.map((inc) => (
                      <tr
                        key={inc.incidentId}
                        onClick={() => handleSelectIncident(inc.incidentId)}
                        className={`cursor-pointer transition ${
                          selectedIncidentId === inc.incidentId ? 'bg-[#2563EB]/10' : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <td className="px-3 py-2 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                          {inc.incidentId}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25">
                            {inc.investigationStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEV_BADGE[inc.highestSeverity]}`}>
                            {inc.highestSeverity}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">{inc.groupingKey}</td>
                        <td className="px-3 py-2 font-mono font-bold">{inc.relatedRecordCount}</td>
                        <td className="px-3 py-2 font-semibold">{inc.predictedCategories}</td>
                        <td className="px-3 py-2 font-mono text-[10px] text-[#64748B] whitespace-nowrap">
                          {inc.firstSeen !== 'N/A'
                            ? `${inc.firstSeen.slice(11, 19)} → ${inc.lastSeen.slice(11, 19)}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Incident Status Update Form */}
              {activeIncident && (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#2563EB]/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-extrabold text-[#2563EB]">{activeIncident.incidentId}</span>
                      <span className="font-mono text-[#172B4D]">{activeIncident.groupingKey}</span>
                      <span className="text-[#64748B]">({activeIncident.relatedRecordCount} suspicious flows)</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#64748B] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activeIncident.firstSeen} → {activeIncident.lastSeen}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                        Incident Status
                      </label>
                      <select
                        value={incStatus}
                        onChange={(e) => setIncStatus(e.target.value as IncidentInvestigationStatus)}
                        className="w-full px-2.5 py-2 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] font-semibold"
                      >
                        {INC_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                        Investigation Notes
                      </label>
                      <input
                        type="text"
                        value={incNote}
                        onChange={(e) => setIncNote(e.target.value)}
                        placeholder="Record affected institutional asset, verification steps, or escalation notes..."
                        className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF]"
                      />
                    </div>
                    <div className="md:col-span-3 flex items-end">
                      <button
                        type="button"
                        onClick={handleSaveIncident}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-bold transition"
                      >
                        <Save className="w-3.5 h-3.5" /> Update Incident
                      </button>
                    </div>
                  </div>
                  {savedNotice && <p className="text-[11px] font-semibold text-[#15803D]">{savedNotice}</p>}
                </div>
              )}
            </section>

            {/* Section 2: Forensic Record XAI Inspector */}
            {activeRecord && (
              <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
                  <div>
                    <h2 className="text-sm font-bold text-[#172B4D]">
                      2. Single-Record Forensic XAI Inspector
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      Inspect exact feature deviations (Z-scores vs. dataset baseline), model outputs, and supporting host flows.
                    </p>
                  </div>
                  <select
                    value={activeRecord.recordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] text-xs font-mono font-semibold text-[#172B4D]"
                  >
                    {candidateRecords.slice(0, 120).map((r) => (
                      <option key={r.recordId} value={r.recordId}>
                        {r.recordId} | {r.severity} | {r.predictedCategory} | Score {r.anomalyScore}/100
                      </option>
                    ))}
                  </select>
                </div>

                {/* Record Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                    <p className="text-[10px] font-bold uppercase text-[#64748B]">Host Pair</p>
                    <p className="font-mono font-bold text-[#172B4D] mt-1">{activeRecord.srcIp}</p>
                    <p className="font-mono text-[11px] text-[#64748B]">
                      → {activeRecord.dstIp}:{activeRecord.dstPort} ({activeRecord.protocol})
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                    <p className="text-[10px] font-bold uppercase text-[#64748B]">Supervised Prediction</p>
                    <p className="font-bold text-[#172B4D] mt-1">{activeRecord.predictedCategory}</p>
                    <p className="text-[11px] text-[#64748B]">
                      {activeRecord.rfVoteProportion !== null
                        ? `RF Vote Share: ${(activeRecord.rfVoteProportion * 100).toFixed(1)}% (not calibrated prob.)`
                        : 'No supervised model active'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                    <p className="text-[10px] font-bold uppercase text-[#64748B]">Isolation Forest Score</p>
                    <p className={`text-lg font-extrabold mt-0.5 ${activeRecord.anomalyStatus === 'ANOMALY' ? 'text-[#DC2626]' : 'text-[#15803D]'}`}>
                      {activeRecord.anomalyScore.toFixed(1)} / 100
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {activeRecord.anomalyStatus} (raw: {activeRecord.rawIsoScore})
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                    <p className="text-[10px] font-bold uppercase text-[#64748B]">Severity &amp; Method</p>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEV_BADGE[activeRecord.severity]}`}>
                        {activeRecord.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">{activeRecord.detectionMethod}</p>
                  </div>
                </div>

                {/* Evidence-Backed Explanation Callout */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border-l-4 border-[#2563EB] border-y border-r border-[#E5E7EB] space-y-2 text-xs">
                  <p>
                    <strong className="text-[#172B4D]">Why This Record Was Flagged:</strong>{' '}
                    <span className="text-[#334155]">{activeRecord.detectionReason}</span>
                  </p>
                  <p>
                    <strong className="text-[#15803D]">Recommended Next Action (Non-Destructive):</strong>{' '}
                    <span className="text-[#334155]">{activeRecord.recommendedAction}</span>
                  </p>
                  <p>
                    <strong className="text-[#D97706]">Triggered Heuristics:</strong>{' '}
                    <span className="text-[#334155]">
                      {activeRecord.heuristicFlags.length ? activeRecord.heuristicFlags.join(' | ') : 'None'}
                    </span>
                  </p>
                </div>

                {/* Z-Score Feature Deviations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                      Top Feature Deviations vs Dataset Baseline (Z-Score)
                    </h3>
                    <div className="space-y-2.5">
                      {activeRecord.topDeviations.map((d) => {
                        const widthPct = Math.min(100, Math.max(8, (d.absZ / 6) * 100));
                        const barColor =
                          d.absZ >= 2.5 ? 'bg-[#DC2626]' : d.absZ >= 1.5 ? 'bg-[#D97706]' : 'bg-[#2563EB]';
                        return (
                          <div key={d.feature} className="space-y-1 text-xs">
                            <div className="flex justify-between font-mono text-[11px]">
                              <span className="font-semibold text-[#172B4D]">{d.feature}</span>
                              <span className="text-[#64748B]">
                                {d.zScore >= 0 ? `+${d.zScore}` : d.zScore}σ (val: {d.value.toLocaleString()})
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${widthPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Observed Feature Values vs Dataset Baseline
                    </h3>
                    <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B]">
                          <tr>
                            <th className="px-2.5 py-1.5">Feature</th>
                            <th className="px-2.5 py-1.5">Observed</th>
                            <th className="px-2.5 py-1.5">Median</th>
                            <th className="px-2.5 py-1.5">P95</th>
                            <th className="px-2.5 py-1.5">Z-Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] text-[11px]">
                          {activeRecord.topDeviations.map((d) => (
                            <tr key={d.feature}>
                              <td className="px-2.5 py-1.5 font-semibold text-[#172B4D]">{d.feature}</td>
                              <td className="px-2.5 py-1.5">{d.value.toLocaleString()}</td>
                              <td className="px-2.5 py-1.5 text-[#64748B]">{d.datasetMedian.toLocaleString()}</td>
                              <td className="px-2.5 py-1.5 text-[#64748B]">{d.p95.toLocaleString()}</td>
                              <td className={`px-2.5 py-1.5 font-bold ${d.absZ >= 2.5 ? 'text-[#DC2626]' : 'text-[#172B4D]'}`}>
                                {d.zScore >= 0 ? `+${d.zScore}` : d.zScore}σ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Related Host Traffic Records */}
                {relatedHostRecords.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[#E5E7EB]">
                    <h3 className="text-xs font-bold text-[#172B4D]">
                      Supporting Traffic Records from Host <span className="font-mono text-[#2563EB]">{activeRecord.srcIp}</span> ({relatedHostRecords.length} shown)
                    </h3>
                    <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg max-h-56">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] sticky top-0">
                          <tr>
                            <th className="px-3 py-1.5">Record</th>
                            <th className="px-3 py-1.5">Timestamp</th>
                            <th className="px-3 py-1.5">Dest IP:Port</th>
                            <th className="px-3 py-1.5">Category</th>
                            <th className="px-3 py-1.5">Score</th>
                            <th className="px-3 py-1.5">Severity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] font-mono text-[11px]">
                          {relatedHostRecords.map((rr) => (
                            <tr
                              key={rr.recordId}
                              onClick={() => setSelectedRecordId(rr.recordId)}
                              className="cursor-pointer hover:bg-[#F8FAFC]"
                            >
                              <td className="px-3 py-1.5 text-[#2563EB] font-bold">{rr.recordId}</td>
                              <td className="px-3 py-1.5 text-[#64748B]">{rr.timestamp.slice(11, 19)}</td>
                              <td className="px-3 py-1.5">{rr.dstIp}:{rr.dstPort}</td>
                              <td className="px-3 py-1.5 font-sans font-semibold">{rr.predictedCategory}</td>
                              <td className="px-3 py-1.5">{rr.anomalyScore.toFixed(1)}</td>
                              <td className="px-3 py-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEV_BADGE[rr.severity]}`}>
                                  {rr.severity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
