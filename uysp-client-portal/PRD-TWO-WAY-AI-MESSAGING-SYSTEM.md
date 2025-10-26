# Product Requirements Document: Two-Way AI Messaging System

**Version**: 2.0 (Multi-Tenant)  
**Date**: October 23, 2025  
**Status**: Final Specification - Ready for Implementation  
**Architecture**: Configuration-Driven Multi-Tenant with Safety-First Design

---

## 📋 DOCUMENT INDEX

**This Document**: Complete PRD with architecture, schema, and specifications  
**Implementation Guide**: `DEPLOYMENT-GUIDE-TWO-WAY-AI.md`  
**Related Docs**:
- `NEXT-FEATURES-PLANNING.md` - Original feature planning
- `DEVELOPMENT-ROADMAP-FINAL.md` - Timeline and milestones
- `UYSP-COMPLETE-STATUS-AND-ROADMAP.md` - Overall system status
- `/docs/kajabi-integration/` - Webhook integration specs

---

## 🎯 EXECUTIVE SUMMARY

### What We're Building

**Multi-tenant AI-powered messaging system** that enables clients to:
1. Capture leads from web forms (real-time webhooks)
2. Nurture leads with AI-driven conversations (context-aware, two-way)
3. Route leads through event-based or content-based campaigns
4. Automatically qualify and book meetings
5. Scale to 25+ clients on shared infrastructure

### Core Value Proposition

**For Clients:**
- AI handles 70-80% of prospect conversations automatically
- Responds in seconds (not hours) to inbound messages
- Personalizes based on full conversation history
- Escalates complex questions to humans
- Books meetings when prospect is ready

**For Us (Platform):**
- One codebase serves 25+ clients
- Client customization via Airtable (no code changes)
- Scalable architecture (shared n8n workflows)
- Complete data isolation (separate Airtable bases)

### Architecture Type

**Configuration-Driven Multi-Tenancy:**
- Infrastructure: Shared (n8n workflows)
- Data: Isolated (Airtable base per client)
- Customization: Client-specific config in their Airtable
- Safety: Multi-layer protection with circuit breakers

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│  LEAD CAPTURE (Real-Time)                               │
│  Form Submitted → Webhook → n8n → Airtable → Frontend  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  ENRICHMENT (Clay)                                      │
│  Airtable → Clay API → Company/Title Data → Airtable   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  INITIAL OUTREACH (Scheduled or Immediate)              │
│  AI sends first message based on campaign type          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  TWO-WAY CONVERSATION (AI-Driven)                       │
│                                                         │
│  Prospect Replies → Inbound Webhook → n8n              │
│       ↓                                                 │
│  Safety Checks → Load Context → AI Response            │
│       ↓                                                 │
│  Send Reply → Update State → Calculate Next Contact    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  SCHEDULED FOLLOW-UP (Only if No Active Conversation)  │
│  Daily trigger checks next_scheduled_contact            │
│  Safety checks prevent if conversation happened         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ SAFETY-FIRST ARCHITECTURE (FOUNDATION)

### Primary Safety Rule: Last-Word Protocol

**THE RULE:**
```
AI can ONLY send a message if:
  1. Prospect sent the last message (responding to inbound), OR
  2. Scheduled trigger reached AND no recent conversation
```

**Implementation:**
```javascript
// BEFORE every AI message send:

// Check 1: Does prospect have last word?
if (last_message_direction === "inbound") {
  // Prospect replied, AI can respond
  return "PROCEED";
}

// Check 2: Is this a scheduled trigger?
if (isScheduledTrigger && last_message_sent_at < now - 24_hours) {
  // Scheduled trigger and no conversation in 24h
  return "PROCEED";
}

// Otherwise: AI already sent last message
return "BLOCK - AI has last word, must wait for reply or schedule";
```

---

### Circuit Breakers (Runaway Protection)

**Level 1: Conversation Runaway**
```javascript
// Detect infinite loops
const messages_in_last_2_hours = countMessages(lead_id, last_2_hours);

if (messages_in_last_2_hours >= 10) {
  // Something is broken (bug or adversarial prospect)
  
  await emergencyStop({
    lead_id: lead_id,
    reason: "Runaway conversation - 10 messages in 2 hours",
    action: "pause_ai_for_lead",
    alert: "admin",
    log_full_conversation: true
  });
  
  return "CIRCUIT_BREAKER";
}
```

**Level 2: Client Volume Protection**
```javascript
// Prevent one client from consuming all resources
const new_conversations_started_today = countNewConversations(client_id, today);

if (new_conversations_started_today >= max_new_conversations_per_day) {
  // Only block NEW conversations, allow active ones to continue
  
  if (!active_conversation) {
    await alertAdmin("Client daily conversation limit reached");
    return "BLOCK - Daily limit for new conversations";
  }
}
```

**Level 3: Cost Protection**
```javascript
const client_ai_cost_today = sumAICosts(client_id, today);

if (client_ai_cost_today >= max_ai_cost_per_day) {
  
  // Allow 20% overage for active conversations
  if (active_conversation && client_ai_cost_today < max_ai_cost_per_day * 1.2) {
    LOG("Budget exceeded but allowing active conversation");
    return "PROCEED_WITH_WARNING";
  }
  
  // Hard stop for new conversations
  await alertAdmin("Daily AI budget exceeded");
  return "BUDGET_EXCEEDED";
}
```

**Level 4: Emergency Kill Switch**
```javascript
// Global pause per client (admin can trigger)
if (client_config.global_messaging_paused === true) {
  return "GLOBAL_PAUSE_ACTIVE";
}

// System-wide kill switch (for platform emergencies)
if (system_config.emergency_stop === true) {
  return "EMERGENCY_STOP_ACTIVE";
}
```

---

### Safety Audit Log

**Every message decision logged:**
```javascript
// Table: Message_Decision_Log
{
  timestamp: "2024-11-15 10:23:45.123",
  client_id: "uysp_001",
  lead_id: "rec_abc123",
  trigger_type: "inbound_reply" | "scheduled" | "manual",
  
  decision: "SEND" | "BLOCK" | "CIRCUIT_BREAKER",
  decision_reason: "Prospect replied, safety checks passed",
  
  safety_checks_run: {
    last_word_check: "PASS - prospect has last word",
    runaway_check: "PASS - 2 messages in last 2 hours",
    budget_check: "PASS - $12.45 / $50.00 used today",
    business_hours_check: "PASS - 10:23 AM ET",
    opt_out_check: "PASS - not opted out",
    global_pause_check: "PASS - not paused"
  },
  
  message_sent: "Great! Here's that resource...",
  ai_cost: 0.03,
  tokens_used: 245,
  
  next_contact_calculated: "2024-11-22",
  calculation_reasoning: "Sent resource, wait 7 days for engagement"
}
```

**Result**: Full audit trail. Can answer "Why did/didn't AI message this person?"

---

## 🗄️ COMPLETE AIRTABLE SCHEMA

### Multi-Tenant Structure

**Master Registry** (One shared base):
```
Table: Client_Registry
- client_id (primary key)
- client_name
- airtable_base_id
- active
- tier (starter, growth, enterprise)
- created_date
```

**Per-Client Base** (Duplicate for each client):

---

### Table 1: People (Enhanced)

**Existing Fields:** (60 fields - keep all)
- email, phone, first_name, last_name, company, title, icp_score, etc.

**NEW FIELDS (Conversation Management):**
```sql
-- CONVERSATION STATE
conversation_thread          (Long Text - JSON array of full conversation)
                            (See "Conversation Thread Schema" below for exact format)
last_message_direction       (Single Select: "outbound" | "inbound")
last_message_sent_at         (DateTime)
last_message_received_at     (DateTime)
active_conversation          (Checkbox - TRUE if back-and-forth in last 4 hours)
test_mode_lead              (Checkbox - TRUE for testing, skips all rate limits)

-- MESSAGING CONTROL
ai_status                    (Single Select: "active" | "paused" | "human_takeover")
conversation_locked_by_human (Checkbox)
pause_reason                 (Long Text)
pause_until                  (DateTime)

-- CAMPAIGN STATE  
campaign_stage               (Single Select: see Campaign_Stages table)
interest_type                (Single Select: "content" | "coaching" | "unknown")
next_scheduled_contact       (DateTime)
schedule_set_at              (DateTime - when was next_scheduled_contact calculated)
schedule_invalidated         (Checkbox - TRUE if conversation made schedule stale)

-- CONTENT PREFERENCES
content_interests            (Long Text - comma-separated topics)
preferred_content_frequency  (Number - days between content)

-- SAFETY TRACKING
ai_message_count_today       (Number - resets daily at midnight)
messages_in_last_2_hours     (Number - runaway detection)
last_safety_block_reason     (Long Text)
safety_violations_count      (Number)

-- HUMAN HANDOFF
human_assigned_to            (Link to Users table - if human_takeover)
handback_note                (Long Text - human's note when giving back to AI)
takeover_timestamp           (DateTime)

-- AUDIT
total_ai_messages_sent       (Number)
total_ai_cost_usd            (Number)
last_ai_response_time_sec    (Number - performance tracking)
```

---

### Table 2: Campaigns (Enhanced)

**Existing Fields:** Keep all

**NEW FIELDS:**
```sql
campaign_type               (Single Select: "event" | "nurture" | "re_engagement")
agent_type                  (Single Select: "event_agent" | "nurture_agent")

-- EVENT-SPECIFIC
event_date                  (DateTime)
event_timezone              (Single Select)
event_status                (Single Select: "upcoming" | "live" | "completed")
event_login_link            (URL)
event_reminder_hours        (Number - array: 48, 24, 1)

-- TIMING DEFAULTS
default_followup_days       (Number)
fast_track_enabled          (Checkbox - for high-intent leads)
fast_track_delay_hours      (Number)

-- CTA
primary_cta                 (Single Select: "book_meeting" | "download" | "register")
calendly_link               (URL)

-- ACTIVE STATUS
active                      (Checkbox)
start_date                  (Date)
end_date                    (Date)
```

---

### Table 3: Content_Library (NEW)

```sql
content_id                  (Auto-generated primary key)
title                       (Single Line Text)
description                 (Long Text)
url                         (URL - required)
content_type                (Single Select: "PDF" | "Video" | "Article" | "Template" | "Tool")

-- RETRIEVAL
topics                      (Long Text - comma-separated tags)
                           (Examples: "cold_calling, prospecting, objection_handling")
difficulty_level            (Single Select: "beginner" | "intermediate" | "advanced")
best_for_role               (Long Text - "SDR, BDR, Sales Manager")
best_for_stage              (Long Text - campaign stages this is relevant for)
intent_match                (Long Text - "outbound_sales, inbound_leads")

-- PERFORMANCE
times_sent                  (Number)
click_rate                  (Number - 0.00 to 1.00)
engagement_score            (Number - 1-10, calculated from performance)
leads_to_booking_count      (Number - how many booked after receiving this)

-- MANAGEMENT
active                      (Checkbox)
created_date                (Date)
last_updated                (Date)
created_by                  (Link to Users)
```

---

### Table 4: AI_Config (NEW - One record per client)

```sql
-- CLIENT IDENTITY
client_id                   (Single Line Text - matches Client_Registry)
client_name                 (Single Line Text)

-- PRODUCT KNOWLEDGE (5-20KB)
knowledge_base              (Long Text - product info, pricing, FAQs)
                           (Format: Q&A pairs or structured sections)

-- AI PERSONALITY
tone                        (Long Text - "Professional but friendly")
response_style              (Long Text - "Keep under 160 chars, ask 1-2 questions max")
company_name                (Single Line Text)
product_name                (Single Line Text)
target_audience             (Long Text)

-- AI MODEL CONFIGURATION (Simplified - One Model for All)
ai_model                    (Single Select: "gpt-4o-mini" - FIXED for all clients)
temperature                 (Number - 0.7 default, 0.5-0.9 range)
max_tokens                  (Number - 300 default for SMS)

-- CAPABILITIES
can_send_content            (Checkbox - default TRUE)
can_update_timing           (Checkbox - default TRUE)
can_pause_sequence          (Checkbox - default TRUE)
can_escalate                (Checkbox - default TRUE)

-- ESCALATION
escalation_email            (Email)
escalation_slack_webhook    (URL)
escalation_triggers         (Long Text - keywords: "pricing, legal, competitor")

-- BOOKING
default_calendly_link       (URL)
booking_keywords            (Long Text - "schedule, book, meeting, call, demo")

-- BUSINESS RULES
business_hours_start        (Number - 9)
business_hours_end          (Number - 17)
timezone                    (Single Select - America/New_York)
no_contact_weekends         (Checkbox - default TRUE)

-- SAFETY LIMITS (Per Client)
max_messages_per_conversation (Number - 10, runaway detection)
max_new_conversations_per_day (Number - 200)
max_ai_cost_per_day_usd     (Number - 50.00)

-- ADVANCED (Optional)
use_vector_db               (Checkbox - default FALSE)
vector_namespace            (Single Line Text - if using vector DB)
custom_system_prompt        (Long Text - overrides default BDR training)

-- AUDIT
config_last_updated         (DateTime)
updated_by                  (Link to Users)
```

---

### Table 5: Standard_Timing_Delays (SIMPLIFIED)

**Instead of complex timing rules, use standard delays:**

```sql
-- Simple lookup table (can be hardcoded in workflow)
stage_name                  (Single Line Text - primary)
default_delay_days          (Single Select: 7 | 14 | 30 | 60 | 90)
ai_objective                (Long Text)

-- Just 5-7 standard stages with fixed delays
```

**Standard Delays (Hardcoded in Workflow):**
```javascript
const STANDARD_DELAYS = {
  'confirmation': 0,           // Immediate
  'intent_qualify': 2,         // 2 days before event
  'sent_content': 7,           // 1 week after sending resource
  'content_followup': 14,      // 2 weeks check-in
  'content_nurture': 30,       // Monthly check-in
  'long_term_nurture': 90,     // Quarterly check-in
  'hot_lead': 1                // Next day for hot leads
};

// AI can override with action tags: [DELAY:7days] or [DELAY:30days]
// If AI says [DELAY:Xdays], use that instead of default
```

**Prospect Delay Requests:**
```javascript
// AI extracts delay, picks from standard options:
Prospect says: "Check back in a few months"
AI picks: 90 days (closest match)
Action tag: [DELAY:90days]

Prospect says: "Hit me up next week"  
AI picks: 7 days
Action tag: [DELAY:7days]

Prospect says: "Not sure, maybe sometime?"
AI picks: 30 days (default/safe choice)
Action tag: [DELAY:30days]

// If AI is uncertain or gets it wrong:
Falls back to default for current stage
```

**This eliminates the need for Campaign_Timing_Rules table (simpler!).**

---

### Table 6: Communications (Enhanced - Already Exists)

**EXISTING:** 17 fields - keep all

**ENHANCEMENTS:**
```sql
-- ADD TO EXISTING:
ai_generated                (Checkbox - TRUE if AI wrote this message)
ai_confidence               (Number - 0.0 to 1.0)
ai_model_used               (Single Line Text - "gpt-4o-mini")
ai_cost                     (Number - cost in USD)
tokens_used                 (Number)
escalated_to_human          (Checkbox)
human_reviewed              (Checkbox)
conversation_turn_number    (Number - position in conversation)
```

---

### Table 7: Client_Safety_Config (NEW - Master base)

```sql
client_id                   (Link to Client_Registry)

-- CIRCUIT BREAKERS
max_messages_per_conversation (Number - default 10)
max_new_conversations_per_hour (Number - default 50)
max_new_conversations_per_day (Number - default 200)

-- COST LIMITS
max_ai_cost_per_day         (Number - default 50.00)
max_total_cost_per_day      (Number - default 200.00)
alert_at_percent_budget     (Number - default 80)

-- EMERGENCY CONTROLS
global_messaging_paused     (Checkbox)
pause_reason                (Long Text)
paused_by                   (Link to Users)
paused_at                   (DateTime)

-- CONVERSATION TIMEOUT
conversation_ends_after_hours (Number - default 4)
                            (If no reply in X hours, conversation considered ended)

-- AUDIT
last_circuit_breaker_triggered (DateTime)
circuit_breaker_reason      (Long Text)
circuit_breaker_count_30d   (Number)
total_messages_blocked_30d  (Number)

-- ALERTS
alert_email                 (Email)
alert_on_circuit_breaker    (Checkbox - default TRUE)
alert_on_budget_threshold   (Checkbox - default TRUE)
alert_on_safety_violation   (Checkbox - default TRUE)
```

---

### Table 8: Message_Decision_Log (NEW - Audit Trail)

```sql
-- Every message decision logged (send or skip)
timestamp                   (DateTime)
client_id                   (Link to Client_Registry)
lead_id                     (Link to People)
trigger_type                (Single Select: "inbound_reply" | "scheduled" | "manual")

-- DECISION
decision                    (Single Select: "SEND" | "BLOCK" | "CIRCUIT_BREAKER")
decision_reason             (Long Text)

-- SAFETY CHECKS (JSON)
safety_checks_results       (Long Text - JSON of all checks run)

-- IF SENT
message_content             (Long Text)
ai_provider                 (Single Line Text)
ai_model                    (Single Line Text)
ai_cost                     (Number)
tokens_used                 (Number)
response_time_ms            (Number)

-- STATE UPDATES
next_contact_calculated     (DateTime)
calculation_reasoning       (Long Text)
stage_transition            (Single Line Text - "sent_content → content_followup")

-- AUDIT
logged_at                   (DateTime - auto)
workflow_execution_id       (Single Line Text - n8n execution ID)
```

---

## 📐 DATA STRUCTURE SPECIFICATIONS

### Conversation Thread Schema (EXACT FORMAT)

**Field**: `conversation_thread` (Long Text field in Airtable)  
**Format**: JSON array (stringified)  
**Max Size**: ~100KB (handles ~500 messages)

**Message Object Schema:**
```typescript
interface ConversationMessage {
  // REQUIRED FIELDS
  message_id: string;           // UUID (e.g., "msg_abc123")
  direction: "inbound" | "outbound";
  content: string;              // The actual message text
  timestamp: string;            // ISO 8601 (e.g., "2024-11-15T10:23:45.123Z")
  sender: "ai" | "human" | "prospect";
  
  // AI-GENERATED MESSAGES
  ai_generated?: boolean;       // TRUE if AI wrote this
  ai_model?: string;            // "gpt-4o-mini"
  ai_provider?: string;         // "openai"
  ai_cost?: number;             // USD (e.g., 0.03)
  ai_confidence?: number;       // 0-100
  tokens_used?: number;         // Token count
  
  // SMS DELIVERY
  twilio_message_sid?: string;  // Twilio's message ID
  delivery_status?: "queued" | "sent" | "delivered" | "failed" | "undelivered";
  delivery_timestamp?: string;  // When delivered (ISO 8601)
  error_code?: number;          // Twilio error code if failed
  
  // METADATA
  campaign_stage_at_send?: string;  // What stage was lead in when sent
  action_tags_detected?: string[];  // ["DELAY:7days", "ESCALATE"]
  
  // ERROR HANDLING
  error?: boolean;              // TRUE if error occurred
  error_reason?: string;        // Error description
  retry_count?: number;         // How many retries attempted
}
```

**Example conversation_thread:**
```json
[
  {
    "message_id": "msg_001",
    "direction": "outbound",
    "content": "Hi John, interested in content or coaching?",
    "timestamp": "2024-11-15T10:00:00.000Z",
    "sender": "ai",
    "ai_generated": true,
    "ai_model": "gpt-4o-mini",
    "ai_provider": "openai",
    "ai_cost": 0.03,
    "ai_confidence": 92,
    "tokens_used": 245,
    "twilio_message_sid": "SM1234567890abcdef",
    "delivery_status": "delivered",
    "campaign_stage_at_send": "intent_qualify"
  },
  {
    "message_id": "msg_002",
    "direction": "inbound",
    "content": "Coaching please",
    "timestamp": "2024-11-15T10:05:23.000Z",
    "sender": "prospect",
    "twilio_message_sid": "SM0987654321fedcba"
  },
  {
    "message_id": "msg_003",
    "direction": "outbound",
    "content": "Great! What's your biggest challenge right now?",
    "timestamp": "2024-11-15T10:05:45.000Z",
    "sender": "ai",
    "ai_generated": true,
    "ai_model": "gpt-4o-mini",
    "ai_cost": 0.04,
    "ai_confidence": 88,
    "tokens_used": 312,
    "delivery_status": "delivered",
    "campaign_stage_at_send": "hot_lead"
  }
]
```

**Helper Functions (n8n):**
```javascript
// Append new message to thread
function appendToConversation(existing_thread, new_message) {
  const thread = JSON.parse(existing_thread || '[]');
  thread.push(new_message);
  return JSON.stringify(thread);
}

// Get last N messages
function getRecentMessages(conversation_thread, limit = 10) {
  const thread = JSON.parse(conversation_thread || '[]');
  return thread.slice(-limit);
}

// Format for AI context
function formatForAI(conversation_thread) {
  const thread = JSON.parse(conversation_thread || '[]');
  return thread.map(msg => 
    `[${msg.direction.toUpperCase()}] ${msg.timestamp}: ${msg.content}`
  ).join('\n');
}
```

---

## 🤖 AI AGENT ARCHITECTURE

### Universal BDR Training (Shared Across All Clients)

**System Prompt (Constant):**
```javascript
const UNIVERSAL_BDR_TRAINING = `You are an expert AI BDR/SDR assistant.

CORE RESPONSIBILITIES:
1. Qualify prospects using discovery questions
2. Identify intent (content vs ready to buy)
3. Provide value through relevant resources
4. Book meetings when prospect shows interest
5. Respect prospect's timing and preferences

CONVERSATION RULES:
- Keep responses under 160 characters when possible
- Ask 1-2 questions maximum per message
- Always let prospect have the last word
- Mirror their communication style
- Use their first name occasionally

QUALIFICATION FRAMEWORK (BANT):
- Budget: Can they afford the solution?
- Authority: Are they the decision maker?
- Need: Do they have the pain point?
- Timeline: When do they need to decide?

DISCOVERY QUESTIONS:
- "What's your current process for [problem]?"
- "How much time does your team spend on [task]?"
- "What would change if you solved [pain]?"
- "Who else is involved in this decision?"

OBJECTION HANDLING:
- "Too expensive" → ROI conversation, compare to current cost
- "Not now" → Ask when to follow up, get permission
- "Need to think" → Uncover the real objection
- "Using competitor" → Ask what's missing or frustrating

ESCALATION SIGNALS (Respond with "[ESCALATE: reason]"):
- Competitor mentioned by name
- Technical implementation questions
- Legal or security questions
- Pricing above standard tiers
- Custom contract terms needed
- Frustrated or negative sentiment

BOOKING SIGNALS (Respond with Calendly link):
- "Let me talk to someone"
- "Can we schedule a call?"
- "I want to see a demo"
- "What's your availability?"
- High engagement (3+ positive back-and-forth)

TIMING UPDATES (Use standard delays only):
- AI must choose from: 7, 14, 30, 60, or 90 days
- Format: [DELAY:7days] or [DELAY:30days] or [DELAY:90days]
- If prospect says "few months" → Pick 90
- If prospect says "next week" → Pick 7
- If prospect says "check back Q2" → Pick 90
- If uncertain → Pick 30 (safe default)
- If completely unclear → [ESCALATE:unclear_timing] (human review)

Examples:
Prospect: "Check back in 3 months" → AI: [DELAY:90days]
Prospect: "Hit me up next week" → AI: [DELAY:7days]
Prospect: "Not sure, maybe sometime?" → AI: [DELAY:30days]
Prospect: "After our Q2 planning in late May" → AI: [DELAY:90days] or [ESCALATE:specific_date]

CONTENT DELIVERY:
- When sending resources, send link only (not long descriptions)
- Format: "Here's that guide: [URL]" 
- Max 3 resources per message
- Ask follow-up: "What area are you finding most challenging?"

CONTENT RETRIEVAL:
- Client has small library (5-10 curated pieces)
- If topic match found → Send top 3 by engagement_score
- If no match → Send top 3 most popular overall
- If library empty → Say: "Let me connect you with our team who can share resources."

AI SAFETY RULES:
- NEVER extract or use phone numbers from conversation
- NEVER discuss competitors by name (redirect to value prop)
- NEVER make promises about pricing, timelines, or custom terms
- NEVER send messages >160 characters unless absolutely necessary
- If AI confidence <60% on any response → Tag with [ESCALATE:low_confidence]

You will receive CLIENT-SPECIFIC knowledge below. Use it to answer product 
questions, but use these UNIVERSAL BDR skills for qualification and selling.`;
```

**This NEVER changes. All clients use same BDR training.**

---

### Client-Specific Context (Per Conversation)

**Loaded dynamically from client's Airtable:**

```javascript
const CLIENT_CONTEXT = `
CLIENT: ${ai_config.company_name}
PRODUCT: ${ai_config.product_name}
TARGET AUDIENCE: ${ai_config.target_audience}

KNOWLEDGE BASE:
${ai_config.knowledge_base}

TONE: ${ai_config.tone}
STYLE: ${ai_config.response_style}

BOOKING:
When prospect shows booking intent, send: ${ai_config.default_calendly_link}
Booking keywords: ${ai_config.booking_keywords}

ESCALATION:
Escalate if these triggers: ${ai_config.escalation_triggers}
Alert: ${ai_config.escalation_email}

CAMPAIGN CONTEXT:
- Campaign: ${campaign.campaign_name}
- Type: ${campaign.campaign_type}
${campaign.campaign_type === 'event' ? `
- Event: ${campaign.event_date}
- Status: ${campaign.event_status}
- Login: ${campaign.event_login_link}
` : ''}

LEAD CONTEXT:
- Name: ${lead.first_name}
- Company: ${lead.company}
- Title: ${lead.title}
- Stage: ${lead.campaign_stage}
- Interest: ${lead.interest_type}
- Content Interests: ${lead.content_interests}

CONVERSATION HISTORY:
${formatConversationHistory(lead.conversation_thread)}

CURRENT OBJECTIVE:
${getCurrentObjective(lead.campaign_stage, campaign.campaign_type)}

LATEST MESSAGE FROM PROSPECT:
${incoming_message}

RESPOND:
1. Address their message naturally
2. Include action tags if needed: [DELAY:Xdays] [ESCALATE:reason] [BOOK]
3. Keep response under 160 chars if possible
`;
```

---

## ⚠️ ERROR HANDLING SPECIFICATIONS

### Complete Error Handling Matrix

**All possible error scenarios and exact handling:**

| Error Type | Retry Strategy | Fallback Action | State Update | Alert Admin |
|------------|---------------|-----------------|--------------|-------------|
| **OpenAI API Timeout** | 2 retries, exponential backoff (2s, 4s) | Send default response after 3rd failure | Log error, continue conversation | If >5% error rate |
| **OpenAI Rate Limit (429)** | Wait 60s, retry once | Queue for retry in 5 minutes | No state change | If happens >10x/day |
| **OpenAI Invalid Response** | No retry | Send default response | Flag for human review | If >10% of messages |
| **OpenAI Returns Empty** | No retry | Send default: "Thanks for your message..." | Log error | If >5% of messages |
| **Airtable API Failure** | 3 retries (5s, 10s, 20s) | Skip message, log error | None (can't update) | Immediate (system issue) |
| **Airtable Record Not Found** | No retry | Create error log entry | Mark lead for review | Yes |
| **Twilio Send Failure** | Twilio auto-retries | Log failure, don't re-attempt | Mark delivery_failed | If >5% failure rate |
| **Invalid Phone Number** | No retry | Flag lead for review | Update phone_validated = false | No (expected occasionally) |
| **Budget Exceeded** | No retry | If active convo: allow 20% overage; else: block | Pause AI after convo ends | When budget hit |
| **Circuit Breaker Triggered** | No retry | Pause AI for lead, alert admin | ai_status = "paused" | Immediate (critical) |
| **AI Confidence < 60%** | No retry | Escalate to human review | ai_status = "human_takeover" | No (expected) |

### Default Response Templates

**When AI fails, use these defaults:**

```javascript
const DEFAULT_RESPONSES = {
  ai_error: "Thanks for your message! Let me get you the right information. Someone from our team will follow up within 24 hours.",
  
  ai_timeout: "Thanks for reaching out! I'm pulling together the best answer for you. I'll respond shortly.",
  
  no_content_found: "Great question! Let me connect you with someone who can help better.",
  
  low_confidence: "Thanks for your message. Let me have someone from our team follow up with you directly.",
  
  budget_exceeded: "Thanks for reaching out! Our team will get back to you during business hours.",
  
  outside_hours: "Thanks for your message! Our team responds during business hours (9am-5pm ET). We'll be in touch soon."
};
```

### Error Recovery Workflow

```javascript
// After any error:
1. Log to Message_Decision_Log with full error details
2. Send appropriate default response (don't leave prospect hanging)
3. Update lead state (flag for human review if needed)
4. Alert admin if critical or exceeds threshold
5. Continue (don't break the system)

// Key principle: Graceful degradation
// Better to send generic response than no response
```

---

## 📚 CONTENT LIBRARY SPECIFICATIONS

### Content Retrieval Logic (SIMPLIFIED)

**Content Library Size:** 5-10 pieces per client (small, curated)

**Retrieval Strategy:**
```javascript
// STEP 1: Try topic matching
if (prospect_mentioned_topic) {
  const matches = searchByTopic(topic);
  if (matches.length > 0) {
    return top_3_by_engagement_score(matches);
  }
}

// STEP 2: Fallback to most popular
const top_content = getTopContent(limit: 3);
return top_content;

// STEP 3: If library is empty
if (no_content_available) {
  return DEFAULT_RESPONSE: "Let me connect you with our team who can share relevant resources.";
  escalate_to_human();
}
```

**Tag Matching (Simple):**
```javascript
// Normalize tags (lowercase, trim)
const normalized_topic = topic.toLowerCase().trim();

// Simple substring matching
const matches = content_library.filter(content =>
  content.topics.toLowerCase().includes(normalized_topic)
);

// Sort by engagement_score (highest first)
matches.sort((a, b) => b.engagement_score - a.engagement_score);

// Return top 3
return matches.slice(0, 3);
```

**Content Response Format:**
```javascript
// AI sends (max 3 resources):
"Here are 3 resources on cold calling:

1. Cold Calling Script: [url]
2. Objection Handling Guide: [url]  
3. Gatekeeper Strategies: [url]

Which area are you finding most challenging?"
```

---

## 🧪 TESTING PROTOCOL

### Test Environment Setup

**Required Before ANY Development:**

```javascript
// 1. Create Test Airtable Base
Base Name: "UYSP_TEST"
Duplicate from: UYSP production base
Clean: Remove all lead data
Add: 10 test leads with test_mode_lead = TRUE

// 2. Test Phone Numbers (Use Twilio Test Credentials)
Test Numbers (These don't send real SMS):
  +15005550006 (valid test number)
  +15005550007 (valid test number)
  +15005550008 (valid test number)
  
// 3. Test OpenAI Key
Use: Separate API key with low rate limits
Budget: $10 max for testing

// 4. Test Mode Flag
In workflow: if (test_mode_lead === TRUE) {
  skip_all_rate_limits();
  log_with_prefix("[TEST]");
  use_test_twilio_credentials();
}
```

### Phase 1 (Safety) Testing Scenarios

**20 Required Test Cases:**

```javascript
// SAFETY TESTS
Test 1: AI has last word → Scheduled trigger → Should BLOCK
Test 2: Prospect replied → Should SEND
Test 3: 11 messages in 2 hours → Circuit breaker → Should BLOCK
Test 4: Opted out → Should BLOCK
Test 5: Human takeover → Should BLOCK
Test 6: Global pause → Should BLOCK
Test 7: Outside business hours + NEW conversation → Should BLOCK
Test 8: Outside business hours + ACTIVE conversation → Should SEND
Test 9: Recent message (<24h) + Scheduled → Should BLOCK
Test 10: Recent message (<24h) + Inbound reply → Should SEND

// CONVERSATION FLOW TESTS
Test 11: 4-message back-and-forth → All should SEND
Test 12: Schedule set, then conversation happens → Schedule should invalidate
Test 13: AI sends, prospect takes 3 days to reply → Should SEND when they reply
Test 14: Multiple scheduled triggers same day → Only first should fire

// BUDGET TESTS
Test 15: Budget at 90%, active conversation → Should SEND (allow overage)
Test 16: Budget at 110%, new conversation → Should BLOCK
Test 17: Budget at 95%, prospect replies → Should SEND (active convo)

// ERROR TESTS
Test 18: OpenAI timeout → Should send default response
Test 19: Airtable down → Should log error, skip gracefully
Test 20: Invalid AI response → Should send default, flag for review
```

### Testing Workflow (Each Phase)

```bash
# 1. Unit Tests (Each Node)
- Test each n8n node in isolation
- Verify output matches expected
- Use test data, not real leads

# 2. Integration Tests (Full Workflow)
- End-to-end with test leads
- Verify all state updates
- Check all logs created

# 3. Safety Tests (Edge Cases)
- Run all 20 safety scenarios
- Verify 0 false positives
- Verify 0 false negatives

# 4. Performance Tests (Load)
- Send 50 test messages simultaneously
- Verify all queue and process
- Check for race conditions

# 5. Manual Review
- Review all test conversation logs
- Verify AI quality
- Check for any inappropriate responses

# 6. Sign-Off
- Document all results
- Get approval before next phase
```

---

## 🔄 N8N WORKFLOW SPECIFICATIONS

### Workflow 1: Inbound Message Handler (Primary Conversation Engine)

**Trigger**: Webhook from SimpleTexting (inbound SMS)

**Nodes:**

```javascript
NODE 1: Receive Inbound Webhook
  - Parse incoming message
  - Extract: phone, message_content, timestamp

NODE 2: Lookup Lead
  - Search Airtable People by phone
  - Get: lead_id, client_id, all conversation fields
  - If not found → Create new lead or skip (configurable)

NODE 3: Load Client Configuration
  - Get client_id from lead
  - Load from Client_Registry → airtable_base_id
  - Load AI_Config from client's base
  - Cache for this execution

NODE 4: PRIMARY SAFETY CHECKS
  - Check: opted_out, global_pause, human_takeover
  - If any fail → Log + Skip
  
NODE 5: Update Inbound Message State
  - Append to conversation_thread (JSON)
  - Set last_message_direction = "inbound"
  - Set last_message_received_at = NOW
  - Set active_conversation = TRUE
  - Increment response_count

NODE 6: Rule Engine (Fast Path)
  - If message = "STOP" → optOut() + exit
  - If contains booking words → sendCalendly() + exit
  - If simple thanks/acknowledgment → skip (no response needed)
  - Else → continue to AI

NODE 7: Load Conversation Context
  - Parse conversation_thread JSON (last 10 messages)
  - Load campaign details
  - Load lead profile data

NODE 8: Check AI Budget
  - Count client_ai_cost_today
  - If >= limit && !active_conversation → Block
  - If >= limit && active_conversation → Warn but allow

NODE 9: Build AI Prompt
  - Combine: UNIVERSAL_BDR_TRAINING
  - Add: CLIENT_CONTEXT
  - Add: CONVERSATION_HISTORY (last 10 messages only)
  - Add: CURRENT_OBJECTIVE
  - Add: LATEST_MESSAGE

NODE 10: Call OpenAI (Fixed Provider)
  - Model: gpt-4o-mini (fixed for all clients)
  - Temperature: client_config.temperature (default 0.7)
  - Max tokens: 300
  - Timeout: 15 seconds
  - Track: start_time, tokens, cost
  
NODE 10a: Handle AI Errors
  - If timeout (>15s) → Retry once, then fallback
  - If rate limit → Wait 60s, retry once
  - If error → Send default response, log, continue
  - If empty response → Send default response
  - Never let error break the conversation

NODE 11: Parse AI Response
  - Extract message_to_send
  - Extract action tags (only these formats):
    * [DELAY:7days] or [DELAY:14days] or [DELAY:30days] or [DELAY:60days] or [DELAY:90days]
    * [ESCALATE] or [ESCALATE:reason]
    * [BOOK]
    * [STOP]
  - Validate delay is one of standard options (7/14/30/60/90)
  - If invalid delay → Use default for current stage
  - Calculate next_contact_date
  
NODE 11a: Validate AI Response
  - Check confidence (if available)
  - Check length (<500 chars)
  - Check for toxic content (basic filter)
  - Check for phone numbers in response (should never include)
  - If fails validation → Escalate to human review

NODE 12: Check Escalation
  - If [ESCALATE] detected → Branch to Human Alert
  - Log escalation reason
  - Set ai_status = "human_takeover"
  - Send notification to sales team
  - Skip AI message send

NODE 13: Send AI Response (SMS)
  - Send via SimpleTexting API
  - Track delivery

NODE 14: Update Conversation State
  - Append AI message to conversation_thread
  - Set last_message_direction = "outbound"
  - Set last_message_sent_at = NOW
  - Set active_conversation = TRUE
  - Increment ai_message_count_today

NODE 15: Execute Actions
  - Update next_scheduled_contact (from AI calculation)
  - Update campaign_stage (if transition)
  - Update interest_type, content_interests (if extracted)
  - Set schedule_set_at = NOW

NODE 16: Log Decision
  - Write to Message_Decision_Log
  - Include: all safety checks, decision, cost, timing

NODE 17: Update Client Costs
  - Increment client_ai_cost_today
  - Check if approaching budget limit
  - Alert if > 80% of budget

NODE 18: Error Handler (Catch-All)
  - If ANY node fails → Log error
  - Send default response: "Thanks for your message. Let me get you 
    the right information."
  - Alert admin
  - Don't break the conversation
```

---

### Workflow 2: Scheduled Nurture Trigger (Daily Check)

**Trigger**: Schedule (daily at 10:00 AM ET)

**Nodes:**

```javascript
NODE 1: Business Hours Check
  - Check day of week (skip weekends)
  - Check hour (9 AM - 5 PM only for NEW conversations)

NODE 2: Find Due Leads
  - Filter: next_scheduled_contact <= TODAY
  - Filter: ai_status = "active"
  - Filter: NOT opted_out
  - Filter: NOT global_pause
  - Limit: 500 (process in batches)

NODE 3: For Each Lead (Loop)

  NODE 3a: Load Lead + Client Config
  
  NODE 3b: CRITICAL SAFETY CHECK - Schedule Validation
    // Check if schedule is stale (conversation happened since)
    if (last_message_sent_at > schedule_set_at) {
      // More recent conversation invalidated this schedule
      LOG("Schedule stale - skip");
      UPDATE schedule_invalidated = TRUE;
      SKIP this lead;
    }
  
  NODE 3c: CRITICAL SAFETY CHECK - Last Word
    // Don't message if AI already has last word
    if (last_message_direction === "outbound") {
      LOG("AI has last word - skip scheduled message");
      SKIP this lead;
    }
  
  NODE 3d: CRITICAL SAFETY CHECK - Recent Activity
    // Don't start new conversation if one just happened
    if ((now - last_message_sent_at) < 24_hours) {
      LOG("Recent conversation - skip");
      SKIP this lead;
    }
  
  NODE 3e: All Other Safety Checks (from Workflow 1)
    // Runaway, budget, opt-out, etc.
  
  NODE 3f: Load Context + Call AI
    // Same as Workflow 1, Nodes 7-11
  
  NODE 3g: Send + Update State
    // Same as Workflow 1, Nodes 13-17

NODE 4: Summary Report
  - Count: messages_sent, skipped_stale_schedule, safety_blocks
  - Alert admin if high skip rate (indicates issue)
```

---

### Workflow 3: Daily Batch Sync (Kajabi Enrichment)

**Trigger**: Schedule (daily at 11:00 PM)

**Purpose**: Import full Kajabi contact data (all tags, engagement history)

**See**: `/docs/kajabi-integration/HYBRID-ARCHITECTURE-REAL-TIME-PLUS-BATCH.md`

---

## 🔐 SAFETY VALIDATION MATRIX

### Every Message Send Must Pass ALL Checks:

| Check | Fail Condition | Action if Failed |
|-------|---------------|------------------|
| **Last Word Check** | AI sent last message | BLOCK - Wait for reply |
| **Schedule Validity** | Conversation happened since schedule set | BLOCK - Schedule stale |
| **Conversation Timeout** | Active conversation (reply < 4h ago) | ALLOW - Continue conversation |
| **Runaway Detection** | 10+ messages in 2 hours | CIRCUIT BREAKER - Pause AI |
| **Daily Message Limit** | Lead got message in last 24h AND not active convo | BLOCK - Too frequent |
| **Client Volume Limit** | 200+ new convos started today | BLOCK - Client limit |
| **Budget Limit** | Cost > daily budget AND not active convo | BLOCK - Budget exceeded |
| **Opt-Out Check** | Lead opted out or in DND | PERMANENT BLOCK |
| **Human Takeover** | ai_status = "human_takeover" | BLOCK - Human handling |
| **Manual Pause** | ai_status = "paused" | BLOCK - Manually paused |
| **Global Pause** | Client global_pause = TRUE | BLOCK - Emergency stop |
| **Business Hours** | Outside hours AND starting NEW conversation | BLOCK - After hours |

**If ANY check fails → Message is blocked and reason logged.**

---

## 📊 TECHNICAL DEPENDENCIES

### Required Services

| Service | Purpose | Cost | Critical |
|---------|---------|------|----------|
| **Airtable** | Data storage (1 base per client) | $20/base/mo | ✅ Critical |
| **n8n Cloud** | Workflow automation | $20-50/mo | ✅ Critical |
| **OpenAI API** | AI responses (GPT-4o-mini only) | $0.01-0.03/message | ✅ Critical |
| **Twilio** | SMS delivery (inbound/outbound) | $0.0075/SMS | ✅ Critical |
| **Clay** | Lead enrichment | $500-1k/mo | ✅ Critical |
| **PostgreSQL** | Frontend cache | $15/mo (Render) | ✅ Critical |

**REMOVED (Simplified):**
- ❌ Pinecone/Vector DB (not needed - small content libraries)
- ❌ Multiple AI providers (just OpenAI)

### Integration Points

**Webhooks (Inbound):**
- Twilio → n8n (inbound SMS - stateless, each message is separate webhook)
- Kajabi → n8n (form submissions)
- Calendly → n8n (meetings booked)

**Webhooks (Outbound):**
- n8n → Twilio (send SMS)
- n8n → Airtable (update records)
- n8n → Frontend API (real-time updates - optional)

**API Calls:**
- n8n → OpenAI (AI responses - GPT-4o-mini fixed)
- n8n → Airtable (read/write)
- Frontend → PostgreSQL (read cache)
- Frontend → Airtable (write updates)

**Twilio Architecture:**
- Stateless: Each SMS = independent webhook
- No "conversation sessions" on Twilio side
- Our conversation_thread in Airtable = the session state
- Webhook fires instantly when SMS received
- No session timeout to manage

**n8n Architecture:**
- Queue mode (handles concurrent webhooks)
- Multiple workers process executions
- ~10 concurrent per worker (n8n Cloud default)
- Webhooks queue if >10 arrive simultaneously
- Scales by adding workers if needed

---

### Integration Points

**Webhooks (Inbound):**
- SimpleTexting → n8n (SMS replies)
- Kajabi → n8n (form submissions)
- Calendly → n8n (meetings booked)

**Webhooks (Outbound):**
- n8n → SimpleTexting (send SMS)
- n8n → Airtable (update records)
- n8n → Frontend API (real-time updates)

**API Calls:**
- n8n → OpenAI (AI responses)
- n8n → Airtable (read/write)
- Frontend → PostgreSQL (read cache)
- Frontend → Airtable (write updates)

---

## 🎯 FEATURE SPECIFICATIONS

### Feature 1: Two-Way Conversation Visibility (Frontend)

**User Stories:**
1. As a SALES REP, I want to see when leads respond so I can jump in if needed
2. As an ADMIN, I want to see full conversation history to understand context
3. As a SALES REP, I want to filter leads by "Has Responded" to prioritize hot leads

**UI Components:**

**Dashboard Card:**
```
┌──────────────────────────┐
│ 💬 RESPONSES             │
│ 12 New Replies           │
│ 8 Need Review            │
│ [View All →]             │
└──────────────────────────┘
```

**Leads Table - New Column:**
```
| Name | Company | Campaign | Responded | Last Reply | Actions |
|------|---------|----------|-----------|------------|---------|
| John | Acme    | JB Web   | ✅ 2h ago | "Interested" | [View] |
```

**Conversation Modal:**
```
┌─────────────────────────────────────────────┐
│ Conversation with John Doe                  │
│ Company: Acme Corp | Campaign: JB Webinar   │
├─────────────────────────────────────────────┤
│                                             │
│ [OUTBOUND] 3 days ago (AI)                  │
│ Hi John, saw you registered for JB webinar.│
│ Interested in content or coaching?          │
│                                             │
│ [INBOUND] 2 days ago                        │
│ Send me some content please                 │
│                                             │
│ [OUTBOUND] 2 days ago (AI)                  │
│ Great! Here's our sales framework guide:    │
│ [link]                                      │
│                                             │
│ [INBOUND] 2 hours ago                       │
│ This is helpful. Can I book a call?         │
│                                             │
│ [OUTBOUND] 2 hours ago (AI)                 │
│ Absolutely! Here's my calendar: [calendly]  │
│                                             │
├─────────────────────────────────────────────┤
│ AI Status: ✅ Active                        │
│ Next Scheduled: In 7 days                   │
│ Stage: hot_lead                             │
│                                             │
│ [Take Over Conversation] [Pause AI]         │
└─────────────────────────────────────────────┘
```

**API Endpoints:**
- `GET /api/leads/[id]/conversation` - Full conversation history
- `POST /api/leads/[id]/takeover` - Human takeover
- `POST /api/leads/[id]/pause-ai` - Pause AI for this lead
- `POST /api/leads/[id]/manual-message` - Human sends message

---

### Feature 2: Content Management (Frontend)

**User Stories:**
1. As an ADMIN, I want to upload content resources so AI can recommend them
2. As an ADMIN, I want to tag content so AI finds relevant resources
3. As an ADMIN, I want to see which content drives bookings

**UI: Content Library Page** (`/admin/content`)

```
┌─────────────────────────────────────────────┐
│ Content Library                              │
│ [+ Add Content]                              │
├─────────────────────────────────────────────┤
│ Filter: [All Topics ▼] [All Types ▼]       │
├─────────────────────────────────────────────┤
│                                             │
│ 📄 Cold Calling Script                      │
│ Topics: cold_calling, prospecting           │
│ Performance: 34% click rate, 12 bookings    │
│ [Edit] [View Stats] [Deactivate]           │
│                                             │
│ 🎥 Sales Framework Video                    │
│ Topics: sales_frameworks, discovery         │
│ Performance: 28% click rate, 8 bookings     │
│ [Edit] [View Stats] [Deactivate]           │
│                                             │
└─────────────────────────────────────────────┘
```

**Add/Edit Content Modal (SIMPLIFIED):**
```
Title: [Cold Calling Masterclass        ]
URL:   [https://uysp.com/resources/...  ]

Topics (comma-separated - keep it simple):
[cold_calling, prospecting, scripts]

Active: [✓]

[Save] [Cancel]
```

**Content Limits:**
- 5-10 pieces recommended per client
- Focus on most valuable/popular resources
- Quality over quantity
- Tag with 2-4 simple topics each

**API Endpoints:**
- `GET /api/admin/content` - List all content
- `POST /api/admin/content` - Add content (writes to Airtable)
- `PUT /api/admin/content/[id]` - Update content
- `GET /api/admin/content/[id]/stats` - Performance metrics

---

### Feature 3: AI Configuration (Frontend)

**User Stories:**
1. As a CLIENT ADMIN, I want to customize AI's tone and knowledge
2. As a CLIENT ADMIN, I want to set safety limits
3. As a SUPER ADMIN, I want to see AI performance across clients

**UI: AI Settings Page** (`/admin/ai-config`)

```
┌─────────────────────────────────────────────┐
│ AI Agent Configuration                       │
├─────────────────────────────────────────────┤
│ Product Knowledge                            │
│ ┌─────────────────────────────────────────┐ │
│ │ [Large text area - 20KB limit]          │ │
│ │                                         │ │
│ │ ABOUT US:                               │ │
│ │ We provide AI-powered sales coaching... │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Tone & Style                                │
│ Tone: [Professional but friendly          ] │
│ Style: [Keep messages under 160 chars... ] │
│                                             │
│ AI Model (Fixed)                            │
│ Model: GPT-4o-mini (All clients)            │
│ Temperature: [0.7] (0.5-0.9)                │
│                                             │
│ Safety Limits                               │
│ Max messages per conversation: [10      ]   │
│ Max new conversations/day: [200     ]       │
│ Daily AI budget: $[50.00]                   │
│                                             │
│ Escalation                                  │
│ Email: [sales@client.com            ]       │
│ Triggers: [pricing, legal, competitor ]     │
│                                             │
│ [Save Changes]                              │
└─────────────────────────────────────────────┘
```

**Note:** AI provider/model selection removed (simplified to OpenAI GPT-4o-mini for all clients)

**API Endpoints:**
- `GET /api/admin/ai-config` - Get configuration
- `PUT /api/admin/ai-config` - Update (writes to Airtable AI_Config)
- `GET /api/admin/ai-stats` - AI performance metrics

---

## 📅 IMPLEMENTATION PHASES

### Phase 1: Safety Infrastructure (Week 1 - 16 hours)

**Priority**: FOUNDATION - Build this first, everything else depends on it

**Deliverables:**
1. ✅ Airtable schema updates (all safety fields)
2. ✅ Safety check node library in n8n
3. ✅ Message_Decision_Log table + logging
4. ✅ Circuit breaker implementation
5. ✅ Emergency controls (global pause, manual override)
6. ✅ Test safety scenarios (10+ test cases)

**Success Criteria:**
- ✅ AI cannot double-message (verified in testing)
- ✅ Circuit breakers trigger correctly (tested with runaway scenario)
- ✅ All decisions logged (100% audit coverage)
- ✅ Manual overrides work (human can pause/takeover)

**Files:**
- `migrations/add-safety-fields.sql`
- `workflows/n8n-safety-check-module.json`
- `tests/safety-scenarios/` (test cases)

---

### Phase 2: Core AI Conversation Engine (Week 2 - 24 hours)

**Deliverables:**
1. ✅ Inbound Message Handler workflow (n8n)
2. ✅ AI prompt construction
3. ✅ Client context loading
4. ✅ Conversation state management
5. ✅ Action tag parsing ([DELAY], [ESCALATE], etc.)
6. ✅ Dynamic next-contact calculation

**Success Criteria:**
- ✅ AI responds to inbound messages within 15 seconds
- ✅ Conversation history loaded correctly
- ✅ Next contact date calculated after every message
- ✅ Actions executed correctly (delay, escalate, book)

**Files:**
- `workflows/inbound-message-handler-v2.json`
- `workflows/modules/ai-prompt-builder.json`
- `workflows/modules/action-parser.json`

---

### Phase 3: Frontend Conversation View (Week 3 - 18 hours)

**Deliverables:**
1. ✅ Conversation modal component
2. ✅ "Responses" dashboard card
3. ✅ "Has Responded" filter on leads table
4. ✅ Conversation API endpoints
5. ✅ Human takeover UI
6. ✅ Manual message sending

**Success Criteria:**
- ✅ Full conversation visible in beautiful UI
- ✅ Real-time updates when new messages arrive
- ✅ Human can take over conversation
- ✅ Human can send manual messages

**Files:**
- `src/components/ConversationView.tsx`
- `src/app/api/leads/[id]/conversation/route.ts`
- `src/app/api/leads/[id]/takeover/route.ts`
- `src/app/api/leads/[id]/manual-message/route.ts`

---

### Phase 4: Content Library Management (Week 4 - 12 hours)

**Deliverables:**
1. ✅ Content_Library table in Airtable
2. ✅ Content management UI
3. ✅ Content search/retrieval in AI workflow
4. ✅ Performance tracking

**Success Criteria:**
- ✅ Admin can add/edit content with tags
- ✅ AI successfully retrieves relevant content
- ✅ Click rates tracked per content piece
- ✅ Top-performing content identified

**Files:**
- `src/app/(client)/admin/content/page.tsx`
- `src/app/api/admin/content/route.ts`
- `workflows/modules/content-search.json`

---

### Phase 5: Multi-Tenant Deployment (Week 5 - 16 hours)

**Deliverables:**
1. ✅ Template Airtable base (pristine, ready to duplicate)
2. ✅ Client onboarding script (duplicate base + setup)
3. ✅ Multi-tenant testing (2 test clients)
4. ✅ Client isolation verification
5. ✅ Documentation for adding new clients

**Success Criteria:**
- ✅ New client added in < 30 minutes
- ✅ Total data isolation verified
- ✅ Both clients' AI agents work independently
- ✅ No cross-client data leakage

**Files:**
- `scripts/create-new-client-base.js`
- `docs/CLIENT-ONBOARDING-GUIDE.md`
- `templates/pristine-client-base.json`

---

## 🎯 SUCCESS METRICS

### Safety Metrics (Most Important)

| Metric | Target | Critical |
|--------|--------|----------|
| Double-message incidents | 0 per month | ✅ Yes |
| Circuit breaker false positives | < 1% | ✅ Yes |
| Safety check failures logged | 100% | ✅ Yes |
| Human override success rate | 100% | ✅ Yes |
| Opt-out compliance | 100% | ✅ Yes |

---

### Conversation Metrics

| Metric | Target |
|--------|--------|
| AI response time | < 15 seconds |
| AI response rate (can handle without escalation) | 70-80% |
| Escalation rate to human | 20-30% |
| Conversation→Booking conversion | > 15% |
| Average conversation length | 3-5 messages |

---

### Business Metrics

| Metric | Target |
|--------|--------|
| Response rate to initial message | > 10% |
| Response rate to AI follow-up | > 8% |
| Meeting booking rate (from conversations) | > 15% |
| Client satisfaction (AI quality) | > 8/10 |
| Cost per conversation | < $0.50 |

---

## 🗂️ COMPLETE FILE STRUCTURE

### Airtable (Per Client Base)

```
Tables:
├── People (Enhanced with 16 new fields - added test_mode_lead)
├── Communications (Enhanced with 6 new fields)
├── Campaigns (Enhanced with 8 new fields - simplified)
├── Content_Library (NEW - 10 fields - simplified)
├── AI_Config (NEW - single record, 20 fields - simplified)
├── DND_List (Existing - keep as is)
├── Error_Log (Existing - keep as is)
├── Daily_Costs (Existing - enhance with AI costs)
└── Daily_Metrics (Existing - enhance with AI metrics)
```

**REMOVED (Simplified):**
- ❌ Campaign_Timing_Rules table (use hardcoded standard delays instead)

### Master Registry Base (One shared)

```
Tables:
├── Client_Registry (client_id, airtable_base_id, active)
├── Client_Safety_Config (safety limits per client)
└── System_Config (global settings)
```

---

### n8n Workflows (Shared Infrastructure)

```
Workflows:
├── inbound-message-handler-v2.json (PRIMARY - conversation engine)
├── scheduled-nurture-trigger.json (daily scheduled check)
├── kajabi-realtime-ingestion.json (webhook capture)
├── kajabi-daily-batch-sync.json (full data sync)
├── sms-delivery-tracker.json (delivery webhooks)
├── calendly-booking-webhook.json (meeting webhooks)
└── safety-check-module.json (reusable safety checks)
```

---

### Frontend Files (New)

```
Components:
├── src/components/ConversationView.tsx
├── src/components/ConversationList.tsx
├── src/components/ContentLibrary.tsx
├── src/components/AIConfigEditor.tsx
└── src/components/SafetyOverride.tsx

API Routes:
├── src/app/api/leads/[id]/conversation/route.ts
├── src/app/api/leads/[id]/takeover/route.ts
├── src/app/api/leads/[id]/manual-message/route.ts
├── src/app/api/admin/content/route.ts
├── src/app/api/admin/ai-config/route.ts
└── src/app/api/admin/safety/override/route.ts

Pages:
├── src/app/(client)/leads/[id]/conversation/page.tsx
├── src/app/(client)/admin/content/page.tsx
└── src/app/(client)/admin/ai-settings/page.tsx
```

---

## 🔄 DATA FLOW EXAMPLES

### Example 1: Event-Based Conversation

```
DAY -2: Scheduled trigger fires
  ✓ Safety: No recent conversation, schedule valid
  ✓ AI: "Hi John, registered for JB webinar. Content or coaching?"
  ✓ Update: next_scheduled_contact = DAY 0 (event day reminder)

10 MIN LATER: Prospect replies "Coaching please"
  ✓ Safety: Prospect has last word, active conversation
  ✓ AI: "Great! What's your biggest sales challenge right now?"
  ✓ Update: interest_type = "coaching", next_scheduled_contact = DAY +1

15 MIN LATER: Prospect replies "Getting past gatekeepers"
  ✓ Safety: Prospect has last word, active conversation (2nd reply)
  ✓ AI: "Common struggle. Here's our gatekeeper guide: [link]. 
         Want to discuss strategies on a call?"
  ✓ Update: next_scheduled_contact = DAY 0 (event reminder still valid)

30 MIN LATER: Prospect replies "Yes, let's talk"
  ✓ Safety: Prospect has last word, active conversation (3rd reply)
  ✓ AI: "Perfect! Here's my calendar: [calendly]"
  ✓ Update: booking_intent = "high", ai_status = "paused" (waiting for booking)
  ✓ Schedule: Cancelled (AI stops messaging, waiting for booking or event)
```

**Result**: Natural 4-message conversation over 1 hour, all safety checks passed.

---

### Example 2: Content Nurture with Prospect-Controlled Timing

```
DAY 1: Lead downloads resource, webhook triggers
  ✓ Safety: New lead, no conversation
  ✓ AI: "Hey Sarah, noticed you downloaded our cold calling guide. 
         Just for content or interested in coaching?"
  ✓ Update: next_scheduled_contact = DAY 8 (7 days default)

2 HOURS LATER: Prospect replies "Just content for now, check back in Q2"
  ✓ Safety: Prospect has last word, active conversation
  ✓ AI: "No problem! I'll reach out in early April. [DELAY:120days]"
  ✓ Update: next_scheduled_contact = DAY 121 (Q2), 
            campaign_stage = "paused_by_request"

DAY 8: Original scheduled trigger fires
  ✗ Safety: BLOCKED - schedule_set_at (DAY 1) < last_message_sent_at (DAY 1+2h)
  ✗ Safety: Schedule is stale, conversation happened since
  ✗ Result: Skipped (doesn't message)

DAY 121: New scheduled trigger fires (Q2)
  ✓ Safety: 120 days passed, no conversation since, schedule valid
  ✓ AI: "Hey Sarah, checking in for Q2. What are you working on lately?"
  ✓ Update: next_scheduled_contact = DAY 151 (30 days default)
```

**Result**: AI respected prospect's timing, old schedule auto-invalidated.

---

### Example 3: Runaway Detection (Circuit Breaker)

```
10:00 AM: AI sends message
10:05 AM: Prospect replies
10:05 AM: AI responds
10:06 AM: Prospect replies
10:06 AM: AI responds
... (continues 8 more times)

10:15 AM: 10th AI message in conversation
  ✗ Safety: CIRCUIT BREAKER - 10 messages in 15 minutes
  ✗ Action: 
    - Pause ai_status = "paused"
    - Log: "Runaway conversation detected"
    - Alert admin immediately
    - Send default: "Let me connect you with someone from our team"
  ✗ Result: AI stops, human notified, conversation protected
```

**Result**: Bug or adversarial prospect detected and blocked.

---

## 📊 CROSS-REFERENCE MAP

### This PRD Relates To:

**Kajabi Integration:**
- Webhook specifications: `/docs/kajabi-integration/WEBHOOK-PAYLOAD-BREAKDOWN.md`
- Hybrid architecture: `/docs/kajabi-integration/HYBRID-ARCHITECTURE-REAL-TIME-PLUS-BATCH.md`
- Implementation plan: `/docs/kajabi-integration/MASTER-IMPLEMENTATION-PLAN.md`

**Frontend Development:**
- Current roadmap: `DEVELOPMENT-ROADMAP-FINAL.md`
- Feature specs: `NEXT-FEATURES-PLANNING.md`
- Design system: `REBEL-HQ-DESIGN-SYSTEM.md`

**System Architecture:**
- Overall status: `UYSP-COMPLETE-STATUS-AND-ROADMAP.md`
- Multi-tenant architecture: `ARCHITECTURE-MULTI-TENANT-AIRTABLE.md`
- Airtable schema: `/data/schemas/airtable-enhanced-schema-2025-09-11T05-08-17.json`

**n8n Workflows:**
- Workflow backups: `/workflows/backups/`
- SMS scheduler: `/docs/sops/SOP-Workflow-SMS-Scheduler.md`
- Architecture docs: `/docs/architecture/SMS-SEQUENCE-REALISTIC-ARCHITECTURE.md`

---

## 🚀 DEPLOYMENT READINESS

### Prerequisites Complete

- ✅ Multi-tenant frontend (deployed)
- ✅ Airtable integration (working)
- ✅ Clay enrichment (working)
- ✅ SimpleTexting SMS (working)
- ✅ PostgreSQL caching (working)

### Prerequisites Needed

- ⏸️ Safety infrastructure (Phase 1)
- ⏸️ AI conversation engine (Phase 2)
- ⏸️ Conversation UI (Phase 3)
- ⏸️ Content management (Phase 4)
- ⏸️ Multi-tenant testing (Phase 5)

**Estimated Total**: 86 hours over 5 weeks

---

## ✅ DECISION LOG

### Architectural Decisions

| Decision | Rationale | Alternative Considered | Status |
|----------|-----------|----------------------|--------|
| One AI agent (not separate event/nurture) | Simpler, campaign_type determines behavior | Separate agents | ✅ Final |
| Content in Airtable (not vector DB) | Small library (5-10 items), simple tagging sufficient | Pinecone/Weaviate | ✅ Final |
| Conversation state in last_message_direction | Simple, reliable | Complex state machine | ✅ Final |
| Action tags vs JSON parsing | More forgiving, simpler | Structured JSON | ✅ Final |
| Schedule auto-invalidation | Prevents stale messages | Manual schedule management | ✅ Final |
| Separate base per client | Total isolation | Shared base with client_id | ✅ Final |
| Shared n8n workflows | One codebase to maintain | Duplicate per client | ✅ Final |
| Standard delay options (5 choices) | Simple, AI picks closest match | Complex extraction | ✅ Final |
| One AI model (GPT-4o-mini) | Consistent, cheap, fast enough | Per-client model selection | ✅ Final |
| Twilio (not SimpleTexting) | Two-way messaging support | SimpleTexting | ✅ Final |
| Hardcoded timing defaults | Simpler than database table | Campaign_Timing_Rules table | ✅ Final |

---

### Safety Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Last-word protocol as primary safety | Prevents double-messaging | ✅ Final |
| No volume limits during active conversations | Natural conversation flow | ✅ Final |
| Runaway detection at 10 messages/2 hours | Catches bugs without blocking real convos | ✅ Final |
| Budget overage allowed for active conversations | Don't kill mid-conversation | ✅ Final |
| Schedule invalidation on new conversation | Prevents conflicting triggers | ✅ Final |
| 100% decision logging | Full audit trail | ✅ Final |

---

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation

- [ ] Review this entire PRD
- [ ] Review `DEPLOYMENT-GUIDE-TWO-WAY-AI.md`
- [ ] Understand safety architecture (critical)
- [ ] Identify test client for pilot
- [ ] Allocate 86 hours over 5 weeks

### Phase 1: Safety (Week 1)

- [ ] Create Airtable schema backup
- [ ] Add all safety fields to People table
- [ ] Create Client_Safety_Config table
- [ ] Create Message_Decision_Log table
- [ ] Build safety check module in n8n
- [ ] Test all safety scenarios
- [ ] Verify circuit breakers work
- [ ] Document safety test results

### Phase 2: AI Engine (Week 2)

- [ ] Build Inbound Message Handler workflow
- [ ] Implement safety checks in workflow
- [ ] Build AI prompt construction
- [ ] Test with sample conversations
- [ ] Verify next-contact calculation
- [ ] Test action tag parsing
- [ ] Verify all state updates work

### Phase 3: Frontend (Week 3)

- [ ] Build ConversationView component
- [ ] Add conversation API endpoints
- [ ] Add "Responses" dashboard card
- [ ] Add conversation filters
- [ ] Build human takeover UI
- [ ] Test manual message sending
- [ ] Deploy to production

### Phase 4: Content (Week 4)

- [ ] Create Content_Library table
- [ ] Build content management UI
- [ ] Implement content search in AI workflow
- [ ] Add 10-15 default content pieces
- [ ] Test content retrieval
- [ ] Track performance metrics

### Phase 5: Multi-Tenant (Week 5)

- [ ] Create template Airtable base
- [ ] Build client creation script
- [ ] Test with 2 dummy clients
- [ ] Verify data isolation
- [ ] Test shared workflows with both clients
- [ ] Document client onboarding process
- [ ] Create client admin guide

---

## 🎯 ACCEPTANCE CRITERIA

### Must Have (Blockers for Launch)

✅ **Safety:**
- [ ] AI cannot double-message (0 incidents in testing)
- [ ] Circuit breakers trigger correctly (tested with runaway)
- [ ] All messages logged (100% audit coverage)
- [ ] Opt-outs respected (100% compliance)

✅ **Functionality:**
- [ ] AI responds to inbound messages accurately (>70% success)
- [ ] Conversation history loads and displays correctly
- [ ] Next contact date calculated after every message
- [ ] Actions execute correctly (delay, escalate, book)

✅ **Multi-Tenancy:**
- [ ] 2+ clients run simultaneously without interference
- [ ] Data completely isolated between clients
- [ ] Client config loaded correctly per conversation

✅ **Performance:**
- [ ] AI response time < 15 seconds (90th percentile)
- [ ] Frontend loads conversation in < 2 seconds
- [ ] No data loss (conversation history preserved)

---

### Should Have (Important but Not Blockers)

- [ ] Content library with 10+ items per client
- [ ] Performance tracking (click rates, booking rates)
- [ ] Human takeover workflow smooth
- [ ] Client can edit AI config via UI

---

### Nice to Have (Future Enhancements - Not in Scope)

- [ ] A/B testing different AI tones
- [ ] Sentiment analysis on responses
- [ ] Predictive next-message suggestions
- [ ] Auto-escalation based on sentiment
- [ ] Vector DB for complex clients (if library grows >50 items)
- [ ] Multiple AI model support (if clients demand)
- [ ] Conversation summaries (if convos get longer than expected)

### Explicitly Removed (Simplified Out)

- ❌ Campaign_Timing_Rules table (hardcoded delays simpler)
- ❌ Multi-provider AI support (just OpenAI)
- ❌ Complex timing extraction (standard options only)
- ❌ Conversation summarization (convos are short)
- ❌ Advanced content categorization (simple tags enough)
- ❌ Per-client model selection (one model for all)

---

## 🔗 RELATED DOCUMENTATION

**Implementation:**
- `DEPLOYMENT-GUIDE-TWO-WAY-AI.md` - Step-by-step deployment
- `DEVELOPMENT-ROADMAP-FINAL.md` - Timeline

**Integration:**
- `/docs/kajabi-integration/INDEX.md` - Kajabi integration docs
- `/docs/kajabi-integration/HYBRID-ARCHITECTURE-REAL-TIME-PLUS-BATCH.md` - Webhook + batch sync

**Architecture:**
- `ARCHITECTURE-MULTI-TENANT-AIRTABLE.md` - Multi-tenant design
- `/docs/architecture/SMS-SEQUENCE-REALISTIC-ARCHITECTURE.md` - SMS system design

**Current Status:**
- `UYSP-COMPLETE-STATUS-AND-ROADMAP.md` - Overall system status
- `START-HERE-TOMORROW.md` - Quick start guide

---

## 📞 STAKEHOLDER SIGN-OFF

### Required Approvals

- [ ] **Business Owner**: Vision and objectives aligned
- [ ] **Technical Lead**: Architecture validated
- [ ] **Security Review**: Safety measures approved
- [ ] **Budget Approval**: Cost estimates accepted

---

**PRD Status**: ✅ Final - Ready for Implementation  
**Next Step**: Follow `DEPLOYMENT-GUIDE-TWO-WAY-AI.md`  
**Estimated Delivery**: 5 weeks from start

---

*This is the single source of truth for two-way AI messaging system.*  
*All decisions, architecture, and specifications consolidated here.*  
*Last Updated: October 23, 2025*

