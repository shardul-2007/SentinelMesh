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
import { useRBAC } from '@/lib/rbac';
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
  const { role, permissions, roleBadgeText, roleDescription } = useRBAC();
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
    <div className="flex flex-col min-h-full bg-[#0B0F17]">
      <Header 
        title="Action Gateway" 
        subtitle="Submit agent operations, evaluate deterministic policies & commit cryptographic audit evidence"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Banner */}
        <div className="p-3.5 rounded-lg bg-[#131A24]/90 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#94A3B8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#64748B] hidden md:inline">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canSubmitActions ? 'text-cyan-400' : 'text-slate-500'}>
              {permissions.canSubmitActions ? '✓ Policy Execution Authorized' : '✗ Execution Restricted (Auditor)'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-emerald-400' : 'text-slate-500'}>
              {permissions.canVerifyHashes ? '✓ Hash Verification' : '✗ Read-Only'}
            </span>
          </div>
        </div>

        {/* Auditor Read-Only Warning */}
        {!permissions.canSubmitActions && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3 shadow-sm">
            <Lock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Action Gateway is in Read-Only Audit Mode</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/40">
                  VIEWER / AUDITOR
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Compliance Auditors have view-only monitoring and verification privileges. You can inspect test scenarios, policy outcomes, and existing audit trails, but live action submission and simulation execution are restricted. Switch to Security Analyst or CSO in the top header to evaluate live actions.
              </p>
            </div>
          </div>
        )}

        {/* Scenario Presets */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Standard Test Scenarios</h3>
          </div>
          <p className="text-xs text-[#94A3B8] mb-3">
            Select a verified scenario to populate request parameters with known policy outcomes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="p-3.5 rounded-xl bg-[#131A24] border border-[#263244] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.18)] hover:-translate-y-1 text-left transition-all duration-200 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] transition">
                      {p.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      p.expectedDecision === 'ALLOW' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' :
                      p.expectedDecision === 'BLOCK' ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30' :
                      'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                    }`}>
                      {p.expectedDecision}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] line-clamp-1">{p.desc}</p>
                </div>
                <div className="mt-2.5 text-[10px] font-mono text-[#94A3B8] flex items-center justify-between border-t border-[#263244] pt-1.5">
                  <span>Policy: {p.policy}</span>
                  <span className="text-[#38BDF8] font-medium group-hover:translate-x-0.5 transition-transform">Use Preset &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Form & Evaluation Outcome */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Action Submission Form (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded bg-[#131A24] border border-[#263244] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#263244]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Action Parameters</h3>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agent Selector */}
              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
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
                          ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30 font-semibold'
                          : 'bg-[#0B0F17] text-[#94A3B8] border-[#263244] hover:border-[#38BDF8]/50'
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
                  className="w-full px-3 py-2 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none placeholder-[#64748B]"
                />
              </div>

              {/* Action Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none"
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
                    <label className="text-xs font-semibold text-[#F8FAFC]">
                      Client-Supplied Risk
                    </label>
                    <span className="text-[10px] text-[#F59E0B] font-mono">SERVER DERIVED</span>
                  </div>
                  <select
                    value={clientRisk}
                    onChange={(e) => setClientRisk(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none"
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
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
                  Target Resource URI / Path
                </label>
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  placeholder="e.g. public/report.pdf, restricted/keys.env, db://users/pii"
                  required
                  className="w-full px-3 py-2 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none placeholder-[#64748B]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
                  Operational Intent / Stated Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why the agent is requesting this operation"
                  className="w-full px-3 py-2 rounded bg-[#0B0F17] border border-[#263244] text-[#F8FAFC] text-xs focus:border-[#38BDF8] focus:outline-none resize-none placeholder-[#64748B]"
                />
              </div>

              {/* Security Boundary Notice */}
              <div className="p-3 rounded bg-[#0B0F17] border border-[#263244] text-[11px] text-[#94A3B8] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-[#F8FAFC]">Backend Policy Enforcement:</strong> Every request is evaluated deterministically on the backend. Client-supplied risk ratings are ignored; risk is derived strictly from policy rule evaluation.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !permissions.canSubmitActions}
                title={permissions.canSubmitActions ? 'Evaluate policy against request' : 'Viewer / Auditor role is read-only. Switch to Analyst or Admin to simulate.'}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#0B0F17] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 mst-btn-shimmer"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-pulse' : ''}`} />
                <span>
                  {isLoading
                    ? 'Evaluating Policy Engine...'
                    : !permissions.canSubmitActions
                    ? 'Auditor Mode (Read-Only) — Switch Role to Evaluate'
                    : 'Evaluate Action & Persist Audit Evidence'}
                </span>
              </button>
            </form>
          </div>

          {/* Evaluation Outcome (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded bg-[#131A24] border border-[#263244] space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#263244]">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Evaluation Outcome</h3>
              {result && (
                <span className="text-[10px] font-mono text-[#94A3B8]">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            {!result ? (
              <div className="py-16 px-4 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-[#0B0F17] border border-[#263244] flex items-center justify-center mx-auto text-[#94A3B8]">
                  <Play className="w-4 h-4 ml-0.5 text-[#94A3B8]" />
                </div>
                <h4 className="text-xs font-semibold text-[#F8FAFC]">Awaiting Action Request</h4>
                <p className="text-[11px] text-[#94A3B8] max-w-xs mx-auto">
                  Configure an action on the left or click a standard scenario above to run policy evaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Decision Banner */}
                <div className={`p-4 rounded border flex items-center justify-between ${
                  result.decision === 'ALLOW' ? 'bg-[#10B981]/15 border-[#10B981]/30' :
                  result.decision === 'BLOCK' ? 'bg-[#EF4444]/15 border-[#EF4444]/30' :
                  'bg-[#F59E0B]/15 border-[#F59E0B]/30'
                }`}>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider block text-[#94A3B8] mb-0.5">
                      Enforced Decision
                    </span>
                    <span className={`text-lg font-bold font-mono tracking-tight ${
                      result.decision === 'ALLOW' ? 'text-[#10B981]' :
                      result.decision === 'BLOCK' ? 'text-[#EF4444]' :
                      'text-[#F59E0B]'
                    }`}>
                      {result.decision}
                    </span>
                  </div>
                  <StatusBadge type="decision" value={result.decision} size="md" />
                </div>

                {/* Pending Approval Role Notice */}
                {result.decision === 'REQUIRE_APPROVAL' && (
                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>
                        {role === 'ADMIN'
                          ? 'Chief Security Officer Authorization Required'
                          : role === 'SECURITY_ANALYST'
                          ? 'Pending Approval Enqueued (CSO Action Required)'
                          : 'Administrative Approval Enqueued'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                      {role === 'ADMIN'
                        ? 'This operation triggered a high-risk policy requiring administrative authorization. You possess full administrative authority to review and approve or reject this request.'
                        : role === 'SECURITY_ANALYST'
                        ? 'Security Analysts cannot self-approve pending operations. This request has been logged to the immutable audit ledger awaiting review by the Chief Security Officer (CSO).'
                        : 'This operation requires approval and has been logged to the immutable audit ledger. Compliance Auditors have view-only rights.'}
                    </p>
                    {role === 'ADMIN' ? (
                      <Link
                        href="/approvals"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-amber-400 text-slate-900 hover:bg-amber-300 transition"
                      >
                        <span>Open Approval Queue to Authorize &rarr;</span>
                      </Link>
                    ) : (
                      <Link
                        href="/approvals"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
                      >
                        <span>View Approval Queue (Audit Log) &rarr;</span>
                      </Link>
                    )}
                  </div>
                )}

                {/* Policy Identification */}
                <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] font-medium">Triggered Policy:</span>
                    <span className="font-mono font-semibold text-[#F8FAFC]">
                      {result.policy_id} — {result.policy_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] font-medium">Derived Server Risk:</span>
                    <StatusBadge type="risk" value={result.derived_risk_level} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] font-medium">Execution Status:</span>
                    <StatusBadge type="execution" value={result.execution_status} />
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">
                    Policy Rationale
                  </span>
                  <div className="p-3 rounded bg-[#0B0F17] border border-[#263244] text-xs text-[#F8FAFC] leading-relaxed">
                    {result.reason}
                  </div>
                </div>

                {/* Audit Event Reference & Cryptographic Hash */}
                <div className="p-3.5 rounded bg-[#0B0F17] border border-[#263244] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Audit Event ID:</span>
                    <span className="font-mono text-[#38BDF8] font-semibold">{result.event_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block mb-0.5">
                      SHA-256 Event Hash (Chained)
                    </span>
                    <div className="font-mono text-[10px] text-[#38BDF8] break-all bg-[#131A24] p-2 rounded border border-[#263244] select-all">
                      {result.integrity_hash}
                    </div>
                  </div>
                </div>

                {/* Action Links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/blockchain?search=${result.event_id}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-semibold bg-[#38BDF8] text-[#0B0F17] hover:bg-[#0284C7] transition"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Inspect On-Chain</span>
                  </Link>
                  <Link
                    href="/audit"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-medium text-[#F8FAFC] bg-[#0B0F17] border border-[#263244] hover:bg-[#1A2332] transition"
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
