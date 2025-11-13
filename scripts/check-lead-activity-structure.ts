#!/usr/bin/env tsx
/**
 * Check the structure of lead_activity_log table
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkStructure() {
  console.log('🔍 Checking lead_activity_log structure\n');

  // Get column info
  const columns = await db.execute(sql`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'lead_activity_log'
    ORDER BY ordinal_position
  `);

  console.log('📋 Columns:');
  console.table(columns.rows);

  // Get sample data
  const sample = await db.execute(sql`
    SELECT * FROM lead_activity_log
    ORDER BY timestamp DESC
    LIMIT 3
  `);

  console.log('\n📊 Sample records:');
  if (sample.rows && sample.rows.length > 0) {
    sample.rows.forEach((row: any, i) => {
      console.log(`\nRecord ${i + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 100) {
          console.log(`  ${key}: ${value.substring(0, 100)}...`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      });
    });
  } else {
    console.log('No records found');
  }

  process.exit(0);
}

checkStructure().catch(console.error);