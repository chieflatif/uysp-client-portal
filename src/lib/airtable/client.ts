import type { 
  NewLead,
  NewClientProjectTask,
  NewClientProjectBlocker,
  NewClientProjectStatus,
  NewCampaign
} from '../db/schema';

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

  // Custom Campaigns fields (Phase B)
  'Kajabi Tags'?: string; // Comma-separated string of tags
  'Engagement - Level'?: string; // Green/Yellow/Red
  'Engagement - Total Score'?: number;

  // Notes field
  'Notes'?: string;

  // Claim tracking fields (for bi-directional sync)
  'Claimed By'?: string;
  'Claimed At'?: string;

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

// Retry and rate limit configuration constants
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  BASE_URL: 'https://api.airtable.com/v0',
  PAGE_DELAY_MS: 200, // 200ms delay = 5 requests/second (Airtable rate limit)
} as const;

/**
 * Parse timestamp with validation to handle invalid dates gracefully
 * Returns undefined instead of crashing on invalid date strings
 * CRITICAL FIX: Prevents sync failures from malformed Airtable dates
 */
function parseTimestamp(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    // Check if date is valid (not NaN)
    if (isNaN(date.getTime())) {
      console.warn(`⚠️ Invalid date value: "${value}" - skipping`);
      return undefined;
    }
    // Normalize to UTC for consistency
    return new Date(date.toISOString());
  } catch (error) {
    console.warn(`⚠️ Error parsing date "${value}":`, error);
    return undefined;
  }
}

/**
 * Parse Kajabi Tags from comma-separated string to array
 * CUSTOM CAMPAIGNS: Handles tags from Airtable "Kajabi Tags" field
 * Example: "Tag 1, Tag 2, Tag 3" → ["Tag 1", "Tag 2", "Tag 3"]
 */
function parseKajabiTags(value: string | undefined): string[] | undefined {
  if (!value || typeof value !== 'string') return undefined;

  // Split by comma, trim whitespace, filter out empty strings
  const tags = value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  return tags.length > 0 ? tags : undefined;
}

/**
 * Map engagement level from Airtable color coding to High/Medium/Low
 * CUSTOM CAMPAIGNS: Maps Airtable "Engagement - Level" to database format
 * Green → High, Yellow → Medium, Red → Low
 */
function mapEngagementLevel(value: string | undefined): string | undefined {
  if (!value || typeof value !== 'string') return undefined;

  const normalized = value.toLowerCase().trim();

  switch (normalized) {
    case 'green':
      return 'High';
    case 'yellow':
      return 'Medium';
    case 'red':
      return 'Low';
    default:
      // If already in correct format, return as-is
      if (['high', 'medium', 'low'].includes(normalized)) {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      }
      console.warn(`⚠️ Unknown engagement level: "${value}" - skipping`);
      return undefined;
  }
}

export class AirtableClient {
  private baseId: string;
  private apiKey: string;
  private baseUrl = RETRY_CONFIG.BASE_URL;
  private maxRetries = RETRY_CONFIG.MAX_RETRIES;
  private retryDelay = RETRY_CONFIG.INITIAL_DELAY_MS;

  constructor(baseId: string, apiKey: string) {
    this.baseId = baseId;
    this.apiKey = apiKey;
  }

  /**
   * Retry wrapper with exponential backoff
   * Handles Airtable rate limits and transient failures
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // FIXED: Check HTTP status code directly instead of string matching
        // Don't retry on 4xx client errors (except 429 rate limit)
        const statusCode = error.status || error.statusCode || 0;
        if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          console.error(`❌ ${operationName} failed with client error ${statusCode} (won't retry):`, error.message);
          throw error;
        }

        // Log retry attempt
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${this.maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ ${operationName} failed after ${this.maxRetries} attempts`);
    throw lastError || new Error(`${operationName} failed after ${this.maxRetries} attempts`);
  }

  /**
   * Fetch all leads from Airtable with pagination
   */
  async getAllLeads(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    return this.withRetry(async () => {
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
        const err: any = new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
        err.status = response.status; // Attach status code for retry logic
        throw err;
      }

      const data = (await response.json()) as AirtableListResponse;

      return {
        records: data.records,
        nextOffset: data.offset,
      };
    }, 'getAllLeads');
  }

  /**
   * Get leads modified since a specific timestamp
   * Uses Airtable filterByFormula to query Last Modified Time field
   *
   * CRITICAL: Required for bi-directional reconciliation (Stage 1)
   *
   * @param cutoffTime - Only return records modified after this time
   * @returns Array of AirtableRecord objects modified since cutoffTime
   */
  async getLeadsModifiedSince(cutoffTime: Date): Promise<AirtableRecord[]> {
    return this.withRetry(async () => {
      const cutoffISO = cutoffTime.toISOString();
      const formula = `IS_AFTER({Last Modified Time}, '${cutoffISO}')`;

      const allRecords: AirtableRecord[] = [];
      let offset: string | undefined;

      // Fetch all pages
      while (true) {
        const params = new URLSearchParams({
          pageSize: '100',
          filterByFormula: formula,
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
          const err: any = new Error(
            `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
          );
          err.status = response.status;
          throw err;
        }

        const data = (await response.json()) as AirtableListResponse;
        allRecords.push(...data.records);

        if (!data.offset) {
          break; // No more pages
        }

        offset = data.offset;

        // Rate limiting: 200ms delay = 5 requests/second
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return allRecords;
    }, 'getLeadsModifiedSince');
  }

  /**
   * Fetch all records from SMS_Audit table
   * FIXED: Now uses withRetry wrapper for consistent error handling
   */
  async getAllSmsAudit(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    return this.withRetry(async () => {
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
        const err: any = new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
        err.status = response.status; // Attach status code for retry logic
        throw err;
      }

      const data = (await response.json()) as AirtableListResponse;

      return {
        records: data.records,
        nextOffset: data.offset,
      };
    }, 'getAllSmsAudit');
  }

  /**
   * Fetch all records from SMS_Templates table
   * PART B.1: Required for calculating enrolled_message_count
   */
  async getAllSmsTemplates(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    return this.withRetry(async () => {
      const params = new URLSearchParams({
        pageSize: '100',
      });

      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/SMS_Templates?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        const err: any = new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
        err.status = response.status; // Attach status code for retry logic
        throw err;
      }

      const data = (await response.json()) as AirtableListResponse;

      return {
        records: data.records,
        nextOffset: data.offset,
      };
    }, 'getAllSmsTemplates');
  }

  /**
   * Fetch all project tasks from Airtable
   */
  async getAllProjectTasks(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    return this.fetchFromTable('Tasks', offset);
  }

  /**
   * Fetch all project blockers from Airtable
   */
  async getAllProjectBlockers(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    return this.fetchFromTable('Blockers', offset);
  }

  /**
   * Fetch all project status records from Airtable
   */
  async getAllProjectStatus(offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    return this.fetchFromTable('Project_Status', offset);
  }

  /**
   * Generic method to fetch from any table
   */
  private async fetchFromTable(tableName: string, offset?: string): Promise<{
    records: AirtableRecord[];
    nextOffset?: string;
  }> {
    return this.withRetry(async () => {
      const params = new URLSearchParams({
        pageSize: '100',
      });

      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${tableName}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        const err: any = new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
        err.status = response.status; // Attach status code for retry logic
        throw err;
      }

      const data = (await response.json()) as AirtableListResponse;

      return {
        records: data.records,
        nextOffset: data.offset,
      };
    }, `fetchFromTable(${tableName})`);
  }

  /**
   * Get all leads with pagination handling
   * FIXED: Added rate limiting delay to respect Airtable 5 req/sec limit
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

        // RATE LIMITING: Add delay between pages to respect Airtable rate limits
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.PAGE_DELAY_MS));
      }

      console.log(`✅ Fetched ${totalFetched} leads from Airtable`);
      return totalFetched;
    } catch (error) {
      console.error('Error streaming leads from Airtable:', error);
      throw error;
    }
  }

  /**
   * Stream all project tasks with pagination handling
   */
  async streamAllProjectTasks(onRecord: (record: AirtableRecord) => Promise<void>) {
    return this.streamFromTable('Tasks', onRecord);
  }

  /**
   * Stream all project blockers with pagination handling
   */
  async streamAllProjectBlockers(onRecord: (record: AirtableRecord) => Promise<void>) {
    return this.streamFromTable('Blockers', onRecord);
  }

  /**
   * Stream all project status records with pagination handling
   */
  async streamAllProjectStatus(onRecord: (record: AirtableRecord) => Promise<void>) {
    return this.streamFromTable('Project_Status', onRecord);
  }

  /**
   * Stream all campaigns with pagination handling (Phase A)
   */
  async streamAllCampaigns(onRecord: (record: AirtableRecord) => Promise<void>) {
    return this.streamFromTable('Campaigns', onRecord);
  }

  /**
   * Stream all SMS templates with pagination handling
   * PART B.1: Required for building campaign message count lookup map
   */
  async streamAllSmsTemplates(onRecord: (record: AirtableRecord) => Promise<void>) {
    return this.streamFromTable('SMS_Templates', onRecord);
  }

  /**
   * Generic streaming method for any table
   * FIXED: Added rate limiting delay to respect Airtable 5 req/sec limit
   */
  private async streamFromTable(
    tableName: string,
    onRecord: (record: AirtableRecord) => Promise<void>
  ) {
    let offset: string | undefined;
    let totalFetched = 0;

    try {
      while (true) {
        const batch = await this.fetchFromTable(tableName, offset);

        for (const record of batch.records) {
          await onRecord(record);
          totalFetched++;
        }

        if (!batch.nextOffset) {
          break;
        }

        offset = batch.nextOffset;

        // RATE LIMITING: Add delay between pages to respect Airtable rate limits
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.PAGE_DELAY_MS));
      }

      console.log(`✅ Fetched ${totalFetched} ${tableName} from Airtable`);
      return totalFetched;
    } catch (error) {
      console.error(`Error streaming ${tableName} from Airtable:`, error);
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
      isActive: true, // CRITICAL FIX: isActive only for deletion tracking, NOT booking status
      
      // Campaign & Sequence Tracking (CORRECTED FIELD NAMES)
      formId: fields['Form ID'] as string | undefined, // CRITICAL FIX: Extract Form ID for campaign matching
      campaignName: fields['SMS Campaign ID'] as string | undefined,
      // Lead Source: Direct copy from Campaign (CORRECTED) - actual campaign name
      leadSource: (() => {
        const corrected = fields['Campaign (CORRECTED)'];
        const original = fields['Campaign'];
        return ((corrected || original) as string | undefined) || null;
      })(),
      campaignVariant: (fields['SMS Variant'] as string | undefined) || null,
      campaignBatch: (fields['SMS Batch Control'] as string | undefined) || null,
      smsSequencePosition: Number(fields['SMS Sequence Position']) || 0,
      smsSentCount: Number(fields['SMS Sent Count']) || 0,
      smsLastSentAt: parseTimestamp(fields['SMS Last Sent At'] as string | undefined), // FIXED: Use validated parser
      smsEligible: Boolean(fields['SMS Eligible']),

      // Status Fields
      processingStatus: fields['Processing Status'] as string | undefined,
      hrqStatus: fields['HRQ Status'] as string | undefined,
      smsStop: Boolean(fields['SMS Stop']),
      smsStopReason: fields['SMS Stop Reason'] as string | undefined,
      booked: Boolean(fields['Booked']),
      bookedAt: parseTimestamp(fields['Booked At'] as string | undefined), // FIXED: Use validated parser
      
      // Click Tracking
      shortLinkId: fields['Short Link ID'] as string | undefined,
      shortLinkUrl: fields['Short Link URL'] as string | undefined,
      clickCount: Number(fields['Click Count']) || 0,
      clickedLink: Boolean(fields['Clicked Link']),
      firstClickedAt: parseTimestamp(fields['First Clicked At'] as string | undefined), // FIXED: Use validated parser

      // LinkedIn & Enrichment
      linkedinUrl: fields['Linkedin URL - Person'] as string | undefined,
      companyLinkedin: fields['Company LinkedIn'] as string | undefined,
      enrichmentOutcome: fields['Enrichment Outcome'] as string | undefined,
      enrichmentAttemptedAt: parseTimestamp(fields['Enrichment Attempted At'] as string | undefined), // FIXED: Use validated parser

      // Custom Campaigns fields (Phase B)
      kajabiTags: parseKajabiTags(fields['Kajabi Tags'] as string | undefined),
      engagementLevel: mapEngagementLevel(fields['Engagement - Level'] as string | undefined),

      createdAt: new Date(record.createdTime),
    };
  }

  /**
   * Map Airtable campaign record to database format (Phase A)
   * PART B.1: Now accepts smsTemplateCountMap to calculate enrolled_message_count
   *
   * @param record - Airtable campaign record
   * @param clientId - Client UUID
   * @param smsTemplateCountMap - Map of Campaign Tag → message count from SMS_Templates table
   */
  mapToDatabaseCampaign(
    record: AirtableRecord,
    clientId: string,
    smsTemplateCountMap?: Map<string, number>
  ): Partial<NewCampaign> {
    const fields = record.fields;
    const campaignName = (fields['Campaign Name'] as string) || '';

    // PART B.1: Calculate enrolled_message_count from SMS_Templates table
    // Count SMS_Templates records where Campaign Tag matches Campaign Name
    let messageCount = 0;
    if (smsTemplateCountMap && campaignName) {
      messageCount = smsTemplateCountMap.get(campaignName) || 0;
    }

    // Build messages array if we have a count (for backward compatibility)
    // Each entry is a placeholder since we don't have the actual message content here
    const messages = messageCount > 0
      ? Array(messageCount).fill({ placeholder: true })
      : null;

    return {
      clientId,
      airtableRecordId: record.id,
      name: campaignName,
      campaignType: (fields['Campaign Type'] as string) || 'Standard',
      formId: (fields['Form ID'] as string) || undefined,
      webinarDatetime: parseTimestamp(fields['Webinar Datetime'] as string | undefined), // FIXED: Use validated parser
      zoomLink: (fields['Zoom Link'] as string) || undefined,
      resourceLink: (fields['Resource Link'] as string) || undefined,
      resourceName: (fields['Resource Name'] as string) || undefined,
      isPaused: !(fields['Active'] as boolean), // Active checkbox → isPaused inverted
      autoDiscovered: (fields['Auto Discovered'] as boolean) || false,
      messagesSent: Number(fields['Messages Sent']) || 0,
      // PART B.1: Store messages array with correct count from SMS_Templates
      messages: messages as any,
      // FIXED: Handle schema inconsistency where field name may have trailing space
      // This indicates a naming error in Airtable that should be corrected
      totalLeads: (() => {
        const withSpace = fields['Total Leads '];
        const withoutSpace = fields['Total Leads'];
        // Warn if both fields exist with different values (indicates data quality issue)
        if (withSpace && withoutSpace && withSpace !== withoutSpace) {
          console.warn(`⚠️ Campaign ${record.id}: Both 'Total Leads ' (with space) and 'Total Leads' exist with different values. Using 'Total Leads ' (with space).`);
        }
        return Number(withSpace || withoutSpace) || 0;
      })(),
      createdAt: new Date(record.createdTime),
      updatedAt: new Date(),
    };
  }

  /**
   * Map Airtable task record to database format
   */
  mapToDatabaseTask(
    record: AirtableRecord,
    clientId: string
  ): NewClientProjectTask {
    const fields = record.fields;

    return {
      id: record.id,
      clientId,
      airtableRecordId: record.id,
      task: (fields['Task'] as string) || '',
      status: (fields['Status'] as string) || 'Pending',
      priority: (fields['Priority'] as string) || 'Medium',
      taskType: (fields['Type'] as string) || 'Task', // FIXED: Added taskType mapping from Airtable 'Type' field
      owner: fields['Owner'] as string | undefined,
      dueDate: parseTimestamp(fields['Due Date'] as string | undefined), // FIXED: Use validated parser
      notes: fields['Notes'] as string | undefined,
      dependencies: fields['Dependencies'] as string | undefined,
      createdAt: new Date(record.createdTime),
      updatedAt: new Date(),
    };
  }

  /**
   * Map Airtable blocker record to database format
   */
  mapToDatabaseBlocker(
    record: AirtableRecord,
    clientId: string
  ): NewClientProjectBlocker {
    const fields = record.fields;

    return {
      id: record.id,
      clientId,
      airtableRecordId: record.id,
      blocker: (fields['Blocker'] as string) || '',
      severity: (fields['Severity'] as string) || 'Medium',
      actionToResolve: fields['Action to Resolve'] as string | undefined,
      status: (fields['Status'] as string) || 'Active',
      createdAt: new Date(record.createdTime),
      resolvedAt: parseTimestamp(fields['Resolved At'] as string | undefined), // FIXED: Use validated parser
    };
  }

  /**
   * Map Airtable project status record to database format
   */
  mapToDatabaseProjectStatus(
    record: AirtableRecord,
    clientId: string
  ): NewClientProjectStatus {
    const fields = record.fields;

    return {
      id: record.id,
      clientId,
      airtableRecordId: record.id,
      metric: (fields['Metric'] as string) || '',
      value: (fields['Value'] as string) || '',
      category: (fields['Category'] as string) || 'General',
      displayOrder: Number(fields['Display Order']) || 0,
      updatedAt: new Date(),
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
        const err: any = new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
        err.status = response.status; // Attach status code for retry logic
        throw err;
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
        const err: any = new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
        err.status = response.status; // Attach status code for retry logic
        throw err;
      }

      return await response.json() as AirtableRecord;
    } catch (error) {
      console.error('Error updating record in Airtable:', error);
      throw error;
    }
  }

  /**
   * Create a new record in Airtable
   */
  async createRecord(
    tableName: string,
    fields: Partial<AirtableLeadFields>
  ): Promise<AirtableRecord> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${tableName}`,
        {
          method: 'POST',
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
        const err: any = new Error(
          `Airtable API error: ${response.status} - ${JSON.stringify(error)}`
        );
        err.status = response.status; // Attach status code for retry logic
        throw err;
      }

      return await response.json() as AirtableRecord;
    } catch (error) {
      console.error('Error creating record in Airtable:', error);
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

  /**
   * Delete a record from Airtable
   * Used when deleting tasks/blockers from portal
   */
  async deleteRecord(tableName: string, recordId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${tableName}/${recordId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`, // FIXED: Use instance apiKey instead of env var
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Airtable delete failed: ${response.status} ${JSON.stringify(errorData)}`);
      }

      console.log(`✅ Deleted record ${recordId} from ${tableName}`);
    } catch (error) {
      console.error(`Error deleting record ${recordId} from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest project call summary
   * Fetches the record where "Is Latest" checkbox is true
   */
  async getLatestCallSummary() {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${this.baseId}/Project_Call_Summaries?filterByFormula={Is Latest}=TRUE()&maxRecords=1`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airtable API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();

      if (!data.records || data.records.length === 0) {
        return null; // No latest call summary found
      }

      const record = data.records[0];
      return {
        id: record.id,
        callDate: record.fields['Call Date'] || null,
        executiveSummary: record.fields['Executive Summary'] || '',
        topPriorities: record.fields['Top Priorities'] || '',
        keyDecisions: record.fields['Key Decisions'] || '',
        blockersDiscussed: record.fields['Blockers Discussed'] || '',
        nextSteps: record.fields['Next Steps'] || '',
        attendees: record.fields['Attendees'] || '',
        callRecordingUrl: record.fields['Call Recording URL'] || null,
        transcript: record.fields['Transcript'] || null,
        isLatest: record.fields['Is Latest'] || false,
      };
    } catch (error) {
      console.error('Error fetching latest call summary from Airtable:', error);
      throw error;
    }
  }
}

/**
 * Get Airtable client for a specific base ID
 * If baseId not provided, uses AIRTABLE_BASE_ID from env
 *
 * FIXED: Validates environment variables on each invocation (not just at module load)
 * This ensures proper error handling in serverless environments where env vars can change
 */
export function getAirtableClient(baseId?: string, apiKeyOverride?: string): AirtableClient {
  // FIXED: Re-read from process.env on each invocation for serverless compatibility
  const apiKey = apiKeyOverride || process.env.AIRTABLE_API_KEY;
  const finalBaseId = baseId || process.env.AIRTABLE_BASE_ID;

  // FIXED: Provide more detailed error messages for debugging
  if (!apiKey) {
    throw new Error(
      'AIRTABLE_API_KEY must be set in environment variables. ' +
      'This is required for Airtable API authentication. ' +
      'Please check your .env file or deployment configuration.'
    );
  }

  if (!finalBaseId) {
    throw new Error(
      'AIRTABLE_BASE_ID must be set in environment variables or provided as parameter. ' +
      'Either pass baseId to getAirtableClient() or set AIRTABLE_BASE_ID in your environment. ' +
      'You can find your base ID in the Airtable API documentation for your base.'
    );
  }

  // FIXED: Validate base ID format (should start with 'app')
  if (!finalBaseId.startsWith('app')) {
    throw new Error(
      `Invalid Airtable Base ID format: "${finalBaseId}". ` +
      'Base IDs should start with "app" (e.g., appXXXXXXXXXXXXXX). ' +
      'Please check your configuration.'
    );
  }

  // Return a new instance for the specified base ID
  // This allows multi-tenant support (different clients = different bases)
  return new AirtableClient(finalBaseId, apiKey);
}

