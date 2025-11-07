import { NextRequest, NextResponse } from 'next/server';
import { getAirtableClient } from '@/lib/airtable/client';
import { db } from '@/lib/db';
import { leads, campaigns, type NewLead } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// UYSP client ID
const UYSP_CLIENT_ID = '6a08f898-19cd-49f8-bd77-6fcb2dd56db9';

/**
 * POST /api/cron/sync-airtable
 *
 * Automated Airtable → PostgreSQL sync
 * Called every 5 minutes by Render cron job
 *
 * Security: Protected by CRON_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || !cronSecret) {
      console.error('[Airtable Sync] Missing authorization or CRON_SECRET');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedSecret = authHeader.replace('Bearer ', '');
    if (providedSecret !== cronSecret) {
      console.error('[Airtable Sync] Invalid CRON_SECRET');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Airtable Sync] Starting automated sync...');
    const startTime = Date.now();

    // CRITICAL FIX - STEP A: Pre-compute campaign mapping (formId → campaign.id)
    console.log('[Airtable Sync] Building campaign mapping...');
    const allCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.clientId, UYSP_CLIENT_ID),
    });

    // Build Map<formId, campaign.id> for efficient lookup
    const formIdToCampaignId = new Map<string, string>();
    for (const campaign of allCampaigns) {
      if (campaign.formId) {
        formIdToCampaignId.set(campaign.formId, campaign.id);
      }
    }
    console.log(`[Airtable Sync] Mapped ${formIdToCampaignId.size} campaigns to form IDs`);

    const airtable = getAirtableClient();
    let totalFetched = 0;
    let totalUpdated = 0;
    let totalCreated = 0;
    let totalEnriched = 0; // Track how many leads got campaign_id enriched
    let errors = 0;

    await airtable.streamAllLeads(async (record) => {
      totalFetched++;

      try {
        const leadData = airtable.mapToDatabaseLead(record, UYSP_CLIENT_ID);

        // CRITICAL FIX - STEP B & C: Enrich lead with campaign_id
        // Use formId to lookup corresponding campaign.id from pre-computed Map
        if (leadData.formId && formIdToCampaignId.has(leadData.formId)) {
          leadData.campaignId = formIdToCampaignId.get(leadData.formId);
          totalEnriched++;
        }

        // Find existing lead by Airtable record ID
        const existing = await db.query.leads.findFirst({
          where: eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          // Update existing lead
          await db
            .update(leads)
            .set({
              ...leadData,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existing.id));
          totalUpdated++;
        } else {
          // Insert new lead
          // Type assertion is safe: mapToDatabaseLead() provides all required fields with fallbacks
          await db.insert(leads).values(leadData as NewLead);
          totalCreated++;
        }

        // Log progress every 500 records
        if (totalFetched % 500 === 0) {
          console.log(`[Airtable Sync] Processed ${totalFetched} leads...`);
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`[Airtable Sync] Error syncing record ${record.id}:`, error);
        }
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const summary = {
      success: true,
      totalFetched,
      totalUpdated,
      totalCreated,
      totalEnriched, // NEW: Track how many leads got campaign_id populated
      errors,
      durationSeconds: duration,
      timestamp: new Date().toISOString(),
    };

    console.log('[Airtable Sync] Completed:', summary);
    console.log(`[Airtable Sync] Successfully enriched ${totalEnriched} leads with campaign_id`);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Airtable Sync] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
