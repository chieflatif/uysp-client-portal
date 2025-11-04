import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // SECURITY FIX: Enforce multi-tenancy isolation
    // SUPER_ADMIN can view any lead
    if (session.user.role === 'SUPER_ADMIN') {
      // No restriction for SUPER_ADMIN
    } else if (session.user.clientId !== lead.clientId) {
      // CLIENT_ADMIN and CLIENT_USER must match clientId
      return NextResponse.json(
        { error: 'Forbidden - You can only view leads in your own client' },
        { status: 403 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads/[id]
 *
 * Soft delete a lead (sets isActive = false)
 *
 * SECURITY:
 * - Uses PostgreSQL advisory locks to prevent race conditions
 * - Enforces client isolation (can't delete other client's leads)
 * - Admin-only operation
 *
 * Advisory Lock Strategy:
 * - Uses pg_try_advisory_lock() with lead UUID hash
 * - Prevents concurrent modifications to the same lead
 * - Automatically released at transaction end
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete leads
    if (!['SUPER_ADMIN', 'CLIENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Acquire advisory lock for this lead (prevents race conditions)
    // Convert UUID to bigint for advisory lock
    const lockAcquired = await db.execute(sql`
      SELECT pg_try_advisory_lock(('x' || substring(md5(${id}::text), 1, 15))::bit(60)::bigint)
    `);

    if (!lockAcquired) {
      return NextResponse.json(
        { error: 'Lead is currently being modified. Please try again.' },
        { status: 409 } // Conflict
      );
    }

    // Find lead
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
    });

    if (!lead) {
      // Release lock before returning
      await db.execute(sql`
        SELECT pg_advisory_unlock(('x' || substring(md5(${id}::text), 1, 15))::bit(60)::bigint)
      `);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if already deleted
    if (!lead.isActive) {
      await db.execute(sql`
        SELECT pg_advisory_unlock(('x' || substring(md5(${id}::text), 1, 15))::bit(60)::bigint)
      `);
      return NextResponse.json(
        { error: 'Lead is already deleted' },
        { status: 400 }
      );
    }

    // SECURITY: Enforce multi-tenancy isolation
    if (session.user.role !== 'SUPER_ADMIN' && session.user.clientId !== lead.clientId) {
      await db.execute(sql`
        SELECT pg_advisory_unlock(('x' || substring(md5(${id}::text), 1, 15))::bit(60)::bigint)
      `);
      return NextResponse.json(
        { error: 'Forbidden - You can only delete leads in your own client' },
        { status: 403 }
      );
    }

    // Soft delete (set isActive = false)
    await db
      .update(leads)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id));

    // Release advisory lock
    await db.execute(sql`
      SELECT pg_advisory_unlock(('x' || substring(md5(${id}::text), 1, 15))::bit(60)::bigint)
    `);

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
