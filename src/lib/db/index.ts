import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create PostgreSQL connection with optimized settings
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Max connection lifetime: 30 minutes
});

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });

export * from './schema';
