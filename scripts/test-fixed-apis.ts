#!/usr/bin/env tsx
/**
 * Test the fixed APIs - activity and notes
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function testAPIs() {
  console.log('🔧 Testing Fixed APIs\n');

  // 1. Test lead_activity_log query from schema
  console.log('1️⃣ Testing leadActivityLog query from schema...');
  try {
    const activities = await db.query.leadActivityLog.findMany({
      limit: 3,
    });
    console.log(`✅ Successfully queried ${activities.length} activities from schema`);
    if (activities.length > 0) {
      console.log('Sample activity:', {
        eventType: activities[0].eventType,
        timestamp: activities[0].timestamp,
        messageContent: activities[0].messageContent?.substring(0, 50) + '...',
      });
    }
  } catch (error) {
    console.error('❌ Error querying leadActivityLog:', error);
  }

  // 2. Test notes for a lead with data
  console.log('\n2️⃣ Testing notes API for a lead...');
  const leadWithNotes = await db.execute(sql`
    SELECT id, first_name, last_name, notes
    FROM leads
    WHERE notes IS NOT NULL
    LIMIT 1
  `);

  if (leadWithNotes.rows && leadWithNotes.rows.length > 0) {
    const lead = leadWithNotes.rows[0] as any;
    console.log(`Found lead with notes: ${lead.first_name} ${lead.last_name}`);
    console.log(`Notes preview: ${String(lead.notes)?.substring(0, 100)}...`);
  } else {
    console.log('No leads have notes yet (expected - needs Airtable sync)');
  }

  // 3. Count total activities in lead_activity_log
  console.log('\n3️⃣ Activity statistics...');
  const stats = await db.execute(sql`
    SELECT
      event_type,
      COUNT(*) as count,
      MAX(timestamp) as latest
    FROM lead_activity_log
    GROUP BY event_type
    ORDER BY count DESC
  `);

  console.log('Activity breakdown:');
  console.table(stats.rows);

  // 4. Check recent activities (simulating API call)
  console.log('\n4️⃣ Simulating /api/activity/recent...');
  const recentActivities = await db.query.leadActivityLog.findMany({
    orderBy: (log, { desc }) => [desc(log.timestamp)],
    limit: 5,
  });

  console.log(`Found ${recentActivities.length} recent activities`);
  recentActivities.forEach((activity, i) => {
    console.log(`  ${i + 1}. ${activity.eventType} at ${activity.timestamp}`);
  });

  process.exit(0);
}

testAPIs().catch(console.error);