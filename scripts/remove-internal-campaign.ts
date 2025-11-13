#!/usr/bin/env tsx
/**
 * Remove internal "Call Booked - Sales Team" campaign
 * This campaign is not a real campaign but internal tracking that pollutes analytics
 */

import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

async function removeInternalCampaign() {
  console.log('🗑️  REMOVING INTERNAL CAMPAIGN: "Call Booked - Sales Team"');
  console.log('='.repeat(60));

  const campaignId = '42066b89-2283-44ba-bfbd-fb87efe4db99';

  try {
    // First, check current state
    console.log('\n📊 Checking current state...');
    const campaign = await db.execute(sql`
      SELECT name, id,
        (SELECT COUNT(*) FROM leads WHERE campaign_id = ${campaignId}) as lead_count
      FROM campaigns
      WHERE id = ${campaignId}
    `);

    if (campaign.length === 0) {
      console.log('✅ Campaign already removed or does not exist');
      return;
    }

    const campaignData = campaign[0] as any;
    console.log(`Found campaign: ${campaignData.name}`);
    console.log(`Lead count: ${campaignData.lead_count}`);

    // Get details of leads that will be affected
    const affectedLeads = await db.execute(sql`
      SELECT id, first_name, last_name, email, booked
      FROM leads
      WHERE campaign_id = ${campaignId}
    `);

    console.log(`\n📋 Affected leads (${affectedLeads.length}):`);
    affectedLeads.forEach((lead: any) => {
      console.log(`  - ${lead.first_name} ${lead.last_name} (${lead.email}) - Booked: ${lead.booked}`);
    });

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete:');
    console.log(`  - 1 campaign: "${campaignData.name}"`);
    console.log(`  - ${campaignData.lead_count} associated leads`);
    console.log('\nTo proceed, run with --confirm flag');

    if (process.argv.includes('--confirm')) {
      console.log('\n🔄 Proceeding with deletion...');

      // Delete leads first (due to foreign key constraint)
      const deletedLeads = await db.execute(sql`
        DELETE FROM leads
        WHERE campaign_id = ${campaignId}
        RETURNING id
      `);
      console.log(`✅ Deleted ${deletedLeads.length} leads`);

      // Delete campaign
      const deletedCampaign = await db.execute(sql`
        DELETE FROM campaigns
        WHERE id = ${campaignId}
        RETURNING name
      `);
      console.log(`✅ Deleted campaign: ${(deletedCampaign[0] as any).name}`);

      console.log('\n✅ INTERNAL CAMPAIGN REMOVED SUCCESSFULLY');
    } else {
      console.log('\n❌ Deletion cancelled (add --confirm to proceed)');
    }

  } catch (error) {
    console.error('❌ Error removing campaign:', error);
  }
}

// Execute
removeInternalCampaign().catch(console.error);