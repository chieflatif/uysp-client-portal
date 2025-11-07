# Timezone Handling Convention - Mini-CRM Activity Logging

**Status:** ✅ APPROVED
**Version:** 1.0
**Last Updated:** November 7, 2025

---

## Overview

This document defines the timezone handling conventions for the Mini-CRM Activity Logging System. All timestamps are stored and processed in UTC with timezone awareness enabled in PostgreSQL.

---

## Core Principles

### 1. Storage: Always UTC with Timezone Awareness

**Database Schema:**
All timestamp fields use `timestamp with time zone` (TIMESTAMPTZ) in PostgreSQL:

```sql
-- Example from lead_activity_log table
timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
```

**Drizzle Schema:**
```typescript
timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
```

**Why:** PostgreSQL automatically converts all timestamps to UTC for storage and converts back to the session timezone on retrieval. This ensures consistency across distributed systems and prevents timezone-related bugs.

### 2. API Input: Accept ISO 8601 with Timezone

**Accepted Formats:**
- `2025-11-07T10:30:00Z` (UTC, recommended)
- `2025-11-07T10:30:00-08:00` (PST)
- `2025-11-07T10:30:00+00:00` (UTC explicit)

**JavaScript Date Handling:**
```typescript
// Good: Date object automatically includes timezone
const timestamp = new Date(); // Creates UTC timestamp

// Good: Parse ISO 8601 string
const timestamp = new Date('2025-11-07T10:30:00Z');

// Bad: Using Date without timezone can lead to confusion
const timestamp = new Date('2025-11-07 10:30:00'); // Ambiguous!
```

### 3. API Output: Return ISO 8601 UTC

**Response Format:**
All API responses return timestamps in ISO 8601 format with UTC timezone:

```json
{
  "timestamp": "2025-11-07T18:30:00.000Z",
  "createdAt": "2025-11-07T18:30:00.000Z"
}
```

**Implementation:**
```typescript
// Automatic with JSON.stringify()
return NextResponse.json({
  timestamp: activity.timestamp, // Date object → "2025-11-07T18:30:00.000Z"
});
```

### 4. UI Display: Convert to User's Local Timezone

**Client-Side Conversion:**
```typescript
// Good: Let browser convert to local timezone
const localTime = new Date(activity.timestamp).toLocaleString();

// Good: Use date-fns or similar library for consistent formatting
import { format } from 'date-fns';
const formatted = format(new Date(activity.timestamp), 'PPpp'); // "Nov 7, 2025, 10:30:00 AM"

// Good: Relative time for recent events
import { formatDistanceToNow } from 'date-fns';
const relative = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
// "2 hours ago"
```

---

## Implementation Guidelines

### API Routes

**Internal Log Activity Endpoint:**
```typescript
// Accepts timestamp from n8n workflows
const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

// Stores as UTC automatically
await db.insert(leadActivityLog).values({
  timestamp: timestamp, // PostgreSQL stores as UTC
  // ...
});
```

**Admin Activity Browser:**
```typescript
// Date range filters
const fromDate = new Date(searchParams.get('dateFrom')); // Parses ISO 8601
const toDate = new Date(searchParams.get('dateTo'));

// Query with Drizzle (timezone-aware comparison)
conditions.push(gte(leadActivityLog.timestamp, fromDate));
conditions.push(lte(leadActivityLog.timestamp, toDate));
```

### n8n Workflows

**Sending Timestamps:**
```javascript
// n8n JavaScript node
{
  "timestamp": new Date().toISOString(), // "2025-11-07T18:30:00.000Z"
  "eventType": "MESSAGE_SENT",
  // ...
}
```

**HTTP Request Node:**
```
POST /api/internal/log-activity
Headers: x-api-key: {{$env.INTERNAL_API_KEY}}
Body:
{
  "timestamp": "{{$now}}",  // n8n variable in ISO 8601
  // ...
}
```

---

## Common Pitfalls and Solutions

### ❌ Pitfall 1: Using Local Time in Comparisons

**Problem:**
```typescript
// BAD: Hardcoded date without timezone
const cutoff = new Date('2025-11-07 00:00:00'); // Ambiguous!
```

**Solution:**
```typescript
// GOOD: Explicit UTC or ISO 8601
const cutoff = new Date('2025-11-07T00:00:00Z');
```

### ❌ Pitfall 2: Timezone Loss in Race Conditions

**Problem:**
```typescript
// BAD: Different timestamps for same logical event
await db.insert(leadActivityLog).values({ timestamp: new Date() });
await db.update(leads).set({ lastActivityAt: new Date() }); // Slightly different!
```

**Solution:**
```typescript
// GOOD: Use same timestamp variable (IMPLEMENTED IN HIGH-005 FIX)
const eventTimestamp = new Date();
const [activity] = await db.insert(leadActivityLog)
  .values({ timestamp: eventTimestamp })
  .returning();
await db.update(leads).set({ lastActivityAt: activity.timestamp }); // Same value!
```

### ❌ Pitfall 3: String Manipulation Instead of Date Objects

**Problem:**
```typescript
// BAD: Manually formatting dates as strings
const timestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
```

**Solution:**
```typescript
// GOOD: Use Date objects and let PostgreSQL handle conversion
const timestamp = new Date();
```

---

## Testing Timezone Handling

### Manual Testing

**Test Case 1: Cross-Timezone Event Logging**
```bash
# User in PST logs event
curl -X POST /api/internal/log-activity \
  -H "x-api-key: $API_KEY" \
  -d '{"timestamp": "2025-11-07T10:00:00-08:00", ...}'

# Verify stored as UTC (18:00:00 UTC)
SELECT timestamp FROM lead_activity_log ORDER BY timestamp DESC LIMIT 1;
# Expected: 2025-11-07 18:00:00+00
```

**Test Case 2: Date Range Queries**
```bash
# Query for events on 2025-11-07 UTC
curl "/api/admin/activity-logs?dateFrom=2025-11-07T00:00:00Z&dateTo=2025-11-07T23:59:59Z"

# Should include events from all timezones on that UTC day
```

### Automated Testing

```typescript
describe('Timezone Handling', () => {
  it('should store timestamps in UTC', async () => {
    const pstTime = new Date('2025-11-07T10:00:00-08:00');
    const utcTime = new Date('2025-11-07T18:00:00Z');

    const result = await logLeadActivity({
      timestamp: pstTime,
      // ...
    });

    expect(result.timestamp).toEqual(utcTime);
  });

  it('should handle date range queries correctly', async () => {
    // Insert events at different times
    await logLeadActivity({ timestamp: new Date('2025-11-07T08:00:00Z'), ... });
    await logLeadActivity({ timestamp: new Date('2025-11-07T16:00:00Z'), ... });

    // Query for specific day in UTC
    const results = await fetch('/api/admin/activity-logs?dateFrom=2025-11-07T00:00:00Z&dateTo=2025-11-07T23:59:59Z');

    expect(results.length).toBe(2);
  });
});
```

---

## Reference

**PostgreSQL Documentation:**
- [Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Timezone Handling](https://www.postgresql.org/docs/current/datetime-config-files.html)

**JavaScript Date Best Practices:**
- Use `Date.prototype.toISOString()` for API transmission
- Use `Date.prototype.toLocaleString()` for display
- Consider [date-fns](https://date-fns.org/) for robust date manipulation

**Drizzle ORM:**
- [Timestamp Column Type](https://orm.drizzle.team/docs/column-types/pg#timestamp)

---

## Change History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-07 | 1.0 | Initial convention document | Implementation Agent |

---

**Status:** ✅ APPROVED for production use
**PRD Reference:** docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md
**Related Fixes:** HIGH-005 (lastActivityAt race condition)
