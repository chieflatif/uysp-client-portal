import { db } from '@/lib/db';
import { rateLimits } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

/**
 * Database-based rate limiting for serverless environments
 *
 * Fixes BUG #11: In-memory rate limiting doesn't work across serverless instances
 *
 * This implementation uses PostgreSQL as the rate limit store, which works
 * perfectly across all Vercel serverless functions.
 */

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowMs: number; // Window duration in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  currentCount: number;
  limit: number;
}

/**
 * Check rate limit for a user and endpoint
 *
 * @param userId - UUID of the user
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - (now.getTime() % config.windowMs));
  const windowEnd = new Date(windowStart.getTime() + config.windowMs);

  try {
    // Try to find existing rate limit record for this window
    const existingLimit = await db.query.rateLimits.findFirst({
      where: and(
        eq(rateLimits.userId, userId),
        eq(rateLimits.endpoint, config.endpoint),
        gt(rateLimits.windowEnd, now) // Not expired
      ),
      orderBy: (rateLimits, { desc }) => [desc(rateLimits.windowStart)],
    });

    if (existingLimit) {
      // Check if limit exceeded
      if (existingLimit.requestCount >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: existingLimit.windowEnd,
          currentCount: existingLimit.requestCount,
          limit: config.maxRequests,
        };
      }

      // Increment counter using raw SQL for atomic increment
      await db.execute(sql`
        UPDATE rate_limits
        SET request_count = request_count + 1,
            updated_at = NOW()
        WHERE id = ${existingLimit.id}
      `);

      return {
        allowed: true,
        remaining: config.maxRequests - (existingLimit.requestCount + 1),
        resetAt: existingLimit.windowEnd,
        currentCount: existingLimit.requestCount + 1,
        limit: config.maxRequests,
      };
    }

    // No existing record - create new window
    await db.insert(rateLimits).values({
      userId,
      endpoint: config.endpoint,
      requestCount: 1,
      windowStart,
      windowEnd,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: windowEnd,
      currentCount: 1,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);

    // On error, allow the request but log it
    // This prevents rate limiting from breaking the entire app
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: windowEnd,
      currentCount: 0,
      limit: config.maxRequests,
    };
  }
}

/**
 * Reset rate limit for a user and endpoint
 *
 * Useful for testing or administrative actions
 *
 * @param userId - UUID of the user
 * @param endpoint - Endpoint to reset
 */
export async function resetRateLimit(
  userId: string,
  endpoint: string
): Promise<void> {
  await db
    .delete(rateLimits)
    .where(and(eq(rateLimits.userId, userId), eq(rateLimits.endpoint, endpoint)));
}

/**
 * Clean up expired rate limit records
 *
 * Should be run periodically (e.g., via cron job)
 * Deletes records older than 7 days
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await db.execute(sql`
    DELETE FROM rate_limits
    WHERE window_end < ${sevenDaysAgo}
  `);
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  AI_MESSAGE_GENERATION: {
    endpoint: 'ai-message-generation',
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  LOGIN: {
    endpoint: 'login',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  PASSWORD_RESET: {
    endpoint: 'password-reset',
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  API_SYNC: {
    endpoint: 'api-sync',
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;
