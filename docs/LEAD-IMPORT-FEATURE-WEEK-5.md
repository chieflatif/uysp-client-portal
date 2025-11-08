# Lead Import Feature - Week 5 PRD

**Timeline:** Week 5 (Post-Mini-CRM)  
**Estimated:** 8-10 hours  
**Priority:** HIGH (user-requested core feature)  
**Status:** Ready for implementation

---

## 1. FEATURE OVERVIEW

### What & Why

**What:** Bulk lead import via CSV upload from leads page  
**Why:** Users need to manually upload lead lists (from events, purchased lists, partner referrals) without requiring Kajabi forms  
**Value:** Expands lead sources beyond just Kajabi, enables batch processing

### User Story

**As a client admin, I want to upload a CSV of leads with a campaign/source identifier so that I can bulk import leads, have them automatically enriched, and target them with campaigns.**

---

## 2. USER FLOW (DETAILED)

### Step 1: Initiate Import

**Location:** Leads page (`/leads`)  
**Action:** Click **"Import Leads"** button in page header (next to existing filters)

### Step 2: Upload Modal Opens

**Modal Components:**

**A. Header**
```
┌─────────────────────────────────────────┐
│ Import Leads                        [X] │
├─────────────────────────────────────────┤
```

**B. Campaign/Source Field (Required)**
```
│ Campaign/Source Name *                  │
│ [____________________________]          │
│ This creates a tag for tracking this    │
│ batch (e.g., "Webinar-Nov2025")        │
```

**C. CSV Upload Area**
```
│ ┌───────────────────────────────────┐   │
│ │   📄 Drag CSV here or click       │   │
│ │                                   │   │
│ │   [Browse Files]                  │   │
│ └───────────────────────────────────┘   │
│                                         │
│ Required columns: Email, First Name,   │
│ Last Name                               │
│ Optional: Phone, Company, Title         │
```

### Step 3: File Selected → Validation

**Auto-validates:**
- CSV format valid
- Required columns present (email, firstName, lastName)
- Email format validation
- Phone format validation
- Duplicate detection (within file)

**Shows preview:**
```
│ Preview (First 5 of 145 rows):          │
│ ┌──────────────────────────────────┐    │
│ │ ✅ john@example.com | John Doe   │    │
│ │ ✅ sarah@company.com | Sarah Lee │    │
│ │ ⚠️ invalid-email | Bad Row       │    │
│ │ ✅ mike@startup.io | Mike Chen   │    │
│ │ ⚠️ Duplicate: john@example.com   │    │
│ └──────────────────────────────────┘    │
│                                         │
│ Summary:                                │
│ • Valid: 142 leads                      │
│ • Errors: 2 (invalid email)             │
│ • Duplicates: 1                         │
```

### Step 4: Column Mapping (If Needed)

**If CSV columns don't match exactly:**
```
│ Map Your Columns:                       │
│ Your CSV     →    Our System            │
│ [email     ▼] →   Email (required)      │
│ [first     ▼] →   First Name (required) │
│ [last      ▼] →   Last Name (required)  │
│ [mobile    ▼] →   Phone (optional)      │
│ [org       ▼] →   Company (optional)    │
```

### Step 5: Confirm & Import

**Confirmation:**
```
│ [Cancel]              [Import 142 Leads]│
└─────────────────────────────────────────┘
```

### Step 6: Progress Tracking

**During import:**
```
│ Importing leads...                      │
│ ████████░░░░░░░░░░░░ 65/142 (46%)      │
│                                         │
│ Writing to Airtable... (do not close)   │
```

### Step 7: Results Summary

**After completion:**
```
│ ✅ Import Complete!                     │
│                                         │
│ • 142 leads imported successfully       │
│ • 2 errors (invalid emails)             │
│ • 1 duplicate skipped                   │
│                                         │
│ Source tag created: "Webinar-Nov2025"   │
│                                         │
│ Next steps:                             │
│ • Leads enriching via Clay (~2-5 min)   │
│ • Will sync to database (~5 min)        │
│ • Use tag to create campaign            │
│                                         │
│ [Download Error Report] [Done]          │
```

---

## 3. TECHNICAL SPECIFICATION

### Frontend Component

**File:** `src/components/leads/ImportLeadsModal.tsx`

**Dependencies:**
- File upload: `react-dropzone` (already in project?) or native `<input type="file">`
- CSV parsing: `papaparse` (need to install)
- Progress: React state

**Component Structure:**
```tsx
<Dialog open={isOpen} onClose={onClose}>
  <DialogHeader>Import Leads</DialogHeader>
  
  <DialogContent>
    {/* Step 1: Source name input */}
    <Input 
      label="Campaign/Source Name" 
      required 
      placeholder="e.g., Webinar-Nov2025"
    />
    
    {/* Step 2: CSV upload */}
    <DropZone 
      accept=".csv"
      onDrop={handleFileUpload}
    />
    
    {/* Step 3: Preview & validation */}
    {preview && (
      <ValidationResults 
        valid={validLeads}
        errors={errorLeads}
        duplicates={duplicateLeads}
      />
    )}
    
    {/* Step 4: Column mapping (if needed) */}
    {needsMapping && (
      <ColumnMapper 
        csvColumns={detectedColumns}
        requiredFields={['email', 'firstName', 'lastName']}
      />
    )}
    
    {/* Step 5: Progress */}
    {importing && (
      <ProgressBar 
        current={processed}
        total={totalLeads}
      />
    )}
    
    {/* Step 6: Results */}
    {results && (
      <ImportSummary 
        success={results.success}
        errors={results.errors}
        duplicates={results.duplicates}
      />
    )}
  </DialogContent>
  
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button onClick={handleImport} disabled={!canImport}>
      Import {validLeads.length} Leads
    </Button>
  </DialogActions>
</Dialog>
```

### Backend API

**Endpoint:** `POST /api/leads/import`

**Request Body:**
```typescript
{
  sourceName: string;      // e.g., "Webinar-Nov2025"
  leads: Array<{
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    title?: string;
  }>;
}
```

**Processing Logic:**
```typescript
// 1. Validate all leads
// 2. Check for duplicates in Airtable (by email + phone)
// 3. Batch write to Airtable with source tag
// 4. Log BULK_IMPORT activity
// 5. Return results
```

**Response:**
```typescript
{
  success: number;         // 142
  errors: Array<{
    row: number;
    lead: object;
    error: string;
  }>;
  duplicates: Array<{
    email: string;
    existingRecordId: string;
  }>;
  sourceTag: string;       // "Webinar-Nov2025"
  airtableRecordIds: string[];
}
```

### Airtable Integration

**Write to:** Leads table in client's Airtable base

**Fields to populate:**
- Email, First Name, Last Name (required)
- Phone, Company, Title (if provided)
- **Source tag:** Add to Kajabi Tags field (creates new tag)
- Client ID (from session)
- Imported At (timestamp)
- Status: "New"

**Triggers automatically:**
- Clay enrichment (watches Airtable for new records)
- PostgreSQL sync (5-min cron job)

### Activity Logging

**Add to event types:**
```typescript
BULK_IMPORT: 'BULK_IMPORT',  // In EVENT_TYPES
```

**Log details:**
```typescript
await logLeadActivity({
  eventType: 'BULK_IMPORT',
  eventCategory: 'SYSTEM',
  description: `Bulk import: ${successCount} leads from ${sourceName}`,
  metadata: {
    source_name: sourceName,
    total_leads: leads.length,
    success_count: successCount,
    error_count: errors.length,
    duplicate_count: duplicates.length,
    imported_by_user_id: session.user.id,
    imported_by_email: session.user.email,
  },
  source: 'ui:bulk-import',
  createdBy: session.user.id,
});
```

---

## 4. IMPLEMENTATION CHECKLIST

### Day 1: Backend API (3 hours)
- [ ] Install `papaparse` dependency
- [ ] Create `POST /api/leads/import` endpoint
- [ ] CSV parsing logic
- [ ] Email/phone validation
- [ ] Duplicate detection (query Airtable)
- [ ] Batch write to Airtable (max 10 records per call)
- [ ] Activity logging
- [ ] Error handling
- [ ] Return results summary

### Day 2: Frontend Modal (3 hours)
- [ ] Create `ImportLeadsModal.tsx` component
- [ ] Source name input field
- [ ] CSV file upload (drag-drop)
- [ ] Preview table (first 5 rows)
- [ ] Validation results display
- [ ] Progress bar during import
- [ ] Results summary screen
- [ ] Error report download

### Day 3: Integration & Testing (2 hours)
- [ ] Add "Import Leads" button to leads page header
- [ ] Wire modal to API endpoint
- [ ] Test with 100+ lead CSV
- [ ] Test error handling (invalid emails, duplicates)
- [ ] Verify source tag appears in campaign creation
- [ ] Write component tests
- [ ] Write API tests

### Day 4: Polish (1 hour)
- [ ] Loading states
- [ ] Error messages
- [ ] Column mapping UI (if needed)
- [ ] Mobile responsive
- [ ] Documentation

**Total: 9 hours**

---

## 5. CSV FORMAT SPECIFICATION

### Required Columns
```csv
email,firstName,lastName
john@example.com,John,Doe
sarah@company.com,Sarah,Lee
```

### Full Format (All Columns)
```csv
email,firstName,lastName,phone,company,title
john@example.com,John,Doe,4085551234,Acme Corp,VP Sales
sarah@company.com,Sarah,Lee,4085555678,Tech Inc,Director
```

### Validation Rules
- **Email:** Must be valid format, unique within file
- **First Name:** Required, max 255 chars
- **Last Name:** Required, max 255 chars
- **Phone:** Optional, validated format (digits only, 10-15 chars)
- **Company:** Optional, max 255 chars
- **Title:** Optional, max 255 chars

---

## 6. AIRTABLE INTEGRATION DETAILS

### Batch Write Strategy

**Airtable API limits:** Max 10 records per request

**Implementation:**
```typescript
// Chunk leads into batches of 10
const batches = chunk(validLeads, 10);

for (const batch of batches) {
  await airtable.create('Leads', batch.map(lead => ({
    fields: {
      'Email': lead.email,
      'First Name': lead.firstName,
      'Last Name': lead.lastName,
      'Phone': lead.phone || '',
      'Company': lead.company || '',
      'Title': lead.title || '',
      'Kajabi Tags': [sourceName],  // Source tag
      'Client ID': clientId,
      'Status': 'New',
      'Imported At': new Date().toISOString(),
    }
  })));
  
  // Progress update after each batch
  updateProgress(processedCount += batch.length);
}
```

### Duplicate Detection

**Check before import:**
```typescript
// Query Airtable for existing leads
const existingLeads = await airtable.list('Leads', {
  filterByFormula: `OR(
    ${emails.map(e => `{Email}='${e}'`).join(', ')}
  )`
});

// Mark duplicates, skip in import
```

### Source Tag Behavior

**Tag Format:** User-provided string (e.g., "Webinar-Nov2025")

**How it's used:**
1. Written to `Kajabi Tags` field in Airtable (array)
2. Syncs to PostgreSQL `kajabi_tags` column
3. Appears in campaign creation "Target Tags" dropdown
4. Allows targeting: "Send campaign to all leads with tag 'Webinar-Nov2025'"

---

## 7. UI SPECIFICATIONS

### Import Button Placement

**Location:** Leads page header (top-right area)

```tsx
<PageHeader>
  <Title>Leads</Title>
  <Actions>
    <FilterControls />
    <Button onClick={openImportModal}>
      <Upload className="w-4 h-4" />
      Import Leads
    </Button>
  </Actions>
</PageHeader>
```

### Modal Design

**Size:** Medium (600px wide)  
**Scrollable:** Yes (for large previews)  
**Close:** X button, ESC key, click outside  
**Style:** Consistent with existing modal pattern

### Progress Indicator

**During import:**
- Linear progress bar (0-100%)
- Current/total count: "Processing 65/142 leads..."
- Estimated time remaining (based on avg time per lead)
- **Critical:** Prevent modal close during import

### Error Report

**Downloadable CSV format:**
```csv
Row,Email,First Name,Last Name,Error
3,invalid-email,Bad,Data,"Invalid email format"
42,duplicate@test.com,John,Doe,"Duplicate - already exists (rec123)"
```

---

## 8. VALIDATION LOGIC

### Email Validation
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  errors.push({ row, error: 'Invalid email format' });
}
```

### Phone Validation
```typescript
// Strip non-digits
const cleaned = phone.replace(/\D/g, '');

// Must be 10-15 digits
if (cleaned.length < 10 || cleaned.length > 15) {
  warnings.push({ row, warning: 'Phone may be invalid' });
}
```

### Duplicate Detection (Two Levels)

**Level 1: Within CSV**
```typescript
const seen = new Set();
leads.forEach((lead, idx) => {
  const key = `${lead.email}:${lead.phone}`;
  if (seen.has(key)) {
    duplicates.push({ row: idx, lead });
  }
  seen.add(key);
});
```

**Level 2: Against Airtable**
```typescript
const existing = await checkAirtableForDuplicates(emails);
const duplicateEmails = new Set(existing.map(r => r.email));
leads = leads.filter(l => !duplicateEmails.has(l.email));
```

---

## 9. ACTIVITY LOGGING

### Event Type Addition

**Add to:** `src/lib/activity/event-types.ts`

```typescript
export const EVENT_TYPES = {
  // ... existing types
  
  // Bulk Operations (NEW)
  BULK_IMPORT: 'BULK_IMPORT',
} as const;
```

### Logging Implementation

**When:** After Airtable batch write completes

**What to log:**
```typescript
{
  eventType: 'BULK_IMPORT',
  eventCategory: 'SYSTEM',
  description: `Bulk import: 142 leads from "Webinar-Nov2025"`,
  metadata: {
    source_name: 'Webinar-Nov2025',
    total_leads: 145,
    success_count: 142,
    error_count: 2,
    duplicate_count: 1,
    imported_by_user_id: session.user.id,
    imported_by_email: session.user.email,
    file_name: 'leads.csv',
    import_duration_ms: 3420,
  },
  source: 'ui:bulk-import',
  createdBy: session.user.id,
}
```

**Where visible:**
- Admin activity browser (as SYSTEM event)
- Sortable/filterable by BULK_IMPORT type

---

## 10. DOWNSTREAM EFFECTS

### Automatic Triggers (Existing System)

**After Airtable write:**

**1. Clay Enrichment (Automatic)**
- Triggers on new Airtable records
- Enriches company, title, LinkedIn
- Writes back to Airtable
- Timeline: 2-5 minutes per lead

**2. PostgreSQL Sync (5-min Cron)**
- Existing cron job picks up new leads
- Syncs from Airtable → PostgreSQL
- Timeline: Next 5-min interval

**3. Campaign Targeting (Manual)**
- Source tag appears in campaign creation dropdown
- User creates campaign targeting "Webinar-Nov2025" tag
- Leads eligible for enrollment

### New Source Tag Usage

**In Campaign Manager:**
```
Create Campaign:
  Target Tags: [Select tags ▼]
    ☑ Webinar-Nov2025 (142 leads)  ← NEW TAG
    ☐ chatgpt_use_cases (89 leads)
    ☐ problem_mapping (34 leads)
```

---

## 11. ERROR HANDLING

### Client-Side Errors

| Error | Message | Action |
|-------|---------|--------|
| No file selected | "Please select a CSV file" | Disable import button |
| Invalid CSV format | "File is not valid CSV" | Show example format |
| Missing required columns | "CSV must have: email, firstName, lastName" | Show column list |
| File too large (>5MB) | "File exceeds 5MB limit" | Suggest splitting |

### Server-Side Errors

| Error | Message | Recovery |
|-------|---------|----------|
| Airtable API rate limit | "Rate limit reached, retrying..." | Auto-retry with backoff |
| Airtable down | "Unable to connect to Airtable" | Queue for retry |
| Duplicate leads | "X duplicates skipped" | Show in summary |
| Invalid data | "X rows have errors" | Downloadable report |

### Partial Import Handling

**If import partially fails:**
- Log which leads succeeded
- Log which leads failed
- Allow re-import of failed leads only
- Don't lose progress

---

## 12. TESTING STRATEGY

### Unit Tests

**File:** `__tests__/api/leads/import.test.ts`

- [ ] Validates email format
- [ ] Detects duplicates within CSV
- [ ] Detects duplicates in Airtable
- [ ] Handles missing required fields
- [ ] Batch processing works (10 records per batch)
- [ ] Activity logging works
- [ ] Returns correct error messages

### Integration Tests

**File:** `__tests__/components/ImportLeadsModal.test.tsx`

- [ ] Modal opens and closes
- [ ] File upload works
- [ ] Validation displays errors
- [ ] Progress bar updates
- [ ] Results summary shows
- [ ] Error report downloads

### Manual Testing

- [ ] Upload 100+ lead CSV
- [ ] Verify all leads in Airtable
- [ ] Verify source tag created
- [ ] Verify Clay enrichment triggers
- [ ] Verify PostgreSQL sync picks up leads
- [ ] Verify source tag in campaign dropdown

---

## 13. DELIVERABLES

### Code Files

**New:**
- `src/components/leads/ImportLeadsModal.tsx` (modal component)
- `src/app/api/leads/import/route.ts` (API endpoint)
- `src/lib/csv-parser.ts` (CSV parsing utilities)
- `src/lib/validation.ts` (email/phone validators)
- `__tests__/api/leads/import.test.ts` (API tests)
- `__tests__/components/ImportLeadsModal.test.tsx` (component tests)

**Modified:**
- `src/app/(client)/leads/page.tsx` (add Import button)
- `src/lib/activity/event-types.ts` (add BULK_IMPORT type)
- `package.json` (add papaparse dependency)

### Documentation

- `docs/implementation/lead-import-complete.md` (completion report)
- Update PRD with import feature section

---

## 14. SUCCESS CRITERIA

**Feature is COMPLETE when:**

- [ ] Can upload CSV with 100+ leads
- [ ] Column mapping works for flexible formats
- [ ] Duplicates detected and skipped
- [ ] Source tag created in Airtable
- [ ] All valid leads written to Airtable
- [ ] Clay enrichment triggers automatically
- [ ] PostgreSQL sync populates leads (within 5 min)
- [ ] Source tag appears in campaign creation dropdown
- [ ] Error report downloadable
- [ ] BULK_IMPORT activity logged
- [ ] All tests passing
- [ ] No errors in production logs

---

## 15. DEPENDENCIES

**NPM Packages:**
```json
{
  "papaparse": "^5.4.1",      // CSV parsing
  "@types/papaparse": "^5.3.7" // TypeScript types
}
```

**Install:**
```bash
npm install papaparse @types/papaparse
```

---

## 16. TIMELINE

**Day 1 (3 hours):** Backend API + validation  
**Day 2 (3 hours):** Frontend modal component  
**Day 3 (2 hours):** Integration + manual testing  
**Day 4 (1 hour):** Automated tests  
**Day 5 (1 hour):** Polish + documentation

**Total: 10 hours over 5 days (or 2 days if full-time)**

---

## 17. RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| Large CSV crashes browser | Limit to 500 leads per import |
| Airtable rate limits | Batch with delays (100ms between batches) |
| Duplicate detection slow | Query Airtable efficiently (batch email lookups) |
| Import fails mid-process | Track progress, allow resume |

---

**BUILD THIS IN WEEK 5 - Ready for implementation after Mini-CRM stable in production.**

