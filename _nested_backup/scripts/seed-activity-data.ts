/**
 * Seed script to generate test activity data
 * Run with: npx tsx scripts/seed-activity-data.ts
 */

import { db } from '../src/lib/db';
import { userActivityLogs, userSessions, users } from '../src/lib/db/schema';
import { randomUUID } from 'crypto';

async function seedActivityData() {
  console.log('🌱 Seeding activity data...');

  try {
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users`);

    if (allUsers.length === 0) {
      console.log('⚠️  No users found. Please create users first.');
      return;
    }

    const eventTypes = [
      'page_view',
      'button_click',
      'form_submit',
      'task_created',
      'task_updated',
      'lead_qualified',
      'document_uploaded',
    ];

    const pages = [
      '/dashboard',
      '/analytics',
      '/leads',
      '/project-management',
      '/admin/users',
      '/admin/clients',
      '/settings',
    ];

    const categories = ['navigation', 'interaction', 'custom', 'system'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const deviceTypes = ['Desktop', 'Mobile', 'Tablet'];

    // Generate data for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let totalEvents = 0;
    let totalSessions = 0;

    // For each user, generate sessions and events
    for (const user of allUsers) {
      const sessionsPerUser = Math.floor(Math.random() * 20) + 10; // 10-30 sessions

      for (let i = 0; i < sessionsPerUser; i++) {
        const sessionId = randomUUID();
        const sessionStart = new Date(
          thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
        );
        const sessionDuration = Math.floor(Math.random() * 1800) + 60; // 1-30 minutes
        const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 1000);
        const pageViewsInSession = Math.floor(Math.random() * 15) + 3; // 3-18 pages

        const browser = browsers[Math.floor(Math.random() * browsers.length)];
        const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];

        // Create session
        await db.insert(userSessions).values({
          sessionId,
          userId: user.id,
          clientId: user.clientId,
          sessionStart,
          sessionEnd,
          lastActivity: sessionEnd,
          pageViews: pageViewsInSession,
          durationSeconds: sessionDuration,
          browser,
          deviceType,
          os: 'macOS',
          ipAddress: '192.168.1.100',
          userAgent: `Mozilla/5.0 (${browser})`,
        });

        totalSessions++;

        // Create events for this session
        const eventsInSession = Math.floor(Math.random() * 25) + 15; // 15-40 events
        for (let j = 0; j < eventsInSession; j++) {
          const eventTime = new Date(
            sessionStart.getTime() + (Math.random() * sessionDuration * 1000)
          );
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          const category = categories[Math.floor(Math.random() * categories.length)];
          const page = pages[Math.floor(Math.random() * pages.length)];

          await db.insert(userActivityLogs).values({
            userId: user.id,
            clientId: user.clientId,
            eventType,
            eventCategory: category,
            eventData: {
              source: 'test_data',
              ...( eventType === 'task_created' ? { taskType: 'Bug', priority: 'High' } : {}),
            },
            pageUrl: page,
            referrer: pages[Math.floor(Math.random() * pages.length)],
            sessionId,
            ipAddress: '192.168.1.100',
            userAgent: `Mozilla/5.0 (${browser})`,
            browser,
            deviceType,
            os: 'macOS',
            createdAt: eventTime,
          });

          totalEvents++;
        }
      }

      console.log(`✅ Generated data for user: ${user.email}`);
    }

    console.log(`\n✨ Successfully seeded activity data!`);
    console.log(`   - ${totalSessions} sessions created`);
    console.log(`   - ${totalEvents} events logged`);
    console.log(`\n🎯 Visit /admin/user-activity to see the analytics dashboard`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Run the seed function
seedActivityData()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
