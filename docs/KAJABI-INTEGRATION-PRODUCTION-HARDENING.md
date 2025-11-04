# KAJABI INTEGRATION - PRODUCTION HARDENING SPECIFICATION

**Created**: 2025-11-01  
**Status**: CRITICAL - REQUIRES REBUILD  
**Priority**: P0 - Must fix before production

---

## 🚨 CRITICAL ISSUES IDENTIFIED

### **1. MESSAGE TEMPLATES - HYBRID APPROACH ❌**
**Current**: Hardcoded templates in JavaScript with Airtable "mirror"
**Issue**: Defeats entire purpose of Airtable management, creates maintenance nightmare
**Impact**: CRITICAL - Can't edit messages without N8N access
**Fix**: 100% Airtable lookup, zero hardcoding

### **2. ERROR HANDLING - NONE ❌**
**Current**: No try-catch, no error branches, silent failures
**Issue**: Workflow fails, no alert, no retry, lead never gets SMS
**Impact**: CRITICAL - Lost leads, no visibility
**Fix**: Comprehensive error handling with email alerts + retry logic

### **3. AUDIT TRAILS - INCOMPLETE ❌**
**Current**: SMS_Audit only logs successes
**Issue**: No record of failures, validation errors, or rejected sends
**Impact**: HIGH - Can't troubleshoot, no compliance trail
**Fix**: Log ALL events - attempts, failures, validations, rejections

### **4. DUPLICATE PREVENTION - WEAK ❌**
**Current**: Basic SMS Status check only
**Issue**: Race conditions, no idempotency, could send twice
**Impact**: HIGH - Compliance violation, poor UX
**Fix**: Idempotency key + timestamp validation + atomic updates

### **5. PHONE VALIDATION - MINIMAL ❌**
**Current**: Basic regex replacement
**Issue**: No E.164 validation, no carrier check, allows invalid numbers
**Impact**: MEDIUM - Wasted SMS sends, delivery failures
**Fix**: Full libphonenumber validation before sending

### **6. RATE LIMITING - NONE ❌**
**Current**: Could send unlimited SMS in one execution
**Issue**: If 500 leads backlog, sends all at once (cost spike, compliance risk)
**Impact**: HIGH - Financial risk, potential account suspension
**Fix**: Max 50 SMS per execution, spread load

### **7. WEBHOOK SECURITY - NONE ❌**
**Current**: Reply Handler webhook has NO authentication
**Issue**: Anyone can POST fake replies to webhook
**Impact**: HIGH - Data integrity, potential abuse
**Fix**: HMAC signature validation or secret token

### **8. TIMEZONE HANDLING - FRAGILE ❌**
**Current**: String conversion for ET timezone
**Issue**: Breaks during DST transitions, no error handling
**Impact**: MEDIUM - SMS sent at wrong times
**Fix**: Moment-timezone library with proper DST handling

### **9. CAMPAIGN VALIDATION - MISSING ❌**
**Current**: If template not found, workflow breaks
**Issue**: No validation, no fallback, no alert
**Impact**: MEDIUM - Silent failures for misconfigured campaigns
**Fix**: Validation layer + default template + admin alert

### **10. MONITORING/ALERTING - NONE ❌**
**Current**: No health checks, no daily summaries
**Issue**: Workflow could stop running and you'd never know
**Impact**: MEDIUM - System failure without detection
**Fix**: Daily health report + execution monitoring

### **11. TEST MODE - NONE ❌**
**Current**: No separation between test and production
**Issue**: Testing requires activating in production
**Impact**: MEDIUM - Risk of accidental production sends
**Fix**: Settings.Test Mode flag + test phone override

### **12. RETRY LOGIC - NONE ❌**
**Current**: API fail = lead abandoned forever
**Issue**: Transient API failures result in lost leads
**Impact**: MEDIUM - Lead attrition from network issues
**Fix**: 3 retry attempts with exponential backoff

---

## ✅ PROPER ARCHITECTURE SPECIFICATION

### **WORKFLOW: UYSP-Kajabi-SMS-Scheduler-v3 (Hardened)**

#### **Node 1: Schedule Trigger**
- Runs every 15 minutes
- **No changes needed**

---

#### **Node 2: Get Settings & Validate**
**Type**: Airtable Get
**Purpose**: Fetch system configuration
**Validation**:
- Settings record exists
- Test Mode flag is readable
- Active Campaign is set

**Error Handling**:
- If no settings → Send alert email → Stop workflow

---

#### **Node 3: Check Time Window (ET)**
**Type**: Code
**Improvements**:
```javascript
const moment = require('moment-timezone');
const now = moment().tz('America/New_York');
const hour = now.hour();
const isWeekend = now.day() === 0 || now.day() === 6;

// Only run Mon-Fri, 8 AM - 8 PM ET
if (hour >= 8 && hour < 20 && !isWeekend) {
  return [{ json: { 
    in_window: true, 
    current_hour_et: hour,
    current_timestamp_et: now.format(),
    execution_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }}];
} else {
  return []; // Stop execution
}
```

**Error Handling**:
- Catch timezone conversion errors
- Log to audit if DST issue detected

---

#### **Node 4: Get Leads Due for SMS**
**Type**: Airtable Search
**Formula**:
```
AND(
  NOT(BLANK({Campaign Assignment})),
  {SMS Status} = 'Not Sent',
  NOT({SMS Stop}),
  NOT({Booked}),
  {Phone Valid},
  NOT(BLANK({Imported At})),
  {SMS Last Sent At} = BLANK()  # ADDED: Idempotency check
)
```

**Limit**: 100 (will apply rate limit later)

---

#### **Node 5: Rate Limiter**
**Type**: Code (NEW NODE)
**Purpose**: Limit to 50 SMS per execution
```javascript
const settings = $('Get Settings & Validate').first().json.fields;
const testMode = settings['Test Mode'] || false;
const maxPerExecution = testMode ? 5 : 50;

const leads = $input.all().map(i => i.json.fields || i.json);
const limited = leads.slice(0, maxPerExecution);

if (leads.length > maxPerExecution) {
  console.log(`Rate limited: ${leads.length} leads found, sending to ${maxPerExecution}`);
}

return limited.map(lead => ({ json: lead }));
```

---

#### **Node 6: Filter Timing Window**
**Type**: Code
**Improvements**:
```javascript
const leads = $input.all().map(i => i.json);
const now = Date.now();
const MIN_DELAY_MS = 60 * 60 * 1000; // 60 minutes
const MAX_DELAY_MS = 180 * 60 * 1000; // 3 hours

const results = {
  eligible: [],
  too_soon: [],
  too_late: []
};

leads.forEach(lead => {
  if (!lead['Imported At']) {
    results.too_late.push({lead_id: lead.id, reason: 'no_import_timestamp'});
    return;
  }
  
  const importedAt = new Date(lead['Imported At']).getTime();
  if (isNaN(importedAt)) {
    results.too_late.push({lead_id: lead.id, reason: 'invalid_timestamp'});
    return;
  }
  
  const timeSince = now - importedAt;
  
  if (timeSince < MIN_DELAY_MS) {
    results.too_soon.push({
      lead_id: lead.id,
      time_since_minutes: Math.round(timeSince / 60000),
      eligible_in_minutes: Math.round((MIN_DELAY_MS - timeSince) / 60000)
    });
  } else if (timeSince > MAX_DELAY_MS) {
    results.too_late.push({
      lead_id: lead.id, 
      time_since_hours: Math.round(timeSince / 3600000),
      reason: 'outside_window'
    });
  } else {
    results.eligible.push(lead);
  }
});

// Log rejected leads for monitoring
console.log(`Timing filter: ${results.eligible.length} eligible, ${results.too_soon.length} too soon, ${results.too_late.length} too late`);

return results.eligible.map(lead => ({ json: lead }));
```

---

#### **Node 7: Fetch SMS Template from Airtable**
**Type**: Airtable Search (REPLACEMENT FOR HARDCODED)
**Formula**:
```
AND(
  {Campaign} = '{{ $json["Campaign Assignment"] }}',
  {Step} = 1,
  {Active} = TRUE()
)
```

**Error Handling Branch**: If no template found → Route to "Missing Template Handler"

---

#### **Node 8: Template Found?**
**Type**: IF Node (NEW)
**Condition**: `{{ $json.id }}` is not empty

**True Branch**: Continue to Build Message
**False Branch**: Route to Missing Template Handler

---

#### **Node 9: Missing Template Handler**
**Type**: Code (NEW ERROR BRANCH)
```javascript
const lead = $('Filter Timing Window').first().json;
const campaign = lead['Campaign Assignment'];

// Log to audit
const auditRecord = {
  Event: 'Template Missing',
  Status: 'Error',
  Lead Record ID: lead.id,
  Campaign ID: campaign,
  Error Details: `No active template found for campaign: ${campaign}`,
  Timestamp: new Date().toISOString()
};

// Send alert email to admin
const alertEmail = {
  to: 'davidson@iankoniak.com',
  subject: '⚠️ SMS Scheduler: Missing Template',
  body: `Campaign "${campaign}" has no active template in SMS_Templates table.\n\nLead ID: ${lead.id}\nEmail: ${lead.Email || 'N/A'}\n\nPlease add template to SMS_Templates table with:\n- Campaign: ${campaign}\n- Step: 1\n- Active: TRUE`
};

return [{
  json: {
    audit_record: auditRecord,
    alert_email: alertEmail,
    use_fallback: true,
    campaign: campaign,
    lead: lead
  }
}];
```

---

#### **Node 10: Build Final SMS Message**
**Type**: Code
**Improvements**:
```javascript
const lead = $('Filter Timing Window').first().json;
const template = $input.first().json.fields || $input.first().json;
const settings = $('Get Settings & Validate').first().json.fields;

const firstName = lead['First Name'] || 'there';

// Get template body
let messageBody = template.Body || 'Hi {{first_name}}, this is Ian Koniak\'s assistant. Thanks for your interest in Untap Your Sales Potential.';

// Replace {{first_name}} placeholder
const message = messageBody.replace(/{{first_name}}/g, firstName);

// Validate message length (SMS max 1600 chars)
if (message.length > 1600) {
  throw new Error(`Message too long: ${message.length} characters (max 1600)`);
}

// Phone formatting with validation
let phone = (lead.Phone || '').replace(/[^0-9]/g, '');
if (phone.startsWith('1')) phone = phone.substring(1);
if (phone.length !== 10) {
  throw new Error(`Invalid phone number format: ${lead.Phone}`);
}

// Test mode override
const testMode = settings['Test Mode'] || false;
const finalPhone = testMode ? (settings['Test Phone'] || phone) : phone;

return [{
  json: {
    ...lead,
    message_text: message,
    phone_digits: finalPhone,
    campaign: lead['Campaign Assignment'],
    template_id: template.id || 'fallback',
    test_mode: testMode,
    execution_id: $('Check Time Window (ET)').first().json.execution_id
  }
}];
```

---

#### **Node 11: Send SMS (with Error Handling)**
**Type**: HTTP Request
**Settings**:
- **Continue On Fail**: TRUE
- **Retry On Fail**: 3 attempts
- **Retry Interval**: 5000ms (5 seconds)

**Response**:
```json
{
  "neverError": true
}
```

---

#### **Node 12: Check SMS Send Result**
**Type**: IF Node (NEW)
**Condition**: `{{ $json.statusCode }}` equals `200`

**Success Branch**: Continue to Update Lead
**Failure Branch**: Route to SMS Failure Handler

---

#### **Node 13: SMS Failure Handler**
**Type**: Code (NEW ERROR BRANCH)
```javascript
const lead = $('Build Final SMS Message').first().json;
const response = $input.first().json;

const auditRecord = {
  Event: 'Send Failed',
  Status: 'Error',
  Lead Record ID: lead.id,
  Phone: lead.phone_digits,
  Campaign ID: lead.campaign,
  Error Details: JSON.stringify(response),
  Timestamp: new Date().toISOString(),
  Retry Attempt: lead.sms_retry_count || 0
};

// Update lead for retry (unless max retries reached)
const maxRetries = 3;
const currentRetries = lead['SMS Retry Count'] || 0;

if (currentRetries < maxRetries) {
  return [{
    json: {
      audit_record: auditRecord,
      update_lead: {
        id: lead.id,
        SMS_Retry_Count: currentRetries + 1,
        Processing_Status: 'Retry Scheduled'
      },
      send_alert: false
    }
  }];
} else {
  // Max retries reached - manual intervention needed
  return [{
    json: {
      audit_record: auditRecord,
      update_lead: {
        id: lead.id,
        SMS_Status: 'Failed - Manual Review',
        Processing_Status: 'Error - Review Required'
      },
      send_alert: true,
      alert_email: {
        to: 'davidson@iankoniak.com',
        subject: '🚨 SMS Send Failed After 3 Retries',
        body: `Lead: ${lead.Email}\nPhone: ${lead.Phone}\nCampaign: ${lead.campaign}\nError: ${JSON.stringify(response, null, 2)}`
      }
    }
  }];
}
```

---

#### **Node 14: Update Lead (Success)**
**Type**: Airtable Update
**Columns**:
```
SMS Status: "Sent"
SMS Last Sent At: {{ $now }}
SMS Sent Count: {{ ($('Build Final SMS Message').item.json['SMS Sent Count'] || 0) + 1 }}
Processing Status: "In Sequence"
SMS Retry Count: 0
```

**Error Handling**: Continue on fail, log to audit

---

#### **Node 15: Log to SMS_Audit (Success)**
**Type**: Airtable Create
**All Fields**:
```
Event: "Sent"
Status: "Success"
Phone: {{ phone_digits }}
Lead Record ID: {{ lead.id }}
Text: {{ message_text }}
Sent At: {{ $now }}
Campaign ID: {{ campaign }}
Execution ID: {{ execution_id }}
Template ID: {{ template_id }}
Test Mode: {{ test_mode }}
```

---

#### **Node 16: Log to SMS_Audit (Failure)**
**Type**: Airtable Create (ERROR BRANCH)
**All Fields**:
```
Event: "Send Failed"
Status: "Error"
Phone: {{ phone_digits }}
Lead Record ID: {{ lead.id }}
Error Details: {{ error message }}
Timestamp: {{ $now }}
Campaign ID: {{ campaign }}
Execution ID: {{ execution_id }}
Retry Attempt: {{ retry count }}
```

---

#### **Node 17: Daily Summary Email** (Optional, runs once per day)
**Type**: Code + Gmail
**Purpose**: Send daily report of system health
**Content**:
- Total leads processed today
- Total SMS sent
- Total failures
- Template issues
- Rate limit hits
- Error summary

---

## 🔐 SECURITY ENHANCEMENTS

### **Reply Handler Webhook Authentication**
Add query parameter validation:
```javascript
const query = $input.first().json.query;
const expectedToken = 'YOUR_SECRET_TOKEN_HERE'; // Store in environment

if (query.token !== expectedToken) {
  throw new Error('Unauthorized webhook access');
}
```

---

## 📊 MONITORING & ALERTING

### **Health Check Workflow** (NEW)
Runs daily at 9 AM ET:
1. Check last execution time of each workflow
2. Check SMS_Audit for error spike
3. Check Settings table for Test Mode (alert if stuck in test mode)
4. Send health report email

---

## 🧪 TEST MODE IMPLEMENTATION

### **Settings Table Fields**
Add these fields:
- `Test Mode` (checkbox)
- `Test Phone` (single line text)
- `Test Email` (single line text)

### **Test Mode Behavior**:
- **Rate Limit**: 5 per execution (instead of 50)
- **Phone Override**: All SMS go to Test Phone
- **Email Alert**: Daily reminder if Test Mode still active
- **Audit Tag**: All audit records tagged "TEST"

---

## 📈 METRICS TO TRACK

Add these to a new Airtable table `System_Metrics`:
- Daily SMS sent count
- Daily failure rate
- Average time from import to SMS
- Template usage by campaign
- Error categories breakdown
- Rate limit hits per day

---

## ⚡ IMMEDIATE ACTION ITEMS

1. **STOP** - Do not activate current workflows
2. **REBUILD** - SMS Scheduler with this spec
3. **TEST** - Comprehensive testing with test mode
4. **VALIDATE** - All error branches tested
5. **DEPLOY** - Phased rollout with monitoring

---

## 🎯 SUCCESS CRITERIA

Before considering production-ready:
- ✅ Zero hardcoded templates
- ✅ All error branches tested
- ✅ Audit logs complete (success + failure)
- ✅ Duplicate prevention verified
- ✅ Rate limiting verified
- ✅ Test mode working
- ✅ Webhook authenticated
- ✅ Daily summary email working

---

**BOTTOM LINE**: Current implementation has 12 critical/high issues. Requires comprehensive rebuild before production use.




