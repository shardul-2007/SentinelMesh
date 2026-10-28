'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Boxes
} from 'lucide-react';
import { api } from '@/lib/api';
import { BlockchainStatus } from '@/lib/types';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Action Gateway', href: '/simulator', icon: PlayCircle },
  { name: 'Policy Studio', href: '/policies', icon: Sliders },
  { name: 'Approval Queue', href: '/approvals', icon: CheckCircle2 },
  { name: 'Audit Explorer', href: '/audit', icon: FileText },
  { name: 'Integrity Center', href: '/integrity', icon: Lock },
  { name: 'Blockchain Activity', href: '/blockchain', icon: Boxes },
  { name: 'Threat Intelligence', href: '/threats', icon: ShieldAlert },
  { name: 'Governance & Provenance', href: '/governance', icon: ShieldCheck },
  { name: 'Settings & Health', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [chainStatus, setChainStatus] = useState<BlockchainStatus | null>(null);

  useEffect(() => {
    api.getBlockchainStatus()
      .then(setChainStatus)
      .catch(() => {});
  }, []);

  const networkLabel = chainStatus?.network_name || 'MST Testnet';
  const chainId = chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037;
  const isConnected = chainStatus?.connected ?? false;

  return (
    <aside className="w-64 bg-graphite-900 border-r border-graphite-700/60 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand & Identity */}
      <div className="p-5 border-b border-graphite-700/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-400">
          <Shield className="w-5 h-5 text-[#82B5F8]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-[#E9EFF7] flex items-center gap-1.5">
            SentinelMesh
          </h1>
          <p className="text-[11px] text-[#A2AFBE] font-medium">Trust, Without Blind Faith</p>
        </div>
      </div>

      {/* Network Badge */}
      <div className="px-5 py-3 border-b border-graphite-700/40 bg-graphite-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#A2AFBE] text-[11px] uppercase tracking-wider font-semibold">Network</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
            isConnected
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              : 'bg-graphite-800 text-[#A2AFBE] border-graphite-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            {networkLabel} ({chainId})
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
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#202B38] text-[#82B5F8] border border-blue-500/20'
                  : 'text-[#A2AFBE] hover:text-[#E9EFF7] hover:bg-[#19222D]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#82B5F8]' : 'text-[#A2AFBE]'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#82B5F8]" />}
            </Link>
          );
        })}
      </nav>

      {/* Cryptographic Trust Anchor Callout */}
      <div className="p-3.5 m-3 rounded-lg bg-[#19222D] border border-graphite-700/60 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#82B5F8]">
          <Lock className="w-3.5 h-3.5" />
          <span>MST Blockchain Anchor</span>
        </div>
        <p className="text-[11px] text-[#A2AFBE] leading-relaxed">
          Tamper-evident verification comparing local SHA-256 state with MST contract commitment.
        </p>
        <Link 
          href="/blockchain"
          className="inline-flex items-center gap-1 text-[11px] text-[#82B5F8] hover:underline transition pt-0.5 font-medium"
        >
          <span>View On-Chain Activity</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-graphite-700/60 text-[11px] text-[#A2AFBE] flex items-center justify-between">
        <span>SentinelMesh Security</span>
        <span className="font-mono text-[10px] text-slate-400">MST Evidence v1</span>
      </div>
    </aside>
  );
}
