/**
 * Tests for POST /api/leads/[id]/remove-from-campaign - Airtable Integration
 * 
 * SOP§1.1 Step 1: These tests are written BEFORE implementation
 * These tests MUST FAIL initially - that's the Red phase of TDD
 * 
 * Contract: See docs/api-contracts/AIRTABLE-WRITE-OPERATIONS.md#contract-2
 */

import { NextRequest, NextResponse } from 'next/server';

type PostHandler = (
  request: NextRequest,
  context: { params: { id: string } }
) => Promise<NextResponse>;

const routePath = '../../../src/app/api/leads/[id]/remove-from-campaign/route';
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

describe('POST /api/leads/[id]/remove-from-campaign - Airtable Integration', () => {
  let mockAuth: jest.Mock;
  let mockGetAirtableClient: jest.Mock;
  let mockDb: {
    query: {
      leads: {
        findFirst: jest.Mock;
      };
    };
    insert: jest.Mock;
    update?: jest.Mock;
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

      const request = new NextRequest('http://localhost:3000/api/leads/test-id/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'test-lead-id',
          reason: 'Not interested',
        }),
      });

      const response = await POST(request, { params: { id: 'test-lead-id' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when user tries to remove lead from different client', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', clientId: 'client-A' },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-B', // Different client
        airtableRecordId: 'recXXXXXXXXXXXXXX',
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: 'Not interested',
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('access');
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

    it('should return 400 when reason is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          // reason missing
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('reason');
    });

    it('should return 400 when reason is too long (>500 chars)', async () => {
      const longReason = 'a'.repeat(501);

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: longReason,
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('reason');
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

    it('should update all required Airtable fields atomically', async () => {
      const reason = 'Lead requested to be removed from campaign';

      // Mock Airtable client
      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: {
          'Processing Status': 'Stopped',
          'SMS Stop': true,
          'SMS Stop Reason': reason,
          'HRQ Status': 'Completed',
        },
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
      });

      // WHEN: Removing lead from campaign
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason,
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      // THEN: Should update all fields in Airtable
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.airtableRecordId).toBe('recABCDEFGHIJKLMN');
      expect(data.updatedFields).toEqual({
        'Processing Status': 'Stopped',
        'SMS Stop': true,
        'SMS Stop Reason': reason,
        'HRQ Status': 'Completed',
      });

      // Verify Airtable was updated with correct fields
      expect(mockAirtableUpdate).toHaveBeenCalledWith(
        'Leads',
        'recABCDEFGHIJKLMN',
        {
          'Processing Status': 'Stopped',
          'SMS Stop': true,
          'SMS Stop Reason': reason,
          'HRQ Status': 'Completed',
        }
      );
    });

    it('should trigger n8n automations by updating Airtable fields', async () => {
      // This test verifies that field changes in Airtable will trigger existing n8n workflows
      // The SMS Scheduler workflow reads Processing Status = "Stopped" and skips the lead

      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: {},
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: 'Manual removal',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // Verify Processing Status was set to "Stopped"
      // This is what n8n SMS Scheduler checks
      const updateCall = mockAirtableUpdate.mock.calls[0];
      expect(updateCall[2]['Processing Status']).toBe('Stopped');
      expect(updateCall[2]['SMS Stop']).toBe(true);
    });

    it('should NOT update PostgreSQL leads table directly', async () => {
      mockGetAirtableClient.mockReturnValue({
        updateRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: {},
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: 'Not interested',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // PostgreSQL leads table should NOT be updated directly
      // It will be updated later by the sync process
      const dbUpdateCalls = mockDb.update?.mock?.calls || [];
      const leadsTableUpdate = dbUpdateCalls.find(
        call => call[0]?.table === 'leads'
      );
      expect(leadsTableUpdate).toBeUndefined();
    });
  });

  describe('Activity Logging', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', clientId: 'client-A', name: 'Test User' },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-A',
        airtableRecordId: 'recABCDEFGHIJKLMN',
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: {},
        }),
      });
    });

    it('should log removal action to activity_log table', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'activity-123' }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: 'Lead requested removal',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // Activity log should be created
      expect(mockDb.insert).toHaveBeenCalled();
      
      // Verify action type
      const insertCall = mockDb.insert.mock.results[0]?.value;
      if (insertCall?.values) {
        const valuesCall = insertCall.values.mock.calls[0];
        expect(valuesCall[0]).toMatchObject({
          userId: 'user-123',
          leadId: 'lead-123',
          action: 'LEAD_REMOVED_FROM_CAMPAIGN',
        });
      }
    });

    it('should include reason in activity log details', async () => {
      const reason = 'Lead expressed strong disinterest';

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'activity-123' }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason,
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      const insertCall = mockDb.insert.mock.results[0]?.value;
      if (insertCall?.values) {
        const valuesCall = insertCall.values.mock.calls[0];
        expect(valuesCall[0].details).toContain(reason);
      }
    });
  });

  describe('Error Handling', () => {
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

    it('should return 500 when Airtable API fails', async () => {
      mockGetAirtableClient.mockReturnValue({
        updateRecord: jest.fn().mockRejectedValue(new Error('Airtable rate limit exceeded')),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: 'Not interested',
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('AIRTABLE_ERROR');
      expect(data.error).toContain('Airtable');
    });

    it('should return 404 when lead does not exist', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leads/nonexistent/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'nonexistent',
          reason: 'Not interested',
        }),
      });

      const response = await POST(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should handle atomic updates (all fields or none)', async () => {
      // If Airtable update fails mid-way, ensure no partial updates
      // This tests transaction-like behavior

      mockGetAirtableClient.mockReturnValue({
        updateRecord: jest.fn().mockRejectedValue(new Error('Connection timeout')),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: 'Not interested',
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });

      // Should fail cleanly
      expect(response.status).toBe(500);
      
      // PostgreSQL should not be partially updated
      const dbUpdateCalls = mockDb.update?.mock?.calls || [];
      expect(dbUpdateCalls.length).toBe(0);
    });
  });

  describe('Integration with n8n Workflows', () => {
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

    it('should update fields that n8n SMS Scheduler monitors', async () => {
      // Per SOP-Workflow-SMS-Scheduler.md:
      // The scheduler queries leads where Processing Status != "Stopped"
      // Setting Processing Status = "Stopped" removes lead from queue

      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: {},
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/remove-from-campaign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          reason: 'Manual removal',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // Verify the exact fields that n8n monitors
      const updateCall = mockAirtableUpdate.mock.calls[0];
      expect(updateCall[2]).toEqual({
        'Processing Status': 'Stopped',    // n8n checks this
        'SMS Stop': true,                  // n8n checks this
        'SMS Stop Reason': 'Manual removal', // For audit
        'HRQ Status': 'Completed',         // Workflow complete
      });
    });
  });
});

