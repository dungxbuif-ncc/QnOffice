import { useUserRole } from '@/shared/contexts/auth-context';
import {
  hasAllRoles,
  hasAnyRole,
  hasMinimumRole,
  hasPermission,
  Permission,
  PERMISSIONS,
  UserRole,
} from './permissions';

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const userRole = useUserRole();

  return {
    hasPermission: (permission: Permission) =>
      hasPermission(userRole, permission),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(userRole, roles),
    hasAllRoles: (roles: UserRole[]) => hasAllRoles(userRole, roles),
    hasMinimumRole: (minimumRole: UserRole) =>
      hasMinimumRole(userRole, minimumRole),
    canViewStaff: () => hasPermission(userRole, PERMISSIONS.VIEW_STAFF),
    canCreateStaff: () => hasPermission(userRole, PERMISSIONS.CREATE_STAFF),
    canEditStaff: () => hasPermission(userRole, PERMISSIONS.EDIT_STAFF),
    canViewBranches: () => hasPermission(userRole, PERMISSIONS.VIEW_BRANCHES),
    canCreateBranches: () =>
      hasPermission(userRole, PERMISSIONS.CREATE_BRANCHES),
    canViewSchedules: () => hasPermission(userRole, PERMISSIONS.VIEW_SCHEDULES),
    canManageSchedules: () =>
      hasPermission(userRole, PERMISSIONS.MANAGE_SCHEDULES),
    isStaff: () => userRole === UserRole.STAFF,
    isHR: () => userRole === UserRole.HR,
    isGDVP: () => userRole === UserRole.GDVP,
    isHROrAbove: () => hasMinimumRole(userRole, UserRole.HR),
    isGDVPOrAbove: () => hasMinimumRole(userRole, UserRole.GDVP),
  };
}

/**
 * Simple hook to check if user can perform a specific action
 */
export function useCanAccess() {
  const permissions = usePermissions();

  return {
    staff: {
      view: permissions.canViewStaff,
      create: permissions.canCreateStaff,
      edit: permissions.canEditStaff,
    },
    branches: {
      view: permissions.canViewBranches,
      create: permissions.canCreateBranches,
    },
    schedules: {
      view: permissions.canViewSchedules,
      manage: permissions.canManageSchedules,
    },
  };
}
