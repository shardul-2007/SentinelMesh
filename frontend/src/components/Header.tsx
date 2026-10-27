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
  ChevronDown
} from 'lucide-react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '@/lib/api';
import { UserProfile, UserRole } from '@/lib/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ title, subtitle, onRefresh, isRefreshing }: HeaderProps) {
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
          network: health.blockchain_integration.network || 'EVM'
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
    // Default fallback to Admin for convenient demoing
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
      // Fallback local update
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
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      case 'SECURITY_ANALYST':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'VIEWER':
      default:
        return 'bg-graphite-800 text-slate-300 border-graphite-700';
    }
  };

  return (
    <header className="h-16 px-6 border-b border-graphite-750 bg-graphite-900/60 backdrop-blur flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Backend Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-graphite-850 border border-graphite-750 text-xs">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">API:</span>
          {backendStatus === 'connected' ? (
            <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              ONLINE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-rose-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              OFFLINE
            </span>
          )}
        </div>

        {/* Database Status */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-graphite-850 border border-graphite-750 text-xs">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">DB:</span>
          <span className="font-mono text-slate-200">SQLite (Active)</span>
        </div>

        {/* Blockchain Status (Honest Phase 2/3 indicator) */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-graphite-850 border border-graphite-750 text-xs">
          <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">EVM Ledger:</span>
          {blockchainInfo.connected ? (
            <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              CONNECTED ({blockchainInfo.network})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
              DISCONNECTED (Local Mock Ready)
            </span>
          )}
        </div>

        {/* User Profile & Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-graphite-850 border border-graphite-750 hover:bg-graphite-800 transition text-xs"
            title="Switch Demo Role"
          >
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-200 font-medium hidden sm:inline">{currentUser?.username || 'admin'}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border ${getRoleBadgeStyle(currentUser?.role)}`}>
              {currentUser?.role || 'ADMIN'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-graphite-900 border border-graphite-700 shadow-2xl p-2 z-50 space-y-1">
              <div className="px-3 py-2 border-b border-graphite-750 text-xs">
                <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">RBAC Demo Switcher</p>
                <p className="text-slate-200 font-medium mt-0.5">{currentUser?.full_name}</p>
              </div>

              <button
                onClick={() => handleSwitchRole('admin', 'ADMIN', 'Chief Security Officer')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-graphite-800 transition ${
                  currentUser?.role === 'ADMIN' ? 'bg-purple-950/30 text-purple-300 font-semibold' : 'text-slate-300'
                }`}
              >
                <div>
                  <p className="font-medium">Admin (Full Control)</p>
                  <p className="text-[10px] text-slate-400">Can approve, anchor & resolve</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">ADMIN</span>
              </button>

              <button
                onClick={() => handleSwitchRole('analyst', 'SECURITY_ANALYST', 'Senior Security Analyst')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-graphite-800 transition ${
                  currentUser?.role === 'SECURITY_ANALYST' ? 'bg-blue-950/30 text-blue-300 font-semibold' : 'text-slate-300'
                }`}
              >
                <div>
                  <p className="font-medium">Security Analyst</p>
                  <p className="text-[10px] text-slate-400">Verify hashes & export reports</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">ANALYST</span>
              </button>

              <button
                onClick={() => handleSwitchRole('viewer', 'VIEWER', 'Compliance Auditor')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-graphite-800 transition ${
                  currentUser?.role === 'VIEWER' ? 'bg-graphite-800 text-slate-200 font-semibold' : 'text-slate-300'
                }`}
              >
                <div>
                  <p className="font-medium">Viewer / Auditor</p>
                  <p className="text-[10px] text-slate-400">Read-only monitoring access</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-graphite-800 border border-graphite-700 text-slate-300">VIEWER</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-slate-300 bg-graphite-800 border border-graphite-700 hover:bg-graphite-750 hover:text-white transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}
