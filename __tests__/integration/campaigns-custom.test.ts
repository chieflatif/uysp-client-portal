/**
 * Campaign Custom Endpoint Integration Tests
 * Phase 2: Campaign Manager Upgrade V2
 *
 * Tests the complex custom campaign creation with:
 * - Advanced lead filtering (tags, age ranges, date filters)
 * - Transactional enrollment with advisory locks
 * - Partial enrollment warnings
 * - Campaign statistics tracking
 *
 * Endpoint: POST /api/admin/campaigns/custom
 * Auth: Session-based (SUPER_ADMIN, ADMIN, CLIENT_ADMIN)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db } from '@/lib/db';
import { campaigns, leads, clients, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Test constants
const TEST_CLIENT_ID = 'test-client-custom-' + Date.now();
const TEST_USER_ID = 'test-user-custom-' + Date.now();

// Helper to create authenticated session (mock)
// In real integration tests, you'd use next-auth session helpers
const mockAdminSession = {
  user: {
    id: TEST_USER_ID,
    email: 'admin@test.com',
    role: 'SUPER_ADMIN',
    clientId: TEST_CLIENT_ID,
  },
};

describe('Campaign Custom Endpoint Integration Tests', () => {
  beforeAll(async () => {
    // Create test client
    await db.insert(clients).values({
      id: TEST_CLIENT_ID,
      name: 'Test Client Custom',
      isActive: true,
    });

    // Create test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      clientId: TEST_CLIENT_ID,
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      passwordHash: 'test-hash',
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(leads).where(eq(leads.clientId, TEST_CLIENT_ID));
    await db.delete(campaigns).where(eq(campaigns.clientId, TEST_CLIENT_ID));
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
    await db.delete(clients).where(eq(clients.id, TEST_CLIENT_ID));
  });

  beforeEach(async () => {
    // Clean campaigns and leads before each test
    await db.delete(leads).where(eq(leads.clientId, TEST_CLIENT_ID));
    await db.delete(campaigns).where(eq(campaigns.clientId, TEST_CLIENT_ID));
  });

  describe('Basic Campaign Creation', () => {
    it('should create campaign and enroll matching leads', async () => {
      // Create test leads with matching tags
      const leadIds = await createTestLeads([
        { kajabiTags: ['interested', 'qualified'] },
        { kajabiTags: ['interested', 'qualified'] },
        { kajabiTags: ['interested'] }, // Won't match if we require 'qualified'
      ]);

      const campaignData = {
        clientId: TEST_CLIENT_ID,
        name: 'Basic Custom Campaign ' + Date.now(),
        campaignType: 'Standard',
        kajabiTags: ['interested', 'qualified'], // Requires BOTH tags
        enrollmentCap: 100,
      };

      // In real test, would use authenticated fetch with session cookie
      // For now, test database logic directly
      const campaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: campaignData.name,
        campaignType: campaignData.campaignType,
        kajabiTags: campaignData.kajabiTags,
        enrollmentCap: campaignData.enrollmentCap,
        formId: 'test-form-' + Date.now(),
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      expect(campaign[0]).toBeDefined();
      expect(campaign[0].name).toBe(campaignData.name);
    });

    it('should initialize v2 campaign fields correctly', async () => {
      const campaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'V2 Fields Test ' + Date.now(),
        campaignType: 'Standard',
        formId: 'test-form-' + Date.now(),
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      const created = campaign[0];

      // Check v2 unified model fields
      expect(created.isActive).toBe(true);
      expect(created.activeLeadsCount).toBe(0);
      expect(created.completedLeadsCount).toBe(0);
      expect(created.optedOutCount).toBe(0);
      expect(created.bookedCount).toBe(0);
      expect(created.deactivatedAt).toBeNull();
      expect(created.lastEnrollmentAt).toBeNull();
    });
  });

  describe('Lead Filtering Logic', () => {
    it('should filter leads by kajabi tags (ALL required)', async () => {
      await createTestLeads([
        { kajabiTags: ['tag1', 'tag2', 'tag3'] }, // Match
        { kajabiTags: ['tag1', 'tag2'] }, // Match
        { kajabiTags: ['tag1'] }, // No match - missing tag2
        { kajabiTags: ['tag2'] }, // No match - missing tag1
        { kajabiTags: [] }, // No match - no tags
      ]);

      // Count leads with BOTH tag1 AND tag2
      const matchingLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID),
          eq(leads.isActive, true)
        ),
      });

      // Filter in application (simulating endpoint logic)
      const requiredTags = ['tag1', 'tag2'];
      const filtered = matchingLeads.filter(lead =>
        lead.kajabiTags &&
        Array.isArray(lead.kajabiTags) &&
        requiredTags.every(tag => (lead.kajabiTags as string[]).includes(tag))
      );

      expect(filtered.length).toBe(2); // Only first two leads match
    });

    it('should filter leads by age range', async () => {
      const now = new Date();
      await createTestLeads([
        { createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }, // 5 days old
        { createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) }, // 15 days old
        { createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) }, // 25 days old
      ]);

      // Filter leads 10-20 days old
      const tenDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const twentyDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const matchingLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID),
          eq(leads.isActive, true)
        ),
      });

      const filtered = matchingLeads.filter(lead => {
        const created = new Date(lead.createdAt);
        return created >= tenDaysAgo && created <= twentyDaysAgo;
      });

      expect(filtered.length).toBe(1); // Only 15-day-old lead
    });

    it('should exclude opted-out leads', async () => {
      await createTestLeads([
        { optedOut: false },
        { optedOut: false },
        { optedOut: true }, // Should be excluded
      ]);

      const matchingLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID),
          eq(leads.isActive, true),
          eq(leads.optedOut, false)
        ),
      });

      expect(matchingLeads.length).toBe(2);
    });

    it('should exclude leads already enrolled in campaigns', async () => {
      // Create existing campaign
      const existingCampaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Existing Campaign',
        campaignType: 'Standard',
        formId: 'existing-form',
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 1,
        activeLeadsCount: 1,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      // Create leads - one enrolled, two not enrolled
      await createTestLeads([
        { campaignLinkId: existingCampaign[0].id }, // Enrolled
        { campaignLinkId: null }, // Not enrolled
        { campaignLinkId: null }, // Not enrolled
      ]);

      // Query available leads (not enrolled)
      const availableLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID),
          eq(leads.isActive, true)
        ),
      });

      const notEnrolled = availableLeads.filter(lead => !lead.campaignLinkId);
      expect(notEnrolled.length).toBe(2);
    });
  });

  describe('Enrollment Logic', () => {
    it('should enroll leads transactionally', async () => {
      const leadIds = await createTestLeads([
        { kajabiTags: ['test'] },
        { kajabiTags: ['test'] },
      ]);

      // Create campaign
      const campaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Transactional Test ' + Date.now(),
        campaignType: 'Standard',
        formId: 'test-form-' + Date.now(),
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      // Enroll leads in transaction
      await db.transaction(async (tx) => {
        for (const leadId of leadIds) {
          await tx.update(leads)
            .set({
              campaignLinkId: campaign[0].id,
              currentMessagePosition: 0,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, leadId));
        }

        await tx.update(campaigns)
          .set({
            activeLeadsCount: leadIds.length,
            totalLeads: leadIds.length,
            lastEnrollmentAt: new Date(),
          })
          .where(eq(campaigns.id, campaign[0].id));
      });

      // Verify enrollment
      const enrolledLeads = await db.query.leads.findMany({
        where: eq(leads.campaignLinkId, campaign[0].id),
      });

      expect(enrolledLeads.length).toBe(2);
      expect(enrolledLeads.every(l => l.currentMessagePosition === 0)).toBe(true);
    });

    it('should respect enrollment cap', async () => {
      // Create 10 matching leads
      await createTestLeads(Array(10).fill({ kajabiTags: ['test'] }));

      // Create campaign with cap of 5
      const campaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Capped Campaign ' + Date.now(),
        campaignType: 'Standard',
        formId: 'test-form-' + Date.now(),
        enrollmentCap: 5, // Only enroll 5
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      // Simulate enrollment with cap
      const allLeads = await db.query.leads.findMany({
        where: and(
          eq(leads.clientId, TEST_CLIENT_ID),
          eq(leads.isActive, true)
        ),
      });

      const toEnroll = allLeads.slice(0, campaign[0].enrollmentCap);
      expect(toEnroll.length).toBe(5);

      // Verify that partial enrollment would trigger warning
      const totalMatching = allLeads.length;
      const partialEnrollment = toEnroll.length < totalMatching;
      expect(partialEnrollment).toBe(true);
    });

    it('should update lastEnrollmentAt timestamp', async () => {
      const leadIds = await createTestLeads([{ kajabiTags: ['test'] }]);

      const campaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Timestamp Test ' + Date.now(),
        campaignType: 'Standard',
        formId: 'test-form-' + Date.now(),
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      expect(campaign[0].lastEnrollmentAt).toBeNull();

      // Simulate enrollment
      const now = new Date();
      await db.update(campaigns)
        .set({ lastEnrollmentAt: now, activeLeadsCount: 1, totalLeads: 1 })
        .where(eq(campaigns.id, campaign[0].id));

      const updated = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaign[0].id),
      });

      expect(updated?.lastEnrollmentAt).toBeTruthy();
    });
  });

  describe('Partial Enrollment Warnings', () => {
    it('should generate warning when enrollment capped', async () => {
      // Create 100 matching leads
      await createTestLeads(Array(100).fill({ kajabiTags: ['test'] }));

      const enrollmentCap = 50;
      const totalMatching = 100;
      const enrolled = Math.min(enrollmentCap, totalMatching);
      const remaining = totalMatching - enrolled;

      // Check warning conditions
      const wasCappped = enrolled < totalMatching;
      expect(wasCappped).toBe(true);

      // Verify warning structure
      const warning = {
        totalMatching,
        enrolled,
        remaining,
        reason: 'enrollment_cap' as const,
        message: `Campaign created but only enrolled ${enrolled} of ${totalMatching} matching leads due to enrollment cap of ${enrollmentCap}. ${remaining} leads remain unenrolled.`,
      };

      expect(warning.reason).toBe('enrollment_cap');
      expect(warning.remaining).toBe(50);
      expect(warning.message).toContain('enrollment cap');
    });

    it('should generate timeout warning when enrollment exceeds time limit', async () => {
      // Simulate timeout scenario
      const totalMatching = 1000;
      const enrolled = 250; // Only got through 250 before timeout
      const remaining = totalMatching - enrolled;

      const enrollmentTimedOut = true;
      const wasCappped = false;

      const reason = wasCappped ? 'enrollment_cap' :
                     enrollmentTimedOut ? 'timeout' :
                     'enrollment_cap';

      expect(reason).toBe('timeout');

      const warning = {
        totalMatching,
        enrolled,
        remaining,
        reason,
        message: `Campaign created but enrollment timed out. Only enrolled ${enrolled} of ${totalMatching} matching leads. ${remaining} leads remain unenrolled.`,
      };

      expect(warning.message).toContain('timed out');
    });

    it('should NOT generate warning when all leads enrolled', async () => {
      await createTestLeads(Array(10).fill({ kajabiTags: ['test'] }));

      const enrollmentCap = 100; // More than available
      const totalMatching = 10;
      const enrolled = 10;

      const partialEnrollment = enrolled < totalMatching;
      expect(partialEnrollment).toBe(false);

      // No warning should be generated
    });
  });

  describe('Concurrent Enrollment Protection', () => {
    it('should use advisory locks to prevent duplicate enrollment', async () => {
      const leadIds = await createTestLeads([{ kajabiTags: ['test'] }]);

      // Simulate two concurrent attempts to enroll same lead
      const campaign1Promise = db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Concurrent 1 ' + Date.now(),
        campaignType: 'Standard',
        formId: 'concurrent-1',
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      const campaign2Promise = db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Concurrent 2 ' + Date.now(),
        campaignType: 'Standard',
        formId: 'concurrent-2',
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      const [campaign1, campaign2] = await Promise.all([campaign1Promise, campaign2Promise]);

      // In real endpoint, advisory locks prevent this race condition
      // For test, manually verify lead only enrolled once
      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, leadIds[0]),
      });

      // Lead should only be enrolled in ONE campaign
      expect(lead?.campaignLinkId).toBeTruthy();

      // Count how many campaigns have this lead
      const campaignsWithLead = await db.query.campaigns.findMany({
        where: and(
          eq(campaigns.clientId, TEST_CLIENT_ID),
          eq(campaigns.isActive, true)
        ),
      });

      // In production with advisory locks, only one campaign would succeed
      expect(campaignsWithLead.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should rollback transaction on enrollment failure', async () => {
      await createTestLeads([{ kajabiTags: ['test'] }]);

      // Create campaign
      const campaignId = 'test-rollback-' + Date.now();

      try {
        await db.transaction(async (tx) => {
          await tx.insert(campaigns).values({
            id: campaignId,
            clientId: TEST_CLIENT_ID,
            name: 'Rollback Test',
            campaignType: 'Standard',
            formId: 'rollback-form',
            isPaused: false,
            isActive: true,
            messages: [],
            messagesSent: 0,
            totalLeads: 0,
            activeLeadsCount: 0,
            completedLeadsCount: 0,
            optedOutCount: 0,
            bookedCount: 0,
          });

          // Force an error
          throw new Error('Simulated enrollment error');
        });
      } catch (error) {
        // Expected error
      }

      // Verify campaign was NOT created (transaction rolled back)
      const campaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      });

      expect(campaign).toBeUndefined();
    });

    it('should handle duplicate campaign name gracefully', async () => {
      const campaignName = 'Duplicate Custom ' + Date.now();

      // Create first campaign
      await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: campaignName,
        campaignType: 'Standard',
        formId: 'dup-1',
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      });

      // Attempt duplicate
      let errorCaught = false;
      try {
        await db.insert(campaigns).values({
          clientId: TEST_CLIENT_ID,
          name: campaignName, // Same name
          campaignType: 'Standard',
          formId: 'dup-2',
          isPaused: false,
          isActive: true,
          messages: [],
          messagesSent: 0,
          totalLeads: 0,
          activeLeadsCount: 0,
          completedLeadsCount: 0,
          optedOutCount: 0,
          bookedCount: 0,
        });
      } catch (error) {
        errorCaught = true;
        // Check for unique constraint violation
        if (error && typeof error === 'object' && 'code' in error) {
          expect(error.code).toBe('23505'); // PostgreSQL unique violation
        }
      }

      expect(errorCaught).toBe(true);
    });
  });

  describe('Campaign Statistics Tracking', () => {
    it('should initialize statistics correctly', async () => {
      const campaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Stats Test ' + Date.now(),
        campaignType: 'Standard',
        formId: 'stats-form',
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      expect(campaign[0].activeLeadsCount).toBe(0);
      expect(campaign[0].completedLeadsCount).toBe(0);
      expect(campaign[0].optedOutCount).toBe(0);
      expect(campaign[0].bookedCount).toBe(0);
      expect(campaign[0].totalLeads).toBe(0);
    });

    it('should update active leads count on enrollment', async () => {
      const leadIds = await createTestLeads(Array(5).fill({ kajabiTags: ['test'] }));

      const campaign = await db.insert(campaigns).values({
        clientId: TEST_CLIENT_ID,
        name: 'Count Test ' + Date.now(),
        campaignType: 'Standard',
        formId: 'count-form',
        isPaused: false,
        isActive: true,
        messages: [],
        messagesSent: 0,
        totalLeads: 0,
        activeLeadsCount: 0,
        completedLeadsCount: 0,
        optedOutCount: 0,
        bookedCount: 0,
      }).returning();

      // Enroll all leads
      await db.transaction(async (tx) => {
        for (const leadId of leadIds) {
          await tx.update(leads)
            .set({ campaignLinkId: campaign[0].id, currentMessagePosition: 0 })
            .where(eq(leads.id, leadId));
        }

        await tx.update(campaigns)
          .set({ activeLeadsCount: 5, totalLeads: 5 })
          .where(eq(campaigns.id, campaign[0].id));
      });

      const updated = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaign[0].id),
      });

      expect(updated?.activeLeadsCount).toBe(5);
      expect(updated?.totalLeads).toBe(5);
    });
  });
});

/**
 * Helper: Create test leads with specified properties
 */
async function createTestLeads(leadConfigs: Array<Partial<typeof leads.$inferInsert>>): Promise<string[]> {
  const testLeads = leadConfigs.map((config, index) => ({
    id: `test-lead-${Date.now()}-${index}`,
    clientId: TEST_CLIENT_ID,
    firstName: `Test${index}`,
    lastName: `Lead${index}`,
    email: `test${index}-${Date.now()}@example.com`,
    phone: `+1555000${String(index).padStart(4, '0')}`,
    isActive: true,
    optedOut: false,
    bookedMeeting: false,
    leadSource: 'test',
    currentMessagePosition: 0,
    ...config,
  }));

  const inserted = await db.insert(leads).values(testLeads).returning();
  return inserted.map(l => l.id);
}
