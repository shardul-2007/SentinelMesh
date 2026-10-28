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
    <div className="flex flex-col min-h-full bg-[#000000]">
      <Header 
        title="Audit Explorer" 
        subtitle="Append-only immutable record of evaluated AI agent actions, decisions & cryptographic evidence"
        onRefresh={() => loadEvents(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Banner */}
        <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#D4D4D8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#D4D4D8]/70 hidden md:inline font-semibold">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canExportReports ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50 font-medium'}>
              {permissions.canExportReports ? '✓ Export Authorized' : '✗ Export Restricted'}
            </span>
            <span className={permissions.canApprove ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50 font-medium'}>
              {permissions.canApprove ? '✓ Approval Authorized' : '✗ Read-Only'}
            </span>
          </div>
        </div>

        {/* Governance Banner with Yellow Box + Black Text */}
        <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#000000] flex items-center justify-center text-[#FACC15] flex-shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-[#000000] flex items-center gap-2">
                Append-Only Evidence Architecture
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-black bg-[#000000] text-[#FACC15]">
                  TAMPER-EVIDENT
                </span>
              </h3>
              <p className="text-xs text-[#1C1C1C] leading-relaxed max-w-3xl font-bold">
                Audit records are append-only. Every evaluation is chained with SHA-256 integrity digests and can be committed to the MST EvidenceRegistry smart contract for public verification.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-[#000000]/25 bg-[#000000] px-4 py-2.5 rounded-xl border">
            <span className="text-[10px] text-[#D4D4D8] font-mono block font-black uppercase">Indexed Records</span>
            <span className="text-2xl font-black font-mono text-[#FACC15]">{total}</span>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-sm">
          {/* Decision Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#000000] rounded-lg border border-[#27272A] overflow-x-auto">
            {['ALL', 'ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'].map((dec) => (
              <button
                key={dec}
                onClick={() => {
                  setDecisionFilter(dec);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  decisionFilter === dec
                    ? 'bg-[#FACC15]/20 text-[#FACC15] shadow-sm border border-[#FACC15]/40'
                    : 'text-[#D4D4D8] hover:text-[#FFFFFF]'
                }`}
              >
                {dec === 'REQUIRE_APPROVAL' ? 'APPROVAL REQUIRED' : dec}
              </button>
            ))}
          </div>

          {/* Search & Agent Filter Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#D4D4D8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resource, action, reason, or event ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#000000] border border-[#27272A] text-[#FFFFFF] text-xs focus:border-[#FACC15] focus:outline-none placeholder-[#D4D4D8]/60 transition font-medium"
              />
            </div>
            <input
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Agent ID..."
              className="w-32 px-3 py-1.5 rounded-lg bg-[#000000] border border-[#27272A] text-[#FFFFFF] text-xs font-mono focus:border-[#FACC15] focus:outline-none placeholder-[#D4D4D8]/60 transition font-medium"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000000] transition shadow-sm active:scale-95"
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
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#000000] hover:bg-[#1C1C1C] border border-[#27272A] hover:border-[#FACC15]/40 text-[#FFFFFF] transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={!permissions.canExportReports}
              title={permissions.canExportReports ? 'Export filtered JSON audit trail' : 'Security Analyst or Admin role required to export'}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#000000] hover:bg-[#1C1C1C] border border-[#27272A] hover:border-[#FACC15]/40 text-[#FFFFFF] transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Audit Events Table */}
        <div className="rounded-xl bg-[#121212] border border-[#27272A] overflow-hidden shadow-sm">
          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-[#000000] text-[#D4D4D8] uppercase font-bold text-[11px] border-b border-[#27272A]">
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
              <tbody className="divide-y divide-[#27272A] font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#D4D4D8] font-sans font-medium">
                      Loading audit records...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#D4D4D8] font-sans font-medium">
                      No audit events found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                      <td className="px-4 py-3 text-[#D4D4D8] whitespace-nowrap font-medium">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[#FACC15] font-bold">
                        {event.id}
                      </td>
                      <td className="px-4 py-3 text-[#FFFFFF] font-bold">
                        {event.agent_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#000000] text-[#FACC15] border border-[#27272A] font-bold">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#D4D4D8] max-w-[220px] truncate" title={event.resource}>
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
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/25 transition active:scale-95"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => handleInspect(event.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] text-[#FFFFFF] hover:border-[#FACC15]/40 bg-[#000000] border border-[#27272A] transition active:scale-95 font-bold"
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
          <div className="p-3.5 border-t border-[#27272A] bg-[#000000] flex items-center justify-between text-xs text-[#D4D4D8]">
            <div>
              Showing <span className="text-[#FFFFFF] font-mono font-bold">{events.length}</span> of{' '}
              <span className="text-[#FFFFFF] font-mono font-bold">{total}</span> total events
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-lg bg-[#121212] border border-[#27272A] hover:bg-[#1C1C1C] disabled:opacity-40 transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-[#FFFFFF]" />
              </button>
              <span className="font-mono text-[#FFFFFF] px-2 text-xs font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-lg bg-[#121212] border border-[#27272A] hover:bg-[#1C1C1C] disabled:opacity-40 transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-[#FFFFFF]" />
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
