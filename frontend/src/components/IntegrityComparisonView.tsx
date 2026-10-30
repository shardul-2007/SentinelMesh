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
  CheckCircle2
} from 'lucide-react';

interface IntegrityComparisonViewProps {
  eventId?: string;
  localHash?: string;
  onChainHash?: string;
  contractAddress?: string;
  txHash?: string;
  blockNumber?: number;
  onVerifyAgain?: () => void;
  isSimulated?: boolean;
}

export function IntegrityComparisonView({
  eventId = 'evt_contract_deploy_mst',
  localHash = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
  onChainHash = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
  contractAddress = '0x0539fc70ee18fa936395c8dd6db623af6b43ceca',
  txHash = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
  blockNumber = 6688112,
  onVerifyAgain,
  isSimulated = false
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
    <div className="p-5 rounded-2xl bg-[#151F30] border border-[#263449] shadow-xl space-y-4 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263449]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center flex-shrink-0">
            <Hash className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Cryptographic Integrity Comparison</h3>
            <p className="text-[11px] text-[#94A3B8]">
              Side-by-side local canonical RFC-8785 digest vs. MST Blockchain EvidenceRegistry commitment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isMatch 
              ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
              : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
          }`}>
            {isMatch ? <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />}
            {isMatch ? '100% CRYPTOGRAPHIC MATCH' : 'HASH DIVERGENCE DETECTED'}
          </span>

          {onVerifyAgain && (
            <button
              type="button"
              onClick={onVerifyAgain}
              className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-[#263449] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#263449] transition"
              title="Re-read on-chain commitment"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
            </button>
          )}
        </div>
      </div>

      {/* Side-by-side Hash Comparison Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Digest Panel */}
        <div className="p-4 rounded-xl bg-[#101827] border border-[#263449] hover:border-[#38BDF8]/30 space-y-2 overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#38BDF8]">
              1. Local Canonical SHA-256 Digest
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(localHash, 'local')}
              className="text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1 transition flex-shrink-0"
            >
              {copiedKey === 'local' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'local' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3 rounded-lg bg-[#151F30] border border-[#263449] font-mono text-[11px] text-[#38BDF8] break-all select-all leading-relaxed font-bold">
            {localHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] pt-1">
            <span>Algorithm: SHA-256</span>
            <span>Standard: RFC-8785 JSON</span>
          </div>
        </div>

        {/* On-Chain Commitment Panel */}
        <div className="p-4 rounded-xl bg-[#101827] border border-[#263449] hover:border-[#22C55E]/30 space-y-2 overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#22C55E]">
              2. On-Chain Smart Contract Commitment
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(onChainHash, 'onchain')}
              className="text-[10px] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1 transition flex-shrink-0"
            >
              {copiedKey === 'onchain' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'onchain' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className={`p-3 rounded-lg bg-[#151F30] border font-mono text-[11px] break-all select-all leading-relaxed font-bold ${
            isMatch ? 'border-[#22C55E]/40 text-[#22C55E]' : 'border-[#EF4444]/40 text-[#EF4444]'
          }`}>
            {onChainHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] pt-1">
            <span>Contract: EvidenceRegistry</span>
            <span>Block: #{blockNumber.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Contract & Verification Footprint */}
      <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0 max-w-full">
          <Lock className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[#94A3B8] text-[11px]">EVM Contract:</span>{' '}
            <code className="text-[#38BDF8] font-mono text-[11px] font-bold break-all">{contractAddress}</code>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href={`https://testnet.mstscan.com/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#38BDF8] hover:underline flex items-center gap-1 text-[11px] font-bold"
          >
            <span>Contract on MSTScan</span>
            <ExternalLink className="w-3 h-3 text-[#38BDF8]" />
          </a>
          <span className="text-[#263449]">|</span>
          <a
            href={`https://testnet.mstscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#22C55E] hover:underline flex items-center gap-1 text-[11px] font-bold"
          >
            <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
            <span>Verified Tx #{blockNumber.toLocaleString()}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
