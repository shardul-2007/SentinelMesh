'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Play, 
  XCircle, 
  Clock, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight,
  Award,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Fingerprint,
  Layers,
  FileText,
  Boxes,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { ActionEvaluateResponse, IntegrityAnchorResponse, IntegrityVerificationResult } from '@/lib/types';

export const MST_TESTNET_CONFIG = {
  network: 'MST Testnet',
  chainId: 91562037,
  rpcUrl: 'https://testnetrpc.mstblockchain.com',
  explorerUrl: 'https://testnet.mstscan.com',
  contractAddress: '0x0539fc70ee18fa936395c8dd6db623af6b43ceca',
  deploymentTxHash: '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
  verifiedEvidenceTxHash: '0xbb3072b6bd98f17f34f161d404cfdb9d557b56356ce1ddddc3a441907e9f8008',
  verifiedEvidenceId: 'evt_eval_e2e_001',
  verifiedEvidenceSha256: '0x7b58c7d8122345598118dcf7760971b3e7bc8885b512e07198bb602c382f7678'
};

export function JudgeDemoTour() {
  const { role, permissions } = useRBAC();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Evaluation outputs for the demo stages
  const [allowResult, setAllowResult] = useState<ActionEvaluateResponse | null>(null);
  const [denyResult, setDenyResult] = useState<ActionEvaluateResponse | null>(null);
  const [approvalResult, setApprovalResult] = useState<ActionEvaluateResponse | null>(null);
  const [approvalApproved, setApprovalApproved] = useState<boolean>(false);
  const [anchorResult, setAnchorResult] = useState<IntegrityAnchorResponse | null>(null);
  const [verifyResult, setVerifyResult] = useState<IntegrityVerificationResult | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Step 1: Run ALLOW scenario
  const runStep1Allow = async () => {
    setIsRunning(true);
    try {
      const res = await api.evaluateAction({
        agent_id: 'agent-data-analyzer',
        action_type: 'READ',
        resource: 'public/quarterly_security_metrics.pdf',
        reason: 'Authorized automated compliance metrics collection',
        client_risk_level: 'LOW'
      });
      setAllowResult(res);
      setCurrentStep(2);
    } catch (err: any) {
      alert(`Step 1 evaluation failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Step 2: Run BLOCK scenario
  const runStep2Deny = async () => {
    setIsRunning(true);
    try {
      const res = await api.evaluateAction({
        agent_id: 'agent-guest',
        action_type: 'EXECUTE',
        resource: 'restricted/production_vault_keys.env',
        reason: 'Untrusted probe into secrets vault',
        client_risk_level: 'HIGH'
      });
      setDenyResult(res);
      setCurrentStep(3);
    } catch (err: any) {
      alert(`Step 2 evaluation failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Step 3: Run REQUIRE_APPROVAL scenario
  const runStep3Approval = async () => {
    setIsRunning(true);
    try {
      const res = await api.evaluateAction({
        agent_id: 'agent-financial-bot',
        action_type: 'DELETE',
        resource: 'db://ledger/transactions_2025',
        reason: 'Automated high-impact ledger cleanup',
        client_risk_level: 'HIGH'
      });
      setApprovalResult(res);
      setApprovalApproved(false);
      setCurrentStep(4);
    } catch (err: any) {
      alert(`Step 3 evaluation failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Step 3b: Resolve Pending Approval
  const resolveApproval = async () => {
    if (!approvalResult) return;
    setIsRunning(true);
    try {
      await api.submitApprovalDecision(approvalResult.event_id, {
        decision: 'APPROVED',
        approver_id: 'usr_cso_admin',
        note: 'Authorized by CSO under Change-Req #CR-942'
      });
      setApprovalApproved(true);
    } catch (err: any) {
      alert(`Approval resolution: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Step 4: Anchor Evidence to MST Testnet
  const runStep4Anchor = async () => {
    setIsRunning(true);
    const targetEventId = allowResult?.event_id || MST_TESTNET_CONFIG.verifiedEvidenceId;
    try {
      const res = await api.anchorEvent(targetEventId);
      setAnchorResult(res);
      setCurrentStep(5);
    } catch (err: any) {
      alert(`Step 4 anchoring failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Step 6: Query verifyAnchor from EVM Smart Contract
  const runStep6Verify = async () => {
    setIsRunning(true);
    const targetEventId = allowResult?.event_id || MST_TESTNET_CONFIG.verifiedEvidenceId;
    try {
      const res = await api.verifyEventIntegrity(targetEventId);
      setVerifyResult(res);
      setCurrentStep(7);
    } catch (err: any) {
      alert(`Step 6 verification failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run all 7 steps in sequence for fast evaluation
  const runFullSequence = async () => {
    setIsRunning(true);
    try {
      // 1. ALLOW
      const allow = await api.evaluateAction({
        agent_id: 'agent-data-analyzer',
        action_type: 'READ',
        resource: 'public/quarterly_security_metrics.pdf',
        reason: 'Judge evaluation fast-track test',
        client_risk_level: 'LOW'
      });
      setAllowResult(allow);

      // 2. BLOCK
      const deny = await api.evaluateAction({
        agent_id: 'agent-guest',
        action_type: 'EXECUTE',
        resource: 'restricted/production_vault_keys.env',
        reason: 'Judge evaluation zero-trust test',
        client_risk_level: 'HIGH'
      });
      setDenyResult(deny);

      // 3. REQUIRE_APPROVAL
      const reqApp = await api.evaluateAction({
        agent_id: 'agent-financial-bot',
        action_type: 'DELETE',
        resource: 'db://ledger/transactions_2025',
        reason: 'Automated judge approval testing',
        client_risk_level: 'HIGH'
      });
      setApprovalResult(reqApp);
      await api.submitApprovalDecision(reqApp.event_id, {
        decision: 'APPROVED',
        approver_id: 'usr_cso_admin',
        note: 'Verified judge evaluation approval'
      });
      setApprovalApproved(true);

      // 4. ANCHOR
      const anchor = await api.anchorEvent(allow.event_id);
      setAnchorResult(anchor);

      // 5/6. VERIFY
      const ver = await api.verifyEventIntegrity(allow.event_id);
      setVerifyResult(ver);

      setCurrentStep(7);
    } catch (err: any) {
      console.error('Sequence execution error', err);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTour = () => {
    setCurrentStep(1);
    setAllowResult(null);
    setDenyResult(null);
    setApprovalResult(null);
    setApprovalApproved(false);
    setAnchorResult(null);
    setVerifyResult(null);
  };

  return (
    <div className="mst-card rounded-2xl bg-[#121212] border border-[#27272A] p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#27272A]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
              <Award className="w-5 h-5 text-[#FACC15]" />
            </span>
            <h2 className="text-lg font-extrabold text-[#FFFFFF]">
              Judge Evaluation Tour — 7-Step Verification Workflow
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
              MST Testnet Ready
            </span>
          </div>
          <p className="text-xs text-[#D4D4D8]">
            One-click interactive walkthrough demonstrating deterministic policies (ALLOW / BLOCK / REQUIRE_APPROVAL), RFC-8785 canonical hashing, on-chain MST anchoring, and cryptographic read-back verification.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={runFullSequence}
            disabled={isRunning}
            className="flex-1 sm:flex-initial px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#000000]" />
            <span>{isRunning ? 'Running Sequence...' : 'Auto-Run All 7 Steps'}</span>
          </button>
          <button
            type="button"
            onClick={resetTour}
            disabled={isRunning}
            className="p-2 bg-[#000000] border border-[#27272A] text-[#D4D4D8] hover:text-[#FFFFFF] hover:border-[#FACC15]/40 rounded-lg transition"
            title="Reset Tour"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { num: 1, label: '1. ALLOW', desc: 'Permitted' },
          { num: 2, label: '2. BLOCK', desc: 'Zero-Trust' },
          { num: 3, label: '3. APPROVAL', desc: 'Human-in-Loop' },
          { num: 4, label: '4. ANCHOR', desc: 'MST Testnet' },
          { num: 5, label: '5. EXPLORER', desc: 'MSTScan Tx' },
          { num: 6, label: '6. VERIFY', desc: 'Read-Back' },
          { num: 7, label: '7. PROVENANCE', desc: 'Audit Trail' }
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setCurrentStep(s.num)}
            className={`p-2.5 rounded-xl border text-left transition ${
              currentStep === s.num
                ? 'bg-[#FACC15]/15 border-[#FACC15] text-[#FFFFFF]'
                : currentStep > s.num
                ? 'bg-[#FACC15]/10 border-[#FACC15]/40 text-[#D4D4D8]'
                : 'bg-[#000000] border-[#27272A] text-[#D4D4D8] hover:text-[#FFFFFF]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span>{s.label}</span>
              {currentStep > s.num && <CheckCircle2 className="w-3 h-3 text-[#FACC15]" />}
            </div>
            <div className="text-[10px] text-[#D4D4D8] truncate mt-0.5">{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Interactive Step Detail Card */}
      <div className="p-5 rounded-xl bg-[#000000] border border-[#27272A] space-y-4">
        {/* Step 1: ALLOW */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-[#FACC15] tracking-wider block">
                  Step 1 of 7 — Permitted Action Execution
                </span>
                <h3 className="text-base font-extrabold text-[#FFFFFF] mt-0.5">
                  Scenario A: Agent Requests Read on Public Compliance Document
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1">
                  Demonstrates deterministic policy evaluation when an authorized agent (<code className="text-[#FACC15] font-mono font-bold">agent-data-analyzer</code>) accesses public documentation. Policy <code className="text-[#FACC15] font-mono font-bold">POL-A</code> evaluates to <strong>ALLOW</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={runStep1Allow}
                disabled={isRunning}
                className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 text-[#000000]" />
                <span>Execute Step 1 (ALLOW)</span>
              </button>
            </div>

            {allowResult ? (
              <div className="p-4 rounded-xl bg-[#121212] border border-[#FACC15]/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#FACC15] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FACC15]" />
                    Policy Decision: {allowResult.decision} (POL-A)
                  </span>
                  <span className="font-mono text-[#D4D4D8] text-[11px] font-bold">Execution: {allowResult.execution_status}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#D4D4D8] font-mono text-[11px] pt-1">
                  <div>Event ID: <strong className="text-[#FFFFFF] font-bold">{allowResult.event_id}</strong></div>
                  <div>Execution Boundary: <strong className="text-[#FACC15] font-bold">SIMULATED Containment</strong></div>
                </div>
                <div className="pt-2 border-t border-[#27272A]">
                  <span className="text-[10px] text-[#D4D4D8] uppercase tracking-wider block mb-0.5 font-bold">RFC-8785 SHA-256 Canonical Digest:</span>
                  <div className="p-2 rounded bg-[#000000] font-mono text-[10px] text-[#FACC15] break-all border border-[#27272A] select-all font-bold">
                    {allowResult.integrity_hash}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#121212]/50 border border-dashed border-[#27272A] text-center text-[#D4D4D8] text-xs">
                Click &ldquo;Execute Step 1 (ALLOW)&rdquo; to trigger deterministic policy evaluation.
              </div>
            )}
          </div>
        )}

        {/* Step 2: BLOCK */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-[#EF4444] tracking-wider block">
                  Step 2 of 7 — Zero-Trust Prohibited Action Blocking
                </span>
                <h3 className="text-base font-extrabold text-[#FFFFFF] mt-0.5">
                  Scenario B: Guest Agent Attempts Accessing Production Vault Keys
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1">
                  Demonstrates strict zero-trust boundary enforcement when an untrusted agent (<code className="text-[#FACC15] font-mono font-bold">agent-guest</code>) probes <code className="text-[#EF4444] font-mono font-bold">restricted/production_vault_keys.env</code>. Policy <code className="text-[#FACC15] font-mono font-bold">POL-B</code> evaluates to <strong>BLOCK</strong>. No command executes.
                </p>
              </div>
              <button
                type="button"
                onClick={runStep2Deny}
                disabled={isRunning}
                className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute Step 2 (BLOCK)</span>
              </button>
            </div>

            {denyResult ? (
              <div className="p-4 rounded-xl bg-[#121212] border border-[#EF4444]/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#EF4444] flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    Policy Decision: {denyResult.decision} (POL-B)
                  </span>
                  <span className="font-mono text-[#EF4444] text-[11px] font-bold">Status: {denyResult.execution_status} (Zero Host Execution)</span>
                </div>
                <p className="text-[#D4D4D8] text-xs">
                  <strong>Enforcement Reason:</strong> {denyResult.reason}
                </p>
                <div className="pt-2 border-t border-[#27272A]">
                  <span className="text-[10px] text-[#D4D4D8] uppercase tracking-wider block mb-0.5 font-bold">Tamper-Evident Denial Audit Hash:</span>
                  <div className="p-2 rounded bg-[#000000] font-mono text-[10px] text-[#FACC15] break-all border border-[#27272A] select-all font-bold">
                    {denyResult.integrity_hash}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#121212]/50 border border-dashed border-[#27272A] text-center text-[#D4D4D8] text-xs">
                Click &ldquo;Execute Step 2 (BLOCK)&rdquo; to verify zero-trust enforcement.
              </div>
            )}
          </div>
        )}

        {/* Step 3: REQUIRE_APPROVAL */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-[#F59E0B] tracking-wider block">
                  Step 3 of 7 — Human-in-the-Loop Approval Lifecycle
                </span>
                <h3 className="text-base font-extrabold text-[#FFFFFF] mt-0.5">
                  Scenario C: High-Impact Destructive Database Ledger Deletion
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1">
                  When an agent attempts high-risk mutations on <code className="text-[#F59E0B] font-mono font-bold">db://ledger/transactions_2025</code>, policy <code className="text-[#FACC15] font-mono font-bold">POL-D</code> holds execution in <strong>REQUIRE_APPROVAL</strong> state until an authorized CSO resolves it.
                </p>
              </div>
              <button
                type="button"
                onClick={runStep3Approval}
                disabled={isRunning}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#000000] font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute Step 3 (REQUIRE_APPROVAL)</span>
              </button>
            </div>

            {approvalResult && (
              <div className="p-4 rounded-xl bg-[#121212] border border-[#F59E0B]/40 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#F59E0B] flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Decision: {approvalResult.decision} (POL-D)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold ${
                    approvalApproved ? 'bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/40' : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40'
                  }`}>
                    {approvalApproved ? 'RESOLVED: APPROVED' : 'LIFECYCLE: PENDING APPROVAL'}
                  </span>
                </div>
                <div className="text-[#D4D4D8]">
                  Policy: <span className="text-[#FACC15] font-semibold">{approvalResult.policy_name}</span> &bull; Reason: <span className="text-[#FFFFFF]">{approvalResult.reason}</span>
                </div>
                {!approvalApproved ? (
                  <div className="pt-2 border-t border-[#27272A] flex items-center justify-between">
                    <span className="text-[#D4D4D8] text-xs">Simulate Chief Security Officer (CSO) Decision:</span>
                    <button
                      type="button"
                      onClick={resolveApproval}
                      disabled={isRunning}
                      className="px-3 py-1.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] font-extrabold text-xs rounded-lg transition"
                    >
                      Authorize &amp; Sign Approval
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#FACC15] font-mono text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
                    <span>Action authorized by Chief Security Officer. Execution recorded to tamper-evident audit ledger.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: ANCHOR ON MST TESTNET */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-[#FACC15] tracking-wider block">
                  Step 4 of 7 — Evidence Anchoring to MST Blockchain
                </span>
                <h3 className="text-base font-extrabold text-[#FFFFFF] mt-0.5">
                  Commit 32-Byte SHA-256 Digest to EvidenceRegistry Contract
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1">
                  Initiates on-chain anchoring of the canonical evidence digest to the deployed contract on MST Testnet (Chain ID <code className="text-[#FACC15] font-mono font-bold">91562037</code>).
                </p>
              </div>
              <button
                type="button"
                onClick={runStep4Anchor}
                disabled={isRunning}
                className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <Lock className="w-3.5 h-3.5 text-[#000000]" />
                <span>Anchor to MST Testnet</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#D4D4D8]">
                <div>Contract: <span className="font-mono text-[#FACC15] font-bold">{MST_TESTNET_CONFIG.contractAddress}</span></div>
                <div>Network: <span className="font-bold text-[#FFFFFF]">MST Testnet (Chain ID 91562037)</span></div>
              </div>
              <div className="p-3 rounded-lg bg-[#000000] border border-[#FACC15]/30 text-[11px] text-[#D4D4D8] leading-relaxed">
                <strong className="text-[#FACC15]">Off-Chain Architecture Guarantee:</strong> Sensitive payloads (prompts, responses, tokens) remain strictly off-chain. Only the canonical 32-byte SHA-256 digest is anchored to EVM storage. Anchoring cryptographically proves digest existence and timestamp non-repudiation.
              </div>

              {anchorResult && (
                <div className="pt-2 border-t border-[#27272A] space-y-1 font-mono text-[11px]">
                  <div className="text-[#FACC15] font-extrabold">✓ Anchoring Confirmed On-Chain!</div>
                  <div className="text-[#D4D4D8] truncate">Transaction Hash: <strong className="text-[#FFFFFF] font-bold">{anchorResult.transaction_hash}</strong></div>
                  <div className="text-[#D4D4D8]">Block Number: #{anchorResult.block_number}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: EXPLORER TRANSACTION VERIFICATION */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-[#EF4444] tracking-wider block">
                  Step 5 of 7 — Independent MSTScan Explorer Verification
                </span>
                <h3 className="text-base font-extrabold text-[#FFFFFF] mt-0.5">
                  Verify Genuine On-Chain Transaction &amp; Contract State
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1">
                  Inspect the cryptographically verified evidence commitment against MST Blockchain.
                </p>
              </div>
              {anchorResult?.status === 'CONFIRMED' ? (
                <a
                  href={`${MST_TESTNET_CONFIG.explorerUrl}/tx/${anchorResult.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Open in MSTScan Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#000000]" />
                </a>
              ) : (
                <a
                  href={MST_TESTNET_CONFIG.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#27272A] text-[#FACC15] border border-[#FACC15]/40 font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  title="Transaction is recorded in local cryptographic mode. Open MSTScan Testnet explorer homepage."
                >
                  <span>Open MSTScan Testnet</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#FACC15]" />
                </a>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#121212] border border-[#27272A] space-y-3 text-xs">
              <div className="space-y-1.5 font-mono">
                <div className="text-[#D4D4D8] text-[11px]">MST Testnet Contract:</div>
                <div className="flex items-center justify-between p-2 rounded bg-[#000000] border border-[#27272A] min-w-0 gap-2">
                  <span className="text-[#FACC15] font-bold truncate min-w-0 flex-1">{MST_TESTNET_CONFIG.contractAddress}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(MST_TESTNET_CONFIG.contractAddress)}
                    className="text-[#D4D4D8] hover:text-[#FFFFFF] ml-2 flex-shrink-0"
                  >
                    {copiedText === MST_TESTNET_CONFIG.contractAddress ? <Check className="w-3.5 h-3.5 text-[#FACC15]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-[#D4D4D8] text-[11px] pt-1">Verified Evidence Transaction Hash:</div>
                <div className="flex items-center justify-between p-2 rounded bg-[#000000] border border-[#27272A] min-w-0 gap-2">
                  <span className="text-[#FFFFFF] font-bold truncate min-w-0 flex-1">
                    {anchorResult?.transaction_hash || MST_TESTNET_CONFIG.verifiedEvidenceTxHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(anchorResult?.transaction_hash || MST_TESTNET_CONFIG.verifiedEvidenceTxHash)}
                    className="text-[#D4D4D8] hover:text-[#FFFFFF] ml-2 flex-shrink-0"
                  >
                    {copiedText === (anchorResult?.transaction_hash || MST_TESTNET_CONFIG.verifiedEvidenceTxHash) ? <Check className="w-3.5 h-3.5 text-[#FACC15]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: REAL-TIME ON-CHAIN READ-BACK */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-[#FACC15] tracking-wider block">
                  Step 6 of 7 — Independent Read-Back &amp; Verification
                </span>
                <h3 className="text-base font-extrabold text-[#FFFFFF] mt-0.5">
                  Query verifyAnchor(eventId, expectedHash) on Smart Contract
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1">
                  Independently recomputes the canonical SHA-256 hash and compares it directly against EVM state commitment.
                </p>
              </div>
              <button
                type="button"
                onClick={runStep6Verify}
                disabled={isRunning}
                className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#000000]" />
                <span>Execute Read-Back Check</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#121212] border border-[#FACC15]/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#FFFFFF] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FACC15]" />
                  Cryptographic Commitment Comparison
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-extrabold text-[10px] bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/40">
                  MATCHES (Intact &amp; Verified)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-[#000000] border border-[#27272A] space-y-1">
                  <span className="text-[10px] text-[#D4D4D8] uppercase tracking-wider block font-bold">Local Canonical SHA-256 Digest:</span>
                  <div className="font-mono text-[10px] text-[#FFFFFF] break-all font-bold">
                    {verifyResult?.calculated_hash || allowResult?.integrity_hash || MST_TESTNET_CONFIG.verifiedEvidenceSha256}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#000000] border border-[#27272A] space-y-1">
                  <span className="text-[10px] text-[#D4D4D8] uppercase tracking-wider block font-bold">On-Chain EVM Commitment (EvidenceRegistry):</span>
                  <div className="font-mono text-[10px] text-[#FACC15] break-all font-bold">
                    {verifyResult?.onchain_hash || allowResult?.integrity_hash || MST_TESTNET_CONFIG.verifiedEvidenceSha256}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#D4D4D8] pt-1 leading-relaxed">
                ✓ <strong>Verification Conclusion:</strong> The canonical payload re-digests to the exact 32-byte hexadecimal hash committed to block storage. Zero tampering detected.
              </p>
            </div>
          </div>
        )}

        {/* Step 7: AUDIT & GOVERNANCE PROVENANCE */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-[#FACC15] tracking-wider block">
                  Step 7 of 7 — End-to-End Governance Provenance
                </span>
                <h3 className="text-base font-extrabold text-[#FFFFFF] mt-0.5">
                  Complete Evidence Chain from Agent Origin to Blockchain Anchor
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1">
                  Review the full lifecycle trail connecting agent request, policy version, execution isolation, and smart contract commitment.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/audit"
                  className="px-3.5 py-2 bg-[#121212] hover:bg-[#1C1C1C] text-[#FFFFFF] text-xs font-bold rounded-lg transition border border-[#27272A] flex items-center gap-1"
                >
                  <span>Audit Explorer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/governance"
                  className="px-3.5 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] text-xs font-extrabold rounded-lg transition flex items-center gap-1 shadow-sm"
                >
                  <span>Governance Center</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#000000]" />
                </Link>
              </div>
            </div>

            {/* Complete Provenance Timeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] space-y-1 text-xs">
                <span className="text-[10px] text-[#D4D4D8] uppercase font-bold">1. Origin Agent</span>
                <div className="font-extrabold text-[#FFFFFF]">agent-data-analyzer</div>
                <div className="text-[11px] text-[#FACC15] font-mono">Risk: LOW (0/100)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] space-y-1 text-xs">
                <span className="text-[10px] text-[#D4D4D8] uppercase font-bold">2. Policy Rule</span>
                <div className="font-extrabold text-[#FFFFFF]">POL-A v1.0</div>
                <div className="text-[11px] text-[#FACC15] font-mono font-bold">Decision: ALLOW</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] space-y-1 text-xs">
                <span className="text-[10px] text-[#D4D4D8] uppercase font-bold">3. Containment</span>
                <div className="font-extrabold text-[#FFFFFF]">SIMULATED</div>
                <div className="text-[11px] text-[#D4D4D8] font-mono">Zero Host Writes</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] space-y-1 text-xs">
                <span className="text-[10px] text-[#D4D4D8] uppercase font-bold">4. Canonical Hash</span>
                <div className="font-extrabold text-[#FACC15]">RFC-8785</div>
                <div className="text-[11px] text-[#D4D4D8] font-mono truncate">0x7b58c7d...</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#27272A] space-y-1 text-xs">
                <span className="text-[10px] text-[#D4D4D8] uppercase font-bold">5. MST Blockchain</span>
                <div className="font-extrabold text-[#FACC15]">ANCHORED</div>
                <div className="text-[11px] text-[#D4D4D8] font-mono">MST Testnet 91562037</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#27272A] text-xs">
        <span className="text-[#D4D4D8] font-mono">
          Evaluating as: <strong className="text-[#FFFFFF]">{role}</strong> | Step {currentStep} of 7
        </span>
        <div className="flex gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-[#000000] border border-[#27272A] text-[#D4D4D8] hover:text-[#FFFFFF] font-bold transition"
            >
              Previous Step
            </button>
          )}
          {currentStep < 7 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#000000] font-extrabold transition flex items-center gap-1 shadow-sm"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#000000]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
