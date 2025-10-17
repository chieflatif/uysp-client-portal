# Twilio Prototype - Build Plan
**Created**: October 17, 2025  
**Status**: Ready to build  
**Approach**: Clone existing SMS Scheduler, swap SimpleTexting → Twilio  
**n8n Project**: `H4VRaaZhd8VKQANf`

---

## 🎯 OBJECTIVE

Build a working Twilio prototype by duplicating the existing SMS Scheduler workflow (ID: `UAZWVFzMrJaVbvGM`) and replacing the SimpleTexting HTTP node with Twilio.

**Template**: UYSP-SMS-Scheduler-v2 (9 nodes, proven working)

**What Gets Replaced**: Just 1 node - "SimpleTexting HTTP"

**What Stays Same**: Everything else - Airtable queries, message prep, response parsing, audit logging

**Result**: Parallel Twilio workflow that can send SMS + WhatsApp without touching SimpleTexting.

---

## 🏗️ BUILD APPROACH

### Strategy: Clean Parallel Build

1. **Export existing SMS Scheduler workflow** (template)
2. **Create new workflow**: "UYSP-Twilio-SMS-Prototype"
3. **Replace SimpleTexting HTTP node** with Twilio equivalent
4. **Test with 1-3 test contacts** (your phone, Gabriel's phone)
5. **Add WhatsApp sending** (bonus - test if we can)
6. **Keep separate from production** (no impact on Ian)

**Benefits:**
- ✅ Zero risk to working system
- ✅ Can test side-by-side
- ✅ Easy rollback (just deactivate)
- ✅ Learn Twilio with real workflow

---

## 📋 BUILD PLAN (4-6 hours)

### Phase 1: Twilio Account Setup (30 min)

**Tasks:**
1. Create Twilio account (free trial: $15 credit)
2. Get phone number ($1/month, included in trial)
3. Get Account SID + Auth Token
4. Configure sending number

**Done-when:**
- Twilio account active
- Phone number purchased
- Credentials ready for n8n

---

### Phase 2: Twilio API Research (1 hour)

**What we need to know:**

**SMS Sending:**
```bash
# Twilio SMS API
POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json

# Body (form-encoded):
To=+15555555555
From=+19095551234
Body=Your message here

# Auth: Basic Auth (AccountSid:AuthToken)
```

**WhatsApp Sending:**
```bash
# Twilio WhatsApp API (same endpoint!)
POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json

# Body:
To=whatsapp:+15555555555
From=whatsapp:+19095551234
Body=Your WhatsApp message here
```

**Webhooks:**
- Delivery status webhook (StatusCallback URL)
- Inbound message webhook (MessagingWebhook URL)
- All message events (queued, sent, delivered, failed, undelivered)

**Tasks:**
- [ ] Review Twilio SMS API docs
- [ ] Review Twilio WhatsApp API docs
- [ ] Understand webhook payload structure
- [ ] Document authentication method
- [ ] Note differences from SimpleTexting

**Done-when:** API capabilities documented

---

### Phase 3: Clone SMS Scheduler Workflow (30 min)

**In n8n:**

1. Open existing workflow: UYSP-SMS-Scheduler-v2
2. Workflow menu → Duplicate
3. Rename: "UYSP-Twilio-SMS-Prototype"
4. Set to Inactive
5. Export JSON as backup

**Result:** Exact copy of working scheduler, ready to modify

**Done-when:** New workflow created, backed up

---

### Phase 4: Replace SimpleTexting with Twilio (2 hours)

**Node to Replace: "Send SMS via SimpleTexting"**

**Current SimpleTexting Node:**
```javascript
// HTTP Request
URL: https://api-app2.simpletexting.com/v2/api/messages
Method: POST
Auth: Bearer token
Body: {
  "mode": "SINGLE",
  "accountPhone": "9094988474",
  "contactPhone": "{{ $json.phone }}",
  "text": "{{ $json.message }}"
}
```

**New Twilio Node:**
```javascript
// HTTP Request Node Configuration
Name: Twilio SMS HTTP
Type: HTTP Request
Method: POST
URL: https://api.twilio.com/2010-04-01/Accounts/{{ $credentials.TWILIO_ACCOUNT_SID }}/Messages.json

// Authentication
Type: Generic Credential Type → HTTP Basic Auth
Credential: "Twilio API" (create this first)

// Body
Send Body: Yes
Specify Body: Raw/Custom
Content-Type: application/x-www-form-urlencoded

Body (form-encoded format):
To=+1{{ $items('Prepare Text (A/B)', 0)[$itemIndex].json.phone_digits }}&From={{ $vars.TWILIO_PHONE_NUMBER }}&Body={{ $items('Prepare Text (A/B)', 0)[$itemIndex].json.text }}&StatusCallback={{ $vars.N8N_BASE_URL }}/webhook/twilio-status

// Options
Response → Never Error: ON (same as SimpleTexting node)
```

**Key Differences from SimpleTexting:**
- URL: Twilio endpoint (not SimpleTexting)
- Auth: Basic Auth with AccountSid:AuthToken (not Bearer token)
- Body format: form-encoded (not JSON!)
- Field names: `To`, `From`, `Body` (not contactPhone, accountPhone, text)
- StatusCallback: Twilio's delivery webhook URL

**Steps:**
1. Create Twilio credential in n8n
   - Type: HTTP Basic Auth
   - Username: Account SID
   - Password: Auth Token

2. Replace HTTP Request node
   - Change URL to Twilio endpoint
   - Change auth to Basic Auth
   - Change body format (form-encoded, not JSON)
   - Update field mappings

3. Test with your phone number
   - Send one test SMS
   - Verify delivery
   - Check response format

**Done-when:** Can send SMS via Twilio successfully

---

### Phase 5: Update Response Parser (30 min)

**Twilio Response Format:**
```json
{
  "sid": "SM123abc456def",
  "status": "queued",
  "to": "+15555555555",
  "from": "+19095551234",
  "body": "Your message",
  "num_segments": "1",
  "price": "-0.0075",
  "price_unit": "USD"
}
```

**Update "Parse SMS Response" Node:**
```javascript
const res = $input.first().json;

// Twilio uses 'sid' instead of 'id'
const messageId = res.sid;
const status = res.status; // queued, sent, delivered, failed, undelivered
const cost = Math.abs(parseFloat(res.price || 0));

return [{
  json: {
    simpletexting_id: messageId,  // Keep field name for compatibility
    sms_status: status === 'queued' || status === 'sent' ? 'Sent' : status,
    sms_cost: cost,
    provider: 'twilio'
  }
}];
```

**Done-when:** Response parsing works, Airtable updates correctly

---

### Phase 6: Add WhatsApp Sending (1 hour - BONUS)

**New Node: "Send WhatsApp" (Parallel to SMS)**

**Copy SMS node, change:**
```javascript
// Just add "whatsapp:" prefix!
URL: [same as SMS]
Body:
  To=whatsapp:{{ $json.phone }}
  &From=whatsapp:{{ $credentials.TWILIO_WHATSAPP_NUMBER }}
  &Body={{ $json.message }}
```

**Add Route Node Before Send:**
```javascript
// Code node: Determine Channel
const phone = $json.phone_primary;
const isInternational = !phone.match(/^\+1/);

return [{
  json: {
    ...$json,
    channel: isInternational ? 'whatsapp' : 'sms',
    phone_formatted: isInternational ? `whatsapp:${phone}` : phone
  }
}];
```

**Done-when:** Can send WhatsApp to international number

---

### Phase 7: Add Inbound Message Webhook (1 hour)

**New Workflow: "UYSP-Twilio-Inbound"**

**Twilio Webhook Configuration:**
- When you configure phone number in Twilio console
- Set "Messaging Webhook": https://rebelhq.app.n8n.cloud/webhook/twilio-inbound
- Twilio sends POST with every inbound message

**Webhook Payload:**
```
MessageSid=SM123abc
From=+15555555555
To=+19095551234
Body=Message text here
NumMedia=0
```

**n8n Nodes:**
1. Webhook (POST /webhook/twilio-inbound)
2. Parse Twilio payload (form-encoded, not JSON)
3. Find lead by phone (Airtable search)
4. Analyze message (keyword detection or AI)
5. Route to Slack or auto-respond
6. Log to SMS_Audit

**Done-when:** Can receive and process replies

---

## 🧪 TESTING PLAN

### Test 1: Basic SMS Send
```
Lead: Your phone number
Message: "Test from Twilio prototype"
Expected: SMS received, Airtable updated
```

### Test 2: Two-Way Conversation
```
Step 1: Send SMS to your phone
Step 2: Reply with "YES"
Step 3: Verify reply captured in n8n
Step 4: Verify Slack notification sent
```

### Test 3: WhatsApp (If Possible)
```
Lead: International number (Gabriel's?)
Message: "WhatsApp test from Twilio"
Expected: WhatsApp message received
```

### Test 4: Error Handling
```
Lead: Invalid phone number
Expected: Error logged, no retry loop
```

---

## 📊 SUCCESS CRITERIA

**Prototype Complete When:**
- [ ] Can send SMS via Twilio
- [ ] Response parsing works
- [ ] Airtable updates correctly
- [ ] Can receive inbound SMS
- [ ] Basic reply routing works
- [ ] WhatsApp send tested (bonus)
- [ ] Cost tracking accurate
- [ ] No errors in 3 test sends

**Production-Ready When:**
- [ ] All above + tested with 50 messages
- [ ] Two-way conversation AI working
- [ ] Slack handoff functional
- [ ] Campaign tracking implemented
- [ ] Compared costs with SimpleTexting
- [ ] Decision made on migration

---

## 🔧 n8n CONFIGURATION

### Credentials to Create:

**1. Twilio SMS Credential**
```
Type: HTTP Basic Auth
Name: Twilio API
Username: [Account SID from Twilio]
Password: [Auth Token from Twilio]
```

**2. Store Phone Numbers**
```
n8n Variables → Add:
TWILIO_SMS_PHONE: +19095551234 (your Twilio number)
TWILIO_WHATSAPP_PHONE: whatsapp:+19095551234
```

---

## 💰 PROTOTYPE COSTS

**Twilio Free Trial:**
- $15 credit included
- Enough for ~2,000 SMS test messages
- Or ~3,000 WhatsApp messages
- No credit card required for trial

**Real Costs (After Trial):**
- SMS: $0.0075/message
- WhatsApp: $0.005/message  
- Phone number: $1/month
- **50 test messages = $0.38**

---

## 🎯 NEXT STEPS

**Immediate:**
1. Create Twilio account (free trial)
2. Get credentials (Account SID + Auth Token)
3. Purchase phone number

**Then:**
1. Clone SMS Scheduler workflow
2. Replace SimpleTexting node with Twilio
3. Test with your phone
4. Add WhatsApp capability
5. Test two-way conversation

**Timeline:** 4-6 hours total

**Want me to start now? I can guide you through Twilio signup and then build the prototype.**
