import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';
import { getAirtableClient } from '@/lib/airtable/client';

/**
 * POST /api/leads/[id]/remove-from-campaign
 * 
 * Removes a lead from active SMS campaign by updating Airtable status fields.
 * This triggers n8n automations to stop messaging the lead.
 * 
 * Contract: See docs/api-contracts/AIRTABLE-WRITE-OPERATIONS.md#contract-2
 * SOP: SOP§1.1 Step 2 - Implementation to pass tests
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const { reason } = body;
    const { id: leadId } = await params;

    // 3. Validate required fields
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return NextResponse.json(
        {
          error: 'Reason is required',
          code: 'VALIDATION_ERROR',
          field: 'reason',
        },
        { status: 400 }
      );
    }

    // 4. Validate reason length
    if (reason.length > 500) {
      return NextResponse.json(
        {
          error: 'Reason must be 500 characters or less',
          code: 'VALIDATION_ERROR',
          field: 'reason',
        },
        { status: 400 }
      );
    }

    // 5. Get lead from PostgreSQL to find Airtable record ID
    const lead = await db.query.leads.findFirst({
      where: (leads, { eq }) => eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 6. Authorization: Verify user can access this lead's client
    if (session.user.clientId !== lead.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have access to this lead', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    try {
      // 7. Update Airtable (source of truth)
      const airtable = getAirtableClient();
      const updatedRecord = await airtable.removeLeadFromCampaign(
        lead.airtableRecordId,
        reason.trim()
      );

      // 8. Log activity in PostgreSQL
      await db.insert(activityLog).values({
        userId: session.user.id,
        leadId: lead.id,
        clientId: lead.clientId,
        action: 'LEAD_REMOVED_FROM_CAMPAIGN',
        details: `Removed from campaign. Reason: ${reason}`,
        createdAt: new Date(),
      });

      // 9. Return success response
      return NextResponse.json(
        {
          success: true,
          airtableRecordId: updatedRecord.id,
          updatedFields: {
            'Processing Status': 'Stopped',
            'SMS Stop': true,
            'SMS Stop Reason': reason,
            'HRQ Status': 'Completed',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (airtableError) {
      console.error('Airtable API error:', airtableError);
      return NextResponse.json(
        {
          error: 'Failed to update Airtable',
          code: 'AIRTABLE_ERROR',
          details: process.env.NODE_ENV === 'development' ? String(airtableError) : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error removing lead from campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

