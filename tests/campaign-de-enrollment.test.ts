/**
 * Test Suite: Campaign De-Enrollment Logic
 * Purpose: Validate auto de-enrollment when leads complete campaigns
 * Part of: Campaign Manager Upgrade v2 - Phase 1
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { deEnrollCompletedLeads } from '../scripts/de-enroll-completed-leads';

const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
  ssl: false,
});

const db = drizzle(testPool, { schema });

describe('Campaign De-Enrollment Tests', () => {
  let testCampaignId: string;
  let testLeadIds: string[] = [];

  beforeEach(async () => {
    testLeadIds = [];
    // Create test campaign
    const campaign = await db.execute(sql`
      INSERT INTO campaigns (
        client_id,
        name,
        airtable_record_id,
        messages,
        is_active,
        is_paused,
        campaign_type
      ) VALUES (
        gen_random_uuid(),
        'Test Campaign',
        'test_' || gen_random_uuid(),
        jsonb_build_array(
          jsonb_build_object('step', 1, 'delayMinutes', 0, 'text', 'Message 1'),
          jsonb_build_object('step', 2, 'delayMinutes', 60, 'text', 'Message 2'),
          jsonb_build_object('step', 3, 'delayMinutes', 120, 'text', 'Message 3')
        ),
        true,
        false,
        'Custom'
      )
      RETURNING id
    `);
    testCampaignId = campaign.rows[0].id;

    // Create test leads with different states
    const leadData = [
      { position: 3, booked: false, smsStop: false }, // Completed normally
      { position: 3, booked: true, smsStop: false },  // Completed with booking
      { position: 3, booked: false, smsStop: true },  // Opted out
      { position: 2, booked: false, smsStop: false }, // Not completed yet
      { position: 1, booked: false, smsStop: false }, // Just started
    ];

    for (const data of leadData) {
      const lead = await db.execute(sql`
        INSERT INTO leads (
          client_id,
          airtable_record_id,
          first_name,
          last_name,
          email,
          campaign_link_id,
          campaign_name,
          sms_sequence_position,
          booked,
          sms_stop,
          last_message_at
        ) VALUES (
          gen_random_uuid(),
          'test_lead_' || gen_random_uuid(),
          'Test',
          'Lead',
          'test' || gen_random_uuid() || '@example.com',
          ${testCampaignId},
          'Test Campaign',
          ${data.position},
          ${data.booked},
          ${data.smsStop},
          ${data.position > 0 ? sql`NOW() - INTERVAL '1 hour'` : null}
        )
        RETURNING id
      `);
      testLeadIds.push(lead.rows[0].id);
    }
  });

  afterEach(async () => {
    // Clean up test data
    if (testLeadIds.length > 0) {
      await db.execute(sql`
        DELETE FROM leads WHERE id = ANY(${testLeadIds})
      `);
    }
    if (testCampaignId) {
      await db.execute(sql`
        DELETE FROM campaigns WHERE id = ${testCampaignId}
      `);
    }
  });

  describe('testDeEnrollAfterLastMessage', () => {
    it('should de-enroll leads who have received all messages', async () => {
      // Run de-enrollment
      const result = await deEnrollCompletedLeads({ db, pool });

      expect(result.success).toBe(true);
      expect(result.totalDeEnrolled).toBe(3); // 3 leads at position 3

      // Verify de-enrolled leads
      const deEnrolled = await db.execute(sql`
        SELECT
          id,
          campaign_link_id,
          completed_at,
          campaign_history
        FROM leads
        WHERE id = ANY(${testLeadIds.slice(0, 3)})
      `);

      for (const lead of deEnrolled.rows) {
        expect(lead.campaign_link_id).toBeNull();
        expect(lead.completed_at).not.toBeNull();
        expect(lead.campaign_history).toHaveLength(1);
        expect(lead.campaign_history[0].campaignId).toBe(testCampaignId);
      }
    });

    it('should NOT de-enroll leads still in sequence', async () => {
      await deEnrollCompletedLeads({ db, pool });

      // Verify non-completed leads still enrolled
      const stillEnrolled = await db.execute(sql`
        SELECT
          id,
          campaign_link_id,
          completed_at,
          sms_sequence_position
        FROM leads
        WHERE id = ANY(${testLeadIds.slice(3)})
      `);

      for (const lead of stillEnrolled.rows) {
        expect(lead.campaign_link_id).toBe(testCampaignId);
        expect(lead.completed_at).toBeNull();
        expect(lead.sms_sequence_position).toBeLessThan(3);
      }
    });

    it('should track correct outcome in campaign history', async () => {
      await deEnrollCompletedLeads({ db, pool });

      const leads = await db.execute(sql`
        SELECT
          id,
          campaign_history,
          booked,
          sms_stop
        FROM leads
        WHERE id = ANY(${testLeadIds.slice(0, 3)})
        ORDER BY created_at
      `);

      expect(leads.rows[0].campaign_history[0].outcome).toBe('completed');
      expect(leads.rows[1].campaign_history[0].outcome).toBe('booked');
      expect(leads.rows[2].campaign_history[0].outcome).toBe('opted_out');
    });

    it('should update campaign stats correctly', async () => {
      await deEnrollCompletedLeads({ db, pool });

      const campaign = await db.execute(sql`
        SELECT
          active_leads_count,
          completed_leads_count,
          booked_count,
          opted_out_count
        FROM campaigns
        WHERE id = ${testCampaignId}
      `);

      expect(campaign.rows[0].active_leads_count).toBe(2); // 2 still active
      expect(campaign.rows[0].completed_leads_count).toBe(3); // 3 completed
      expect(campaign.rows[0].booked_count).toBe(1); // 1 booked
      expect(campaign.rows[0].opted_out_count).toBe(1); // 1 opted out
    });
  });

  describe('Edge Cases', () => {
    it('should handle paused campaigns (skip de-enrollment)', async () => {
      // Pause the campaign
      await db.execute(sql`
        UPDATE campaigns SET is_paused = true WHERE id = ${testCampaignId}
      `);

      const result = await deEnrollCompletedLeads({ db, pool });
      expect(result.totalDeEnrolled).toBe(0);
    });

    it('should handle deactivated campaigns (skip de-enrollment)', async () => {
      // Deactivate the campaign
      await db.execute(sql`
        UPDATE campaigns
        SET is_active = false, deactivated_at = NOW()
        WHERE id = ${testCampaignId}
      `);

      const result = await deEnrollCompletedLeads({ db, pool });
      expect(result.totalDeEnrolled).toBe(0);
    });

    it('should handle campaigns with no messages array', async () => {
      // Create legacy campaign with messageTemplate only
      const legacyCampaign = await db.execute(sql`
        INSERT INTO campaigns (
          client_id,
          name,
          airtable_record_id,
          message_template,
          messages,
          is_active
        ) VALUES (
          gen_random_uuid(),
          'Legacy Campaign',
          'legacy_' || gen_random_uuid(),
          'Single message template',
          NULL,
          true
        )
        RETURNING id
      `);

      // Create lead at position 1
      await db.execute(sql`
        INSERT INTO leads (
          client_id,
          airtable_record_id,
          first_name,
          last_name,
          email,
          campaign_link_id,
          sms_sequence_position
        ) VALUES (
          gen_random_uuid(),
          'legacy_lead_' || gen_random_uuid(),
          'Legacy',
          'Lead',
          'legacy@example.com',
          ${legacyCampaign.rows[0].id},
          1
        )
      `);

      const result = await deEnrollCompletedLeads({ db, pool });
      // Should de-enroll since position 1 >= 1 (single message)
      expect(result.success).toBe(true);

      // Clean up
      await db.execute(sql`
        DELETE FROM leads WHERE campaign_link_id = ${legacyCampaign.rows[0].id}
      `);
      await db.execute(sql`
        DELETE FROM campaigns WHERE id = ${legacyCampaign.rows[0].id}
      `);
    });

    it('should append to existing campaign history', async () => {
      // Set existing history on first lead
      const existingHistory = [{
        campaignId: 'old-campaign-id',
        campaignName: 'Old Campaign',
        enrolledAt: '2024-01-01',
        completedAt: '2024-01-15',
        messagesReceived: 5,
        outcome: 'completed'
      }];

      await db.execute(sql`
        UPDATE leads
        SET campaign_history = ${JSON.stringify(existingHistory)}::jsonb
        WHERE id = ${testLeadIds[0]}
      `);

      await deEnrollCompletedLeads({ db, pool });

      const lead = await db.execute(sql`
        SELECT campaign_history FROM leads WHERE id = ${testLeadIds[0]}
      `);

      expect(lead.rows[0].campaign_history).toHaveLength(2);
      expect(lead.rows[0].campaign_history[0].campaignId).toBe('old-campaign-id');
      expect(lead.rows[0].campaign_history[1].campaignId).toBe(testCampaignId);
    });
  });

  describe('Performance & Concurrency', () => {
    it('should handle large batches efficiently', async () => {
      // Create 100 completed leads
      const largeBatch = [];
      for (let i = 0; i < 100; i++) {
        const lead = await db.execute(sql`
          INSERT INTO leads (
            client_id,
            airtable_record_id,
            first_name,
            last_name,
            email,
            campaign_link_id,
            sms_sequence_position
          ) VALUES (
            gen_random_uuid(),
            'batch_' || gen_random_uuid(),
            'Batch',
            'Lead' || ${i},
            'batch' || ${i} || '@example.com',
            ${testCampaignId},
            3
          )
          RETURNING id
        `);
        largeBatch.push(lead.rows[0].id);
      }

      const startTime = Date.now();
      const result = await deEnrollCompletedLeads({ db, pool });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.totalDeEnrolled).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

      // Clean up
      await db.execute(sql`
        DELETE FROM leads WHERE id = ANY(${largeBatch})
      `);
    });
  });

  afterAll(async () => {
    await testPool.end();
  });
});

// Export for use in other test suites
export { testPool };