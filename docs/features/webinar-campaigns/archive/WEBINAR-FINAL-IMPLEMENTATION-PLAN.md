# Webinar Nurture - Final Implementation Plan

**Created**: 2025-11-02  
**Status**: ✅ APPROVED - Ready for Implementation  
**Client Decisions**: Locked In

---

## ✅ DECISIONS FINALIZED

### 1. Business Hours: **8 AM - 8 PM ET**
- Webinar messages send within business hours only
- Cron: `0 13-24 * * *` (8 AM - 8 PM ET in UTC)
- Check every 10 minutes during active hours

### 2. Webinar Datetime Source: **Airtable + UI Configuration**
- Manual Airtable entry initially
- UI will remotely configure: webinar datetime + Punjabi form name + resource link
- Campaign setup creates all configuration in one place

### 3. A/B Testing: **NO**
- Single message variant per step (simpler)
- Reduces templates from 8 to 4
- Faster to implement and maintain

### 4. Value Message Assets: **UI-Configured Per Campaign**
- Client drops resource link + resource name in campaign config
- Stored in campaign configuration
- Each webinar can have unique asset

### 5. Workflow Trigger: **Lead Source = "Punjabi-Webinar"**
- New separate workflow: `UYSP-Webinar-Nurture-Scheduler`
- Triggered when `{Lead Source} = "Punjabi-Webinar"`
- Standard leads continue on existing workflow

---

## 📋 IMPLEMENTATION ROADMAP

### **PHASE 1: Schema & Data Setup** (Week 1)

#### Airtable: Leads Table - Add Fields

| Field Name | Type | Options | Purpose |
|-----------|------|---------|---------|
| `Webinar Datetime` | DateTime | Format: ISO, Timezone: America/New_York | When webinar starts |
| `Webinar Campaign Name` | Single Line Text | - | Which webinar (e.g., "AI BDR Masterclass Nov 11") |
| `Webinar Resource Link` | URL | - | Asset for value message |
| `Webinar Resource Name` | Single Line Text | - | Name of asset (e.g., "AI BDR Prep Guide") |
| `Webinar Message Schedule` | Long Text (JSON) | - | Pre-calculated schedule |
| `Webinar Registration Hours` | Number | Precision: 1 | Hours between registration and webinar |
| `Webinar Message Position` | Number | Precision: 0 | Which message sent (1-4) |

**Notes**:
- Reuse existing `{SMS Last Sent At}`, `{SMS Stop}`, `{Booked}`, `{Processing Status}` fields
- Reuse existing `{Campaign (CORRECTED)}` for webinar campaign names

#### Airtable: Lead Source Options - Add New Value

**Field**: `{Lead Source}` (fldEMGOURoyzU2ah0)

**Add Option**: `Punjabi-Webinar`
- Current options: Kajabi-API, Kajabi-Webhook, Manual, Bulk-Import
- New option: **Punjabi-Webinar** (trigger for webinar workflow)

#### SMS_Templates Table - Add Webinar Templates

**Campaign Prefix**: `webinar_[name]` (e.g., `webinar_ai_bdr_nov11`)

| Campaign | Step | Type | Body Template | Delay Days |
|----------|------|------|---------------|------------|
| webinar_[name] | 1 | acknowledgment | "Hi {{first_name}}! You're confirmed for {{webinar_name}} on {{webinar_date}} at {{webinar_time}} ET 🎯 Check your email for the Zoom link. See you there!" | 0 |
| webinar_[name] | 2 | value_builder | "{{first_name}}, ahead of {{webinar_name}}, here's your {{resource_name}}: {{resource_link}}. Other {{title}}s at {{company_type}} companies are finding this super valuable. Can't wait for {{webinar_day}}! 📚" | Variable |
| webinar_[name] | 3 | 24hr_reminder | "Tomorrow's the big day, {{first_name}}! {{webinar_name}} starts at {{webinar_time}} ET. Set a reminder and we'll see you there ⏰" | Variable |
| webinar_[name] | 4 | 1hr_reminder | "Starting in 1 hour, {{first_name}}! {{webinar_name}} at {{webinar_time}} ET. Join here: {{zoom_link}} 🚀" | Variable |

**Note**: No A/B variants - single template per step

---

### **PHASE 2: Calculation Function** (Week 2)

#### Build Timing Calculator (JavaScript)

Create reusable function: `calculateWebinarSchedule(registrationTime, webinarTime)`

```javascript
/**
 * Calculate webinar message schedule based on registration timing
 * @param {Date} registrationTime - When lead registered
 * @param {Date} webinarTime - When webinar starts
 * @returns {Object} Schedule with messages array
 */
function calculateWebinarSchedule(registrationTime, webinarTime) {
  const hoursUntil = (webinarTime - registrationTime) / (1000 * 60 * 60);
  
  // Fixed times (work backwards from webinar)
  const msg4Time = new Date(webinarTime.getTime() - (1 * 60 * 60 * 1000)); // 1hr before
  const msg3Time = new Date(webinarTime.getTime() - (24 * 60 * 60 * 1000)); // 24hr before
  const msg1Time = new Date(registrationTime.getTime() + (5 * 60 * 1000)); // +5 min
  
  let messages = [];
  
  // Always send Message 1 (acknowledgment)
  messages.push({
    step: 1,
    type: 'acknowledgment',
    sendAt: msg1Time.toISOString(),
    delayHours: 0
  });
  
  // DECISION TREE
  if (hoursUntil >= 72) {
    // Path A: ≥ 72 hours - Full sequence with optimal spacing
    const msg2Time = new Date(registrationTime.getTime() + (24 * 60 * 60 * 1000));
    
    messages.push(
      { step: 2, type: 'value_builder', sendAt: msg2Time.toISOString(), delayHours: 24 },
      { step: 3, type: '24hr_reminder', sendAt: msg3Time.toISOString(), delayHours: Math.round((msg3Time - msg2Time) / (1000 * 60 * 60)) },
      { step: 4, type: '1hr_reminder', sendAt: msg4Time.toISOString(), delayHours: 23 }
    );
    
  } else if (hoursUntil >= 36) {
    // Path B: 36-72 hours - Compressed spacing
    const availableWindow = msg3Time - msg1Time;
    const msg2Time = new Date(msg1Time.getTime() + (availableWindow * 0.4));
    
    messages.push(
      { step: 2, type: 'value_builder', sendAt: msg2Time.toISOString(), delayHours: Math.round((msg2Time - msg1Time) / (1000 * 60 * 60)) },
      { step: 3, type: '24hr_reminder', sendAt: msg3Time.toISOString(), delayHours: Math.round((msg3Time - msg2Time) / (1000 * 60 * 60)) },
      { step: 4, type: '1hr_reminder', sendAt: msg4Time.toISOString(), delayHours: 23 }
    );
    
  } else if (hoursUntil >= 24) {
    // Path C: 24-36 hours - Skip 24hr reminder
    const msg2Time = new Date(msg1Time.getTime() + (12 * 60 * 60 * 1000));
    
    messages.push(
      { step: 2, type: 'value_builder', sendAt: msg2Time.toISOString(), delayHours: 12 },
      { step: 4, type: '1hr_reminder', sendAt: msg4Time.toISOString(), delayHours: Math.round((msg4Time - msg2Time) / (1000 * 60 * 60)) }
    );
    
  } else if (hoursUntil >= 3) {
    // Path D: 3-24 hours - Acknowledgment + 1hr reminder
    messages.push(
      { step: 4, type: '1hr_reminder', sendAt: msg4Time.toISOString(), delayHours: Math.round((msg4Time - msg1Time) / (1000 * 60 * 60)) }
    );
    
  } // else: < 3 hours - Only acknowledgment (already added)
  
  return {
    registrationTime: registrationTime.toISOString(),
    webinarTime: webinarTime.toISOString(),
    hoursUntilWebinar: Math.round(hoursUntil * 10) / 10,
    totalMessages: messages.length,
    messages: messages
  };
}
```

#### Testing

Create test file: `tests/webinar-schedule-calculator.test.js`

Test all scenarios from `test-cases-webinar-timing.json`:
- 7 days advance (full sequence)
- 3 days, 2 days, 36 hours
- 30 hours, 12 hours, 6 hours
- 2 hours, 30 minutes
- Edge cases

---

### **PHASE 3: n8n Workflow Build** (Week 3)

#### Create New Workflow: `UYSP-Webinar-Nurture-Scheduler`

**Trigger**: Schedule - Every 10 minutes during business hours
- Cron: `*/10 13-24 * * *` (Every 10 min, 8 AM - 8 PM ET)
- Timezone: America/New_York

#### Node Architecture

```
1. [Schedule Trigger]
        ↓
2. [List Due Webinar Leads] (Airtable)
   Filter Formula:
   AND(
     {Lead Source} = "Punjabi-Webinar",
     {Processing Status} = "Active",
     {Phone Valid} = TRUE,
     NOT({SMS Stop}),
     NOT({Booked}),
     {Webinar Datetime} > NOW(),
     LEN({Webinar Message Schedule}) > 0
   )
        ↓
3. [Check If Schedule Exists] (Code)
   - If {Webinar Message Schedule} empty → Calculate & save
   - Else → Parse JSON schedule
        ↓
4. [Find Next Message Due] (Code)
   - Current time within ±5 min of scheduled time?
   - Position < message step?
   - Last sent > 1 hour ago?
        ↓
5. [IF: Message Due?] (IF Node)
        ↓ YES
6. [Prepare Message] (Code)
   - Load template body
   - Personalize variables:
     * {{first_name}}, {{last_name}}
     * {{company}}, {{title}}
     * {{webinar_name}}, {{webinar_date}}, {{webinar_time}}
     * {{resource_name}}, {{resource_link}}
     * {{zoom_link}}
        ↓
7. [Send SMS] (HTTP - SimpleTexting)
   POST https://api-app2.simpletexting.com/v2/api/messages
        ↓
8. [Update Lead] (Airtable)
   - Increment {Webinar Message Position}
   - Set {SMS Last Sent At} = NOW()
   - If position >= totalMessages → {Processing Status} = "Complete"
        ↓
9. [Log to SMS_Audit] (Airtable Create)
   - Event, Phone, Status, Text, Campaign ID
        ↓
10. [Slack Notification] (HTTP - Slack)
    - Success/failure notification
```

#### Critical Code Nodes

**Node 3: Check/Calculate Schedule**
```javascript
// Input: $json from Airtable query
const registrationTime = new Date($json.fields['Record Created AT'] || $json.fields['Imported At']);
const webinarTime = new Date($json.fields['Webinar Datetime']);
let schedule;

if (!$json.fields['Webinar Message Schedule']) {
  // Calculate schedule (use function from Phase 2)
  schedule = calculateWebinarSchedule(registrationTime, webinarTime);
  
  // Save back to Airtable (next node will handle)
  return {
    json: {
      ...$ json,
      needsScheduleSave: true,
      calculatedSchedule: JSON.stringify(schedule)
    }
  };
} else {
  // Parse existing schedule
  schedule = JSON.parse($json.fields['Webinar Message Schedule']);
  
  return {
    json: {
      ...$json,
      needsScheduleSave: false,
      schedule: schedule
    }
  };
}
```

**Node 4: Find Next Message**
```javascript
// Input: Lead with parsed schedule
const now = new Date();
const currentPosition = $json.fields['Webinar Message Position'] || 0;
const schedule = $json.schedule;
const lastSentAt = $json.fields['SMS Last Sent At'] ? new Date($json.fields['SMS Last Sent At']) : null;

// Duplicate prevention (1 hour window)
if (lastSentAt && (now - lastSentAt) < (60 * 60 * 1000)) {
  return { json: { ...$json, messageDue: false, reason: 'Duplicate prevention - sent < 1hr ago' }};
}

// Find next message
const nextMessage = schedule.messages.find(msg => {
  const msgTime = new Date(msg.sendAt);
  const timeDiff = Math.abs(now - msgTime);
  
  return (
    msg.step > currentPosition &&
    timeDiff <= (5 * 60 * 1000) // Within ±5 minutes
  );
});

if (nextMessage) {
  return {
    json: {
      ...$json,
      messageDue: true,
      nextMessage: nextMessage,
      messageType: nextMessage.type,
      messageStep: nextMessage.step
    }
  };
} else {
  return { json: { ...$json, messageDue: false, reason: 'No message due at this time' }};
}
```

**Node 6: Prepare Message**
```javascript
// Input: Lead with nextMessage
const fields = $json.fields;
const messageType = $json.messageType;

// Load template from SMS_Templates (query by campaign + step + type)
const campaignName = fields['Webinar Campaign Name'];
const step = $json.messageStep;

// Template body (would come from Airtable query in real implementation)
let messageBody = getTemplateBody(campaignName, step, messageType);

// Personalize
messageBody = messageBody
  .replace(/{{first_name}}/g, fields['First Name'] || 'there')
  .replace(/{{last_name}}/g, fields['Last Name'] || '')
  .replace(/{{company}}/g, fields['Company'] || 'your company')
  .replace(/{{title}}/g, fields['Job Title'] || 'your role')
  .replace(/{{webinar_name}}/g, fields['Webinar Campaign Name'] || 'our webinar')
  .replace(/{{webinar_date}}/g, formatDate(fields['Webinar Datetime']))
  .replace(/{{webinar_time}}/g, formatTime(fields['Webinar Datetime']))
  .replace(/{{webinar_day}}/g, formatDay(fields['Webinar Datetime']))
  .replace(/{{resource_name}}/g, fields['Webinar Resource Name'] || 'this resource')
  .replace(/{{resource_link}}/g, fields['Webinar Resource Link'] || '')
  .replace(/{{zoom_link}}/g, fields['Campaign']['Zoom Link'] || ''); // From campaign config

return {
  json: {
    ...$json,
    messageText: messageBody,
    phone: fields['Phone'],
    leadId: fields['Record ID']
  }
};
```

---

### **PHASE 4: UI Integration Points** (Week 4)

#### Campaign Configuration Screen (Client Portal)

**New Campaign Type**: "Webinar"

**Configuration Fields**:
```typescript
interface WebinarCampaignConfig {
  id: string;
  name: string; // "AI BDR Masterclass - Nov 11"
  type: "webinar";
  webinarDatetime: Date; // When webinar starts
  zoomLink: string; // Zoom meeting URL
  resourceLink: string; // Asset URL for value message
  resourceName: string; // Display name for asset
  punjabiFormName: string; // Which Punjabi form triggers this
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Form Mapping**:
- When lead comes from Punjabi form → Match `punjabiFormName`
- Auto-populate: `{Webinar Datetime}`, `{Webinar Campaign Name}`, `{Webinar Resource Link}`, `{Webinar Resource Name}`
- Set `{Lead Source} = "Punjabi-Webinar"`

#### UI → Airtable Integration

**API Endpoint**: `/api/campaigns/webinar`

**On Campaign Create**:
1. Store config in Portal database
2. Create templates in Airtable `SMS_Templates` table (4 templates per campaign)
3. Add campaign to `{Campaign (CORRECTED)}` options
4. Ready for leads

**On Lead Ingestion from Punjabi**:
1. Match Punjabi form name to campaign config
2. Populate webinar fields in Airtable
3. Set `{Lead Source} = "Punjabi-Webinar"`
4. Workflow triggers automatically

---

### **PHASE 5: Testing** (Week 5)

#### Test Mode Configuration

**Airtable Settings Table**:
- Add field: `{Webinar Test Mode}` (checkbox)
- Add field: `{Webinar Test Phone}` (phone)

**Workflow Logic**:
- If Test Mode = TRUE → Send all to test phone
- Slack prefix: `[WEBINAR TEST MODE]`

#### Test Scenarios

Execute all 10 test cases from `test-cases-webinar-timing.json`:

1. **WN-001**: 7-day advance (full sequence)
2. **WN-002**: 3-day advance
3. **WN-003**: 2-day advance
4. **WN-004**: 30-hour window (skip 24hr)
5. **WN-005**: 6-hour window
6. **WN-006**: 90-minute window
7. **WN-007**: 45-minute window (emergency)
8. **WN-008**: Already started (late registration)
9. **WN-009**: 36-hour optimal
10. **WN-010**: Weekend-to-Monday

**Validation Checklist per Test**:
- [ ] Schedule calculated correctly
- [ ] Messages sent at right times (±5 min)
- [ ] Personalization working
- [ ] Airtable fields updated
- [ ] SMS_Audit logged
- [ ] No duplicate sends
- [ ] Sequence completes properly

---

### **PHASE 6: Production Rollout** (Week 6)

#### Pre-Launch Checklist

- [ ] All 10 test cases passed
- [ ] Slack notifications working
- [ ] Duplicate prevention verified
- [ ] Business hours enforcement tested
- [ ] Stop/Booked compliance working
- [ ] UI integration complete
- [ ] Templates reviewed by client
- [ ] Backup procedure documented
- [ ] Rollback plan ready

#### Launch Process

**Day 1**: Soft launch (single webinar)
- Activate for ONE upcoming webinar
- Monitor every execution
- Check timing accuracy
- Verify no interference with standard leads

**Day 2-3**: Monitor & adjust
- Review message delivery
- Check timing accuracy
- Adjust if needed
- Document any issues

**Day 4**: Full rollout
- Activate for all webinar campaigns
- Continue monitoring
- Document learnings

---

## 🔀 WORKFLOW ROUTING LOGIC

### Lead Ingestion Decision Tree

```
Lead Ingested
    ↓
Check: {Lead Source}
    ↓
┌───────────────────────────────────┐
│ Is {Lead Source} =                │
│ "Punjabi-Webinar"?                │
└─────────┬─────────────────────────┘
          │
    ┌─────┴─────┐
    │ YES       │ NO
    ▼           ▼
┌─────────┐  ┌──────────────┐
│ Webinar │  │ Standard     │
│ Workflow│  │ Workflow     │
│         │  │ (Existing)   │
└─────────┘  └──────────────┘
    │             │
    ▼             ▼
Calculate     Delay-based
Schedule      Sequencing
Time-based    (Current logic)
Messages
```

### Workflow Query Filters

**Standard SMS Scheduler** (`UYSP-SMS-Scheduler-v2`):
```
AND(
  {Processing Status} = "Ready for SMS",
  {SMS Eligible} = TRUE,
  NOT({Lead Source} = "Punjabi-Webinar"),  // ← NEW: Exclude webinars
  ... existing filters
)
```

**Webinar Scheduler** (`UYSP-Webinar-Nurture-Scheduler`):
```
AND(
  {Lead Source} = "Punjabi-Webinar",  // ← Only webinar leads
  {Processing Status} = "Active",
  {Phone Valid} = TRUE,
  NOT({SMS Stop}),
  NOT({Booked}),
  {Webinar Datetime} > NOW(),
  LEN({Webinar Message Schedule}) > 0
)
```

**Result**: Complete separation, no overlap, both can run simultaneously

---

## 📊 SUCCESS METRICS

### Week 1 Post-Launch
- ✅ No system errors
- ✅ All messages sent within ±5 min of scheduled time
- ✅ No duplicate sends
- ✅ Standard leads unaffected

### Week 4 Post-Launch
- 📈 Message timing accuracy: >95%
- 📈 Sequence completion rate: >90%
- 📈 Failed sends: <2%
- 📈 Webinar attendance (tracked separately)

### 90 Days Post-Launch
- 📊 Compare webinar attendance: Nurtured vs non-nurtured
- 📊 Engagement metrics (clicks, replies)
- 📊 ROI analysis (attendance lift vs SMS costs)

---

## 🛡️ SAFETY & COMPLIANCE

### Existing Safety Features (Reused)
- ✅ SMS Stop compliance (checked before every send)
- ✅ Booked meeting detection (stops all messaging)
- ✅ Duplicate prevention (1-hour window)
- ✅ Phone validation (US/Canada only)
- ✅ SMS_Audit logging (all sends tracked)

### New Webinar-Specific Safety
- ✅ Webinar already passed check
- ✅ Schedule corruption detection
- ✅ Timing window validation
- ✅ Business hours enforcement (8 AM - 8 PM ET)

---

## 📝 DOCUMENTATION DELIVERABLES

### For Developers
- [ ] `calculateWebinarSchedule()` function documentation
- [ ] n8n workflow node documentation
- [ ] API integration specs
- [ ] Test suite documentation

### For Operations
- [ ] Campaign setup guide
- [ ] Testing procedures
- [ ] Monitoring guide
- [ ] Troubleshooting runbook

### For Client
- [ ] UI user guide (campaign configuration)
- [ ] Template customization guide
- [ ] Reporting dashboard guide

---

## 🔧 MAINTENANCE & MONITORING

### Daily Checks
- Execution logs (any failures?)
- Timing accuracy (messages sent on time?)
- Slack alerts (any errors?)

### Weekly Review
- Sequence completion rates
- Failed send analysis
- Timing drift detection

### Monthly Optimization
- Template performance (A/B test results - future)
- Timing adjustments based on data
- Client feedback incorporation

---

## 📚 REFERENCE DOCUMENTS

Created during planning:
1. `WEBINAR-NURTURE-LOGIC-PLAN.md` - Full technical spec
2. `WEBINAR-TIMING-QUICK-REFERENCE.md` - Visual timing guide
3. `WEBINAR-DECISION-FLOWCHART.md` - Logic flowcharts
4. `STANDARD-VS-WEBINAR-COMPARISON.md` - System comparison
5. `test-cases-webinar-timing.json` - Complete test suite
6. `WEBINAR-IMPLEMENTATION-SUMMARY.md` - Executive summary

---

## ✅ FINAL APPROVAL CHECKLIST

- [x] Business hours decided: 8 AM - 8 PM ET
- [x] Webinar datetime source: Airtable + UI
- [x] A/B testing decision: NO (single variant)
- [x] Value assets: UI-configured per campaign
- [x] Workflow approach: New separate workflow
- [x] Trigger logic: Lead Source = "Punjabi-Webinar"
- [x] Schema additions defined
- [x] Test cases created
- [x] Success metrics defined
- [x] Safety considerations documented

---

**STATUS**: ✅ PLAN APPROVED - READY TO IMPLEMENT  
**START DATE**: TBD (upon client approval)  
**ESTIMATED COMPLETION**: 6 weeks from start  
**NEXT ACTION**: Phase 1 - Schema Setup

---

*This plan incorporates all client decisions and is ready for immediate implementation.*

