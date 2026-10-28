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
  Boxes
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
    <div className="flex flex-col min-h-full bg-[#F5F4F0]">
      <Header 
        title="Security Operations Overview" 
        subtitle="Real-time policy enforcement, audit evidence logging & MST blockchain commitments"
        onRefresh={() => loadStats(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Active Tamper Alerts Warning Banner */}
        {alerts.filter(a => a.status === 'OPEN').length > 0 && (
          <div className="p-4 rounded bg-[#FDF2F2] border border-[#F7C4C4] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#B53A3A] text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#B53A3A]" />
              <div>
                <span className="font-semibold">Security Alert: </span>
                <span>
                  {alerts.filter(a => a.status === 'OPEN').length} active cryptographic tamper mismatch detected in audit evidence!
                </span>
              </div>
            </div>
            <Link
              href="/integrity"
              className="px-3 py-1.5 text-xs font-semibold rounded bg-[#B53A3A] text-[#FFFFFF] hover:bg-[#8C2323] transition flex items-center gap-1"
            >
              <span>Investigate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Active Threat Intelligence Banner */}
        {threats && threats.active_findings > 0 && (
          <div className="p-4 rounded bg-[#EBF2F7] border border-[#C5D7E3] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#315C78] text-xs sm:text-sm">
              <Shield className="w-5 h-5 flex-shrink-0 text-[#315C78]" />
              <div>
                <span className="font-semibold">Threat Intelligence: </span>
                <span>
                  {threats.active_findings} active behavioral findings flagged ({threats.findings_by_severity.CRITICAL} Critical, {threats.findings_by_severity.HIGH} High).
                </span>
              </div>
            </div>
            <Link
              href="/threats"
              className="px-3 py-1.5 text-xs font-semibold rounded bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition flex items-center gap-1"
            >
              <span>Inspect Findings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* KPI Operational Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Evaluated Actions</span>
              <Activity className="w-4 h-4 text-[#737B86]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#171A1F]">
                {isLoading ? '—' : (stats?.total_events ?? 0)}
              </span>
              <span className="text-xs text-[#737B86]">actions</span>
            </div>
            <div className="mt-2 text-[11px] text-[#737B86] flex items-center gap-1.5 pt-2 border-t border-[#F5F4F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#287653]"></span>
              SHA-256 integrity chained
            </div>
          </div>

          {/* Allowed Actions */}
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Permitted Actions</span>
              <ShieldCheck className="w-4 h-4 text-[#287653]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#287653]">
                {isLoading ? '—' : (stats?.allowed_count ?? 0)}
              </span>
              <span className="text-xs text-[#737B86]">ALLOW</span>
            </div>
            <div className="mt-2 text-[11px] text-[#737B86] pt-2 border-t border-[#F5F4F0]">
              Deterministic policy match
            </div>
          </div>

          {/* Blocked Actions */}
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Blocked Operations</span>
              <XCircle className="w-4 h-4 text-[#B53A3A]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#B53A3A]">
                {isLoading ? '—' : (stats?.blocked_count ?? 0)}
              </span>
              <span className="text-xs text-[#737B86]">BLOCK</span>
            </div>
            <div className="mt-2 text-[11px] text-[#737B86] pt-2 border-t border-[#F5F4F0]">
              Zero execution allowed
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Approvals</span>
              <AlertTriangle className="w-4 h-4 text-[#98661C]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#98661C]">
                {isLoading ? '—' : (stats?.pending_approvals_count ?? 0)}
              </span>
              <span className="text-xs text-[#737B86]">gated</span>
            </div>
            <div className="mt-2 text-[11px] text-[#737B86] pt-2 border-t border-[#F5F4F0]">
              Human authorization required
            </div>
          </div>
        </div>

        {/* Operational Intelligence & System Architecture Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Velocity Chart */}
          <div className="lg:col-span-2 p-5 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#171A1F]">Security Actions Velocity (Last 7 Days)</h3>
                <p className="text-xs text-[#737B86]">Evaluated operations grouped by policy decision</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[#737B86]">
                  <span className="w-2.5 h-2.5 rounded bg-[#287653]"></span>
                  Allowed
                </span>
                <span className="flex items-center gap-1.5 text-[#737B86]">
                  <span className="w-2.5 h-2.5 rounded bg-[#B53A3A]"></span>
                  Blocked
                </span>
              </div>
            </div>

            {/* SVG Velocity Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 pb-2 px-2 border-b border-[#D9DDE2]">
              {stats?.events_by_date && stats.events_by_date.length > 0 ? (
                stats.events_by_date.map((d, i) => {
                  const maxVal = Math.max(...stats.events_by_date.map(x => x.total), 5);
                  const allowedHeight = Math.max(Math.round((d.allowed / maxVal) * 120), 4);
                  const blockedHeight = Math.max(Math.round((d.blocked / maxVal) * 120), d.blocked > 0 ? 4 : 0);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[#171A1F] text-[10px] text-[#FFFFFF] py-1 px-2 rounded whitespace-nowrap z-10 shadow">
                        {d.date}: {d.total} total ({d.allowed} allow, {d.blocked} block)
                      </div>

                      <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-32 bg-[#F5F4F0] rounded p-1 border border-[#D9DDE2]">
                        <div 
                          style={{ height: `${allowedHeight}px` }} 
                          className="w-full bg-[#287653] hover:bg-[#205F43] rounded-t transition-all"
                        ></div>
                        {blockedHeight > 0 && (
                          <div 
                            style={{ height: `${blockedHeight}px` }} 
                            className="w-full bg-[#B53A3A] hover:bg-[#8C2323] rounded-t transition-all"
                          ></div>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#737B86]">{d.date.slice(5)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#737B86]">
                  No historical activity recorded yet
                </div>
              )}
            </div>
          </div>

          {/* System & Architecture Status */}
          <div className="p-5 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-[#171A1F] mb-1">Architecture &amp; Ledger Status</h3>
              <p className="text-xs text-[#737B86] mb-4">Operational status across policy engine and EVM ledger</p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#737B86]" />
                    <span className="text-xs font-medium text-[#171A1F]">Policy Engine</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#287653] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#287653]"></span>
                    OPERATIONAL
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#737B86]" />
                    <span className="text-xs font-medium text-[#171A1F]">Audit Store</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#287653] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#287653]"></span>
                    PERSISTED
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#737B86]" />
                    <span className="text-xs font-medium text-[#171A1F]">Canonical Hashing</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#287653] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#287653]"></span>
                    RFC-8785 (SHA-256)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-[#315C78]" />
                    <span className="text-xs font-medium text-[#171A1F]">MST EvidenceRegistry</span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    bStatus?.connected
                      ? 'bg-[#EDF6F2] text-[#287653] border-[#BCE2D1]'
                      : 'bg-[#F5F4F0] text-[#737B86] border-[#D9DDE2]'
                  }`}>
                    {bStatus?.connected ? `CONNECTED (${bStatus?.detected_chain_id || bStatus?.configured_chain_id || 91562037})` : 'READY (EVM)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9DDE2]">
              <Link
                href="/blockchain"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition"
              >
                <span>View Blockchain Activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Live Security Event Log Table */}
        <div className="p-5 rounded bg-[#FFFFFF] border border-[#D9DDE2] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#171A1F]">Live Audit Activity Log</h3>
              <p className="text-xs text-[#737B86]">Latest deterministic actions evaluated against active policies</p>
            </div>
            <Link
              href="/audit"
              className="flex items-center gap-1 text-xs font-medium text-[#315C78] hover:underline transition"
            >
              <span>View full audit trail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded border border-[#D9DDE2]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F8] text-[#737B86] uppercase font-semibold text-[11px] border-b border-[#D9DDE2]">
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
              <tbody className="divide-y divide-[#D9DDE2] font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#737B86] font-sans">
                      Loading audit events from backend...
                    </td>
                  </tr>
                ) : !stats?.recent_events || stats.recent_events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#737B86] font-sans">
                      No actions recorded yet. Run an action in the Action Gateway to generate the first verifiable record.
                    </td>
                  </tr>
                ) : (
                  stats.recent_events.map((event) => (
                    <tr key={event.id} className="hover:bg-[#F9FAFB] transition">
                      <td className="px-4 py-3 text-[#737B86] whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-[#171A1F] font-semibold">
                        {event.agent_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#F5F4F0] text-[#171A1F] border border-[#D9DDE2]">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#737B86] max-w-[200px] truncate" title={event.resource}>
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
                              className="px-2.5 py-1 rounded text-[11px] font-sans font-medium bg-[#FDF7ED] text-[#98661C] border border-[#F5DEB3] hover:bg-[#F7E7CD] transition"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => handleInspect(event.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-sans text-[#171A1F] hover:bg-[#F5F4F0] bg-[#FFFFFF] border border-[#D9DDE2] transition"
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
