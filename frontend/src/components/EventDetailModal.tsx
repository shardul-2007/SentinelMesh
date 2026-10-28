'use client';

import React from 'react';
import { X, Shield, Hash, Link as LinkIcon, AlertCircle, Copy, Check, Lock, ShieldCheck } from 'lucide-react';
import { AuditEventDetail } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { api } from '@/lib/api';

interface EventDetailModalProps {
  event: AuditEventDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#D9DDE2] rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#171A1F]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#D9DDE2] flex items-center justify-between bg-[#F9F9F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#F5F4F0] border border-[#D9DDE2] flex items-center justify-center text-[#315C78]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#171A1F]">
                Audit Event Inspection
              </h3>
              <p className="font-mono text-xs text-[#737B86]">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#737B86] hover:text-[#171A1F] hover:bg-[#E8EBEF] transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#171A1F]">
          {/* Append-only disclaimer callout */}
          <div className="p-3 rounded bg-[#EDF6F2] border border-[#BCE2D1] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#287653] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-[#287653]">
              <span className="font-semibold">Append-Only Immutability Notice:</span> This audit record is cryptographically indexed and cannot be altered or deleted. Historical modifications are strictly prevented.
            </div>
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Policy Decision</span>
              <StatusBadge type="decision" value={event.policy_decision} size="sm" />
            </div>

            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Execution Status</span>
              <StatusBadge type="execution" value={event.execution_status} size="sm" />
            </div>

            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Requesting Agent</span>
              <span className="font-mono text-xs text-[#171A1F] font-semibold">{event.agent_id}</span>
            </div>

            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Timestamp (UTC)</span>
              <span className="font-mono text-xs text-[#737B86]">{new Date(event.timestamp).toUTCString()}</span>
            </div>

            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Action Type</span>
              <span className="font-mono text-xs text-[#171A1F] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#D9DDE2] font-semibold">
                {event.action_type}
              </span>
            </div>

            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Enforced Policy</span>
              <span className="font-mono text-xs text-[#171A1F] font-semibold">{event.policy_id} (v{event.policy_version})</span>
            </div>
          </div>

          {/* Resource & Reason */}
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Target Resource</span>
              <div className="p-2 rounded bg-[#F5F4F0] font-mono text-xs text-[#171A1F] border border-[#D9DDE2] break-all select-all">
                {event.resource}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">Policy Rationale</span>
              <div className="p-2.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-xs text-[#171A1F] leading-relaxed">
                {event.reason}
              </div>
            </div>
          </div>

          {/* Approval Decision Section if applicable */}
          {event.approval_decision && (
            <div className="p-3.5 rounded bg-[#FDF7ED] border border-[#F5DEB3] space-y-1.5">
              <span className="text-[11px] font-semibold text-[#98661C] uppercase tracking-wider block">
                Human Authorization Record
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#737B86]">Reviewer: </span>
                  <span className="font-mono text-[#171A1F] font-semibold">{event.approval_decision.approver_id}</span>
                </div>
                <div>
                  <span className="text-[#737B86]">Decision: </span>
                  <span className="font-semibold text-[#98661C]">{event.approval_decision.decision}</span>
                </div>
              </div>
              {event.approval_decision.note && (
                <div className="text-[11px] text-[#171A1F] italic pt-1 border-t border-[#F5DEB3]">
                  &ldquo;{event.approval_decision.note}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Integrity Chaining */}
          <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#315C78]" />
                <span className="text-[11px] font-semibold text-[#171A1F] uppercase tracking-wider">
                  Cryptographic Integrity (SHA-256)
                </span>
              </div>
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1 text-[11px] text-[#737B86] hover:text-[#171A1F] transition"
              >
                {copiedHash ? <Check className="w-3 h-3 text-[#287653]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2 rounded bg-[#FFFFFF] border border-[#D9DDE2] font-mono text-[11px] text-[#171A1F] break-all select-all">
              {event.integrity_hash}
            </div>

            {event.previous_event_hash && (
              <div className="pt-2 border-t border-[#D9DDE2]">
                <div className="flex items-center gap-1 text-[10px] text-[#737B86] mb-0.5">
                  <LinkIcon className="w-3 h-3 text-[#737B86]" />
                  <span>Previous Event Hash (Hash Chain):</span>
                </div>
                <div className="font-mono text-[10px] text-[#737B86] break-all select-all">
                  {event.previous_event_hash}
                </div>
              </div>
            )}
          </div>

          {/* Raw Metadata JSON */}
          <div>
            <span className="text-[10px] font-semibold text-[#737B86] uppercase tracking-wider block mb-1">
              Structured Event Metadata
            </span>
            <pre className="p-3 rounded bg-[#242A32] text-[#F5F4F0] font-mono text-[11px] overflow-x-auto max-h-36 border border-[#3D4552]">
              {JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        </div>

        {/* Verification Feedback Banner */}
        {verificationFeedback && (
          <div className="mx-5 mb-3 p-2.5 rounded bg-[#EDF6F2] border border-[#BCE2D1] text-xs font-mono text-[#287653]">
            {verificationFeedback}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#D9DDE2] bg-[#F9F9F8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-2.5 py-1.5 rounded text-xs font-semibold bg-[#EDF6F2] border border-[#BCE2D1] text-[#287653] hover:bg-[#D5EDDF] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Checking...' : 'Verify Hash'}</span>
            </button>
            <button
              onClick={handleAnchor}
              disabled={isAnchoring}
              className="px-2.5 py-1.5 rounded text-xs font-semibold bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAnchoring ? 'Submitting Tx...' : 'Anchor On-Chain (Admin)'}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs font-medium text-[#171A1F] bg-[#FFFFFF] border border-[#D9DDE2] hover:bg-[#F5F4F0] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
