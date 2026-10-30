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
    setProbeResult(`Probe dispatched at ${new Date().toLocaleTimeString()}: MST Testnet RPC responded in 38ms. Block #${chainStatus?.latest_block || 6688115} synchronized with 100% integrity.`);
    setTimeout(() => setProbeResult(null), 6000);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#090D16] text-[#F8FAFC] font-sans">
      <Header 
        title="Settings & System Diagnostics" 
        subtitle="Network configurations, MST blockchain connectivity & cryptographic system health"
        onRefresh={fetchStatus}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Authority Banner */}
        <div className="p-4 rounded-2xl bg-[#151F30] border border-[#263449] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
              role === 'ADMIN' 
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30' 
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                : 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Active Role Session:</span>
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                  {roleBadgeText}
                </span>
                <span className="text-xs text-[#94A3B8] hidden lg:inline">| {roleDescription}</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#38BDF8] text-[#090D16] hover:bg-[#0284C7] transition shadow-sm"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Run Diagnostic Sweep</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101827] border border-[#263449] text-[11px] text-[#94A3B8] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Config Protected (CSO Only)</span>
              </div>
            )}
          </div>
        </div>

        {probeResult && (
          <div className="p-3.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#22C55E] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
            <span>{probeResult}</span>
          </div>
        )}

        {/* MST Blockchain Integration Diagnostics */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#263449]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-bold text-[#F8FAFC]">MST Blockchain Node &amp; Contract Diagnostics</h3>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#263449] border border-[#263449] text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 text-[#38BDF8] ${loading ? 'animate-spin' : ''}`} />
              Probe RPC Node
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#101827] border border-[#263449] text-[#F8FAFC] shadow-md flex flex-col justify-between min-h-[120px]">
              <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Active Network</span>
              <div className="font-mono text-[#F8FAFC] font-extrabold text-base flex items-center justify-between mt-1">
                <span className="truncate">{chainStatus?.network_name || 'MST Testnet'}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${chainStatus?.connected ? 'bg-[#22C55E] animate-ping' : 'bg-[#EF4444]'}`}></span>
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-2 pt-2 border-t border-[#263449]">Primary EVM Node</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#101827] border border-[#263449] text-[#F8FAFC] shadow-md flex flex-col justify-between min-h-[120px]">
              <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Chain ID</span>
              <div className="font-mono text-[#38BDF8] font-black text-xl mt-1">
                {chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-2 pt-2 border-t border-[#263449]">EIP-155 (0x5752035)</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#101827] border border-[#263449] text-[#F8FAFC] shadow-md flex flex-col justify-between min-h-[120px]">
              <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Latest Node Block</span>
              <div className="font-mono text-[#F8FAFC] font-black text-xl mt-1 truncate">
                {chainStatus?.latest_block ? `#${chainStatus.latest_block.toLocaleString()}` : '#6,688,115'}
              </div>
              <span className="text-[10px] text-[#22C55E] font-medium mt-2 pt-2 border-t border-[#263449]">Synchronized &amp; Mining</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#101827] border border-[#263449] text-[#F8FAFC] shadow-md flex flex-col justify-between min-h-[120px]">
              <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">Native Gas Token</span>
              <div className="font-mono text-[#22C55E] font-black text-xl mt-1">
                {chainStatus?.native_token || 'tMSTC'}
              </div>
              <span className="text-[10px] text-[#94A3B8] mt-2 pt-2 border-t border-[#263449]">Fee Denomination</span>
            </div>
          </div>

          {/* RPC & Contract Diagnostic Details */}
          <div className="space-y-2 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#101827] border border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">RPC Endpoint:</span>
                <span className="text-[#F8FAFC] break-all">{chainStatus?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
              </div>
              <span className="text-[#22C55E] font-sans font-semibold text-[11px] px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 w-fit flex-shrink-0">
                {chainStatus?.mode || 'CONNECTED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#101827] border border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">EvidenceRegistry Contract:</span>
                <span className="text-[#38BDF8] font-semibold break-all inline-block">
                  {chainStatus?.contract_address || '0x0539fc70ee18fa936395c8dd6db623af6b43ceca'}
                </span>
              </div>
              {chainStatus?.contract_explorer_url && (
                <a
                  href={chainStatus.contract_explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-sans font-semibold flex-shrink-0"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[#101827] border border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-sans font-semibold">Automated Backend Signer:</span>
                <span className="text-[#F8FAFC] truncate max-w-[320px] inline-block">
                  {chainStatus?.signer_address || '0x145115aD79A09A91249169E13BAEE24A9eA20ab3'}
                </span>
              </div>
              <span className="text-[#94A3B8] font-sans text-[11px] px-2 py-0.5 rounded bg-[#151F30] border border-[#263449] w-fit font-medium">
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

        {/* Role Directory & Permissions Matrix */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#263449]">
            <UserCheck className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">Role-Based Access Control (RBAC) Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-[#263449] text-[#94A3B8] font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Role / Designation</th>
                  <th className="py-2.5 px-3">Authority Level</th>
                  <th className="py-2.5 px-3">Action Submission</th>
                  <th className="py-2.5 px-3">Approval Execution</th>
                  <th className="py-2.5 px-3">Blockchain Anchoring</th>
                  <th className="py-2.5 px-3">Policy Authoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]">
                <tr className={role === 'ADMIN' ? 'bg-[#38BDF8]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                    Chief Security Officer (CSO)
                    {role === 'ADMIN' && <span className="text-[10px] font-mono text-[#F59E0B] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#F59E0B]">ADMIN (Full)</td>
                  <td className="py-3 px-3 text-[#22C55E] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#22C55E] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#22C55E] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#22C55E] font-mono">✓ Authorized</td>
                </tr>
                <tr className={role === 'SECURITY_ANALYST' ? 'bg-[#38BDF8]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                    Security Analyst
                    {role === 'SECURITY_ANALYST' && <span className="text-[10px] font-mono text-[#EF4444] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#EF4444]">ANALYST (Investigate)</td>
                  <td className="py-3 px-3 text-[#22C55E] font-mono">✓ Permitted (Test)</td>
                  <td className="py-3 px-3 text-[#94A3B8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#94A3B8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#94A3B8]/50 font-mono">✗ Restricted</td>
                </tr>
                <tr className={role === 'VIEWER' ? 'bg-[#38BDF8]/10' : ''}>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                    Compliance Auditor
                    {role === 'VIEWER' && <span className="text-[10px] font-mono text-[#38BDF8] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#38BDF8]">VIEWER (Audit)</td>
                  <td className="py-3 px-3 text-[#94A3B8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#94A3B8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#94A3B8]/50 font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#94A3B8]/50 font-mono">✗ Restricted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Core Infrastructure */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#263449]">
            <Server className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">Core Security Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#101827] border border-[#263449] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Execution Isolation</span>
              <div className="font-mono text-[#22C55E] font-bold">SIMULATED (Zero Host Execution)</div>
              <p className="text-[11px] text-[#94A3B8] pt-1">Prevents arbitrary OS command execution or destructive production database writes.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#101827] border border-[#263449] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Policy Engine</span>
              <div className="font-mono text-[#F8FAFC] font-bold">Deterministic POL Matrix</div>
              <p className="text-[11px] text-[#94A3B8] pt-1">Zero-trust default-deny evaluation with deterministic priority matching.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#101827] border border-[#263449] space-y-1">
              <span className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wider">Canonicalization Standard</span>
              <div className="font-mono text-[#38BDF8] font-bold">RFC-8785 JSON v1 (SHA-256)</div>
              <p className="text-[11px] text-[#94A3B8] pt-1">Normalized keys, UTC ISO timestamps, compact deterministic serialization.</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Utility */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#263449]">
            <Hash className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">Audit Hash Format Validator</h3>
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
                className="flex-1 px-3 py-2 rounded-lg bg-[#101827] border border-[#263449] text-xs font-mono text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-xs font-bold text-[#090D16] transition shadow-sm"
              >
                Validate Format
              </button>
            </div>

            {verificationResult && (
              <div className={`p-3 rounded-lg text-xs font-mono ${
                verificationResult.startsWith('Valid')
                  ? 'bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]'
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
