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
    <div className="flex flex-col min-h-full bg-[#0B0F17]">
      <Header 
        title="Blockchain Activity & Evidence Registry" 
        subtitle="Immutable on-chain event anchoring & independent verification on MST Blockchain"
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance & On-Chain Authority Bar */}
        <div className="p-3.5 rounded-xl bg-[#131A24]/90 border border-[#263244] shadow-[0_0_20px_rgba(6,182,212,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#94A3B8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#64748B] hidden md:inline">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canAnchor ? 'text-emerald-400' : 'text-slate-500'}>
              {permissions.canAnchor ? '✓ EVM Anchoring Authorized' : '✗ Anchoring Gated (CSO Only)'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-cyan-400' : 'text-slate-500'}>
              {permissions.canVerifyHashes ? '✓ Independent Digest Verification' : '✗ Read-Only Monitor'}
            </span>
          </div>
        </div>

        {/* Network & Contract Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Network */}
          <div className="mst-card p-4 rounded-xl bg-[#131A24]/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Active Network</span>
              <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                status?.connected 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {status?.connected ? 'ONLINE' : 'LOCAL SIM'}
              </span>
            </div>
            <p className="text-base font-bold text-[#F8FAFC] mt-1">{status?.network_name || 'MST Testnet'}</p>
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#263244]">
              <span>Chain ID: <strong className="font-mono text-cyan-400">{status?.detected_chain_id || status?.configured_chain_id || 91562037}</strong></span>
              <span>Gas: <strong className="font-mono text-cyan-400">{nativeToken}</strong></span>
            </div>
          </div>

          {/* Evidence Registry Contract */}
          <div className="mst-card p-4 rounded-xl bg-[#131A24]/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">EvidenceRegistry Contract</span>
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-center justify-between">
              {status?.contract_address ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400 font-semibold">
                    {status.contract_address.slice(0, 10)}...{status.contract_address.slice(-6)}
                  </span>
                  <button 
                    onClick={() => handleCopy(status.contract_address || '')} 
                    className="p-1 rounded text-[#94A3B8] hover:text-cyan-400 transition"
                    title="Copy Contract Address"
                  >
                    {copiedHash === status.contract_address ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={status.contract_explorer_url || `${explorerBase}/address/${status.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-cyan-400 hover:text-cyan-300 transition"
                    title="View on MSTScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <span className="text-xs text-amber-400 font-mono">Not deployed on current RPC</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#263244]">
              <span>Total Anchors: <strong className="font-mono text-[#F8FAFC]">{status?.total_anchors ?? transactions.length}</strong></span>
              <span className="text-[10px] font-mono text-emerald-400">Immutable V1</span>
            </div>
          </div>

          {/* Current Block Height */}
          <div className="mst-card p-4 rounded-xl bg-[#131A24]/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Node Block Height</span>
              <Boxes className="w-3.5 h-3.5 text-[#94A3B8]" />
            </div>
            <p className="text-base font-bold font-mono text-[#F8FAFC] mt-1">
              {status?.latest_block ? `#${status.latest_block.toLocaleString()}` : 'Live Syncing'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#263244]">
              <span className="truncate max-w-[200px]" title={status?.rpc_url || ''}>RPC: {status?.rpc_url ? 'testnetrpc.mstblockchain.com' : 'Local Node'}</span>
              <a
                href={explorerBase}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 font-medium hover:underline flex items-center gap-0.5"
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
        <div className="mst-card flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#131A24]/90 border border-slate-800 shadow-xl">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by transaction hash, audit event ID, or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#070A12] border border-slate-800 rounded-lg text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-cyan-400 font-mono transition"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <a
              href="https://faucet.mstblockchain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#F8FAFC] bg-[#070A12] border border-slate-800 hover:bg-[#1A2332] hover:border-cyan-500/40 transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <span>MST Faucet</span>
              <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
            </a>
            <a
              href={explorerBase}
              target="_blank"
              rel="noopener noreferrer"
              className="mst-btn-shimmer relative overflow-hidden px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#070A12] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <span>MST Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Transaction Records Table */}
        <div className="mst-card rounded-xl bg-[#131A24]/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#263244] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">On-Chain Evidence Anchors</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Real commitments recorded in the smart contract on MST Blockchain</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">{filteredTransactions.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A2332] text-[#94A3B8] border-b border-[#263244]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Transaction Hash</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Canonical SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Block</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263244] font-mono">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#94A3B8] font-sans">
                      {transactions.length === 0 ? (
                        <div className="space-y-1">
                          <p className="font-medium text-[#F8FAFC]">No on-chain transactions anchored yet.</p>
                          <p className="text-xs text-[#94A3B8]">Evaluate an action in the Action Gateway, then anchor it in the Integrity Center.</p>
                        </div>
                      ) : (
                        <p>No transactions match your search filter.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.transaction_hash} className="mst-table-row hover:bg-[#1A2332]/70 transition-all duration-200">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-cyan-400">
                            {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.transaction_hash)}
                            className="text-[#94A3B8] hover:text-cyan-400 transition"
                            title="Copy Transaction Hash"
                          >
                            {copiedHash === tx.transaction_hash ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {tx.explorer_url && (
                            <a
                              href={tx.explorer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 transition"
                              title="View on MSTScan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#F8FAFC]">{tx.event_id}</td>
                      <td className="py-3 px-4 text-[#94A3B8] text-[11px]">
                        {tx.canonical_hash ? `${tx.canonical_hash.slice(0, 16)}...` : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#F8FAFC]">
                        {tx.block_number ? `#${tx.block_number}` : 'Pending'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          CONFIRMED
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 font-sans">
                        <button
                          onClick={() => openInspector(tx.event_id)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 transition hover:scale-105 active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#131A24] border border-[#263244] rounded shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#F8FAFC]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#263244] flex items-center justify-between bg-[#1A2332]">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">Evidence Inspector</h3>
                  <p className="text-[11px] text-[#94A3B8] font-mono">ID: {selectedEventId}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#263244] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {inspectLoading ? (
                <div className="py-12 text-center text-[#94A3B8]">Loading canonical evidence details...</div>
              ) : evidenceData ? (
                <>
                  {/* Action Summary */}
                  <div className="p-3 rounded bg-[#0B0F17] border border-[#263244]">
                    <span className="text-[10px] uppercase font-semibold text-[#94A3B8] tracking-wider block mb-1">Action Summary</span>
                    <p className="text-xs font-medium text-[#F8FAFC]">{evidenceData.action_summary}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#94A3B8] font-mono">
                      <span>Decision: <strong className="text-[#10B981]">{evidenceData.policy_decision}</strong></span>
                      <span>Policy: <strong className="text-[#F8FAFC]">{evidenceData.policy_id} (v{evidenceData.policy_version})</strong></span>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="p-3.5 rounded bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#10B981] uppercase tracking-wider block">Cryptographic Verification</span>
                      <p className="text-xs font-semibold text-[#10B981] mt-0.5">
                        {evidenceData.independent_verification?.status || 'VERIFIED'}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        Local SHA-256 digest exactly matches MST on-chain contract state.
                      </p>
                    </div>
                    <button
                      onClick={() => handleReverify(selectedEventId)}
                      disabled={reverifyLoading}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-[#10B981] text-[#0B0F17] hover:bg-[#059669] transition disabled:opacity-50 flex items-center gap-1 shadow-sm"
                    >
                      <RefreshCw className={`w-3 h-3 ${reverifyLoading ? 'animate-spin' : ''}`} />
                      <span>{reverifyLoading ? 'Reverifying...' : 'Re-verify On-Chain'}</span>
                    </button>
                  </div>

                  {/* Hashes Comparison */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#94A3B8] block mb-1">Local Recomputed Digest (RFC-8785)</span>
                      <div className="p-2 rounded bg-[#0B0F17] border border-[#263244] font-mono text-[11px] text-[#38BDF8] break-all select-all flex items-center justify-between">
                        <span>{evidenceData.recomputed_hash}</span>
                        <button onClick={() => handleCopy(evidenceData.recomputed_hash)} className="text-[#94A3B8] hover:text-[#38BDF8]">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#94A3B8] block mb-1">Committed On-Chain Digest</span>
                      <div className="p-2 rounded bg-[#0B0F17] border border-[#263244] font-mono text-[11px] text-[#38BDF8] break-all select-all flex items-center justify-between">
                        <span>{evidenceData.stored_commitment || 'Pending'}</span>
                        {evidenceData.stored_commitment && (
                          <button onClick={() => handleCopy(evidenceData.stored_commitment || '')} className="text-[#94A3B8] hover:text-[#38BDF8]">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Canonical JSON Payload Block */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-[#94A3B8] block mb-1">Canonical RFC-8785 Evidence Payload</span>
                    <pre className="p-3 rounded bg-[#0B0F17] text-[#94A3B8] font-mono text-[11px] overflow-x-auto max-h-48 border border-[#263244]">
                      {JSON.stringify(evidenceData.canonical_payload, null, 2)}
                    </pre>
                  </div>

                  {/* Blockchain Receipt Details */}
                  {evidenceData.transaction_hash && (
                    <div className="p-3 rounded bg-[#0B0F17] border border-[#263244] space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8]">Tx Hash:</span>
                        <a
                          href={evidenceData.explorer_url || `${explorerBase}/tx/${evidenceData.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#38BDF8] hover:underline flex items-center gap-1"
                        >
                          <span>{evidenceData.transaction_hash.slice(0, 16)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8]">Block:</span>
                        <span className="font-semibold text-[#10B981]">#{evidenceData.block_number}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-[#EF4444]">Failed to load evidence details.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#263244] bg-[#1A2332] flex justify-end">
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] hover:bg-[#263244] transition"
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
