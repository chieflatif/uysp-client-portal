/**
 * INTEGRATION TESTS - MINI-CRM ACTIVITY LOGGING API
 *
 * Tests POST /api/internal/log-activity endpoint
 * Must pass before Week 2 deployment
 *
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.3
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env.local') });

import { db } from '../../src/lib/db';
import { leadActivityLog, leads, clients } from '../../src/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { EVENT_TYPES, EVENT_CATEGORIES } from '../../src/lib/activity/event-types';

describe('POST /api/internal/log-activity', () => {
  const TEST_LEAD = {
    email: 'test-activity-log@test.internal',
    firstName: 'Activity',
    lastName: 'Test',
    airtableRecordId: `recTestActivity${Date.now()}`,
  };

  let testLeadId: string | null = null;
  let testClientId: string | null = null;
  let testApiKey: string;

  beforeAll(async () => {
    // Verify INTERNAL_API_KEY is set
    testApiKey = process.env.INTERNAL_API_KEY || '';
    expect(testApiKey).toBeDefined();
    expect(testApiKey.length).toBeGreaterThan(0);

    // Create test client
    const clientResult = await db.insert(clients).values({
      name: 'Test Client for Activity Logging',
      contactEmail: 'test-client@test.internal',
      isActive: true,
    }).returning({ id: clients.id });
    testClientId = clientResult[0].id;

    // Create test lead
    const leadResult = await db.insert(leads).values({
      email: TEST_LEAD.email,
      firstName: TEST_LEAD.firstName,
      lastName: TEST_LEAD.lastName,
      airtableRecordId: TEST_LEAD.airtableRecordId,
      clientId: testClientId,
    }).returning({ id: leads.id });
    testLeadId = leadResult[0].id;

    console.log(`Created test lead: ${testLeadId}`);
  });

  afterAll(async () => {
    // Clean up: Delete test activities
    if (testLeadId) {
      await db.delete(leadActivityLog).where(eq(leadActivityLog.leadId, testLeadId));
    }

    // Clean up: Delete test lead
    if (testLeadId) {
      await db.delete(leads).where(eq(leads.id, testLeadId));
      console.log(`Deleted test lead: ${testLeadId}`);
    }

    // Clean up: Delete test client
    if (testClientId) {
      await db.delete(clients).where(eq(clients.id, testClientId));
      console.log(`Deleted test client: ${testClientId}`);
    }
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_SENT,
          eventCategory: EVENT_CATEGORIES.SMS,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Test event',
          source: 'test',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'invalid-key-12345',
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_SENT,
          eventCategory: EVENT_CATEGORIES.SMS,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Test event',
          source: 'test',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid API key', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_SENT,
          eventCategory: EVENT_CATEGORIES.SMS,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Test event with valid key',
          source: 'test:auth',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.activityId).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should reject requests missing required fields', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_SENT,
          // Missing eventCategory, leadAirtableId, description, source
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
      expect(data.required).toContain('eventCategory');
      expect(data.required).toContain('leadAirtableId');
      expect(data.required).toContain('description');
      expect(data.required).toContain('source');
    });

    it('should reject invalid eventType', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: 'INVALID_EVENT_TYPE',
          eventCategory: EVENT_CATEGORIES.SMS,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Test with invalid event type',
          source: 'test:validation',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid eventType');
      expect(data.provided).toBe('INVALID_EVENT_TYPE');
      expect(data.validTypes).toBeDefined();
      expect(Array.isArray(data.validTypes)).toBe(true);
    });

    it('should reject invalid eventCategory', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_SENT,
          eventCategory: 'INVALID_CATEGORY',
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Test with invalid category',
          source: 'test:validation',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid eventCategory');
      expect(data.provided).toBe('INVALID_CATEGORY');
      expect(data.validCategories).toBeDefined();
      expect(Array.isArray(data.validCategories)).toBe(true);
    });
  });

  describe('Activity Logging', () => {
    it('should log SMS event successfully', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_SENT,
          eventCategory: EVENT_CATEGORIES.SMS,
          leadId: testLeadId,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          clientId: testClientId,
          description: 'SMS sent to test lead',
          messageContent: 'Hey test lead, this is a test message',
          metadata: {
            campaign_id: 'test-campaign-123',
            phone: '5551234567',
          },
          source: 'test:sms-event',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.activityId).toBeDefined();
      expect(data.leadId).toBe(testLeadId);

      // Verify activity was actually stored in database
      const activity = await db.query.leadActivityLog.findFirst({
        where: eq(leadActivityLog.id, data.activityId),
      });

      expect(activity).toBeDefined();
      expect(activity?.eventType).toBe(EVENT_TYPES.MESSAGE_SENT);
      expect(activity?.eventCategory).toBe(EVENT_CATEGORIES.SMS);
      expect(activity?.leadId).toBe(testLeadId);
      expect(activity?.description).toBe('SMS sent to test lead');
      expect(activity?.messageContent).toBe('Hey test lead, this is a test message');
      expect(activity?.metadata).toEqual({
        campaign_id: 'test-campaign-123',
        phone: '5551234567',
      });
    });

    it('should log campaign enrollment event', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.CAMPAIGN_ENROLLED,
          eventCategory: EVENT_CATEGORIES.CAMPAIGN,
          leadId: testLeadId,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Enrolled in test campaign',
          metadata: {
            campaign_id: 'test-campaign-456',
            campaign_name: 'Test Nurture Sequence',
          },
          source: 'test:campaign-event',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.activityId).toBeDefined();
    });

    it('should log booking confirmed event', async () => {
      const bookingTime = new Date('2025-11-15T14:00:00Z');

      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.BOOKING_CONFIRMED,
          eventCategory: EVENT_CATEGORIES.BOOKING,
          leadId: testLeadId,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Booking confirmed for 11/15/2025',
          metadata: {
            booking_time: bookingTime.toISOString(),
            calendly_event_uri: 'https://calendly.com/test-event',
          },
          source: 'n8n:calendly-webhook',
          timestamp: bookingTime.toISOString(),
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should log activity with only Airtable ID (no PostgreSQL lead yet)', async () => {
      const unknownAirtableId = `recUnknown${Date.now()}`;

      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_SENT,
          eventCategory: EVENT_CATEGORIES.SMS,
          leadAirtableId: unknownAirtableId,
          description: 'SMS sent to lead not yet synced to PostgreSQL',
          source: 'test:airtable-only',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.leadId).toBeNull(); // Lead not found in PostgreSQL

      // Clean up
      const activity = await db.query.leadActivityLog.findFirst({
        where: eq(leadActivityLog.id, data.activityId),
      });
      if (activity) {
        await db.delete(leadActivityLog).where(eq(leadActivityLog.id, data.activityId));
      }
    });
  });

  describe('lastActivityAt Update', () => {
    it('should update lead lastActivityAt timestamp', async () => {
      // Get current lastActivityAt
      const leadBefore = await db.query.leads.findFirst({
        where: eq(leads.id, testLeadId!),
        columns: { lastActivityAt: true },
      });

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Log new activity
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.NOTE_ADDED,
          eventCategory: EVENT_CATEGORIES.MANUAL,
          leadId: testLeadId,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Test note added',
          messageContent: 'This is a test note',
          source: 'test:last-activity',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify lastActivityAt was updated
      const leadAfter = await db.query.leads.findFirst({
        where: eq(leads.id, testLeadId!),
        columns: { lastActivityAt: true },
      });

      if (leadBefore?.lastActivityAt && leadAfter?.lastActivityAt) {
        expect(new Date(leadAfter.lastActivityAt).getTime()).toBeGreaterThan(
          new Date(leadBefore.lastActivityAt).getTime()
        );
      }
    });

    it('should use same timestamp for activity and lastActivityAt (no race condition)', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          eventType: EVENT_TYPES.MESSAGE_DELIVERED,
          eventCategory: EVENT_CATEGORIES.SMS,
          leadId: testLeadId,
          leadAirtableId: TEST_LEAD.airtableRecordId,
          description: 'Message delivered',
          source: 'test:race-condition',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Get the activity timestamp
      const activity = await db.query.leadActivityLog.findFirst({
        where: eq(leadActivityLog.id, data.activityId),
        columns: { timestamp: true },
      });

      // Get the lead's lastActivityAt
      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, testLeadId!),
        columns: { lastActivityAt: true },
      });

      expect(activity?.timestamp).toBeDefined();
      expect(lead?.lastActivityAt).toBeDefined();

      // Timestamps should match (no race condition)
      if (activity?.timestamp && lead?.lastActivityAt) {
        expect(new Date(activity.timestamp).getTime()).toBe(
          new Date(lead.lastActivityAt).getTime()
        );
      }
    });
  });

  describe('All Event Types Coverage', () => {
    const eventTypesTests = [
      { type: EVENT_TYPES.MESSAGE_FAILED, category: EVENT_CATEGORIES.SMS, desc: 'SMS failed' },
      { type: EVENT_TYPES.INBOUND_REPLY, category: EVENT_CATEGORIES.SMS, desc: 'Inbound SMS reply' },
      { type: EVENT_TYPES.LINK_CLICKED, category: EVENT_CATEGORIES.SMS, desc: 'Link clicked in SMS' },
      { type: EVENT_TYPES.OPT_OUT, category: EVENT_CATEGORIES.SMS, desc: 'Lead opted out' },
      { type: EVENT_TYPES.CAMPAIGN_REMOVED, category: EVENT_CATEGORIES.CAMPAIGN, desc: 'Removed from campaign' },
      { type: EVENT_TYPES.CAMPAIGN_COMPLETED, category: EVENT_CATEGORIES.CAMPAIGN, desc: 'Completed campaign' },
      { type: EVENT_TYPES.BOOKING_CANCELLED, category: EVENT_CATEGORIES.BOOKING, desc: 'Booking cancelled' },
      { type: EVENT_TYPES.BOOKING_RESCHEDULED, category: EVENT_CATEGORIES.BOOKING, desc: 'Booking rescheduled' },
      { type: EVENT_TYPES.STATUS_CHANGED, category: EVENT_CATEGORIES.MANUAL, desc: 'Status changed' },
      { type: EVENT_TYPES.LEAD_CLAIMED, category: EVENT_CATEGORIES.MANUAL, desc: 'Lead claimed' },
      { type: EVENT_TYPES.ENRICHMENT_COMPLETED, category: EVENT_CATEGORIES.SYSTEM, desc: 'Enrichment completed' },
      { type: EVENT_TYPES.ICP_SCORE_UPDATED, category: EVENT_CATEGORIES.SYSTEM, desc: 'ICP score updated' },
    ];

    eventTypesTests.forEach(({ type, category, desc }) => {
      it(`should log ${type} event`, async () => {
        const response = await fetch('http://localhost:3000/api/internal/log-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': testApiKey,
          },
          body: JSON.stringify({
            eventType: type,
            eventCategory: category,
            leadId: testLeadId,
            leadAirtableId: TEST_LEAD.airtableRecordId,
            description: desc,
            source: `test:event-type-${type}`,
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.activityId).toBeDefined();
      });
    });
  });

  describe('GET Method Not Allowed', () => {
    it('should reject GET requests', async () => {
      const response = await fetch('http://localhost:3000/api/internal/log-activity', {
        method: 'GET',
        headers: {
          'x-api-key': testApiKey,
        },
      });

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.error).toBe('Method not allowed');
    });
  });
});
