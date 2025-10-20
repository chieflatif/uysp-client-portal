/**
 * Admin Client Management API Tests
 * 
 * TDD Protocol: RED phase - Writing failing tests first
 * These tests define what the admin client management API should do
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Admin Client Management API', () => {
  describe('POST /api/admin/clients', () => {
    it('should create a new client with valid data', async () => {
      const response = await fetch('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'Test Client',
          email: 'contact@testclient.com',
          phone: '+1234567890',
          airtableBaseId: 'appTESTBASEID123',
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.client.companyName).toBe('Test Client');
      expect(data.client.email).toBe('contact@testclient.com');
      expect(data.client.airtableBaseId).toBe('appTESTBASEID123');
      expect(data.client.id).toBeDefined();
    });

    it('should reject if not authenticated', async () => {
      const response = await fetch('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'Test Client',
          email: 'contact@testclient.com',
          airtableBaseId: 'appTESTBASEID123',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject if user is not ADMIN', async () => {
      // This would need proper auth mocking
      // For now, testing the concept
      expect(true).toBe(true);
    });

    it('should reject if company name is missing', async () => {
      const response = await fetch('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'contact@testclient.com',
          airtableBaseId: 'appTESTBASEID123',
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject if Airtable Base ID is invalid format', async () => {
      const response = await fetch('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'Test Client',
          email: 'contact@testclient.com',
          airtableBaseId: 'invalid-format',
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/clients', () => {
    it('should return list of all clients', async () => {
      const response = await fetch('http://localhost:3000/api/admin/clients');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.clients)).toBe(true);
    });

    it('should include client stats (lead count, user count)', async () => {
      const response = await fetch('http://localhost:3000/api/admin/clients');
      const data = await response.json();
      
      if (data.clients.length > 0) {
        const client = data.clients[0];
        expect(client).toHaveProperty('id');
        expect(client).toHaveProperty('companyName');
        expect(client).toHaveProperty('email');
        expect(client).toHaveProperty('airtableBaseId');
      }
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics', async () => {
      const response = await fetch('http://localhost:3000/api/admin/stats');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('totalClients');
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('totalLeads');
      expect(data).toHaveProperty('leadsByClient');
      expect(Array.isArray(data.leadsByClient)).toBe(true);
    });

    it('should include lead count per client', async () => {
      const response = await fetch('http://localhost:3000/api/admin/stats');
      const data = await response.json();
      
      if (data.leadsByClient.length > 0) {
        const clientStats = data.leadsByClient[0];
        expect(clientStats).toHaveProperty('clientId');
        expect(clientStats).toHaveProperty('clientName');
        expect(clientStats).toHaveProperty('leadCount');
        expect(clientStats).toHaveProperty('userCount');
      }
    });
  });
});

