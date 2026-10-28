'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import {
  SecurityFinding,
  DetectionRule,
  AgentTrustProfile,
  ThreatAnalytics,
  LabScenarioResult,
  FindingSeverity,
  FindingStatus
} from '@/lib/types';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Play,
  RotateCcw,
  BookOpen,
  Users,
  Eye,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Lock,
  FileText
} from 'lucide-react';

export default function ThreatsPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
  const [activeTab, setActiveTab] = useState<'findings' | 'profiles' | 'lab' | 'rules'>('findings');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ThreatAnalytics | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [profiles, setProfiles] = useState<AgentTrustProfile[]>([]);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  
  // Filter states
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Finding Detail Modal
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Testing Lab states
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [labResult, setLabResult] = useState<LabScenarioResult | null>(null);
  const [labMessage, setLabMessage] = useState<string | null>(null);

  // Risk Score Explain Modal
  const [explainProfile, setExplainProfile] = useState<AgentTrustProfile | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsData, findingsData, profilesData, rulesData] = await Promise.all([
        api.getThreatAnalytics().catch(() => null),
        api.getFindings().catch(() => []),
        api.getAgentTrustProfiles().catch(() => []),
        api.getThreatRules().catch(() => [])
      ]);
      setAnalytics(analyticsData);
      setFindings(findingsData);
      setProfiles(profilesData);
      setRules(rulesData);
    } catch (err) {
      console.error('Failed to load threat intelligence data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunDetection = async () => {
    try {
      await api.runThreatDetection();
      await fetchData();
    } catch (err: any) {
      alert(`Detection run failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleOpenFinding = async (finding: SecurityFinding) => {
    setLoadingDetail(true);
    setSelectedFinding(finding);
    try {
      const detail = await api.getFindingDetail(finding.id);
      setSelectedFinding(detail);
    } catch (err) {
      console.error('Failed to load finding details', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (newStatus: FindingStatus) => {
    if (!selectedFinding) return;
    setUpdatingStatus(true);
    try {
      await api.updateFindingStatus(selectedFinding.id, newStatus, resolutionNotes || undefined);
      const updated = await api.getFindingDetail(selectedFinding.id);
      setSelectedFinding(updated);
      setResolutionNotes('');
      fetchData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Authorization failed'}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRunScenario = async (scenarioId: string) => {
    setRunningScenario(scenarioId);
    setLabMessage(null);
    try {
      const result = await api.runLabScenario(scenarioId);
      setLabResult(result);
      fetchData();
    } catch (err: any) {
      setLabMessage(`Error: ${err.message || 'Simulation execution failed'}`);
    } finally {
      setRunningScenario(null);
    }
  };

  const handleResetLab = async () => {
    try {
      await api.resetLab();
      setLabResult(null);
      setLabMessage('Simulation laboratory data successfully reset. Real audit evidence remained untouched.');
      fetchData();
    } catch (err: any) {
      setLabMessage(`Reset failed: ${err.message}`);
    }
  };

  // Filtered findings
  const filteredFindings = findings.filter(f => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.agent_id.toLowerCase().includes(q) ||
        f.rule_id.toLowerCase().includes(q) ||
        (f.finding_id && f.finding_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getSeverityBadge = (sev: FindingSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">LOW</span>;
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">Active</span>;
      case 'INVESTIGATING':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">Investigating</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">Resolved</span>;
      case 'FALSE_POSITIVE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#000000] text-[#D4D4D8] border border-[#27272A]">False Positive</span>;
    }
  };

  const getRiskTierBadge = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">CRITICAL RISK</span>;
      case 'ELEVATED':
        return <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">ELEVATED RISK</span>;
      case 'MODERATE':
        return <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">MODERATE RISK</span>;
      case 'LOW':
        return <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">LOW RISK</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#000000] text-[#D4D4D8] border border-[#27272A]">INSUFFICIENT DATA</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#000000] text-[#D4D4D8]">
      <Header
        title="Threat Intelligence Center"
        subtitle="Deterministic behavioral pattern detection, explainable risk scoring & simulation lab"
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Banner */}
        <div className="p-3.5 rounded-lg bg-[#121212] border border-[#27272A] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#D4D4D8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-extrabold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#D4D4D8]/70 hidden md:inline">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canVerifyHashes ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50'}>
              {permissions.canVerifyHashes ? '✓ Threat Analysis Active' : '✗ Read-Only Monitor'}
            </span>
            <span className={permissions.canResolveAlerts ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50'}>
              {permissions.canResolveAlerts ? '✓ Finding Remediation' : '✗ Resolution Gated'}
            </span>
          </div>
        </div>

        {/* Page Title & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15]">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    Security Intelligence & Threat Center
                  </h1>
                  <p className="text-sm text-[#D4D4D8]">
                    Deterministic behavioral pattern detection, explainable agent trust profiles, and simulation lab.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunDetection}
                disabled={!permissions.canVerifyHashes}
                title={permissions.canVerifyHashes ? 'Execute deterministic behavioral threat detection' : 'Auditor mode is read-only'}
                className="px-4 py-2 bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000000] rounded-lg text-sm font-extrabold transition flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{permissions.canVerifyHashes ? 'Run Threat Analysis' : 'Analysis (Auditor Read-Only)'}</span>
              </button>
            </div>
          </div>

          {/* Intelligence KPI Cards with Yellow Background + Black Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Active Threat Findings</span>
                <span className="p-1 rounded-md bg-[#EF4444] text-[#FFFFFF]">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">{analytics?.active_findings ?? 0}</span>
                <span className="text-xs text-[#1C1C1C] font-bold">active alerts</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 flex items-center justify-between text-xs font-bold text-[#1C1C1C]">
                <span className="font-mono text-[#000000]">{analytics?.findings_by_severity.CRITICAL ?? 0} Critical</span>
                <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                  ANOMALY
                </span>
              </div>
            </div>

            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Agents Under Review</span>
                <span className="p-1 rounded-md bg-[#000000] text-[#FACC15]">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">{analytics?.agents_under_review.length ?? 0}</span>
                <span className="text-xs text-[#1C1C1C] font-bold">flagged</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 text-[11px] text-[#1C1C1C] font-bold truncate">
                {analytics?.agents_under_review.length ? analytics.agents_under_review.join(', ') : 'All agents within baseline bounds'}
              </div>
            </div>

            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Registered Detectors</span>
                <span className="p-1 rounded-md bg-[#000000] text-[#FACC15]">
                  <Cpu className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">{rules.length || 6}</span>
                <span className="text-xs text-[#1C1C1C] font-bold">Rules</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 text-[11px] text-[#1C1C1C] font-bold flex items-center justify-between">
                <span>Deterministic</span>
                <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                  ACTIVE
                </span>
              </div>
            </div>

            <div className="bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[145px]">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-[#000000] uppercase tracking-wider">Investigation Resolution</span>
                <span className="p-1 rounded-md bg-[#000000] text-[#FACC15]">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#000000] font-mono">{analytics?.resolved_findings ?? 0}</span>
                <span className="text-xs text-[#1C1C1C] font-bold">cases</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#000000]/25 text-[11px] text-[#1C1C1C] font-bold flex items-center justify-between">
                <span>{analytics?.investigating_findings ?? 0} in progress</span>
                <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                  CLOSED
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-[#27272A] flex gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('findings')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'findings'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-[#D4D4D8] hover:text-[#FFFFFF]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Security Findings ({findings.length})
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'profiles'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-[#D4D4D8] hover:text-[#FFFFFF]'
              }`}
            >
              <Users className="w-4 h-4" />
              Agent Trust Profiles ({profiles.length})
            </button>
            <button
              onClick={() => setActiveTab('lab')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'lab'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-[#D4D4D8] hover:text-[#FFFFFF]'
              }`}
            >
              <Play className="w-4 h-4" />
              Explainable Testing Lab
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'border-[#FACC15] text-[#FACC15]'
                  : 'border-transparent text-[#D4D4D8] hover:text-[#FFFFFF]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Detection Rules Registry ({rules.length})
            </button>
          </div>

          {/* TAB 1: FINDINGS LIST */}
          {activeTab === 'findings' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-3 bg-[#121212] p-4 rounded-xl border border-[#27272A] shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#D4D4D8]" />
                  <input
                    type="text"
                    placeholder="Search findings by agent, rule, or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#000000] border border-[#27272A] rounded-lg text-sm text-white focus:outline-none focus:border-[#FACC15] transition"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#D4D4D8] font-bold">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Severity:</span>
                  </div>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-[#000000] border border-[#27272A] rounded-lg text-xs py-2 px-3 text-white focus:outline-none focus:border-[#FACC15] transition"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>

                  <div className="flex items-center gap-1.5 text-xs text-[#D4D4D8] font-bold">
                    <span>Status:</span>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#000000] border border-[#27272A] rounded-lg text-xs py-2 px-3 text-white focus:outline-none focus:border-[#FACC15] transition"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="FALSE_POSITIVE">False Positive</option>
                  </select>
                </div>
              </div>

              {/* Findings Table */}
              <div className="bg-[#121212] border border-[#27272A] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto responsive-table-wrapper">
                  <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-[#000000] text-[#D4D4D8] text-xs uppercase font-bold border-b border-[#27272A]">
                    <tr>
                      <th className="px-5 py-3.5">Severity</th>
                      <th className="px-5 py-3.5">Finding & Rule</th>
                      <th className="px-5 py-3.5">Agent</th>
                      <th className="px-5 py-3.5">Evidence</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Detected</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A] font-mono">
                    {filteredFindings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-[#D4D4D8] font-sans">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#FACC15]" />
                          No security findings match the current criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredFindings.map((f) => (
                        <tr key={f.id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {getSeverityBadge(f.severity)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-white">{f.title}</div>
                            <div className="text-xs text-[#FACC15] font-mono mt-0.5">{f.rule_id}</div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-[#FFFFFF]">
                            {f.agent_id}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#D4D4D8]">
                            <span className="px-2 py-0.5 rounded bg-[#000000] border border-[#27272A] text-[#FFFFFF] font-mono font-bold">
                              {f.evidence_event_ids?.length || 0} event(s)
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {getStatusBadge(f.status)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#D4D4D8] whitespace-nowrap">
                            {new Date(f.detected_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenFinding(f)}
                              className="px-3 py-1.5 text-xs font-bold text-[#FACC15] hover:bg-[#FACC15]/10 rounded-lg transition border border-[#FACC15]/30 flex items-center gap-1.5 ml-auto active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Investigate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* TAB 2: AGENT TRUST PROFILES */}
          {activeTab === 'profiles' && (
            <div className="space-y-6">
              {/* Architecture Disclaimer Alert */}
              <div className="bg-[#121212] border border-[#FACC15]/30 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-[#FACC15] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#D4D4D8] leading-relaxed">
                  <strong className="text-[#FACC15]">Deterministic Explainability:</strong> Agent risk indicators are computed using transparent, weighted heuristic formulas over persisted audit history. SentinelMesh explicitly separates <strong>Behavioral Risk</strong> (action violation patterns), <strong>Evidence Cryptographic Integrity</strong> (local SHA-256 verification), and <strong>Blockchain Anchoring</strong> (EVM contract state). Risk indicators do not automatically override policy engine decisions.
                </div>
              </div>

              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {profiles.map((p) => (
                  <div key={p.agent_id} className="bg-[#121212] border border-[#27272A] rounded-xl p-5 shadow-sm hover:border-[#FACC15]/50 transition-colors duration-200 flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-white text-base">{p.agent_name}</h3>
                          <span className="text-xs font-mono font-bold text-[#FACC15]">{p.agent_id}</span>
                        </div>
                        {getRiskTierBadge(p.risk_score_breakdown.risk_tier)}
                      </div>

                      {/* Score Gauge */}
                      <div className="mt-4 p-4 rounded-xl bg-[#000000] border border-[#27272A]">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-[#D4D4D8]">Behavioral Risk Index</span>
                          <span className="text-lg font-extrabold text-white">
                            {p.risk_score_breakdown.insufficient_data ? 'N/A' : `${p.risk_score_breakdown.risk_score}/100`}
                          </span>
                        </div>
                        <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              p.risk_score_breakdown.risk_score > 75
                                ? 'bg-[#EF4444]'
                                : p.risk_score_breakdown.risk_score > 50
                                ? 'bg-[#F59E0B]'
                                : p.risk_score_breakdown.risk_score > 25
                                ? 'bg-[#EF4444]'
                                : 'bg-[#FACC15]'
                            }`}
                            style={{ width: `${p.risk_score_breakdown.risk_score}%` }}
                          />
                        </div>
                        <div className="mt-2 text-right">
                          <button
                            onClick={() => setExplainProfile(p)}
                            className="text-xs text-[#FACC15] hover:underline font-bold inline-flex items-center gap-1"
                          >
                            Explain Score Breakdown <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 3 Orthogonal Status Pillars */}
                      <div className="mt-4 space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-[#27272A]/60">
                          <span className="text-[#D4D4D8] font-sans">Evidence Integrity:</span>
                          <span className={`font-bold ${
                            p.evidence_integrity_status === 'INTACT' ? 'text-[#FACC15]' : 'text-[#EF4444]'
                          }`}>
                            {p.evidence_integrity_status}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#27272A]/60">
                          <span className="text-[#D4D4D8] font-sans">Blockchain Ledger:</span>
                          <span className={`font-bold ${
                            p.blockchain_anchoring_status === 'ANCHORED_AND_VERIFIED' ? 'text-[#FACC15]' : 'text-[#D4D4D8]'
                          }`}>
                            {p.blockchain_anchoring_status}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#D4D4D8] font-sans">Total Evaluated Actions:</span>
                          <span className="font-bold text-white">{p.total_actions}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#27272A] flex justify-between items-center text-xs text-[#D4D4D8] font-mono">
                      <span>Violations: {p.violations_count}</span>
                      <span>Active Findings: {p.active_findings_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXPLAINABLE TESTING LAB */}
          {activeTab === 'lab' && (
            <div className="space-y-6">
              {/* Lab Banner */}
              <div className="bg-[#121212] border border-[#27272A] rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#FACC15]" />
                    Interactive Threat Detection & Negative Control Lab
                  </h3>
                  <p className="text-xs text-[#D4D4D8] mt-1">
                    Execute isolated simulation scenarios to verify detection accuracy, rule boundary triggers, and negative controls.
                  </p>
                </div>
                <button
                  onClick={handleResetLab}
                  className="px-3.5 py-1.5 bg-[#000000] hover:bg-[#1C1C1C] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-[#27272A]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Lab Data
                </button>
              </div>

              {labMessage && (
                <div className="p-3.5 rounded-lg bg-[#121212] border border-[#F59E0B]/40 text-[#F59E0B] text-xs">
                  {labMessage}
                </div>
              )}

              {/* Scenario Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Scenario 1: Benign Normal (Negative Control) */}
                <div className="bg-[#121212] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#FACC15] uppercase tracking-wide">Negative Control</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 font-bold">
                        0 Findings Expected
                      </span>
                    </div>
                    <h4 className="font-bold text-white mt-2">Benign Operational Activity</h4>
                    <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed">
                       Simulates 4 legitimate read operations. Confirms that normal compliant agent activity produces zero false-positive findings.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunScenario('SCENARIO_NORMAL')}
                    disabled={runningScenario !== null}
                    className="mt-4 w-full py-2 bg-[#000000] hover:bg-[#1C1C1C] text-[#FACC15] text-xs font-bold rounded-lg transition border border-[#27272A] flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {runningScenario === 'SCENARIO_NORMAL' ? 'Running...' : 'Run Scenario'}
                  </button>
                </div>

                {/* Scenario 2: Repeated Blocked */}
                <div className="bg-[#121212] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wide">Rule Trigger</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-bold">
                        RULE-REP-BLK-01
                      </span>
                    </div>
                    <h4 className="font-bold text-white mt-2">Repeated Blocked Probing</h4>
                    <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed">
                      Simulates 3 consecutive unauthorized actions against internal user records resulting in policy BLOCK decisions.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunScenario('SCENARIO_REPEATED_BLOCKED')}
                    disabled={runningScenario !== null}
                    className="mt-4 w-full py-2 bg-[#000000] hover:bg-[#1C1C1C] text-[#F59E0B] text-xs font-bold rounded-lg transition border border-[#27272A] flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {runningScenario === 'SCENARIO_REPEATED_BLOCKED' ? 'Running...' : 'Run Scenario'}
                  </button>
                </div>

                {/* Scenario 3: Velocity Burst */}
                <div className="bg-[#121212] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wide">Velocity Spike</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-bold">
                        RULE-HIGH-FREQ-02
                      </span>
                    </div>
                    <h4 className="font-bold text-white mt-2">Action Velocity Burst</h4>
                    <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed">
                      Simulates 9 rapid operations executed in under 20 seconds, testing automated runaway loop detection.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunScenario('SCENARIO_VELOCITY_BURST')}
                    disabled={runningScenario !== null}
                    className="mt-4 w-full py-2 bg-[#000000] hover:bg-[#1C1C1C] text-[#F59E0B] text-xs font-bold rounded-lg transition border border-[#27272A] flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {runningScenario === 'SCENARIO_VELOCITY_BURST' ? 'Running...' : 'Run Scenario'}
                  </button>
                </div>

                {/* Scenario 4: Policy Violations */}
                <div className="bg-[#121212] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wide">Multi-Policy</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold">
                        RULE-POL-VIOL-03
                      </span>
                    </div>
                    <h4 className="font-bold text-white mt-2">Multi-Policy Violations</h4>
                    <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed">
                      Simulates probing across 3 distinct restricted policies (production configs, auth tokens, kernel debug).
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunScenario('SCENARIO_POLICY_VIOLATIONS')}
                    disabled={runningScenario !== null}
                    className="mt-4 w-full py-2 bg-[#000000] hover:bg-[#1C1C1C] text-[#EF4444] text-xs font-bold rounded-lg transition border border-[#27272A] flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {runningScenario === 'SCENARIO_POLICY_VIOLATIONS' ? 'Running...' : 'Run Scenario'}
                  </button>
                </div>

                {/* Scenario 5: Cryptographic Tamper */}
                <div className="bg-[#121212] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wide">Integrity Discrepancy</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold">
                        RULE-INTEG-FAIL-06
                      </span>
                    </div>
                    <h4 className="font-bold text-white mt-2">Cryptographic Tamper Alert</h4>
                    <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed">
                      Injects an isolated verification hash mismatch on a disposable test record, triggering immediate forensic review.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunScenario('SCENARIO_INTEGRITY_TAMPER')}
                    disabled={runningScenario !== null}
                    className="mt-4 w-full py-2 bg-[#000000] hover:bg-[#1C1C1C] text-[#EF4444] text-xs font-bold rounded-lg transition border border-[#27272A] flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {runningScenario === 'SCENARIO_INTEGRITY_TAMPER' ? 'Running...' : 'Run Scenario'}
                  </button>
                </div>
              </div>

              {/* Lab Execution Result Output */}
              {labResult && (
                <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-[#FACC15] uppercase tracking-wide">Simulation Execution Output</span>
                      <h3 className="font-bold text-white text-lg mt-0.5">{labResult.scenario_name}</h3>
                      <p className="text-xs text-[#D4D4D8] mt-1">{labResult.explanation}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/40">
                      {labResult.findings_triggered} Findings Triggered
                    </span>
                  </div>

                  {labResult.findings.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {labResult.findings.map((f) => (
                        <div key={f.id} className="p-4 rounded-lg bg-[#000000] border border-[#27272A] text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{f.title}</span>
                            {getSeverityBadge(f.severity)}
                          </div>
                          <p className="text-[#D4D4D8]">{f.description}</p>
                          <div className="text-[#D4D4D8] pt-1">
                            <strong className="text-white">Recommended Action:</strong> {f.recommended_action}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RULES REGISTRY */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="bg-[#121212] border border-[#27272A] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#000000] text-[#D4D4D8] text-xs uppercase font-bold border-b border-[#27272A]">
                    <tr>
                      <th className="px-5 py-3.5">Rule ID</th>
                      <th className="px-5 py-3.5">Name</th>
                      <th className="px-5 py-3.5">Severity</th>
                      <th className="px-5 py-3.5">Window</th>
                      <th className="px-5 py-3.5">Threshold</th>
                      <th className="px-5 py-3.5">Recommended Operator Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {rules.map((r) => (
                      <tr key={r.rule_id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#FACC15] whitespace-nowrap">
                          {r.rule_id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-white">{r.name}</div>
                          <div className="text-xs text-[#D4D4D8] mt-0.5">{r.description}</div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {getSeverityBadge(r.severity)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-white whitespace-nowrap">
                          {r.window_minutes} min
                        </td>
                        <td className="px-5 py-3.5 text-xs text-white whitespace-nowrap font-mono">
                          {r.threshold} {r.threshold === 1 ? 'event' : 'events'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#D4D4D8]">
                          {r.recommended_action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      {/* FINDING DETAIL & INVESTIGATION MODAL */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-[#27272A] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getSeverityBadge(selectedFinding.severity)}
                  <span className="text-xs font-mono font-bold text-[#FACC15]">{selectedFinding.rule_id}</span>
                  {getStatusBadge(selectedFinding.status)}
                </div>
                <h3 className="text-lg font-bold text-white">{selectedFinding.title}</h3>
                <span className="text-xs text-[#D4D4D8] font-mono">ID: {selectedFinding.finding_id}</span>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-[#D4D4D8] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Description & Recommendation */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#000000] rounded-lg border border-[#27272A]">
                <span className="font-bold text-white block mb-1">Explanation of Finding:</span>
                <p className="text-[#D4D4D8] leading-relaxed">{selectedFinding.description}</p>
              </div>

              <div className="p-3.5 bg-[#000000] rounded-lg border border-[#27272A]">
                <span className="font-bold text-white block mb-1">Recommended Investigation Step:</span>
                <p className="text-[#FACC15] leading-relaxed">{selectedFinding.recommended_action}</p>
              </div>
            </div>

            {/* Linked Audit Evidence Events */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Traceable Audit Evidence Events ({selectedFinding.evidence_event_ids?.length || 0})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFinding.evidence_events && selectedFinding.evidence_events.length > 0 ? (
                  selectedFinding.evidence_events.map((evt) => (
                    <div key={evt.id} className="p-2.5 rounded bg-[#000000] border border-[#27272A] text-xs flex justify-between items-center">
                      <div>
                        <span className="font-mono text-[#FACC15] font-bold mr-2">{evt.action_type}</span>
                        <span className="text-[#D4D4D8]">{evt.resource}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        evt.policy_decision === 'BLOCK' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#FACC15]/15 text-[#FACC15]'
                      }`}>
                        {evt.policy_decision}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#D4D4D8] font-mono p-2 bg-[#000000] rounded border border-[#27272A]">
                    Evidence Event IDs: {selectedFinding.evidence_event_ids?.join(', ') || 'None'}
                  </div>
                )}
              </div>
            </div>

            {/* Investigation Status Transition Actions */}
            <div className="p-4 bg-[#000000] rounded-lg border border-[#27272A] space-y-3">
              <span className="text-xs font-bold text-white block">Operator Investigation Workflow:</span>
              <input
                type="text"
                placeholder="Add optional analyst notes (e.g. reviewed prompt tokens, isolated agent)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-[#27272A] rounded-lg text-xs text-white focus:outline-none focus:border-[#FACC15]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange('INVESTIGATING')}
                  disabled={updatingStatus || role === 'VIEWER'}
                  title={role !== 'VIEWER' ? 'Mark investigating' : 'Auditor mode is read-only'}
                  className="px-3 py-1.5 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40 text-xs font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Mark Investigating
                </button>
                <button
                  onClick={() => handleStatusChange('RESOLVED')}
                  disabled={updatingStatus || !permissions.canResolveAlerts}
                  title={permissions.canResolveAlerts ? 'Mark resolved' : 'Admin (CSO) role required to resolve finding'}
                  className="px-3 py-1.5 bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000000] text-xs font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Mark Resolved (CSO)
                </button>
                <button
                  onClick={() => handleStatusChange('FALSE_POSITIVE')}
                  disabled={updatingStatus || role === 'VIEWER'}
                  title={role !== 'VIEWER' ? 'Mark false positive' : 'Auditor mode is read-only'}
                  className="px-3 py-1.5 bg-[#121212] hover:bg-[#1C1C1C] text-[#D4D4D8] border border-[#27272A] text-xs font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Mark False Positive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RISK SCORE EXPLAIN MODAL */}
      {explainProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272A] rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold text-[#FACC15]">{explainProfile.agent_id}</span>
                <h3 className="text-lg font-bold text-white">Risk Score Formula Breakdown</h3>
              </div>
              <button
                onClick={() => setExplainProfile(null)}
                className="text-[#D4D4D8] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#000000] border border-[#FACC15]/30 rounded-lg text-xs text-[#D4D4D8]">
              {explainProfile.risk_score_breakdown.formula_disclaimer}
            </div>

            {/* Factor Table */}
            <div className="space-y-2.5">
              {explainProfile.risk_score_breakdown.factors.map((f, i) => (
                <div key={i} className="p-3 bg-[#000000] rounded-lg border border-[#27272A] text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{f.factor_name}</span>
                    <span className="text-[#D4D4D8]">{f.description}</span>
                    <span className="text-[#D4D4D8]/70 block text-[11px] mt-0.5 font-mono">Observed: {f.raw_metric}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#FACC15] text-sm">+{f.points_contributed} pts</span>
                    <span className="text-[#D4D4D8]/70 block text-[10px] font-mono">max {f.max_points}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#27272A] flex justify-between items-center">
              <span className="text-xs font-bold text-[#D4D4D8]">Total Computed Risk Score:</span>
              <span className="text-xl font-black text-white">
                {explainProfile.risk_score_breakdown.risk_score} / 100
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
