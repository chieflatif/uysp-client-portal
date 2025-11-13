import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function diagnoseLeadsStatus() {
  try {
    console.log('🔍 Diagnosing Leads Status Issues\n');

    // Check what columns exist in leads table
    console.log('=== LEADS TABLE SCHEMA ===');
    const leadsSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `);
    const schemaData = leadsSchema.rows || leadsSchema;
    console.table(schemaData);

    // Check what status values exist in the database
    console.log('\n=== ACTUAL STATUS VALUES IN DATABASE ===');
    const statusValues = await db.execute(sql`
      SELECT
        status,
        processing_status,
        hrq_status,
        COUNT(*) as count
      FROM leads
      GROUP BY status, processing_status, hrq_status
      ORDER BY count DESC
      LIMIT 20
    `);
    const statusData = statusValues.rows || statusValues;
    console.table(statusData);

    // Find Chris Sullivan specifically
    console.log('\n=== CHRIS SULLIVAN LEAD DATA ===');
    const chrisSullivan = await db.execute(sql`
      SELECT
        id,
        first_name,
        last_name,
        status,
        processing_status,
        hrq_status,
        sms_sent_count,
        sms_last_sent_at,
        campaign_id,
        created_at
      FROM leads
      WHERE LOWER(first_name) = 'chris' AND LOWER(last_name) = 'sullivan'
      LIMIT 1
    `);
    const chrisData = chrisSullivan.rows || chrisSullivan;
    if (chrisData && chrisData.length > 0) {
      console.table(chrisData);

      // Check activity for Chris Sullivan
      const leadId = chrisData[0].id;
      console.log(`\n=== ACTIVITY FOR CHRIS SULLIVAN (${leadId}) ===`);
      const activity = await db.execute(sql`
        SELECT
          id,
          action,
          details,
          created_at
        FROM lead_activity_log
        WHERE lead_id = ${leadId}
        ORDER BY created_at DESC
        LIMIT 10
      `);
      const activityData = activity.rows || activity;
      if (activityData && activityData.length > 0) {
        console.table(activityData);
      } else {
        console.log('❌ NO ACTIVITY FOUND');
      }
    } else {
      console.log('❌ Chris Sullivan not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnoseLeadsStatus();
