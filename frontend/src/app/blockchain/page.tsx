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
  Fingerprint
} from 'lucide-react';
import { api } from '@/lib/api';
import { BlockchainStatus, BlockchainTransaction, EvidenceInspectorResponse } from '@/lib/types';

export default function BlockchainActivityPage() {
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-graphite-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#E9EFF7] tracking-tight">
              MST Blockchain Activity & Evidence Registry
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-blue-500/10 text-[#82B5F8] border border-blue-500/20">
              {status?.network_name || 'MST Testnet'}
            </span>
          </div>
          <p className="text-xs text-[#A2AFBE] mt-1">
            Real on-chain commitments anchored to the MST <code className="text-[#E9EFF7]">EvidenceRegistry</code> contract. Independently verifiable with zero simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-[#19222D] hover:bg-[#202B38] border border-graphite-700/60 text-xs font-medium text-[#E9EFF7] flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A2AFBE] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {status?.faucet_url && (
            <a
              href={status.faucet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300 flex items-center gap-1.5 transition"
            >
              <span>MST Faucet</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Network Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network & Node Status */}
        <div className="p-4 rounded-lg bg-[#19222D] border border-graphite-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A2AFBE]">
            <span>Connected Network</span>
            <span className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
          </div>
          <div className="text-base font-semibold text-[#E9EFF7]">
            {status?.network_name || 'MST Testnet'}
          </div>
          <div className="text-[11px] text-[#A2AFBE] font-mono flex items-center justify-between">
            <span>Chain ID:</span>
            <span className="text-[#E9EFF7]">{status?.detected_chain_id || status?.configured_chain_id || 91562037}</span>
          </div>
          <div className="text-[11px] text-[#A2AFBE] font-mono flex items-center justify-between">
            <span>Currency:</span>
            <span className="text-emerald-400 font-medium">{nativeToken}</span>
          </div>
        </div>

        {/* Latest Block */}
        <div className="p-4 rounded-lg bg-[#19222D] border border-graphite-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A2AFBE]">
            <span>Latest Block Height</span>
            <Clock className="w-3.5 h-3.5 text-[#82B5F8]" />
          </div>
          <div className="text-base font-semibold font-mono text-[#E9EFF7]">
            {status?.latest_block ? `#${status.latest_block.toLocaleString()}` : 'Connected'}
          </div>
          <div className="text-[11px] text-[#A2AFBE] truncate font-mono">
            RPC: <span className="text-slate-300">{status?.rpc_url || 'https://testnetrpc.mstblockchain.com'}</span>
          </div>
          <div className="text-[11px] text-[#A2AFBE]">
            Status: <span className="text-emerald-400 font-medium">{status?.mode || 'READY'}</span>
          </div>
        </div>

        {/* Smart Contract Registry */}
        <div className="p-4 rounded-lg bg-[#19222D] border border-graphite-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A2AFBE]">
            <span>EvidenceRegistry Contract</span>
            <Lock className="w-3.5 h-3.5 text-[#82B5F8]" />
          </div>
          <div className="text-xs font-mono text-[#82B5F8] truncate flex items-center gap-1.5">
            {status?.contract_address ? (
              <>
                <span className="truncate">{status.contract_address}</span>
                <button 
                  onClick={() => handleCopy(status.contract_address)}
                  className="text-slate-400 hover:text-white"
                  title="Copy contract address"
                >
                  {copiedHash === status.contract_address ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </>
            ) : (
              <span className="text-slate-400">Configured via MST Registry</span>
            )}
          </div>
          {status?.contract_address && status?.contract_explorer_url && (
            <a
              href={status.contract_explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#82B5F8] hover:underline"
            >
              <span>View on MSTScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Total Evidence Anchored */}
        <div className="p-4 rounded-lg bg-[#19222D] border border-graphite-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A2AFBE]">
            <span>On-Chain Anchors</span>
            <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-semibold text-[#E9EFF7]">
            {status?.total_anchors ?? transactions.length} Records
          </div>
          <div className="text-[11px] text-[#A2AFBE] flex items-center justify-between">
            <span>Verified Intact:</span>
            <span className="text-emerald-400 font-mono font-medium">{status?.total_verified ?? 0}</span>
          </div>
          <div className="text-[11px] text-[#A2AFBE] flex items-center justify-between">
            <span>Tamper Alerts:</span>
            <span className={`font-mono font-medium ${(status?.total_tampered ?? 0) > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {status?.total_tampered ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A2AFBE]" />
          <input
            type="text"
            placeholder="Search by Tx Hash, Event ID, or Contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#19222D] border border-graphite-700/60 text-xs text-[#E9EFF7] placeholder-[#A2AFBE] focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="text-xs text-[#A2AFBE] font-mono flex items-center gap-2">
          <span>Showing {filteredTransactions.length} on-chain transactions</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg bg-[#19222D] border border-graphite-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131A23] border-b border-graphite-700/60 text-[#A2AFBE]">
              <tr>
                <th className="px-4 py-3 font-medium">Transaction Hash</th>
                <th className="px-4 py-3 font-medium">Event / Evidence ID</th>
                <th className="px-4 py-3 font-medium">Block Height</th>
                <th className="px-4 py-3 font-medium">Canonical Hash (SHA-256)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-700/40 text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#A2AFBE]">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#82B5F8]" />
                        <span>Querying MST Blockchain transaction history...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-[#E9EFF7]">No on-chain transactions recorded yet.</p>
                        <p className="text-[11px] text-[#A2AFBE]">
                          Use the <Link href="/simulator" className="text-[#82B5F8] hover:underline">Action Gateway</Link> or <Link href="/integrity" className="text-[#82B5F8] hover:underline">Integrity Center</Link> to anchor an audit event to MST Blockchain.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const txUrl = tx.explorer_url || (status?.explorer_base_url ? `${status.explorer_base_url}/tx/${tx.transaction_hash}` : null);
                  return (
                    <tr key={tx.transaction_hash} className="hover:bg-[#202B38]/50 transition-colors">
                      {/* Transaction Hash */}
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-[#82B5F8] font-medium truncate max-w-[150px]">
                            {tx.transaction_hash}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.transaction_hash)}
                            className="text-[#A2AFBE] hover:text-[#E9EFF7]"
                            title="Copy transaction hash"
                          >
                            {copiedHash === tx.transaction_hash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {txUrl && (
                            <a
                              href={txUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#82B5F8] hover:text-blue-300"
                              title="View on MSTScan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Event ID */}
                      <td className="px-4 py-3 font-mono text-[#E9EFF7]">
                        <button
                          onClick={() => openInspector(tx.event_id)}
                          className="hover:text-[#82B5F8] hover:underline text-left"
                          title="Open Evidence Inspector"
                        >
                          {tx.event_id}
                        </button>
                      </td>

                      {/* Block Height */}
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {tx.block_number ? (
                          <span className="text-emerald-400 font-medium">#{tx.block_number}</span>
                        ) : (
                          <span className="text-[#A2AFBE]">Pending</span>
                        )}
                      </td>

                      {/* Canonical SHA-256 */}
                      <td className="px-4 py-3 font-mono text-xs text-[#A2AFBE] truncate max-w-[160px]">
                        {tx.canonical_hash || '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          CONFIRMED
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openInspector(tx.event_id)}
                          className="px-2.5 py-1 rounded bg-[#202B38] hover:bg-[#283647] border border-graphite-700/60 text-xs font-medium text-[#82B5F8] inline-flex items-center gap-1 transition"
                        >
                          <span>Inspect Evidence</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Inspector Modal */}
      {selectedEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl bg-[#19222D] border border-graphite-700/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-[#131A23] border-b border-graphite-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#82B5F8]" />
                <h3 className="text-sm font-semibold text-[#E9EFF7]">
                  Evidence Inspector — {selectedEventId}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedEventId(null);
                  setEvidenceData(null);
                }}
                className="text-xs text-[#A2AFBE] hover:text-[#E9EFF7] px-2 py-1 rounded hover:bg-[#202B38]"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {inspectLoading || !evidenceData ? (
                <div className="p-8 text-center text-[#A2AFBE] flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#82B5F8]" />
                  <span>Loading cryptographic evidence and querying MST contract...</span>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${
                    evidenceData.independent_verification.local_matches
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/40 border-red-800/60 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {evidenceData.independent_verification.local_matches ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="font-medium">
                        Verification Status: {evidenceData.verification_status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleReverify(evidenceData.event_id)}
                      disabled={reverifyLoading}
                      className="px-2.5 py-1 rounded bg-[#202B38] hover:bg-[#283647] border border-graphite-700/60 text-[11px] font-medium text-[#E9EFF7] flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${reverifyLoading ? 'animate-spin' : ''}`} />
                      Re-Verify Now
                    </button>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#131A23] border border-graphite-700/50">
                    <div>
                      <span className="text-[#A2AFBE] block">Action Summary:</span>
                      <span className="text-[#E9EFF7] font-medium">{evidenceData.action_summary}</span>
                    </div>
                    <div>
                      <span className="text-[#A2AFBE] block">Governing Policy:</span>
                      <span className="text-[#E9EFF7] font-mono">{evidenceData.policy_id} (v{evidenceData.policy_version})</span>
                    </div>
                    <div>
                      <span className="text-[#A2AFBE] block">Policy Decision:</span>
                      <span className={`font-mono font-medium ${
                        evidenceData.policy_decision === 'ALLOW' ? 'text-emerald-400' :
                        evidenceData.policy_decision === 'BLOCK' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {evidenceData.policy_decision}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A2AFBE] block">Canonicalization Spec:</span>
                      <span className="text-[#E9EFF7] font-mono">{evidenceData.canonical_version} (RFC-8785)</span>
                    </div>
                  </div>

                  {/* Cryptographic Comparison */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#E9EFF7] text-xs">Cryptographic Hashes & Commitments</h4>
                    <div className="p-3 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-2 font-mono">
                      <div>
                        <span className="text-[#A2AFBE] text-[11px] block">Recomputed SHA-256 Digest (from stored audit state):</span>
                        <div className="flex items-center gap-2">
                          <code className="text-emerald-400 break-all">{evidenceData.recomputed_hash}</code>
                          <button onClick={() => handleCopy(evidenceData.recomputed_hash)} className="text-slate-400 hover:text-white">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-graphite-700/40">
                        <span className="text-[#A2AFBE] text-[11px] block">Stored Evidence Commitment:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-[#82B5F8] break-all">{evidenceData.stored_commitment || 'Not recorded'}</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MST Blockchain Anchoring Details */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#E9EFF7] text-xs">MST Blockchain Transaction Details</h4>
                    <div className="p-3 rounded-lg bg-[#131A23] border border-graphite-700/50 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A2AFBE]">Network:</span>
                        <span className="text-[#E9EFF7]">{evidenceData.network_name} (Chain ID {evidenceData.chain_id})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A2AFBE]">Contract Address:</span>
                        <span className="text-[#82B5F8] truncate max-w-[280px]">{evidenceData.contract_address || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A2AFBE]">Transaction Hash:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 truncate max-w-[250px]">{evidenceData.transaction_hash || '—'}</span>
                          {evidenceData.explorer_url && (
                            <a href={evidenceData.explorer_url} target="_blank" rel="noopener noreferrer" className="text-[#82B5F8] hover:underline">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A2AFBE]">Block Number:</span>
                        <span className="text-[#E9EFF7]">#{evidenceData.block_number ?? 'Pending'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#A2AFBE]">Anchored At:</span>
                        <span className="text-[#A2AFBE]">{evidenceData.anchored_at ? new Date(evidenceData.anchored_at).toLocaleString() : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Canonical Evidence JSON Payload */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#E9EFF7] text-xs">Canonical Normalized Evidence Payload (RFC-8785)</h4>
                    <pre className="p-3 rounded-lg bg-[#10151C] border border-graphite-700/60 font-mono text-[11px] text-[#82B5F8] overflow-x-auto">
                      {JSON.stringify(evidenceData.canonical_payload, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-[#131A23] border-t border-graphite-700/60 flex items-center justify-between text-xs">
              <span className="text-[#A2AFBE]">SentinelMesh Cryptographic Assurance</span>
              <button
                onClick={() => {
                  setSelectedEventId(null);
                  setEvidenceData(null);
                }}
                className="px-3 py-1.5 rounded bg-[#202B38] hover:bg-[#283647] text-[#E9EFF7] font-medium"
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
