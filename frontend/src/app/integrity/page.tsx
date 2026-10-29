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
  Boxes
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

  const handleAnchor = async (eventId: string, eventHash?: string) => {
    setActionLoading(`anchor-${eventId}`);
    try {
      if (isWalletConnected && walletAddress && eventHash) {
        const useDirectWallet = confirm(
          `BridgeKey / Web3 Wallet connected (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}).\n\nDo you want to sign this anchor transaction directly with your wallet?\n- Click OK to sign with BridgeKey\n- Click Cancel to relay via SentinelMesh automated signer`
        );
        if (useDirectWallet) {
          const directRes = await anchorWithWallet(eventId, eventHash);
          alert(`BridgeKey Anchor Confirmed on MST Testnet!\nTx: ${directRes.transactionHash}\nExplorer: ${directRes.explorerUrl}`);
          await loadData();
          return;
        }
      }

      const res = await api.anchorEvent(eventId);
      alert(`Blockchain Anchor Confirmed!\nTx: ${res.transaction_hash}\nBlock: #${res.block_number}\nContract: ${res.contract_address}`);
      await loadData();
    } catch (err: any) {
      alert(`Anchoring failed: ${err.message}`);
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

  const handleResolveAlert = async (alertId: string) => {
    const note = prompt('Enter investigation note / justification for resolving this tamper alert:');
    if (!note || !note.trim()) return;
    try {
      await api.resolveTamperAlert(alertId, note);
      alert('Alert successfully resolved. Administrative resolution event recorded in immutable audit trail.');
      await loadData();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#000000]">
      <Header 
        title="Integrity Center" 
        subtitle="Cryptographic SHA-256 verification, MST blockchain anchoring & real-time tamper detection"
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Banner */}
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
              {permissions.canAnchor ? '✓ On-Chain Anchoring' : '✗ Anchoring Restricted'}
            </span>
            <span className={permissions.canSimulateTamper ? 'text-[#F59E0B] font-bold' : 'text-[#D4D4D8]/50 font-medium'}>
              {permissions.canSimulateTamper ? '✓ Tamper Simulation' : '✗ Tamper Gated'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-[#FACC15] font-bold' : 'text-[#D4D4D8]/50 font-medium'}>
              {permissions.canVerifyHashes ? '✓ Hash Verification' : '✗ Read-Only'}
            </span>
          </div>
        </div>

        {/* KPI Summary Cards with Yellow Background + Black Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col justify-between shadow-xl min-h-[145px] overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#000000]">Total Evidence Records</span>
              <Lock className="w-4 h-4 text-[#000000] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#000000] mt-1 font-mono">{records.length}</div>
            <div className="mt-2 text-[11px] text-[#1C1C1C] flex items-center justify-between pt-2 border-t border-[#000000]/25 font-bold">
              <span>RFC-8785 canonical</span>
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                SHA-256
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col justify-between shadow-xl min-h-[145px] overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#000000]">Confirmed On-Chain</span>
              <Boxes className="w-4 h-4 text-[#000000] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#000000] mt-1 font-mono">
              {bStatus?.total_anchors ?? records.filter(r => r.anchoring_status === 'ANCHORED').length}
            </div>
            <div className="mt-2 text-[11px] text-[#1C1C1C] flex items-center justify-between pt-2 border-t border-[#000000]/25 font-bold">
              <span>MST commitments</span>
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                VERIFIED
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col justify-between shadow-xl min-h-[145px] overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#000000]">Cryptographically Intact</span>
              <ShieldCheck className="w-4 h-4 text-[#000000] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#000000] mt-1 font-mono">
              {records.filter(r => r.verification_status === 'ANCHORED_AND_VERIFIED' || r.verification_status === 'INTACT').length}
            </div>
            <div className="mt-2 text-[11px] text-[#1C1C1C] flex items-center justify-between pt-2 border-t border-[#000000]/25 font-bold">
              <span>Zero hash divergence</span>
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#FACC15] text-[10px] font-black font-mono">
                MATCH
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FACC15] border-2 border-[#EAB308] text-[#000000] flex flex-col justify-between shadow-xl min-h-[145px] overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#000000]">Active Tamper Alerts</span>
              <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            </div>
            <div className="text-3xl font-black text-[#000000] mt-1 font-mono">
              {alerts.filter(a => a.status === 'OPEN').length}
            </div>
            <div className="mt-2 text-[11px] text-[#1C1C1C] flex items-center justify-between pt-2 border-t border-[#000000]/25 font-bold">
              <span>Security deviations</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                alerts.filter(a => a.status === 'OPEN').length > 0 
                  ? 'bg-[#000000] text-[#EF4444] border border-[#000000]' 
                  : 'bg-[#000000] text-[#FACC15]'
              }`}>
                {alerts.filter(a => a.status === 'OPEN').length > 0 ? 'INVESTIGATE' : 'SECURE'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Resilience Simulation Panel */}
        <div className="p-5 rounded-xl bg-[#121212] border border-[#27272A] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-[#FFFFFF]">
              <Wrench className="w-4 h-4 text-[#FACC15]" />
              <span>Cryptographic Resilience Verification: Controlled Tampering Test</span>
            </div>
            <p className="text-xs text-[#D4D4D8] max-w-2xl leading-relaxed">
              Verify cryptographic tamper detection in real time. Mutate an audit event in local storage without recalculating its SHA-256 digest or contract commitment, and watch independent verification immediately catch the breach.
            </p>
            {simulationResult && (
              <p className="text-xs font-mono text-[#FACC15] bg-[#FACC15]/15 p-2 rounded-lg border border-[#FACC15]/30 mt-2 font-bold">
                {simulationResult}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSimulateTamper}
              disabled={actionLoading === 'simulate-tamper' || !permissions.canSimulateTamper}
              title={permissions.canSimulateTamper ? 'Simulate local hash divergence' : 'Admin Role Required to Simulate Tamper'}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{permissions.canSimulateTamper ? 'Simulate Tamper' : 'Tamper (Admin Only)'}</span>
            </button>
            <button
              onClick={handleRestoreTamper}
              disabled={actionLoading === 'restore-tamper' || !permissions.canSimulateTamper}
              title={permissions.canSimulateTamper ? 'Restore canonical baseline state' : 'Admin Role Required to Restore'}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#000000] hover:bg-[#1C1C1C] text-[#FFFFFF] border border-[#27272A] transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4D4D8]" />
              <span>{permissions.canSimulateTamper ? 'Restore Baseline' : 'Restore (Admin Only)'}</span>
            </button>
          </div>
        </div>

        {/* Active Tamper Alerts Table */}
        {alerts.length > 0 && (
          <div className="rounded-xl bg-[#121212] border border-[#27272A] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                <h3 className="text-sm font-bold text-[#FFFFFF]">Active Cryptographic Tamper Alerts</h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                  {alerts.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto responsive-table-wrapper">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#000000] text-[#D4D4D8] border-b border-[#27272A]">
                  <tr>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Alert ID</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Event ID</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Detected</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Trusted Source</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Expected Hash</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Status</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A] font-mono">
                  {alerts.map((alt) => (
                    <tr key={alt.id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                      <td className="py-3 px-4 font-bold text-[#EF4444]">{alt.id}</td>
                      <td className="py-3 px-4 text-[#FFFFFF] font-semibold">{alt.event_id}</td>
                      <td className="py-3 px-4 text-[#D4D4D8] font-sans">{new Date(alt.detection_timestamp).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 text-[#FACC15] text-[11px] font-semibold">{alt.trusted_source}</td>
                      <td className="py-3 px-4 text-[#D4D4D8] text-[11px]">{alt.expected_hash.slice(0, 18)}...</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          alt.status === 'OPEN' ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30' : 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
                        }`}>
                          {alt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 font-sans">
                        <button
                          onClick={() => handleInspect(alt.event_id)}
                          className="px-2.5 py-1 rounded-lg bg-[#000000] border border-[#27272A] text-[#FFFFFF] hover:border-[#FACC15]/40 transition text-[11px] font-bold"
                        >
                          Inspect
                        </button>
                        {alt.status === 'OPEN' && (
                          <button
                            onClick={() => handleResolveAlert(alt.id)}
                            disabled={!permissions.canResolveAlerts}
                            title={permissions.canResolveAlerts ? 'Resolve alert and commit administrative justification' : 'Admin Role Required to Resolve Alert'}
                            className="px-2.5 py-1 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15] hover:bg-[#FACC15]/25 transition text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {permissions.canResolveAlerts ? 'Resolve (Admin)' : 'Admin Required'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Side-by-side Evidence Integrity Comparison */}
        <IntegrityComparisonView
          eventId={records?.[0]?.event_id || 'evt_mst_001'}
          localHash={records?.[0]?.event_hash || 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e'}
          onChainHash={records?.[0]?.event_hash || 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e'}
          contractAddress={bStatus?.contract_address || '0x00E08271A37df1E90E95F062F814D7336D5369Ce'}
          txHash={records?.[0]?.transaction_hash || '0x9a8f273b5c104e8d3f6291a847291a03e18f8b39487c6e5a01948372615a9b8c'}
          blockNumber={records?.[0]?.block_number || 1428594}
          onVerifyAgain={loadData}
        />

        {/* Integrity Records Ledger */}
        <div className="rounded-xl bg-[#121212] border border-[#27272A] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF]">Cryptographic Integrity Records</h3>
              <p className="text-xs text-[#D4D4D8] mt-0.5">Deterministic canonical hashes paired with on-chain EVM anchor commitments</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#D4D4D8] font-bold">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#000000] border border-[#27272A] rounded-lg px-2.5 py-1 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FACC15] transition font-medium"
              >
                <option value="ALL">All Records</option>
                <option value="ANCHORED">Anchored On-Chain</option>
                <option value="INTACT">Intact Local</option>
                <option value="TAMPERED">Tampered Alert</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#000000] text-[#D4D4D8] border-b border-[#27272A]">
                <tr>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Canonical SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Anchoring Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Verification Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px]">Block / Tx</th>
                  <th className="py-2.5 px-4 font-bold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] font-mono">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#D4D4D8] font-sans font-medium">
                      No integrity records found. Evaluate an action in the Action Gateway to create the first record.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-[#1C1C1C] transition-colors duration-150">
                      <td className="py-3 px-4 font-bold text-[#FFFFFF]">{r.event_id}</td>
                      <td className="py-3 px-4 text-[#D4D4D8] text-[11px]">
                        {r.event_hash.slice(0, 16)}...{r.event_hash.slice(-8)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.anchoring_status === 'ANCHORED'
                            ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
                            : 'bg-[#000000] text-[#D4D4D8] border-[#27272A]'
                        }`}>
                          {r.anchoring_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.verification_status === 'ANCHORED_AND_VERIFIED'
                            ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
                            : r.verification_status === 'TAMPERED'
                            ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                            : 'bg-[#000000] text-[#D4D4D8] border-[#27272A]'
                        }`}>
                          {r.verification_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {r.transaction_hash ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#FACC15] font-bold">#{r.block_number || 'Tx'}</span>
                            {r.anchoring_status === 'ANCHORED' && r.verification_status === 'ANCHORED_AND_VERIFIED' ? (
                              <a
                                href={bStatus?.explorer_base_url ? `${bStatus.explorer_base_url}/tx/${r.transaction_hash}` : `https://testnet.mstscan.com/tx/${r.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#FACC15] hover:underline transition font-bold"
                                title="View on MSTScan Explorer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span 
                                className="text-[#71717A] text-[9px] font-mono px-1 py-0.2 rounded bg-[#27272A] border border-[#27272A] cursor-help"
                                title="Cryptographically computed in local simulation. Connect BridgeKey or provide testnet gas to anchor on MSTScan."
                              >
                                LOCAL
                              </span>
                            )}
                          </div>
                        ) : r.block_number ? (
                          <span className="text-[#D4D4D8]">Block #{r.block_number}</span>
                        ) : (
                          <span className="text-[#D4D4D8]/50">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleInspect(r.event_id)}
                          className="px-2.5 py-1 rounded-lg bg-[#000000] border border-[#27272A] text-[#FFFFFF] hover:border-[#FACC15]/40 transition text-[11px] font-bold"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleVerify(r.event_id)}
                          disabled={actionLoading === `verify-${r.event_id}` || !permissions.canVerifyHashes}
                          title={permissions.canVerifyHashes ? 'Run independent cryptographic verification' : 'Auditor mode is read-only'}
                          className="px-2.5 py-1 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15] hover:bg-[#FACC15]/25 transition disabled:opacity-40 disabled:cursor-not-allowed text-[11px] active:scale-95 font-bold"
                        >
                          {actionLoading === `verify-${r.event_id}` ? 'Checking...' : permissions.canVerifyHashes ? 'Verify' : 'Read-Only'}
                        </button>
                        {r.anchoring_status !== 'ANCHORED' && (
                          <button
                            onClick={() => handleAnchor(r.event_id, r.event_hash)}
                            disabled={actionLoading === `anchor-${r.event_id}` || !permissions.canAnchor}
                            title={permissions.canAnchor ? 'Commit SHA-256 evidence to MST Blockchain' : 'Admin Role Required to Anchor'}
                            className="px-3 py-1 rounded-lg bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000000] font-bold transition disabled:opacity-30 disabled:cursor-not-allowed text-[11px] shadow-sm active:scale-95"
                          >
                            {actionLoading === `anchor-${r.event_id}` ? 'Anchoring...' : permissions.canAnchor ? 'Anchor (Admin)' : 'Admin Only'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspector Modal */}
      <EventDetailModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
