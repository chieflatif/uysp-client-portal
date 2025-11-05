/**
 * Campaign Auto-Create API Integration Tests
 * Phase 2: Campaign Manager Upgrade V2
 *
 * Tests the n8n-triggered auto-create endpoint for campaign creation
 * with rate limiting, duplicate detection, and proper error handling
 *
 * Endpoint: POST /api/admin/campaigns/auto-create
 * Auth: API Key (AUTOMATION_API_KEY)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db } from '@/lib/db';
import { campaigns, clients, rateLimits } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

// Test constants
const TEST_CLIENT_ID = 'test-client-autocreate-' + Date.now();
const TEST_API_KEY = process.env.AUTOMATION_API_KEY || 'test-api-key';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Test data
const validCampaignData = {
  clientId: TEST_CLIENT_ID,
  name: 'Auto Campaign ' + Date.now(),
  campaignType: 'Standard' as const,
  kajabiTags: ['tag1', 'tag2'],
  enrollmentCap: 100,
};

describe('Campaign Auto-Create API Integration Tests', () => {
  beforeAll(async () => {
    // Create test client
    await db.insert(clients).values({
      id: TEST_CLIENT_ID,
      name: 'Test Client Auto-Create',
      isActive: true,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(campaigns).where(eq(campaigns.clientId, TEST_CLIENT_ID));
    await db.delete(clients).where(eq(clients.id, TEST_CLIENT_ID));
    await db.delete(rateLimits).where(eq(rateLimits.identifier, 'auto-create-api'));
  });

  beforeEach(async () => {
    // Clean up campaigns before each test
    await db.delete(campaigns).where(eq(campaigns.clientId, TEST_CLIENT_ID));

    // Clean up rate limit entries older than 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    await db.delete(rateLimits).where(
      and(
        eq(rateLimits.identifier, 'auto-create-api'),
        gte(rateLimits.expiresAt, oneMinuteAgo)
      )
    );
  });

  describe('Successful Campaign Creation', () => {
    it('should create campaign with valid API key and data', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify(validCampaignData),
      });

      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.campaign).toBeDefined();
      expect(json.data.campaign.name).toBe(validCampaignData.name);
      expect(json.data.campaign.clientId).toBe(TEST_CLIENT_ID);
      expect(json.data.campaign.campaignType).toBe('Standard');
      expect(json.data.campaign.isActive).toBe(true);
      expect(json.data.campaign.isPaused).toBe(false);
      expect(json.data.message).toContain('created successfully');
    });

    it('should auto-generate FormID in correct format', async () => {
      const campaignName = 'Test FormID ' + Date.now();
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          name: campaignName,
        }),
      });

      const json = await response.json();
      expect(json.data.campaign.formId).toBeDefined();

      // FormID format: campaign_type_timestamp
      const formIdPattern = /^[a-z_]+_\d+$/;
      expect(json.data.campaign.formId).toMatch(formIdPattern);
    });

    it('should initialize campaign with default v2 fields', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify(validCampaignData),
      });

      const json = await response.json();
      const campaign = json.data.campaign;

      // Check v2 unified model fields
      expect(campaign.isActive).toBe(true);
      expect(campaign.activeLeadsCount).toBe(0);
      expect(campaign.completedLeadsCount).toBe(0);
      expect(campaign.optedOutCount).toBe(0);
      expect(campaign.bookedCount).toBe(0);
      expect(campaign.totalLeads).toBe(0);
      expect(campaign.deactivatedAt).toBeNull();
      expect(campaign.lastEnrollmentAt).toBeNull();
    });

    it('should store kajabi_tags as array', async () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          kajabiTags: tags,
        }),
      });

      const json = await response.json();
      expect(Array.isArray(json.data.campaign.kajabiTags)).toBe(true);
      expect(json.data.campaign.kajabiTags).toEqual(tags);
    });

    it('should respect enrollment_cap when provided', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          enrollmentCap: 250,
        }),
      });

      const json = await response.json();
      expect(json.data.campaign.enrollmentCap).toBe(250);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject request without API key (401)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validCampaignData),
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should reject request with invalid API key (401)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'invalid-key-12345',
        },
        body: JSON.stringify(validCampaignData),
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit (10 requests per minute)', async () => {
      const requests: Promise<Response>[] = [];

      // Send 11 requests rapidly (limit is 10)
      for (let i = 0; i < 11; i++) {
        requests.push(
          fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': TEST_API_KEY,
            },
            body: JSON.stringify({
              ...validCampaignData,
              name: `Campaign ${i} ${Date.now()}`,
            }),
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      // At least one should be rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Check rate limit response format
      const limitedResponse = await rateLimitedResponses[0].json();
      expect(limitedResponse.error).toBe('Rate Limit Exceeded');
      expect(limitedResponse.message).toContain('Too many requests');
    }, 15000); // Increase timeout for this test

    it('should include Retry-After header when rate limited', async () => {
      // Hit rate limit
      const requests: Promise<Response>[] = [];
      for (let i = 0; i < 11; i++) {
        requests.push(
          fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': TEST_API_KEY,
            },
            body: JSON.stringify({
              ...validCampaignData,
              name: `Campaign ${i} ${Date.now()}`,
            }),
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      if (rateLimitedResponse) {
        const retryAfter = rateLimitedResponse.headers.get('Retry-After');
        expect(retryAfter).toBeTruthy();
        expect(parseInt(retryAfter || '0')).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe('Duplicate Detection', () => {
    it('should prevent duplicate campaign names for same client (409)', async () => {
      const campaignName = 'Duplicate Test ' + Date.now();

      // Create first campaign
      const response1 = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          name: campaignName,
        }),
      });

      expect(response1.status).toBe(201);

      // Attempt to create duplicate
      const response2 = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          name: campaignName,
        }),
      });

      expect(response2.status).toBe(409);
      const json = await response2.json();
      expect(json.error).toBe('Conflict');
      expect(json.message).toContain('already exists');
    });

    it('should allow same campaign name for different clients', async () => {
      // Create second test client
      const secondClientId = 'test-client-2-' + Date.now();
      await db.insert(clients).values({
        id: secondClientId,
        name: 'Test Client 2',
        isActive: true,
      });

      const sharedName = 'Shared Campaign Name ' + Date.now();

      // Create campaign for first client
      const response1 = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          clientId: TEST_CLIENT_ID,
          name: sharedName,
        }),
      });

      expect(response1.status).toBe(201);

      // Create campaign with same name for second client (should succeed)
      const response2 = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          clientId: secondClientId,
          name: sharedName,
        }),
      });

      expect(response2.status).toBe(201);

      // Cleanup
      await db.delete(campaigns).where(eq(campaigns.clientId, secondClientId));
      await db.delete(clients).where(eq(clients.id, secondClientId));
    });
  });

  describe('Input Validation', () => {
    it('should reject missing clientId (400)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          name: 'Test Campaign',
          campaignType: 'Standard',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation Error');
    });

    it('should reject missing campaign name (400)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          clientId: TEST_CLIENT_ID,
          campaignType: 'Standard',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation Error');
    });

    it('should reject invalid campaign type (400)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          campaignType: 'InvalidType',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation Error');
    });

    it('should reject non-existent clientId (404)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          clientId: 'non-existent-client-id',
        }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Not Found');
      expect(json.message).toContain('Client not found');
    });

    it('should reject invalid enrollmentCap (400)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          enrollmentCap: -50, // Negative not allowed
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should handle empty kajabi tags array', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          kajabiTags: [],
        }),
      });

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.data.campaign.kajabiTags).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON (400)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: '{invalid json',
      });

      expect(response.status).toBe(400);
    });

    it('should include timestamp in all responses', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify(validCampaignData),
      });

      const json = await response.json();
      expect(json.timestamp).toBeDefined();
      expect(new Date(json.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should return structured error response on database failure', async () => {
      // Try to create campaign with invalid UUID format for clientId
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify({
          ...validCampaignData,
          clientId: 'not-a-uuid',
        }),
      });

      expect([400, 500]).toContain(response.status);
      const json = await response.json();
      expect(json.error).toBeDefined();
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should return standardized success response format', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY,
        },
        body: JSON.stringify(validCampaignData),
      });

      const json = await response.json();

      // Check response structure
      expect(json.data).toBeDefined();
      expect(json.data.campaign).toBeDefined();
      expect(json.message).toBeDefined();
      expect(json.timestamp).toBeDefined();

      // Check campaign object completeness
      const campaign = json.data.campaign;
      expect(campaign.id).toBeDefined();
      expect(campaign.clientId).toBe(TEST_CLIENT_ID);
      expect(campaign.name).toBe(validCampaignData.name);
      expect(campaign.createdAt).toBeDefined();
      expect(campaign.updatedAt).toBeDefined();
    });

    it('should return standardized error response format', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/campaigns/auto-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Missing API key
        },
        body: JSON.stringify(validCampaignData),
      });

      const json = await response.json();

      // Check error response structure
      expect(json.error).toBeDefined();
      expect(json.message).toBeDefined();
      expect(json.timestamp).toBeDefined();
    });
  });
});
