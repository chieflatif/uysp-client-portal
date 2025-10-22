# API Contracts: Airtable Write Operations

**Date**: 2025-10-20  
**Status**: Defined (Pending Implementation)  
**SOP Reference**: SOP§2.1 - API Contract Definition

---

## Overview

These API contracts define write operations that update Airtable directly, maintaining it as the single source of truth. All operations follow the hybrid architecture where:
- **Writes** go to Airtable (authoritative)
- **Reads** come from PostgreSQL (cached)
- **Sync** runs every 5 minutes (Airtable → PostgreSQL)

---

## Contract 1: Add Note to Lead

### Endpoint
```
POST /api/leads/[id]/notes
```

### Purpose
Add a note to a lead's Notes field in Airtable. Notes are appended to the existing rich text field.

### Request Schema
```typescript
{
  leadId: string;          // UUID of lead in PostgreSQL (maps to Airtable record)
  content: string;         // Note content (1-5000 chars)
  type: 'Call' | 'Email' | 'Text' | 'Meeting' | 'General' | 'Issue' | 'Success';
}
```

### Success Response Schema (201 Created)
```typescript
{
  success: true;
  airtableRecordId: string;  // Airtable record ID that was updated
  notePreview: string;        // First 100 chars of appended note
  timestamp: string;          // ISO timestamp when note was added
}
```

### Error Response Schemas

**401 Unauthorized**
```typescript
{
  error: 'Unauthorized';
  code: 'UNAUTHORIZED';
}
```

**400 Bad Request**
```typescript
{
  error: string;              // Human-readable error
  code: 'VALIDATION_ERROR';
  field?: string;             // Which field failed validation
}
```

**500 Internal Server Error**
```typescript
{
  error: string;
  code: 'AIRTABLE_ERROR' | 'DATABASE_ERROR';
  details?: string;           // Technical details (dev only)
}
```

### Implementation Requirements
1. User must be authenticated
2. User must have permission to access the lead's client
3. Lead must exist in PostgreSQL (to get Airtable record ID)
4. Content must be sanitized (prevent XSS)
5. Note must be appended to Airtable's `Notes` field with timestamp and user
6. Activity logged in PostgreSQL `activity_log` table
7. Format: `\n\n[{type}] {timestamp} - {userName}:\n{content}`

---

## Contract 2: Remove Lead from Campaign

### Endpoint
```
POST /api/leads/[id]/remove-from-campaign
```

### Purpose
Remove a lead from active SMS campaign by updating Airtable status fields. This triggers n8n automations to stop messaging.

### Request Schema
```typescript
{
  leadId: string;           // UUID of lead in PostgreSQL
  reason: string;           // Why lead is being removed (1-500 chars)
}
```

### Success Response Schema (200 OK)
```typescript
{
  success: true;
  airtableRecordId: string;
  updatedFields: {
    'Processing Status': 'Stopped';
    'SMS Stop': true;
    'SMS Stop Reason': string;
    'HRQ Status': 'Completed';
  };
  timestamp: string;
}
```

### Error Response Schemas
(Same as Contract 1)

### Implementation Requirements
1. User must be authenticated
2. User must have permission to access the lead's client
3. Lead must exist and have valid Airtable record ID
4. Update Airtable fields atomically:
   - `Processing Status` → "Stopped"
   - `SMS Stop` → true
   - `SMS Stop Reason` → provided reason
   - `HRQ Status` → "Completed"
5. Activity logged with action `LEAD_REMOVED_FROM_CAMPAIGN`
6. Existing n8n workflows will respond to these field changes

---

## Contract 3: Change Lead Status

### Endpoint
```
POST /api/leads/[id]/status
```

### Purpose
Change a lead's HRQ Status in Airtable to indicate manual processing.

### Request Schema
```typescript
{
  leadId: string;
  status: 'Qualified' | 'Archive' | 'Review' | 'Manual Process';
  reason?: string;          // Optional reason for status change
}
```

### Success Response Schema (200 OK)
```typescript
{
  success: true;
  airtableRecordId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}
```

### Error Response Schemas
(Same as Contract 1, plus invalid status value)

### Implementation Requirements
1. User must be authenticated
2. User must have permission to access the lead's client
3. Status must be valid enum value
4. Update Airtable `HRQ Status` field
5. If changing to "Manual Process", also update `Processing Status` to "Stopped"
6. Activity logged with action `LEAD_STATUS_CHANGED`
7. Reason stored in activity log details if provided

---

## Contract 4: Get Lead from Airtable (Single Record)

### Endpoint
```
GET /api/leads/[id]/airtable
```

### Purpose
Fetch fresh data directly from Airtable for a single lead (bypasses cache).

### Request Schema
```
No body (GET request with URL parameter)
```

### Success Response Schema (200 OK)
```typescript
{
  success: true;
  airtableRecordId: string;
  fields: {
    'First Name': string;
    'Last Name': string;
    'Email': string;
    'Phone': string;
    'Company': string;
    'Job Title': string;
    'ICP Score': number;
    'Processing Status': string;
    'HRQ Status': string;
    'SMS Stop': boolean;
    'SMS Stop Reason': string;
    'Booked': boolean;
    'Notes': string;          // Full notes field
    // ... all other Airtable fields
  };
  lastSynced: string;         // When PostgreSQL was last synced
}
```

### Error Response Schemas
(Same as Contract 1)

### Implementation Requirements
1. User must be authenticated
2. User must have permission to access the lead's client
3. Direct Airtable API call (read-only)
4. Used for "refresh" functionality in UI
5. Does not update PostgreSQL cache
6. Rate limit: 5 requests per minute per user

---

## Shared Requirements (All Contracts)

### Authentication
- All endpoints require valid JWT token
- Token must contain user ID and client ID
- Session must be active (not expired)

### Authorization
- Users can only access leads belonging to their client
- Admins can access all leads
- Validation: `lead.clientId === user.clientId || user.role === 'ADMIN'`

### Rate Limiting
- Write operations: 10 requests per minute per user
- Read operations: 30 requests per minute per user
- Rate limit headers included in all responses

### Logging
- All operations logged to `activity_log` table
- Log includes: userId, leadId, action, timestamp, IP address
- Errors logged with full stack trace (backend only)

### Error Handling
- All Airtable API errors caught and wrapped
- User-friendly error messages returned
- Technical details only in dev mode
- Failed writes do not update PostgreSQL
- No partial updates (atomic operations)

---

## Testing Requirements (SOP§1.1)

Each contract must have:

1. **Unit Tests**
   - Valid request → success response
   - Missing auth → 401 error
   - Invalid data → 400 error
   - Airtable error → 500 error with proper message

2. **Integration Tests**
   - End-to-end: Request → Airtable update → Response
   - Verify Airtable fields actually updated
   - Verify activity log created
   - Verify PostgreSQL not directly modified

3. **Security Tests**
   - Cross-client access blocked
   - SQL injection prevented
   - XSS prevented in content
   - Rate limiting enforced

---

## Implementation Order

1. ✅ Define contracts (this document)
2. ⏳ Write failing tests (SOP§1.1 Step 1)
3. ⏳ Implement Airtable client write methods
4. ⏳ Implement API endpoints
5. ⏳ Run quality gates (SOP§3.1)
6. ⏳ Deploy and monitor

---

**Status**: Contracts defined and ready for TDD implementation
**Next Step**: Write failing tests per SOP§1.1






