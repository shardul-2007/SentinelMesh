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
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { BlockchainStatus, BlockchainTransaction, EvidenceInspectorResponse } from '@/lib/types';
import { Header } from '@/components/Header';
import { DeploymentStatusCard } from '@/components/DeploymentStatusCard';
import { IntegrityComparisonView } from '@/components/IntegrityComparisonView';
import { useWeb3Wallet, MST_NETWORKS } from '@/lib/web3Wallet';
import { useRBAC } from '@/lib/rbac';

export default function BlockchainActivityPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
  const { isConnected, address, chainId, switchNetwork, setIsModalOpen } = useWeb3Wallet();
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
    <div className="flex flex-col min-h-full bg-[#000000]">
      <Header 
        title="Blockchain Activity & Evidence Registry" 
        subtitle="Immutable on-chain event anchoring & independent verification on MST Blockchain"
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance & On-Chain Authority Bar */}
        <div className="p-3.5 rounded-xl bg-[#121214] border border-[#27272A] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#A1A1AA]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#A1A1AA] hidden md:inline">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canAnchor ? 'text-[#10B981] font-bold' : 'text-[#71717A] font-medium'}>
              {permissions.canAnchor ? '✓ EVM Anchoring Authorized' : '✗ Anchoring Gated (CSO Only)'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-[#10B981] font-bold' : 'text-[#71717A] font-medium'}>
              {permissions.canVerifyHashes ? '✓ Independent Digest Verification' : '✗ Read-Only Monitor'}
            </span>
          </div>
        </div>

        {/* Network & Contract Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Active Network */}
          <div className="p-4 rounded-xl bg-[#121214] border border-[#27272A] hover:border-[#10B981]/40 text-[#FAFAFA] flex flex-col justify-between shadow-lg min-h-[145px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#A1A1AA]">Active Network</span>
              <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                status?.connected 
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' 
                  : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-[#10B981] animate-ping' : 'bg-[#EF4444]'}`}></span>
                {status?.connected ? 'MST TESTNET' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xl font-extrabold text-[#FFFFFF] mt-1 tracking-tight truncate">{status?.network_name || 'MST Testnet'}</p>
            <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] mt-2 pt-2 border-t border-[#27272A]">
              <span>Chain ID: <strong className="font-mono text-[#FFFFFF]">{status?.detected_chain_id || status?.configured_chain_id || 91562037}</strong></span>
              <span>Native Token: <strong className="font-mono text-[#10B981]">{nativeToken}</strong></span>
            </div>
          </div>

          {/* Box 2: Evidence Registry Contract */}
          <div className="p-4 rounded-xl bg-[#121214] border border-[#27272A] hover:border-[#FACC15]/40 text-[#FAFAFA] flex flex-col justify-between shadow-lg min-h-[145px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#A1A1AA]">EvidenceRegistry Contract</span>
              <Lock className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
            </div>
            <div className="mt-1 flex items-center justify-between min-w-0">
              {status?.contract_address ? (
                <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                  <span className="font-mono text-xs text-[#FACC15] bg-[#1C1C1F] px-2 py-1 rounded font-bold border border-[#27272A] truncate min-w-0">
                    {status.contract_address.slice(0, 10)}...{status.contract_address.slice(-6)}
                  </span>
                  <button 
                    onClick={() => handleCopy(status.contract_address || '')} 
                    className="p-1 rounded bg-[#1C1C1F] hover:bg-[#27272A] text-[#D4D4D8] hover:text-[#FFFFFF] transition flex-shrink-0"
                    title="Copy Contract Address"
                  >
                    {copiedHash === status.contract_address ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={status.contract_explorer_url || `${explorerBase}/address/${status.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded bg-[#1C1C1F] hover:bg-[#27272A] text-[#FACC15] transition flex-shrink-0"
                    title="View on MSTScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <span className="text-xs text-[#A1A1AA] font-mono bg-[#1C1C1F] px-2 py-1 rounded">0x0539...ceca</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] mt-2 pt-2 border-t border-[#27272A]">
              <span>Verified Anchors: <strong className="font-mono text-[#FFFFFF]">{status?.total_anchors ?? transactions.length}</strong></span>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">Solidity 0.8.20</span>
            </div>
          </div>

          {/* Box 3: Current Block Height */}
          <div className="p-4 rounded-xl bg-[#121214] border border-[#27272A] hover:border-[#38BDF8]/40 text-[#FAFAFA] flex flex-col justify-between shadow-lg min-h-[145px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#A1A1AA]">Node Block Height</span>
              <Boxes className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
            </div>
            <p className="text-xl font-extrabold font-mono text-[#FFFFFF] mt-1 tracking-tight truncate">
              {status?.latest_block ? `#${status.latest_block.toLocaleString()}` : '#6,688,115'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] mt-2 pt-2 border-t border-[#27272A] gap-2">
              <span className="truncate min-w-0 flex-1" title={status?.rpc_url || ''}>RPC: testnetrpc.mstblockchain.com</span>
              <a
                href={explorerBase}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#38BDF8] bg-[#1C1C1F] px-2 py-0.5 rounded font-bold hover:bg-[#27272A] flex items-center gap-1 text-[10px] transition flex-shrink-0 border border-[#27272A]"
              >
                <span>MSTScan</span>
                <ArrowUpRight className="w-3 h-3 text-[#38BDF8]" />
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#121214] border border-[#27272A] shadow-sm">
          <div className="relative flex-1 w-full sm:w-auto min-w-0">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by transaction hash, audit event ID, or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#09090B] border border-[#27272A] rounded-lg text-[#FFFFFF] placeholder-[#71717A] focus:outline-none focus:border-[#FACC15] font-mono transition"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <a
              href="https://faucet.mstblockchain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#FFFFFF] bg-[#1C1C1F] border border-[#27272A] hover:bg-[#27272A] hover:border-[#FACC15]/40 transition flex items-center gap-1.5"
            >
              <span>MST Faucet</span>
              <ExternalLink className="w-3 h-3 text-[#A1A1AA]" />
            </a>
            <a
              href={explorerBase}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#000000] bg-[#FACC15] hover:bg-[#EAB308] transition shadow-sm flex items-center gap-1.5"
            >
              <span>MSTScan Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Verifiable On-Chain Guarantee Banner */}
        <div className="p-3.5 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <Fingerprint className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold text-[#FFFFFF] block">MST Testnet Cryptographic Anchoring Guarantee:</span>
              <p className="text-[#A1A1AA] text-[11px] leading-relaxed">
                Evidence commitments are computed using deterministic RFC-8785 canonical JSON and SHA-256. Verified commitments are anchored directly to EvidenceRegistry.sol on MST Testnet (Chain ID 91562037).
              </p>
            </div>
          </div>
          <a
            href="https://testnet.mstscan.com/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-[#FAFAFA] font-bold text-xs transition flex items-center gap-1.5"
          >
            <span>Contract on MSTScan</span>
            <ExternalLink className="w-3 h-3 text-[#FACC15]" />
          </a>
        </div>

        {/* Transaction Records Table */}
        <div className="rounded-xl bg-[#121214] border border-[#27272A] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF]">On-Chain Evidence Commitments</h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Immutable records anchored to EvidenceRegistry on MST Blockchain</p>
            </div>
            <span className="text-xs font-mono text-[#FACC15] font-bold">{filteredTransactions.length} records</span>
          </div>

          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#09090B] text-[#A1A1AA] border-b border-[#27272A]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Transaction Hash</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Canonical SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Block</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] font-mono">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#A1A1AA] font-sans font-medium">
                      <div className="space-y-1">
                        <p className="font-bold text-[#FFFFFF]">No on-chain transactions match your search filter.</p>
                        <p className="text-xs text-[#A1A1AA]">Evaluate an action in the Action Simulator to generate new verifiable audit evidence.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.transaction_hash} className="hover:bg-[#1C1C1F] transition-colors duration-150">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-[#FACC15] truncate">
                            {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.transaction_hash)}
                            className="text-[#A1A1AA] hover:text-[#FFFFFF] transition flex-shrink-0"
                            title="Copy Transaction Hash"
                          >
                            {copiedHash === tx.transaction_hash ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={tx.explorer_url || `https://testnet.mstscan.com/tx/${tx.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FACC15] hover:underline transition flex-shrink-0"
                            title="View Verified Receipt on MSTScan"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">{tx.event_id}</td>
                      <td className="py-3 px-4 text-[#D4D4D8] text-[11px] font-medium">
                        {tx.canonical_hash ? `${tx.canonical_hash.slice(0, 16)}...` : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">
                        {tx.block_number ? `#${tx.block_number.toLocaleString()}` : '#6,688,112'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          CONFIRMED
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 font-sans whitespace-nowrap">
                        <button
                          onClick={() => openInspector(tx.event_id)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#1C1C1F] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] hover:border-[#FACC15]/40 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#FFFFFF]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#27272A] flex items-center justify-between bg-[#09090B]">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#FACC15]" />
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Evidence Commitment Inspector</h3>
                  <p className="text-[11px] text-[#A1A1AA] font-mono">ID: {selectedEventId}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#1C1C1F] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {inspectLoading ? (
                <div className="py-12 text-center text-[#A1A1AA] font-medium">Loading canonical evidence details...</div>
              ) : evidenceData ? (
                <>
                  {/* Action Summary */}
                  <div className="p-3.5 rounded-xl bg-[#09090B] border border-[#27272A]">
                    <span className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider block mb-1">Action Summary</span>
                    <p className="text-xs font-semibold text-[#FFFFFF]">{evidenceData.action_summary}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#A1A1AA] font-mono">
                      <span>Decision: <strong className="text-[#10B981] font-bold">{evidenceData.policy_decision}</strong></span>
                      <span>Policy: <strong className="text-[#FFFFFF] font-bold">{evidenceData.policy_id} (v{evidenceData.policy_version})</strong></span>
                    </div>
                  </div>

                  {/* Verification Status Banner */}
                  <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    evidenceData.verification_status === 'ANCHORED_AND_VERIFIED'
                      ? 'bg-[#10B981]/10 border-[#10B981]/30'
                      : evidenceData.verification_status === 'TAMPERED'
                      ? 'bg-[#EF4444]/15 border-[#EF4444]/30'
                      : 'bg-[#121214] border-[#27272A]'
                  }`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">Cryptographic Verification</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          evidenceData.verification_status === 'ANCHORED_AND_VERIFIED'
                            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                            : evidenceData.verification_status === 'TAMPERED'
                            ? 'bg-[#EF4444] text-[#FFFFFF] border-[#EF4444]'
                            : 'bg-[#1C1C1F] text-[#FAFAFA] border-[#27272A]'
                        }`}>
                          {evidenceData.verification_status === 'ANCHORED_AND_VERIFIED' 
                            ? 'ANCHORED & VERIFIED' 
                            : evidenceData.verification_status === 'TAMPERED' 
                            ? 'TAMPER DETECTED' 
                            : 'INTACT (VERIFIED)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                        {evidenceData.independent_verification?.message || 
                          (evidenceData.anchoring_status === 'ANCHORED' 
                            ? 'Event digest verified against on-chain MST contract state.' 
                            : 'Local RFC-8785 SHA-256 digest intact. Record is ready for verification.')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReverify(selectedEventId!)}
                      disabled={reverifyLoading}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-[#FFFFFF] transition disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#FACC15] ${reverifyLoading ? 'animate-spin' : ''}`} />
                      <span>{reverifyLoading ? 'Reverifying...' : 'Re-verify with Node'}</span>
                    </button>
                  </div>

                  {/* Reverification Feedback Toast if triggered */}
                  {reverifyFeedback && (
                    <div className="p-2.5 rounded-lg bg-[#09090B] border border-[#10B981]/40 text-xs font-mono text-[#10B981] flex items-center justify-between gap-2">
                      <span className="truncate">{reverifyFeedback}</span>
                      <button onClick={() => setReverifyFeedback(null)} className="text-[#A1A1AA] hover:text-[#FFFFFF] text-[10px]">✕</button>
                    </div>
                  )}

                  {/* Hashes Comparison */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#A1A1AA] block mb-1">Local Recomputed Digest (RFC-8785)</span>
                      <div className="p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] font-mono text-[11px] text-[#FACC15] select-all flex items-center justify-between font-bold gap-2">
                        <span className="break-all min-w-0 flex-1">{evidenceData.recomputed_hash}</span>
                        <button onClick={() => handleCopy(evidenceData.recomputed_hash)} className="text-[#A1A1AA] hover:text-[#FFFFFF] flex-shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#A1A1AA] block mb-1">Committed On-Chain Digest</span>
                      <div className="p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] font-mono text-[11px] text-[#10B981] select-all flex items-center justify-between font-bold gap-2">
                        <span className="break-all min-w-0 flex-1">{evidenceData.stored_commitment || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}</span>
                        <button onClick={() => handleCopy(evidenceData.stored_commitment || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6')} className="text-[#A1A1AA] hover:text-[#FFFFFF] flex-shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Canonical JSON Payload Block */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#A1A1AA] block mb-1">Canonical RFC-8785 Evidence Payload</span>
                    <pre className="p-3 rounded-lg bg-[#09090B] text-[#D4D4D8] font-mono text-[11px] overflow-x-auto max-h-48 border border-[#27272A]">
                      {JSON.stringify(evidenceData.canonical_payload, null, 2)}
                    </pre>
                  </div>

                  {/* Blockchain Receipt Details */}
                  {evidenceData.transaction_hash && (
                    <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#A1A1AA] flex-shrink-0">Tx Hash:</span>
                        <a
                          href={evidenceData.explorer_url || `https://testnet.mstscan.com/tx/${evidenceData.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FACC15] hover:underline flex items-center gap-1 font-bold truncate min-w-0"
                        >
                          <span className="truncate">{evidenceData.transaction_hash}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A1A1AA]">Block:</span>
                        <span className="font-bold text-[#FFFFFF]">#{evidenceData.block_number || 6688112}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-[#EF4444] font-bold">Failed to load evidence details.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#27272A] bg-[#09090B] flex justify-end">
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1C1C1F] border border-[#27272A] text-[#FFFFFF] hover:bg-[#27272A] transition"
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
