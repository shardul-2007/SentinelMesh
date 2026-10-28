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
    <div className="mst-card p-4 sm:p-5 rounded-xl bg-[#121212] border border-[#27272A] shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 flex items-center justify-center">
            <Hash className="w-4 h-4 text-[#FACC15]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#FFFFFF]">Cryptographic Integrity Comparison</h3>
            <p className="text-[11px] text-[#D4D4D8]">
              Side-by-side local canonical digest vs. MST Blockchain EvidenceRegistry commitment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isMatch 
              ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
              : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
          }`}>
            {isMatch ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {isMatch ? '100% CRYPTOGRAPHIC MATCH' : 'HASH DIVERGENCE DETECTED'}
          </span>

          {onVerifyAgain && (
            <button
              type="button"
              onClick={onVerifyAgain}
              className="p-1.5 rounded-lg bg-[#000000] hover:bg-[#1C1C1C] text-[#D4D4D8] hover:text-[#FFFFFF] border border-[#27272A] transition"
              title="Re-read on-chain commitment"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FACC15]" />
            </button>
          )}
        </div>
      </div>

      {/* Side-by-side Hash Comparison Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Digest Panel */}
        <div className="p-4 rounded-xl bg-[#000000] border border-[#FACC15]/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#FACC15]">
              1. Local Canonical SHA-256 Digest
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(localHash, 'local')}
              className="text-[10px] text-[#D4D4D8] hover:text-[#FFFFFF] flex items-center gap-1 transition"
            >
              {copiedKey === 'local' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'local' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3 rounded-lg bg-[#121212] border border-[#27272A] font-mono text-[11px] text-[#FACC15] break-all select-all leading-relaxed font-bold">
            {localHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#D4D4D8] pt-1">
            <span>Algorithm: SHA-256</span>
            <span>Standard: RFC-8785 JSON</span>
          </div>
        </div>

        {/* On-Chain Commitment Panel */}
        <div className="p-4 rounded-xl bg-[#000000] border border-[#FACC15]/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#FACC15]">
              2. On-Chain Smart Contract Digest
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(onChainHash, 'onchain')}
              className="text-[10px] text-[#D4D4D8] hover:text-[#FFFFFF] flex items-center gap-1 transition"
            >
              {copiedKey === 'onchain' ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'onchain' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className={`p-3 rounded-lg bg-[#121212] border font-mono text-[11px] break-all select-all leading-relaxed font-bold ${
            isMatch ? 'border-[#FACC15]/40 text-[#FACC15]' : 'border-[#EF4444]/40 text-[#EF4444]'
          }`}>
            {onChainHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#D4D4D8] pt-1">
            <span>Contract: EvidenceRegistry</span>
            <span>Block: #{blockNumber.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Contract & Verification Footprint */}
      <div className="p-3.5 rounded-lg bg-[#000000] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[#D4D4D8] text-[11px]">EVM Contract Address:</span>{' '}
            <code className="text-[#FACC15] font-mono text-[11px] font-bold">{contractAddress}</code>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://testnet.mstscan.com/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FACC15] hover:underline flex items-center gap-1 text-[11px] font-bold"
          >
            <span>Inspect on MSTScan</span>
            <ExternalLink className="w-3 h-3 text-[#FACC15]" />
          </a>
          <span className="text-[#27272A]">|</span>
          <a
            href={`https://testnet.mstscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4D4D8] hover:text-[#FFFFFF] flex items-center gap-1 text-[11px] font-medium"
          >
            <span>View Receipt</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
