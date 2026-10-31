'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  Shield,
  ShieldCheck, 
  Lock, 
  Boxes, 
  ArrowRight, 
  FileCheck, 
  Server, 
  Database, 
  ExternalLink,
  ShieldAlert,
  Bot,
  Scale,
  CheckCircle2,
  Terminal,
  Code2,
  Layers,
  Fingerprint
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function ArchitecturePage() {
  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="SentinelMesh System Architecture" 
        subtitle="Zero-trust policy gateway, RFC 8785 canonical serialization & MST Blockchain anchoring"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Executive Overview */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              Technical Architecture Reference
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20 text-xs font-mono font-bold">
              MST Testnet Chain ID 91562037
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight">
            How SentinelMesh Secures Autonomous Agent Actions
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-4xl">
            SentinelMesh sits directly in the execution path between AI agents (LangChain, AutoGen, CrewAI, Custom LLMs) and protected enterprise resources. Rather than relying on non-deterministic LLM alignment or natural-language safety guardrails, SentinelMesh operates at the network and resource layer as an authoritative zero-trust policy proxy.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/simulator"
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center gap-2"
            >
              <span>Test in Action Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/integrity"
              className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#172B4D] border border-[#E5E7EB] font-bold text-xs transition flex items-center gap-2 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Verify Cryptographic Hashes</span>
            </Link>
            <a
              href="https://testnet.mstscan.com/address/0x0539fc70ee18fa936395c8dd6db623af6b43ceca"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#2563EB] border border-[#E5E7EB] font-mono text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Smart Contract Bytecode</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        {/* 6-Stage Lifecycle Detailed Diagram */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-[#172B4D]">The 6-Stage Execution &amp; Evidence Pipeline</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Stage 1 */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-1 rounded-md">
                  STAGE 01
                </span>
                <Bot className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">Action Intent Ingestion</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                When an autonomous AI agent decides to execute a tool, query a database, or invoke an API, it dispatches an action request containing its <code className="text-[#172B4D] font-mono">agent_id</code>, <code className="text-[#172B4D] font-mono">action_type</code>, <code className="text-[#172B4D] font-mono">resource</code>, and arguments.
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#172B4D]">
                POST /api/v1/actions/evaluate
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-1 rounded-md">
                  STAGE 02
                </span>
                <Shield className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">Gateway &amp; Identity Verification</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The SentinelMesh Gateway validates the agent's authentication token, checks whether the agent is active or quarantined, and verifies that the target resource identifier matches standard namespace patterns.
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#172B4D]">
                Bearer Token + RBAC Fleet Check
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-1 rounded-md">
                  STAGE 03
                </span>
                <Scale className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">Deterministic Policy Evaluation</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The policy engine evaluates rules in strict priority order. Patterns support glob wildcard matching for action types and resource URIs (e.g. <code className="text-[#172B4D] font-mono">db://ledger/*</code>). Decision logic is 100% deterministic and reproducible.
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#172B4D]">
                Pattern Match &amp; Priority Resolver
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#15803D] bg-[#15803D]/10 px-2.5 py-1 rounded-md">
                  STAGE 04
                </span>
                <ShieldCheck className="w-5 h-5 text-[#15803D]" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">Enforcement Decision</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The gateway yields one of three mutually exclusive decisions: <span className="font-semibold text-[#15803D]">ALLOW</span> (forward request), <span className="font-semibold text-[#DC2626]">BLOCK</span> (terminate immediately), or <span className="font-semibold text-[#D97706]">REQUIRE_APPROVAL</span> (hold pending human authorization).
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#172B4D]">
                HTTP 200 (Allow) | 403 (Block) | 202 (Gated)
              </div>
            </div>

            {/* Stage 5 */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-1 rounded-md">
                  STAGE 05
                </span>
                <FileCheck className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">RFC 8785 Canonical Evidence</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The evaluation context is serialized strictly according to RFC 8785 (JSON Canonicalization Scheme) with lexicographically sorted keys and normalized whitespace, yielding a deterministic SHA-256 evidence digest.
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#172B4D]">
                SHA-256(RFC8785(audit_payload))
              </div>
            </div>

            {/* Stage 6 */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#15803D] bg-[#15803D]/10 px-2.5 py-1 rounded-md">
                  STAGE 06
                </span>
                <Boxes className="w-5 h-5 text-[#15803D]" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">MST Blockchain Anchoring</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The evidence SHA-256 digest is submitted to the <code className="text-[#172B4D] font-mono">EvidenceRegistry</code> contract on MST Testnet (Chain ID 91562037). An on-chain receipt proves timestamp and immutability without exposing private data.
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-[11px] text-[#172B4D]">
                storeEvidence(eventId, digest, submitter)
              </div>
            </div>
          </div>
        </section>

        {/* RFC 8785 Canonical JSON & Privacy Architecture */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#172B4D]">RFC 8785 Canonical Serialization</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Standard JSON serializers produce varying byte sequences depending on key ordering, float representation, and whitespace. RFC 8785 standardizes canonical JSON formatting so that any auditor can independently reproduce the exact SHA-256 evidence digest from raw logs.
            </p>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-xs text-[#172B4D] overflow-x-auto space-y-1">
              <div className="text-[#64748B]">// Canonical RFC 8785 Structured Record</div>
              <div>&#123;</div>
              <div className="pl-4">"action_type": "READ",</div>
              <div className="pl-4">"agent_id": "agent-data-analyzer",</div>
              <div className="pl-4">"decision": "ALLOW",</div>
              <div className="pl-4">"policy_id": "POL-A",</div>
              <div className="pl-4">"resource": "public/security_metrics.pdf",</div>
              <div className="pl-4">"timestamp": 1740000000</div>
              <div>&#125;</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#15803D]" />
              <h3 className="text-base font-bold text-[#172B4D]">Privacy-Conscious Off-Chain Storage</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Zero sensitive customer data, API payloads, or confidential documents are written to the public blockchain. SentinelMesh adheres strictly to enterprise confidentiality best practices:
            </p>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span><strong>Off-Chain Storage:</strong> Full structured audit logs, parameter payloads, and policy metadata remain in secure PostgreSQL/SQLite with row-level encryption.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span><strong>On-Chain Commitment:</strong> Only the 32-byte cryptographic SHA-256 hash and unique event ID are anchored into the EVM smart contract.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span><strong>Mathematical Verification:</strong> Third-party regulators can verify log integrity without ever having access to confidential internal documents.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Smart Contract Specifications */}
        <section className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-base font-bold text-[#172B4D]">EvidenceRegistry Smart Contract Specs</h3>
              <p className="text-xs text-[#64748B]">Solidity 0.8.20 Contract Deployed on MST Testnet</p>
            </div>
            <span className="font-mono text-xs px-3 py-1 rounded-md bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20 font-bold">
              3,999 Bytes Bytecode Confirmed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Contract Address</span>
              <span className="text-[#2563EB] font-bold break-all mt-1 block">
                0x0539Fc70eE18FA936395C8dd6Db623AF6B43cEca
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Genesis Deployment</span>
              <span className="text-[#172B4D] font-bold break-all mt-1 block">
                Block #6688112
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Owner &amp; Submitter</span>
              <span className="text-[#172B4D] font-bold break-all mt-1 block">
                0x145115aD79A09A91249169E13BAEE24A9eA20ab3
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Gas Limit &amp; Chain</span>
              <span className="text-[#15803D] font-bold mt-1 block">
                Chain ID 91562037 (MST Testnet)
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
