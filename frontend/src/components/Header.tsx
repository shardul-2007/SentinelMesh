'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Database, 
  Link as LinkIcon, 
  RefreshCw, 
  User as UserIcon, 
  ChevronDown,
  Menu
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserProfile, UserRole } from '@/lib/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

export function Header({ title, subtitle, onRefresh, isRefreshing, onToggleMobileMenu }: HeaderProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [blockchainInfo, setBlockchainInfo] = useState<{ connected: boolean; status: string; network?: string }>({
    connected: false,
    status: 'CHECKING'
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
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
      setBackendStatus('disconnected');
      setBlockchainInfo({ connected: false, status: 'DISCONNECTED' });
    }
  };

  const loadUser = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sentinel_current_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
          return;
        } catch {
          // ignore
        }
      }
    }
    setCurrentUser({
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@sentinelmesh.io',
      full_name: 'Chief Security Officer',
      role: 'ADMIN',
      is_active: true
    });
  };

  useEffect(() => {
    checkConnectivity();
    loadUser();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchRole = async (targetUsername: string, targetRole: UserRole, targetName: string) => {
    setIsRoleDropdownOpen(false);
    try {
      const password = targetUsername === 'admin' ? 'AdminPassword123!' : (targetUsername === 'analyst' ? 'AnalystPassword123!' : 'ViewerPassword123!');
      const res = await api.login(targetUsername, password);
      setCurrentUser(res.user);
      if (onRefresh) onRefresh();
    } catch {
      const fallbackUser: UserProfile = {
        id: `usr_${targetUsername}`,
        username: targetUsername,
        email: `${targetUsername}@sentinelmesh.io`,
        full_name: targetName,
        role: targetRole,
        is_active: true
      };
      setCurrentUser(fallbackUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sentinel_current_user', JSON.stringify(fallbackUser));
      }
    }
  };

  const getRoleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'SECURITY_ANALYST':
        return 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30';
      case 'VIEWER':
      default:
        return 'bg-[#1A2332] text-[#94A3B8] border-[#263244]';
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-[#263244] bg-[#131A24] flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2332] border border-[#263244] transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[#F8FAFC] tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] sm:text-xs text-[#94A3B8] line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F17] border border-[#263244] text-xs">
          <Activity className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#94A3B8]">API:</span>
          {backendStatus === 'connected' ? (
            <span className="inline-flex items-center gap-1 font-mono text-[#10B981] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              ONLINE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[#EF4444] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
              OFFLINE
            </span>
          )}
        </div>

        {/* Database Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F17] border border-[#263244] text-xs">
          <Database className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#94A3B8]">DB:</span>
          <span className="font-mono text-[#F8FAFC] text-[11px]">Active</span>
        </div>

        {/* Blockchain Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F17] border border-[#263244] text-xs">
          <LinkIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-[#94A3B8]">MST:</span>
          {blockchainInfo.connected ? (
            <span className="inline-flex items-center gap-1 font-mono text-[#10B981] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              {blockchainInfo.network}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.2 rounded border border-[#F59E0B]/30 text-[10px]">
              LOCAL EVM
            </span>
          )}
        </div>

        {/* User Profile & Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0B0F17] border border-[#263244] hover:bg-[#1A2332] transition text-xs text-[#F8FAFC]"
            title="Switch User Role"
          >
            <UserIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="font-medium hidden sm:inline">{currentUser?.username || 'admin'}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border ${getRoleBadgeStyle(currentUser?.role)}`}>
              {currentUser?.role || 'ADMIN'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1A2332] border border-[#263244] shadow-2xl p-2 z-50 space-y-1">
              <div className="px-3 py-2 border-b border-[#263244] text-xs">
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wider font-semibold">Role-Based Access (RBAC)</p>
                <p className="text-[#F8FAFC] font-medium mt-0.5">{currentUser?.full_name}</p>
              </div>

              <button
                onClick={() => handleSwitchRole('admin', 'ADMIN', 'Chief Security Officer')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#131A24] transition ${
                  currentUser?.role === 'ADMIN' ? 'bg-[#F59E0B]/15 text-[#F59E0B] font-semibold' : 'text-[#F8FAFC]'
                }`}
              >
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-[10px] text-[#94A3B8]">Approve, anchor & configure</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">ADMIN</span>
              </button>

              <button
                onClick={() => handleSwitchRole('analyst', 'SECURITY_ANALYST', 'Senior Security Analyst')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#131A24] transition ${
                  currentUser?.role === 'SECURITY_ANALYST' ? 'bg-[#38BDF8]/15 text-[#38BDF8] font-semibold' : 'text-[#F8FAFC]'
                }`}
              >
                <div>
                  <p className="font-medium">Security Analyst</p>
                  <p className="text-[10px] text-[#94A3B8]">Verify hashes & inspect traces</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8]">ANALYST</span>
              </button>

              <button
                onClick={() => handleSwitchRole('viewer', 'VIEWER', 'Compliance Auditor')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#131A24] transition ${
                  currentUser?.role === 'VIEWER' ? 'bg-[#131A24] text-[#F8FAFC] font-semibold' : 'text-[#F8FAFC]'
                }`}
              >
                <div>
                  <p className="font-medium">Compliance Auditor</p>
                  <p className="text-[10px] text-[#94A3B8]">Read-only verification</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0B0F17] border border-[#263244] text-[#94A3B8]">VIEWER</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#F8FAFC] bg-[#0B0F17] border border-[#263244] hover:bg-[#1A2332] transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}
