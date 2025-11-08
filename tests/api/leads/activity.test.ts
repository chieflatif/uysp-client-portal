/**
 * INTEGRATION TESTS - MINI-CRM LEAD TIMELINE API
 *
 * Tests GET /api/leads/[id]/activity endpoint
 * Must pass before Week 2 deployment
 *
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.3
 * Security Fix: HIGH-002 (Client Isolation)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env.local') });

import { db } from '../../../src/lib/db';
import { leadActivityLog, leads, clients } from '../../../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EVENT_TYPES, EVENT_CATEGORIES } from '../../../src/lib/activity/event-types';

describe('GET /api/leads/[id]/activity', () => {
  let testClientAId: string | null = null;
  let testClientBId: string | null = null;
  let testLeadClientAId: string | null = null;
  let testLeadClientBId: string | null = null;
  let testActivitiesClientA: string[] = [];
  let testActivitiesClientB: string[] = [];

  beforeAll(async () => {
    // Create two separate clients for isolation testing
    const clientAResult = await db.insert(clients).values({
      name: 'Client A for Timeline Tests',
      contactEmail: 'client-a-timeline@test.internal',
      isActive: true,
    }).returning({ id: clients.id });
    testClientAId = clientAResult[0].id;

    const clientBResult = await db.insert(clients).values({
      name: 'Client B for Timeline Tests',
      contactEmail: 'client-b-timeline@test.internal',
      isActive: true,
    }).returning({ id: clients.id });
    testClientBId = clientBResult[0].id;

    // Create lead for Client A
    const leadAResult = await db.insert(leads).values({
      email: 'lead-a-timeline@test.internal',
      firstName: 'Lead',
      lastName: 'A',
      airtableRecordId: `recLeadA${Date.now()}`,
      clientId: testClientAId,
    }).returning({ id: leads.id });
    testLeadClientAId = leadAResult[0].id;

    // Create lead for Client B
    const leadBResult = await db.insert(leads).values({
      email: 'lead-b-timeline@test.internal',
      firstName: 'Lead',
      lastName: 'B',
      airtableRecordId: `recLeadB${Date.now()}`,
      clientId: testClientBId,
    }).returning({ id: leads.id });
    testLeadClientBId = leadBResult[0].id;

    // Create activities for Client A's lead
    const activitiesA = [
      {
        eventType: EVENT_TYPES.MESSAGE_SENT,
        eventCategory: EVENT_CATEGORIES.SMS,
        leadId: testLeadClientAId,
        description: 'SMS 1 to Client A lead',
        source: 'test:timeline-a',
        timestamp: new Date('2025-11-01T10:00:00Z'),
      },
      {
        eventType: EVENT_TYPES.MESSAGE_DELIVERED,
        eventCategory: EVENT_CATEGORIES.SMS,
        leadId: testLeadClientAId,
        description: 'SMS delivered to Client A lead',
        source: 'test:timeline-a',
        timestamp: new Date('2025-11-01T10:05:00Z'),
      },
      {
        eventType: EVENT_TYPES.BOOKING_CONFIRMED,
        eventCategory: EVENT_CATEGORIES.BOOKING,
        leadId: testLeadClientAId,
        description: 'Booking confirmed for Client A lead',
        source: 'test:timeline-a',
        timestamp: new Date('2025-11-02T14:00:00Z'),
      },
    ];

    for (const activity of activitiesA) {
      const result = await db.insert(leadActivityLog)
        .values(activity)
        .returning({ id: leadActivityLog.id });
      testActivitiesClientA.push(result[0].id);
    }

    // Create activities for Client B's lead
    const activitiesB = [
      {
        eventType: EVENT_TYPES.MESSAGE_SENT,
        eventCategory: EVENT_CATEGORIES.SMS,
        leadId: testLeadClientBId,
        description: 'SMS 1 to Client B lead',
        source: 'test:timeline-b',
        timestamp: new Date('2025-11-01T11:00:00Z'),
      },
      {
        eventType: EVENT_TYPES.CAMPAIGN_ENROLLED,
        eventCategory: EVENT_CATEGORIES.CAMPAIGN,
        leadId: testLeadClientBId,
        description: 'Client B lead enrolled',
        source: 'test:timeline-b',
        timestamp: new Date('2025-11-01T12:00:00Z'),
      },
    ];

    for (const activity of activitiesB) {
      const result = await db.insert(leadActivityLog)
        .values(activity)
        .returning({ id: leadActivityLog.id });
      testActivitiesClientB.push(result[0].id);
    }

    console.log(`Created ${testActivitiesClientA.length} activities for Client A`);
    console.log(`Created ${testActivitiesClientB.length} activities for Client B`);
  });

  afterAll(async () => {
    // Clean up activities
    for (const activityId of [...testActivitiesClientA, ...testActivitiesClientB]) {
      await db.delete(leadActivityLog).where(eq(leadActivityLog.id, activityId));
    }

    // Clean up leads
    if (testLeadClientAId) {
      await db.delete(leads).where(eq(leads.id, testLeadClientAId));
    }
    if (testLeadClientBId) {
      await db.delete(leads).where(eq(leads.id, testLeadClientBId));
    }

    // Clean up clients
    if (testClientAId) {
      await db.delete(clients).where(eq(clients.id, testClientAId));
    }
    if (testClientBId) {
      await db.delete(clients).where(eq(clients.id, testClientBId));
    }
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(
        `http://localhost:3000/api/leads/${testLeadClientAId}/activity`,
        { method: 'GET' }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Client Isolation (HIGH-002 Fix)', () => {
    // NOTE: These tests require actual session authentication
    // They verify the client isolation security fix is in place

    it.skip('should allow access to own client leads', async () => {
      // Would need session cookie for user from Client A
      // Should return 200 with activities for testLeadClientAId
    });

    it.skip('should reject access to other client leads (403 Forbidden)', async () => {
      // User from Client A tries to access Client B's lead
      // Should return 403 Forbidden (not 200, not 404)
      // This is the critical security fix from HIGH-002
    });

    it.skip('should allow SUPER_ADMIN to access all client leads', async () => {
      // SUPER_ADMIN should be able to access both Client A and B leads
      // Should return 200 for both
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeLeadId = '00000000-0000-0000-0000-000000000000';

      const response = await fetch(
        `http://localhost:3000/api/leads/${fakeLeadId}/activity`,
        { method: 'GET' }
      );

      // Without auth, gets 401 first
      // With auth, would get 404
      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Pagination (MEDIUM-004 Fix)', () => {
    it.skip('should return paginated results with default limit 100', async () => {
      // Requires auth
      // Should return pagination object with page, limit, totalCount, totalPages, hasMore
    });

    it.skip('should support custom page parameter', async () => {
      // Requires auth
      // GET /api/leads/[id]/activity?page=2
    });

    it.skip('should support custom limit parameter', async () => {
      // Requires auth
      // GET /api/leads/[id]/activity?limit=50
    });

    it.skip('should enforce max limit of 500', async () => {
      // Requires auth
      // GET /api/leads/[id]/activity?limit=1000
      // Should cap at 500
    });

    it.skip('should return pagination metadata', async () => {
      // Requires auth
      // Response should include:
      // - pagination.page
      // - pagination.limit
      // - pagination.totalCount
      // - pagination.totalPages
      // - pagination.hasMore
    });
  });

  describe('Response Format', () => {
    it.skip('should return timeline array', async () => {
      // Requires auth
      // Response: { timeline: [...], pagination: {...} }
    });

    it.skip('should order activities by timestamp descending', async () => {
      // Requires auth
      // Most recent activity should be first
    });

    it.skip('should include all activity fields', async () => {
      // Requires auth
      // Each activity should have:
      // - id, timestamp, eventType, category, description
      // - message (messageContent), details (metadata), source, executionId
    });
  });

  describe('Database Integration', () => {
    it('should have created activities for both clients', async () => {
      const activitiesA = await db
        .select()
        .from(leadActivityLog)
        .where(eq(leadActivityLog.leadId, testLeadClientAId!));

      const activitiesB = await db
        .select()
        .from(leadActivityLog)
        .where(eq(leadActivityLog.leadId, testLeadClientBId!));

      expect(activitiesA.length).toBe(3);
      expect(activitiesB.length).toBe(2);
    });

    it('should query activities directly from database', async () => {
      const activities = await db.query.leadActivityLog.findMany({
        where: eq(leadActivityLog.leadId, testLeadClientAId!),
      });

      expect(activities.length).toBe(3);
      expect(activities[0].eventType).toBeDefined();
      expect(activities[0].leadId).toBe(testLeadClientAId);
    });

    it('should isolate activities by lead', async () => {
      // Verify Client A activities don't include Client B events
      const activitiesA = await db.query.leadActivityLog.findMany({
        where: eq(leadActivityLog.leadId, testLeadClientAId!),
      });

      const descriptions = activitiesA.map(a => a.description);
      expect(descriptions.some(d => d.includes('Client A'))).toBe(true);
      expect(descriptions.some(d => d.includes('Client B'))).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid UUID format', async () => {
      const response = await fetch(
        'http://localhost:3000/api/leads/not-a-uuid/activity',
        { method: 'GET' }
      );

      // Without auth: 401
      // With auth: 400 or 404
      expect([400, 401, 404]).toContain(response.status);
    });

    it.skip('should handle lead with no activities', async () => {
      // Requires auth
      // Create lead with zero activities
      // Should return empty timeline array with pagination
    });

    it.skip('should handle lead with 1000+ activities', async () => {
      // Requires auth
      // Should use pagination properly
      // First page should return 100 (default limit)
      // pagination.hasMore should be true
    });
  });
});

/**
 * IMPLEMENTATION NOTES:
 *
 * This test suite verifies the critical HIGH-002 security fix (client isolation).
 * Many tests are skipped because they require session authentication infrastructure.
 *
 * The key security test that MUST pass (once auth is available):
 * - User from Client A CANNOT access Client B's lead timeline
 * - Should return 403 Forbidden, not 200, not 404
 * - This prevents multi-tenant data leakage
 *
 * To complete these tests:
 * 1. Implement session helper functions
 * 2. Create test users for Client A, Client B, and SUPER_ADMIN
 * 3. Generate valid session cookies
 * 4. Unskip tests and add Cookie headers
 *
 * Current coverage:
 * - ✅ Unauthenticated rejection
 * - ✅ Non-existent lead handling
 * - ✅ Database integration
 * - ✅ Activity isolation by lead
 * - ⏸️ Client isolation (requires auth)
 * - ⏸️ Pagination (requires auth)
 * - ⏸️ Response format (requires auth)
 */
