# Lead Source Tracking - Investigation & Design
**Created**: October 17, 2025  
**Status**: 🔍 Investigation Phase  
**Priority**: CRITICAL - Blocking implementation

---

## 🎯 THE CORE PROBLEM

### Issue Description
**Scenario**: A lead registers for multiple webinars over time:
- Week 1: Registers for "JB Webinar" → Tagged "JB Webinar"
- Week 2: Registers for "Sales Webinar" → Tagged "Sales Webinar"  
- Week 3: Registers for "AI Webinar" → Tagged "AI Webinar"
- Week 4: Registers for "Content Webinar" → Tagged "Content Webinar"

**Question**: When the Week 4 webhook fires, how do we know the **current lead source** is "Content Webinar" and not one of the previous three?

**Why This Matters**:
- Campaign routing depends on knowing the **triggering** event
- SMS message must reference the **correct** webinar
- Analytics need to track which source converted
- Can't just use "most recent tag" - all tags accumulate

---

## 🔍 INVESTIGATION NEEDED

### Question 1: Kajabi Webhook Payload Analysis
**What we need to know**:
- Does the webhook payload include the **triggering form/event** that caused the submission?
- Is there a `source_form_id` or `event_type` field?
- Does Kajabi pass a timestamp with each tag?
- Is there a "primary" or "most recent" tag indicator?

**How to investigate**:
```bash
# Step 1: Trigger test webhook from real Kajabi form
# Step 2: Capture raw webhook payload
# Step 3: Analyze JSON structure for source indicators

Expected fields to look for:
- target_source (mentioned in transcript)
- form_id
- event_id
- trigger_type
- timestamp
- primary_tag
```

**Action Item**: Capture 3-5 real webhook payloads from different forms and compare structure

---

### Question 2: Kajabi API - Contact History
**What we need to know**:
- Can we query contact history to see event timeline?
- Is there a `GET /contacts/{id}/events` or `/contacts/{id}/forms` endpoint?
- Can we get tag addition timestamps?
- Is there an activity log we can parse?

**How to investigate**:
```bash
# Using Kajabi API credentials:
# Test these potential endpoints:

GET /v1/contacts/{id}/events
GET /v1/contacts/{id}/submissions
GET /v1/contacts/{id}/timeline
GET /v1/contacts/{id}/tags?include_timestamps=true
```

**Action Item**: Make API calls with test contact ID to discover available endpoints

---

### Question 3: Tag Metadata
**What we need to know**:
- Do tags have metadata (created_at, source, priority)?
- Are tags just strings or objects with attributes?
- Can we differentiate "manual tags" vs "form submission tags"?

**Expected API response formats**:

**Option A: Tags as simple array**
```json
{
  "tags": ["JB Webinar", "Sales Webinar", "AI Webinar"]
}
```
❌ **Problem**: No way to know which is current source

**Option B: Tags with metadata**
```json
{
  "tags": [
    {
      "name": "JB Webinar",
      "added_at": "2025-01-15T10:00:00Z",
      "source": "form_12345"
    },
    {
      "name": "Sales Webinar",
      "added_at": "2025-02-20T14:30:00Z",
      "source": "form_67890"
    }
  ]
}
```
✅ **Solution**: Sort by `added_at` DESC, use most recent

**Action Item**: Call GET /contacts/{id} and examine actual tag structure

---

## 💡 POTENTIAL SOLUTIONS

### Solution 1: Webhook Payload Contains Source
**How it works**:
- Kajabi webhook includes `target_source` or `form_id` field
- This tells us which form triggered the webhook
- We map form IDs to campaigns in our system

**Implementation**:
```javascript
// In Smart Field Mapper node:
const webhookPayload = $input.first().json;
const triggeringForm = webhookPayload.target_source || 
                       webhookPayload.form_id ||
                       webhookPayload.attributes?.source;

// Map form to campaign
const formToCampaign = {
  'jb_webinar_form_123': 'webinar_jb_2024',
  'sales_webinar_form_456': 'webinar_sales_2024',
  'ai_webinar_form_789': 'webinar_ai_2024'
};

const campaign = formToCampaign[triggeringForm] || 'default_nurture';
```

**Pros**: 
- ✅ Accurate - knows exact triggering event
- ✅ Fast - no additional API calls
- ✅ Reliable - doesn't depend on tag parsing

**Cons**:
- ❌ Requires form ID → campaign mapping maintenance
- ❌ Need to discover all form IDs upfront

**Confidence**: 80% (likely Kajabi provides this)

---

### Solution 2: Most Recent Tag with Timestamp
**How it works**:
- Call Kajabi API to get contact details with tag timestamps
- Sort tags by `added_at` DESC
- Most recent tag = current source

**Implementation**:
```javascript
// After calling GET /contacts/{id}:
const contact = $json;
const tagsWithTimestamps = contact.tags || [];

// Sort by timestamp descending
const sortedTags = tagsWithTimestamps.sort((a, b) => 
  new Date(b.added_at) - new Date(a.added_at)
);

// Most recent tag is the source
const currentSourceTag = sortedTags[0]?.name;

// Map tag to campaign
const tagToCampaign = {
  'JB Webinar': 'webinar_jb_2024',
  'Sales Webinar': 'webinar_sales_2024',
  'AI Webinar': 'webinar_ai_2024'
};

const campaign = tagToCampaign[currentSourceTag] || 'default_nurture';
```

**Pros**:
- ✅ Works even if webhook payload is minimal
- ✅ Uses existing tag system
- ✅ No additional form mapping needed

**Cons**:
- ❌ Depends on tags having timestamps
- ❌ Assumes tags are added immediately with form submission
- ❌ Breaks if admin manually adds tags

**Confidence**: 60% (depends on Kajabi API capabilities)

---

### Solution 3: Hybrid - Webhook Context + API Fallback
**How it works**:
- Primary: Use webhook payload `target_source` if available
- Fallback: If not available, use most recent tag from API
- Log both for analytics

**Implementation**:
```javascript
// Step 1: Check webhook for source
let leadSource = null;
let sourceMethod = null;

const webhookSource = webhookPayload.target_source || 
                      webhookPayload.form_id;

if (webhookSource) {
  leadSource = formToCampaign[webhookSource];
  sourceMethod = 'webhook_payload';
} else {
  // Step 2: Fallback to most recent tag
  const recentTag = sortedTags[0]?.name;
  leadSource = tagToCampaign[recentTag];
  sourceMethod = 'most_recent_tag';
}

// Step 3: Log to audit
return [{
  json: {
    campaign_assignment: leadSource,
    source_detection_method: sourceMethod,
    webhook_source: webhookSource,
    most_recent_tag: sortedTags[0]?.name,
    all_tags: tagsWithTimestamps
  }
}];
```

**Pros**:
- ✅ Robust - has fallback mechanism
- ✅ Flexible - works with different Kajabi configurations
- ✅ Auditable - logs detection method

**Cons**:
- ❌ More complex to build and debug
- ❌ Requires maintaining two mapping systems

**Confidence**: 90% (safest approach)

---

### Solution 4: Separate Tag for "Current Campaign"
**How it works**:
- Use naming convention: "CURRENT_SOURCE: Webinar Name"
- When new form submitted, remove old "CURRENT_SOURCE" tag and add new one
- Our system always looks for tag starting with "CURRENT_SOURCE:"

**Implementation**:
```javascript
// After calling GET /contacts/{id}:
const tags = contact.tags;
const currentSourceTag = tags.find(tag => 
  tag.startsWith('CURRENT_SOURCE:')
);

if (currentSourceTag) {
  // Extract campaign name
  const campaignName = currentSourceTag.replace('CURRENT_SOURCE:', '').trim();
  campaign = tagToCampaign[campaignName];
}
```

**Pros**:
- ✅ Crystal clear which is current source
- ✅ No ambiguity with historical tags
- ✅ Simple to implement

**Cons**:
- ❌ Requires Kajabi automation to manage tags
- ❌ Changes client's tagging system
- ❌ Needs write-back capability

**Confidence**: 70% (requires client process change)

---

## 🧪 INVESTIGATION PLAN

### Phase 1: API Discovery (30 minutes)
**Tasks**:
1. [ ] Get Kajabi API credentials from client
2. [ ] Make test call: `GET /contacts/{test_contact_id}`
3. [ ] Examine response structure for tags
4. [ ] Check if tags have timestamps or metadata
5. [ ] Document findings

**Done-when**: We know exact tag structure returned by API

---

### Phase 2: Webhook Payload Analysis (30 minutes)
**Tasks**:
1. [ ] Set up test webhook receiver in n8n
2. [ ] Client submits test forms (3 different forms)
3. [ ] Capture raw webhook payloads
4. [ ] Analyze for source indicators (`target_source`, `form_id`, etc.)
5. [ ] Document findings

**Done-when**: We know what source information webhook provides

---

### Phase 3: Form Inventory (15 minutes)
**Tasks**:
1. [ ] Client provides list of all active forms in Kajabi
2. [ ] Document form IDs (if available in webhook)
3. [ ] Map forms to desired campaigns
4. [ ] Create form → campaign mapping table

**Done-when**: Complete mapping of forms to campaigns

---

### Phase 4: Solution Design (30 minutes)
**Tasks**:
1. [ ] Review findings from Phase 1-3
2. [ ] Choose primary solution (1, 2, 3, or 4)
3. [ ] Design fallback strategy
4. [ ] Update n8n workflow spec with chosen approach
5. [ ] Get client approval

**Done-when**: Clear implementation plan agreed upon

---

## 📊 DECISION MATRIX

| Solution | Accuracy | Complexity | Client Effort | Reliability | Recommendation |
|----------|----------|------------|---------------|-------------|----------------|
| 1. Webhook Payload | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **BEST IF AVAILABLE** |
| 2. Recent Tag | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Fallback only |
| 3. Hybrid | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **RECOMMENDED** |
| 4. Current Tag | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ❌ Too invasive |

**Recommendation**: Start with **Solution 3 (Hybrid)** - provides safety net while keeping implementation simple.

---

## 🚧 BLOCKING QUESTIONS

### Must Answer Before Implementation
1. ❓ **Does Kajabi webhook payload include form/source ID?**
   - Impact: Determines if Solution 1 is viable
   - How to answer: Capture real webhook payload

2. ❓ **Do Kajabi tags have timestamps in API response?**
   - Impact: Determines if Solution 2 is viable
   - How to answer: Call GET /contacts/{id} and inspect

3. ❓ **What's client's typical lead journey?**
   - Impact: Determines how often this edge case occurs
   - How to answer: Ask Ian for typical pattern

4. ❓ **Does client manually add tags or only automated?**
   - Impact: Determines if "most recent tag" is reliable
   - How to answer: Ask Ian about tagging workflow

---

## 📝 NOTES FOR CLIENT DISCUSSION

### Questions to Ask Ian:
1. "When someone registers for multiple webinars, which one should trigger the SMS sequence - the first or the most recent?"

2. "Do you manually add tags to contacts in Kajabi, or are tags only added automatically from form submissions?"

3. "If someone registered for JB Webinar in January and Sales Webinar in March, which campaign should they enter when we turn this on?"

4. "Would you be open to using a naming convention like 'ACTIVE_CAMPAIGN: Name' if that makes the system more reliable?"

---

## 🎯 NEXT STEPS

### Immediate Actions (This Week)
1. [ ] **Get API credentials** from Ian
2. [ ] **Run API investigation** (Phase 1 above)
3. [ ] **Set up test webhook** and capture payloads (Phase 2 above)
4. [ ] **Update this document** with findings
5. [ ] **Make solution recommendation** based on evidence

### After Investigation Complete
6. [ ] Update `KAJABI-INTEGRATION-SPEC.md` with chosen approach
7. [ ] Update Smart Field Mapper node code with source detection logic
8. [ ] Add source tracking fields to Airtable schema if needed
9. [ ] Create test cases for multi-tag scenarios
10. [ ] Document edge cases and handling

---

## 📚 RESOURCES

### Kajabi API Documentation
- Main docs: https://developers.kajabi.com/reference/getting-started
- Contacts endpoint: https://developers.kajabi.com/reference/get-contact
- Webhooks guide: https://developers.kajabi.com/reference/webhooks-overview

### Related Documents
- Main spec: `docs/architecture/KAJABI-INTEGRATION-SPEC.md`
- Transcript analysis: `context/CURRENT-SESSION/KAJABI-TRANSCRIPT-ANALYSIS.md`
- Action checklist: `context/CURRENT-SESSION/KAJABI-INTEGRATION-ACTION-CHECKLIST.md`

---

**Status**: 🔴 **BLOCKED** - Waiting for API investigation results  
**Owner**: Latif + Gabriel  
**Next Update**: After API credentials received and investigation complete

---

*Last Updated: October 17, 2025*  
*Investigation Status: Not Started - Awaiting Credentials*

