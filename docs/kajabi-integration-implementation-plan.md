# Kajabi API Lead Ingestion & SMS Update - Implementation Plan

**Date**: 2025-11-01  
**Branch**: `main` (production - NOT feature/two-way-ai-messaging)  
**Type**: Production interim update  
**Status**: Planning → Implementation

---

## 🎯 OBJECTIVE

Shift from Kajabi webhook to API polling for real-time lead SMS follow-up.

### Scope
1. **Kajabi API Integration** → Poll leads from web forms in real-time
2. **Lead Flow** → Kajabi → Airtable → Enrichment → SMS queue
3. **SMS Timing** → 60 min minimum, 3 hour maximum after registration
4. **Time Window** → 8 AM - 8 PM Eastern (changed from 9 AM)
5. **Reply Tracking** → Detect SMS replies + email notifications
6. **Message Mapping** → Different message per form/lead source

---

## 📋 EVIDENCE COLLECTED (SOP§7.4)

### API Documentation Research (SOP§7.3)
- **Tool Used**: Exa Web Search + Context7 (no Kajabi lib in Context7)
- **Kajabi API Type**: REST API (confirmed)
- **Documentation Source**: http://developers.kajabi.com
- **API Access**: Pro plan only (Sept 2024 release)
- **Authentication**: User API Keys (Settings → Public API)

### Kajabi API Capabilities
**Webhooks Available**:
- New purchases
- Member profile updates  
- New user sign-ups

**Public API** (requires confirmation):
- Members/Contacts endpoint
- Forms/Submissions endpoint
- Tags/Metadata
- Timestamps (created_at, updated_at)

**Polling Recommendation**: 5-minute interval for hot leads (industry best practice)

### SimpleTexting API Capabilities
**✅ REPLY TRACKING CONFIRMED**:
- **SMS Forwarding Webhook** (GET request): `from`, `to`, `subject`, `text`
- **MMS Forwarding Webhook** (POST request with JSON body)
- **Delivery Reports Webhook**
- **Unsubscribe Webhook**
- **Configuration**: Settings → API → Webhooks tab OR API endpoint

### Airtable Schema Validation (SOP§7.2)
- **Base ID**: app4wIsBfpJTg7pWS
- **Leads Table**: tblYUvhGADerbD8EO (READONLY - requires permission)
- **Protection Level**: READ ONLY (must request explicit permission for writes)

**NEW Kajabi Fields Found** (already in schema):
- `Kajabi Contact ID` (fldTTtiojQGiqRbdD) - API lookup key
- `Campaign Assignment` (fld3itEgizyfurSOc) - SMS campaign (based on form)
- `Lead Source Detail` (fldKVgfCZeZ20e4LZ) - human-readable source
- `Kajabi Member Status` (fldjLHXIiQ1qf2Boi) - Prospect/Active/Trial/Churned
- `Kajabi Last Sync` (fldPTgYHihNPFY8zR) - timestamp
- `Kajabi Tags` (fldQ7UAfiMzqgY1W9) - for coaching client detection

**Timing Control Fields**:
- `Imported At` (fldEB7PlLYEdZ5MUj) - registration timestamp
- `SMS Last Sent At` (fldjHyUk48hUwUq6O) - last message timestamp
- `SMS Batch Control` (fldqsBx3ZiuPC0bv3) - queue control

**SMS Infrastructure** (from COMPLETE-DEPENDENCY-MATRIX.md):
- Provider: SimpleTexting API
- Existing workflows: `UYSP-ST-Delivery V2` (delivery tracking only)
- Time window enforcement: Currently 9 AM - 5 PM ET in scheduler
- 24-hour duplicate prevention logic exists

### Active N8N Workflows (SOP§7.1)
```json
{
  "UYSP-Calendly-Booked": "LiVE3BlxsFkHhG83",
  "UYSP-ST-Delivery V2": "vA0Gkp2BrxKppuSu",
  "UYSP-Twilio-Inbound-Messages": "ujkG0KbTYBIubxgK"
}
```

**Key Finding**: No existing Kajabi workflow or SimpleTexting inbound reply handler (NEW builds required)

---

## 🏗️ ARCHITECTURE DESIGN

### Workflow 1: Kajabi API Polling → Airtable Import
**Name**: `UYSP-Kajabi-Lead-Ingestion`  
**Trigger**: Cron (every 5 minutes)  
**Flow**:
```
Schedule (Cron)
  ↓
HTTP Request → Kajabi API (GET /members?filter[created_since]={last_poll})
  ↓
Filter New Leads (check Kajabi Contact ID not in Airtable)
  ↓
Transform Data (map fields)
  ↓
Airtable → Create Records (Leads table)
  ↓
Set Campaign Assignment (based on form ID)
  ↓
Update Last Poll Timestamp (Settings table)
```

**Kajabi → Airtable Field Mapping**:
```javascript
{
  // Kajabi API field → Airtable field
  "id": "Kajabi Contact ID",
  "email": "Email",
  "phone": "Phone",
  "first_name": "First Name",
  "last_name": "Last Name",
  "tags": "Kajabi Tags",
  "status": "Kajabi Member Status",
  "created_at": "Imported At",
  "form_id": "Campaign Assignment", // Maps to SMS template
  "form_name": "Lead Source Detail",
  "company": "Company",
  "title": "Job Title"
}
```

**Campaign Assignment Logic** (form_id → Campaign Assignment):
```javascript
// User must provide this mapping
const FORM_CAMPAIGN_MAP = {
  "form_abc123": "webinar_jb_2024",
  "form_def456": "webinar_sales_2024",
  "form_ghi789": "webinar_ai_2024",
  "form_jkl012": "newsletter_nurture",
  // ... user will provide complete mapping
  "default": "default_nurture"
};
```

### Workflow 2: SMS Scheduler with Timing Logic
**Name**: `UYSP-Kajabi-SMS-Scheduler`  
**Trigger**: Cron (every 15 minutes)  
**Flow**:
```
Schedule (Cron)
  ↓
Check Time Window (8 AM - 8 PM ET)
  ↓ (if outside window, exit)
Airtable → List Records WHERE:
  - Campaign Assignment IS NOT EMPTY
  - SMS Status = "Not Sent"
  - Imported At >= 60 minutes ago
  - Imported At <= 3 hours ago
  - SMS Batch Control = "Active" (safety)
  ↓
Get SMS Template (from SMS_Templates table by Campaign Assignment)
  ↓
SimpleTexting API → Send SMS
  ↓
Airtable → Update Record (SMS Status, SMS Last Sent At, SMS Sent Count)
  ↓
SMS_Audit → Create Record (for tracking)
```

**Timing Logic Implementation**:
```javascript
// Node: Check Time Window
const now = new Date();
const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
const hour = etTime.getHours();

// 8 AM - 8 PM ET check
if (hour < 8 || hour >= 20) {
  return { skip: true, reason: "Outside time window (8 AM - 8 PM ET)" };
}

// Node: Filter Leads by Timing
const leads = items.map(lead => {
  const importedAt = new Date(lead.json.Imported_At);
  const now = new Date();
  const minutesSinceImport = (now - importedAt) / (1000 * 60);
  
  // 60 min minimum, 3 hour maximum
  if (minutesSinceImport >= 60 && minutesSinceImport <= 180) {
    return lead;
  }
}).filter(Boolean);
```

### Workflow 3: SimpleTexting Reply Handler → Email Notification
**Name**: `UYSP-SimpleTexting-Reply-Handler`  
**Trigger**: Webhook (SimpleTexting SMS Forwarding)  
**Flow**:
```
Webhook (GET /webhook/simpletexting-reply)
  ↓
Parse Query Params (from, to, subject, text)
  ↓
Airtable → Find Lead by Phone
  ↓
Update Lead Record:
  - Last Reply At = now()
  - Last Reply Text = text
  - Conversation Status = "Replied - [AI classify intent]"
  - Reply Count += 1
  ↓
Get Lead Full Data (Name, Email, Company, Job Title)
  ↓
Gmail/SMTP → Send Email Notification:
  - To: [USER_PROVIDED_EMAIL]
  - Subject: "SMS Reply from {First Name} {Last Name}"
  - Body: [formatted with lead info + reply text]
  ↓
SMS_Audit → Create Record (Event: "reply_received")
```

**Email Template**:
```
Subject: SMS Reply from {First Name} {Last Name}

📱 New SMS Reply Received

Lead Info:
- Name: {First Name} {Last Name}
- Phone: {Phone}
- Email: {Email}
- Company: {Company}
- Job Title: {Job Title}
- Campaign: {Campaign Assignment}

Reply Text:
"{text}"

Reply Time: {timestamp}

---
View in Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/{record_id}
```

---

## 🔐 SECURITY & CREDENTIALS

**Required Credentials** (to be obtained from user):
1. **Kajabi API**:
   - Client ID
   - Client Secret
   - Base URL (likely `https://api.kajabi.com`)

2. **SimpleTexting API**:
   - API Token (Bearer token)
   - Webhook URL configuration

3. **Airtable**:
   - Already configured in N8N

4. **Email/Gmail**:
   - SMTP credentials OR Gmail OAuth

5. **Configuration Values** (user must provide):
   - Form ID → Campaign Assignment mapping
   - Email destination for reply notifications
   - Enrichment service details (if different from existing)

---

## ⚠️ CONSTRAINTS & SAFETY

### Airtable Protection (SOP§7.2)
- **Leads table is READONLY** - must request explicit user permission before ANY writes
- **SMS_Audit is APPEND ONLY** - no updates or deletes
- **Must use MCP tools** - no direct API calls

### N8N Workflow Enforcement (SOP§7.1)
**MANDATORY SEQUENCE**:
1. `mcp_n8n_n8n_create_workflow` (initial build)
2. `mcp_n8n_validate_workflow` (PRE validation)
3. `mcp_n8n_n8n_workflow_versions` (backup before any changes)
4. `mcp_n8n_n8n_update_partial_workflow` (≤5 ops per update)
5. `mcp_n8n_validate_workflow` (POST validation)
6. Capture: workflow_id, execution_id, validation_results

### Non-Blocking Requirements
- ✅ Don't affect existing SMS scheduler workflows
- ✅ Don't touch two-way AI messaging code (separate branch)
- ✅ Use existing SimpleTexting infrastructure
- ❌ No click tracking (keep simple)
- ❌ No fancy features

---

## 📝 USER INPUT REQUIRED

**Before implementation, user must provide**:

1. **Kajabi API Access**:
   - [ ] Confirm Pro plan subscription
   - [ ] Provide Client ID
   - [ ] Provide Client Secret
   - [ ] Confirm API base URL
   - [ ] List of form IDs to track

2. **Form → Campaign Mapping**:
   ```
   [
     { "form_id": "abc123", "form_name": "JB Webinar 2024", "campaign": "webinar_jb_2024", "message": "..." },
     { "form_id": "def456", "form_name": "Sales Webinar 2024", "campaign": "webinar_sales_2024", "message": "..." },
     // ... complete list
   ]
   ```

3. **Email Configuration**:
   - [ ] Email address for reply notifications
   - [ ] Preferred email service (Gmail/SMTP)
   - [ ] Email credentials (if not already configured)

4. **Enrichment Service**:
   - [ ] Enrichment provider details (if different from existing Clay integration)
   - [ ] When enrichment should trigger (before/after SMS?)

5. **Permissions**:
   - [ ] **EXPLICIT PERMISSION** to write to Leads table (READONLY protection)
   - [ ] Confirmation to create new N8N workflows

---

## 🧪 TESTING CHECKLIST

### Phase 1: Kajabi API Connection
- [ ] Test Kajabi API authentication
- [ ] Verify members/contacts endpoint response
- [ ] Confirm form ID is included in response
- [ ] Validate timestamp fields (created_at, updated_at)
- [ ] Test pagination (if API returns paginated results)

### Phase 2: Airtable Import
- [ ] Test field mapping (Kajabi → Airtable)
- [ ] Verify Campaign Assignment logic
- [ ] Check duplicate prevention (Kajabi Contact ID)
- [ ] Validate Imported At timestamp (Eastern Time)
- [ ] Test Coaching Client detection (Kajabi Tags)

### Phase 3: SMS Timing Logic
- [ ] Test time window enforcement (8 AM - 8 PM ET)
- [ ] Verify 60-minute minimum delay
- [ ] Verify 3-hour maximum window
- [ ] Test outside time window (should skip)
- [ ] Test edge cases (exactly 60 min, exactly 3 hours)

### Phase 4: SMS Sending
- [ ] Test SMS template retrieval by Campaign Assignment
- [ ] Verify SimpleTexting API send
- [ ] Check SMS_Audit record creation
- [ ] Validate Airtable updates (SMS Status, Last Sent At)
- [ ] Test with test phone number first

### Phase 5: Reply Tracking
- [ ] Configure SimpleTexting webhook URL
- [ ] Test inbound SMS webhook trigger
- [ ] Verify lead lookup by phone
- [ ] Check Airtable update (Last Reply At, Reply Count)
- [ ] Test email notification delivery
- [ ] Validate email formatting (lead info display)

### Phase 6: Integration Testing
- [ ] Full end-to-end test: Kajabi form → Airtable → SMS → Reply
- [ ] Test with multiple forms (different campaigns)
- [ ] Verify no conflicts with existing SMS scheduler
- [ ] Check SMS_Audit records for all events
- [ ] Monitor N8N execution logs

### Phase 7: Production Readiness
- [ ] Backup all workflows (SOP§7.1)
- [ ] Document all workflow IDs and execution IDs
- [ ] Set up monitoring/alerts for failures
- [ ] Create rollback plan
- [ ] Get user approval for go-live

---

## 📊 SUCCESS METRICS

**Key Performance Indicators**:
1. **Kajabi Polling**:
   - Successful polls per hour
   - New leads imported per day
   - API error rate < 1%

2. **SMS Delivery**:
   - Messages sent within 60-180 min window: >95%
   - Messages sent during 8 AM - 8 PM ET: 100%
   - SMS delivery rate: >95%

3. **Reply Tracking**:
   - Webhook reliability: >99%
   - Email notification delivery: 100%
   - Airtable update success: 100%

4. **System Health**:
   - N8N workflow execution success: >98%
   - No impact on existing SMS scheduler
   - Zero data loss (all leads captured)

---

## 🚀 DEPLOYMENT PLAN

### Step 1: Research & Planning ✅
- [x] Document Kajabi API capabilities
- [x] Document SimpleTexting reply tracking
- [x] Validate Airtable schema
- [x] Create implementation plan

### Step 2: User Input & Permissions
- [ ] Collect all required credentials
- [ ] Get form → campaign mapping
- [ ] **Request EXPLICIT permission** to write to Leads table
- [ ] Confirm enrichment flow

### Step 3: Workflow Build (SOP§7.1)
- [ ] Build Workflow 1: Kajabi Polling → Airtable
- [ ] Build Workflow 2: SMS Scheduler with Timing
- [ ] Build Workflow 3: Reply Handler → Email
- [ ] Validate all workflows (pre/post)
- [ ] Create backups

### Step 4: Testing (SOP§1.1)
- [ ] Unit testing (each workflow independently)
- [ ] Integration testing (full flow)
- [ ] Edge case testing (timing, duplicates)
- [ ] Load testing (multiple leads)

### Step 5: Production Deploy
- [ ] Deploy to production N8N instance
- [ ] Configure SimpleTexting webhook URLs
- [ ] Monitor first 24 hours closely
- [ ] Document all execution IDs (SOP§7.4)

### Step 6: Post-Deploy
- [ ] Verify lead import working
- [ ] Confirm SMS sending in time window
- [ ] Test reply tracking with real reply
- [ ] Create runbook for troubleshooting

---

## 📚 REFERENCES

### Documentation Sources (SOP§7.3)
- Kajabi API: http://developers.kajabi.com
- SimpleTexting API: https://simpletexting.com/api/docs/
- Airtable MCP: Via MCP tools
- N8N MCP: Via MCP tools

### Key Files
- Airtable Schema: `COMPLETE-DEPENDENCY-MATRIX.md`
- N8N Enforcement: `.cursor/rules/uysp-n8n-enforcement.mdc`
- Airtable Enforcement: `.cursor/rules/uysp-airtable-enforcement.mdc`
- Evidence Collection: `.cursor/rules/uysp-evidence-collection.mdc`

### Workflow References
- Existing SMS Scheduler: [to be determined]
- Calendly Webhook: `UYSP-Calendly-Booked` (LiVE3BlxsFkHhG83)
- SimpleTexting Delivery: `UYSP-ST-Delivery V2` (vA0Gkp2BrxKppuSu)

---

## 🔄 NEXT STEPS

**IMMEDIATE** (waiting for user):
1. User provides Kajabi API credentials
2. User provides form → campaign mapping
3. User provides email destination for replies
4. User provides **EXPLICIT PERMISSION** to write to Leads table

**AFTER USER INPUT**:
1. Begin workflow builds (following SOP§7.1)
2. Test each component individually
3. Integration testing
4. Production deployment

---

**Document Status**: ✅ Planning Complete - Awaiting User Input  
**Last Updated**: 2025-11-01  
**Evidence Captured**: All API docs, schema validation, workflow IDs documented per SOP§7.4




