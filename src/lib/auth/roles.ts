/**
 * Authentication Role Constants
 *
 * Single source of truth for all role-based access control.
 * Used across API routes, pages, and components.
 */

export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'CLIENT_ADMIN',
  'CLIENT',
  'CLIENT_USER',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * Check if a role has admin access
 */
export function isAdminRole(role: string | undefined): role is AdminRole {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Check if user is SUPER_ADMIN (highest privilege)
 */
export function isSuperAdmin(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Check if user can manage clients (SUPER_ADMIN only)
 */
export function canManageClients(role: string | undefined): boolean {
  return isSuperAdmin(role);
}

/**
 * Check if user can manage campaigns (all admin roles)
 */
export function canManageCampaigns(role: string | undefined): boolean {
  return isAdminRole(role);
}
