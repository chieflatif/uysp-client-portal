import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clientProjectTasks, clientProjectBlockers, clientProjectStatus, clients } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/clients/[id]/project
 * 
 * Fetch project management data for a specific client
 * - Tasks (with filtering by status/priority)
 * - Blockers (active only by default)
 * - Project status metrics
 * 
 * Auth: SUPER_ADMIN (all clients) or ADMIN (their client only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // SECURITY: Authorization check - enforce client isolation
    if (session.user.role === 'CLIENT_ADMIN') {
      // CLIENT_ADMIN can only see their own client
      if (session.user.clientId !== (await params).id) {
        return NextResponse.json(
          { error: 'Forbidden - can only view your own client data', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'SUPER_ADMIN') {
      // Only SUPER_ADMIN and CLIENT_ADMIN allowed
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    // SUPER_ADMIN can view any client - no restriction

    // Verify client exists
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, (await params).id),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch all project data in parallel
    const [tasks, blockers, statusMetrics] = await Promise.all([
      db.query.clientProjectTasks.findMany({
        where: eq(clientProjectTasks.clientId, (await params).id),
        orderBy: (tasks) => [tasks.priority, tasks.dueDate],
      }),
      db.query.clientProjectBlockers.findMany({
        where: and(
          eq(clientProjectBlockers.clientId, (await params).id),
          eq(clientProjectBlockers.status, 'Active')
        ),
        orderBy: (blockers) => [blockers.severity, blockers.createdAt],
      }),
      db.query.clientProjectStatus.findMany({
        where: eq(clientProjectStatus.clientId, (await params).id),
        orderBy: (status) => [status.displayOrder],
      }),
    ]);

    // Group tasks by priority/status for table view
    // IMPORTANT: Exclude completed tasks from priority buckets to avoid duplicates
    const tasksByStatus = {
      critical: tasks.filter(t => (t.priority === '🔴 Critical' || t.priority === 'Critical') && t.status !== 'Complete'),
      high: tasks.filter(t => (t.priority === '🟠 High' || t.priority === 'High') && t.status !== 'Complete'),
      medium: tasks.filter(t => (t.priority === '🟡 Medium' || t.priority === 'Medium') && t.status !== 'Complete'),
      complete: tasks.filter(t => t.status === 'Complete'),
    };

    // Calculate project progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Complete').length;
    const progressPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // Extract current phase and milestones from status metrics
    const currentPhase = statusMetrics.find(m => m.metric === 'Current Phase')?.value || 'Not Set';
    const milestones = statusMetrics.filter(m => m.category === 'Milestone');

    return NextResponse.json({
      client: {
        id: client.id,
        companyName: client.companyName,
      },
      overview: {
        currentPhase,
        progressPercentage,
        totalTasks,
        completedTasks,
        activeTasks: totalTasks - completedTasks,
        activeBlockers: blockers.length,
      },
      taskBoard: tasksByStatus,
      blockers: blockers.map(b => ({
        id: b.id,
        blocker: b.blocker,
        severity: b.severity,
        status: b.status,
        actionToResolve: b.actionToResolve,
        createdAt: b.createdAt,
      })),
      milestones: milestones.map(m => ({
        id: m.id,
        milestone: m.metric,
        value: m.value,
        displayOrder: m.displayOrder,
      })),
      metrics: statusMetrics.filter(m => m.category !== 'Milestone'),
    });
  } catch (error) {
    console.error('Error fetching project data:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

