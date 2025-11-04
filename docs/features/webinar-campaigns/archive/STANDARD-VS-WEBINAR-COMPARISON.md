# Standard Leads vs Webinar Leads - System Comparison

**Purpose**: Clear comparison of how standard lead forms vs webinar registrations are handled

---

## 🎯 HIGH-LEVEL DIFFERENCES

| Aspect | Standard Lead Form | Webinar Registration |
|--------|-------------------|---------------------|
| **Goal** | Book discovery call | Drive webinar attendance |
| **Timeline** | Open-ended (weeks/months) | Time-bound (hours/days to event) |
| **Message Count** | 1 (currently) | 1-4 (variable based on timing) |
| **Urgency** | Low | HIGH (event-driven) |
| **Scheduling** | Business hours only | 24/7 (time-sensitive) |
| **Follow-up** | Two-way AI messaging (future) | Multi-touch nurture sequence |

---

## 📊 DETAILED COMPARISON TABLE

### System Behavior

| Feature | Standard Leads | Webinar Leads |
|---------|---------------|---------------|
| **Primary Workflow** | `UYSP-SMS-Scheduler-v2` | `UYSP-Webinar-Nurture-Scheduler` (new) |
| **Trigger Frequency** | Hourly (business hours) | Every 10 minutes (24/7) |
| **Cron Schedule** | `0 14-21 * * 1-5` (9-5 ET, Mon-Fri) | `*/10 * * *` (Every 10 min, all days) |
| **Active Hours** | 9 AM - 5 PM ET, Weekdays | 24/7 including weekends |
| **Batch Control** | Manual (set `SMS Batch Control = Active`) | Auto-activated on registration |

### Message Sequencing

| Feature | Standard Leads | Webinar Leads |
|---------|---------------|---------------|
| **Message Count** | 1 (for now) | 1-4 (intelligently determined) |
| **Sequence Steps** | Step 1 only | Steps 1, 2, 3, 4 (as applicable) |
| **A/B Testing** | Yes (Variant A/B) | Yes (Variant A/B per message) |
| **Delay Logic** | Fixed (3-4 days between messages when multi-step) | Dynamic (calculated based on webinar time) |
| **Time Calculations** | Simple delay from last sent | Complex calculation from webinar datetime |

### Timing & Scheduling

| Feature | Standard Leads | Webinar Leads |
|---------|---------------|---------------|
| **Scheduling Approach** | Delay-based (X days after last message) | Absolute-time-based (send at exact time) |
| **Critical Deadlines** | None | YES - webinar start time |
| **Message Windows** | Flexible | Fixed (24hr before, 1hr before) |
| **Timing Precision** | ±1 hour acceptable | ±5 minutes required |
| **Pre-calculation** | No | Yes (entire schedule calculated upfront) |

### Message Content

| Feature | Standard Leads | Webinar Leads |
|---------|---------------|---------------|
| **Message 1** | Cold outreach + CTA (book call) | Registration confirmation + Zoom link |
| **Message 2** | Follow-up (future) | Value/anticipation builder + asset |
| **Message 3** | Final touch (future) | 24-hour reminder + webinar details |
| **Message 4** | N/A | 1-hour reminder (urgent) |
| **Tone** | Sales/discovery | Event reminder + excitement |
| **Primary CTA** | "Book a call" | "Join the webinar" |

### Airtable Schema

| Field | Standard Leads | Webinar Leads |
|-------|---------------|---------------|
| **Identifier** | N/A | `{Is Webinar Lead}` (checkbox) |
| **Event Datetime** | N/A | `{Webinar Datetime}` (datetime) |
| **Campaign Type** | `{Campaign}` (single select) | `{Webinar Campaign}` (single select) |
| **Schedule Storage** | N/A | `{Webinar Message Schedule}` (JSON) |
| **Registration Window** | N/A | `{Webinar Registration Hours}` (number) |
| **Attendance Tracking** | N/A | `{Webinar Attended}` (checkbox) |
| **Shared Fields** | `{SMS Sequence Position}`, `{SMS Last Sent At}`, `{Processing Status}` | Same |

### Templates

| Aspect | Standard Leads | Webinar Leads |
|--------|---------------|---------------|
| **Campaign Prefix** | Generic campaign names | `webinar_[name]` |
| **Step Types** | Numerical (1, 2, 3) | Named types (acknowledgment, value_builder, 24hr_reminder, 1hr_reminder) |
| **Template Count** | 2 per step (A & B) | 8 total (4 types × 2 variants) |
| **Personalization** | Name, company, title | Name, company, title, webinar_name, webinar_date, zoom_link, asset_link |
| **URL Handling** | Short link (Switchy) | Direct Zoom link + tracking |

---

## 🔄 WORKFLOW LOGIC COMPARISON

### Standard Lead Flow
```
Lead Captured (Clay/Kajabi)
    ↓
Enriched (Apollo)
    ↓
Qualified (scoring)
    ↓
SMS Eligible check
    ↓
Manual batch activation ({SMS Batch Control} = Active)
    ↓
Scheduler runs (hourly, business hours)
    ↓
Message 1 sent (if eligible)
    ↓
Wait for two-way AI messaging (future phase)
```

### Webinar Lead Flow
```
Webinar Registration (Unbounce/Kajabi)
    ↓
Capture registration + webinar datetime
    ↓
Calculate hours until webinar
    ↓
Determine eligible messages (1-4)
    ↓
Calculate exact send times
    ↓
Store schedule as JSON
    ↓
Auto-activate processing
    ↓
Scheduler runs (every 10 min, 24/7)
    ↓
Check: Is next message due?
    ↓
Send if time matches (±5 min)
    ↓
Repeat until complete or webinar passes
```

---

## 🎯 DECISION LOGIC COMPARISON

### Standard Lead: Simple Position Check
```javascript
// Standard lead decision logic
if (lead.sms_sequence_position === 0) {
  // Send first message
  send(step: 1);
} else if (lead.sms_sequence_position === 1 && daysSinceLastSent >= 3) {
  // Send second message (future)
  send(step: 2);
}
```

### Webinar Lead: Time-Window Analysis
```javascript
// Webinar lead decision logic
const hoursUntil = (webinar_time - registration_time) / 3600;
const schedule = calculateSchedule(hoursUntil, webinar_time);

if (hoursUntil >= 72) {
  return [msg1, msg2_24hr, msg3, msg4]; // All 4 messages
} else if (hoursUntil >= 36) {
  return [msg1, msg2_compressed, msg3, msg4]; // All 4, compressed
} else if (hoursUntil >= 24) {
  return [msg1, msg2, msg4]; // Skip 24hr reminder
} else if (hoursUntil >= 12) {
  return [msg1, msg4]; // Only ack + 1hr
} else {
  return [msg1]; // Emergency: ack only
}
```

---

## 🚦 SAFETY & COMPLIANCE

| Feature | Standard Leads | Webinar Leads |
|---------|---------------|---------------|
| **Duplicate Prevention** | 24 hours between any messages | 1 hour between any messages (faster cadence) |
| **SMS Stop Compliance** | Yes - checked before every send | Yes - checked before every send |
| **Booked Meeting Stop** | Yes - sets `{Booked} = TRUE`, stops SMS | Yes - same behavior |
| **Business Hours** | Enforced (9-5 ET, Mon-Fri) | NOT enforced (send 24/7 for reminders) |
| **Rate Limiting** | Batch size control | Time-based (10-min checks, natural throttling) |

---

## 📈 MONITORING & METRICS

| Metric | Standard Leads | Webinar Leads |
|--------|---------------|---------------|
| **Success Metric** | Meeting booked rate | Webinar attendance rate |
| **Key Timing Metric** | N/A | % sent within ±5 min of scheduled time |
| **Sequence Completion** | N/A (1 message) | % receiving all eligible messages |
| **Response Tracking** | Click-through rate | Attendance + engagement |
| **Failure Tracking** | Failed sends | Failed sends + missed timing windows |

---

## 🔧 OPERATIONAL DIFFERENCES

### Standard Lead Operations
- **Activation**: Manual batch selection
- **Monitoring**: Hourly execution logs
- **Adjustments**: Change templates, adjust A/B ratio
- **Testing**: Test Mode with test phone
- **Scheduling**: Predictable (hourly intervals)

### Webinar Lead Operations
- **Activation**: Automatic on registration
- **Monitoring**: Continuous (every 10 min)
- **Adjustments**: Per-webinar templates, timing adjustments
- **Testing**: Test Mode + mock webinar datetimes
- **Scheduling**: Dynamic (depends on registration timing)

---

## 💾 DATA STORAGE DIFFERENCES

### Standard Lead Data
```javascript
{
  "email": "john@techcorp.com",
  "phone": "+15551234567",
  "sms_sequence_position": 1,
  "sms_last_sent_at": "2025-11-01T14:30:00Z",
  "sms_variant": "A",
  "campaign": "standard_outreach",
  "processing_status": "Active"
}
```

### Webinar Lead Data
```javascript
{
  "email": "sarah@saascorp.com",
  "phone": "+15559876543",
  "is_webinar_lead": true,
  "webinar_datetime": "2025-11-11T19:00:00Z",
  "webinar_campaign": "ai_bdr_masterclass",
  "webinar_registration_hours": 166,
  "sms_sequence_position": 2,
  "sms_last_sent_at": "2025-11-05T09:05:00Z",
  "sms_variant": "B",
  "processing_status": "Active",
  "webinar_message_schedule": {
    "totalMessages": 4,
    "registrationTime": "2025-11-04T09:00:00Z",
    "webinarTime": "2025-11-11T19:00:00Z",
    "messages": [
      { "step": 1, "type": "acknowledgment", "sendAt": "2025-11-04T09:05:00Z", "status": "sent" },
      { "step": 2, "type": "value_builder", "sendAt": "2025-11-05T09:05:00Z", "status": "sent" },
      { "step": 3, "type": "24hr_reminder", "sendAt": "2025-11-10T19:00:00Z", "status": "pending" },
      { "step": 4, "type": "1hr_reminder", "sendAt": "2025-11-11T18:00:00Z", "status": "pending" }
    ]
  }
}
```

---

## 🔀 CONVERGENCE POINTS

### What They Share
Both lead types:
- Use same `SMS_Templates` table structure
- Use same `SMS_Audit` logging
- Respect `{SMS Stop}` flags
- Check `{Booked}` status
- Use A/B testing
- Send via SimpleTexting API
- Update same core fields (`{SMS Sequence Position}`, `{SMS Last Sent At}`)

### Why Separate Workflows Recommended
- **Different scheduling cadence** (hourly vs 10-min)
- **Different time logic** (delay-based vs absolute-time)
- **Different urgency** (low vs high)
- **Different hours** (business hours vs 24/7)
- **Reduced risk** (don't modify working system)
- **Easier testing** (isolated changes)
- **Clearer code** (purpose-specific logic)

---

## 🎓 EXAMPLE SCENARIOS

### Scenario 1: Standard Lead
```
Day 0 (Monday 10 AM): Lead captured from landing page
Day 0 (Monday 2 PM): Enriched by Apollo
Day 0 (Monday 3 PM): Manual batch activation
Day 0 (Monday 4 PM): Message 1 sent (cold outreach)
Day ?: Wait for two-way AI messaging phase (future)
```

### Scenario 2: Webinar Lead (Week Advance)
```
Day 0 (Monday 9:00 AM): Registers for webinar (7 days out)
Day 0 (Monday 9:05 AM): Message 1 - Registration confirmation
Day 1 (Tuesday 9:05 AM): Message 2 - Value builder with asset
Day 6 (Sunday 2:00 PM): Message 3 - 24hr reminder
Day 7 (Monday 1:00 PM): Message 4 - 1hr reminder
Day 7 (Monday 2:00 PM): WEBINAR STARTS
```

### Scenario 3: Webinar Lead (Last Minute)
```
Day 0 (Monday 12:30 PM): Registers for 2 PM webinar (90 min out)
Day 0 (Monday 12:35 PM): Message 1 - Registration confirmation
Day 0 (Monday 1:00 PM): Message 4 - 1hr reminder
Day 0 (Monday 2:00 PM): WEBINAR STARTS
Messages 2 & 3 skipped - not enough time
```

---

## ✅ DECISION MATRIX

### When to Use Standard Lead Flow
- ✅ Generic landing page conversion
- ✅ Cold outreach from prospecting list
- ✅ Non-event-based lead generation
- ✅ Open-ended timeline (no urgency)
- ✅ Single touch before AI messaging

### When to Use Webinar Lead Flow
- ✅ Webinar registration form
- ✅ Event-driven (fixed datetime)
- ✅ Need multiple touches before event
- ✅ Time-sensitive reminders required
- ✅ Attendance is the goal

---

## 📋 MIGRATION PATH

### Phase 1: Current State (Standard Only)
- All leads → Standard flow
- 1 message per lead
- Manual batch control
- Business hours only

### Phase 2: Add Webinar Flow (Parallel)
- Standard leads → Standard flow (unchanged)
- Webinar leads → New webinar flow
- Both run in parallel
- Different scheduling

### Phase 3: Optimize Both
- Standard flow → Add two-way AI messaging
- Webinar flow → Add post-webinar follow-up
- Both mature independently

---

## 🎯 KEY TAKEAWAYS

1. **Different Goals**: Standard = Book call, Webinar = Drive attendance
2. **Different Urgency**: Standard = Low, Webinar = HIGH (event-bound)
3. **Different Timing**: Standard = Delay-based, Webinar = Absolute-time
4. **Different Hours**: Standard = Business hours, Webinar = 24/7
5. **Different Workflows**: Separate is cleaner, safer, more maintainable

**Recommendation**: Build webinar flow as separate workflow, not modification of existing standard flow.

---

**Use This Doc**: To explain differences to stakeholders and justify separate workflow approach  
**Reference During**: Implementation to ensure proper separation of concerns

