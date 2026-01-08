'use client';

import { useUserRole } from '@/shared/contexts/auth-context';
import { ReactNode } from 'react';
import { hasPermission, Permission, UserRole } from './permissions';

interface ProtectedComponentProps {
  children: ReactNode;
  permission?: Permission;
  roles?: UserRole[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function ProtectedComponent({
  children,
  permission,
  roles,
  fallback = null,
  requireAll = false,
}: ProtectedComponentProps) {
  const userRole = useUserRole();

  const permissionToCheck =
    permission || (roles ? { roles, requireAll } : null);

  if (!permissionToCheck) {
    return <>{children}</>;
  }

  const hasAccess = hasPermission(userRole, permissionToCheck);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RequireRoleProps {
  children: ReactNode;
  role: UserRole;
  fallback?: ReactNode;
}

/**
 * Component that requires minimum role level
 */
export function RequireRole({
  children,
  role,
  fallback = null,
}: RequireRoleProps) {
  const userRole = useUserRole();

  if (userRole === null || userRole < role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireAnyRoleProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

/**
 * Component that requires any of the specified roles
 */
export function RequireAnyRole({
  children,
  roles,
  fallback = null,
}: RequireAnyRoleProps) {
  return (
    <ProtectedComponent permission={{ roles }} fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}
