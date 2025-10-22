# API Contracts: Analytics & Reporting

**Date**: 2025-10-20  
**Status**: Defined (Pending Implementation)  
**SOP Reference**: SOP§2.1 - API Contract Definition

---

## Overview

These API contracts define reporting and analytics endpoints that read from PostgreSQL cache to provide fast dashboard insights. All data originates from Airtable and is synced every 5 minutes.

---

## Contract 1: Campaign Analytics

### Endpoint
```
GET /api/analytics/campaigns
```

### Purpose
Get comprehensive analytics for all campaigns including sequence step distribution, conversion metrics, and engagement stats.

### Request Schema (Query Parameters)
```typescript
{
  clientId?: string;          // Filter by client (admin only can omit)
  campaignName?: string;      // Filter by specific campaign
  startDate?: string;         // ISO date for date range filtering
  endDate?: string;           // ISO date for date range filtering
}
```

### Success Response Schema (200 OK)
```typescript
{
  success: true;
  campaigns: Array<{
    name: string;             // Campaign name from Airtable
    totalLeads: number;       // Total leads in this campaign
    
    // Sequence distribution
    sequenceSteps: {
      notStarted: number;     // SMS Sequence Position = 0
      step1: number;          // SMS Sequence Position = 1
      step2: number;          // SMS Sequence Position = 2  
      step3: number;          // SMS Sequence Position = 3
      completed: number;      // Processing Status = "Completed"
    };
    
    // Status breakdown
    statusBreakdown: {
      queued: number;         // Processing Status = "Queued"
      readyForSMS: number;    // Processing Status = "Ready for SMS"
      inSequence: number;     // Processing Status = "In Sequence"
      stopped: number;        // Processing Status = "Stopped"
      completed: number;      // Processing Status = "Completed"
    };
    
    // Conversion metrics
    conversions: {
      booked: number;         // Booked = true
      optedOut: number;       // SMS Stop = true
      replied: number;        // Has inbound messages
      bookingRate: number;    // (booked / totalLeads) * 100
      optOutRate: number;     // (optedOut / totalLeads) * 100
    };
    
    // Click tracking (from Airtable fields)
    clicks: {
      totalClicks: number;    // Sum of Click Count field
      uniqueClickers: number; // Count where Clicked Link = true
      clickRate: number;      // (uniqueClickers / totalLeads) * 100
    };
    
    // Message stats
    messages: {
      totalSent: number;      // Sum of SMS Sent Count
      avgPerLead: number;     // totalSent / totalLeads
      lastSentAt: string;     // Most recent SMS Last Sent At
    };
  }>;
  timestamp: string;
}
```

### Error Response Schemas
```typescript
// 401 Unauthorized
{
  error: 'Unauthorized';
  code: 'UNAUTHORIZED';
}

// 403 Forbidden (client trying to access other client's data)
{
  error: 'Access denied';
  code: 'FORBIDDEN';
}

// 500 Internal Server Error
{
  error: string;
  code: 'DATABASE_ERROR';
}
```

### Implementation Requirements
1. User must be authenticated
2. Clients can only see their own campaign stats
3. Admins can see all clients or filter by clientId
4. All metrics calculated from PostgreSQL cache (fast)
5. Airtable fields mapped:
   - Campaign name from custom field or inferred from batch
   - Click tracking from: `Click Count`, `Clicked Link` fields
   - Sequence from: `SMS Sequence Position`
   - Status from: `Processing Status`, `SMS Stop`, `Booked`

---

## Contract 2: Sequence Step Details

### Endpoint
```
GET /api/analytics/sequences/[campaignName]
```

### Purpose
Get detailed breakdown of leads at each sequence step for a specific campaign.

### Request Schema
```
URL parameter: campaignName (string)
Query params: clientId (optional, admin only)
```

### Success Response Schema (200 OK)
```typescript
{
  success: true;
  campaignName: string;
  
  steps: Array<{
    stepNumber: number;       // 0, 1, 2, or 3
    totalLeads: number;       // Count at this step
    
    leads: Array<{
      id: string;
      name: string;           // First + Last Name
      company: string;
      icpScore: number;
      status: string;         // Processing Status
      lastSentAt: string;     // SMS Last Sent At
      sentCount: number;      // SMS Sent Count
      clicked: boolean;       // Clicked Link
      booked: boolean;        // Booked
      stopped: boolean;       // SMS Stop
    }>;
    
    metrics: {
      avgDaysAtStep: number;  // Average time at this step
      conversionRate: number; // % who moved to next step
      bookingRate: number;    // % who booked from this step
      optOutRate: number;     // % who opted out from this step
    };
  }>;
  
  timestamp: string;
}
```

### Error Response Schemas
(Same as Contract 1)

### Implementation Requirements
1. User authenticated and authorized for campaign
2. Group leads by `SMS Sequence Position`
3. Calculate time-based metrics using `SMS Last Sent At` timestamps
4. Include click tracking data per lead
5. Sort leads by ICP score within each step

---

## Contract 3: Click Tracking Report

### Endpoint
```
GET /api/analytics/clicks
```

### Purpose
Get click tracking analytics across all campaigns or filtered by campaign.

### Request Schema (Query Parameters)
```typescript
{
  clientId?: string;          // Filter by client (admin only)
  campaignName?: string;      // Filter by campaign
  startDate?: string;         // Filter by date range
  endDate?: string;
}
```

### Success Response Schema (200 OK)
```typescript
{
  success: true;
  
  summary: {
    totalLinks: number;       // Count of leads with Short Link URL
    totalClicks: number;      // Sum of all Click Count
    uniqueClickers: number;   // Count where Clicked Link = true
    clickRate: number;        // (uniqueClickers / totalLinks) * 100
  };
  
  byCampaign: Array<{
    campaignName: string;
    totalLinks: number;
    totalClicks: number;
    uniqueClickers: number;
    clickRate: number;
  }>;
  
  bySequenceStep: Array<{
    step: number;             // Which sequence step (1, 2, 3)
    totalLinks: number;
    totalClicks: number;
    clickRate: number;
  }>;
  
  topClickers: Array<{
    leadId: string;
    name: string;
    company: string;
    clicks: number;           // Click Count value
    linkUrl: string;          // Short Link URL
    booked: boolean;          // Did they book?
  }>;
  
  timestamp: string;
}
```

### Error Response Schemas
(Same as Contract 1)

### Implementation Requirements
1. Read from Airtable fields: `Short Link ID`, `Short Link URL`, `Click Count`, `Clicked Link`
2. Group and aggregate by campaign and sequence step
3. Identify top clickers for prioritization
4. Cross-reference with booking status
5. All data from PostgreSQL cache (synced from Airtable)

---

## Contract 4: Dashboard Overview Stats

### Endpoint
```
GET /api/analytics/dashboard
```

### Purpose
Get high-level overview stats for dashboard display.

### Request Schema (Query Parameters)
```typescript
{
  clientId?: string;          // Filter by client (admin only)
  period?: '24h' | '7d' | '30d' | 'all';  // Time period
}
```

### Success Response Schema (200 OK)
```typescript
{
  success: true;
  
  overview: {
    totalLeads: number;
    activeLeads: number;      // In Sequence or Ready for SMS
    completedLeads: number;   // Completed or Stopped
    
    newToday: number;         // Created in last 24h
    newThisWeek: number;      // Created in last 7 days
  };
  
  campaigns: {
    total: number;            // Distinct campaign names
    active: number;           // Campaigns with leads "In Sequence"
    paused: number;           // Campaigns with SMS Batch Control inactive
  };
  
  performance: {
    messagesSent: number;     // Sum of SMS Sent Count
    messagesThisPeriod: number; // Based on SMS Last Sent At
    
    totalBooked: number;      // Booked = true
    bookedThisPeriod: number;
    bookingRate: number;      // (totalBooked / totalLeads) * 100
    
    totalOptedOut: number;    // SMS Stop = true
    optedOutThisPeriod: number;
    optOutRate: number;       // (totalOptedOut / messagesSent) * 100
    
    totalClicks: number;      // Sum of Click Count
    clickRate: number;        // (unique clickers / totalLeads) * 100
  };
  
  topPerformers: {
    campaigns: Array<{
      name: string;
      bookingRate: number;
      totalBooked: number;
    }>;
    
    leads: Array<{
      id: string;
      name: string;
      icpScore: number;
      status: string;
      clicked: boolean;
      booked: boolean;
    }>;
  };
  
  timestamp: string;
}
```

### Error Response Schemas
(Same as Contract 1)

### Implementation Requirements
1. All metrics calculated from PostgreSQL cache
2. Time-based filtering using `createdAt`, `SMS Last Sent At` timestamps
3. Efficient SQL aggregations (no N+1 queries)
4. Response time target: <500ms
5. Cache results for 5 minutes (Redis optional)

---

## Airtable Field Mapping Reference

### From SOP-Airtable-Leads-Table.md

**Click Tracking Fields**:
- `Short Link ID` - Unique ID for click tracking
- `Short Link URL` - The shortened URL sent in SMS
- `Click Count` - Number of times link was clicked
- `Clicked Link` - Boolean, true if lead clicked at least once

**Sequence Tracking Fields**:
- `SMS Sequence Position` - Current step (0, 1, 2, 3)
- `SMS Sent Count` - Total messages sent to lead
- `SMS Last Sent At` - Timestamp of last message

**Status Fields**:
- `Processing Status` - Backlog, Queued, Ready for SMS, In Sequence, Completed, Stopped
- `HRQ Status` - Qualified, Archive, Review, Manual Process
- `SMS Stop` - Boolean, opted out
- `SMS Stop Reason` - Why they stopped
- `Booked` - Boolean, meeting booked
- `Booked At` - Timestamp of booking

**Campaign Fields**:
- Campaign name - Inferred from batch or custom field
- `SMS Batch Control` - Active/Inactive for campaign control

---

## PostgreSQL Schema Requirements

### Add Campaign Tracking
```sql
-- Option 1: Add campaign name to leads table
ALTER TABLE leads ADD COLUMN campaign_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN campaign_batch VARCHAR(100);

-- Option 2: Track in separate table (better for multiple campaigns per lead)
CREATE TABLE lead_campaigns (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  campaign_name VARCHAR(255),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(50)
);
```

### Add Click Tracking Fields
```sql
ALTER TABLE leads ADD COLUMN short_link_id VARCHAR(100);
ALTER TABLE leads ADD COLUMN short_link_url VARCHAR(500);
ALTER TABLE leads ADD COLUMN click_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN clicked_link BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN first_clicked_at TIMESTAMP;
```

### Add Sequence Tracking Fields
```sql
ALTER TABLE leads ADD COLUMN sms_sequence_position INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN sms_sent_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN sms_last_sent_at TIMESTAMP;
```

### Add Status Tracking Fields
```sql
ALTER TABLE leads ADD COLUMN processing_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN hrq_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN sms_stop BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN sms_stop_reason VARCHAR(500);
ALTER TABLE leads ADD COLUMN booked BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN booked_at TIMESTAMP;
```

---

## Implementation Order

1. ✅ Define contracts (this document)
2. ⏳ Update PostgreSQL schema with analytics fields
3. ⏳ Update Airtable sync to include new fields
4. ⏳ Write failing tests for analytics endpoints
5. ⏳ Implement aggregation queries (PostgreSQL)
6. ⏳ Implement API endpoints
7. ⏳ Create dashboard UI components
8. ⏳ Create campaign drill-down UI
9. ⏳ Test complete flow

---

**Status**: Contracts defined, ready for TDD implementation per SOP§1.1
**Next Step**: Update schema and write failing tests






