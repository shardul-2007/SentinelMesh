'use client';

import React from 'react';
import { X, Shield, Hash, Link as LinkIcon, AlertCircle, Copy, Check, Lock, ShieldCheck } from 'lucide-react';
import { AuditEventDetail } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';

interface EventDetailModalProps {
  event: AuditEventDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
}

export function EventDetailModal({ event, isOpen, onClose, onApprove }: EventDetailModalProps) {
  const { role, permissions, roleTitle } = useRBAC();
  const [copiedHash, setCopiedHash] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isAnchoring, setIsAnchoring] = React.useState(false);
  const [verificationFeedback, setVerificationFeedback] = React.useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(event.integrity_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationFeedback(null);
    try {
      const res = await api.verifyEventIntegrity(event.id);
      setVerificationFeedback(`[${res.status}] ${res.message}`);
    } catch (err: any) {
      setVerificationFeedback(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAnchor = async () => {
    setIsAnchoring(true);
    try {
      const res = await api.anchorEvent(event.id);
      alert(`Audit hash successfully anchored on-chain!\nTx Hash: ${res.transaction_hash}\nBlock: #${res.block_number}`);
    } catch (err: any) {
      alert(`Anchoring failed: ${err.message}`);
    } finally {
      setIsAnchoring(false);
    }
  };

  let parsedMetadata = {};
  try {
    parsedMetadata = typeof event.event_metadata === 'string' ? JSON.parse(event.event_metadata) : event.event_metadata;
  } catch {
    parsedMetadata = { raw: event.event_metadata };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090D16]/40 backdrop-blur-xs font-sans">
      <div 
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#172B4D]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
              <Shield className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">
                Audit Event Inspection
              </h3>
              <p className="font-mono text-xs text-[#64748B]">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F1F5F9] transition text-xs font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#172B4D]">
          {/* Append-only disclaimer callout */}
          <div className="p-3 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-[#2563EB]">
              <span className="font-bold">Append-Only Immutability Notice:</span> This audit record is cryptographically indexed and cannot be altered or deleted. Historical modifications are strictly prevented.
            </div>
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Policy Decision</span>
              <StatusBadge type="decision" value={event.policy_decision} size="sm" />
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Execution Status</span>
              <StatusBadge type="execution" value={event.execution_status} size="sm" />
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Requesting Agent</span>
              <span className="font-mono text-xs text-[#172B4D] font-bold">{event.agent_id}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Timestamp (UTC)</span>
              <span className="font-mono text-xs text-[#64748B]">{new Date(event.timestamp).toUTCString()}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Action Type</span>
              <span className="font-mono text-xs text-[#2563EB] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E5E7EB] font-bold">
                {event.action_type}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Enforced Policy</span>
              <span className="font-mono text-xs text-[#172B4D] font-bold">{event.policy_id} (v{event.policy_version})</span>
            </div>
          </div>

          {/* Resource & Reason */}
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Target Resource</span>
              <div className="p-2 rounded-lg bg-[#F8FAFC] font-mono text-xs text-[#2563EB] border border-[#E5E7EB] break-all select-all font-bold">
                {event.resource}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Policy Rationale</span>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-xs text-[#64748B] leading-relaxed">
                {event.reason}
              </div>
            </div>
          </div>

          {/* Approval Decision Section if applicable */}
          {event.approval_decision && (
            <div className="p-3.5 rounded-lg bg-[#D97706]/10 border border-[#D97706]/20 space-y-1.5">
              <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block">
                Human Authorization Record
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#64748B]">Reviewer: </span>
                  <span className="font-mono text-[#172B4D] font-bold">{event.approval_decision.approver_id}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Decision: </span>
                  <span className="font-bold text-[#D97706]">{event.approval_decision.decision}</span>
                </div>
              </div>
              {event.approval_decision.note && (
                <div className="text-[11px] text-[#172B4D] italic pt-1 border-t border-[#D97706]/20">
                  &ldquo;{event.approval_decision.note}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Integrity Chaining */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-[11px] font-bold text-[#172B4D] uppercase tracking-wider">
                  Cryptographic Integrity (SHA-256)
                </span>
              </div>
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#2563EB] transition"
              >
                {copiedHash ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] font-mono text-[11px] text-[#2563EB] break-all select-all font-semibold">
              {event.integrity_hash}
            </div>

            {event.previous_event_hash && (
              <div className="pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-1 text-[10px] text-[#64748B] mb-0.5">
                  <LinkIcon className="w-3 h-3 text-[#64748B]" />
                  <span>Previous Event Hash (Hash Chain):</span>
                </div>
                <div className="font-mono text-[10px] text-[#64748B] break-all select-all">
                  {event.previous_event_hash}
                </div>
              </div>
            )}
          </div>

          {/* Raw Metadata JSON */}
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Structured Event Metadata
            </span>
            <pre className="p-3 rounded-lg bg-[#F8FAFC] text-[#172B4D] font-mono text-[11px] overflow-x-auto max-h-36 border border-[#E5E7EB]">
              {JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        </div>

        {/* Verification Feedback Banner */}
        {verificationFeedback && (
          <div className="mx-5 mb-3 p-2.5 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs font-mono text-[#2563EB]">
            {verificationFeedback}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {permissions.canVerifyHashes ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/20 transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Checking...' : 'Verify Hash'}</span>
              </button>
            ) : (
              <span className="text-[10px] text-[#64748B] font-mono px-2 py-1 bg-[#F1F5F9] rounded-lg border border-[#E5E7EB]">
                Auditor Read-Only
              </span>
            )}

            {permissions.canAnchor ? (
              <button
                onClick={handleAnchor}
                disabled={isAnchoring}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] text-[#FFFFFF] hover:bg-[#1D4ED8] transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-[#FFFFFF]" />
                <span>{isAnchoring ? 'Submitting Tx...' : 'Anchor On-Chain'}</span>
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#D97706]/10 border border-[#D97706]/20 text-[#D97706] cursor-not-allowed"
                title="Only Chief Security Officer (ADMIN) can submit transactions to MST Blockchain."
              >
                <Lock className="w-3 h-3" />
                Anchor Gated (Admin Only)
              </span>
            )}

            {onApprove && event.policy_decision === 'REQUIRE_APPROVAL' && (
              <button
                onClick={onApprove}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#D97706] text-[#FFFFFF] hover:bg-[#B45309] transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Review / Authorize</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#172B4D] bg-[#FFFFFF] border border-[#E5E7EB] hover:bg-[#F1F5F9] transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
