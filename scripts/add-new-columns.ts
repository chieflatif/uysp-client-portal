/**
 * Add only the new columns to leads table
 * (sms_audit and sms_templates tables already exist)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(__dirname, '../.env.local') });

async function addNewColumns() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to database...');
  const sql = postgres(databaseUrl);
  
  try {
    console.log('⚡ Adding new columns to leads table...\n');
    
    // Add new columns
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_variant varchar(10)`;
    console.log('  ✓ Added campaign_variant');
    
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_eligible boolean DEFAULT true`;
    console.log('  ✓ Added sms_eligible');
    
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_url varchar(500)`;
    console.log('  ✓ Added linkedin_url');
    
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_linkedin varchar(500)`;
    console.log('  ✓ Added company_linkedin');
    
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_outcome varchar(100)`;
    console.log('  ✓ Added enrichment_outcome');
    
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_attempted_at timestamp`;
    console.log('  ✓ Added enrichment_attempted_at');
    
    // Add indexes
    console.log('\n⚡ Creating indexes...\n');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_campaign_variant ON leads USING btree (campaign_variant)`;
    console.log('  ✓ Index on campaign_variant');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_enrichment_outcome ON leads USING btree (enrichment_outcome)`;
    console.log('  ✓ Index on enrichment_outcome');
    
    console.log('\n✅ Schema update complete!');
    console.log('\n📊 New fields available:');
    console.log('  Campaign:');
    console.log('    - campaign_variant (A/B test group)');
    console.log('    - sms_eligible (can receive SMS)');
    console.log('  LinkedIn & Enrichment:');
    console.log('    - linkedin_url (personal profile)');
    console.log('    - company_linkedin (company page)');
    console.log('    - enrichment_outcome (success/failure)');
    console.log('    - enrichment_attempted_at (timestamp)');
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Failed:', error);
    await sql.end();
    process.exit(1);
  }
}

addNewColumns();



