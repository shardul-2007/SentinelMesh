'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Database, 
  Link as LinkIcon, 
  RefreshCw, 
  User as UserIcon, 
  ShieldCheck, 
  Lock, 
  LogOut,
  ChevronDown,
  Menu
} from 'lucide-react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '@/lib/api';
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
    // Default fallback to Admin for convenient demonstration
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
        return 'bg-[#FDF7ED] text-[#98661C] border-[#F5DEB3]';
      case 'SECURITY_ANALYST':
        return 'bg-[#EBF2F7] text-[#315C78] border-[#C5D7E3]';
      case 'VIEWER':
      default:
        return 'bg-[#F5F4F0] text-[#737B86] border-[#D9DDE2]';
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-[#D9DDE2] bg-[#FFFFFF] flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded text-[#737B86] hover:text-[#171A1F] hover:bg-[#F5F4F0] border border-[#D9DDE2] transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[#171A1F] tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] sm:text-xs text-[#737B86] line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-xs">
          <Activity className="w-3.5 h-3.5 text-[#737B86]" />
          <span className="text-[#737B86]">API:</span>
          {backendStatus === 'connected' ? (
            <span className="inline-flex items-center gap-1 font-mono text-[#287653] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#287653]"></span>
              ONLINE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[#B53A3A] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B53A3A]"></span>
              OFFLINE
            </span>
          )}
        </div>

        {/* Database Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-xs">
          <Database className="w-3.5 h-3.5 text-[#737B86]" />
          <span className="text-[#737B86]">DB:</span>
          <span className="font-mono text-[#171A1F] text-[11px]">Active</span>
        </div>

        {/* Blockchain Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-xs">
          <LinkIcon className="w-3.5 h-3.5 text-[#737B86]" />
          <span className="text-[#737B86]">MST:</span>
          {blockchainInfo.connected ? (
            <span className="inline-flex items-center gap-1 font-mono text-[#287653] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#287653] animate-pulse"></span>
              {blockchainInfo.network}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[#98661C] bg-[#FDF7ED] px-1.5 py-0.2 rounded border border-[#F5DEB3] text-[10px]">
              LOCAL EVM
            </span>
          )}
        </div>

        {/* User Profile & Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#F5F4F0] border border-[#D9DDE2] hover:bg-[#E8EBEF] transition text-xs text-[#171A1F]"
            title="Switch User Role"
          >
            <UserIcon className="w-3.5 h-3.5 text-[#737B86]" />
            <span className="font-medium hidden sm:inline">{currentUser?.username || 'admin'}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border ${getRoleBadgeStyle(currentUser?.role)}`}>
              {currentUser?.role || 'ADMIN'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#737B86]" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded bg-[#FFFFFF] border border-[#D9DDE2] shadow-xl p-2 z-50 space-y-1">
              <div className="px-3 py-2 border-b border-[#D9DDE2] text-xs">
                <p className="text-[#737B86] text-[10px] uppercase tracking-wider font-semibold">Role-Based Access (RBAC)</p>
                <p className="text-[#171A1F] font-medium mt-0.5">{currentUser?.full_name}</p>
              </div>

              <button
                onClick={() => handleSwitchRole('admin', 'ADMIN', 'Chief Security Officer')}
                className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between hover:bg-[#F5F4F0] transition ${
                  currentUser?.role === 'ADMIN' ? 'bg-[#FDF7ED] text-[#98661C] font-semibold' : 'text-[#171A1F]'
                }`}
              >
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-[10px] text-[#737B86]">Approve, anchor & configure</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FDF7ED] border border-[#F5DEB3] text-[#98661C]">ADMIN</span>
              </button>

              <button
                onClick={() => handleSwitchRole('analyst', 'SECURITY_ANALYST', 'Senior Security Analyst')}
                className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between hover:bg-[#F5F4F0] transition ${
                  currentUser?.role === 'SECURITY_ANALYST' ? 'bg-[#EBF2F7] text-[#315C78] font-semibold' : 'text-[#171A1F]'
                }`}
              >
                <div>
                  <p className="font-medium">Security Analyst</p>
                  <p className="text-[10px] text-[#737B86]">Verify hashes & inspect traces</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EBF2F7] border border-[#C5D7E3] text-[#315C78]">ANALYST</span>
              </button>

              <button
                onClick={() => handleSwitchRole('viewer', 'VIEWER', 'Compliance Auditor')}
                className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between hover:bg-[#F5F4F0] transition ${
                  currentUser?.role === 'VIEWER' ? 'bg-[#F5F4F0] text-[#171A1F] font-semibold' : 'text-[#171A1F]'
                }`}
              >
                <div>
                  <p className="font-medium">Compliance Auditor</p>
                  <p className="text-[10px] text-[#737B86]">Read-only verification</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F4F0] border border-[#D9DDE2] text-[#737B86]">VIEWER</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-[#171A1F] bg-[#FFFFFF] border border-[#D9DDE2] hover:bg-[#F5F4F0] transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#315C78] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}
