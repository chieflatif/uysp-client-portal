# SOP: Bulk Lead Import via Webhook

**Version:** 1.0  
**Date:** 2025-11-07  
**Owner:** Operations Team  
**Workflow:** UYSP Backlog Ingestion - Hardened (A8L1TbEsqHY6d4dH)

---

## Purpose

This SOP documents how to use the bulk lead import webhook for importing leads from UI, CSV files, or external systems into the UYSP lead database.

---

## When to Use This

**Use the webhook import for:**
- Campaign Manager UI bulk uploads
- Webinar attendee imports
- Event participant lists
- Partner lead lists
- Manual bulk imports with source tracking

**Do NOT use for:**
- Single lead creation (use Kajabi forms or manual entry)
- Kajabi automatic form submissions (use UYSP-Kajabi-API-Polling)
- Automated recurring imports (use scheduled CSV fetch)

---

## Webhook Endpoint

**URL:** `https://rebelhq.app.n8n.cloud/webhook/bulk-lead-import`  
**Method:** POST  
**Content-Type:** application/json  
**Authentication:** None (public endpoint - consider adding token)

---

## Request Format

### Required Fields per Lead:

```json
{
  "leads": [
    {
      "email": "required@example.com",      // Required
      "firstName": "John",                  // Required
      "lastName": "Smith",                  // Required
      "phone": "4155551234",                // Required (10 digits or E.164)
      "company": "Acme Corp",               // Optional
      "title": "VP Sales"                   // Optional
    }
  ],
  "sourceName": "Q4 2025 Webinar"          // Required - becomes Kajabi Tag
}
```

### Field Validation Rules:

**Email:**
- Must be valid format (name@domain.com)
- Automatically lowercased and trimmed
- Duplicates checked against existing Airtable records
- Invalid emails: Marked as "Archive", included in errors response

**Phone:**
- Must be 10 digits (US format)
- Accepts: "4155551234", "+14155551234", "(415) 555-1234"
- Automatically normalized to E.164: "+14155551234"
- Invalid phones: Repeating digits, <10 digits, all zeros → Archived

**sourceName:**
- Becomes a Kajabi Tag on the lead record
- Used for filtering/reporting
- Example: "Q4 2025 Webinar" → Shows in Kajabi Tags field
- Can be campaign name, event name, source identifier

---

## Response Format

### Success Response (200 OK):

```json
{
  "success": 142,
  "errors": [
    {
      "row": 5,
      "email": "invalid-email",
      "error": "Invalid email format"
    }
  ],
  "duplicates": [
    {
      "row": 8,
      "email": "existing@example.com",
      "existingRecordId": "Found in database"
    }
  ],
  "sourceTag": "Q4 2025 Webinar",
  "total": 150
}
```

**Response Fields:**
- `success`: Leads created in Airtable
- `errors`: Validation failures (see errors array for details)
- `duplicates`: Leads already in database (email match)
- `sourceTag`: The sourceName from request
- `total`: Total leads processed

---

## Standard Operating Procedure

### Procedure: Import Webinar Attendees

**Scenario:** You have a CSV of webinar attendees to import

**Steps:**

1. **Prepare CSV data:**
   - Required columns: Email, First Name, Last Name, Phone
   - Optional columns: Company, Title
   - Remove header row if parsing manually

2. **Convert to JSON:**
   ```javascript
   // In UI or via script:
   const leads = csvData.map(row => ({
     email: row.email,
     firstName: row.firstName,
     lastName: row.lastName,
     phone: row.phone,
     company: row.company || '',
     title: row.title || ''
   }));
   ```

3. **POST to webhook:**
   ```bash
   curl -X POST https://rebelhq.app.n8n.cloud/webhook/bulk-lead-import \
     -H "Content-Type: application/json" \
     -d '{
       "leads": [...],
       "sourceName": "Q4 2025 Webinar Attendees"
     }'
   ```

4. **Review response:**
   - Check `success` count matches expectations
   - Review `errors` array - fix data issues if needed
   - Review `duplicates` - expected for returning attendees

5. **Verify in Airtable:**
   - Open Leads table
   - Filter: `Source = "UI Import"` AND `Kajabi Tags contains "Q4 2025 Webinar"`
   - Verify count matches `success` in response
   - Spot-check phone format (+1 prefix), email format

6. **Monitor enrichment:**
   - Clay will automatically enrich these leads
   - Check back in 15-30 minutes
   - Verify `Phone Valid = TRUE` and `Location Country` populated

---

### Procedure: Handling Import Errors

**Scenario:** Response shows errors in errors array

**Common Errors:**

**1. Invalid Email Format:**
```json
{"row": 5, "email": "john@", "error": "Invalid email format"}
```
**Fix:** Correct email in source data, re-import that record

**2. Invalid Phone:**
```json
{"row": 12, "email": "jane@example.com", "error": "Invalid phone"}
```
**Fix:** Verify phone is 10 digits, correct format, re-import

**3. Duplicate:**
```json
{"row": 8, "email": "existing@example.com", "existingRecordId": "Found in database"}
```
**Fix:** This is expected behavior, lead already exists (skip)

---

### Procedure: Re-Importing After Fixes

**Scenario:** You corrected data issues and need to re-import

**Steps:**
1. Extract failed records from errors array
2. Fix data issues in source
3. Create new import request with ONLY fixed records
4. Use same `sourceName` for consistency
5. Verify all succeed this time

---

## Best Practices

### Source Naming Conventions:

**Good sourceName examples:**
- "Q4 2025 Webinar - Sales Mastery"
- "LinkedIn Campaign - Oct 2025"
- "Partner List - Acme Corp"
- "Event: SaaStr Annual 2025"

**Bad sourceName examples:**
- "test" (not descriptive)
- "leads" (too generic)
- "" (empty - use "Manual Import" as default)

**Why it matters:** sourceName becomes filterable tag for campaigns and reporting

---

### Batch Size Recommendations:

**Optimal:** 50-200 leads per request  
**Maximum:** 1,000 leads per request  
**Above 1,000:** Split into multiple requests

**Reasoning:**
- Webhook timeout: 30 seconds
- Airtable API rate limits
- Better error handling with smaller batches

---

### Data Quality Checks:

**Before importing, verify:**
- [ ] All emails valid format
- [ ] All phones 10 digits
- [ ] No missing required fields
- [ ] sourceName is descriptive and unique
- [ ] Removed existing customers/alumni

**This prevents high error rates and reduces manual cleanup.**

---

## Integration with Campaign Manager UI

### UI Flow:

1. Admin uploads CSV or enters leads manually
2. UI validates client-side (email format, required fields)
3. UI shows preview: "150 leads ready to import"
4. Admin clicks "Import"
5. UI POSTs to webhook
6. UI shows progress spinner
7. Response received
8. UI displays summary:
   ```
   ✅ 142 leads imported successfully
   ⚠️ 3 duplicates skipped
   ❌ 5 validation errors (see details)
   ```
9. Admin can download error report for fixes

### UI Implementation Notes:

**Timeout:** Set client timeout to 60 seconds (large batches)  
**Error Handling:** Display errors array in user-friendly format  
**Progress:** Show spinner with estimated time (1-2 sec per 10 leads)  
**Validation:** Pre-validate before sending to reduce errors

---

## Security Considerations

### Current State:
- ⚠️ Webhook is public (no authentication)
- ⚠️ No rate limiting
- ⚠️ Could be abused by bots/scrapers

### Recommended Enhancements:

**1. Add Webhook Token:**
```bash
# Update n8n webhook to check token parameter
curl https://rebelhq.app.n8n.cloud/webhook/bulk-lead-import?token=SECRET_TOKEN
```

**2. IP Whitelist:**
- Restrict webhook to Portal IP address only
- Configure in n8n workflow settings

**3. Rate Limiting:**
- Max 10 requests/minute per IP
- Max 1,000 leads/hour per source

**Priority:** Medium (implement before public launch)

---

## Monitoring & Metrics

### Success Metrics:

**Weekly Import Volume:**
- Target: 100-500 leads/week via webhook
- Peak: 1,000+ during event campaigns

**Quality Metrics:**
- Error rate: <5% (invalid data)
- Duplicate rate: 10-20% (expected for returning visitors)
- Processing time: <5 seconds for 100 leads

**Track in Analytics:**
- Imports by sourceName (which campaigns driving leads)
- Error trends (improving data quality over time)
- Duplicate patterns (audience overlap between campaigns)

---

## Appendix

### Sample Test Data:

```json
{
  "leads": [
    {
      "email": "test1@staging.com",
      "firstName": "Alice",
      "lastName": "Anderson",
      "phone": "4155551111",
      "company": "Alpha Inc",
      "title": "Sales Director"
    },
    {
      "email": "test2@staging.com",
      "firstName": "Bob",
      "lastName": "Builder",
      "phone": "4085552222",
      "company": "Beta Corp",
      "title": "VP Sales"
    },
    {
      "email": "invalid-email",
      "firstName": "Charlie",
      "lastName": "Chaplin",
      "phone": "123",
      "company": "Gamma LLC",
      "title": "AE"
    }
  ],
  "sourceName": "SOP Test Import"
}
```

**Expected Response:**
- success: 2 (Alice, Bob)
- errors: 1 (Charlie - invalid email & phone)
- duplicates: 0 (if fresh database)

---

**Document Location:** `uysp-client-portal/docs/sops/SOP-BULK-LEAD-IMPORT-WEBHOOK.md`  
**Related:** BULK-IMPORT-WEBHOOK-INTEGRATION.md, UYSP-SYSTEM-RUNBOOK.md

