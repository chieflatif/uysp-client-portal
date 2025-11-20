/**
 * Manual script to send weekly project management report
 * 
 * SECURITY:
 * - Each client gets their own isolated report
 * - CLIENT_ADMIN users only receive their client's report
 * - SUPER_ADMIN users receive reports for all clients they request
 * 
 * Usage:
 *   npx tsx scripts/send-weekly-report.ts <clientId> [--test email@example.com]
 *   npx tsx scripts/send-weekly-report.ts --all  # Send reports for ALL clients
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { sendWeeklyReport, sendTestReport, sendAllWeeklyReports } from '../src/lib/email/weekly-report';
import { db } from '../src/lib/db';
import { clients } from '../src/lib/db/schema';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const args = process.argv.slice(2);
  const sendAll = args.includes('--all');
  const isTest = args.includes('--test');
  const testEmail = isTest ? args[args.indexOf('--test') + 1] : null;
  const clientId = args.find(arg => !arg.startsWith('--'));

  console.log('📊 Weekly Report Generator\n');

  // Handle --all flag (send reports for all clients)
  if (sendAll) {
    console.log('📧 Sending weekly reports for ALL clients...\n');
    console.log('⚠️  SECURITY: Each client receives their own isolated report');
    console.log('⚠️  SUPER_ADMIN users will receive one report per client\n');
    
    try {
      await sendAllWeeklyReports();
      console.log('\n✅ All weekly reports sent successfully!\n');
    } catch (error) {
      console.error('\n❌ Error sending reports:', error);
      process.exit(1);
    }
    return;
  }

  // Require clientId for single-client reports
  if (!clientId) {
    console.log('❌ Error: Client ID required\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/send-weekly-report.ts <clientId>');
    console.log('  npx tsx scripts/send-weekly-report.ts <clientId> --test email@example.com');
    console.log('  npx tsx scripts/send-weekly-report.ts --all  # Send for ALL clients\n');
    
    // List available clients
    const allClients = await db.select().from(clients);
    if (allClients.length > 0) {
      console.log('Available clients:');
      allClients.forEach((client) => {
        console.log(`  ${client.id} - ${client.companyName}`);
      });
    }
    console.log();
    process.exit(1);
  }

  try {
    if (isTest && testEmail) {
      console.log(`📧 Sending test report to: ${testEmail}`);
      console.log(`🔒 Client: ${clientId}\n`);
      await sendTestReport(clientId, testEmail);
      console.log('\n✅ Test report sent successfully!');
      console.log('📮 Check your inbox for the weekly project report\n');
    } else {
      console.log('📧 Sending weekly report to administrators');
      console.log(`🔒 Client: ${clientId}`);
      console.log('⚠️  SECURITY: Only admins for THIS client will receive the report\n');
      await sendWeeklyReport(clientId);
      console.log('\n✅ Weekly report sent successfully!');
      console.log('📮 Administrators have received the report\n');
    }
  } catch (error) {
    console.error('\n❌ Error sending report:', error);
    process.exit(1);
  }
}

main();

