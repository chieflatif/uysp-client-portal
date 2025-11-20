#!/usr/bin/env node
/**
 * De-Enrollment Script for Completed Leads
 *
 * Purpose: Automatically de-enroll leads who have completed their campaign sequence
 * Usage: Can be called from n8n workflow or run as a cron job
 *
 * Part of: Campaign Manager Upgrade v2 - Phase 1
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

// Database connection
const defaultPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const defaultDb = drizzle(defaultPool, { schema });

interface LeadToDeEnroll {
  id: string;
  firstName: string;
  lastName: string;
  campaignLinkId: string;
  campaignName: string;
  smsSequencePosition: number;
  lastMessageAt: Date;
  booked: boolean;
  smsStop: boolean;
}

interface Campaign {
  id: string;
  name: string;
  messages: any;
}

/**
 * Main de-enrollment function
 * Finds leads who have completed their campaign and de-enrolls them
 */
async function deEnrollCompletedLeads(overrides?: { db?: typeof defaultDb; pool?: Pool }) {
  const activeDb = overrides?.db ?? defaultDb;
  const activePool = overrides?.pool ?? defaultPool;
  const shouldClosePool = !overrides?.db && !overrides?.pool;

  console.log('🔄 Starting de-enrollment check...');

  try {
    // Step 1: Find campaigns and their message counts
    const campaigns = await activeDb.execute<Campaign>(sql`
      SELECT
        id,
        name,
        messages,
        COALESCE(jsonb_array_length(messages), 1) as message_count
      FROM campaigns
      WHERE is_active = true
        AND is_paused = false
    `);

    console.log(`📊 Found ${campaigns.rows.length} active campaigns`);

    // Step 2: For each campaign, find completed leads
    let totalDeEnrolled = 0;

    for (const campaign of campaigns.rows) {
      const messageCount = campaign.messages ?
        (Array.isArray(campaign.messages) ? campaign.messages.length : 1) : 1;

      // Find leads who have received all messages in this campaign
      const completedLeads = await activeDb.execute<LeadToDeEnroll>(sql`
        SELECT
          id,
          first_name,
          last_name,
          campaign_link_id,
          campaign_name,
          sms_sequence_position,
          last_message_at,
          booked,
          sms_stop,
          created_at
        FROM leads
        WHERE campaign_link_id = ${campaign.id}
          AND sms_sequence_position >= ${messageCount}
          AND completed_at IS NULL
          AND is_active = true
      `);

      if (completedLeads.rows.length > 0) {
        console.log(`\n📌 Campaign "${campaign.name}": Found ${completedLeads.rows.length} leads to de-enroll`);

        // Step 3: De-enroll each lead
        for (const lead of completedLeads.rows) {
          // Determine outcome
          let outcome = 'completed';
          if (lead.booked) outcome = 'booked';
          else if (lead.smsStop) outcome = 'opted_out';

          // Build campaign history entry
          const historyEntry = {
            campaignId: campaign.id,
            campaignName: campaign.name,
            enrolledAt: lead.created_at,
            completedAt: new Date(),
            messagesReceived: lead.smsSequencePosition,
            outcome: outcome
          };

          // Update lead: de-enroll and add to history
          await activeDb.execute(sql`
            UPDATE leads
            SET
              campaign_link_id = NULL,
              campaign_name = NULL,
              completed_at = NOW(),
              campaign_history = campaign_history || ${JSON.stringify([historyEntry])}::jsonb,
              updated_at = NOW()
            WHERE id = ${lead.id}
          `);

          console.log(`  ✅ De-enrolled: ${lead.firstName} ${lead.lastName} (${outcome})`);
          totalDeEnrolled++;
        }

        // Step 4: Update campaign stats
        await activeDb.execute(sql`
          UPDATE campaigns
          SET
            active_leads_count = (
              SELECT COUNT(*) FROM leads
              WHERE campaign_link_id = ${campaign.id}
                AND completed_at IS NULL
            ),
            completed_leads_count = completed_leads_count + ${completedLeads.rows.length},
            booked_count = booked_count + ${completedLeads.rows.filter(l => l.booked).length},
            opted_out_count = opted_out_count + ${completedLeads.rows.filter(l => l.smsStop).length},
            updated_at = NOW()
          WHERE id = ${campaign.id}
        `);
      }
    }

    // Step 5: Log activity
    if (totalDeEnrolled > 0) {
      await activeDb.execute(sql`
        INSERT INTO activity_log (user_id, action, details, ip_address)
        VALUES (
          NULL,
          'CAMPAIGN_DE_ENROLLMENT',
          ${JSON.stringify({
            timestamp: new Date(),
            totalDeEnrolled,
            source: 'automated_script'
          })}::jsonb,
          '127.0.0.1'
        )
      `);
    }

    console.log(`\n✨ De-enrollment complete: ${totalDeEnrolled} leads de-enrolled`);

    // Return results for n8n integration
    return {
      success: true,
      totalDeEnrolled,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ De-enrollment error:', error);

    // Log error
    await activeDb.execute(sql`
      INSERT INTO activity_log (user_id, action, details, ip_address)
      VALUES (
        NULL,
        'CAMPAIGN_DE_ENROLLMENT_ERROR',
        ${JSON.stringify({
          timestamp: new Date(),
          error: error.message,
          stack: error.stack
        })}::jsonb,
        '127.0.0.1'
      )
    `);

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    if (shouldClosePool) {
      await activePool.end();
    }
  }
}

// Execute if called directly (can also be imported for n8n)
if (require.main === module) {
  deEnrollCompletedLeads()
    .then(result => {
      console.log('\n📋 Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { deEnrollCompletedLeads };