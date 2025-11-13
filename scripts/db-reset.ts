import postgres from 'postgres';
import 'dotenv/config';
import 'dotenv/config'; // Ensure environment variables are loaded

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  if (!process.env.DATABASE_URL.includes('uysp-portal-staging')) {
    console.error('❌ DANGER: DATABASE_URL does not seem to be the staging database.');
    console.error('   Aborting reset operation as a safety measure.');
    process.exit(1);
  }

  console.log('--- Connecting to the database to reset schema... ---');
  const connectionString = `${process.env.DATABASE_URL}?sslmode=require`;
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('--- Dropping and recreating public schema... ---');
    await sql.unsafe('DROP SCHEMA public CASCADE;');
    console.log('✅ Schema "public" dropped.');
    await sql.unsafe('CREATE SCHEMA public;');
    console.log('✅ Schema "public" created.');
    console.log('--- Database schema reset complete. ---');
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('--- Database connection closed. ---');
  }
}

resetDatabase();
