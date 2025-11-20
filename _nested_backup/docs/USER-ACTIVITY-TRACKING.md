# User Activity Tracking System

## Overview

A comprehensive user activity tracking system built directly into your PostgreSQL database. This system automatically tracks page views, user interactions, sessions, and custom events without any third-party dependencies.

## Features

✅ **Automatic Page View Tracking** - Tracks every page navigation automatically via middleware
✅ **Session Management** - Automatic session creation and tracking
✅ **Custom Event Tracking** - Track any custom business events (tasks created, leads qualified, etc.)
✅ **User Analytics Dashboard** - Beautiful admin dashboard showing activity metrics
✅ **Privacy-First** - All data stored in your own database
✅ **Zero Cost** - No third-party services, uses existing PostgreSQL
✅ **Performance Optimized** - Fire-and-forget tracking, doesn't block requests

## Database Tables

### `user_activity_logs`
Stores all activity events with details about the event, user, session, and device.

### `user_sessions`
Tracks user sessions with start/end times, page views, and duration.

### `user_activity_summary`
Daily aggregated statistics for fast reporting.

## Automatic Tracking

### Page Views
Page views are **automatically tracked** for all authenticated users via middleware. No code changes needed!

When a user navigates to any page, the system automatically logs:
- Page URL
- Timestamp
- User ID
- Session ID
- Device/browser info
- IP address

## Custom Event Tracking

### Client-Side Tracking

Import the tracking utilities:

```typescript
import {
  trackEvent,
  trackClick,
  trackFormSubmit,
  trackCustomEvent,
} from '@/lib/analytics/tracker';
```

### Examples

#### Track Button Clicks
```typescript
<button onClick={() => trackClick('create_task_button', { taskType: 'Bug' })}>
  Create Task
</button>
```

#### Track Form Submissions
```typescript
const handleSubmit = async (data) => {
  await saveData(data);
  trackFormSubmit('lead_form', { leadStatus: 'qualified' });
};
```

#### Track Custom Business Events
```typescript
// When a task is created
trackCustomEvent('task_created', {
  taskType: 'Feature',
  priority: 'High',
  projectId: '123',
});

// When a lead is qualified
trackCustomEvent('lead_qualified', {
  leadId: '456',
  campaign: 'Summer 2025',
  score: 85,
});

// When a user invites another user
trackCustomEvent('user_invited', {
  invitedEmail: 'newuser@example.com',
  role: 'CLIENT_USER',
});
```

#### Track Errors
```typescript
try {
  await riskyOperation();
} catch (error) {
  trackError('Failed to save data', {
    operation: 'save_lead',
    errorMessage: error.message,
  });
}
```

## Viewing Analytics

### Admin Dashboard

Admins can view user activity analytics at:
```
/admin/user-activity
```

The dashboard shows:
- **Total Events** - All tracked events in the period
- **Active Users** - Unique users who were active
- **Average Session Duration** - How long users spend in the app
- **Events by Type** - Breakdown of different event types
- **Events by Category** - Navigation, interaction, custom, system
- **Top Active Users** - Most engaged users
- **Recent Sessions** - Latest user sessions with duration and page views

### Time Periods

View data for:
- **7 Days** - Recent activity
- **30 Days** - Monthly trends (default)
- **90 Days** - Quarterly overview

## API Endpoints

### Track Event
```
POST /api/analytics/track
```

Request body:
```json
{
  "eventType": "task_created",
  "eventCategory": "custom",
  "eventData": { "taskType": "Bug", "priority": "High" },
  "pageUrl": "/project-management",
  "referrer": "/dashboard",
  "sessionId": "optional-session-id"
}
```

### Get Analytics Data
```
GET /api/analytics/user-activity?period=30d
```

Query parameters:
- `period`: 7d, 30d, or 90d (default: 30d)
- `userId`: Filter by specific user (super admin only)
- `clientId`: Filter by client (defaults to session user's client)

## Event Types

### Automatic Events
- `page_view` - User navigates to a page

### Common Custom Events
- `button_click` - User clicks a tracked button
- `form_submit` - User submits a form
- `task_created` - New task created
- `task_updated` - Task modified
- `task_completed` - Task marked complete
- `lead_qualified` - Lead meets qualification criteria
- `lead_disqualified` - Lead rejected
- `user_invited` - New user invitation sent
- `document_uploaded` - File/document uploaded
- `report_generated` - Report created/exported
- `error` - Application error occurred

### Event Categories
- `navigation` - Page views, route changes
- `interaction` - Clicks, form submits, UI interactions
- `custom` - Business-specific events
- `system` - Errors, performance metrics

## Performance

- **Non-Blocking**: All tracking happens asynchronously
- **Fire-and-Forget**: Doesn't wait for tracking to complete
- **Optimized Queries**: Indexed for fast lookups
- **Batch-Friendly**: Can be extended to batch events

## Privacy & Security

- ✅ All data stored in your own database
- ✅ No third-party tracking scripts
- ✅ No cookies required
- ✅ Full control over data retention
- ✅ GDPR compliant (data ownership)
- ✅ IP addresses stored but can be anonymized

## Data Retention

To clean up old activity logs, run:

```sql
-- Delete activity logs older than 90 days
DELETE FROM user_activity_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old sessions
DELETE FROM user_sessions
WHERE session_start < NOW() - INTERVAL '90 days';
```

Consider setting up a cron job to run this monthly.

## Advanced Usage

### Export User Activity

```typescript
// In a server component or API route
import { db } from '@/lib/db';
import { userActivityLogs } from '@/lib/db/schema';
import { eq, gte } from 'drizzle-orm';

const userActivity = await db
  .select()
  .from(userActivityLogs)
  .where(eq(userActivityLogs.userId, userId))
  .orderBy(desc(userActivityLogs.createdAt));

// Export to CSV, JSON, etc.
```

### Custom Reports

Create custom reports by querying the tables directly:

```typescript
// Most active days of the week
const activeByDay = await db
  .select({
    dayOfWeek: sql`EXTRACT(DOW FROM created_at)`,
    count: count(),
  })
  .from(userActivityLogs)
  .groupBy(sql`EXTRACT(DOW FROM created_at)`);
```

## Troubleshooting

### Events Not Showing Up

1. Check user is authenticated
2. Verify middleware is running (check server logs)
3. Check browser console for tracking errors
4. Verify database connection

### Slow Dashboard

1. Reduce time period (use 7d instead of 90d)
2. Check database indexes are created
3. Consider archiving old data

## Future Enhancements

Possible additions:
- Real-time activity feed
- User journey visualization
- Funnel analysis
- Cohort analysis
- A/B test tracking
- Performance metrics
- Heatmaps
- Session replay

## Support

For issues or questions, check:
- Database migration applied: `migrations/add-user-activity-tracking.sql`
- Schema definition: `src/lib/db/schema.ts`
- API endpoints: `src/app/api/analytics/`
- Tracking utilities: `src/lib/analytics/tracker.ts`
