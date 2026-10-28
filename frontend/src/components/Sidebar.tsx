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
  Boxes,
  X
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
  { name: 'Settings & Diagnostics', href: '/settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
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

  const content = (
    <div className="w-64 bg-[#131A24] text-[#F8FAFC] flex flex-col flex-shrink-0 min-h-screen border-r border-[#263244] select-none">
      {/* Brand & Identity */}
      <div className="p-4 border-b border-[#263244] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <Shield className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#F8FAFC] flex items-center gap-1.5 font-sans">
              SentinelMesh
            </h1>
            <p className="text-[10px] text-[#94A3B8] font-medium tracking-wide">Trust, Without Blind Faith</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2332] transition"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Network Badge */}
      <div className="px-4 py-2.5 border-b border-[#263244] bg-[#0B0F17]/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider font-semibold">Ledger Node</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
            isConnected
              ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
              : 'bg-[#1A2332] text-[#94A3B8] border-[#263244]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#64748B]'}`}></span>
            {networkLabel} ({chainId})
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#38BDF8]/10 text-[#38BDF8] font-semibold border-l-2 border-[#38BDF8]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2332]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#38BDF8]" />}
            </Link>
          );
        })}
      </nav>

      {/* Cryptographic Trust Anchor Callout */}
      <div className="p-3 m-2.5 rounded-lg bg-[#0B0F17] border border-[#263244] space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8]">
          <Lock className="w-3.5 h-3.5" />
          <span>MST Blockchain Anchor</span>
        </div>
        <p className="text-[10px] text-[#94A3B8] leading-relaxed">
          Deterministic SHA-256 evidence digests anchored immutably in MST EvidenceRegistry.
        </p>
        <Link 
          href="/blockchain"
          onClick={() => onClose && onClose()}
          className="inline-flex items-center gap-1 text-[11px] text-[#38BDF8] hover:underline transition pt-0.5 font-medium"
        >
          <span>View On-Chain Activity</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#263244] text-[10px] text-[#94A3B8] flex items-center justify-between bg-[#0B0F17]/40">
        <span>SentinelMesh v2.4</span>
        <span className="font-mono text-[10px] text-[#38BDF8]">MST Evidence</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#131A24] z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
