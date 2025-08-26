# SMS Sequence Architecture - Safety-First Implementation Plan

## 🛡️ SAFETY PRINCIPLES
1. **PRESERVE WORKING SYSTEMS** - Current SMS Trigger workflow stays untouched
2. **BUILD IN PARALLEL** - New features in separate workflows first
3. **TEST IN ISOLATION** - Each component verified before integration
4. **ROLLBACK READY** - Every change has a documented reversal
5. **VISIBILITY FIRST** - Log everything before taking actions

## 📊 CURRENT STATE (WORKING - DO NOT BREAK)
- **UYSP-SMS-Trigger** (D10qtcjjf2Vmmp5j) - Single SMS sends working
- **UYSP-Realtime-Ingestion** (2cdgp1qr9tXlONVL) - Lead intake working
- **Airtable Leads Table** - Current fields preserved
- **SimpleTexting** - Single sends via API working

## 🏗️ PHASE 1: SCHEMA ADDITIONS (SAFE - ADDITIVE ONLY)

### New Airtable Fields (Won't affect existing)
```javascript
// In Leads table - ADD these fields:
{
  "sms_sequence_active": checkbox,        // Default: false
  "sms_sequence_position": number,        // 0=not started, 1-3=messages sent
  "next_sms_due_at": dateTime,           // When to send next
  "last_sms_sent_at": dateTime,          // Track timing
  "meeting_booked": checkbox,             // Stop condition
  "meeting_time": dateTime,              // From Calendly
  "clicked_sms_link": checkbox,          // Stop condition
  "last_click_time": dateTime,           // Analytics
  "sms_opt_out": checkbox,               // From SimpleTexting
  "sms_reply_received": checkbox         // Two-way flag
}

// In Communications table - ADD fields:
{
  "sequence_position": number,           // Which message (1,2,3)
  "tracking_token": singleLineText,      // Unique click tracker
  "clicked": checkbox,                    // Click status
  "click_time": dateTime,                // When clicked
  "delivery_webhook_data": longText,     // Raw webhook JSON
  "opt_out_webhook_data": longText,      // Raw unsubscribe
  "reply_webhook_data": longText         // Raw incoming SMS
}
```

### Implementation Steps:
1. **Backup current Airtable schema** first
2. Add fields one at a time via UI
3. Test that existing workflows still run
4. Document field IDs for reference

## 🔄 PHASE 2: SMS SEQUENCE SCHEDULER (NEW WORKFLOW)

### Workflow: UYSP-SMS-Sequence-Scheduler
**Trigger**: Schedule (every 10 minutes)
**Purpose**: Send sequences WITHOUT touching single sends

```javascript
// NODE 1: Query Due Sequences
Type: Airtable List
Filter: {
  AND: [
    {sms_sequence_active} = true,
    {sms_sequence_position} < 3,
    {next_sms_due_at} <= NOW(),
    {meeting_booked} != true,
    {clicked_sms_link} != true,
    {sms_opt_out} != true
  ]
}
Limit: 10 // Rate limit safety

// NODE 2: Loop Over Leads
Type: Split In Batches
Batch Size: 1

// NODE 3: Determine Message
Type: Code
const position = $json.fields.sms_sequence_position || 0;
const messages = {
  1: "Hi {{name}}, noticed you're {{title}} at {{company}}. Quick chat? {{link}}",
  2: "Following up {{name}} - other {{title}}s seeing 20% lift. 15 min? {{link}}",
  3: "Last check {{name}} - worth exploring? {{link}}"
};
const nextPosition = position + 1;
const nextDueAt = new Date(Date.now() + (nextPosition === 2 ? 3*24*60*60*1000 : 4*24*60*60*1000));

return {
  message: messages[nextPosition],
  position: nextPosition,
  nextDue: nextDueAt.toISOString()
};

// NODE 4: Generate Click Token
Type: Code
const token = crypto.randomBytes(16).toString('hex');
const trackingLink = `https://rebelhq.app.n8n.cloud/webhook/click/${token}`;
return { ...data, token, trackingLink };

// NODE 5: Send SMS
Type: HTTP Request (SimpleTexting)
// Similar to current working config

// NODE 6: Log to Communications
Type: Airtable Create
Table: Communications
Fields: {
  person_id: {{lead_id}},
  message_type: "SMS",
  message_content: {{message}},
  sequence_position: {{position}},
  tracking_token: {{token}},
  tracking_link: {{trackingLink}},
  sent_time: NOW()
}

// NODE 7: Update Lead
Type: Airtable Update
Fields: {
  sms_sequence_position: {{position}},
  next_sms_due_at: {{nextDue}},
  last_sms_sent_at: NOW()
}

// NODE 8: Error Handler
Type: Slack
Channel: #sms-alerts
Message: "Sequence send failed for {{name}}: {{error}}"
```

### Safety Testing:
1. Run with TEST_MODE=true first (logs only, no sends)
2. Test with single internal phone number
3. Verify Communications logging
4. Check rate limiting works
5. Confirm stop conditions prevent sends

## 🪝 PHASE 3: WEBHOOK ENDPOINTS (RECEIVE ONLY)

### 1. Click Tracking Webhook
**Path**: `/webhook/click/:token`
**Purpose**: First-party tracking, no third-party dependencies

```javascript
// NODE 1: Webhook
Type: Webhook
Path: /click/:token
Method: GET

// NODE 2: Find Communication
Type: Airtable List
Table: Communications
Filter: {tracking_token} = {{token}}

// NODE 3: Update Records
Type: Airtable Update
Table: Communications
Fields: {
  clicked: true,
  click_time: NOW()
}

// NODE 4: Update Lead
Type: Airtable Update  
Table: Leads
Fields: {
  clicked_sms_link: true,
  last_click_time: NOW(),
  last_activity: NOW()
}

// NODE 5: Redirect
Type: Respond to Webhook
Response Code: 302
Headers: {
  Location: "https://calendly.com/your-link"
}
```

### 2. SimpleTexting Delivery Webhook
**Path**: `/webhook/simpletexting-delivery`
```javascript
// Log first, act second
// Store raw webhook_data
// Update delivery_status
// If failed: alert Slack, pause sequence
```

### 3. SimpleTexting Unsubscribe Webhook
**Path**: `/webhook/simpletexting-unsubscribe`
```javascript
// Find lead by phone
// Set sms_opt_out = true
// Set sms_sequence_active = false
// Log to Communications
```

### 4. Calendly Meeting Webhook
**Path**: `/webhook/calendly-events`
```javascript
// Validate signature (when available)
// On invitee.created:
//   Find lead by email
//   Set meeting_booked = true
//   Set sms_sequence_active = false
//   Log meeting details
//   Optional: Send confirmation SMS
```

## 🧪 PHASE 4: TESTING PROTOCOL

### Test Sequence (ORDER MATTERS):
1. **Airtable fields** - Add one, test existing workflow still works
2. **Click webhook** - Test with curl, verify redirect works
3. **Sequence scheduler** - Run in test mode, verify queries work
4. **SimpleTexting webhooks** - Use their test feature if available
5. **Calendly webhook** - Test with sample payload
6. **End-to-end** - One test lead through full sequence

### Test Commands:
```bash
# Test click tracking
curl -L https://rebelhq.app.n8n.cloud/webhook/click/test123

# Test delivery webhook
curl -X POST https://rebelhq.app.n8n.cloud/webhook/simpletexting-delivery \
  -H "Content-Type: application/json" \
  -d '{"id":"msg_123","status":"delivered","destination":"8319990500"}'

# Test Calendly webhook
curl -X POST https://rebelhq.app.n8n.cloud/webhook/calendly-events \
  -H "Content-Type: application/json" \
  -d '{"event":"invitee.created","payload":{"email":"test@example.com"}}'
```

## 🔄 PHASE 5: INTEGRATION (CAREFUL)

### Connection Points:
1. **Lead qualifies** → Set `sms_sequence_active = true`, `next_sms_due_at = NOW()`
2. **Sequence runs** → Scheduler picks up and processes
3. **Click happens** → Updates lead, stops sequence
4. **Meeting booked** → Stops all sequences
5. **Opt-out** → Blocks all future sends

### Rollback Plan:
- Each workflow has ON/OFF switch
- Keep single SMS trigger as fallback
- All new fields are additive (won't break existing)
- Webhook endpoints can be disabled individually
- Full backup before each phase

## 📊 MONITORING & ALERTS

### Key Metrics:
- Sequences started per day
- Messages sent per position (1,2,3)
- Click rates by position
- Meeting conversion by sequence
- Opt-out rates
- Delivery failures

### Alert Conditions:
- Delivery failure rate > 5%
- No sequences processed in 30 minutes
- Click tracking webhook down
- Calendly webhook failures
- Rate limit approaching (1800/2000 daily)

## 🚀 ACTIVATION CHECKLIST

- [ ] All Airtable fields added
- [ ] Click webhook tested and working
- [ ] Sequence scheduler in test mode successful
- [ ] SimpleTexting webhooks configured
- [ ] Calendly webhook validated
- [ ] Rate limiting verified
- [ ] Rollback plan documented
- [ ] Team notified of changes
- [ ] First production sequence monitored
- [ ] 24-hour review scheduled

## ⚠️ CRITICAL WARNINGS

1. **NEVER** modify working SMS Trigger workflow until new system proven
2. **ALWAYS** test webhooks with curl before connecting to SimpleTexting
3. **MONITOR** rate limits - we have 2000/day, aim for <1800
4. **LOG** everything before taking action
5. **BACKUP** before each phase

## 📝 SUPPORT MESSAGE FOR SIMPLETEXTING

Copy and send this:

```
Hi SimpleTexting Support,

We're integrating your API for 1:1 sends and short sequences. Could you confirm:

1. Exact API/web sending limits for our standard account (daily, sustained, and burst throughput per minute/second)
2. Whether delivery webhooks include click events or if clicks are only available in dashboard analytics
3. Delivery/reply/unsubscribe webhook schemas, retry policy, and signature/secret validation details
4. Any special guidance for 10DLC long code throughput vs toll-free or short code
5. Best practices to avoid carrier filtering for short sequences

Thanks!
```

## 🎯 SUCCESS CRITERIA

- Current single SMS sends continue working
- New sequences send without manual intervention
- Click tracking provides real-time visibility
- Meeting bookings stop sequences automatically
- Failures alert team immediately
- No more than 1800 SMS/day sent
- Full audit trail in Communications table
