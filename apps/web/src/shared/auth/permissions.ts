import { UserRole } from '@qnoffice/shared';

// Re-export UserRole for convenience
export { UserRole } from '@qnoffice/shared';

const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.STAFF]: [UserRole.STAFF],
  [UserRole.HR]: [UserRole.STAFF, UserRole.HR],
  [UserRole.GDVP]: [UserRole.STAFF, UserRole.HR, UserRole.GDVP],
};
export interface Permission {
  readonly roles: readonly UserRole[];
  requireAll?: boolean;
}
const ALL_ROLES = [UserRole.GDVP, UserRole.HR, UserRole.STAFF];
export const PERMISSIONS = {
  VIEW_STAFF: { roles: ALL_ROLES },
  CREATE_STAFF: { roles: [UserRole.HR, UserRole.GDVP] },
  EDIT_STAFF: { roles: [UserRole.HR, UserRole.GDVP] },
  VIEW_BRANCHES: { roles: ALL_ROLES },
  CREATE_BRANCHES: { roles: [UserRole.GDVP] },
  VIEW_SCHEDULES: { roles: ALL_ROLES },
  MANAGE_SCHEDULES: { roles: [UserRole.HR, UserRole.GDVP] },
  VIEW_HOLIDAYS: { roles: ALL_ROLES },
  MANAGE_HOLIDAYS: { roles: [UserRole.HR, UserRole.GDVP] },
  VIEW_OPENTALK: { roles: ALL_ROLES },
  MANAGE_OPENTALK: { roles: [UserRole.HR, UserRole.GDVP] },
  CREATE_OPENTALK_SWAP_REQUEST: { roles: ALL_ROLES },
  MANAGE_OPENTALK_SWAP_REQUESTS: { roles: [UserRole.HR, UserRole.GDVP] },
  APPROVE_OPENTALK_SWAP_REQUESTS: { roles: [UserRole.GDVP, UserRole.HR] },
  APPROVE_OPENTALK_SLIDES: { roles: [UserRole.GDVP] },
  EDIT_OPENTALK_TOPIC: { roles: [UserRole.HR, UserRole.GDVP] },
  EDIT_OWN_OPENTALK_TOPIC: { roles: ALL_ROLES },
  VIEW_PENALTIES: { roles: ALL_ROLES },
  MANAGE_PENALTIES: { roles: [UserRole.HR, UserRole.GDVP] },
  CREATE_PENALTIES: { roles: [UserRole.HR] },
  MANAGE_PENALTY_TYPES: { roles: [UserRole.HR] },
  MANAGE_CHANNELS: { roles: [UserRole.HR, UserRole.GDVP] },
  CREATE_CLEANING_SWAP_REQUEST: { roles: ALL_ROLES },
  MANAGE_CLEANING_SWAP_REQUESTS: { roles: [UserRole.HR, UserRole.GDVP] },
  APPROVE_CLEANING_SWAP_REQUESTS: { roles: [UserRole.GDVP, UserRole.HR] },
  MANAGE_CLEANING: { roles: [UserRole.HR, UserRole.GDVP] },
};

export function hasPermission(
  userRole: UserRole | number | null | undefined,
  permission: Permission,
): boolean {
  if (userRole === null || userRole === undefined) return false;

  const role = typeof userRole === 'number' ? (userRole as UserRole) : userRole;
  const userPermissions = ROLE_HIERARCHY[role] || [];

  if (permission.requireAll) {
    return permission.roles.every((requiredRole) =>
      userPermissions.includes(requiredRole),
    );
  }

  return permission.roles.some((requiredRole) =>
    userPermissions.includes(requiredRole),
  );
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  userRole: UserRole | number | null | undefined,
  roles: UserRole[],
): boolean {
  return hasPermission(userRole, { roles });
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(
  userRole: UserRole | number | null | undefined,
  roles: UserRole[],
): boolean {
  return hasPermission(userRole, { roles, requireAll: true });
}

/**
 * Get role label for display
 */
export function getRoleLabel(
  role: UserRole | number | null | undefined,
): string {
  switch (role) {
    case UserRole.STAFF:
      return 'Staff';
    case UserRole.HR:
      return 'HR';
    case UserRole.GDVP:
      return 'GDVP';
    default:
      return 'N/A';
  }
}

/**
 * Check if role is higher than or equal to minimum required role
 */
export function hasMinimumRole(
  userRole: UserRole | number | null | undefined,
  minimumRole: UserRole,
): boolean {
  if (userRole === null || userRole === undefined) return false;

  const role = typeof userRole === 'number' ? (userRole as UserRole) : userRole;
  return role >= minimumRole;
}

/**
 * Check if user can edit their own opentalk content
 */
export function canEditOwnContent(
  userRole: UserRole | number | null | undefined,
  contentOwnerId: number | null | undefined,
  currentUserId: number | null | undefined,
): boolean {
  if (!currentUserId || !contentOwnerId) return false;

  // GDVP and HR can edit any content
  if (hasPermission(userRole, PERMISSIONS.EDIT_OPENTALK_TOPIC)) {
    return true;
  }

  // Staff can edit their own content
  if (
    hasPermission(userRole, PERMISSIONS.EDIT_OWN_OPENTALK_TOPIC) &&
    contentOwnerId === currentUserId
  ) {
    return true;
  }

  return false;
}
