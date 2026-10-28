'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, XCircle, Key, AlertTriangle } from 'lucide-react';
import { AuditEventSummary } from '@/lib/types';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';

interface ApprovalModalProps {
  event: AuditEventSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onDecisionSubmitted: () => void;
}

export function ApprovalModal({ event, isOpen, onClose, onDecisionSubmitted }: ApprovalModalProps) {
  const { role, permissions, roleTitle } = useRBAC();
  const [adminKey, setAdminKey] = useState('sentinel-admin-dev-key-phase1');
  const [approverId, setApproverId] = useState(role === 'ADMIN' ? 'chief-security-officer' : 'user');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleSubmit = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!permissions.canApprove) {
      setErrorMsg(`Authorization restricted: active role '${roleTitle}' cannot grant approvals. Switch to CSO / Admin.`);
      return;
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-lg bg-[#2D3238] border border-[#414850] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#FFFFFF]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#414850] flex items-center justify-between bg-[#2D3238]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF]">Action Review &amp; Authorization</h3>
              <p className="font-mono text-xs text-[#A0A5AD]">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A0A5AD] hover:text-[#FFFFFF] hover:bg-[#353B42] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target details */}
          <div className="p-3.5 rounded-lg bg-[#1A1D20] border border-[#414850] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#A0A5AD]">Requesting Agent:</span>
              <span className="font-mono font-bold text-[#FFFFFF]">{event.agent_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A0A5AD]">Requested Operation:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-bold">
                {event.action_type}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A0A5AD]">Target Resource:</span>
              <span className="font-mono text-[#00FA9A] break-all text-right max-w-[260px] select-all font-semibold">{event.resource}</span>
            </div>
            <div className="pt-2 border-t border-[#414850] text-[11px] text-[#A0A5AD]">
              <span className="font-bold text-[#FFFFFF]">Policy Trigger:</span> {event.reason}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#FFFFFF] mb-1">
                <Key className="w-3.5 h-3.5 text-[#00FA9A]" />
                Administrative Auth Key (Required)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin authorization key"
                className="w-full px-3 py-1.5 rounded-lg bg-[#1A1D20] border border-[#414850] text-[#FFFFFF] text-xs font-mono focus:border-[#00FA9A] focus:outline-none placeholder-[#A0A5AD]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#FFFFFF] block mb-1">Approver Identity</label>
              <input
                type="text"
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#1A1D20] border border-[#414850] text-[#FFFFFF] text-xs focus:border-[#00FA9A] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#FFFFFF] block mb-1">Authorization Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Specify justification or conditions for this decision"
                className="w-full px-3 py-1.5 rounded-lg bg-[#1A1D20] border border-[#414850] text-[#FFFFFF] text-xs focus:border-[#00FA9A] focus:outline-none resize-none placeholder-[#A0A5AD]"
              />
            </div>
          </div>

          {/* Execution Isolation Notice */}
          <div className="p-3 rounded-lg bg-[#1A1D20] border border-[#414850] text-[11px] text-[#A0A5AD] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <span>
              Execution Isolation Guardrail: Approved operations run strictly within an isolated containment environment. Destructive commands will never execute against unconstrained external infrastructure.
            </span>
          </div>

          {!permissions.canApprove && (
            <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs flex items-center gap-2">
              <Key className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
              <span>
                <strong>RBAC Restriction:</strong> You are viewing as <strong>{roleTitle}</strong>. Authorization decisions require <strong>Chief Security Officer (ADMIN)</strong> privileges.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#414850] bg-[#2D3238] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#A0A5AD] hover:text-[#FFFFFF] hover:bg-[#353B42] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit('REJECTED')}
            disabled={isLoading || !permissions.canApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#EF4444] bg-[#EF4444]/15 border border-[#EF4444]/30 hover:bg-[#EF4444]/25 transition disabled:opacity-40"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Request</span>
          </button>
          <button
            onClick={() => handleSubmit('APPROVED')}
            disabled={isLoading || !permissions.canApprove}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#1A1D20] bg-[#00FA9A] hover:bg-[#00E58B] transition disabled:opacity-40 shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5 text-[#1A1D20]" />
            <span>Authorize (Simulated)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
