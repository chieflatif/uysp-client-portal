# SMS Sequence Architecture - Realistic Implementation
*Based on SimpleTexting API actual capabilities*

## 🔍 DATA WE CAN ACTUALLY GET

### Real-Time via Webhooks:
- **Delivery Status**: Confirmed delivery to carrier (not to device)
- **Failed Delivery**: Bounce/failure notifications
- **Opt-Outs**: STOP replies
- **Incoming Messages**: Full reply text
- **Message IDs**: For tracking

### Dashboard/API Polling Only:
- **Click Counts**: Aggregate only, no timestamps
- **Click-Through Rate**: Campaign-level metrics
- **Analytics**: Must check dashboard or fetch campaign after completion

### Not Available:
- **Individual click events** with timestamps
- **Real-time click notifications**
- **Click attribution to specific contacts**

## 📐 ARCHITECTURE DECISIONS (FINALIZED)

### 1. Click Tracking Strategy (Launch Choice)
- For launch: ship clean Calendly link in SMS; do not rewrite URLs.
- Option (when needed): Cloudflare Worker redirect on client domain with HMAC verification → 302 to Calendly; optionally POST click back to n8n.
- n8n Cloud: new GET webhooks currently 404 at edge; defer n8n GET click proxy until resolved.

### 2. Delivery Confirmation
```javascript
// Webhook: /webhook/simpletexting-delivery
{
  "triggers": ["DELIVERY_REPORT", "NON_DELIVERED_REPORT"],
  "url": "https://rebelhq.app.n8n.cloud/webhook/simpletexting-delivery"
}
// Updates Communications.delivery_status
// If failed: pause sequence, alert Slack
```

### 3. Campaign/Batch Tracking
```javascript
// Airtable Schema Addition:
Leads Table:
- lead_source: "Kajabi Webinar" | "Bulk Import May2024" | etc
- campaign_batch_id: "2024-05-bulk-001"
- campaign_type: "webinar_followup" | "database_reactivation"

Communications Table:
- campaign_batch_id: Links to parent campaign
- lead_source: Copied from Leads for analysis
```

## 🏗️ MODULAR IMPLEMENTATION PLAN

### PHASE 1: One-Way SMS (Week 1)
**Focus: Get basic sequences working**

#### A. Message Templates (Stored in Airtable)
```javascript
// New Table: SMS_Templates
{
  template_id: "seq_1_initial",
  position: 1,
  message: "Hi {{first_name}}, noticed you're {{title}} at {{company}}. Other {{title}}s seeing 20% lift with our framework. Worth a quick chat? calendly.com/davidson/15min",
  active: true,
  updated: "2024-05-01"
}
```

#### B. Sequence Scheduler (Daily at 10am EST)
```javascript
// Workflow: UYSP-SMS-Sequence-Daily
// Runs ONCE at 10am EST (not every 10 min)

// Node 1: Business Hours Check
// Use n8n Timezone: America/New_York
const now = new Date();
const hour = $now('America/New_York').hour();
const dow = $now('America/New_York').weekday(); // 0=Sunday
const isWeekend = (dow === 0 || dow === 6);
const isHoliday = checkHolidays(now); // List maintained in Airtable

if (isWeekend || isHoliday || hour < 9 || hour >= 17) {
  return; // Skip run
}

// Node 2: Get Due Sequences
Filter: {
  sms_sequence_active: true,
  next_sms_due_at <= TODAY(),
  meeting_booked != true,
  sms_opt_out != true
}

// Node 3: Get Template for Position
// Node 4: Send via SimpleTexting
// Node 5: Log to Communications with campaign_batch_id
// Node 6: Update Lead (position, next_due)
```

#### C. Delivery Webhook Handler
```javascript
// Workflow: UYSP-Webhook-Delivery
// Path: /webhook/simpletexting-delivery

// Node 1: Parse Webhook
const { messageId, contactPhone, carrier } = $json;

// Node 2: Find Communication Record
Filter: { simpletexting_id: messageId }

// Node 3: Update Status
Fields: {
  delivery_status: "delivered",
  carrier: carrier,
  delivered_at: NOW()
}

// Node 4: If Failed - Alert
If status === "failed":
  → Slack: "SMS Failed to {{phone}}"
  → Update Lead: sms_sequence_active = false
```

### PHASE 2: Reply Handler Module (Week 2)
**Separate workflow - can be disabled/enabled independently**

```javascript
// Workflow: UYSP-SMS-Reply-Handler (INACTIVE initially)
// Activated only after Phase 1 proven

// Node 1: Webhook - Incoming SMS
Path: /webhook/simpletexting-incoming

// Node 2: Find Lead by Phone
// Node 3: Analyze Reply (Simple keywords first)
if (text.includes("yes") || text.includes("interested")) {
  → Route to Slack with HIGH PRIORITY
  → Stop sequence
  → Update lead_status = "Hot - Replied Interested"
}

// Node 4: Log Reply
Table: Communications
Fields: {
  message_type: "SMS_REPLY",
  message_content: reply_text,
  requires_human: true
}
```

### PHASE 3: AI Reply Handler (Week 3+)
**Only after Phase 2 working**
```javascript
// Add Claude node for intelligent responses
// Add escalation rules
// Add conversation threading
// COMPLETELY SEPARATE from core sequence logic
```

## 📊 METRICS & REPORTING

### What We'll Track:
```javascript
Daily Metrics (Automated):
- Messages sent by position (1,2,3) or single-send
- Delivery confirmations
- Opt-outs
- Replies received
- Meetings booked (from Calendly)

Weekly Metrics (Manual Dashboard Check):
- Click-through rates from SimpleTexting dashboard
- Campaign performance by lead_source
- Cost per meeting booked
```

### Airtable Views for Monitoring:
1. **Sequence Pipeline**: Active sequences by position
2. **Daily Send Queue**: Who gets messaged today
3. **Failed Deliveries**: Needs investigation
4. **Hot Replies**: Requires immediate human action
5. **Campaign Performance**: By lead_source and batch

## 🚦 BUSINESS RULES

### Timing:
- **Business Hours**: 9am-5pm ET only
- **No Weekends**: Saturday/Sunday blocked
- **No Holidays**: US federal holidays in Airtable
- **Single Send Batching**: 5 hourly runs of 100 starting 10:00 AM ET
- **Sequence Timing (future)**: 
  - Message 1: Immediately when qualified
  - Message 2: +3 business days
  - Message 3: +4 business days after Message 2

### Stop Conditions:
- Meeting booked (Calendly webhook)
- Opt-out received (SimpleTexting webhook)
- Reply received (any reply stops sequence)
- Delivery failure (prevents further sends)
- Manual override (sales rep claims lead)

## 🛠️ CONFIGURATION LOCATIONS

### Message Templates:
- **Location**: Airtable `SMS_Templates` table
- **Update Method**: Direct edit in Airtable UI
- **Version Control**: Keep `updated` timestamp

### Business Hours:
- **Location**: n8n Variables
- **Values**: 
  ```
  BUSINESS_START_HOUR=9
  BUSINESS_END_HOUR=17
  BUSINESS_TIMEZONE=America/New_York
  ```

### Holiday Calendar:
- **Location**: Airtable `Holidays` table
- **Format**: 
  ```
  date: 2024-12-25
  name: "Christmas"
  sms_blocked: true
  ```

### Campaign Definitions:
- **Location**: Airtable `Campaigns` table
- **Fields**:
  ```
  campaign_id: "webinar-may-2024"
  lead_source: "Kajabi Webinar"
  sequence_enabled: true
  messages_template_set: "standard" | "webinar" | "reactivation"
  ```

## ✅ IMPLEMENTATION CHECKLIST

### Week 1 - Core One-Way SMS:
- [ ] Add Airtable fields (lead_source, campaign_batch_id)
- [ ] Create SMS_Templates table with 3 messages
- [ ] Build daily sequence scheduler (10am EST)
- [ ] Add business hours check
- [ ] Setup delivery webhook handler
- [ ] Add opt-out webhook handler
- [ ] Test with 5 internal numbers
- [ ] Monitor for 48 hours

### Week 2 - Enhancements:
- [ ] Add holiday calendar
- [ ] Create campaign tracking views
- [ ] Build simple reply handler (keyword-based)
- [ ] Add Calendly webhook for meeting detection
- [ ] Create performance dashboard
- [ ] Test with 20 leads

### Week 3 - Scale:
- [ ] Enable for live leads
- [ ] Monitor daily metrics
- [ ] Adjust timing based on data
- [ ] Document any issues

### Future (After Proven):
- [ ] AI reply handler module
- [ ] Two-way conversation support
- [ ] Advanced analytics
- [ ] A/B testing templates

## 🚨 WHAT WE'RE NOT BUILDING

1. **Real-time click tracking** - Not available from SimpleTexting
2. **Complex rate limiting** - Daily batch at 10am is simple
3. **Custom URL shortener** - Use SimpleTexting's built-in
4. **Immediate retries** - Failed messages alert human
5. **Multi-timezone support** - EST only for now
6. **Dynamic templates** - 3 fixed messages to start

## 💡 KEY INSIGHTS

1. **Calendly webhook is our real success metric** - Not clicks
2. **Daily batching at 10am** - Simpler than continuous
3. **Replies stop everything** - Human takes over
4. **Templates in Airtable** - Easy to update without code
5. **Modular design** - Reply handler completely separate
6. **Campaign tracking built-in** - Via lead_source field

## 📝 SUPPORT MESSAGE TO SIMPLETEXTING

"Hi SimpleTexting Support,

We're implementing your API for automated sequences. Can you confirm:

1. Delivery webhooks provide carrier-level confirmation (not device delivery), correct?
2. Click tracking data is only available via dashboard/campaign API after sending, not real-time webhooks?
3. For our 10DLC number, what's the recommended throughput to avoid filtering? 
4. Any special headers/formatting for 3-message sequences to maintain deliverability?
5. Does your platform detect and prevent duplicate sends if we accidentally trigger twice?

Thanks!"

## 🎯 SUCCESS CRITERIA

### Phase 1 Success = 
- 100 SMS sent without errors
- 90%+ delivery confirmation
- <5% opt-out rate  
- 5+ meetings booked
- Zero compliance issues

### Not Success Criteria:
- Click tracking (nice to have)
- Reply handling (Phase 2)
- Complex automation (future)
