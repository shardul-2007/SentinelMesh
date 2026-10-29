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
  Lock
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
    <div className="flex flex-col min-h-full bg-[#000000]">
      <Header 
        title="Approval Queue" 
        subtitle="Review, authorize, or reject high-risk AI agent operations under Human-in-the-Loop governance"
        onRefresh={() => loadApprovals(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* RBAC Active Role Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
          role === 'ADMIN' ? 'bg-[#FACC15]/10 border-[#FACC15]/30 text-[#FACC15]' :
          role === 'SECURITY_ANALYST' ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]' :
          'bg-[#121212] border-[#27272A] text-[#D4D4D8]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full bg-[#000000] border border-current w-fit">
              ACTIVE ROLE: {roleBadgeText}
            </span>
            <span className="text-xs text-[#D4D4D8]">{roleDescription}</span>
          </div>
          <span className="text-[11px] font-mono text-[#FACC15] hidden md:inline font-bold">Switch role in top-right header</span>
        </div>

        {/* KPI Summary Cards with Yellow Background + Black Text */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col justify-between shadow-xl min-h-[145px] overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#000000]">Pending Review</span>
              <AlertTriangle className="w-4 h-4 text-[#000000] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#000000] mt-1 font-mono">{pendingEvents.length}</div>
            <div className="mt-2 text-[11px] text-[#1C1C1C] flex items-center justify-between pt-2 border-t border-[#000000]/25 font-bold">
              <span>Awaiting review</span>
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                {pendingEvents.length > 0 ? 'URGENT' : 'IDLE'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col justify-between shadow-xl min-h-[145px] overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#000000]">Approved Operations</span>
              <CheckCircle2 className="w-4 h-4 text-[#000000] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#000000] mt-1 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'APPROVED').length}
            </div>
            <div className="mt-2 text-[11px] text-[#1C1C1C] flex items-center justify-between pt-2 border-t border-[#000000]/25 font-bold">
              <span>Isolated execution</span>
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                AUTHORIZED
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col justify-between shadow-xl min-h-[145px] overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#000000]">Rejected Operations</span>
              <XCircle className="w-4 h-4 text-[#000000] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#000000] mt-1 font-mono">
              {allApprovalEvents.filter(e => e.approval_status === 'REJECTED').length}
            </div>
            <div className="mt-2 text-[11px] text-[#1C1C1C] flex items-center justify-between pt-2 border-t border-[#000000]/25 font-bold">
              <span>Halted at gateway</span>
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#EF4444] text-[10px] font-black font-mono border border-[#000000]">
                DENIED
              </span>
            </div>
          </div>
        </div>

        {/* Safety Guarantee Notice */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] flex items-start gap-3 shadow-sm">
          <Shield className="w-5 h-5 text-[#FACC15] flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-[#FFFFFF]">Execution Boundary Guarantee</p>
            <p className="text-[#D4D4D8] leading-relaxed">
              Approved AI agent requests execute strictly within the sandbox in <span className="font-mono text-[#FACC15] font-bold">SIMULATED</span> mode. SentinelMesh prevents unconstrained shell execution, direct database drops, or uncontrolled network requests.
            </p>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="rounded-xl bg-[#121212] border border-[#27272A] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-sm font-bold text-[#FFFFFF]">Pending Approval Queue</h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                {pendingEvents.length}
              </span>
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="p-10 text-center text-[#D4D4D8] space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-[#FACC15] mx-auto" />
              <p className="text-sm font-bold text-[#FFFFFF]">All caught up! No pending approvals.</p>
              <p className="text-xs text-[#D4D4D8]">Trigger a high-risk action (such as DELETE database) in the Action Gateway to test approval flows.</p>
            </div>
          ) : (
            <div className="overflow-x-auto responsive-table-wrapper">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead className="bg-[#000000] text-[#D4D4D8] border-b border-[#27272A]">
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
                <tbody className="divide-y divide-[#27272A] font-mono">
                  {pendingEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">{event.id}</td>
                      <td className="py-3 px-4 text-[#FFFFFF] font-bold">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] font-bold">
                          {event.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#D4D4D8] max-w-[200px] truncate" title={event.resource}>
                        {event.resource}
                      </td>
                      <td className="py-3 px-4 text-[#D4D4D8] text-[11px] font-semibold">{event.policy_id}</td>
                      <td className="py-3 px-4 text-[#D4D4D8] font-sans max-w-[250px] truncate" title={event.reason}>
                        {event.reason}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#000000] border border-[#27272A] text-[#FFFFFF] hover:border-[#FACC15]/40 transition text-[11px] font-bold"
                        >
                          Inspect
                        </button>
                        {permissions.canApprove ? (
                          <button
                            onClick={() => handleOpenDecision(event)}
                            className="px-3.5 py-1 rounded-lg bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000000] transition font-bold text-[11px] shadow-sm active:scale-95"
                          >
                            Decide (Admin)
                          </button>
                        ) : role === 'SECURITY_ANALYST' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold cursor-not-allowed"
                            title="Only Chief Security Officer (ADMIN) can authorize or reject operations."
                          >
                            <Lock className="w-3 h-3" />
                            Admin Required
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#000000] border border-[#27272A] text-[#D4D4D8] text-[10px] font-medium cursor-not-allowed"
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
        <div className="rounded-xl bg-[#121212] border border-[#27272A] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#27272A]">
            <h3 className="text-sm font-bold text-[#FFFFFF]">Historical Approval Decisions</h3>
            <p className="text-xs text-[#D4D4D8] mt-0.5">Auditable records of all past administrative authorizations</p>
          </div>
          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-[#000000] text-[#D4D4D8] border-b border-[#27272A]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Agent</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Action & Resource</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Approval Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Execution Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] font-mono">
                {allApprovalEvents
                  .filter(e => e.approval_status !== 'PENDING')
                  .slice(0, 10)
                  .map((event) => (
                    <tr key={event.id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">{event.id}</td>
                      <td className="py-3 px-4 text-[#FFFFFF] font-semibold">{event.agent_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#FFFFFF]">{event.action_type}</span>{' '}
                        <span className="text-[#D4D4D8] text-[11px] truncate inline-block max-w-[200px] align-bottom font-medium">
                          {event.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          event.approval_status === 'APPROVED'
                            ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
                            : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                        }`}>
                          {event.approval_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#D4D4D8] font-medium">
                        {event.execution_status}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleInspect(event.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#000000] border border-[#27272A] text-[#FFFFFF] hover:border-[#FACC15]/40 transition text-[11px] font-bold"
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
