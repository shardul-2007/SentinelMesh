'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
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
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
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
    <div className="flex flex-col min-h-full bg-[#000000] text-[#D4D4D8]">
      <Header
        title="Autonomous Security Governance"
        subtitle="End-to-end evidence provenance, immutable policy versioning, and system-wide assurance"
        onRefresh={fetchOverview}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Bar */}
        <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#D4D4D8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-extrabold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#D4D4D8]/70 hidden md:inline">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canManageGovernance ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50'}>
              {permissions.canManageGovernance ? '✓ Provenance Authorization' : '✗ Audit Review Mode'}
            </span>
            <span className={permissions.canExportReports ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50'}>
              {permissions.canExportReports ? '✓ Export Compliance Evidence' : '✗ Export Restricted'}
            </span>
          </div>
        </div>

        {/* Top Governance KPI Cards with Yellow Background + Black Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Cryptographic Assurance</span>
                <span className="p-1 rounded-md bg-[#000000] text-[#FACC15]">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">
                  {summary?.cryptographic_integrity_rate ?? 100}%
                </span>
                <span className="text-xs text-[#1C1C1C] font-bold">Intact</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 text-[11px] text-[#1C1C1C] font-bold flex items-center justify-between">
                <span>Deterministic SHA-256</span>
                <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                  VALIDATED
                </span>
              </div>
            </div>

            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Blockchain Anchoring</span>
                <span className="p-1 rounded-md bg-[#000000] text-[#FACC15]">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">
                  {summary?.blockchain_anchored_rate ?? 0}%
                </span>
                <span className="text-xs text-[#1C1C1C] font-bold">Anchored</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 text-[11px] text-[#1C1C1C] font-bold flex items-center justify-between">
                <span>EVM Smart Contract</span>
                <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                  IMMUTABLE
                </span>
              </div>
            </div>

            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Active Policies &amp; Versions</span>
                <span className="p-1 rounded-md bg-[#000000] text-[#FACC15]">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">{summary?.total_policies ?? 7}</span>
                <span className="text-xs text-[#1C1C1C] font-bold">Active</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 text-[11px] text-[#1C1C1C] font-bold flex items-center justify-between">
                <span>{summary?.total_policy_versions ?? 0} snapshots</span>
                <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                  VERSIONED
                </span>
              </div>
            </div>

            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Contained Agent Fleet</span>
                <span className="p-1 rounded-md bg-[#EF4444] text-[#FFFFFF]">
                  <Shield className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">{summary?.quarantined_agents ?? 0}</span>
                <span className="text-xs text-[#1C1C1C] font-bold">Quarantined</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 text-[11px] text-[#1C1C1C] font-bold flex items-center justify-between">
                <span>{summary?.open_incidents ?? 0} open incidents</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                  (summary?.quarantined_agents ?? 0) > 0 ? 'bg-[#EF4444] text-[#FFFFFF]' : 'bg-[#000000] text-[#FACC15]'
                }`}>
                  {(summary?.quarantined_agents ?? 0) > 0 ? 'ISOLATED' : 'NOMINAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-[#27272A] flex gap-6">
            <button
              onClick={() => setActiveTab('provenance')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'provenance'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-[#D4D4D8] hover:text-[#FFFFFF]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Evidence Provenance Inspector
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'policies'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-[#D4D4D8] hover:text-[#FFFFFF]'
              }`}
            >
              <History className="w-4 h-4" />
              Policy Version Provenance ({policies.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-[#D4D4D8] hover:text-[#FFFFFF]'
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
              <div className="bg-[#121212] p-4 rounded-xl border border-[#27272A] flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#D4D4D8]" />
                  <input
                    type="text"
                    placeholder="Enter Audit Event ID (e.g. evt_...) or pick a recent action below..."
                    value={searchEventId}
                    onChange={(e) => setSearchEventId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#000000] border border-[#27272A] rounded-lg text-sm text-white focus:outline-none focus:border-[#FACC15] font-mono"
                  />
                </div>
                <button
                  onClick={() => handleInspect(searchEventId)}
                  disabled={inspecting}
                  className="px-4 py-2 bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000000] rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  {inspecting ? 'Resolving...' : 'Inspect Provenance'}
                </button>
              </div>

              {/* Recent Actions Quick Select */}
              {summary?.recent_governance_actions && summary.recent_governance_actions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#D4D4D8] font-bold">Recent Actions:</span>
                  {summary.recent_governance_actions.map((act) => (
                    <button
                      key={act.event_id}
                      onClick={() => handleInspect(act.event_id)}
                      className={`px-2.5 py-1 rounded-md font-mono transition border ${
                        searchEventId === act.event_id
                          ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/40 font-bold'
                          : 'bg-[#000000] text-[#D4D4D8] border-[#27272A] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {act.event_id} ({act.action_type})
                    </button>
                  ))}
                </div>
              )}

              {inspectError && (
                <div className="p-4 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] rounded-xl text-xs font-mono">
                  {inspectError}
                </div>
              )}

              {/* Provenance Chain Flow */}
              {explanation && (
                <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-5 border-b border-[#27272A]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{explanation.event_id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                          explanation.policy_decision === 'ALLOW'
                            ? 'bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30'
                            : explanation.policy_decision === 'BLOCK'
                            ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                        }`}>
                          {explanation.policy_decision}
                        </span>
                      </div>
                      <p className="text-xs text-[#D4D4D8] mt-1">{explanation.decision_reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        explanation.provenance_chain_complete
                          ? 'bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30'
                          : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                      }`}>
                        {explanation.provenance_chain_complete ? '✓ Provenance Chain Verified' : '⚠ Incomplete / Tampered'}
                      </span>
                    </div>
                  </div>

                  {/* Provenance Chain Step Progression */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {/* Step 1: Request */}
                    <div className="p-4 rounded-xl bg-[#000000] border border-[#27272A] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#D4D4D8]/70 tracking-wider">Step 1: Origin</span>
                      <div className="font-bold text-white">{explanation.agent_name}</div>
                      <div className="text-[#D4D4D8] font-mono text-[11px] truncate">{explanation.agent_id}</div>
                      <div className="pt-2 border-t border-[#27272A]/80 text-[#D4D4D8]">
                        Risk Tier: <span className="font-bold text-white">{explanation.agent_behavioral_risk_tier}</span>
                      </div>
                    </div>

                    {/* Step 2: Policy Engine */}
                    <div className="p-4 rounded-xl bg-[#000000] border border-[#27272A] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#D4D4D8]/70 tracking-wider">Step 2: Policy Rule</span>
                      <div className="font-bold text-white font-mono">{explanation.policy_id}</div>
                      <div className="text-[#FACC15] font-mono text-[11px] font-bold">v{explanation.policy_version}</div>
                      <div className="pt-2 border-t border-[#27272A]/80 text-[#D4D4D8]">
                        Derived: <span className="font-bold text-white">{explanation.derived_risk_level}</span>
                      </div>
                    </div>

                    {/* Step 3: Local Cryptographic Hash */}
                    <div className="p-4 rounded-xl bg-[#000000] border border-[#27272A] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#D4D4D8]/70 tracking-wider">Step 3: SHA-256 Hash</span>
                      <div className="font-bold text-white">Canonical Digest</div>
                      <div className="font-mono text-[11px] text-[#D4D4D8] truncate">{explanation.integrity_hash}</div>
                      <div className="pt-2 border-t border-[#27272A]/80">
                        Status: <span className={`font-bold ${
                          explanation.local_verification_status === 'INTACT' ? 'text-[#FACC15]' : 'text-[#EF4444]'
                        }`}>{explanation.local_verification_status}</span>
                      </div>
                    </div>

                    {/* Step 4: EVM Ledger */}
                    <div className="p-4 rounded-xl bg-[#000000] border border-[#27272A] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#D4D4D8]/70 tracking-wider">Step 4: Blockchain Anchor</span>
                      <div className="font-bold text-white">EVM State</div>
                      <div className="font-mono text-[11px] text-[#D4D4D8] truncate">
                        {explanation.transaction_hash || 'Unanchored'}
                      </div>
                      <div className="pt-2 border-t border-[#27272A]/80">
                        Ledger: <span className="font-bold text-[#FACC15]">{explanation.blockchain_verification_status}</span>
                      </div>
                    </div>

                    {/* Step 5: Incident Correlation */}
                    <div className="p-4 rounded-xl bg-[#000000] border border-[#27272A] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#D4D4D8]/70 tracking-wider">Step 5: Threat Correlation</span>
                      <div className="font-bold text-white">
                        {explanation.related_incidents?.length || 0} Incident(s)
                      </div>
                      <div className="text-[#D4D4D8] text-[11px]">
                        {explanation.related_findings?.length || 0} Behavioral Finding(s)
                      </div>
                      <div className="pt-2 border-t border-[#27272A]/80 text-[#D4D4D8]">
                        Approval: <span className="font-bold text-white">{explanation.approval_status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclosures & Details */}
                  <div className="p-4 rounded-xl bg-[#000000] border border-[#FACC15]/30 text-xs text-[#D4D4D8] flex gap-3">
                    <Info className="w-5 h-5 text-[#FACC15] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#FACC15] block mb-1 font-bold">Assurance Disclosure:</strong>
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
              <div className="bg-[#121212] border border-[#27272A] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto responsive-table-wrapper">
                  <table className="w-full text-left text-sm min-w-[650px]">
                  <thead className="bg-[#000000] text-[#D4D4D8] text-xs uppercase font-bold border-b border-[#27272A]">
                    <tr>
                      <th className="px-5 py-3.5">Policy ID</th>
                      <th className="px-5 py-3.5">Name & Description</th>
                      <th className="px-5 py-3.5">Version</th>
                      <th className="px-5 py-3.5">Decision</th>
                      <th className="px-5 py-3.5">Risk Tier</th>
                      <th className="px-5 py-3.5 text-right">Provenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {policies.map((p) => (
                      <tr key={p.id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                        <td className="px-5 py-3.5 font-mono text-xs text-[#FACC15] font-bold whitespace-nowrap">
                          {p.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-xs text-[#D4D4D8] mt-0.5">{p.description}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-white whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#000000] border border-[#27272A] font-bold">
                            v{p.version}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            p.decision === 'ALLOW' ? 'bg-[#FACC15]/15 text-[#FACC15]' : p.decision === 'BLOCK' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                          }`}>
                            {p.decision}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-white whitespace-nowrap font-bold">
                          {p.risk_tier}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenPolicyHistory(p)}
                            className="px-3 py-1.5 text-xs font-bold text-[#FACC15] hover:bg-[#FACC15]/10 rounded-lg transition border border-[#FACC15]/30 flex items-center gap-1.5 ml-auto"
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
          </div>
        )}

          {/* TAB 3: GOVERNANCE & COMPLIANCE REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 space-y-5 shadow-sm max-w-2xl">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#FACC15]" />
                  Export Governance & Provenance Assurance Reports
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed">
                  Generate signed audit reports with full cryptographic provenance chains, policy versions, integrity hashes, and transaction references. Formulas are neutralized against CSV injection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={api.getGovernanceReportUrl('csv')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000000] text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Comprehensive CSV Report
                </a>
                <a
                  href={api.getGovernanceReportUrl('json')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#000000] hover:bg-[#1C1C1C] text-white border border-[#27272A] text-xs font-bold rounded-lg transition flex items-center justify-center gap-2"
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
          <div className="bg-[#121212] border border-[#27272A] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-[#FACC15] font-bold">{selectedPolicy.id}</span>
                <h3 className="text-lg font-bold text-white">Immutable Policy Version History</h3>
                <p className="text-xs text-[#D4D4D8] mt-0.5">
                  Historical evaluations retain their version snapshot without rewriting provenance.
                </p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-[#D4D4D8] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Current Version */}
              <div className="p-3.5 bg-[#000000] rounded-lg border border-[#FACC15]/40 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Current Active Version (v{selectedPolicy.version})</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FACC15]/15 text-[#FACC15]">ACTIVE</span>
                </div>
                <div className="text-[#D4D4D8]">{selectedPolicy.description}</div>
                <div className="text-[11px] text-[#D4D4D8]/70 pt-1">Decision: {selectedPolicy.decision} • Risk: {selectedPolicy.risk_tier}</div>
              </div>

              {/* Historical Snapshots */}
              {policyHistory.length > 0 ? (
                policyHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-[#000000] rounded-lg border border-[#27272A] text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">Historical Snapshot: v{h.version}</span>
                      <span className="text-[#D4D4D8] text-[11px]">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-[#D4D4D8]">{h.description}</div>
                    <div className="text-[11px] text-[#FACC15] pt-1 font-mono">
                      Reason: {h.change_reason || 'Archived on update'} • Changed by: {h.changed_by}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#D4D4D8] text-center py-4">
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
