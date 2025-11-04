# AI Message Context Strategy & Current Implementation

**Date**: 2025-11-04
**Purpose**: Understand and optimize AI message generation with proper context

---

## Current AI Implementation Status

### ✅ FULLY BUILT AND READY

**API Endpoint**: `/api/admin/campaigns/generate-message`
**Status**: PRODUCTION-READY
**Model**: Azure OpenAI GPT-5 (with GPT-5-mini fallback)
**Rate Limit**: 10 messages per user per hour

---

## How AI Message Generation Currently Works

### Input Parameters (What AI Receives)

```typescript
{
  campaignName: string,           // e.g., "Q4 2025 Webinar Follow-up"
  targetAudience: string,         // e.g., "tech sales professionals who registered for webinar"
  messageGoal: 'book_call' | 'provide_value' | 'nurture' | 'follow_up',
  tone: 'professional' | 'friendly' | 'casual' | 'urgent',
  includeLink: boolean,           // Include Calendly link?
  customInstructions?: string     // ⭐ FREEFORM CONTEXT FIELD
}
```

### What AI Generates

```json
{
  "message": "Hey {{first_name}}! Thanks for joining our Q4 webinar...",
  "charCount": 147,
  "segments": 1,
  "estimatedCostPerMessage": 0.0075,
  "warning": null,
  "modelUsed": "gpt-5",
  "suggestions": [
    "Message fits in single SMS (160 chars) - optimal!",
    "Personalization with {{first_name}} detected"
  ]
}
```

### AI Prompt Template

The AI receives this prompt (from `buildMessagePrompt()` function):

```
You are an expert SMS copywriter for Ian Koniak's sales coaching business "Untap Your Sales Potential" (UYSP).

Write an SMS message for the following campaign:

Campaign Name: {campaignName}
Target Audience: {targetAudience}
Message Goal: {goal instructions}
Tone: {tone guidelines}
Additional Instructions: {customInstructions}  ⭐ THIS IS THE KEY FIELD

Requirements:
- Keep it under 160 characters if possible (max 1600)
- Use {{first_name}} placeholder for personalization
- Include/exclude Calendly link based on preference
- Sound natural, like it's from Ian's team (not a bot)
- Focus on value, not selling
- Avoid spam trigger words

Brand Voice Guidelines:
- Ian Koniak is a former #1 sales rep and now helps tech sellers reach their potential
- UYSP focuses on coaching, not courses - personalized 1-on-1 support
- Speak to the challenges of ambitious sales professionals
- Be supportive and empowering, not condescending

Write ONLY the SMS message text, no explanations.
```

---

## Database: What Context Is Already Captured

### Campaigns Table (schema.ts line 181-225)

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,                        -- ⭐ FREEFORM CONTEXT FIELD
  
  -- Webinar campaigns
  campaign_type VARCHAR(50),               -- 'Standard', 'Webinar', 'Custom'
  form_id VARCHAR(255),                    -- Kajabi form ID
  webinar_datetime TIMESTAMP,              -- When webinar occurs
  zoom_link VARCHAR(500),                  -- Webinar link
  resource_link VARCHAR(500),              -- Download link (e.g., guide PDF)
  resource_name VARCHAR(255),              -- "Pricing Guide", "Sales Playbook"
  
  -- Custom campaigns
  target_tags TEXT[],                      -- Kajabi tags to target
  messages JSONB,                          -- Message sequence with timing
  
  -- Metadata
  messages_sent INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Leads Table (schema.ts line 65-149)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  title VARCHAR(255),
  
  -- Campaign context
  campaign_name VARCHAR(255),              -- Which campaign they're in
  form_id VARCHAR(255),                    -- Which form they filled out
  lead_source VARCHAR(50),                 -- 'Standard Form', 'Webinar Form', 'Custom'
  webinar_datetime TIMESTAMP,              -- When THEIR webinar is
  
  -- Engagement context
  kajabi_tags TEXT[],                      -- Tags from Kajabi (e.g., "Downloaded Pricing Guide")
  engagement_level VARCHAR(50),            -- 'High', 'Medium', 'Low'
  clicked_link BOOLEAN DEFAULT false,
  click_count INTEGER DEFAULT 0,
  booked BOOLEAN DEFAULT false,
  
  -- SMS tracking
  sms_sequence_position INTEGER DEFAULT 0,
  sms_sent_count INTEGER DEFAULT 0,
  sms_last_sent_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Strategy Options: How to Provide AI Context

### Option 1: Use Existing `customInstructions` Field ⭐ RECOMMENDED

**How it works**: When admin creates campaign, they paste context into the custom instructions box.

**Where it's used**: Passed directly to AI prompt as "Additional Instructions"

**Pros**:
- ✅ Already built - no code changes needed
- ✅ Maximum flexibility - any format
- ✅ Works TODAY in production

**Cons**:
- ❌ Manual - admin must write/paste context each time
- ❌ No structured format

**Example workflow**:
```
1. Admin clicks "Generate Message" in campaign form
2. Modal appears with fields:
   - Campaign Name: "Q4 2025 Webinar Follow-up"
   - Target Audience: "Tech sales reps who registered for webinar"
   - Message Goal: "Book Call"
   - Tone: "Friendly"
   - Custom Instructions: [PASTE CONTEXT HERE]
3. Admin pastes: "This webinar was about using AI for outbound. 
   Speakers were Ian Koniak and Sam Smith. Key takeaway: 
   AI can 10x your outreach if used correctly. Offer: 
   free 30-min strategy call to build their AI stack."
4. AI generates personalized message using that context
```

---

### Option 2: Store Campaign Description, Auto-Include in AI Prompt

**How it works**: Add `description` field to campaign creation forms, auto-pass to AI.

**Database**: `campaigns.description` field ALREADY EXISTS (line 187)

**Code changes needed**:
1. Add description textarea to CampaignForm.tsx
2. Save to database on campaign creation
3. When generating message, fetch campaign by ID and include description in prompt

**Pros**:
- ✅ Context stored once, reused for all messages in campaign
- ✅ Admin doesn't retype context each time
- ✅ Database field already exists

**Cons**:
- ⚠️ Requires UI changes to campaign forms
- ⚠️ Requires backend changes to auto-fetch campaign context

**Example workflow**:
```
1. Admin creates "Q4 2025 Webinar" campaign
2. Fills out description field: "Webinar about AI for outbound. 
   Speakers: Ian Koniak and Sam Smith. Offer: free strategy call."
3. Campaign saved with description
4. Later, admin clicks "Generate Message #3" for this campaign
5. System auto-fetches campaign.description and includes in AI prompt
6. AI generates message with full context
```

---

### Option 3: Fetch Context from Kajabi Form URL ⚠️ COMPLEX

**How it works**: Admin provides Kajabi form URL, system scrapes page for context.

**Technical approach**:
- Use Firecrawl MCP server (already configured in your setup)
- Fetch form page HTML
- Extract title, description, bullet points
- Pass to AI as context

**Pros**:
- ✅ Zero manual work - fully automated
- ✅ Always up-to-date with latest form content

**Cons**:
- ❌ Kajabi forms are often behind login walls
- ❌ Forms may not have much text content
- ❌ Scraping may break if Kajabi changes HTML
- ❌ Requires new API endpoint and MCP integration

**Reality check**: You mentioned "there's not much content there" on the signup forms. If forms are minimal (just name/email fields), scraping won't provide useful context.

---

### Option 4: Manual Context Box in Campaign Creation Form ⭐ BEST UX

**How it works**: Add prominent "AI Context" field to campaign creation form.

**UI Design**:
```
┌─ Create Campaign ──────────────────────────────────┐
│                                                     │
│ Campaign Name: _____________________________       │
│ Campaign Type: [Webinar ▼]                        │
│ Form ID: rec1234567890                            │
│                                                     │
│ ┌─ AI Message Context (Optional) ────────────┐   │
│ │                                              │   │
│ │ Help AI generate better messages by         │   │
│ │ providing context about this campaign.      │   │
│ │                                              │   │
│ │ Good to include:                             │   │
│ │ • What the webinar/resource is about        │   │
│ │ • Key speakers or topics                    │   │
│ │ • Main value proposition                    │   │
│ │ • What action you want leads to take        │   │
│ │                                              │   │
│ │ ┌──────────────────────────────────────┐   │   │
│ │ │ This webinar teaches tech sales      │   │   │
│ │ │ reps how to use AI for outbound.     │   │   │
│ │ │ Speaker: Ian Koniak. Main offer:     │   │   │
│ │ │ free 30-min strategy call.           │   │   │
│ │ └──────────────────────────────────────┘   │   │
│ │                                              │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ [Cancel]  [Create Campaign & Generate Messages]   │
└─────────────────────────────────────────────────────┘
```

**Pros**:
- ✅ Clear, guided UX
- ✅ Context saved with campaign
- ✅ Reusable for all messages in sequence
- ✅ Optional - doesn't block campaign creation

**Cons**:
- ⚠️ Requires UI changes to campaign forms
- ⚠️ Admin must manually write context (but only once)

---

### Option 5: Hybrid Approach (Smart Defaults + Manual Override) ⭐⭐ RECOMMENDED

**How it works**: System auto-generates basic context, admin can enhance.

**Auto-context sources**:
1. Campaign name (e.g., "Q4 2025 Webinar")
2. Webinar date/time (if applicable)
3. Resource name (e.g., "Pricing Guide")
4. Kajabi tags selected (e.g., "Downloaded Pricing Guide", "Attended Webinar")

**Manual enhancement**: Admin adds custom context on top

**Example**:
```
Auto-generated context:
"Campaign: Q4 2025 Webinar Follow-up
Webinar Date: November 15, 2025 at 2:00 PM ET
Resource: Sales Strategy Guide
Target audience tags: Attended Webinar, Tech Sales Rep"

Admin adds:
"Webinar topic was using AI for outbound sales. 
Main speaker: Ian Koniak. Key offer: free 30-min call 
to build personalized AI outreach stack."

Final context sent to AI:
[AUTO + MANUAL COMBINED]
```

**Pros**:
- ✅ Best of both worlds
- ✅ Saves admin time with smart defaults
- ✅ Allows customization where needed
- ✅ Works even if admin skips manual step

**Cons**:
- ⚠️ Most complex to build

---

## Recommendations: What to Build Next

### Phase 1: Quick Win (0 code changes) ✅ READY TODAY

**Use existing system**:
1. When generating messages, use `customInstructions` field
2. Admin pastes context each time (copy from Google Doc, Notion, etc.)
3. Test AI quality with various context examples

**Timeline**: Ready now
**Effort**: 0 minutes

---

### Phase 2: Store Context with Campaign (Easy)

**Changes needed**:
1. Add "Campaign Context" textarea to CampaignForm.tsx
2. Save to `campaigns.description` field (already exists!)
3. When generating message, fetch campaign and include description

**Files to modify**:
- `src/components/admin/CampaignForm.tsx` (add textarea)
- `src/app/api/admin/campaigns/generate-message/route.ts` (fetch campaign context)

**Timeline**: 1-2 hours
**Effort**: Easy

---

### Phase 3: Smart Auto-Context (Medium)

**Build auto-context generator**:
1. Extract campaign name, webinar date, resource name, tags
2. Format into structured context string
3. Show in UI as "Auto-detected context"
4. Allow admin to edit/enhance

**Files to modify**:
- `src/components/admin/CampaignForm.tsx` (auto-context preview)
- `src/lib/utils/ai-context-builder.ts` (new file - context logic)

**Timeline**: 3-4 hours
**Effort**: Medium

---

## How Tags Help AI Context

### Tags as Behavioral Context

**Example tags** (from your 746 leads):
- "Weekly Sales Training Newsletter" → Long-term engaged
- "Registration - Q4 2025 webinar" → Recently registered
- "Booked a call with sales team" → High intent
- "Newsletter Warmup Day 14" → In specific sequence
- "VSL" → Watched video sales letter
- "Problem Mapping" → Downloaded specific resource

### How AI Can Use Tags

**Prompt enhancement**:
```
Target Audience: Tech sales professionals

Behavioral context from tags:
- Downloaded "Problem Mapping" guide → interested in discovery process
- Registered for Q4 2025 webinar → interested in current trends
- Watching VSL → high engagement, video consumer
- NOT in "Booked a call" tag → haven't taken action yet

Generate message that:
1. References their download of Problem Mapping
2. Connects webinar topic to their interest in discovery
3. Offers free call to help implement what they learned
```

**Result**: Hyper-personalized message based on behavior

---

## AI Context Best Practices

### ✅ Good Context

```
Campaign: Q4 2025 AI Webinar Follow-up

About the webinar:
- Topic: Using AI for outbound sales
- Speaker: Ian Koniak (former #1 sales rep)
- Key takeaway: AI can 10x your outreach volume while staying personal
- Attendee demographics: Tech sales reps, AEs, SDRs at B2B SaaS companies

Offer:
- Free 30-minute strategy call
- Ian will audit their current outreach and build custom AI stack
- Limited to 20 calls this month

Messaging angle:
- Reference specific insights from webinar (e.g., "the 3-touch AI sequence")
- Create urgency around limited call slots
- Position as exclusive follow-up for attendees only
```

### ❌ Poor Context

```
This is a webinar follow-up campaign. We want people to book calls.
```

---

## n8n Workflow Integration

### How n8n Uses Campaign Context

**Current workflow**: `UYSP-Kajabi-SMS-Scheduler`
1. Finds leads eligible for next message
2. Fetches campaign details (name, type, timing)
3. Determines which message in sequence to send
4. Sends pre-written message from campaign.messages array

**AI enhancement opportunity**:
Instead of pre-written messages, workflow could:
1. Find leads eligible for message
2. Fetch campaign context
3. Call `/api/admin/campaigns/generate-message` API
4. Generate personalized message using lead's tags + campaign context
5. Send generated message

**Risk**: API rate limits (10/hour) - would need Redis-based rate limiting for production

---

## Summary & Next Steps

### What's Already Built ✅

1. AI message generation API - FULLY FUNCTIONAL
2. Database fields for context (description) - EXIST
3. Custom instructions field - WORKS TODAY

### What Works Right Now ✅

- Admin can generate messages using custom instructions
- AI uses GPT-5 with proper prompt engineering
- Rate limiting in place (10/hour per user)
- Cost estimation and SMS segment calculation

### Quick Wins (No Code) 🎯

1. **Test AI with various context examples** - see what works best
2. **Create context template** - Google Doc with format for admins to copy/paste
3. **Document best practices** - what makes good vs bad context

### Easy Improvements (1-2 hours) 🛠️

1. **Add description field to campaign forms** - store context with campaign
2. **Auto-include stored context in AI prompt** - fetch campaign.description

### Future Enhancements (Phase 2) 🚀

1. **Smart auto-context builder** - extract context from campaign fields
2. **Tag-based personalization** - include lead's Kajabi tags in prompt
3. **A/B test AI messages** - generate variations, track performance

---

## Testing AI Message Generation Today

### Manual Test Steps

1. Navigate to Campaign Management
2. Click "Create Campaign" or edit existing
3. Click "Generate Message" button
4. Fill out form:
   ```
   Campaign Name: Q4 2025 Webinar Follow-up
   Target Audience: Tech sales reps who attended webinar on AI for outbound
   Message Goal: Book Call
   Tone: Friendly
   Include Link: Yes
   Custom Instructions: [PASTE YOUR CONTEXT]
   ```
5. Review generated message
6. Edit if needed
7. Save to campaign

### Sample Context to Test

```
This webinar taught tech sales reps how to use AI for outbound prospecting without losing personalization. Main speaker was Ian Koniak, former #1 sales rep at Salesforce. Key insights: AI can automate research, draft personalized emails, and manage follow-up sequences. Our offer is a free 30-minute strategy call where Ian will audit their current outreach and build a custom AI stack for their specific needs. Limited to 20 calls this month.
```

---

**Status**: AI messaging is production-ready
**Next Action**: Test with real campaigns and iterate on context strategy
**Timeline**: Can start testing TODAY with zero code changes

