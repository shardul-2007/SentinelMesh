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
  X, 
  Lock, 
  ExternalLink, 
  UserCheck 
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { ApprovalModal } from '@/components/ApprovalModal';
import { api } from '@/lib/api';
import { AuditEventSummary, AuditEventDetail } from '@/lib/types';
import { useRBAC } from '@/lib/rbac';

export default function ApprovalCenterPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
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
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Human Authorization &amp; Approval Queue" 
        subtitle="Review, authorize, or reject high-risk AI agent operations under Human-in-the-Loop governance"
        onRefresh={() => loadApprovals(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* RBAC Active Role Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all shadow-xs ${
          role === 'ADMIN' ? 'bg-[#D97706]/10 border-[#D97706]/20 text-[#D97706]' :
          role === 'SECURITY_ANALYST' ? 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]' :
          'bg-[#FFFFFF] border-[#E5E7EB] text-[#64748B]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full bg-[#F8FAFC] border border-current w-fit">
              ACTIVE ROLE: {roleBadgeText}
            </span>
            <span className="text-xs text-[#64748B]">{roleDescription}</span>
          </div>
          <span className="text-[11px] font-mono text-[#2563EB] hidden md:inline font-bold">Switch role in top-right header</span>
        </div>

        {/* 3 Sleek Light KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[145px] transition">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Pending Review</span>
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-3xl font-black text-[#172B4D] mt-1 font-mono">{pendingEvents.length}</div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span>Awaiting authorization</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                pendingEvents.length > 0 
                  ? 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20' 
                  : 'bg-[#F1F5F9] text-[#64748B] border border-[#E5E7EB]'
              }`}>
                {pendingEvents.length > 0 ? 'ACTION REQUIRED' : 'CLEAR'}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[145px] transition">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Approved Operations</span>
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            </div>
            <div className="text-3xl font-black text-[#15803D] mt-1 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'APPROVED').length}
            </div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span>Governed execution</span>
              <span className="px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20 text-[10px] font-bold font-mono">
                AUTHORIZED
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col justify-between min-h-[145px] transition">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Rejected Operations</span>
              <XCircle className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div className="text-3xl font-black text-[#DC2626] mt-1 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'REJECTED').length}
            </div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span>Halted at gateway</span>
              <span className="px-2 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 text-[10px] font-bold font-mono">
                DENIED
              </span>
            </div>
          </div>
        </div>

        {/* Safety Guarantee Notice */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-start gap-3 shadow-xs">
          <Shield className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-[#172B4D]">Zero-Trust Human Authorization Boundary</p>
            <p className="text-[#64748B] leading-relaxed">
              Approved AI agent requests execute strictly through authorized resource adapters with deterministic zero-trust containment. SentinelMesh prevents unconstrained host execution, direct database drops, or unverified ledger alterations.
            </p>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-bold text-[#172B4D]">Pending Human Approval Queue</h3>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                {pendingEvents.length} actions
              </span>
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="p-10 text-center text-[#64748B] space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-[#15803D] mx-auto" />
              <p className="text-sm font-bold text-[#172B4D]">All caught up! No pending approvals.</p>
              <p className="text-xs text-[#64748B]">Trigger a high-risk action (such as DELETE database) in the Action Simulator to test approval workflows.</p>
            </div>
          ) : (
            <div className="overflow-x-auto responsive-table-wrapper">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Event ID</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Agent</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Requested Action</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Target Resource</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Policy</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Risk Rationale</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] font-mono">
                  {pendingEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="py-3 px-4 font-bold text-[#172B4D]">{event.id}</td>
                      <td className="py-3 px-4 text-[#172B4D] font-bold">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#D97706]/10 border border-[#D97706]/20 text-[#D97706] font-bold">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] max-w-[200px] truncate" title={event.resource}>
                        {event.resource}
                      </td>
                      <td className="py-3 px-4 text-[#64748B] text-[11px] font-semibold">{event.policy_id}</td>
                      <td className="py-3 px-4 text-[#64748B] font-sans max-w-[250px] truncate" title={event.reason}>
                        {event.reason}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] hover:border-[#2563EB]/40 transition text-[11px] font-bold shadow-xs"
                        >
                          Inspect
                        </button>
                        {permissions.canApprove ? (
                          <button
                            onClick={() => handleOpenDecision(event)}
                            className="px-3.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] transition font-bold text-[11px] shadow-xs active:scale-95"
                          >
                            Decide (Admin)
                          </button>
                        ) : role === 'SECURITY_ANALYST' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-[10px] font-bold cursor-not-allowed"
                            title="Only Chief Security Officer (ADMIN) can authorize or reject operations."
                          >
                            <Lock className="w-3 h-3" />
                            Admin Required
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#64748B] text-[10px] font-medium cursor-not-allowed"
                            title="Compliance Auditors have read-only access."
                          >
                            <Lock className="w-3 h-3" />
                            Read-Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Historical Decisions Table */}
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#172B4D]">Historical Approval Decisions</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Auditable records of all past administrative authorizations</p>
          </div>
          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Agent</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Action &amp; Resource</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Approval Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Execution Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono">
                {allApprovalEvents
                  .filter(e => e.approval_status !== 'PENDING')
                  .slice(0, 10)
                  .map((event) => (
                    <tr key={event.id} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="py-3 px-4 font-bold text-[#172B4D]">{event.id}</td>
                      <td className="py-3 px-4 text-[#172B4D] font-semibold">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#172B4D]">{event.action_type}</span>{' '}
                        <span className="text-[#64748B] text-[11px] truncate inline-block max-w-[200px] align-bottom font-medium">
                          {event.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          event.approval_status === 'APPROVED'
                            ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20'
                            : 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                        }`}>
                          {event.approval_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#64748B] font-medium">
                        {event.execution_status}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] hover:border-[#2563EB]/40 transition text-[11px] font-bold shadow-xs"
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
