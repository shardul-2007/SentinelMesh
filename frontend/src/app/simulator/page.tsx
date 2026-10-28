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
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Boxes,
  Lock
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { ActionEvaluateResponse } from '@/lib/types';

const PRESETS = [
  {
    title: '1. Read Public Document',
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
    title: '2. Read Production Secrets',
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
    title: '3. Update Database Analytics',
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
    title: '4. Delete Historical Ledger',
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
    title: '6. Execute Admin Host Command',
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
    <div className="flex flex-col min-h-full bg-[#F5F4F0]">
      <Header 
        title="Action Gateway" 
        subtitle="Submit agent operations, evaluate deterministic policies & commit cryptographic audit evidence"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Scenario Presets */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-[#171A1F]">Standard Test Scenarios</h3>
          </div>
          <p className="text-xs text-[#737B86] mb-3">
            Select a verified scenario to populate request parameters with known policy outcomes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="p-3.5 rounded bg-[#FFFFFF] border border-[#D9DDE2] hover:border-[#315C78] text-left transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#171A1F] group-hover:text-[#315C78] transition">
                      {p.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      p.expectedDecision === 'ALLOW' ? 'bg-[#EDF6F2] text-[#287653] border border-[#BCE2D1]' :
                      p.expectedDecision === 'BLOCK' ? 'bg-[#FDF2F2] text-[#B53A3A] border border-[#F7C4C4]' :
                      'bg-[#FDF7ED] text-[#98661C] border border-[#F5DEB3]'
                    }`}>
                      {p.expectedDecision}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737B86] line-clamp-1">{p.desc}</p>
                </div>
                <div className="mt-2.5 text-[10px] font-mono text-[#737B86] flex items-center justify-between border-t border-[#F5F4F0] pt-1.5">
                  <span>Policy: {p.policy}</span>
                  <span className="text-[#315C78] font-medium group-hover:translate-x-0.5 transition-transform">Use Preset &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Form & Evaluation Outcome */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Action Submission Form (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded bg-[#FFFFFF] border border-[#D9DDE2] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DDE2]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#315C78]" />
                <h3 className="text-sm font-semibold text-[#171A1F]">Action Parameters</h3>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-[#737B86] hover:text-[#171A1F] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agent Selector */}
              <div>
                <label className="text-xs font-semibold text-[#171A1F] block mb-1.5">
                  Requesting Agent Identifier
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { id: 'agent-data-analyzer', label: 'Data Analyzer' },
                    { id: 'agent-financial-bot', label: 'Financial Bot' },
                    { id: 'agent-devops-orchestrator', label: 'DevOps' },
                    { id: 'agent-guest', label: 'Guest / Sandbox' }
                  ].map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => setAgentId(ag.id)}
                      className={`px-2.5 py-1.5 rounded text-xs text-left font-mono transition border ${
                        agentId === ag.id
                          ? 'bg-[#EBF2F7] text-[#315C78] border-[#C5D7E3] font-semibold'
                          : 'bg-[#F5F4F0] text-[#737B86] border-[#D9DDE2] hover:border-[#B0B7C1]'
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
                  className="w-full px-3 py-2 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] text-xs font-mono focus:border-[#315C78] focus:outline-none"
                />
              </div>

              {/* Action Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#171A1F] block mb-1.5">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] text-xs font-mono focus:border-[#315C78] focus:outline-none"
                  >
                    <option value="READ">READ (Inspect resource)</option>
                    <option value="UPDATE">UPDATE (Modify DB record)</option>
                    <option value="DELETE">DELETE (Remove DB record)</option>
                    <option value="EXPORT">EXPORT (Export customer data)</option>
                    <option value="ADMIN_EXEC">ADMIN_EXEC (Shell command)</option>
                    <option value="CUSTOM_OP">CUSTOM_OP (Unrecognized op)</option>
                  </select>
                </div>

                {/* Client Risk */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#171A1F]">
                      Client-Supplied Risk
                    </label>
                    <span className="text-[10px] text-[#98661C] font-mono">SERVER DERIVED</span>
                  </div>
                  <select
                    value={clientRisk}
                    onChange={(e) => setClientRisk(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] text-xs font-mono focus:border-[#315C78] focus:outline-none"
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
                <label className="text-xs font-semibold text-[#171A1F] block mb-1.5">
                  Target Resource URI / Path
                </label>
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  placeholder="e.g. public/report.pdf, restricted/keys.env, db://users/pii"
                  required
                  className="w-full px-3 py-2 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] text-xs font-mono focus:border-[#315C78] focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-[#171A1F] block mb-1.5">
                  Operational Intent / Stated Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why the agent is requesting this operation"
                  className="w-full px-3 py-2 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-[#171A1F] text-xs focus:border-[#315C78] focus:outline-none resize-none"
                />
              </div>

              {/* Security Boundary Notice */}
              <div className="p-3 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-[11px] text-[#737B86] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#315C78] flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-[#171A1F]">Backend Policy Enforcement:</strong> Every request is evaluated deterministically on the backend. Client-supplied risk ratings are ignored; risk is derived strictly from policy rule evaluation.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded bg-[#FDF2F2] border border-[#F7C4C4] text-xs text-[#B53A3A] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#B53A3A] flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded text-xs font-semibold bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-pulse' : ''}`} />
                <span>{isLoading ? 'Evaluating Policy Engine...' : 'Evaluate Action & Persist Audit Evidence'}</span>
              </button>
            </form>
          </div>

          {/* Evaluation Outcome (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded bg-[#FFFFFF] border border-[#D9DDE2] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DDE2]">
              <h3 className="text-sm font-semibold text-[#171A1F]">Evaluation Outcome</h3>
              {result && (
                <span className="text-[10px] font-mono text-[#737B86]">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            {!result ? (
              <div className="py-16 px-4 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-[#F5F4F0] border border-[#D9DDE2] flex items-center justify-center mx-auto text-[#737B86]">
                  <Play className="w-4 h-4 ml-0.5 text-[#737B86]" />
                </div>
                <h4 className="text-xs font-semibold text-[#171A1F]">Awaiting Action Request</h4>
                <p className="text-[11px] text-[#737B86] max-w-xs mx-auto">
                  Configure an action on the left or click a standard scenario above to run policy evaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Decision Banner */}
                <div className={`p-4 rounded border flex items-center justify-between ${
                  result.decision === 'ALLOW' ? 'bg-[#EDF6F2] border-[#BCE2D1]' :
                  result.decision === 'BLOCK' ? 'bg-[#FDF2F2] border-[#F7C4C4]' :
                  'bg-[#FDF7ED] border-[#F5DEB3]'
                }`}>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider block text-[#737B86] mb-0.5">
                      Enforced Decision
                    </span>
                    <span className={`text-lg font-bold font-mono tracking-tight ${
                      result.decision === 'ALLOW' ? 'text-[#287653]' :
                      result.decision === 'BLOCK' ? 'text-[#B53A3A]' :
                      'text-[#98661C]'
                    }`}>
                      {result.decision}
                    </span>
                  </div>
                  <StatusBadge type="decision" value={result.decision} size="md" />
                </div>

                {/* Policy Identification */}
                <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737B86] font-medium">Triggered Policy:</span>
                    <span className="font-mono font-semibold text-[#171A1F]">
                      {result.policy_id} — {result.policy_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737B86] font-medium">Derived Server Risk:</span>
                    <StatusBadge type="risk" value={result.derived_risk_level} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737B86] font-medium">Execution Status:</span>
                    <StatusBadge type="execution" value={result.execution_status} />
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737B86] block mb-1">
                    Policy Rationale
                  </span>
                  <div className="p-3 rounded bg-[#FFFFFF] border border-[#D9DDE2] text-xs text-[#171A1F] leading-relaxed">
                    {result.reason}
                  </div>
                </div>

                {/* Audit Event Reference & Cryptographic Hash */}
                <div className="p-3.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737B86]">Audit Event ID:</span>
                    <span className="font-mono text-[#315C78] font-semibold">{result.event_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#737B86] uppercase tracking-wider block mb-0.5">
                      SHA-256 Event Hash (Chained)
                    </span>
                    <div className="font-mono text-[10px] text-[#171A1F] break-all bg-[#FFFFFF] p-2 rounded border border-[#D9DDE2] select-all">
                      {result.integrity_hash}
                    </div>
                  </div>
                </div>

                {/* Action Links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/blockchain?search=${result.event_id}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-semibold bg-[#315C78] text-[#FFFFFF] hover:bg-[#26495F] transition"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Inspect On-Chain</span>
                  </Link>
                  <Link
                    href="/audit"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-medium text-[#171A1F] bg-[#FFFFFF] border border-[#D9DDE2] hover:bg-[#F5F4F0] transition"
                  >
                    <span>Audit Trail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
