import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: {
      // SECURITY FIX: Enable SSL certificate validation by default
      // Only disable if explicitly set via DB_SSL_REJECT_UNAUTHORIZED=false (e.g., local development)
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    },
  },
});
