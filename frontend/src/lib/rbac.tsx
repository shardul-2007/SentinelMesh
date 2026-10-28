'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from './types';
import { api } from './api';

export interface RBACPermissions {
  canApprove: boolean;
  canAnchor: boolean;
  canResolveAlerts: boolean;
  canSimulateTamper: boolean;
  canRestoreBaseline: boolean;
  canSubmitActions: boolean;
  canVerifyHashes: boolean;
  canExportReports: boolean;
  isReadOnly: boolean;
}

export interface RBACContextValue {
  role: UserRole;
  user: UserProfile;
  permissions: RBACPermissions;
  roleTitle: string;
  roleBadgeText: string;
  roleDescription: string;
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
        canResolveAlerts: true,
        canSimulateTamper: true,
        canRestoreBaseline: true,
        canSubmitActions: true,
        canVerifyHashes: true,
        canExportReports: true,
        isReadOnly: false,
      };
    case 'SECURITY_ANALYST':
      return {
        canApprove: false,
        canAnchor: false,
        canResolveAlerts: false,
        canSimulateTamper: false,
        canRestoreBaseline: false,
        canSubmitActions: true,
        canVerifyHashes: true,
        canExportReports: true,
        isReadOnly: false,
      };
    case 'VIEWER':
    default:
      return {
        canApprove: false,
        canAnchor: false,
        canResolveAlerts: false,
        canSimulateTamper: false,
        canRestoreBaseline: false,
        canSubmitActions: false,
        canVerifyHashes: false,
        canExportReports: false,
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
    : (role === 'SECURITY_ANALYST' ? 'Security Analyst' : 'Viewer / Auditor');

  const roleBadgeText = role === 'ADMIN' 
    ? 'ADMIN (FULL CONTROL)' 
    : (role === 'SECURITY_ANALYST' ? 'ANALYST (VERIFY & EXPORT)' : 'AUDITOR (READ-ONLY)');

  const roleDescription = role === 'ADMIN'
    ? 'Full administrative control: can approve/reject sensitive requests, commit anchors to MST Blockchain, and resolve security alerts.'
    : (role === 'SECURITY_ANALYST'
      ? 'Analyst privileges: verify cryptographic evidence, run integrity audits, execute threat detection, and export reports. Administrative actions are disabled.'
      : 'Read-only compliance auditor: monitor logs, observe blockchain verification and view evidence. All mutations and sensitive actions are restricted.');

  return (
    <RBACContext.Provider value={{
      role,
      user,
      permissions,
      roleTitle,
      roleBadgeText,
      roleDescription,
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
      switchRole: async () => {},
    };
  }
  return context;
}
