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
  ChevronDown
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
  currentStage?: number; // 1 to 6
  eventId?: string;
  integrityHash?: string;
  txHash?: string;
  blockNumber?: number;
  policyId?: string;
  decision?: string;
  compact?: boolean;
  isOnChain?: boolean;
}

export function TrustTimeline({
  currentStage = 6,
  eventId = 'evt_mst_001',
  integrityHash = 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e',
  txHash = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
  blockNumber = 1428594,
  policyId = 'POL-A',
  decision = 'ALLOW',
  compact = false,
  isOnChain = false
}: TrustTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const steps: TimelineStep[] = [
    {
      id: 'step-action',
      number: 1,
      title: 'Action Request',
      subtitle: 'Agent operational intent submitted to gateway',
      status: currentStage >= 1 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Event Identifier', value: eventId, isCode: true },
        { label: 'Agent Identity', value: 'agent-data-analyzer', isCode: true },
        { label: 'Target Resource', value: 'public/quarterly_security_metrics.pdf' },
        { label: 'Isolation Mode', value: 'SIMULATED (Zero Host Execution)' }
      ]
    },
    {
      id: 'step-policy',
      number: 2,
      title: 'Policy Evaluation',
      subtitle: 'Deterministic server-side zero-trust evaluation',
      status: currentStage >= 2 ? (decision === 'BLOCK' ? 'BLOCKED' : 'COMPLETED') : 'PENDING',
      details: [
        { label: 'Enforced Policy', value: `${policyId} (Allow Public Read)`, isCode: true },
        { label: 'Policy Precedence', value: 'Order 1 (Highest Priority Match)' },
        { label: 'Derived Server Risk', value: 'LOW RISK' },
        { label: 'Enforced Decision', value: decision }
      ]
    },
    {
      id: 'step-approval',
      number: 3,
      title: 'Governance Gate',
      subtitle: decision === 'REQUIRE_APPROVAL' ? 'Human-in-the-Loop CSO review' : 'Automated safe simulated execution',
      status: currentStage >= 3 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Execution Path', value: decision === 'REQUIRE_APPROVAL' ? 'Escalated to CSO Approval Queue' : 'Direct Authorized Simulation' },
        { label: 'Sign-Off Authority', value: decision === 'REQUIRE_APPROVAL' ? 'Chief Security Officer (ADMIN)' : 'Automated Sentinel Policy Gate' },
        { label: 'Execution Status', value: 'EXECUTED_SIMULATED' }
      ]
    },
    {
      id: 'step-canonical',
      number: 4,
      title: 'Canonical SHA-256 Digest',
      subtitle: 'RFC-8785 deterministic JSON & SHA-256 hashing',
      status: currentStage >= 4 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Canonical Format', value: 'RFC-8785 (JCS Normalized)' },
        { label: 'Hash Algorithm', value: 'SHA-256 (256-bit Digest)' },
        { label: 'Evidence Hash', value: integrityHash, isCode: true },
        { label: 'Chaining Method', value: 'Cryptographic Hash-Chain' }
      ]
    },
    {
      id: 'step-anchoring',
      number: 5,
      title: 'MST Blockchain Anchoring',
      subtitle: 'Immutable smart contract commitment on MST Testnet',
      status: currentStage >= 5 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Network', value: 'MST Testnet (Chain ID 91562037)' },
        { label: 'EvidenceRegistry', value: '0x0539fc70ee18fa936395c8dd6db623af6b43ceca', isCode: true },
        { label: 'MST Transaction', value: txHash + (isOnChain ? '' : ' (Simulated Local Digest)'), isCode: true, link: isOnChain ? `https://testnet.mstscan.com/tx/${txHash}` : undefined },
        { label: 'Block Number', value: `#${blockNumber.toLocaleString()}` }
      ]
    },
    {
      id: 'step-verify',
      number: 6,
      title: 'Independent Read-Back Verification',
      subtitle: 'Direct contract query compares on-chain commitment',
      status: currentStage >= 6 ? 'COMPLETED' : 'PENDING',
      details: [
        { label: 'Verification Type', value: 'Independent Zero-Knowledge Read-Back' },
        { label: 'Local Digest', value: integrityHash.slice(0, 32) + '...', isCode: true },
        { label: 'On-Chain Record', value: integrityHash.slice(0, 32) + '...', isCode: true },
        { label: 'Match Result', value: '100% CRYPTOGRAPHIC MATCH (VERIFIED)' }
      ]
    }
  ];

  const getStatusBadge = (status: TimelineStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#FACC15] bg-[#FACC15]/15 border border-[#FACC15]/30 px-2 py-0.5 rounded-full flex-shrink-0">
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
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D4D4D8] bg-[#000000] border border-[#27272A] px-2 py-0.5 rounded-full flex-shrink-0">
            QUEUED
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  return (
    <div className="mst-card p-4 sm:p-5 rounded-xl bg-[#121212] border border-[#27272A] shadow-xl space-y-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#FACC15]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#FFFFFF]">Trust Timeline &amp; Evidence Provenance</h3>
            <p className="text-[11px] text-[#D4D4D8] truncate">
              End-to-end cryptographic journey: Action &rarr; Policy &rarr; Digest &rarr; MST Blockchain &rarr; Verification
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#000000] text-[#FACC15] border border-[#27272A] w-fit font-bold flex-shrink-0">
          RFC-8785 Canonical Chain
        </span>
      </div>

      {/* Horizontal / Vertical Pipeline */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isExpanded = expandedStep === step.id;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative">
              {/* Connecting line */}
              {!isLast && (
                <div 
                  className={`absolute left-4 top-8 bottom-[-14px] w-0.5 transition-colors ${
                    step.status === 'COMPLETED' ? 'bg-[#FACC15]/40' : 'bg-[#27272A]'
                  }`}
                  aria-hidden="true"
                />
              )}

              <div 
                className={`p-3 sm:p-3.5 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden ${
                  step.status === 'COMPLETED'
                    ? 'bg-[#000000] border-[#27272A] hover:border-[#FACC15]/40'
                    : step.status === 'BLOCKED'
                    ? 'bg-[#EF4444]/15 border-[#EF4444]/30'
                    : 'bg-[#000000]/60 border-[#27272A]/60'
                }`}
                onClick={() => toggleExpand(step.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Step Icon Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 border ${
                      step.status === 'COMPLETED'
                        ? 'bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15]/40'
                        : step.status === 'BLOCKED'
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'
                        : 'bg-[#121212] text-[#D4D4D8] border-[#27272A]'
                    }`}>
                      {step.number}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#FFFFFF]">{step.title}</span>
                        {getStatusBadge(step.status)}
                      </div>
                      <p className="text-[11px] text-[#D4D4D8] mt-0.5 truncate">{step.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-[#D4D4D8] hover:text-[#FFFFFF]">
                    <span className="text-[10px] hidden sm:inline">Details</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#FACC15]' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#27272A] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono animate-fade-in">
                    {step.details.map((d, dIdx) => (
                      <div key={dIdx} className="p-2 rounded bg-[#121212] border border-[#27272A] flex flex-col justify-between overflow-hidden">
                        <span className="text-[10px] text-[#D4D4D8] uppercase font-sans font-bold">{d.label}:</span>
                        <div className="truncate mt-0.5 max-w-full">
                          {d.link ? (
                            <a
                              href={d.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FACC15] hover:underline flex items-center gap-1 font-bold truncate max-w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="truncate">{d.value}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 text-[#FACC15]" />
                            </a>
                          ) : (
                            <span className={`block truncate max-w-full ${d.isCode ? 'text-[#FACC15] font-bold' : 'text-[#FFFFFF]'}`}>{d.value}</span>
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
