'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  LayoutDashboard, 
  PlayCircle, 
  FileText, 
  Sliders, 
  Settings,
  CheckCircle2,
  Lock,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Action Simulator', href: '/simulator', icon: PlayCircle },
  { name: 'Audit Trail', href: '/audit', icon: FileText },
  { name: 'Integrity Center', href: '/integrity', icon: Lock },
  { name: 'Threat Intelligence', href: '/threats', icon: ShieldAlert },
  { name: 'Governance & Provenance', href: '/governance', icon: ShieldCheck },
  { name: 'Approval Center', href: '/approvals', icon: CheckCircle2 },
  { name: 'Policies', href: '/policies', icon: Sliders },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-graphite-900 border-r border-graphite-750 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand & Identity */}
      <div className="p-5 border-b border-graphite-750 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-slate-100 flex items-center gap-1.5">
            SentinelMesh
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Trust, Without Blind Faith</p>
        </div>
      </div>

      {/* Environment Indicator */}
      <div className="px-5 py-3 border-b border-graphite-750/60 bg-graphite-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Environment</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LOCAL DEV
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-graphite-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Cryptographic Trust Anchor Callout */}
      <div className="p-4 m-3 rounded-xl bg-graphite-850/80 border border-graphite-750 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Lock className="w-3.5 h-3.5" />
          <span>EVM Cryptographic Anchor</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Tamper-evident verification comparing local SHA-256 state with smart contract storage.
        </p>
        <Link 
          href="/integrity"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition pt-1 font-medium"
        >
          <span>Open Integrity Center</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-graphite-750/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>SentinelMesh v2.5.0</span>
        <span className="font-mono text-slate-400">Phase 5</span>
      </div>
    </aside>
  );
}
