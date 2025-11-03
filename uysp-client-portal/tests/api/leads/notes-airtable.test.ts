/**
 * Tests for POST /api/leads/[id]/notes - Airtable Integration
 * 
 * SOP§1.1 Step 1: These tests are written BEFORE implementation
 * These tests MUST FAIL initially - that's the Red phase of TDD
 * 
 * Contract: See docs/api-contracts/AIRTABLE-WRITE-OPERATIONS.md#contract-1
 */

import { NextRequest, NextResponse } from 'next/server';

// Type for the POST handler
type PostHandler = (
  request: NextRequest,
  context: { params: { id: string } }
) => Promise<NextResponse>;

// Import route handler directly using relative path to avoid Jest module resolution issues
const routePath = '../../../src/app/api/leads/[id]/notes/route';
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

describe('POST /api/leads/[id]/notes - Airtable Integration', () => {
  // Use dynamic imports instead of require for TypeScript
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
    // Import mocked modules using relative paths
    const authModule = await import('../../../src/lib/auth');
    const airtableModule = await import('../../../src/lib/airtable/client');
    const dbModule = await import('../../../src/lib/db');
    
    mockAuth = authModule.auth as jest.Mock;
    mockGetAirtableClient = airtableModule.getAirtableClient as jest.Mock;
    mockDb = dbModule.db;

    // Dynamically import the route handler after mocks are set up
    const routeModule = await import(routePath);
    POST = routeModule.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN: No authenticated session
      mockAuth.mockResolvedValue(null);

      // WHEN: Attempting to add a note
      const request = new NextRequest('http://localhost:3000/api/leads/test-id/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'test-lead-id',
          content: 'Test note',
          type: 'General',
        }),
      });

      const response = await POST(request, { params: { id: 'test-lead-id' } });
      const data = await response.json();

      // THEN: Should return 401 Unauthorized
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when user tries to access lead from different client', async () => {
      // GIVEN: User authenticated but lead belongs to different client
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', clientId: 'client-A' },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-B', // Different client!
        airtableRecordId: 'recXXXXXXXXXXXXXX',
      });

      // WHEN: Attempting to add a note
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: 'Test note',
          type: 'General',
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      // THEN: Should return 403 Forbidden
      expect(response.status).toBe(403);
      expect(data.error).toContain('access');
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      // Setup valid auth for these tests
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', clientId: 'client-A', name: 'Test User' },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-A',
        airtableRecordId: 'recXXXXXXXXXXXXXX',
      });
    });

    it('should return 400 when content is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          type: 'General',
          // content missing
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('content');
    });

    it('should return 400 when content is too long (>5000 chars)', async () => {
      const longContent = 'a'.repeat(5001);

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: longContent,
          type: 'General',
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('content');
    });

    it('should return 400 when type is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: 'Test note',
          type: 'InvalidType', // Not in enum
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('type');
    });
  });

  describe('Airtable Integration', () => {
    beforeEach(() => {
      // Setup valid auth and lead
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', clientId: 'client-A', name: 'Test User' },
      });

      mockDb.query.leads.findFirst.mockResolvedValue({
        id: 'lead-123',
        clientId: 'client-A',
        airtableRecordId: 'recABCDEFGHIJKLMN',
      });
    });

    it('should write note to Airtable Notes field (not PostgreSQL)', async () => {
      // GIVEN: Valid request data
      const noteContent = 'Called client, discussed requirements';
      const noteType = 'Call';

      // Mock Airtable client
      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: {
          Notes: '[Call] 2025-10-20T10:30:00Z - Test User:\nCalled client, discussed requirements',
        },
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: {
            Notes: 'Existing notes here',
          },
        }),
      });

      // WHEN: Adding a note
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: noteContent,
          type: noteType,
        }),
      });

      const response = await POST(request, { params: { id: 'lead-123' } });
      const data = await response.json();

      // THEN: Should update Airtable (NOT PostgreSQL notes table)
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.airtableRecordId).toBe('recABCDEFGHIJKLMN');
      expect(mockAirtableUpdate).toHaveBeenCalledWith(
        'Leads',
        'recABCDEFGHIJKLMN',
        expect.objectContaining({
          Notes: expect.stringContaining(noteContent),
        })
      );

      // CRITICAL: PostgreSQL notes table should NOT be used
      expect(mockDb.insert).not.toHaveBeenCalledWith(
        expect.objectContaining({ table: 'notes' })
      );
    });

    it('should append note with proper format to existing Airtable notes', async () => {
      const existingNotes = '[General] 2025-10-19 - Previous User:\nOld note content';
      const newNoteContent = 'Follow-up scheduled for next week';

      // Mock Airtable client
      const mockAirtableUpdate = jest.fn().mockResolvedValue({
        id: 'recABCDEFGHIJKLMN',
        fields: { Notes: 'updated' },
      });

      mockGetAirtableClient.mockReturnValue({
        updateRecord: mockAirtableUpdate,
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { Notes: existingNotes },
        }),
      });

      // WHEN: Adding a new note
      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: newNoteContent,
          type: 'Email',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // THEN: Should append with proper format
      expect(mockAirtableUpdate).toHaveBeenCalledWith(
        'Leads',
        'recABCDEFGHIJKLMN',
        expect.objectContaining({
          Notes: expect.stringMatching(
            new RegExp(
              `${existingNotes.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\[Email\\].*Test User.*${newNoteContent}`,
              's'
            )
          ),
        })
      );
    });

    it('should sanitize content to prevent XSS', async () => {
      const maliciousContent = '<script>alert("XSS")</script>Important note';

      mockGetAirtableClient.mockReturnValue({
        updateRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { Notes: 'updated' },
        }),
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { Notes: '' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: maliciousContent,
          type: 'General',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // Content should be sanitized (no script tags)
      const updateCall = mockGetAirtableClient().updateRecord.mock.calls[0];
      const updatedNotes = updateCall[2].Notes;
      expect(updatedNotes).not.toContain('<script>');
      expect(updatedNotes).toContain('Important note');
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
          fields: { Notes: 'updated' },
        }),
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { Notes: '' },
        }),
      });
    });

    it('should log note creation to activity_log table', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'activity-123' }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: 'Test note',
          type: 'Call',
        }),
      });

      await POST(request, { params: { id: 'lead-123' } });

      // Activity log should be created
      expect(mockDb.insert).toHaveBeenCalled();
      const insertCall = mockDb.insert.mock.calls.find(
        call => call[0]?.constructor?.name === 'activity_log'
      );
      expect(insertCall).toBeDefined();
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
      // Mock Airtable error
      mockGetAirtableClient.mockReturnValue({
        updateRecord: jest.fn().mockRejectedValue(new Error('Airtable API error')),
        getRecord: jest.fn().mockResolvedValue({
          id: 'recABCDEFGHIJKLMN',
          fields: { Notes: '' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/leads/lead-123/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-123',
          content: 'Test note',
          type: 'General',
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

      const request = new NextRequest('http://localhost:3000/api/leads/nonexistent/notes', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'nonexistent',
          content: 'Test note',
          type: 'General',
        }),
      });

      const response = await POST(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });
});

