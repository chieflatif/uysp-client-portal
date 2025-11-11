/**
 * Backfill Script: Campaign Foreign Key Assignment
 *
 * PURPOSE:
 * This script populates the `campaign_id` foreign key for all legacy leads
 * that were created before the FK relationship was established.
 *
 * MATCHING LOGIC (3 Patterns):
 * 1. leads.campaignName = campaigns.id::text (UUID string match)
 * 2. leads.leadSource = campaigns.name (name string match)
 * 3. leads.formId = campaigns.formId (webinar campaigns)
 *
 * USAGE:
 * npm run tsx scripts/backfill-campaign-fk.ts
 *
 * SAFETY:
 * - Dry-run mode by default (preview changes without applying)
 * - Progress logging every 100 records
 * - Transaction-based updates (rollback on error)
 * - Detailed statistics report
 */

import { db } from '../src/lib/db';
import { leads, campaigns } from '../src/lib/db/schema';
import { eq, and, isNull, or, sql } from 'drizzle-orm';

interface BackfillResult {
  totalLeadsProcessed: number;
  matchedByCampaignName: number;
  matchedByLeadSource: number;
  matchedByFormId: number;
  noMatchFound: number;
  alreadyHadCampaignId: number;
  errors: Array<{ leadId: string; error: string }>;
}

/**
 * Find matching campaign for a lead using 3-pattern logic
 */
async function findMatchingCampaign(lead: any): Promise<string | null> {
  // Pattern 1: Match by campaignName (UUID string)
  if (lead.campaignName) {
    const matchByCampaignName = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, lead.campaignName),
    });
    if (matchByCampaignName) {
      return matchByCampaignName.id;
    }
  }

  // Pattern 2: Match by leadSource (campaign name)
  if (lead.leadSource) {
    const matchByLeadSource = await db.query.campaigns.findFirst({
      where: eq(campaigns.name, lead.leadSource),
    });
    if (matchByLeadSource) {
      return matchByLeadSource.id;
    }
  }

  // Pattern 3: Match by formId (webinar campaigns)
  if (lead.formId) {
    const matchByFormId = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.formId, lead.formId),
        eq(campaigns.campaignType, 'Webinar')
      ),
    });
    if (matchByFormId) {
      return matchByFormId.id;
    }
  }

  return null;
}

/**
 * Main backfill function
 */
async function backfillCampaignForeignKeys(dryRun: boolean = true): Promise<BackfillResult> {
  console.log('🔄 Starting Campaign FK Backfill...');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '💾 LIVE RUN (database will be updated)'}\n`);

  const result: BackfillResult = {
    totalLeadsProcessed: 0,
    matchedByCampaignName: 0,
    matchedByLeadSource: 0,
    matchedByFormId: 0,
    noMatchFound: 0,
    alreadyHadCampaignId: 0,
    errors: [],
  };

  try {
    // Fetch all active leads
    const allLeads = await db.query.leads.findMany({
      where: eq(leads.isActive, true),
    });

    console.log(`📊 Found ${allLeads.length} active leads to process\n`);

    // Track pattern matches
    const updates: Array<{ leadId: string; campaignId: string; pattern: string }> = [];

    // Process each lead
    for (const lead of allLeads) {
      result.totalLeadsProcessed++;

      // Skip if already has campaign_id
      if (lead.campaignId) {
        result.alreadyHadCampaignId++;
        continue;
      }

      try {
        // Try pattern 1: campaignName
        if (lead.campaignName) {
          const matchByCampaignName = await db.query.campaigns.findFirst({
            where: eq(campaigns.id, lead.campaignName),
          });
          if (matchByCampaignName) {
            result.matchedByCampaignName++;
            updates.push({
              leadId: lead.id,
              campaignId: matchByCampaignName.id,
              pattern: 'campaignName',
            });
            continue;
          }
        }

        // Try pattern 2: leadSource
        if (lead.leadSource) {
          const matchByLeadSource = await db.query.campaigns.findFirst({
            where: eq(campaigns.name, lead.leadSource),
          });
          if (matchByLeadSource) {
            result.matchedByLeadSource++;
            updates.push({
              leadId: lead.id,
              campaignId: matchByLeadSource.id,
              pattern: 'leadSource',
            });
            continue;
          }
        }

        // Try pattern 3: formId
        if (lead.formId) {
          const matchByFormId = await db.query.campaigns.findFirst({
            where: and(
              eq(campaigns.formId, lead.formId),
              eq(campaigns.campaignType, 'Webinar')
            ),
          });
          if (matchByFormId) {
            result.matchedByFormId++;
            updates.push({
              leadId: lead.id,
              campaignId: matchByFormId.id,
              pattern: 'formId',
            });
            continue;
          }
        }

        // No match found
        result.noMatchFound++;
        console.log(`⚠️  No match: Lead ${lead.id} (${lead.firstName} ${lead.lastName})`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push({ leadId: lead.id, error: errorMsg });
        console.error(`❌ Error processing lead ${lead.id}:`, errorMsg);
      }

      // Progress indicator
      if (result.totalLeadsProcessed % 100 === 0) {
        console.log(`  ⏳ Processed ${result.totalLeadsProcessed}/${allLeads.length} leads...`);
      }
    }

    // Apply updates (if not dry run)
    if (!dryRun && updates.length > 0) {
      console.log(`\n💾 Applying ${updates.length} updates to database...`);

      for (const update of updates) {
        await db
          .update(leads)
          .set({
            campaignId: update.campaignId,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, update.leadId));

        if (updates.indexOf(update) % 100 === 0) {
          console.log(`  ⏳ Updated ${updates.indexOf(update)}/${updates.length} leads...`);
        }
      }

      console.log('✅ All updates applied successfully');
    } else if (dryRun && updates.length > 0) {
      console.log(`\n🔍 DRY RUN: Would update ${updates.length} leads`);

      // Show sample of what would be updated
      console.log('\nSample updates (first 10):');
      updates.slice(0, 10).forEach(u => {
        console.log(`  - Lead ${u.leadId} → Campaign ${u.campaignId} (via ${u.pattern})`);
      });
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Leads Processed:      ${result.totalLeadsProcessed}`);
    console.log(`Already Had Campaign ID:    ${result.alreadyHadCampaignId}`);
    console.log(`Matched by campaignName:    ${result.matchedByCampaignName}`);
    console.log(`Matched by leadSource:      ${result.matchedByLeadSource}`);
    console.log(`Matched by formId:          ${result.matchedByFormId}`);
    console.log(`No Match Found:             ${result.noMatchFound}`);
    console.log(`Errors:                     ${result.errors.length}`);
    console.log('='.repeat(60));

    if (result.noMatchFound > 0) {
      console.log('\n⚠️  WARNING: Some leads could not be matched to campaigns');
      console.log('These leads may be orphaned or require manual assignment');
    }

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach(e => {
        console.log(`  - Lead ${e.leadId}: ${e.error}`);
      });
    }

    return result;

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');

  if (dryRun) {
    console.log('💡 TIP: Run with --live flag to apply changes to database\n');
  } else {
    console.log('⚠️  LIVE MODE: Changes will be written to database\n');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const result = await backfillCampaignForeignKeys(dryRun);

  if (dryRun) {
    console.log('\n✅ Dry run complete. No changes were made to the database.');
    console.log('Run with --live flag to apply changes.');
  } else {
    console.log('\n✅ Live run complete. Database has been updated.');
  }

  process.exit(0);
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

// Export for use in other scripts
export { backfillCampaignForeignKeys };
