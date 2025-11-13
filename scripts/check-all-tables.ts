import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function checkAllTables() {
  try {
    console.log('🔍 Checking all tables in database...\n');

    const tables = ['users', 'clients', 'leads', 'campaigns', 'notes'];

    for (const table of tables) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
        const count = result[0]?.count || result.rows?.[0]?.count || 0;
        console.log(`${table.padEnd(15)} ${count} records`);
      } catch (error) {
        console.log(`${table.padEnd(15)} ❌ Error: ${error.message}`);
      }
    }

    console.log('\n---');
    console.log('Database connection string (masked):');
    const dbUrl = process.env.DATABASE_URL || '';
    const masked = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log(masked);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllTables();
