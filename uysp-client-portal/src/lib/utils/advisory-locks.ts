import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * PostgreSQL Advisory Locks Utility
 *
 * Advisory locks provide application-level locking that prevents race conditions
 * without requiring table-level locks. They're automatically released when the
 * database session ends or when explicitly unlocked.
 *
 * Use Cases:
 * - Prevent concurrent modifications to the same record
 * - Ensure atomic operations across multiple tables
 * - Prevent duplicate processing of jobs/tasks
 *
 * References:
 * https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS
 */

/**
 * Convert a UUID or string to a bigint for advisory lock
 *
 * PostgreSQL advisory locks require a bigint (64-bit integer).
 * We hash the ID and take the first 60 bits to get a unique lock ID.
 *
 * @param id - UUID or string to lock
 * @returns bigint for use with pg_advisory_lock
 */
function idToLockNumber(id: string): string {
  // Use MD5 hash of the ID and convert first 15 hex chars to 60-bit number
  // This gives us a unique, deterministic lock number for each ID
  return `('x' || substring(md5('${id}'::text), 1, 15))::bit(60)::bigint`;
}

/**
 * Acquire an advisory lock (blocking)
 *
 * Waits until the lock is available. Use this when you MUST complete the operation
 * and can wait for other processes to finish.
 *
 * @param id - Resource ID to lock
 * @returns true if lock acquired (always returns true, blocks until available)
 */
export async function acquireAdvisoryLock(id: string): Promise<boolean> {
  try {
    await db.execute(sql.raw(`SELECT pg_advisory_lock(${idToLockNumber(id)})`));
    return true;
  } catch (error) {
    console.error(`Failed to acquire advisory lock for ${id}:`, error);
    return false;
  }
}

/**
 * Try to acquire an advisory lock (non-blocking)
 *
 * Returns immediately with true/false. Use this when you want to fail fast
 * if the resource is currently locked.
 *
 * @param id - Resource ID to lock
 * @returns true if lock acquired, false if already locked
 */
export async function tryAcquireAdvisoryLock(id: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql.raw(`SELECT pg_try_advisory_lock(${idToLockNumber(id)}) as acquired`)
    );

    // Check if lock was acquired
    const rows = result as unknown as Array<{ acquired: boolean }>;
    return rows[0]?.acquired ?? false;
  } catch (error) {
    console.error(`Failed to try advisory lock for ${id}:`, error);
    return false;
  }
}

/**
 * Release an advisory lock
 *
 * Should be called after completing the protected operation.
 * Locks are automatically released when the database session ends.
 *
 * @param id - Resource ID to unlock
 * @returns true if lock was released
 */
export async function releaseAdvisoryLock(id: string): Promise<boolean> {
  try {
    await db.execute(sql.raw(`SELECT pg_advisory_unlock(${idToLockNumber(id)})`));
    return true;
  } catch (error) {
    console.error(`Failed to release advisory lock for ${id}:`, error);
    return false;
  }
}

/**
 * Execute a function with an advisory lock
 *
 * Convenience wrapper that acquires a lock, executes the function,
 * and releases the lock even if the function throws.
 *
 * @param id - Resource ID to lock
 * @param fn - Function to execute while holding the lock
 * @param blocking - Whether to wait for lock (true) or fail fast (false)
 * @returns Result of the function
 */
export async function withAdvisoryLock<T>(
  id: string,
  fn: () => Promise<T>,
  blocking: boolean = false
): Promise<T> {
  // Try to acquire lock
  const acquired = blocking
    ? await acquireAdvisoryLock(id)
    : await tryAcquireAdvisoryLock(id);

  if (!acquired) {
    throw new Error(`Failed to acquire lock for resource: ${id}`);
  }

  try {
    // Execute function while holding lock
    return await fn();
  } finally {
    // Always release lock, even if function throws
    await releaseAdvisoryLock(id);
  }
}

/**
 * Check if a resource is currently locked
 *
 * Note: This is a best-effort check. The lock status may change
 * immediately after this function returns.
 *
 * @param id - Resource ID to check
 * @returns true if currently locked
 */
export async function isLocked(id: string): Promise<boolean> {
  try {
    // Try to acquire and immediately release
    const acquired = await tryAcquireAdvisoryLock(id);
    if (acquired) {
      await releaseAdvisoryLock(id);
      return false; // Was not locked
    }
    return true; // Was locked
  } catch (error) {
    console.error(`Failed to check lock status for ${id}:`, error);
    return false;
  }
}
