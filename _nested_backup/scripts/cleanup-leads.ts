#!/usr/bin/env tsx
/**
 * Database Cleanup Script - Delete All Leads
 *
 * DANGER: This script will permanently delete ALL leads and related data.
 * Use this to prepare the database for production Airtable synchronization.
 *
 * Usage:
 *   npm run cleanup-leads          # Interactive mode with confirmation
 *   npm run cleanup-leads --force  # Skip confirmation (use with caution)
 *
 * What gets deleted:
 * - All leads from the leads table
 * - All notes associated with those leads
 * - All activity log entries for those leads
 *
 * What is preserved:
 * - Users
 * - Clients
 * - Campaigns
 * - SMS templates
 * - Project tasks/blockers/status
 */

// Environment variables are loaded by tsx -r dotenv/config (see package.json)
import { db } from '../src/lib/db';
import { leads, notes, activityLog } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import * as readline from 'readline';

const FORCE_FLAG = process.argv.includes('--force');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getDataCounts() {
  log('\n📊 Analyzing database contents...', 'cyan');

  const [leadsCount] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const [notesCount] = await db.select({ count: sql<number>`count(*)` }).from(notes);
  const [activityCount] = await db.select({ count: sql<number>`count(*)` }).from(activityLog);

  return {
    leads: Number(leadsCount.count || 0),
    notes: Number(notesCount.count || 0),
    activityLogs: Number(activityCount.count || 0),
  };
}

async function promptUser(question: string): Promise<boolean> {
  if (FORCE_FLAG) {
    log('⚠️  --force flag detected, skipping confirmation', 'yellow');
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function cleanupDatabase() {
  try {
    log('\n🧹 UYSP Database Cleanup Tool', 'bold');
    log('================================\n', 'bold');

    // Get current counts
    const counts = await getDataCounts();

    log('Current database contents:', 'cyan');
    log(`  • Leads: ${counts.leads}`, 'white');
    log(`  • Notes: ${counts.notes}`, 'white');
    log(`  • Activity Log Entries: ${counts.activityLogs}`, 'white');

    if (counts.leads === 0) {
      log('\n✅ Database is already clean - no leads found!', 'green');
      process.exit(0);
    }

    // Warning message
    log('\n⚠️  WARNING: THIS ACTION CANNOT BE UNDONE!', 'red');
    log('⚠️  All leads and associated data will be permanently deleted.', 'red');
    log('\nThis will delete:', 'yellow');
    log(`  ❌ ${counts.leads} lead(s)`, 'red');
    log(`  ❌ ${counts.notes} note(s)`, 'red');
    log(`  ❌ ${counts.activityLogs} activity log entries`, 'red');

    log('\nThis will preserve:', 'green');
    log('  ✅ Users', 'green');
    log('  ✅ Clients', 'green');
    log('  ✅ Campaigns', 'green');
    log('  ✅ SMS Templates', 'green');
    log('  ✅ Project Tasks/Blockers/Status', 'green');

    // Confirmation
    const confirmed = await promptUser('\nType "yes" to confirm deletion: ');

    if (!confirmed) {
      log('\n❌ Cleanup cancelled by user', 'yellow');
      process.exit(0);
    }

    // Final confirmation for large datasets
    if (counts.leads > 100) {
      log(`\n⚠️  You are about to delete ${counts.leads} leads. This is a large dataset!`, 'red');
      const finalConfirm = await promptUser('Are you absolutely sure? Type "yes" again: ');

      if (!finalConfirm) {
        log('\n❌ Cleanup cancelled by user', 'yellow');
        process.exit(0);
      }
    }

    log('\n🔄 Starting cleanup...', 'cyan');

    // Execute cleanup in transaction for safety
    await db.transaction(async (tx) => {
      log('  1️⃣  Deleting notes...', 'yellow');
      await tx.delete(notes);
      log('     ✅ Notes deleted', 'green');

      log('  2️⃣  Deleting activity logs...', 'yellow');
      await tx.delete(activityLog);
      log('     ✅ Activity logs deleted', 'green');

      log('  3️⃣  Deleting leads...', 'yellow');
      await tx.delete(leads);
      log('     ✅ Leads deleted', 'green');
    });

    // Verify cleanup
    const finalCounts = await getDataCounts();

    log('\n✅ Cleanup complete!', 'green');
    log('\nFinal database state:', 'cyan');
    log(`  • Leads: ${finalCounts.leads}`, 'white');
    log(`  • Notes: ${finalCounts.notes}`, 'white');
    log(`  • Activity Log Entries: ${finalCounts.activityLogs}`, 'white');

    log('\n🎉 Database is now ready for production Airtable synchronization!', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Verify your Airtable base has the correct data', 'white');
    log('  2. Run the sync from the admin panel', 'white');
    log('  3. Monitor the sync logs for any errors', 'white');

  } catch (error) {
    log('\n❌ ERROR: Cleanup failed!', 'red');
    log(`\nError details: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    log('\n⚠️  The database may be in an inconsistent state.', 'yellow');
    log('Please check the database manually and contact support if needed.', 'yellow');
    process.exit(1);
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    process.exit(1);
  });
