'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, XCircle, Key, AlertTriangle } from 'lucide-react';
import { AuditEventSummary } from '@/lib/types';
import { api } from '@/lib/api';

interface ApprovalModalProps {
  event: AuditEventSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onDecisionSubmitted: () => void;
}

export function ApprovalModal({ event, isOpen, onClose, onDecisionSubmitted }: ApprovalModalProps) {
  const [adminKey, setAdminKey] = useState('sentinel-admin-dev-key-phase1');
  const [approverId, setApproverId] = useState('security-admin');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleSubmit = async (decision: 'APPROVED' | 'REJECTED') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.submitApprovalDecision(
        event.id,
        {
          decision,
          approver_id: approverId,
          note: note.trim() || undefined,
        }
      );
      setIsLoading(false);
      onDecisionSubmitted();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Authorization failed or invalid key.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#131A24] border border-[#263244] rounded shadow-2xl flex flex-col overflow-hidden text-[#F8FAFC]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#263244] flex items-center justify-between bg-[#1A2332]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Action Review & Authorization</h3>
              <p className="font-mono text-xs text-[#94A3B8]">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#263244] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target details */}
          <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#94A3B8]">Requesting Agent:</span>
              <span className="font-mono font-semibold text-[#F8FAFC]">{event.agent_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#94A3B8]">Requested Operation:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
                {event.action_type}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#94A3B8]">Target Resource:</span>
              <span className="font-mono text-[#38BDF8] break-all text-right max-w-[260px] select-all">{event.resource}</span>
            </div>
            <div className="pt-2 border-t border-[#263244] text-[11px] text-[#94A3B8]">
              <span className="font-semibold text-[#F8FAFC]">Policy Trigger:</span> {event.reason}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC] mb-1">
                <Key className="w-3.5 h-3.5 text-[#F59E0B]" />
                Administrative Auth Key (Required)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin authorization key"
                className="w-full px-3 py-1.5 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none placeholder-[#64748B]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#F8FAFC] block mb-1">Approver Identity</label>
              <input
                type="text"
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs focus:border-[#38BDF8] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#F8FAFC] block mb-1">Authorization Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Specify justification or conditions for this decision"
                className="w-full px-3 py-1.5 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs focus:border-[#38BDF8] focus:outline-none resize-none placeholder-[#64748B]"
              />
            </div>
          </div>

          {/* Execution Isolation Notice */}
          <div className="p-3 rounded bg-[#0B0F17] border border-[#263244] text-[11px] text-[#94A3B8] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <span>
              Execution Isolation Guardrail: Approved operations run strictly within an isolated containment environment. Destructive commands will never execute against unconstrained external infrastructure.
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#263244] bg-[#1A2332] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#263244] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit('REJECTED')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-[#EF4444] bg-[#EF4444]/15 border border-[#EF4444]/30 hover:bg-[#EF4444]/25 transition disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Request</span>
          </button>
          <button
            onClick={() => handleSubmit('APPROVED')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold text-[#0B0F17] bg-[#10B981] hover:bg-[#059669] transition disabled:opacity-50 shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Authorize (Simulated)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
