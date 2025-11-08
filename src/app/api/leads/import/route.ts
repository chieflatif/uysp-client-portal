import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logLeadActivity } from '@/lib/activity/logger';
import { EVENT_TYPES } from '@/lib/activity/event-types';
import { isValidEmail } from '@/lib/validation';

/**
 * POST /api/leads/import
 *
 * Bulk import leads from CSV via frontend modal
 *
 * Architecture: Parse CSV → Validate → Forward to n8n webhook → n8n handles normalization
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

interface N8nWebhookResponse {
  success: number;
  errors?: Array<{
    row: number;
    lead: ImportLeadRequest;
    error: string;
  }>;
  duplicates?: Array<{
    email: string;
    existingRecordId?: string;
  }>;
}

// n8n webhook URL for bulk lead import (from environment variable)
const N8N_WEBHOOK_URL = process.env.N8N_BULK_IMPORT_WEBHOOK_URL || 'https://rebelhq.app.n8n.cloud/webhook/bulk-lead-import';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 8000; // 8 seconds

/**
 * Sanitize string input to prevent XSS attacks
 */
function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 255); // Limit length
}

/**
 * Validate a single lead record
 */
function validateLead(lead: ImportLeadRequest, index: number): { isValid: boolean; error?: string } {
  // Validate email
  if (!lead.email || !isValidEmail(lead.email)) {
    return { isValid: false, error: `Row ${index + 1}: Invalid email address` };
  }

  // Validate firstName
  if (!lead.firstName || typeof lead.firstName !== 'string' || lead.firstName.trim().length === 0) {
    return { isValid: false, error: `Row ${index + 1}: First name is required` };
  }

  if (lead.firstName.length > 255) {
    return { isValid: false, error: `Row ${index + 1}: First name exceeds 255 characters` };
  }

  // Validate lastName
  if (!lead.lastName || typeof lead.lastName !== 'string' || lead.lastName.trim().length === 0) {
    return { isValid: false, error: `Row ${index + 1}: Last name is required` };
  }

  if (lead.lastName.length > 255) {
    return { isValid: false, error: `Row ${index + 1}: Last name exceeds 255 characters` };
  }

  // Validate optional fields length
  if (lead.phone && lead.phone.length > 50) {
    return { isValid: false, error: `Row ${index + 1}: Phone number too long` };
  }

  if (lead.company && lead.company.length > 255) {
    return { isValid: false, error: `Row ${index + 1}: Company name exceeds 255 characters` };
  }

  if (lead.title && lead.title.length > 255) {
    return { isValid: false, error: `Row ${index + 1}: Title exceeds 255 characters` };
  }

  return { isValid: true };
}

/**
 * Call n8n webhook with timeout and retry logic
 */
async function callN8nWebhook(payload: N8nWebhookPayload, attempt: number = 1): Promise<N8nWebhookResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();

      // Retry on 5xx errors
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
        console.warn(`n8n webhook failed with ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callN8nWebhook(payload, attempt + 1);
      }

      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Validate response structure
    if (!result || typeof result.success !== 'number') {
      throw new Error('Invalid response from n8n webhook - missing success count');
    }

    return result as N8nWebhookResponse;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    const err = error instanceof Error ? error : new Error('Unknown error occurred');

    if (err.name === 'AbortError') {
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
        console.warn(`n8n webhook timed out, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callN8nWebhook(payload, attempt + 1);
      }
      throw new Error('Import request timed out. The import is taking longer than expected. Please try with fewer leads or contact support.');
    }

    throw err;
  }
}

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
        { error: 'Insufficient permissions. Only administrators can import leads.' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = (await request.json()) as ImportRequestBody;
    const { sourceName, leads } = body;

    // 3. Validate and sanitize source name
    if (!sourceName || typeof sourceName !== 'string' || sourceName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Source name is required' },
        { status: 400 }
      );
    }

    const sanitizedSourceName = sanitizeInput(sourceName);

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Leads array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit to 500 leads per import to prevent timeouts
    if (leads.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 leads per import. Please split your file into smaller batches.' },
        { status: 400 }
      );
    }

    // 4. Validate and sanitize each lead
    const validationErrors: Array<{ row: number; lead: ImportLeadRequest; error: string }> = [];
    const sanitizedLeads: ImportLeadRequest[] = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const validation = validateLead(lead, i);

      if (!validation.isValid) {
        validationErrors.push({
          row: i + 1,
          lead,
          error: validation.error || 'Validation failed',
        });
        continue;
      }

      // Sanitize all string fields
      sanitizedLeads.push({
        email: sanitizeInput((lead.email || '').toLowerCase()),
        firstName: sanitizeInput(lead.firstName || ''),
        lastName: sanitizeInput(lead.lastName || ''),
        phone: lead.phone ? sanitizeInput(lead.phone) : undefined,
        company: lead.company ? sanitizeInput(lead.company) : undefined,
        title: lead.title ? sanitizeInput(lead.title) : undefined,
      });
    }

    // If all leads failed validation, return early
    if (sanitizedLeads.length === 0) {
      return NextResponse.json(
        {
          error: 'All leads failed validation',
          validationErrors,
        },
        { status: 400 }
      );
    }

    // 5. Prepare payload for n8n webhook
    const n8nPayload: N8nWebhookPayload = {
      leads: sanitizedLeads,
      sourceName: sanitizedSourceName,
    };

    // 6. Send to n8n webhook for normalization and processing
    const startTime = Date.now();

    let n8nResult;
    try {
      n8nResult = await callN8nWebhook(n8nPayload);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      console.error('❌ n8n webhook failed:', err);

      // User-friendly error messages
      let userMessage = 'Failed to import leads. Please try again.';
      if (err.message.includes('timed out')) {
        userMessage = 'Import is taking longer than expected. Your leads may still be processing. Please check back in a few minutes.';
      } else if (err.message.includes('500')) {
        userMessage = 'Our import service is temporarily unavailable. Please try again in a few minutes.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        userMessage = 'Network error occurred. Please check your connection and try again.';
      }

      return NextResponse.json(
        {
          error: userMessage,
          technicalDetails: err.message,
        },
        { status: 503 }
      );
    }

    const importDuration = Date.now() - startTime;

    // 7. Extract results from n8n response
    const successCount = n8nResult.success || 0;
    const errors = n8nResult.errors || [];
    const duplicates = n8nResult.duplicates || [];

    // Merge server-side validation errors with n8n errors
    const allErrors = [...validationErrors, ...errors];

    // 8. Log BULK_IMPORT activity
    const clientId = session.user.clientId || process.env.DEFAULT_CLIENT_ID || '';

    await logLeadActivity({
      eventType: EVENT_TYPES.BULK_IMPORT,
      eventCategory: 'SYSTEM',
      clientId: clientId,
      description: `Bulk import: ${successCount} leads from "${sanitizedSourceName}"`,
      metadata: {
        source_name: sanitizedSourceName,
        total_leads: leads.length,
        valid_leads_sent: sanitizedLeads.length,
        success_count: successCount,
        error_count: allErrors.length,
        duplicate_count: duplicates.length,
        imported_by_user_id: session.user.id,
        imported_by_email: session.user.email,
        import_duration_ms: importDuration,
        n8n_workflow: 'bulk-lead-import',
      },
      source: 'ui:bulk-import',
      createdBy: session.user.id,
    });

    // 9. Return results
    const response: ImportResponse = {
      success: successCount,
      errors: allErrors,
      duplicates,
      sourceTag: sanitizedSourceName,
      message: successCount > 0
        ? `Successfully imported ${successCount} lead${successCount === 1 ? '' : 's'}${allErrors.length > 0 ? ` (${allErrors.length} failed)` : ''}`
        : 'No leads were imported',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Internal server error');
    console.error('❌ Lead import failed:', err);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during import. Please try again or contact support.',
        technicalDetails: err.message,
      },
      { status: 500 }
    );
  }
}
