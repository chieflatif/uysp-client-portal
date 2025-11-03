# Complete Error Handling Specification - AI Messaging Workflows

**Date**: October 26, 2025  
**Purpose**: Comprehensive error handling leveraging n8n capabilities + Airtable logging  
**Approach**: Layered defense (n8n native + custom logic + fallbacks)  
**Status**: Ready for Day 2 implementation

---

## 🎯 LAYERED ERROR HANDLING STRATEGY

### Layer 1: n8n Native Error Handling (Built-In)
### Layer 2: Custom Try-Catch Logic (Code Nodes)
### Layer 3: Fallback Responses (Never Fail Silently)
### Layer 4: Audit Trail (Complete Traceability)
### Layer 5: Circuit Breakers (System Protection)

---

## 🔧 N8N NATIVE CAPABILITIES (Use These First!)

### Node-Level Settings (Every Critical Node)

**For HTTP Request Nodes** (OpenAI calls, Twilio API):
```json
{
  "continueOnFail": true,
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000,  // 2 seconds
  "timeout": 15000  // 15 seconds
}
```

**Where to Set**:
- Open node in n8n UI
- Click "Settings" tab (not Parameters!)
- Enable "Continue On Fail"
- Enable "Retry On Fail"
- Set Max Tries: 3
- Set Wait Between Tries: 2000ms

**Result**: n8n auto-retries 3 times with 2s delays. If all fail, continues workflow instead of stopping.

---

### Error Output Path (Catch Errors in Workflow)

**Pattern**: Every critical node → Error Output → Error Handler node

```javascript
// After HTTP Request fails (3 retries exhausted):
// Data flows to "Error Output" path

// Error Handler Node (Code):
const error = $input.item.json.error || {};

return {
  json: {
    error_type: "ai_timeout",
    error_message: error.message,
    node_failed: "OpenAI API Call",
    lead_id: $input.item.json.lead_id,
    use_fallback: true
  }
};
```

**Key**: n8n handles retries automatically, we handle the "all retries failed" case.

---

## 🛡️ CRITICAL NODE CONFIGURATIONS

### Node Type 1: OpenAI API Call (AI Response Generation)

**Settings**:
```json
{
  "name": "Call OpenAI",
  "type": "n8n-nodes-base.httpRequest",
  "continueOnFail": true,  // ← CRITICAL
  "retryOnFail": true,     // ← CRITICAL
  "maxTries": 2,           // Only 1 retry (AI calls are expensive)
  "waitBetweenTries": 3000,
  "timeout": 15000,
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "authentication": "predefinedCredentialType",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": []
    },
    "options": {
      "timeout": 15000
    }
  }
}
```

**Error Output → Fallback Handler**:
```javascript
// Node: AI Error Handler
const lead = $input.item.json;
const error = $input.item.json.error || {};

// Get fallback response from AI_Config
const fallback_responses = JSON.parse(ai_config.fallback_responses || '{}');
const fallback_message = fallback_responses.ai_timeout || 
  "Thanks for your message! Let me get you the right information. Someone from our team will follow up within 24 hours.";

// Log error
await $airtable.update('Leads', lead.id, {
  '🤖 last_error_type': 'ai_timeout',
  '🤖 last_error_at': new Date().toISOString(),
  '🤖 ai_status': 'human_takeover',
  '🤖 pause_reason': `AI call failed: ${error.message}`
});

// Log to Message_Decision_Log
await $airtable.create('Message_Decision_Log', {
  timestamp: new Date().toISOString(),
  client_id: 'uysp_001',
  lead_id: lead.id,
  trigger_type: 'inbound_reply',
  decision: 'FALLBACK_SENT',
  decision_reason: `AI failed after 2 retries: ${error.message}`,
  message_content: fallback_message,
  safety_checks_results: JSON.stringify({ ai_error: true })
});

return {
  json: {
    message_to_send: fallback_message,
    fallback_used: true,
    escalate_to_human: true
  }
};
```

---

### Node Type 2: Airtable Updates (State Management)

**Settings**:
```json
{
  "name": "Update Lead State",
  "type": "n8n-nodes-base.airtable",
  "continueOnFail": true,  // ← CRITICAL
  "retryOnFail": true,     // ← CRITICAL
  "maxTries": 3,
  "waitBetweenTries": 5000,  // 5 seconds (Airtable rate limits)
  "parameters": {
    "operation": "update",
    "application": "app4wIsBfpJTg7pWS",
    "table": "tblYUvhGADerbD8EO",
    "id": "={{ $json.lead_id }}",
    "fields": {
      "🤖 conversation_thread": "={{ $json.new_thread }}",
      "🤖 last_message_direction": "outbound",
      "🤖 last_message_sent_at": "={{ $now }}"
    }
  }
}
```

**Error Output → Critical Alert**:
```javascript
// Node: Airtable Error Handler
const error = $input.item.json.error || {};

// Airtable failure is CRITICAL (can't update state = system broken)
await $slack.send({
  channel: "#alerts",
  text: `🚨 CRITICAL: Airtable update failed\nLead: ${lead_id}\nError: ${error.message}\nAction: Manual intervention required`
});

// Log to Error_Log table (if Airtable is working at all)
try {
  await $airtable.create('Error_Log', {
    workflow_name: 'inbound-message-handler',
    error_type: 'airtable_error',
    error_message: error.message,
    lead_email: $json.email,
    timestamp: new Date().toISOString()
  });
} catch (logging_error) {
  // Even logging failed - system is down
  console.error("CRITICAL: Airtable completely unavailable");
}

return {
  json: {
    critical_failure: true,
    stop_processing: true
  }
};
```

---

### Node Type 3: SMS Send (Twilio API)

**Settings**:
```json
{
  "name": "Send SMS via Twilio",
  "type": "n8n-nodes-base.httpRequest",
  "continueOnFail": true,  // ← CRITICAL
  "retryOnFail": false,    // Twilio does its own retries
  "timeout": 10000,
  "parameters": {
    "method": "POST",
    "url": "https://api.twilio.com/2010-04-01/Accounts/{{$vars.TWILIO_ACCOUNT_SID}}/Messages.json",
    "authentication": "predefinedCredentialType",
    "sendBody": true,
    "contentType": "form-urlencoded"
  }
}
```

**Error Output → SMS Failure Handler**:
```javascript
// Node: SMS Error Handler
const error = $input.item.json.error || {};
const lead = $input.item.json;

// Classify SMS error
const error_code = error.code || error.status;
let error_type = "sms_failed";
let should_retry = false;

if (error_code === 21211) {
  error_type = "invalid_phone";
  should_retry = false;  // Don't retry invalid phones
} else if (error_code === 21610) {
  error_type = "opt_out";
  should_retry = false;  // Prospect opted out
} else if (error.message?.includes('rate limit')) {
  error_type = "rate_limit";
  should_retry = true;  // Retry rate limits
} else {
  error_type = "sms_failed";
  should_retry = true;  // Retry generic failures
}

// Log error
await $airtable.update('Leads', lead.id, {
  '🤖 last_error_type': error_type,
  '🤖 last_error_at': new Date().toISOString(),
  '🤖 ai_status': error_type === 'invalid_phone' ? 'paused' : 'active'
});

// DON'T update conversation_thread if SMS didn't send!
// This is critical - only update state if message actually delivered

return {
  json: {
    sms_failed: true,
    error_type: error_type,
    should_retry: should_retry,
    fallback_to_email: lead.email ? true : false
  }
};
```

---

## 🔄 CRITICAL WORKFLOW PATTERNS

### Pattern 1: Send-First-Update-After (STATE CONSISTENCY)

**WRONG** (State Inconsistency Risk):
```
1. Generate AI message
2. Update conversation_thread ❌ (what if SMS fails?)
3. Send SMS
```

**CORRECT**:
```
1. Generate AI message
2. Send SMS (with continueOnFail: true)
3. IF SMS sent successfully:
   → Update conversation_thread
   → Update last_message_sent_at
   → Update last_message_direction
4. ELSE (SMS failed):
   → Log error
   → Don't update conversation state
   → Use fallback or retry
```

**Implementation**:
```javascript
// Node: Check SMS Send Result
const sms_result = $input.item.json;

if (sms_result.error) {
  // SMS FAILED - don't update state
  return {
    json: {
      update_state: false,
      sms_failed: true,
      error: sms_result.error
    }
  };
} else {
  // SMS SENT - update state
  return {
    json: {
      update_state: true,
      sms_sid: sms_result.sid,
      update_fields: {
        '🤖 conversation_thread': appendToThread(lead.conversation_thread, new_message),
        '🤖 last_message_sent_at': new Date().toISOString(),
        '🤖 last_message_direction': 'outbound',
        '🤖 total_ai_messages_sent': (lead.total_ai_messages_sent || 0) + 1
      }
    }
  };
}
```

---

### Pattern 2: Backup-Before-Modify (CORRUPTION RECOVERY)

**Add 1 more field to Leads**:
- `🤖 conversation_thread_backup` (Long Text)

**Implementation**:
```javascript
// Node: Update Conversation Thread (Safe)

// STEP 1: Backup current thread
if (lead.conversation_thread) {
  await $airtable.update('Leads', lead.id, {
    '🤖 conversation_thread_backup': lead.conversation_thread
  });
}

// STEP 2: Update with new thread
try {
  const new_thread = appendMessage(lead.conversation_thread, new_message);
  
  // Validate JSON before saving
  JSON.parse(new_thread);  // Throws if invalid
  
  await $airtable.update('Leads', lead.id, {
    '🤖 conversation_thread': new_thread
  });
  
} catch (error) {
  // JSON corruption or update failed
  console.error("Conversation thread update failed, backup preserved");
  
  // Log corruption
  await $airtable.update('Leads', lead.id, {
    '🤖 last_error_type': 'json_corrupt',
    '🤖 last_error_at': new Date().toISOString()
  });
  
  // Can restore from backup if needed
}
```

---

### Pattern 3: Circuit Breaker with $vars (SYSTEM PROTECTION)

**Use n8n Variables** (persist across workflow executions):

```javascript
// Node: Check Circuit Breaker State

const now = Date.now();

// Get error counters from Variables (n8n cloud)
const ai_error_count = Number($vars.AI_ERROR_COUNT || 0);
const ai_last_reset = Number($vars.AI_LAST_RESET || now);

// Reset hourly
if (now - ai_last_reset > 3600000) {  // 1 hour
  // Reset counter (update via Variables in n8n UI or separate workflow)
  console.log('Circuit breaker counter should reset');
}

// Check circuit state
const circuit_open = ai_error_count >= 10;  // 10 errors in 1 hour

if (circuit_open) {
  // CIRCUIT BREAKER TRIGGERED
  await $airtable.update('Client_Safety_Config', config_id, {
    global_messaging_paused: true,
    pause_reason: `Circuit breaker: ${ai_error_count} AI errors in last hour`,
    paused_at: new Date().toISOString(),
    last_circuit_breaker_triggered: new Date().toISOString(),
    circuit_breaker_count_30d: (config.circuit_breaker_count_30d || 0) + 1
  });
  
  // ALERT IMMEDIATELY
  await $slack.send({
    channel: "#critical-alerts",
    text: `🚨 CIRCUIT BREAKER TRIGGERED\n${ai_error_count} AI failures in 1 hour\nALL AI messaging paused\nAction: Investigate immediately`
  });
  
  return {
    json: {
      circuit_breaker: true,
      stop_all_messaging: true
    }
  };
}

return {
  json: {
    circuit_breaker: false,
    proceed: true
  }
};
```

**Note**: Update `AI_ERROR_COUNT` variable via separate workflow or when errors occur.

---

### Pattern 4: Conversation Thread Validation (CORRUPTION PREVENTION)

```javascript
// Node: Safe Parse Conversation Thread

function safeParseThread(thread_string) {
  try {
    // Attempt parse
    const thread = JSON.parse(thread_string || '[]');
    
    // Validate structure
    if (!Array.isArray(thread)) {
      throw new Error("Thread is not an array");
    }
    
    // Validate messages have required fields
    for (const msg of thread) {
      if (!msg.message_id || !msg.direction || !msg.content || !msg.timestamp) {
        throw new Error(`Invalid message structure: ${JSON.stringify(msg)}`);
      }
    }
    
    return thread;
    
  } catch (error) {
    // CORRUPTION DETECTED
    console.error("Conversation thread corrupted:", error.message);
    
    // Try to rebuild from SMS_Audit
    const sms_history = await $airtable.list('SMS_Audit', {
      filterByFormula: `{Lead Record ID} = '${lead_id}'`,
      sort: [{field: 'Sent At', direction: 'asc'}]
    });
    
    if (sms_history.length > 0) {
      // Rebuild thread from SMS history
      const rebuilt_thread = sms_history.map(sms => ({
        message_id: sms.simpletexting_id || generateId(),
        direction: sms.Event === 'delivered' ? 'outbound' : 'inbound',
        content: sms.Text,
        timestamp: sms['Sent At'] || sms['Delivery At'],
        sender: sms.Event === 'delivered' ? 'ai' : 'prospect',
        recovered: true  // Mark as recovered
      }));
      
      // Save recovered version
      await $airtable.update('Leads', lead_id, {
        '🤖 conversation_thread': JSON.stringify(rebuilt_thread),
        '🤖 last_error_type': 'json_corrupt_recovered',
        '🤖 last_error_at': new Date().toISOString()
      });
      
      return rebuilt_thread;
    } else {
      // Can't rebuild - start fresh
      console.error("Cannot rebuild thread, starting fresh");
      return [];
    }
  }
}

const thread = safeParseThread(lead['🤖 conversation_thread']);
return { json: { thread: thread } };
```

**Key**: SMS_Audit is source of truth. Can always rebuild conversation_thread from it.

---

### Pattern 5: Webhook Receipt Logging (TRACEABILITY)

**FIRST NODE in every webhook workflow**:

```javascript
// Node: Log Webhook Receipt (Always Runs)

const webhook_data = $input.item.json;

// Log receipt BEFORE any processing
await $airtable.create('Message_Decision_Log', {
  timestamp: new Date().toISOString(),
  client_id: 'uysp_001',
  lead_id: 'pending_lookup',  // Will update after lookup
  trigger_type: 'inbound_reply',
  decision: 'RECEIVED',  // Just received, not decided yet
  message_content: webhook_data.Body,
  workflow_execution_id: $execution.id,
  safety_checks_results: JSON.stringify({
    webhook_id: $webhookId,
    from: webhook_data.From,
    twilio_sid: webhook_data.MessageSid
  })
});

// THEN continue processing
return {
  json: {
    ...webhook_data,
    webhook_logged: true
  }
};
```

**Result**: Every webhook receipt logged, even if processing fails later.

---

## 🚨 CRITICAL ERROR SCENARIOS & SOLUTIONS

### Scenario 1: OpenAI Timeout/Error

**Detection**: 
- HTTP Request fails after retries
- Error output triggered
- `error.message` contains "timeout" or status 500

**Handling**:
1. ✅ Send fallback response immediately (never leave prospect hanging)
2. ✅ Log to Message_Decision_Log (decision: "FALLBACK_SENT")
3. ✅ Update lead state (last_error_type, last_error_at)
4. ✅ Set ai_status to "human_takeover"
5. ✅ Alert team if error rate >5%

**Fallback Response**:
```
"Thanks for your message! I'm pulling together the best answer for you. Someone from our team will follow up within 24 hours."
```

---

### Scenario 2: SMS Send Failure

**Detection**:
- Twilio API returns error
- Error codes: 21211 (invalid), 21610 (opted out), etc.

**Handling**:
1. ✅ Classify error (invalid_phone, opt_out, rate_limit, other)
2. ✅ Log to Message_Decision_Log (decision: "BLOCK", reason: error_code)
3. ✅ Update lead state (last_error_type, last_error_at)
4. ✅ If invalid phone → Pause AI (don't keep trying)
5. ✅ If rate limit → Queue for retry
6. ✅ Don't update conversation_thread (message wasn't sent!)

**Critical**: Never update conversation state if message didn't actually send.

---

### Scenario 3: Airtable Update Failure

**Detection**:
- Airtable API fails after retries
- Rate limit, validation error, or service down

**Handling**:
1. ✅ Log error to console (Airtable might be down, can't log there)
2. ✅ Alert team IMMEDIATELY (critical system failure)
3. ✅ Queue operation for retry (use Retry_Queue table if it exists)
4. ✅ Continue workflow (don't block other leads)

**Pattern**:
```javascript
// Node: Airtable Update with Fallback

try {
  await $airtable.update('Leads', lead_id, updates);
} catch (error) {
  // Airtable failed - try retry queue
  await $airtable.create('Retry_Queue', {
    operation_type: 'airtable_update',
    lead_id: lead_id,
    payload: JSON.stringify(updates),
    retry_count: 0,
    next_retry_at: new Date(Date.now() + 300000).toISOString(),  // 5 min
    created_at: new Date().toISOString()
  });
  
  // Alert
  await alertTeam("Airtable update failed, queued for retry");
}
```

---

### Scenario 4: Conversation Thread Corruption

**Detection**:
- JSON.parse() throws error
- Invalid structure
- Missing required fields

**Handling**:
1. ✅ Attempt to rebuild from SMS_Audit (source of truth)
2. ✅ If rebuild succeeds → Use recovered version
3. ✅ If rebuild fails → Start fresh with note
4. ✅ Log corruption (last_error_type: "json_corrupt")
5. ✅ Save corrupted data to Error_Log for analysis

**Already covered in Pattern 4 above** ✅

---

### Scenario 5: Webhook Loss/Missing

**Detection**:
- No webhooks received in >1 hour
- Monitoring workflow checks

**Handling** (Optional - Phase 2):
```javascript
// Node: Webhook Health Check (runs hourly)

const last_webhook_time = await getLastWebhookTime();
const hours_since = (Date.now() - last_webhook_time) / (1000 * 60 * 60);

if (hours_since > 1) {
  // No webhooks in 1 hour - might be broken
  
  // Poll Twilio for missed messages
  const missed_messages = await $twilio.messages.list({
    dateSentAfter: last_webhook_time,
    direction: 'inbound'
  });
  
  if (missed_messages.length > 0) {
    // WEBHOOKS BROKEN - process missed messages
    await alertTeam({
      priority: "CRITICAL",
      message: `Webhook system down! ${missed_messages.length} messages missed. Processing now.`
    });
    
    for (const msg of missed_messages) {
      await processInboundMessage(msg);
    }
  }
}
```

**Recommendation**: Add this in Phase 2 (1 hour of work, ultimate safety net).

---

## 📋 REQUIRED ADDITIONS (Based on Analysis)

### Additional Fields Needed (3 more)

**Leads Table**:
1. `🤖 conversation_thread_backup` (Long Text) - Previous version for recovery
2. `🤖 retry_count` (Number) - Current retry attempts for this lead
3. `🤖 last_successful_ai_call_at` (DateTime) - Track AI health per lead

**Why**: 
- Backup enables corruption recovery
- Retry count prevents infinite loops
- Success tracking helps identify problem leads

---

### New Table: Retry_Queue (6 fields)

**Purpose**: Queue failed operations for intelligent retry

**Fields**:
1. operation_type (singleSelect: "sms_send", "airtable_update", "ai_call")
2. lead_id (link to Leads)
3. payload (multilineText - JSON of what to retry)
4. retry_count (number)
5. next_retry_at (dateTime)
6. created_at (dateTime)

**Workflow**: Separate retry processor runs every 5 minutes, processes queue

**Value**: HIGH (ensures no lost operations)  
**Complexity**: LOW (simple queue pattern)  
**Time**: 30 minutes

---

### Update Message_Decision_Log (2 new fields)

**Add**:
1. `fallback_used` (checkbox) - Was a fallback response sent?
2. `webhook_receipt_id` (singleLineText) - Twilio message SID for tracing

**Why**: Complete audit trail of fallback usage and webhook correlation

---

## 🎯 COMPREHENSIVE ERROR MATRIX

| Error Type | n8n Native | Custom Logic | Fallback | Retry | Alert | Log |
|------------|------------|--------------|----------|-------|-------|-----|
| **OpenAI Timeout** | continueOnFail + retry | ✅ | Default response | 2x | If >5% rate | Message_Decision_Log |
| **OpenAI Rate Limit** | continueOnFail + retry | ✅ | Wait + retry | 3x with backoff | If >10/day | Message_Decision_Log |
| **OpenAI Error (500)** | continueOnFail + retry | ✅ | Default response | 1x | Yes | Message_Decision_Log |
| **SMS Invalid Phone** | continueOnFail | ✅ | None | No | No | Pause AI for lead |
| **SMS Rate Limit** | continueOnFail | ✅ | Queue retry | Yes | No | Retry_Queue |
| **SMS Failed** | continueOnFail | ✅ | Email if available | 2x | If >10% rate | Message_Decision_Log |
| **Airtable Timeout** | continueOnFail + retry 3x | ✅ | Queue retry | 3x | Yes (critical) | Retry_Queue |
| **Airtable Rate Limit** | continueOnFail + retry | ✅ | Wait + retry | 3x | If persistent | Error_Log |
| **JSON Corrupt** | N/A | ✅ | Rebuild from SMS_Audit | N/A | Yes | Error_Log |
| **Webhook Lost** | N/A | ✅ (Phase 2) | Poll Twilio backup | N/A | Yes (critical) | Message_Decision_Log |
| **State Inconsistency** | N/A | ✅ | Validation + auto-fix | N/A | If can't fix | Error_Log |

---

## ✅ FINAL RECOMMENDATIONS

### Add Now (15 minutes):
1. ✅ `🤖 conversation_thread_backup` field (Leads)
2. ✅ `🤖 retry_count` field (Leads)
3. ✅ `🤖 last_successful_ai_call_at` field (Leads)

### Add Now (20 minutes):
4. ✅ `Retry_Queue` table (6 fields)
5. ✅ `fallback_used` field (Message_Decision_Log)
6. ✅ `webhook_receipt_id` field (Message_Decision_Log)

### Implement in Workflows (Day 2):
- Use n8n native retry + continueOnFail on all HTTP nodes
- Implement Send-First-Update-After pattern
- Implement Backup-Before-Modify pattern
- Add circuit breaker checks
- Add conversation thread validation
- Log webhook receipts

### Add Later (Phase 2 - 1 hour):
- Webhook polling backup (ultimate safety net)
- Automated retry queue processor

---

## 🔗 N8N CLOUD GOTCHAS (Critical to Remember)

### 1. Use $vars, Not $env
```javascript
// ❌ WRONG:
const apiKey = $env.OPENAI_API_KEY;  // undefined in n8n cloud

// ✅ CORRECT:
const apiKey = $vars.OPENAI_API_KEY;  // works
```

### 2. Expression Spaces Required
```javascript
// ❌ WRONG:
{{$json.field}}  // Silent failure

// ✅ CORRECT:
{{ $json.field }}  // Works
```

### 3. Always Output Data (Manual Only)
- Setting: Node → Settings tab → "Always Output Data"
- Required for: IF, Switch nodes to continue on empty
- Cannot be set via API/JSON
- MUST be set manually in UI

### 4. Credential Corruption
- Never update workflows via MCP (corrupts credentials)
- Always create/update workflows manually in UI
- Or use n8n API carefully

### 5. Table IDs, Not Names
```javascript
// ❌ WRONG:
table: "Leads"  // Intermittent failures

// ✅ CORRECT:
table: "tblYUvhGADerbD8EO"  // Always works
```

---

## 📊 IMPLEMENTATION PRIORITY

### Must Have (Foundational):
1. ✅ n8n native retry settings (continueOnFail, retryOnFail)
2. ✅ Send-First-Update-After pattern (state consistency)
3. ✅ Fallback responses (never silent fail)
4. ✅ Complete logging (Message_Decision_Log)
5. ✅ Error state tracking (last_error_type, last_error_at)

### Should Have (Robustness):
6. ✅ Conversation thread backup + validation
7. ✅ Retry queue for failed operations
8. ✅ Circuit breakers with $vars
9. ✅ Webhook receipt logging

### Nice to Have (Phase 2):
10. ⏸️ Webhook polling backup
11. ⏸️ Automated retry processor
12. ⏸️ State consistency validation

---

**Status**: ✅ Complete specification using n8n native capabilities + custom logic  
**Next**: Add 3 more fields + Retry_Queue table (35 minutes)  
**Then**: Implement patterns in Day 2 workflows (6 hours)

---

*Error handling specification complete. Leverages n8n built-in capabilities. Simple, foundational, comprehensive.*

