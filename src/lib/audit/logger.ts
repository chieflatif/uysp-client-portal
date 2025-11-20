/**
 * Security Audit Logger
 *
 * Tracks sensitive operations for compliance (GDPR, SOC2, etc.)
 * Logs to database for persistent audit trail
 */

import { db } from '@/lib/db';
import { securityAuditLog } from '@/lib/db/schema';
import { NextRequest } from 'next/server';

export type AuditAction =
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'USER_ACTIVATED'
  | 'ROLE_CHANGED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_DEACTIVATED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'DATA_EXPORT'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export type ResourceType =
  | 'USER'
  | 'CLIENT'
  | 'LEAD'
  | 'TASK'
  | 'CAMPAIGN'
  | 'SYSTEM';

type AuditMetadata = Record<string, unknown>;

interface AuditLogParams {
  userId: string;
  userRole: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  clientId?: string | null;
  request?: NextRequest;
  metadata?: AuditMetadata;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Log a security-relevant action to the audit trail
 *
 * @example
 * await logSecurityAudit({
 *   userId: session.user.id,
 *   userRole: session.user.role,
 *   action: 'PASSWORD_RESET',
 *   resourceType: 'USER',
 *   resourceId: targetUserId,
 *   clientId: session.user.clientId,
 *   request,
 *   metadata: { reason: 'User forgot password' },
 * });
 */
export async function logSecurityAudit({
  userId,
  userRole,
  action,
  resourceType,
  resourceId,
  clientId = null,
  request,
  metadata = {},
  success = true,
  errorMessage,
}: AuditLogParams): Promise<void> {
  try {
    // Extract IP and User-Agent from request
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (request) {
      // Get real IP (handling proxies)
      ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        null;

      userAgent = request.headers.get('user-agent') || null;
    }

    // SECURITY: Strip any PII from metadata
    const sanitizedMetadata = sanitizeMetadata(metadata);

    await db.insert(securityAuditLog).values({
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      clientId,
      ipAddress,
      userAgent,
      metadata: sanitizedMetadata,
      success,
      errorMessage,
    });

    // Console log for immediate visibility (use IDs only, no PII)
    const logSymbol = success ? '✅' : '❌';
    console.log(
      `${logSymbol} [AUDIT] ${action} by user ${userId} (${userRole}) on ${resourceType} ${resourceId}` +
        (errorMessage ? ` - Error: ${errorMessage}` : '')
    );
  } catch (error) {
    // Audit logging must never break the application
    console.error('⚠️ Failed to log audit event:', error);
  }
}

/**
 * Remove PII from metadata object
 * Strips keys that commonly contain sensitive data
 */
function sanitizeMetadata(metadata: AuditMetadata): AuditMetadata {
  const sensitiveKeys = [
    'email',
    'password',
    'passwordHash',
    'phone',
    'ssn',
    'creditCard',
    'token',
    'secret',
    'apiKey',
  ];

  const sanitized: AuditMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();

    // Skip sensitive keys
    if (sensitiveKeys.some((sensitive) => keyLower.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as AuditMetadata);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get audit logs for a specific user
 * Useful for showing users their own activity history
 */
export async function getAuditLogsForUser(
  userId: string,
  limit: number = 50
) {
  return await db.query.securityAuditLog.findMany({
    where: (log, { eq }) => eq(log.userId, userId),
    orderBy: (log, { desc }) => [desc(log.createdAt)],
    limit,
  });
}

/**
 * Get audit logs for a specific resource
 * Useful for seeing who accessed/modified a resource
 */
export async function getAuditLogsForResource(
  resourceType: ResourceType,
  resourceId: string,
  limit: number = 50
) {
  return await db.query.securityAuditLog.findMany({
    where: (log, { eq, and }) =>
      and(eq(log.resourceType, resourceType), eq(log.resourceId, resourceId)),
    orderBy: (log, { desc }) => [desc(log.createdAt)],
    limit,
  });
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit: number = 100) {
  return await db.query.securityAuditLog.findMany({
    orderBy: (log, { desc }) => [desc(log.createdAt)],
    limit,
  });
}
