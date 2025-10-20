import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';
import { getAirtableClient } from '@/lib/airtable/client';

/**
 * POST /api/leads/[id]/status
 * 
 * Change a lead's HRQ Status in Airtable to indicate manual processing.
 * 
 * Contract: See docs/api-contracts/AIRTABLE-WRITE-OPERATIONS.md#contract-3
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
    const { status, reason } = body;
    const { id: leadId } = await params;

    // 3. Validate required fields
    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        {
          error: 'Status is required',
          code: 'VALIDATION_ERROR',
          field: 'status',
        },
        { status: 400 }
      );
    }

    // 4. Validate status value
    const validStatuses = ['Qualified', 'Archive', 'Review', 'Manual Process'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Status must be one of: ${validStatuses.join(', ')}`,
          code: 'VALIDATION_ERROR',
          field: 'status',
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
      // 7. Get current status from Airtable
      const airtable = getAirtableClient();
      const currentRecord = await airtable.getRecord(lead.airtableRecordId);
      const previousStatus = currentRecord.fields['HRQ Status'] as string || 'Unknown';

      // 8. Update status in Airtable (source of truth)
      const updatedRecord = await airtable.updateLeadStatus(
        lead.airtableRecordId,
        status as 'Qualified' | 'Archive' | 'Review' | 'Manual Process',
        reason
      );

      // 9. Log activity in PostgreSQL
      await db.insert(activityLog).values({
        userId: session.user.id,
        leadId: lead.id,
        clientId: lead.clientId,
        action: 'LEAD_STATUS_CHANGED',
        details: `Changed status from "${previousStatus}" to "${status}"${reason ? `. Reason: ${reason}` : ''}`,
        createdAt: new Date(),
      });

      // 10. Return success response
      return NextResponse.json(
        {
          success: true,
          airtableRecordId: updatedRecord.id,
          previousStatus,
          newStatus: status,
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
    console.error('Error changing lead status:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

