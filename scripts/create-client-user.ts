/**
 * Create User for Client - Admin Script
 * 
 * Usage: npx tsx scripts/create-client-user.ts
 * 
 * This script allows you to manually create users for clients.
 * For production security, registration is disabled publicly.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { users, clients } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createClientUser() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });
  
  try {
    console.log('👤 UYSP Client Portal - Create User\n');
    console.log('This script creates users for your portal.\n');
    
    // List existing clients
    const allClients = await db.query.clients.findMany();
    
    if (allClients.length === 0) {
      console.log('❌ No clients found in database!');
      console.log('\nYou need to create a client first:');
      console.log('  1. Add client record to database');
      console.log('  2. Include: company_name, email, airtable_base_id');
      console.log('\nExample SQL:');
      console.log(`  INSERT INTO clients (company_name, email, airtable_base_id) 
     VALUES ('Rebel HQ', 'rebel@rebelhq.ai', 'app4wIsBfpJTg7pWS');`);
      process.exit(1);
    }
    
    console.log('📋 Available Clients:\n');
    allClients.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.companyName} (${c.email})`);
    });
    console.log('');
    
    // Get user input
    const clientChoice = await question('Select client number (1-' + allClients.length + '): ');
    const clientIndex = parseInt(clientChoice) - 1;
    
    if (clientIndex < 0 || clientIndex >= allClients.length) {
      console.log('❌ Invalid client selection');
      process.exit(1);
    }
    
    const selectedClient = allClients[clientIndex];
    console.log(`\n✅ Selected: ${selectedClient.companyName}\n`);
    
    const email = await question('User email: ');
    const password = await question('User password (min 8 chars): ');
    const firstName = await question('First name: ');
    const lastName = await question('Last name: ');
    const roleInput = await question('Role (CLIENT/ADMIN) [CLIENT]: ');
    
    const role = roleInput.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CLIENT';
    
    // Validate
    if (!email || !email.includes('@')) {
      console.log('\n❌ Invalid email address');
      process.exit(1);
    }
    
    if (!password || password.length < 8) {
      console.log('\n❌ Password must be at least 8 characters');
      process.exit(1);
    }
    
    if (!firstName || !lastName) {
      console.log('\n❌ First and last name required');
      process.exit(1);
    }
    
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (existingUser) {
      console.log(`\n❌ User with email ${email} already exists!`);
      process.exit(1);
    }
    
    // Hash password
    console.log('\n🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    console.log('👤 Creating user...');
    const newUser = await db.insert(users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      clientId: selectedClient.id,
      isActive: true,
    }).returning();
    
    console.log('\n✅ User created successfully!\n');
    console.log('📧 Email:', newUser[0].email);
    console.log('👤 Name:', firstName, lastName);
    console.log('🏢 Client:', selectedClient.companyName);
    console.log('🔑 Role:', role);
    console.log('🆔 User ID:', newUser[0].id);
    console.log('\n🔐 Login credentials:');
    console.log('  Email:', email);
    console.log('  Password: [hidden for security]');
    console.log('\n🌐 User can now login at: http://localhost:3000/login');
    
    await client.end();
    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    await client.end();
    rl.close();
    process.exit(1);
  }
}

createClientUser();

