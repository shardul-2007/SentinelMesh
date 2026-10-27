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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-graphite-900 border border-graphite-750 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-graphite-750 flex items-center justify-between bg-graphite-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Pending Action Review</h3>
              <p className="font-mono text-xs text-slate-400">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-graphite-750 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Target details */}
          <div className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Agent:</span>
              <span className="font-mono font-medium text-slate-200">{event.agent_id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Requested Action:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-graphite-800 text-amber-300 border border-graphite-700">
                {event.action_type}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Target Resource:</span>
              <span className="font-mono text-slate-300 break-all text-right max-w-[260px]">{event.resource}</span>
            </div>
            <div className="pt-2 border-t border-graphite-850 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Policy Trigger:</span> {event.reason}
            </div>
          </div>

          {/* Protected authorization callout */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Administrative Auth Key (Required)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin authorization key"
                className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs font-mono focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Development default: <code className="text-slate-400 font-mono">sentinel-admin-dev-key-phase1</code>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Approver Identity</label>
              <input
                type="text"
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Decision Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Specify justification or conditions for this decision"
                className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Simulation disclaimer */}
          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Phase 1 Guardrail: Approved actions execute strictly in simulated mode. Destructive actions will never impact external live systems.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-graphite-750 bg-graphite-850 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit('REJECTED')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900/60 transition disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Request</span>
          </button>
          <button
            onClick={() => handleSubmit('APPROVED')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Authorize (Simulated)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
