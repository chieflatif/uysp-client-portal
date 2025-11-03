/**
 * Tests for POST /api/leads/[id]/status - Airtable Integration
 * 
 * SOP§1.1 Step 1: These tests are written BEFORE implementation
 * These tests MUST FAIL initially - that's the Red phase of TDD
 * 
 * Contract: See docs/api-contracts/AIRTABLE-WRITE-OPERATIONS.md#contract-3
 */

import { NextRequest, NextResponse } from 'next/server';

type PostHandler = (
  request: NextRequest,
  context: { params: { id: string } }
) => Promise<NextResponse>;

const routePath = '../../../src/app/api/leads/[id]/status/route';
let POST: PostHandler;

// Mock dependencies using relative paths
jest.mock('../../../src/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('../../../src/lib/airtable/client', () => ({
  getAirtableClient: jest.fn(),
}));

jest.mock('../../../src/lib/db', () => ({
  db: {
    query: {
      leads: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(),
  },
}));

describe('POST /api/leads/[id]/status - Airtable Integration', () => {
  let mockAuth: jest.Mock;
  let mockGetAirtableClient: jest.Mock;
  let mockDb: {
    query: {
      leads: {
        findFirst: jest.Mock;
      };
    };
    insert: jest.Mock;
  };

  beforeAll(async () => {
    const authModule = await import('../../../src/lib/auth');
    const airtableModule = await import('../../../src/lib/airtable/client');
    const dbModule = await import('../../../src/lib/db');
    
    mockAuth = authModule.auth as jest.Mock;
    mockGetAirtableClient = airtableModule.getAirtableClient as jest.Mock;
    mockDb = dbModule.db;

    const routeModule = await import(routePath);
    POST = routeModule.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leads/test-id/status', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'test-lead-id',
          status: 'Manual Process',
        }),
      });

      const response = await POST(request, { params: { id: 'test-lead-id' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', clientId: 'client-A', name: 'Test User' },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-A',
        airtableRecordId: 'recABCDEFGHIJKLMN',
      });
    });

    it('should return 400 when status is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/status', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          // status missing
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('status');
    });

    it('should return 400 when status is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/status', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          status: 'InvalidStatus', // Not in enum
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('status');
      expect(data.error).toContain('Qualified, Archive, Review, Manual Process');
    });

    it('should accept all valid HRQ Status values', async () => {
      const validStatuses = ['Qualified', 'Archive', 'Review', 'Manual Process'];

      mockGetAirtableClient.mockReturnValue({
        updateRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: {},
        }),
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { 'HRQ Status': 'Qualified' },
        }),
      });

      for (const status of validStatuses) {
        const request = new NextRequest('http://localhost:3000/api/leads/lead-123/status', {
          method: 'POST',
          body: JSON.stringify({
            leadId: 'lead-123',
            status,
          }),
        });

        const response = await POST(request, { params: { id: 'lead-123' } });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Airtable Integration', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', clientId: 'client-A', name: 'Test User' },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-A',
        airtableRecordId: 'recABCDEFGHIJKLMN',
      });
    });

    it('should update HRQ Status field in Airtable', async () => {
      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: { 'HRQ Status': 'Manual Process' },
      });

      const mockAirtableGet = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: { 'HRQ Status': 'Qualified' },
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
        getRecord: mockAirtableGet,
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/status', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          status: 'Manual Process',
          reason: 'Team member taking over',
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.previousStatus).toBe('Qualified');
      expect(data.newStatus).toBe('Manual Process');

      // Verify Airtable was updated
      expect(mockAirtableUpdate).toHaveBeenCalledWith(
        'Leads',
        'recABCDEFGHIJKLMN',
        expect.objectContaining({
          'HRQ Status': 'Manual Process',
        })
      );
    });

    it('should also update Processing Status when changing to Manual Process', async () => {
      // Per UYSP docs: Manual Process should stop automation
      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: {},
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { 'HRQ Status': 'Qualified' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/status', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          status: 'Manual Process',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // Should update both HRQ Status AND Processing Status
      const updateCall = mockAirtableUpdate.mock.calls[0];
      expect(updateCall[2]).toEqual({
        'HRQ Status': 'Manual Process',
        'Processing Status': 'Stopped', // Pauses automation
      });
    });

    it('should update HRQ Reason field when reason is provided', async () => {
      const reason = 'Lead requires personal attention from sales team';
      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: {},
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { 'HRQ Status': 'Qualified' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/status', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          status: 'Review',
          reason,
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      const updateCall = mockAirtableUpdate.mock.calls[0];
      expect(updateCall[2]['HRQ Reason']).toBe(reason);
    });
  });
});

