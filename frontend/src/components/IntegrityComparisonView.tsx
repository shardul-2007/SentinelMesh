'use client';

import React, { useState } from 'react';
import { 
  Hash, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';

interface IntegrityComparisonViewProps {
  eventId?: string;
  localHash?: string;
  onChainHash?: string;
  contractAddress?: string;
  txHash?: string;
  blockNumber?: number;
  onVerifyAgain?: () => void;
}

export function IntegrityComparisonView({
  eventId = 'evt_mst_001',
  localHash = 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e',
  onChainHash = 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e',
  contractAddress = '0x00E08271A37df1E90E95F062F814D7336D5369Ce',
  txHash = '0x9a8f273b5c104e8d3f6291a847291a03e18f8b39487c6e5a01948372615a9b8c',
  blockNumber = 1428594,
  onVerifyAgain
}: IntegrityComparisonViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanLocal = localHash.toLowerCase().replace(/^0x/, '');
  const cleanOnChain = onChainHash.toLowerCase().replace(/^0x/, '');
  const isMatch = cleanLocal.length === 64 && cleanLocal === cleanOnChain;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="mst-card p-4 sm:p-5 rounded-xl bg-[#131A24] border border-[#263244] shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263244]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Cryptographic Integrity Comparison</h3>
            <p className="text-[11px] text-[#94A3B8]">
              Side-by-side local canonical digest vs. MST Blockchain EvidenceRegistry commitment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isMatch 
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
          }`}>
            {isMatch ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {isMatch ? '100% CRYPTOGRAPHIC MATCH' : 'HASH DIVERGENCE DETECTED'}
          </span>

          {onVerifyAgain && (
            <button
              type="button"
              onClick={onVerifyAgain}
              className="p-1.5 rounded-lg bg-[#0B0F17] hover:bg-[#1A2332] text-[#94A3B8] hover:text-white border border-[#263244] transition"
              title="Re-read on-chain commitment"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Side-by-side Hash Comparison Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Digest Panel */}
        <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#263244] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-semibold text-cyan-400">
              1. Local Canonical SHA-256 Digest
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(localHash, 'local')}
              className="text-[10px] text-[#94A3B8] hover:text-white flex items-center gap-1 transition"
            >
              {copiedKey === 'local' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'local' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3 rounded-lg bg-[#131A24] border border-[#263244] font-mono text-[11px] text-[#F8FAFC] break-all select-all leading-relaxed">
            {localHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1">
            <span>Algorithm: SHA-256</span>
            <span>Standard: RFC-8785 JSON</span>
          </div>
        </div>

        {/* On-Chain Commitment Panel */}
        <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#263244] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-semibold text-emerald-400">
              2. On-Chain Smart Contract Digest
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(onChainHash, 'onchain')}
              className="text-[10px] text-[#94A3B8] hover:text-white flex items-center gap-1 transition"
            >
              {copiedKey === 'onchain' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'onchain' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className={`p-3 rounded-lg bg-[#131A24] border font-mono text-[11px] break-all select-all leading-relaxed ${
            isMatch ? 'border-emerald-500/30 text-emerald-300' : 'border-red-500/40 text-red-300'
          }`}>
            {onChainHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1">
            <span>Contract: EvidenceRegistry</span>
            <span>Block: #{blockNumber.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Contract & Verification Footprint */}
      <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[#94A3B8] text-[11px]">EVM Contract Address:</span>{' '}
            <code className="text-cyan-300 font-mono text-[11px] font-semibold">{contractAddress}</code>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://testnet.mstscan.com/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
          >
            <span>Inspect on MSTScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-slate-600">|</span>
          <a
            href={`https://testnet.mstscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#94A3B8] hover:text-white flex items-center gap-1 text-[11px]"
          >
            <span>View Receipt</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
