import { NextRequest, NextResponse } from 'next/server';
import { sendAllWeeklyReports } from '@/lib/email/weekly-report';

/**
 * Cron endpoint for automated weekly reports
 * 
 * SECURITY: Protected by CRON_SECRET environment variable
 * 
 * Usage in Render/Vercel/etc:
 *   Schedule: Every Friday at 5 PM UTC (0 17 * * 5)
 *   Command: curl https://your-app.com/api/cron/weekly-report -H "Authorization: Bearer $CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error('❌ Unauthorized cron attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📊 Starting weekly report cron job...');
    
    // Send reports for ALL clients
    // Each client gets isolated report, SUPER_ADMIN gets one per client
    await sendAllWeeklyReports();

    return NextResponse.json({
      success: true,
      message: 'Weekly reports sent for all clients',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send reports', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

