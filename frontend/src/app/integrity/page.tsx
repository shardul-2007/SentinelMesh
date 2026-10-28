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
    <div className="flex flex-col min-h-full bg-[#F5F4F0]">
      <Header 
        title="Integrity Center" 
        subtitle="Cryptographic SHA-256 verification, MST blockchain anchoring & real-time tamper detection"
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Total Evidence Records</span>
              <Lock className="w-4 h-4 text-[#737B86]" />
            </div>
            <div className="text-2xl font-bold text-[#171A1F] mt-2 font-mono">{records.length}</div>
            <p className="text-[11px] text-[#737B86] mt-1">RFC-8785 canonical digests</p>
          </div>

          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Confirmed On-Chain</span>
              <Boxes className="w-4 h-4 text-[#315C78]" />
            </div>
            <div className="text-2xl font-bold text-[#315C78] mt-2 font-mono">
              {bStatus?.total_anchors ?? records.filter(r => r.anchoring_status === 'ANCHORED').length}
            </div>
            <p className="text-[11px] text-[#737B86] mt-1">MST EvidenceRegistry commitments</p>
          </div>

          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Cryptographically Intact</span>
              <ShieldCheck className="w-4 h-4 text-[#287653]" />
            </div>
            <div className="text-2xl font-bold text-[#287653] mt-2 font-mono">
              {records.filter(r => r.verification_status === 'ANCHORED_AND_VERIFIED' || r.verification_status === 'INTACT').length}
            </div>
            <p className="text-[11px] text-[#737B86] mt-1">Zero divergence against audit state</p>
          </div>

          <div className="p-4 rounded bg-[#FFFFFF] border border-[#D9DDE2] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#737B86] text-xs font-medium">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Active Tamper Alerts</span>
              <AlertTriangle className="w-4 h-4 text-[#B53A3A]" />
            </div>
            <div className="text-2xl font-bold text-[#B53A3A] mt-2 font-mono">
              {alerts.filter(a => a.status === 'OPEN').length}
            </div>
            <p className="text-[11px] text-[#737B86] mt-1">Detected evidence modifications</p>
          </div>
        </div>

        {/* Security Resilience Simulation Panel */}
        <div className="p-5 rounded bg-[#FFFFFF] border border-[#D9DDE2] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#171A1F]">
              <Wrench className="w-4 h-4 text-[#315C78]" />
              <span>Cryptographic Resilience Verification: Controlled Tampering Test</span>
            </div>
            <p className="text-xs text-[#737B86] max-w-2xl leading-relaxed">
              Verify cryptographic tamper detection in real time. Mutate an audit event in local storage without recalculating its SHA-256 digest or contract commitment, and watch independent verification immediately catch the breach.
            </p>
            {simulationResult && (
              <p className="text-xs font-mono text-[#287653] bg-[#EDF6F2] p-2 rounded border border-[#BCE2D1] mt-2">
                {simulationResult}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSimulateTamper}
              disabled={actionLoading === 'simulate-tamper'}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-[#FDF2F2] hover:bg-[#FCE8E8] text-[#B53A3A] border border-[#F7C4C4] transition flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Tamper</span>
            </button>
            <button
              onClick={handleRestoreTamper}
              disabled={actionLoading === 'restore-tamper'}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#FFFFFF] hover:bg-[#F5F4F0] text-[#171A1F] border border-[#D9DDE2] transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#737B86]" />
              <span>Restore Baseline</span>
            </button>
          </div>
        </div>

        {/* Active Tamper Alerts Table */}
        {alerts.length > 0 && (
          <div className="rounded bg-[#FFFFFF] border border-[#D9DDE2] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#D9DDE2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B53A3A]" />
                <h3 className="text-sm font-semibold text-[#171A1F]">Active Cryptographic Tamper Alerts</h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-[#FDF2F2] text-[#B53A3A] border border-[#F7C4C4]">
                  {alerts.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F8] text-[#737B86] border-b border-[#D9DDE2]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Alert ID</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Event ID</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Detected</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Trusted Source</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Expected Hash</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Status</th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE2] font-mono">
                  {alerts.map((alt) => (
                    <tr key={alt.id} className="hover:bg-[#F9FAFB] transition">
                      <td className="py-3 px-4 font-medium text-[#B53A3A]">{alt.id}</td>
                      <td className="py-3 px-4 text-[#171A1F]">{alt.event_id}</td>
                      <td className="py-3 px-4 text-[#737B86] font-sans">{new Date(alt.detection_timestamp).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 text-[#171A1F] text-[11px]">{alt.trusted_source}</td>
                      <td className="py-3 px-4 text-[#737B86] text-[11px]">{alt.expected_hash.slice(0, 18)}...</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          alt.status === 'OPEN' ? 'bg-[#FDF2F2] text-[#B53A3A] border-[#F7C4C4]' : 'bg-[#EDF6F2] text-[#287653] border-[#BCE2D1]'
                        }`}>
                          {alt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 font-sans">
                        <button
                          onClick={() => handleInspect(alt.event_id)}
                          className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] hover:bg-[#F5F4F0] transition text-[11px]"
                        >
                          Inspect
                        </button>
                        {alt.status === 'OPEN' && (
                          <button
                            onClick={() => handleResolveAlert(alt.id)}
                            className="px-2 py-1 rounded bg-[#FDF7ED] border border-[#F5DEB3] text-[#98661C] hover:bg-[#F7E7CD] transition text-[11px]"
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

        {/* Integrity Records Ledger */}
        <div className="rounded bg-[#FFFFFF] border border-[#D9DDE2] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#D9DDE2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#171A1F]">Cryptographic Integrity Records</h3>
              <p className="text-xs text-[#737B86] mt-0.5">Deterministic canonical hashes paired with on-chain EVM anchor commitments</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737B86]">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#FFFFFF] border border-[#D9DDE2] rounded px-2.5 py-1 text-xs text-[#171A1F] focus:outline-none focus:border-[#315C78]"
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
              <thead className="bg-[#F9F9F8] text-[#737B86] border-b border-[#D9DDE2]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Event ID</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Canonical SHA-256 Digest</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Anchoring Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Verification Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px]">Block / Tx</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE2] font-mono">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#737B86] font-sans">
                      No integrity records found. Evaluate an action in the Action Gateway to create the first record.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F9FAFB] transition">
                      <td className="py-3 px-4 font-medium text-[#171A1F]">{r.event_id}</td>
                      <td className="py-3 px-4 text-[#737B86] text-[11px]">
                        {r.event_hash.slice(0, 16)}...{r.event_hash.slice(-8)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          r.anchoring_status === 'ANCHORED'
                            ? 'bg-[#EBF2F7] text-[#315C78] border-[#C5D7E3]'
                            : 'bg-[#F5F4F0] text-[#737B86] border-[#D9DDE2]'
                        }`}>
                          {r.anchoring_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          r.verification_status === 'ANCHORED_AND_VERIFIED'
                            ? 'bg-[#EDF6F2] text-[#287653] border-[#BCE2D1]'
                            : r.verification_status === 'TAMPERED'
                            ? 'bg-[#FDF2F2] text-[#B53A3A] border-[#F7C4C4]'
                            : 'bg-[#F5F4F0] text-[#737B86] border-[#D9DDE2]'
                        }`}>
                          {r.verification_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {r.transaction_hash ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#287653] font-semibold">#{r.block_number || 'Tx'}</span>
                            <a
                              href={bStatus?.explorer_base_url ? `${bStatus.explorer_base_url}/tx/${r.transaction_hash}` : `https://testnet.mstscan.com/tx/${r.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#315C78] hover:underline"
                              title="View on MSTScan Explorer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : r.block_number ? (
                          <span className="text-[#737B86]">Block #{r.block_number}</span>
                        ) : (
                          <span className="text-[#B0B7C1]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleInspect(r.event_id)}
                          className="px-2 py-1 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] hover:bg-[#F5F4F0] transition text-[11px]"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleVerify(r.event_id)}
                          disabled={actionLoading === `verify-${r.event_id}`}
                          className="px-2 py-1 rounded bg-[#EDF6F2] border border-[#BCE2D1] text-[#287653] hover:bg-[#D5EDDF] transition disabled:opacity-50 text-[11px]"
                        >
                          {actionLoading === `verify-${r.event_id}` ? 'Checking...' : 'Verify'}
                        </button>
                        {r.anchoring_status !== 'ANCHORED' && (
                          <button
                            onClick={() => handleAnchor(r.event_id)}
                            disabled={actionLoading === `anchor-${r.event_id}`}
                            className="px-2 py-1 rounded bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition disabled:opacity-50 text-[11px]"
                          >
                            {actionLoading === `anchor-${r.event_id}` ? 'Anchoring...' : 'Anchor (Admin)'}
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
