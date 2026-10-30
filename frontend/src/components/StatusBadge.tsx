import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, XCircle, CheckCircle } from 'lucide-react';
import { PolicyDecision, ExecutionStatus, RiskTier } from '@/lib/types';

interface StatusBadgeProps {
  type: 'decision' | 'execution' | 'risk';
  value: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ type, value, size = 'sm' }: StatusBadgeProps) {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (type === 'decision') {
    switch (value as PolicyDecision) {
      case 'ALLOW':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 ${sizeClasses}`}>
            <ShieldCheck className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            ALLOW
          </span>
        );
      case 'BLOCK':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            BLOCK
          </span>
        );
      case 'REQUIRE_APPROVAL':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 ${sizeClasses}`}>
            <AlertTriangle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            REQUIRE_APPROVAL
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded font-mono bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A] ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  if (type === 'execution') {
    switch (value as ExecutionStatus) {
      case 'EXECUTED_SIMULATED':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 ${sizeClasses}`}>
            <CheckCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            EXECUTED (GATEWAY)
          </span>
        );
      case 'BLOCKED':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            HALTED (BLOCKED)
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 ${sizeClasses}`}>
            <Clock className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            PENDING APPROVAL
          </span>
        );
      case 'APPROVED_SIMULATED':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 ${sizeClasses}`}>
            <CheckCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            AUTHORIZED &amp; EXECUTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded font-mono bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46] ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            REJECTED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center font-medium rounded font-mono bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A] ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  // Risk badges
  switch (value as RiskTier) {
    case 'LOW':
      return (
        <span className={`inline-flex items-center font-bold rounded font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 ${sizeClasses}`}>
          LOW RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center font-bold rounded font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 ${sizeClasses}`}>
          MEDIUM RISK
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center font-bold rounded font-mono bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30 ${sizeClasses}`}>
          HIGH RISK
        </span>
      );
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center font-bold rounded font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 ${sizeClasses}`}>
          CRITICAL RISK
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded font-mono bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A] ${sizeClasses}`}>
          {value}
        </span>
      );
  }
}
