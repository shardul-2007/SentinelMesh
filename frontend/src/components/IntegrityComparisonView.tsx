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
    <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 flex items-center justify-center flex-shrink-0">
            <Hash className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Cryptographic Integrity Comparison</h3>
            <p className="text-[11px] text-[#64748B]">
              Side-by-side local canonical RFC-8785 digest vs. MST Blockchain EvidenceRegistry commitment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isMatch 
              ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/25'
              : 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/25'
          }`}>
            {isMatch ? <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />}
            {isMatch ? '100% CRYPTOGRAPHIC MATCH' : 'HASH DIVERGENCE DETECTED'}
          </span>

          {onVerifyAgain && (
            <button
              type="button"
              onClick={onVerifyAgain}
              className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172B4D] border border-[#E5E7EB] transition"
              title="Re-read on-chain commitment"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
            </button>
          )}
        </div>
      </div>

      {/* Side-by-side Hash Comparison Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Digest Panel */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#CBD5E1] space-y-2 overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#2563EB]">
              1. Local Canonical SHA-256 Digest
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(localHash, 'local')}
              className="text-[10px] text-[#64748B] hover:text-[#172B4D] flex items-center gap-1 transition flex-shrink-0"
            >
              {copiedKey === 'local' ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'local' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] font-mono text-[11px] text-[#2563EB] break-all select-all leading-relaxed font-bold">
            {localHash}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1">
            <span>Algorithm: SHA-256</span>
            <span>Standard: RFC-8785 JSON</span>
          </div>
        </div>

        {/* On-Chain Commitment Panel */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#CBD5E1] space-y-2 overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[#15803D]">
              2. On-Chain Smart Contract Commitment
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(onChainHash, 'onchain')}
              className="text-[10px] text-[#64748B] hover:text-[#172B4D] flex items-center gap-1 transition flex-shrink-0"
            >
              {copiedKey === 'onchain' ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'onchain' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className={`p-3 rounded-lg bg-[#FFFFFF] border font-mono text-[11px] break-all select-all leading-relaxed font-bold ${
            isMatch ? 'border-[#15803D]/30 text-[#15803D]' : 'border-[#DC2626]/30 text-[#DC2626]'
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
      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 min-w-0 max-w-full">
          <Lock className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[#64748B] text-[11px]">EVM Contract:</span>{' '}
            <code className="text-[#2563EB] font-mono text-[11px] font-bold break-all">{contractAddress}</code>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href={`https://testnet.mstscan.com/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2563EB] hover:underline flex items-center gap-1 text-[11px] font-semibold"
          >
            <span>Contract on MSTScan</span>
            <ExternalLink className="w-3 h-3 text-[#2563EB]" />
          </a>
          <span className="text-[#CBD5E1]">|</span>
          <a
            href={`https://testnet.mstscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#15803D] hover:underline flex items-center gap-1 text-[11px] font-semibold"
          >
            <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
            <span>Verified Tx #{blockNumber.toLocaleString()}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
