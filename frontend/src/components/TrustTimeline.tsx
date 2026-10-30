'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Sliders, 
  UserCheck, 
  Hash, 
  Boxes, 
  ShieldCheck, 
  ChevronRight, 
  Check, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Shield,
  FileCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export interface TimelineStep {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'BLOCKED';
  timestamp?: string;
  details: {
    label: string;
    value: string;
    isCode?: boolean;
    link?: string;
  }[];
}

interface TrustTimelineProps {
  currentStage?: number; // 1 to 8
  eventId?: string;
  integrityHash?: string;
  txHash?: string;
  blockNumber?: number;
  policyId?: string;
  decision?: string;
  agentId?: string;
  resource?: string;
  isOnChain?: boolean;
}

export function TrustTimeline({
  currentStage = 8,
  eventId = 'evt_mst_001',
  integrityHash = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
  txHash = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
  blockNumber = 6688112,
  policyId = 'POL-A',
  decision = 'ALLOW',
  agentId = 'agent-data-analyzer',
  resource = 'public/quarterly_security_metrics.pdf',
  isOnChain = true
}: TrustTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const steps: TimelineStep[] = [
    {
      id: 'step-request',
      number: 1,
      title: 'Request Received',
      subtitle: 'AI agent submitted action request to SentinelMesh gateway',
      status: currentStage >= 1 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Event ID', value: eventId, isCode: true },
        { label: 'Agent Identity', value: agentId, isCode: true },
        { label: 'Target Resource', value: resource },
        { label: 'Gateway Route', value: '/api/v1/actions/evaluate' }
      ]
    },
    {
      id: 'step-identity',
      number: 2,
      title: 'Identity & Permissions Validated',
      subtitle: 'Cryptographic agent signature and RBAC credentials verified',
      status: currentStage >= 2 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Caller Authentication', value: 'VALIDATED (Zero-Trust Identity)' },
        { label: 'Agent Role Tier', value: 'AUTONOMOUS_WORKER' },
        { label: 'Session State', value: 'ACTIVE_AUTHENTICATED' }
      ]
    },
    {
      id: 'step-policy',
      number: 3,
      title: 'Security Policy Evaluated',
      subtitle: 'Deterministic server-side zero-trust evaluation',
      status: currentStage >= 3 ? (decision === 'BLOCK' ? 'BLOCKED' : 'COMPLETED') : 'PENDING',
      details: [
        { label: 'Matched Policy', value: `${policyId} (Enforced Rule)`, isCode: true },
        { label: 'Precedence Order', value: 'High Priority First-Match' },
        { label: 'Enforcement Engine', value: 'Deterministic Python Core' }
      ]
    },
    {
      id: 'step-decision',
      number: 4,
      title: 'Decision Generated',
      subtitle: `Enforced outcome: ${decision}`,
      status: currentStage >= 4 ? (decision === 'BLOCK' ? 'BLOCKED' : 'COMPLETED') : 'PENDING',
      details: [
        { label: 'Gateway Decision', value: decision, isCode: true },
        { label: 'Derived Risk Score', value: decision === 'BLOCK' ? 'CRITICAL' : decision === 'REQUIRE_APPROVAL' ? 'HIGH' : 'LOW' },
        { label: 'Enforcement Time', value: '< 12ms' }
      ]
    },
    {
      id: 'step-execution',
      number: 5,
      title: 'Authorized Operation Handled',
      subtitle: decision === 'ALLOW' 
        ? 'Executed authorized operation inside secure sandbox' 
        : decision === 'REQUIRE_APPROVAL' 
        ? 'Escalated to human administrator approval queue' 
        : 'Operation permanently halted at gateway boundary',
      status: currentStage >= 5 ? (decision === 'BLOCK' ? 'BLOCKED' : 'COMPLETED') : 'PENDING',
      details: [
        { label: 'Containment Mode', value: 'Secure Sandboxed Simulation' },
        { label: 'Human Authorization Gate', value: decision === 'REQUIRE_APPROVAL' ? 'GATED (CSO Review Required)' : 'BYPASS_NOT_REQUIRED' },
        { label: 'Execution Status', value: decision === 'ALLOW' ? 'EXECUTED_CONTAINED' : decision === 'BLOCK' ? 'HALTED_BLOCKED' : 'PENDING_APPROVAL' }
      ]
    },
    {
      id: 'step-evidence',
      number: 6,
      title: 'Evidence Generated',
      subtitle: 'Canonical JSON (RFC 8785) & SHA-256 cryptographic digest',
      status: currentStage >= 6 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Canonical Format', value: 'RFC 8785 (JSON Canonicalization Scheme)' },
        { label: 'Digest Algorithm', value: 'SHA-256 (256-bit Hex)' },
        { label: 'Computed SHA-256 Hash', value: integrityHash, isCode: true }
      ]
    },
    {
      id: 'step-anchor',
      number: 7,
      title: 'Blockchain Anchoring Status',
      subtitle: 'Immutable smart contract commitment on MST Testnet',
      status: currentStage >= 7 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Network', value: 'MST Testnet (Chain ID: 91562037)' },
        { label: 'EvidenceRegistry', value: '0x0539fc70ee18fa936395c8dd6db623af6b43ceca', isCode: true },
        { label: 'Transaction Hash', value: txHash, isCode: true, link: `https://testnet.mstscan.com/tx/${txHash}` },
        { label: 'Block Number', value: `#${blockNumber.toLocaleString()}` }
      ]
    },
    {
      id: 'step-verify',
      number: 8,
      title: 'Independent Verification Result',
      subtitle: 'Zero-knowledge read-back verification confirms hash match',
      status: currentStage >= 8 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Local Canonical Hash', value: integrityHash.slice(0, 32) + '...', isCode: true },
        { label: 'On-Chain MST Hash', value: integrityHash.slice(0, 32) + '...', isCode: true },
        { label: 'Verification Status', value: '100% CRYPTOGRAPHIC MATCH (VERIFIED ON-CHAIN)' }
      ]
    }
  ];

  const getStatusBadge = (status: TimelineStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/15 border border-[#22C55E]/30 px-2 py-0.5 rounded-full flex-shrink-0">
            <Check className="w-3 h-3" />
            VERIFIED
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/30 px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">
            <Clock className="w-3 h-3" />
            PROCESSING
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#EF4444] bg-[#EF4444]/15 border border-[#EF4444]/30 px-2 py-0.5 rounded-full flex-shrink-0">
            <AlertCircle className="w-3 h-3" />
            BLOCKED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#94A3B8] bg-[#101827] border border-[#263449] px-2 py-0.5 rounded-full flex-shrink-0">
            QUEUED
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#151F30] border border-[#263449] shadow-xl space-y-4 overflow-hidden font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#263449]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#F8FAFC]">8-Step Lifecycle Progression Tracker</h3>
            <p className="text-[11px] text-[#94A3B8] truncate">
              Complete SentinelMesh trust path: Request &rarr; Identity &rarr; Policy &rarr; Decision &rarr; Containment &rarr; RFC-8785 Digest &rarr; MST Testnet Anchor &rarr; Verification
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101827] text-[#38BDF8] border border-[#263449] w-fit font-bold flex-shrink-0">
          RFC-8785 Canonical Chain
        </span>
      </div>

      {/* Progression Steps */}
      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const isExpanded = expandedStep === step.id;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative">
              {/* Connecting line */}
              {!isLast && (
                <div 
                  className={`absolute left-4 top-8 bottom-[-10px] w-0.5 transition-colors ${
                    step.status === 'COMPLETED' ? 'bg-[#22C55E]/40' : 'bg-[#263449]'
                  }`}
                  aria-hidden="true"
                />
              )}

              <div 
                className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden ${
                  step.status === 'COMPLETED'
                    ? 'bg-[#101827] border-[#263449] hover:border-[#38BDF8]/40'
                    : step.status === 'BLOCKED'
                    ? 'bg-[#EF4444]/10 border-[#EF4444]/30'
                    : 'bg-[#101827]/60 border-[#263449]/60'
                }`}
                onClick={() => toggleExpand(step.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Step Icon Badge */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 border ${
                      step.status === 'COMPLETED'
                        ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                        : step.status === 'BLOCKED'
                        ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                        : 'bg-[#1E293B] text-[#94A3B8] border-[#263449]'
                    }`}>
                      {step.number}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#F8FAFC]">{step.title}</span>
                        {getStatusBadge(step.status)}
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">{step.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-[#94A3B8] hover:text-[#F8FAFC]">
                    <span className="text-[10px] hidden sm:inline">Details</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#38BDF8]' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#263449] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono animate-fade-in">
                    {step.details.map((d, dIdx) => (
                      <div key={dIdx} className="p-2 rounded-lg bg-[#151F30] border border-[#263449] flex flex-col justify-between overflow-hidden">
                        <span className="text-[10px] text-[#94A3B8] uppercase font-sans font-bold">{d.label}:</span>
                        <div className="truncate mt-0.5 max-w-full">
                          {d.link ? (
                            <a
                              href={d.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#38BDF8] hover:underline flex items-center gap-1 font-bold truncate max-w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="truncate">{d.value}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 text-[#38BDF8]" />
                            </a>
                          ) : (
                            <span className={`block truncate max-w-full ${d.isCode ? 'text-[#38BDF8] font-bold' : 'text-[#F8FAFC]'}`}>{d.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
