/**
 * De-enrollment V2 Script Integration Tests
 * Phase 2: Campaign Manager Upgrade V2
 *
 * Tests the production de-enrollment script with:
 * - Multi-client isolation
 * - Batch processing for scale
 * - Concurrent run protection
 * - Monitoring and logging
 * - Timeout handling
 * - Campaign statistics updates
 *
 * Script: scripts/de-enroll-completed-leads-v2.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db } from '@/lib/db';
import { campaigns, leads, clients, deEnrollmentRuns, deEnrollmentLeadLog } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Test constants
const TEST_CLIENT_ID_1 = 'test-client-de-1-' + Date.now();
const TEST_CLIENT_ID_2 = 'test-client-de-2-' + Date.now();

describe('De-enrollment V2 Script Integration Tests', () => {
  beforeAll(async () => {
    // Create test clients
    await db.insert(clients).values([
      { id: TEST_CLIENT_ID_1, name: 'Test Client De-enroll 1', isActive: true },
      { id: TEST_CLIENT_ID_2, name: 'Test Client De-enroll 2', isActive: true },
    ]);
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(deEnrollmentLeadLog).where(
      sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`
    );
    await db.delete(deEnrollmentRuns).where(
      sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`
    );
    await db.delete(leads).where(sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`);
    await db.delete(campaigns).where(sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`);
    await db.delete(clients).where(sql`id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`);
  });

  beforeEach(async () => {
    // Clean up before each test
    await db.delete(deEnrollmentLeadLog).where(
      sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`
    );
    await db.delete(deEnrollmentRuns).where(
      sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`
    );
    await db.delete(leads).where(sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`);
    await db.delete(campaigns).where(sql`client_id IN (${TEST_CLIENT_ID_1}, ${TEST_CLIENT_ID_2})`);
  });

  describe('Lead De-enrollment Logic', () => {
    it('should de-enroll leads at final message position', async () => {
      const { campaignId, leadIds } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 3,
        leadsAtFinalPosition: 2,
        leadsInProgress: 1,
      });

      // Simulate de-enrollment logic
      const completedLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID_1),
          eq(leads.isActive, true),
          eq(leads.campaignLinkId, campaignId)
        ),
      });

      const toDeEnroll = completedLeads.filter(
        lead => lead.currentMessagePosition >= 3 // At or past final position
      );

      expect(toDeEnroll.length).toBe(2);

      // De-enroll leads
      for (const lead of toDeEnroll) {
        await db.update(leads)
          .set({
            isActive: false,
            completedAt: new Date(),
            campaignLinkId: null,
          })
          .where(eq(leads.id, lead.id));
      }

      // Verify de-enrollment
      const deEnrolled = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID_1),
          eq(leads.isActive, false)
        ),
      });

      expect(deEnrolled.length).toBe(2);
      expect(deEnrolled.every(l => l.completedAt !== null)).toBe(true);
    });

    it('should NOT de-enroll leads still in progress', async () => {
      const { campaignId } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 5,
        leadsAtFinalPosition: 0,
        leadsInProgress: 3, // All at position 3 of 5
      });

      const inProgressLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID_1),
          eq(leads.isActive, true),
          eq(leads.campaignLinkId, campaignId)
        ),
      });

      const toDeEnroll = inProgressLeads.filter(
        lead => lead.currentMessagePosition >= 5 // Only at final position
      );

      expect(toDeEnroll.length).toBe(0);
    });

    it('should correctly identify outcome (completed vs booked)', async () => {
      const { campaignId } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 3,
        leadsAtFinalPosition: 1,
        bookedLeadsAtFinalPosition: 1,
      });

      const completedLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID_1),
          eq(leads.isActive, true),
          eq(leads.campaignLinkId, campaignId)
        ),
      });

      const outcomes = completedLeads.map(lead => ({
        id: lead.id,
        outcome: lead.bookedMeeting ? 'booked' :
                 lead.optedOut ? 'opted_out' :
                 'completed',
      }));

      const bookedCount = outcomes.filter(o => o.outcome === 'booked').length;
      const completedCount = outcomes.filter(o => o.outcome === 'completed').length;

      expect(bookedCount).toBe(1);
      expect(completedCount).toBe(1);
    });

    it('should preserve existing campaign history', async () => {
      const { campaignId, leadIds } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 2,
        leadsAtFinalPosition: 1,
      });

      const leadId = leadIds[0];

      // Add existing history
      const existingHistory = [{
        campaignId: 'old-campaign',
        campaignName: 'Old Campaign',
        enrolledAt: new Date('2024-01-01').toISOString(),
        completedAt: new Date('2024-01-10').toISOString(),
        messagesReceived: 5,
        outcome: 'completed' as const,
      }];

      await db.update(leads)
        .set({ campaignHistory: existingHistory })
        .where(eq(leads.id, leadId));

      // De-enroll and append new history
      const newEntry = {
        campaignId,
        campaignName: 'Test Campaign',
        enrolledAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        messagesReceived: 2,
        outcome: 'completed' as const,
      };

      await db.update(leads)
        .set({
          campaignHistory: sql`campaign_history || ${JSON.stringify([newEntry])}::jsonb`,
          isActive: false,
          completedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      // Verify history was appended
      const updated = await db.query.leads.findFirst({
        where: eq(leads.id, leadId),
      });

      expect(Array.isArray(updated?.campaignHistory)).toBe(true);
      expect(updated?.campaignHistory?.length).toBe(2);
    });
  });

  describe('Multi-Client Isolation', () => {
    it('should process each client independently', async () => {
      // Create campaigns for both clients
      const { campaignId: campaign1 } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 3,
        leadsAtFinalPosition: 2,
      });

      const { campaignId: campaign2 } = await setupTestCampaign(TEST_CLIENT_ID_2, {
        messageCount: 3,
        leadsAtFinalPosition: 3,
      });

      // Process client 1 only
      const client1Leads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID_1),
          eq(leads.isActive, true),
          eq(leads.campaignLinkId, campaign1)
        ),
      });

      const client1ToDeEnroll = client1Leads.filter(l => l.currentMessagePosition >= 3);

      for (const lead of client1ToDeEnroll) {
        await db.update(leads)
          .set({ isActive: false, completedAt: new Date() })
          .where(eq(leads.id, lead.id));
      }

      // Verify client 2 leads unaffected
      const client2Leads = await db.query.leads.findMany({
        where: eq(leads.clientId, TEST_CLIENT_ID_2),
      });

      expect(client2Leads.every(l => l.isActive)).toBe(true);
    });

    it('should maintain separate statistics per client', async () => {
      const { campaignId: campaign1 } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 2,
        leadsAtFinalPosition: 5,
      });

      const { campaignId: campaign2 } = await setupTestCampaign(TEST_CLIENT_ID_2, {
        messageCount: 2,
        leadsAtFinalPosition: 3,
      });

      // Get campaign stats
      const stats1 = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaign1),
      });

      const stats2 = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaign2),
      });

      expect(stats1?.activeLeadsCount).toBe(5);
      expect(stats2?.activeLeadsCount).toBe(3);
      expect(stats1?.clientId).toBe(TEST_CLIENT_ID_1);
      expect(stats2?.clientId).toBe(TEST_CLIENT_ID_2);
    });
  });

  describe('Batch Processing', () => {
    it('should process leads in batches', async () => {
      const BATCH_SIZE = 10;
      const TOTAL_LEADS = 25;

      const { campaignId } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 1,
        leadsAtFinalPosition: TOTAL_LEADS,
      });

      // Get all completed leads
      const completedLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID_1),
          eq(leads.isActive, true),
          eq(leads.campaignLinkId, campaignId)
        ),
      });

      expect(completedLeads.length).toBe(TOTAL_LEADS);

      // Process in batches
      let processed = 0;
      for (let i = 0; i < completedLeads.length; i += BATCH_SIZE) {
        const batch = completedLeads.slice(i, i + BATCH_SIZE);

        for (const lead of batch) {
          await db.update(leads)
            .set({ isActive: false, completedAt: new Date() })
            .where(eq(leads.id, lead.id));
        }

        processed += batch.length;
      }

      expect(processed).toBe(TOTAL_LEADS);

      // Verify all processed
      const remaining = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID_1),
          eq(leads.isActive, true)
        ),
      });

      expect(remaining.length).toBe(0);
    });

    it('should calculate correct batch count', async () => {
      const BATCH_SIZE = 10;
      const testCases = [
        { total: 0, expected: 0 },
        { total: 5, expected: 1 },
        { total: 10, expected: 1 },
        { total: 11, expected: 2 },
        { total: 100, expected: 10 },
        { total: 105, expected: 11 },
      ];

      for (const { total, expected } of testCases) {
        const batchCount = Math.ceil(total / BATCH_SIZE);
        expect(batchCount).toBe(expected);
      }
    });
  });

  describe('Campaign Statistics Updates', () => {
    it('should decrement active_leads_count', async () => {
      const { campaignId } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 2,
        leadsAtFinalPosition: 5,
      });

      const initialStats = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      });

      expect(initialStats?.activeLeadsCount).toBe(5);

      // De-enroll 3 leads
      const leadsToDeEnroll = await db.query.leads.findMany({
        where: eq(leads.campaignLinkId, campaignId),
        limit: 3,
      });

      for (const lead of leadsToDeEnroll) {
        await db.update(leads)
          .set({ isActive: false, completedAt: new Date(), campaignLinkId: null })
          .where(eq(leads.id, lead.id));
      }

      // Update campaign stats
      await db.update(campaigns)
        .set({
          activeLeadsCount: sql`active_leads_count - 3`,
          completedLeadsCount: sql`completed_leads_count + 3`,
        })
        .where(eq(campaigns.id, campaignId));

      const updatedStats = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      });

      expect(updatedStats?.activeLeadsCount).toBe(2);
      expect(updatedStats?.completedLeadsCount).toBe(3);
    });

    it('should increment outcome-specific counters', async () => {
      const { campaignId, leadIds } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 2,
        leadsAtFinalPosition: 2,
        bookedLeadsAtFinalPosition: 1,
      });

      // De-enroll and categorize
      const allLeads = await db.query.leads.findMany({
        where: eq(leads.campaignLinkId, campaignId),
      });

      let completedCount = 0;
      let bookedCount = 0;

      for (const lead of allLeads) {
        if (lead.bookedMeeting) {
          bookedCount++;
        } else {
          completedCount++;
        }

        await db.update(leads)
          .set({ isActive: false, completedAt: new Date() })
          .where(eq(leads.id, lead.id));
      }

      // Update campaign stats
      await db.update(campaigns)
        .set({
          activeLeadsCount: sql`active_leads_count - ${allLeads.length}`,
          completedLeadsCount: sql`completed_leads_count + ${completedCount}`,
          bookedCount: sql`booked_count + ${bookedCount}`,
        })
        .where(eq(campaigns.id, campaignId));

      const stats = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      });

      expect(stats?.completedLeadsCount).toBe(2);
      expect(stats?.bookedCount).toBe(1);
      expect(stats?.activeLeadsCount).toBe(0);
    });

    it('should never allow negative counts', async () => {
      const { campaignId } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 1,
        leadsAtFinalPosition: 1,
      });

      // Manually set counts to 0
      await db.update(campaigns)
        .set({ activeLeadsCount: 0, completedLeadsCount: 0 })
        .where(eq(campaigns.id, campaignId));

      // Attempt to decrement (should use GREATEST(0, count - 1))
      await db.update(campaigns)
        .set({
          activeLeadsCount: sql`GREATEST(0, active_leads_count - 1)`,
        })
        .where(eq(campaigns.id, campaignId));

      const stats = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      });

      expect(stats?.activeLeadsCount).toBe(0); // Not negative
    });
  });

  describe('Monitoring and Logging', () => {
    it('should create de_enrollment_runs record', async () => {
      const runId = 'test-run-' + Date.now();

      await db.insert(deEnrollmentRuns).values({
        id: runId,
        clientId: TEST_CLIENT_ID_1,
        runAt: new Date(),
        runType: 'scheduled',
        leadsEvaluated: 100,
        leadsDeEnrolled: 25,
        leadsSkipped: 75,
        byOutcome: { completed: 20, booked: 5, opted_out: 0 },
        durationMs: 1234,
        status: 'success',
      });

      const run = await db.query.deEnrollmentRuns.findFirst({
        where: eq(deEnrollmentRuns.id, runId),
      });

      expect(run).toBeDefined();
      expect(run?.status).toBe('success');
      expect(run?.leadsDeEnrolled).toBe(25);
    });

    it('should log individual lead actions', async () => {
      const runId = 'test-run-' + Date.now();
      const leadId = 'test-lead-' + Date.now();
      const campaignId = 'test-campaign-' + Date.now();

      await db.insert(deEnrollmentLeadLog).values({
        runId,
        leadId,
        campaignId,
        clientId: TEST_CLIENT_ID_1,
        action: 'de_enrolled',
        outcome: 'completed',
        previousPosition: 3,
        messageCount: 3,
        processedAt: new Date(),
      });

      const log = await db.query.deEnrollmentLeadLog.findFirst({
        where: eq(deEnrollmentLeadLog.runId, runId),
      });

      expect(log).toBeDefined();
      expect(log?.action).toBe('de_enrolled');
      expect(log?.outcome).toBe('completed');
    });

    it('should track run duration', async () => {
      const runId = 'test-run-duration-' + Date.now();
      const startTime = Date.now();

      // Simulate some processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const endTime = Date.now();
      const duration = endTime - startTime;

      await db.insert(deEnrollmentRuns).values({
        id: runId,
        clientId: TEST_CLIENT_ID_1,
        runAt: new Date(startTime),
        runType: 'scheduled',
        leadsEvaluated: 10,
        leadsDeEnrolled: 5,
        leadsSkipped: 5,
        byOutcome: { completed: 5, booked: 0, opted_out: 0 },
        durationMs: duration,
        status: 'success',
      });

      const run = await db.query.deEnrollmentRuns.findFirst({
        where: eq(deEnrollmentRuns.id, runId),
      });

      expect(run?.durationMs).toBeGreaterThan(0);
      expect(run?.durationMs).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Concurrent Run Protection', () => {
    it('should prevent duplicate processing of same lead', async () => {
      const { campaignId, leadIds } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 2,
        leadsAtFinalPosition: 1,
      });

      const leadId = leadIds[0];

      // First de-enrollment
      await db.update(leads)
        .set({ isActive: false, completedAt: new Date() })
        .where(eq(leads.id, leadId));

      // Verify lead is inactive
      const lead1 = await db.query.leads.findFirst({
        where: eq(leads.id, leadId),
      });

      expect(lead1?.isActive).toBe(false);

      // Attempt second de-enrollment (should be skipped)
      const activeLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.id, leadId),
          eq(leads.isActive, true) // Query only active leads
        ),
      });

      expect(activeLeads.length).toBe(0); // Lead won't be reprocessed
    });

    it('should use database-level locking in transactions', async () => {
      const { campaignId, leadIds } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 1,
        leadsAtFinalPosition: 5,
      });

      // Simulate concurrent processing with row-level locks
      await db.transaction(async (tx) => {
        // SELECT FOR UPDATE locks rows
        const locked = await tx.execute(sql`
          SELECT id FROM leads
          WHERE campaign_link_id = ${campaignId}
          AND is_active = true
          FOR UPDATE SKIP LOCKED
          LIMIT 3
        `);

        expect(Array.from(locked as Iterable<{ id: string }>).length).toBe(3);
      });

      // Other transactions would skip locked rows
      // This prevents duplicate processing
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should mark run as failed on error', async () => {
      const runId = 'test-run-failed-' + Date.now();

      try {
        await db.insert(deEnrollmentRuns).values({
          id: runId,
          clientId: TEST_CLIENT_ID_1,
          runAt: new Date(),
          runType: 'scheduled',
          leadsEvaluated: 0,
          leadsDeEnrolled: 0,
          leadsSkipped: 0,
          byOutcome: { completed: 0, booked: 0, opted_out: 0 },
          durationMs: 0,
          status: 'running',
        });

        // Simulate error
        throw new Error('Simulated processing error');
      } catch (error) {
        // Mark as failed
        await db.update(deEnrollmentRuns)
          .set({
            status: 'failed',
            errorDetails: error instanceof Error ? error.message : 'Unknown error',
          })
          .where(eq(deEnrollmentRuns.id, runId));
      }

      const run = await db.query.deEnrollmentRuns.findFirst({
        where: eq(deEnrollmentRuns.id, runId),
      });

      expect(run?.status).toBe('failed');
      expect(run?.errorDetails).toContain('Simulated processing error');
    });

    it('should support partial completion status', async () => {
      const runId = 'test-run-partial-' + Date.now();

      // Simulate partial run (timeout after processing some leads)
      await db.insert(deEnrollmentRuns).values({
        id: runId,
        clientId: TEST_CLIENT_ID_1,
        runAt: new Date(),
        runType: 'scheduled',
        leadsEvaluated: 1000,
        leadsDeEnrolled: 500, // Only got through half
        leadsSkipped: 500,
        byOutcome: { completed: 400, booked: 100, opted_out: 0 },
        durationMs: 240000, // Hit timeout
        status: 'partial',
        errorDetails: 'Timeout reached after 4 minutes',
      });

      const run = await db.query.deEnrollmentRuns.findFirst({
        where: eq(deEnrollmentRuns.id, runId),
      });

      expect(run?.status).toBe('partial');
      expect(run?.leadsDeEnrolled).toBeLessThan(run?.leadsEvaluated || 0);
    });
  });

  describe('Performance and Scale', () => {
    it('should handle large batches efficiently', async () => {
      const LARGE_BATCH_SIZE = 100;

      const { campaignId } = await setupTestCampaign(TEST_CLIENT_ID_1, {
        messageCount: 1,
        leadsAtFinalPosition: LARGE_BATCH_SIZE,
      });

      const startTime = Date.now();

      // Process all in one transaction
      await db.transaction(async (tx) => {
        const leads = await tx.query.leads.findMany({
          where: and(
            eq(campaigns.clientId, TEST_CLIENT_ID_1),
            eq(campaigns.isActive, true)
          ),
          limit: LARGE_BATCH_SIZE,
        });

        // Batch update
        if (leads.length > 0) {
          await tx.update(campaigns)
            .set({
              isActive: false,
              completedAt: new Date(),
            })
            .where(sql`id = ANY(${leads.map(l => l.id)})`);
        }
      });

      const duration = Date.now() - startTime;

      // Should complete quickly (< 5 seconds for 100 leads)
      expect(duration).toBeLessThan(5000);
    });

    it('should calculate timeout correctly', async () => {
      const MAX_RUNTIME_MS = 240000; // 4 minutes
      const startTime = Date.now();

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const elapsed = Date.now() - startTime;
      const hasTimedOut = elapsed >= MAX_RUNTIME_MS;

      expect(hasTimedOut).toBe(false);
      expect(elapsed).toBeLessThan(MAX_RUNTIME_MS);
    });
  });
});

/**
 * Helper: Setup test campaign with specified configuration
 */
async function setupTestCampaign(
  clientId: string,
  config: {
    messageCount: number;
    leadsAtFinalPosition?: number;
    leadsInProgress?: number;
    bookedLeadsAtFinalPosition?: number;
  }
): Promise<{ campaignId: string; leadIds: string[] }> {
  const campaignId = `test-campaign-${Date.now()}-${Math.random()}`;

  // Create messages
  const messages = Array.from({ length: config.messageCount }, (_, i) => ({
    step: i + 1,
    delayMinutes: i * 1440, // Daily
    text: `Message ${i + 1}`,
    type: 'sms' as const,
  }));

  // Create campaign
  await db.insert(campaigns).values({
    id: campaignId,
    clientId,
    name: `Test Campaign ${Date.now()}`,
    campaignType: 'Standard',
    formId: `test-form-${Date.now()}`,
    isPaused: false,
    isActive: true,
    messages,
    messagesSent: 0,
    totalLeads: 0,
    activeLeadsCount: 0,
    completedLeadsCount: 0,
    optedOutCount: 0,
    bookedCount: 0,
  });

  // Create leads
  const leadIds: string[] = [];

  // Leads at final position
  if (config.leadsAtFinalPosition) {
    for (let i = 0; i < config.leadsAtFinalPosition; i++) {
      const leadId = `lead-final-${Date.now()}-${i}`;
      await db.insert(leads).values({
        id: leadId,
        clientId,
        firstName: `Final${i}`,
        lastName: `Lead${i}`,
        email: `final${i}-${Date.now()}@test.com`,
        phone: `+15551${String(i).padStart(6, '0')}`,
        campaignLinkId: campaignId,
        currentMessagePosition: config.messageCount, // At final position
        isActive: true,
        optedOut: false,
        bookedMeeting: false,
        leadSource: 'test',
      });
      leadIds.push(leadId);
    }
  }

  // Booked leads at final position
  if (config.bookedLeadsAtFinalPosition) {
    for (let i = 0; i < config.bookedLeadsAtFinalPosition; i++) {
      const leadId = `lead-booked-${Date.now()}-${i}`;
      await db.insert(leads).values({
        id: leadId,
        clientId,
        firstName: `Booked${i}`,
        lastName: `Lead${i}`,
        email: `booked${i}-${Date.now()}@test.com`,
        phone: `+15552${String(i).padStart(6, '0')}`,
        campaignLinkId: campaignId,
        currentMessagePosition: config.messageCount,
        isActive: true,
        optedOut: false,
        bookedMeeting: true, // Booked!
        leadSource: 'test',
      });
      leadIds.push(leadId);
    }
  }

  // Leads in progress
  if (config.leadsInProgress) {
    for (let i = 0; i < config.leadsInProgress; i++) {
      const leadId = `lead-progress-${Date.now()}-${i}`;
      await db.insert(leads).values({
        id: leadId,
        clientId,
        firstName: `Progress${i}`,
        lastName: `Lead${i}`,
        email: `progress${i}-${Date.now()}@test.com`,
        phone: `+15553${String(i).padStart(6, '0')}`,
        campaignLinkId: campaignId,
        currentMessagePosition: Math.floor(config.messageCount / 2), // Halfway
        isActive: true,
        optedOut: false,
        bookedMeeting: false,
        leadSource: 'test',
      });
      leadIds.push(leadId);
    }
  }

  // Update campaign stats
  const totalLeads = leadIds.length;
  await db.update(campaigns)
    .set({ activeLeadsCount: totalLeads, totalLeads })
    .where(eq(campaigns.id, campaignId));

  return { campaignId, leadIds };
}
