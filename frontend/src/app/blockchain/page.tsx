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
    <div className="flex flex-col min-h-full bg-[#F5F4F0]">
      <Header 
        title="Blockchain Activity & Evidence Registry" 
        subtitle="Immutable on-chain event anchoring & independent verification on MST Blockchain"
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Network & Contract Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Network */}
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#737B86] mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Active Network</span>
              <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                status?.connected 
                  ? 'bg-[#EDF6F2] text-[#287653] border-[#BCE2D1]' 
                  : 'bg-[#FDF7ED] text-[#98661C] border-[#F5DEB3]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? 'bg-[#287653] animate-pulse' : 'bg-[#98661C]'}`}></span>
                {status?.connected ? 'ONLINE' : 'LOCAL SIM'}
              </span>
            </div>
            <p className="text-base font-bold text-[#171A1F] mt-1">{status?.network_name || 'MST Testnet'}</p>
            <div className="flex items-center justify-between text-[11px] text-[#737B86] mt-2 pt-2 border-t border-[#F5F4F0]">
              <span>Chain ID: <strong className="font-mono text-[#171A1F]">{status?.detected_chain_id || status?.configured_chain_id || 91562037}</strong></span>
              <span>Gas: <strong className="font-mono text-[#171A1F]">{nativeToken}</strong></span>
            </div>
          </div>

          {/* Evidence Registry Contract */}
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#737B86] mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">EvidenceRegistry Contract</span>
              <Lock className="w-3.5 h-3.5 text-[#315C78]" />
            </div>
            <div className="mt-1 flex items-center justify-between">
              {status?.contract_address ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#171A1F] font-semibold">
                    {status.contract_address.slice(0, 10)}...{status.contract_address.slice(-6)}
                  </span>
                  <button 
                    onClick={() => handleCopy(status.contract_address || '')} 
                    className="p-1 rounded text-[#737B86] hover:text-[#171A1F] transition"
                    title="Copy Contract Address"
                  >
                    {copiedHash === status.contract_address ? <Check className="w-3.5 h-3.5 text-[#287653]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={status.contract_explorer_url || `${explorerBase}/address/${status.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-[#315C78] hover:text-[#26495F] transition"
                    title="View on MSTScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <span className="text-xs text-[#98661C] font-mono">Not deployed on current RPC</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#737B86] mt-2 pt-2 border-t border-[#F5F4F0]">
              <span>Total Anchors: <strong className="font-mono text-[#171A1F]">{status?.total_anchors ?? transactions.length}</strong></span>
              <span className="text-[10px] font-mono text-[#287653]">Immutable V1</span>
            </div>
          </div>

          {/* Current Block Height */}
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#737B86] mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Node Block Height</span>
              <Boxes className="w-3.5 h-3.5 text-[#737B86]" />
            </div>
            <p className="text-base font-bold font-mono text-[#171A1F] mt-1">
              {status?.latest_block ? `#${status.latest_block.toLocaleString()}` : 'Live Syncing'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#737B86] mt-2 pt-2 border-t border-[#F5F4F0]">
              <span className="truncate max-w-[200px]" title={status?.rpc_url || ''}>RPC: {status?.rpc_url ? 'testnetrpc.mstblockchain.com' : 'Local Node'}</span>
              <a
                href={explorerBase}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#315C78] font-medium hover:underline flex items-center gap-0.5"
              >
                <span>MSTScan</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Transaction Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded bg-[#FFFFFF] border border-[#D9DDE2] shadow-sm">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-[#737B86] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by transaction hash, audit event ID, or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F4F0] border border-[#D9DDE2] rounded text-[#171A1F] placeholder-[#737B86] focus:outline-none focus:border-[#315C78] font-mono"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <a
              href="https://faucet.mstblockchain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#171A1F] bg-[#FFFFFF] border border-[#D9DDE2] hover:bg-[#F5F4F0] transition flex items-center gap-1.5"
            >
              <span>MST Faucet</span>
              <ExternalLink className="w-3 h-3 text-[#737B86]" />
            </a>
            <a
              href={explorerBase}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded text-xs font-semibold text-[#FFFFFF] bg-[#315C78] hover:bg-[#26495F] transition flex items-center gap-1.5"
            >
              <span>MST Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Transaction Records Table */}
        <div className="rounded bg-[#FFFFFF] border border-[#D9DDE2] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#D9DDE2] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#171A1F]">On-Chain Evidence Anchors</h3>
              <p className="text-xs text-[#737B86] mt-0.5">Real commitments recorded in the smart contract on MST Blockchain</p>
            </div>
            <span className="text-xs font-mono text-[#737B86]">{filteredTransactions.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F8] text-[#737B86] border-b border-[#D9DDE2]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Transaction Hash</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Canonical SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Block</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE2] font-mono">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#737B86] font-sans">
                      {transactions.length === 0 ? (
                        <div className="space-y-1">
                          <p className="font-medium text-[#171A1F]">No on-chain transactions anchored yet.</p>
                          <p className="text-xs text-[#737B86]">Evaluate an action in the Action Gateway, then anchor it in the Integrity Center.</p>
                        </div>
                      ) : (
                        <p>No transactions match your search filter.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.transaction_hash} className="hover:bg-[#F9FAFB] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#315C78]">
                            {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.transaction_hash)}
                            className="text-[#737B86] hover:text-[#171A1F] transition"
                            title="Copy Transaction Hash"
                          >
                            {copiedHash === tx.transaction_hash ? <Check className="w-3 h-3 text-[#287653]" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {tx.explorer_url && (
                            <a
                              href={tx.explorer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#315C78] hover:text-[#26495F]"
                              title="View on MSTScan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#171A1F]">{tx.event_id}</td>
                      <td className="py-3 px-4 text-[#737B86] text-[11px]">
                        {tx.canonical_hash ? `${tx.canonical_hash.slice(0, 16)}...` : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#171A1F]">
                        {tx.block_number ? `#${tx.block_number}` : 'Pending'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDF6F2] text-[#287653] border border-[#BCE2D1]">
                          <CheckCircle2 className="w-3 h-3" />
                          CONFIRMED
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 font-sans">
                        <button
                          onClick={() => openInspector(tx.event_id)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] border border-[#D9DDE2] rounded shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#171A1F]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#D9DDE2] flex items-center justify-between bg-[#F9F9F8]">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#315C78]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#171A1F]">Evidence Inspector</h3>
                  <p className="text-[11px] text-[#737B86] font-mono">ID: {selectedEventId}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="p-1 rounded text-[#737B86] hover:text-[#171A1F] hover:bg-[#E8EBEF] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {inspectLoading ? (
                <div className="py-12 text-center text-[#737B86]">Loading canonical evidence details...</div>
              ) : evidenceData ? (
                <>
                  {/* Action Summary */}
                  <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2]">
                    <span className="text-[10px] uppercase font-semibold text-[#737B86] tracking-wider block mb-1">Action Summary</span>
                    <p className="text-xs font-medium text-[#171A1F]">{evidenceData.action_summary}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#737B86] font-mono">
                      <span>Decision: <strong className="text-[#287653]">{evidenceData.policy_decision}</strong></span>
                      <span>Policy: <strong>{evidenceData.policy_id} (v{evidenceData.policy_version})</strong></span>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="p-3.5 rounded bg-[#EDF6F2] border border-[#BCE2D1] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#287653] uppercase tracking-wider block">Cryptographic Verification</span>
                      <p className="text-xs font-semibold text-[#287653] mt-0.5">
                        {evidenceData.independent_verification?.status || 'VERIFIED'}
                      </p>
                      <p className="text-[11px] text-[#737B86] mt-0.5">
                        Local SHA-256 digest exactly matches MST on-chain contract state.
                      </p>
                    </div>
                    <button
                      onClick={() => handleReverify(selectedEventId)}
                      disabled={reverifyLoading}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-[#287653] text-[#FFFFFF] hover:bg-[#205F43] transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${reverifyLoading ? 'animate-spin' : ''}`} />
                      <span>{reverifyLoading ? 'Reverifying...' : 'Re-verify On-Chain'}</span>
                    </button>
                  </div>

                  {/* Hashes Comparison */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#737B86] block mb-1">Local Recomputed Digest (RFC-8785)</span>
                      <div className="p-2 rounded bg-[#F5F4F0] border border-[#D9DDE2] font-mono text-[11px] text-[#171A1F] break-all select-all flex items-center justify-between">
                        <span>{evidenceData.recomputed_hash}</span>
                        <button onClick={() => handleCopy(evidenceData.recomputed_hash)} className="text-[#737B86] hover:text-[#171A1F]">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#737B86] block mb-1">Committed On-Chain Digest</span>
                      <div className="p-2 rounded bg-[#F5F4F0] border border-[#D9DDE2] font-mono text-[11px] text-[#171A1F] break-all select-all flex items-center justify-between">
                        <span>{evidenceData.stored_commitment || 'Pending'}</span>
                        {evidenceData.stored_commitment && (
                          <button onClick={() => handleCopy(evidenceData.stored_commitment || '')} className="text-[#737B86] hover:text-[#171A1F]">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Canonical JSON Payload Block */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-[#737B86] block mb-1">Canonical RFC-8785 Evidence Payload</span>
                    <pre className="p-3 rounded bg-[#242A32] text-[#F5F4F0] font-mono text-[11px] overflow-x-auto max-h-48 border border-[#3D4552]">
                      {JSON.stringify(evidenceData.canonical_payload, null, 2)}
                    </pre>
                  </div>

                  {/* Blockchain Receipt Details */}
                  {evidenceData.transaction_hash && (
                    <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#737B86]">Tx Hash:</span>
                        <a
                          href={evidenceData.explorer_url || `${explorerBase}/tx/${evidenceData.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#315C78] hover:underline flex items-center gap-1"
                        >
                          <span>{evidenceData.transaction_hash.slice(0, 16)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#737B86]">Block:</span>
                        <span className="font-semibold text-[#171A1F]">#{evidenceData.block_number}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-[#B53A3A]">Failed to load evidence details.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#D9DDE2] bg-[#F9F9F8] flex justify-end">
              <button
                onClick={() => { setSelectedEventId(null); setEvidenceData(null); }}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] hover:bg-[#F5F4F0] transition"
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
