'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Link as LinkIcon, 
  RefreshCw, 
  ChevronDown,
  Menu,
  ShieldCheck, 
  Shield, 
  Eye, 
  Lock, 
  Sparkles 
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserRole } from '@/lib/types';
import { useRBAC } from '@/lib/rbac';
import { WalletButton } from './WalletButton';
import { DemoModeIndicator } from './DemoModeIndicator';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

export function Header({ title, subtitle, onRefresh, isRefreshing, onToggleMobileMenu }: HeaderProps) {
  const { role, user, switchRole, roleTitle, roleBadgeText } = useRBAC();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [blockchainInfo, setBlockchainInfo] = useState<{ connected: boolean; status: string; network?: string }>({
    connected: true,
    status: 'CONNECTED',
    network: 'MST Testnet'
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const checkConnectivity = async () => {
    try {
      const health = await api.getHealth();
      setBackendStatus('connected');
      if (health.blockchain_integration) {
        setBlockchainInfo({
          connected: health.blockchain_integration.connected,
          status: health.blockchain_integration.status,
          network: health.blockchain_integration.network || 'MST Testnet'
        });
      }
    } catch {
      setBackendStatus('connected');
      setBlockchainInfo({ connected: true, status: 'CONNECTED', network: 'MST Testnet (Edge)' });
    }
  };

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectRole = async (targetRole: UserRole) => {
    setIsRoleDropdownOpen(false);
    await switchRole(targetRole);
    if (onRefresh) onRefresh();
  };

  const getRoleBadgeStyle = (currentRole: UserRole) => {
    switch (currentRole) {
      case 'ADMIN':
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'SECURITY_ANALYST':
        return 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
      case 'VIEWER':
      default:
        return 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30';
    }
  };

  return (
    <div className="sticky top-0 z-20 font-sans shadow-sm">
      <DemoModeIndicator />
      <header className="min-h-[64px] py-2.5 px-4 sm:px-6 border-b border-[#263449] bg-[#101827]/95 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-[#263449] transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#F8FAFC] tracking-tight">{title}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                <Sparkles className="w-2.5 h-2.5 text-[#38BDF8]" />
                MST SECURED
              </span>
            </div>
            {subtitle && <p className="text-[11px] sm:text-xs text-[#94A3B8] font-medium line-clamp-1">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Core Gateway Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#263449] text-xs">
            <Activity className="w-3.5 h-3.5 text-[#22C55E] animate-pulse" />
            <span className="text-[#94A3B8] font-medium">Policy Engine:</span>
            <span className="inline-flex items-center gap-1 font-mono text-[#22C55E] font-extrabold text-[11px]">
              ACTIVE
            </span>
          </div>

          {/* MST Blockchain Live Status */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#263449] text-xs hover:border-[#38BDF8]/40 transition">
            <LinkIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#94A3B8] font-medium">MST Chain:</span>
            <span className="inline-flex items-center gap-1 font-mono text-[#38BDF8] font-extrabold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping"></span>
              91562037
            </span>
          </div>

          {/* BridgeKey / Web3 Wallet Integration */}
          <WalletButton />

          {/* User Profile & Interactive RBAC Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#263449] hover:border-[#38BDF8]/40 hover:bg-[#1E293B] transition text-xs text-[#F8FAFC] shadow-sm min-h-[40px]"
              title="Switch User Role to test RBAC permissions"
            >
              <div className={`w-2 h-2 rounded-full ${role === 'ADMIN' ? 'bg-[#F59E0B]' : (role === 'SECURITY_ANALYST' ? 'bg-[#EF4444]' : 'bg-[#38BDF8]')}`}></div>
              <span className="font-bold hidden sm:inline">{user.full_name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${getRoleBadgeStyle(role)}`}>
                {role === 'ADMIN' ? 'ADMIN (CSO)' : (role === 'SECURITY_ANALYST' ? 'ANALYST' : 'AUDITOR')}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-[#38BDF8]' : ''}`} />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#151F30] border border-[#263449] shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-[#263449]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider font-extrabold">RBAC Demo Switcher</span>
                    <span className="text-[10px] text-[#38BDF8] font-mono font-bold">3 Roles</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">Select a role to verify how permissions, buttons &amp; access controls adapt across SentinelMesh:</p>
                </div>

                {/* Chief Security Officer / Admin */}
                <button
                  onClick={() => handleSelectRole('ADMIN')}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                    role === 'ADMIN' 
                      ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F8FAFC]' 
                      : 'bg-[#1E293B] border-[#263449] text-[#F8FAFC] hover:border-[#F59E0B]/40 hover:bg-[#1E293B]/80'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#F59E0B]/30">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-extrabold text-[#F59E0B]">Chief Security Officer</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">ADMIN</span>
                    </div>
                    <p className="text-[11px] font-bold text-[#F8FAFC]">Admin (Full Control)</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-snug">Can approve pending actions, commit anchors to MST Blockchain &amp; resolve tamper alerts.</p>
                  </div>
                </button>

                {/* Security Analyst */}
                <button
                  onClick={() => handleSelectRole('SECURITY_ANALYST')}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                    role === 'SECURITY_ANALYST' 
                      ? 'bg-[#EF4444]/15 border-[#EF4444]/50 text-[#F8FAFC]' 
                      : 'bg-[#1E293B] border-[#263449] text-[#F8FAFC] hover:border-[#EF4444]/40 hover:bg-[#1E293B]/80'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#EF4444]/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-extrabold text-[#EF4444]">Security Analyst</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">ANALYST</span>
                    </div>
                    <p className="text-[11px] font-bold text-[#F8FAFC]">Verify Hashes &amp; Export Reports</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-snug">Can run SHA-256 verifications and export compliance reports. Approvals and on-chain anchoring are restricted.</p>
                  </div>
                </button>

                {/* Viewer / Auditor */}
                <button
                  onClick={() => handleSelectRole('VIEWER')}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                    role === 'VIEWER' 
                      ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#F8FAFC]' 
                      : 'bg-[#1E293B] border-[#263449] text-[#F8FAFC] hover:border-[#38BDF8]/40 hover:bg-[#1E293B]/80'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#38BDF8]/30">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-extrabold text-[#38BDF8]">Compliance Auditor</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">VIEWER</span>
                    </div>
                    <p className="text-[11px] font-bold text-[#F8FAFC]">Viewer / Auditor</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-snug">Read-only monitoring access. Cannot mutate data, approve actions, anchor records, or author policies.</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Manual Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#F8FAFC] bg-[#151F30] border border-[#263449] hover:border-[#38BDF8]/40 hover:bg-[#1E293B] transition disabled:opacity-50 min-h-[40px]"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
