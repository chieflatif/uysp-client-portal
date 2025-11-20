/**
 * INTEGRATION TESTS: Bi-Directional Reconciliation Engine
 *
 * Tests the core reconcileRecentChanges() function across both stages:
 * - Stage 1: Airtable → PostgreSQL sync
 * - Stage 2: PostgreSQL → Airtable sync
 *
 * These tests verify:
 * - Data flow between systems
 * - Null value handling (Commit 7.1 fix)
 * - Grace period conflict prevention
 * - Portal-owned field updates (claimedBy, claimedAt, notes)
 * - Error isolation (one bad record doesn't break entire sync)
 * - updatedAt trigger pattern
 *
 * @requires DATABASE_URL environment variable
 */

import { randomUUID } from 'crypto';
import { reconcileRecentChanges } from '../../scripts/reconcile-recent-changes';
const RECON_STAGE2_CLAIMED_USER = randomUUID();
const RECON_STAGE2_GRACE_USER = randomUUID();
const RECON_STAGE2_ERROR_USER = randomUUID();
import { db } from '../../src/lib/db';
import { leads, clients } from '../../src/lib/db/schema';
import { getAirtableClient } from '../../src/lib/airtable/client';
import { eq } from 'drizzle-orm';

// Mock Airtable client to control test data
jest.mock('../../src/lib/airtable/client');

describe('Bi-Directional Reconciliation Engine', () => {
  let testClientId: string;
  let mockAirtableClient: any;

  beforeAll(async () => {
    // Ensure test client exists in database
    const testClient = await db.query.clients.findFirst({
      where: eq(clients.companyName, 'Test Company'),
    });

    if (testClient) {
      testClientId = testClient.id;
    } else {
      // Create test client if doesn't exist
      const [newClient] = await db
        .insert(clients)
        .values({
          companyName: 'Test Company',
          email: 'test@example.com',
          airtableBaseId: 'appTestBase123',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      testClientId = newClient.id;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Airtable client
    mockAirtableClient = {
      getLeadsModifiedSince: jest.fn(),
      mapToDatabaseLead: jest.fn(),
      updateRecord: jest.fn(),
    };

    (getAirtableClient as jest.Mock).mockReturnValue(mockAirtableClient);
  });

  afterEach(async () => {
    // Clean up test leads (keep database clean)
    await db.delete(leads).where(eq(leads.email, 'test-reconciler@example.com'));
  });

  describe('Parameter Validation', () => {
    it('should reject lookbackMinutes <= 0', async () => {
      await expect(reconcileRecentChanges(0)).rejects.toThrow(
        'lookbackMinutes must be between 1 and 1440'
      );
    });

    it('should reject lookbackMinutes > 1440 (24 hours)', async () => {
      await expect(reconcileRecentChanges(1441)).rejects.toThrow(
        'lookbackMinutes must be between 1 and 1440'
      );
    });

    it('should accept valid lookbackMinutes range', async () => {
      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(mockAirtableClient.getLeadsModifiedSince).toHaveBeenCalledWith(
        expect.any(Date)
      );
    });
  });

  describe('Stage 1: Airtable → PostgreSQL', () => {
    it('should insert new leads from Airtable', async () => {
      const mockAirtableRecord = {
        id: 'recTestAirtable123',
        fields: {
          'First Name': 'John',
          'Last Name': 'Doe',
          Email: 'test-reconciler@example.com',
          Phone: '+15551234567',
          Company: 'Test Corp',
          'ICP Score': 85,
          Status: 'New',
        },
      };

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([
        mockAirtableRecord,
      ]);

      mockAirtableClient.mapToDatabaseLead.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test-reconciler@example.com',
        phone: '+15551234567',
        company: 'Test Corp',
        icpScore: 85,
        status: 'New',
        isActive: true,
        createdAt: new Date(),
      });

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(result.stage1.recordsProcessed).toBe(1);
      expect(result.stage1.inserted).toBeGreaterThanOrEqual(1);

      // Verify lead was inserted into PostgreSQL
      const insertedLead = await db.query.leads.findFirst({
        where: eq(leads.email, 'test-reconciler@example.com'),
      });

      expect(insertedLead).toBeDefined();
      expect(insertedLead?.firstName).toBe('John');
      expect(insertedLead?.airtableRecordId).toBe('recTestAirtable123');
    });

    it('should update existing leads from Airtable', async () => {
      // Insert existing lead first
      const [existingLead] = await db
        .insert(leads)
        .values({
          airtableRecordId: 'recTestUpdate123',
          clientId: testClientId,
          firstName: 'Old Name',
          lastName: 'Doe',
          email: 'test-reconciler@example.com',
          icpScore: 50,
          status: 'New',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Mock Airtable returning updated data
      const mockAirtableRecord = {
        id: 'recTestUpdate123',
        fields: {
          'First Name': 'Updated Name',
          'Last Name': 'Doe',
          Email: 'test-reconciler@example.com',
          'ICP Score': 90, // Updated score
          Status: 'Qualified', // Updated status
        },
      };

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([
        mockAirtableRecord,
      ]);

      mockAirtableClient.mapToDatabaseLead.mockReturnValue({
        firstName: 'Updated Name',
        lastName: 'Doe',
        email: 'test-reconciler@example.com',
        icpScore: 90,
        status: 'Qualified',
        isActive: true,
        createdAt: existingLead.createdAt,
      });

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(result.stage1.recordsProcessed).toBe(1);
      expect(result.stage1.updated).toBeGreaterThanOrEqual(1);

      // Verify lead was updated
      const updatedLead = await db.query.leads.findFirst({
        where: eq(leads.airtableRecordId, 'recTestUpdate123'),
      });

      expect(updatedLead?.firstName).toBe('Updated Name');
      expect(updatedLead?.icpScore).toBe(90);
      expect(updatedLead?.status).toBe('Qualified');
    });

    it('should handle Stage 1 errors gracefully (per-record isolation)', async () => {
      const mockRecords = [
        {
          id: 'recGood1',
          fields: { 'First Name': 'Good', Email: 'test-reconciler@example.com' },
        },
        {
          id: null, // Invalid - will cause error
          fields: { 'First Name': 'Bad', Email: 'bad@example.com' },
        },
        {
          id: 'recGood2',
          fields: { 'First Name': 'AlsoGood', Email: 'test-reconciler@example.com' },
        },
      ];

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue(mockRecords);

      mockAirtableClient.mapToDatabaseLead.mockImplementation((record) => ({
        firstName: record.fields['First Name'],
        lastName: '',
        email: record.fields.Email || '',
        isActive: true,
        createdAt: new Date(),
      }));

      const result = await reconcileRecentChanges(20);

      // Stage 1 should complete despite error
      expect(result.stage1.recordsProcessed).toBe(3);
      expect(result.stage1.errors.length).toBeGreaterThan(0);
      expect(result.stage1.errors[0]).toContain('missing ID');
    });

    it('should return early if no changes in Airtable', async () => {
      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(result.stage1.recordsProcessed).toBe(0);
      expect(result.stage1.inserted).toBe(0);
      expect(result.stage1.updated).toBe(0);
    });
  });

  describe('Stage 2: PostgreSQL → Airtable', () => {
    it('should sync portal-owned fields to Airtable (claimedBy)', async () => {
      // Setup: Create lead with recent updatedAt
      const recentTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      await db.insert(leads).values({
        airtableRecordId: 'recStage2Test',
        clientId: testClientId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'test-reconciler@example.com',
        claimedBy: RECON_STAGE2_CLAIMED_USER,
        claimedAt: recentTime,
        isActive: true,
        createdAt: new Date(),
        updatedAt: recentTime, // CRITICAL: Triggers Stage 2
      });

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);
      mockAirtableClient.updateRecord.mockResolvedValue({ id: 'recStage2Test' });

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(mockAirtableClient.updateRecord).toHaveBeenCalledWith(
        'Leads',
        'recStage2Test',
        expect.objectContaining({
          'Claimed By': RECON_STAGE2_CLAIMED_USER,
          'Claimed At': expect.any(String),
        })
      );
    });

    it('should sync null values correctly (Commit 7.1 fix)', async () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 1000);

      // Create lead with claimedBy = null (unclaimed)
      await db.insert(leads).values({
        airtableRecordId: 'recNullTest',
        clientId: testClientId,
        firstName: 'Null',
        lastName: 'Test',
        email: 'test-reconciler@example.com',
        claimedBy: null, // CRITICAL: null should clear field in Airtable
        claimedAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: recentTime,
      });

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);
      mockAirtableClient.updateRecord.mockResolvedValue({ id: 'recNullTest' });

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(mockAirtableClient.updateRecord).toHaveBeenCalledWith(
        'Leads',
        'recNullTest',
        expect.objectContaining({
          'Claimed By': null, // CRITICAL: null should be passed to clear field
        })
      );
    });

    it('should respect 60-second grace period (prevent infinite loops)', async () => {
      const veryRecentTime = new Date(Date.now() - 30 * 1000); // 30 seconds ago

      // Create lead updated very recently (within grace period)
      await db.insert(leads).values({
        airtableRecordId: 'recGracePeriod',
        clientId: testClientId,
        firstName: 'Grace',
        lastName: 'Period',
        email: 'test-reconciler@example.com',
        claimedBy: RECON_STAGE2_GRACE_USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: veryRecentTime, // Within 60-second grace period
      });

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(result.stage2.skipped).toBeGreaterThan(0);

      // Should NOT update Airtable (within grace period)
      expect(mockAirtableClient.updateRecord).not.toHaveBeenCalledWith(
        'Leads',
        'recGracePeriod',
        expect.anything()
      );
    });

    it('should handle Stage 2 errors gracefully', async () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 1000);

      await db.insert(leads).values({
        airtableRecordId: 'recStage2Error',
        clientId: testClientId,
        firstName: 'Error',
        lastName: 'Test',
        email: 'test-reconciler@example.com',
        claimedBy: RECON_STAGE2_ERROR_USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: recentTime,
      });

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);
      mockAirtableClient.updateRecord.mockRejectedValue(
        new Error('Airtable API error')
      );

      const result = await reconcileRecentChanges(20);

      // Should complete despite error
      expect(result.stage2.errors.length).toBeGreaterThan(0);
      expect(result.stage2.errors[0]).toContain('Airtable API error');
    });

    it('should sync notes field to Airtable', async () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 1000);

      await db.insert(leads).values({
        airtableRecordId: 'recNotesTest',
        clientId: testClientId,
        firstName: 'Notes',
        lastName: 'Test',
        email: 'test-reconciler@example.com',
        notes: '[2025-11-12] User: Important note here',
        isActive: true,
        createdAt: new Date(),
        updatedAt: recentTime,
      });

      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);
      mockAirtableClient.updateRecord.mockResolvedValue({ id: 'recNotesTest' });

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(mockAirtableClient.updateRecord).toHaveBeenCalledWith(
        'Leads',
        'recNotesTest',
        expect.objectContaining({
          Notes: '[2025-11-12] User: Important note here',
        })
      );
    });
  });

  describe('End-to-End Reconciliation', () => {
    it('should complete full bi-directional sync successfully', async () => {
      // Stage 1: Mock Airtable data
      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([
        {
          id: 'recE2E',
          fields: {
            'First Name': 'End',
            'Last Name': 'ToEnd',
            Email: 'test-reconciler@example.com',
          },
        },
      ]);

      mockAirtableClient.mapToDatabaseLead.mockReturnValue({
        firstName: 'End',
        lastName: 'ToEnd',
        email: 'test-reconciler@example.com',
        isActive: true,
        createdAt: new Date(),
      });

      // Stage 2: Mock Airtable update
      mockAirtableClient.updateRecord.mockResolvedValue({ id: 'recE2E' });

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.clientId).toBe(testClientId);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
    });

    it('should return detailed statistics', async () => {
      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);

      const result = await reconcileRecentChanges(20);

      expect(result).toMatchObject({
        success: true,
        stage1: {
          recordsProcessed: expect.any(Number),
          inserted: expect.any(Number),
          updated: expect.any(Number),
          errors: expect.any(Array),
        },
        stage2: {
          recordsProcessed: expect.any(Number),
          updated: expect.any(Number),
          skipped: expect.any(Number),
          errors: expect.any(Array),
        },
        startTime: expect.any(Date),
        endTime: expect.any(Date),
        duration: expect.any(Number),
        clientId: expect.any(String),
      });
    });
  });

  describe('Dynamic Client ID', () => {
    it('should use active client from database (not hardcoded)', async () => {
      mockAirtableClient.getLeadsModifiedSince.mockResolvedValue([]);

      const result = await reconcileRecentChanges(20);

      expect(result.success).toBe(true);
      expect(result.clientId).toBe(testClientId);
      expect(result.clientId).not.toBe('DEFAULT_CLIENT_ID'); // Not hardcoded
    });

    it('should fail gracefully if no active client found', async () => {
      // Temporarily deactivate all clients
      await db
        .update(clients)
        .set({ isActive: false })
        .where(eq(clients.id, testClientId));

      await expect(reconcileRecentChanges(20)).rejects.toThrow(
        'No active client found'
      );

      // Restore active status
      await db
        .update(clients)
        .set({ isActive: true })
        .where(eq(clients.id, testClientId));
    });
  });
});
