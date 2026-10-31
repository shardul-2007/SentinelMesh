'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Key, 
  FileCheck2, 
  EyeOff, 
  Server, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Header } from '@/components/Header';

export default function SecurityPage() {
  const securityPillars = [
    {
      title: 'Zero Private Data On-Chain',
      desc: 'No personal identification, customer credentials, private keys, or API tokens are ever anchored on the public ledger. Only 32-byte SHA-256 digests of RFC 8785 canonical metadata are committed.',
      icon: EyeOff
    },
    {
      title: 'Deterministic Policy Enforcement',
      desc: 'Security decisions (ALLOW, BLOCK, REQUIRE_APPROVAL) are evaluated strictly server-side using immutable policies (POL-A through POL-G). Client-supplied risk claims are ignored.',
      icon: Lock
    },
    {
      title: 'Cryptographic Provenance',
      desc: 'Audit events are chained using cryptographic SHA-256 links, preventing retroactive log alteration, deletion, or event injection.',
      icon: FileCheck2
    },
    {
      title: 'Multi-Factor Human Authorization',
      desc: 'Destructive mutations, large financial payouts, and bulk data exports are automatically paused in an isolated approval center until explicit verification.',
      icon: Key
    },
    {
      title: 'MST Testnet Transparency',
      desc: 'Smart contract commitments on MST Testnet (Chain ID 91562037, contract 0x0539fc...ceca) allow external auditors to verify compliance without accessing proprietary databases.',
      icon: Server
    },
    {
      title: 'PayPal Sandbox Gating',
      desc: 'Financial payments through the PayPal Developer Platform are evaluated before order creation. Unapproved transfers cannot invoke capture endpoints.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="flex-1 bg-[#F7F8FA] min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3 py-1 bg-[#15803D]/10 text-[#15803D] rounded-full text-xs font-bold uppercase tracking-wider">
            Security & Compliance Disclosure
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            Enterprise Security Architecture
          </h1>
          <p className="text-base text-[#64748B]">
            How SentinelMesh upholds the highest standards of data privacy, zero-trust enforcement, and tamper-evident auditability.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((p, idx) => (
            <div key={idx} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-6 shadow-sm space-y-3">
              <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] w-fit">
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">{p.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Responsible Disclosure & Mainnet Boundary */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            MST Mainnet Boundary & Scope Limitations
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            SentinelMesh is deployed and verified on <strong>MST Testnet (Chain ID 91562037)</strong>. MST Mainnet deployment remains strictly marked as <strong>NOT YET DEPLOYED</strong> pending formal third-party smart contract audits, security governance sign-off, and treasury funding.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
            <Link href="/blockchain" className="hover:underline flex items-center gap-1">
              Inspect MST Testnet contract bytecode (3,999 bytes) &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
