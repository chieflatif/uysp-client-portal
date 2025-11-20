import { NextResponse } from 'next/server';
import { syncAirtableLeads } from '@/lib/sync/airtable-to-postgres';

export async function POST() {
  try {
    console.log('📡 Sync request received');
    
    const result = await syncAirtableLeads();

    if (result.success) {
      return NextResponse.json(
        {
          status: 'success',
          message: 'Sync completed successfully',
          data: {
            totalRecords: result.totalRecords,
            inserted: result.inserted,
            updated: result.updated,
            duration: Math.round(
              (result.endTime.getTime() - result.startTime.getTime()) / 1000
            ),
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: 'partial',
          message: 'Sync completed with errors',
          data: {
            totalRecords: result.totalRecords,
            inserted: result.inserted,
            updated: result.updated,
            errors: result.errors.slice(0, 5),
            duration: Math.round(
              (result.endTime.getTime() - result.startTime.getTime()) / 1000
            ),
          },
        },
        { status: 207 }
      );
    }
  } catch (error) {
    console.error('Sync error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}
