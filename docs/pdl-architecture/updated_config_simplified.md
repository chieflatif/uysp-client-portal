# UYSP Project Configuration - Simplified Architecture (UPDATED)

## API Credentials Checklist

### Required Before Starting
- [ ] **Apollo API Key**
  - Get from: https://app.apollo.io/settings/integrations/api
  - Plan required: Pro ($99/month minimum)
  - Store as: `apolloApiKey` in n8n credentials

- [ ] **SimpleTexting API Key & Phone Number**
  - Get from: https://app.simpletexting.com/settings/api
  - **10DLC Registration**: SimpleTexting handles COMPLETE 10DLC registration and management
  - Store as: `simpleTextingApiKey` in n8n credentials
  - Phone number format: Use E.164 (+1XXXXXXXXXX)
  - **Note**: SimpleTexting provides FULL compliance automation including 10DLC, DND, TCPA, and opt-out management

- [ ] **Twilio Account SID & Auth Token** (Optional - for phone validation only)
  - Get from: https://console.twilio.com/
  - Enable: Phone Number Lookup API v2
  - Store as: `twilioAccountSid` and `twilioAuthToken` in n8n credentials

- [ ] **Claude API Key**
  - Get from: https://console.anthropic.com/settings/keys
  - Model access: claude-4-opus
  - Store as: `claudeApiKey` in n8n credentials

- [ ] **Airtable API Key & Base ID**
  - Get from: https://airtable.com/create/tokens
  - Scopes needed: data.records:read, data.records:write, schema.bases:read
  - Base ID: Found in Airtable URL after /app/
  - Store as: `airtableApiKey` in n8n credentials

- [ ] **Calendly Webhook Secret** (Can defer to production)
  - Get from: Calendly Integrations → Webhooks
  - Store as: `CALENDLY_WEBHOOK_SECRET` in n8n variables

## Environment Variables Setup

### Core Configuration (Set in n8n)

```bash
# Core System
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
CACHE_EXPIRY_DAYS=90
BATCH_SIZE=50
DAILY_COST_LIMIT=50
TEST_MODE=true
MAX_RETRIES=3
RETRY_DELAY_MS=5000

# SMS Service Configuration (SimpleTexting handles compliance)
SMS_MONTHLY_LIMIT=1000
TEN_DLC_REGISTERED=false  # Set to true after SimpleTexting completes registration
```

### API Cost Configuration

```bash
APOLLO_ORG_COST=0.04
APOLLO_PERSON_COST=0.04
TWILIO_COST=0.015
SMS_COST=0.02
CLAUDE_COST=0.001
```

### Migration Guide for Existing Setups
**If upgrading from custom DND implementation:**
1. Delete these variables from your environment:
   ```bash
   # REMOVE THESE (no longer needed):
   # DND_CHECK_ENABLED
   # TCPA_COMPLIANCE  
   # TIME_WINDOW_ENFORCEMENT
   # DND_API_KEY
   ```
2. Test SMS endpoints directly via SimpleTexting dashboard
3. Verify opt-out handling works through SMS service responses

### Workflow IDs (Update after creating)

```bash
WORKFLOW_MONTHLY_COUNT_ID=REPLACE_WITH_ID
WORKFLOW_COST_LOGGING_ID=REPLACE_WITH_ID
WORKFLOW_ERROR_LOGGING_ID=REPLACE_WITH_ID
```

## System URLs & Endpoints

### Your Infrastructure
- **n8n Instance**: `https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/`
- **Airtable Base**: `https://airtable.com/app[YOUR_BASE_ID]`
- **Webhook Base URL**: `https://your-n8n-instance.com/webhook`

### Webhook Endpoints (Created in n8n)
- Kajabi Leads: `/webhook/kajabi-leads`
- Calendly Events: `/webhook/calendly-events`
- SMS Delivery: `/webhook/sms-delivery` (SimpleTexting callbacks)

## Testing Configuration

### Test Data Set
```json
[
  {
    "email": "test-high@salesforce.com",
    "name": "Test High",
    "phone": "4155551001",
    "company": "Salesforce",
    "source_form": "webinar-signup"
  },
  {
    "email": "test-medium@startup.com",
    "name": "Test Medium", 
    "phone": "4155551002",
    "company": "TechStartup Inc"
  },
  {
    "email": "test-low@gmail.com",
    "name": "Test Low",
    "company": "",
    "phone": ""
  }
]
```

### Test Phone Numbers
- Valid Mobile: +14155551234
- Landline: +14155559999
- Invalid: +15555550000
- International: +447700900000

## SMS Service Integration Status

### SimpleTexting Complete Compliance Management
- **10DLC Registration**: Fully managed by SimpleTexting (confirmed)
- **Opt-out Handling**: Automatic via STOP keywords
- **DND Management**: Maintained by SimpleTexting service
- **TCPA Compliance**: Enforced by service
- **Time Windows**: Managed by service
- **Legal Responsibility**: SimpleTexting maintains all compliance

### Current Status Configuration
```bash
# SimpleTexting manages registration status internally
TEN_DLC_REGISTERED=false  # Update to true when SimpleTexting confirms completion
SMS_MONTHLY_LIMIT=1000    # Pre-registration limit
```

## Quick Reference

### Critical Paths
- Webhook URL: Share with Kajabi/Zapier admin
- Airtable Base ID: Never changes once set
- Test Mode: Keep true until ready for production
- Daily Limit: Start at $50, adjust based on results

### Cost Control Checkpoints
- Apollo: ~$0.04 per enrichment (check dashboard)
- SMS: $0.02 per segment
- Daily Alert: 90% of limit
- Circuit Breaker: 100% of limit

## Validation Commands

### Test Each Integration
```bash
# Test Apollo (via n8n HTTP node)
GET https://api.apollo.io/v1/auth/health

# Test Twilio (via n8n HTTP node)  
GET https://lookups.twilio.com/v2/PhoneNumbers/+14155551234

# Test SimpleTexting (via n8n HTTP node)
GET https://api-app2.simpletexting.com/v2/api/accounts

# Test Airtable (via n8n node)
List bases → Should see your base
```

## Architecture Benefits

### Eliminated Complexity (40% reduction):
- ❌ Custom DND checking infrastructure
- ❌ Time window validation logic
- ❌ Pre-flight compliance routing
- ❌ Manual opt-out management

### Leveraged Service Capabilities:
- ✅ SimpleTexting's complete 10DLC management
- ✅ Automatic compliance enforcement
- ✅ Legal responsibility handled by service
- ✅ Industry-standard opt-out processing

*Last updated: July 26, 2025 - Simplified architecture with full SMS service leverage*