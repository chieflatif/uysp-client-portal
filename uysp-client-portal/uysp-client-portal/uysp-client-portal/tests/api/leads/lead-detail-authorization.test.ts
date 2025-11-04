/**
 * Security Tests for GET /api/leads/[id]
 *
 * CRITICAL BUG FIX: Multi-Tenancy Authorization Bypass
 *
 * Bug: CLIENT_ADMIN from Client A could view leads from Client B
 * Root Cause: Line 32-33 treats CLIENT_ADMIN as SUPER_ADMIN
 *
 * This test MUST FAIL before the fix (Red phase)
 * This test MUST PASS after the fix (Green phase)
 */

import { NextRequest, NextResponse } from 'next/server';

type GetHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<NextResponse>;

const routePath = '../../../src/app/api/leads/[id]/route';
let GET: GetHandler;

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock database
jest.mock('../../../src/lib/db', () => ({
  db: {
    query: {
      leads: {
        findFirst: jest.fn(),
      },
    },
  },
}));

describe('GET /api/leads/[id] - Multi-Tenancy Security', () => {
  let mockGetServerSession: jest.Mock;
  let mockDb: {
    query: {
      leads: {
        findFirst: jest.Mock;
      };
    };
  };

  beforeAll(async () => {
    const nextAuthModule = await import('next-auth/next');
    const dbModule = await import('../../../src/lib/db');

    mockGetServerSession = nextAuthModule.getServerSession as jest.Mock;
    mockDb = dbModule.db;

    const routeModule = await import(routePath);
    GET = routeModule.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRITICAL: CLIENT_ADMIN Cross-Tenant Access Prevention', () => {
    it('should DENY CLIENT_ADMIN from accessing leads in OTHER clients', async () => {
      // Setup: CLIENT_ADMIN from Client A trying to access lead from Client B
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-user-id',
          email: 'admin@clientA.com',
          role: 'CLIENT_ADMIN',
          clientId: 'client-a-uuid', // Admin belongs to Client A
        },
      });

      // Lead belongs to Client B
      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-b-uuid', // Lead belongs to Client B
        companyName: 'Company XYZ',
        email: 'contact@xyz.com',
      });

      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/leads/lead-123',
      } as NextRequest;

      const response = await GET(request, { params: Promise.resolve({ id: 'lead-123' }) });
      const data = await response.json();

      // MUST return 403 Forbidden
      expect(response.status).toBe(403);
      expect(data.error).toContain('do not have access');

      console.log('✅ TEST PASSED: CLIENT_ADMIN cannot access cross-tenant leads');
    });

    it('should ALLOW CLIENT_ADMIN to access leads in THEIR OWN client', async () => {
      // Setup: CLIENT_ADMIN from Client A accessing lead from Client A
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-user-id',
          email: 'admin@clientA.com',
          role: 'CLIENT_ADMIN',
          clientId: 'client-a-uuid',
        },
      });

      // Lead belongs to same Client A
      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-a-uuid', // Same client
        companyName: 'Company ABC',
        email: 'contact@abc.com',
      });

      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/leads/lead-123',
      } as NextRequest;

      const response = await GET(request, { params: Promise.resolve({ id: 'lead-123' }) });
      const data = await response.json();

      // MUST return 200 OK
      expect(response.status).toBe(200);
      expect(data.lead).toBeDefined();
      expect(data.lead.id).toBe('lead-123');

      console.log('✅ TEST PASSED: CLIENT_ADMIN can access own client leads');
    });

    it('should ALLOW SUPER_ADMIN to access ANY lead regardless of client', async () => {
      // Setup: SUPER_ADMIN accessing lead from any client
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'superadmin-id',
          email: 'admin@uysp.com',
          role: 'SUPER_ADMIN',
          clientId: null, // SUPER_ADMIN has no client
        },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-456',
        clientId: 'client-b-uuid',
        companyName: 'Company XYZ',
        email: 'contact@xyz.com',
      });

      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/leads/lead-456',
      } as NextRequest;

      const response = await GET(request, { params: Promise.resolve({ id: 'lead-456' }) });
      const data = await response.json();

      // MUST return 200 OK
      expect(response.status).toBe(200);
      expect(data.lead).toBeDefined();

      console.log('✅ TEST PASSED: SUPER_ADMIN can access any lead');
    });

    it('should DENY CLIENT_USER from accessing leads in OTHER clients', async () => {
      // Setup: CLIENT_USER from Client A trying to access lead from Client B
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@clientA.com',
          role: 'CLIENT_USER',
          clientId: 'client-a-uuid',
        },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-789',
        clientId: 'client-b-uuid', // Different client
        companyName: 'Company DEF',
        email: 'contact@def.com',
      });

      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/leads/lead-789',
      } as NextRequest;

      const response = await GET(request, { params: Promise.resolve({ id: 'lead-789' }) });
      const data = await response.json();

      // MUST return 403 Forbidden
      expect(response.status).toBe(403);
      expect(data.error).toContain('do not have access');

      console.log('✅ TEST PASSED: CLIENT_USER cannot access cross-tenant leads');
    });

    it('should return 404 when lead does not exist', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-user-id',
          email: 'admin@clientA.com',
          role: 'CLIENT_ADMIN',
          clientId: 'client-a-uuid',
        },
      });

      // Lead not found
      mockDb.query.leads.findFirst.mockResolvedValue(null);

      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/leads/nonexistent',
      } as NextRequest;

      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/leads/lead-123',
      } as NextRequest;

      const response = await GET(request, { params: Promise.resolve({ id: 'lead-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
