import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// CRITICAL FIX: Validate DATABASE_URL exists before attempting connection
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please configure your database connection string.'
  );
}

// CRITICAL FIX: Validate DATABASE_URL format (basic check)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  throw new Error(
    `Invalid DATABASE_URL format: "${databaseUrl.substring(0, 20)}...". Must start with postgres:// or postgresql://`
  );
}

// SECURITY FIX: Enable SSL certificate validation by default
// Only disable if explicitly set via DB_SSL_REJECT_UNAUTHORIZED=false (e.g., local development with self-signed certs)
const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

if (!sslRejectUnauthorized) {
  console.warn('⚠️ WARNING: SSL certificate validation is DISABLED (DB_SSL_REJECT_UNAUTHORIZED=false). This should ONLY be used in development.');
}

// Create PostgreSQL connection with optimized settings
const client = postgres(databaseUrl, {
  prepare: false,
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Max connection lifetime: 30 minutes
  ssl: { rejectUnauthorized: sslRejectUnauthorized }, // FIXED: Enable SSL validation by default for security
});

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });

export * from './schema';
