/**
 * @license
 * Permission and Role Gate Component
 * Fatimyah Educational Trust India (FET India)
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AppPermission, UserRole } from '../../types';
import { Lock, ShieldAlert } from 'lucide-react';

interface PermissionGateProps {
  children: React.ReactNode;
  /** Single permission or list of permissions required */
  permission?: AppPermission | AppPermission[];
  /** Require ALL listed permissions (default: false, meaning ANY permission grants access) */
  requireAll?: boolean;
  /** Specific required role */
  role?: UserRole | UserRole[];
  /** Fallback node when access is denied */
  fallback?: React.ReactNode;
  /** Whether to show a standardized "Access Restricted" alert card as fallback */
  showAlertFallback?: boolean;
  alertTitle?: string;
  alertMessage?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  requireAll = false,
  role,
  fallback = null,
  showAlertFallback = false,
  alertTitle = 'Access Restricted',
  alertMessage = 'You do not have the required role or administrative permission to view this module.'
}) => {
  const { isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();

  // Super Admin always bypasses gates
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  let hasAccess = true;

  // Role check
  if (role) {
    if (Array.isArray(role)) {
      hasAccess = role.some(r => hasRole(r));
    } else {
      hasAccess = hasRole(role);
    }
  }

  // Permission check
  if (hasAccess && permission) {
    if (Array.isArray(permission)) {
      hasAccess = requireAll
        ? hasAllPermissions(permission)
        : hasAnyPermission(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showAlertFallback) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-slate-200 text-sm space-y-3">
        <div className="flex items-center gap-3 text-rose-400">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <h4 className="font-bold text-base text-rose-200">{alertTitle}</h4>
        </div>
        <p className="text-xs text-rose-300/80 leading-relaxed">{alertMessage}</p>
      </div>
    );
  }

  return <>{fallback}</>;
};
