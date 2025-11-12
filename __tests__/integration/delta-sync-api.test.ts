/**
 * INTEGRATION TESTS: Delta Sync API Endpoint
 *
 * Tests POST /api/admin/sync/delta
 *
 * Verifies:
 * - SUPER_ADMIN authorization
 * - Parameter validation (minutes: 1-1440)
 * - Reconciler invocation
 * - Response format
 * - Error handling
 * - Session handling
 *
 * @requires DATABASE_URL environment variable
 */

import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/admin/sync/delta/route';
import { getServerSession } from 'next-auth/next';
import { reconcileRecentChanges } from '../../scripts/reconcile-recent-changes';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../scripts/reconcile-recent-changes');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockReconcileRecentChanges = reconcileRecentChanges as jest.MockedFunction<
  typeof reconcileRecentChanges
>;

describe('POST /api/admin/sync/delta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session user has no ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Authorization', () => {
    it('should return 403 when user is not SUPER_ADMIN', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'regular@example.com',
          role: 'CLIENT', // Not SUPER_ADMIN
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('SUPER_ADMIN');
    });

    it('should return 403 when user role is ADMIN (not SUPER_ADMIN)', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          role: 'ADMIN', // Not SUPER_ADMIN
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('SUPER_ADMIN');
    });

    it('should allow access for SUPER_ADMIN role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'super-admin-123',
          email: 'super@example.com',
          role: 'SUPER_ADMIN',
        },
      } as any);

      mockReconcileRecentChanges.mockResolvedValue({
        success: true,
        stage1: { recordsProcessed: 0, inserted: 0, updated: 0, errors: [] },
        stage2: { recordsProcessed: 0, updated: 0, skipped: 0, errors: [] },
        startTime: new Date(),
        endTime: new Date(),
        duration: 100,
        clientId: 'client-123',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockReconcileRecentChanges).toHaveBeenCalled();
    });
  });

  describe('Parameter Validation', () => {
    beforeEach(() => {
      // Setup valid SUPER_ADMIN session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'super-admin-123',
          email: 'super@example.com',
          role: 'SUPER_ADMIN',
        },
      } as any);

      mockReconcileRecentChanges.mockResolvedValue({
        success: true,
        stage1: { recordsProcessed: 0, inserted: 0, updated: 0, errors: [] },
        stage2: { recordsProcessed: 0, updated: 0, skipped: 0, errors: [] },
        startTime: new Date(),
        endTime: new Date(),
        duration: 100,
        clientId: 'client-123',
      });
    });

    it('should use default minutes (20) when not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await POST(request);

      expect(mockReconcileRecentChanges).toHaveBeenCalledWith(20);
    });

    it('should accept valid minutes parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 60 }),
      });

      await POST(request);

      expect(mockReconcileRecentChanges).toHaveBeenCalledWith(60);
    });

    it('should reject minutes < 1', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 0 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid minutes parameter');
      expect(data.details).toContain('between 1 and 1440');
    });

    it('should reject minutes > 1440 (24 hours)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 1441 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid minutes parameter');
      expect(data.details).toContain('between 1 and 1440');
    });

    it('should reject non-number minutes', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 'twenty' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid minutes parameter');
    });

    it('should accept minutes at boundary (1)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 1 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockReconcileRecentChanges).toHaveBeenCalledWith(1);
    });

    it('should accept minutes at boundary (1440)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 1440 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockReconcileRecentChanges).toHaveBeenCalledWith(1440);
    });
  });

  describe('Reconciler Integration', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'super-admin-123',
          email: 'super@example.com',
          role: 'SUPER_ADMIN',
        },
      } as any);
    });

    it('should invoke reconcileRecentChanges with correct parameters', async () => {
      mockReconcileRecentChanges.mockResolvedValue({
        success: true,
        stage1: { recordsProcessed: 5, inserted: 2, updated: 3, errors: [] },
        stage2: { recordsProcessed: 10, updated: 4, skipped: 6, errors: [] },
        startTime: new Date(),
        endTime: new Date(),
        duration: 1500,
        clientId: 'client-123',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 30 }),
      });

      await POST(request);

      expect(mockReconcileRecentChanges).toHaveBeenCalledTimes(1);
      expect(mockReconcileRecentChanges).toHaveBeenCalledWith(30);
    });

    it('should return properly formatted response', async () => {
      const mockStartTime = new Date('2025-11-12T10:00:00Z');
      const mockEndTime = new Date('2025-11-12T10:00:15Z');

      mockReconcileRecentChanges.mockResolvedValue({
        success: true,
        stage1: { recordsProcessed: 5, inserted: 2, updated: 3, errors: [] },
        stage2: { recordsProcessed: 10, updated: 4, skipped: 6, errors: [] },
        startTime: mockStartTime,
        endTime: mockEndTime,
        duration: 15000,
        clientId: 'client-123',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        triggeredBy: 'super@example.com',
        minutes: 20,
        duration: expect.any(String),
        results: {
          stage1: {
            processed: 5,
            errors: 0,
            description: 'Airtable → PostgreSQL',
          },
          stage2: {
            updated: 4,
            skipped: 6,
            errors: 0,
            description: 'PostgreSQL → Airtable',
          },
        },
      });
    });

    it('should include error counts in response', async () => {
      mockReconcileRecentChanges.mockResolvedValue({
        success: true,
        stage1: {
          recordsProcessed: 10,
          inserted: 5,
          updated: 3,
          errors: ['Error 1', 'Error 2'],
        },
        stage2: {
          recordsProcessed: 8,
          updated: 6,
          skipped: 1,
          errors: ['Stage 2 Error'],
        },
        startTime: new Date(),
        endTime: new Date(),
        duration: 2000,
        clientId: 'client-123',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.stage1.errors).toBe(2);
      expect(data.results.stage2.errors).toBe(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'super-admin-123',
          email: 'super@example.com',
          role: 'SUPER_ADMIN',
        },
      } as any);
    });

    it('should return 500 when reconciler throws error', async () => {
      mockReconcileRecentChanges.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Delta sync failed');
      expect(data.details).toContain('Database connection failed');
    });

    it('should handle malformed JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: 'not valid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    it('should return detailed error message on failure', async () => {
      mockReconcileRecentChanges.mockRejectedValue(
        new Error('No active client found in database')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toContain('No active client found');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'super-admin-123',
          email: 'super@example.com',
          role: 'SUPER_ADMIN',
        },
      } as any);

      mockReconcileRecentChanges.mockResolvedValue({
        success: true,
        stage1: { recordsProcessed: 10, inserted: 5, updated: 5, errors: [] },
        stage2: { recordsProcessed: 8, updated: 6, skipped: 2, errors: [] },
        startTime: new Date(),
        endTime: new Date(),
        duration: 5000,
        clientId: 'client-123',
      });
    });

    it('should include triggeredBy email in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.triggeredBy).toBe('super@example.com');
    });

    it('should include minutes parameter in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 45 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.minutes).toBe(45);
    });

    it('should format duration as string with seconds', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.duration).toMatch(/^\d+(\.\d+)?s$/); // e.g., "5.0s" or "5s"
    });

    it('should include stage descriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ minutes: 20 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results.stage1.description).toBe('Airtable → PostgreSQL');
      expect(data.results.stage2.description).toBe('PostgreSQL → Airtable');
    });
  });

  describe('Timeout Handling', () => {
    it('should have maxDuration set to 300 seconds (5 minutes)', () => {
      // This test verifies the export configuration
      const routeModule = require('../../src/app/api/admin/sync/delta/route');

      expect(routeModule.maxDuration).toBe(300);
      expect(routeModule.runtime).toBe('nodejs');
      expect(routeModule.dynamic).toBe('force-dynamic');
    });
  });
});
