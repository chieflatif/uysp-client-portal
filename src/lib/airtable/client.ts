import type { NewLead } from '../db/schema';

// Type definitions for Airtable Leads
interface AirtableLeadFields {
  'Lead': string;
  'First Name'?: string;
  'Last Name'?: string;
  'Email'?: string;
  'Phone'?: string;
  'Company'?: string;
  'Job Title'?: string;
  'ICP Score'?: number;
  'SMS Status'?: string;
  'Location Country'?: string;
  'Company Type'?: string;
  'Record ID'?: string;
  
  // Status & Campaign fields
  'Processing Status'?: string;
  'HRQ Status'?: string;
  'HRQ Reason'?: string;
  'SMS Stop'?: boolean;
  'SMS Stop Reason'?: string;
  'Booked'?: boolean;
  'Booked At'?: string;
  
  // Campaign & Sequence tracking
  'SMS Campaign ID'?: string;
  'SMS Variant'?: string; // A or B
  'SMS Sequence Position'?: number;
  'SMS Sent Count'?: number;
  'SMS Last Sent At'?: string;
  'SMS Batch Control'?: string;
  'SMS Eligible'?: boolean;
  
  // Click tracking
  'Short Link ID'?: string;
  'Short Link URL'?: string;
  'Click Count'?: number;
  'Clicked Link'?: boolean;
  
  // LinkedIn & Enrichment
  'Linkedin URL - Person'?: string;
  'Company LinkedIn'?: string;
  'Enrichment Outcome'?: string;
  'Enrichment Attempted At'?: string;
  
  // Notes field
  'Notes'?: string;
  
  [key: string]: unknown;
}

interface AirtableRecord {
  id: string;
  fields: AirtableLeadFields;
  createdTime: string;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

export class AirtableClient {
  private baseId: string;
  private apiKey: string;
  private baseUrl = 'https://api.airtable.com/v0';

  constructor(baseId: string, apiKey: string) {
    this.baseId = baseId;
    this.apiKey = apiKey;
  }

  /**
   * Fetch all leads from Airtable with pagination
   */
  async getAllLeads(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    try {
      const params = new URLSearchParams({
        pageSize: '100',
        sort0Field: 'Lead',
        sort0Direction: 'asc',
      });

      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/Leads?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
      }

      const data = (await response.json()) as AirtableListResponse;

      return {
        records: data.records,
        nextOffset: data.offset,
      };
    } catch (error) {
      console.error('Error fetching leads from Airtable:', error);
      throw error;
    }
  }

  /**
   * Fetch all records from SMS_Audit table
   */
  async getAllSmsAudit(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    try {
      const params = new URLSearchParams({
        pageSize: '100',
      });

      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/SMS_Audit?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
      }

      const data = (await response.json()) as AirtableListResponse;

      return {
        records: data.records,
        nextOffset: data.offset,
      };
    } catch (error) {
      console.error('Error fetching SMS_Audit from Airtable:', error);
      throw error;
    }
  }

  /**
   * Get all leads with pagination handling
   */
  async streamAllLeads(onRecord: (record: AirtableRecord) => Promise<void>) {
    let offset: string | undefined;
    let totalFetched = 0;

    try {
      while (true) {
        const batch = await this.getAllLeads(offset);

        for (const record of batch.records) {
          await onRecord(record);
          totalFetched++;
        }

        if (!batch.nextOffset) {
          break;
        }

        offset = batch.nextOffset;
      }

      console.log(`✅ Fetched ${totalFetched} leads from Airtable`);
      return totalFetched;
    } catch (error) {
      console.error('Error streaming leads from Airtable:', error);
      throw error;
    }
  }

  /**
   * Map Airtable record to database lead
   * Maps all fields needed for analytics and reporting
   */
  mapToDatabaseLead(
    record: AirtableRecord,
    clientId: string
  ): Partial<NewLead> {
    const fields = record.fields;

    return {
      airtableRecordId: record.id,
      clientId,
      firstName: fields['First Name'] || 'Unknown',
      lastName: fields['Last Name'] || '',
      email: fields['Email'] || '',
      phone: fields['Phone'],
      company: fields['Company'],
      title: fields['Job Title'],
      icpScore: Number(fields['ICP Score']) || 0,
      status: fields['SMS Status'] || 'New',
      isActive: !fields['Booked'], // Archive if booked
      
      // Campaign & Sequence Tracking (CORRECTED FIELD NAMES)
      campaignName: fields['SMS Campaign ID'] as string | undefined, // FIXED: was 'Campaign Name'
      campaignVariant: fields['SMS Variant'] as string | undefined, // A or B
      campaignBatch: fields['SMS Batch Control'] as string | undefined,
      smsSequencePosition: Number(fields['SMS Sequence Position']) || 0,
      smsSentCount: Number(fields['SMS Sent Count']) || 0,
      smsLastSentAt: fields['SMS Last Sent At'] ? new Date(fields['SMS Last Sent At'] as string) : undefined,
      smsEligible: Boolean(fields['SMS Eligible']),
      
      // Status Fields
      processingStatus: fields['Processing Status'] as string | undefined,
      hrqStatus: fields['HRQ Status'] as string | undefined,
      smsStop: Boolean(fields['SMS Stop']),
      smsStopReason: fields['SMS Stop Reason'] as string | undefined,
      booked: Boolean(fields['Booked']),
      bookedAt: fields['Booked At'] ? new Date(fields['Booked At'] as string) : undefined,
      
      // Click Tracking
      shortLinkId: fields['Short Link ID'] as string | undefined,
      shortLinkUrl: fields['Short Link URL'] as string | undefined,
      clickCount: Number(fields['Click Count']) || 0,
      clickedLink: Boolean(fields['Clicked Link']),
      
      // LinkedIn & Enrichment
      linkedinUrl: fields['Linkedin URL - Person'] as string | undefined,
      companyLinkedin: fields['Company LinkedIn'] as string | undefined,
      enrichmentOutcome: fields['Enrichment Outcome'] as string | undefined,
      enrichmentAttemptedAt: fields['Enrichment Attempted At'] ? new Date(fields['Enrichment Attempted At'] as string) : undefined,
      
      createdAt: new Date(record.createdTime),
    };
  }

  /**
   * Get a single record from Airtable
   */
  async getRecord(recordId: string): Promise<AirtableRecord> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/Leads/${recordId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
      }

      return await response.json() as AirtableRecord;
    } catch (error) {
      console.error('Error fetching record from Airtable:', error);
      throw error;
    }
  }

  /**
   * Update a record in Airtable
   * CRITICAL: This is a WRITE operation - Airtable is single source of truth
   */
  async updateRecord(
    tableName: string,
    recordId: string,
    fields: Partial<AirtableLeadFields>
  ): Promise<AirtableRecord> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${tableName}/${recordId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
      }

      return await response.json() as AirtableRecord;
    } catch (error) {
      console.error('Error updating record in Airtable:', error);
      throw error;
    }
  }

  /**
   * Append a note to the Notes field in Airtable
   * Format: \n\n[{type}] {timestamp} - {userName}:\n{content}
   */
  async appendNote(
    recordId: string,
    content: string,
    type: string,
    userName: string
  ): Promise<AirtableRecord> {
    try {
      // 1. Get current notes
      const record = await this.getRecord(recordId);
      const existingNotes = record.fields['Notes'] || '';

      // 2. Format new note
      const timestamp = new Date().toISOString();
      const formattedNote = `\n\n[${type}] ${timestamp} - ${userName}:\n${content}`;

      // 3. Append to existing notes
      const updatedNotes = existingNotes + formattedNote;

      // 4. Update Airtable
      return await this.updateRecord('Leads', recordId, {
        'Notes': updatedNotes,
      } as Partial<AirtableLeadFields>);
    } catch (error) {
      console.error('Error appending note to Airtable:', error);
      throw error;
    }
  }

  /**
   * Remove lead from campaign by updating status fields
   * This triggers n8n automations to stop messaging
   */
  async removeLeadFromCampaign(
    recordId: string,
    reason: string
  ): Promise<AirtableRecord> {
    try {
      return await this.updateRecord('Leads', recordId, {
        'Processing Status': 'Stopped',
        'SMS Stop': true,
        'SMS Stop Reason': reason,
        'HRQ Status': 'Completed',
      } as Partial<AirtableLeadFields>);
    } catch (error) {
      console.error('Error removing lead from campaign in Airtable:', error);
      throw error;
    }
  }

  /**
   * Update lead's HRQ Status
   * Optionally updates Processing Status if changing to Manual Process
   */
  async updateLeadStatus(
    recordId: string,
    status: 'Qualified' | 'Archive' | 'Review' | 'Manual Process',
    reason?: string
  ): Promise<AirtableRecord> {
    try {
      const updates: Partial<AirtableLeadFields> = {
        'HRQ Status': status,
      } as Partial<AirtableLeadFields>;

      // If setting to Manual Process, also stop automation
      if (status === 'Manual Process') {
        updates['Processing Status'] = 'Stopped';
      }

      // Add reason if provided
      if (reason) {
        updates['HRQ Reason'] = reason;
      }

      return await this.updateRecord('Leads', recordId, updates);
    } catch (error) {
      console.error('Error updating lead status in Airtable:', error);
      throw error;
    }
  }
}

/**
 * Get Airtable client for a specific base ID
 * If baseId not provided, uses AIRTABLE_BASE_ID from env
 */
export function getAirtableClient(baseId?: string): AirtableClient {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const finalBaseId = baseId || process.env.AIRTABLE_BASE_ID;

  if (!apiKey) {
    throw new Error('AIRTABLE_API_KEY must be set in environment variables');
  }

  if (!finalBaseId) {
    throw new Error('AIRTABLE_BASE_ID must be set in environment variables or provided as parameter');
  }

  // Return a new instance for the specified base ID
  // This allows multi-tenant support (different clients = different bases)
  return new AirtableClient(finalBaseId, apiKey);
}

