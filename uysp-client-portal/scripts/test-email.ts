/**
 * Test Email Configuration
 * Usage: npx tsx scripts/test-email.ts
 *
 * This script tests your Gmail SMTP configuration by:
 * 1. Verifying the connection
 * 2. Sending a test invitation email
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { testEmailConnection, sendPasswordSetupEmail } from '../src/lib/email/mailer';

async function testEmail() {
  console.log('\n🧪 Testing Email Configuration...\n');
  console.log('─'.repeat(60));

  // Step 1: Test connection
  console.log('\n1️⃣  Testing SMTP connection...');
  const connectionValid = await testEmailConnection();

  if (!connectionValid) {
    console.log('\n❌ SMTP connection failed!');
    console.log('\nTroubleshooting:');
    console.log('  • Check SMTP_USER is correct');
    console.log('  • Check SMTP_PASSWORD is the App Password (16 chars)');
    console.log('  • Verify 2-Step Verification is enabled on Gmail');
    console.log('  • Make sure .env.local has the correct values\n');
    process.exit(1);
  }

  console.log('✅ SMTP connection successful!\n');

  // Step 2: Send test email
  console.log('2️⃣  Sending test invitation email...');

  // Get test email from command line or use default
  const testEmail = process.argv[2] || process.env.SMTP_USER || 'test@example.com';
  const testName = 'Test User';
  const setupUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/setup-password?email=${encodeURIComponent(testEmail)}`;

  console.log(`   Sending to: ${testEmail}`);
  console.log(`   Setup URL: ${setupUrl}\n`);

  try {
    await sendPasswordSetupEmail(testEmail, testName, setupUrl);

    console.log('✅ Test email sent successfully!\n');
    console.log('─'.repeat(60));
    console.log('\n📧 Check your inbox (and spam folder)!');
    console.log('\nExpected email:');
    console.log('  • Subject: "Complete Your UYSP Portal Account Setup"');
    console.log('  • From: UYSP Portal');
    console.log('  • Contains: Setup button and password requirements\n');
    console.log('If you don\'t see it within 2-3 minutes, check:');
    console.log('  • Spam/Junk folder');
    console.log('  • SMTP_FROM_EMAIL is valid');
    console.log('  • Gmail\'s Sent folder for the sending account\n');

    process.exit(0);
  } catch (error) {
    console.log('\n❌ Failed to send test email!');
    console.error('\nError:', error);
    console.log('\nTroubleshooting:');
    console.log('  • Verify all SMTP environment variables are set');
    console.log('  • Check that NEXTAUTH_URL is correct');
    console.log('  • Try regenerating the Gmail App Password');
    console.log('  • Check server logs for more details\n');
    process.exit(1);
  }
}

// Show usage info
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📧 Email Configuration Test Script\n');
  console.log('Usage:');
  console.log('  npx tsx scripts/test-email.ts [email]\n');
  console.log('Examples:');
  console.log('  npx tsx scripts/test-email.ts');
  console.log('  npx tsx scripts/test-email.ts your-email@gmail.com\n');
  console.log('Environment Variables Required:');
  console.log('  SMTP_USER         - Your Gmail address');
  console.log('  SMTP_PASSWORD     - Gmail App Password (16 chars)');
  console.log('  SMTP_FROM_EMAIL   - From address (optional)');
  console.log('  SMTP_FROM_NAME    - From name (optional)');
  console.log('  NEXTAUTH_URL      - Application URL\n');
  process.exit(0);
}

testEmail();
