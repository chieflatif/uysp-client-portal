/**
 * INTEGRATION TESTS - MINI-CRM LEAD TIMELINE API
 *
 * Tests GET /api/leads/[id]/activity endpoint
 * Refactored to call the route handler directly and mock auth.
 *
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.3
 * Security Fix: HIGH-002 (Client Isolation)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env.local') });

import { db } from '../../../src/lib/db';
import { leadActivityLog, leads, clients, users } from '../../../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EVENT_TYPES, EVENT_CATEGORIES } from '../../../src/lib/activity/event-types';
import { createTestClient, createTestLead, createTestUser } from '../../helpers/factories';
import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/leads/[id]/activity/route';
import { auth } from '../../../src/lib/auth';
import bcrypt from 'bcryptjs';

// Mock auth
jest.mock('../../../src/lib/auth', () => ({
  auth: jest.fn(),
}));

describe('GET /api/leads/[id]/activity', () => {
  let testClientAId: string | null = null;
  let testClientBId: string | null = null;
  let testUserAId: string | null = null;
  let testUserBId: string | null = null;
  let testLeadClientAId: string | null = null;
  let testLeadClientBId: string | null = null;
  let testActivitiesClientA: string[] = [];
  let testActivitiesClientB: string[] = [];

  beforeAll(async () => {
    // Create two separate clients for isolation testing
    const clientA = await createTestClient({
      companyName: 'Client A for Timeline Tests',
      email: 'client-a-timeline@test.internal',
    });
    testClientAId = clientA.id;

    const clientB = await createTestClient({
      companyName: 'Client B for Timeline Tests',
      email: 'client-b-timeline@test.internal',
    });
    testClientBId = clientB.id;

    // Create User for Client A
    const passwordHash = await bcrypt.hash('password123', 10);
    const userA = await createTestUser(testClientAId, {
      email: 'user-a@test.internal',
      passwordHash,
      firstName: 'User',
      lastName: 'A',
      role: 'CLIENT_USER',
    });
    testUserAId = userA.id;

    // Create User for Client B
    const userB = await createTestUser(testClientBId, {
      email: 'user-b@test.internal',
      passwordHash,
      firstName: 'User',
      lastName: 'B',
      role: 'CLIENT_USER',
    });
    testUserBId = userB.id;

    // Create lead for Client A
    const leadA = await createTestLead(testClientAId!, {
      email: 'lead-a-timeline@test.internal',
      firstName: 'Lead',
      lastName: 'A',
      airtableRecordId: `recLeadA${Date.now()}`,
    });
    testLeadClientAId = leadA.id;

    // Create lead for Client B
    const leadB = await createTestLead(testClientBId!, {
      email: 'lead-b-timeline@test.internal',
      firstName: 'Lead',
      lastName: 'B',
      airtableRecordId: `recLeadB${Date.now()}`,
    });
    testLeadClientBId = leadB.id;

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

    // Clean up users
    if (testUserAId) {
      await db.delete(users).where(eq(users.id, testUserAId));
    }
    if (testUserBId) {
      await db.delete(users).where(eq(users.id, testUserBId));
    }

    // Clean up clients
    if (testClientAId) {
      await db.delete(clients).where(eq(clients.id, testClientAId));
    }
    if (testClientBId) {
      await db.delete(clients).where(eq(clients.id, testClientBId));
    }
  });

  // Helper to create request
  const createRequest = (url: string) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'));
  };

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Client Isolation (HIGH-002 Fix)', () => {
    it('should allow access to own client leads', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: testUserAId, role: 'CLIENT_USER', clientId: testClientAId },
      });

      const req = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.timeline.length).toBe(3);
    });

    it('should reject access to other client leads (403 Forbidden)', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: testUserAId, role: 'CLIENT_USER', clientId: testClientAId },
      });

      // User A tries to access Lead B
      const req = createRequest(`/api/leads/${testLeadClientBId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientBId! }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should allow SUPER_ADMIN to access all client leads', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'super-admin', role: 'SUPER_ADMIN', clientId: null },
      });

      // Check Lead A
      const reqA = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const responseA = await GET(reqA, { params: Promise.resolve({ id: testLeadClientAId! }) });
      expect(responseA.status).toBe(200);

      // Check Lead B
      const reqB = createRequest(`/api/leads/${testLeadClientBId}/activity`);
      const responseB = await GET(reqB, { params: Promise.resolve({ id: testLeadClientBId! }) });
      expect(responseB.status).toBe(200);
    });

    it('should return 404 for non-existent lead', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: testUserAId, role: 'CLIENT_USER', clientId: testClientAId },
      });

      const fakeLeadId = '00000000-0000-0000-0000-000000000000';
      const req = createRequest(`/api/leads/${fakeLeadId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: fakeLeadId }) });

      expect(response.status).toBe(404);
    });
  });

  describe('Pagination (MEDIUM-004 Fix)', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: testUserAId, role: 'CLIENT_USER', clientId: testClientAId },
      });
    });

    it('should return paginated results with default limit 100', async () => {
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();

      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(100);
      expect(data.pagination.page).toBe(1);
    });

    it('should support custom page parameter', async () => {
      // With only 3 items, page 2 should be empty
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity?page=2&limit=2`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.timeline.length).toBe(1); // 3 items, page 1 has 2, page 2 has 1
    });

    it('should support custom limit parameter', async () => {
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity?limit=1`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();

      expect(data.pagination.limit).toBe(1);
      expect(data.timeline.length).toBe(1);
    });

    it('should enforce max limit of 500', async () => {
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity?limit=1000`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();

      expect(data.pagination.limit).toBe(500);
    });

    it('should return pagination metadata', async () => {
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();

      expect(data.pagination).toHaveProperty('totalCount');
      expect(data.pagination).toHaveProperty('totalPages');
      expect(data.pagination).toHaveProperty('hasMore');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: testUserAId, role: 'CLIENT_USER', clientId: testClientAId },
      });
    });

    it('should return timeline array', async () => {
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();

      expect(Array.isArray(data.timeline)).toBe(true);
    });

    it('should order activities by timestamp descending', async () => {
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();

      const dates = data.timeline.map((a: any) => new Date(a.timestamp).getTime());
      // Check if sorted descending
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should include all activity fields', async () => {
      const req = createRequest(`/api/leads/${testLeadClientAId}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: testLeadClientAId! }) });
      const data = await response.json();
      const activity = data.timeline[0];

      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('timestamp');
      expect(activity).toHaveProperty('eventType');
      expect(activity).toHaveProperty('category');
      expect(activity).toHaveProperty('description');
      // message/details/source/executionId might be null/undefined depending on data
      // but checking they exist on the object keys is good practice if we want to enforce shape
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
    it('should handle lead with no activities', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: testUserAId, role: 'CLIENT_USER', clientId: testClientAId },
      });

      // Create lead with zero activities
      const lead = await createTestLead(testClientAId!, {
        email: 'empty-lead@test.internal',
        firstName: 'Empty',
        lastName: 'Lead',
      });
      
      const req = createRequest(`/api/leads/${lead.id}/activity`);
      const response = await GET(req, { params: Promise.resolve({ id: lead.id }) });
      const data = await response.json();
      
      expect(data.timeline).toEqual([]);
      expect(data.pagination.totalCount).toBe(0);
      
      // Cleanup
      await db.delete(leads).where(eq(leads.id, lead.id));
    });
  });
});
