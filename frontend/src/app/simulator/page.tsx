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
  Lock,
  Sparkles,
  Bot,
  FileCheck,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { TrustTimeline } from '@/components/TrustTimeline';
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
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Live Highlight Demonstration State
  const [demoState, setDemoState] = useState<'IDLE' | 'RUNNING' | 'COMPLETED'>('IDLE');
  const [demoResult, setDemoResult] = useState<ActionEvaluateResponse | null>(null);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Run the requested Section 5 Highlight Demo
  const runHighlightDemo = async () => {
    setDemoState('RUNNING');
    try {
      const response = await api.evaluateAction({
        agent_id: 'agent-guest',
        action_type: 'READ',
        resource: 'db://users/customer_identities',
        reason: 'Unauthorized external scan attempting to export confidential customer identity records',
        client_risk_level: 'HIGH'
      });
      setDemoResult(response);
      setResult(response);
      setDemoState('COMPLETED');
    } catch (err: any) {
      alert(`Highlight demo failed: ${err.message}`);
      setDemoState('IDLE');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#090D16] text-[#F8FAFC] font-sans">
      <Header 
        title="Agent Action Simulator" 
        subtitle="Submit agent operations, evaluate deterministic policies & commit cryptographic audit evidence"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Role Governance Banner */}
        <div className="p-3.5 rounded-xl bg-[#151F30] border border-[#263449] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#94A3B8]">Active Role Session:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
              {roleBadgeText}
            </span>
            <span className="text-xs text-[#94A3B8] hidden md:inline font-semibold">| {roleDescription}</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-3">
            <span className={permissions.canSubmitActions ? 'text-[#22C55E] font-bold' : 'text-[#94A3B8] font-medium'}>
              {permissions.canSubmitActions ? '✓ Policy Execution Authorized' : '✗ Execution Restricted (Auditor)'}
            </span>
            <span className={permissions.canVerifyHashes ? 'text-[#38BDF8] font-bold' : 'text-[#94A3B8] font-medium'}>
              {permissions.canVerifyHashes ? '✓ Hash Verification' : '✗ Read-Only'}
            </span>
          </div>
        </div>

        {/* Standard Scenario Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">1-Click Standard Test Scenarios</h3>
            <span className="text-[10px] text-[#94A3B8] font-mono">6 Benchmark Test Cases</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="p-3 rounded-xl bg-[#151F30] border border-[#263449] hover:border-[#38BDF8]/50 text-left transition flex flex-col justify-between space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition truncate">
                    {preset.title}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    preset.expectedDecision === 'ALLOW' ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' :
                    preset.expectedDecision === 'BLOCK' ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30' :
                    'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                  }`}>
                    {preset.expectedDecision}
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] line-clamp-1">{preset.desc}</p>
                <div className="text-[10px] font-mono text-[#94A3B8] flex items-center justify-between pt-1 border-t border-[#263449]">
                  <span className="truncate max-w-[140px]">{preset.resource}</span>
                  <span className="text-[#38BDF8] font-semibold">{preset.policy}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Simulation Form & Outcome (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#263449]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">Agent Request Configuration</h3>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agent ID */}
              <div>
                <label className="text-xs font-bold text-[#F8FAFC] block mb-1">
                  AI Agent Identifier
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="e.g. agent-data-analyzer, agent-financial-bot, agent-guest"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#101827] border border-[#263449] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Action Type */}
                <div>
                  <label className="text-xs font-bold text-[#F8FAFC] block mb-1">
                    Requested Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#101827] border border-[#263449] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#F8FAFC]">
                      Client Risk Rating
                    </label>
                    <span className="text-[10px] text-[#38BDF8] font-mono">SERVER DERIVED</span>
                  </div>
                  <select
                    value={clientRisk}
                    onChange={(e) => setClientRisk(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#101827] border border-[#263449] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              {/* Target Resource */}
              <div>
                <label className="text-xs font-bold text-[#F8FAFC] block mb-1">
                  Target Resource URI / Path
                </label>
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  placeholder="e.g. public/report.pdf, restricted/vault_keys.env, db://users/identities"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#101827] border border-[#263449] text-[#F8FAFC] text-xs font-mono focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              {/* Stated Intent / Reason */}
              <div>
                <label className="text-xs font-bold text-[#F8FAFC] block mb-1">
                  Operational Intent / Stated Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why the agent is requesting this operation"
                  className="w-full px-3 py-2 rounded-lg bg-[#101827] border border-[#263449] text-[#F8FAFC] text-xs focus:border-[#38BDF8] focus:outline-none resize-none"
                />
              </div>

              {/* Security Boundary Notice */}
              <div className="p-3 rounded-lg bg-[#101827] border border-[#263449] text-[11px] text-[#94A3B8] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-[#F8FAFC]">Zero-Trust Policy Enforcement:</strong> Every request is evaluated deterministically on the backend against strict policy patterns. Client-supplied risk ratings are overridden; risk is derived strictly from policy engine execution.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !permissions.canSubmitActions}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#38BDF8] hover:bg-[#0284C7] text-[#090D16] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#263449]">
                <h3 className="text-sm font-bold text-[#F8FAFC]">Evaluation Outcome</h3>
                {result && (
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {!result ? (
                <div className="py-16 px-4 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#101827] border border-[#263449] flex items-center justify-center mx-auto text-[#94A3B8]">
                    <Play className="w-4 h-4 ml-0.5 text-[#38BDF8]" />
                  </div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Awaiting Action Request</h4>
                  <p className="text-[11px] text-[#94A3B8] max-w-xs mx-auto">
                    Configure an action on the left or click a standard scenario above to execute policy evaluation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-3">
                  {/* Decision Banner */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    result.decision === 'ALLOW' ? 'bg-[#22C55E]/15 border-[#22C55E]/30' :
                    result.decision === 'BLOCK' ? 'bg-[#EF4444]/15 border-[#EF4444]/30' :
                    'bg-[#F59E0B]/15 border-[#F59E0B]/30'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-[#94A3B8] mb-0.5">
                        Enforced Decision
                      </span>
                      <span className={`text-xl font-extrabold font-mono tracking-tight ${
                        result.decision === 'ALLOW' ? 'text-[#22C55E]' :
                        result.decision === 'BLOCK' ? 'text-[#EF4444]' :
                        'text-[#F59E0B]'
                      }`}>
                        {result.decision}
                      </span>
                    </div>
                    <StatusBadge type="decision" value={result.decision} size="md" />
                  </div>

                  {/* Policy Rationale & Identification */}
                  <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Triggered Policy:</span>
                      <span className="font-mono font-bold text-[#F8FAFC]">
                        {result.policy_id} — {result.policy_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Derived Server Risk:</span>
                      <StatusBadge type="risk" value={result.derived_risk_level} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Execution Status:</span>
                      <StatusBadge type="execution" value={result.execution_status} />
                    </div>
                  </div>

                  {/* Policy Rationale Text */}
                  <div className="p-3 rounded-xl bg-[#101827] border border-[#263449] text-xs text-[#F8FAFC] leading-relaxed">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                      Policy Rationale
                    </span>
                    {result.reason}
                  </div>

                  {/* SHA-256 Digest Reference */}
                  <div className="p-3.5 rounded-xl bg-[#101827] border border-[#263449] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Event ID:</span>
                      <span className="font-mono text-[#38BDF8] font-bold">{result.event_id}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">
                          RFC-8785 SHA-256 Digest
                        </span>
                        <button
                          onClick={() => handleCopy(result.integrity_hash)}
                          className="text-[10px] text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
                        >
                          {copiedHash === result.integrity_hash ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                          <span>Copy Hash</span>
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-[#38BDF8] break-all bg-[#151F30] p-2 rounded-lg border border-[#263449] select-all font-semibold">
                        {result.integrity_hash}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#263449]">
                <Link
                  href={`/blockchain?search=${result.event_id}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-[#38BDF8] hover:bg-[#0284C7] text-[#090D16] transition shadow-sm"
                >
                  <Boxes className="w-3.5 h-3.5 text-[#090D16]" />
                  <span>Inspect On-Chain</span>
                </Link>
                <Link
                  href="/audit"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-[#F8FAFC] bg-[#1E293B] border border-[#263449] hover:bg-[#263449] transition"
                >
                  <span>Audit Trail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 8-Step Lifecycle Progression Tracker (Section 5 Middle Requirement) */}
        <TrustTimeline
          currentStage={result ? (result.decision === 'BLOCK' ? 5 : result.decision === 'REQUIRE_APPROVAL' ? 4 : 8) : 2}
          eventId={result?.event_id || 'evt_sim_ready'}
          integrityHash={result?.integrity_hash || '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6'}
          policyId={result?.policy_id || 'POL-A'}
          decision={result?.decision || 'ALLOW'}
          agentId={result ? agentId : 'agent-data-analyzer'}
          resource={result ? resource : 'public/quarterly_security_metrics.pdf'}
          isOnChain={true}
        />

        {/* Live Highlight Demonstration Card (Section 5 Bottom Requirement) */}
        <div className="p-6 rounded-2xl bg-[#151F30] border border-[#263449] space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263449]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#F8FAFC]">Live Technical Evaluation Highlight</h3>
                <p className="text-xs text-[#94A3B8]">Demonstrating the full lifecycle with real on-chain MST Testnet verification</p>
              </div>
            </div>
            <button
              onClick={runHighlightDemo}
              disabled={demoState === 'RUNNING'}
              className="px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-[#090D16] font-bold text-xs transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{demoState === 'RUNNING' ? 'Running Live Evaluation...' : 'Execute Live Highlight Demo'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#101827] border border-[#263449] space-y-3">
            <div className="text-xs text-[#94A3B8] leading-relaxed">
              <strong className="text-[#F8FAFC]">Demonstration Scenario:</strong> AI agent requests access to confidential customer identity data &rarr; Gateway intercepts &rarr; Policy engine evaluates against zero-trust rules &rarr; Returns <strong className="text-[#EF4444]">BLOCK</strong> &rarr; Generates RFC-8785 canonical evidence digest &rarr; Verifies against genuine on-chain commitment in <code className="text-[#38BDF8] font-mono">EvidenceRegistry.sol</code> on MST Testnet.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#151F30] border border-[#263449]">
                <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Target Resource</span>
                <span className="font-mono text-[11px] text-[#F8FAFC] font-bold truncate block">db://users/customer_identities</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#151F30] border border-[#263449]">
                <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Enforced Decision</span>
                <span className="font-mono text-[11px] text-[#EF4444] font-bold">BLOCK (Zero-Trust)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#151F30] border border-[#263449]">
                <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">EVM Smart Contract</span>
                <a
                  href="https://testnet.mstscan.com/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
                >
                  <span>0x0539...ceca</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="p-2.5 rounded-lg bg-[#151F30] border border-[#263449]">
                <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">MSTScan Tx Receipt</span>
                <a
                  href="https://testnet.mstscan.com/tx/0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-[#22C55E] hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Tx #0x2623...cc6</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
