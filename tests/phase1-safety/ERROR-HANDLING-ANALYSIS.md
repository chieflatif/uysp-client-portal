# Error Handling Analysis - Workflow Critical Paths

**Date**: October 26, 2025  
**Purpose**: Identify all error scenarios and ensure proper handling/recovery  
**Approach**: Simple, foundational, high-value (not over-engineered)

---

## 🎯 CRITICAL ERROR SCENARIOS

### 1. OpenAI API Failure (HIGH PROBABILITY)

**Scenarios**:
- Timeout (>15 seconds)
- Rate limit (429 error)
- API error (500, service down)
- Invalid response (empty, malformed)
- Low confidence (<60%)

**Current Handling**: ❌ Not implemented yet

**MUST HAVE**:
```javascript
// TRY-CATCH with fallback
try {
  const ai_response = await openai.chat.completions.create({...});
  
  // Check confidence
  if (ai_confidence < 60) {
    throw new Error("Low confidence - escalate to human");
  }
  
} catch (error) {
  // LOG ERROR (detailed)
  await logError({
    type: "ai_error",
    lead_id: lead_id,
    error_message: error.message,
    conversation_context: last_3_messages,  // For replay
    timestamp: NOW()
  });
  
  // SEND FALLBACK (never leave prospect hanging)
  const fallback = ai_config.fallback_responses["ai_timeout"];
  await sendSMS(fallback);
  
  // UPDATE STATE
  await updateLead({
    last_error_type: "ai_timeout",
    last_error_at: NOW(),
    ai_status: "human_takeover",  // Flag for review
    pause_reason: "AI call failed - needs human attention"
  });
  
  // ALERT HUMAN (email/slack)
  await alertTeam({
    priority: "HIGH",
    message: "AI failed for lead, fallback sent, needs review",
    lead: lead_id
  });
  
  return "FALLBACK_SENT";
}
```

**Key**: Never let the conversation die. Always respond with SOMETHING.

---

### 2. SMS Send Failure (MEDIUM PROBABILITY)

**Scenarios**:
- Invalid phone number
- Carrier rejection
- Twilio error
- Rate limit

**Current Handling**: ⚠️ Twilio auto-retries, but then what?

**MUST HAVE**:
```javascript
const sms_result = await sendSMS(message);

if (sms_result.status === "failed") {
  // LOG FAILURE
  await logError({
    type: "sms_failed",
    lead_id: lead_id,
    error_code: sms_result.error_code,
    phone: lead.phone,
    message_attempted: message
  });
  
  // UPDATE STATE (don't update conversation_thread if not sent!)
  await updateLead({
    last_error_type: "sms_failed",
    last_error_at: NOW(),
    ai_status: "paused",  // Don't keep trying if phone is bad
    pause_reason: `SMS failed: ${sms_result.error_code}`
  });
  
  // TRY EMAIL FALLBACK (if we have email)
  if (lead.email) {
    await sendEmail({
      to: lead.email,
      subject: "Following up on your interest",
      body: message  // Same message via email
    });
  }
  
  // ALERT (lower priority - some failures expected)
  if (failure_rate_today > 10%) {
    await alertTeam("High SMS failure rate today");
  }
}
```

**Key**: Don't update conversation state if message didn't actually send.

---

### 3. Conversation Thread Corruption (LOW PROBABILITY, HIGH IMPACT)

**Scenarios**:
- JSON parse error
- Encoding issue
- Data truncation
- Race condition (concurrent updates)

**Current Handling**: ❌ Would crash workflow

**MUST HAVE**:
```javascript
// VALIDATE before parsing
function safeParseConversation(thread_string) {
  try {
    const thread = JSON.parse(thread_string || '[]');
    
    // Validate structure
    if (!Array.isArray(thread)) {
      throw new Error("Thread is not an array");
    }
    
    // Validate each message has required fields
    thread.forEach(msg => {
      if (!msg.message_id || !msg.direction || !msg.content) {
        throw new Error("Invalid message structure");
      }
    });
    
    return thread;
    
  } catch (error) {
    // CORRUPTION DETECTED
    console.error("Conversation thread corrupted", error);
    
    // SAVE CORRUPTED DATA (for forensics)
    await saveToErrorLog({
      type: "json_corrupt",
      lead_id: lead_id,
      corrupted_data: thread_string,
      error: error.message
    });
    
    // ATTEMPT RECOVERY from SMS_Audit table
    const recovered = await rebuildThreadFromSMSAudit(lead_id);
    
    if (recovered) {
      // Success - use recovered version
      return recovered;
    } else {
      // Can't recover - start fresh with note
      return [{
        message_id: generateId(),
        direction: "outbound",
        content: "[Conversation history recovered - continuing from here]",
        timestamp: NOW(),
        sender: "system",
        note: "Previous history corrupted, rebuilt from logs"
      }];
    }
  }
}
```

**Key**: Always have a valid conversation thread, even if we have to rebuild it.

---

### 4. Airtable Update Failure (MEDIUM PROBABILITY)

**Scenarios**:
- API timeout
- Rate limit
- Validation error
- Record locked

**Current Handling**: ⚠️ n8n auto-retries, but state might be inconsistent

**MUST HAVE**:
```javascript
// ATOMIC UPDATE PATTERN
async function updateLeadWithFallback(lead_id, updates) {
  try {
    // Attempt update
    const result = await airtable.update(lead_id, updates);
    return result;
    
  } catch (error) {
    // LOG FAILURE
    await logError({
      type: "airtable_error",
      lead_id: lead_id,
      attempted_updates: updates,
      error: error.message
    });
    
    // RETRY with exponential backoff
    for (let i = 0; i < 3; i++) {
      await sleep(Math.pow(2, i) * 1000);  // 1s, 2s, 4s
      
      try {
        return await airtable.update(lead_id, updates);
      } catch (retry_error) {
        console.log(`Retry ${i+1} failed`);
      }
    }
    
    // ALL RETRIES FAILED
    await updateLead({
      last_error_type: "airtable_error",
      last_error_at: NOW()
    });
    
    // CRITICAL: Send alert (can't update = system broken)
    await alertTeam({
      priority: "CRITICAL",
      message: "Airtable updates failing - system degraded",
      lead: lead_id
    });
    
    throw error;  // Re-throw - can't continue without state updates
  }
}
```

**Key**: Retry with backoff. If all fail, alert immediately (system issue, not lead issue).

---

### 5. Webhook Loss/Delay (LOW PROBABILITY, CRITICAL IMPACT)

**Scenarios**:
- Webhook doesn't arrive
- Webhook delayed >5 minutes
- n8n queue full
- Network issue

**Current Handling**: ❓ Unknown

**SHOULD HAVE (Optional Backup)**:
```javascript
// PERIODIC WEBHOOK HEALTH CHECK (every hour)
// Check: Are we receiving webhooks?

const last_webhook = await getLastWebhook();
if (NOW() - last_webhook.timestamp > 60 minutes) {
  // No webhooks in last hour - might be broken
  
  // POLL Twilio directly as backup
  const recent_messages = await twilio.messages.list({
    dateSentAfter: last_webhook.timestamp,
    direction: "inbound"
  });
  
  if (recent_messages.length > 0) {
    // WEBHOOKS ARE BROKEN - we're missing messages!
    await alertTeam({
      priority: "CRITICAL",
      message: `${recent_messages.length} inbound messages missed - webhook system down`,
      action: "Processing missed messages now"
    });
    
    // Process missed messages
    for (const msg of recent_messages) {
      await processInboundMessage(msg);
    }
  }
}
```

**Decision**: This is backup polling. Do we need it? Or trust Twilio webhooks?

**My take**: NOT for Day 1, but add as Phase 2 enhancement (1 hour of work, huge safety net).

---

### 6. State Inconsistency (MEDIUM PROBABILITY)

**Scenarios**:
- conversation_thread updated but last_message_direction not updated
- Message sent but Airtable update failed
- Partial update succeeded

**Current Handling**: ❌ No validation

**SHOULD HAVE**:
```javascript
// STATE VALIDATION function
function validateLeadState(lead) {
  const errors = [];
  
  // Check: If conversation_thread has messages, direction should match last message
  if (lead.conversation_thread) {
    const thread = JSON.parse(lead.conversation_thread);
    if (thread.length > 0) {
      const last_msg = thread[thread.length - 1];
      if (last_msg.direction !== lead.last_message_direction) {
        errors.push("Direction mismatch with thread");
      }
    }
  }
  
  // Check: If active_conversation is true, should have recent activity
  if (lead.active_conversation) {
    const hours_since_last = (NOW() - lead.last_reply_at) / (1000 * 60 * 60);
    if (hours_since_last > 4) {
      errors.push("Active conversation flag but no recent activity");
    }
  }
  
  // Check: If ai_status is paused, should have pause_reason
  if (lead.ai_status === "paused" && !lead.pause_reason) {
    errors.push("Paused status but no reason given");
  }
  
  return errors;
}

// RUN validation after every update
const validation_errors = validateLeadState(updated_lead);
if (validation_errors.length > 0) {
  await logWarning({
    type: "state_inconsistency",
    lead_id: lead_id,
    errors: validation_errors
  });
}
```

**Decision**: Add this validation to workflow. No new fields needed, just logic.

---

## 🚨 CRITICAL GAPS IDENTIFIED

### Gap 1: Message Not Sent But Thread Updated ⚠️ CRITICAL

**Problem**:
```javascript
// Current potential flow:
1. Generate AI response ✅
2. Append to conversation_thread ✅
3. Send SMS ❌ FAILS
4. State shows message sent (but it wasn't!)
```

**Solution - Reorder Operations**:
```javascript
// CORRECT FLOW:
1. Generate AI response ✅
2. Send SMS first ✅
3. Only if send succeeds → Update conversation_thread ✅
4. Only if SMS sent → Update last_message_sent_at ✅
```

**Rule**: **NEVER update conversation state until message actually sends.**

---

### Gap 2: No Conversation Recovery Mechanism

**Problem**: If conversation_thread corrupts, we lose all history

**Solution - Add Backup Field**:
- We just added `last_error_type` and `last_error_at`
- **ALSO NEED**: A way to rebuild thread from SMS_Audit

**Add to Leads table**:
- `🤖 conversation_thread_backup` (Long Text - previous version)

**OR Better**: Just rebuild from SMS_Audit table (it's the source of truth anyway!)

**Recommendation**: NO new field needed. Just write rebuild function:

```javascript
async function rebuildConversationThread(lead_id) {
  // Get all SMS for this lead from SMS_Audit
  const messages = await getSMSAudit(lead_id);
  
  // Rebuild thread
  const thread = messages.map(msg => ({
    message_id: msg.simpletexting_id || generateId(),
    direction: msg.Event === "delivered" ? "outbound" : "inbound",
    content: msg.Text,
    timestamp: msg['Sent At'] || msg['Delivery At'],
    sender: msg.Event === "delivered" ? "ai" : "prospect",
    ai_generated: msg['🤖 ai_generated']
  }));
  
  return JSON.stringify(thread);
}
```

**Key**: SMS_Audit is source of truth. conversation_thread is denormalized cache. Can always rebuild.

---

### Gap 3: No Webhook Receipt Confirmation

**Problem**: How do we know if we're missing inbound messages?

**Solution - Add to Message_Decision_Log**:

Already logs every decision. Just ensure we:
1. Log webhook receipt FIRST (before any processing)
2. Log even if decision is BLOCK
3. Include webhook_id for tracing

**Pattern**:
```javascript
// FIRST NODE in inbound workflow
await logWebhookReceipt({
  timestamp: NOW(),
  webhook_id: $webhookId,
  phone: $json.From,
  message: $json.Body,
  lead_found: true/false
});

// THEN process normally
```

**No new fields** - use existing Message_Decision_Log, just populate it better.

---

### Gap 4: No Retry Queue for Failed Operations

**Problem**: If SMS fails or Airtable fails, we don't retry intelligently

**Solution - Simple Retry Table**:

**Create NEW table**: `Retry_Queue`

**Fields** (6 fields - super simple):
1. operation_type (sms_send, airtable_update, ai_call)
2. lead_id
3. payload (JSON of what to retry)
4. retry_count
5. next_retry_at
6. max_retries (default 3)

**Workflow**: Daily job checks retry queue, attempts operations

**Value**: HIGH (ensures no lost messages)  
**Complexity**: LOW (simple queue pattern)  
**Time**: 30 minutes to implement

---

## 🎯 PROPOSED ADDITIONS (Foundational, Not Over-Engineered)

### Fields Already Added ✅
1. ✅ `🤖 last_error_type` (Leads table)
2. ✅ `🤖 last_error_at` (Leads table)
3. ✅ `fallback_responses` (AI_Config table)

### Additional Fields Recommended (3 more)

**Leads Table**:
4. `🤖 conversation_thread_backup` (Long Text - previous version before last update)
   - **Why**: Can restore if current version corrupts
   - **How**: Before updating thread, copy current to backup
   - **Cost**: Minimal (just copy operation)

5. `🤖 retry_count` (Number - how many retry attempts for current operation)
   - **Why**: Track retry loops, prevent infinite retries
   - **Reset**: After successful operation
   - **Max**: 3 retries then escalate

**Message_Decision_Log Table**:
6. `webhook_receipt_id` (Single Line Text - Twilio message SID)
   - **Why**: Trace webhook receipt to decision
   - **Use**: Verify we received all inbound messages

---

### New Table Recommended

**Retry_Queue Table** (6 fields):
1. operation_type (sms_send, airtable_update, ai_call)
2. lead_id (link to Leads)
3. payload (JSON - what to retry)
4. retry_count (current attempt number)
5. next_retry_at (when to retry)
6. created_at (when queued)

**Why**: Failed operations don't disappear, they get retried intelligently  
**Complexity**: LOW (simple queue pattern)  
**Value**: HIGH (no lost messages)

---

## 🔧 WORKFLOW PATTERNS NEEDED

### Pattern 1: Try-Catch-Fallback (Every AI Call)

```javascript
// STANDARD PATTERN for all AI calls
try {
  // 1. Call AI
  const response = await callAI(prompt);
  
  // 2. Validate response
  if (!response || response.confidence < 60) {
    throw new Error("Invalid AI response");
  }
  
  // 3. Use AI response
  return response;
  
} catch (error) {
  // 4. Log error (detailed)
  await logError(...);
  
  // 5. Use fallback
  const fallback = getFallbackResponse(error.type);
  
  // 6. Update error state
  await updateLead({ last_error_type, last_error_at });
  
  // 7. Return fallback
  return { message: fallback, fallback_used: true };
}
```

**Where**: Every AI call node needs this wrapper

---

### Pattern 2: SMS-First Update (Prevent State Inconsistency)

```javascript
// WRONG ORDER (current risk):
1. Update conversation_thread ❌
2. Send SMS ❌ (if this fails, state is wrong!)

// CORRECT ORDER:
1. Generate message
2. Send SMS FIRST
3. IF sms.status === "sent" THEN:
   - Update conversation_thread
   - Update last_message_sent_at
   - Update last_message_direction
4. ELSE:
   - Log error
   - Don't update state
   - Queue for retry
```

**Where**: Every outbound message workflow

---

### Pattern 3: Backup Before Modify (Conversation Thread)

```javascript
// BEFORE updating conversation_thread:
await updateLead({
  conversation_thread_backup: current_thread  // Save previous version
});

// THEN update:
await updateLead({
  conversation_thread: new_thread
});

// IF new_thread corrupts later, can restore from backup
```

**Where**: Every conversation update

---

### Pattern 4: Webhook Receipt Logging (Traceability)

```javascript
// FIRST NODE in webhook workflow:
await logWebhookReceipt({
  webhook_id: $webhookId,
  timestamp: NOW(),
  phone: $json.From,
  message: $json.Body,
  twilio_sid: $json.MessageSid
});

// THEN process normally
// Result: Full audit trail of ALL webhooks received
```

**Where**: First node in UYSP-Twilio-Inbound-Messages workflow

---

### Pattern 5: State Validation After Updates (Consistency Check)

```javascript
// AFTER updating lead state:
const validation = await validateLeadState(updated_lead);

if (validation.errors.length > 0) {
  // State inconsistent - log warning
  await logWarning({
    type: "state_inconsistency",
    lead_id: lead_id,
    errors: validation.errors,
    state_snapshot: updated_lead
  });
  
  // Optionally auto-fix simple issues
  if (validation.auto_fixable) {
    await autoFixState(lead_id);
  }
}
```

**Where**: After major state updates (post-conversation, post-AI-call)

---

## 📋 RECOMMENDED IMPLEMENTATION

### Add Now (Foundational):

**3 Fields** (15 minutes):
1. ✅ `last_error_type` (Leads) - DONE
2. ✅ `last_error_at` (Leads) - DONE
3. ✅ `fallback_responses` (AI_Config) - DONE

**2 More Fields** (10 minutes):
4. `🤖 conversation_thread_backup` (Leads) - Corruption recovery
5. `🤖 retry_count` (Leads) - Retry loop protection

**1 New Table** (20 minutes):
6. `Retry_Queue` table (6 fields) - Failed operation retry

**5 Workflow Patterns** (integrate during Day 2 build):
1. Try-Catch-Fallback (AI calls)
2. SMS-First Update (state consistency)
3. Backup Before Modify (corruption prevention)
4. Webhook Receipt Logging (audit trail)
5. State Validation (consistency checks)

**Total Time**: ~45 minutes  
**Value**: MASSIVE (bulletproof error handling)  
**Complexity**: LOW (simple patterns)

---

### Add Later (Nice to Have):

**Webhook Polling Backup** (Phase 2):
- Poll Twilio every hour for missed webhooks
- Compare to received webhooks
- Process any gaps
- Time: 1 hour
- Value: Ultimate safety net

---

## ❓ SHOULD I PROCEED?

**Add 2 more fields + Retry_Queue table?**

1. `🤖 conversation_thread_backup` (Leads)
2. `🤖 retry_count` (Leads)  
3. `Retry_Queue` table (6 fields)

**Then document the 5 workflow patterns for Day 2 implementation?**

**This is foundational safety infrastructure - well worth 45 minutes.**

What do you say?
