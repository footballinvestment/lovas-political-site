// src/lib/rbac.ts
export enum UserRole {
  USER = "USER",
  EDITOR = "EDITOR",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  exactMatch?: boolean;
}

// Role hierarchy - higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.MODERATOR]: 1,
  [UserRole.EDITOR]: 2,
  [UserRole.ADMIN]: 3,
};

// Admin route permissions
export const ADMIN_ROUTE_PERMISSIONS: RoutePermission[] = [
  // Admin dashboard - Admin only
  {
    path: "/admin",
    allowedRoles: [UserRole.ADMIN],
    exactMatch: true,
  },
  // User management - Admin only
  {
    path: "/admin/users",
    allowedRoles: [UserRole.ADMIN],
  },
  // System settings - Admin only
  {
    path: "/admin/settings",
    allowedRoles: [UserRole.ADMIN],
  },
  // Posts management - Editor and Admin
  {
    path: "/admin/posts",
    allowedRoles: [UserRole.EDITOR, UserRole.ADMIN],
  },
  // Events management - Editor and Admin
  {
    path: "/admin/events",
    allowedRoles: [UserRole.EDITOR, UserRole.ADMIN],
  },
  // Messages management - Moderator, Editor and Admin
  {
    path: "/admin/messages",
    allowedRoles: [UserRole.MODERATOR, UserRole.EDITOR, UserRole.ADMIN],
  },
  // Themes management - Admin only
  {
    path: "/admin/themes",
    allowedRoles: [UserRole.ADMIN],
  },
  // Slides management - Editor and Admin
  {
    path: "/admin/slides",
    allowedRoles: [UserRole.EDITOR, UserRole.ADMIN],
  },
];

export function hasPermission(userRole: string, requiredRoles: UserRole[]): boolean {
  if (!userRole || !Object.values(UserRole).includes(userRole as UserRole)) {
    return false;
  }

  const userRoleEnum = userRole as UserRole;
  const userLevel = ROLE_HIERARCHY[userRoleEnum];

  // Check if user has any of the required roles or higher
  return requiredRoles.some(role => {
    const requiredLevel = ROLE_HIERARCHY[role];
    return userLevel >= requiredLevel;
  });
}

export function canAccessRoute(userRole: string, pathname: string): boolean {
  if (!userRole) return false;

  // Find matching route permission
  const matchingPermission = ADMIN_ROUTE_PERMISSIONS.find(permission => {
    if (permission.exactMatch) {
      return pathname === permission.path;
    }
    return pathname.startsWith(permission.path);
  });

  if (!matchingPermission) {
    // If no specific permission found, allow access (for non-admin routes)
    return true;
  }

  return hasPermission(userRole, matchingPermission.allowedRoles);
}

export function getRequiredRolesForRoute(pathname: string): UserRole[] {
  const matchingPermission = ADMIN_ROUTE_PERMISSIONS.find(permission => {
    if (permission.exactMatch) {
      return pathname === permission.path;
    }
    return pathname.startsWith(permission.path);
  });

  return matchingPermission?.allowedRoles || [];
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "Adminisztrátor";
    case UserRole.EDITOR:
      return "Szerkesztő";
    case UserRole.MODERATOR:
      return "Moderátor";
    case UserRole.USER:
      return "Felhasználó";
    default:
      return "Ismeretlen";
  }
}

export function getRoleColor(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case UserRole.EDITOR:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case UserRole.MODERATOR:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case UserRole.USER:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}