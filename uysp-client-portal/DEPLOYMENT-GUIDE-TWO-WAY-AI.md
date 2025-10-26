# Deployment Guide: Two-Way AI Messaging System

**Version**: 2.0  
**Date**: October 23, 2025  
**For**: Step-by-step implementation  
**Prerequisite**: Read `PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md` first

---

## 🎯 START HERE (System Message)

**DEVELOPER PROTOCOL:**
```
TDD WORKFLOW (Every Feature):
1. Write tests FIRST (scenarios below)
2. Run tests (should fail)
3. Implement code
4. Tests pass → Commit
5. Evidence in /tests/[phase]/

SAFETY RULE:
Phase 1 = Foundation
Cannot skip, cannot rush
Must be bulletproof

READ NEXT: Phase 1 below
```

---

## 📋 DEPLOYMENT OVERVIEW

**Total Time**: ~76 hours over 5 weeks  
**Phases**: 5 sequential (MUST complete in order)  
**Method**: Test-driven, evidence-based

---

## ⚠️ CRITICAL PRE-FLIGHT CHECKLIST

### Before Starting Any Implementation

- [ ] Full Airtable backup created
- [ ] All current n8n workflows exported to `/workflows/backups/`
- [ ] PostgreSQL database backup created
- [ ] Current production tested and working
- [ ] Git commit with clean state
- [ ] Read complete PRD (`PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md`)
- [ ] Test client identified for pilot
- [ ] 86 hours scheduled over next 5 weeks

### Required Access

- [ ] Airtable admin access (can create fields and tables)
- [ ] n8n Cloud account access
- [ ] OpenAI API key with billing enabled
- [ ] SimpleTexting account with webhook access
- [ ] Frontend repository access (GitHub)
- [ ] PostgreSQL database access (Render)

---

## 🛡️ PHASE 1: SAFETY INFRASTRUCTURE (Week 1 - 16 hours)

**SYSTEM MESSAGE:**
```
PHASE 1 = FOUNDATION (Non-Negotiable)

TDD Protocol:
1. Write all 20 safety tests FIRST
2. Tests fail (no implementation)
3. Add schema fields
4. Build safety module  
5. Tests pass → Sign off

Evidence Required:
- Test results (20 scenarios)
- Schema export
- 0 false positives
- 0 false negatives

READ: PRD → "Safety-First Architecture"
THEN: Follow steps below
```

---

### Day 1: Airtable Schema Updates (4 hours)

**SYSTEM MESSAGE**: Test environment FIRST, then schema changes.

**Step 1.1: Backup Current Schema** (15 min)
```bash
# Export current schema
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1"
node scripts/export-airtable-schema.js

# Save with timestamp
mv airtable-schema.json backups/airtable-schema-pre-safety-$(date +%Y%m%d).json

# Also create Airtable backup via UI:
# Airtable → [Your Base] → Extensions → Backups → Create Backup
# Name: "Pre-AI-Messaging-Safety-Fields-[date]"
```

**Step 1.1b: Setup Test Environment** (30 min)

```bash
# 1. Duplicate UYSP base in Airtable
# Base name: "UYSP_TEST"
# Remove all lead data
# Keep schema only

# 2. Add test leads (via Airtable UI)
# Create 10 records in People table with:
# - test_mode_lead = TRUE
# - Valid email/phone (use test numbers)
# - Various campaign stages for testing

# 3. Get Twilio test credentials
# Twilio Console → Get test Account SID and Auth Token
# These don't send real SMS (perfect for testing)

# 4. Configure test OpenAI key
# Create separate OpenAI key with $10 budget limit
# For testing only
```

**Step 1.2: Add Safety Fields to People Table** (2 hours)

Via Airtable UI, add these fields:

```
CONVERSATION STATE:
1. last_message_direction
   Type: Single Select
   Options: "outbound", "inbound"
   
2. last_message_sent_at
   Type: DateTime
   Include time: Yes
   
3. last_message_received_at
   Type: DateTime
   Include time: Yes
   
4. active_conversation
   Type: Checkbox
   
MESSAGING CONTROL:
5. ai_status
   Type: Single Select
   Options: "active", "paused", "human_takeover"
   Default: "active"
   
6. conversation_locked_by_human
   Type: Checkbox
   
7. pause_reason
   Type: Long Text
   
8. pause_until
   Type: DateTime

CAMPAIGN STATE:
9. campaign_stage
   Type: Single Select
   Options: "confirmation", "intent_qualify", "sent_content", 
            "content_followup", "hot_lead", "content_nurture", 
            "paused_by_request", "long_term_nurture"
   
10. next_scheduled_contact
    Type: DateTime
    
11. schedule_set_at
    Type: DateTime
    
12. schedule_invalidated
    Type: Checkbox

SAFETY TRACKING:
13. ai_message_count_today
    Type: Number
    Default: 0
    
14. messages_in_last_2_hours
    Type: Number
    Default: 0
    
15. last_safety_block_reason
    Type: Long Text
    
16. test_mode_lead
    Type: Checkbox
    Default: FALSE
    Description: If TRUE, skips all rate limits and safety checks (testing only)
```

**Step 1.3: Create Client_Safety_Config Table** (30 min)

**Option A: Master Base** (If you have one for multi-tenant)
- Create table in master registry base
- One record per client

**Option B: Each Client Base** (Simpler for now)
- Create table in UYSP base
- One record (the client's own config)

```
Table Name: Client_Safety_Config

Fields:
1. client_id (Single Line Text, Primary) = "uysp_001"
2. max_messages_per_conversation (Number, default: 10)
3. max_new_conversations_per_day (Number, default: 200)
4. max_ai_cost_per_day (Currency USD, default: 50.00)
5. global_messaging_paused (Checkbox, default: FALSE)
6. pause_reason (Long Text)
7. paused_by (Single Line Text)
8. paused_at (DateTime)
9. conversation_ends_after_hours (Number, default: 4)
10. alert_email (Email) = [Your admin email]
11. last_circuit_breaker_triggered (DateTime)
12. circuit_breaker_count_30d (Number, default: 0)

Add one record with UYSP values:
- client_id: "uysp_001"  
- alert_email: "rebel@rebelhq.ai"
- All others: use defaults
```

**Step 1.4: Create Message_Decision_Log Table** (30 min)

```
Table Name: Message_Decision_Log

Fields:
1. timestamp (DateTime, auto-generated)
2. client_id (Single Line Text)
3. lead_id (Link to People table)
4. trigger_type (Single Select: "inbound_reply", "scheduled", "manual")
5. decision (Single Select: "SEND", "BLOCK", "CIRCUIT_BREAKER")
6. decision_reason (Long Text)
7. safety_checks_results (Long Text - JSON format)
8. message_content (Long Text)
9. ai_cost (Currency USD)
10. next_contact_calculated (DateTime)
11. workflow_execution_id (Single Line Text)
```

**Step 1.5: Document Field IDs** (30 min)

```bash
# Export new schema
node scripts/export-airtable-schema.js

# Save field IDs for n8n configuration
# Create file: config/safety-field-ids.json
{
  "last_message_direction": "fld_XXXXX",
  "last_message_sent_at": "fld_YYYYY",
  "ai_status": "fld_ZZZZZ",
  ...
}
```

---

### Day 2: Safety Check Module (n8n) (6 hours)

**SYSTEM MESSAGE**: 
```
Tests first! Create /tests/phase1-safety/test-scenarios.md
Run tests (fail), build module, tests pass.
Evidence: Export workflow + test results.
```

**Step 2.1: Create Safety Check Workflow** (3 hours)

Create: `workflows/safety-check-module-v2.json`

```javascript
// NODE 1: Load Lead Safety Data
Type: Airtable - Read Record
Base: {{ $json.client_airtable_base }}
Table: People
Record ID: {{ $json.lead_id }}
Fields to return: 
  - last_message_direction
  - last_message_sent_at
  - last_message_received_at
  - ai_status
  - ai_message_count_today
  - messages_in_last_2_hours
  - opted_out

// NODE 2: Load Client Safety Config
Type: Airtable - Search
Base: [Master Registry Base]
Table: Client_Safety_Config
Filter: {client_id} = '{{ $json.client_id }}'

// NODE 3: Run Safety Checks (Code Node)
const lead = $input.first().json;
const client_config = $input.all()[1].json[0];
const trigger_type = $json.trigger_type; // "inbound_reply" or "scheduled"

const now = new Date();

// TEST MODE OVERRIDE (Skip all safety for test leads)
if (lead.test_mode_lead === true) {
  return {
    decision: "SEND",
    decision_reason: "Test mode - all safety checks bypassed",
    safety_checks: { test_mode: true },
    proceed: true
  };
}

const safety_checks = {
  // PRIMARY: Last Word Check
  ai_has_last_word: lead.last_message_direction === "outbound" && 
                    trigger_type === "scheduled",
  
  // Runaway Detection
  too_many_messages: lead.messages_in_last_2_hours >= 10,
  
  // Frequency (only for NEW conversations)
  recent_message: trigger_type === "scheduled" && 
                  (now - new Date(lead.last_message_sent_at)) < 24 * 60 * 60 * 1000,
  
  // Opt-Out
  opted_out: lead.opted_out === true,
  
  // Status
  paused: lead.ai_status === "paused",
  human_takeover: lead.ai_status === "human_takeover",
  
  // Global
  global_pause: client_config.global_messaging_paused === true
};

// Determine decision
const blocking_checks = [
  'ai_has_last_word',
  'too_many_messages', 
  'opted_out',
  'paused',
  'human_takeover',
  'global_pause'
];

const blocked = blocking_checks.some(check => safety_checks[check] === true);

// For scheduled messages, also check recent_message
if (trigger_type === "scheduled" && safety_checks.recent_message) {
  blocked = true;
}

const decision = safety_checks.too_many_messages ? "CIRCUIT_BREAKER" :
                 blocked ? "BLOCK" : "SEND";

const reasons = [];
for (const [check, failed] of Object.entries(safety_checks)) {
  if (failed) reasons.push(check);
}

return {
  decision: decision,
  decision_reason: reasons.join(", ") || "All safety checks passed",
  safety_checks: safety_checks,
  proceed: decision === "SEND"
};

// NODE 4: Branch on Decision
Type: IF
Condition: {{ $json.proceed }} === true

// NODE 5a: If SEND → Continue to AI
// NODE 5b: If BLOCK → Log to Message_Decision_Log + Skip

// NODE 6: Log Decision
Type: Airtable - Create
Table: Message_Decision_Log
Fields:
  - timestamp: NOW()
  - client_id: {{ $json.client_id }}
  - lead_id: {{ $json.lead_id }}
  - trigger_type: {{ $json.trigger_type }}
  - decision: {{ $json.decision }}
  - decision_reason: {{ $json.decision_reason }}
  - safety_checks_results: {{ JSON.stringify($json.safety_checks) }}
```

**Step 2.2: Test Safety Module** (2 hours)

Create test cases in `/tests/safety-scenarios/`:

```javascript
// Test 1: AI Has Last Word (Should Block)
{
  lead: {
    last_message_direction: "outbound",
    last_message_sent_at: "2024-11-15 10:00"
  },
  trigger_type: "scheduled",
  expected_decision: "BLOCK",
  expected_reason: "ai_has_last_word"
}

// Test 2: Prospect Replied (Should Send)
{
  lead: {
    last_message_direction: "inbound",
    last_message_received_at: "2024-11-15 10:30"
  },
  trigger_type: "inbound_reply",
  expected_decision: "SEND",
  expected_reason: "All safety checks passed"
}

// Test 3: Runaway (Should Circuit Break)
{
  lead: {
    messages_in_last_2_hours: 11
  },
  expected_decision: "CIRCUIT_BREAKER",
  expected_reason: "too_many_messages"
}

// Test 4: Opted Out (Should Block)
{
  lead: {
    opted_out: true
  },
  expected_decision: "BLOCK",
  expected_reason: "opted_out"
}

// Test 5: Active Conversation, Prospect Replied (Should Send)
{
  lead: {
    last_message_direction: "inbound",
    ai_message_count_today: 3  // Already 3 messages today
  },
  trigger_type: "inbound_reply",
  expected_decision: "SEND",  // Active conversation, allow
  expected_reason: "All safety checks passed"
}
```

Run each test, verify decision matches expected.

**Step 2.3: Document Safety Test Results** (1 hour)

Create: `/tests/safety-test-results-[date].md`

---

### Day 3-4: Circuit Breaker Implementation (6 hours)

**Step 3.1: Build Emergency Stop Workflow** (2 hours)

```javascript
// Triggered when circuit breaker detects runaway

NODE 1: Pause AI for Lead
  - Update People: ai_status = "paused"
  - Set pause_reason = "Circuit breaker - runaway conversation"

NODE 2: Alert Admin
  - Email to alert_email
  - Subject: "URGENT: Circuit Breaker Triggered for Lead [name]"
  - Body: Include full conversation, reason, timestamp

NODE 3: Log to Client Safety Config
  - Increment circuit_breaker_count_30d
  - Set last_circuit_breaker_triggered = NOW

NODE 4: Create Alert in Human Review Queue
  - Flag for immediate review
```

**Step 3.2: Test Circuit Breaker** (2 hours)

Simulate runaway:
1. Create test lead
2. Manually set messages_in_last_2_hours = 11
3. Trigger inbound message
4. Verify: AI blocked, admin alerted, lead paused

**Step 3.3: Build Manual Override UI** (2 hours)

Add to lead detail page:

```typescript
// Emergency Controls (visible to SUPER_ADMIN only)

<div className="border border-red-500 p-4 rounded">
  <h3>Emergency Controls</h3>
  
  {lead.ai_status === "paused" && (
    <button onClick={resumeAI}>Resume AI</button>
  )}
  
  <button onClick={globalPause}>
    Global Pause (All Client Messaging)
  </button>
  
  <button onClick={forceMessage}>
    Force Next Message Now (Override Safety)
  </button>
</div>
```

---

### Day 5: Phase 1 Testing & Validation (4 hours total)

**Step 5.1: Safety Scenario Testing** (2 hours)

Run all test scenarios documented in Step 2.2.

**Verification checklist:**
- [ ] AI cannot double-message (Test 1)
- [ ] AI responds to inbound correctly (Test 2)
- [ ] Circuit breaker triggers (Test 3)
- [ ] Opt-outs respected (Test 4)
- [ ] Active conversations allowed (Test 5)
- [ ] All decisions logged in Message_Decision_Log
- [ ] No false positives in production-like scenarios

**Step 5.2: Manual Override Testing** (1 hour)

Test human controls:
- [ ] Global pause stops all messaging
- [ ] Per-lead pause works
- [ ] Resume AI works
- [ ] Force message overrides safety (with confirmation)

**Step 5.3: Phase 1 Sign-Off** (1 hour)

Create: `/tests/phase1-safety-sign-off.md`

Document:
- All test results
- Any edge cases discovered
- Confirmation that safety layer is bulletproof
- Sign-off from technical lead

**⛔ DO NOT PROCEED TO PHASE 2 UNTIL PHASE 1 APPROVED**

**READ NEXT**: Phase 2 section below (after sign-off)

---

## 🤖 PHASE 2: AI CONVERSATION ENGINE (Week 2 - 21 hours)

**SYSTEM MESSAGE:**
```
PREREQUISITE: Phase 1 sign-off complete

TDD Protocol:
1. Write 8 conversation tests
2. Build AI workflow
3. Tests pass
4. Evidence: conversation logs

READ: PRD → "AI Agent Architecture"
READ: PRD → "Conversation Thread Schema"
READ: PRD → "Error Handling Matrix"
```

---

### Day 1: Airtable Schema for AI (2 hours)

**SYSTEM MESSAGE**: Create AI_Config with UYSP's actual product info (not Lorem Ipsum).

**Step 2.1: Create AI_Config Table** (1 hour)

Via Airtable UI:

```
Table: AI_Config (single record per client)

CLIENT IDENTITY:
1. client_id (Single Line Text) = "uysp_001"
2. client_name (Single Line Text) = "UYSP"

KNOWLEDGE:
3. knowledge_base (Long Text) = [Paste client's product info, ~5-10KB]

PERSONALITY:
4. tone (Long Text) = "Professional but friendly"
5. response_style (Long Text) = "Keep under 160 chars, max 2 questions"

AI MODEL:
6. ai_provider (Single Select) = "openai"
7. ai_model (Single Select) = "gpt-4o-mini"
8. temperature (Number) = 0.7
9. max_tokens (Number) = 300

BOOKING:
10. default_calendly_link (URL) = [Client's Calendly URL]
11. booking_keywords (Long Text) = "schedule, book, meeting, call, demo"

ESCALATION:
12. escalation_email (Email) = [Client's sales email]
13. escalation_triggers (Long Text) = "pricing, legal, competitor, frustrated"

Add one record with UYSP's actual info.
```

**Step 2.2: Enhance Communications Table** (1 hour)

Add fields:

```
1. ai_generated (Checkbox)
2. ai_confidence (Number, 0-100)
3. ai_model_used (Single Line Text) - Will always be "gpt-4o-mini"
4. ai_cost (Currency USD)
5. tokens_used (Number)
6. conversation_turn_number (Number)
7. twilio_message_sid (Single Line Text) - Twilio's message ID
8. delivery_status (Single Select: queued, sent, delivered, failed)
```

---

### Day 2: Build AI Prompt Constructor (6 hours)

**Step 2.3: Create Prompt Builder Module** (4 hours)

Create: `workflows/modules/ai-prompt-builder-v2.json`

```javascript
// NODE 1: Load Universal BDR Training
const UNIVERSAL_TRAINING = `[Copy from PRD section "Universal BDR Training"]`;

// NODE 2: Load Client Context
const ai_config = $input.first().json.ai_config;
const campaign = $input.first().json.campaign;
const lead = $input.first().json.lead;

const CLIENT_CONTEXT = `
CLIENT: ${ai_config.client_name}
PRODUCT: ${ai_config.knowledge_base.split('\n')[0]}  // First line

FULL KNOWLEDGE BASE:
${ai_config.knowledge_base}

TONE: ${ai_config.tone}
STYLE: ${ai_config.response_style}

BOOKING:
Calendly: ${ai_config.default_calendly_link}
Keywords: ${ai_config.booking_keywords}

ESCALATION:
Triggers: ${ai_config.escalation_triggers}
Email: ${ai_config.escalation_email}
`;

// NODE 3: Load Conversation History
const conversation = JSON.parse(lead.conversation_thread || '[]');
const formatted_history = conversation.slice(-10).map(msg => 
  `[${msg.direction.toUpperCase()}] ${msg.timestamp}: ${msg.content}`
).join('\n');

// NODE 4: Determine Current Objective
const objectives = {
  'confirmation': 'Confirm registration, set expectations',
  'intent_qualify': 'Ask if interested in content or coaching',
  'sent_content': 'Check if content was helpful',
  'content_nurture': 'Provide value, maintain relationship',
  'hot_lead': 'Book the meeting'
};

const current_objective = objectives[lead.campaign_stage] || 
                         'Qualify lead and provide value';

// NODE 5: Construct Full Prompt
const full_prompt = `
${UNIVERSAL_TRAINING}

${CLIENT_CONTEXT}

CAMPAIGN CONTEXT:
- Campaign: ${campaign.campaign_name}
- Type: ${campaign.campaign_type}
- Stage: ${lead.campaign_stage}

LEAD:
- Name: ${lead.first_name}
- Company: ${lead.company}
- Title: ${lead.title}
- Interest: ${lead.interest_type || 'unknown'}

CONVERSATION HISTORY:
${formatted_history}

CURRENT OBJECTIVE: ${current_objective}

LATEST MESSAGE FROM ${lead.first_name}:
${$json.incoming_message}

RESPOND:
1. Address their message naturally
2. If setting next contact, use: [DELAY:Xdays] (e.g., [DELAY:7days])
3. If escalating, use: [ESCALATE:reason]
4. If booking, send Calendly link
5. Keep response under 160 characters when possible
6. Remember: They have the last word. Send your message and stop.
`;

return { full_prompt };
```

**Step 2.4: Test Prompt Builder** (2 hours)

Test with sample conversations:
- Verify prompt includes all context
- Verify formatting is clean
- Test with different campaign types
- Verify character limits respected

---

### Day 3-4: Inbound Message Handler (12 hours)

**Step 2.5: Build Complete Workflow** (8 hours)

Create: `workflows/inbound-message-handler-v2.json`

Import safety-check-module as subflow.

```javascript
// [Full workflow structure from PRD]
// Nodes 1-18 as specified in PRD section "Workflow 1"
```

**Key Implementation Notes:**

```javascript
// NODE 11: Call OpenAI (Fixed Model)
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer {{ $credentials.openai_api_key }}
  Content-Type: application/json
Timeout: 15000 (15 seconds)
Retry On Fail: TRUE
Max Tries: 2
Wait Between Tries: 2000ms

Body:
{
  "model": "gpt-4o-mini",
  "temperature": {{ $json.ai_config.temperature || 0.7 }},
  "max_tokens": 300,
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.full_prompt }}"
    },
    {
      "role": "user", 
      "content": "{{ $json.incoming_message }}"
    }
  ]
}

// NODE 11a: Error Handler for AI Call
Type: IF (Error Trigger)
If OpenAI call fails after retries:
  
// Send default response
const default_msg = "Thanks for your message! Let me get you the right information. Someone from our team will follow up within 24 hours.";

await sendSMS(default_msg);

// Log error
await logError({
  error_type: "openai_failure",
  lead_id: lead_id,
  error_details: $error,
  fallback_used: true
});

// Update state (still update, even though AI failed)
await updateLead({
  last_message_sent_at: NOW(),
  last_message_direction: "outbound",
  next_scheduled_contact: addDays(NOW(), 7),  // Default 7 days
  last_safety_block_reason: "AI call failed - default response sent"
});

return "AI_ERROR_HANDLED";

// NODE 12: Parse Response + Extract Actions
const ai_response = $json.choices[0].message.content;

// Extract action tags
const delay_match = ai_response.match(/\[DELAY:(\d+)days?\]/);
const escalate_match = ai_response.match(/\[ESCALATE:?(.*)?\]/);
const book_match = ai_response.match(/\[BOOK\]/);
const stop_match = ai_response.match(/\[STOP\]/);

// Clean message (remove tags)
const clean_message = ai_response
  .replace(/\[DELAY:\d+days?\]/g, '')
  .replace(/\[ESCALATE:?.*?\]/g, '')
  .replace(/\[BOOK\]/g, '')
  .replace(/\[STOP\]/g, '')
  .trim();

// Calculate next contact (ONLY standard delays allowed)
const STANDARD_DELAYS = [7, 14, 30, 60, 90];
let delay_days = delay_match ? parseInt(delay_match[1]) : 7;

// Validate delay is one of standard options
if (!STANDARD_DELAYS.includes(delay_days)) {
  // AI picked non-standard delay, use closest match
  delay_days = STANDARD_DELAYS.reduce((prev, curr) => 
    Math.abs(curr - delay_days) < Math.abs(prev - delay_days) ? curr : prev
  );
  console.log(`AI suggested ${delay_match[1]} days, using closest standard: ${delay_days}`);
}

const next_contact = new Date(Date.now() + delay_days * 24 * 60 * 60 * 1000);

return {
  message_to_send: clean_message,
  next_contact_date: next_contact.toISOString(),
  delay_days: delay_days,
  should_escalate: !!escalate_match,
  escalate_reason: escalate_match ? escalate_match[1] : null,
  should_book: !!book_match,
  should_stop: !!stop_match,
  ai_cost: calculateCost($json.usage.total_tokens, ai_model),
  tokens_used: $json.usage.total_tokens
};
```

**Step 2.6: Test AI Workflow** (3 hours)

**Use test_mode_lead = TRUE for all these tests**

Test scenarios with test phone numbers:
```javascript
// Test 1: Simple Reply
Inbound: "Yes, send me content"
Expected: AI responds with resource link + [DELAY:7days]
Verify: 
  - next_scheduled_contact = 7 days from now
  - conversation_thread has 2 messages
  - last_message_direction = "outbound"

// Test 2: Booking Intent
Inbound: "Can I schedule a call?"
Expected: AI sends Calendly link + [BOOK]
Verify: 
  - Calendly link in message
  - booking_intent flagged

// Test 3: Delay Request (Standard Options)
Inbound: "Check back in a few months"
Expected: AI says "No problem!" + [DELAY:90days]
Verify: next_scheduled_contact = 90 days from now

// Test 3b: Vague Delay (AI picks safe default)
Inbound: "Maybe check in sometime later"
Expected: AI picks [DELAY:30days] (safe default)
Verify: next_scheduled_contact = 30 days

// Test 4: Escalation
Inbound: "What's your competitor analysis on [Competitor X]?"
Expected: AI says "Let me connect you..." + [ESCALATE:competitor]
Verify: ai_status = "human_takeover", admin alerted

// Test 5: Stop Request
Inbound: "Please don't contact me again"
Expected: AI confirms + [STOP]
Verify: ai_status = "paused", opted_out = true

// Test 6: Content Request (No Match)
Inbound: "Send me info on enterprise contract negotiation"
Expected: AI says "Let me connect you with team..." (no content on that)
Verify: Escalated or sent default response

// Test 7: OpenAI Error (Simulate)
Simulate: Disconnect OpenAI API temporarily
Expected: Default response sent, error logged
Verify: Conversation doesn't break

// Test 8: Multi-Message Conversation
Send 4 messages back-and-forth rapidly
Expected: All go through (active conversation)
Verify: No blocks, all logged correctly
```

**Step 2.7: Integration Testing** (1 hour)

Test full flow end-to-end:
1. Send test SMS to test phone number
2. Verify webhook received
3. Verify safety checks run
4. Verify AI responds
5. Verify Airtable updated
6. Verify decision logged

---

### Day 5: Phase 2 Validation (4 hours)

**Step 2.8: Conversation Flow Testing** (2 hours)

Multi-message conversation test:
```
You: "Interested in coaching"
AI: "Great! What's your biggest challenge?"
You: "Cold calling"
AI: "Here's our cold calling guide: [link]"
You: "Thanks! Can I book a call?"
AI: "Absolutely! Here's my calendar: [link]"
```

Verify:
- [ ] All 6 messages (3 each direction) sent successfully
- [ ] No safety blocks during active conversation
- [ ] Conversation_thread has all 6 messages
- [ ] Final state: waiting for booking or prospect reply

**Step 2.9: Schedule Invalidation Test** (1 hour)

```
Day 1: Schedule set for Day 8
Day 3: Active conversation happens
Day 8: Scheduled trigger fires

Expected: Blocked - schedule stale
Actual: [Test and verify]
```

**Step 2.10: Phase 2 Sign-Off** (1 hour)

Document all test results, get approval.

**⛔ DO NOT PROCEED TO PHASE 3 UNTIL PHASE 2 APPROVED**

**READ NEXT**: Phase 3 section below (after sign-off)

---

## 💻 PHASE 3: FRONTEND CONVERSATION VIEW (Week 3 - 18 hours)

**SYSTEM MESSAGE:**
```
PREREQUISITE: Phase 2 AI engine working

BUILD: Conversation UI
DESIGN: REBEL-HQ-DESIGN-SYSTEM.md
SPEC: PRD → "Feature Specifications"

TDD: API tests → Component tests → Integration
```

---

### Day 1-2: Conversation API (6 hours)

**Step 3.1: Create Conversation Endpoints** (4 hours)

`src/app/api/leads/[id]/conversation/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { airtableClient } from '@/lib/airtable/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leadId = params.id;
  
  // Get from PostgreSQL (fast cache)
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId)
  });

  if (!lead) return Response.json({ error: 'Not found' }, { status: 404 });

  // Parse conversation thread
  const conversation = JSON.parse(lead.conversation_thread || '[]');

  return Response.json({
    conversation,
    has_responded: lead.has_responded,
    last_inbound_at: lead.last_inbound_at,
    ai_status: lead.ai_status,
    next_scheduled_contact: lead.next_scheduled_contact
  });
}
```

`src/app/api/leads/[id]/takeover/route.ts`:

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { reason } = await request.json();
  const leadId = params.id;

  // Update in Airtable (source of truth)
  await airtableClient.updateRecord('People', leadId, {
    ai_status: 'human_takeover',
    conversation_locked_by_human: true,
    human_assigned_to: session.user.email,
    takeover_timestamp: new Date().toISOString(),
    pause_reason: reason
  });

  // Update PostgreSQL cache
  await db.update(leads)
    .set({
      ai_status: 'human_takeover',
      updated_at: new Date()
    })
    .where(eq(leads.id, leadId));

  return Response.json({ success: true });
}
```

**Step 3.2: Test API Endpoints** (2 hours)

---

### Day 3-4: Conversation UI Component (10 hours)

**Step 3.3: Build ConversationView** (6 hours)

`src/components/ConversationView.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';

interface Message {
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: string;
  ai_generated?: boolean;
}

export function ConversationView({ leadId }: { leadId: string }) {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [aiStatus, setAiStatus] = useState('active');

  useEffect(() => {
    fetch(`/api/leads/${leadId}/conversation`)
      .then(res => res.json())
      .then(data => {
        setConversation(data.conversation);
        setAiStatus(data.ai_status);
      });
  }, [leadId]);

  const handleTakeover = async () => {
    const reason = prompt('Reason for takeover:');
    if (!reason) return;

    await fetch(`/api/leads/${leadId}/takeover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    setAiStatus('human_takeover');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2>Conversation History</h2>
        <div className="space-x-2">
          {aiStatus === 'active' && (
            <button onClick={handleTakeover} className="btn-secondary">
              Take Over Conversation
            </button>
          )}
          {aiStatus === 'human_takeover' && (
            <span className="badge-warning">Human Handling</span>
          )}
        </div>
      </div>

      <div className="conversation-thread space-y-3">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.direction === 'outbound' ? 'outbound' : 'inbound'}`}
          >
            <div className="message-header">
              <span className={msg.direction === 'outbound' ? 'text-indigo-400' : 'text-cyan-400'}>
                {msg.direction === 'outbound' ? 'AI Agent' : 'Lead'}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(msg.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="message-content">
              {msg.content}
            </div>
            {msg.ai_generated && (
              <div className="text-xs text-gray-500 mt-1">
                AI • Confidence: {msg.ai_confidence}% • Cost: ${msg.ai_cost}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3.4: Add Styling** (2 hours)

In `src/app/globals.css`:

```css
.conversation-thread {
  max-height: 600px;
  overflow-y: auto;
}

.message {
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
}

.message.outbound {
  background: rgba(99, 102, 241, 0.1);
  border-left: 3px solid rgb(99, 102, 241);
  margin-right: auto;
}

.message.inbound {
  background: rgba(34, 211, 238, 0.1);
  border-left: 3px solid rgb(34, 211, 238);
  margin-left: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.message-content {
  line-height: 1.5;
}
```

**Step 3.5: Integrate into Lead Detail Page** (2 hours)

Update `src/app/(client)/leads/[id]/page.tsx` to include ConversationView tab.

---

### Day 5: Dashboard Integration (2 hours)

**Step 3.6: Add "Responses" Card** (1 hour)

In `src/app/(client)/dashboard/page.tsx`:

```typescript
// Add query for responded leads
const respondedLeads = await db.query.leads.findMany({
  where: eq(leads.has_responded, true),
  orderBy: desc(leads.last_inbound_at),
  limit: 50
});

// Add to dashboard
<DashboardCard
  title="Responses"
  value={respondedLeads.length}
  subtitle={`${respondedLeads.filter(l => !l.reviewed).length} Need Review`}
  icon={<ChatBubbleIcon />}
  href="/leads?filter=responded"
/>
```

**Step 3.7: Add Conversation Filter** (1 hour)

In leads table, add filter option: "Has Responded"

---

## 📚 PHASE 4: CONTENT LIBRARY (Week 4 - 12 hours)

### Day 1: Airtable + Backend (6 hours)

**Step 4.1: Create Content_Library Table** (1 hour)

[Fields as specified in PRD]

Add 10 sample content pieces for testing.

**Step 4.2: Build Content API** (3 hours)

Create: `src/app/api/admin/content/route.ts`

**Step 4.3: Build Content Search in n8n** (2 hours)

Create n8n function node: `search-content-by-topic`

```javascript
// Input: topic (from AI or user input)
// Output: Top 3 matching content items

const topic = $json.topic.toLowerCase().trim();
const client_base = $json.client_airtable_base;

// STEP 1: Try topic matching
const matches = await airtable.search({
  base: client_base,
  table: "Content_Library",
  filterByFormula: `
    AND(
      {active} = TRUE(),
      OR(
        FIND("${topic}", LOWER({topics}))
      )
    )
  `,
  sort: [{ field: "engagement_score", direction: "desc" }],
  maxRecords: 3
});

if (matches.length > 0) {
  return { content: matches, match_type: "topic" };
}

// STEP 2: Fallback to most popular
const popular = await airtable.search({
  base: client_base,
  table: "Content_Library",
  filterByFormula: `{active} = TRUE()`,
  sort: [{ field: "engagement_score", direction: "desc" }],
  maxRecords: 3
});

if (popular.length > 0) {
  return { content: popular, match_type: "popular" };
}

// STEP 3: Library is empty
return { 
  content: [], 
  match_type: "empty",
  escalate: true,
  message: "Let me connect you with our team who can share relevant resources."
};
```

---

### Day 2-3: Content Management UI (6 hours)

**Step 4.4: Build Content Library Page** (4 hours)

`src/app/(client)/admin/content/page.tsx`

**Step 4.5: Test Content Flow** (2 hours)

Test AI retrieving and sending content.

---

## 🌐 PHASE 5: MULTI-TENANT DEPLOYMENT (Week 5 - 16 hours)

### Day 1-2: Template Base Creation (8 hours)

**Step 5.1: Create Pristine Template Base** (4 hours)

Duplicate UYSP base, clean out:
- All lead data
- Client-specific campaigns
- Client-specific content

Keep:
- Schema (all tables and fields)
- Sample campaigns (1-2 templates)
- Sample content (10-15 generic pieces)
- Default AI_Config (generic template)

**Step 5.2: Build Duplication Script** (4 hours)

`scripts/create-new-client-base.js`:

```javascript
// Uses Airtable API to:
// 1. Duplicate template base
// 2. Update AI_Config with client info
// 3. Add client to Client_Registry
// 4. Create client in PostgreSQL
// 5. Test webhook connectivity
```

---

### Day 3-5: Multi-Tenant Testing (8 hours)

**Step 5.3: Create 2 Test Clients** (2 hours)

Run script twice:
- Test Client A
- Test Client B

**Step 5.4: Test Isolation** (4 hours)

- [ ] Send message to Client A lead → Only A's Airtable updated
- [ ] Send message to Client B lead → Only B's Airtable updated
- [ ] Verify no cross-contamination
- [ ] Test both clients' AI agents simultaneously

**Step 5.5: Document Onboarding** (2 hours)

Create: `docs/CLIENT-ONBOARDING-GUIDE.md`

---

## ✅ GO-LIVE CHECKLIST

### Pre-Launch

- [ ] All 5 phases completed
- [ ] Safety testing passed (0 double-messages in 100+ test messages)
- [ ] Multi-tenant isolation verified
- [ ] Full backup created
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Admin trained on manual overrides

### Launch Day

- [ ] Deploy to production
- [ ] Enable for UYSP only (not other clients yet)
- [ ] Monitor for 24 hours
- [ ] Check logs for any safety violations
- [ ] Verify conversation quality

### Post-Launch (Week 1)

- [ ] Daily monitoring
- [ ] Review AI response quality
- [ ] Check circuit breaker logs
- [ ] Collect user feedback
- [ ] Optimize based on learnings

### Scale-Up (Week 2+)

- [ ] Enable for additional clients
- [ ] Monitor cross-client performance
- [ ] Verify safety at scale
- [ ] Optimize costs

---

## 🚨 ROLLBACK PROCEDURES

### If Critical Issue Found

**Immediate Actions:**
1. Set `global_messaging_paused = TRUE` in Client_Safety_Config
2. Verify all AI messaging stopped
3. Alert all admins

**Investigation:**
1. Check Message_Decision_Log for patterns
2. Review error logs
3. Identify root cause

**Rollback Options:**
- Pause AI only (manual mode continues)
- Rollback to previous n8n workflow version
- Restore Airtable schema from backup

---

## 📊 MONITORING & ALERTS

### Daily Monitoring Dashboard

Create Airtable view or frontend page showing:

```
TODAY'S METRICS:
- Messages sent: 247
- Messages blocked (safety): 12
- Circuit breakers triggered: 0
- AI cost: $8.34 / $50.00 budget
- Average response time: 8.2 seconds
- Escalations: 18 (7.3%)

SAFETY HEALTH:
✅ No double-messages detected
✅ All opt-outs respected  
✅ No budget overruns
⚠️ 12 messages blocked (check reasons)
```

### Alerts (Email/Slack)

- 🚨 Circuit breaker triggered (immediate)
- ⚠️ Budget at 80% (daily)
- ⚠️ High block rate (>20% of messages blocked)
- ⚠️ AI error rate >5%
- ℹ️ Daily summary report (every morning)

---

**Deployment Guide Status**: ✅ Complete  
**Cross-Reference**: PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md  
**Ready**: Yes - Follow phase by phase

---

*This deployment guide provides step-by-step implementation for the complete two-way AI messaging system with safety-first architecture.*  
*Last Updated: October 23, 2025*

