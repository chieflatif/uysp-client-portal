/**
 * Assign Client ID to Existing Users and Leads
 * 
 * Run this once after creating your first client to update
 * existing users and leads with the correct clientId
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import postgres from 'postgres';

async function assignClientToExistingData() {
  const sql = postgres(process.env.DATABASE_URL!);
  
  try {
    console.log('🔧 Assigning Client ID to Existing Data...\n');
    
    // Get the first (and only) client
    const clients = await sql`SELECT * FROM clients LIMIT 1`;
    
    if (clients.length === 0) {
      console.log('❌ No client found! Run: npx tsx scripts/setup-first-client.ts');
      process.exit(1);
    }
    
    const clientId = clients[0].id;
    console.log(`✅ Found client: ${clients[0].company_name} (${clientId})\n`);
    
    // Update users without clientId
    console.log('👥 Updating users...');
    const updatedUsers = await sql`
      UPDATE users 
      SET client_id = ${clientId}, updated_at = NOW()
      WHERE client_id IS NULL
      RETURNING email
    `;
    console.log(`   ✅ Updated ${updatedUsers.length} user(s)`);
    updatedUsers.forEach(u => console.log(`      - ${u.email}`));
    
    // Update leads with default clientId
    console.log('\n📋 Updating leads...');
    const updatedLeads = await sql`
      UPDATE leads 
      SET client_id = ${clientId}, updated_at = NOW()
      WHERE client_id = '00000000-0000-0000-0000-000000000000'
      RETURNING id
    `;
    console.log(`   ✅ Updated ${updatedLeads.length} lead(s) with default clientId`);
    
    // Check if any leads are still without proper clientId
    const leadsWithoutClient = await sql`
      SELECT COUNT(*) as count FROM leads WHERE client_id IS NULL
    `;
    
    if (Number(leadsWithoutClient[0].count) > 0) {
      console.log(`   ⚠️  ${leadsWithoutClient[0].count} leads still without clientId`);
      const updateRemaining = await sql`
        UPDATE leads 
        SET client_id = ${clientId}, updated_at = NOW()
        WHERE client_id IS NULL
        RETURNING id
      `;
      console.log(`   ✅ Fixed ${updateRemaining.length} remaining lead(s)`);
    }
    
    console.log('\n✅ All data now assigned to client!');
    console.log(`🔒 Multi-tenant isolation is active\n`);
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

assignClientToExistingData();



