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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-graphite-900 border border-graphite-750 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-graphite-750 flex items-center justify-between bg-graphite-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-graphite-750 border border-graphite-700 flex items-center justify-center text-slate-300">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Audit Event Inspection
              </h3>
              <p className="font-mono text-xs text-slate-400">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-graphite-750 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Append-only disclaimer callout */}
          <div className="p-3.5 rounded-lg bg-graphite-850 border border-graphite-700/80 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-emerald-400">Append-Only Immutability Notice:</span> This audit record is cryptographically indexed and cannot be altered or deleted through the platform. Historical modifications are strictly prohibited.
            </div>
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-graphite-950/60 border border-graphite-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Policy Decision</span>
              <StatusBadge type="decision" value={event.policy_decision} size="md" />
            </div>

            <div className="p-3 rounded-lg bg-graphite-950/60 border border-graphite-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Execution Status</span>
              <StatusBadge type="execution" value={event.execution_status} size="md" />
            </div>

            <div className="p-3 rounded-lg bg-graphite-950/60 border border-graphite-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Requesting Agent</span>
              <span className="font-mono text-xs text-slate-200 font-medium">{event.agent_id}</span>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950/60 border border-graphite-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Timestamp (UTC)</span>
              <span className="font-mono text-xs text-slate-300">{new Date(event.timestamp).toUTCString()}</span>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950/60 border border-graphite-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Action Type</span>
              <span className="font-mono text-xs text-slate-200 bg-graphite-800 px-2 py-0.5 rounded border border-graphite-700">
                {event.action_type}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-graphite-950/60 border border-graphite-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Enforced Policy</span>
              <span className="font-mono text-xs text-slate-200">{event.policy_id} (v{event.policy_version})</span>
            </div>
          </div>

          {/* Resource & Reason */}
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Resource Identifier</span>
              <div className="p-2.5 rounded bg-graphite-950 font-mono text-xs text-emerald-400/90 border border-graphite-800 break-all">
                {event.resource}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Policy Rationale</span>
              <div className="p-3 rounded bg-graphite-850 border border-graphite-750 text-xs text-slate-300 leading-relaxed">
                {event.reason}
              </div>
            </div>
          </div>

          {/* Approval Decision Section if applicable */}
          {event.approval_decision && (
            <div className="p-4 rounded-lg bg-graphite-850/80 border border-graphite-700 space-y-2">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Human Authorization Record
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Decided by: </span>
                  <span className="font-mono text-slate-200">{event.approval_decision.approver_id}</span>
                </div>
                <div>
                  <span className="text-slate-400">Outcome: </span>
                  <span className="font-semibold text-slate-200">{event.approval_decision.decision}</span>
                </div>
              </div>
              {event.approval_decision.note && (
                <div className="text-xs text-slate-300 italic pt-1 border-t border-graphite-750">
                  &ldquo;{event.approval_decision.note}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Integrity Chaining (Phase 2 Foundation) */}
          <div className="p-4 rounded-lg bg-graphite-950 border border-graphite-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Cryptographic Integrity (SHA-256)
                </span>
              </div>
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded bg-graphite-900 border border-graphite-750 font-mono text-[11px] text-slate-300 break-all select-all">
              {event.integrity_hash}
            </div>

            {event.previous_event_hash && (
              <div className="pt-2 border-t border-graphite-850">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                  <LinkIcon className="w-3 h-3 text-slate-500" />
                  <span>Previous Event Hash (Hash Chain):</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 break-all select-all">
                  {event.previous_event_hash}
                </div>
              </div>
            )}
          </div>

          {/* Raw Metadata JSON */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Structured Event Metadata
            </span>
            <pre className="p-3 rounded bg-graphite-950 border border-graphite-800 font-mono text-[11px] text-slate-400 overflow-x-auto max-h-36">
              {JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        </div>

        {/* Verification Feedback Banner */}
        {verificationFeedback && (
          <div className="mx-6 mb-3 p-3 rounded-lg bg-graphite-950 border border-graphite-700 text-xs font-mono text-emerald-300">
            {verificationFeedback}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-graphite-750 bg-graphite-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying...' : 'Verify Integrity'}</span>
            </button>
            <button
              onClick={handleAnchor}
              disabled={isAnchoring}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-950/80 border border-blue-800 text-blue-300 hover:bg-blue-900 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAnchoring ? 'Submitting Tx...' : 'Anchor On-Chain (Admin)'}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-graphite-800 border border-graphite-700 hover:bg-graphite-750 hover:text-white transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
