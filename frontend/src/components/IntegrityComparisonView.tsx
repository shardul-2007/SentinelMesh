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
    <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] shadow-xl space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 flex items-center justify-center flex-shrink-0">
            <Hash className="w-4 h-4 text-[#FACC15]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FFFFFF]">Cryptographic Integrity Comparison</h3>
            <p className="text-[11px] text-[#A1A1AA]">
              Side-by-side local canonical RFC-8785 digest vs. MST Blockchain EvidenceRegistry commitment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isMatch 
              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
              : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
          }`}>
            {isMatch ? <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />}
            {isMatch ? '100% CRYPTOGRAPHIC MATCH' : 'HASH DIVERGENCE DETECTED'}
          </span>

          {onVerifyAgain && (
            <button
              type="button"
              onClick={onVerifyAgain}
              className="p-1.5 rounded-lg bg-[#1C1C1F] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] border border-[#27272A] transition"
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
        <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-[#FACC15]/30 space-y-2 overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#FACC15]">
              1. Local Canonical SHA-256 Digest
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(localHash, 'local')}
              className="text-[10px] text-[#A1A1AA] hover:text-[#FFFFFF] flex items-center gap-1 transition flex-shrink-0"
            >
              {copiedKey === 'local' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'local' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3 rounded-lg bg-[#121214] border border-[#27272A] font-mono text-[11px] text-[#FACC15] break-all select-all leading-relaxed font-bold">
            {localHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#A1A1AA] pt-1">
            <span>Algorithm: SHA-256</span>
            <span>Standard: RFC-8785 JSON</span>
          </div>
        </div>

        {/* On-Chain Commitment Panel */}
        <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-[#10B981]/30 space-y-2 overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#10B981]">
              2. On-Chain Smart Contract Commitment
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(onChainHash, 'onchain')}
              className="text-[10px] text-[#A1A1AA] hover:text-[#FFFFFF] flex items-center gap-1 transition flex-shrink-0"
            >
              {copiedKey === 'onchain' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'onchain' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className={`p-3 rounded-lg bg-[#121214] border font-mono text-[11px] break-all select-all leading-relaxed font-bold ${
            isMatch ? 'border-[#10B981]/40 text-[#10B981]' : 'border-[#EF4444]/40 text-[#EF4444]'
          }`}>
            {onChainHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#A1A1AA] pt-1">
            <span>Contract: EvidenceRegistry</span>
            <span>Block: #{blockNumber.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Contract & Verification Footprint */}
      <div className="p-3.5 rounded-xl bg-[#09090B] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0 max-w-full">
          <Lock className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[#A1A1AA] text-[11px]">EVM Contract:</span>{' '}
            <code className="text-[#FACC15] font-mono text-[11px] font-bold break-all">{contractAddress}</code>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href={`https://testnet.mstscan.com/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FACC15] hover:underline flex items-center gap-1 text-[11px] font-bold"
          >
            <span>Contract on MSTScan</span>
            <ExternalLink className="w-3 h-3 text-[#FACC15]" />
          </a>
          <span className="text-[#27272A]">|</span>
          <a
            href={`https://testnet.mstscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#10B981] hover:underline flex items-center gap-1 text-[11px] font-bold"
          >
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
            <span>Verified Tx #{blockNumber.toLocaleString()}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
