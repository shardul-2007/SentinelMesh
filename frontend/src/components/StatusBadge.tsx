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
  const sizeClasses = isSm ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  if (type === 'decision') {
    switch (value as PolicyDecision) {
      case 'ALLOW':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
            <ShieldCheck className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} />
            ALLOW
          </span>
        );
      case 'BLOCK':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} />
            BLOCK
          </span>
        );
      case 'REQUIRE_APPROVAL':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
            <AlertTriangle className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} />
            REQUIRE APPROVAL
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  if (type === 'execution') {
    switch (value as ExecutionStatus) {
      case 'EXECUTED_SIMULATED':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 ${sizeClasses}`}>
            <CheckCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            SIMULATED EXEC
          </span>
        );
      case 'BLOCKED':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60 ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            NOT EXECUTED
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 ${sizeClasses}`}>
            <Clock className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            PENDING APPROVAL
          </span>
        );
      case 'APPROVED_SIMULATED':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/60 ${sizeClasses}`}>
            <CheckCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            APPROVED (SIMULATED)
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-900 text-slate-400 border border-slate-700 ${sizeClasses}`}>
            <XCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            REJECTED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  // Risk badges
  switch (value as RiskTier) {
    case 'LOW':
      return (
        <span className={`inline-flex items-center font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          LOW RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center font-medium rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          MEDIUM RISK
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center font-medium rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 ${sizeClasses}`}>
          HIGH RISK
        </span>
      );
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center font-medium rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
          CRITICAL RISK
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
          {value}
        </span>
      );
  }
}
