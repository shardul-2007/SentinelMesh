'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Terminal, 
  Zap, 
  Clock, 
  Eye, 
  Boxes,
  Database
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Agent Action Interception',
      desc: 'Autonomous AI agents (via LangChain, AutoGen, CrewAI, or direct SDK) submit structured operational intent before execution.',
      icon: Terminal,
      code: '{\n  "agent_id": "agent-financial-bot",\n  "action_type": "PAYMENT",\n  "resource": "paypal://orders/vendor",\n  "amount": 25.00\n}'
    },
    {
      num: '02',
      title: 'Deterministic Policy Evaluation',
      desc: 'The SentinelMesh Gateway evaluates immutable policies (POL-A through POL-G) server-side. Client-supplied risk levels are untrusted.',
      icon: Lock,
      code: '// Policy Evaluation Output\nALLOW | BLOCK | REQUIRE_APPROVAL\nRisk Tier: DERIVED_SERVER_SIDE\nPolicy: POL-PAYPAL-LOW'
    },
    {
      num: '03',
      title: 'Human-in-the-Loop Approval',
      desc: 'High-risk operations (e.g. database deletes, bulk exports, large financial payments) are held in an isolated pending queue until multi-factor sign-off.',
      icon: Clock,
      code: 'Status: PENDING_APPROVAL\nHalt: Execution suspended until authorized\nRevalidation: Required before dispatch'
    },
    {
      num: '04',
      title: 'RFC 8785 Canonical Serialization',
      desc: 'Evidence records are formatted using RFC 8785 canonical JSON, guaranteeing cross-platform, deterministic lexicographic sorting.',
      icon: FileText,
      code: 'canonical_bytes = CanonicalEngine.serialize(event)\nsha256_digest = sha256(canonical_bytes)'
    },
    {
      num: '05',
      title: 'MST Blockchain Anchoring',
      desc: 'The SHA-256 digest is committed on-chain to EvidenceRegistry.sol on MST Testnet (Chain ID 91562037). Zero private data is exposed on-chain.',
      icon: Boxes,
      code: 'contract.recordEvidence(\n  bytes32(sha256_digest),\n  "evt_4298df95fd9b"\n)'
    },
    {
      num: '06',
      title: 'Cryptographic Audit & Tamper Detection',
      desc: 'Auditors independently verify evidence integrity by recalculating digests and comparing against the immutable MST smart contract.',
      icon: ShieldCheck,
      code: 'assert local_digest == on_chain_digest\nStatus: ANCHORED_AND_VERIFIED (100% INTACT)'
    }
  ];

  return (
    <div className="flex-1 bg-[#F7F8FA] min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded-full text-xs font-bold uppercase tracking-wider">
            Architecture Walkthrough
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            How SentinelMesh Secures Autonomous AI
          </h1>
          <p className="text-base text-[#64748B]">
            From pre-execution interception to immutable blockchain evidence anchoring: a 6-stage Zero-Trust governance pipeline.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="space-y-6">
          {steps.map((s, idx) => (
            <div key={idx} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-6 shadow-sm hover:border-[#2563EB] transition grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-[#2563EB] font-mono">{s.num}</span>
                  <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#172033]">{s.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{s.desc}</p>
              </div>

              <div className="md:col-span-7 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4 font-mono text-[11px] text-[#172033] overflow-x-auto">
                <pre>{s.code}</pre>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#172033] rounded-2xl p-8 text-center text-[#FFFFFF] space-y-4 shadow-md">
          <h2 className="text-2xl font-bold">Ready to test the governance gateway?</h2>
          <p className="text-sm text-[#94A3B8] max-w-xl mx-auto">
            Experience live deterministic evaluation, tamper detection, and MST Testnet anchoring in the interactive simulator.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/simulator"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] rounded-lg text-xs font-bold transition shadow-sm"
            >
              Launch Agent Simulator
            </Link>
            <Link
              href="/paypal"
              className="px-5 py-2.5 bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#FFFFFF] rounded-lg text-xs font-bold transition"
            >
              Test PayPal Sandbox
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
