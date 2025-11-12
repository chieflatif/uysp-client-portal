/**
 * MASTER SYNC SCRIPT: The "Great Sync" - ENHANCED VERSION
 *
 * PURPOSE:
 * Complete resynchronization of all data from Airtable (source of truth) to PostgreSQL.
 * This is the definitive data restoration script with critical UI data integrity fixes.
 *
 * EXECUTION SEQUENCE:
 * 1. Sync all campaigns from Airtable
 * 2. Sync all leads from Airtable (WITH enrolled_message_count calculation)
 * 3. Sync historical SMS audit data (for activity timeline)
 * 4. Run backfill script to fix campaign_id relationships
 * 5. Calculate and update campaign aggregates
 *
 * CRITICAL FIXES IN THIS VERSION:
 * - Task 2.1: enrolled_message_count now properly calculated from campaign.messages array
 * - Task 2.2: Historical SMS activity from SMS_Audit table now synced to lead_activity_log
 * - Task 2.3: Reconciliation logic for processing_status='Completed' leads
 *
 * PREREQUISITES:
 * - Database must be wiped (TRUNCATE completed)
 * - Airtable schema ready (Task A1 complete)
 * - Environment variables configured
 *
 * USAGE:
 * npm run tsx scripts/full-airtable-sync-ENHANCED.ts
 */

import { db } from '../src/lib/db';
import { campaigns, leads, leadActivityLog, type NewLeadActivity } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { syncCampaignsFromAirtable } from '../src/lib/sync/sync-campaigns';
import { getAirtableClient } from '../src/lib/airtable/client';
import { backfillCampaignForeignKeys } from './backfill-campaign-fk';

// Configuration
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID;

interface SyncStats {
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  campaigns: { synced: number; errors: number };
  leads: { inserted: number; updated: number; total: number; errors: number };
  backfill: { matched: number; unmatched: number; errors: number };
  aggregates: { updated: number; errors: number };
  smsAudit: { synced: number; errors: number };
}

/**
 * Calculate and update campaign aggregates
 */
async function updateAllCampaignAggregates(): Promise<{ updated: number; errors: number }> {
  console.log('\n🔄 Step 5: Calculating campaign aggregates...');

  let updated = 0;
  let errors = 0;

  try {
    const allCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.isActive, true),
    });

    console.log(`Found ${allCampaigns.length} active campaigns to update`);

    for (const campaign of allCampaigns) {
      try {
        // Calculate aggregates with a single query
        const aggregates = await db
          .select({
            totalLeads: sql<number>`COUNT(*)::int`,
            activeLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NULL AND ${leads.smsStop} = false THEN 1 END)::int`,
            completedLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NOT NULL THEN 1 END)::int`,
            optedOutCount: sql<number>`COUNT(CASE WHEN ${leads.smsStop} = true THEN 1 END)::int`,
            bookedCount: sql<number>`COUNT(CASE WHEN ${leads.booked} = true THEN 1 END)::int`,
            messagesSent: sql<number>`COALESCE(SUM(${leads.smsSentCount}), 0)::int`,
          })
          .from(leads)
          .where(
            sql`${leads.campaignId} = ${campaign.id} AND ${leads.isActive} = true`
          );

        const stats = aggregates[0];

        // Update campaign
        await db
          .update(campaigns)
          .set({
            totalLeads: stats.totalLeads,
            activeLeadsCount: stats.activeLeadsCount,
            completedLeadsCount: stats.completedLeadsCount,
            optedOutCount: stats.optedOutCount,
            bookedCount: stats.bookedCount,
            messagesSent: stats.messagesSent,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaign.id));

        updated++;

        if (updated % 10 === 0) {
          console.log(`  ⏳ Updated ${updated}/${allCampaigns.length} campaigns...`);
        }
      } catch (error) {
        console.error(`❌ Error updating campaign ${campaign.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Aggregates updated: ${updated} campaigns, ${errors} errors`);
  } catch (error) {
    console.error('❌ Failed to update campaign aggregates:', error);
    throw error;
  }

  return { updated, errors };
}

/**
 * TASK 2.2: Sync historical SMS audit data from Airtable SMS_Audit table
 *
 * This function fetches all SMS audit records from Airtable and creates corresponding
 * entries in the lead_activity_log table for historical activity timeline population.
 */
async function syncHistoricalSmsActivity(): Promise<{ synced: number; errors: number }> {
  console.log('\n🔄 Step 3: Syncing historical SMS audit data from Airtable...');

  let synced = 0;
  let errors = 0;
  let totalFetched = 0;
  const errorDetails: string[] = [];

  // PERFORMANCE: Use counters instead of per-record logging
  let skippedNoLeadId = 0;
  let skippedNoTimestamp = 0;
  let skippedLeadNotFound = 0;

  try {
    const airtable = getAirtableClient(AIRTABLE_BASE_ID, AIRTABLE_API_KEY);
    let offset: string | undefined = undefined;
    let hasMore = true;

    // Create a map of Airtable Record IDs to PostgreSQL lead UUIDs for fast lookup
    console.log('  📊 Building lead lookup map...');
    const allLeads = await db.query.leads.findMany({
      columns: {
        id: true,
        airtableRecordId: true,
        clientId: true,
      },
    });

    const leadLookup = new Map<string, { id: string; clientId: string }>();
    for (const lead of allLeads) {
      leadLookup.set(lead.airtableRecordId, { id: lead.id, clientId: lead.clientId });
    }

    console.log(`  ✅ Built lookup map for ${leadLookup.size} leads`);
    console.log('  🔄 Fetching SMS audit records from Airtable...');

    // Paginate through all SMS_Audit records
    while (hasMore) {
      try {
        const response = await airtable.getAllSmsAudit(offset);
        const records = response.records;
        offset = response.nextOffset;
        hasMore = !!offset;

        totalFetched += records.length;

        for (const record of records) {
          try {
            const fields = record.fields;

            // Extract key fields from SMS_Audit record
            const leadRecordId = fields['Lead Record ID'] as string | undefined;
            const sentAtRaw = fields['Sent At'] as string | undefined;
            const messageText = fields['Text'] as string | undefined;
            const campaignId = fields['Campaign ID'] as string | undefined;
            const status = fields['Status'] as string | undefined;

            // VALIDATION: Skip if Lead Record ID is missing (cannot match to lead)
            if (!leadRecordId) {
              skippedNoLeadId++;
              continue;
            }

            // VALIDATION: Skip if Sent At timestamp is missing
            if (!sentAtRaw) {
              skippedNoTimestamp++;
              continue;
            }

            // LOOKUP: Find the corresponding lead in PostgreSQL
            const leadInfo = leadLookup.get(leadRecordId);

            if (!leadInfo) {
              // Lead not found in PostgreSQL - count and skip
              skippedLeadNotFound++;
              continue;
            }

            // PARSE: Convert Sent At to timestamp
            const timestamp = new Date(sentAtRaw);

            // PREPARE: Activity log entry data
            const activityData: NewLeadActivity = {
              eventType: 'SMS_SENT',
              eventCategory: 'MESSAGING',
              leadId: leadInfo.id, // PostgreSQL UUID
              leadAirtableId: leadRecordId,
              clientId: leadInfo.clientId,
              description: 'Historical SMS message sent (synced from Airtable SMS_Audit)',
              messageContent: messageText || null,
              metadata: {
                source: 'Airtable SMS_Audit Sync',
                airtableRecordId: record.id,
                smsCampaignId: campaignId || null,
                originalStatus: status || null,
              },
              source: 'system:airtable-sms-audit-sync',
              timestamp: timestamp,
            };

            // INSERT: Create activity log entry
            await db.insert(leadActivityLog).values(activityData);

            synced++;

            // Progress indicator
            if (synced % 100 === 0) {
              console.log(`  ⏳ Synced ${synced} SMS audit records...`);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errorDetails.push(`SMS Audit record ${record.id}: ${errorMsg}`);
            errors++;
          }
        }

        console.log(`  📄 Processed page: ${records.length} records (Total fetched: ${totalFetched})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error fetching SMS audit page:`, errorMsg);
        errors++;
        break; // Stop pagination on error
      }
    }

    console.log(`\n✅ SMS Audit sync complete:`);
    console.log(`   Total fetched: ${totalFetched}`);
    console.log(`   Successfully synced: ${synced}`);
    console.log(`   Skipped (no Lead ID): ${skippedNoLeadId}`);
    console.log(`   Skipped (no timestamp): ${skippedNoTimestamp}`);
    console.log(`   Skipped (lead not found): ${skippedLeadNotFound}`);
    console.log(`   Errors: ${errors}`);

    if (errorDetails.length > 0) {
      console.log(`\n⚠️  Error details (showing first 10):`);
      errorDetails.slice(0, 10).forEach((err) => console.log(`   - ${err}`));
    }

    return { synced, errors };
  } catch (error) {
    console.error('❌ Fatal error during SMS audit sync:', error);
    return { synced, errors: errors + 1 };
  }
}

/**
 * TASK 2.1 + 2.3: Enhanced lead sync with enrolled_message_count and reconciliation logic
 *
 * This function replaces the standard syncAirtableLeads() to add critical enhancements:
 * - Calculates enrolled_message_count from campaign.messages array length
 * - Reconciles processing_status='Completed' with sms_sequence_position=0
 * - Sets completed_at if missing for Completed leads
 */
async function syncLeadsWithEnhancedData(): Promise<{
  totalRecords: number;
  inserted: number;
  updated: number;
  errors: number;
}> {
  console.log('\n🔄 Step 2: Syncing leads from Airtable (with enrolled_message_count calculation)...');

  let inserted = 0;
  let updated = 0;
  let totalRecords = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  try {
    const airtable = getAirtableClient(AIRTABLE_BASE_ID, AIRTABLE_API_KEY);

    // STEP 1: Fetch all campaigns and build lookup map (Campaign Name → Campaign)
    // PART B.2: Changed from airtableRecordId to name-based lookup
    console.log('  📊 Building campaign lookup map (by name)...');
    const allCampaigns = await db.query.campaigns.findMany({
      columns: {
        id: true,
        name: true,
        messages: true, // CRITICAL: Need messages array to calculate enrolled_message_count
      },
    });

    const campaignLookup = new Map<string, { id: string; messages: any }>();
    for (const campaign of allCampaigns) {
      // PART B.2: Index by campaign name (case-insensitive for robustness)
      const normalizedName = campaign.name.trim().toLowerCase();
      campaignLookup.set(normalizedName, {
        id: campaign.id,
        messages: campaign.messages,
      });
    }

    console.log(`  ✅ Built lookup map for ${campaignLookup.size} campaigns (by name)`);
    console.log('  🔄 Streaming leads from Airtable...');

    // STEP 2: Stream all leads from Airtable
    await airtable.streamAllLeads(async (record) => {
      try {
        totalRecords++;

        // Map Airtable record to database format
        const leadData = airtable.mapToDatabaseLead(record, CLIENT_ID);

        // TASK 2.1: Calculate enrolled_message_count
        // PART B.2: Use "Campaign (CORRECTED)" text field instead of linked records
        let enrolledMessageCount = 0;
        let matchedCampaignId: string | undefined;

        // Get the Campaign (CORRECTED) text field (NOT linked records)
        const campaignCorrectedField = record.fields['Campaign (CORRECTED)'] as string | undefined;

        if (campaignCorrectedField) {
          // PART B.2: Look up campaign by name (text matching)
          const normalizedCampaignName = campaignCorrectedField.trim().toLowerCase();
          const campaignInfo = campaignLookup.get(normalizedCampaignName);

          if (campaignInfo) {
            matchedCampaignId = campaignInfo.id;

            if (campaignInfo.messages && Array.isArray(campaignInfo.messages)) {
              // messages is a JSON array of message objects
              // enrolled_message_count = length of this array
              enrolledMessageCount = campaignInfo.messages.length;
            }
          }
        }

        // TASK 2.3: Reconciliation logic for processing_status='Completed'
        let smsSequencePosition = leadData.smsSequencePosition;
        let completedAt = leadData.completedAt;

        if (leadData.processingStatus === 'Completed') {
          // If completed, sequence position must be 0 (finished all messages)
          smsSequencePosition = 0;

          // If completed_at is missing, set it to now
          if (!completedAt) {
            completedAt = new Date();
          }
        }

        // Check if lead already exists
        const existing = await db.query.leads.findFirst({
          where: eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          // UPDATE existing lead
          await db
            .update(leads)
            .set({
              firstName: leadData.firstName,
              lastName: leadData.lastName,
              email: leadData.email,
              phone: leadData.phone,
              company: leadData.company,
              title: leadData.title,
              icpScore: leadData.icpScore,
              status: leadData.status,
              isActive: leadData.isActive,
              processingStatus: leadData.processingStatus,
              smsSequencePosition: smsSequencePosition, // TASK 2.3: Reconciled value
              completedAt: completedAt, // TASK 2.3: Reconciled value
              enrolledMessageCount: enrolledMessageCount, // TASK 2.1: Calculated value
              campaignId: matchedCampaignId || null, // PART B.2: Set campaign_id from text-based match
              // SMS ACTIVITY FIELDS - CRITICAL: Must sync from Airtable
              smsSentCount: leadData.smsSentCount,
              smsLastSentAt: leadData.smsLastSentAt,
              engagementLevel: leadData.engagementLevel,
              // Campaign matching fields for backfill script
              campaignName: leadData.campaignName,
              leadSource: leadData.leadSource,
              formId: leadData.formId,
              updatedAt: new Date(),
            })
            .where(eq(leads.airtableRecordId, record.id));

          updated++;
        } else {
          // INSERT new lead
          await db.insert(leads).values({
            airtableRecordId: leadData.airtableRecordId!,
            clientId: leadData.clientId!,
            firstName: leadData.firstName!,
            lastName: leadData.lastName || '',
            email: leadData.email || '',
            phone: leadData.phone,
            company: leadData.company,
            title: leadData.title,
            icpScore: leadData.icpScore || 0,
            status: leadData.status || 'New',
            isActive: leadData.isActive !== false,
            processingStatus: leadData.processingStatus,
            smsSequencePosition: smsSequencePosition, // TASK 2.3: Reconciled value
            completedAt: completedAt, // TASK 2.3: Reconciled value
            enrolledMessageCount: enrolledMessageCount, // TASK 2.1: Calculated value
            campaignId: matchedCampaignId || null, // PART B.2: Set campaign_id from text-based match
            // SMS ACTIVITY FIELDS - CRITICAL: Must sync from Airtable
            smsSentCount: leadData.smsSentCount,
            smsLastSentAt: leadData.smsLastSentAt,
            engagementLevel: leadData.engagementLevel,
            // Campaign matching fields for backfill script
            campaignName: leadData.campaignName,
            leadSource: leadData.leadSource,
            formId: leadData.formId,
            createdAt: leadData.createdAt || new Date(),
          });

          inserted++;
        }

        // Progress indicator
        if (totalRecords % 100 === 0) {
          console.log(`  ⏳ Processed ${totalRecords} leads...`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errorDetails.push(`Lead ${record.id}: ${errorMsg}`);
        errors++;
        console.error(`  ❌ Error syncing lead ${record.id}:`, error);
      }
    });

    console.log(`\n✅ Lead sync complete:`);
    console.log(`   Total records: ${totalRecords}`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);

    if (errorDetails.length > 0) {
      console.log(`\n⚠️  Error details (showing first 10):`);
      errorDetails.slice(0, 10).forEach((err) => console.log(`   - ${err}`));
    }

    return {
      totalRecords,
      inserted,
      updated,
      errors,
    };
  } catch (error) {
    console.error('❌ Fatal error during lead sync:', error);
    throw error;
  }
}

/**
 * Main sync orchestration function
 */
async function executeGreatSync(): Promise<SyncStats> {
  const stats: SyncStats = {
    startTime: new Date(),
    campaigns: { synced: 0, errors: 0 },
    leads: { inserted: 0, updated: 0, total: 0, errors: 0 },
    backfill: { matched: 0, unmatched: 0, errors: 0 },
    aggregates: { updated: 0, errors: 0 },
    smsAudit: { synced: 0, errors: 0 },
  };

  try {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║            THE GREAT SYNC - ENHANCED VERSION                  ║');
    console.log('║              Data Integrity Restoration - Phase 2             ║');
    console.log('║                  WITH UI DATA INTEGRITY FIXES                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`⏰ Start Time: ${stats.startTime.toISOString()}`);
    console.log(`📊 Client ID: ${CLIENT_ID}`);
    console.log(`🗃️  Airtable Base: ${AIRTABLE_BASE_ID}`);

    if (!CLIENT_ID || !AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.error('❌ Missing required environment variables (DEFAULT_CLIENT_ID, AIRTABLE_BASE_ID, AIRTABLE_API_KEY)');
      process.exit(1);
    }

    const airtable = getAirtableClient(AIRTABLE_BASE_ID, AIRTABLE_API_KEY);

    console.log(`\n🔧 ENHANCEMENTS IN THIS VERSION:`);
    console.log(`   ✅ enrolled_message_count calculated from campaign.messages`);
    console.log(`   ✅ Historical SMS activity synced from SMS_Audit table`);
    console.log(`   ✅ Reconciliation logic for Completed leads\n`);

    // =================================================================
    // STEP 1: Sync Campaigns from Airtable
    // =================================================================
    console.log('🔄 Step 1: Syncing campaigns from Airtable...');

    const campaignResult = await syncCampaignsFromAirtable(CLIENT_ID, AIRTABLE_BASE_ID, false);
    stats.campaigns = campaignResult;

    console.log(`✅ Campaigns synced: ${campaignResult.synced} campaigns, ${campaignResult.errors} errors\n`);

    // =================================================================
    // STEP 2: Sync Leads from Airtable (ENHANCED with enrolled_message_count)
    // =================================================================
    const leadsResult = await syncLeadsWithEnhancedData();
    stats.leads = {
      inserted: leadsResult.inserted,
      updated: leadsResult.updated,
      total: leadsResult.totalRecords,
      errors: leadsResult.errors,
    };

    // =================================================================
    // STEP 3: Sync Historical SMS Audit Data (NEW)
    // =================================================================
    stats.smsAudit = await syncHistoricalSmsActivity();

    // =================================================================
    // STEP 4: Run Backfill Script (Fix campaign_id relationships)
    // =================================================================
    console.log('\n🔄 Step 4: Running campaign FK backfill...');

    const backfillResult = await backfillCampaignForeignKeys(false); // Live mode
    stats.backfill = {
      matched: backfillResult.matchedByCampaignName +
               backfillResult.matchedByLeadSource +
               backfillResult.matchedByFormId,
      unmatched: backfillResult.noMatchFound,
      errors: backfillResult.errors.length,
    };

    console.log(`✅ Backfill complete: ${stats.backfill.matched} matched, ${stats.backfill.unmatched} unmatched, ${stats.backfill.errors} errors\n`);

    // =================================================================
    // STEP 5: Calculate Campaign Aggregates
    // =================================================================
    stats.aggregates = await updateAllCampaignAggregates();

    // =================================================================
    // FINALIZATION
    // =================================================================
    stats.endTime = new Date();
    stats.durationSeconds = Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000);

    // Print final summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 GREAT SYNC COMPLETE - FINAL SUMMARY');
    console.log('═'.repeat(70));
    console.log(`⏰ Start Time:    ${stats.startTime.toISOString()}`);
    console.log(`⏰ End Time:      ${stats.endTime.toISOString()}`);
    console.log(`⏱️  Duration:      ${stats.durationSeconds} seconds`);
    console.log('');
    console.log(`📦 Campaigns:     ${stats.campaigns.synced} synced, ${stats.campaigns.errors} errors`);
    console.log(`👥 Leads:         ${stats.leads.total} total (${stats.leads.inserted} new, ${stats.leads.updated} updated, ${stats.leads.errors} errors)`);
    console.log(`📨 SMS Audit:     ${stats.smsAudit.synced} records synced, ${stats.smsAudit.errors} errors`);
    console.log(`🔗 Backfill:      ${stats.backfill.matched} matched, ${stats.backfill.unmatched} unmatched, ${stats.backfill.errors} errors`);
    console.log(`📊 Aggregates:    ${stats.aggregates.updated} campaigns updated, ${stats.aggregates.errors} errors`);
    console.log('═'.repeat(70));

    // Success or partial success check
    const totalErrors =
      stats.campaigns.errors +
      stats.leads.errors +
      stats.backfill.errors +
      stats.aggregates.errors +
      stats.smsAudit.errors;

    if (totalErrors === 0) {
      console.log('\n✅ SUCCESS: All sync operations completed without errors!');
      console.log('\n🎯 UI DATA INTEGRITY FIXES APPLIED:');
      console.log('   ✅ enrolled_message_count populated (fixes "1 of 0" status)');
      console.log('   ✅ Historical SMS activity synced (populates activity timelines)');
      console.log('   ✅ Completed leads reconciled (sequence_position set to 0)');
    } else {
      console.log(`\n⚠️  PARTIAL SUCCESS: Sync completed with ${totalErrors} total errors`);
      console.log('Review the logs above for details.');
    }

    return stats;

  } catch (error) {
    stats.endTime = new Date();
    stats.durationSeconds = Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000);

    console.error('\n' + '═'.repeat(70));
    console.error('❌ GREAT SYNC FAILED');
    console.error('═'.repeat(70));
    console.error('Fatal error occurred during sync:', error);
    console.error(`Duration before failure: ${stats.durationSeconds} seconds`);
    console.error('═'.repeat(70));

    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  executeGreatSync()
    .then(() => {
      console.log('\n✅ Script execution complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

// Export for use in other scripts
export { executeGreatSync };
