'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from './types';
import { api } from './api';

export interface RBACPermissions {
  canApprove: boolean;
  canAnchor: boolean;
  canManagePolicies: boolean;
  canResolveAlerts: boolean;
  canSimulateTamper: boolean;
  canRestoreBaseline: boolean;
  canSubmitActions: boolean;
  canVerifyHashes: boolean;
  canExportReports: boolean;
  canManageSettings: boolean;
  canManageGovernance: boolean;
  isReadOnly: boolean;
}

export interface RBACContextValue {
  role: UserRole;
  user: UserProfile;
  permissions: RBACPermissions;
  roleTitle: string;
  roleBadgeText: string;
  roleDescription: string;
  accessLevel: 'ADMINISTRATIVE' | 'INVESTIGATIVE' | 'COMPLIANCE_AUDIT';
  switchRole: (role: UserRole) => Promise<void>;
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  ADMIN: {
    id: 'usr_admin',
    username: 'admin',
    email: 'admin@sentinelmesh.io',
    full_name: 'Chief Security Officer',
    role: 'ADMIN',
    is_active: true,
  },
  SECURITY_ANALYST: {
    id: 'usr_analyst',
    username: 'analyst',
    email: 'analyst@sentinelmesh.io',
    full_name: 'Lead Security Analyst',
    role: 'SECURITY_ANALYST',
    is_active: true,
  },
  VIEWER: {
    id: 'usr_viewer',
    username: 'viewer',
    email: 'auditor@sentinelmesh.io',
    full_name: 'Compliance Auditor',
    role: 'VIEWER',
    is_active: true,
  },
};

function getPermissionsForRole(role: UserRole): RBACPermissions {
  switch (role) {
    case 'ADMIN':
      return {
        canApprove: true,
        canAnchor: true,
        canManagePolicies: true,
        canResolveAlerts: true,
        canSimulateTamper: true,
        canRestoreBaseline: true,
        canSubmitActions: true,
        canVerifyHashes: true,
        canExportReports: true,
        canManageSettings: true,
        canManageGovernance: true,
        isReadOnly: false,
      };
    case 'SECURITY_ANALYST':
      return {
        canApprove: false,
        canAnchor: false,
        canManagePolicies: false,
        canResolveAlerts: false,
        canSimulateTamper: false,
        canRestoreBaseline: false,
        canSubmitActions: true,
        canVerifyHashes: true,
        canExportReports: true,
        canManageSettings: false,
        canManageGovernance: false,
        isReadOnly: false,
      };
    case 'VIEWER':
    default:
      return {
        canApprove: false,
        canAnchor: false,
        canManagePolicies: false,
        canResolveAlerts: false,
        canSimulateTamper: false,
        canRestoreBaseline: false,
        canSubmitActions: false,
        canVerifyHashes: false,
        canExportReports: true,
        canManageSettings: false,
        canManageGovernance: false,
        isReadOnly: true,
      };
  }
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [user, setUser] = useState<UserProfile>(DEFAULT_USERS.ADMIN);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sentinel_current_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as UserProfile;
          if (parsed && parsed.role) {
            setRole(parsed.role);
            setUser(parsed);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  const switchRole = async (targetRole: UserRole) => {
    const targetUser = DEFAULT_USERS[targetRole];
    setRole(targetRole);
    setUser(targetUser);

    if (typeof window !== 'undefined') {
      localStorage.setItem('sentinel_current_user', JSON.stringify(targetUser));
      // Dispatch custom storage event so other components update synchronously
      window.dispatchEvent(new Event('sentinel-role-change'));
    }

    try {
      const password = targetRole === 'ADMIN' 
        ? 'AdminPassword123!' 
        : (targetRole === 'SECURITY_ANALYST' ? 'AnalystPassword123!' : 'ViewerPassword123!');
      await api.login(targetUser.username, password).catch(() => null);
    } catch {
      // client-side switch is already applied
    }
  };

  const permissions = getPermissionsForRole(role);

  const roleTitle = role === 'ADMIN' 
    ? 'Chief Security Officer' 
    : (role === 'SECURITY_ANALYST' ? 'Security Analyst' : 'Compliance Auditor');

  const roleBadgeText = role === 'ADMIN' 
    ? 'ADMIN (FULL CONTROL)' 
    : (role === 'SECURITY_ANALYST' ? 'ANALYST (INVESTIGATOR)' : 'AUDITOR (READ-ONLY)');

  const accessLevel: 'ADMINISTRATIVE' | 'INVESTIGATIVE' | 'COMPLIANCE_AUDIT' = role === 'ADMIN'
    ? 'ADMINISTRATIVE'
    : (role === 'SECURITY_ANALYST' ? 'INVESTIGATIVE' : 'COMPLIANCE_AUDIT');

  const roleDescription = role === 'ADMIN'
    ? 'Full administrative control: can author/edit policies, approve/reject sensitive requests, commit anchors to MST Blockchain, and resolve security alerts.'
    : (role === 'SECURITY_ANALYST'
      ? 'Security investigation and evidence verification privileges: evaluate test policies, calculate/verify SHA-256 digests, run threat diagnostics, and export audit trails. Administrative controls are restricted.'
      : 'Read-only compliance auditor: monitor immutable audit logs, inspect cryptographic commitments, verify EVM blockchain proofs, and export compliance evidence.');

  return (
    <RBACContext.Provider value={{
      role,
      user,
      permissions,
      roleTitle,
      roleBadgeText,
      roleDescription,
      accessLevel,
      switchRole,
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      role: 'ADMIN' as UserRole,
      user: DEFAULT_USERS.ADMIN,
      permissions: getPermissionsForRole('ADMIN'),
      roleTitle: 'Chief Security Officer',
      roleBadgeText: 'ADMIN (FULL CONTROL)',
      roleDescription: 'Full administrative control.',
      accessLevel: 'ADMINISTRATIVE' as const,
      switchRole: async () => {},
    };
  }
  return context;
}

export function RoleRestrictionBanner({ 
  requiredRole = 'Chief Security Officer (ADMIN)',
  reason 
}: { 
  requiredRole?: string; 
  reason: string;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
      <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-500/30">
        <span className="text-xs font-bold font-mono">!</span>
      </div>
      <div className="text-xs space-y-0.5">
        <p className="font-semibold text-amber-300 flex items-center gap-2">
          <span>Restricted Privilege Boundary</span>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {requiredRole} REQUIRED
          </span>
        </p>
        <p className="text-slate-300 leading-relaxed">
          {reason}
        </p>
      </div>
    </div>
  );
}
