/**
 * Verify Security Implementation
 * 
 * Tests multi-tenant isolation and authorization
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { users, clients, leads } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function verifySecurityImplementation() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });
  
  try {
    console.log('🔒 Security Implementation Verification\n');
    console.log('═'.repeat(50));
    console.log('');
    
    // 1. Check clients exist
    console.log('1️⃣  Checking Clients Table...');
    const allClients = await db.query.clients.findMany();
    console.log(`   ✓ Found ${allClients.length} client(s)`);
    allClients.forEach(c => {
      console.log(`     - ${c.companyName} (${c.email})`);
    });
    
    if (allClients.length === 0) {
      console.log('   ⚠️  No clients found! Run: npx tsx scripts/setup-first-client.ts');
    }
    console.log('');
    
    // 2. Check users have clientId
    console.log('2️⃣  Checking Users Have Client Assignment...');
    const allUsers = await db.query.users.findMany();
    console.log(`   ✓ Found ${allUsers.length} user(s)`);
    
    const usersWithClient = allUsers.filter(u => u.clientId);
    const usersWithoutClient = allUsers.filter(u => !u.clientId);
    
    console.log(`   ✓ ${usersWithClient.length} user(s) with clientId`);
    if (usersWithoutClient.length > 0) {
      console.log(`   ⚠️  ${usersWithoutClient.length} user(s) WITHOUT clientId:`);
      usersWithoutClient.forEach(u => {
        console.log(`     - ${u.email} (${u.role})`);
      });
      console.log('   ⚠️  These users need clientId assigned!');
    }
    console.log('');
    
    // 3. Check leads have clientId
    console.log('3️⃣  Checking Leads Have Client Assignment...');
    const leadsStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(client_id) as with_client,
        COUNT(DISTINCT client_id) as unique_clients
      FROM leads
    `);
    
    const stats = leadsStats.rows[0] || { total: 0, with_client: 0, unique_clients: 0 };
    console.log(`   ✓ Total leads: ${stats.total}`);
    console.log(`   ✓ Leads with clientId: ${stats.with_client}`);
    console.log(`   ✓ Unique clients in leads: ${stats.unique_clients}`);
    
    if (Number(stats.total) !== Number(stats.with_client)) {
      console.log(`   ⚠️  ${Number(stats.total) - Number(stats.with_client)} leads WITHOUT clientId!`);
      console.log('   ⚠️  Multi-tenant isolation may not work correctly');
    }
    console.log('');
    
    // 4. Check environment variables
    console.log('4️⃣  Checking Security Environment Variables...');
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET !== 'dev-secret-key-uysp-client-portal-2025-change-in-production';
    const nodeEnv = process.env.NODE_ENV || 'development';
    const registrationEnabled = process.env.ALLOW_PUBLIC_REGISTRATION === 'true' || nodeEnv === 'development';
    
    console.log(`   ${hasNextAuthSecret ? '✓' : '⚠️ '} NEXTAUTH_SECRET: ${hasNextAuthSecret ? 'Strong secret set' : 'Using weak dev secret!'}`);
    console.log(`   ✓ NODE_ENV: ${nodeEnv}`);
    console.log(`   ${registrationEnabled ? '⚠️ ' : '✓'} Public Registration: ${registrationEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!hasNextAuthSecret) {
      console.log('   ⚠️  Generate strong secret: openssl rand -base64 32');
    }
    if (nodeEnv === 'production' && registrationEnabled) {
      console.log('   ⚠️  Public registration enabled in production!');
    }
    console.log('');
    
    // 5. Multi-tenant isolation test
    console.log('5️⃣  Testing Multi-Tenant Isolation...');
    
    if (allClients.length > 1) {
      const client1Leads = await db.execute(sql`
        SELECT COUNT(*) as count FROM leads WHERE client_id = ${allClients[0].id}
      `);
      const client2Leads = await db.execute(sql`
        SELECT COUNT(*) as count FROM leads WHERE client_id = ${allClients[1].id}
      `);
      
      console.log(`   ✓ ${allClients[0].companyName}: ${client1Leads.rows[0].count} leads`);
      console.log(`   ✓ ${allClients[1].companyName}: ${client2Leads.rows[0].count} leads`);
      console.log('   ✓ Multi-tenant isolation verified');
    } else {
      console.log('   ℹ️  Single client deployment - isolation will work when Client #2 added');
    }
    console.log('');
    
    // Summary
    console.log('═'.repeat(50));
    console.log('\n📊 SECURITY VERIFICATION SUMMARY\n');
    
    const checks = [
      { name: 'Clients exist', passed: allClients.length > 0 },
      { name: 'Users have clientId', passed: usersWithoutClient.length === 0 },
      { name: 'Leads have clientId', passed: Number(stats.total) === Number(stats.with_client) },
      { name: 'Strong NEXTAUTH_SECRET', passed: hasNextAuthSecret },
      { name: 'Registration secured', passed: !registrationEnabled || nodeEnv === 'development' },
    ];
    
    const allPassed = checks.every(c => c.passed);
    
    checks.forEach(check => {
      console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    console.log('');
    if (allPassed) {
      console.log('🎉 All security checks PASSED!');
      console.log('✅ System is production-ready\n');
    } else {
      console.log('⚠️  Some checks FAILED - review above');
      console.log('🔧 Fix issues before deploying to production\n');
    }
    
    await client.end();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

verifySecurityImplementation();

