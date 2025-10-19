import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create PostgreSQL connection
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
});

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });

export * from './schema';
