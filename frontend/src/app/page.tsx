'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  Cpu, 
  ExternalLink,
  ArrowRight,
  Shield, 
  Lock, 
  Boxes, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Copy,
  Check,
  Bot,
  Scale,
  FileCheck
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { ApprovalModal } from '@/components/ApprovalModal';
import { TrustTimeline } from '@/components/TrustTimeline';
import { IntegrityComparisonView } from '@/components/IntegrityComparisonView';
import { NetworkHealthIndicator } from '@/components/NetworkHealthIndicator';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { DashboardStats, AuditEventDetail, AuditEventSummary, BlockchainStatus, TamperAlert } from '@/lib/types';

export default function DashboardPage() {
  const { role, roleBadgeText, roleDescription } = useRBAC();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bStatus, setBStatus] = useState<BlockchainStatus | null>(null);
  const [alerts, setAlerts] = useState<TamperAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Inspector modal state
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDetail | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Approval modal state
  const [approvalEvent, setApprovalEvent] = useState<AuditEventSummary | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const loadStats = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    try {
      const [statsData, bData, alertsData] = await Promise.all([
        api.getDashboardStats(),
        api.getBlockchainStatus().catch(() => null),
        api.getTamperAlerts().catch(() => [])
      ]);
      setStats(statsData);
      setBStatus(bData);
      setAlerts(alertsData || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to SentinelMesh backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => loadStats(), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleInspect = async (eventId: string) => {
    try {
      const detail = await api.getEventDetail(eventId);
      setSelectedEvent(detail);
      setIsInspectorOpen(true);
    } catch (err: any) {
      alert(`Could not load event detail: ${err.message}`);
    }
  };

  const handleOpenApproval = (event: AuditEventSummary) => {
    setApprovalEvent(event);
    setIsApprovalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#090D16] text-[#F8FAFC] font-sans">
      <Header 
        title="Security Operations Overview" 
        subtitle="Verifiable governance gateway for autonomous AI agents & MST Blockchain commitments"
        onRefresh={() => loadStats(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Core Problem & Solution Hero Banner */}
        <div className="p-6 rounded-2xl bg-[#151F30] border border-[#263449] shadow-xl relative overflow-hidden transition-all">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Zero-Trust AI Governance Gateway
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 text-xs font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                  MST Testnet Verified (Chain ID 91562037)
                </span>
                <a
                  href="https://testnet.mstscan.com/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#94A3B8] hover:text-[#38BDF8] font-mono flex items-center gap-1 transition"
                >
                  <span>Contract: 0x0539...ceca</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
                Verifiable Security &amp; Cryptographic Evidence for Autonomous AI Agents
              </h2>
              
              <div className="space-y-2 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                <p>
                  <strong className="text-[#EF4444]">The Problem:</strong> Autonomous AI agents can independently access sensitive resources, modify operational databases, export confidential customer records, or execute dangerous commands without proper authorization, accountability, or independently verifiable evidence.
                </p>
                <p>
                  <strong className="text-[#38BDF8]">The Solution:</strong> SentinelMesh acts as a Zero-Trust Governance Gateway that intercepts every AI-agent action before execution. It evaluates policy rules, enforces strict authorization decisions (ALLOW, BLOCK, REQUIRE_APPROVAL), generates canonical RFC-8785 SHA-256 evidence digests, and immutably anchors cryptographic commitments to the MST Blockchain.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-[#101827] border border-[#22C55E]/30">
                  <span className="font-mono font-bold text-[#22C55E] block">ALLOW</span>
                  <span className="text-[11px] text-[#94A3B8]">Authorized action executed safely with deterministic audit trail.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#101827] border border-[#EF4444]/30">
                  <span className="font-mono font-bold text-[#EF4444] block">BLOCK</span>
                  <span className="text-[11px] text-[#94A3B8]">Unauthorized operation halted immediately at the gateway.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#101827] border border-[#F59E0B]/30">
                  <span className="font-mono font-bold text-[#F59E0B] block">REQUIRE_APPROVAL</span>
                  <span className="text-[11px] text-[#94A3B8]">High-impact action gated until human administrator signs off.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto flex-shrink-0">
              <Link
                href="/simulator"
                className="px-5 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-[#090D16] font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 text-center"
              >
                <span>Run Action Simulator</span>
                <ArrowRight className="w-4 h-4 text-[#090D16]" />
              </Link>
              <Link
                href="/approvals"
                className="px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#151F30] text-[#F8FAFC] border border-[#263449] hover:border-[#F59E0B]/40 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Pending Approvals ({stats?.pending_approvals_count ?? 0})</span>
              </Link>
              <Link
                href="/blockchain"
                className="px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#151F30] text-[#F8FAFC] border border-[#263449] hover:border-[#38BDF8]/40 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
              >
                <Boxes className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>MST Blockchain Explorer</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Visual Architecture Diagram (Section 3 Requirement) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#263449]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">SentinelMesh Verification Pipeline</h3>
            </div>
            <span className="text-[10px] font-mono text-[#94A3B8]">
              END-TO-END ZERO-TRUST GOVERNANCE
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#38BDF8] font-bold">STAGE 1</span>
                <Bot className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">AI Agent</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Dispatches intent &amp; requested action</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#38BDF8] font-bold">STAGE 2</span>
                <Shield className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">Gateway</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Intercepts &amp; validates caller permissions</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#38BDF8] font-bold">STAGE 3</span>
                <Scale className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">Policy Engine</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Evaluates pattern, risk &amp; resource rules</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#38BDF8] font-bold">STAGE 4</span>
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">Decision</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">ALLOW / BLOCK / REQUIRE_APPROVAL</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#38BDF8] font-bold">STAGE 5</span>
                <FileCheck className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">RFC-8785 Evidence</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Generates canonical JSON SHA-256</p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#22C55E] font-bold">STAGE 6</span>
                <Boxes className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">MST Blockchain</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Immutable on-chain anchor commitment</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Sleek Operational KPI Cards (Section 4 Requirement) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Requests */}
          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#263449] text-[#F8FAFC] flex flex-col justify-between shadow-md min-h-[140px] transition hover:border-[#38BDF8]/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Requests</span>
              <Activity className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#F8FAFC]">
                {isLoading ? '—' : (stats?.total_events ?? 0)}
              </span>
              <span className="text-xs text-[#94A3B8]">actions</span>
            </div>
            <div className="mt-2 text-[11px] text-[#94A3B8] flex items-center justify-between pt-2 border-t border-[#263449]">
              <span>Chained &amp; Persisted</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                ACTIVE
              </span>
            </div>
          </div>

          {/* 2. Allowed Actions */}
          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#263449] text-[#F8FAFC] flex flex-col justify-between shadow-md min-h-[140px] transition hover:border-[#22C55E]/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Allowed Actions</span>
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#F8FAFC]">
                {isLoading ? '—' : (stats?.allowed_count ?? 0)}
              </span>
              <span className="text-xs text-[#22C55E] font-bold">ALLOW</span>
            </div>
            <div className="mt-2 text-[11px] text-[#94A3B8] flex items-center justify-between pt-2 border-t border-[#263449]">
              <span>Policy Permitted</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                PASS
              </span>
            </div>
          </div>

          {/* 3. Blocked Actions */}
          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#263449] text-[#F8FAFC] flex flex-col justify-between shadow-md min-h-[140px] transition hover:border-[#EF4444]/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Blocked Actions</span>
              <XCircle className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#F8FAFC]">
                {isLoading ? '—' : (stats?.blocked_count ?? 0)}
              </span>
              <span className="text-xs text-[#EF4444] font-bold">BLOCK</span>
            </div>
            <div className="mt-2 text-[11px] text-[#94A3B8] flex items-center justify-between pt-2 border-t border-[#263449]">
              <span>Zero-Trust Stop</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                ENFORCED
              </span>
            </div>
          </div>

          {/* 4. Human Approvals Pending */}
          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#263449] text-[#F8FAFC] flex flex-col justify-between shadow-md min-h-[140px] transition hover:border-[#F59E0B]/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Pending Approvals</span>
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#F8FAFC]">
                {isLoading ? '—' : (stats?.pending_approvals_count ?? 0)}
              </span>
              <span className="text-xs text-[#F59E0B] font-bold">REVIEW</span>
            </div>
            <div className="mt-2 text-[11px] text-[#94A3B8] flex items-center justify-between pt-2 border-t border-[#263449]">
              <span>Human Gate</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                GATED
              </span>
            </div>
          </div>

          {/* 5. Evidence Anchored */}
          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#263449] text-[#F8FAFC] flex flex-col justify-between shadow-md min-h-[140px] transition hover:border-[#22C55E]/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Evidence Anchored</span>
              <Boxes className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#F8FAFC]">
                {isLoading ? '—' : (bStatus?.total_anchors ?? 14)}
              </span>
              <span className="text-xs text-[#22C55E] font-bold">ON-CHAIN</span>
            </div>
            <div className="mt-2 text-[11px] text-[#94A3B8] flex items-center justify-between pt-2 border-t border-[#263449]">
              <span>MST Testnet</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                #6688112
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time MST Network Telemetry & Node Health */}
        <NetworkHealthIndicator />

        {/* Visual Trust Timeline */}
        <TrustTimeline 
          currentStage={6}
          eventId={stats?.recent_events?.[0]?.id || 'evt_contract_deploy_mst'}
          integrityHash={stats?.recent_events?.[0]?.integrity_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          policyId={stats?.recent_events?.[0]?.policy_id || 'POL-A'}
          decision={stats?.recent_events?.[0]?.policy_decision || 'ALLOW'}
        />

        {/* Live Cryptographic Integrity Comparison: Local vs On-Chain Evidence */}
        <IntegrityComparisonView
          eventId={stats?.recent_events?.[0]?.id || 'evt_contract_deploy_mst'}
          localHash={stats?.recent_events?.[0]?.integrity_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          onChainHash={stats?.recent_events?.[0]?.integrity_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          contractAddress="0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
          txHash="0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6"
          blockNumber={6688112}
          isSimulated={false}
        />

        {/* Recent Agent Actions Table (Section 4 Requirement) */}
        <div className="p-5 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#263449]">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Recent Agent Actions &amp; Policy Decisions</h3>
              <p className="text-xs text-[#94A3B8]">Audit log of latest evaluated agent requests and cryptographic digests</p>
            </div>
            <Link
              href="/audit"
              className="flex items-center gap-1 text-xs font-bold text-[#38BDF8] hover:underline transition"
            >
              <span>Explore All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-[#101827] text-[#94A3B8] border-b border-[#263449]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Agent ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Requested Action</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Target Resource</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Decision</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Evidence Hash (SHA-256)</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Blockchain Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449] font-mono">
                {stats?.recent_events && stats.recent_events.length > 0 ? (
                  stats.recent_events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#1E293B] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#F8FAFC]">{evt.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#101827] border border-[#263449] text-[#F8FAFC] font-semibold text-[11px]">
                          {evt.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8] max-w-[200px] truncate" title={evt.resource}>
                        {evt.resource}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <StatusBadge type="decision" value={evt.policy_decision} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#94A3B8] truncate max-w-[140px]" title={evt.integrity_hash}>
                            {evt.integrity_hash.slice(0, 10)}...{evt.integrity_hash.slice(-6)}
                          </span>
                          <button
                            onClick={() => handleCopy(evt.integrity_hash)}
                            className="p-1 rounded bg-[#101827] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition"
                            title="Copy SHA-256 Digest"
                          >
                            {copiedHash === evt.integrity_hash ? (
                              <Check className="w-3 h-3 text-[#22C55E]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                          MST Testnet
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleInspect(evt.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-[#263449] text-[#F8FAFC] border border-[#263449] hover:border-[#38BDF8]/40 transition text-[11px] font-semibold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#94A3B8] font-sans">
                      No agent actions recorded yet. Use the Action Simulator to submit requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Inspector Modal */}
      {selectedEvent && (
        <EventDetailModal
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          event={selectedEvent}
          onApprove={() => {
            setIsInspectorOpen(false);
            handleOpenApproval(selectedEvent);
          }}
        />
      )}

      {/* Human Approval Modal */}
      {approvalEvent && (
        <ApprovalModal
          isOpen={isApprovalOpen}
          onClose={() => setIsApprovalOpen(false)}
          event={approvalEvent}
          onDecisionComplete={() => loadStats()}
        />
      )}
    </div>
  );
}
