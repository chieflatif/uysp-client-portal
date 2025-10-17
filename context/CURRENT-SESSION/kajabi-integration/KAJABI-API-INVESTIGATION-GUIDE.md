# Kajabi API Investigation Guide
**Created**: October 17, 2025  
**Purpose**: Systematic exploration of Kajabi API capabilities  
**Prerequisites**: Kajabi API key and secret from client

---

## 🎯 INVESTIGATION OBJECTIVES

### What We Need to Discover
1. **Authentication flow** - How to authenticate API requests
2. **Webhook structure** - What data comes in webhook payloads
3. **Contact endpoints** - What contact data is available
4. **Tag metadata** - Do tags have timestamps or other metadata
5. **Form tracking** - Can we identify which form triggered the webhook
6. **Rate limits** - API quotas and throttling
7. **Error handling** - Expected error responses

---

## 🔐 AUTHENTICATION INVESTIGATION

### Step 1: Understand Auth Method
**Kajabi uses**: Bearer token authentication

**Test Setup**:
```bash
# Export credentials (client will provide these)
export KAJABI_API_KEY="your_api_key_here"
export KAJABI_SITE_ID="your_site_id_here"
```

### Step 2: Test Basic Auth
```bash
# Test 1: Get API health/status
curl -X GET "https://api.kajabi.com/v1/site" \
  -H "Authorization: Bearer $KAJABI_API_KEY" \
  -H "Accept: application/json"

# Expected response (200 OK):
{
  "id": "site_123abc",
  "name": "Your Site Name",
  "url": "https://yoursite.com"
}

# If 401 Unauthorized:
# - Check API key is correct
# - Verify API access enabled on account
```

**✅ Done-when**: Can successfully authenticate and get site info

---

### Step 3: Document Auth Requirements
**Questions to answer**:
- [ ] Is there a separate API secret required?
- [ ] Do we need to exchange credentials for access token?
- [ ] Is there a token refresh mechanism?
- [ ] Are there different scopes/permissions?
- [ ] How long do tokens last?

**Results**: [Fill in after testing]

---

## 📡 WEBHOOK INVESTIGATION

### Step 1: Set Up Test Webhook Receiver
```bash
# In n8n, create simple webhook node:
# Path: /webhook/kajabi-test
# Method: POST
# Response: Return 200 OK immediately

# Get webhook URL:
WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-test"
```

### Step 2: Configure Webhook in Kajabi
**In Kajabi Admin**:
1. Navigate to Settings → Webhooks
2. Create new webhook
3. Event: `form.submitted` (or equivalent)
4. URL: Paste n8n webhook URL
5. Save

### Step 3: Trigger Test Submissions
**From Kajabi**:
1. Create test form (or use existing)
2. Add test tags to form
3. Submit form with test data:
   - Email: `test-webhook@example.com`
   - Name: Test User
   - Any other fields
4. Check n8n for received payload

### Step 4: Analyze Webhook Payload Structure
**Capture and document**:
```json
// Example payload structure (fill in with actual):
{
  "id": "______",
  "type": "______",
  "attributes": {
    "______": "______"
  },
  "relationships": {
    "contact": {
      "data": {
        "id": "______",
        "type": "contacts"
      }
    }
  },
  "target_source": "______",  // CRITICAL: Does this field exist?
  "form_id": "______",         // CRITICAL: Does this field exist?
  "triggered_at": "______"     // CRITICAL: Is there a timestamp?
}
```

### Critical Fields to Look For:
- [ ] `target_source` - Form name or ID
- [ ] `form_id` - Unique form identifier
- [ ] `event_type` - Type of submission
- [ ] `triggered_at` - When webhook fired
- [ ] `contact.id` - Contact identifier
- [ ] `tags` - Are tags included in webhook?

**Results**: [Paste actual webhook payload here after test]

---

## 👤 CONTACT ENDPOINTS INVESTIGATION

### Step 1: Get Single Contact
```bash
# Test with a known contact ID from webhook
CONTACT_ID="replace_with_actual_id"

curl -X GET "https://api.kajabi.com/v1/contacts/$CONTACT_ID" \
  -H "Authorization: Bearer $KAJABI_API_KEY" \
  -H "Accept: application/json" \
  | jq '.'  # Pretty print JSON
```

**Expected response structure**:
```json
{
  "id": "______",
  "email": "______",
  "first_name": "______",
  "last_name": "______",
  "phone": "______",
  "tags": [
    // CRITICAL: What's the structure here?
    // Option A: Simple array
    "Tag 1", "Tag 2"
    
    // Option B: Objects with metadata
    {
      "name": "Tag 1",
      "added_at": "2025-01-15T10:00:00Z",
      "source": "form_123"
    }
  ],
  "attributes": {
    "custom_29": "______",  // LinkedIn URL
    "custom_67": "______",  // Coaching interest
    // Document all custom fields
  },
  "created_at": "______",
  "updated_at": "______"
}
```

### Step 2: Document Tag Structure
**Critical questions**:
- [ ] Are tags simple strings or objects?
- [ ] Do tags have `added_at` timestamps?
- [ ] Do tags have `source` or `origin` fields?
- [ ] Can we tell which tag is most recent?
- [ ] Are tags ordered (most recent first)?

**Results**: [Document actual tag structure]

---

### Step 3: Test Contact History Endpoints
```bash
# Try these potential endpoints (may or may not exist):

# Option A: Contact events
curl -X GET "https://api.kajabi.com/v1/contacts/$CONTACT_ID/events" \
  -H "Authorization: Bearer $KAJABI_API_KEY"

# Option B: Contact submissions
curl -X GET "https://api.kajabi.com/v1/contacts/$CONTACT_ID/submissions" \
  -H "Authorization: Bearer $KAJABI_API_KEY"

# Option C: Contact timeline
curl -X GET "https://api.kajabi.com/v1/contacts/$CONTACT_ID/timeline" \
  -H "Authorization: Bearer $KAJABI_API_KEY"

# Option D: Contact tags with metadata
curl -X GET "https://api.kajabi.com/v1/contacts/$CONTACT_ID/tags" \
  -H "Authorization: Bearer $KAJABI_API_KEY"
```

**Results**: [Document which endpoints exist and what they return]

---

## 📋 FORMS INVESTIGATION

### Step 1: List All Forms
```bash
# Get all forms on the site
curl -X GET "https://api.kajabi.com/v1/forms" \
  -H "Authorization: Bearer $KAJABI_API_KEY" \
  | jq '.data[] | {id: .id, name: .attributes.name}'
```

**Document all forms**:
| Form ID | Form Name | Associated Tags | Campaign Mapping |
|---------|-----------|-----------------|------------------|
| form_123 | JB Webinar Registration | "JB Webinar" | webinar_jb_2024 |
| form_456 | Sales Webinar | "Sales Webinar" | webinar_sales_2024 |
| ... | ... | ... | ... |

### Step 2: Get Form Details
```bash
# For each important form:
FORM_ID="replace_with_actual_id"

curl -X GET "https://api.kajabi.com/v1/forms/$FORM_ID" \
  -H "Authorization: Bearer $KAJABI_API_KEY" \
  | jq '.'
```

**Look for**:
- [ ] Form name
- [ ] Associated tags (auto-applied)
- [ ] Custom fields
- [ ] Webhook configuration

**Results**: [Document form structures]

---

## 🏷️ TAG MANAGEMENT INVESTIGATION

### Step 1: List All Tags
```bash
# Get all tags in the system
curl -X GET "https://api.kajabi.com/v1/tags" \
  -H "Authorization: Bearer $KAJABI_API_KEY" \
  | jq '.data[] | .attributes.name'
```

### Step 2: Test Tag Operations
```bash
# Can we add tags via API?
curl -X POST "https://api.kajabi.com/v1/contacts/$CONTACT_ID/tags" \
  -H "Authorization: Bearer $KAJABI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tag": {
      "name": "Test Tag"
    }
  }'

# Can we remove tags?
curl -X DELETE "https://api.kajabi.com/v1/contacts/$CONTACT_ID/tags/TAG_ID" \
  -H "Authorization: Bearer $KAJABI_API_KEY"
```

**Questions to answer**:
- [ ] Can we add tags programmatically?
- [ ] Can we remove tags?
- [ ] Can we query tags by contact?
- [ ] Do tag operations trigger webhooks?

**Results**: [Document tag API capabilities]

---

## 🚦 RATE LIMITS & QUOTAS

### Step 1: Test Rate Limits
```bash
# Make rapid requests to test limits
for i in {1..100}; do
  curl -X GET "https://api.kajabi.com/v1/site" \
    -H "Authorization: Bearer $KAJABI_API_KEY" \
    -w "\nStatus: %{http_code}\n" \
    -s -o /dev/null
  sleep 0.1
done
```

**Check response headers for**:
- `X-RateLimit-Limit` - Requests allowed per period
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - When limit resets

### Step 2: Document Limits
**Findings**:
- Rate limit: _____ requests per _____
- Burst allowance: _____
- Retry-After header: Yes / No
- 429 error handling: _____

**Results**: [Document rate limiting behavior]

---

## ⚠️ ERROR HANDLING INVESTIGATION

### Test Error Scenarios
```bash
# Test 1: Invalid auth
curl -X GET "https://api.kajabi.com/v1/site" \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized

# Test 2: Non-existent resource
curl -X GET "https://api.kajabi.com/v1/contacts/fake_id_12345" \
  -H "Authorization: Bearer $KAJABI_API_KEY"
# Expected: 404 Not Found

# Test 3: Malformed request
curl -X POST "https://api.kajabi.com/v1/contacts" \
  -H "Authorization: Bearer $KAJABI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{invalid json'
# Expected: 400 Bad Request
```

**Document error response format**:
```json
{
  "error": {
    "code": "______",
    "message": "______",
    "details": "______"
  }
}
```

---

## 📊 INVESTIGATION SUMMARY TEMPLATE

### Authentication
- **Method**: Bearer token / OAuth2 / API Key
- **Token lifetime**: _____ (if applicable)
- **Refresh mechanism**: Yes / No / N/A
- **Required headers**: _____

### Webhook Structure
- **Payload size**: ~_____ bytes
- **Contains form/source ID**: ✅ Yes / ❌ No
- **Contains tags**: ✅ Yes / ❌ No
- **Contains contact ID**: ✅ Yes / ❌ No
- **Timestamp included**: ✅ Yes / ❌ No

### Contact API
- **Tags structure**: Simple array / Objects with metadata
- **Tags have timestamps**: ✅ Yes / ❌ No
- **Tags ordered**: ✅ Yes (recent first) / ❌ No / N/A
- **History endpoints**: ✅ Available / ❌ Not available
- **Custom fields format**: _____

### Forms API
- **List forms endpoint**: ✅ Yes / ❌ No
- **Form details available**: ✅ Yes / ❌ No
- **Form → Tag mapping**: ✅ Automatic / ⚠️ Manual / ❌ None
- **Form ID in webhook**: ✅ Yes / ❌ No

### Rate Limits
- **Limit**: _____ requests per _____
- **Headers provided**: ✅ Yes / ❌ No
- **Retry-After header**: ✅ Yes / ❌ No
- **Burst allowance**: _____

---

## 🎯 DECISION MATRIX

Based on investigation findings, fill out:

### Lead Source Detection Method
- [ ] **Option A**: Use `target_source` from webhook payload
  - ✅ Feasible if: Webhook contains form/source identifier
  - Evidence: _____

- [ ] **Option B**: Use most recent tag with timestamp
  - ✅ Feasible if: Tags have `added_at` field in API response
  - Evidence: _____

- [ ] **Option C**: Use form ID mapping
  - ✅ Feasible if: Webhook contains form_id OR we can query submissions
  - Evidence: _____

- [ ] **Option D**: Hybrid approach (primary + fallback)
  - ✅ Always feasible - use best available method
  - Evidence: _____

**Recommended Solution**: _____ (fill in after investigation)

**Rationale**: _____

---

## 📝 INVESTIGATION CHECKLIST

### Pre-Investigation (Client Provides)
- [ ] Kajabi API key received
- [ ] Kajabi site ID received
- [ ] Test account email for testing
- [ ] Permission to create test forms
- [ ] List of existing forms in Kajabi

### Phase 1: Authentication (15 min)
- [ ] Test API key with GET /site
- [ ] Document auth method
- [ ] Verify access permissions
- [ ] Test error responses

### Phase 2: Webhook Setup (30 min)
- [ ] Create n8n test webhook
- [ ] Configure webhook in Kajabi
- [ ] Trigger 3 test submissions (different forms)
- [ ] Capture and analyze payloads
- [ ] Document payload structure

### Phase 3: Contact API (30 min)
- [ ] GET /contacts/{id} with test contact
- [ ] Analyze tag structure
- [ ] Test history endpoints (if exist)
- [ ] Document custom fields
- [ ] Test tag operations

### Phase 4: Forms API (15 min)
- [ ] List all forms
- [ ] Get details for key forms
- [ ] Map forms to campaigns
- [ ] Document form IDs

### Phase 5: Rate Limits (15 min)
- [ ] Test rapid requests
- [ ] Document rate limit headers
- [ ] Test 429 response handling

### Phase 6: Documentation (30 min)
- [ ] Fill out Investigation Summary
- [ ] Update Lead Source Tracking doc
- [ ] Make solution recommendation
- [ ] Update main spec with findings

**Total Time**: ~2.5 hours

---

## 🚀 NEXT STEPS AFTER INVESTIGATION

1. **Update specs** with actual API capabilities
2. **Choose lead source** detection method
3. **Update Smart Field Mapper** code with real logic
4. **Create form → campaign** mapping table
5. **Build test cases** based on real API behavior
6. **Proceed with** implementation

---

## 📞 SUPPORT RESOURCES

### Kajabi API Documentation
- Main docs: https://developers.kajabi.com/reference/getting-started
- Authentication: https://developers.kajabi.com/reference/authentication
- Webhooks: https://developers.kajabi.com/reference/webhooks-overview
- Contacts API: https://developers.kajabi.com/reference/contacts

### Tools for Testing
- **curl**: Command-line API testing
- **Postman**: GUI API testing (import OpenAPI spec if available)
- **jq**: JSON parsing in terminal
- **n8n**: Webhook receiver and testing

### Questions?
- Slack: #uysp-debug
- Contact: Gabriel (API investigation)
- Contact: Latif (business logic decisions)

---

**Investigation Status**: ⏳ **WAITING FOR CREDENTIALS**  
**Owner**: Latif (provides credentials) → Gabriel (runs investigation)  
**Timeline**: 2.5 hours once credentials received  
**Blocking**: All implementation work

---

*Last Updated: October 17, 2025*  
*Status: Ready for execution once credentials provided*

