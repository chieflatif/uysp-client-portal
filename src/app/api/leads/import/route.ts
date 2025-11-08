import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { AirtableClient } from '@/lib/airtable/client';
import { logLeadActivity } from '@/lib/activity/logger';
import { EVENT_TYPES } from '@/lib/activity/event-types';
import { validateLead } from '@/lib/validation';

/**
 * POST /api/leads/import
 *
 * Bulk import leads from CSV via frontend modal
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

interface ImportResponse {
  success: number;
  errors: Array<{
    row: number;
    lead: ImportLeadRequest;
    error: string;
  }>;
  duplicates: Array<{
    email: string;
    existingRecordId: string;
  }>;
  sourceTag: string;
  airtableRecordIds: string[];
}

/**
 * Batch create records in Airtable (max 10 per request)
 */
async function batchCreateLeads(
  airtableClient: AirtableClient,
  leads: ImportLeadRequest[],
  sourceName: string,
  clientId: string
): Promise<any[]> {
  const BATCH_SIZE = 10;
  const batches: ImportLeadRequest[][] = [];

  // Split leads into batches of 10
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    batches.push(leads.slice(i, i + BATCH_SIZE));
  }

  const allRecords: any[] = [];

  // Process each batch with delay to respect rate limits
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    try {
      // Create records array for this batch
      const records = batch.map((lead) => ({
        fields: {
          'Email': lead.email,
          'First Name': lead.firstName,
          'Last Name': lead.lastName,
          'Phone': lead.phone || '',
          'Company': lead.company || '',
          'Job Title': lead.title || '',
          'Kajabi Tags': sourceName, // Single tag as string
          'Processing Status': 'New',
          'HRQ Status': 'Unprocessed',
          'SMS Status': 'Not Sent',
          'Client ID': clientId,
        },
      }));

      // Batch create using Airtable API
      const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ records }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airtable batch create failed: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      allRecords.push(...result.records);

      // Add delay between batches to respect rate limits (5 requests/second)
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error: any) {
      console.error(`❌ Batch ${i + 1}/${batches.length} failed:`, error);
      throw error;
    }
  }

  return allRecords;
}

/**
 * Check for duplicate leads in Airtable by email
 */
async function checkDuplicates(
  airtableClient: AirtableClient,
  emails: string[]
): Promise<Array<{ email: string; recordId: string }>> {
  if (emails.length === 0) return [];

  try {
    // Build OR formula for all emails
    const emailConditions = emails.map((email) => `{Email}='${email}'`).join(', ');
    const formula = `OR(${emailConditions})`;

    const params = new URLSearchParams({
      filterByFormula: formula,
      fields: JSON.stringify(['Email', 'Record ID']),
    });

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads?${params}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Duplicate check failed, continuing without check');
      return [];
    }

    const data = await response.json();
    return data.records.map((record: any) => ({
      email: record.fields.Email,
      recordId: record.id,
    }));
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return []; // Continue without duplicate check on error
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

    // 4. Get client's Airtable base
    const clientId = session.user.clientId || process.env.DEFAULT_CLIENT_ID || '';
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID not found' },
        { status: 400 }
      );
    }

    // Initialize Airtable client
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableApiKey = process.env.AIRTABLE_API_KEY;

    if (!airtableBaseId || !airtableApiKey) {
      return NextResponse.json(
        { error: 'Airtable configuration missing' },
        { status: 500 }
      );
    }

    const airtableClient = new AirtableClient(airtableBaseId, airtableApiKey);

    // 5. Validate all leads
    const validationResults = leads.map((lead, idx) =>
      validateLead(lead, idx + 1)
    );

    const invalidLeads = validationResults
      .map((result, idx) => ({ result, idx }))
      .filter(({ result }) => !result.isValid)
      .map(({ result, idx }) => ({
        row: idx + 1,
        lead: leads[idx],
        error: result.errors.join('; '),
      }));

    const validLeads = validationResults
      .filter((result) => result.isValid)
      .map((result) => result.lead);

    // 6. Check for duplicates in Airtable
    const emails = validLeads.map((lead) => lead.email);
    const duplicates = await checkDuplicates(airtableClient, emails);

    // Filter out duplicates
    const duplicateEmails = new Set(duplicates.map((d) => d.email.toLowerCase()));
    const leadsToImport = validLeads.filter(
      (lead) => !duplicateEmails.has(lead.email.toLowerCase())
    );

    // 7. Batch import to Airtable
    const startTime = Date.now();
    let createdRecords: any[] = [];

    if (leadsToImport.length > 0) {
      createdRecords = await batchCreateLeads(
        airtableClient,
        leadsToImport,
        sourceName,
        clientId
      );
    }

    const importDuration = Date.now() - startTime;

    // 8. Log BULK_IMPORT activity
    await logLeadActivity({
      eventType: EVENT_TYPES.BULK_IMPORT,
      eventCategory: 'SYSTEM',
      clientId: clientId,
      description: `Bulk import: ${leadsToImport.length} leads from "${sourceName}"`,
      metadata: {
        source_name: sourceName,
        total_leads: leads.length,
        success_count: leadsToImport.length,
        error_count: invalidLeads.length,
        duplicate_count: duplicates.length,
        imported_by_user_id: session.user.id,
        imported_by_email: session.user.email,
        import_duration_ms: importDuration,
      },
      source: 'ui:bulk-import',
      createdBy: session.user.id,
    });

    // 9. Return results
    const response: ImportResponse = {
      success: createdRecords.length,
      errors: invalidLeads,
      duplicates: duplicates.map((d) => ({
        email: d.email,
        existingRecordId: d.recordId,
      })),
      sourceTag: sourceName,
      airtableRecordIds: createdRecords.map((r) => r.id),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('❌ Lead import failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
