# Kajabi Integration - Specification & Development Plan
**Created**: October 17, 2025  
**Status**: Design & Specification Phase  
**Based On**: Transcript analysis with Gabriel Neuman + existing UYSP system architecture

---

## 🎯 EXECUTIVE SUMMARY

### Business Objective
Enable Kajabi users to automatically qualify, enrich, and nurture leads using the UYSP system without leaving Kajabi's workflow for email management. This positions UYSP as the intelligence layer that sits alongside Kajabi's native email functionality.

### Core Value Proposition
**For existing client (Ian):**
- Keep Kajabi email sequences running independently
- Add parallel SMS/WhatsApp outreach with ICP scoring
- Flag qualified leads to sales team automatically
- No disruption to existing workflows

**For future Kajabi users (go-to-market):**
- Free lead qualification offer (5,000-1,000 leads enriched free)
- Unified messaging across email + SMS + WhatsApp
- Campaign-specific messaging based on lead source tags
- Two-way conversation capability (Phase 2)

---

## 📋 REQUIREMENTS EXTRACTED FROM TRANSCRIPT

### Must-Have (Launch)
1. **Real-Time Lead Capture**: Kajabi form submission → n8n webhook → Airtable
2. **Duplicate Prevention**: Email-based deduplication (Kajabi allows duplicate emails across forms)
3. **Tag-Based Routing**: Kajabi tags determine campaign assignment and message sequence
4. **Campaign-Specific Messaging**: Different SMS templates per lead source (e.g., "JB Webinar", "Sales Webinar")
5. **Clay Integration**: Leads must reach Clay queue for enrichment
6. **Source Tracking**: Field to identify leads came from Kajabi webhook vs bulk import

### Nice-to-Have (Future Phases)
1. **Kajabi Write-Back**: Update Kajabi when lead books meeting or enters sequence
2. **WhatsApp Integration**: Via Twilio or alternative provider
3. **Two-Way Messaging**: AI-powered responses or human handoff via Slack
4. **Click Tracking**: Switchy links with custom domain (e.g., `go.clientdomain.com`)
5. **Unified Inbox**: Single dashboard for email + SMS + WhatsApp replies

### Explicitly Out of Scope (Per Client Preference)
- Replacing Kajabi email sequences
- Modifying existing email workflows
- Kajabi product/course integrations

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│ KAJABI (Lead Entry Points)                                          │
│ - Webinar Registration Forms                                        │
│ - Newsletter Signup Forms                                           │
│ - Content Download Forms                                            │
│ - Course Registration Forms                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Webhook Trigger (form.submitted)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ n8n WORKFLOW: UYSP-Kajabi-Realtime-Ingestion                       │
│                                                                      │
│ 1. Webhook Receiver (POST /webhook/kajabi-leads)                   │
│ 2. Extract Contact ID → Enrich via Kajabi API                      │
│ 3. Smart Field Mapper (normalize fields + extract tags)            │
│ 4. Duplicate Check (email-based Airtable search)                   │
│ 5. Upsert to Airtable with source="Kajabi-Webhook"                │
│ 6. Tag-to-Campaign Mapper (determine SMS sequence)                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Airtable record created
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ AIRTABLE: Leads Table                                               │
│ - Processing Status: "Queued"                                       │
│ - Source: "Kajabi-Webhook"                                         │
│ - Kajabi Contact ID: "12345"                                       │
│ - Kajabi Tags: ["JB Webinar", "Sales Interested"]                 │
│ - Campaign Assignment: "webinar_jb_2024"                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Automation trigger
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ AIRTABLE AUTOMATION: Move to Clay Queue                            │
│ When: Enrichment Outcome is empty AND Processing Status = "Queued" │
│ Then: Update Processing Status → "Ready for Enrichment"            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CLAY: Enrichment & Scoring (Existing Flow)                         │
│ - Enrich company + person data                                     │
│ - Calculate ICP score                                               │
│ - Write back to Airtable                                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ AIRTABLE AUTOMATION: Ready for SMS (Existing)                      │
│ When: Enrichment Outcome not empty                                 │
│ Then: Update Processing Status → "Ready for SMS"                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ n8n WORKFLOW: SMS Scheduler (Enhanced with Campaign Logic)         │
│ - Fetch leads with Processing Status = "Ready for SMS"             │
│ - Match lead.campaign_assignment → SMS_Templates.campaign_id       │
│ - Send campaign-specific message                                    │
│ - Track via SMS_Audit table                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 KAJABI API INTEGRATION DETAILS

### Webhook Event: Form Submission
**Kajabi Webhook Configuration:**
- Event Type: `form.submitted`
- Payload Structure (from transcript):
```json
{
  "attributes": {
    "id": "contact_id_string",
    "site_id": "kajabi_site_id",
    "type": "form_submission"
  },
  "target_source": "specific_form_name",
  "relationships": {
    "contact": {
      "data": {
        "id": "contact_id",
        "type": "contacts"
      }
    }
  }
}
```

### API Enrichment Call: Get Contact Details
**After webhook received, call:**
```http
GET https://api.kajabi.com/v1/contacts/{contact_id}
Authorization: Bearer {KAJABI_API_KEY}
```

**Response includes:**
```json
{
  "id": "12345",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+15555555555",
  "tags": ["JB Webinar", "Active Member", "Sales Interested"],
  "created_at": "2024-01-15T10:30:00Z",
  "attributes": {
    "custom_29": "linkedin_url",
    "custom_67": "coaching_interest",
    "custom_68": "lead_tags"
  }
}
```

**Critical Fields to Capture:**
- `id` → Store as `kajabi_contact_id` in Airtable
- `email` → Primary deduplication key
- `first_name`, `last_name`, `phone` → Standard fields
- `tags` → **CRITICAL** for campaign routing
- `attributes.*` → Custom fields (client-specific mapping needed)

---

## 🗄️ AIRTABLE SCHEMA CHANGES

### Leads Table - New Fields Required

| Field Name | Type | Purpose | Example Value |
|------------|------|---------|---------------|
| `Kajabi Contact ID` | Text | Unique Kajabi identifier | `"cont_abc123xyz"` |
| `Kajabi Tags` | Long Text | JSON array of all tags | `["JB Webinar", "Sales"]` |
| `Campaign Assignment` | Single Select | Which SMS campaign to use | `webinar_jb_2024` |
| `Lead Source Detail` | Text | Specific form/page | `"Sales Webinar May 2024"` |
| `Kajabi Member Status` | Single Select | Membership status | `Active`, `Trial`, `Prospect` |
| `Kajabi Last Sync` | DateTime | Last time synced from Kajabi | Auto-updated on sync |

**Update to Existing Fields:**
- `Source` field: Add option `"Kajabi-Webhook"`
- `Processing Status`: No changes needed (use existing flow)

### SMS_Templates Table - New Fields Required

| Field Name | Type | Purpose | Example Value |
|------------|------|---------|---------------|
| `Campaign ID` | Text (Primary Key) | Unique campaign identifier | `webinar_jb_2024` |
| `Campaign Name` | Text | Human-readable name | `"JB Webinar Follow-up"` |
| `Kajabi Tag Match` | Text | Tag that triggers this campaign | `"JB Webinar"` |
| `Sequence Position` | Number | Message order (1, 2, 3...) | `1` |
| `Message Template` | Long Text | Message with variables | `"Hi {{first_name}}, saw you joined our JB webinar..."` |
| `Active` | Checkbox | Enable/disable campaign | `true` |
| `Created Date` | DateTime | When template created | Auto |

**Example Records:**
```
Campaign ID: webinar_jb_2024
Campaign Name: JB Webinar Follow-up
Kajabi Tag Match: JB Webinar
Sequence Position: 1
Message Template: Hi {{first_name}}, noticed you're {{title}} at {{company}}. Other attendees from our JB webinar seeing 20% lift. Worth a quick chat? {{calendly_link}}
Active: ✓
```

```
Campaign ID: sales_webinar_2024
Campaign Name: Sales Webinar Nurture
Kajabi Tag Match: Sales Webinar
Sequence Position: 1
Message Template: Hi {{first_name}}, great to see {{company}} at our sales webinar. Let's discuss how top {{title}}s are closing 30% more deals. Book here: {{calendly_link}}
Active: ✓
```

---

## 🔧 n8n WORKFLOW SPECIFICATION

### Workflow 1: UYSP-Kajabi-Realtime-Ingestion
**Purpose**: Capture Kajabi form submissions and route to Airtable

#### Node 1: Webhook Receiver
- **Type**: Webhook (POST)
- **Path**: `/webhook/kajabi-leads`
- **Authentication**: None (Kajabi doesn't support webhook secrets natively)
- **Settings**: 
  - Response Code: 200
  - Response Mode: `onReceived` (immediate ACK)

#### Node 2: Extract Contact ID
- **Type**: Code (JavaScript)
- **Purpose**: Parse webhook payload to extract contact ID
```javascript
const payload = $input.first().json;
const contactId = payload.relationships?.contact?.data?.id || 
                  payload.id || 
                  null;

if (!contactId) {
  throw new Error('No contact ID found in webhook payload');
}

return [{
  json: {
    kajabi_contact_id: contactId,
    webhook_received_at: new Date().toISOString(),
    raw_payload: payload
  }
}];
```

#### Node 3: Kajabi API - Get Contact Details
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `https://api.kajabi.com/v1/contacts/{{ $json.kajabi_contact_id }}`
- **Authentication**: Predefined Credential Type → HTTP Header Auth
  - Header Name: `Authorization`
  - Header Value: `Bearer {{ $credentials.KAJABI_API_KEY }}`
- **Options**:
  - Retry On Fail: ON (3 attempts, 2s between)
  - Timeout: 10000ms
- **Error Handling**: On error → Route to Slack alert + log to error table

#### Node 4: Smart Field Mapper (Kajabi Edition)
- **Type**: Code (JavaScript)
- **Purpose**: Normalize Kajabi data to UYSP standard format
```javascript
const contact = $input.first().json;

// Sanitization functions
function sanitizeEmail(v) {
  if (!v) return '';
  return String(v).trim().toLowerCase()
    .replace(/[\s]+/g, '')
    .replace(/[.,;:]+$/, '');
}

function normalizePhone(v) {
  if (!v) return '';
  let s = String(v).trim();
  if (s.startsWith('+')) {
    s = '+' + s.slice(1).replace(/[^0-9]/g, '');
  } else {
    s = s.replace(/[^0-9]/g, '');
  }
  if (s.startsWith('+')) return s;
  if (s.length === 11 && s.startsWith('1')) return '+1' + s.slice(1);
  if (s.length === 10) return '+1' + s;
  return s;
}

function extractDomain(email) {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1];
}

// Map Kajabi fields to UYSP standard
const email = sanitizeEmail(contact.email);
const phone = normalizePhone(contact.phone || contact.phone_number);
const domain = extractDomain(email);

// Extract tags (critical for campaign routing)
const tags = Array.isArray(contact.tags) ? contact.tags : [];
const tagsJSON = JSON.stringify(tags);

// Determine campaign based on tags
// Priority order: Webinar tags > Course tags > Generic
let campaignAssignment = 'default_nurture';
let leadSourceDetail = 'Kajabi Form Submission';

if (tags.some(t => t.toLowerCase().includes('jb webinar'))) {
  campaignAssignment = 'webinar_jb_2024';
  leadSourceDetail = 'JB Webinar Registration';
} else if (tags.some(t => t.toLowerCase().includes('sales webinar'))) {
  campaignAssignment = 'webinar_sales_2024';
  leadSourceDetail = 'Sales Webinar Registration';
} else if (tags.some(t => t.toLowerCase().includes('course'))) {
  campaignAssignment = 'course_purchaser_2024';
  leadSourceDetail = 'Course Purchase';
}

// Determine member status
let memberStatus = 'Prospect';
if (tags.some(t => t.match(/active|member|gold|silver|bronze/i))) {
  memberStatus = 'Active';
} else if (tags.some(t => t.match(/trial/i))) {
  memberStatus = 'Trial';
} else if (tags.some(t => t.match(/churned|cancelled/i))) {
  memberStatus = 'Churned';
}

return [{
  json: {
    // Identity
    email: email,
    phone_primary: phone,
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    
    // Company (may be empty - Clay will enrich)
    company_domain: domain,
    company: contact.company || '',
    title: contact.title || contact.job_title || '',
    
    // Kajabi-specific
    kajabi_contact_id: contact.id,
    kajabi_tags: tagsJSON,
    kajabi_member_status: memberStatus,
    kajabi_last_sync: new Date().toISOString(),
    
    // Campaign routing
    campaign_assignment: campaignAssignment,
    lead_source_detail: leadSourceDetail,
    
    // Processing
    source: 'Kajabi-Webhook',
    processing_status: 'Queued',
    
    // Custom fields (example - adjust per client)
    linkedin_url: contact.attributes?.custom_29 || '',
    interested_in_coaching: contact.attributes?.custom_67 || ''
  }
}];
```

#### Node 5: Duplicate Check
- **Type**: Airtable (Search)
- **Operation**: Search
- **Base**: `app4wIsBfpJTg7pWS`
- **Table**: `Leads`
- **Filter Formula**: `{Email} = "{{ $json.email }}"`
- **Return All**: OFF (return first match only)

#### Node 6: Route by Duplicate
- **Type**: IF
- **Condition**: 
  ```javascript
  {{ $json.id }} // Check if Airtable search returned a record
  ```
- **TRUE path**: Update existing record
- **FALSE path**: Create new record

#### Node 7a: Update Existing Lead (TRUE path)
- **Type**: Airtable (Update)
- **Purpose**: Update duplicate with latest Kajabi data
- **Fields to Update**:
```javascript
{
  "kajabi_contact_id": "={{ $json.kajabi_contact_id }}",
  "kajabi_tags": "={{ $json.kajabi_tags }}",
  "kajabi_member_status": "={{ $json.kajabi_member_status }}",
  "kajabi_last_sync": "={{ $json.kajabi_last_sync }}",
  "campaign_assignment": "={{ $json.campaign_assignment }}",
  "lead_source_detail": "={{ $json.lead_source_detail }}",
  "duplicate_count": "={{ $json.duplicate_count + 1 }}"
}
```
- **Note**: Do NOT overwrite enrichment data or SMS status

#### Node 7b: Create New Lead (FALSE path)
- **Type**: Airtable (Create)
- **Purpose**: Insert new lead into Leads table
- **All Fields**: Map full normalized object from Node 4

#### Node 8: Merge Paths
- **Type**: Code (pass-through)
- **Purpose**: Reunite TRUE/FALSE paths for logging

#### Node 9: Log to Kajabi Sync Audit
- **Type**: Airtable (Create)
- **Table**: `Kajabi_Sync_Audit` (new table - see schema below)
- **Fields**:
```javascript
{
  "kajabi_contact_id": "{{ $json.kajabi_contact_id }}",
  "lead_email": "{{ $json.email }}",
  "sync_timestamp": "{{ $json.kajabi_last_sync }}",
  "duplicate_found": "{{ $json.duplicate ? 'Yes' : 'No' }}",
  "campaign_assigned": "{{ $json.campaign_assignment }}",
  "tags_captured": "{{ $json.kajabi_tags }}",
  "lead_record_id": "{{ $json.airtable_record_id }}"
}
```

#### Node 10: Success Notification (Optional)
- **Type**: Slack
- **Channel**: `#uysp-debug`
- **Message**:
```
✅ Kajabi lead captured: {{ $json.email }}
Campaign: {{ $json.campaign_assignment }}
Tags: {{ $json.kajabi_tags }}
Duplicate: {{ $json.duplicate ? 'Updated' : 'New' }}
```

---

### Workflow 2: UYSP-SMS-Scheduler (ENHANCED)
**Purpose**: Add campaign-aware message selection

#### Changes to Existing Scheduler:

**Node: "Get Leads Due for SMS"**
- **Add to filter**: Include `campaign_assignment` field in output

**Node: "Get SMS Template" (NEW - Insert before "Send SMS")**
- **Type**: Airtable (Search)
- **Table**: `SMS_Templates`
- **Filter Formula**:
```
AND(
  {Campaign ID} = "{{ $json.campaign_assignment }}",
  {Sequence Position} = {{ $json.sms_sequence_position || 1 }},
  {Active} = TRUE()
)
```
- **Return All**: OFF

**Node: "Fallback to Default Template" (NEW - Error path)**
- **Type**: IF
- **Condition**: Check if template found
- **FALSE path**: Use default template from Settings table

**Node: "Prepare Message"**
- **Update**: Use `{{ $json.fields['Message Template'] }}` from template lookup
- **Variables available**: `{{first_name}}`, `{{last_name}}`, `{{title}}`, `{{company}}`, `{{calendly_link}}`

---

## 🗃️ NEW AIRTABLE TABLES

### Table: Kajabi_Sync_Audit
**Purpose**: Track every Kajabi → Airtable sync for debugging

| Field Name | Type | Purpose |
|------------|------|---------|
| Kajabi Contact ID | Text | Source contact ID |
| Lead Email | Email | For quick lookup |
| Sync Timestamp | DateTime | When sync occurred |
| Duplicate Found | Checkbox | Was existing record updated? |
| Campaign Assigned | Text | Which campaign route taken |
| Tags Captured | Long Text | Raw tags JSON |
| Lead Record ID | Text | Link to Leads table |
| Error Log | Long Text | Any errors during sync |

### Table: Campaign_Performance (Analytics)
**Purpose**: Track campaign effectiveness

| Field Name | Type | Purpose |
|------------|------|---------|
| Campaign ID | Text (Primary Key) | Links to SMS_Templates |
| Campaign Name | Text | Human-readable |
| Total Leads | Number | Count from Leads table |
| Messages Sent | Number | Rollup from SMS_Audit |
| Replies Received | Number | Count of inbound SMS |
| Meetings Booked | Number | Count of bookings |
| Conversion Rate | Percent | Formula: Booked / Sent |
| Average ICP Score | Number | Average score of leads |

---

## 🔄 CAMPAIGN ROUTING LOGIC

### Tag-to-Campaign Mapping Strategy

**Option A: Hardcoded (Launch)**
- Simple if/else logic in Smart Field Mapper
- Fast to implement, easy to debug
- Requires code change for new campaigns

**Option B: Airtable-Driven (Future)**
- New table: `Campaign_Tag_Rules`
- Fields: `Kajabi Tag`, `Campaign ID`, `Priority`, `Active`
- Lookup logic in n8n queries table for match
- Flexible but adds latency (~500ms per lead)

**Recommendation**: Start with Option A, migrate to Option B after 3 campaigns proven.

### Example Routing Rules (Option A):
```javascript
// Priority-based matching (first match wins)
const tagRules = [
  { pattern: /jb webinar/i, campaign: 'webinar_jb_2024' },
  { pattern: /sales webinar/i, campaign: 'webinar_sales_2024' },
  { pattern: /ai webinar/i, campaign: 'webinar_ai_2024' },
  { pattern: /course purchaser/i, campaign: 'course_buyer_2024' },
  { pattern: /newsletter/i, campaign: 'newsletter_nurture' },
  { pattern: /.*/, campaign: 'default_nurture' } // Catch-all
];

for (const rule of tagRules) {
  if (tagsJSON.match(rule.pattern)) {
    return rule.campaign;
  }
}
```

---

## 🧪 TESTING STRATEGY

### Phase 1: Manual Testing (Week 1)

**Test Cases:**

| Test ID | Scenario | Input | Expected Output |
|---------|----------|-------|-----------------|
| KAJ-001 | New lead, JB Webinar tag | Email: `test1@example.com`, Tags: `["JB Webinar"]` | Airtable record created, campaign = `webinar_jb_2024` |
| KAJ-002 | Duplicate email, different tag | Same email, Tags: `["Sales Webinar"]` | Airtable record updated, campaign changed, duplicate_count++ |
| KAJ-003 | No tags | Email: `test3@example.com`, Tags: `[]` | Airtable record created, campaign = `default_nurture` |
| KAJ-004 | Invalid email | Email: `invalid-email`, Tags: `[]` | Error logged, no Airtable record |
| KAJ-005 | API failure (Kajabi down) | Contact ID that returns 500 | Error logged to Slack, retried 3x |

**Manual Test Procedure:**
1. Use Kajabi test form or Postman to simulate webhook
2. Verify n8n execution completes successfully
3. Check Airtable for correct field mapping
4. Confirm Clay picks up lead in queue
5. Verify SMS template lookup works

### Phase 2: Automated Testing (Week 2)

**Test Data Generator** (n8n workflow):
```javascript
// Generate 10 test leads with variety of tag combinations
const testLeads = [];
const campaigns = ['JB Webinar', 'Sales Webinar', 'AI Webinar', 'Newsletter'];
const domains = ['salesforce.com', 'hubspot.com', 'gmail.com'];

for (let i = 1; i <= 10; i++) {
  testLeads.push({
    email: `test${i}@${domains[i % 3]}`,
    first_name: `Test${i}`,
    last_name: `User`,
    phone: `+1555000${String(i).padStart(4, '0')}`,
    tags: [campaigns[i % 4]]
  });
}

return testLeads.map(lead => ({ json: lead }));
```

### Phase 3: Production Validation (Week 3)
- Start with 1 low-stakes webinar form
- Monitor for 3 days with Slack alerts on
- Verify 100% capture rate (compare Kajabi form count vs Airtable records)
- Check no duplicate explosion (duplicate_count < 3 for any lead)
- Confirm Clay enrichment rate >95%

---

## 📈 SUCCESS METRICS

### Technical Metrics
- **Webhook Reliability**: >99.5% successful captures
- **API Success Rate**: >99% Kajabi API calls successful
- **Duplicate Detection**: <1% false positives (incorrectly merged leads)
- **Processing Time**: <10 seconds from webhook to Airtable
- **Clay Queue Delay**: <5 minutes from Airtable to Clay enrichment start

### Business Metrics
- **Campaign Assignment Accuracy**: 100% (all leads get correct template)
- **SMS Delivery Rate**: >97% (industry standard)
- **Lead Qualification Rate**: >60% of Kajabi leads score >70
- **Meeting Book Rate**: >5% of qualified leads book (benchmark)

### Cost Metrics
- **Kajabi API Cost**: $0 (included in Kajabi subscription)
- **n8n Executions**: ~200/day expected (within current plan)
- **Airtable Records**: Monitor against 50k record limit
- **Clay Credits**: Track Kajabi source separately vs bulk import

---

## 🚀 IMPLEMENTATION ROADMAP

### Week 1: Core Integration (Must-Have)
**Day 1-2: Setup & Configuration**
- [ ] Create Kajabi API credential in n8n
- [ ] Configure Kajabi webhook (form.submitted event)
- [ ] Add new fields to Airtable Leads table
- [ ] Create SMS_Templates table with initial campaigns
- [ ] Create Kajabi_Sync_Audit table

**Day 3-4: Build Workflow**
- [ ] Build UYSP-Kajabi-Realtime-Ingestion workflow
- [ ] Implement Smart Field Mapper (Kajabi edition)
- [ ] Add duplicate detection logic
- [ ] Create sync audit logging

**Day 5: Testing & Validation**
- [ ] Manual testing with 10 test cases
- [ ] Verify Clay integration works
- [ ] Test campaign assignment logic
- [ ] Validate duplicate handling

**Day 6-7: Enhancement & Monitoring**
- [ ] Update SMS Scheduler for campaign templates
- [ ] Add Slack monitoring alerts
- [ ] Document troubleshooting guide
- [ ] Train client on new fields

### Week 2: Campaign Management (Nice-to-Have)
**Day 1-3: Template System**
- [ ] Build 3 campaign-specific message sequences
- [ ] Create template management SOP for client
- [ ] Add campaign performance dashboard (Airtable)
- [ ] Test message variable replacement

**Day 4-5: Analytics & Reporting**
- [ ] Create Campaign_Performance table
- [ ] Build rollup formulas for conversion tracking
- [ ] Create Airtable Interface for campaign overview
- [ ] Weekly report automation

### Week 3: Production Rollout
**Day 1-2: Soft Launch**
- [ ] Enable for 1 test webinar form
- [ ] Monitor for 48 hours
- [ ] Validate data quality

**Day 3-4: Full Rollout**
- [ ] Enable for all Kajabi forms
- [ ] Create runbook for troubleshooting
- [ ] Schedule check-in with client

**Day 5-7: Optimization**
- [ ] Review error logs and fix edge cases
- [ ] Optimize campaign assignment rules
- [ ] Gather feedback for Phase 2

### Future Phases (Post-Launch)

**Phase 2: Write-Back Integration (Month 2)**
- Tag contacts in Kajabi when they book meetings
- Update custom fields with ICP score
- Sync SMS status back to Kajabi

**Phase 3: WhatsApp Integration (Month 3)**
- Evaluate Twilio vs SendPulse vs GoHighLevel
- Build two-way conversation flow
- Add international number support

**Phase 4: Unified Inbox (Month 4)**
- Aggregate SMS + WhatsApp + Email replies
- AI-powered reply suggestions
- Slack-based human handoff

---

## 🛡️ RISK MITIGATION

### Risk 1: Kajabi API Rate Limits
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**:
- Implement exponential backoff (2s, 4s, 8s retries)
- Add circuit breaker (pause after 5 consecutive failures)
- Cache contact details for 24h to reduce API calls
- Monitor rate limit headers in responses

### Risk 2: Duplicate Explosion
**Likelihood**: Medium  
**Impact**: Medium  
**Mitigation**:
- Email-based deduplication is primary defense
- Add `duplicate_count` threshold alert (>5 = investigate)
- Weekly duplicate audit report
- Option to add phone-based deduplication if needed

### Risk 3: Tag Schema Changes
**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- Log all raw tags to Kajabi_Sync_Audit for forensics
- Use fuzzy matching (lowercase, trim, partial match)
- Default to "unassigned" campaign vs failing
- Document tag naming conventions with client

### Risk 4: Kajabi Webhook Reliability
**Likelihood**: Low  
**Impact**: High  
**Mitigation**:
- Kajabi webhook history in UI for replay
- Daily reconciliation job (compare Kajabi form count vs Airtable)
- Backup: Bulk import from Kajabi weekly

### Risk 5: Message Template Confusion
**Likelihood**: High  
**Impact**: Low  
**Mitigation**:
- Fallback to default template if campaign not found
- Template preview tool for client
- Version control for template changes
- A/B testing capability for future

---

## 💰 COST ANALYSIS

### One-Time Setup Costs
- Development time: ~40 hours @ $75/hr = $3,000
- Testing & QA: ~8 hours = $600
- Client training: ~4 hours = $300
- **Total one-time**: ~$3,900

### Ongoing Monthly Costs
- n8n Cloud: $0 (within existing plan, assuming <1000 Kajabi leads/month)
- Airtable: $0 (within existing plan)
- Kajabi API: $0 (included)
- Clay Credits: ~500 leads/month × $0.10 = $50/month
- SMS (SimpleTexting): ~500 msgs × $0.02 = $10/month
- **Total monthly**: ~$60/month (scales with lead volume)

### Revenue Potential (Go-to-Market)
**Free Trial Offer**: 1,000 leads enriched free
- Acquisition cost: 1,000 leads × $0.10 (Clay) = $100
- Conversion to paid: 20% × $500/month = $100/month revenue
- Break-even: 1 month
- 12-month LTV: $6,000

**Paid Plans (per client):**
- Bronze: 1,000 leads/month - $499/month
- Silver: 5,000 leads/month - $1,499/month
- Gold: Unlimited - $2,999/month

---

## 📚 OPEN QUESTIONS & DECISIONS NEEDED

### High Priority (Block Implementation)
1. **Kajabi API Access**: Does client have Kajabi plan with API access?
   - Need: API key, site ID, confirmation of webhook capabilities
   
2. **Custom Fields Mapping**: Which Kajabi custom fields to capture?
   - From transcript: `custom_29` (LinkedIn), `custom_67` (coaching interest)
   - Need: Full list of custom fields client uses + business meaning

3. **Initial Campaign List**: Which campaigns to configure at launch?
   - From transcript: JB Webinar, Sales Webinar, AI Webinar
   - Need: Exact tag strings to match + message templates

4. **Default Template**: What message for unassigned leads?
   - Option A: Generic nurture message
   - Option B: Don't send SMS (human review required)

### Medium Priority (Optimize Later)
5. **Click Tracking**: Use Switchy or alternative?
   - From transcript: Client wants custom domain (go.clientdomain.com)
   - Need: Domain setup, DNS access, URL shortener preference

6. **WhatsApp Provider**: Twilio vs SendPulse vs other?
   - Need: Client has international leads? Which countries?

7. **Write-Back Use Cases**: What Kajabi updates are valuable?
   - Examples: Tag "Meeting Booked", update "ICP Score" custom field
   - Need: Priority list from client

8. **Reply Handling**: Simple auto-response or full AI conversation?
   - From transcript: Mentioned as Phase 2
   - Need: Define human-in-loop workflow (Slack channel, response SLA)

### Low Priority (Nice to Have)
9. **Campaign Analytics Dashboard**: Airtable Interface or external BI tool?

10. **Multi-Client Architecture**: Separate workflows vs multi-tenant design?
    - For go-to-market: Need to plan for 10+ clients eventually

---

## 📖 DOCUMENTATION DELIVERABLES

### For Development Team
1. ✅ This specification document
2. ⏳ n8n workflow JSON with inline comments
3. ⏳ Airtable field mapping reference sheet
4. ⏳ API testing Postman collection
5. ⏳ Error handling playbook

### For Client (Non-Technical)
1. ⏳ Campaign setup guide (how to add new campaigns)
2. ⏳ Message template best practices
3. ⏳ Dashboard walkthrough (video)
4. ⏳ Troubleshooting FAQ
5. ⏳ Weekly metrics report template

### For Future Sales (Go-to-Market)
1. ⏳ Kajabi integration one-pager
2. ⏳ Setup checklist for new clients
3. ⏳ Pricing calculator
4. ⏳ Case study template
5. ⏳ Demo video (screen recording)

---

## ✅ DONE-WHEN CHECKLIST

### Phase 1 Complete When:
- [ ] 50 real leads captured from Kajabi without errors
- [ ] 100% duplicate detection accuracy (manual audit)
- [ ] All leads reach Clay queue within 5 minutes
- [ ] Campaign assignment matches tags 100% (manual review)
- [ ] Client can independently add new message template
- [ ] Zero execution failures for 7 consecutive days
- [ ] SMS delivery rate >97% for Kajabi-sourced leads
- [ ] Client reports "this just works" confidence level

### Production-Ready When:
- [ ] All Phase 1 checklist items complete
- [ ] Runbook tested by non-developer
- [ ] Backup/rollback procedure validated
- [ ] Monitoring alerts triggered correctly (tested with fake error)
- [ ] Client trained and signed off on handover
- [ ] 30-day error rate <1%

---

**END OF SPECIFICATION**

*Next Steps*: Review this spec with Gabriel, gather answers to open questions, then proceed to Week 1 implementation.*

