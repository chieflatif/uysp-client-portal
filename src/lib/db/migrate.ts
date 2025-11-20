import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

async function runMigrations() {
  console.log('--- Starting database migration ---');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  const connectionString = `${process.env.DATABASE_URL}?sslmode=require`;
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: 'src/lib/db/migrations' });
    console.log('✅ Migrations completed successfully.');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('--- Database connection closed. ---');
  }
}

runMigrations();




