/**
 * GLOBAL DATABASE CONNECTION POOL
 *
 * Singleton pattern - one pool for entire application lifetime.
 * Reused across all requests to avoid connection overhead.
 */

import { Pool } from 'pg';

let globalPool: Pool | null = null;

/**
 * Get or create the global connection pool
 */
export function getGlobalPool(): Pool {
  if (!globalPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    globalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,                    // Maximum pool size
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Timeout if can't get connection in 10s
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    });

    // Log pool events
    globalPool.on('connect', () => {
      console.log('[Pool] New client connected');
    });

    globalPool.on('error', (err) => {
      console.error('[Pool] Unexpected error on idle client', err);
    });

    globalPool.on('remove', () => {
      console.log('[Pool] Client removed from pool');
    });

    console.log('[Pool] Created global connection pool');
  }

  return globalPool;
}

/**
 * Execute query with timeout and retry
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 5000,
  retries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        ),
      ]);

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`[Pool] Attempt ${attempt}/${retries} failed:`, lastError.message);

      if (attempt < retries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[Pool] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Graceful shutdown - close pool
 */
export async function closePool(): Promise<void> {
  if (globalPool) {
    console.log('[Pool] Closing connection pool...');
    await globalPool.end();
    globalPool = null;
    console.log('[Pool] Connection pool closed');
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', closePool);
  process.on('SIGINT', closePool);
}
