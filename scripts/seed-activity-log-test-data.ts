/**
 * Test Data Seeder for Mini-CRM Activity Logging
 *
 * This script seeds the lead_activity_log table with test data for Week 1 testing.
 * It creates 15 diverse test events to verify all API endpoints work correctly.
 *
 * Usage: npx tsx scripts/seed-activity-log-test-data.ts
 *
 * Approval Document: MINI-CRM-WEEK-1-APPROVAL.md Recommendation #2
 */

import { db } from '../src/lib/db';
import { leadActivityLog, leads } from '../src/lib/db/schema';
import { EVENT_TYPES, EVENT_CATEGORIES } from '../src/lib/activity/event-types';

const testEvents = [
  // SMS Events
  {
    eventType: EVENT_TYPES.MESSAGE_SENT,
    eventCategory: EVENT_CATEGORIES.SMS,
    leadAirtableId: 'recTEST001',
    description: 'Test SMS sent to John Doe',
    messageContent: 'Hey John, saw your form submission. If you want help mapping your sales process, book a quick call: https://cal.com/test',
    metadata: {
      campaign: 'test-campaign',
      phone: '4085551234',
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    eventType: EVENT_TYPES.MESSAGE_DELIVERED,
    eventCategory: EVENT_CATEGORIES.SMS,
    leadAirtableId: 'recTEST001',
    description: 'SMS delivered successfully',
    metadata: {
      delivery_status: 'delivered',
      carrier: 'test-carrier',
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000), // 2 hours ago + 5 seconds
  },
  {
    eventType: EVENT_TYPES.INBOUND_REPLY,
    eventCategory: EVENT_CATEGORIES.SMS,
    leadAirtableId: 'recTEST001',
    description: 'Lead replied to SMS',
    messageContent: 'Yes! I\'m interested. What times are available?',
    metadata: {
      phone: '4085551234',
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
  },
  {
    eventType: EVENT_TYPES.LINK_CLICKED,
    eventCategory: EVENT_CATEGORIES.SMS,
    leadAirtableId: 'recTEST001',
    description: 'Lead clicked booking link',
    metadata: {
      url: 'https://cal.com/test',
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },

  // Campaign Events
  {
    eventType: EVENT_TYPES.CAMPAIGN_ENROLLED,
    eventCategory: EVENT_CATEGORIES.CAMPAIGN,
    leadAirtableId: 'recTEST002',
    description: 'Enrolled in campaign: ChatGPT Use Cases',
    metadata: {
      campaign_id: 'test-campaign-123',
      campaign_name: 'ChatGPT Use Cases',
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    eventType: EVENT_TYPES.CAMPAIGN_COMPLETED,
    eventCategory: EVENT_CATEGORIES.CAMPAIGN,
    leadAirtableId: 'recTEST003',
    description: 'Completed campaign: Problem Mapping Template',
    metadata: {
      campaign_id: 'test-campaign-456',
      campaign_name: 'Problem Mapping Template',
      messages_sent: 3,
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },

  // Booking Events
  {
    eventType: EVENT_TYPES.BOOKING_CONFIRMED,
    eventCategory: EVENT_CATEGORIES.BOOKING,
    leadAirtableId: 'recTEST001',
    description: 'Calendly booking confirmed',
    metadata: {
      scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      event_type: 'Strategy Call',
      calendly_event_uri: 'evt_test123',
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    eventType: EVENT_TYPES.BOOKING_RESCHEDULED,
    eventCategory: EVENT_CATEGORIES.BOOKING,
    leadAirtableId: 'recTEST004',
    description: 'Booking rescheduled to new time',
    metadata: {
      old_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      new_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
  },

  // Manual Events
  {
    eventType: EVENT_TYPES.STATUS_CHANGED,
    eventCategory: EVENT_CATEGORIES.MANUAL,
    leadAirtableId: 'recTEST002',
    description: 'Status changed: New → Qualified',
    metadata: {
      old_status: 'New',
      new_status: 'Qualified',
      changed_by: 'test-user',
      test: true,
    },
    source: 'ui:status-update',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    eventType: EVENT_TYPES.NOTE_ADDED,
    eventCategory: EVENT_CATEGORIES.MANUAL,
    leadAirtableId: 'recTEST002',
    description: 'Note added to lead',
    messageContent: 'Lead is very interested in enterprise features. Follows up next week.',
    metadata: {
      note_length: 72,
      test: true,
    },
    source: 'ui:note-add',
    timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
  },
  {
    eventType: EVENT_TYPES.LEAD_CLAIMED,
    eventCategory: EVENT_CATEGORIES.MANUAL,
    leadAirtableId: 'recTEST003',
    description: 'Lead claimed by Sarah Johnson',
    metadata: {
      claimed_by: 'test-user-sarah',
      claimed_by_name: 'Sarah Johnson',
      test: true,
    },
    source: 'ui:lead-claim',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },

  // System Events
  {
    eventType: EVENT_TYPES.ENRICHMENT_COMPLETED,
    eventCategory: EVENT_CATEGORIES.SYSTEM,
    leadAirtableId: 'recTEST004',
    description: 'Lead enrichment completed via Clay',
    metadata: {
      enrichment_provider: 'Clay',
      fields_enriched: ['company', 'title', 'linkedin_url'],
      test: true,
    },
    source: 'system:clay-enrichment',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    eventType: EVENT_TYPES.ICP_SCORE_UPDATED,
    eventCategory: EVENT_CATEGORIES.SYSTEM,
    leadAirtableId: 'recTEST003',
    description: 'ICP score updated: 65 → 85',
    metadata: {
      old_score: 65,
      new_score: 85,
      reason: 'Company size and industry match improved',
      test: true,
    },
    source: 'system:icp-scoring',
    timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
  },

  // Edge Cases
  {
    eventType: EVENT_TYPES.MESSAGE_FAILED,
    eventCategory: EVENT_CATEGORIES.SMS,
    leadAirtableId: 'recTEST005',
    description: 'SMS send failed - invalid phone number',
    metadata: {
      error: 'Invalid phone number format',
      phone: 'invalid',
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  },
  {
    eventType: EVENT_TYPES.OPT_OUT,
    eventCategory: EVENT_CATEGORIES.SMS,
    leadAirtableId: 'recTEST006',
    description: 'Lead opted out of SMS',
    messageContent: 'STOP',
    metadata: {
      opted_out_at: new Date().toISOString(),
      test: true,
    },
    source: 'test:seeder',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
];

async function seed() {
  try {
    console.log('🌱 Starting test data seeding for Mini-CRM Activity Log...\n');

    // Check if lead_activity_log table exists (migration applied)
    try {
      await db.select().from(leadActivityLog).limit(1);
      console.log('✅ Table lead_activity_log exists\n');
    } catch (error) {
      console.error('❌ Error: lead_activity_log table does not exist!');
      console.error('   Please run migration first: npm run db:push\n');
      process.exit(1);
    }

    // Insert test events
    let inserted = 0;
    for (const event of testEvents) {
      try {
        await db.insert(leadActivityLog).values({
          ...event,
          timestamp: event.timestamp,
          createdAt: event.timestamp, // Use same timestamp for createdAt
        });
        inserted++;
        console.log(`✅ [${inserted}/${testEvents.length}] ${event.eventType} - ${event.description.substring(0, 50)}...`);
      } catch (error) {
        console.error(`❌ Failed to insert event: ${event.eventType}`, error);
      }
    }

    console.log(`\n🎉 Seeding complete! Inserted ${inserted}/${testEvents.length} test events`);
    console.log('\n📊 Test Data Summary:');
    console.log(`   - SMS Events: ${testEvents.filter(e => e.eventCategory === EVENT_CATEGORIES.SMS).length}`);
    console.log(`   - Campaign Events: ${testEvents.filter(e => e.eventCategory === EVENT_CATEGORIES.CAMPAIGN).length}`);
    console.log(`   - Booking Events: ${testEvents.filter(e => e.eventCategory === EVENT_CATEGORIES.BOOKING).length}`);
    console.log(`   - Manual Events: ${testEvents.filter(e => e.eventCategory === EVENT_CATEGORIES.MANUAL).length}`);
    console.log(`   - System Events: ${testEvents.filter(e => e.eventCategory === EVENT_CATEGORIES.SYSTEM).length}`);

    console.log('\n🔍 Next Steps:');
    console.log('   1. Test POST /api/internal/log-activity endpoint');
    console.log('   2. Test GET /api/admin/activity-logs endpoint');
    console.log('   3. Test GET /api/internal/activity-health endpoint');
    console.log('   4. Verify data in database: SELECT * FROM lead_activity_log ORDER BY created_at DESC LIMIT 10;\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder
seed();
