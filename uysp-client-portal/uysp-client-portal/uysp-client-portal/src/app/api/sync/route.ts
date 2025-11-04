import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('📡 Sync request received');
    
    // For now, just return success to confirm endpoint is working
    // TODO: Import and call syncAirtableLeads() when database is ready
    return NextResponse.json(
      {
        status: 'success',
        message: 'Sync endpoint ready - database sync coming soon',
        data: {
          totalRecords: 0,
          inserted: 0,
          updated: 0,
          duration: 0,
        },
      },
      { status: 200 }
    );
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
