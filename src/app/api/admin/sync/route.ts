// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAirtableClient } from '@/lib/airtable/client';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/admin/sync
 * 
 * Manually trigger Airtable → PostgreSQL sync
 * SUPER_ADMIN only
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization - SUPER_ADMIN only
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - SUPER_ADMIN access required' },
        { status: 403 }
      );
    }

    const airtable = getAirtableClient();
    let totalFetched = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let errors = 0;

    // Use the Rebel HQ client ID (should be passed in request or looked up)
    const clientId = '7a3ff4d5-aee5-46da-95d0-9f5e306bc649';

    await airtable.streamAllLeads(async (record) => {
      totalFetched++;

      try {
        // Map Airtable record to database lead
        const leadData = airtable.mapToDatabaseLead(record, clientId);

        // Check if lead exists
        const existing = await db.query.leads.findFirst({
          where: (leads, { eq }) => eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          // Update existing lead with latest data from Airtable
          await db.update(leads)
            .set({
              ...leadData,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existing.id));
          
          totalUpdated++;
        } else {
          // Insert new lead
          await db.insert(leads).values({
            ...leadData,
            id: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          totalInserted++;
        }

        // Send progress updates every 100 records
        if ((totalInserted + totalUpdated) % 100 === 0) {
          console.log(`Progress: ${totalInserted + totalUpdated} leads synced...`);
        }

      } catch (error: any) {
        errors++;
        console.error(`Error syncing record ${record.id}:`, error.message);
      }
    });

    return NextResponse.json({
      success: true,
      results: {
        totalFetched,
        totalInserted,
        totalUpdated,
        errors
      },
      message: `Sync complete! Fetched ${totalFetched}, inserted ${totalInserted}, updated ${totalUpdated}, errors: ${errors}`
    });

  } catch (error: any) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

