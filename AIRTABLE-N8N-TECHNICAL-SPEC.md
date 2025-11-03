# 🔧 Technical Specification: Airtable + n8n Integration

## Executive Summary

This document explains exactly what we'll build, how data flows, and what APIs we'll use.

**TL;DR**: 
- We read from Airtable (read-only)
- Cache in PostgreSQL
- Display in portal UI
- Your n8n workflows run independently
- Nothing breaks

---

## 1. Airtable Integration Architecture

### 1.1 What We'll Read from Airtable

```
Your current Airtable structure (from workflows dir analysis):
├── UYSP Lead Qualification (Base)
│   ├── Leads Table
│   │   ├── Name fields
│   │   ├── Contact info
│   │   ├── Company/Title
│   │   ├── ICP Score
│   │   ├── Status (New, Replied, Claimed, Booked)
│   │   ├── SMS Status
│   │   ├── Calendly Status
│   │   └── Custom fields (from n8n workflows)
│   ├── Clients Table
│   │   ├── Company name
│   │   ├── Contact email
│   │   ├── Airtable base ID
│   │   └── Lead count
│   └── Campaigns Table
│       ├── Campaign name
│       ├── Message template
│       ├── Lead count
│       └── Status (Active/Paused)
```

### 1.2 API Integration Points

```typescript
// What we'll use from Airtable API
const airtableClient = {
  // Read operations ONLY
  listRecords: async (table, options?) => {},     // Get all records
  getRecord: async (table, recordId) => {},       // Get single record
  listFields: async (table) => {},                // Get schema
  
  // NO write operations
  // updateRecord: NEVER
  // deleteRecord: NEVER
  // createRecord: ONLY for test data
}
```

### 1.3 Sync Strategy

```typescript
// File: src/lib/sync/airtable-to-postgres.ts

interface SyncConfig {
  schedule: '*/5 * * * *',          // Every 5 minutes
  batchSize: 100,                   // Process 100 at a time
  maxRetries: 3,                    // Retry on failure
  timeout: 30000,                   // 30 second timeout
}

interface SyncOperation {
  timestamp: Date,
  status: 'success' | 'partial' | 'failed',
  recordsRead: number,
  recordsInserted: number,
  recordsUpdated: number,
  recordsDeleted: number,
  errors: Error[],
}

// Pseudocode of sync loop
async function syncAirtableToPostgres() {
  // 1. Get all leads from Airtable
  const airtableLeads = await airtable.listRecords('Leads');
  
  // 2. Compare with PostgreSQL
  for (const airLead of airtableLeads) {
    const pgLead = await db.query.leads.findFirst({
      where: eq(leads.airtableRecordId, airLead.id)
    });
    
    if (!pgLead) {
      // 3a. New lead - insert
      await db.insert(leads).values({
        airtableRecordId: airLead.id,
        firstName: airLead.fields['First Name'],
        lastName: airLead.fields['Last Name'],
        email: airLead.fields['Email'],
        // ... all fields
      });
    } else if (leadChanged(pgLead, airLead)) {
      // 3b. Lead updated - update PostgreSQL
      await db.update(leads)
        .set({ /* updated fields */ })
        .where(eq(leads.id, pgLead.id));
    }
    // 3c. If Airtable doesn't have it, keep in PostgreSQL (don't delete)
  }
  
  // 4. Log the sync
  await db.insert(activityLog).values({
    action: 'AIRTABLE_SYNC_COMPLETE',
    recordsProcessed: airtableLeads.length,
    // ...
  });
}
```

### 1.4 Error Handling

```typescript
// What happens if sync fails?

try {
  await syncAirtableToPostgres();
} catch (error) {
  // 1. Log the error
  console.error('Airtable sync failed:', error);
  
  // 2. Store in database
  await db.insert(activityLog).values({
    action: 'AIRTABLE_SYNC_FAILED',
    details: error.message,
    userId: null, // System operation
  });
  
  // 3. Alert admin (if configured)
  if (emailAlertsEnabled) {
    await sendAlert('Airtable sync failed, please check');
  }
  
  // 4. Continue running (don't stop the app)
  // 5. Next sync attempt in 5 minutes
}

// Result: If Airtable API is down, portal still works with cached data
```

---

## 2. Field Mapping (Airtable → PostgreSQL)

### 2.1 Leads Table Mapping

```typescript
interface AirtableLeadFields {
  // From your Airtable base
  'Record ID': string,                    // Airtable ID
  'First Name': string,
  'Last Name': string,
  'Email': string,
  'Phone': string,
  'Company': string,
  'Title': string,
  'ICP Score': number,                    // 0-100
  'Status': string,                       // New, Replied, Claimed, Booked
  'SMS Status'?: string,                  // Added by SMS workflow
  'Calendly Status'?: string,             // Added by Calendly workflow
  'Last Message Date'?: string,           // ISO date
  'Created Date': string,                 // ISO date
  'Custom Field 1'?: string,              // Any custom fields
  // ... more fields as needed
}

interface PostgresLead {
  // Our PostgreSQL table
  id: UUID,
  clientId: UUID,
  airtableRecordId: string,               // Links back to Airtable
  firstName: string,
  lastName: string,
  email: string,
  phone?: string,
  company?: string,
  title?: string,
  icpScore: number,                       // Normalized to 0-100
  status: string,                         // enum or varchar
  smsStatus?: string,                     // Extra field
  calendlyStatus?: string,                // Extra field
  lastMessageAt?: Date,                   // Parsed from string
  claimedBy?: UUID,                       // PORTAL ONLY (not in Airtable)
  claimedAt?: Date,                       // PORTAL ONLY
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
}

// Mapping function
function mapAirtableLeadToPostgres(
  airtableLead: AirtableLeadFields,
  clientId: UUID
): Partial<PostgresLead> {
  return {
    airtableRecordId: airtableLead['Record ID'],
    firstName: airtableLead['First Name'],
    lastName: airtableLead['Last Name'],
    email: airtableLead['Email'],
    phone: airtableLead['Phone'],
    company: airtableLead['Company'],
    title: airtableLead['Title'],
    icpScore: airtableLead['ICP Score'] || 0,
    status: airtableLead['Status'] || 'New',
    smsStatus: airtableLead['SMS Status'],
    calendlyStatus: airtableLead['Calendly Status'],
    lastMessageAt: airtableLead['Last Message Date'] 
      ? new Date(airtableLead['Last Message Date']) 
      : null,
    clientId,
    isActive: true,
  };
}
```

### 2.2 Why This Design

```
Why separate airtableRecordId and id?
├─ airtableRecordId: Links to your Airtable (stays same forever)
└─ id: Our database ID (unique in PostgreSQL)

This way:
✓ We always know which Airtable record we're syncing
✓ If Airtable changes, we can find the right record
✓ Can delete from PostgreSQL without losing Airtable link
✓ Can re-sync without creating duplicates
```

---

## 3. Portal User Interactions (Local Only)

### 3.1 Claiming Leads

```typescript
// When user clicks "Claim Lead"

async function claimLead(leadId: UUID, userId: UUID) {
  // 1. Update local PostgreSQL (portal data)
  await db.update(leads)
    .set({
      claimedBy: userId,
      claimedAt: new Date(),
      status: 'Claimed',  // Could update this too
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId));
  
  // 2. Log the action
  await db.insert(activityLog).values({
    userId,
    leadId,
    action: 'LEAD_CLAIMED',
    details: `User claimed lead`,
    createdAt: new Date(),
  });
  
  // 3. Return to UI
  return { success: true };
  
  // NOTE: Airtable is NOT updated
  // Why? Because:
  // - n8n workflows still control Airtable
  // - Portal claim is just UI state
  // - Can unclaim without side effects
  // - Airtable is source of truth
}

// When Airtable syncs again:
// If user claimed a lead locally, the "claimed" status stays
// If Airtable updated the lead, our claim persists
// No conflicts because we only sync from Airtable → PostgreSQL
```

### 3.2 Adding Notes

```typescript
// When user adds a note (also local only)

async function addNoteToLead(
  leadId: UUID,
  userId: UUID,
  content: string,
  type: 'Call' | 'Email' | 'Text' | 'Meeting' | 'General'
) {
  // 1. Create note in PostgreSQL
  const note = await db.insert(notes).values({
    leadId,
    createdBy: userId,
    content,
    type,
    isPrivate: false,
    isSystemGenerated: false,
    createdAt: new Date(),
  });
  
  // 2. Log activity
  await db.insert(activityLog).values({
    userId,
    leadId,
    action: 'NOTE_ADDED',
    details: `Added ${type.toLowerCase()} note`,
  });
  
  // NOTE: Airtable is NOT updated
  // Why? Portal notes are separate from Airtable attachments
  // Portal can later sync notes back (Phase 2 feature)
}
```

---

## 4. n8n Integration (Optional, Phase 2+)

### 4.1 Current n8n Workflows (Not Touched)

```
Your existing workflows continue unchanged:
✓ UYSP-Calendly-Booked_FIXED
  ├─ Trigger: Calendly webhook
  └─ Action: Update Airtable status to "Booked"

✓ UYSP-Click-Proxy
  ├─ Trigger: User clicks link
  └─ Action: Track click, update Airtable

✓ UYSP-SMS-Scheduler
  ├─ Trigger: Scheduled (every X hours)
  ├─ Action: Read from Airtable
  └─ Action: Send SMS via SimpleTexting

✓ UYSP-Retrospective-Kajabi-Tagger
  ├─ Trigger: Kajabi webhook
  └─ Action: Update Airtable tags

✓ UYSP-ST-Delivery
  ├─ Trigger: SimpleTexting delivery status
  └─ Action: Update Airtable
```

All continue running. Portal doesn't interfere.

### 4.2 Optional: Trigger Workflows from Portal (Phase 2)

```typescript
// Only IF you want this - not required for MVP

async function triggerWorkflow(
  workflowName: 'send_sms' | 'send_email' | 'book_calendly',
  leadId: UUID,
  payload: any
) {
  // This requires:
  // 1. n8n API key in .env.local
  // 2. Webhook URL from your n8n workflow
  // 3. Custom integration code
  
  // Example:
  const response = await fetch(
    `https://n8n.instance.com/webhook/lead-action`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${N8N_API_KEY}` },
      body: JSON.stringify({
        leadId,
        action: workflowName,
        ...payload,
      }),
    }
  );
  
  // Portal receives response
  // n8n workflow runs
  // Airtable gets updated by n8n
  // Portal re-syncs 5 minutes later
}

// This is OPTIONAL - Portal works perfectly without it
// Can be added later (Week 4+)
```

---

## 5. Security & Permissions

### 5.1 Airtable API Token

```
Type: Personal Access Token (PAT)
Scopes (READ-ONLY):
  ✓ data.records:read       (read lead records)
  ✓ schema.bases:read       (read table structure)
  ✗ data.records:write      (DISABLED - can't modify)
  ✗ data.records:delete     (DISABLED - can't delete)
  ✗ schema.bases:write      (DISABLED - can't modify schema)

Result: Token can ONLY read, never modify
```

### 5.2 .env.local (Never Committed)

```bash
# .env.local (in .gitignore)
AIRTABLE_API_KEY=pat_xxxxxxxx...
AIRTABLE_BASE_ID=appxxxxxxxx...
N8N_API_URL=https://n8n.instance.com (optional)
N8N_API_KEY=xxxxxxxx... (optional)

# All credentials stay local or in Render Secrets
# Never committed to git
# Can be rotated anytime
```

---

## 6. Monitoring & Alerts

### 6.1 Sync Monitoring

```typescript
// Dashboard shows:
✓ Last sync time
✓ Sync status (success/failed)
✓ Records synced (inserted, updated)
✓ Sync history (last 30 days)
✓ Error logs (if any)

// API endpoint: GET /api/sync/status
{
  status: 'success',
  lastSync: '2025-10-20T14:35:00Z',
  nextSync: '2025-10-20T14:40:00Z',
  recordsProcessed: 1234,
  recordsInserted: 42,
  recordsUpdated: 18,
  errors: [],
}
```

### 6.2 Rollback Capability

```typescript
// If something goes wrong, we can:

// Option 1: Manual re-sync
POST /api/sync/airtable?force=true

// Option 2: Restore from backup
// PostgreSQL daily backup → restore previous state

// Option 3: Disable sync temporarily
UPDATE settings SET airtable_sync_enabled = false;

// Result: Portal keeps working even if sync is disabled
```

---

## 7. Files We'll Create

```
src/lib/
├── airtable/
│   ├── client.ts              # Airtable API wrapper
│   ├── schema.ts              # Type definitions
│   └── config.ts              # Configuration
├── sync/
│   ├── airtable-to-postgres.ts # Sync logic
│   ├── scheduler.ts            # Cron job scheduler
│   └── types.ts                # Sync types
└── n8n/
    ├── client.ts               # n8n API wrapper (Phase 2)
    └── workflows.ts            # Workflow definitions

src/app/api/
├── sync/
│   ├── airtable.ts            # Sync endpoint
│   └── status.ts              # Status endpoint
└── n8n/
    └── trigger.ts             # Workflow trigger (Phase 2)

src/app/(client)/
├── leads/
│   ├── page.tsx               # Lead list
│   ├── [id]/page.tsx          # Lead detail
│   └── components/
│       ├── LeadCard.tsx
│       ├── LeadDetail.tsx
│       └── LeadFilter.tsx
└── admin/
    └── sync-status.tsx        # Admin sync dashboard
```

---

## 8. Testing Checklist

Before deploying to production:

```
[ ] Airtable API read works
[ ] Field mapping correct
[ ] Sync creates records in PostgreSQL
[ ] Sync updates existing records
[ ] Sync handles schema changes
[ ] Sync fails gracefully (no app crash)
[ ] Error logs are readable
[ ] Portal works when sync is disabled
[ ] n8n workflows still run during sync
[ ] Airtable untouched after sync
[ ] Performance acceptable (< 5 min sync time)
[ ] Database doesn't grow unbounded
```

---

## 9. Performance & Scalability

```
Expected performance:
├─ Sync time: < 5 minutes for 10k records
├─ UI load time: < 1 second for lead list
├─ Database size: ~100MB for 50k leads
├─ API calls to Airtable: ~50 per sync
└─ Cost impact: Minimal (read-only API calls)

If too slow, we can:
├─ Reduce sync frequency (10 min instead of 5)
├─ Batch process records (100 at a time)
├─ Add PostgreSQL indexes
├─ Use Airtable API pagination
└─ Cache in Redis (optional)
```

---

## Summary

**What we build**:
- Read-only sync from Airtable to PostgreSQL
- Every 5 minutes
- Portal displays cached data
- Users can interact with portal data locally
- n8n workflows run independently
- Everything monitored and logged

**What we don't touch**:
- Your Airtable base (read-only)
- Your n8n workflows (unchanged)
- Your existing automations (unaffected)
- Your data (safe and backed up)

**Risk level**: ✅ VERY LOW
- Read-only operations
- Separate database
- Easy to rollback
- No data modification

Ready to start? 🚀
