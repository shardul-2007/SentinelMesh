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
          <span className={`inline-flex items-center gap-1 font-semibold rounded font-mono bg-[#EDF6F2] text-[#287653] border border-[#BCE2D1] ${sizeClasses}`}>
            <ShieldCheck className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            ALLOW
          </span>
        );
      case 'BLOCK':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded font-mono bg-[#FDF2F2] text-[#B53A3A] border border-[#F7C4C4] ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            BLOCK
          </span>
        );
      case 'REQUIRE_APPROVAL':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded font-mono bg-[#FDF7ED] text-[#98661C] border border-[#F5DEB3] ${sizeClasses}`}>
            <AlertTriangle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            REQUIRE_APPROVAL
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded font-mono bg-[#F5F4F0] text-[#737B86] border border-[#D9DDE2] ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  if (type === 'execution') {
    switch (value as ExecutionStatus) {
      case 'EXECUTED_SIMULATED':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded font-mono bg-[#EDF6F2] text-[#287653] border border-[#BCE2D1] ${sizeClasses}`}>
            <CheckCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            EXECUTED (ISOLATED)
          </span>
        );
      case 'BLOCKED':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded font-mono bg-[#FDF2F2] text-[#B53A3A] border border-[#F7C4C4] ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            NOT EXECUTED
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded font-mono bg-[#FDF7ED] text-[#98661C] border border-[#F5DEB3] ${sizeClasses}`}>
            <Clock className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            PENDING APPROVAL
          </span>
        );
      case 'APPROVED_SIMULATED':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded font-mono bg-[#EBF2F7] text-[#315C78] border border-[#C5D7E3] ${sizeClasses}`}>
            <CheckCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            APPROVED (ISOLATED)
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded font-mono bg-[#F5F4F0] text-[#737B86] border border-[#D9DDE2] ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            REJECTED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center font-medium rounded font-mono bg-[#F5F4F0] text-[#737B86] border border-[#D9DDE2] ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  // Risk badges
  switch (value as RiskTier) {
    case 'LOW':
      return (
        <span className={`inline-flex items-center font-semibold rounded font-mono bg-[#EDF6F2] text-[#287653] border border-[#BCE2D1] ${sizeClasses}`}>
          LOW RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center font-semibold rounded font-mono bg-[#FDF7ED] text-[#98661C] border border-[#F5DEB3] ${sizeClasses}`}>
          MEDIUM RISK
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center font-semibold rounded font-mono bg-[#FDF2F2] text-[#B53A3A] border border-[#F7C4C4] ${sizeClasses}`}>
          HIGH RISK
        </span>
      );
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center font-semibold rounded font-mono bg-[#B53A3A] text-[#FFFFFF] border border-[#8C2323] ${sizeClasses}`}>
          CRITICAL RISK
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded font-mono bg-[#F5F4F0] text-[#737B86] border border-[#D9DDE2] ${sizeClasses}`}>
          {value}
        </span>
      );
  }
}
