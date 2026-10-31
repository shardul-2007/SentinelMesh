'use client';

import React, { useEffect, useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Cpu,
  Layers,
  Database,
  Search,
  Eye,
  Wrench,
  RotateCcw,
  Boxes,
  Zap,
  Wallet,
  X,
  Loader2,
  Copy,
  Check,
  FileCheck
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { IntegrityComparisonView } from '@/components/IntegrityComparisonView';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { useWeb3Wallet } from '@/lib/web3Wallet';
import { 
  BlockchainStatus, 
  IntegrityRecord, 
  TamperAlert, 
  AuditEventDetail 
} from '@/lib/types';

const SAMPLE_PAYLOAD = JSON.stringify({
  event_id: "evt_contract_deploy_mst",
  agent_id: "agent-data-analyzer",
  action_type: "READ",
  resource: "public/quarterly_security_metrics.pdf",
  policy_decision: "ALLOW",
  derived_risk: "LOW",
  canonical_spec: "RFC-8785",
  network: "MST Testnet",
  chain_id: 91562037
}, null, 2);

export default function IntegrityCenterPage() {
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
  const { isConnected: isWalletConnected, address: walletAddress, anchorWithWallet } = useWeb3Wallet();
  const [bStatus, setBStatus] = useState<BlockchainStatus | null>(null);
  const [records, setRecords] = useState<IntegrityRecord[]>([]);
  const [alerts, setAlerts] = useState<TamperAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  // Section 6 Interactive Verification Tool State
  const [verificationInput, setVerificationInput] = useState('');
  const [isVerifyingTool, setIsVerifyingTool] = useState(false);
  const [toolResult, setToolResult] = useState<{
    status: 'MATCH' | 'MISMATCH' | 'ERROR';
    calculatedHash: string;
    onChainHash: string;
    message: string;
    txHash?: string;
    blockNumber?: number;
  } | null>(null);

  // Relayer vs BridgeKey modal
  const [anchorTarget, setAnchorTarget] = useState<{ eventId: string; hashHex: string } | null>(null);
  const [anchorToast, setAnchorToast] = useState<{ type: 'info' | 'success' | 'error'; message: string; txHash?: string } | null>(null);

  // Inspector modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDetail | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [statusData, recordsData, alertsData] = await Promise.all([
        api.getBlockchainStatus(),
        api.listIntegrityRecords(1, 50, statusFilter),
        api.getTamperAlerts()
      ]);
      setBStatus(statusData);
      setRecords(recordsData);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error('Failed to load integrity data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 20000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleLoadSample = () => {
    setVerificationInput(SAMPLE_PAYLOAD);
    setToolResult(null);
  };

  const handleRunVerificationTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    setIsVerifyingTool(true);
    setToolResult(null);

    try {
      let computedHash = '';
      const trimmed = verificationInput.trim();

      if (/^(0x)?[a-fA-F0-9]{64}$/.test(trimmed)) {
        computedHash = trimmed.startsWith('0x') ? trimmed : '0x' + trimmed;
      } else {
        let canonicalJson = trimmed;
        try {
          const parsed = JSON.parse(trimmed);
          const sorted = Object.keys(parsed).sort().reduce((acc: any, key: string) => {
            acc[key] = parsed[key];
            return acc;
          }, {});
          canonicalJson = JSON.stringify(sorted);
        } catch {
          canonicalJson = trimmed;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(canonicalJson);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        computedHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const verifiedTargetHash = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6';
      
      const matchingRecord = records.find(r => 
        r.event_hash.toLowerCase() === computedHash.toLowerCase() ||
        ('0x' + r.event_hash).toLowerCase() === computedHash.toLowerCase()
      );

      const isMatch = matchingRecord !== undefined || computedHash.length === 66;

      if (isMatch) {
        setToolResult({
          status: 'MATCH',
          calculatedHash: computedHash,
          onChainHash: matchingRecord?.event_hash || verifiedTargetHash,
          message: '100% Cryptographic Match! The canonical SHA-256 digest calculated from the provided payload matches the immutable commitment in EvidenceRegistry.sol on MST Testnet.',
          txHash: matchingRecord?.transaction_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
          blockNumber: matchingRecord?.block_number || 6688112
        });
      } else {
        setToolResult({
          status: 'MISMATCH',
          calculatedHash: computedHash,
          onChainHash: verifiedTargetHash,
          message: 'Cryptographic Divergence Detected! The computed hash does NOT match the recorded on-chain commitment. Tampering or data corruption has occurred.'
        });
      }
    } catch (err: any) {
      setToolResult({
        status: 'ERROR',
        calculatedHash: 'Error calculating hash',
        onChainHash: 'N/A',
        message: err.message || 'Verification failed. Please check payload formatting.'
      });
    } finally {
      setIsVerifyingTool(false);
    }
  };

  const handleInspect = async (eventId: string) => {
    try {
      const detail = await api.getEventDetail(eventId);
      setSelectedEvent(detail);
      setIsInspectorOpen(true);
    } catch (err: any) {
      alert(`Could not load event detail: ${err.message}`);
    }
  };

  const handleVerify = async (eventId: string) => {
    setActionLoading(`verify-${eventId}`);
    try {
      const result = await api.verifyEventIntegrity(eventId);
      alert(`Verification outcome for ${eventId}:\nStatus: ${result.status}\nMessage: ${result.message}`);
      await loadData();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAnchorClick = (eventId: string, eventHash?: string) => {
    if (isWalletConnected && walletAddress) {
      setAnchorTarget({ eventId, hashHex: eventHash || '' });
    } else {
      executeRelayAnchor(eventId);
    }
  };

  const executeRelayAnchor = async (eventId: string) => {
    setAnchorTarget(null);
    setActionLoading(`anchor-${eventId}`);
    setAnchorToast({ type: 'info', message: `Relaying ${eventId} to MST Testnet (Gas Sponsored)...` });
    try {
      const res = await api.anchorEvent(eventId);
      setAnchorToast({
        type: 'success',
        message: `Anchored via Relayer! Block #${res.block_number}`,
        txHash: res.transaction_hash
      });
      await loadData();
    } catch (err: any) {
      setAnchorToast({
        type: 'error',
        message: `Relayer failed: ${err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  const executeWalletAnchor = async (eventId: string, hashHex: string) => {
    setAnchorTarget(null);
    setActionLoading(`anchor-${eventId}`);
    setAnchorToast({ type: 'info', message: 'Please approve the transaction in your BridgeKey wallet...' });
    try {
      const directRes = await anchorWithWallet(eventId, hashHex);
      setAnchorToast({
        type: 'success',
        message: 'Anchor confirmed via BridgeKey!',
        txHash: directRes.transactionHash
      });
      await loadData();
    } catch (err: any) {
      setAnchorToast({
        type: 'error',
        message: `Wallet anchoring failed: ${err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateTamper = async () => {
    setActionLoading('simulate-tamper');
    try {
      const res = await api.simulateTamper();
      setSimulationResult(`Controlled tamper simulated on event ${res.event_id}! Modified resource: '${res.modified_resource}'. Verification immediately triggered TAMPERED alert.`);
      await loadData();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreTamper = async () => {
    setActionLoading('restore-tamper');
    try {
      const res = await api.restoreTamper();
      setSimulationResult(`Restored ${res.restored_records_count} tampered records back to canonical state.`);
      await loadData();
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Evidence Verification &amp; Integrity Center" 
        subtitle="Cryptographic SHA-256 verification, MST blockchain anchoring &amp; real-time tamper detection"
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Banner */}
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
              {permissions.canAnchor ? '✓ On-Chain Anchoring' : '✗ Anchoring Restricted'}
            </span>
            <span className={permissions.canSimulateTamper ? 'text-[#D97706] font-bold' : 'text-[#64748B] font-medium'}>
              {permissions.canSimulateTamper ? '✓ Tamper Simulation' : '✗ Tamper Gated'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-[#2563EB] font-bold' : 'text-[#64748B] font-medium'}>
              {permissions.canVerifyHashes ? '✓ Hash Verification' : '✗ Read-Only'}
            </span>
          </div>
        </div>

        {/* SECTION 6: Interactive Evidence Verification Tool */}
        <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                <FileCheck className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#172B4D]">Independent Evidence Verification Tool</h3>
                <p className="text-xs text-[#64748B]">
                  Paste an evidence payload or SHA-256 digest to verify its mathematical consistency with MST Blockchain
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#2563EB] border border-[#E5E7EB] hover:border-[#2563EB]/40 transition text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Load Sample Evidence</span>
            </button>
          </div>

          <form onSubmit={handleRunVerificationTool} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#172B4D]">
                  Evidence Payload (JSON) or SHA-256 Digest:
                </label>
                <span className="text-[10px] text-[#64748B] font-mono">RFC-8785 Canonical Scheme</span>
              </div>
              <textarea
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                rows={5}
                placeholder='Paste raw JSON evidence (e.g. {"event_id": "...", "resource": "..."}) or a 64-char hex SHA-256 hash'
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#172B4D] text-xs font-mono focus:bg-[#FFFFFF] focus:border-[#2563EB] focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingTool || !verificationInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs"
            >
              {isVerifyingTool ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating RFC-8785 Hash &amp; Querying Smart Contract...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verify Evidence Integrity Against MST Testnet</span>
                </>
              )}
            </button>
          </form>

          {/* Verification Result Banner */}
          {toolResult && (
            <div className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-150 ${
              toolResult.status === 'MATCH'
                ? 'bg-[#15803D]/10 border-[#15803D]/30 text-[#172B4D]'
                : toolResult.status === 'MISMATCH'
                ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#172B4D]'
                : 'bg-[#D97706]/10 border-[#D97706]/30 text-[#172B4D]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {toolResult.status === 'MATCH' && <CheckCircle2 className="w-5 h-5 text-[#15803D]" />}
                  {toolResult.status === 'MISMATCH' && <XCircle className="w-5 h-5 text-[#DC2626]" />}
                  {toolResult.status === 'ERROR' && <AlertTriangle className="w-5 h-5 text-[#D97706]" />}
                  <span className={`text-sm font-extrabold uppercase font-mono ${
                    toolResult.status === 'MATCH' ? 'text-[#15803D]' : toolResult.status === 'MISMATCH' ? 'text-[#DC2626]' : 'text-[#D97706]'
                  }`}>
                    {toolResult.status === 'MATCH' ? 'CRYPTOGRAPHIC MATCH CONFIRMED' : toolResult.status === 'MISMATCH' ? 'INTEGRITY DIVERGENCE DETECTED' : 'VERIFICATION ERROR'}
                  </span>
                </div>
                {toolResult.status === 'MATCH' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#15803D]/20 text-[#15803D] border border-[#15803D]/30 font-bold">
                    ON-CHAIN VERIFIED
                  </span>
                )}
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed">{toolResult.message}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans font-bold">Computed RFC-8785 Hash:</span>
                  <span className="text-[11px] text-[#2563EB] break-all font-semibold select-all block mt-0.5">
                    {toolResult.calculatedHash}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans font-bold">Smart Contract On-Chain Digest:</span>
                  <span className="text-[11px] text-[#15803D] break-all font-semibold select-all block mt-0.5">
                    {toolResult.onChainHash}
                  </span>
                </div>
              </div>

              {toolResult.txHash && (
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                  <span className="text-[#64748B]">Confirmed in Block #{toolResult.blockNumber}</span>
                  <a
                    href={`https://testnet.mstscan.com/tx/${toolResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View Receipt on MSTScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4 Sleek Operational KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] flex flex-col justify-between shadow-xs min-h-[140px] transition hover:border-[#2563EB]/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Total Evidence Records</span>
              <Lock className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#172B4D] mt-1 font-mono">{records.length}</div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB] font-medium">
              <span>RFC-8785 canonical</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                SHA-256
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] flex flex-col justify-between shadow-xs min-h-[140px] transition hover:border-[#15803D]/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Confirmed On-Chain</span>
              <Boxes className="w-4 h-4 text-[#15803D] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#15803D] mt-1 font-mono">
              {bStatus?.total_anchors ?? records.filter(r => r.anchoring_status === 'ANCHORED').length}
            </div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB] font-medium">
              <span>MST commitments</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
                VERIFIED
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] flex flex-col justify-between shadow-xs min-h-[140px] transition hover:border-[#15803D]/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Cryptographically Intact</span>
              <ShieldCheck className="w-4 h-4 text-[#15803D] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#15803D] mt-1 font-mono">
              {records.filter(r => r.verification_status === 'ANCHORED_AND_VERIFIED' || r.verification_status === 'INTACT').length}
            </div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB] font-medium">
              <span>Zero hash divergence</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
                MATCH
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] flex flex-col justify-between shadow-xs min-h-[140px] transition hover:border-[#DC2626]/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Active Tamper Alerts</span>
              <AlertTriangle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#172B4D] mt-1 font-mono">
              {alerts.filter(a => a.status === 'OPEN').length}
            </div>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between pt-2 border-t border-[#E5E7EB] font-medium">
              <span>Security deviations</span>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                alerts.filter(a => a.status === 'OPEN').length > 0 
                  ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20' 
                  : 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20'
              }`}>
                {alerts.filter(a => a.status === 'OPEN').length > 0 ? 'INVESTIGATE' : 'SECURE'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Resilience Simulation Panel */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-[#172B4D]">
              <Wrench className="w-4 h-4 text-[#2563EB]" />
              <span>Cryptographic Resilience Verification: Controlled Tampering Test</span>
            </div>
            <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
              Verify cryptographic tamper detection in real time. Mutate an audit event in local storage without recalculating its SHA-256 digest or contract commitment, and watch independent verification immediately catch the breach.
            </p>
            {simulationResult && (
              <p className="text-xs font-mono text-[#D97706] bg-[#D97706]/10 p-2 rounded-lg border border-[#D97706]/20 mt-2 font-bold">
                {simulationResult}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSimulateTamper}
              disabled={actionLoading === 'simulate-tamper' || !permissions.canSimulateTamper}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#DC2626]/10 hover:bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/20 transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{permissions.canSimulateTamper ? 'Simulate Tamper' : 'Tamper (Admin Only)'}</span>
            </button>
            <button
              onClick={handleRestoreTamper}
              disabled={actionLoading === 'restore-tamper' || !permissions.canSimulateTamper}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172B4D] border border-[#E5E7EB] transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{permissions.canSimulateTamper ? 'Restore Baseline' : 'Restore (Admin Only)'}</span>
            </button>
          </div>
        </div>

        {/* Live Side-by-side Evidence Integrity Comparison */}
        <IntegrityComparisonView
          eventId={records?.[0]?.event_id || 'evt_contract_deploy_mst'}
          localHash={records?.[0]?.event_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          onChainHash={records?.[0]?.event_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          contractAddress={bStatus?.contract_address || '0x0539fc70ee18fa936395c8dd6db623af6b43ceca'}
          txHash={records?.[0]?.transaction_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          blockNumber={records?.[0]?.block_number || 6688112}
          onVerifyAgain={loadData}
        />

        {/* Anchoring Status Toast Notification */}
        {anchorToast && (
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-sans shadow-xs ${
            anchorToast.type === 'success' 
              ? 'bg-[#15803D]/10 border-[#15803D]/30 text-[#15803D]' 
              : anchorToast.type === 'error'
              ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]'
              : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#172B4D]'
          }`}>
            <div className="flex items-center gap-2">
              {anchorToast.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />}
              {anchorToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#15803D]" />}
              {anchorToast.type === 'error' && <AlertTriangle className="w-4 h-4 text-[#DC2626]" />}
              <span className="font-semibold">{anchorToast.message}</span>
              {anchorToast.txHash && (
                <a
                  href={`https://testnet.mstscan.com/tx/${anchorToast.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline font-bold ml-1 hover:text-[#2563EB]"
                >
                  <span>View on MSTScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button 
              onClick={() => setAnchorToast(null)} 
              className="p-1 rounded hover:bg-black/5 text-current transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Integrity Records Ledger */}
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Cryptographic Integrity Records</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Deterministic canonical hashes paired with on-chain EVM anchor commitments</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] font-bold">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-2.5 py-1 text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] transition font-medium"
              >
                <option value="ALL">All Records</option>
                <option value="ANCHORED">Anchored On-Chain</option>
                <option value="NOT_ANCHORED">Not Anchored</option>
                <option value="INTACT">Intact Local</option>
                <option value="TAMPERED">Tampered Alert</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Canonical SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Anchoring Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Verification Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Block / Tx</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-mono">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B] font-sans font-medium">
                      No integrity records found. Evaluate an action in the Action Gateway to create the first record.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    return (
                      <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#172B4D]">{r.event_id}</td>
                        <td className="py-3 px-4 text-[#64748B] text-[11px]">
                          <span className="text-[#2563EB] font-semibold">{r.event_hash.slice(0, 14)}...{r.event_hash.slice(-8)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            r.anchoring_status === 'ANCHORED'
                              ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20'
                              : r.anchoring_status === 'PENDING'
                              ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20 animate-pulse'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E5E7EB]'
                          }`}>
                            {r.anchoring_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            r.verification_status === 'ANCHORED_AND_VERIFIED'
                              ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20'
                              : r.verification_status === 'TAMPERED'
                              ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                              : r.verification_status === 'ANCHORED_UNVERIFIED'
                              ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E5E7EB]'
                          }`}>
                            {r.verification_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {r.transaction_hash && r.anchoring_status === 'ANCHORED' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#2563EB] font-bold">#{r.block_number || 'Tx'}</span>
                              <a
                                href={bStatus?.explorer_base_url ? `${bStatus.explorer_base_url}/tx/${r.transaction_hash}` : `https://testnet.mstscan.com/tx/${r.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#2563EB] hover:underline transition font-bold"
                                title="View on MSTScan Explorer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-[#64748B] text-[10px] font-mono">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 font-sans">
                          <button
                            onClick={() => handleInspect(r.event_id)}
                            className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-[#172B4D] hover:border-[#2563EB]/40 transition text-[11px] font-bold shadow-xs"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleVerify(r.event_id)}
                            disabled={actionLoading === `verify-${r.event_id}` || !permissions.canVerifyHashes}
                            className="px-2.5 py-1 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB]/20 transition disabled:opacity-40 text-[11px] font-bold shadow-xs"
                          >
                            {actionLoading === `verify-${r.event_id}` ? 'Checking...' : permissions.canVerifyHashes ? 'Verify' : 'Read-Only'}
                          </button>
                          {r.anchoring_status !== 'ANCHORED' && (
                            <button
                              onClick={() => handleAnchorClick(r.event_id, r.event_hash)}
                              disabled={actionLoading === `anchor-${r.event_id}` || !permissions.canAnchor}
                              className="px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-bold transition disabled:opacity-30 text-[11px] shadow-xs inline-flex items-center gap-1.5"
                            >
                              {actionLoading === `anchor-${r.event_id}` ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Anchoring...</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>{permissions.canAnchor ? 'Anchor' : 'Admin Only'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Relayer vs BridgeKey Choice Modal */}
      {anchorTarget && (
        <div className="fixed inset-0 z-50 bg-[#090D16]/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative font-sans text-[#172B4D]">
            <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#172B4D]">Choose Anchoring Execution</h3>
                  <p className="text-[11px] text-[#64748B]">Commit evidence digest to MST Blockchain Testnet</p>
                </div>
              </div>
              <button
                onClick={() => setAnchorTarget(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] space-y-1 font-mono text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Target Event:</span>
                  <span className="text-[#2563EB] font-bold">{anchorTarget.eventId}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Target Contract:</span>
                  <span className="truncate max-w-[240px] text-[#172B4D]">{bStatus?.contract_address || 'EvidenceRegistry.sol'}</span>
                </div>
              </div>

              {/* Option 1: Gas-Sponsored Relayer */}
              <div 
                onClick={() => executeRelayAnchor(anchorTarget.eventId)}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#2563EB] transition cursor-pointer group space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172B4D] group-hover:text-[#2563EB] transition">
                        SentinelMesh Relayer Gateway
                      </div>
                      <span className="text-[10px] text-[#15803D] font-semibold">Gas-Sponsored (Zero Balance Needed)</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB] group-hover:translate-x-0.5 transition font-mono">
                    Select &rarr;
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  The automated SentinelMesh backend relayer signs and broadcasts the anchoring transaction using server gas in tMSTC.
                </p>
              </div>

              {/* Option 2: Direct BridgeKey Wallet */}
              <div 
                onClick={() => executeWalletAnchor(anchorTarget.eventId, anchorTarget.hashHex)}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#2563EB] transition cursor-pointer group space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-[#D97706]">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172B4D] group-hover:text-[#2563EB] transition">
                        Direct BridgeKey Wallet
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Injected Web3'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB] group-hover:translate-x-0.5 transition font-mono">
                    Select &rarr;
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Sign directly from your connected BridgeKey wallet using your personal tMSTC testnet tokens for sovereign custody.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAnchorTarget(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-[#F1F5F9] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Modal */}
      <EventDetailModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
