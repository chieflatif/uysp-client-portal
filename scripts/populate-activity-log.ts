#!/usr/bin/env tsx
/**
 * Populate activity_log table with sample data for testing
 */

import { db } from '../src/lib/db';
import { activityLog, leads } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function populateActivityLog() {
  console.log('🔄 Populating activity_log with sample data...');

  try {
    // Get some leads to create activities for
    const sampleLeads = await db.execute(sql`
      SELECT id, client_id, first_name, last_name
      FROM leads
      WHERE client_id IS NOT NULL
      LIMIT 10
    `);

    if (sampleLeads.length === 0) {
      console.log('❌ No leads found to create activities for');
      return;
    }

    const activities = [];
    const actions = ['SMS_SENT', 'LEAD_CLAIMED', 'LEAD_UNCLAIMED', 'NOTE_ADDED', 'STATUS_CHANGED', 'CAMPAIGN_ENROLLED'];

    for (const lead of sampleLeads) {
      // Create 3-5 activities per lead
      const numActivities = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < numActivities; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Random time in last 30 days
        const action = actions[Math.floor(Math.random() * actions.length)];

        activities.push({
          leadId: lead.id,
          clientId: lead.client_id,
          userId: 'system',
          action: action,
          details: getActionDetails(action, lead),
          metadata: getActionMetadata(action),
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Insert all activities
    if (activities.length > 0) {
      await db.insert(activityLog).values(activities);
      console.log(`✅ Created ${activities.length} activity log entries`);
    }

    // Show summary
    const summary = await db.execute(sql`
      SELECT
        action,
        COUNT(*) as count
      FROM activity_log
      GROUP BY action
      ORDER BY count DESC
    `);

    console.log('\n📊 Activity Summary:');
    summary.forEach((row: any) => {
      console.log(`  ${row.action}: ${row.count}`);
    });

    const recentCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM activity_log
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    console.log(`\n⏰ Activities in last 7 days: ${recentCount[0].count}`);

  } catch (error) {
    console.error('❌ Error populating activity log:', error);
  }
}

function getActionDetails(action: string, lead: any): string {
  const details: Record<string, string> = {
    SMS_SENT: `Sent SMS message #1 to ${lead.first_name} ${lead.last_name}`,
    LEAD_CLAIMED: `Lead claimed by agent`,
    LEAD_UNCLAIMED: `Lead unclaimed and returned to pool`,
    NOTE_ADDED: `Added note: "Attempted contact, no response"`,
    STATUS_CHANGED: `Status changed from New to Contacted`,
    CAMPAIGN_ENROLLED: `Enrolled in Make $500K-$1M Training campaign`,
  };
  return details[action] || 'Activity performed';
}

function getActionMetadata(action: string): any {
  const metadata: Record<string, any> = {
    SMS_SENT: { messageNumber: 1, campaign: 'Make $500K Training' },
    LEAD_CLAIMED: { claimedBy: 'agent@example.com' },
    LEAD_UNCLAIMED: { reason: 'No response after 48 hours' },
    NOTE_ADDED: { noteType: 'General' },
    STATUS_CHANGED: { from: 'New', to: 'Contacted' },
    CAMPAIGN_ENROLLED: { campaignId: 'campaign-123', campaignName: 'Make $500K Training' },
  };
  return metadata[action] || {};
}

// Execute
populateActivityLog().catch(console.error);