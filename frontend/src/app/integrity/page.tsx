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
  RotateCcw
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';
import { api } from '@/lib/api';
import { 
  BlockchainStatus, 
  IntegrityRecord, 
  TamperAlert, 
  AuditEventDetail 
} from '@/lib/types';

export default function IntegrityCenterPage() {
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

  const handleAnchor = async (eventId: string) => {
    setActionLoading(`anchor-${eventId}`);
    try {
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
    <div className="flex flex-col min-h-full">
      <Header 
        title="Integrity Verification Center" 
        subtitle="Cryptographic SHA-256 verification, MST blockchain anchoring & real-time tamper detection"
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Hashes Calculated</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">{records.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Canonical RFC-8785 digests</p>
          </div>

          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Confirmed On-Chain Anchors</span>
              <Cpu className="w-4 h-4 text-[#82B5F8]" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">
              {bStatus?.total_anchors ?? records.filter(r => r.anchoring_status === 'ANCHORED').length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Anchored in MST EvidenceRegistry</p>
          </div>

          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Independently Verified</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">
              {records.filter(r => r.verification_status === 'ANCHORED_AND_VERIFIED' || r.verification_status === 'INTACT').length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zero divergence against evidence</p>
          </div>

          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Tamper Alerts Detected</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
              {alerts.filter(a => a.status === 'OPEN').length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active cryptographic mismatches</p>
          </div>
        </div>

        {/* Resilience Verification Action Banner */}
        <div className="p-5 rounded-xl bg-[#19222D] border border-graphite-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Wrench className="w-4 h-4 text-[#82B5F8]" />
              <span>Security Resilience Verification: Controlled Tampering Simulation</span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Test SentinelMesh&apos;s cryptographic security in real time. Mutate an audit event directly in the database without recalculating its canonical hash or smart contract anchor, and watch independent verification immediately catch the breach.
            </p>
            {simulationResult && (
              <p className="text-xs font-mono text-emerald-300 bg-emerald-950/60 p-2 rounded border border-emerald-800/80 mt-2">
                {simulationResult}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSimulateTamper}
              disabled={actionLoading === 'simulate-tamper'}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Tamper</span>
            </button>
            <button
              onClick={handleRestoreTamper}
              disabled={actionLoading === 'restore-tamper'}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-graphite-800 hover:bg-graphite-750 text-slate-200 border border-graphite-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restore Data</span>
            </button>
          </div>
        </div>

        {/* Active Tamper Alerts Table */}
        {alerts.length > 0 && (
          <div className="rounded-xl bg-graphite-900 border border-graphite-750 overflow-hidden">
            <div className="p-4 border-b border-graphite-750 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-100">Active Cryptographic Tamper Alerts</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                  {alerts.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-graphite-950/50 text-slate-400 border-b border-graphite-750">
                  <tr>
                    <th className="py-3 px-4 font-medium">Alert ID</th>
                    <th className="py-3 px-4 font-medium">Event ID</th>
                    <th className="py-3 px-4 font-medium">Detected</th>
                    <th className="py-3 px-4 font-medium">Trusted Source</th>
                    <th className="py-3 px-4 font-medium">Expected Hash</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-750/60">
                  {alerts.map((alt) => (
                    <tr key={alt.id} className="hover:bg-graphite-850/50 transition">
                      <td className="py-3 px-4 font-mono font-medium text-rose-300">{alt.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{alt.event_id}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(alt.detection_timestamp).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{alt.trusted_source}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{alt.expected_hash.slice(0, 18)}...</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          alt.status === 'OPEN' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {alt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleInspect(alt.event_id)}
                          className="px-2.5 py-1 rounded bg-graphite-800 border border-graphite-700 text-slate-300 hover:text-white transition"
                        >
                          Inspect
                        </button>
                        {alt.status === 'OPEN' && (
                          <button
                            onClick={() => handleResolveAlert(alt.id)}
                            className="px-2.5 py-1 rounded bg-purple-950 border border-purple-800 text-purple-300 hover:bg-purple-900 transition"
                          >
                            Resolve (Admin)
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

        {/* Integrity Records Ledger Table */}
        <div className="rounded-xl bg-graphite-900 border border-graphite-750 overflow-hidden">
          <div className="p-4 border-b border-graphite-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Cryptographic Integrity Records</h3>
              <p className="text-xs text-slate-400 mt-0.5">Immutable canonical hashes paired with on-chain EVM anchor evidence</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-graphite-850 border border-graphite-750 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="ALL">All Records</option>
                <option value="ANCHORED">Anchored On-Chain</option>
                <option value="INTACT">Intact Local</option>
                <option value="TAMPERED">Tampered Alert</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-graphite-950/50 text-slate-400 border-b border-graphite-750">
                <tr>
                  <th className="py-3 px-4 font-medium">Event ID</th>
                  <th className="py-3 px-4 font-medium">Canonical SHA-256 Hash</th>
                  <th className="py-3 px-4 font-medium">Anchoring Status</th>
                  <th className="py-3 px-4 font-medium">Verification Status</th>
                  <th className="py-3 px-4 font-medium">Block / Tx</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-750/60">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-graphite-850/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">{r.event_id}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {r.event_hash.slice(0, 16)}...{r.event_hash.slice(-8)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        r.anchoring_status === 'ANCHORED'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : 'bg-graphite-800 text-slate-400 border-graphite-700'
                      }`}>
                        {r.anchoring_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        r.verification_status === 'ANCHORED_AND_VERIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : r.verification_status === 'TAMPERED'
                          ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}>
                        {r.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {r.transaction_hash ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-medium">#{r.block_number || 'Tx'}</span>
                          <a
                            href={bStatus?.explorer_base_url ? `${bStatus.explorer_base_url}/tx/${r.transaction_hash}` : `https://testnet.mstscan.com/tx/${r.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#82B5F8] hover:text-blue-300"
                            title="View on MSTScan Explorer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : r.block_number ? (
                        <span className="text-slate-400">Block #{r.block_number}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleInspect(r.event_id)}
                        className="px-2.5 py-1 rounded bg-graphite-800 border border-graphite-700 text-slate-300 hover:text-white transition"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleVerify(r.event_id)}
                        disabled={actionLoading === `verify-${r.event_id}`}
                        className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition disabled:opacity-50"
                      >
                        {actionLoading === `verify-${r.event_id}` ? 'Verifying...' : 'Verify'}
                      </button>
                      {r.anchoring_status !== 'ANCHORED' && (
                        <button
                          onClick={() => handleAnchor(r.event_id)}
                          disabled={actionLoading === `anchor-${r.event_id}`}
                          className="px-2.5 py-1 rounded bg-blue-950/80 border border-blue-800 text-blue-300 hover:bg-blue-900 transition disabled:opacity-50"
                        >
                          {actionLoading === `anchor-${r.event_id}` ? 'Anchoring...' : 'Anchor (Admin)'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
