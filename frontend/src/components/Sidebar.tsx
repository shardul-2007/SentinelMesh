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
    <div className="w-64 bg-[#171A1F] text-[#F5F4F0] flex flex-col flex-shrink-0 min-h-screen border-r border-[#242A32] select-none">
      {/* Brand & Identity */}
      <div className="p-4 border-b border-[#242A32] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#242A32] border border-[#315C78]/40 flex items-center justify-center text-[#315C78]">
            <Shield className="w-4 h-4 text-[#82B5F8]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#FFFFFF] flex items-center gap-1.5 font-sans">
              SentinelMesh
            </h1>
            <p className="text-[10px] text-[#737B86] font-medium tracking-wide">Trust, Without Blind Faith</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded text-[#737B86] hover:text-[#FFFFFF] hover:bg-[#242A32] transition"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Network Badge */}
      <div className="px-4 py-2.5 border-b border-[#242A32] bg-[#1D2228]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#737B86] text-[10px] uppercase tracking-wider font-semibold">Ledger</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
            isConnected
              ? 'bg-[#182C22] text-[#34D399] border-[#204E38]'
              : 'bg-[#242A32] text-[#8E96A2] border-[#3D4552]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#34D399] animate-pulse' : 'bg-[#737B86]'}`}></span>
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
              className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#242A32] text-[#FFFFFF] font-semibold border-l-2 border-[#315C78]'
                  : 'text-[#8E96A2] hover:text-[#FFFFFF] hover:bg-[#1D2228]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#82B5F8]' : 'text-[#737B86]'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#82B5F8]" />}
            </Link>
          );
        })}
      </nav>

      {/* Cryptographic Trust Anchor Callout */}
      <div className="p-3 m-2.5 rounded bg-[#242A32] border border-[#2E353F] space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#82B5F8]">
          <Lock className="w-3.5 h-3.5" />
          <span>MST Blockchain Anchor</span>
        </div>
        <p className="text-[10px] text-[#737B86] leading-relaxed">
          Deterministic SHA-256 evidence digests anchored immutably in MST EvidenceRegistry.
        </p>
        <Link 
          href="/blockchain"
          onClick={() => onClose && onClose()}
          className="inline-flex items-center gap-1 text-[11px] text-[#82B5F8] hover:underline transition pt-0.5 font-medium"
        >
          <span>View On-Chain Activity</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#242A32] text-[10px] text-[#737B86] flex items-center justify-between">
        <span>SentinelMesh v2.4</span>
        <span className="font-mono text-[10px] text-[#8E96A2]">MST Evidence</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Sidebar (Hidden on mobile/tablet) */}
      <aside className="hidden lg:flex flex-shrink-0">
        {content}
      </aside>

      {/* Mobile / Tablet Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#171A1F] z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
