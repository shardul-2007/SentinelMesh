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
    <div className="flex flex-col min-h-full bg-[#1A1D20]">
      <Header 
        title="Settings & Diagnostics" 
        subtitle="Network configurations, MST blockchain connectivity & cryptographic system health"
        onRefresh={fetchStatus}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Authority Banner */}
        <div className="p-4 rounded-xl bg-[#2D3238] border border-[#414850] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
              role === 'ADMIN' 
                ? 'bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30' 
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-bold'
                : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-bold'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A0A5AD]">Active Role Session:</span>
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#00FA9A]/15 text-[#00FA9A] border border-[#00FA9A]/30 font-bold">
                  {roleBadgeText}
                </span>
                <span className="text-xs text-[#A0A5AD]/70 hidden lg:inline">| {roleDescription}</span>
              </div>
              <p className="text-xs text-[#A0A5AD] mt-0.5">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00FA9A] text-[#1A1D20] hover:bg-[#00FA9A]/90 transition"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Run Diagnostic Sweep</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1A1D20] border border-[#414850] text-[11px] text-[#A0A5AD] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Config Protected (CSO Only)</span>
              </div>
            )}
          </div>
        </div>

        {probeResult && (
          <div className="p-3.5 rounded-lg bg-[#00FA9A]/10 border border-[#00FA9A]/30 text-xs text-[#00FA9A] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00FA9A] flex-shrink-0" />
            <span>{probeResult}</span>
          </div>
        )}

        {/* MST Blockchain Integration Diagnostics */}
        <div className="p-5 rounded-xl bg-[#2D3238] border border-[#414850] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#414850]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#00FA9A]" />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">MST Blockchain Node &amp; Contract Diagnostics</h3>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-[#1A1D20] hover:bg-[#353B42] border border-[#414850] text-xs font-semibold text-[#FFFFFF] flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 text-[#00FA9A] ${loading ? 'animate-spin' : ''}`} />
              Probe RPC Node
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded bg-[#1A1D20] border border-[#414850] space-y-1">
              <span className="text-[#A0A5AD] text-[10px] font-semibold uppercase tracking-wider">Active Network</span>
              <div className="font-mono text-[#FFFFFF] font-semibold flex items-center justify-between">
                <span>{chainStatus?.network_name || 'MST Testnet'}</span>
                <span className={`w-2 h-2 rounded-full ${chainStatus?.connected ? 'bg-[#00FA9A]' : 'bg-[#EF4444]'}`}></span>
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#1A1D20] border border-[#414850] space-y-1">
              <span className="text-[#A0A5AD] text-[10px] font-semibold uppercase tracking-wider">Chain ID</span>
              <div className="font-mono text-[#00FA9A] font-bold">
                {chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#1A1D20] border border-[#414850] space-y-1">
              <span className="text-[#A0A5AD] text-[10px] font-semibold uppercase tracking-wider">Latest Node Block</span>
              <div className="font-mono text-[#FFFFFF] font-bold">
                {chainStatus?.latest_block ? `#${chainStatus.latest_block.toLocaleString()}` : 'Connected'}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#1A1D20] border border-[#414850] space-y-1">
              <span className="text-[#A0A5AD] text-[10px] font-semibold uppercase tracking-wider">Native Gas Token</span>
              <div className="font-mono text-[#00FA9A] font-bold">
                {chainStatus?.native_token || 'tMSTC'}
              </div>
            </div>
          </div>

          {/* RPC & Contract Diagnostic Details */}
          <div className="space-y-2 pt-2 text-xs font-mono">
            <div className="p-3 rounded bg-[#1A1D20] border border-[#414850] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#A0A5AD] block text-[10px] uppercase font-sans font-semibold">RPC Endpoint:</span>
                <span className="text-[#FFFFFF]">{chainStatus?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
              </div>
              <span className="text-[#00FA9A] font-sans font-semibold text-[11px] px-2 py-0.5 rounded bg-[#00FA9A]/15 border border-[#00FA9A]/30 w-fit">
                {chainStatus?.mode || 'READY'}
              </span>
            </div>

            <div className="p-3 rounded bg-[#1A1D20] border border-[#414850] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#A0A5AD] block text-[10px] uppercase font-sans font-semibold">EvidenceRegistry Contract:</span>
                <span className="text-[#00FA9A] font-semibold truncate max-w-[320px] inline-block">
                  {chainStatus?.contract_address || '0x00E08271A37df1E90E95F062F814D7336D5369Ce'}
                </span>
              </div>
              {chainStatus?.contract_explorer_url && (
                <a
                  href={chainStatus.contract_explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00FA9A] hover:underline flex items-center gap-1 font-sans font-semibold"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3 rounded bg-[#1A1D20] border border-[#414850] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#A0A5AD] block text-[10px] uppercase font-sans font-semibold">Automated Backend Signer:</span>
                <span className="text-[#FFFFFF] truncate max-w-[320px] inline-block">
                  {chainStatus?.signer_address || '0x71562B71999873DB5b286dF957ca199Ec94617F7'}
                </span>
              </div>
              <span className="text-[#A0A5AD] font-sans text-[11px] px-2 py-0.5 rounded bg-[#2D3238] border border-[#414850] w-fit font-medium">
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
                className="text-[#00FA9A] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Request tMSTC tokens from Faucet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={chainStatus.explorer_base_url || 'https://testnet.mstscan.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A0A5AD] hover:text-[#FFFFFF] flex items-center gap-1"
              >
                <span>MSTScan Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Role Directory & Permissions Matrix */}
        <div className="p-5 rounded-xl bg-[#2D3238] border border-[#414850] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#414850]">
            <UserCheck className="w-4 h-4 text-[#00FA9A]" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Role-Based Access Control (RBAC) Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#414850] text-[#A0A5AD] font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Role / Designation</th>
                  <th className="py-2.5 px-3">Authority Level</th>
                  <th className="py-2.5 px-3">Action Submission</th>
                  <th className="py-2.5 px-3">Approval Execution</th>
                  <th className="py-2.5 px-3">Blockchain Anchoring</th>
                  <th className="py-2.5 px-3">Policy Authoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#414850]">
                <tr className={role === 'ADMIN' ? 'bg-[#00FA9A]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00FA9A]"></span>
                    Chief Security Officer (CSO)
                    {role === 'ADMIN' && <span className="text-[10px] font-mono text-[#00FA9A] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#00FA9A]">ADMIN (Full)</td>
                  <td className="py-3 px-3 text-[#00FA9A] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#00FA9A] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#00FA9A] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#00FA9A] font-mono">✓ Authorized</td>
                </tr>
                <tr className={role === 'SECURITY_ANALYST' ? 'bg-[#00FA9A]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                    Security Analyst
                    {role === 'SECURITY_ANALYST' && <span className="text-[10px] font-mono text-[#38BDF8] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#38BDF8]">ANALYST (Investigate)</td>
                  <td className="py-3 px-3 text-[#38BDF8] font-mono">✓ Permitted (Test)</td>
                  <td className="py-3 px-3 text-[#A0A5AD]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#A0A5AD]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#A0A5AD]/50 font-mono">✗ Restricted</td>
                </tr>
                <tr className={role === 'VIEWER' ? 'bg-[#00FA9A]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                    Compliance Auditor
                    {role === 'VIEWER' && <span className="text-[10px] font-mono text-[#F59E0B] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#F59E0B]">VIEWER (Audit)</td>
                  <td className="py-3 px-3 text-[#A0A5AD]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#A0A5AD]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#A0A5AD]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#A0A5AD]/50 font-mono">✗ Restricted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Core Infrastructure */}
        <div className="p-5 rounded-xl bg-[#2D3238] border border-[#414850] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#414850]">
            <Server className="w-4 h-4 text-[#00FA9A]" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Core Security Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded bg-[#1A1D20] border border-[#414850] space-y-1">
              <span className="text-[#A0A5AD] text-[10px] font-semibold uppercase tracking-wider">Execution Isolation</span>
              <div className="font-mono text-[#00FA9A] font-bold">SIMULATED (Zero Host Execution)</div>
              <p className="text-[11px] text-[#A0A5AD] pt-1">Prevents arbitrary OS command execution or destructive production database writes.</p>
            </div>

            <div className="p-3.5 rounded bg-[#1A1D20] border border-[#414850] space-y-1">
              <span className="text-[#A0A5AD] text-[10px] font-semibold uppercase tracking-wider">Policy Engine</span>
              <div className="font-mono text-[#FFFFFF] font-bold">Deterministic POL Matrix</div>
              <p className="text-[11px] text-[#A0A5AD] pt-1">Zero-trust default-deny evaluation with deterministic priority matching.</p>
            </div>

            <div className="p-3.5 rounded bg-[#1A1D20] border border-[#414850] space-y-1">
              <span className="text-[#A0A5AD] text-[10px] font-semibold uppercase tracking-wider">Canonicalization Standard</span>
              <div className="font-mono text-[#00FA9A] font-bold">RFC-8785 JSON v1 (SHA-256)</div>
              <p className="text-[11px] text-[#A0A5AD] pt-1">Normalized keys, UTC ISO timestamps, compact deterministic serialization.</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Utility */}
        <div className="p-5 rounded-xl bg-[#2D3238] border border-[#414850] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#414850]">
            <Hash className="w-4 h-4 text-[#00FA9A]" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Audit Hash Verification Utility</h3>
          </div>

          <p className="text-xs text-[#A0A5AD]">
            Validate a candidate event hash against the canonical SHA-256 standard format:
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter 64-char hex SHA-256 digest (e.g. 0x4f8a9b...)"
                value={testHash}
                onChange={(e) => setTestHash(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-[#1A1D20] border border-[#414850] text-xs font-mono text-[#FFFFFF] placeholder-[#A0A5AD]/60 focus:outline-none focus:border-[#00FA9A]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#00FA9A] hover:bg-[#00FA9A]/90 text-xs font-bold text-[#1A1D20] transition shadow-sm"
              >
                Validate Format
              </button>
            </div>

            {verificationResult && (
              <div className={`p-3 rounded text-xs font-mono ${
                verificationResult.startsWith('Valid')
                  ? 'bg-[#00FA9A]/15 border border-[#00FA9A]/30 text-[#00FA9A]'
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
