import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendWeeklyReport, sendTestReport, sendAllWeeklyReports } from '@/lib/email/weekly-report';

/**
 * POST /api/reports/weekly
 * Send weekly project management report
 * 
 * SECURITY:
 * - CLIENT_ADMIN: Can only send reports for their own client
 * - SUPER_ADMIN: Can send reports for any client or all clients
 * 
 * Query params:
 * - test=true: Send to requesting user only (for testing)
 * - clientId: Client ID (required for CLIENT_ADMIN, optional for SUPER_ADMIN)
 * - all=true: Send reports for all clients (SUPER_ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Only admins can trigger reports
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'CLIENT_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const isTest = searchParams.get('test') === 'true';
    const sendAll = searchParams.get('all') === 'true';
    const requestedClientId = searchParams.get('clientId');

    // SECURITY: Handle "send all" - SUPER_ADMIN only
    if (sendAll) {
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden - Only SUPER_ADMIN can send reports for all clients' },
          { status: 403 }
        );
      }

      await sendAllWeeklyReports();
      return NextResponse.json({
        success: true,
        message: 'Weekly reports sent for all clients',
      });
    }

    // SECURITY: Determine which client to send report for
    let clientId: string;

    if (session.user.role === 'CLIENT_ADMIN') {
      // CLIENT_ADMIN can ONLY send for their own client
      if (requestedClientId && requestedClientId !== session.user.clientId) {
        return NextResponse.json(
          { error: 'Forbidden - CLIENT_ADMIN can only send reports for their own client' },
          { status: 403 }
        );
      }
      clientId = session.user.clientId!;
    } else {
      // SUPER_ADMIN can send for any client
      clientId = requestedClientId || session.user.clientId!;
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      );
    }

    if (isTest) {
      // Send test report to requesting user
      await sendTestReport(clientId, session.user.email!);
      return NextResponse.json({
        success: true,
        message: `Test report sent to ${session.user.email}`,
      });
    } else {
      // SECURITY: Send to admins for THIS CLIENT ONLY
      await sendWeeklyReport(clientId);
      return NextResponse.json({
        success: true,
        message: 'Weekly report sent to administrators',
      });
    }
  } catch (error) {
    console.error('Error sending weekly report:', error);

    // Check if SMTP is configured
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM_EMAIL);

    let errorMessage = 'Failed to send report';
    if (!smtpConfigured) {
      errorMessage = 'SMTP not configured - check SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL environment variables in Render';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        smtpConfigured
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/weekly
 * Check if weekly reports are configured
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      configured: true,
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
      testAvailable: session.user.role === 'SUPER_ADMIN' || session.user.role === 'CLIENT_ADMIN',
    });
  } catch (error) {
    console.error('Error checking report configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}

