import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function verifyDatabase() {
  console.log('🔍 Verifying database connection and schema...\n');
  
  // Check what tables exist
  const tables = await db.execute(sql`
    SELECT 
      schemaname, 
      tablename 
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename;
  `);
  
  console.log('📊 Tables in database:');
  console.table(tables);
  
  // Check migrations
  const migrations = await db.execute(sql`
    SELECT * FROM drizzle.__drizzle_migrations 
    ORDER BY created_at DESC LIMIT 3;
  `);
  
  console.log('\n📋 Recent migrations:');
  console.table(migrations);
  
  // Try to check if leads table exists specifically
  try {
    const leadCount = await db.execute(sql`SELECT COUNT(*) FROM leads;`);
    console.log('\n✅ Leads table exists, count:', leadCount);
  } catch (error: any) {
    console.log('\n❌ Leads table does not exist:', error.message);
  }
  
  process.exit(0);
}

verifyDatabase().catch(console.error);
