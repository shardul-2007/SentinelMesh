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
import { AuditEventSummary, AuditEventDetail } from '@/lib/types';

export default function AuditTrailPage() {
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

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex flex-col min-h-full bg-[#F5F4F0]">
      <Header 
        title="Audit Explorer" 
        subtitle="Append-only immutable record of evaluated AI agent actions, decisions & cryptographic evidence"
        onRefresh={() => loadEvents(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Governance Banner */}
        <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#EDF6F2] border border-[#BCE2D1] flex items-center justify-center text-[#287653] flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-[#171A1F] flex items-center gap-2">
                Append-Only Evidence Architecture
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-[#EDF6F2] text-[#287653] border border-[#BCE2D1]">
                  TAMPER-EVIDENT
                </span>
              </h3>
              <p className="text-xs text-[#737B86] leading-relaxed max-w-3xl">
                Audit records are append-only. Every evaluation is chained with SHA-256 integrity digests and can be committed to the MST EvidenceRegistry smart contract for public verification.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-[#F5F4F0]">
            <span className="text-[11px] text-[#737B86] font-mono block">Indexed Records</span>
            <span className="text-lg font-bold font-mono text-[#171A1F]">{total}</span>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-sm">
          {/* Decision Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F5F4F0] rounded border border-[#D9DDE2] overflow-x-auto">
            {['ALL', 'ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'].map((dec) => (
              <button
                key={dec}
                onClick={() => {
                  setDecisionFilter(dec);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                  decisionFilter === dec
                    ? 'bg-[#FFFFFF] text-[#171A1F] shadow-sm border border-[#D9DDE2]'
                    : 'text-[#737B86] hover:text-[#171A1F]'
                }`}
              >
                {dec === 'REQUIRE_APPROVAL' ? 'APPROVAL REQUIRED' : dec}
              </button>
            ))}
          </div>

          {/* Search & Agent Filter Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#737B86] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resource, action, reason, or event ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-[#171A1F] text-xs focus:border-[#315C78] focus:outline-none"
              />
            </div>
            <input
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Agent ID..."
              className="w-32 px-3 py-1.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-[#171A1F] text-xs font-mono focus:border-[#315C78] focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded text-xs font-semibold bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition"
            >
              Filter
            </button>
          </form>

          {/* Export Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={api.getExportUrl('csv', { decision: decisionFilter, agentId: agentFilter })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded text-xs font-medium bg-[#FFFFFF] hover:bg-[#F5F4F0] border border-[#D9DDE2] text-[#171A1F] transition flex items-center gap-1.5"
              title="Export CSV Audit Trail"
            >
              <Download className="w-3.5 h-3.5 text-[#287653]" />
              <span>CSV</span>
            </a>
            <a
              href={api.getExportUrl('json', { decision: decisionFilter, agentId: agentFilter })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded text-xs font-medium bg-[#FFFFFF] hover:bg-[#F5F4F0] border border-[#D9DDE2] text-[#171A1F] transition flex items-center gap-1.5"
              title="Export JSON Audit Trail"
            >
              <Download className="w-3.5 h-3.5 text-[#315C78]" />
              <span>JSON</span>
            </a>
          </div>
        </div>

        {/* Audit Events Table */}
        <div className="rounded bg-[#FFFFFF] border border-[#D9DDE2] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F8] text-[#737B86] uppercase font-semibold text-[11px] border-b border-[#D9DDE2]">
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
              <tbody className="divide-y divide-[#D9DDE2] font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#737B86] font-sans">
                      Loading audit records...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#737B86] font-sans">
                      No audit events found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-[#F9FAFB] transition">
                      <td className="px-4 py-3 text-[#737B86] whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[#315C78] font-semibold">
                        {event.id}
                      </td>
                      <td className="px-4 py-3 text-[#171A1F] font-semibold">
                        {event.agent_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#F5F4F0] text-[#171A1F] border border-[#D9DDE2]">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#737B86] max-w-[220px] truncate" title={event.resource}>
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
                              className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#FDF7ED] text-[#98661C] border border-[#F5DEB3] hover:bg-[#F7E7CD] transition"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => handleInspect(event.id)}
                            className="px-2.5 py-1 rounded text-[11px] text-[#171A1F] hover:bg-[#F5F4F0] bg-[#FFFFFF] border border-[#D9DDE2] transition"
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
          <div className="p-3.5 border-t border-[#D9DDE2] bg-[#F9F9F8] flex items-center justify-between text-xs text-[#737B86]">
            <div>
              Showing <span className="text-[#171A1F] font-mono font-medium">{events.length}</span> of{' '}
              <span className="text-[#171A1F] font-mono font-medium">{total}</span> total events
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded bg-[#FFFFFF] border border-[#D9DDE2] hover:bg-[#F5F4F0] disabled:opacity-40 transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-[#171A1F]" />
              </button>
              <span className="font-mono text-[#171A1F] px-2 text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded bg-[#FFFFFF] border border-[#D9DDE2] hover:bg-[#F5F4F0] disabled:opacity-40 transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-[#171A1F]" />
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
