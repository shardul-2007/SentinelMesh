'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import {
  GovernanceExplanation,
  GovernanceDashboardSummary,
  PolicyVersionHistory,
  SecurityPolicy
} from '@/lib/types';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  ExternalLink,
  History,
  Layers,
  ArrowRight,
  Search,
  RefreshCw,
  FileText,
  Clock,
  Info,
  ChevronRight
} from 'lucide-react';

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<'provenance' | 'policies' | 'reports'>('provenance');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GovernanceDashboardSummary | null>(null);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  
  // Provenance inspection
  const [searchEventId, setSearchEventId] = useState('');
  const [explanation, setExplanation] = useState<GovernanceExplanation | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Policy History Modal
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
  const [policyHistory, setPolicyHistory] = useState<PolicyVersionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [sumData, polData] = await Promise.all([
        api.getGovernanceOverview().catch(() => null),
        api.getPolicies().catch(() => [])
      ]);
      setSummary(sumData);
      setPolicies(polData);

      // Auto-inspect first recent event if available and none selected
      if (sumData?.recent_governance_actions?.length && !explanation) {
        handleInspect(sumData.recent_governance_actions[0].event_id);
      }
    } catch (err) {
      console.error('Failed to load governance overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleInspect = async (eventId: string) => {
    if (!eventId.trim()) return;
    setInspecting(true);
    setInspectError(null);
    try {
      const exp = await api.getGovernanceExplanation(eventId.trim());
      setExplanation(exp);
      setSearchEventId(eventId.trim());
    } catch (err: any) {
      setInspectError(err.message || `No provenance record found for '${eventId}'`);
      setExplanation(null);
    } finally {
      setInspecting(false);
    }
  };

  const handleOpenPolicyHistory = async (pol: SecurityPolicy) => {
    setSelectedPolicy(pol);
    setLoadingHistory(true);
    try {
      const hist = await api.getPolicyVersionHistory(pol.id);
      setPolicyHistory(hist);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#0B0F17] text-[#F8FAFC]">
      <Header
        title="Autonomous Security Governance"
        subtitle="End-to-end evidence provenance, immutable policy versioning, and system-wide assurance"
        onRefresh={fetchOverview}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Governance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cryptographic Assurance</span>
                <span className="p-1.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {summary?.cryptographic_integrity_rate ?? 100}%
                </span>
                <span className="text-xs text-emerald-400 font-semibold">Intact Evidence</span>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Deterministic SHA-256 canonical validation
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blockchain Anchoring</span>
                <span className="p-1.5 rounded-md bg-blue-950/60 text-blue-400 border border-blue-800/40">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {summary?.blockchain_anchored_rate ?? 0}%
                </span>
                <span className="text-xs text-blue-400 font-semibold">EVM Anchored</span>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Audited against EVM smart contract
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Policies & Versions</span>
                <span className="p-1.5 rounded-md bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{summary?.total_policies ?? 7}</span>
                <span className="text-xs text-indigo-400 font-semibold">Active Policies</span>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                {summary?.total_policy_versions ?? 0} immutable historical version snapshots
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contained Agent Fleet</span>
                <span className="p-1.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  <Shield className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{summary?.quarantined_agents ?? 0}</span>
                <span className="text-xs text-amber-400 font-semibold">Quarantined</span>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                {summary?.open_incidents ?? 0} open incidents under investigation
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-800 flex gap-6">
            <button
              onClick={() => setActiveTab('provenance')}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'provenance'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Evidence Provenance Inspector
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'policies'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              Policy Version Provenance ({policies.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4" />
              Governance & Compliance Reports
            </button>
          </div>

          {/* TAB 1: EVIDENCE PROVENANCE INSPECTOR */}
          {activeTab === 'provenance' && (
            <div className="space-y-6">
              {/* Event Search Bar */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter Audit Event ID (e.g. evt_...) or pick a recent action below..."
                    value={searchEventId}
                    onChange={(e) => setSearchEventId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => handleInspect(searchEventId)}
                  disabled={inspecting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {inspecting ? 'Resolving...' : 'Inspect Provenance'}
                </button>
              </div>

              {/* Recent Actions Quick Select */}
              {summary?.recent_governance_actions && summary.recent_governance_actions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-500 font-medium">Recent Actions:</span>
                  {summary.recent_governance_actions.map((act) => (
                    <button
                      key={act.event_id}
                      onClick={() => handleInspect(act.event_id)}
                      className={`px-2.5 py-1 rounded-md font-mono transition border ${
                        searchEventId === act.event_id
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {act.event_id} ({act.action_type})
                    </button>
                  ))}
                </div>
              )}

              {inspectError && (
                <div className="p-4 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs">
                  {inspectError}
                </div>
              )}

              {/* Provenance Chain Flow */}
              {explanation && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-5 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{explanation.event_id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          explanation.policy_decision === 'ALLOW'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : explanation.policy_decision === 'BLOCK'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {explanation.policy_decision}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{explanation.decision_reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        explanation.provenance_chain_complete
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-red-950 text-red-300 border border-red-700'
                      }`}>
                        {explanation.provenance_chain_complete ? '✓ Provenance Chain Verified' : '⚠ Incomplete / Tampered'}
                      </span>
                    </div>
                  </div>

                  {/* Provenance Chain Step Progression */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {/* Step 1: Request */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 1: Origin</span>
                      <div className="font-bold text-white">{explanation.agent_name}</div>
                      <div className="text-slate-400 font-mono text-[11px] truncate">{explanation.agent_id}</div>
                      <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                        Risk Tier: <span className="font-semibold text-slate-200">{explanation.agent_behavioral_risk_tier}</span>
                      </div>
                    </div>

                    {/* Step 2: Policy Engine */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 2: Policy Rule</span>
                      <div className="font-bold text-white font-mono">{explanation.policy_id}</div>
                      <div className="text-indigo-400 font-mono text-[11px]">v{explanation.policy_version}</div>
                      <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                        Derived: <span className="font-semibold text-slate-200">{explanation.derived_risk_level}</span>
                      </div>
                    </div>

                    {/* Step 3: Local Cryptographic Hash */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 3: SHA-256 Hash</span>
                      <div className="font-bold text-white">Canonical Digest</div>
                      <div className="font-mono text-[11px] text-slate-400 truncate">{explanation.integrity_hash}</div>
                      <div className="pt-2 border-t border-slate-800/80">
                        Status: <span className={`font-semibold ${
                          explanation.local_verification_status === 'INTACT' ? 'text-emerald-400' : 'text-red-400'
                        }`}>{explanation.local_verification_status}</span>
                      </div>
                    </div>

                    {/* Step 4: EVM Ledger */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 4: Blockchain Anchor</span>
                      <div className="font-bold text-white">EVM State</div>
                      <div className="font-mono text-[11px] text-slate-400 truncate">
                        {explanation.transaction_hash || 'Unanchored'}
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        Ledger: <span className="font-semibold text-blue-400">{explanation.blockchain_verification_status}</span>
                      </div>
                    </div>

                    {/* Step 5: Incident Correlation */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 5: Threat Correlation</span>
                      <div className="font-bold text-white">
                        {explanation.related_incidents?.length || 0} Incident(s)
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {explanation.related_findings?.length || 0} Behavioral Finding(s)
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                        Approval: <span className="font-semibold text-slate-200">{explanation.approval_status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclosures & Details */}
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex gap-3">
                    <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-300 block mb-1">Assurance Disclosure:</strong>
                      {explanation.provenance_disclaimer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: POLICY VERSION PROVENANCE */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Policy ID</th>
                      <th className="px-5 py-3.5">Name & Description</th>
                      <th className="px-5 py-3.5">Version</th>
                      <th className="px-5 py-3.5">Decision</th>
                      <th className="px-5 py-3.5">Risk Tier</th>
                      <th className="px-5 py-3.5 text-right">Provenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {policies.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-5 py-3.5 font-mono text-xs text-indigo-400 font-bold whitespace-nowrap">
                          {p.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                            v{p.version}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            p.decision === 'ALLOW' ? 'bg-emerald-950 text-emerald-400' : p.decision === 'BLOCK' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {p.decision}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-300 whitespace-nowrap">
                          {p.risk_tier}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenPolicyHistory(p)}
                            className="px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 rounded-lg transition border border-indigo-800/50 flex items-center gap-1.5 ml-auto"
                          >
                            <History className="w-3.5 h-3.5" />
                            Version History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: GOVERNANCE & COMPLIANCE REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-sm max-w-2xl">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Export Governance & Provenance Assurance Reports
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Generate signed audit reports with full cryptographic provenance chains, policy versions, integrity hashes, and transaction references. Formulas are neutralized against CSV injection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={api.getGovernanceReportUrl('csv')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
                >
                  <Download className="w-4 h-4" />
                  Export Comprehensive CSV Report
                </a>
                <a
                  href={api.getGovernanceReportUrl('json')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export Structured JSON Report
                </a>
              </div>
            </div>
          )}
        </div>

      {/* POLICY VERSION HISTORY MODAL */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold">{selectedPolicy.id}</span>
                <h3 className="text-lg font-bold text-white">Immutable Policy Version History</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical evaluations retain their version snapshot without rewriting provenance.
                </p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Current Version */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-indigo-700/60 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Current Active Version (v{selectedPolicy.version})</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400">ACTIVE</span>
                </div>
                <div className="text-slate-400">{selectedPolicy.description}</div>
                <div className="text-[11px] text-slate-500 pt-1">Decision: {selectedPolicy.decision} • Risk: {selectedPolicy.risk_tier}</div>
              </div>

              {/* Historical Snapshots */}
              {policyHistory.length > 0 ? (
                policyHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-300">Historical Snapshot: v{h.version}</span>
                      <span className="text-slate-500 text-[11px]">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400">{h.description}</div>
                    <div className="text-[11px] text-indigo-400 pt-1">
                      Reason: {h.change_reason || 'Archived on update'} • Changed by: {h.changed_by}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-4">
                  No prior version transitions recorded. Policy is at initial release (v{selectedPolicy.version}).
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
