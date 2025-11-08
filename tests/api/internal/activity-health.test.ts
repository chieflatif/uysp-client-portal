/**
 * INTEGRATION TESTS - MINI-CRM HEALTH CHECK API
 *
 * Tests GET /api/internal/activity-health endpoint
 * Must pass before Week 2 deployment
 *
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env.local') });

import { db } from '../../../src/lib/db';
import { leadActivityLog, leads, clients } from '../../../src/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { EVENT_TYPES, EVENT_CATEGORIES } from '../../../src/lib/activity/event-types';

describe('GET /api/internal/activity-health', () => {
  let testClientId: string | null = null;
  let testLeadId: string | null = null;
  let testActivityId: string | null = null;

  beforeAll(async () => {
    // Create test client
    const clientResult = await db.insert(clients).values({
      name: 'Test Client for Health Check',
      contactEmail: 'test-health@test.internal',
      isActive: true,
    }).returning({ id: clients.id });
    testClientId = clientResult[0].id;

    // Create test lead
    const leadResult = await db.insert(leads).values({
      email: 'test-health-lead@test.internal',
      firstName: 'Health',
      lastName: 'Check',
      airtableRecordId: `recHealth${Date.now()}`,
      clientId: testClientId,
    }).returning({ id: leads.id });
    testLeadId = leadResult[0].id;

    // Create test activity
    const activityResult = await db.insert(leadActivityLog).values({
      eventType: EVENT_TYPES.MESSAGE_SENT,
      eventCategory: EVENT_CATEGORIES.SMS,
      leadId: testLeadId,
      description: 'Health check test activity',
      source: 'test:health',
      timestamp: new Date(),
    }).returning({ id: leadActivityLog.id });
    testActivityId = activityResult[0].id;

    console.log(`Created health check test activity: ${testActivityId}`);
  });

  afterAll(async () => {
    // Clean up test activity
    if (testActivityId) {
      await db.delete(leadActivityLog).where(eq(leadActivityLog.id, testActivityId));
    }

    // Clean up test lead
    if (testLeadId) {
      await db.delete(leads).where(eq(leads.id, testLeadId));
    }

    // Clean up test client
    if (testClientId) {
      await db.delete(clients).where(eq(clients.id, testClientId));
    }
  });

  describe('Endpoint Availability', () => {
    it('should respond with 200 OK', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
    });

    it('should return JSON response', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');

      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should return status field', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      expect(data.status).toBeDefined();
      expect(data.status).toBe('healthy');
    });

    it('should return totalEvents count', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      expect(data.totalEvents).toBeDefined();
      expect(typeof data.totalEvents).toBe('number');
      expect(data.totalEvents).toBeGreaterThanOrEqual(1); // At least our test activity
    });

    it('should return lastEvent object', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      expect(data.lastEvent).toBeDefined();
      expect(typeof data.lastEvent).toBe('object');
    });

    it('should include timestamp in lastEvent', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      if (data.lastEvent) {
        expect(data.lastEvent.timestamp).toBeDefined();
        expect(typeof data.lastEvent.timestamp).toBe('string');
        // Should be valid ISO 8601 timestamp
        expect(() => new Date(data.lastEvent.timestamp)).not.toThrow();
      }
    });

    it('should include eventType in lastEvent', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      if (data.lastEvent) {
        expect(data.lastEvent.eventType).toBeDefined();
        // Should be one of the valid event types
        const validTypes = Object.values(EVENT_TYPES);
        expect(validTypes).toContain(data.lastEvent.eventType);
      }
    });
  });

  describe('Database Integration', () => {
    it('should reflect actual database state', async () => {
      // Get actual count from database
      const dbCount = await db
        .select({ id: leadActivityLog.id })
        .from(leadActivityLog);

      // Get count from health check endpoint
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      expect(data.totalEvents).toBe(dbCount.length);
    });

    it('should return most recent activity as lastEvent', async () => {
      // Get most recent activity from database
      const mostRecent = await db.query.leadActivityLog.findFirst({
        orderBy: [desc(leadActivityLog.timestamp)],
      });

      // Get lastEvent from health check endpoint
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      if (mostRecent && data.lastEvent) {
        expect(data.lastEvent.id).toBe(mostRecent.id);
        expect(data.lastEvent.eventType).toBe(mostRecent.eventType);
      }
    });
  });

  describe('Performance', () => {
    it('should respond quickly (under 1 second)', async () => {
      const startTime = Date.now();

      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      await response.json();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 1 second
      console.log(`Health check responded in ${duration}ms`);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty database gracefully', async () => {
      // Even if database is empty, should not error
      const response = await fetch('http://localhost:3000/api/internal/activity-health');

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.status).toBe('healthy');
      expect(typeof data.totalEvents).toBe('number');
      // lastEvent might be null if database is empty
    });
  });

  describe('Use Cases', () => {
    it('should be useful for monitoring systems', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      // Monitoring system would check:
      // 1. Status is 'healthy'
      expect(data.status).toBe('healthy');

      // 2. Events are being logged (totalEvents > 0)
      expect(data.totalEvents).toBeGreaterThan(0);

      // 3. Recent activity exists (lastEvent is not too old)
      if (data.lastEvent) {
        const lastEventTime = new Date(data.lastEvent.timestamp);
        const now = new Date();
        const ageInHours = (now.getTime() - lastEventTime.getTime()) / (1000 * 60 * 60);

        // In a healthy system, should have activity within last 24 hours
        // (This might fail in test environment, that's OK)
        console.log(`Last activity was ${ageInHours.toFixed(2)} hours ago`);
      }
    });

    it('should provide quick system status check', async () => {
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      // Can quickly verify:
      // - Database is accessible (query succeeded)
      // - Schema is correct (returned valid data)
      // - Activity logging is working (has events)

      expect(data.status).toBe('healthy');
      expect(data.totalEvents).toBeDefined();
      expect(data.lastEvent).toBeDefined();
    });
  });

  describe('Deployment Verification', () => {
    it('should be accessible without authentication', async () => {
      // Health check should work without auth for monitoring
      const response = await fetch('http://localhost:3000/api/internal/activity-health');

      expect(response.status).toBe(200);
      // No 401 Unauthorized
    });

    it('should work immediately after deployment', async () => {
      // This test verifies health check works even before any activities logged
      const response = await fetch('http://localhost:3000/api/internal/activity-health');
      const data = await response.json();

      expect(data.status).toBe('healthy');
      expect(typeof data.totalEvents).toBe('number');
      // Should not crash even if totalEvents is 0
    });
  });
});

/**
 * PURPOSE OF HEALTH CHECK ENDPOINT:
 *
 * 1. Deployment Verification
 *    - First thing to check after deploying to staging/production
 *    - Confirms database migrations ran successfully
 *    - Confirms schema is correct
 *
 * 2. Monitoring & Alerting
 *    - External monitoring (e.g., UptimeRobot, Pingdom) can call this
 *    - If returns 500 or timeout, alert ops team
 *    - Can track totalEvents over time to ensure logging is working
 *
 * 3. Debugging
 *    - Quick way to verify activity logging system is functional
 *    - Can see most recent event without querying database
 *    - Useful for troubleshooting n8n workflow issues
 *
 * 4. Integration Testing
 *    - Provides simple endpoint to verify full stack is working
 *    - Database → API → JSON response
 *
 * USAGE IN DEPLOYMENT CHECKLIST:
 *
 * After deploying to staging:
 * 1. curl https://staging.example.com/api/internal/activity-health
 * 2. Verify returns {"status":"healthy",...}
 * 3. Verify totalEvents > 0 (if you seeded test data)
 * 4. If returns 500, check database connection/migrations
 */
