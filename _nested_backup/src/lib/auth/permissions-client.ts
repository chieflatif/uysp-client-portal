/**
 * Client-Safe Permission Helper Functions
 * These functions don't import database and can be used in client components
 */

// Role definitions
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLIENT_ADMIN: 'CLIENT_ADMIN',
  CLIENT_USER: 'CLIENT_USER',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Check if user has SUPER_ADMIN role
 */
export function isSuperAdmin(role: string): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Check if user has CLIENT_ADMIN role
 */
export function isClientAdmin(role: string): boolean {
  return role === ROLES.CLIENT_ADMIN;
}

/**
 * Check if user has CLIENT_USER role
 */
export function isClientUser(role: string): boolean {
  return role === ROLES.CLIENT_USER;
}

/**
 * Check if user can manage users (add/edit/delete)
 */
export function canManageUsers(role: string): boolean {
  return isSuperAdmin(role) || isClientAdmin(role);
}

/**
 * Check if user can edit tasks and data
 */
export function canEditTasks(role: string): boolean {
  return isSuperAdmin(role) || isClientAdmin(role);
}

/**
 * Check if user can sync data from Airtable
 */
export function canSyncData(role: string): boolean {
  return isSuperAdmin(role) || isClientAdmin(role);
}

/**
 * Check if user can view admin menu
 */
export function canViewAdminMenu(role: string): boolean {
  return isSuperAdmin(role) || isClientAdmin(role);
}

/**
 * Check if user can access all clients (client selector)
 */
export function canAccessAllClients(role: string): boolean {
  return isSuperAdmin(role);
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: string): string {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'Super Admin';
    case ROLES.CLIENT_ADMIN:
      return 'Admin';
    case ROLES.CLIENT_USER:
      return 'User';
    default:
      return 'Unknown';
  }
}

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'bg-pink-700 text-white';
    case ROLES.CLIENT_ADMIN:
      return 'bg-indigo-600 text-white';
    case ROLES.CLIENT_USER:
      return 'bg-gray-700 text-gray-300';
    default:
      return 'bg-gray-700 text-gray-300';
  }
}
