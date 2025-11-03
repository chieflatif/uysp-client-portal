/**
 * Permission Helper Functions
 * Handles role-based access control and permission checks
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
 * Check if user can view all clients
 */
export function canViewAllClients(role: string): boolean {
  return isSuperAdmin(role);
}

/**
 * Check if user can add new users to a specific client
 * Takes into account the user count limit (max 2 users per client)
 *
 * @param userId - ID of user trying to add a new user
 * @param role - Role of user trying to add a new user
 * @param clientId - Client ID to add user to
 * @returns Promise<{ canAdd: boolean; reason?: string }>
 */
export async function canAddUser(
  userId: string,
  role: string,
  clientId: string
): Promise<{ canAdd: boolean; reason?: string }> {
  // SUPER_ADMIN can always add users
  if (isSuperAdmin(role)) {
    return { canAdd: true };
  }

  // CLIENT_USER cannot add users
  if (isClientUser(role)) {
    return { canAdd: false, reason: 'CLIENT_USER role cannot add users' };
  }

  // CLIENT_ADMIN can only add users to their own client
  if (isClientAdmin(role)) {
    // Get the admin's client ID
    const admin = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!admin || admin.clientId !== clientId) {
      return { canAdd: false, reason: 'You can only add users to your own client' };
    }

    // Check user count for this client (max 4: 2 admins + 2 users)
    // IMPORTANT: Exclude SUPER_ADMIN users from the count - they don't count towards client limit
    const clientUsers = await db.query.users.findMany({
      where: and(
        eq(users.clientId, clientId),
        eq(users.isActive, true)
      ),
    });

    // Filter out SUPER_ADMIN users - they don't count towards the client's user limit
    const nonSuperAdminUsers = clientUsers.filter(user => user.role !== 'SUPER_ADMIN');

    if (nonSuperAdminUsers.length >= 4) {
      return {
        canAdd: false,
        reason: 'Maximum user limit reached (2 admins + 2 users per client)',
      };
    }

    return { canAdd: true };
  }

  return { canAdd: false, reason: 'Invalid role' };
}

/**
 * Check if user can edit a specific user
 *
 * @param editorRole - Role of user trying to edit
 * @param editorClientId - Client ID of user trying to edit
 * @param targetUserId - ID of user being edited
 * @param targetUserClientId - Client ID of user being edited
 * @returns boolean
 */
export function canEditUser(
  editorRole: string,
  editorClientId: string | null,
  targetUserId: string,
  targetUserClientId: string | null
): boolean {
  // SUPER_ADMIN can edit anyone
  if (isSuperAdmin(editorRole)) {
    return true;
  }

  // CLIENT_ADMIN can edit users in their client
  if (isClientAdmin(editorRole)) {
    return editorClientId === targetUserClientId;
  }

  // CLIENT_USER cannot edit users
  return false;
}

/**
 * Check if user can delete a specific user
 *
 * @param deleterRole - Role of user trying to delete
 * @param deleterClientId - Client ID of user trying to delete
 * @param targetUserRole - Role of user being deleted
 * @param targetUserClientId - Client ID of user being deleted
 * @returns boolean
 */
export function canDeleteUser(
  deleterRole: string,
  deleterClientId: string | null,
  targetUserRole: string,
  targetUserClientId: string | null
): boolean {
  // SUPER_ADMIN can delete anyone except other SUPER_ADMINs
  if (isSuperAdmin(deleterRole)) {
    return !isSuperAdmin(targetUserRole);
  }

  // CLIENT_ADMIN can delete CLIENT_USERs in their client
  if (isClientAdmin(deleterRole)) {
    return (
      deleterClientId === targetUserClientId &&
      isClientUser(targetUserRole)
    );
  }

  // CLIENT_USER cannot delete users
  return false;
}

/**
 * Get user count for a specific client
 *
 * @param clientId - Client ID
 * @returns Promise<number> Number of active users for the client
 */
export async function getUserCountForClient(clientId: string): Promise<number> {
  const clientUsers = await db.query.users.findMany({
    where: and(
      eq(users.clientId, clientId),
      eq(users.isActive, true)
    ),
  });

  return clientUsers.length;
}

/**
 * Validate role transition
 * Ensures role changes follow business rules
 *
 * @param currentRole - Current role of user
 * @param newRole - New role to assign
 * @param editorRole - Role of user making the change
 * @returns { valid: boolean; reason?: string }
 */
export function validateRoleChange(
  currentRole: string,
  newRole: string,
  editorRole: string
): { valid: boolean; reason?: string } {
  // Only SUPER_ADMIN can change roles
  if (!isSuperAdmin(editorRole)) {
    return { valid: false, reason: 'Only SUPER_ADMIN can change user roles' };
  }

  // Cannot change SUPER_ADMIN role
  if (isSuperAdmin(currentRole)) {
    return { valid: false, reason: 'Cannot change SUPER_ADMIN role' };
  }

  // Cannot promote to SUPER_ADMIN
  if (isSuperAdmin(newRole)) {
    return { valid: false, reason: 'Cannot promote users to SUPER_ADMIN' };
  }

  // Valid role change
  return { valid: true };
}

/**
 * Permission matrix for quick reference
 */
export const PERMISSION_MATRIX = {
  [ROLES.SUPER_ADMIN]: {
    viewAllClients: true,
    manageUsers: true,
    editTasks: true,
    syncData: true,
    viewReports: true,
  },
  [ROLES.CLIENT_ADMIN]: {
    viewAllClients: false,
    manageUsers: true, // Limited to their client, max 4 users (2 admins + 2 users)
    editTasks: true,
    syncData: true,
    viewReports: true,
  },
  [ROLES.CLIENT_USER]: {
    viewAllClients: false,
    manageUsers: false,
    editTasks: false, // Read-only
    syncData: false,
    viewReports: true,
  },
} as const;

/**
 * Get permissions for a specific role
 */
export function getPermissions(role: string) {
  return PERMISSION_MATRIX[role as UserRole] || PERMISSION_MATRIX[ROLES.CLIENT_USER];
}
