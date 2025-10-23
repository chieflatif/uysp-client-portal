import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, clients, activityLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/campaigns/pause
 * 
 * Pause all campaigns for a client (SUPER_ADMIN or ADMIN)
 * TDD: Implementation to pass tests in tests/api/admin/pause-campaigns.test.ts
 * Endpoint #6 from ADMIN-AUTOMATION-BUILD-TASK.md
 */

const pauseCampaignsSchema = z.object({
  clientId: z.string().uuid('Valid client ID required'),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Authorization - SUPER_ADMIN or ADMIN
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation
    const validation = pauseCampaignsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { clientId, reason } = validation.data;

    // Verify client exists
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // For ADMIN users, verify they can only pause their own client
    if (session.user.role === 'ADMIN' && session.user.clientId !== clientId) {
      return NextResponse.json(
        { error: 'Forbidden - Can only pause campaigns for your own client', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get count of leads that will be affected
    const leadsResult = await db.query.leads.findMany({
      where: eq(leads.clientId, clientId),
    });

    const affectedLeadsCount = leadsResult.length;

    // Pause all campaigns for this client by updating processing_status
    if (affectedLeadsCount > 0) {
      await db.update(leads)
        .set({ processingStatus: 'Paused' })
        .where(eq(leads.clientId, clientId));
    }

    // Log activity
    await db.insert(activityLog).values({
      userId: session.user.id,
      clientId: clientId,
      action: 'CAMPAIGNS_PAUSED',
      details: `Paused campaigns for client: ${client.companyName}. Affected leads: ${affectedLeadsCount}${reason ? `. Reason: ${reason}` : ''}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }).catch(err => {
      console.warn('Failed to log activity:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Campaigns paused for client ${client.companyName}`,
      client: {
        id: client.id,
        companyName: client.companyName,
      },
      affectedLeadsCount,
    });

  } catch (error) {
    console.error('Error pausing campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}







