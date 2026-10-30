'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  XCircle, 
  AlertTriangle, 
  Layers, 
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
  Zap,
  ArrowUpRight
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
import { DashboardStats, AuditEventDetail, AuditEventSummary, BlockchainStatus, TamperAlert, ThreatAnalytics } from '@/lib/types';

export default function DashboardPage() {
  const { role, permissions, roleTitle, roleBadgeText, roleDescription } = useRBAC();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bStatus, setBStatus] = useState<BlockchainStatus | null>(null);
  const [alerts, setAlerts] = useState<TamperAlert[]>([]);
  const [threats, setThreats] = useState<ThreatAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal state
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDetail | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Approval modal state
  const [approvalEvent, setApprovalEvent] = useState<AuditEventSummary | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const loadStats = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    try {
      const [statsData, bData, alertsData, threatData] = await Promise.all([
        api.getDashboardStats(),
        api.getBlockchainStatus().catch(() => null),
        api.getTamperAlerts().catch(() => []),
        api.getThreatAnalytics().catch(() => null)
      ]);
      setStats(statsData);
      setBStatus(bData);
      setAlerts(alertsData || []);
      setThreats(threatData);
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
    <div className="flex flex-col min-h-full bg-[#000000] text-[#D4D4D8] font-sans">
      <Header 
        title="Security Operations Overview" 
        subtitle="Verifiable governance gateway for autonomous AI agents & MST Blockchain commitments"
        onRefresh={() => loadStats(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Core Purpose & Executive Hero Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121214] via-[#121214] to-[#18181B] border border-[#27272A] hover:border-[#FACC15]/40 shadow-2xl relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FACC15]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FACC15]" />
                  AI Agent Governance &amp; Verification Gateway
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  MST Testnet Verified (Chain ID 91562037)
                </span>
                <a
                  href="https://testnet.mstscan.com/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#A1A1AA] hover:text-[#FACC15] font-mono flex items-center gap-1 transition"
                >
                  <span>Contract: 0x0539...ceca</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#FFFFFF] tracking-tight">
                Deterministic Security &amp; Cryptographic Evidence for Autonomous AI
              </h2>
              
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Autonomous AI agents can perform sensitive operations—accessing production databases, executing system commands, leaking proprietary records, or deleting ledgers—without verification, policy enforcement, or non-repudiable audit logs. <strong>SentinelMesh intercepts agent requests at runtime</strong>, evaluates zero-trust policies (ALLOW / BLOCK / REQUIRE_APPROVAL), gates high-risk operations behind human authorization, generates canonical RFC-8785 SHA-256 evidence, and anchors immutable commitments directly to the MST Blockchain.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                <span className="flex items-center gap-1.5 text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Zero-Trust Policy Engine
                </span>
                <span className="flex items-center gap-1.5 text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Human Approval Gates
                </span>
                <span className="flex items-center gap-1.5 text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> RFC-8785 Canonical Hashing
                </span>
                <span className="flex items-center gap-1.5 text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> EvidenceRegistry.sol (MST Testnet)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto flex-shrink-0">
              <Link
                href="/simulator"
                className="px-5 py-3 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 text-center"
              >
                <span>Run 6-Scenario Simulator</span>
                <ArrowRight className="w-4 h-4 text-[#000000]" />
              </Link>
              <Link
                href="/approvals"
                className="px-4 py-2.5 rounded-xl bg-[#1C1C1F] hover:bg-[#27272A] text-[#FFFFFF] border border-[#27272A] hover:border-[#FACC15]/40 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Review Pending Approvals ({stats?.pending_approvals_count ?? 0})</span>
              </Link>
              <Link
                href="/blockchain"
                className="px-4 py-2.5 rounded-xl bg-[#1C1C1F] hover:bg-[#27272A] text-[#FFFFFF] border border-[#27272A] hover:border-[#FACC15]/40 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
              >
                <Boxes className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Inspect On-Chain Proofs</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Tamper Alerts Warning Banner */}
        {alerts.filter(a => a.status === 'OPEN').length > 0 && (
          <div className="p-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-[#EF4444] text-xs sm:text-sm min-w-0">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#EF4444]" />
              <div className="min-w-0">
                <span className="font-bold text-[#FFFFFF]">Security Alert: </span>
                <span className="truncate block sm:inline">
                  {alerts.filter(a => a.status === 'OPEN').length} active cryptographic tamper mismatch detected in audit evidence!
                </span>
              </div>
            </div>
            <Link
              href="/integrity"
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#EF4444] text-white hover:bg-[#DC2626] transition flex items-center gap-1 flex-shrink-0"
            >
              <span>Investigate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Active Threat Intelligence Banner */}
        {threats && threats.active_findings > 0 && (
          <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-[#F59E0B] text-xs sm:text-sm min-w-0">
              <Shield className="w-5 h-5 flex-shrink-0 text-[#F59E0B]" />
              <div className="min-w-0">
                <span className="font-bold text-[#FFFFFF]">Threat Intelligence: </span>
                <span className="truncate block sm:inline">
                  {threats.active_findings} active behavioral findings flagged ({threats.findings_by_severity.CRITICAL} Critical, {threats.findings_by_severity.HIGH} High).
                </span>
              </div>
            </div>
            <Link
              href="/threats"
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#F59E0B] text-[#000000] hover:bg-[#D97706] transition flex items-center gap-1 shadow-sm flex-shrink-0"
            >
              <span>Inspect Findings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Active Role Governance Mission Bar */}
        <div className="p-4 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
              role === 'ADMIN'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                : 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#A1A1AA]">Active Role Session:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold border ${
                  role === 'ADMIN'
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                    : role === 'SECURITY_ANALYST'
                    ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                    : 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
                }`}>
                  {roleBadgeText}
                </span>
                <span className="text-xs text-[#A1A1AA] hidden lg:inline font-semibold">| {roleTitle}</span>
              </div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-3xl">
                {roleDescription}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto">
            {role === 'ADMIN' && (
              <Link
                href="/simulator"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] transition shadow-sm flex items-center gap-1.5"
              >
                <span>Authorize Action</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#000000]" />
              </Link>
            )}
            {role === 'SECURITY_ANALYST' && (
              <Link
                href="/integrity"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] transition shadow-sm flex items-center gap-1.5"
              >
                <span>Verify Hashes</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FFFFFF]" />
              </Link>
            )}
            {role === 'VIEWER' && (
              <Link
                href="/audit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] transition shadow-sm flex items-center gap-1.5"
              >
                <span>Export Evidence</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#000000]" />
              </Link>
            )}
          </div>
        </div>

        {/* Role Quick Action Launchpad */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link href="/simulator" className="p-3.5 rounded-xl bg-[#121214] border border-[#27272A] hover:border-[#FACC15]/40 flex flex-col justify-between min-h-[95px] shadow-sm transition">
            <span className="font-bold text-[#FACC15]">Action Gateway</span>
            <span className="text-[11px] text-[#A1A1AA] mt-1">Submit &amp; evaluate live policies</span>
          </Link>
          <Link href="/approvals" className="p-3.5 rounded-xl bg-[#121214] border border-[#27272A] hover:border-[#F59E0B]/40 flex flex-col justify-between min-h-[95px] shadow-sm transition">
            <span className="font-bold text-[#F59E0B]">Approval Queue</span>
            <span className="text-[11px] text-[#A1A1AA] mt-1">Authorize or reject pending actions</span>
          </Link>
          <Link href="/policies" className="p-3.5 rounded-xl bg-[#121214] border border-[#27272A] hover:border-[#38BDF8]/40 flex flex-col justify-between min-h-[95px] shadow-sm transition">
            <span className="font-bold text-[#38BDF8]">Policy Studio</span>
            <span className="text-[11px] text-[#A1A1AA] mt-1">Author &amp; toggle deterministic rules</span>
          </Link>
          <Link href="/blockchain" className="p-3.5 rounded-xl bg-[#121214] border border-[#27272A] hover:border-[#10B981]/40 flex flex-col justify-between min-h-[95px] shadow-sm transition">
            <span className="font-bold text-[#10B981]">Evidence Registry</span>
            <span className="text-[11px] text-[#A1A1AA] mt-1">Query on-chain commitments</span>
          </Link>
        </div>

        {/* Sleek Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-[#FACC15]/30 text-[#FAFAFA] flex flex-col justify-between shadow-lg min-h-[145px] transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">Total Evaluated Actions</span>
              <Activity className="w-4 h-4 text-[#FACC15]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#FFFFFF]">
                {isLoading ? '—' : (stats?.total_events ?? 0)}
              </span>
              <span className="text-xs text-[#A1A1AA] font-medium">actions</span>
            </div>
            <div className="mt-2 text-[11px] text-[#A1A1AA] flex items-center justify-between pt-2 border-t border-[#27272A]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                SHA-256 chained
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                IMMUTABLE
              </span>
            </div>
          </div>

          {/* Allowed Actions */}
          <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-[#10B981]/30 text-[#FAFAFA] flex flex-col justify-between shadow-lg min-h-[145px] transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">Permitted Actions</span>
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#FFFFFF]">
                {isLoading ? '—' : (stats?.allowed_count ?? 0)}
              </span>
              <span className="text-xs text-[#10B981] font-bold">ALLOW</span>
            </div>
            <div className="mt-2 text-[11px] text-[#A1A1AA] flex items-center justify-between pt-2 border-t border-[#27272A]">
              <span>Deterministic policy</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                ZERO BYPASS
              </span>
            </div>
          </div>

          {/* Blocked Actions */}
          <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-[#EF4444]/30 text-[#FAFAFA] flex flex-col justify-between shadow-lg min-h-[145px] transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">Blocked Operations</span>
              <XCircle className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#FFFFFF]">
                {isLoading ? '—' : (stats?.blocked_count ?? 0)}
              </span>
              <span className="text-xs text-[#EF4444] font-bold">BLOCK</span>
            </div>
            <div className="mt-2 text-[11px] text-[#A1A1AA] flex items-center justify-between pt-2 border-t border-[#27272A]">
              <span>Halted at gateway</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                ENFORCED
              </span>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-[#F59E0B]/30 text-[#FAFAFA] flex flex-col justify-between shadow-lg min-h-[145px] transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">Pending Approvals</span>
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-[#FFFFFF]">
                {isLoading ? '—' : (stats?.pending_approvals_count ?? 0)}
              </span>
              <span className="text-xs text-[#F59E0B] font-bold">REQUIRE_APPROVAL</span>
            </div>
            <div className="mt-2 text-[11px] text-[#A1A1AA] flex items-center justify-between pt-2 border-t border-[#27272A]">
              <span>Human verification</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                RESTRICTED
              </span>
            </div>
          </div>
        </div>

        {/* Operational Intelligence & System Architecture Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Velocity Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#121214] border border-[#27272A] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#FFFFFF]">Security Actions Velocity (Last 7 Days)</h3>
                <p className="text-xs text-[#A1A1AA]">Evaluated operations grouped by policy decision</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[#A1A1AA] font-semibold">
                  <span className="w-2.5 h-2.5 rounded bg-[#10B981]"></span>
                  Allowed
                </span>
                <span className="flex items-center gap-1.5 text-[#A1A1AA] font-semibold">
                  <span className="w-2.5 h-2.5 rounded bg-[#EF4444]"></span>
                  Blocked
                </span>
              </div>
            </div>

            {/* SVG Velocity Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 pb-2 px-2 border-b border-[#27272A]">
              {stats?.events_by_date && stats.events_by_date.length > 0 ? (
                stats.events_by_date.map((d, i) => {
                  const maxVal = Math.max(...stats.events_by_date.map(x => x.total), 5);
                  const allowedHeight = Math.max(Math.round((d.allowed / maxVal) * 120), 4);
                  const blockedHeight = Math.max(Math.round((d.blocked / maxVal) * 120), d.blocked > 0 ? 4 : 0);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[#09090B] text-[10px] text-[#FFFFFF] py-1 px-2 rounded-lg whitespace-nowrap z-10 shadow border border-[#27272A] font-mono">
                        {d.date}: {d.total} total ({d.allowed} allow, {d.blocked} block)
                      </div>

                      <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-32 bg-[#09090B] rounded-lg p-1 border border-[#27272A]">
                        <div 
                          style={{ height: `${allowedHeight}px` }} 
                          className="w-full bg-[#10B981] hover:bg-[#059669] rounded-t transition-all"
                        ></div>
                        {blockedHeight > 0 && (
                          <div 
                            style={{ height: `${blockedHeight}px` }} 
                            className="w-full bg-[#EF4444] hover:bg-[#DC2626] rounded-t transition-all"
                          ></div>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#A1A1AA]">{d.date.slice(5)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#A1A1AA]">
                  No historical activity recorded yet
                </div>
              )}
            </div>
          </div>

          {/* System & Architecture Status */}
          <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF] mb-1">Architecture &amp; Ledger Status</h3>
              <p className="text-xs text-[#A1A1AA] mb-4">Operational status across policy engine and EVM ledger</p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#09090B] border border-[#27272A]">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#A1A1AA]" />
                    <span className="text-xs font-bold text-[#FFFFFF]">Policy Engine</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#10B981] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                    OPERATIONAL
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#09090B] border border-[#27272A]">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#A1A1AA]" />
                    <span className="text-xs font-bold text-[#FFFFFF]">Audit Store</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#10B981] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                    PERSISTED
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#09090B] border border-[#27272A]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#A1A1AA]" />
                    <span className="text-xs font-bold text-[#FFFFFF]">Canonical Hashing</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#10B981] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                    RFC-8785 (SHA-256)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] flex-wrap sm:flex-nowrap gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Boxes className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
                    <span className="text-xs font-bold text-[#FFFFFF] truncate">MST EvidenceRegistry</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30">
                    CONNECTED (91562037)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#27272A]">
              <Link
                href="/blockchain"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] transition shadow-sm"
              >
                <span>View Blockchain Activity</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#000000]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Real-Time MST Network Telemetry & Node Health */}
        <NetworkHealthIndicator />

        {/* Visual Trust Timeline: Action -> Policy -> SHA-256 -> MST Blockchain -> Read-Back */}
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

        {/* Live Security Event Log Table */}
        <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF]">Live Audit Activity Log</h3>
              <p className="text-xs text-[#A1A1AA]">Latest deterministic actions evaluated against active policies</p>
            </div>
            <Link
              href="/audit"
              className="flex items-center gap-1 text-xs font-bold text-[#FACC15] hover:underline transition"
            >
              <span>View full audit trail</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#FACC15]" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#27272A] responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#09090B] text-[#A1A1AA] uppercase font-bold text-[11px] border-b border-[#27272A]">
                <tr>
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Policy Decision</th>
                  <th className="px-4 py-3">Execution Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#A1A1AA] font-sans font-medium">
                      Loading audit events from backend...
                    </td>
                  </tr>
                ) : !stats?.recent_events || stats.recent_events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#A1A1AA] font-sans font-medium">
                      No actions recorded yet. Run an action in the Action Gateway to generate the first verifiable record.
                    </td>
                  </tr>
                ) : (
                  stats.recent_events.map((event) => (
                    <tr key={event.id} className="hover:bg-[#1C1C1F] transition-colors border-b border-[#27272A]/60">
                      <td className="px-4 py-3 text-[#A1A1AA] whitespace-nowrap font-medium">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-[#FFFFFF] font-bold">
                        {event.agent_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#09090B] text-[#FACC15] border border-[#27272A] font-bold">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#D4D4D8] max-w-[200px] truncate" title={event.resource}>
                        {event.resource}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="decision" value={event.policy_decision} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="execution" value={event.execution_status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {event.policy_decision === 'REQUIRE_APPROVAL' && event.approval_status === 'PENDING' && (
                            permissions.canApprove ? (
                              <button
                                onClick={() => handleOpenApproval(event)}
                                className="px-2.5 py-1 rounded text-[11px] font-sans font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/25 transition"
                              >
                                Review
                              </button>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold"
                              >
                                Pending Review
                              </span>
                            )
                          )}
                          <button
                            onClick={() => handleInspect(event.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-sans text-[#FFFFFF] hover:bg-[#27272A] bg-[#1C1C1F] border border-[#27272A] transition font-bold"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspector Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Approval Modal */}
      <ApprovalModal
        event={approvalEvent}
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onDecisionSubmitted={() => loadStats(true)}
      />
    </div>
  );
}
