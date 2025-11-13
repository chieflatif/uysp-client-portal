import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function diagnoseCampaignData() {
  try {
    console.log('🔍 Diagnosing Campaign Data Issues\n');

    // Check what columns exist in campaigns table
    console.log('=== CAMPAIGNS TABLE SCHEMA ===');
    const campaignSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'campaigns'
      ORDER BY ordinal_position
    `);
    const schemaData = campaignSchema.rows || campaignSchema;
    console.table(schemaData);

    // Check sample campaign data
    console.log('\n=== SAMPLE CAMPAIGN DATA (First 5) ===');
    const campaigns = await db.execute(sql`
      SELECT id, name, messages, messages_sent, total_leads, is_active, created_at
      FROM campaigns
      ORDER BY created_at DESC
      LIMIT 5
    `);
    const campaignData = campaigns.rows || campaigns;
    console.table(campaignData);

    // Check if there are leads with campaign_id
    console.log('\n=== LEADS PER CAMPAIGN ===');
    const leadsPerCampaign = await db.execute(sql`
      SELECT
        c.name as campaign_name,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.sms_sent_count > 0 THEN 1 END) as leads_with_messages,
        SUM(l.sms_sent_count) as total_messages_sent
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      GROUP BY c.id, c.name
      ORDER BY total_messages_sent DESC NULLS LAST
      LIMIT 10
    `);
    const leadsData = leadsPerCampaign.rows || leadsPerCampaign;
    console.table(leadsData);

    // Check lead_activity_log for SMS activities
    console.log('\n=== SMS ACTIVITY LOG COUNTS ===');
    const activityCounts = await db.execute(sql`
      SELECT
        action,
        COUNT(*) as count
      FROM lead_activity_log
      WHERE action LIKE '%SMS%' OR action LIKE '%sms%' OR action LIKE '%message%'
      GROUP BY action
      ORDER BY count DESC
    `);
    const activityData = activityCounts.rows || activityCounts;
    console.table(activityData);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnoseCampaignData();
