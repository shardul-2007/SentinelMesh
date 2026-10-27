'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  ShieldCheck, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Terminal, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { ActionEvaluateResponse } from '@/lib/types';

const PRESETS = [
  {
    title: '1. Read Public Report',
    desc: 'Permitted public documentation read',
    agent: 'agent-data-analyzer',
    action: 'READ',
    resource: 'public/quarterly_security_metrics.pdf',
    reason: 'Monthly compliance summary aggregation',
    clientRisk: 'LOW',
    expectedDecision: 'ALLOW',
    policy: 'POL-A'
  },
  {
    title: '2. Read Restricted Secrets',
    desc: 'Unauthorized access to credentials',
    agent: 'agent-guest',
    action: 'READ',
    resource: 'restricted/production_vault_keys.env',
    reason: 'Attempting to inspect cluster authentication credentials',
    clientRisk: 'LOW',
    expectedDecision: 'BLOCK',
    policy: 'POL-B'
  },
  {
    title: '3. Update Database Record',
    desc: 'Authorized database modification',
    agent: 'agent-data-analyzer',
    action: 'UPDATE',
    resource: 'db://analytics/daily_aggregates',
    reason: 'Appending validated hourly transaction rollup',
    clientRisk: 'MEDIUM',
    expectedDecision: 'ALLOW',
    policy: 'POL-C'
  },
  {
    title: '4. Delete Database Record',
    desc: 'Destructive database deletion',
    agent: 'agent-financial-bot',
    action: 'DELETE',
    resource: 'db://ledger/transactions_2025',
    reason: 'Maintenance cleanup of aged records',
    clientRisk: 'HIGH',
    expectedDecision: 'REQUIRE_APPROVAL',
    policy: 'POL-D'
  },
  {
    title: '5. Export Customer Data',
    desc: 'Bulk user data extraction',
    agent: 'agent-financial-bot',
    action: 'EXPORT',
    resource: 'db://users/customer_identities',
    reason: 'Aggregating contact emails for promotional mailing',
    clientRisk: 'HIGH',
    expectedDecision: 'REQUIRE_APPROVAL',
    policy: 'POL-E'
  },
  {
    title: '6. Execute Admin Command',
    desc: 'OS shell execution attempt',
    agent: 'agent-devops-orchestrator',
    action: 'ADMIN_EXEC',
    resource: 'sys://kernel/exec_daemon',
    reason: 'Spawning uncontained host background worker',
    clientRisk: 'CRITICAL',
    expectedDecision: 'BLOCK',
    policy: 'POL-F'
  }
];

export default function SimulatorPage() {
  const [agentId, setAgentId] = useState('agent-data-analyzer');
  const [actionType, setActionType] = useState('READ');
  const [resource, setResource] = useState('public/quarterly_security_metrics.pdf');
  const [reason, setReason] = useState('Routine read operation on public materials');
  const [clientRisk, setClientRisk] = useState('LOW');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ActionEvaluateResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setAgentId(preset.agent);
    setActionType(preset.action);
    setResource(preset.resource);
    setReason(preset.reason);
    setClientRisk(preset.clientRisk);
    setResult(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await api.evaluateAction({
        agent_id: agentId.trim(),
        action_type: actionType.trim().toUpperCase(),
        resource: resource.trim(),
        reason: reason.trim() || undefined,
        client_risk_level: clientRisk
      });
      setResult(response);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation failed. Ensure backend is active.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAgentId('agent-data-analyzer');
    setActionType('READ');
    setResource('public/quarterly_security_metrics.pdf');
    setReason('Routine read operation on public materials');
    setClientRisk('LOW');
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header 
        title="AI Action Simulator" 
        subtitle="Simulate autonomous AI operations and evaluate deterministic policy governance in real time"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Presets Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">Recommended Demonstration Scenarios</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Click any scenario to populate the simulator form with pre-configured parameters:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="p-3 rounded-lg bg-graphite-900 border border-graphite-750 hover:border-graphite-600 hover:bg-graphite-850 text-left transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">
                      {p.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      p.expectedDecision === 'ALLOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      p.expectedDecision === 'BLOCK' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {p.expectedDecision}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{p.desc}</p>
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-graphite-800 pt-1.5">
                  <span>Policy: {p.policy}</span>
                  <span className="text-emerald-400/80 group-hover:translate-x-0.5 transition-transform">Use Preset &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Simulator Form & Live Result Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Column (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-graphite-900 border border-graphite-750 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-750">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">AI Operation Parameters</h3>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agent Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Requesting Agent Identifier
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { id: 'agent-data-analyzer', label: 'Data Analyzer (db:write)' },
                    { id: 'agent-financial-bot', label: 'Financial Bot (db:read)' },
                    { id: 'agent-devops-orchestrator', label: 'DevOps (restricted)' },
                    { id: 'agent-guest', label: 'Guest / Sandbox (none)' }
                  ].map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => setAgentId(ag.id)}
                      className={`px-2.5 py-1.5 rounded text-xs text-left font-mono transition border ${
                        agentId === ag.id
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          : 'bg-graphite-950 text-slate-400 border-graphite-800 hover:border-graphite-700'
                      }`}
                    >
                      {ag.id}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Or enter custom agent ID"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="READ">READ (Inspect resource)</option>
                    <option value="UPDATE">UPDATE (Modify DB record)</option>
                    <option value="DELETE">DELETE (Remove DB record)</option>
                    <option value="EXPORT">EXPORT (Export customer data)</option>
                    <option value="ADMIN_EXEC">ADMIN_EXEC (Shell command)</option>
                    <option value="CUSTOM_OP">CUSTOM_OP (Unrecognized op)</option>
                  </select>
                </div>

                {/* Client Risk (Server-Discarded Note) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Client-Supplied Risk
                    </label>
                    <span className="text-[10px] text-amber-400/90 font-mono">UNTRUSTED</span>
                  </div>
                  <select
                    value={clientRisk}
                    onChange={(e) => setClientRisk(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              {/* Resource */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Resource URI / Path
                </label>
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  placeholder="e.g. public/report.pdf, restricted/keys.env, db://users/pii"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Agent Operational Intent / Stated Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why the agent is requesting this operation"
                  className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-750 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Zero-Trust Notice */}
              <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 text-[11px] text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-slate-300">Zero-Trust Evaluation:</strong> The SentinelMesh policy engine evaluates the action on the server. Client-provided risk parameters are discarded; risk is strictly derived from resource classification and operation type.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-400 text-emerald-950 hover:bg-emerald-300 transition shadow-lg shadow-emerald-950/20 disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-pulse' : ''}`} />
                <span>{isLoading ? 'Evaluating Policy Engine...' : 'Evaluate Action & Record Audit Event'}</span>
              </button>
            </form>
          </div>

          {/* Result Panel (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-graphite-900 border border-graphite-750 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-graphite-750">
              <h3 className="text-sm font-semibold text-slate-100">Evaluation Outcome</h3>
              {result && (
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            {!result ? (
              <div className="py-16 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-graphite-800 border border-graphite-700 flex items-center justify-center mx-auto text-slate-500">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <h4 className="text-sm font-medium text-slate-300">Awaiting Simulation Request</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Configure an action on the left or select a recommended scenario above to evaluate policy enforcement.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Decision Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.decision === 'ALLOW' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  result.decision === 'BLOCK' ? 'bg-rose-500/10 border-rose-500/30' :
                  'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider block text-slate-400 mb-0.5">
                      Enforced Decision
                    </span>
                    <span className={`text-lg font-bold tracking-tight ${
                      result.decision === 'ALLOW' ? 'text-emerald-400' :
                      result.decision === 'BLOCK' ? 'text-rose-400' :
                      'text-amber-400'
                    }`}>
                      {result.decision}
                    </span>
                  </div>
                  <StatusBadge type="decision" value={result.decision} size="md" />
                </div>

                {/* Policy Identification */}
                <div className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Triggered Policy:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {result.policy_id} — {result.policy_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Derived Server Risk:</span>
                    <StatusBadge type="risk" value={result.derived_risk_level} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Execution Status:</span>
                    <StatusBadge type="execution" value={result.execution_status} />
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Policy Rationale
                  </span>
                  <div className="p-3 rounded-lg bg-graphite-850 border border-graphite-750 text-xs text-slate-300 leading-relaxed">
                    {result.reason}
                  </div>
                </div>

                {/* Simulation Safety Guarantee Notice */}
                <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Phase 1 Sandbox Safety Verification</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {result.decision === 'ALLOW' 
                      ? 'Operation permitted: Execution is strictly SIMULATED. No production files, servers, or external infrastructure were modified.' 
                      : result.decision === 'BLOCK'
                      ? 'Threat mitigated: Zero execution occurred. The requested action was halted at the policy boundary.'
                      : 'Approval gated: Execution is on hold. The operation will not run until an authorized administrator grants approval.'}
                  </p>
                </div>

                {/* Audit Event Reference & Cryptographic Hash */}
                <div className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Audit Event ID:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{result.event_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">
                      SHA-256 Event Hash (Chained)
                    </span>
                    <div className="font-mono text-[10px] text-slate-400 break-all bg-graphite-900 p-2 rounded border border-graphite-800 select-all">
                      {result.integrity_hash}
                    </div>
                  </div>
                </div>

                {/* Link to Audit Trail */}
                <Link
                  href="/audit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-300 bg-graphite-800 border border-graphite-700 hover:bg-graphite-750 hover:text-white transition"
                >
                  <span>Locate in Audit Trail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
