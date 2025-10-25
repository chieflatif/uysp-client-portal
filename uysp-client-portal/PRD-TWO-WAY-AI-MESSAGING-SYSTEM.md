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
last_message_direction       (Single Select: "outbound" | "inbound")
last_message_sent_at         (DateTime)
last_message_received_at     (DateTime)
active_conversation          (Checkbox - TRUE if back-and-forth in last 4 hours)

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

-- AI MODEL CONFIGURATION
ai_provider                 (Single Select: "openai" | "anthropic")
ai_model                    (Single Select: "gpt-4o-mini" | "gpt-4o" | "claude-3-5-sonnet")
temperature                 (Number - 0.0 to 1.0)
max_tokens                  (Number - 150 to 500 for SMS)

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

### Table 5: Campaign_Timing_Rules (NEW)

```sql
-- Defines default timing between stages
campaign_id                 (Link to Campaigns)
from_stage                  (Single Select)
to_stage                    (Single Select)
default_delay_days          (Number)
trigger_type                (Single Select: "scheduled" | "immediate" | "reply_based")

-- PROSPECT CONTROL
prospect_can_delay          (Checkbox - can they request different timing?)
min_delay_days              (Number - shortest they can request)
max_delay_days              (Number - longest they can request)

-- AI OBJECTIVE
ai_objective                (Long Text - "Ask if interested in content or coaching")
success_criteria            (Long Text - "Booking intent detected" or "Interest type identified")

active                      (Checkbox)
```

**Example Records:**
```
campaign_id: webinar_jb_2024
from_stage: "confirmation"
to_stage: "intent_qualify"
default_delay_days: 2
ai_objective: "Ask if they're interested in content or coaching"

campaign_id: webinar_jb_2024
from_stage: "sent_content"
to_stage: "content_followup"
default_delay_days: 7
prospect_can_delay: TRUE
ai_objective: "Check if content was helpful, offer more or booking"
```

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

TIMING UPDATES (Use action tags):
- If prospect says "check back in 3 months" → "[DELAY:90days]"
- If prospect says "not interested ever" → "[STOP]"
- If sending content → "[DELAY:7days]" (default follow-up)
- If high engagement → "[DELAY:2days]" (fast follow-up)

CONTENT DELIVERY:
- When sending resources, send link only (not long descriptions)
- Format: "Here's that guide: [URL]" 
- Ask follow-up: "What area are you finding most challenging?"

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
  - Add: CONVERSATION_HISTORY
  - Add: CURRENT_OBJECTIVE
  - Add: LATEST_MESSAGE

NODE 10: Call AI (Dynamic Provider)
  - Use client's ai_provider and ai_model
  - Set temperature and max_tokens
  - Track: start_time, tokens, cost

NODE 11: Parse AI Response
  - Extract message_to_send
  - Extract action tags: [DELAY:Xdays], [ESCALATE], [BOOK], [STOP]
  - Calculate next_contact_date
  - Validate response (no toxic content)

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
| **OpenAI API** | AI responses | $0.02-0.10/message | ✅ Critical |
| **SimpleTexting** | SMS delivery | $0.04/message | ✅ Critical |
| **Clay** | Lead enrichment | $500-1k/mo | ✅ Critical |
| **PostgreSQL** | Frontend cache | $15/mo (Render) | ✅ Critical |
| **Pinecone** (Optional) | Vector DB for complex clients | $70/mo | ⚠️ Optional |

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

**Add/Edit Content Modal:**
```
Title: [Cold Calling Masterclass        ]
URL:   [https://uysp.com/resources/...  ]
Type:  [PDF ▼]

Topics (comma-separated):
[cold_calling, prospecting, objection_handling]

Best for stages:
[✓] Content Nurture
[✓] Pre-Qualification  
[ ] Post-Event Follow-Up

Active: [✓]

[Save] [Cancel]
```

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
│ AI Model                                    │
│ Provider: [OpenAI ▼]                        │
│ Model: [GPT-4o-mini ▼] (Recommended)        │
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
├── People (Enhanced with 15 new fields)
├── Communications (Enhanced with 8 new fields)
├── Campaigns (Enhanced with 10 new fields)
├── Content_Library (NEW - 15 fields)
├── AI_Config (NEW - single record, 25 fields)
├── Campaign_Timing_Rules (NEW - multiple records)
├── DND_List (Existing - keep as is)
├── Error_Log (Existing - keep as is)
├── Daily_Costs (Existing - enhance with AI costs)
└── Daily_Metrics (Existing - enhance with AI metrics)
```

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
| Content in Airtable (not vector DB) | <100 items, simple tagging works | Pinecone/Weaviate | ✅ Final |
| Conversation state in last_message_direction | Simple, reliable | Complex state machine | ✅ Final |
| Action tags vs JSON parsing | More forgiving, simpler | Structured JSON | ✅ Final |
| Schedule auto-invalidation | Prevents stale messages | Manual schedule management | ✅ Final |
| Separate base per client | Total isolation | Shared base with client_id | ✅ Final |
| Shared n8n workflows | One codebase to maintain | Duplicate per client | ✅ Final |

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

### Nice to Have (Future Enhancements)

- [ ] A/B testing different AI tones
- [ ] Sentiment analysis on responses
- [ ] Predictive next-message suggestions
- [ ] Auto-escalation based on sentiment
- [ ] Vector DB for complex clients

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

