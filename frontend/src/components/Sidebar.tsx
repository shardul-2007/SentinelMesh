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
import { useRBAC } from '@/lib/rbac';
import { BlockchainStatus } from '@/lib/types';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role, roleBadgeText, roleTitle, permissions } = useRBAC();
  const [chainStatus, setChainStatus] = useState<BlockchainStatus | null>(null);

  useEffect(() => {
    api.getBlockchainStatus()
      .then(setChainStatus)
      .catch(() => {});
  }, []);

  const networkLabel = chainStatus?.network_name || 'MST Testnet';
  const chainId = chainStatus?.detected_chain_id || chainStatus?.configured_chain_id || 91562037;
  const isConnected = chainStatus?.connected ?? false;

  // Role-customized navigation definitions matching RBAC Matrix
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Overview', href: '/', icon: LayoutDashboard, badge: 'Full Ops' },
          { name: 'Action Gateway', href: '/simulator', icon: PlayCircle, badge: 'Authorize' },
          { name: 'Policy Studio', href: '/policies', icon: Sliders, badge: 'Manage' },
          { name: 'Approval Queue', href: '/approvals', icon: CheckCircle2, badge: 'Decide' },
          { name: 'Audit Explorer', href: '/audit', icon: FileText, badge: 'All Logs' },
          { name: 'Integrity Center', href: '/integrity', icon: Lock, badge: 'Tamper Lab' },
          { name: 'Blockchain Activity', href: '/blockchain', icon: Boxes, badge: 'Anchor Tx' },
          { name: 'Threat Intelligence', href: '/threats', icon: ShieldAlert, badge: 'Resolve' },
          { name: 'Governance & Provenance', href: '/governance', icon: ShieldCheck, badge: 'Admin' },
          { name: 'Settings & Diagnostics', href: '/settings', icon: Settings, badge: 'Config' },
        ];
      case 'SECURITY_ANALYST':
        return [
          { name: 'Overview', href: '/', icon: LayoutDashboard, badge: 'Telemetry' },
          { name: 'Action Gateway', href: '/simulator', icon: PlayCircle, badge: 'Test Suite' },
          { name: 'Policy Studio', href: '/policies', icon: Sliders, badge: 'Read-Only' },
          { name: 'Approval Queue', href: '/approvals', icon: CheckCircle2, badge: 'View-Only' },
          { name: 'Audit Explorer', href: '/audit', icon: FileText, badge: 'Exportable' },
          { name: 'Integrity Center', href: '/integrity', icon: Lock, badge: 'Verify Hash' },
          { name: 'Blockchain Activity', href: '/blockchain', icon: Boxes, badge: 'Read-Back' },
          { name: 'Threat Intelligence', href: '/threats', icon: ShieldAlert, badge: 'Investigate' },
          { name: 'Governance & Provenance', href: '/governance', icon: ShieldCheck, badge: 'Provenance' },
          { name: 'Settings & Diagnostics', href: '/settings', icon: Settings, badge: 'Diagnostics' },
        ];
      case 'VIEWER':
      default:
        return [
          { name: 'Overview', href: '/', icon: LayoutDashboard, badge: 'Auditor' },
          { name: 'Action Gateway', href: '/simulator', icon: PlayCircle, badge: 'Audit Mode' },
          { name: 'Policy Studio', href: '/policies', icon: Sliders, badge: 'Catalog' },
          { name: 'Approval Queue', href: '/approvals', icon: CheckCircle2, badge: 'Audit Log' },
          { name: 'Audit Explorer', href: '/audit', icon: FileText, badge: 'Evidence' },
          { name: 'Integrity Center', href: '/integrity', icon: Lock, badge: 'Checks' },
          { name: 'Blockchain Activity', href: '/blockchain', icon: Boxes, badge: 'Proofs' },
          { name: 'Threat Intelligence', href: '/threats', icon: ShieldAlert, badge: 'View-Only' },
          { name: 'Governance & Provenance', href: '/governance', icon: ShieldCheck, badge: 'Assurance' },
          { name: 'Settings & Diagnostics', href: '/settings', icon: Settings, badge: 'Status' },
        ];
    }
  };

  const navItems = getNavItems();

  const content = (
    <div className="w-64 bg-[#131A24] text-[#F8FAFC] flex flex-col flex-shrink-0 min-h-screen border-r border-[#263244] select-none">
      {/* Brand & Identity */}
      <div className="p-4 border-b border-[#263244] flex items-center justify-between bg-[#0B0F17]/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#F8FAFC] flex items-center gap-1.5 font-sans">
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

      {/* Active Role Session Banner */}
      <div className="px-3.5 py-2.5 border-b border-[#263244] bg-[#070A12]/80">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
          <span className="text-[#94A3B8] uppercase font-semibold">RBAC Session</span>
          <span className={`px-2 py-0.5 rounded font-bold border ${
            role === 'ADMIN'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : role === 'SECURITY_ANALYST'
              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {role === 'ADMIN' ? 'CSO (ADMIN)' : role === 'SECURITY_ANALYST' ? 'ANALYST' : 'AUDITOR'}
          </span>
        </div>
        <p className="text-[11px] text-[#F8FAFC] font-medium truncate">{roleTitle}</p>
        <p className="text-[9.5px] text-[#94A3B8] mt-0.5 leading-tight">
          {role === 'ADMIN' ? 'Full administrative authority' : role === 'SECURITY_ANALYST' ? 'Investigation & verification' : 'Read-only compliance audit'}
        </p>
      </div>

      {/* Network Badge */}
      <div className="px-4 py-2 border-b border-[#263244] bg-[#0B0F17]/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider font-semibold">MST Chain</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
            isConnected
              ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
              : 'bg-[#1A2332] text-[#94A3B8] border-[#263244]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#64748B]'}`}></span>
            {networkLabel}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent text-cyan-300 font-bold border-l-2 border-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.12)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2332] hover:translate-x-1 hover:border-l-2 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-[#94A3B8] group-hover:text-cyan-300'}`} />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border hidden sm:inline-block ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-black/30 text-slate-400 border-slate-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse ml-0.5" />}
              </div>
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
