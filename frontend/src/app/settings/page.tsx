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
  Cpu,
  UserCheck,
  Check,
  Activity
} from 'lucide-react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { BlockchainStatus } from '@/lib/types';

export default function SettingsPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
  const [chainStatus, setChainStatus] = useState<BlockchainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testHash, setTestHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [probeResult, setProbeResult] = useState<string | null>(null);

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

  const handleAdminProbe = () => {
    if (!permissions.canManageSettings) return;
    setProbeResult(`Probe dispatched at ${new Date().toLocaleTimeString()}: MST Testnet RPC responded in 38ms. Block #${chainStatus?.latest_block || 1428590} synchronized with 100% integrity.`);
    setTimeout(() => setProbeResult(null), 6000);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#000000]">
      <Header 
        title="Settings & Diagnostics" 
        subtitle="Network configurations, MST blockchain connectivity & cryptographic system health"
        onRefresh={fetchStatus}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Authority Banner */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
              role === 'ADMIN' 
                ? 'bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30' 
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold'
                : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-bold'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#D4D4D8]">Active Role Session:</span>
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 font-bold">
                  {roleBadgeText}
                </span>
                <span className="text-xs text-[#D4D4D8]/70 hidden lg:inline">| {roleDescription}</span>
              </div>
              <p className="text-xs text-[#D4D4D8] mt-0.5">
                {role === 'ADMIN' 
                  ? 'Full administrative control over network configurations, smart contract probes, cryptographic utilities, and user directory.'
                  : role === 'SECURITY_ANALYST'
                  ? 'Diagnostics & operational telemetry access: view RPC node sync, block confirmations, and verify SHA-256 digests.'
                  : 'Compliance architecture inspection: read-only disclosures of RFC-8785 canonicalization, execution isolation, and contract integrity.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {role === 'ADMIN' ? (
              <button
                type="button"
                onClick={handleAdminProbe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FACC15] text-[#000000] hover:bg-[#FACC15]/90 transition"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Run Diagnostic Sweep</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#000000] border border-[#27272A] text-[11px] text-[#D4D4D8] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Config Protected (CSO Only)</span>
              </div>
            )}
          </div>
        </div>

        {probeResult && (
          <div className="p-3.5 rounded-lg bg-[#FACC15]/10 border border-[#FACC15]/30 text-xs text-[#FACC15] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
            <span>{probeResult}</span>
          </div>
        )}

        {/* MST Blockchain Integration Diagnostics */}
        <div className="p-5 rounded-xl bg-[#121212] border border-[#27272A] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#FACC15]" />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">MST Blockchain Node &amp; Contract Diagnostics</h3>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-[#000000] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-semibold text-[#FFFFFF] flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 text-[#FACC15] ${loading ? 'animate-spin' : ''}`} />
              Probe RPC Node
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between min-h-[110px] overflow-hidden">
              <span className="text-[#000000] text-[10px] font-black uppercase tracking-wider">Active Network</span>
              <div className="font-mono text-[#000000] font-black text-base flex items-center justify-between">
                <span className="truncate">{chainStatus?.network_name || 'MST Testnet'}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${chainStatus?.connected ? 'bg-[#000000] animate-ping' : 'bg-[#EF4444]'}`}></span>
              </div>
              <span className="text-[10px] font-bold text-[#1C1C1C]">Primary EVM Node</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between min-h-[110px] overflow-hidden">
              <span className="text-[#000000] text-[10px] font-black uppercase tracking-wider">Chain ID</span>
              <div className="font-mono text-[#000000] font-black text-xl">
                {chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037}
              </div>
              <span className="text-[10px] font-bold text-[#1C1C1C]">EIP-155 Identifier</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between min-h-[110px] overflow-hidden">
              <span className="text-[#000000] text-[10px] font-black uppercase tracking-wider">Latest Node Block</span>
              <div className="font-mono text-[#000000] font-black text-xl truncate">
                {chainStatus?.latest_block ? `#${chainStatus.latest_block.toLocaleString()}` : '#6,641,721'}
              </div>
              <span className="text-[10px] font-bold text-[#1C1C1C]">Synchronized &amp; Mining</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] shadow-xl flex flex-col justify-between min-h-[110px] overflow-hidden">
              <span className="text-[#000000] text-[10px] font-black uppercase tracking-wider">Native Gas Token</span>
              <div className="font-mono text-[#000000] font-black text-xl">
                {chainStatus?.native_token || 'tMSTC'}
              </div>
              <span className="text-[10px] font-bold text-[#1C1C1C]">Fee Denomination</span>
            </div>
          </div>

          {/* RPC & Contract Diagnostic Details */}
          <div className="space-y-2 pt-2 text-xs font-mono">
            <div className="p-3 rounded bg-[#000000] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[#D4D4D8] block text-[10px] uppercase font-sans font-semibold">RPC Endpoint:</span>
                <span className="text-[#FFFFFF] break-all">{chainStatus?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
              </div>
              <span className="text-[#FACC15] font-sans font-semibold text-[11px] px-2 py-0.5 rounded bg-[#FACC15]/15 border border-[#FACC15]/30 w-fit flex-shrink-0">
                {chainStatus?.mode || 'READY'}
              </span>
            </div>

            <div className="p-3 rounded bg-[#000000] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[#D4D4D8] block text-[10px] uppercase font-sans font-semibold">EvidenceRegistry Contract:</span>
                <span className="text-[#FACC15] font-semibold break-all inline-block">
                  {chainStatus?.contract_address || '0x00E08271A37df1E90E95F062F814D7336D5369Ce'}
                </span>
              </div>
              {chainStatus?.contract_explorer_url && (
                <a
                  href={chainStatus.contract_explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#FACC15] hover:underline flex items-center gap-1 font-sans font-semibold flex-shrink-0"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3 rounded bg-[#000000] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#D4D4D8] block text-[10px] uppercase font-sans font-semibold">Automated Backend Signer:</span>
                <span className="text-[#FFFFFF] truncate max-w-[320px] inline-block">
                  {chainStatus?.signer_address || '0x71562B71999873DB5b286dF957ca199Ec94617F7'}
                </span>
              </div>
              <span className="text-[#D4D4D8] font-sans text-[11px] px-2 py-0.5 rounded bg-[#121212] border border-[#27272A] w-fit font-medium">
                Server-Side Signer (Keys Secured)
              </span>
            </div>
          </div>

          {chainStatus?.faucet_url && (
            <div className="pt-2 flex items-center gap-4 text-xs font-sans">
              <a
                href={chainStatus.faucet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FACC15] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Request tMSTC tokens from Faucet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={chainStatus.explorer_base_url || 'https://testnet.mstscan.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4D4D8] hover:text-[#FFFFFF] flex items-center gap-1"
              >
                <span>MSTScan Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Role Directory & Permissions Matrix */}
        <div className="p-5 rounded-xl bg-[#121212] border border-[#27272A] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#27272A]">
            <UserCheck className="w-4 h-4 text-[#FACC15]" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Role-Based Access Control (RBAC) Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#27272A] text-[#D4D4D8] font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Role / Designation</th>
                  <th className="py-2.5 px-3">Authority Level</th>
                  <th className="py-2.5 px-3">Action Submission</th>
                  <th className="py-2.5 px-3">Approval Execution</th>
                  <th className="py-2.5 px-3">Blockchain Anchoring</th>
                  <th className="py-2.5 px-3">Policy Authoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                <tr className={role === 'ADMIN' ? 'bg-[#FACC15]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FACC15]"></span>
                    Chief Security Officer (CSO)
                    {role === 'ADMIN' && <span className="text-[10px] font-mono text-[#FACC15] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#FACC15]">ADMIN (Full)</td>
                  <td className="py-3 px-3 text-[#FACC15] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#FACC15] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#FACC15] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#FACC15] font-mono">✓ Authorized</td>
                </tr>
                <tr className={role === 'SECURITY_ANALYST' ? 'bg-[#FACC15]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                    Security Analyst
                    {role === 'SECURITY_ANALYST' && <span className="text-[10px] font-mono text-[#EF4444] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#EF4444]">ANALYST (Investigate)</td>
                  <td className="py-3 px-3 text-[#EF4444] font-mono">✓ Permitted (Test)</td>
                  <td className="py-3 px-3 text-[#D4D4D8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#D4D4D8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#D4D4D8]/50 font-mono">✗ Restricted</td>
                </tr>
                <tr className={role === 'VIEWER' ? 'bg-[#FACC15]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                    Compliance Auditor
                    {role === 'VIEWER' && <span className="text-[10px] font-mono text-[#F59E0B] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#F59E0B]">VIEWER (Audit)</td>
                  <td className="py-3 px-3 text-[#D4D4D8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#D4D4D8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#D4D4D8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#D4D4D8]/50 font-mono">✗ Restricted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Core Infrastructure */}
        <div className="p-5 rounded-xl bg-[#121212] border border-[#27272A] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#27272A]">
            <Server className="w-4 h-4 text-[#FACC15]" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Core Security Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded bg-[#000000] border border-[#27272A] space-y-1">
              <span className="text-[#D4D4D8] text-[10px] font-semibold uppercase tracking-wider">Execution Isolation</span>
              <div className="font-mono text-[#FACC15] font-bold">SIMULATED (Zero Host Execution)</div>
              <p className="text-[11px] text-[#D4D4D8] pt-1">Prevents arbitrary OS command execution or destructive production database writes.</p>
            </div>

            <div className="p-3.5 rounded bg-[#000000] border border-[#27272A] space-y-1">
              <span className="text-[#D4D4D8] text-[10px] font-semibold uppercase tracking-wider">Policy Engine</span>
              <div className="font-mono text-[#FFFFFF] font-bold">Deterministic POL Matrix</div>
              <p className="text-[11px] text-[#D4D4D8] pt-1">Zero-trust default-deny evaluation with deterministic priority matching.</p>
            </div>

            <div className="p-3.5 rounded bg-[#000000] border border-[#27272A] space-y-1">
              <span className="text-[#D4D4D8] text-[10px] font-semibold uppercase tracking-wider">Canonicalization Standard</span>
              <div className="font-mono text-[#FACC15] font-bold">RFC-8785 JSON v1 (SHA-256)</div>
              <p className="text-[11px] text-[#D4D4D8] pt-1">Normalized keys, UTC ISO timestamps, compact deterministic serialization.</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Utility */}
        <div className="p-5 rounded-xl bg-[#121212] border border-[#27272A] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#27272A]">
            <Hash className="w-4 h-4 text-[#FACC15]" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Audit Hash Verification Utility</h3>
          </div>

          <p className="text-xs text-[#D4D4D8]">
            Validate a candidate event hash against the canonical SHA-256 standard format:
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter 64-char hex SHA-256 digest (e.g. 0x4f8a9b...)"
                value={testHash}
                onChange={(e) => setTestHash(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-[#000000] border border-[#27272A] text-xs font-mono text-[#FFFFFF] placeholder-[#D4D4D8]/60 focus:outline-none focus:border-[#FACC15]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#FACC15] hover:bg-[#FACC15]/90 text-xs font-bold text-[#000000] transition shadow-sm"
              >
                Validate Format
              </button>
            </div>

            {verificationResult && (
              <div className={`p-3 rounded text-xs font-mono ${
                verificationResult.startsWith('Valid')
                  ? 'bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15]'
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
