'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Filter, 
  RefreshCw,
  Eye,
  Check,
  X
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { ApprovalModal } from '@/components/ApprovalModal';
import { api } from '@/lib/api';
import { AuditEventSummary, AuditEventDetail } from '@/lib/types';

export default function ApprovalCenterPage() {
  const [pendingEvents, setPendingEvents] = useState<AuditEventSummary[]>([]);
  const [allApprovalEvents, setAllApprovalEvents] = useState<AuditEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDetail | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [activeApprovalEvent, setActiveApprovalEvent] = useState<AuditEventSummary | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const loadApprovals = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [pending, allList] = await Promise.all([
        api.getPendingApprovals(),
        api.getEvents({ decision: 'REQUIRE_APPROVAL', page_size: 50 })
      ]);
      setPendingEvents(pending);
      setAllApprovalEvents(allList.events);
    } catch (err: any) {
      console.error('Failed to load approvals:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    const interval = setInterval(() => loadApprovals(), 15000);
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

  const handleOpenDecision = (event: AuditEventSummary) => {
    setActiveApprovalEvent(event);
    setIsApprovalModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header 
        title="Security Approval Center" 
        subtitle="Review, approve, or reject high-risk AI agent operations under Human-in-the-Loop governance"
        onRefresh={() => loadApprovals(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Pending Action Approvals</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">{pendingEvents.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Requiring administrator review</p>
          </div>

          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Approved Operations</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'APPROVED').length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Authorized for simulated execution</p>
          </div>

          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Rejected Operations</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'REJECTED').length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Denied and permanently blocked</p>
          </div>
        </div>

        {/* Safety Boundary Notice */}
        <div className="p-4 rounded-xl bg-graphite-850/80 border border-graphite-750 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-slate-200">Execution Boundary Guarantee</p>
            <p className="text-slate-400 leading-relaxed">
              Approved AI agent requests execute strictly within the sandbox in <span className="font-mono text-emerald-300">SIMULATED</span> mode. SentinelMesh never executes arbitrary shell commands, drops real databases, or accesses external network environments without explicit system boundaries.
            </p>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="rounded-xl bg-graphite-900 border border-graphite-750 overflow-hidden">
          <div className="p-4 border-b border-graphite-750 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">Pending Approval Queue</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                {pendingEvents.length}
              </span>
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-slate-300">All caught up! No pending approvals.</p>
              <p className="text-xs text-slate-400">Trigger high-risk simulator actions (e.g. DELETE database) to test approval queues.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-graphite-950/50 text-slate-400 border-b border-graphite-750">
                  <tr>
                    <th className="py-3 px-4 font-medium">Event ID</th>
                    <th className="py-3 px-4 font-medium">Agent</th>
                    <th className="py-3 px-4 font-medium">Requested Action</th>
                    <th className="py-3 px-4 font-medium">Target Resource</th>
                    <th className="py-3 px-4 font-medium">Applicable Policy</th>
                    <th className="py-3 px-4 font-medium">Risk Rationale</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-750/60">
                  {pendingEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-graphite-850/50 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">{event.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-mono font-medium">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 max-w-[200px] truncate" title={event.resource}>
                        {event.resource}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{event.policy_id}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-[250px] truncate" title={event.reason}>
                        {event.reason}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2.5 py-1 rounded bg-graphite-800 border border-graphite-700 text-slate-300 hover:text-white transition"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleOpenDecision(event)}
                          className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-800 text-amber-300 hover:bg-amber-900 transition font-medium"
                        >
                          Decide (Admin)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Historical Decisions Table */}
        <div className="rounded-xl bg-graphite-900 border border-graphite-750 overflow-hidden">
          <div className="p-4 border-b border-graphite-750">
            <h3 className="text-sm font-semibold text-slate-100">Historical Approval Decisions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Auditable records of all past administrative decisions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-graphite-950/50 text-slate-400 border-b border-graphite-750">
                <tr>
                  <th className="py-3 px-4 font-medium">Event ID</th>
                  <th className="py-3 px-4 font-medium">Agent</th>
                  <th className="py-3 px-4 font-medium">Action & Resource</th>
                  <th className="py-3 px-4 font-medium">Approval Status</th>
                  <th className="py-3 px-4 font-medium">Execution Status</th>
                  <th className="py-3 px-4 font-medium text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-750/60">
                {allApprovalEvents
                  .filter(e => e.approval_status !== 'PENDING')
                  .slice(0, 10)
                  .map((event) => (
                    <tr key={event.id} className="hover:bg-graphite-850/50 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-300">{event.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-300">{event.action_type}</span>{' '}
                        <span className="font-mono text-slate-400 text-[11px] truncate inline-block max-w-[200px] align-bottom">
                          {event.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          event.approval_status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {event.approval_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {event.execution_status}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2.5 py-1 rounded bg-graphite-800 border border-graphite-700 text-slate-300 hover:text-white transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        event={activeApprovalEvent}
        onDecisionSubmitted={() => {
          setIsApprovalModalOpen(false);
          loadApprovals();
        }}
      />

      {/* Inspector Modal */}
      <EventDetailModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
