/**
 * Campaign Foreign Key Backfill Logic
 *
 * PURPOSE:
 * Populates the `campaign_id` foreign key for all legacy leads
 * using 3-pattern matching logic.
 *
 * MATCHING PATTERNS:
 * 1. leads.campaignName = campaigns.id::text (UUID string match)
 * 2. leads.leadSource = campaigns.name (name string match)
 * 3. leads.formId = campaigns.formId (webinar campaigns)
 */

import { db } from '../db';
import { leads, campaigns } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface BackfillResult {
  totalLeadsProcessed: number;
  matchedByCampaignName: number;
  matchedByLeadSource: number;
  matchedByFormId: number;
  noMatchFound: number;
  alreadyHadCampaignId: number;
  errors: Array<{ leadId: string; error: string }>;
}

/**
 * Main backfill function
 * @param dryRun - If true, preview changes without applying them
 * @returns BackfillResult with statistics
 */
export async function backfillCampaignForeignKeys(dryRun: boolean = true): Promise<BackfillResult> {
  console.log('🔄 Starting Campaign FK Backfill...');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '💾 LIVE RUN (updating database)'}\n`);

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

    // Track updates
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
        // Pattern 1: Match by campaignName (UUID)
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

        // Pattern 2: Match by leadSource (campaign name)
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

        // Pattern 3: Match by formId (webinar campaigns)
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

        const index = updates.indexOf(update);
        if (index % 100 === 0) {
          console.log(`  ⏳ Updated ${index}/${updates.length} leads...`);
        }
      }

      console.log('✅ All updates applied successfully');
    } else if (dryRun && updates.length > 0) {
      console.log(`\n🔍 DRY RUN: Would update ${updates.length} leads`);
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
    }

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.slice(0, 10).forEach(e => {
        console.log(`  - Lead ${e.leadId}: ${e.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    return result;

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    throw error;
  }
}

/**
 * Calculate and update campaign aggregates for all active campaigns
 */
export async function updateAllCampaignAggregates(): Promise<{ updated: number; errors: number }> {
  console.log('\n🔄 Calculating campaign aggregates...');

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

// Missing sql import at the top
import { sql } from 'drizzle-orm';
