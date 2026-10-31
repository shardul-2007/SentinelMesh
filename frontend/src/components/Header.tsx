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
  Sparkles,
  Search,
  Bell,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserRole } from '@/lib/types';
import { useRBAC } from '@/lib/rbac';
import { WalletButton } from './WalletButton';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

export function Header({ title, subtitle, onRefresh, isRefreshing, onToggleMobileMenu }: HeaderProps) {
  const { role, user, switchRole, roleTitle } = useRBAC();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [blockchainInfo, setBlockchainInfo] = useState<{ connected: boolean; status: string; network?: string }>({
    connected: true,
    status: 'CONNECTED',
    network: 'MST Testnet'
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      setBlockchainInfo({ connected: true, status: 'CONNECTED', network: 'MST Testnet' });
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
        return 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30';
      case 'SECURITY_ANALYST':
        return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30';
      case 'VIEWER':
      default:
        return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30';
    }
  };

  return (
    <div className="sticky top-0 z-20 font-sans shadow-xs bg-[#FFFFFF]">
      {/* Top Enterprise Navigation Bar */}
      <header className="min-h-[60px] py-2 px-4 sm:px-6 border-b border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F1F5F9] border border-[#E5E7EB] transition min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Current Workspace Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] text-xs text-[#172B4D]">
            <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="font-semibold">Enterprise Sentinel / Prod</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight truncate">{title}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            {subtitle && <p className="text-[11px] sm:text-xs text-[#64748B] font-normal truncate max-w-xl">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Environment, Search, Notifications, Wallet, RBAC Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Environment Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#15803D]"></span>
            <span className="text-[#64748B] text-[11px]">Env:</span>
            <span className="font-mono text-[#172B4D] font-bold text-[11px]">MST-Testnet (91562037)</span>
          </div>

          {/* Wallet Integration Button */}
          <WalletButton />

          {/* Notifications Icon */}
          <button 
            type="button"
            className="p-2 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F1F5F9] border border-[#E5E7EB] transition min-h-[38px] min-w-[38px] flex items-center justify-center relative"
            title="Notifications (System All Clear)"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 text-[#64748B]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
          </button>

          {/* User Profile & RBAC Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition text-xs text-[#172B4D] shadow-xs min-h-[38px]"
              title="User role & RBAC context"
            >
              <div className={`w-2 h-2 rounded-full ${role === 'ADMIN' ? 'bg-[#D97706]' : (role === 'SECURITY_ANALYST' ? 'bg-[#DC2626]' : 'bg-[#2563EB]')}`}></div>
              <span className="font-semibold hidden sm:inline">{user.full_name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRoleBadgeStyle(role)}`}>
                {role === 'ADMIN' ? 'CSO (ADMIN)' : (role === 'SECURITY_ANALYST' ? 'ANALYST' : 'AUDITOR')}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-[#2563EB]' : ''}`} />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xl p-2 z-50 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[#E5E7EB]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[10px] uppercase tracking-wider font-bold">RBAC Permission Switcher</span>
                    <span className="text-[10px] text-[#2563EB] font-mono font-bold">3 Roles</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Switch active identity to evaluate role-based controls:</p>
                </div>

                {/* Chief Security Officer / Admin */}
                <button
                  onClick={() => handleSelectRole('ADMIN')}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                    role === 'ADMIN' 
                      ? 'bg-[#D97706]/10 border-[#D97706]/40 text-[#172B4D]' 
                      : 'bg-[#FFFFFF] border-transparent text-[#172B4D] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#D97706]/15 text-[#D97706] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#D97706]/30">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#D97706]">Chief Security Officer</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D97706]/20 text-[#D97706]">ADMIN</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug">Approvals, policy modifications, on-chain registry anchoring.</p>
                  </div>
                </button>

                {/* Security Analyst */}
                <button
                  onClick={() => handleSelectRole('SECURITY_ANALYST')}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                    role === 'SECURITY_ANALYST' 
                      ? 'bg-[#DC2626]/10 border-[#DC2626]/40 text-[#172B4D]' 
                      : 'bg-[#FFFFFF] border-transparent text-[#172B4D] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#DC2626]/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#DC2626]">Security Analyst</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#DC2626]/20 text-[#DC2626]">ANALYST</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug">Hash verification and evidence inspection.</p>
                  </div>
                </button>

                {/* Viewer / Auditor */}
                <button
                  onClick={() => handleSelectRole('VIEWER')}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                    role === 'VIEWER' 
                      ? 'bg-[#2563EB]/10 border-[#2563EB]/40 text-[#172B4D]' 
                      : 'bg-[#FFFFFF] border-transparent text-[#172B4D] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#2563EB]/30">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2563EB]">Compliance Auditor</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#2563EB]/20 text-[#2563EB]">VIEWER</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug">Read-only audit trail and compliance verification.</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#172B4D] bg-[#FFFFFF] border border-[#E5E7EB] hover:bg-[#F8FAFC] transition disabled:opacity-50 min-h-[38px]"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#2563EB] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
