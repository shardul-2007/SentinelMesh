'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  LayoutDashboard, 
  PlayCircle, 
  Sliders, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Boxes, 
  Settings,
  ChevronRight, 
  ExternalLink,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRBAC } from '@/lib/rbac';
import { BlockchainStatus } from '@/lib/types';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ 
  mobileOpen = false, 
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const { role, roleTitle } = useRBAC();
  const [chainStatus, setChainStatus] = useState<BlockchainStatus | null>(null);

  useEffect(() => {
    api.getBlockchainStatus()
      .then(setChainStatus)
      .catch(() => {});
  }, []);

  const networkLabel = chainStatus?.network_name || 'MST Testnet';
  const isConnected = chainStatus?.connected ?? true;

  // Exactly 8 items per design specification (Section 9)
  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard, badge: 'Gateway' },
    { name: 'Agent Simulator', href: '/simulator', icon: PlayCircle, badge: 'Evaluate' },
    { name: 'Policies', href: '/policies', icon: Sliders, badge: 'Rules' },
    { name: 'Approvals', href: '/approvals', icon: CheckCircle2, badge: 'Review' },
    { name: 'Audit Explorer', href: '/audit', icon: FileText, badge: 'Ledger' },
    { name: 'Evidence Verification', href: '/integrity', icon: Lock, badge: 'RFC-8785' },
    { name: 'Blockchain Explorer', href: '/blockchain', icon: Boxes, badge: 'MST Chain' },
    { name: 'Settings', href: '/settings', icon: Settings, badge: 'Config' },
  ];

  const renderContent = (collapsed: boolean) => (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-[#101827] text-[#F8FAFC] flex flex-col flex-shrink-0 min-h-screen border-r border-[#263449] select-none transition-all duration-300 font-sans`}>
      {/* Brand & Identity Header */}
      <div className={`p-3.5 border-b border-[#263449] flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'} bg-[#101827]`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] flex-shrink-0">
            <Shield className="w-4 h-4 text-[#38BDF8]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight text-[#F8FAFC] font-sans truncate">
                SentinelMesh
              </h1>
              <p className="text-[10px] text-[#94A3B8] font-medium tracking-wide truncate">
                Verifiable Security for AI
              </p>
            </div>
          )}
        </div>

        {/* When collapsed: prominent Maximize button right at top */}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-lg bg-[#1E293B] text-[#38BDF8] hover:bg-[#151F30] border border-[#263449] hover:border-[#38BDF8]/50 flex items-center justify-center transition shadow-sm active:scale-95"
            title="Expand navigation menu"
            aria-label="Expand navigation menu"
          >
            <PanelLeftOpen className="w-4 h-4 text-[#38BDF8]" />
          </button>
        )}

        {/* When expanded: Minimize button at top right */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1E293B] hover:bg-[#151F30] border border-[#263449] hover:border-[#38BDF8]/40 transition active:scale-95"
                title="Minimize sidebar"
                aria-label="Minimize sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Minimize</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Role Session Badge */}
      {!collapsed ? (
        <div className="px-3.5 py-2.5 border-b border-[#263449] bg-[#090D16]">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-[#94A3B8] uppercase font-bold">RBAC Session</span>
            <span className={`px-2 py-0.5 rounded font-bold border ${
              role === 'ADMIN'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                : 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
            }`}>
              {role === 'ADMIN' ? 'CSO (ADMIN)' : role === 'SECURITY_ANALYST' ? 'ANALYST' : 'AUDITOR'}
            </span>
          </div>
          <p className="text-[11px] text-[#F8FAFC] font-semibold truncate">{roleTitle}</p>
        </div>
      ) : (
        <div className="py-2.5 border-b border-[#263449] bg-[#090D16] flex justify-center" title={`RBAC Role: ${roleTitle}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${
            role === 'ADMIN' ? 'bg-[#F59E0B]' : role === 'SECURITY_ANALYST' ? 'bg-[#EF4444]' : 'bg-[#38BDF8]'
          }`}></span>
        </div>
      )}

      {/* Network Badge */}
      {!collapsed ? (
        <div className="px-3.5 py-2 border-b border-[#263449] bg-[#101827]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider font-bold">MST Chain</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isConnected
                ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40'
                : 'bg-[#1E293B] text-[#94A3B8] border-[#263449]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-[#64748B]'}`}></span>
              {networkLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-2 border-b border-[#263449] bg-[#101827] flex justify-center" title={`MST Network: ${networkLabel}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-slate-500'}`}></span>
        </div>
      )}

      {/* 8 Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              title={collapsed ? `${item.name} (${item.badge})` : undefined}
              className={`flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'} rounded-lg text-xs font-semibold transition-all duration-150 group min-h-[42px] ${
                isActive
                  ? 'bg-[#151F30] text-[#38BDF8] border-l-2 border-[#38BDF8] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8] group-hover:text-[#F8FAFC]'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
                        : 'bg-[#1E293B] text-[#94A3B8] border-[#263449]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#38BDF8] ml-0.5" />}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Trust Anchor Callout */}
      {!collapsed && (
        <div className="p-3 m-2.5 rounded-xl bg-[#151F30] border border-[#263449] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#38BDF8]">
            <Lock className="w-3.5 h-3.5" />
            <span>MST Blockchain Anchor</span>
          </div>
          <p className="text-[10px] text-[#94A3B8] leading-relaxed">
            Deterministic SHA-256 evidence digests anchored immutably in MST EvidenceRegistry.
          </p>
          <Link 
            href="/blockchain"
            onClick={() => onClose && onClose()}
            className="inline-flex items-center gap-1 text-[11px] text-[#38BDF8] hover:underline transition pt-0.5 font-bold"
          >
            <span>View On-Chain Activity</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Collapse/Expand Toggle Button (Desktop Only) */}
      <div className="p-2 border-t border-[#263449] hidden lg:flex items-center justify-between bg-[#090D16]">
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-[#263449] hover:border-[#38BDF8]/40 transition"
          >
            <span>Minimize Sidebar</span>
            <PanelLeftClose className="w-4 h-4 text-[#38BDF8]" />
          </button>
        )}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-[#1E293B] text-[#38BDF8] border border-[#263449] hover:border-[#38BDF8]/50 transition"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-[#263449] text-[10px] text-[#94A3B8] flex items-center justify-between bg-[#101827]">
          <span className="font-semibold">SentinelMesh v2.5</span>
          <span className="font-mono text-[10px] font-bold text-[#22C55E]">MST Verified</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        {renderContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-label="Navigation drawer"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#101827] z-10 shadow-2xl">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
