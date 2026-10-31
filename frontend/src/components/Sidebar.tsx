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
  PanelLeftOpen,
  Users,
  Grid,
  BookOpen,
  CreditCard
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

  // The 10 mandated Enterprise Application Sidebar Items
  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard, badge: 'Gateway' },
    { name: 'Agent Gateway', href: '/simulator', icon: PlayCircle, badge: 'Evaluate' },
    { name: 'Security Policies', href: '/policies', icon: Sliders, badge: 'Rules' },
    { name: 'Approval Center', href: '/approvals', icon: CheckCircle2, badge: 'Review' },
    { name: 'Audit Explorer', href: '/audit', icon: FileText, badge: 'Ledger' },
    { name: 'Evidence Verification', href: '/integrity', icon: Lock, badge: 'RFC-8785' },
    { name: 'Blockchain Registry', href: '/blockchain', icon: Boxes, badge: 'MST Chain' },
    { name: 'PayPal Sandbox', href: '/paypal', icon: CreditCard, badge: 'FinTech' },
    { name: 'Agent Management', href: '/agents', icon: Users, badge: 'Fleet' },
    { name: 'Integrations', href: '/integrations', icon: Grid, badge: 'SDK' },
    { name: 'Settings', href: '/settings', icon: Settings, badge: 'Config' },
  ];

  const renderContent = (collapsed: boolean) => (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-[#FFFFFF] text-[#172B4D] flex flex-col flex-shrink-0 min-h-screen border-r border-[#E5E7EB] select-none transition-all duration-300 font-sans shadow-sm`}>
      {/* Brand & Identity Header */}
      <div className={`p-3.5 border-b border-[#E5E7EB] flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'} bg-[#FFFFFF]`}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] flex-shrink-0">
            <Shield className="w-4 h-4 text-[#2563EB]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-[#172B4D] font-sans truncate">
                SentinelMesh
              </h1>
              <p className="text-[10px] text-[#64748B] font-medium tracking-wide truncate">
                Verifiable Security for AI
              </p>
            </div>
          )}
        </Link>

        {/* When collapsed: prominent Maximize button right at top */}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg bg-[#F8FAFC] text-[#2563EB] hover:bg-[#F1F5F9] border border-[#E5E7EB] flex items-center justify-center transition shadow-xs active:scale-95"
            title="Expand navigation menu"
            aria-label="Expand navigation menu"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* When expanded: Minimize button at top right */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#64748B] hover:text-[#172B4D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] transition"
                title="Minimize sidebar"
                aria-label="Minimize sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-[#2563EB]" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded text-[#64748B] hover:text-[#172B4D] hover:bg-[#F1F5F9] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
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
        <div className="px-3.5 py-2.5 border-b border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
            <span className="text-[#64748B] uppercase font-bold tracking-wider">Access Scope</span>
            <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${
              role === 'ADMIN'
                ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30'
                : role === 'SECURITY_ANALYST'
                ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30'
                : 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30'
            }`}>
              {role === 'ADMIN' ? 'CSO (ADMIN)' : role === 'SECURITY_ANALYST' ? 'ANALYST' : 'AUDITOR'}
            </span>
          </div>
          <p className="text-[11px] text-[#172B4D] font-medium truncate">{roleTitle}</p>
        </div>
      ) : (
        <div className="py-2 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-center" title={`RBAC Role: ${roleTitle}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${
            role === 'ADMIN' ? 'bg-[#D97706]' : role === 'SECURITY_ANALYST' ? 'bg-[#DC2626]' : 'bg-[#2563EB]'
          }`}></span>
        </div>
      )}

      {/* Network Badge */}
      {!collapsed ? (
        <div className="px-3.5 py-2 border-b border-[#E5E7EB] bg-[#FFFFFF]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B] text-[10px] uppercase tracking-wider font-semibold">MST Network</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
              isConnected
                ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/25'
                : 'bg-[#F1F5F9] text-[#64748B] border-[#E5E7EB]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#15803D] animate-pulse' : 'bg-[#64748B]'}`}></span>
              {networkLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-2 border-b border-[#E5E7EB] bg-[#FFFFFF] flex justify-center" title={`MST Network: ${networkLabel}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#15803D] animate-pulse' : 'bg-slate-400'}`}></span>
        </div>
      )}

      {/* 10 Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              title={collapsed ? `${item.name} (${item.badge})` : undefined}
              className={`flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-lg text-xs font-medium transition-all duration-150 group min-h-[38px] ${
                isActive
                  ? 'bg-[#F1F5F9] text-[#2563EB] border-l-3 border-[#2563EB] font-semibold'
                  : 'text-[#64748B] hover:text-[#172B4D] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#172B4D]'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E5E7EB]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#2563EB] ml-0.5" />}
                </div>
              )}
            </Link>
          );
        })}

        {/* Documentation Section */}
        <div className="pt-2 mt-2 border-t border-[#E5E7EB]">
          <Link
            href="/docs"
            onClick={() => onClose && onClose()}
            className={`flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-lg text-xs font-medium text-[#64748B] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#64748B]" />
              {!collapsed && <span>Documentation</span>}
            </div>
            {!collapsed && <span className="text-[9px] font-mono text-[#64748B]">v2.5</span>}
          </Link>
        </div>
      </nav>

      {/* Blockchain Registry Callout Box */}
      {!collapsed && (
        <div className="p-3 m-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172B4D]">
            <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>MST Blockchain Anchor</span>
          </div>
          <p className="text-[10px] text-[#64748B] leading-relaxed">
            Deterministic SHA-256 evidence digests anchored immutably in EvidenceRegistry.
          </p>
          <Link 
            href="/blockchain"
            onClick={() => onClose && onClose()}
            className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline transition pt-0.5 font-medium"
          >
            <span>View Registry</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-[#E5E7EB] text-[10px] text-[#64748B] flex items-center justify-between bg-[#FAFAFA]">
          <span className="font-medium">SentinelMesh Enterprise</span>
          <span className="font-mono text-[10px] font-bold text-[#15803D]">MST Verified</span>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FFFFFF] z-10 shadow-2xl">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
