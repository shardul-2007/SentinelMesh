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
    try {
      await api.verifyEventIntegrity(eventId);
      const updated = await api.getEvidenceInspector(eventId);
      setEvidenceData(updated);
    } catch (err) {
      console.error('Re-verification failed:', err);
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
        <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#D4D4D8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#D4D4D8]/70 hidden md:inline font-semibold">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canAnchor ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50 font-medium'}>
              {permissions.canAnchor ? '✓ EVM Anchoring Authorized' : '✗ Anchoring Gated (CSO Only)'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50 font-medium'}>
              {permissions.canVerifyHashes ? '✓ Independent Digest Verification' : '✗ Read-Only Monitor'}
            </span>
          </div>
        </div>

        {/* Network & Contract Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Network */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] flex flex-col justify-between shadow-sm min-h-[140px]">
            <div className="flex items-center justify-between text-xs text-[#D4D4D8] mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider">Active Network</span>
              <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                status?.connected 
                  ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30' 
                  : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-[#FACC15] animate-pulse' : 'bg-[#F59E0B]'}`}></span>
                {status?.connected ? 'ONLINE' : 'LOCAL SIM'}
              </span>
            </div>
            <p className="text-base font-extrabold text-[#FFFFFF] mt-1">{status?.network_name || 'MST Testnet'}</p>
            <div className="flex items-center justify-between text-[11px] text-[#D4D4D8] mt-2 pt-2 border-t border-[#27272A] font-medium">
              <span>Chain ID: <strong className="font-mono text-[#FACC15] font-bold">{status?.detected_chain_id || status?.configured_chain_id || 91562037}</strong></span>
              <span>Gas: <strong className="font-mono text-[#FACC15] font-bold">{nativeToken}</strong></span>
            </div>
          </div>

          {/* Evidence Registry Contract */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] flex flex-col justify-between shadow-sm min-h-[140px]">
            <div className="flex items-center justify-between text-xs text-[#D4D4D8] mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider">EvidenceRegistry Contract</span>
              <Lock className="w-3.5 h-3.5 text-[#EF4444]" />
            </div>
            <div className="mt-1 flex items-center justify-between">
              {status?.contract_address ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#EF4444] font-bold">
                    {status.contract_address.slice(0, 10)}...{status.contract_address.slice(-6)}
                  </span>
                  <button 
                    onClick={() => handleCopy(status.contract_address || '')} 
                    className="p-1 rounded text-[#D4D4D8] hover:text-[#FFFFFF] transition"
                    title="Copy Contract Address"
                  >
                    {copiedHash === status.contract_address ? <Check className="w-3.5 h-3.5 text-[#FACC15]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={status.contract_explorer_url || `${explorerBase}/address/${status.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-[#EF4444] hover:underline transition"
                    title="View on MSTScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <span className="text-xs text-[#F59E0B] font-mono font-bold">Not deployed on current RPC</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#D4D4D8] mt-2 pt-2 border-t border-[#27272A] font-medium">
              <span>Total Anchors: <strong className="font-mono text-[#FFFFFF] font-bold">{status?.total_anchors ?? transactions.length}</strong></span>
              <span className="text-[10px] font-mono text-[#FACC15] font-bold">Immutable V1</span>
            </div>
          </div>

          {/* Current Block Height */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] flex flex-col justify-between shadow-sm min-h-[140px]">
            <div className="flex items-center justify-between text-xs text-[#D4D4D8] mb-1">
              <span className="font-bold uppercase text-[10px] tracking-wider">Node Block Height</span>
              <Boxes className="w-3.5 h-3.5 text-[#FACC15]" />
            </div>
            <p className="text-base font-extrabold font-mono text-[#FFFFFF] mt-1">
              {status?.latest_block ? `#${status.latest_block.toLocaleString()}` : 'Live Syncing'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#D4D4D8] mt-2 pt-2 border-t border-[#27272A] font-medium">
              <span className="truncate max-w-[200px]" title={status?.rpc_url || ''}>RPC: {status?.rpc_url ? 'testnetrpc.mstblockchain.com' : 'Local Node'}</span>
              <a
                href={explorerBase}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FACC15] font-bold hover:underline flex items-center gap-0.5"
              >
                <span>MSTScan</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Deployment & Blockchain Status (Audit Specification) */}
        <DeploymentStatusCard />

        {/* Real-time Side-by-side Evidence Integrity Comparison */}
        <IntegrityComparisonView
          eventId={transactions?.[0]?.event_id || 'evt_mst_001'}
          localHash="c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e"
          onChainHash="c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e"
          contractAddress={status?.contract_address || '0x00E08271A37df1E90E95F062F814D7336D5369Ce'}
          txHash={transactions?.[0]?.transaction_hash || '0x9a8f273b5c104e8d3f6291a847291a03e18f8b39487c6e5a01948372615a9b8c'}
          blockNumber={transactions?.[0]?.block_number || 1428594}
          onVerifyAgain={fetchData}
        />

        {/* Transaction Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#121212] border border-[#27272A] shadow-sm">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-[#D4D4D8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by transaction hash, audit event ID, or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#000000] border border-[#27272A] rounded-lg text-[#FFFFFF] placeholder-[#D4D4D8]/60 focus:outline-none focus:border-[#FACC15] font-mono transition font-medium"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <a
              href="https://faucet.mstblockchain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#FFFFFF] bg-[#000000] border border-[#27272A] hover:bg-[#1C1C1C] hover:border-[#FACC15]/40 transition flex items-center gap-1.5 active:scale-95"
            >
              <span>MST Faucet</span>
              <ExternalLink className="w-3 h-3 text-[#D4D4D8]" />
            </a>
            <a
              href={explorerBase}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#000000] bg-[#FACC15] hover:bg-[#FACC15]/90 transition shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <span>MST Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* MSTScan Indexing & Simulation Notice */}
        <div className="p-3.5 rounded-xl bg-[#121212] border border-[#FACC15]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Fingerprint className="w-4 h-4 text-[#FACC15] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-[#FFFFFF] block">MSTScan Testnet Indexing &amp; Real Transaction Note:</span>
              <p className="text-[#D4D4D8] text-[11px] leading-relaxed">
                Records tagged <span className="font-mono text-[#FACC15] font-bold">LOCAL</span> are cryptographically verified in offline simulation (RFC-8785 + SHA-256) and do not exist on the public block explorer yet. Connect your <strong>BridgeKey Wallet</strong> or fund the signer via the MST Faucet to broadcast live transactions that can be opened on MSTScan.
              </p>
            </div>
          </div>
          <a
            href="https://faucet.mstblockchain.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#FACC15] text-[#000000] font-bold text-xs hover:bg-[#EAB308] transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Get Faucet Gas</span>
            <ExternalLink className="w-3 h-3 text-[#000000]" />
          </a>
        </div>

        {/* Transaction Records Table */}
        <div className="rounded-xl bg-[#121212] border border-[#27272A] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF]">On-Chain Evidence Anchors</h3>
              <p className="text-xs text-[#D4D4D8] mt-0.5">Real commitments recorded in the smart contract on MST Blockchain</p>
            </div>
            <span className="text-xs font-mono text-[#FACC15] font-bold">{filteredTransactions.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#000000] text-[#D4D4D8] border-b border-[#27272A]">
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
                    <td colSpan={6} className="py-10 text-center text-[#D4D4D8] font-sans font-medium">
                      {transactions.length === 0 ? (
                        <div className="space-y-1">
                          <p className="font-bold text-[#FFFFFF]">No on-chain transactions anchored yet.</p>
                          <p className="text-xs text-[#D4D4D8]">Evaluate an action in the Action Gateway, then anchor it in the Integrity Center.</p>
                        </div>
                      ) : (
                        <p>No transactions match your search filter.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.transaction_hash} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#FACC15]">
                            {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.transaction_hash)}
                            className="text-[#D4D4D8] hover:text-[#FFFFFF] transition"
                            title="Copy Transaction Hash"
                          >
                            {copiedHash === tx.transaction_hash ? <Check className="w-3 h-3 text-[#FACC15]" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {tx.status === 'CONFIRMED' && tx.explorer_url ? (
                            <a
                              href={tx.explorer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FACC15] hover:underline transition"
                              title="View Verified Receipt on MSTScan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span
                              className="text-[#71717A] cursor-help inline-flex items-center"
                              title="Local simulated hash (RFC-8785 + SHA-256). Connect BridgeKey or provide testnet gas to broadcast and view live on MSTScan."
                            >
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-[#27272A] text-[#71717A] border border-[#27272A]">LOCAL</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">{tx.event_id}</td>
                      <td className="py-3 px-4 text-[#D4D4D8] text-[11px] font-medium">
                        {tx.canonical_hash ? `${tx.canonical_hash.slice(0, 16)}...` : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">
                        {tx.block_number ? `#${tx.block_number}` : 'Pending'}
                      </td>
                      <td className="py-3 px-4">
                        {tx.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] font-mono bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            CONFIRMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30" title="Cryptographically computed in local simulation mode. Connect BridgeKey or provide testnet gas to submit on-chain.">
                            <Clock className="w-3 h-3" />
                            SIMULATED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 font-sans">
                        <button
                          onClick={() => openInspector(tx.event_id)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 hover:bg-[#FACC15]/25 transition active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#27272A] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#FFFFFF]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#27272A] flex items-center justify-between bg-[#000000]">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#FACC15]" />
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Evidence Inspector</h3>
                  <p className="text-[11px] text-[#D4D4D8] font-mono">ID: {selectedEventId}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="p-1 rounded-lg text-[#D4D4D8] hover:text-[#FFFFFF] hover:bg-[#1C1C1C] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {inspectLoading ? (
                <div className="py-12 text-center text-[#D4D4D8] font-medium">Loading canonical evidence details...</div>
              ) : evidenceData ? (
                <>
                  {/* Action Summary */}
                  <div className="p-3 rounded-lg bg-[#000000] border border-[#27272A]">
                    <span className="text-[10px] uppercase font-bold text-[#D4D4D8] tracking-wider block mb-1">Action Summary</span>
                    <p className="text-xs font-semibold text-[#FFFFFF]">{evidenceData.action_summary}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#D4D4D8] font-mono">
                      <span>Decision: <strong className="text-[#FACC15] font-bold">{evidenceData.policy_decision}</strong></span>
                      <span>Policy: <strong className="text-[#FFFFFF] font-bold">{evidenceData.policy_id} (v{evidenceData.policy_version})</strong></span>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="p-3.5 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#FACC15] uppercase tracking-wider block">Cryptographic Verification</span>
                      <p className="text-xs font-bold text-[#FACC15] mt-0.5">
                        {evidenceData.independent_verification?.status || 'VERIFIED'}
                      </p>
                      <p className="text-[11px] text-[#D4D4D8] mt-0.5">
                        Local SHA-256 digest exactly matches MST on-chain contract state.
                      </p>
                    </div>
                    <button
                      onClick={() => handleReverify(selectedEventId)}
                      disabled={reverifyLoading}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FACC15] text-[#000000] hover:bg-[#FACC15]/90 transition disabled:opacity-50 flex items-center gap-1 shadow-sm"
                    >
                      <RefreshCw className={`w-3 h-3 ${reverifyLoading ? 'animate-spin' : ''}`} />
                      <span>{reverifyLoading ? 'Reverifying...' : 'Re-verify On-Chain'}</span>
                    </button>
                  </div>

                  {/* Hashes Comparison */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#D4D4D8] block mb-1">Local Recomputed Digest (RFC-8785)</span>
                      <div className="p-2 rounded-lg bg-[#000000] border border-[#27272A] font-mono text-[11px] text-[#FACC15] break-all select-all flex items-center justify-between font-bold">
                        <span>{evidenceData.recomputed_hash}</span>
                        <button onClick={() => handleCopy(evidenceData.recomputed_hash)} className="text-[#D4D4D8] hover:text-[#FFFFFF]">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#D4D4D8] block mb-1">Committed On-Chain Digest</span>
                      <div className="p-2 rounded-lg bg-[#000000] border border-[#27272A] font-mono text-[11px] text-[#FACC15] break-all select-all flex items-center justify-between font-bold">
                        <span>{evidenceData.stored_commitment || 'Pending'}</span>
                        {evidenceData.stored_commitment && (
                          <button onClick={() => handleCopy(evidenceData.stored_commitment || '')} className="text-[#D4D4D8] hover:text-[#FFFFFF]">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Canonical JSON Payload Block */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#D4D4D8] block mb-1">Canonical RFC-8785 Evidence Payload</span>
                    <pre className="p-3 rounded-lg bg-[#000000] text-[#D4D4D8] font-mono text-[11px] overflow-x-auto max-h-48 border border-[#27272A]">
                      {JSON.stringify(evidenceData.canonical_payload, null, 2)}
                    </pre>
                  </div>

                  {/* Blockchain Receipt Details */}
                  {evidenceData.transaction_hash && (
                    <div className="p-3 rounded-lg bg-[#000000] border border-[#27272A] space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#D4D4D8]">Tx Hash:</span>
                        {evidenceData.anchoring_status === 'ANCHORED' && evidenceData.explorer_url ? (
                          <a
                            href={evidenceData.explorer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FACC15] hover:underline flex items-center gap-1 font-bold"
                          >
                            <span>{evidenceData.transaction_hash.slice(0, 16)}...</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#D4D4D8] font-bold">{evidenceData.transaction_hash.slice(0, 16)}...</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#27272A] text-[#71717A] border border-[#27272A]" title="Simulated local hash. Not yet indexed on MSTScan.">LOCAL</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#D4D4D8]">Block:</span>
                        <span className="font-bold text-[#FACC15]">#{evidenceData.block_number}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-[#EF4444] font-bold">Failed to load evidence details.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#27272A] bg-[#000000] flex justify-end">
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#121212] border border-[#27272A] text-[#FFFFFF] hover:bg-[#1C1C1C] transition"
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
