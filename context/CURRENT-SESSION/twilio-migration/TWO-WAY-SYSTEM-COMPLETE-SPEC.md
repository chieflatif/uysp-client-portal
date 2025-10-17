# Two-Way Conversation System - Complete Specification
**Created**: October 17, 2025, 1:45 AM PST  
**Version**: 1.0 (Pattern-Based) with v2.0 AI Architecture  
**Philosophy**: Conversational, qualifying, nurturing, scalable  
**Client Control**: All features toggleable per client preferences

---

## 🎯 CORE SYSTEM CAPABILITIES

### **Foundation (v1.0 - All Clients):**
1. ✅ Intent classification (10 categories)
2. ✅ Automatic responses (brand-aligned)
3. ✅ Conversation logging (complete audit trail)
4. ✅ STOP handling (compliance)
5. ✅ Sales team notifications (hot leads, issues)

### **Advanced (v2.0 - AI Agent):**
6. ✅ Qualifying questions (natural sales flow)
7. ✅ Nurture scheduling (automated or manual follow-up)
8. ✅ Personalization (enrichment data integration)
9. ✅ Multi-turn conversations (context-aware)
10. ✅ Client preference controls (toggle features on/off)

---

## 🆕 CRITICAL ADDITIONS FROM YOUR FEEDBACK

### **Addition 1: Intelligent Nurture Scheduling**

**Scenario**: Lead says "Not now, maybe in a few weeks"

**System Capabilities:**

#### **Step 1: Extract Timing Intent**
```javascript
// Natural language date extraction
const message = "Nah, not good timing. Check back end of the month";

const timingPatterns = {
  "end of month": +30 days,
  "few weeks": +14 days,
  "next month": +30 days,
  "couple months": +60 days,
  "after [quarter/holidays/event]": +90 days,
  "in [number] weeks": +[number*7] days
};

// Extract: "end of the month" → Follow-up date = October 31, 2025
```

#### **Step 2: Conversational Confirmation**
> "No worries [Name], timing is everything. How about I drop you a note at the end of the month? Would that work better?"

**Wait for confirmation:**
- "Yes" → Schedule for end of month
- "Make it 2 months" → Adjust timing
- "Actually never mind" → Stop campaign

#### **Step 3: Client Control - Automatic vs Manual**

**Airtable Setting (Per Client or Global):**

**Field**: `Auto-Nurture Enabled` (Checkbox in Settings table)

**If TRUE (Automated Nurture):**
```javascript
// System automatically sends follow-up on scheduled date
{
  follow_up_date: "2025-10-31",
  follow_up_action: "auto_send",
  follow_up_message: "Hi [Name], checking back in as promised! Has timing improved? Here's that strategy call link: [url]",
  nurture_campaign_id: "timing-delayed-oct-2025"
}
```

**If FALSE (Manual Follow-up):**
```javascript
// System flags for human outreach
{
  follow_up_date: "2025-10-31",
  follow_up_action: "manual_call",
  follow_up_note: "Lead requested follow-up end of month. Said: '[exact quote]'",
  manual_follow_up_required: TRUE,
  follow_up_priority: "Medium"
}
```

**Slack Notification (Both Modes):**
> "📅 **Nurture Follow-up Scheduled**
> 
> **Lead**: [Name]
> **Requested timing**: End of month (Oct 31)
> **Their reason**: "Not good timing right now"
> **Follow-up mode**: [Automatic bot message / Manual call by team]
> 
> **Will trigger**: Oct 31, 2025
> 
> [Airtable link]"

---

### **Addition 2: Qualifying Questions (Natural Sales Flow)**

**Scenario**: Lead shows interest → System qualifies BEFORE offering booking

---

#### **Qualification Framework:**

**Question Bank (Priority-Based):**

**Q1: Pain Point Discovery** (Always ask first)
- "What's driving your interest [Name]? Hitting quota, skill gaps, or something else?"
- "What are your top priorities right now?"
- "What's the biggest challenge you're facing in your sales role?"

**Q2: Coaching Format Preference** (Important for routing)
- "Are you looking for 1-on-1 coaching or prefer group sessions?"
- "Do you learn better in workshops or one-on-one?"
- "Looking for accountability coaching, skill training, or both?"

**Q3: Urgency/Timeline** (Qualifies priority)
- "How soon are you looking to see improvements?"
- "Is this for hitting this quarter's goals, or longer-term?"
- "Are you dealing with something urgent or planning ahead?"

**Q4: Budget Qualification** (Sensitive - optional)
- "Have you worked with a sales coach before?"
- "Are you personally investing or does your company cover development?"
- "What kind of ROI would make this a no-brainer for you?"

**Q5: Decision Authority** (If enterprise/company-paid)
- "Are you the decision-maker or do you need to check with leadership?"
- "Who else is involved in your development decisions?"

---

#### **Client Control: Question Toggle System**

**Airtable Settings Table:**

| Field | Type | Purpose |
|-------|------|---------|
| **Enable Qualifying Questions** | Checkbox | Turn on/off qualification flow |
| **Required Questions** | Multi-Select | Which questions MUST be asked |
| **Optional Questions** | Multi-Select | Which questions CAN be asked |
| **Min Qualification Level** | Number (1-5) | How deep to qualify before booking link |

**Example Client Configurations:**

**Ian (High-Touch):**
- Enable Qualifying Questions: ✅ ON
- Required: Pain Point, Coaching Format
- Optional: Timeline, Budget
- Min Level: 2 (ask 2+ questions before link)

**Future Client (Low-Touch):**
- Enable Qualifying Questions: ❌ OFF
- Required: None
- Optional: None
- Min Level: 0 (send link immediately)

---

#### **Qualifying Conversation Flow:**

```
LEAD: "Yes I'm interested"
  ↓
BOT: "Great [Name]! Quick question - what's driving your interest? 
      Hitting quota, skill gaps, or something else?"
  ↓
LEAD: "Struggling with closing enterprise deals"
  ↓
BOT: "Gotcha - enterprise sales is Ian's specialty. 
      
      Are you looking for 1-on-1 coaching or would group sessions work?"
  ↓
LEAD: "Prefer 1-on-1"
  ↓
BOT: "Perfect. Ian's 1-on-1 clients typically see 20-40% lift in 3-6 months.
      
      Here's the strategy call link: [url]
      
      Or if you want to talk to someone first about how it works, I can have 
      the team call you. What's better?"
  ↓
LEAD: "I'll book"
  ↓
BOT: "Awesome! Looking forward to helping you close those enterprise deals 🎯"
```

**Data Captured:**
- Pain point: "Enterprise closing"
- Format preference: "1-on-1"
- Qualification level: High (engaged in conversation)
- Ready to book: Yes

**Stored in Airtable** for strategy call context!

---

### **Addition 3: Personalization via Enrichment Data**

**Scenario**: Use Clay/Apollo data to personalize conversations

---

#### **Enrichment Fields to Add to Leads Table:**

**Job History (From Clay/Apollo):**
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| **Previous Company** | Text | Clay | Detect job changes |
| **Previous Title** | Text | Clay | Career progression |
| **Job Change Date** | Date | Clay | How recent is change |
| **Tenure at Current Company** | Number (months) | Clay | Stability indicator |
| **Career Level** | Single Select | Clay | IC, Manager, Director, VP, C-Suite |
| **Total Years in Sales** | Number | Clay | Experience level |

**Company Context (From Clay/Apollo):**
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| **Company Size** | Number | Clay | Enterprise vs SMB |
| **Company Funding** | Text | Clay | Startup stage |
| **Company Growth Rate** | Number (%) | Clay | Fast-growing = urgency |
| **Tech Stack** | Long Text | Clay | What tools they use |
| **Recent News** | Long Text | Clay | Funding, layoffs, expansion |

**Sales Context:**
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| **Deal Size Range** | Text | Manual/Clay | SMB, Mid-Market, Enterprise |
| **Sales Methodology** | Text | LinkedIn/Clay | MEDDIC, Challenger, etc. |
| **LinkedIn Activity** | Number | Clay | Engagement level |
| **Content Topics** | Long Text | Clay | What they post about |

---

#### **Personalization Examples:**

**Scenario 1: Recent Job Change**
```javascript
// Lead profile shows: Job Change Date = 2 weeks ago
const message = `Hey [Name], congrats on the [New Title] role at [Company]! 
The first 90 days are critical.

Most new AEs I work with want to ramp faster than the standard 6-month curve. 
Is that what's driving your interest?`;
```

**Scenario 2: Fast-Growing Company**
```javascript
// Company Growth Rate = 150% YoY, Recent Funding = Series B
const message = `[Name], I see [Company] just raised Series B - congrats! 
That usually means aggressive growth targets for the sales team.

Are you looking to scale your own performance to match the company's growth?`;
```

**Scenario 3: Enterprise Deal Size**
```javascript
// Deal Size Range = $100K-$500K
const message = `[Name], closing enterprise deals in the $100K+ range is a 
different game. Most of my enterprise clients struggle with either long sales 
cycles or navigating buying committees.

Which one's your bigger challenge?`;
```

**Scenario 4: Specific Pain Point from LinkedIn**
```javascript
// Recent LinkedIn post: "Struggling with pipeline in Q4"
const message = `Hey [Name], saw your post about Q4 pipeline challenges. 
You're not alone - most AEs hit that in Q4.

Quick question - is it a prospecting issue or deals stuck in your pipeline?`;
```

---

#### **Enrichment Waterfall Enhancement:**

**Current Enrichment (Existing):**
- Basic company info
- Job title
- Location
- LinkedIn URL

**New Enrichment (Required for Personalization):**
- ✅ Job history (previous role, tenure)
- ✅ Job change detection (recent = last 6 months)
- ✅ Company growth metrics
- ✅ Funding/news
- ✅ LinkedIn activity analysis
- ✅ Deal size range (from title + company)

**Source**: Clay → Airtable (enhance existing enrichment workflow)

---

#### **Client Control: Personalization Toggle**

**Settings:**

| Setting | Type | Purpose |
|---------|------|---------|
| **Enable Personalization** | Checkbox | Use enrichment data in responses |
| **Personalization Level** | Select | Basic, Moderate, Deep |
| **Personalization Fields** | Multi-Select | Which data to use (job change, company, etc.) |

**Levels:**

**Basic** (Generic responses):
- Uses name only
- Standard templates
- No enrichment data

**Moderate** (Light personalization):
- References company
- Mentions job title
- Acknowledges job changes

**Deep** (Full enrichment):
- Recent company news
- Career progression
- LinkedIn activity
- Tech stack mentions
- Industry-specific language

**Example: Ian wants "Deep", Future client might want "Basic"**

---

## 🏗️ ENHANCED SYSTEM ARCHITECTURE

### **Complete Flow with All Additions:**

```
INBOUND MESSAGE
    ↓
Parse & Extract Phone
    ↓
Find Lead in Airtable
    ↓
Load Lead Enrichment Data (Clay fields)
    ↓
Load Client Settings (qualification, personalization, nurture prefs)
    ↓
Classify Intent (10 categories + confidence)
    ↓
    ├─→ [POSITIVE INTEREST]
    │     ├─→ Check: Qualifying questions enabled?
    │     │     YES → Ask qualifying question (pain point, format, timing)
    │     │     NO → Send booking link directly
    │     │
    │     ├─→ On subsequent reply:
    │     │     └─→ Capture qualification data
    │     │     └─→ Store in Airtable (pain point, preferences)
    │     │     └─→ Offer booking + personal outreach option
    │     │
    │     └─→ Actions:
    │           └─→ Update: Engaged, store qual data
    │           └─→ Slack: Hot lead with context
    │           └─→ Continue conversation
    │
    ├─→ [SOFT NO - TIMING]
    │     ├─→ Extract timing from message ("few weeks", "end of month")
    │     ├─→ Confirm timing conversationally
    │     │     "How about I reach out [timeframe]?"
    │     │
    │     ├─→ Check: Auto-nurture enabled?
    │     │     YES → Schedule automatic follow-up message
    │     │     NO → Flag for manual sales call
    │     │
    │     └─→ Actions:
    │           └─→ Stop current campaign
    │           └─→ Set follow-up date (extracted or +90 days)
    │           └─→ Tag: Nurture-Timing-[Reason]
    │           └─→ Store conversation context
    │           └─→ Slack: Nurture opportunity scheduled
    │
    ├─→ [QUESTIONS]
    │     ├─→ Detect question type (process, cost, credibility)
    │     ├─→ Use AQA framework:
    │     │     └─→ Acknowledge question
    │     │     └─→ Give brief answer
    │     │     └─→ Ask qualifying question back
    │     │
    │     ├─→ Check: Personalization enabled?
    │     │     YES → Reference enrichment data in response
    │     │     NO → Generic response
    │     │
    │     └─→ Actions:
    │           └─→ Continue conversation
    │           └─→ Store Q&A in conversation log
    │           └─→ If complex → Escalate to human
    │
    └─→ [Other intents...]
          └─→ [Follow same enhanced logic]
```

---

## 🎯 FEATURE 1: INTELLIGENT NURTURE SCHEDULING

### **Natural Language Date Extraction:**

**System detects and extracts timing from messages:**

| Their Message | System Extracts | Follow-up Date |
|---------------|-----------------|----------------|
| "Check back in a few weeks" | +14 days | Nov 1, 2025 |
| "End of the month" | Last day of month | Oct 31, 2025 |
| "After the holidays" | Jan 7 | Jan 7, 2026 |
| "In 3 months" | +90 days | Jan 17, 2026 |
| "Q1 next year" | Q1 start | Jan 1, 2026 |
| "After I hit quota" | +60 days (assumption) | Dec 17, 2025 |
| "Maybe next quarter" | Next quarter start | Jan 1, 2026 |

**Extraction Logic:**
```javascript
function extractFollowUpDate(message) {
  const text = message.toLowerCase();
  const now = new Date();
  
  // Explicit timeframes
  if (text.match(/few weeks?/)) return addDays(now, 14);
  if (text.match(/end of (the )?month/)) return endOfMonth(now);
  if (text.match(/next month/)) return addMonths(now, 1);
  if (text.match(/couple months?/)) return addMonths(now, 2);
  if (text.match(/after holidays/)) return new Date(now.getFullYear() + 1, 0, 7);
  if (text.match(/q1|first quarter/)) return nextQuarterStart(now);
  
  // Numeric extraction
  const weeksMatch = text.match(/in (\d+) weeks?/);
  if (weeksMatch) return addDays(now, parseInt(weeksMatch[1]) * 7);
  
  const monthsMatch = text.match(/in (\d+) months?/);
  if (monthsMatch) return addMonths(now, parseInt(monthsMatch[1]));
  
  // Default: 90 days if timing mentioned but unclear
  return addDays(now, 90);
}
```

---

### **Conversational Confirmation:**

**Bot Response:**
> "I totally get it [Name]. Sounds like [their reason - job change/busy/etc.] is the priority right now.
> 
> How about I drop you a note at the end of the month - does [extracted date] work for you?"

**Lead confirms or adjusts:**
- "Yes that works" → Schedule confirmed
- "Make it 2 months instead" → Adjust to new date
- "Actually don't bother" → Convert to hard stop

---

### **Nurture Execution (Two Modes):**

#### **Mode A: Automatic Nurture Message**

**Triggered by**: n8n Schedule Trigger (checks daily for due follow-ups)

**Workflow**: `UYSP-Twilio-Nurture-Scheduler`

```javascript
// Daily at 9 AM ET
// Query Airtable for leads where:
//   - Follow-up Date = today
//   - Follow-up Action = "auto_send"
//   - SMS Stop = FALSE

// For each lead:
//   1. Send nurture message via Twilio
//   2. Reset to normal campaign or mark complete
//   3. Log in audit
```

**Nurture Message Template:**
> "Hi [Name], it's Ian's team checking back in as promised! 
> 
> [If they mentioned reason: "Hope things are less crazy now!" / "How's the new role going?"]
> 
> If timing's better, here's the strategy call link: [url]
> 
> Or just let me know if you want to push this out a bit further!"

**Why this works**: Keeps promise, shows you remembered, low pressure

---

#### **Mode B: Manual Sales Call**

**Triggered by**: Daily Slack reminder

**Workflow**: `UYSP-Follow-up-Reminders`

```javascript
// Daily at 8 AM ET
// Query Airtable for leads where:
//   - Follow-up Date = today
//   - Follow-up Action = "manual_call"
//   - Manual Follow-up Required = TRUE

// Send Slack message to sales team:
```

**Slack Reminder:**
> "📞 **Follow-up Calls Due Today**
> 
> **[Name 1]** - Requested follow-up for [reason]
> - Original message: "[quote]"
> - Scheduled: [Date promised]
> - Action: Call/email to re-engage
> - Context: [Conversation summary]
> - [Airtable link]
> 
> **[Name 2]** - [...]
> 
> **Total**: 3 follow-ups due today"

**Why manual**: Personal touch, complex situations, high-value leads

---

## 🎯 FEATURE 2: QUALIFYING QUESTIONS (AI-Driven Sales Flow)

### **Sales Methodology Integration:**

**Principle**: Qualify before you close

**Flow**:
1. Detect positive interest
2. Ask qualifying question (pain point)
3. Capture response
4. Ask secondary question (format/timeline)
5. Store qualification data
6. THEN offer booking with context

---

### **Question Selection Logic:**

```javascript
// Determine which qualifying questions to ask
function selectQualifyingQuestions(lead, settings, conversationHistory) {
  
  const questions = [];
  const required = settings['Required Questions'] || [];
  const optional = settings['Optional Questions'] || [];
  const minLevel = settings['Min Qualification Level'] || 0;
  
  // Always start with pain point
  if (required.includes('Pain Point') || conversationHistory.length === 0) {
    questions.push({
      type: 'pain_point',
      text: `What's driving your interest ${lead['First Name']}? Hitting quota, skill gaps, or something else?`,
      field: 'Pain Point'
    });
  }
  
  // Then coaching format
  if (required.includes('Coaching Format')) {
    questions.push({
      type: 'format',
      text: "Are you looking for 1-on-1 coaching or would group sessions work?",
      field: 'Coaching Format Preference'
    });
  }
  
  // Timeline if required
  if (required.includes('Timeline')) {
    questions.push({
      type: 'timeline',
      text: "How soon are you looking to see improvements?",
      field: 'Timeline'
    });
  }
  
  // Optional questions based on conversation
  if (optional.includes('Budget') && conversationHistory.some(msg => msg.includes('cost') || msg.includes('price'))) {
    questions.push({
      type: 'budget',
      text: "Have you worked with a sales coach before? Just curious about your expectations.",
      field: 'Prior Coaching Experience'
    });
  }
  
  return questions.slice(0, minLevel);  // Only ask up to min required
}
```

---

### **Qualification Data Storage:**

**New Airtable Fields (Leads Table):**

| Field | Type | Purpose |
|-------|------|---------|
| **Pain Point** | Single Select | Primary challenge they mentioned |
| **Pain Point Details** | Long Text | Their exact words |
| **Coaching Format Preference** | Single Select | 1-on-1, Group, Either |
| **Timeline** | Single Select | Immediate, This Quarter, 3-6 months, Future |
| **Prior Coaching Experience** | Checkbox | Have they worked with coach before |
| **Qualification Score** | Number (0-100) | How qualified based on answers |
| **Qualification Notes** | Long Text | Summary of qualification exchange |

**Pain Point Options:**
- Prospecting/Pipeline
- Closing/Converting
- Objection Handling
- Discovery/Qualification
- Negotiation
- Account Management
- Mindset/Confidence
- Time Management
- Leadership/Coaching Team
- Career Transition

---

### **Example Qualified Conversation:**

```
LEAD: "Interested"
  ↓
BOT: "Great [Name]! What's driving your interest - quota pressure, 
      skill gaps, or something else?"
  ↓
LEAD: "I keep losing deals at the end"
  ↓
BOT: "Gotcha - closing challenges. Is it more about objection handling 
      or creating urgency to close?"
  ↓
LEAD: "Objections kill me"
  ↓
BOT: "Perfect. Ian specializes in objection handling - his framework 
      helped [testimonial].
      
      Looking for 1-on-1 work or would group coaching fit better?"
  ↓
LEAD: "1-on-1 for sure"
  ↓
BOT: "Makes sense for objection work. Here's the strategy call link: [url]
      
      On the call, you'll walk through your typical objections and Ian 
      will show you his exact framework.
      
      Sound good?"
  ↓
LEAD: "Booking now"
  ↓
BOT: "Awesome! Looking forward to helping you handle those objections 🎯"
```

**Data Captured & Stored:**
```javascript
{
  pain_point: "Closing/Converting",
  pain_point_details: "Losing deals at the end, objections kill me",
  coaching_format_preference: "1-on-1",
  timeline: "Immediate",
  qualification_score: 85,
  qualification_notes: "High intent, clear pain point (objections), prefers 1-on-1, ready to book immediately",
  conversation_turn_count: 4,
  qualification_level: "hot"
}
```

**Why valuable**: Strategy call team has FULL context before the call even starts!

---

## 🎯 FEATURE 3: ENRICHMENT-DRIVEN PERSONALIZATION

### **Personalization Engine:**

**Input Data:**
- Lead profile (Airtable)
- Enrichment data (Clay/Apollo)
- Conversation history
- Campaign context
- Client settings (personalization level)

**Output**: Contextual, personalized response

---

### **Personalization Rules:**

#### **Rule 1: Recent Job Change (< 6 months)**

**Trigger**: `Job Change Date` within last 180 days

**Personalization:**
```javascript
const daysSinceChange = dateDiff(now, lead['Job Change Date']);

if (daysSinceChange < 90) {
  const congrats = "Congrats on the new role at " + lead['Company'] + "!";
  const context = "The first 90 days are critical for setting the tone.";
  const question = "Are you looking to ramp faster than the typical 6-month curve?";
  
  return `${congrats} ${context} ${question}`;
}
```

**Why**: Shows you did research, relevant to their situation, timely

---

#### **Rule 2: Company Funding/Growth**

**Trigger**: `Company Funding` or `Company Growth Rate` available

**Personalization:**
```javascript
if (lead['Company Funding']?.includes('Series B')) {
  return `${firstName}, I see ${lead['Company']} just raised Series B - that usually means aggressive targets for sales. Are you looking to scale your performance to match?`;
}

if (lead['Company Growth Rate'] > 100) {
  return `${firstName}, ${lead['Company']} is growing fast (${lead['Company Growth Rate']}% YoY). Is the team trying to keep pace with that growth?`;
}
```

---

#### **Rule 3: LinkedIn Activity**

**Trigger**: `LinkedIn Activity` or `Content Topics` available

**Personalization:**
```javascript
if (lead['Content Topics']?.includes('pipeline') || lead['Content Topics']?.includes('quota')) {
  return `Hey ${firstName}, I noticed you've been posting about pipeline challenges. That's what most of my AEs struggle with too. What's your specific bottleneck?`;
}
```

---

#### **Rule 4: Deal Size / Title**

**Trigger**: `Job Title` indicates seniority or `Deal Size Range` known

**Personalization:**
```javascript
if (lead['Job Title']?.includes('Enterprise') || lead['Deal Size Range']?.includes('$100K+')) {
  return `${firstName}, closing enterprise deals is a different game - longer cycles, buying committees, higher stakes. Which part trips you up most?`;
}

if (lead['Job Title']?.includes('VP') || lead['Job Title']?.includes('Director')) {
  return `${firstName}, as a ${lead['Job Title']}, you're probably more focused on coaching your team than your own skills. Is that what's driving your interest, or something else?`;
}
```

---

### **Enrichment Expansion Requirements:**

**Current Clay Enrichment** (Existing in your system):
- Basic company data
- Job title
- Location
- LinkedIn URL

**New Clay Enrichment Needed:**

**Tier 1: Job History (Critical):**
- [ ] Previous company
- [ ] Previous title
- [ ] Job change date
- [ ] Tenure at current company
- [ ] Total years in sales

**Tier 2: Company Intelligence:**
- [ ] Company size (employees)
- [ ] Funding stage and amount
- [ ] Growth rate (YoY %)
- [ ] Recent news (last 90 days)
- [ ] Tech stack

**Tier 3: Sales Context:**
- [ ] Deal size indicators
- [ ] Sales methodology (from LinkedIn/job description)
- [ ] LinkedIn activity level
- [ ] Content topics (what they post about)

**Tier 4: Personal Signals:**
- [ ] Recent LinkedIn posts (last 30 days)
- [ ] Job satisfaction signals
- [ ] Career trajectory (up/lateral/down)
- [ ] Engagement with sales content

**Data Source**: Clay → Airtable (enhance existing enrichment waterfall)

**Build Time**: 2-3 hours to add new Clay columns + update n8n enrichment workflow

---

## 🎛️ CLIENT PREFERENCE CONTROLS

### **Settings Table - Conversation Configuration:**

**Per-Client Toggles:**

| Setting | Type | Options | Default (Ian) | Purpose |
|---------|------|---------|---------------|---------|
| **Enable Two-Way** | Checkbox | ON/OFF | ON | Master switch |
| **Enable Qualifying Questions** | Checkbox | ON/OFF | ON | Ask before booking |
| **Required Questions** | Multi-Select | Pain Point, Format, Timeline, Budget | Pain Point, Format | Must ask these |
| **Min Qualification Level** | Number | 0-5 | 2 | # of questions before link |
| **Enable Personalization** | Checkbox | ON/OFF | ON | Use enrichment data |
| **Personalization Level** | Select | Basic, Moderate, Deep | Deep | How much to personalize |
| **Auto-Nurture Enabled** | Checkbox | ON/OFF | OFF | Auto-send follow-ups or manual |
| **Default Nurture Delay** | Number (days) | 7-180 | 90 | If timing unclear |
| **Enable AI Responses** | Checkbox | ON/OFF | OFF (v2.0) | Use AI vs patterns |
| **Max Conversation Turns** | Number | 1-10 | 5 | Auto-escalate after X turns |
| **Business Hours Only** | Checkbox | ON/OFF | OFF | Respond only 9-5 or 24/7 |

**Why per-client**: Different clients want different approaches

---

### **Example Configurations:**

#### **Ian (High-Touch, Personalized):**
```javascript
{
  enable_two_way: true,
  enable_qualifying_questions: true,
  required_questions: ['Pain Point', 'Coaching Format'],
  min_qualification_level: 2,
  enable_personalization: true,
  personalization_level: 'deep',
  auto_nurture_enabled: false,  // Manual sales calls preferred
  default_nurture_delay: 90,
  enable_ai_responses: false,  // v1.0 patterns for now
  max_conversation_turns: 5,
  business_hours_only: false
}
```

---

#### **Future Client (Low-Touch, Fast):**
```javascript
{
  enable_two_way: true,
  enable_qualifying_questions: false,  // Send link immediately
  required_questions: [],
  min_qualification_level: 0,
  enable_personalization: true,
  personalization_level: 'basic',  // Name + company only
  auto_nurture_enabled: true,  // Bot handles follow-ups
  default_nurture_delay: 30,  // Faster follow-up
  enable_ai_responses: true,  // v2.0 AI for all responses
  max_conversation_turns: 3,
  business_hours_only: true  // Only respond 9-5 ET
}
```

---

## 📊 COMPLETE CONVERSATION DATA MODEL

### **Conversation Object (Stored in Airtable):**

```javascript
{
  // Identity
  conversation_id: "conv_rec9Jpl7lL9szpRl8_20251017",
  lead_record_id: "rec9Jpl7lL9szpRl8",
  phone: "+18319990500",
  
  // Conversation metadata
  started_at: "2025-10-17T01:00:00Z",
  last_exchange_at: "2025-10-17T01:05:23Z",
  turn_count: 4,
  status: "active",  // active, completed, escalated, stopped
  
  // Intent tracking
  intents_detected: ["POSITIVE_INTEREST", "QUESTION", "OUTREACH_REQUEST"],
  primary_intent: "POSITIVE_INTEREST",
  qualification_level: "hot",  // cold, warm, hot, engaged
  
  // Qualification data
  pain_point: "Closing/Enterprise Deals",
  pain_point_details: "Struggling with objection handling in $100K+ deals",
  coaching_format_preference: "1-on-1",
  timeline: "Immediate",
  budget_sensitivity: "Low",  // inferred
  qualification_score: 85,
  
  // Actions taken
  actions: [
    {action: "sent_qualifying_question", timestamp: "..."},
    {action: "stored_pain_point", timestamp: "..."},
    {action: "sent_booking_link", timestamp: "..."},
    {action: "notified_sales_team", timestamp: "..."}
  ],
  
  // Follow-up
  follow_up_required: true,
  follow_up_type: "manual_call",
  follow_up_date: "2025-10-17",
  follow_up_priority: "HIGH",
  follow_up_note: "Hot lead - wants personal call before booking. Qualified: enterprise closing, objections, 1-on-1 preference.",
  
  // Conversation history (full messages)
  messages: [
    {direction: "outbound", text: "Hi Latif...", sent_at: "..."},
    {direction: "inbound", text: "Yes interested", received_at: "..."},
    {direction: "outbound", text: "Great! What's driving...", sent_at: "..."},
    {direction: "inbound", text: "Struggling with closing...", received_at: "..."},
    // ... full exchange
  ],
  
  // AI summary (v2.0)
  conversation_summary: "High-intent lead struggling with enterprise deal objections. Prefers 1-on-1 coaching. Requested personal call before booking. Follow up urgently.",
  
  // Enrichment context used
  personalization_data_used: ["job_title", "company_size", "deal_size_range"],
  
  // Escalation
  escalated_to_human: false,
  escalation_reason: null
}
```

---

## 🏗️ ENHANCED AIRTABLE SCHEMA

### **Leads Table - Complete New Fields:**

#### **Conversation Tracking:**
- Conversation Status (Select: No Reply, Interested, Question, etc.)
- Last Reply At (DateTime)
- Last Reply Text (Long Text)
- Reply Count (Number)
- Conversation Turn Count (Number)
- Conversation Summary (Long Text)

#### **Qualification Data:**
- Pain Point (Select: 10 options)
- Pain Point Details (Long Text)
- Coaching Format Preference (Select: 1-on-1, Group, Either)
- Timeline (Select: Immediate, This Quarter, Future)
- Budget Sensitivity (Select: Low, Medium, High)
- Prior Coaching Experience (Checkbox)
- Qualification Score (Number 0-100)
- Qualification Level (Select: Cold, Warm, Hot, Engaged)

#### **Follow-up Management:**
- Manual Follow-up Required (Checkbox)
- Follow-up Date (Date)
- Follow-up Type (Select: Auto Message, Manual Call, Email)
- Follow-up Priority (Select: Low, Medium, High, Urgent)
- Follow-up Note (Long Text)
- Follow-up Reason (Select: Timing, Budget, Info Requested, etc.)

#### **Nurture Tracking:**
- Nurture Tag (Select: Timing-Issue, Budget-Issue, Paused, etc.)
- Nurture Campaign ID (Text)
- Next Nurture Date (Date)
- Nurture Status (Select: Active, Paused, Stopped)

#### **Enrichment Data (New from Clay):**
- Previous Company (Text)
- Previous Title (Text)
- Job Change Date (Date)
- Tenure at Company (Number - months)
- Career Level (Select: IC, Manager, Director, VP, C-Suite)
- Total Years in Sales (Number)
- Company Size (Number)
- Company Funding (Text)
- Company Growth Rate (Number %)
- Recent Company News (Long Text)
- Deal Size Range (Select: SMB <$25K, Mid $25-100K, Enterprise $100K+)
- Tech Stack (Long Text)
- LinkedIn Activity Level (Number 0-100)

**Total New Fields**: ~35 fields

---

## 🚀 BUILD PLAN - COMPLETE SYSTEM

### **Phase 1: Core Conversation System** (4 hours)

**Build:**
- Enhanced intent classifier (10 categories, 3-tier stop logic)
- Response generator with AQA framework
- Basic action handlers
- Conversation logging

**Output**: Pattern-based system handling all scenarios

---

### **Phase 2: Qualifying Questions** (3 hours)

**Build:**
- Question selection logic
- Client settings integration
- Multi-turn tracking
- Qualification data capture
- Airtable qualification fields

**Output**: System asks questions before offering booking

---

### **Phase 3: Nurture Scheduling** (3 hours)

**Build:**
- Date extraction from natural language
- Conversational confirmation
- Auto vs manual routing
- Follow-up scheduler workflow
- Daily reminder system

**Output**: Soft nos become future opportunities

---

### **Phase 4: Personalization Engine** (4 hours)

**Build:**
- Enrichment data integration
- Personalization rules (job change, funding, etc.)
- Dynamic message generation
- Client personalization settings

**Prerequisite**: Clay enrichment expansion (separate 2-3 hour task)

**Output**: Messages reference lead's specific situation

---

### **Phase 5: Airtable Schema Updates** (2 hours)

**Execute:**
- Add 35 new fields to Leads table
- Add enhanced fields to SMS_Audit
- Update Settings table with conversation controls
- Create sample data

---

### **Phase 6: Testing & Validation** (4 hours)

**Test:**
- All 10 intent scenarios
- Multi-turn conversations
- Nurture scheduling (auto + manual)
- Qualification flow
- Personalization accuracy
- Edge cases

---

## ⏱️ TOTAL BUILD TIME ESTIMATE

**v1.0 Complete System:**
- Core conversation: 4 hours
- Qualifying questions: 3 hours
- Nurture scheduling: 3 hours
- Personalization: 4 hours
- Schema updates: 2 hours
- Testing: 4 hours
- **Total: ~20 hours**

**Broken into phases:**
- Week 1: Core + Qualifying (7 hours) → Basic intelligent responses
- Week 2: Nurture + Personalization (7 hours) → Full feature set
- Week 3: Testing + Refinement (6 hours) → Production ready

---

## 🎯 PHASED ROLLOUT STRATEGY

### **Week 1: Core System (Minimum Viable)**

**Build & Deploy:**
- Intent classification
- Response templates
- Basic actions (stop, interested, questions)
- Conversation logging

**Client can:**
- Receive replies
- Auto-respond to common scenarios
- Track conversations
- Get Slack alerts

**Value**: Handles 80% of replies automatically

---

### **Week 2: Qualification & Nurture**

**Add:**
- Qualifying questions
- Nurture scheduling
- Follow-up system

**Client can:**
- Qualify leads before booking
- Schedule automatic or manual follow-ups
- Convert soft nos to future opportunities

**Value**: Better lead quality, no lost opportunities

---

### **Week 3: Personalization & Polish**

**Add:**
- Clay enrichment expansion
- Personalization engine
- Advanced routing

**Client can:**
- Ultra-personalized responses
- Reference job changes, company news
- Higher engagement rates

**Value**: Premium experience, better conversion

---

## ✅ DECISION POINTS FOR YOU

**Before I start building, confirm:**

### **1. Build Approach:**
- [ ] **Option A**: Build complete v1.0 now (~20 hours over 2-3 days)
- [ ] **Option B**: Build in phases (Week 1: Core, Week 2: Nurture, Week 3: Personalization)
- [ ] **Option C**: Build minimal now, enhance after A2P approved and tested

---

### **2. Clay Enrichment:**
- [ ] Expand Clay enrichment waterfall FIRST (so data is ready)
- [ ] Build conversation system first, add enrichment later
- [ ] Parallel: I build conversations, you configure Clay enrichment

---

### **3. Client Settings:**
- [ ] Ian's preferences confirmed (Qualifying: ON, Personalization: Deep, Auto-Nurture: OFF)
- [ ] Or should settings be adjustable later after seeing it work?

---

### **4. Priority Features:**

**Rank these 1-4 by importance:**
- [ ] Qualifying questions (ask before booking)
- [ ] Nurture scheduling (soft no → future follow-up)
- [ ] Personalization (use enrichment data)
- [ ] Auto-responses (handle common replies)

---

## 🚀 **READY TO PROCEED?**

**I have complete specifications for:**
- ✅ 10-category intent classification
- ✅ 3-tier stop logic (Hard/Soft/Maybe)
- ✅ AQA sales framework
- ✅ Qualifying question flow
- ✅ Nurture scheduling (auto + manual)
- ✅ Personalization engine
- ✅ 35 new Airtable fields
- ✅ Client preference controls

**Files created:**
1. `TWO-WAY-CONVERSATION-SYSTEM-REQUIREMENTS.md` (1,012 lines)
2. `TWO-WAY-REFINED-REQUIREMENTS.md` (detailed scenarios)
3. `TWO-WAY-SYSTEM-COMPLETE-SPEC.md` (this file - complete architecture)

**What's your preference:**
1. Start building now (tell me which phase or full system)
2. Review specs first, refine, then build
3. Wait until A2P approved, then build and test together
4. Pivot to other UYSP task while A2P processes

**I'm ready when you are!** [[memory:8472517]]
