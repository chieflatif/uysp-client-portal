import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  console.log('🔍 Checking Activity Tables\n');

  // Check all tables with 'activity' in the name
  const tables = await db.execute(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE '%activity%'
    ORDER BY tablename;
  `);

  console.log('📋 Activity tables in database:');
  console.table(tables);

  // Check if lead_activity_log exists and has data
  const leadActivityCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM lead_activity_log;
  `);

  console.log('\n📊 Data in lead_activity_log:');
  console.table(leadActivityCount);

  process.exit(0);
}

checkTables().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
