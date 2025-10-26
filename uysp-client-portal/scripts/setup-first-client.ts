/**
 * Setup First Client - Initial Deployment Script
 * 
 * Run this ONCE when deploying for the first time to create
 * your client record in the database.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { clients } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function setupFirstClient() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });
  
  try {
    console.log('🏢 Setting up first client in database...\n');
    
    // Check if client already exists
    const existingClients = await db.query.clients.findMany();
    
    if (existingClients.length > 0) {
      console.log('✅ Clients already exist in database:\n');
      existingClients.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.companyName}`);
        console.log(`   Email: ${c.email}`);
        console.log(`   Airtable Base: ${c.airtableBaseId}`);
        console.log(`   Active: ${c.isActive ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      console.log('ℹ️  If you need to create additional clients, modify this script');
      console.log('   or insert directly into the clients table.\n');
      
      await client.end();
      process.exit(0);
    }
    
    // Create Rebel HQ client
    console.log('📝 Creating Rebel HQ client record...\n');
    
    const newClient = await db.insert(clients).values({
      companyName: 'Rebel HQ',
      email: 'rebel@rebelhq.ai',
      phone: null,
      airtableBaseId: process.env.AIRTABLE_BASE_ID || 'app4wIsBfpJTg7pWS',
      isActive: true,
    }).returning();
    
    console.log('✅ Client created successfully!\n');
    console.log('📋 Client Details:');
    console.log('   ID:', newClient[0].id);
    console.log('   Company:', newClient[0].companyName);
    console.log('   Email:', newClient[0].email);
    console.log('   Airtable Base:', newClient[0].airtableBaseId);
    console.log('');
    console.log('🎉 Next step: Create your first user');
    console.log('   Run: npx tsx scripts/create-client-user.ts\n');
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

setupFirstClient();






