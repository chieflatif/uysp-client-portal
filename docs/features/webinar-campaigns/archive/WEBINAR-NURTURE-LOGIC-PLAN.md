# Webinar Nurture Workflow - Logic & Implementation Plan

**Created**: 2025-11-02  
**Status**: Planning Phase  
**Purpose**: Design intelligent webinar lead nurture with time-aware message sequencing

---

## 🎯 BUSINESS REQUIREMENTS

### Webinar Lead Behavior (Different from Standard Lead Forms)
**Standard Lead**: Single message → Wait for two-way messaging (future)  
**Webinar Lead**: Multi-message nurture sequence → Build anticipation → Drive attendance

### Message Sequence (Up to 5 Messages)
1. **Immediate**: Registration Acknowledgment
2. **Post-Enrichment**: Value/Anticipation Builder (with asset)
3. **24 Hours Before**: Reminder + Value
4. **1 Hour Before**: Final Reminder
5. *(Optional 5th if needed based on timing)*

---

## ⏰ CORE TIMING LOGIC

### Window Analysis: When All Messages Can Be Sent

| Registration Time Before Webinar | Messages Possible | Logic |
|----------------------------------|-------------------|-------|
| **≥ 72 hours (3+ days)** | All 5 messages | Full sequence with proper spacing |
| **48-72 hours** | 4 messages | Acknowledgment → Value → 24hr → 1hr |
| **36-48 hours** | 4 messages | Acknowledgment → 24hr delay → Value → 24hr → 1hr |
| **24-36 hours** | 3 messages | Acknowledgment → Value → 1hr |
| **12-24 hours** | 2 messages | Acknowledgment → 1hr |
| **1-12 hours** | 1-2 messages | Acknowledgment only (+ 1hr if time allows) |
| **< 1 hour** | 1 message | Acknowledgment only |

### Minimum Timing Windows (Safety Rules)
- **Acknowledgment**: Immediate (within 5 minutes of registration)
- **Value Message**: Minimum 12 hours after acknowledgment
- **24-Hour Reminder**: Exactly 24 hours before webinar (±1 hour tolerance)
- **1-Hour Reminder**: Exactly 1 hour before webinar (±5 minute tolerance)
- **Between Messages**: Minimum 8 hours gap (except final 1-hour reminder)

---

## 🧮 INTELLIGENT SCHEDULING ALGORITHM

### Step 1: Calculate Time Windows

```javascript
// Inputs
const registrationTime = new Date(); // Now
const webinarTime = new Date(lead.webinar_datetime); // From Airtable
const hoursUntilWebinar = (webinarTime - registrationTime) / (1000 * 60 * 60);

// Fixed Message Times (work backwards from webinar)
const msg4_1HourBefore = new Date(webinarTime - (1 * 60 * 60 * 1000));
const msg3_24HoursBefore = new Date(webinarTime - (24 * 60 * 60 * 1000));

// Dynamic Message Times (based on available window)
let msg1_acknowledgment = new Date(registrationTime + (5 * 60 * 1000)); // +5 min
let msg2_valueBuilder = null; // Calculate based on available time
```

### Step 2: Determine Message Schedule (Decision Tree)

```javascript
function calculateWebinarMessageSchedule(registrationTime, webinarTime) {
  const hoursUntil = (webinarTime - registrationTime) / (1000 * 60 * 60);
  
  // Message 4 (1hr before) - Fixed
  const msg4 = new Date(webinarTime.getTime() - (1 * 60 * 60 * 1000));
  
  // Message 3 (24hr before) - Fixed
  const msg3 = new Date(webinarTime.getTime() - (24 * 60 * 60 * 1000));
  
  // Message 1 (acknowledgment) - Immediate
  const msg1 = new Date(registrationTime.getTime() + (5 * 60 * 1000));
  
  let schedule = { messages: [] };
  
  // SCENARIO A: ≥ 72 hours (3+ days)
  if (hoursUntil >= 72) {
    // Full sequence with optimal spacing
    const msg2 = new Date(registrationTime.getTime() + (24 * 60 * 60 * 1000)); // +24hr
    
    schedule.messages = [
      { step: 1, type: 'acknowledgment', sendAt: msg1, delayHours: 0 },
      { step: 2, type: 'value_builder', sendAt: msg2, delayHours: 24 },
      { step: 3, type: '24hr_reminder', sendAt: msg3, delayHours: calculateHours(msg2, msg3) },
      { step: 4, type: '1hr_reminder', sendAt: msg4, delayHours: 23 }
    ];
    
  // SCENARIO B: 36-72 hours
  } else if (hoursUntil >= 36 && hoursUntil < 72) {
    // Acknowledgment → Wait → Value → 24hr → 1hr
    // Calculate value message time (halfway between acknowledgment and 24hr reminder)
    const availableWindow = msg3 - msg1;
    const msg2 = new Date(msg1.getTime() + (availableWindow * 0.4)); // 40% into window
    
    schedule.messages = [
      { step: 1, type: 'acknowledgment', sendAt: msg1, delayHours: 0 },
      { step: 2, type: 'value_builder', sendAt: msg2, delayHours: calculateHours(msg1, msg2) },
      { step: 3, type: '24hr_reminder', sendAt: msg3, delayHours: calculateHours(msg2, msg3) },
      { step: 4, type: '1hr_reminder', sendAt: msg4, delayHours: 23 }
    ];
    
  // SCENARIO C: 24-36 hours
  } else if (hoursUntil >= 24 && hoursUntil < 36) {
    // Skip 24hr reminder (too close), send Acknowledgment → Value → 1hr
    const msg2 = new Date(msg1.getTime() + (12 * 60 * 60 * 1000)); // +12hr
    
    schedule.messages = [
      { step: 1, type: 'acknowledgment', sendAt: msg1, delayHours: 0 },
      { step: 2, type: 'value_builder', sendAt: msg2, delayHours: 12 },
      { step: 4, type: '1hr_reminder', sendAt: msg4, delayHours: calculateHours(msg2, msg4) }
    ];
    
  // SCENARIO D: 12-24 hours
  } else if (hoursUntil >= 12 && hoursUntil < 24) {
    // Only Acknowledgment + 1hr reminder (skip value & 24hr)
    schedule.messages = [
      { step: 1, type: 'acknowledgment', sendAt: msg1, delayHours: 0 },
      { step: 4, type: '1hr_reminder', sendAt: msg4, delayHours: calculateHours(msg1, msg4) }
    ];
    
  // SCENARIO E: 1-12 hours
  } else if (hoursUntil >= 1 && hoursUntil < 12) {
    // Only Acknowledgment + maybe 1hr if enough time
    schedule.messages = [
      { step: 1, type: 'acknowledgment', sendAt: msg1, delayHours: 0 }
    ];
    
    // Add 1hr reminder only if we have at least 2 hours buffer
    if (hoursUntil >= 3) {
      schedule.messages.push({ 
        step: 4, 
        type: '1hr_reminder', 
        sendAt: msg4, 
        delayHours: calculateHours(msg1, msg4) 
      });
    }
    
  // SCENARIO F: < 1 hour
  } else {
    // Emergency: Only acknowledgment
    schedule.messages = [
      { step: 1, type: 'acknowledgment', sendAt: msg1, delayHours: 0 }
    ];
  }
  
  schedule.totalMessages = schedule.messages.length;
  schedule.registrationWindow = hoursUntil;
  
  return schedule;
}

function calculateHours(startTime, endTime) {
  return Math.round((endTime - startTime) / (1000 * 60 * 60));
}
```

### Step 3: Real-Time Execution Logic

When scheduler runs (every 10-15 minutes):

```javascript
// For each webinar lead in "Active" status
for (lead of webinarLeads) {
  const now = new Date();
  const currentPosition = lead.sms_sequence_position || 0;
  const schedule = JSON.parse(lead.webinar_message_schedule); // Pre-calculated on registration
  
  // Find next message due
  const nextMessage = schedule.messages.find(msg => 
    msg.step > currentPosition && 
    new Date(msg.sendAt) <= now
  );
  
  if (nextMessage && !hasRecentlySent(lead, 1)) { // 1 hour duplicate prevention
    sendMessage(lead, nextMessage.type, nextMessage.step);
    updateLead(lead, {
      sms_sequence_position: nextMessage.step,
      sms_last_sent_at: now
    });
  }
  
  // Check if sequence complete
  if (currentPosition >= schedule.totalMessages || now > lead.webinar_datetime) {
    updateLead(lead, { processing_status: 'Complete' });
  }
}
```

---

## 📋 AIRTABLE SCHEMA ADDITIONS

### Leads Table - New Fields Required

| Field Name | Type | Purpose |
|------------|------|---------|
| `Webinar Datetime` | DateTime | Webinar start time (from form submission) |
| `Is Webinar Lead` | Checkbox | Flags webinar leads for special handling |
| `Webinar Campaign` | Single Select | Which webinar (JB, Sales, AI, etc.) |
| `Webinar Message Schedule` | Long Text (JSON) | Pre-calculated message schedule |
| `Webinar Registration Hours` | Number | Hours between registration and webinar |
| `Webinar Attended` | Checkbox | Post-webinar update (future integration) |

### SMS_Templates Table - New Templates

| Campaign | Variant | Step | Type | Body Template |
|----------|---------|------|------|---------------|
| webinar_[name] | A | 1 | acknowledgment | "Hi {{first_name}}, you're confirmed for {{webinar_name}} on {{webinar_date}}! Check your email for the Zoom link. Can't wait to see you there! 🎯" |
| webinar_[name] | A | 2 | value_builder | "{{first_name}}, ahead of {{webinar_name}}, here's a quick resource: {{asset_link}}. Other {{title}}s at {{company_type}} companies are seeing huge wins. See you {{webinar_day}}!" |
| webinar_[name] | A | 3 | 24hr_reminder | "Tomorrow's the day, {{first_name}}! {{webinar_name}} starts at {{webinar_time}} ET. Grab your coffee ☕ and join us: {{zoom_link}}" |
| webinar_[name] | A | 4 | 1hr_reminder | "Starting in 1 hour, {{first_name}}! {{webinar_name}} at {{webinar_time}} ET. Join here: {{zoom_link}} 🚀" |

*(Repeat for Variant B with different copy)*

---

## 🔄 WORKFLOW ARCHITECTURE

### Option 1: Separate Webinar Workflow (RECOMMENDED)

**New Workflow**: `UYSP-Webinar-Nurture-Scheduler`

**Advantages**:
- Isolated logic (doesn't affect standard lead forms)
- Easier to test and debug
- Different scheduling cadence (every 10 min vs hourly)
- Webinar-specific safety rules

**Trigger**: Schedule (every 10 minutes, 24/7 since time-sensitive)

**Nodes**:
1. **List Webinar Leads Due** (Airtable Query)
   - Filter: `{Is Webinar Lead} = TRUE`, `{Processing Status} = "Active"`, `{SMS Stop} != TRUE`
   
2. **Calculate Schedule on First Run** (Code Node)
   - If `{Webinar Message Schedule}` is empty, calculate and save
   
3. **Determine Next Message** (Code Node)
   - Parse schedule JSON
   - Find next message due based on current time
   
4. **Prepare Message Text** (Code Node)
   - Load template from SMS_Templates
   - Personalize variables
   
5. **Send SMS** (HTTP - SimpleTexting)
   
6. **Update Lead** (Airtable Update)
   - Increment `{SMS Sequence Position}`
   - Update `{SMS Last Sent At}`
   - Set `{Processing Status} = "Complete"` if done

7. **Log to SMS_Audit** (Airtable Create)

### Option 2: Unified Workflow with Routing

Add routing logic to existing `UYSP-SMS-Scheduler-v2`:
- Branch based on `{Is Webinar Lead}` field
- Route to webinar-specific logic path
- Rejoin for common send/log operations

**Advantages**: Single workflow to maintain  
**Disadvantages**: More complex, higher risk of breaking existing functionality

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Schema & Data (Week 1)
- [ ] Add new fields to Leads table
- [ ] Create webinar templates in SMS_Templates
- [ ] Create test webinar leads with various registration times
- [ ] Validate field IDs in COMPLETE-DEPENDENCY-MATRIX.md

### Phase 2: Scheduling Logic (Week 2)
- [ ] Create `calculateWebinarMessageSchedule()` function
- [ ] Test with various time windows (72hr, 36hr, 24hr, 6hr scenarios)
- [ ] Build test suite for edge cases
- [ ] Document all scenarios in test cases

### Phase 3: Workflow Build (Week 3)
- [ ] Create `UYSP-Webinar-Nurture-Scheduler` workflow (inactive)
- [ ] Build all nodes per architecture
- [ ] Add safety checks (business hours, duplicate prevention)
- [ ] Create Slack notifications for monitoring

### Phase 4: Testing (Week 4)
- [ ] Test Mode with test phone numbers
- [ ] Simulate registrations at different time windows
- [ ] Verify message timing accuracy
- [ ] Validate Airtable updates
- [ ] Check SMS_Audit logging

### Phase 5: Production Rollout (Week 5)
- [ ] Backup current system
- [ ] Activate workflow
- [ ] Monitor first 48 hours closely
- [ ] Adjust timing logic if needed
- [ ] Document any edge cases encountered

---

## 🔒 SAFETY CONSIDERATIONS

### Duplicate Prevention
- Use existing `{SMS Last Sent At}` + 1-hour window
- Never send if another message went out < 1 hour ago
- Webinar-specific: Don't send if webinar already passed

### Time Zone Handling
- Store all times in UTC
- Convert to ET for display/logging
- Webinar time from form should be in ET (normalize to UTC)

### Failure Handling
- If SimpleTexting fails, DON'T increment position
- Retry on next scheduler run
- Log all errors to `{Error Log}`

### Compliance
- Respect existing `{SMS Stop}` flags
- Honor `{Booked}` status (stop all messaging)
- Don't send outside business hours? (Discuss: webinars may be evening)

### Edge Cases
- **Webinar rescheduled**: Recalculate schedule, reset position to 0
- **Lead books meeting**: Stop all webinar messages immediately
- **Lead opts out**: Comply instantly
- **Wrong timezone**: Validate format on ingestion

---

## 📊 SUCCESS METRICS

### Timing Accuracy
- % of messages sent within ±5 minutes of scheduled time
- Target: 95%+

### Sequence Completion
- % of leads receiving all eligible messages
- Target: 90%+

### Attendance Impact
- Webinar show-up rate: Compare nurtured vs non-nurtured
- Target: +15% lift

### System Health
- Failed sends rate
- Target: <2%

---

## 🧪 TEST SCENARIOS

### Test Case 1: 7-Day Registration
- **Registration**: Monday 9am
- **Webinar**: Following Monday 2pm
- **Expected**: All 4 messages (Ack, Value, 24hr, 1hr)
- **Spacing**: Immediate, +24hr, -24hr, -1hr

### Test Case 2: 2-Day Registration
- **Registration**: Saturday 3pm
- **Webinar**: Monday 2pm
- **Expected**: 3 messages (Ack, Value, 1hr) - Skip 24hr reminder
- **Spacing**: Immediate, +12hr, -1hr

### Test Case 3: Same-Day Registration
- **Registration**: Monday 10am
- **Webinar**: Monday 2pm (4 hours)
- **Expected**: 2 messages (Ack, 1hr)
- **Spacing**: Immediate, -1hr

### Test Case 4: Last-Minute Registration
- **Registration**: Monday 1:30pm
- **Webinar**: Monday 2pm (30 min)
- **Expected**: 1 message (Ack only)
- **Spacing**: Immediate

### Test Case 5: Already Passed 24hr Window
- **Registration**: Sunday 10am
- **Webinar**: Monday 2pm (28 hours)
- **Expected**: 3 messages (Ack, Value, 1hr) - 24hr window already passed
- **Spacing**: Immediate, +6hr, -1hr

---

## 💡 FUTURE ENHANCEMENTS

### Post-Webinar Follow-up
- Attendees: "Thanks for joining!" + CTA
- No-shows: "Sorry we missed you" + replay link

### Engagement Scoring
- Track clicks on asset links
- Prioritize high-engagement leads for sales

### Dynamic Content
- Adjust value message based on company data
- Personalize reminders based on engagement

### Multi-Webinar Intelligence
- Recognize repeat registrants
- Adjust messaging for serial attendees

---

## ❓ DECISIONS NEEDED

1. **Business Hours**: Should webinar messages respect 9-5 ET business hours, or send 24/7 since time-sensitive?
   - **Recommendation**: 24/7 for webinar reminders (especially 1hr before)

2. **Minimum Registration Window**: What's the cutoff? Should we accept registrations <1 hour before?
   - **Recommendation**: Accept all registrations, send acknowledgment regardless

3. **Webinar Time Source**: Where does `{Webinar Datetime}` come from? Form submission? Manual entry? Kajabi tags?
   - **Recommendation**: Add hidden field to Unbounce/Kajabi form with webinar datetime

4. **Variant Testing**: Should webinars use A/B testing like standard leads?
   - **Recommendation**: Yes, test different reminder copy

5. **Assets**: What assets to include in value message? Who provides these?
   - **Recommendation**: Client provides PDF/link, store in SMS_Templates table

---

## 📚 REFERENCE DOCUMENTS

- `COMPLETE-DEPENDENCY-MATRIX.md` - Field IDs and table relationships
- `SYSTEM-ARCHITECTURE-COMPLETE.md` - Current system architecture
- `COMPLETE-BUSINESS-LOGIC-MAP.md` - SMS sequencing rules
- Workflow: `UYSP-SMS-Scheduler-v2` - Current standard SMS logic

---

**Status**: Ready for review and decision-making  
**Next Step**: Review timing logic and address decision points  
**Estimated Implementation**: 3-4 weeks with testing

