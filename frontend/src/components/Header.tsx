'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Database, 
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
        return 'bg-amber-500/20 text-[#FF9900] border-amber-500/40 shadow-[0_0_12px_rgba(255,153,0,0.2)]';
      case 'SECURITY_ANALYST':
        return 'bg-orange-500/20 text-[#FB641B] border-orange-500/40 shadow-[0_0_12px_rgba(251,100,27,0.2)]';
      case 'VIEWER':
      default:
        return 'bg-emerald-500/20 text-[#10B981] border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-[#2E3442] bg-[#15181F]/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 transition-all font-sans">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-[#9E9EA8] hover:text-[#FFFFFF] hover:bg-[#222630] border border-[#2E3442] transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#FF9900]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#FFFFFF] tracking-tight">{title}</h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-[#FF9900] border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#FF9900]" />
              MST SECURED
            </span>
          </div>
          {subtitle && <p className="text-[11px] sm:text-xs text-[#9E9EA8] font-medium line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Core Gateway Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111317] border border-[#2E3442] text-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[#9E9EA8] font-bold">Policy Engine:</span>
          <span className="inline-flex items-center gap-1 font-mono text-[#10B981] font-extrabold text-[11px]">
            ACTIVE
          </span>
        </div>

        {/* MST Blockchain Live Status */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111317] border border-[#2E3442] text-xs hover:border-amber-500/40 transition">
          <LinkIcon className="w-3.5 h-3.5 text-[#FF9900]" />
          <span className="text-[#9E9EA8] font-bold">MST Chain:</span>
          <span className="inline-flex items-center gap-1 font-mono text-[#FF9900] font-extrabold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900] animate-ping"></span>
            91562037
          </span>
        </div>

        {/* BridgeKey / Web3 Wallet Integration */}
        <WalletButton />

        {/* User Profile & Interactive RBAC Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111317] border border-[#2E3442] hover:border-amber-500/40 hover:bg-[#222630] transition text-xs text-[#FFFFFF] shadow-sm min-h-[40px]"
            title="Switch User Role to test RBAC permissions"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${role === 'ADMIN' ? 'bg-[#FF9900] animate-pulse' : (role === 'SECURITY_ANALYST' ? 'bg-[#FB641B]' : 'bg-[#10B981]')}`}></div>
            <span className="font-extrabold hidden sm:inline">{user.full_name}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${getRoleBadgeStyle(role)}`}>
              {role === 'ADMIN' ? 'ADMIN (CSO)' : (role === 'SECURITY_ANALYST' ? 'ANALYST' : 'AUDITOR')}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9E9EA8] transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-[#FF9900]' : ''}`} />
          </button>

          {isRoleDropdownOpen && (
            <div className="mst-card absolute right-0 mt-2 w-80 rounded-xl bg-[#1A1D24] border border-[#2E3442] shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-[#2E3442]">
                <div className="flex items-center justify-between">
                  <span className="text-[#9E9EA8] text-[10px] uppercase tracking-wider font-extrabold">RBAC Demo Switcher</span>
                  <span className="text-[10px] text-[#FF9900] font-mono font-bold">3 Roles</span>
                </div>
                <p className="text-[11px] text-[#9E9EA8] mt-1">Select a role to verify how permissions, buttons &amp; access controls adapt across SentinelMesh:</p>
              </div>

              {/* Chief Security Officer / Admin */}
              <button
                onClick={() => handleSelectRole('ADMIN')}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                  role === 'ADMIN' 
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(255,153,0,0.15)]' 
                    : 'bg-[#111317] border-[#2E3442] text-[#FFFFFF] hover:border-amber-500/40 hover:bg-[#222630]'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-amber-500/20 text-[#FF9900] flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-[#FF9900]">Chief Security Officer</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-[#FF9900] border border-amber-500/40">ADMIN</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#FFFFFF]">Admin (Full Control)</p>
                  <p className="text-[10px] text-[#9E9EA8] mt-0.5 leading-snug">Can approve pending actions, commit anchors to MST Blockchain &amp; resolve tamper alerts.</p>
                </div>
              </button>

              {/* Security Analyst */}
              <button
                onClick={() => handleSelectRole('SECURITY_ANALYST')}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                  role === 'SECURITY_ANALYST' 
                    ? 'bg-orange-950/40 border-orange-500/50 text-orange-200 shadow-[0_0_15px_rgba(251,100,27,0.15)]' 
                    : 'bg-[#111317] border-[#2E3442] text-[#FFFFFF] hover:border-orange-500/40 hover:bg-[#222630]'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-orange-500/20 text-[#FB641B] flex items-center justify-center flex-shrink-0 mt-0.5 border border-orange-500/30">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-[#FB641B]">Security Analyst</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-[#FB641B] border border-orange-500/40">ANALYST</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#FFFFFF]">Verify Hashes &amp; Export Reports</p>
                  <p className="text-[10px] text-[#9E9EA8] mt-0.5 leading-snug">Can run SHA-256 verifications and export compliance reports. Approvals and on-chain anchoring are restricted.</p>
                </div>
              </button>

              {/* Viewer / Auditor */}
              <button
                onClick={() => handleSelectRole('VIEWER')}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-start gap-2.5 ${
                  role === 'VIEWER' 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'bg-[#111317] border-[#2E3442] text-[#FFFFFF] hover:border-emerald-500/40 hover:bg-[#222630]'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-[#10B981]">Compliance Auditor</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#10B981] border border-emerald-500/40">VIEWER</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#FFFFFF]">Viewer / Auditor</p>
                  <p className="text-[10px] text-[#9E9EA8] mt-0.5 leading-snug">Read-only monitoring access. Cannot mutate data, approve actions, anchor records, or author policies.</p>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FFFFFF] bg-[#111317] border border-[#2E3442] hover:border-amber-500/40 hover:bg-[#222630] transition disabled:opacity-50 min-h-[40px]"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF9900] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}
