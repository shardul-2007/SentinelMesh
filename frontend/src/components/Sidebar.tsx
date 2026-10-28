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
  X,
  PanelLeftClose,
  PanelLeft,
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
  const { role, roleBadgeText, roleTitle } = useRBAC();
  const [chainStatus, setChainStatus] = useState<BlockchainStatus | null>(null);

  useEffect(() => {
    api.getBlockchainStatus()
      .then(setChainStatus)
      .catch(() => {});
  }, []);

  const networkLabel = chainStatus?.network_name || 'MST Testnet';
  const isConnected = chainStatus?.connected ?? false;

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

  const renderContent = (collapsed: boolean) => (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-[#121212] text-[#FFFFFF] flex flex-col flex-shrink-0 min-h-screen border-r border-[#27272A] select-none transition-all duration-300 font-sans`}>
      {/* Brand & Identity Header + Top Maximize/Minimize Toggle */}
      <div className={`p-3 border-b border-[#27272A] flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'} bg-[#121212]`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/30 flex items-center justify-center text-[#FACC15] flex-shrink-0">
            <Shield className="w-4 h-4 text-[#FACC15]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight text-[#FFFFFF] font-sans truncate">
                SentinelMesh
              </h1>
              <p className="text-[10px] text-[#D4D4D8] font-semibold tracking-wide truncate">Trust, Without Blind Faith</p>
            </div>
          )}
        </div>

        {/* When collapsed: prominent Maximize button right at the top */}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-lg bg-[#FACC15] text-[#000000] hover:bg-[#EAB308] border border-[#FACC15] flex items-center justify-center transition shadow-lg active:scale-95"
            title="Maximize navigation menu (show all labels)"
            aria-label="Maximize navigation menu"
          >
            <PanelLeftOpen className="w-5 h-5 text-[#000000]" />
          </button>
        )}

        {/* When expanded: Minimize button at top right */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#000000] bg-[#FACC15] hover:bg-[#EAB308] transition shadow-sm active:scale-95"
                title="Minimize sidebar (show symbols only)"
                aria-label="Minimize sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-[#000000]" />
                <span className="text-[10px]">Minimize</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded text-[#D4D4D8] hover:text-[#FFFFFF] hover:bg-[#1C1C1C] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
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
        <div className="px-3.5 py-2.5 border-b border-[#27272A] bg-[#000000]">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-[#D4D4D8] uppercase font-bold">RBAC Session</span>
            <span className={`px-2 py-0.5 rounded font-bold border ${
              role === 'ADMIN'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                : 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30'
            }`}>
              {role === 'ADMIN' ? 'CSO (ADMIN)' : role === 'SECURITY_ANALYST' ? 'ANALYST' : 'AUDITOR'}
            </span>
          </div>
          <p className="text-[11px] text-[#FFFFFF] font-bold truncate">{roleTitle}</p>
        </div>
      ) : (
        <div className="py-2 border-b border-[#27272A] bg-[#000000] flex justify-center" title={`RBAC Role: ${roleTitle}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${
            role === 'ADMIN' ? 'bg-[#F59E0B]' : role === 'SECURITY_ANALYST' ? 'bg-[#EF4444]' : 'bg-[#FACC15]'
          }`}></span>
        </div>
      )}

      {/* Network Badge */}
      {!collapsed ? (
        <div className="px-4 py-2 border-b border-[#27272A] bg-[#121212]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#D4D4D8] text-[10px] uppercase tracking-wider font-bold">MST Chain</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isConnected
                ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/40'
                : 'bg-[#1C1C1C] text-[#D4D4D8] border-[#27272A]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#FACC15] animate-pulse' : 'bg-[#6B7280]'}`}></span>
              {networkLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-2 border-b border-[#27272A] bg-[#121212] flex justify-center" title={`MST Network: ${networkLabel}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#FACC15] animate-pulse' : 'bg-slate-500'}`}></span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              title={collapsed ? `${item.name} (${item.badge})` : undefined}
              className={`flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'} rounded-lg text-xs font-bold transition-all duration-200 group min-h-[44px] ${
                isActive
                  ? 'bg-[#FACC15]/10 text-[#FACC15] border-l-2 border-[#FACC15]'
                  : 'text-[#D4D4D8] hover:text-[#FFFFFF] hover:bg-[#1C1C1C] hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#FACC15]' : 'text-[#D4D4D8] group-hover:text-[#FACC15]'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15]/40'
                        : 'bg-[#000000] text-[#D4D4D8] border-[#27272A]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#FACC15] ml-0.5" />}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Trust Anchor Callout */}
      {!collapsed && (
        <div className="p-3 m-2.5 rounded-lg bg-[#000000] border border-[#27272A] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FACC15]">
            <Lock className="w-3.5 h-3.5" />
            <span>MST Blockchain Anchor</span>
          </div>
          <p className="text-[10px] text-[#D4D4D8] leading-relaxed">
            Deterministic SHA-256 evidence digests anchored immutably in MST EvidenceRegistry.
          </p>
          <Link 
            href="/blockchain"
            onClick={() => onClose && onClose()}
            className="inline-flex items-center gap-1 text-[11px] text-[#FACC15] hover:underline transition pt-0.5 font-bold"
          >
            <span>View On-Chain Activity</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Collapse/Expand Toggle Button (Desktop Only) */}
      <div className="p-2 border-t border-[#27272A] hidden lg:flex items-center justify-between bg-[#000000]">
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold text-[#FACC15] hover:bg-[#1C1C1C] border border-[#27272A] hover:border-[#FACC15]/40 transition"
          >
            <span>Minimize Sidebar</span>
            <PanelLeftClose className="w-4 h-4 text-[#FACC15]" />
          </button>
        )}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/40 hover:bg-[#FACC15] hover:text-[#000000] transition"
            title="Maximize Sidebar"
            aria-label="Maximize Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-[#27272A] text-[10px] text-[#D4D4D8] flex items-center justify-between bg-[#121212]">
          <span className="font-semibold">SentinelMesh v2.5</span>
          <span className="font-mono text-[10px] font-bold text-[#FACC15]">MST Verified</span>
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#121212] z-10 shadow-2xl">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
