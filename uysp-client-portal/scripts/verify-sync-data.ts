/**
 * Verify synced data in PostgreSQL
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { leads } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function verifyData() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });
  
  try {
    console.log('🔍 Checking synced data in PostgreSQL...\n');
    
    // Check leads with complete data
    const withData = await db.select({
      campaignName: leads.campaignName,
      campaignVariant: leads.campaignVariant,
      linkedinUrl: leads.linkedinUrl,
      enrichmentOutcome: leads.enrichmentOutcome,
    })
    .from(leads)
    .where(sql`${leads.linkedinUrl} IS NOT NULL AND ${leads.campaignVariant} IS NOT NULL`)
    .limit(5);
    
    console.log('✅ Sample leads with LinkedIn AND Variant:');
    withData.forEach((l, idx) => {
      const linkedIn = l.linkedinUrl ? l.linkedinUrl.substring(0, 40) + '...' : 'null';
      console.log(`${idx + 1}. Campaign: "${l.campaignName}" | Variant: ${l.campaignVariant} | LinkedIn: ${linkedIn} | Enrichment: ${l.enrichmentOutcome}`);
    });
    
    // Get statistics
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(campaign_name) as with_campaign,
        COUNT(campaign_variant) as with_variant,
        COUNT(linkedin_url) as with_linkedin,
        COUNT(enrichment_outcome) as with_enrichment
      FROM leads
    `);
    
    const row = stats.rows[0];
    console.log(`\n📊 Database Statistics:`);
    console.log(`  Total leads: ${row.total_leads}`);
    console.log(`  With campaign: ${row.with_campaign}`);
    console.log(`  With variant: ${row.with_variant}`);
    console.log(`  With LinkedIn: ${row.with_linkedin}`);
    console.log(`  With enrichment: ${row.with_enrichment}`);
    
    // Get unique campaigns
    const campaigns = await db.execute(sql`
      SELECT campaign_name, COUNT(*) as count
      FROM leads
      WHERE campaign_name IS NOT NULL
      GROUP BY campaign_name
      ORDER BY count DESC
    `);
    
    console.log(`\n📋 Campaigns Found:`);
    campaigns.rows.forEach((c: any) => {
      console.log(`  - "${c.campaign_name}": ${c.count} leads`);
    });
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

verifyData();

