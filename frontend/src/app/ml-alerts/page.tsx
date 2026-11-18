'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  ArrowRight,
  Save,
  Play,
  Info,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useMLNetwork } from '@/lib/ml/mlContext';
import { AlertInvestigationStatus, SeverityLevel } from '@/lib/ml/types';

const STATUS_LIST: AlertInvestigationStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'INVESTIGATED',
  'FALSE_POSITIVE',
  'RESOLVED',
];

const SEV_BADGE: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
  HIGH: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/30',
  MEDIUM: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30',
  LOW: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30',
};

const STATUS_BADGE: Record<AlertInvestigationStatus, string> = {
  OPEN: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/25',
  IN_PROGRESS: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25',
  INVESTIGATED: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/25',
  FALSE_POSITIVE: 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/25',
  RESOLVED: 'bg-[#15803D]/15 text-[#15803D] border-[#15803D]/35',
};

export default function MLAlertsPage() {
  const router = useRouter();
  const {
    metadata,
    analysisOutput,
    alerts,
    setSelectedRecordId,
    updateAlertTriage,
    runCompleteDemoWorkflow,
  } = useMLNetwork();

  const [sevFilter, setSevFilter] = useState<string>('ALL');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [srcFilter, setSrcFilter] = useState<string>('ALL');
  const [searchQ, setSearchQ] = useState<string>('');
  const [selectedAlertId, setSelectedAlertId] = useState<string>('');
  const [editStatus, setEditStatus] = useState<AlertInvestigationStatus>('INVESTIGATED');
  const [editNote, setEditNote] = useState<string>('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(alerts.map((a) => a.detectionCategory))).sort()], [alerts]);
  const srcHosts = useMemo(
    () => ['ALL', ...Array.from(new Set(alerts.map((a) => a.srcIp).filter((ip) => ip !== 'N/A'))).sort()],
    [alerts]
  );

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return alerts.filter((a) => {
      if (sevFilter !== 'ALL' && a.severity !== sevFilter) return false;
      if (catFilter !== 'ALL' && a.detectionCategory !== catFilter) return false;
      if (statusFilter !== 'ALL' && a.investigationStatus !== statusFilter) return false;
      if (srcFilter !== 'ALL' && a.srcIp !== srcFilter) return false;
      if (q) {
        return (
          a.alertId.toLowerCase().includes(q) ||
          a.recordId.toLowerCase().includes(q) ||
          a.srcIp.toLowerCase().includes(q) ||
          a.dstIp.toLowerCase().includes(q) ||
          a.detectionCategory.toLowerCase().includes(q) ||
          a.detectionReason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, sevFilter, catFilter, statusFilter, srcFilter, searchQ]);

  const topSourceHosts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of filtered) {
      if (a.srcIp === 'N/A') continue;
      map[a.srcIp] = (map[a.srcIp] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filtered]);

  const activeAlert = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.find((a) => a.alertId === selectedAlertId) || filtered[0];
  }, [filtered, selectedAlertId]);

  const handleSelectAlert = (id: string) => {
    setSelectedAlertId(id);
    const found = alerts.find((a) => a.alertId === id);
    if (found) {
      setEditStatus(found.investigationStatus);
      setEditNote(found.analystNote);
    }
    setSavedMsg(null);
  };

  const handleSaveTriage = () => {
    if (!activeAlert) return;
    updateAlertTriage(activeAlert.alertId, editStatus, editNote);
    setSavedMsg(`Saved status '${editStatus}' for ${activeAlert.alertId}.`);
  };

  const handleQuickInvestigated = () => {
    if (!activeAlert) return;
    updateAlertTriage(activeAlert.alertId, 'INVESTIGATED', editNote || 'Reviewed and verified by security analyst.');
    setEditStatus('INVESTIGATED');
    setSavedMsg(`Marked ${activeAlert.alertId} as INVESTIGATED.`);
  };

  const openCount = alerts.filter((a) => a.investigationStatus === 'OPEN').length;
  const investigatedCount = alerts.filter((a) =>
    ['INVESTIGATED', 'RESOLVED', 'FALSE_POSITIVE'].includes(a.investigationStatus)
  ).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      <Header
        title="ML Threat Detection & Alert Management"
        subtitle="Filter, search, and triage structured AI/ML network alerts (ALT-0001+) with persistent investigation status tracking"
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {metadata?.isSyntheticDemo && (
          <div className="p-3 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs text-[#172B4D] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            <span>Showing alerts derived from the synthetic demonstration dataset (not live production captures).</span>
          </div>
        )}

        {!analysisOutput ? (
          <div className="p-10 rounded-2xl bg-[#FFFFFF] border border-dashed border-[#CBD5E1] text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <h2 className="text-base font-bold text-[#172B4D]">No Security Alerts Generated Yet</h2>
            <p className="text-xs text-[#64748B] max-w-lg mx-auto">
              Upload a network flow CSV in AI/ML Traffic Analysis or run the 1-click synthetic demo workflow to populate real ML alerts.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={runCompleteDemoWorkflow}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-[#FFFFFF] text-xs font-bold hover:bg-[#1D4ED8] transition"
              >
                <Play className="w-3.5 h-3.5" />
                Run Synthetic Demo Workflow
              </button>
              <Link
                href="/network-ml"
                className="px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-xs font-bold text-[#172B4D] hover:border-[#2563EB]"
              >
                Go to Traffic Analysis
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Critical</p>
                <p className="text-2xl font-extrabold text-[#DC2626] mt-1">
                  {analysisOutput.summary.severityCounts.CRITICAL}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">High</p>
                <p className="text-2xl font-extrabold text-[#EA580C] mt-1">
                  {analysisOutput.summary.severityCounts.HIGH}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Medium</p>
                <p className="text-2xl font-extrabold text-[#D97706] mt-1">
                  {analysisOutput.summary.severityCounts.MEDIUM}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Open Alerts</p>
                <p className="text-2xl font-extrabold text-[#2563EB] mt-1">{openCount}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB]">
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Investigated / Closed</p>
                <p className="text-2xl font-extrabold text-[#15803D] mt-1">{investigatedCount}</p>
              </div>
            </div>

            {/* Filter Bar + Top Source Hosts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4">
                <h3 className="text-sm font-bold text-[#172B4D]">Filter &amp; Search Security Alerts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <select
                    value={sevFilter}
                    onChange={(e) => setSevFilter(e.target.value)}
                    className="px-2.5 py-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] font-semibold"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="px-2.5 py-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === 'ALL' ? 'All Categories' : c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] font-semibold"
                  >
                    <option value="ALL">All Statuses</option>
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={srcFilter}
                    onChange={(e) => setSrcFilter(e.target.value)}
                    className="px-2.5 py-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] font-semibold"
                  >
                    {srcHosts.map((ip) => (
                      <option key={ip} value={ip}>
                        {ip === 'ALL' ? 'All Source IPs' : ip}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search Alert ID (ALT-0001), IP address, detection category, or reason..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] text-xs"
                  />
                </div>
              </div>

              <div className="lg:col-span-4 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-3">
                <h3 className="text-sm font-bold text-[#172B4D]">Top Alert-Generating Source Hosts</h3>
                {topSourceHosts.length > 0 ? (
                  <div className="space-y-2">
                    {topSourceHosts.map(([ip, count]) => {
                      const pct = (count / Math.max(topSourceHosts[0][1], 1)) * 100;
                      return (
                        <div key={ip} className="space-y-0.5 text-xs">
                          <div className="flex justify-between font-mono">
                            <span className="text-[#172B4D] font-semibold">{ip}</span>
                            <span className="text-[#64748B]">{count} alerts</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                            <div className="h-full bg-[#DC2626] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B]">No host IP addresses available.</p>
                )}
              </div>
            </div>

            {/* Interactive Alert Triage Workbench */}
            {activeAlert && (
              <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#2563EB]/30 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-[#2563EB]">{activeAlert.alertId}</span>
                    <span className="text-xs font-mono text-[#64748B]">({activeAlert.recordId})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEV_BADGE[activeAlert.severity]}`}>
                      {activeAlert.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[activeAlert.investigationStatus]}`}>
                      {activeAlert.investigationStatus}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecordId(activeAlert.recordId);
                      router.push('/ml-incidents');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172B4D] text-[#FFFFFF] text-xs font-bold hover:bg-[#0F172A] transition"
                  >
                    <span>Open in Incident Investigation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                  <div className="lg:col-span-7 space-y-2 bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E7EB]">
                    <p>
                      <strong className="text-[#172B4D]">Host Pair:</strong>{' '}
                      <span className="font-mono">
                        {activeAlert.srcIp} → {activeAlert.dstIp}:{activeAlert.dstPort} ({activeAlert.protocol})
                      </span>
                    </p>
                    <p>
                      <strong className="text-[#172B4D]">Category:</strong> {activeAlert.detectionCategory} &bull;{' '}
                      <strong>Anomaly Score:</strong> {activeAlert.anomalyScore.toFixed(1)}/100 &bull;{' '}
                      <strong>Method:</strong> {activeAlert.detectionMethod}
                    </p>
                    <p>
                      <strong className="text-[#172B4D]">Relevant Features:</strong>{' '}
                      <span className="font-mono text-[#2563EB]">{activeAlert.relevantFeatures}</span>
                    </p>
                    <p>
                      <strong className="text-[#172B4D]">Detection Reason:</strong> {activeAlert.detectionReason}
                    </p>
                    <p className="text-[#15803D]">
                      <strong>Recommended Action:</strong> {activeAlert.recommendedAction}
                    </p>
                  </div>

                  <div className="lg:col-span-5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                        Update Investigation Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as AlertInvestigationStatus)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-semibold"
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                        Analyst Investigation Note
                      </label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Document triage findings or escalation..."
                        className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveTriage}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-bold transition"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Status
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickInvestigated}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-[#FFFFFF] font-bold transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Investigated
                      </button>
                    </div>
                    {savedMsg && <p className="text-[11px] font-semibold text-[#15803D]">{savedMsg}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* Alerts Table */}
            <section className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-3">
              <h3 className="text-sm font-bold text-[#172B4D]">
                Active Security Alerts ({filtered.length.toLocaleString()} matching — click any row to triage)
              </h3>
              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg max-h-[460px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Alert ID</th>
                      <th className="px-3 py-2">Source → Dest</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Anomaly</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filtered.slice(0, 150).map((a) => {
                      const isSel = activeAlert?.alertId === a.alertId;
                      return (
                        <tr
                          key={a.alertId}
                          onClick={() => handleSelectAlert(a.alertId)}
                          className={`cursor-pointer transition ${
                            isSel ? 'bg-[#2563EB]/10' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="px-3 py-2 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                            {a.alertId}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                            {a.srcIp} → {a.dstIp}:{a.dstPort}
                          </td>
                          <td className="px-3 py-2 font-semibold whitespace-nowrap">{a.detectionCategory}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEV_BADGE[a.severity]}`}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[a.investigationStatus]}`}>
                              {a.investigationStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono">{a.anomalyScore.toFixed(1)}</td>
                          <td className="px-3 py-2 text-[11px] text-[#64748B] max-w-md truncate">{a.detectionReason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
