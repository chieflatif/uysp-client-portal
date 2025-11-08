import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logLeadActivity } from '@/lib/activity/logger';
import { EVENT_TYPES } from '@/lib/activity/event-types';

/**
 * POST /api/leads/import
 *
 * Bulk import leads from CSV via frontend modal
 *
 * Architecture: Parse CSV → Forward to n8n webhook → n8n handles normalization
 *
 * n8n workflow handles:
 * - Phone formatting
 * - Email validation
 * - Coaching client detection
 * - Duplicate detection
 * - Airtable write
 *
 * PRD Reference: docs/LEAD-IMPORT-FEATURE-WEEK-5.md Section 3
 */

interface ImportLeadRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  title?: string;
}

interface ImportRequestBody {
  sourceName: string;
  leads: ImportLeadRequest[];
}

interface N8nWebhookPayload {
  leads: ImportLeadRequest[];
  sourceName: string;
}

interface ImportResponse {
  success: number;
  errors: Array<{
    row: number;
    lead: ImportLeadRequest;
    error: string;
  }>;
  duplicates: Array<{
    email: string;
    existingRecordId?: string;
  }>;
  sourceTag: string;
  message: string;
}

// n8n webhook URL for bulk lead import
const N8N_WEBHOOK_URL = 'https://rebelhq.app.n8n.cloud/webhook/bulk-lead-import';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Only ADMIN, SUPER_ADMIN, and CLIENT_ADMIN can import leads
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = (await request.json()) as ImportRequestBody;
    const { sourceName, leads } = body;

    // 3. Validate input
    if (!sourceName || typeof sourceName !== 'string' || sourceName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Source name is required' },
        { status: 400 }
      );
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Leads array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit to 500 leads per import to prevent timeouts
    if (leads.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 leads per import' },
        { status: 400 }
      );
    }

    // 4. Prepare payload for n8n webhook
    const n8nPayload: N8nWebhookPayload = {
      leads,
      sourceName: sourceName.trim(),
    };

    // 5. Send to n8n webhook for normalization and processing
    const startTime = Date.now();

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n webhook failed:', errorText);
      throw new Error(`n8n webhook failed: ${n8nResponse.status} - ${errorText}`);
    }

    const n8nResult = await n8nResponse.json();
    const importDuration = Date.now() - startTime;

    // 6. Extract results from n8n response
    // n8n should return: { success: number, errors: [], duplicates: [], ... }
    const successCount = n8nResult.success || 0;
    const errors = n8nResult.errors || [];
    const duplicates = n8nResult.duplicates || [];

    // 7. Log BULK_IMPORT activity
    const clientId = session.user.clientId || process.env.DEFAULT_CLIENT_ID || '';

    await logLeadActivity({
      eventType: EVENT_TYPES.BULK_IMPORT,
      eventCategory: 'SYSTEM',
      clientId: clientId,
      description: `Bulk import: ${successCount} leads from "${sourceName}"`,
      metadata: {
        source_name: sourceName,
        total_leads: leads.length,
        success_count: successCount,
        error_count: errors.length,
        duplicate_count: duplicates.length,
        imported_by_user_id: session.user.id,
        imported_by_email: session.user.email,
        import_duration_ms: importDuration,
        n8n_workflow: 'bulk-lead-import',
      },
      source: 'ui:bulk-import',
      createdBy: session.user.id,
    });

    // 8. Return results
    const response: ImportResponse = {
      success: successCount,
      errors,
      duplicates,
      sourceTag: sourceName.trim(),
      message: `Successfully imported ${successCount} leads via n8n normalization`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('❌ Lead import failed:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: 'Failed to process lead import through n8n webhook'
      },
      { status: 500 }
    );
  }
}
