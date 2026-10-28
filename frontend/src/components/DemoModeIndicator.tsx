'use client';

import React, { useState } from 'react';
import { Info, X, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';

export function DemoModeIndicator() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (isDismissed) return null;

  return (
    <>
      <aside 
        aria-label="Evaluation mode notification"
        className="bg-[#0B1320] border-b border-[#263244] text-[#94A3B8] px-3 sm:px-4 py-1.5 text-[11px] flex items-center justify-between z-30 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-mono font-bold text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            MST Testnet
          </span>
          <span className="hidden sm:inline text-[#F8FAFC] font-medium">Chain ID: 91562037</span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="text-[#94A3B8] truncate">
            Deterministic SHA-256 Engine Active • Live EVM Evidence Registry Connected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition text-[11px] min-h-[28px] px-1.5 rounded hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Judge / Evaluator Notice</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-[#64748B] hover:text-[#F8FAFC] transition rounded focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Evaluator Disclosure Modal */}
      {showModal && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="evaluator-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0B0F17] border border-[#263244] shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#263244]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h2 id="evaluator-modal-title" className="text-sm font-bold text-[#F8FAFC]">
                  Evaluator &amp; Judge Architecture Disclosure
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#94A3B8] leading-relaxed">
              <div className="p-3 rounded-lg bg-[#131A24] border border-[#263244] space-y-1">
                <span className="font-semibold text-emerald-400 block font-mono text-[10px] uppercase">
                  ✓ Real On-Chain MST Testnet Integration
                </span>
                <p>
                  SentinelMesh anchors evidence digests to an actual EVM smart contract (<code className="text-cyan-300 font-mono">EvidenceRegistry</code>) deployed on MST Testnet (Chain ID: <code className="text-cyan-300 font-mono">91562037</code>). Transactions can be inspected live on <a href="https://testnet.mstscan.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">MSTScan</a>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#131A24] border border-[#263244] space-y-1">
                <span className="font-semibold text-cyan-400 block font-mono text-[10px] uppercase">
                  ✓ Interactive RBAC Demo Switcher
                </span>
                <p>
                  To enable judges to test the complete permission matrix without requiring separate login credentials, the top-bar role selector immediately switches system authority among <strong>Chief Security Officer (ADMIN)</strong>, <strong>Security Analyst (ANALYST)</strong>, and <strong>Compliance Auditor (VIEWER)</strong>. Permissions are validated on both UI controls and backend routes.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#131A24] border border-[#263244] space-y-1">
                <span className="font-semibold text-amber-400 block font-mono text-[10px] uppercase">
                  ✓ Zero Host Execution Boundary
                </span>
                <p>
                  All agent executions remain in secure sandboxed simulation mode. Destructive commands or unauthorized queries are deterministically blocked before touching sensitive infrastructure.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#263244]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 hover:from-emerald-400 hover:to-cyan-400 transition"
              >
                Understood, Proceed to App
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
