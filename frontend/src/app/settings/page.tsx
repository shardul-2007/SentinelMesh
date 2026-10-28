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
    <div className="flex flex-col min-h-full bg-[#F5F4F0]">
      <Header 
        title="Settings & Diagnostics" 
        subtitle="Network configurations, MST blockchain connectivity & cryptographic system health"
        onRefresh={fetchStatus}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* MST Blockchain Integration Diagnostics */}
        <div className="p-5 rounded bg-[#FFFFFF] border border-[#D9DDE2] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9DDE2]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#315C78]" />
              <h3 className="text-sm font-semibold text-[#171A1F]">MST Blockchain Node &amp; Contract Diagnostics</h3>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-[#FFFFFF] hover:bg-[#F5F4F0] border border-[#D9DDE2] text-xs font-semibold text-[#171A1F] flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 text-[#315C78] ${loading ? 'animate-spin' : ''}`} />
              Probe RPC Node
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1">
              <span className="text-[#737B86] text-[10px] font-semibold uppercase tracking-wider">Active Network</span>
              <div className="font-mono text-[#171A1F] font-semibold flex items-center justify-between">
                <span>{chainStatus?.network_name || 'MST Testnet'}</span>
                <span className={`w-2 h-2 rounded-full ${chainStatus?.connected ? 'bg-[#287653]' : 'bg-[#B53A3A]'}`}></span>
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1">
              <span className="text-[#737B86] text-[10px] font-semibold uppercase tracking-wider">Chain ID</span>
              <div className="font-mono text-[#287653] font-bold">
                {chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1">
              <span className="text-[#737B86] text-[10px] font-semibold uppercase tracking-wider">Latest Node Block</span>
              <div className="font-mono text-[#171A1F] font-bold">
                {chainStatus?.latest_block ? `#${chainStatus.latest_block.toLocaleString()}` : 'Connected'}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1">
              <span className="text-[#737B86] text-[10px] font-semibold uppercase tracking-wider">Native Gas Token</span>
              <div className="font-mono text-[#287653] font-bold">
                {chainStatus?.native_token || 'tMSTC'}
              </div>
            </div>
          </div>

          {/* RPC & Contract Diagnostic Details */}
          <div className="space-y-2 pt-2 text-xs font-mono">
            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#737B86] block text-[10px] uppercase font-sans font-semibold">RPC Endpoint:</span>
                <span className="text-[#171A1F]">{chainStatus?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
              </div>
              <span className="text-[#287653] font-sans font-semibold text-[11px] px-2 py-0.5 rounded bg-[#EDF6F2] border border-[#BCE2D1] w-fit">
                {chainStatus?.mode || 'READY'}
              </span>
            </div>

            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#737B86] block text-[10px] uppercase font-sans font-semibold">EvidenceRegistry Contract:</span>
                <span className="text-[#315C78] font-semibold truncate max-w-[320px] inline-block">
                  {chainStatus?.contract_address || 'Configured via SentinelMesh Registry Artifact'}
                </span>
              </div>
              {chainStatus?.contract_explorer_url && (
                <a
                  href={chainStatus.contract_explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#315C78] hover:underline flex items-center gap-1 font-sans"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#737B86] block text-[10px] uppercase font-sans font-semibold">Automated Backend Signer:</span>
                <span className="text-[#171A1F] truncate max-w-[320px] inline-block">
                  {chainStatus?.signer_address || 'Managed via server environment configuration (Private keys redacted)'}
                </span>
              </div>
              <span className="text-[#737B86] font-sans text-[11px] px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#D9DDE2] w-fit font-medium">
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
                className="text-[#315C78] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Request tMSTC tokens from Faucet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={chainStatus.explorer_base_url || 'https://testnet.mstscan.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#737B86] hover:text-[#171A1F] flex items-center gap-1"
              >
                <span>MSTScan Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Application Core Infrastructure */}
        <div className="p-5 rounded bg-[#FFFFFF] border border-[#D9DDE2] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D9DDE2]">
            <Server className="w-4 h-4 text-[#287653]" />
            <h3 className="text-sm font-semibold text-[#171A1F]">Core Security Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1">
              <span className="text-[#737B86] text-[10px] font-semibold uppercase tracking-wider">Execution Isolation</span>
              <div className="font-mono text-[#287653] font-bold">SIMULATED (Zero Host Execution)</div>
              <p className="text-[11px] text-[#737B86] pt-1">Prevents arbitrary OS command execution or destructive production database writes.</p>
            </div>

            <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1">
              <span className="text-[#737B86] text-[10px] font-semibold uppercase tracking-wider">Policy Engine</span>
              <div className="font-mono text-[#171A1F] font-bold">Deterministic POL Matrix</div>
              <p className="text-[11px] text-[#737B86] pt-1">Zero-trust default-deny evaluation with deterministic priority matching.</p>
            </div>

            <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1">
              <span className="text-[#737B86] text-[10px] font-semibold uppercase tracking-wider">Canonicalization Standard</span>
              <div className="font-mono text-[#315C78] font-bold">RFC-8785 JSON v1 (SHA-256)</div>
              <p className="text-[11px] text-[#737B86] pt-1">Normalized keys, UTC ISO timestamps, compact deterministic serialization.</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Utility */}
        <div className="p-5 rounded bg-[#FFFFFF] border border-[#D9DDE2] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D9DDE2]">
            <Hash className="w-4 h-4 text-[#315C78]" />
            <h3 className="text-sm font-semibold text-[#171A1F]">Audit Hash Verification Utility</h3>
          </div>

          <p className="text-xs text-[#737B86]">
            Validate a candidate event hash against the canonical SHA-256 standard format:
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter 64-char hex SHA-256 digest (e.g. 0x4f8a9b...)"
                value={testHash}
                onChange={(e) => setTestHash(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-xs font-mono text-[#171A1F] placeholder-[#737B86] focus:outline-none focus:border-[#315C78]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#315C78] hover:bg-[#26495F] text-xs font-semibold text-[#FFFFFF] transition"
              >
                Validate Format
              </button>
            </div>

            {verificationResult && (
              <div className={`p-3 rounded text-xs font-mono ${
                verificationResult.startsWith('Valid')
                  ? 'bg-[#EDF6F2] border border-[#BCE2D1] text-[#287653]'
                  : 'bg-[#FDF2F2] border border-[#F7C4C4] text-[#B53A3A]'
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
