import { defineConfig } from 'drizzle-kit';

const useSecureSsl = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: useSecureSsl
      ? {
          // SECURITY FIX: Enable SSL certificate validation by default
          // Only disable if explicitly set via DB_SSL_REJECT_UNAUTHORIZED=false (e.g., local development)
          rejectUnauthorized: true,
        }
      : false,
  },
});
