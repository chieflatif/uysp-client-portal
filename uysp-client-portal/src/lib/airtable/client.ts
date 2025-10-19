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
  'Booked'?: boolean;
  'Location Country'?: string;
  'Company Type'?: string;
  'Record ID'?: string;
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
      createdAt: new Date(record.createdTime),
    };
  }
}

/**
 * Singleton instance
 */
let instance: AirtableClient | null = null;

export function getAirtableClient(): AirtableClient {
  if (!instance) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
    }

    instance = new AirtableClient(baseId, apiKey);
  }

  return instance;
}
