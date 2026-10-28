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
    <div className="flex flex-col min-h-full bg-[#1A1D20] text-[#A0A5AD]">
      <Header
        title="Autonomous Security Governance"
        subtitle="End-to-end evidence provenance, immutable policy versioning, and system-wide assurance"
        onRefresh={fetchOverview}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Bar */}
        <div className="p-3.5 rounded-xl bg-[#2D3238] border border-[#414850] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#A0A5AD]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-extrabold bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#A0A5AD]/70 hidden md:inline">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canManageGovernance ? 'text-[#00FA9A] font-bold' : 'text-[#A0A5AD]/50'}>
              {permissions.canManageGovernance ? '✓ Provenance Authorization' : '✗ Audit Review Mode'}
            </span>
            <span className={permissions.canExportReports ? 'text-[#00FA9A] font-bold' : 'text-[#A0A5AD]/50'}>
              {permissions.canExportReports ? '✓ Export Compliance Evidence' : '✗ Export Restricted'}
            </span>
          </div>
        </div>

        {/* Top Governance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#2D3238] border border-[#414850] rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#A0A5AD] uppercase tracking-wider">Cryptographic Assurance</span>
                <span className="p-1.5 rounded-md bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {summary?.cryptographic_integrity_rate ?? 100}%
                </span>
                <span className="text-xs text-[#00FA9A] font-bold">Intact Evidence</span>
              </div>
              <div className="mt-3 text-xs text-[#A0A5AD]">
                Deterministic SHA-256 canonical validation
              </div>
            </div>

            <div className="bg-[#2D3238] border border-[#414850] rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#A0A5AD] uppercase tracking-wider">Blockchain Anchoring</span>
                <span className="p-1.5 rounded-md bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {summary?.blockchain_anchored_rate ?? 0}%
                </span>
                <span className="text-xs text-[#38BDF8] font-bold">EVM Anchored</span>
              </div>
              <div className="mt-3 text-xs text-[#A0A5AD]">
                Audited against EVM smart contract
              </div>
            </div>

            <div className="bg-[#2D3238] border border-[#414850] rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#A0A5AD] uppercase tracking-wider">Active Policies & Versions</span>
                <span className="p-1.5 rounded-md bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{summary?.total_policies ?? 7}</span>
                <span className="text-xs text-[#00FA9A] font-bold">Active Policies</span>
              </div>
              <div className="mt-3 text-xs text-[#A0A5AD]">
                {summary?.total_policy_versions ?? 0} immutable historical version snapshots
              </div>
            </div>

            <div className="bg-[#2D3238] border border-[#414850] rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#A0A5AD] uppercase tracking-wider">Contained Agent Fleet</span>
                <span className="p-1.5 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                  <Shield className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{summary?.quarantined_agents ?? 0}</span>
                <span className="text-xs text-[#F59E0B] font-bold">Quarantined</span>
              </div>
              <div className="mt-3 text-xs text-[#A0A5AD]">
                {summary?.open_incidents ?? 0} open incidents under investigation
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-[#414850] flex gap-6">
            <button
              onClick={() => setActiveTab('provenance')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'provenance'
                  ? 'border-[#00FA9A] text-[#00FA9A]'
                  : 'border-transparent text-[#A0A5AD] hover:text-[#FFFFFF]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Evidence Provenance Inspector
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'policies'
                  ? 'border-[#00FA9A] text-[#00FA9A]'
                  : 'border-transparent text-[#A0A5AD] hover:text-[#FFFFFF]'
              }`}
            >
              <History className="w-4 h-4" />
              Policy Version Provenance ({policies.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'border-[#00FA9A] text-[#00FA9A]'
                  : 'border-transparent text-[#A0A5AD] hover:text-[#FFFFFF]'
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
              <div className="bg-[#2D3238] p-4 rounded-xl border border-[#414850] flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#A0A5AD]" />
                  <input
                    type="text"
                    placeholder="Enter Audit Event ID (e.g. evt_...) or pick a recent action below..."
                    value={searchEventId}
                    onChange={(e) => setSearchEventId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#1A1D20] border border-[#414850] rounded-lg text-sm text-white focus:outline-none focus:border-[#00FA9A] font-mono"
                  />
                </div>
                <button
                  onClick={() => handleInspect(searchEventId)}
                  disabled={inspecting}
                  className="px-4 py-2 bg-[#00FA9A] hover:bg-[#00FA9A]/90 text-[#1A1D20] rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  {inspecting ? 'Resolving...' : 'Inspect Provenance'}
                </button>
              </div>

              {/* Recent Actions Quick Select */}
              {summary?.recent_governance_actions && summary.recent_governance_actions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#A0A5AD] font-bold">Recent Actions:</span>
                  {summary.recent_governance_actions.map((act) => (
                    <button
                      key={act.event_id}
                      onClick={() => handleInspect(act.event_id)}
                      className={`px-2.5 py-1 rounded-md font-mono transition border ${
                        searchEventId === act.event_id
                          ? 'bg-[#00FA9A]/15 text-[#00FA9A] border-[#00FA9A]/40 font-bold'
                          : 'bg-[#1A1D20] text-[#A0A5AD] border-[#414850] hover:text-[#FFFFFF]'
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
                <div className="bg-[#2D3238] border border-[#414850] rounded-xl p-6 space-y-6 shadow-sm">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-5 border-b border-[#414850]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{explanation.event_id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                          explanation.policy_decision === 'ALLOW'
                            ? 'bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30'
                            : explanation.policy_decision === 'BLOCK'
                            ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                        }`}>
                          {explanation.policy_decision}
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A5AD] mt-1">{explanation.decision_reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        explanation.provenance_chain_complete
                          ? 'bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30'
                          : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                      }`}>
                        {explanation.provenance_chain_complete ? '✓ Provenance Chain Verified' : '⚠ Incomplete / Tampered'}
                      </span>
                    </div>
                  </div>

                  {/* Provenance Chain Step Progression */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {/* Step 1: Request */}
                    <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#414850] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#A0A5AD]/70 tracking-wider">Step 1: Origin</span>
                      <div className="font-bold text-white">{explanation.agent_name}</div>
                      <div className="text-[#A0A5AD] font-mono text-[11px] truncate">{explanation.agent_id}</div>
                      <div className="pt-2 border-t border-[#414850]/80 text-[#A0A5AD]">
                        Risk Tier: <span className="font-bold text-white">{explanation.agent_behavioral_risk_tier}</span>
                      </div>
                    </div>

                    {/* Step 2: Policy Engine */}
                    <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#414850] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#A0A5AD]/70 tracking-wider">Step 2: Policy Rule</span>
                      <div className="font-bold text-white font-mono">{explanation.policy_id}</div>
                      <div className="text-[#00FA9A] font-mono text-[11px] font-bold">v{explanation.policy_version}</div>
                      <div className="pt-2 border-t border-[#414850]/80 text-[#A0A5AD]">
                        Derived: <span className="font-bold text-white">{explanation.derived_risk_level}</span>
                      </div>
                    </div>

                    {/* Step 3: Local Cryptographic Hash */}
                    <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#414850] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#A0A5AD]/70 tracking-wider">Step 3: SHA-256 Hash</span>
                      <div className="font-bold text-white">Canonical Digest</div>
                      <div className="font-mono text-[11px] text-[#A0A5AD] truncate">{explanation.integrity_hash}</div>
                      <div className="pt-2 border-t border-[#414850]/80">
                        Status: <span className={`font-bold ${
                          explanation.local_verification_status === 'INTACT' ? 'text-[#00FA9A]' : 'text-[#EF4444]'
                        }`}>{explanation.local_verification_status}</span>
                      </div>
                    </div>

                    {/* Step 4: EVM Ledger */}
                    <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#414850] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#A0A5AD]/70 tracking-wider">Step 4: Blockchain Anchor</span>
                      <div className="font-bold text-white">EVM State</div>
                      <div className="font-mono text-[11px] text-[#A0A5AD] truncate">
                        {explanation.transaction_hash || 'Unanchored'}
                      </div>
                      <div className="pt-2 border-t border-[#414850]/80">
                        Ledger: <span className="font-bold text-[#00FA9A]">{explanation.blockchain_verification_status}</span>
                      </div>
                    </div>

                    {/* Step 5: Incident Correlation */}
                    <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#414850] text-xs space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#A0A5AD]/70 tracking-wider">Step 5: Threat Correlation</span>
                      <div className="font-bold text-white">
                        {explanation.related_incidents?.length || 0} Incident(s)
                      </div>
                      <div className="text-[#A0A5AD] text-[11px]">
                        {explanation.related_findings?.length || 0} Behavioral Finding(s)
                      </div>
                      <div className="pt-2 border-t border-[#414850]/80 text-[#A0A5AD]">
                        Approval: <span className="font-bold text-white">{explanation.approval_status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclosures & Details */}
                  <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#00FA9A]/30 text-xs text-[#A0A5AD] flex gap-3">
                    <Info className="w-5 h-5 text-[#00FA9A] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#00FA9A] block mb-1 font-bold">Assurance Disclosure:</strong>
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
              <div className="bg-[#2D3238] border border-[#414850] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto responsive-table-wrapper">
                  <table className="w-full text-left text-sm min-w-[650px]">
                  <thead className="bg-[#1A1D20] text-[#A0A5AD] text-xs uppercase font-bold border-b border-[#414850]">
                    <tr>
                      <th className="px-5 py-3.5">Policy ID</th>
                      <th className="px-5 py-3.5">Name & Description</th>
                      <th className="px-5 py-3.5">Version</th>
                      <th className="px-5 py-3.5">Decision</th>
                      <th className="px-5 py-3.5">Risk Tier</th>
                      <th className="px-5 py-3.5 text-right">Provenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#414850]">
                    {policies.map((p) => (
                      <tr key={p.id} className="hover:bg-[#353B42] transition-colors duration-150">
                        <td className="px-5 py-3.5 font-mono text-xs text-[#00FA9A] font-bold whitespace-nowrap">
                          {p.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-xs text-[#A0A5AD] mt-0.5">{p.description}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-white whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#1A1D20] border border-[#414850] font-bold">
                            v{p.version}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            p.decision === 'ALLOW' ? 'bg-[#00FA9A]/15 text-[#00FA9A]' : p.decision === 'BLOCK' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
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
                            className="px-3 py-1.5 text-xs font-bold text-[#00FA9A] hover:bg-[#00FA9A]/10 rounded-lg transition border border-[#00FA9A]/30 flex items-center gap-1.5 ml-auto"
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
            <div className="bg-[#2D3238] border border-[#414850] rounded-xl p-6 space-y-5 shadow-sm max-w-2xl">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#00FA9A]" />
                  Export Governance & Provenance Assurance Reports
                </h3>
                <p className="text-xs text-[#A0A5AD] mt-1 leading-relaxed">
                  Generate signed audit reports with full cryptographic provenance chains, policy versions, integrity hashes, and transaction references. Formulas are neutralized against CSV injection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={api.getGovernanceReportUrl('csv')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#00FA9A] hover:bg-[#00FA9A]/90 text-[#1A1D20] text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Comprehensive CSV Report
                </a>
                <a
                  href={api.getGovernanceReportUrl('json')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#1A1D20] hover:bg-[#353B42] text-white border border-[#414850] text-xs font-bold rounded-lg transition flex items-center justify-center gap-2"
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
          <div className="bg-[#2D3238] border border-[#414850] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-[#00FA9A] font-bold">{selectedPolicy.id}</span>
                <h3 className="text-lg font-bold text-white">Immutable Policy Version History</h3>
                <p className="text-xs text-[#A0A5AD] mt-0.5">
                  Historical evaluations retain their version snapshot without rewriting provenance.
                </p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-[#A0A5AD] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Current Version */}
              <div className="p-3.5 bg-[#1A1D20] rounded-lg border border-[#00FA9A]/40 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Current Active Version (v{selectedPolicy.version})</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FA9A]/15 text-[#00FA9A]">ACTIVE</span>
                </div>
                <div className="text-[#A0A5AD]">{selectedPolicy.description}</div>
                <div className="text-[11px] text-[#A0A5AD]/70 pt-1">Decision: {selectedPolicy.decision} • Risk: {selectedPolicy.risk_tier}</div>
              </div>

              {/* Historical Snapshots */}
              {policyHistory.length > 0 ? (
                policyHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-[#1A1D20] rounded-lg border border-[#414850] text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">Historical Snapshot: v{h.version}</span>
                      <span className="text-[#A0A5AD] text-[11px]">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-[#A0A5AD]">{h.description}</div>
                    <div className="text-[11px] text-[#00FA9A] pt-1 font-mono">
                      Reason: {h.change_reason || 'Archived on update'} • Changed by: {h.changed_by}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#A0A5AD] text-center py-4">
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
