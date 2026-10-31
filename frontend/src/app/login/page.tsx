'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useRBAC } from '@/lib/rbac';

export default function LoginPage() {
  const router = useRouter();
  const { role, switchRole, roleBadgeText } = useRBAC();
  const [selectedRole, setSelectedRole] = useState(role);
  const [successMsg, setSuccessMsg] = useState(false);

  const roles = [
    {
      id: 'CSO',
      title: 'Chief Security Officer (ADMIN)',
      desc: 'Full administrative authority: author and toggle policies, approve pending executions, anchor evidence to MST blockchain, resolve security incidents.',
      badge: 'ADMIN',
      badgeColor: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30'
    },
    {
      id: 'SECURITY_ANALYST',
      title: 'Senior Security Analyst',
      desc: 'Investigative authority: inspect RFC 8785 canonical evidence, verify digests, analyze behavioral telemetry, run threat simulations.',
      badge: 'ANALYST',
      badgeColor: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30'
    },
    {
      id: 'COMPLIANCE_AUDITOR',
      title: 'Compliance Auditor',
      desc: 'Audit authority: verify on-chain smart contract commitments, export cryptographically signed audit logs, inspect governance provenance.',
      badge: 'AUDITOR',
      badgeColor: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30'
    },
    {
      id: 'VIEWER',
      title: 'Read-Only Viewer',
      desc: 'Observation access: view public dashboards, telemetry streams, and operational health status.',
      badge: 'READ-ONLY',
      badgeColor: 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/30'
    }
  ];

  const handleSelectRole = (rId: string) => {
    setSelectedRole(rId as any);
    switchRole(rId as any);
    setSuccessMsg(true);
    setTimeout(() => {
      router.push('/');
    }, 800);
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 text-[#2563EB] mx-auto flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#172033]">
            Select RBAC Access Session
          </h1>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Choose an authorized governance persona to test role-based permissions across policy authoring, approvals, and blockchain anchoring.
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-[#15803D]/10 border border-[#15803D]/20 text-[#15803D] rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Session updated successfully. Redirecting to executive dashboard...
          </div>
        )}

        <div className="space-y-3">
          {roles.map((r) => {
            const isCurrent = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r.id)}
                className={`w-full text-left p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                  isCurrent 
                    ? 'bg-[#FFFFFF] border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-sm' 
                    : 'bg-[#FFFFFF] border-[#E5E7EB] hover:border-[#2563EB]/50 hover:bg-[#F7F8FA]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#172033]">{r.title}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{r.desc}</p>
                </div>

                <div className="flex-shrink-0 pt-1">
                  {isCurrent ? (
                    <span className="text-xs font-bold text-[#2563EB] flex items-center gap-1">
                      Active
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#64748B] hover:text-[#2563EB]">
                      Switch
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
