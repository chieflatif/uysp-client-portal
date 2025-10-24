import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create PostgreSQL connection with optimized settings
// CRITICAL: Render requires SSL/TLS - postgres-js needs 'require' or SSL config object
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Max connection lifetime: 30 minutes
  ssl: 'require', // Force SSL for all connections (Render requirement)
});

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });

export * from './schema';
