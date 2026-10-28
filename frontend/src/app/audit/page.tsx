'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Shield, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Clock,
  RotateCw,
  Download
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { ApprovalModal } from '@/components/ApprovalModal';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { AuditEventSummary, AuditEventDetail } from '@/lib/types';

export default function AuditTrailPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
  const [events, setEvents] = useState<AuditEventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inspector modal state
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDetail | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Approval modal state
  const [approvalEvent, setApprovalEvent] = useState<AuditEventSummary | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const loadEvents = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setIsLoading(true);
    try {
      const res = await api.getEvents({
        page,
        page_size: pageSize,
        decision: decisionFilter,
        agent_id: agentFilter || undefined,
        search: searchTerm || undefined,
      });
      setEvents(res.events);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [page, decisionFilter, agentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  const handleInspect = async (eventId: string) => {
    try {
      const detail = await api.getEventDetail(eventId);
      setSelectedEvent(detail);
      setIsInspectorOpen(true);
    } catch (err: any) {
      alert(`Could not fetch details: ${err.message}`);
    }
  };

  const handleOpenApproval = (event: AuditEventSummary) => {
    setApprovalEvent(event);
    setIsApprovalOpen(true);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!permissions.canExportReports) {
      alert('Access Restricted: Only Security Analyst and Admin roles can export audit intelligence reports. Current role is Viewer / Auditor.');
      return;
    }

    try {
      if (format === 'json') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `sentinelmesh_audit_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else {
        // CSV
        const headers = ['id', 'timestamp', 'agent_id', 'action_type', 'resource', 'policy_decision', 'policy_id', 'execution_status', 'approval_status', 'integrity_hash'];
        const csvRows = [headers.join(',')];
        for (const ev of events) {
          const row = [
            ev.id,
            `"${ev.timestamp}"`,
            `"${ev.agent_id}"`,
            `"${ev.action_type}"`,
            `"${ev.resource.replace(/"/g, '""')}"`,
            `"${ev.policy_decision}"`,
            `"${ev.policy_id || ''}"`,
            `"${ev.execution_status}"`,
            `"${ev.approval_status}"`,
            `"${ev.integrity_hash}"`
          ];
          csvRows.push(row.join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `sentinelmesh_audit_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex flex-col min-h-full bg-[#0B0F17]">
      <Header 
        title="Audit Explorer" 
        subtitle="Append-only immutable record of evaluated AI agent actions, decisions & cryptographic evidence"
        onRefresh={() => loadEvents(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Banner */}
        <div className="p-3.5 rounded-lg bg-[#131A24]/90 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#94A3B8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#64748B] hidden md:inline">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canExportReports ? 'text-cyan-400' : 'text-slate-500'}>
              {permissions.canExportReports ? '✓ Export Authorized' : '✗ Export Restricted'}
            </span>
            <span className={permissions.canApprove ? 'text-emerald-400' : 'text-slate-500'}>
              {permissions.canApprove ? '✓ Approval Authorized' : '✗ Read-Only'}
            </span>
          </div>
        </div>

        {/* Governance Banner */}
        <div className="mst-card p-4 rounded-xl bg-[#131A24]/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                Append-Only Evidence Architecture
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  TAMPER-EVIDENT
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed max-w-3xl">
                Audit records are append-only. Every evaluation is chained with SHA-256 integrity digests and can be committed to the MST EvidenceRegistry smart contract for public verification.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
            <span className="text-[11px] text-[#94A3B8] font-mono block">Indexed Records</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{total}</span>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="mst-card p-4 rounded-xl bg-[#131A24]/90 border border-slate-800 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-xl">
          {/* Decision Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#070A12] rounded-lg border border-slate-800 overflow-x-auto">
            {['ALL', 'ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'].map((dec) => (
              <button
                key={dec}
                onClick={() => {
                  setDecisionFilter(dec);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  decisionFilter === dec
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 shadow-sm border border-cyan-500/30'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {dec === 'REQUIRE_APPROVAL' ? 'APPROVAL REQUIRED' : dec}
              </button>
            ))}
          </div>

          {/* Search & Agent Filter Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resource, action, reason, or event ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#070A12] border border-slate-800 text-[#F8FAFC] text-xs focus:border-cyan-400 focus:outline-none placeholder-[#64748B] transition"
              />
            </div>
            <input
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Agent ID..."
              className="w-32 px-3 py-1.5 rounded-lg bg-[#070A12] border border-slate-800 text-[#F8FAFC] text-xs font-mono focus:border-cyan-400 focus:outline-none placeholder-[#64748B] transition"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-[#070A12] hover:from-cyan-400 hover:to-blue-500 transition shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:scale-105 active:scale-95"
            >
              Filter
            </button>
          </form>

          {/* Export Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleExport('csv')}
              disabled={!permissions.canExportReports}
              title={permissions.canExportReports ? 'Export filtered CSV audit trail' : 'Security Analyst or Admin role required to export'}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#070A12] hover:bg-[#1A2332] border border-slate-800 hover:border-cyan-500/40 text-[#F8FAFC] transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={!permissions.canExportReports}
              title={permissions.canExportReports ? 'Export filtered JSON audit trail' : 'Security Analyst or Admin role required to export'}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#070A12] hover:bg-[#1A2332] border border-slate-800 hover:border-cyan-500/40 text-[#F8FAFC] transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Audit Events Table */}
        <div className="mst-card rounded-xl bg-[#131A24]/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A2332] text-[#94A3B8] uppercase font-semibold text-[11px] border-b border-[#263244]">
                <tr>
                  <th className="px-4 py-2.5">Timestamp (UTC)</th>
                  <th className="px-4 py-2.5">Event ID</th>
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Target Resource</th>
                  <th className="px-4 py-2.5">Policy Decision</th>
                  <th className="px-4 py-2.5">Execution Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263244] font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#94A3B8] font-sans">
                      Loading audit records...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#94A3B8] font-sans">
                      No audit events found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="mst-table-row hover:bg-[#1A2332]/70 transition-all duration-200">
                      <td className="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[#38BDF8] font-semibold">
                        {event.id}
                      </td>
                      <td className="px-4 py-3 text-[#F8FAFC] font-semibold">
                        {event.agent_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#0B0F17] text-[#38BDF8] border border-[#263244]">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] max-w-[220px] truncate" title={event.resource}>
                        {event.resource}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="decision" value={event.policy_decision} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="execution" value={event.execution_status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {event.policy_decision === 'REQUIRE_APPROVAL' && event.approval_status === 'PENDING' && (
                            <button
                              onClick={() => handleOpenApproval(event)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/25 transition hover:scale-105 active:scale-95"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => handleInspect(event.id)}
                            className="px-2.5 py-1 rounded-md text-[11px] text-[#F8FAFC] hover:bg-[#263244] hover:border-cyan-500/40 bg-[#070A12] border border-slate-800 transition hover:scale-105 active:scale-95"
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

          {/* Pagination Footer */}
          <div className="p-3.5 border-t border-[#263244] bg-[#1A2332] flex items-center justify-between text-xs text-[#94A3B8]">
            <div>
              Showing <span className="text-[#F8FAFC] font-mono font-medium">{events.length}</span> of{' '}
              <span className="text-[#F8FAFC] font-mono font-medium">{total}</span> total events
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded bg-[#0B0F17] border border-[#263244] hover:bg-[#263244] disabled:opacity-40 transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-[#F8FAFC]" />
              </button>
              <span className="font-mono text-[#F8FAFC] px-2 text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded bg-[#0B0F17] border border-[#263244] hover:bg-[#263244] disabled:opacity-40 transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-[#F8FAFC]" />
              </button>
            </div>
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
        onDecisionSubmitted={() => loadEvents(true)}
      />
    </div>
  );
}
