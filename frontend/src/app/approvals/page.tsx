'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
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
    <div className="flex flex-col min-h-full bg-[#0B0F17]">
      <Header 
        title="Approval Queue" 
        subtitle="Review, authorize, or reject high-risk AI agent operations under Human-in-the-Loop governance"
        onRefresh={() => loadApprovals(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-[#131A24] border border-[#263244] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Pending Review</span>
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-bold text-[#F59E0B] mt-2 font-mono">{pendingEvents.length}</div>
            <p className="text-[11px] text-[#94A3B8] mt-1">Actions awaiting administrator authorization</p>
          </div>

          <div className="p-4 rounded bg-[#131A24] border border-[#263244] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Approved Operations</span>
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="text-2xl font-bold text-[#10B981] mt-2 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'APPROVED').length}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">Authorized for isolated execution</p>
          </div>

          <div className="p-4 rounded bg-[#131A24] border border-[#263244] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Rejected Operations</span>
              <XCircle className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div className="text-2xl font-bold text-[#EF4444] mt-2 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'REJECTED').length}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">Denied and halted at gateway</p>
          </div>
        </div>

        {/* Safety Guarantee Notice */}
        <div className="p-4 rounded bg-[#131A24] border border-[#263244] flex items-start gap-3 shadow-sm">
          <Shield className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-[#F8FAFC]">Execution Boundary Guarantee</p>
            <p className="text-[#94A3B8] leading-relaxed">
              Approved AI agent requests execute strictly within the sandbox in <span className="font-mono text-[#10B981] font-semibold">SIMULATED</span> mode. SentinelMesh prevents unconstrained shell execution, direct database drops, or uncontrolled network requests.
            </p>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="rounded bg-[#131A24] border border-[#263244] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#263244] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Pending Approval Queue</h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                {pendingEvents.length}
              </span>
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="p-10 text-center text-[#94A3B8] space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto" />
              <p className="text-sm font-semibold text-[#F8FAFC]">All caught up! No pending approvals.</p>
              <p className="text-xs text-[#94A3B8]">Trigger a high-risk action (such as DELETE database) in the Action Gateway to test approval flows.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A2332] text-[#94A3B8] border-b border-[#263244]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Event ID</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Agent</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Requested Action</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Target Resource</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Policy</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Risk Rationale</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263244] font-mono">
                  {pendingEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-[#1A2332]/60 transition">
                      <td className="py-3 px-4 font-medium text-[#F8FAFC]">{event.id}</td>
                      <td className="py-3 px-4 text-[#F8FAFC] font-semibold">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] font-semibold">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8] max-w-[200px] truncate" title={event.resource}>
                        {event.resource}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8] text-[11px]">{event.policy_id}</td>
                      <td className="py-3 px-4 text-[#94A3B8] font-sans max-w-[250px] truncate" title={event.reason}>
                        {event.reason}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2 py-1 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] hover:bg-[#1A2332] transition text-[11px]"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleOpenDecision(event)}
                          className="px-2.5 py-1 rounded bg-[#F59E0B] text-[#0B0F17] hover:bg-[#D97706] transition font-bold text-[11px]"
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
        <div className="rounded bg-[#131A24] border border-[#263244] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#263244]">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Historical Approval Decisions</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">Auditable records of all past administrative authorizations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A2332] text-[#94A3B8] border-b border-[#263244]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Agent</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Action & Resource</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Approval Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Execution Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263244] font-mono">
                {allApprovalEvents
                  .filter(e => e.approval_status !== 'PENDING')
                  .slice(0, 10)
                  .map((event) => (
                    <tr key={event.id} className="hover:bg-[#1A2332]/60 transition">
                      <td className="py-3 px-4 font-medium text-[#F8FAFC]">{event.id}</td>
                      <td className="py-3 px-4 text-[#F8FAFC]">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#F8FAFC]">{event.action_type}</span>{' '}
                        <span className="text-[#94A3B8] text-[11px] truncate inline-block max-w-[200px] align-bottom">
                          {event.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          event.approval_status === 'APPROVED'
                            ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                            : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                        }`}>
                          {event.approval_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#94A3B8]">
                        {event.execution_status}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2 py-1 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] hover:bg-[#1A2332] transition text-[11px]"
                        >
                          Inspect
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
