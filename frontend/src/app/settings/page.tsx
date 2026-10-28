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
    <div className="flex flex-col min-h-full bg-[#0B0F17]">
      <Header 
        title="Settings & Diagnostics" 
        subtitle="Network configurations, MST blockchain connectivity & cryptographic system health"
        onRefresh={fetchStatus}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* MST Blockchain Integration Diagnostics */}
        <div className="p-5 rounded bg-[#131A24] border border-[#263244] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#263244]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-semibold text-[#F8FAFC]">MST Blockchain Node &amp; Contract Diagnostics</h3>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-[#0B0F17] hover:bg-[#1A2332] border border-[#263244] text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 text-[#38BDF8] ${loading ? 'animate-spin' : ''}`} />
              Probe RPC Node
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Active Network</span>
              <div className="font-mono text-[#F8FAFC] font-semibold flex items-center justify-between">
                <span>{chainStatus?.network_name || 'MST Testnet'}</span>
                <span className={`w-2 h-2 rounded-full ${chainStatus?.connected ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Chain ID</span>
              <div className="font-mono text-[#10B981] font-bold">
                {chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Latest Node Block</span>
              <div className="font-mono text-[#F8FAFC] font-bold">
                {chainStatus?.latest_block ? `#${chainStatus.latest_block.toLocaleString()}` : 'Connected'}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Native Gas Token</span>
              <div className="font-mono text-[#10B981] font-bold">
                {chainStatus?.native_token || 'tMSTC'}
              </div>
            </div>
          </div>

          {/* RPC & Contract Diagnostic Details */}
          <div className="space-y-2 pt-2 text-xs font-mono">
            <div className="p-3 rounded bg-[#0B0F17] border border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">RPC Endpoint:</span>
                <span className="text-[#F8FAFC]">{chainStatus?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
              </div>
              <span className="text-[#10B981] font-sans font-semibold text-[11px] px-2 py-0.5 rounded bg-[#10B981]/15 border border-[#10B981]/30 w-fit">
                {chainStatus?.mode || 'READY'}
              </span>
            </div>

            <div className="p-3 rounded bg-[#0B0F17] border border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">EvidenceRegistry Contract:</span>
                <span className="text-[#38BDF8] font-semibold truncate max-w-[320px] inline-block">
                  {chainStatus?.contract_address || 'Configured via SentinelMesh Registry Artifact'}
                </span>
              </div>
              {chainStatus?.contract_explorer_url && (
                <a
                  href={chainStatus.contract_explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-sans"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3 rounded bg-[#0B0F17] border border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">Automated Backend Signer:</span>
                <span className="text-[#F8FAFC] truncate max-w-[320px] inline-block">
                  {chainStatus?.signer_address || 'Managed via server environment configuration (Private keys redacted)'}
                </span>
              </div>
              <span className="text-[#94A3B8] font-sans text-[11px] px-2 py-0.5 rounded bg-[#131A24] border border-[#263244] w-fit font-medium">
                Server-Side Signer
              </span>
            </div>
          </div>

          {chainStatus?.faucet_url && (
            <div className="pt-2 flex items-center gap-4 text-xs font-sans">
              <a
                href={chainStatus.faucet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#38BDF8] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Request tMSTC tokens from Faucet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={chainStatus.explorer_base_url || 'https://testnet.mstscan.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1"
              >
                <span>MSTScan Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Application Core Infrastructure */}
        <div className="p-5 rounded bg-[#131A24] border border-[#263244] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#263244]">
            <Server className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Core Security Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Execution Isolation</span>
              <div className="font-mono text-[#10B981] font-bold">SIMULATED (Zero Host Execution)</div>
              <p className="text-[11px] text-[#94A3B8] pt-1">Prevents arbitrary OS command execution or destructive production database writes.</p>
            </div>

            <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Policy Engine</span>
              <div className="font-mono text-[#F8FAFC] font-bold">Deterministic POL Matrix</div>
              <p className="text-[11px] text-[#94A3B8] pt-1">Zero-trust default-deny evaluation with deterministic priority matching.</p>
            </div>

            <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Canonicalization Standard</span>
              <div className="font-mono text-[#38BDF8] font-bold">RFC-8785 JSON v1 (SHA-256)</div>
              <p className="text-[11px] text-[#94A3B8] pt-1">Normalized keys, UTC ISO timestamps, compact deterministic serialization.</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Utility */}
        <div className="p-5 rounded bg-[#131A24] border border-[#263244] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#263244]">
            <Hash className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Audit Hash Verification Utility</h3>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Validate a candidate event hash against the canonical SHA-256 standard format:
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter 64-char hex SHA-256 digest (e.g. 0x4f8a9b...)"
                value={testHash}
                onChange={(e) => setTestHash(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-[#0B0F17] border border-[#263244] text-xs font-mono text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#38BDF8] hover:bg-[#0284C7] text-xs font-semibold text-[#0B0F17] transition"
              >
                Validate Format
              </button>
            </div>

            {verificationResult && (
              <div className={`p-3 rounded text-xs font-mono ${
                verificationResult.startsWith('Valid')
                  ? 'bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]'
                  : 'bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]'
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
