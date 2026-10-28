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
  Clock,
  Shield
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { ApprovalModal } from '@/components/ApprovalModal';
import { api } from '@/lib/api';
import { DashboardStats, AuditEventDetail, AuditEventSummary, BlockchainStatus, TamperAlert, ThreatAnalytics } from '@/lib/types';

export default function DashboardPage() {
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
    <div className="flex flex-col min-h-full">
      <Header 
        title="Security Operations Overview" 
        subtitle="Real-time policy enforcement and audit monitoring for AI agent interactions"
        onRefresh={() => loadStats(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Active Tamper Alerts Warning Banner */}
        {alerts.filter(a => a.status === 'OPEN').length > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-300 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse text-rose-400" />
              <div>
                <span className="font-semibold">Security Alert: </span>
                <span>
                  {alerts.filter(a => a.status === 'OPEN').length} active cryptographic tamper mismatch detected in audit evidence!
                </span>
              </div>
            </div>
            <Link
              href="/integrity"
              className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-950 border border-rose-800 text-rose-200 hover:bg-rose-900 transition flex items-center gap-1"
            >
              <span>Investigate Alert</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Active Threat Intelligence Banner */}
        {threats && threats.active_findings > 0 && (
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-300 text-sm">
              <Shield className="w-5 h-5 flex-shrink-0 text-indigo-400" />
              <div>
                <span className="font-semibold">Threat Intelligence: </span>
                <span>
                  {threats.active_findings} active behavioral findings flagged ({threats.findings_by_severity.CRITICAL} Critical, {threats.findings_by_severity.HIGH} High).
                </span>
              </div>
            </div>
            <Link
              href="/threats"
              className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-900 border border-indigo-700 text-indigo-100 hover:bg-indigo-800 transition flex items-center gap-1"
            >
              <span>View Threat Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Audit Events</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {isLoading ? '...' : (stats?.total_events ?? 0)}
              </span>
              <span className="text-xs text-slate-500">records</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Cryptographically chained
            </div>
          </div>

          {/* Allowed Actions */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Permitted Actions</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {isLoading ? '...' : (stats?.allowed_count ?? 0)}
              </span>
              <span className="text-xs text-slate-500">allowed</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              Validated against active policies
            </div>
          </div>

          {/* Blocked Actions */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Blocked Threats</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-400">
                {isLoading ? '...' : (stats?.blocked_count ?? 0)}
              </span>
              <span className="text-xs text-slate-500">prevented</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              Zero executions allowed
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {isLoading ? '...' : (stats?.pending_approvals_count ?? 0)}
              </span>
              <span className="text-xs text-slate-500">awaiting review</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              High-risk actions on hold
            </div>
          </div>
        </div>

        {/* 2. Activity Visualization & System Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Chart */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Security Events Velocity (Last 7 Days)</h3>
                <p className="text-xs text-slate-400">Evaluated operations by policy decision</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-400"></span>
                  Allowed
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded bg-rose-400"></span>
                  Blocked
                </span>
              </div>
            </div>

            {/* Accessible SVG Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
              {stats?.events_by_date && stats.events_by_date.length > 0 ? (
                stats.events_by_date.map((d, i) => {
                  const maxVal = Math.max(...stats.events_by_date.map(x => x.total), 5);
                  const allowedHeight = Math.max(Math.round((d.allowed / maxVal) * 120), 4);
                  const blockedHeight = Math.max(Math.round((d.blocked / maxVal) * 120), d.blocked > 0 ? 4 : 0);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-graphite-800 text-[10px] text-slate-200 py-1 px-2 rounded border border-graphite-700 whitespace-nowrap z-10">
                        {d.date}: {d.total} total ({d.allowed} allow, {d.blocked} block)
                      </div>

                      <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-32 bg-graphite-950/40 rounded p-1 border border-graphite-800">
                        <div 
                          style={{ height: `${allowedHeight}px` }} 
                          className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                        ></div>
                        {blockedHeight > 0 && (
                          <div 
                            style={{ height: `${blockedHeight}px` }} 
                            className="w-full bg-rose-500/80 hover:bg-rose-400 rounded-t transition-all"
                          ></div>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{d.date}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  No activity history recorded yet
                </div>
              )}
            </div>
          </div>

          {/* System & Architecture Status Card */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Architecture &amp; Integrity Status</h3>
              <p className="text-xs text-slate-400 mb-4">Operational service &amp; MST blockchain node health</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-graphite-950/70 border border-graphite-800">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-300">FastAPI Policy Engine</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    OPERATIONAL
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-graphite-950/70 border border-graphite-800">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-300">SQL Audit Store</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    PERSISTED
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-graphite-950/70 border border-graphite-800">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-300">SHA-256 Canonical Digest</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    ACTIVE (RFC-8785)
                  </span>
                </div>

                {/* Real MST Blockchain Registry status */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-graphite-950/70 border border-graphite-800">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#82B5F8]" />
                    <span className="text-xs font-medium text-slate-300">MST Evidence Registry</span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    bStatus?.connected
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-graphite-850 text-slate-300 border-graphite-750'
                  }`}>
                    {bStatus?.connected ? `CONNECTED (${bStatus?.detected_chain_id || bStatus?.configured_chain_id || 91562037})` : 'OPERATIONAL'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-graphite-750/80">
              <Link
                href="/blockchain"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-[#82B5F8]/10 text-[#82B5F8] border border-[#82B5F8]/30 hover:bg-[#82B5F8]/20 transition"
              >
                <span>View MST Blockchain Activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Recent Activity Table */}
        <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Live Security Event Log</h3>
              <p className="text-xs text-slate-400">Latest deterministic evaluations processed by the backend policy engine</p>
            </div>
            <Link
              href="/audit"
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-emerald-400 transition"
            >
              <span>View full audit trail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-graphite-750">
            <table className="w-full text-left text-xs">
              <thead className="bg-graphite-850 text-slate-400 uppercase font-semibold text-[11px] border-b border-graphite-750">
                <tr>
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Policy Decision</th>
                  <th className="px-4 py-3">Execution Status</th>
                  <th className="px-4 py-3 text-right">Event ID / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-750/60 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans">
                      Loading audit events from backend...
                    </td>
                  </tr>
                ) : !stats?.recent_events || stats.recent_events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No events recorded yet. Run an action in the Action Simulator to generate your first audit record.
                    </td>
                  </tr>
                ) : (
                  stats.recent_events.map((event) => (
                    <tr key={event.id} className="hover:bg-graphite-850/50 transition">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {event.agent_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-graphite-800 text-slate-200 border border-graphite-700">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate" title={event.resource}>
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
                            <button
                              onClick={() => handleOpenApproval(event)}
                              className="px-2.5 py-1 rounded text-[11px] font-sans font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => handleInspect(event.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-sans text-slate-400 hover:text-slate-200 bg-graphite-800 hover:bg-graphite-750 border border-graphite-700 transition"
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
