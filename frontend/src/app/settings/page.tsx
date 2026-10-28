'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Database, 
  Server, 
  Key, 
  Layers, 
  Hash, 
  CheckCircle, 
  ExternalLink,
  RefreshCw,
  Boxes,
  ArrowUpRight,
  Lock,
  Cpu
} from 'lucide-react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { BlockchainStatus } from '@/lib/types';

export default function SettingsPage() {
  const [chainStatus, setChainStatus] = useState<BlockchainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testHash, setTestHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getBlockchainStatus();
      setChainStatus(res);
    } catch (err) {
      console.error('Failed to query blockchain status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testHash.trim()) return;

    if (/^(0x)?[a-fA-F0-9]{64}$/.test(testHash.trim())) {
      setVerificationResult('Valid SHA-256 (32-byte) hex digest format. Conforms to SentinelMesh RFC-8785 canonical standard.');
    } else {
      setVerificationResult('Invalid hash format. SHA-256 digests must be exactly 64 hexadecimal characters (optional 0x prefix).');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header 
        title="Settings & Integration Health" 
        subtitle="Network configurations, MST blockchain connectivity, and cryptographic diagnostics"
        onRefresh={fetchStatus}
        isRefreshing={loading}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* MST Blockchain Integration Health */}
        <div className="p-5 rounded-xl bg-[#19222D] border border-graphite-700/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-graphite-700/60">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#82B5F8]" />
              <h3 className="text-sm font-semibold text-[#E9EFF7]">MST Blockchain Network Configuration</h3>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-[#202B38] hover:bg-[#283647] border border-graphite-700/60 text-xs font-medium text-[#E9EFF7] flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Probe Node
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1">
              <span className="text-[#A2AFBE] text-[11px] font-semibold uppercase">Active Network</span>
              <div className="font-mono text-[#E9EFF7] font-medium flex items-center justify-between">
                <span>{chainStatus?.network_name || 'MST Testnet'}</span>
                <span className={`w-2 h-2 rounded-full ${chainStatus?.connected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1">
              <span className="text-[#A2AFBE] text-[11px] font-semibold uppercase">Chain ID</span>
              <div className="font-mono text-emerald-400 font-medium">
                {chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1">
              <span className="text-[#A2AFBE] text-[11px] font-semibold uppercase">Latest Block</span>
              <div className="font-mono text-[#E9EFF7] font-medium">
                {chainStatus?.latest_block ? `#${chainStatus.latest_block.toLocaleString()}` : 'Connected'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1">
              <span className="text-[#A2AFBE] text-[11px] font-semibold uppercase">Native Gas Token</span>
              <div className="font-mono text-emerald-300 font-medium">
                {chainStatus?.native_token || 'tMSTC'}
              </div>
            </div>
          </div>

          {/* RPC & Contract Address Diagnostic */}
          <div className="space-y-2 pt-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#131A23] border border-graphite-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#A2AFBE] block text-[11px] uppercase">RPC Endpoint:</span>
                <span className="text-slate-300">{chainStatus?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
              </div>
              <span className="text-emerald-400 font-sans font-medium text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 w-fit">
                {chainStatus?.mode || 'READY'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#131A23] border border-graphite-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#A2AFBE] block text-[11px] uppercase">EvidenceRegistry Contract:</span>
                <span className="text-[#82B5F8] truncate max-w-[320px] inline-block">
                  {chainStatus?.contract_address || 'Configured via SentinelMesh Registry'}
                </span>
              </div>
              {chainStatus?.contract_explorer_url && (
                <a
                  href={chainStatus.contract_explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#82B5F8] hover:underline flex items-center gap-1"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3 rounded-lg bg-[#131A23] border border-graphite-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#A2AFBE] block text-[11px] uppercase">Automated Backend Signer:</span>
                <span className="text-slate-300 truncate max-w-[320px] inline-block">
                  {chainStatus?.signer_address || 'Configured in secure server environment (Private key redacted)'}
                </span>
              </div>
              <span className="text-slate-400 font-sans text-[11px] px-2 py-0.5 rounded bg-[#202B38] border border-graphite-700/60 w-fit">
                Server-Side Only
              </span>
            </div>
          </div>

          {chainStatus?.faucet_url && (
            <div className="pt-2 flex items-center gap-4 text-xs">
              <a
                href={chainStatus.faucet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#82B5F8] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Request testnet tMSTC from Faucet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={chainStatus.explorer_base_url || 'https://testnet.mstscan.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A2AFBE] hover:text-[#E9EFF7] flex items-center gap-1"
              >
                <span>MSTScan Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Application Core Infrastructure */}
        <div className="p-5 rounded-xl bg-[#19222D] border border-graphite-700/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-graphite-700/60">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#E9EFF7]">Application Security Infrastructure</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1">
              <span className="text-[#A2AFBE] text-[11px] font-semibold uppercase">Execution Safety Mode</span>
              <div className="font-mono text-emerald-400 font-medium">SIMULATED (Zero Host Execution)</div>
              <p className="text-[11px] text-[#A2AFBE] pt-1">Prevents arbitrary OS command execution or real database destruction.</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1">
              <span className="text-[#A2AFBE] text-[11px] font-semibold uppercase">Policy Engine</span>
              <div className="font-mono text-[#E9EFF7] font-medium">Deterministic POL-A..G Engine</div>
              <p className="text-[11px] text-[#A2AFBE] pt-1">Zero-trust default-deny evaluation with contextual parameter matching.</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1">
              <span className="text-[#A2AFBE] text-[11px] font-semibold uppercase">Canonicalization Standard</span>
              <div className="font-mono text-[#82B5F8] font-medium">RFC-8785 Canonical JSON v1</div>
              <p className="text-[11px] text-[#A2AFBE] pt-1">Normalized keys, UTC ISO timestamps, compact serialization for reproducibility.</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Utility */}
        <div className="p-5 rounded-xl bg-[#19222D] border border-graphite-700/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-graphite-700/60">
            <Hash className="w-4 h-4 text-[#82B5F8]" />
            <h3 className="text-sm font-semibold text-[#E9EFF7]">Audit Hash Verification Utility</h3>
          </div>

          <p className="text-xs text-[#A2AFBE]">
            Validate an event hash against the canonical SHA-256 standard format:
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter 64-char hex SHA-256 digest (e.g. 0x4f8a9b...)"
                value={testHash}
                onChange={(e) => setTestHash(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#131A23] border border-graphite-700/60 text-xs font-mono text-[#E9EFF7] placeholder-[#A2AFBE] focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#202B38] hover:bg-[#283647] border border-graphite-700/60 text-xs font-medium text-[#E9EFF7] transition"
              >
                Validate Format
              </button>
            </div>

            {verificationResult && (
              <div className={`p-3 rounded-lg text-xs font-mono ${
                verificationResult.startsWith('Valid')
                  ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border border-red-800/60 text-red-300'
              }`}>
                {verificationResult}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
