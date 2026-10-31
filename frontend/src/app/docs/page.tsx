'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  Boxes, 
  Terminal, 
  Code2, 
  HelpCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  FileCode,
  FileCheck,
  Scale
} from 'lucide-react';
import { Header } from '@/components/Header';

const SECTIONS = [
  { id: 'overview', title: '1. Architecture & Threat Model' },
  { id: 'gateway-flow', title: '2. Gateway Lifecycle Flow' },
  { id: 'policies', title: '3. Security Policy Engine' },
  { id: 'rfc8785', title: '4. RFC 8785 Canonical JSON' },
  { id: 'blockchain', title: '5. MST Smart Contract Specs' },
  { id: 'api-reference', title: '6. REST API Reference' },
  { id: 'boundaries', title: '7. Security Model & Boundaries' }
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F7F8FA] text-[#172B4D] font-sans selection:bg-[#2563EB]/20">
      <Header 
        title="Technical Documentation" 
        subtitle="Architecture, deterministic policy syntax, RFC 8785 canonicalization & smart contract API"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Table of contents sidebar */}
          <aside className="w-full lg:w-64 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-4 shadow-xs sticky top-20 flex-shrink-0">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E5E7EB]">
              <BookOpen className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">Documentation</span>
            </div>
            <nav className="space-y-1">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                    activeSection === sec.id
                      ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172B4D]'
                  }`}
                >
                  <span>{sec.title}</span>
                  {activeSection === sec.id && <ChevronRight className="w-3.5 h-3.5 text-[#2563EB]" />}
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-2">
              <Link
                href="/simulator"
                className="w-full px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>Open Simulator</span>
              </Link>
            </div>
          </aside>

          {/* Main content body */}
          <div className="flex-1 space-y-8 w-full">
            {/* Section 1: Overview */}
            <section id="overview" className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2563EB]/10 text-[#2563EB]">
                  SECTION 01
                </span>
                <h2 className="text-lg font-bold text-[#172B4D]">Architecture &amp; Threat Model</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Autonomous AI agents present unique cybersecurity challenges: prompt injection, indirect instruction override, tool misconfiguration, and excessive privileges can lead an agent to read production keys, execute destructive database deletions, or leak customer records.
              </p>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                SentinelMesh addresses this by decoupling policy enforcement from the LLM. It acts as an authoritative, external Zero-Trust Gateway that intercepts structured action requests before execution.
              </p>
            </section>

            {/* Section 2: Gateway Flow */}
            <section id="gateway-flow" className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2563EB]/10 text-[#2563EB]">
                  SECTION 02
                </span>
                <h2 className="text-lg font-bold text-[#172B4D]">Gateway Lifecycle Flow</h2>
              </div>
              <div className="space-y-3 text-xs text-[#64748B] leading-relaxed">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                  <strong className="text-[#172B4D] block text-xs">1. Ingestion</strong>
                  The agent submits a payload containing: <code className="font-mono text-[#2563EB]">agent_id</code>, <code className="font-mono text-[#2563EB]">action_type</code>, <code className="font-mono text-[#2563EB]">resource</code>, and <code className="font-mono text-[#2563EB]">parameters</code>.
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                  <strong className="text-[#172B4D] block text-xs">2. Policy Evaluation</strong>
                  Deterministic matching determines if the action matches rule patterns. Highest priority rule resolves to ALLOW, BLOCK, or REQUIRE_APPROVAL.
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                  <strong className="text-[#172B4D] block text-xs">3. RFC 8785 Canonical Serialization</strong>
                  Audit payload is serialized with deterministic key order and normalized whitespace to generate an immutable SHA-256 evidence digest.
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                  <strong className="text-[#172B4D] block text-xs">4. Blockchain Anchoring</strong>
                  Evidence hash and event ID are committed to the EvidenceRegistry smart contract on MST Testnet (Chain ID 91562037).
                </div>
              </div>
            </section>

            {/* Section 3: Policies */}
            <section id="policies" className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2563EB]/10 text-[#2563EB]">
                  SECTION 03
                </span>
                <h2 className="text-lg font-bold text-[#172B4D]">Security Policy Engine Syntax</h2>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                SentinelMesh evaluates rules using glob pattern matching on action types and resource URIs:
              </p>
              <pre className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-xs text-[#172B4D] overflow-x-auto leading-relaxed">
{`{
  "id": "POL-LEDGER-GUARD",
  "name": "Protect Financial Ledgers",
  "action_pattern": "DELETE|DROP|TRUNCATE",
  "resource_pattern": "db://ledger/*",
  "decision": "REQUIRE_APPROVAL",
  "risk_tier": "HIGH",
  "priority": 100,
  "is_active": true
}`}
              </pre>
            </section>

            {/* Section 4: RFC 8785 */}
            <section id="rfc8785" className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2563EB]/10 text-[#2563EB]">
                  SECTION 04
                </span>
                <h2 className="text-lg font-bold text-[#172B4D]">RFC 8785 Canonical JSON Scheme</h2>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                To guarantee that different programming languages (Python, Rust, Go, JavaScript) calculate identical SHA-256 hashes from the same JSON object, SentinelMesh implements RFC 8785:
              </p>
              <ul className="list-disc pl-5 text-xs text-[#64748B] space-y-1.5">
                <li>Object keys are sorted lexicographically by UTF-16 code units.</li>
                <li>Whitespace between tokens is strictly eliminated (no trailing newlines or indent spaces).</li>
                <li>Numbers are normalized according to ECMAScript standard specification (e.g. integer 100 is <code className="font-mono text-[#172B4D]">100</code>, not <code className="font-mono text-[#172B4D]">100.0</code>).</li>
                <li>Strings are escaped strictly without unnecessary forward slash escaping.</li>
              </ul>
            </section>

            {/* Section 5: MST Smart Contract */}
            <section id="blockchain" className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#15803D]/10 text-[#15803D]">
                  SECTION 05
                </span>
                <h2 className="text-lg font-bold text-[#172B4D]">MST Blockchain EvidenceRegistry Contract</h2>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The smart contract is written in Solidity 0.8.20 and deployed to MST Testnet at address <code className="font-mono text-[#2563EB]">0x0539Fc70eE18FA936395C8dd6Db623AF6B43cEca</code>:
              </p>
              <pre className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] font-mono text-xs text-[#172B4D] overflow-x-auto leading-relaxed">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceRegistry {
    struct EvidenceRecord {
        bytes32 evidenceHash;
        uint256 blockTimestamp;
        address submitter;
        bool exists;
    }

    mapping(string => EvidenceRecord) public registry;

    event EvidenceStored(string indexed eventId, bytes32 indexed evidenceHash, address indexed submitter);

    function storeEvidence(string calldata eventId, bytes32 evidenceHash) external returns (bool) {
        require(!registry[eventId].exists, "Evidence already recorded");
        registry[eventId] = EvidenceRecord(evidenceHash, block.timestamp, msg.sender, true);
        emit EvidenceStored(eventId, evidenceHash, msg.sender);
        return true;
    }

    function getEvidence(string calldata eventId) external view returns (bytes32, uint256, address) {
        require(registry[eventId].exists, "Evidence not found");
        EvidenceRecord memory r = registry[eventId];
        return (r.evidenceHash, r.blockTimestamp, r.submitter);
    }
}`}
              </pre>
            </section>

            {/* Section 6: API Reference */}
            <section id="api-reference" className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2563EB]/10 text-[#2563EB]">
                  SECTION 06
                </span>
                <h2 className="text-lg font-bold text-[#172B4D]">REST API Reference</h2>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] font-bold">POST</span>
                    <span className="text-[#172B4D]">/api/v1/actions/evaluate</span>
                  </div>
                  <span className="text-[#64748B] text-[11px]">Evaluates action against policies</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#15803D]/10 text-[#15803D] font-bold">GET</span>
                    <span className="text-[#172B4D]">/api/v1/policies</span>
                  </div>
                  <span className="text-[#64748B] text-[11px]">Lists all active security policies</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#D97706]/10 text-[#D97706] font-bold">POST</span>
                    <span className="text-[#172B4D]">/api/v1/approvals/decide</span>
                  </div>
                  <span className="text-[#64748B] text-[11px]">Submits human authorization decision</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#15803D]/10 text-[#15803D] font-bold">GET</span>
                    <span className="text-[#172B4D]">/api/v1/integrity/verify/:eventId</span>
                  </div>
                  <span className="text-[#64748B] text-[11px]">Verifies local hash against smart contract</span>
                </div>
              </div>
            </section>

            {/* Section 7: Security Boundaries */}
            <section id="boundaries" className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#D97706]/10 text-[#D97706]">
                  SECTION 07
                </span>
                <h2 className="text-lg font-bold text-[#172B4D]">Security Model &amp; System Boundaries</h2>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                SentinelMesh operates under a zero-trust model where AI agents are treated as untrusted callers. However, it is essential to understand system boundaries:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
                  <strong className="text-[#15803D] block font-semibold">Protected Threat Vectors:</strong>
                  <ul className="list-disc pl-4 text-[#64748B] space-y-1">
                    <li>Unauthorized resource access and data exfiltration.</li>
                    <li>Destructive updates, ledger drops, and table truncation.</li>
                    <li>Execution of restricted OS shell processes.</li>
                    <li>Tampering or modification of historical audit logs.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
                  <strong className="text-[#D97706] block font-semibold">Out of Scope:</strong>
                  <ul className="list-disc pl-4 text-[#64748B] space-y-1">
                    <li>Evaluating conversational politeness or conversational flow.</li>
                    <li>Preventing internal reasoning hallucinations within the model.</li>
                    <li>Direct physical hardware manipulation outside networked APIs.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
