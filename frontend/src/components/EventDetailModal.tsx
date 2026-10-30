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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-2xl bg-[#151F30] border border-[#263449] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F8FAFC]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#263449] flex items-center justify-between bg-[#101827]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E293B] border border-[#263449] flex items-center justify-center text-[#38BDF8]">
              <Shield className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Audit Event Inspection
              </h3>
              <p className="font-mono text-xs text-[#94A3B8]">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#F8FAFC]">
          {/* Append-only disclaimer callout */}
          <div className="p-3 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-[#38BDF8]">
              <span className="font-bold">Append-Only Immutability Notice:</span> This audit record is cryptographically indexed and cannot be altered or deleted. Historical modifications are strictly prevented.
            </div>
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#101827] border border-[#263449]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Policy Decision</span>
              <StatusBadge type="decision" value={event.policy_decision} size="sm" />
            </div>

            <div className="p-3 rounded-lg bg-[#101827] border border-[#263449]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Execution Status</span>
              <StatusBadge type="execution" value={event.execution_status} size="sm" />
            </div>

            <div className="p-3 rounded-lg bg-[#101827] border border-[#263449]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Requesting Agent</span>
              <span className="font-mono text-xs text-[#F8FAFC] font-bold">{event.agent_id}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#101827] border border-[#263449]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Timestamp (UTC)</span>
              <span className="font-mono text-xs text-[#94A3B8]">{new Date(event.timestamp).toUTCString()}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#101827] border border-[#263449]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Action Type</span>
              <span className="font-mono text-xs text-[#38BDF8] bg-[#1E293B] px-2 py-0.5 rounded border border-[#263449] font-bold">
                {event.action_type}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#101827] border border-[#263449]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Enforced Policy</span>
              <span className="font-mono text-xs text-[#F8FAFC] font-bold">{event.policy_id} (v{event.policy_version})</span>
            </div>
          </div>

          {/* Resource & Reason */}
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Target Resource</span>
              <div className="p-2 rounded-lg bg-[#101827] font-mono text-xs text-[#38BDF8] border border-[#263449] break-all select-all font-bold">
                {event.resource}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">Policy Rationale</span>
              <div className="p-2.5 rounded-lg bg-[#101827] border border-[#263449] text-xs text-[#94A3B8] leading-relaxed">
                {event.reason}
              </div>
            </div>
          </div>

          {/* Approval Decision Section if applicable */}
          {event.approval_decision && (
            <div className="p-3.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-1.5">
              <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider block">
                Human Authorization Record
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#94A3B8]">Reviewer: </span>
                  <span className="font-mono text-[#F8FAFC] font-bold">{event.approval_decision.approver_id}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Decision: </span>
                  <span className="font-bold text-[#F59E0B]">{event.approval_decision.decision}</span>
                </div>
              </div>
              {event.approval_decision.note && (
                <div className="text-[11px] text-[#F8FAFC] italic pt-1 border-t border-[#F59E0B]/30">
                  &ldquo;{event.approval_decision.note}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Integrity Chaining */}
          <div className="p-3.5 rounded-lg bg-[#101827] border border-[#263449] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-[11px] font-bold text-[#F8FAFC] uppercase tracking-wider">
                  Cryptographic Integrity (SHA-256)
                </span>
              </div>
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#38BDF8] transition"
              >
                {copiedHash ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2 rounded-lg bg-[#151F30] border border-[#263449] font-mono text-[11px] text-[#38BDF8] break-all select-all font-semibold">
              {event.integrity_hash}
            </div>

            {event.previous_event_hash && (
              <div className="pt-2 border-t border-[#263449]">
                <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] mb-0.5">
                  <LinkIcon className="w-3 h-3 text-[#94A3B8]" />
                  <span>Previous Event Hash (Hash Chain):</span>
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] break-all select-all">
                  {event.previous_event_hash}
                </div>
              </div>
            )}
          </div>

          {/* Raw Metadata JSON */}
          <div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">
              Structured Event Metadata
            </span>
            <pre className="p-3 rounded-lg bg-[#101827] text-[#94A3B8] font-mono text-[11px] overflow-x-auto max-h-36 border border-[#263449]">
              {JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        </div>

        {/* Verification Feedback Banner */}
        {verificationFeedback && (
          <div className="mx-5 mb-3 p-2.5 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-xs font-mono text-[#38BDF8]">
            {verificationFeedback}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#263449] bg-[#101827] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {permissions.canVerifyHashes ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/25 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Checking...' : 'Verify Hash'}</span>
              </button>
            ) : (
              <span className="text-[10px] text-[#94A3B8] font-mono px-2 py-1 bg-[#101827] rounded-lg border border-[#263449]">
                Auditor Read-Only
              </span>
            )}

            {permissions.canAnchor ? (
              <button
                onClick={handleAnchor}
                disabled={isAnchoring}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#38BDF8] text-[#090D16] hover:bg-[#0284C7] transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-[#090D16]" />
                <span>{isAnchoring ? 'Submitting Tx...' : 'Anchor On-Chain'}</span>
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B] cursor-not-allowed"
                title="Only Chief Security Officer (ADMIN) can submit transactions to MST Blockchain."
              >
                <Lock className="w-3 h-3" />
                Anchor Gated (Admin Only)
              </span>
            )}

            {onApprove && event.policy_decision === 'REQUIRE_APPROVAL' && (
              <button
                onClick={onApprove}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#F59E0B] text-[#090D16] hover:bg-[#D97706] transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Review / Authorize</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#F8FAFC] bg-[#1E293B] border border-[#263449] hover:bg-[#263449] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
