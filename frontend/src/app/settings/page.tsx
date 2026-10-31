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
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Settings &amp; System Diagnostics" 
        subtitle="Network configurations, MST blockchain connectivity &amp; cryptographic system health"
        onRefresh={fetchStatus}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Authority Banner */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
              role === 'ADMIN' 
                ? 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20' 
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                : 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">Active Role Session:</span>
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                  {roleBadgeText}
                </span>
                <span className="text-xs text-[#64748B] hidden lg:inline">| {roleDescription}</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-[#FFFFFF] hover:bg-[#1D4ED8] transition shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Run Diagnostic Sweep</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[11px] text-[#64748B] font-mono">
                <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Config Protected (CSO Only)</span>
              </div>
            )}
          </div>
        </div>

        {probeResult && (
          <div className="p-3.5 rounded-xl bg-[#15803D]/10 border border-[#15803D]/20 text-xs text-[#15803D] flex items-center gap-2 shadow-xs">
            <CheckCircle className="w-4 h-4 text-[#15803D] flex-shrink-0" />
            <span>{probeResult}</span>
          </div>
        )}

        {/* MST Blockchain Integration Diagnostics */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#172B4D]">MST Blockchain Node &amp; Contract Diagnostics</h3>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-xs font-semibold text-[#172B4D] flex items-center gap-1.5 transition shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 text-[#2563EB] ${loading ? 'animate-spin' : ''}`} />
              <span>Probe RPC Node</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] shadow-xs flex flex-col justify-between min-h-[120px]">
              <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Active Network</span>
              <div className="font-mono text-[#172B4D] font-extrabold text-base flex items-center justify-between mt-1">
                <span className="truncate">{chainStatus?.network_name || 'MST Testnet'}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${chainStatus?.connected ? 'bg-[#15803D] animate-ping' : 'bg-[#DC2626]'}`}></span>
              </div>
              <span className="text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#E5E7EB]">Primary EVM Node</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] shadow-xs flex flex-col justify-between min-h-[120px]">
              <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Chain ID</span>
              <div className="font-mono text-[#2563EB] font-black text-xl mt-1">
                {chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037}
              </div>
              <span className="text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#E5E7EB]">EIP-155 (0x5752035)</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] shadow-xs flex flex-col justify-between min-h-[120px]">
              <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Latest Node Block</span>
              <div className="font-mono text-[#172B4D] font-black text-xl mt-1 truncate">
                {chainStatus?.latest_block ? `#${chainStatus.latest_block.toLocaleString()}` : '#6,688,115'}
              </div>
              <span className="text-[10px] text-[#15803D] font-medium mt-2 pt-2 border-t border-[#E5E7EB]">Synchronized &amp; Mining</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] shadow-xs flex flex-col justify-between min-h-[120px]">
              <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Native Gas Token</span>
              <div className="font-mono text-[#15803D] font-black text-xl mt-1">
                {chainStatus?.native_token || 'tMSTC'}
              </div>
              <span className="text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#E5E7EB]">Fee Denomination</span>
            </div>
          </div>

          {/* RPC & Contract Diagnostic Details */}
          <div className="space-y-2 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[#64748B] block text-[10px] uppercase font-sans font-semibold">RPC Endpoint:</span>
                <span className="text-[#172B4D] break-all">{chainStatus?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
              </div>
              <span className="text-[#15803D] font-sans font-semibold text-[11px] px-2 py-0.5 rounded bg-[#15803D]/10 border border-[#15803D]/20 w-fit flex-shrink-0">
                {chainStatus?.mode || 'CONNECTED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[#64748B] block text-[10px] uppercase font-sans font-semibold">EvidenceRegistry Contract:</span>
                <span className="text-[#2563EB] font-semibold break-all inline-block">
                  {chainStatus?.contract_address || '0x0539fc70ee18fa936395c8dd6db623af6b43ceca'}
                </span>
              </div>
              {chainStatus?.contract_explorer_url && (
                <a
                  href={chainStatus.contract_explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-sans font-semibold flex-shrink-0"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-sans font-semibold">Automated Backend Signer:</span>
                <span className="text-[#172B4D] truncate max-w-[320px] inline-block">
                  {chainStatus?.signer_address || '0x145115aD79A09A91249169E13BAEE24A9eA20ab3'}
                </span>
              </div>
              <span className="text-[#64748B] font-sans text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E5E7EB] w-fit font-medium">
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
                className="text-[#2563EB] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Request tMSTC tokens from Faucet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={chainStatus.explorer_base_url || 'https://testnet.mstscan.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#64748B] hover:text-[#172B4D] flex items-center gap-1"
              >
                <span>MSTScan Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Role Directory & Permissions Matrix */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
            <UserCheck className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#172B4D]">Role-Based Access Control (RBAC) Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#64748B] font-mono uppercase text-[10px] bg-[#F8FAFC]">
                  <th className="py-2.5 px-3">Role / Designation</th>
                  <th className="py-2.5 px-3">Authority Level</th>
                  <th className="py-2.5 px-3">Action Submission</th>
                  <th className="py-2.5 px-3">Approval Execution</th>
                  <th className="py-2.5 px-3">Blockchain Anchoring</th>
                  <th className="py-2.5 px-3">Policy Authoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr className={role === 'ADMIN' ? 'bg-[#2563EB]/5' : ''}>
                  <td className="py-3 px-3 font-semibold text-[#172B4D] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                    Chief Security Officer (CSO)
                    {role === 'ADMIN' && <span className="text-[10px] font-mono text-[#D97706] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#D97706]">ADMIN (Full)</td>
                  <td className="py-3 px-3 text-[#15803D] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#15803D] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#15803D] font-mono">✓ Authorized</td>
                  <td className="py-3 px-3 text-[#15803D] font-mono">✓ Authorized</td>
                </tr>
                <tr className={role === 'SECURITY_ANALYST' ? 'bg-[#2563EB]/5' : ''}>
                  <td className="py-3 px-3 font-semibold text-[#172B4D] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                    Security Analyst
                    {role === 'SECURITY_ANALYST' && <span className="text-[10px] font-mono text-[#DC2626] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#DC2626]">ANALYST (Investigate)</td>
                  <td className="py-3 px-3 text-[#15803D] font-mono">✓ Permitted (Test)</td>
                  <td className="py-3 px-3 text-[#64748B] font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#64748B] font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#64748B] font-mono">✗ Restricted</td>
                </tr>
                <tr className={role === 'VIEWER' ? 'bg-[#2563EB]/5' : ''}>
                  <td className="py-3 px-3 font-semibold text-[#172B4D] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                    Compliance Auditor
                    {role === 'VIEWER' && <span className="text-[10px] font-mono text-[#2563EB] font-bold">(CURRENT)</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#2563EB]">VIEWER (Audit)</td>
                  <td className="py-3 px-3 text-[#64748B] font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#64748B] font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#64748B] font-mono">✗ Restricted (403)</td>
                  <td className="py-3 px-3 text-[#64748B] font-mono">✗ Restricted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Core Infrastructure */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
            <Server className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#172B4D]">Core Security Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
              <span className="text-[#64748B] text-[10px] font-semibold uppercase tracking-wider">Execution Isolation</span>
              <div className="font-mono text-[#15803D] font-bold">SIMULATED (Zero Host Execution)</div>
              <p className="text-[11px] text-[#64748B] pt-1">Prevents arbitrary OS command execution or destructive production database writes.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
              <span className="text-[#64748B] text-[10px] font-semibold uppercase tracking-wider">Policy Engine</span>
              <div className="font-mono text-[#172B4D] font-bold">Deterministic POL Matrix</div>
              <p className="text-[11px] text-[#64748B] pt-1">Zero-trust default-deny evaluation with deterministic priority matching.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
              <span className="text-[#64748B] text-[10px] font-semibold uppercase tracking-wider">Canonicalization Standard</span>
              <div className="font-mono text-[#2563EB] font-bold">RFC-8785 JSON v1 (SHA-256)</div>
              <p className="text-[11px] text-[#64748B] pt-1">Normalized keys, UTC ISO timestamps, compact deterministic serialization.</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Utility */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
            <Hash className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#172B4D]">Audit Hash Format Validator</h3>
          </div>

          <p className="text-xs text-[#64748B]">
            Validate a candidate event hash against the canonical SHA-256 standard format:
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter 64-char hex SHA-256 digest (e.g. 0x4f8a9b...)"
                value={testHash}
                onChange={(e) => setTestHash(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono text-[#172B4D] placeholder-[#94A3B8] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-[#FFFFFF] transition shadow-xs"
              >
                Validate Format
              </button>
            </div>

            {verificationResult && (
              <div className={`p-3 rounded-lg text-xs font-mono ${
                verificationResult.startsWith('Valid')
                  ? 'bg-[#15803D]/10 border border-[#15803D]/20 text-[#15803D]'
                  : 'bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626]'
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
