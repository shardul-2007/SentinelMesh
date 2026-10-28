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
    <div className="flex flex-col min-h-full bg-[#F5F4F0]">
      <Header 
        title="Approval Queue" 
        subtitle="Review, authorize, or reject high-risk AI agent operations under Human-in-the-Loop governance"
        onRefresh={() => loadApprovals(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Pending Review</span>
              <AlertTriangle className="w-4 h-4 text-[#98661C]" />
            </div>
            <div className="text-2xl font-bold text-[#98661C] mt-2 font-mono">{pendingEvents.length}</div>
            <p className="text-[11px] text-[#737B86] mt-1">Actions awaiting administrator authorization</p>
          </div>

          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Approved Operations</span>
              <CheckCircle2 className="w-4 h-4 text-[#287653]" />
            </div>
            <div className="text-2xl font-bold text-[#287653] mt-2 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'APPROVED').length}
            </div>
            <p className="text-[11px] text-[#737B86] mt-1">Authorized for isolated execution</p>
          </div>

          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Rejected Operations</span>
              <XCircle className="w-4 h-4 text-[#B53A3A]" />
            </div>
            <div className="text-2xl font-bold text-[#B53A3A] mt-2 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'REJECTED').length}
            </div>
            <p className="text-[11px] text-[#737B86] mt-1">Denied and halted at gateway</p>
          </div>
        </div>

        {/* Safety Guarantee Notice */}
        <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex items-start gap-3 shadow-sm">
          <Shield className="w-5 h-5 text-[#287653] flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-[#171A1F]">Execution Boundary Guarantee</p>
            <p className="text-[#737B86] leading-relaxed">
              Approved AI agent requests execute strictly within the sandbox in <span className="font-mono text-[#287653] font-semibold">SIMULATED</span> mode. SentinelMesh prevents unconstrained shell execution, direct database drops, or uncontrolled network requests.
            </p>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="rounded bg-[#FFFFFF] border border-[#D9DDE2] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#D9DDE2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#98661C]" />
              <h3 className="text-sm font-semibold text-[#171A1F]">Pending Approval Queue</h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-[#FDF7ED] text-[#98661C] border border-[#F5DEB3]">
                {pendingEvents.length}
              </span>
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="p-10 text-center text-[#737B86] space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-[#287653] mx-auto" />
              <p className="text-sm font-semibold text-[#171A1F]">All caught up! No pending approvals.</p>
              <p className="text-xs text-[#737B86]">Trigger a high-risk action (such as DELETE database) in the Action Gateway to test approval flows.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F8] text-[#737B86] border-b border-[#D9DDE2]">
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
                <tbody className="divide-y divide-[#D9DDE2] font-mono">
                  {pendingEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-[#F9FAFB] transition">
                      <td className="py-3 px-4 font-medium text-[#171A1F]">{event.id}</td>
                      <td className="py-3 px-4 text-[#171A1F] font-semibold">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#FDF7ED] border border-[#F5DEB3] text-[#98661C] font-semibold">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#737B86] max-w-[200px] truncate" title={event.resource}>
                        {event.resource}
                      </td>
                      <td className="py-3 px-4 text-[#737B86] text-[11px]">{event.policy_id}</td>
                      <td className="py-3 px-4 text-[#737B86] font-sans max-w-[250px] truncate" title={event.reason}>
                        {event.reason}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] hover:bg-[#F5F4F0] transition text-[11px]"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleOpenDecision(event)}
                          className="px-2.5 py-1 rounded bg-[#98661C] text-[#FFFFFF] hover:bg-[#7D5316] transition font-semibold text-[11px]"
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
        <div className="rounded bg-[#FFFFFF] border border-[#D9DDE2] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#D9DDE2]">
            <h3 className="text-sm font-semibold text-[#171A1F]">Historical Approval Decisions</h3>
            <p className="text-xs text-[#737B86] mt-0.5">Auditable records of all past administrative authorizations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F8] text-[#737B86] border-b border-[#D9DDE2]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Agent</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Action & Resource</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Approval Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Execution Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE2] font-mono">
                {allApprovalEvents
                  .filter(e => e.approval_status !== 'PENDING')
                  .slice(0, 10)
                  .map((event) => (
                    <tr key={event.id} className="hover:bg-[#F9FAFB] transition">
                      <td className="py-3 px-4 font-medium text-[#171A1F]">{event.id}</td>
                      <td className="py-3 px-4 text-[#171A1F]">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#171A1F]">{event.action_type}</span>{' '}
                        <span className="text-[#737B86] text-[11px] truncate inline-block max-w-[200px] align-bottom">
                          {event.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          event.approval_status === 'APPROVED'
                            ? 'bg-[#EDF6F2] text-[#287653] border-[#BCE2D1]'
                            : 'bg-[#FDF2F2] text-[#B53A3A] border-[#F7C4C4]'
                        }`}>
                          {event.approval_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#737B86]">
                        {event.execution_status}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] hover:bg-[#F5F4F0] transition text-[11px]"
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
