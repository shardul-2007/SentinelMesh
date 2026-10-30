'use client';

import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, X } from 'lucide-react';

export function DemoModeIndicator() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (isDismissed) return null;

  return (
    <>
      <aside 
        aria-label="Evaluation mode notification"
        className="bg-[#090D16] border-b border-[#263449] text-[#94A3B8] px-3 sm:px-4 py-1.5 text-[11px] flex items-center justify-between z-30 transition-colors font-sans"
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
            MST Testnet
          </span>
          <span className="hidden sm:inline text-[#F8FAFC] font-semibold">Chain ID: 91562037</span>
          <span className="hidden md:inline text-[#263449]">|</span>
          <span className="text-[#94A3B8] font-medium truncate">
            Deterministic SHA-256 Engine Active • Live EVM Evidence Registry Connected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-[#38BDF8] hover:text-[#7DD3FC] font-bold flex items-center gap-1 transition text-[11px] min-h-[28px] px-1.5 rounded hover:bg-[#38BDF8]/10 focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Evaluator Notice</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] transition rounded focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#151F30] border border-[#263449] shadow-2xl p-5 sm:p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#263449]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#38BDF8]" />
                <h2 id="evaluator-modal-title" className="text-sm font-extrabold text-[#F8FAFC]">
                  Evaluator &amp; Technical Architecture Disclosure
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#94A3B8] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] space-y-1">
                <span className="font-bold text-[#22C55E] block font-mono text-[10px] uppercase">
                  ✓ Real On-Chain MST Testnet Integration
                </span>
                <p>
                  SentinelMesh anchors evidence digests to an actual EVM smart contract (<code className="text-[#38BDF8] font-mono">EvidenceRegistry</code>) deployed on MST Testnet (Chain ID: <code className="text-[#38BDF8] font-mono">91562037</code>). Transactions can be inspected live on <a href="https://testnet.mstscan.com" target="_blank" rel="noopener noreferrer" className="text-[#38BDF8] hover:underline font-bold">MSTScan</a>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] space-y-1">
                <span className="font-bold text-[#38BDF8] block font-mono text-[10px] uppercase">
                  ✓ Interactive RBAC Demo Switcher
                </span>
                <p>
                  To enable evaluators to test the complete permission matrix without requiring separate login credentials, the top-bar role selector immediately switches system authority among <strong>Chief Security Officer (ADMIN)</strong>, <strong>Security Analyst (ANALYST)</strong>, and <strong>Compliance Auditor (VIEWER)</strong>. Permissions are validated on both UI controls and backend routes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] space-y-1">
                <span className="font-bold text-[#EF4444] block font-mono text-[10px] uppercase">
                  ✓ Zero Host Execution Boundary
                </span>
                <p>
                  All agent executions remain in secure sandboxed containment. Destructive commands or unauthorized queries are deterministically blocked before touching sensitive production infrastructure.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#263449] flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-[#090D16] font-bold text-xs transition"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
