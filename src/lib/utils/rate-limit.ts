/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or similar
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limit a request
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param action - Action being rate limited (e.g., 'login', 'change-password')
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns Result indicating if request is allowed
 */
export async function rateLimit(
  identifier: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: maxAttempts - 1,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  // Check if exceeded
  if (entry.count > maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    remaining: maxAttempts - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific identifier and action
 * Useful for testing or manual resets
 */
export function resetRateLimit(identifier: string, action: string): void {
  const key = `${action}:${identifier}`;
  rateLimitStore.delete(key);
}
