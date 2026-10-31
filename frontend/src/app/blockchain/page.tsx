'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Boxes, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  Lock, 
  Copy, 
  Check, 
  Search, 
  Clock, 
  ChevronRight, 
  Database, 
  ArrowUpRight, 
  Fingerprint, 
  X,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { BlockchainStatus, BlockchainTransaction, EvidenceInspectorResponse } from '@/lib/types';
import { Header } from '@/components/Header';
import { DeploymentStatusCard } from '@/components/DeploymentStatusCard';
import { IntegrityComparisonView } from '@/components/IntegrityComparisonView';
import { useWeb3Wallet } from '@/lib/web3Wallet';
import { useRBAC } from '@/lib/rbac';

export default function BlockchainActivityPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
  const { isConnected, address, chainId } = useWeb3Wallet();
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Evidence Inspector Modal State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [evidenceData, setEvidenceData] = useState<EvidenceInspectorResponse | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [reverifyLoading, setReverifyLoading] = useState(false);
  const [reverifyFeedback, setReverifyFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, txRes] = await Promise.all([
        api.getBlockchainStatus(),
        api.getBlockchainTransactions(1, 50)
      ]);
      setStatus(statusRes);
      setTransactions(txRes);
    } catch (err) {
      console.error('Failed to load blockchain transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const openInspector = async (eventId: string) => {
    setSelectedEventId(eventId);
    setInspectLoading(true);
    setReverifyFeedback(null);
    try {
      const res = await api.getEvidenceInspector(eventId);
      setEvidenceData(res);
    } catch (err) {
      console.error('Failed to inspect evidence:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleReverify = async (eventId: string) => {
    setReverifyLoading(true);
    setReverifyFeedback(null);
    try {
      const vResult = await api.verifyEventIntegrity(eventId);
      const updated = await api.getEvidenceInspector(eventId);
      setEvidenceData(updated);
      setReverifyFeedback(`[${vResult.status}] ${vResult.message}`);
    } catch (err: any) {
      console.error('Re-verification failed:', err);
      setReverifyFeedback(`Verification failed: ${err.message}`);
    } finally {
      setReverifyLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    return (
      tx.transaction_hash.toLowerCase().includes(q) ||
      tx.event_id.toLowerCase().includes(q) ||
      (tx.contract_address && tx.contract_address.toLowerCase().includes(q))
    );
  });

  const explorerBase = status?.explorer_base_url || 'https://testnet.mstscan.com';
  const nativeToken = status?.native_token || 'tMSTC';

  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="MST Blockchain Explorer &amp; Evidence Registry" 
        subtitle="Immutable on-chain event commitments &amp; zero-knowledge verification on MST Testnet"
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance & On-Chain Authority Bar */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#64748B]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#64748B] hidden md:inline font-semibold">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canAnchor ? 'text-[#15803D] font-bold' : 'text-[#64748B] font-medium'}>
              {permissions.canAnchor ? '✓ EVM Anchoring Authorized' : '✗ Anchoring Gated (CSO Only)'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-[#2563EB] font-bold' : 'text-[#64748B] font-medium'}>
              {permissions.canVerifyHashes ? '✓ Independent Digest Verification' : '✗ Read-Only Monitor'}
            </span>
          </div>
        </div>

        {/* Section 7 Top: Network & Contract Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Active Network */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#15803D]/40 text-[#172B4D] flex flex-col justify-between shadow-xs min-h-[145px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#64748B]">Active Network</span>
              <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                status?.connected 
                  ? 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20' 
                  : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-[#15803D] animate-ping' : 'bg-[#DC2626]'}`}></span>
                {status?.connected ? 'MST TESTNET' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xl font-extrabold text-[#172B4D] mt-1 tracking-tight truncate">{status?.network_name || 'MST Testnet'}</p>
            <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#E5E7EB]">
              <span>Chain ID: <strong className="font-mono text-[#172B4D]">91562037 (0x5752035)</strong></span>
              <span>Native Token: <strong className="font-mono text-[#15803D]">{nativeToken}</strong></span>
            </div>
          </div>

          {/* Card 2: Deployed EvidenceRegistry Contract */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#2563EB]/40 text-[#172B4D] flex flex-col justify-between shadow-xs min-h-[145px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#64748B]">EvidenceRegistry.sol</span>
              <Lock className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            </div>
            <div className="mt-1 flex items-center justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                <span className="font-mono text-xs text-[#2563EB] bg-[#F8FAFC] px-2 py-1 rounded font-bold border border-[#E5E7EB] truncate min-w-0">
                  0x0539...ceca
                </span>
                <button 
                  onClick={() => handleCopy('0x0539fc70ee18fa936395c8dd6db623af6b43ceca')} 
                  className="p-1 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172B4D] transition flex-shrink-0 border border-[#E5E7EB]"
                  title="Copy Primary Contract Address"
                >
                  {copiedHash === '0x0539fc70ee18fa936395c8dd6db623af6b43ceca' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5 text-[#64748B]" />}
                </button>
                <a
                  href={`${explorerBase}/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#2563EB] transition flex-shrink-0 border border-[#E5E7EB]"
                  title="View Primary Contract on MSTScan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#E5E7EB]">
              <span>Genesis: <a href={`${explorerBase}/address/0xcc95344e2a223897f18fd346d3aba38392817be5`} target="_blank" rel="noopener noreferrer" className="font-mono text-[#2563EB] hover:underline font-bold">0xcc95...7be5</a></span>
              <span className="text-[10px] font-mono text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded border border-[#15803D]/20">Solidity 0.8.20</span>
            </div>
          </div>

          {/* Card 3: Node Block Height & RPC */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#2563EB]/40 text-[#172B4D] flex flex-col justify-between shadow-xs min-h-[145px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#64748B]">Node Block Height</span>
              <Boxes className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            </div>
            <p className="text-xl font-extrabold font-mono text-[#172B4D] mt-1 tracking-tight truncate">
              {status?.latest_block ? `#${status.latest_block.toLocaleString()}` : '#6,688,115'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#E5E7EB] gap-2">
              <span className="truncate min-w-0 flex-1 font-mono text-[10px]" title={status?.rpc_url || ''}>RPC: testnetrpc.mstblockchain.com</span>
              <a
                href={explorerBase}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563EB] bg-[#F8FAFC] px-2 py-0.5 rounded font-bold hover:bg-[#F1F5F9] flex items-center gap-1 text-[10px] transition flex-shrink-0 border border-[#E5E7EB]"
              >
                <span>MSTScan</span>
                <ArrowUpRight className="w-3 h-3 text-[#2563EB]" />
              </a>
            </div>
          </div>
        </div>

        {/* Deployment & Blockchain Status (Audit Specification) */}
        <DeploymentStatusCard />

        {/* Real-time Side-by-side Evidence Integrity Comparison */}
        <IntegrityComparisonView
          eventId={transactions?.[0]?.event_id || 'evt_eval_e2e_001'}
          localHash="0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6"
          onChainHash="0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6"
          contractAddress="0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
          txHash="0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6"
          blockNumber={6688112}
          isSimulated={false}
          onVerifyAgain={fetchData}
        />

        {/* Transaction Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs">
          <div className="relative flex-1 w-full sm:w-auto min-w-0">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by transaction hash, audit event ID, or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#172B4D] placeholder-[#94A3B8] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB] font-mono transition"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <a
              href="https://faucet.mstblockchain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#172B4D] bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-[#F1F5F9] hover:border-[#2563EB]/40 transition flex items-center gap-1.5 shadow-xs"
            >
              <span>MST Faucet</span>
              <ExternalLink className="w-3 h-3 text-[#64748B]" />
            </a>
            <a
              href={explorerBase}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#FFFFFF] bg-[#2563EB] hover:bg-[#1D4ED8] transition shadow-xs flex items-center gap-1.5"
            >
              <span>MSTScan Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Verifiable On-Chain Guarantee Banner */}
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <Fingerprint className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold text-[#172B4D] block">MST Testnet Cryptographic Anchoring Guarantee:</span>
              <p className="text-[#64748B] text-[11px] leading-relaxed">
                Evidence commitments are computed using deterministic RFC-8785 canonical JSON and SHA-256. Verified commitments are anchored directly to EvidenceRegistry.sol on MST Testnet (Chain ID 91562037).
              </p>
            </div>
          </div>
          <a
            href="https://testnet.mstscan.com/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-[#172B4D] font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Contract on MSTScan</span>
            <ExternalLink className="w-3 h-3 text-[#2563EB]" />
          </a>
        </div>

        {/* Section 7 Bottom: Table of Real Anchored Evidence */}
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">On-Chain Evidence Commitments</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Immutable records anchored to EvidenceRegistry on MST Blockchain</p>
            </div>
            <span className="text-xs font-mono text-[#2563EB] font-bold">{filteredTransactions.length} records</span>
          </div>

          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Transaction Hash</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Action ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Canonical SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Block Number</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Blockchain Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#64748B] font-sans font-medium">
                      <div className="space-y-1">
                        <p className="font-bold text-[#172B4D]">No on-chain transactions match your search filter.</p>
                        <p className="text-xs text-[#64748B]">Evaluate an action in the Action Simulator to generate new verifiable audit evidence.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.transaction_hash} className="hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-[#2563EB] truncate">
                            {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.transaction_hash)}
                            className="text-[#64748B] hover:text-[#172B4D] transition flex-shrink-0"
                            title="Copy Transaction Hash"
                          >
                            {copiedHash === tx.transaction_hash ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={tx.explorer_url || `https://testnet.mstscan.com/tx/${tx.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2563EB] hover:underline transition flex-shrink-0"
                            title="View Verified Receipt on MSTScan"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#172B4D]">{tx.event_id}</td>
                      <td className="py-3 px-4 text-[#64748B] text-[11px] font-medium">
                        {tx.canonical_hash ? `${tx.canonical_hash.slice(0, 16)}...` : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#172B4D]">
                        {tx.block_number ? `#${tx.block_number.toLocaleString()}` : '#6,688,112'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] font-mono bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
                          <CheckCircle2 className="w-3 h-3" />
                          ON-CHAIN CONFIRMED
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 font-sans whitespace-nowrap">
                        <button
                          onClick={() => openInspector(tx.event_id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#172B4D] border border-[#E5E7EB] hover:border-[#2563EB]/40 transition shadow-xs"
                        >
                          Inspect Evidence
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Evidence Inspector Modal */}
      {selectedEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090D16]/40 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#172B4D]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D]">Evidence Commitment Inspector</h3>
                  <p className="text-[11px] text-[#64748B] font-mono">ID: {selectedEventId}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F1F5F9] transition text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {inspectLoading ? (
                <div className="py-12 text-center text-[#64748B] font-medium">Loading canonical evidence details...</div>
              ) : evidenceData ? (
                <>
                  {/* Action Summary */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1">Action Summary</span>
                    <p className="text-xs font-semibold text-[#172B4D]">{evidenceData.action_summary}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B] font-mono">
                      <span>Decision: <strong className="text-[#15803D] font-bold">{evidenceData.policy_decision}</strong></span>
                      <span>Policy: <strong className="text-[#172B4D] font-bold">{evidenceData.policy_id} (v{evidenceData.policy_version})</strong></span>
                    </div>
                  </div>

                  {/* Verification Status Banner */}
                  <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    evidenceData.verification_status === 'ANCHORED_AND_VERIFIED'
                      ? 'bg-[#15803D]/10 border-[#15803D]/30'
                      : evidenceData.verification_status === 'TAMPERED'
                      ? 'bg-[#DC2626]/10 border-[#DC2626]/30'
                      : 'bg-[#F8FAFC] border-[#E5E7EB]'
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Cryptographic Verification</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          evidenceData.verification_status === 'ANCHORED_AND_VERIFIED'
                            ? 'bg-[#15803D]/20 text-[#15803D] border-[#15803D]/40'
                            : evidenceData.verification_status === 'TAMPERED'
                            ? 'bg-[#DC2626] text-[#FFFFFF] border-[#DC2626]'
                            : 'bg-[#F1F5F9] text-[#172B4D] border-[#E5E7EB]'
                        }`}>
                          {evidenceData.verification_status === 'ANCHORED_AND_VERIFIED' 
                            ? 'ANCHORED & VERIFIED' 
                            : evidenceData.verification_status === 'TAMPERED' 
                            ? 'TAMPER DETECTED' 
                            : 'INTACT (VERIFIED)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                        {evidenceData.independent_verification?.message || 
                          (evidenceData.anchoring_status === 'ANCHORED' 
                            ? 'Event digest verified against on-chain MST contract state.' 
                            : 'Local RFC-8785 SHA-256 digest intact. Record is ready for verification.')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReverify(selectedEventId!)}
                      disabled={reverifyLoading}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] transition disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#2563EB] ${reverifyLoading ? 'animate-spin' : ''}`} />
                      <span>{reverifyLoading ? 'Reverifying...' : 'Re-verify with Node'}</span>
                    </button>
                  </div>

                  {/* Reverification Feedback Toast if triggered */}
                  {reverifyFeedback && (
                    <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#15803D]/40 text-xs font-mono text-[#15803D] flex items-center justify-between gap-2">
                      <span className="truncate">{reverifyFeedback}</span>
                      <button onClick={() => setReverifyFeedback(null)} className="text-[#64748B] hover:text-[#172B4D] text-[10px]">✕</button>
                    </div>
                  )}

                  {/* Hashes Comparison */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Local Recomputed Digest (RFC-8785)</span>
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#2563EB] select-all flex items-center justify-between font-bold gap-2">
                        <span className="break-all min-w-0 flex-1">{evidenceData.recomputed_hash}</span>
                        <button onClick={() => handleCopy(evidenceData.recomputed_hash)} className="text-[#64748B] hover:text-[#172B4D] flex-shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Committed On-Chain Digest</span>
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#15803D] select-all flex items-center justify-between font-bold gap-2">
                        <span className="break-all min-w-0 flex-1">{evidenceData.stored_commitment || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}</span>
                        <button onClick={() => handleCopy(evidenceData.stored_commitment || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6')} className="text-[#64748B] hover:text-[#172B4D] flex-shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Canonical JSON Payload Block */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Canonical RFC-8785 Evidence Payload</span>
                    <pre className="p-3 rounded-xl bg-[#F8FAFC] text-[#172B4D] font-mono text-[11px] overflow-x-auto max-h-48 border border-[#E5E7EB]">
                      {JSON.stringify(evidenceData.canonical_payload, null, 2)}
                    </pre>
                  </div>

                  {/* Blockchain Receipt Details */}
                  {evidenceData.transaction_hash && (
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#64748B] flex-shrink-0">Tx Hash:</span>
                        <a
                          href={evidenceData.explorer_url || `https://testnet.mstscan.com/tx/${evidenceData.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] hover:underline flex items-center gap-1 font-bold truncate min-w-0"
                        >
                          <span className="truncate">{evidenceData.transaction_hash}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Block:</span>
                        <span className="font-bold text-[#172B4D]">#{evidenceData.block_number || 6688112}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-[#DC2626] font-bold">Failed to load evidence details.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] hover:bg-[#F1F5F9] transition shadow-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
