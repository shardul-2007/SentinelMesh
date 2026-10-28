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
    <div className="flex flex-col min-h-full">
      <Header 
        title="Cryptographic Audit Trail" 
        subtitle="Append-only immutable record of all evaluated AI agent security decisions"
        onRefresh={() => loadEvents(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Security & Immutability Architecture Callout */}
        <div className="p-4 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Append-Only Governance Model
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  TAMPER-EVIDENT
                </span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Audit records cannot be edited or purged via this interface. Each entry is anchored by a deterministic SHA-256 integrity hash and can be committed directly to the MST EvidenceRegistry smart contract for independent on-chain verification.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-xs text-slate-500 font-mono block">Indexed Records</span>
            <span className="text-lg font-bold font-mono text-slate-200">{total}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Decision Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-graphite-950 rounded-lg border border-graphite-800 overflow-x-auto">
            {['ALL', 'ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'].map((dec) => (
              <button
                key={dec}
                onClick={() => {
                  setDecisionFilter(dec);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${
                  decisionFilter === dec
                    ? 'bg-graphite-800 text-slate-100 shadow border border-graphite-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dec === 'REQUIRE_APPROVAL' ? 'APPROVAL REQUIRED' : dec}
              </button>
            ))}
          </div>

          {/* Search & Agent Filter Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-lg items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resource, action, reason, or event ID..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <input
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Agent ID..."
              className="w-36 px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-graphite-800 border border-graphite-700 text-slate-300 hover:text-white hover:bg-graphite-750 transition"
            >
              Filter
            </button>
          </form>

          {/* Export Controls (Compliance Reporting) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={api.getExportUrl('csv', { decision: decisionFilter, agentId: agentFilter })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-graphite-850 hover:bg-graphite-800 border border-graphite-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              title="Export CSV Audit Trail"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </a>
            <a
              href={api.getExportUrl('json', { decision: decisionFilter, agentId: agentFilter })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-graphite-850 hover:bg-graphite-800 border border-graphite-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              title="Export JSON Audit Trail"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export JSON</span>
            </a>
          </div>
        </div>

        {/* Audit Events Table */}
        <div className="rounded-xl bg-graphite-900 border border-graphite-750 overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-graphite-850 text-slate-400 uppercase font-semibold text-[11px] border-b border-graphite-750">
                <tr>
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Resource</th>
                  <th className="px-4 py-3">Policy Decision</th>
                  <th className="px-4 py-3">Execution Status</th>
                  <th className="px-4 py-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-750/60 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-sans">
                      Loading audit records...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-sans">
                      No audit events found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-graphite-850/50 transition">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-medium">
                        {event.id}
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {event.agent_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-graphite-800 text-slate-200 border border-graphite-700">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-[220px] truncate" title={event.resource}>
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
                            className="px-2.5 py-1 rounded text-[11px] font-sans text-slate-300 hover:text-white bg-graphite-800 hover:bg-graphite-750 border border-graphite-700 transition"
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
          <div className="p-4 border-t border-graphite-750 bg-graphite-850 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="text-slate-200 font-mono font-medium">{events.length}</span> of{' '}
              <span className="text-slate-200 font-mono font-medium">{total}</span> total events
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded bg-graphite-800 border border-graphite-700 hover:bg-graphite-750 disabled:opacity-40 transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-300 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded bg-graphite-800 border border-graphite-700 hover:bg-graphite-750 disabled:opacity-40 transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
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
