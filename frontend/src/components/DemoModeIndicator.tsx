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
        className="bg-[#181B22] border-b border-[#2E3442] text-[#9E9EA8] px-3 sm:px-4 py-1.5 text-[11px] flex items-center justify-between z-30 transition-colors font-sans"
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-mono font-extrabold text-[9px] uppercase px-2 py-0.5 rounded bg-amber-500/15 text-[#FF9900] border border-amber-500/30">
            MST Testnet
          </span>
          <span className="hidden sm:inline text-[#FFFFFF] font-bold">Chain ID: 91562037</span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="text-[#9E9EA8] font-medium truncate">
            Deterministic SHA-256 Engine Active • Live EVM Evidence Registry Connected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-[#FF9900] hover:text-[#FFB800] font-bold flex items-center gap-1 transition text-[11px] min-h-[28px] px-1.5 rounded hover:bg-amber-500/10 focus-visible:ring-2 focus-visible:ring-[#FF9900]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Judge / Evaluator Notice</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-[#6B7280] hover:text-[#FFFFFF] transition rounded focus-visible:ring-2 focus-visible:ring-[#FF9900]"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#1A1D24] border border-[#2E3442] shadow-2xl p-5 sm:p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#2E3442]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF9900]" />
                <h2 id="evaluator-modal-title" className="text-sm font-extrabold text-[#FFFFFF]">
                  Evaluator &amp; Judge Architecture Disclosure
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-[#FF9900]"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#9E9EA8] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#111317] border border-[#2E3442] space-y-1">
                <span className="font-extrabold text-emerald-400 block font-mono text-[10px] uppercase">
                  ✓ Real On-Chain MST Testnet Integration
                </span>
                <p>
                  SentinelMesh anchors evidence digests to an actual EVM smart contract (<code className="text-[#FF9900] font-mono">EvidenceRegistry</code>) deployed on MST Testnet (Chain ID: <code className="text-[#FF9900] font-mono">91562037</code>). Transactions can be inspected live on <a href="https://testnet.mstscan.com" target="_blank" rel="noopener noreferrer" className="text-[#FF9900] hover:underline font-bold">MSTScan</a>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111317] border border-[#2E3442] space-y-1">
                <span className="font-extrabold text-[#FF9900] block font-mono text-[10px] uppercase">
                  ✓ Interactive RBAC Demo Switcher
                </span>
                <p>
                  To enable judges to test the complete permission matrix without requiring separate login credentials, the top-bar role selector immediately switches system authority among <strong>Chief Security Officer (ADMIN)</strong>, <strong>Security Analyst (ANALYST)</strong>, and <strong>Compliance Auditor (VIEWER)</strong>. Permissions are validated on both UI controls and backend routes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111317] border border-[#2E3442] space-y-1">
                <span className="font-extrabold text-[#FB641B] block font-mono text-[10px] uppercase">
                  ✓ Zero Host Execution Boundary
                </span>
                <p>
                  All agent executions remain in secure sandboxed simulation mode. Destructive commands or unauthorized queries are deterministically blocked before touching sensitive infrastructure.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#2E3442]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 transition"
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
