import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function diagnose() {
  console.log('🔍 Diagnosing Lead Data Issues\n');

  // Check leads with campaign IDs
  console.log('📊 Sample leads with campaign data:');
  const leadsWithCampaigns = await db.execute(sql`
    SELECT
      id,
      first_name,
      last_name,
      campaign_id,
      enrolled_message_count,
      sms_sequence_position,
      sms_sent_count,
      sms_last_sent_at,
      engagement_level,
      processing_status,
      booked,
      sms_stop
    FROM leads
    WHERE campaign_id IS NOT NULL
    LIMIT 5;
  `);
  console.table(leadsWithCampaigns);

  // Check campaigns with message counts
  console.log('\n📊 Sample campaigns with message data:');
  const campaignsWithMessages = await db.execute(sql`
    SELECT
      id,
      name,
      messages,
      messages_sent,
      total_leads
    FROM campaigns
    LIMIT 5;
  `);
  console.table(campaignsWithMessages);

  // Check counts
  console.log('\n📊 Data Counts:');
  const counts = await db.execute(sql`
    SELECT
      'Total Leads' as metric,
      COUNT(*) as count
    FROM leads
    UNION ALL
    SELECT
      'Leads with campaign_id',
      COUNT(*)
    FROM leads
    WHERE campaign_id IS NOT NULL
    UNION ALL
    SELECT
      'Leads with enrolled_message_count > 0',
      COUNT(*)
    FROM leads
    WHERE enrolled_message_count > 0
    UNION ALL
    SELECT
      'Leads with sms_last_sent_at',
      COUNT(*)
    FROM leads
    WHERE sms_last_sent_at IS NOT NULL;
  `);
  console.table(counts);

  process.exit(0);
}

diagnose().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
