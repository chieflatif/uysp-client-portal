/**
 * Quick script to check campaign data in PostgreSQL
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db';

async function checkCampaignData() {
  console.log('🔍 Checking campaign data in PostgreSQL...\n');

  // Count leads with campaign names
  const allLeads = await db.query.leads.findMany({
    limit: 100,
  });

  const withCampaign = allLeads.filter(l => l.campaignName);
  const uniqueCampaigns = new Set(allLeads.map(l => l.campaignName).filter(Boolean));

  console.log(`📊 Results from first 100 leads:`);
  console.log(`  - Total leads checked: ${allLeads.length}`);
  console.log(`  - Leads with campaign_name: ${withCampaign.length}`);
  console.log(`  - Unique campaigns: ${uniqueCampaigns.size}`);
  console.log(`\n📝 Campaign names found:`);
  
  uniqueCampaigns.forEach(name => {
    const count = allLeads.filter(l => l.campaignName === name).length;
    console.log(`  - "${name}": ${count} leads`);
  });

  console.log(`\n📋 Sample leads:`);
  allLeads.slice(0, 5).forEach(l => {
    console.log(`  - ${l.firstName} ${l.lastName}`);
    console.log(`    Campaign: ${l.campaignName || 'NULL'}`);
    console.log(`    Processing Status: ${l.processingStatus || 'NULL'}`);
    console.log(`    SMS Sequence Position: ${l.smsSequencePosition || 0}`);
    console.log('');
  });
}

checkCampaignData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });






