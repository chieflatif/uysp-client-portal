# Two-Way Conversation System - Refined Requirements
**Created**: October 17, 2025, 1:30 AM PST  
**Based on**: Real-world scenarios and sales best practices  
**Approach**: Conversational, sales-driven, natural  
**Philosophy**: Questions beat answers, engagement beats closure

---

## 🎯 REFINED SCENARIO CATEGORIES

Based on your feedback, here are the refined intent categories with proper sales methodology:

---

## 1️⃣ EXISTING CLIENT/MEMBER (Critical - Apologize & Stop)

### **Detection Patterns:**

**Explicit Statements:**
- "I'm already a member"
- "Already a client"
- "Already enrolled"
- "Current member"
- "I'm in [program name]"
- "Already paid"
- "Already have coaching"

**Implicit Indicators:**
- "I already booked"
- "My call is scheduled"
- "Waiting for my onboarding"
- "Put down deposit"
- "In the queue"
- "Waiting to start"

### **Root Causes (As You Noted):**
- Kajabi tag detection gaps (now fixed)
- Booking happened outside system (direct)
- Deposit paid but not synced to Airtable
- Legacy members from old system
- Manual enrollment by your team

### **System Response Strategy:**

**Priority**: STOP immediately, apologize warmly, no excuses

**Response Template:**
> "My sincere apologies [Name]! I see you're already part of the UYSP family. I'll make sure you don't receive these messages again. Really appreciate you being a valued member - looking forward to supporting your success!"

**Actions:**
1. ✅ SMS Stop = TRUE
2. ✅ SMS Stop Reason = "Existing member/client: [their exact words]"
3. ✅ Current Coaching Client = TRUE
4. ✅ Processing Status = "Complete"
5. ✅ Booked = TRUE (if they mentioned booking)
6. ✅ Add conversation note with details
7. ✅ Clear from all active campaigns
8. ⚠️ Slack notification to ops team (flag for data reconciliation)

**Slack Alert:**
> "⚠️ **Existing Client Contacted by Mistake**
> 
> **Name**: [Name]
> **Phone**: [Phone]
> **Their message**: [Exact text]
> **Action taken**: Unsubscribed, marked as current client
> 
> **Data Quality Issue**: This lead slipped through filters. Review Kajabi tag sync or booking detection."

**Why Slack alert**: Helps you improve filtering, not just react

---

## 2️⃣ POSITIVE INTEREST (Engage - Don't Close)

### **Detection Patterns:**

**Strong Yes:**
- "Yes", "Yeah", "Sure"
- "Interested", "Definitely"
- "Let's talk", "I'm in"
- "Sign me up", "Count me in"

**Qualified Interest:**
- "Tell me more"
- "Sounds interesting"
- "Maybe", "Possibly"
- "I'm curious"
- "What's involved?"

**Booking Intent:**
- "Book", "Schedule"
- "When can we talk?"
- "Available [day/time]"
- "Set up a call"

### **Sales Philosophy: Questions > Answers**

**DON'T**: Just send booking link (too transactional)

**DO**: Engage conversationally, qualify interest, THEN offer booking

**Response Strategy (Multi-Level):**

#### **Level 1: Acknowledge + Qualify**

For "Yes" or "Interested":
> "Great to hear [Name]! Quick question - what specifically caught your interest? The sales training, mindset work, or overall strategy?"

**Why**: Qualifies their need, keeps conversation going, feels personal

---

#### **Level 2: Provide Value + Offer Choice**

After their response OR if they said "Tell me more":
> "Perfect [Name]. Most AEs I work with are dealing with [their pain point if mentioned, otherwise: prospecting, closing, or pipeline issues]. 
> 
> You can either:
> 1) Book a strategy call here: [link]
> 2) Have someone from my team reach out personally
> 
> What works better for you?"

**Why**: Gives control, personal touch, multiple paths

---

#### **Level 3: Direct Booking (If Clear Intent)**

If they explicitly said "Book", "Schedule", or asked "When":
> "Awesome [Name]! Here's the link: [Calendly link]
> 
> Pick any time that works for you. If you don't see something that fits, let me know and we'll find a time that works!"

**Why**: They asked for link, give it, but offer flexibility

---

### **Actions:**

**Immediate:**
1. ✅ SMS Status → "Replied - Interested"
2. ✅ Processing Status → "Engaged - Active Conversation"
3. ✅ Conversation Summary → Log exchange
4. ✅ Reply Count → Increment
5. ✅ Last Reply At → Timestamp

**After Qualification Response:**
1. ✅ Check if they chose option (link vs personal)
2. ✅ If "call me" → Notify sales team + set Manual Follow-up flag
3. ✅ If clicked link → Track in click tracking system
4. ✅ Continue conversation if they have more questions

**Slack Notification:**
> "✅ **Hot Lead - Positive Interest**
> 
> **Name**: [Name] - [Company]
> **Interest Level**: [Strong/Qualified/Maybe]
> **Their message**: [Quote]
> **System action**: Sent qualification question
> **Next**: Waiting for their response
> 
> [Link to conversation in Airtable]"

---

## 3️⃣ STOP INTENT - SPECTRUM (Critical Nuance!)

### **Category A: Hard Stop (Immediate Unsubscribe)**

**Patterns:**
- "Stop", "Unsubscribe", "Remove me"
- "Fuck off", "Piss off" (anger)
- "Stop texting me", "Don't contact me"
- "Take me off", "Delete my number"
- "Not interested at all"
- "Never contact me again"

**Response:**
> "Understood [Name]. You've been removed. Thanks for your time!"

**Actions:**
1. ✅ SMS Stop = TRUE
2. ✅ SMS Stop Reason = "Hard stop: [their words]"
3. ✅ Processing Status = "Stopped"
4. ✅ Clear all campaigns
5. ⚠️ NO Slack spam (this is normal)

---

### **Category B: Soft No (Stop Campaign, Note for Future)**

**Patterns:**
- "No thank you" (polite decline)
- "Not right now"
- "Not at this time"
- "Maybe later"
- "Timing isn't right"
- "Just changed jobs" (timing issue)
- "Don't have budget" (budget constraint)
- "Too busy right now"

**Response (Warmer, Leave Door Open):**
> "No worries [Name], I totally understand. If timing improves down the road, feel free to reach out anytime. Best of luck with [job change/busy season/etc.]!"

**Actions:**
1. ✅ SMS Stop = TRUE (stop THIS campaign)
2. ✅ SMS Stop Reason = "Soft no - timing/budget: [their words]"
3. ✅ Processing Status = "Paused - Future Nurture"
4. ✅ Follow-up Date = +90 days (or detect from message)
5. ✅ Add nurture tag (for future reactivation)
6. ⚠️ Slack notification (potential nurture opportunity)

**Slack Alert:**
> "🟡 **Soft No - Potential Nurture**
> 
> **Name**: [Name]
> **Reason**: [Their message]
> **Suggested Action**: Follow up in [timeframe]
> **Note**: Not a hard no - timing/budget issue
> 
> [Link to record]"

**Why different**: These aren't dead leads - they're timing issues. Keep for future nurture.

---

### **Category C: Neutral/Maybe (Engage, Don't Push)**

**Patterns:**
- "Maybe"
- "I'll think about it"
- "Not sure yet"
- "Let me see"
- "Send me info first"
- "What's this about?"

**Response (Soft Engagement):**
> "Fair enough [Name]. No pressure at all. Here's some quick context:
> 
> I'm Ian Koniak's team - he helps AEs close bigger deals through mindset + skill work. Free strategy call to see if it's a fit: [link]
> 
> What questions can I answer?"

**Actions:**
1. ✅ SMS Status → "Replied - Considering"
2. ✅ Processing Status → "Engaged - Warm Lead"
3. ✅ Continue conversation (don't stop campaign yet)
4. ✅ Slack notification (warm lead, answer questions)

**Why different**: These are maybe-yes. Keep conversation open, provide info, don't force.

---

## 4️⃣ QUESTIONS (Sales Rule: Answer with Question!)

### **Your Sales Philosophy:**

> "Never answer a question with an answer - answer it with a question"

**This is brilliant and we need to encode it!**

---

### **Question Types & Responses:**

#### **Type 1: Process Questions** ("How long?", "What happens?")

**Lead asks:**
- "How long is the call?"
- "What do we discuss?"
- "What's the process?"

**DON'T** (Direct answer - conversation dies):
> "It's 30 minutes and we discuss your goals."

**DO** (Answer + Question - keeps conversation alive):
> "It's a 30-minute strategy call [Name]. We'd dive into what's working and what's not in your sales process.
> 
> Quick question - what's your biggest challenge right now? Prospecting, closing, or something else?"

**Why**: Qualifies their pain point, keeps them engaged, feels consultative

---

#### **Type 2: Cost Questions** ("How much?", "What's the price?")

**Lead asks:**
- "How much does coaching cost?"
- "What's the price?"
- "Is this expensive?"

**DON'T** (Deflect completely):
> "We discuss pricing on the call."

**DO** (Qualify + Redirect):
> "Good question [Name]. Coaching investment varies based on your goals and which tier fits best (Bronze/Silver/Gold).
> 
> But first - what kind of results are you looking for? Are you trying to hit President's Club, transition to enterprise sales, or something specific?"

**Why**: Qualifies value perception, shifts focus to outcomes, personal

---

#### **Type 3: Credibility Questions** ("Who is Ian?", "Does this work?")

**Lead asks:**
- "Who are you?"
- "Does this actually work?"
- "Any proof?"
- "References?"

**DON'T** (Feature dump):
> "Ian was #1 AE at..." (boring)

**DO** (Social proof + Question):
> "Great question [Name]! Ian was #1 AE at multiple companies (Salesforce, ZoomInfo) and now coaches AEs closing $1M+ deals. Check testimonials: [link]
> 
> What's your current role and what made you check out the webinar?"

**Why**: Credibility established, but qualify THEIR situation too

---

#### **Type 4: Timing Questions** ("When?", "How soon?")

**Lead asks:**
- "When can we talk?"
- "How soon can I start?"
- "Is there availability this week?"

**Response (Urgency + Flexibility):**
> "I can get you on the calendar ASAP [Name]. Most openings are [timeframe]. 
> 
> What's driving the urgency? New role, quota pressure, or something else?"

**Why**: Shows responsiveness, qualifies timing motivation

---

### **General Question Handling Philosophy:**

**Framework: AQA (Acknowledge, Qualify, Advance)**

1. **Acknowledge**: "Great question [Name]!"
2. **Qualify**: Ask about THEIR situation
3. **Advance**: Offer next step (link, personal call, info)

**Examples:**

| Their Question | AQA Response |
|----------------|--------------|
| "How long is the call?" | "30 minutes [Name]. We'll focus on your specific situation. **What's your biggest sales challenge right now?**" |
| "Is this free?" | "Yes, completely free strategy call. **What made you interested in sales coaching?**" |
| "Who is Ian?" | "Former #1 AE, now coach. Clients closing 20%+ more. **What's your current sales role?**" |
| "Does this work?" | "Clients avg 20-40% lift [Name]. **What results are you trying to hit?**" |

**Why this works**: Consultative, not transactional. Builds rapport. Qualifies lead.

---

## 5️⃣ PERSONAL OUTREACH REQUEST (Hot Lead!)

### **Variations:**

**Direct Request:**
- "Can someone call me?"
- "Have your team reach out"
- "I'd like to talk to someone first"
- "Call me at [number]"

**Indirect Intent:**
- "I have some questions first" (needs conversation)
- "Want to understand more before booking" (needs nurturing)
- "Can we do a quick call?" (prefers voice)

### **Response (Enthusiastic + Immediate Action):**

> "Absolutely [Name]! I'll have someone from my team reach out personally within the next few hours to get you scheduled.
> 
> In the meantime, anything specific you want to make sure we cover on the call?"

**Why**: Shows urgency, asks for their priorities, maintains engagement

---

### **Actions:**

**Immediate:**
1. ✅ SMS Status → "Replied - Outreach Requested"
2. ✅ Processing Status → "Engaged - Manual Follow-up"
3. ✅ Manual Follow-up Required = TRUE
4. ✅ Follow-up Note = "Personal outreach requested: [their message]"
5. ✅ Priority = HIGH

**Notifications (Multi-Channel):**

**Slack to Sales Team:**
> "🔥 **HOT LEAD - Personal Outreach Requested**
> 
> **PRIORITY**: High - Respond within 2-4 hours
> 
> **Lead**: [Name] - [Title] at [Company]
> **Phone**: [Phone]
> **Email**: [Email]
> **Campaign**: [Campaign name]
> **ICP Score**: [Score]
> 
> **Their request**: "[Exact message]"
> 
> **Context**: 
> - SMS sent: [timestamp]
> - Replied: [timestamp]
> - Sequence position: [X]
> - Previous engagement: [clicks/replies]
> 
> **Action Required**: 
> Call or email within 2-4 hours to schedule strategy call
> 
> [Direct link to Airtable record]
> [Their LinkedIn profile if available]"

**Email to Sales Team:**
- Subject: "🔥 Hot Lead - Personal Outreach Requested: [Name] - [Company]"
- Body: Same as Slack but formatted for email
- Include: Calendly link to book directly while calling

---

## 6️⃣ STOP INTENT - THREE TIERS (Critical Nuance!)

### **Tier 1: HARD STOP (Immediate Unsubscribe)**

**Patterns:**
- Profanity: "fuck off", "piss off", "leave me alone"
- Absolute: "stop", "unsubscribe", "remove me", "never contact"
- Angry: "stop texting me", "stop calling", "harassment"
- Legal: "lawyer", "cease", "legal action"

**Response (Brief, Professional):**
> "Removed [Name]. Apologies for the inconvenience."

**Actions:**
1. ✅ SMS Stop = TRUE
2. ✅ Stop Reason = "Hard stop: [category]"
3. ✅ Processing Status = "Stopped"
4. ✅ ALL campaigns cleared
5. ✅ Global DNC flag (never contact again)
6. ⚠️ NO Slack (normal churn, don't spam team)

---

### **Tier 2: SOFT NO - TIMING/SITUATION (Pause, Nurture Later)**

**Patterns:**
- Timing: "not right now", "maybe later", "not at this time", "in a few months"
- Situation: "just changed jobs", "new role", "too busy", "crazy time"
- Budget: "can't afford", "no budget", "too expensive" (assumed)
- Priority: "other priorities", "focusing on [X] first"

**Response (Warm, Door Open):**
> "Totally understand [Name] - timing is everything. If things change down the road, feel free to reach out anytime. Best of luck with [the new role/busy season/etc.]!"

**Actions:**
1. ✅ SMS Stop = TRUE (for THIS campaign)
2. ✅ Stop Reason = "Soft no - timing/situation: [their words]"
3. ✅ Processing Status = "Paused - Future Nurture"
4. ✅ Follow-up Date = +90 days (or detect from message: "in 3 months" = +90 days)
5. ✅ Nurture Tag = "Timing-Issue-[Date]"
6. ✅ Conversation Summary = Full context for future
7. ✅ Keep in database (NOT deleted)

**Slack Alert (Ops Review):**
> "🟡 **Soft No - Potential Nurture Lead**
> 
> **Name**: [Name]
> **Reason**: [Timing/Budget/Situation]
> **Their message**: "[Exact quote]"
> **Suggested follow-up**: [Timeframe]
> 
> **Action**: Tag for nurture sequence in [90 days]
> 
> [Airtable link]"

**Why different from Hard Stop**:
- Not dead - just bad timing
- Keep for future reactivation
- Log context for when you re-engage
- These can convert later!

---

### **Tier 3: NEUTRAL/MAYBE (Keep Conversation Going)**

**Patterns:**
- Hesitation: "maybe", "not sure", "I'll think about it", "let me see"
- Info request: "send me info", "what's this about?", "more details"
- Comparison: "looking at options", "talking to others", "evaluating"

**Response (Low Pressure, Provide Value):**
> "No pressure [Name]. Here's the quick version:
> 
> I help AEs close bigger deals through mindset shifts + skill work. Free 30-min strategy call to see if there's a fit.
> 
> What's your hesitation - just timing, or something else?"

**Why**: Surfaces objections, keeps dialogue open, consultative

**Actions:**
1. ✅ SMS Status → "Replied - Considering"
2. ✅ Processing Status → "Engaged - Warm Lead"
3. ✅ DON'T stop campaign yet (give them 24-48h)
4. ✅ Slack notification (warm lead, be ready to respond)
5. ✅ Wait for their response to qualify further

---

## 7️⃣ QUESTIONS - SALES ENGINE (Critical!)

### **Your Rule: "Never answer a question with an answer"**

I'm implementing this as the core principle!

---

### **Question Handling Framework:**

```
Inbound Question
     ↓
Acknowledge Question
     ↓
Give Brief Answer (value/context)
     ↓
Ask Qualifying Question (their situation)
     ↓
Wait for Response
     ↓
Provide Deeper Answer + Next Step
     ↓
Advance Conversation (link, call, etc.)
```

---

### **Common Questions & Sales-Driven Responses:**

#### **Q: "How long is the call?"**

**❌ Bad (Answer only):**
> "30 minutes."

**✅ Good (Answer + Qualify):**
> "30 minutes [Name] - enough time to get clarity on what's working and what's not.
> 
> **Quick question for you** - what's the biggest thing holding you back from your goals right now? Pipeline, closing, or something else?"

**Why**: Answers question, but pivots to THEIR pain point (consultative selling)

---

#### **Q: "Is this free?"**

**❌ Bad:**
> "Yes it's free."

**✅ Good:**
> "Yep, the strategy call is completely free with zero obligation [Name].
> 
> **Curious** - what made you interested in sales coaching? Trying to hit a specific quota, or looking to level up overall?"

**Why**: Removes price objection, qualifies motivation

---

#### **Q: "What do we talk about?"**

**❌ Bad:**
> "We discuss your sales process and goals."

**✅ Good:**
> "Great question [Name]. We'd start with where you are vs where you want to be, then map out what's in the way.
> 
> **For context** - are you more focused on skills (prospecting/closing) or mindset/habits? That helps me know who on my team is the best fit for your call."

**Why**: Answers AND qualifies needs AND personalizes experience

---

#### **Q: "Who is Ian?" / "Does this work?"**

**❌ Bad:**
> "Ian was #1 AE at Salesforce..."

**✅ Good:**
> "Fair question [Name]. Ian was #1 AE at companies like Salesforce, now coaches AEs closing $1M+ deals. Clients typically see 20-40% lift.
> 
> **What I'm curious about** - what would a 20-40% improvement mean for YOU? Would that be quota vs President's Club, or something bigger?"

**Why**: Credibility + social proof + qualify THEIR stakes

---

#### **Q: "How much does it cost?"**

**❌ Bad:**
> "We discuss pricing on the call." (defensive)

**✅ Good:**
> "Good question [Name]. Coaching investment depends on your goals - we have Bronze/Silver/Gold tiers from a few hundred to a few thousand per month.
> 
> **Before we get into specifics** - what kind of ROI would you need to see to make coaching a no-brainer? Like if you closed $50K more per year, would that change things?"

**Why**: Anchors value, qualifies budget sensitivity, consultative

---

### **Unknown/Complex Questions (Route to Human):**

**Patterns:**
- Multi-part questions
- Very specific scenarios
- Objections ("I tried coaching before and it didn't work")
- Competitor comparisons
- Unusual requests

**Response:**
> "That's a great question [Name] and I want to make sure you get the right answer. Let me have someone from my team reach out who can dive deeper with you. 
> 
> **Quick heads up** - is there anything else you want to make sure gets covered when they call?"

**Actions:**
1. ✅ Route to Slack (manual response needed)
2. ✅ Include full question context
3. ✅ Flag as "Complex - Human Review"
4. ✅ Set follow-up = HIGH priority

---

## 🎯 CONVERSATION FLOW EXAMPLES (Multi-Turn)

### **Example 1: Engaged Prospect (Best Case)**

```
LEAD: "Yes I'm interested"
  ↓
SYSTEM: "Great [Name]! Quick question - what caught your interest? 
         Training, mindset, or strategy?"
  ↓
LEAD: "I need help with closing"
  ↓
SYSTEM: "Perfect, that's Ian's specialty. Most AEs I work with in closing 
         struggle with either objection handling or creating urgency. 
         
         Which resonates more for you?"
  ↓
LEAD: "Definitely objections"
  ↓
SYSTEM: "Got it. On the strategy call we'd diagnose your specific objection 
         patterns and Ian can show you his framework.
         
         You can book here: [link]
         Or if you'd rather talk to someone first, I can have my team call you. 
         
         What works better?"
  ↓
LEAD: "I'll book"
  ↓
SYSTEM: "Awesome! Looking forward to helping you close more deals 🎯"
  ↓
[Lead clicks link, books meeting]
  ↓
SYSTEM: Updates Airtable → Booked = TRUE, stops campaign
```

**Total exchange**: 4-5 messages, qualified, booked, natural conversation

---

### **Example 2: Soft No (Nurture Opportunity)**

```
LEAD: "Not right now, just changed jobs"
  ↓
SYSTEM: "Totally get it [Name] - new role is a lot to manage. 
         
         Congrats on the move! What's the new gig?"
  ↓
LEAD: "AE at [Company], just started"
  ↓
SYSTEM: "Nice! Most new AEs hit their stride around month 3-6. If you want 
         to ramp faster, we're here. Otherwise I'll check back in a few months.
         
         Sound good?"
  ↓
LEAD: "Yeah maybe in 3 months"
  ↓
SYSTEM: "Perfect. I'll reach out in [Month]. Best of luck with the ramp!"
  ↓
SYSTEM: Sets follow-up reminder for 90 days, tags for nurture, STOPS campaign
```

**Outcome**: Relationship maintained, future opportunity preserved, not burned

---

### **Example 3: Existing Member (Oops!)**

```
LEAD: "I'm already a member, why am I getting this?"
  ↓
SYSTEM: "Oh no, my sincere apologies [Name]! You absolutely shouldn't be 
         getting these messages. I'll fix this immediately.
         
         Thanks for being a valued UYSP member!"
  ↓
SYSTEM: 
  - Unsubscribes instantly
  - Marks as current client
  - Slack alerts OPS team (data quality issue)
  - Stops all campaigns
  
SLACK ALERT to OPS:
  "⚠️ Data Quality Issue: Existing member [Name] received campaign message.
   Review: Kajabi tag sync or enrollment detection."
```

**Outcome**: Professional apology, immediate action, ops team alerted to fix root cause

---

## 📊 ACTION MATRIX - COMPLETE MAPPING

| Intent Category | Response Type | Airtable Updates | Notifications | Campaign Action |
|-----------------|---------------|------------------|---------------|-----------------|
| **Positive Interest** | Qualify + Offer booking | Status: Interested, Engaged | Slack: Hot lead | Continue (multi-turn) |
| **Already Booked** | Confirm + Thank | Booked=TRUE, Complete | None | STOP all |
| **Existing Member** | Apologize profusely | Client=TRUE, Complete | Slack: Data quality | STOP all |
| **Hard Stop** | Brief confirmation | Stop=TRUE, Stopped | None | STOP all |
| **Soft No (Timing)** | Warm + Future | Paused, +90 days | Slack: Nurture opp | STOP, tag nurture |
| **Maybe/Neutral** | Low pressure + Info | Considering, Warm | Slack: Warm lead | Continue |
| **Questions** | Answer + Qualify | Question asked | Slack: If complex | Continue |
| **Outreach Request** | Confirm + Promise | Manual follow-up req | Email+Slack: URGENT | Pause, manual |
| **Timing Request** | Acknowledge + Set | Follow-up date set | Slack: Schedule | STOP, remind later |
| **Confused/Wrong** | Clarify + Offer stop | Manual review | Slack: Review | Pause |

---

## 🏗️ ENHANCED WORKFLOW ARCHITECTURE

### **Workflow Structure (v1.0 - Pattern Based):**

```
[Existing] Twilio Inbound Webhook
    ↓
[Existing] Parse Inbound Message
    ↓
[Existing] Find Lead by Phone
    ↓
[NEW] Classify Intent (Pattern Matching - 10 categories)
    ↓
    ├─→ [Positive Interest]
    │     ├─→ Generate qualifying question
    │     ├─→ Send response
    │     ├─→ Update: Engaged, continue conversation
    │     └─→ Slack: Hot lead alert
    │
    ├─→ [Already Booked]
    │     ├─→ Send confirmation
    │     ├─→ Update: Booked=TRUE, stop campaign
    │     └─→ Log only (no Slack spam)
    │
    ├─→ [Existing Member]
    │     ├─→ Send apology
    │     ├─→ Update: Client=TRUE, stop all
    │     └─→ Slack: Data quality alert
    │
    ├─→ [Hard Stop]
    │     ├─→ Send brief confirmation
    │     ├─→ Update: Stop=TRUE, stopped
    │     └─→ Log only (no Slack)
    │
    ├─→ [Soft No - Timing]
    │     ├─→ Send warm future message
    │     ├─→ Update: Paused, set follow-up +90 days
    │     └─→ Slack: Nurture opportunity
    │
    ├─→ [Maybe/Neutral]
    │     ├─→ Send low-pressure info
    │     ├─→ Update: Considering, stay in campaign
    │     └─→ Slack: Warm lead
    │
    ├─→ [Question]
    │     ├─→ Answer with question (AQA framework)
    │     ├─→ Update: Question asked, engaged
    │     └─→ Slack: If complex question
    │
    ├─→ [Outreach Request]
    │     ├─→ Send confirmation + promise
    │     ├─→ Update: Manual follow-up req, HIGH priority
    │     └─→ Email+Slack: URGENT hot lead
    │
    ├─→ [Timing Request]
    │     ├─→ Send acknowledgment
    │     ├─→ Update: Follow-up date set
    │     └─→ Slack: Schedule follow-up
    │
    └─→ [Unclear/Complex]
          ├─→ Send clarification + offer stop
          ├─→ Update: Manual review needed
          └─→ Slack: Human review required
          
    ↓
[NEW] Log Complete Conversation
    ↓
[NEW] Update Conversation Summary (AI-generated in v2.0)
    ↓
[Existing] Respond to Twilio Webhook
```

---

## 🎯 MULTI-TURN CONVERSATION TRACKING

### **Conversation State Management:**

**Track in Airtable:**
- Conversation ID (unique per lead)
- Turn count (how many exchanges)
- Last message timestamp
- Intent progression (tracking intent changes)
- Qualification level (cold → warm → hot)

### **Example State Tracking:**

```javascript
// Conversation state
{
  conversation_id: "conv_rec9Jpl7lL9szpRl8_20251017",
  turn_number: 3,
  intent_history: ["POSITIVE_INTEREST", "QUESTION", "OUTREACH_REQUEST"],
  qualification_level: "hot",  // cold → warm → hot
  next_expected_action: "sales_team_outreach",
  conversation_summary: "Interested in closing help. Asked about call length. Requested personal outreach.",
  last_bot_message: "I'll have team reach out...",
  last_user_message: "Can someone call me?",
  conversation_started_at: "2025-10-17T01:00:00Z",
  last_exchange_at: "2025-10-17T01:05:23Z"
}
```

**This enables:**
- Contextual responses (reference previous exchanges)
- Escalation logic (after 3 turns, route to human)
- Conversation quality scoring
- Response time tracking

---

## 🤖 AI INTEGRATION (v2.0) - OPTIONAL ENHANCEMENT

### **When to Use AI vs Patterns:**

**Use Patterns (v1.0) for:**
- Clear intents (YES, STOP, etc.)
- High-volume scenarios
- Cost efficiency
- Speed (instant response)

**Use AI (v2.0) for:**
- Complex questions
- Multi-turn conversations
- Nuanced situations
- Personalization at scale

### **Hybrid Approach (Best of Both):**

```javascript
// Decision tree
if (clearIntent(['yes', 'stop', 'already member'])) {
  return usePatternResponse();  // Fast, cheap, reliable
}

if (isQuestion() || isAmbiguous() || conversationTurn > 1) {
  return useAI({
    context: fullConversationHistory,
    leadProfile: airtableData,
    salesContext: campaignInfo
  });  // Smart, contextual, natural
}
```

**Best of both**: Speed and cost efficiency + intelligence when needed

---

### **AI Agent Configuration (n8n OpenAI Node):**

```javascript
{
  model: "gpt-4o",  // or Claude Sonnet
  systemPrompt: `You are Ian Koniak's AI sales assistant for UYSP...`,
  context: {
    lead: leadProfile,
    campaign: campaignInfo,
    conversation: previousMessages,
    knowledge: faqDatabase
  },
  constraints: {
    maxTokens: 100,  // Keep responses SMS-length
    temperature: 0.7,  // Balance creativity and consistency
    stopSequences: ["\n\n"]  // One exchange at a time
  },
  guidelines: [
    "Answer questions with qualifying questions",
    "Keep responses under 160 characters when possible",
    "Use first name naturally",
    "Be warm but professional",
    "Never hard-sell",
    "Offer booking link after qualification",
    "Escalate complex scenarios to human"
  ]
}
```

---

## 📋 AIRTABLE SCHEMA - REQUIRED UPDATES

### **Leads Table - New Fields:**

| Field Name | Type | Options/Format | Purpose |
|------------|------|----------------|---------|
| **Conversation Status** | Single Select | No Reply, Interested, Question, Not Interested, Considering, Engaged, Manual Review | Track reply state |
| **Last Reply At** | DateTime | ISO format | When they last replied |
| **Last Reply Text** | Long Text | - | Their most recent message |
| **Reply Count** | Number | Default: 0 | Total replies received |
| **Conversation Summary** | Long Text | - | AI or manual summary |
| **Conversation Turn Count** | Number | Default: 0 | # of exchanges |
| **Qualification Level** | Single Select | Cold, Warm, Hot, Engaged | Sales stage |
| **Manual Follow-up Required** | Checkbox | - | Sales team action needed |
| **Follow-up Note** | Long Text | - | Context for follow-up |
| **Follow-up Date** | Date | - | When to reach out |
| **Follow-up Priority** | Single Select | Low, Medium, High, Urgent | Prioritize outreach |
| **Intent Last Detected** | Single Select | All 10 intents | Last classification |
| **Nurture Tag** | Single Select | Timing-Issue, Budget-Issue, Info-Requested, etc. | Reactivation campaigns |

---

### **SMS_Audit Table - Enhanced Fields:**

| Field Name | Type | Purpose |
|------------|------|---------|
| **Message Direction** | Single Select | Outbound, Inbound | Who sent it |
| **Intent Detected** | Single Select | All 10 intents | Classification |
| **Intent Confidence** | Number (0-100) | AI confidence score |
| **Auto-Response Sent** | Checkbox | Did bot reply? |
| **Response Text** | Long Text | What bot sent |
| **Action Taken** | Single Select | Unsubscribe, Booked, Notified Team, etc. | What happened |
| **Conversation ID** | Text | Link messages in conversation |
| **Turn Number** | Number | Position in conversation |
| **Human Escalation** | Checkbox | Routed to person? |
| **Response Time** | Number (seconds) | How fast did we reply |

---

## 🚀 BUILD PLAN - v1.0 PATTERN-BASED SYSTEM

### **Phase 1: Enhanced Intent Classifier (2 hours)**

**Build:**
- Comprehensive pattern library (10 intent categories)
- Multi-tier logic (Hard Stop vs Soft No vs Maybe)
- Confidence scoring
- Edge case handling

**Testing:**
- Use your real reply examples
- Validate classification accuracy (target: 90%+)
- Test edge cases

---

### **Phase 2: Response Generator (2 hours)**

**Build:**
- Dynamic template system
- Variable substitution (name, company, timing)
- AQA framework implementation
- Length validation (SMS limits)

**Templates:**
- 10 base templates (one per intent)
- 5-10 qualifying questions
- Contextual variations

---

### **Phase 3: Action Handlers (3 hours)**

**Build:**
- Airtable update logic (dynamic per intent)
- Multi-channel notifications (Slack + Email)
- Conversation state management
- Follow-up scheduling

**Components:**
- Update Lead node (15+ field mappings)
- Send Auto-Response node
- Notify Sales Team node
- Log Conversation node
- Set Follow-up Reminder node

---

### **Phase 4: Airtable Schema (1 hour)**

**Execute via MCP:**
- Add 12 new fields to Leads table
- Add 8 new fields to SMS_Audit table
- Update field descriptions
- Create sample data

---

### **Phase 5: Integration & Testing (3 hours)**

**Test all 10 scenarios:**
- Positive interest (multi-turn)
- Already booked
- Existing member
- Hard stop
- Soft no
- Maybe
- Questions (simple + complex)
- Outreach request
- Timing request
- Confusion

**Validation:**
- Correct classification (90%+ accuracy)
- Appropriate responses (brand-aligned)
- Airtable updates correct
- Notifications working
- No lost messages

---

## 📊 ESTIMATED EFFORT

### **v1.0 (Pattern-Based):**
- Design & Spec: ✅ Complete (2 hours - DONE)
- Intent Classifier: 2 hours
- Response Generator: 2 hours
- Action Handlers: 3 hours
- Airtable Schema: 1 hour
- Testing: 3 hours
- **Total: ~11 hours** (spec already done)

### **v2.0 (AI-Powered):**
- AI agent setup: 4 hours
- Knowledge base: 3 hours
- Calendly integration: 4 hours
- Advanced qualification: 5 hours
- Testing: 4 hours
- **Total: ~20 hours additional**

**Recommendation**: Build v1.0 first, prove value, then enhance with AI

---

## ✅ **READY TO BUILD?**

**I have complete specs for v1.0** with your real-world scenarios included:

✅ 10 intent categories (not just 8)  
✅ Three-tier stop logic (Hard/Soft/Maybe)  
✅ AQA sales framework (Answer with Question)  
✅ Multi-turn conversation tracking  
✅ Existing member handling with ops alerts  
✅ Soft no → nurture pathway  
✅ Sales-driven question responses  

**Shall I start building the v1.0 pattern-based system now?** (11 hours work)

**Or do you want to review/refine anything first based on examples you have?** [[memory:8472508]]

Share any specific reply examples you want me to account for and I'll ensure they're handled perfectly!

