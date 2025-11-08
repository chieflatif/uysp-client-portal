# Mini-CRM: n8n Workflow Instrumentation Guide

**Agent:** Cursor Conversation Agent (with n8n MCP tools)  
**Timeline:** Week 2 - 16 hours  
**Can Start:** Immediately (parallel with UI development)  
**PRD Reference:** Section 4.5

---

## 🎯 Mission

Instrument 4 production n8n workflows to log all lead activities to PostgreSQL via the activity logging API.

**Goal:** Every SMS, booking, and reply is logged for complete lead history.

---

## 🔧 Workflows to Instrument

### 1. UYSP-Kajabi-SMS-Scheduler (kJMMZ10anu4NqYUL)

**Log:** MESSAGE_SENT, MESSAGE_FAILED  
**When:** After SimpleTexting API call  
**Pattern:** Success → MESSAGE_SENT, Error → MESSAGE_FAILED

### 2. UYSP-Calendly-Booked (LiVE3BlxsFkHhG83)

**Log:** BOOKING_CONFIRMED  
**When:** After Calendly webhook received  
**Pattern:** Parse booking data → Log confirmation

### 3. UYSP-SimpleTexting-Reply-Handler (CmaISo2tBtYRqNs0)

**Log:** INBOUND_REPLY  
**When:** After reply parsed  
**Pattern:** Parse message → Find lead → Log reply

### 4. UYSP-ST-Delivery V2 (workflow ID needed)

**Log:** MESSAGE_DELIVERED  
**When:** After delivery status received  
**Pattern:** Parse delivery webhook → Log status

---

## 📐 4-Node Logging Pattern (STANDARD)

Add these 4 nodes after each event you're logging:

### Node 1: Prepare Activity Log Entry (Code Node)

```javascript
// Prepare log data
const logEntry = {
  eventType: 'MESSAGE_SENT',  // Change per workflow
  eventCategory: 'SMS',       // Change per workflow
  leadAirtableId: $json.lead_airtable_id,
  description: `SMS sent: ${$json.message_text.substring(0, 50)}...`,
  messageContent: $json.message_text,
  metadata: {
    campaign_id: $json.campaign,
    phone: $json.phone,
    template_id: $json.template_id
  },
  source: 'n8n:kJMMZ10anu4NqYUL',  // Change per workflow
  executionId: $execution.id,
  timestamp: new Date().toISOString()
};

return [{ json: logEntry }];
```

### Node 2: Write to Activity Log (HTTP Request)

**Type:** n8n-nodes-base.httpRequest  
**Method:** POST  
**URL:** `https://uysp-portal-v2.onrender.com/api/internal/log-activity`  
**Auth:** HTTP Header Auth  
**Header:** `x-api-key` = `{{$credentials.internalApiKey}}`  
**Body:** `={{ $json }}`  
**Settings:**
- retryOnFail: true
- maxTries: 3
- waitBetweenTries: 2000
- continueOnFail: true

### Node 3: Fallback to Retry_Queue (Error Output from Node 2)

**Type:** n8n-nodes-base.airtable  
**Operation:** Create  
**Base:** app4wIsBfpJTg7pWS  
**Table:** Retry_Queue (tblsmRKDX7chymBwp)  
**Fields:**
```javascript
{
  queue_id: "={{ $execution.id }}-{{ $itemIndex }}",
  operation_type: "activity_log",
  lead_id: "={{ $json.leadAirtableId }}",
  payload: "={{ JSON.stringify($json) }}",
  retry_count: 0,
  next_retry_at: "={{ $now.plus({minutes: 5}).toISO() }}",
  created_at: "={{ $now.toISO() }}"
}
```

### Node 4: Alert DevOps (Slack - Error Output)

**Type:** n8n-nodes-base.slack  
**Channel:** C097CHUHNTG (your alerts channel)  
**Message:**
```
⚠️ Activity Log Failed

Workflow: {{ $workflow.name }}
Execution: {{ $execution.id }}
Lead: {{ $json.leadAirtableId }}
Event: {{ $json.eventType }}

Written to Retry_Queue for manual recovery.
```

---

## 🧪 Testing Checklist (Per Workflow)

After instrumenting each workflow:

- [ ] Manual test execution in n8n
- [ ] Verify activity appears in database: `SELECT * FROM lead_activity_log ORDER BY created_at DESC LIMIT 1;`
- [ ] Verify health check shows event: `curl /api/internal/activity-health`
- [ ] Test error path: Temporarily break API → Verify Retry_Queue entry created
- [ ] Verify Slack alert fires on persistent failure
- [ ] Production test: Enable workflow, monitor for 1 hour

---

## ✅ Success Criteria

**Week 2 is complete when:**
- All 4 workflows have 4-node logging pattern
- Real events appearing in `lead_activity_log`
- Retry_Queue stays empty (<5 records)
- No workflow failures from logging code
- Health check shows events_last_hour > 0

---

## 🚨 Critical Rules

- **BACKUP workflows before modifying** (export JSON)
- **Test individually** before deploying all at once
- **Use MCP tools** to verify node configurations
- **Don't guess** n8n syntax—check with tools first
- **Monitor Retry_Queue** for patterns (if filling up, fix root cause)

---

**Reference:** PRD Section 4.5 for detailed n8n logging pattern  
**Start:** After Claude Code confirms API endpoints deployed and working

