# UYSP Portal - Next Features Planning

**Date**: 2025-10-21  
**Status**: Planning Phase  
**Priority**: HIGH - Core workflow enhancements

---

## 🎯 FEATURE 1: Lead File Upload with Field Mapping

### User Story
> "As an ADMIN, I want to upload a CSV/Excel file of leads, map the columns to our system fields, trigger automated enrichment, and then bulk-add them to campaigns."

### Minimum Required Fields
- ✅ First Name (required)
- ✅ Last Name (required)
- ✅ Email (required)

### Optional Fields (User Maps During Upload)
- Phone Number
- Company
- Job Title
- LinkedIn URL (person)
- Unbounce Tags (for engagement scoring)
- Form ID / Lead Source (determines campaign assignment)

### Upload Flow
```
1. User clicks "Upload Leads" button
2. Select CSV/Excel file
3. System previews first 5 rows
4. User maps columns:
   - Their Column "Full Name" → Our Field "First Name"
   - Their Column "Email Address" → Our Field "Email"
   - etc.
5. Confirm mapping
6. System validates data (emails valid, required fields present)
7. Show upload progress bar
8. Leads inserted into staging area
9. Trigger n8n bulk ingestion webhook
10. n8n → Clay enrichment
11. Enriched leads return to Airtable
12. Sync back to PostgreSQL
13. Leads appear in dashboard with "Added in last hour" filter
```

### Technical Implementation

**Frontend:**
- File upload component (drag-drop or click)
- CSV/Excel parser (use `papaparse` or `xlsx` library)
- Column mapping UI (dropdowns for each detected column)
- Validation preview (show errors before upload)
- Progress bar during upload

**Backend:**
- `POST /api/admin/leads/upload` endpoint
- Parse file server-side
- Validate mapped data
- Batch insert to database (staging table or flag)
- Trigger n8n webhook with lead data
- Return upload summary (X inserted, Y errors)

**n8n Workflow:**
- Webhook receives bulk leads
- Split into individual records
- Send to Clay for enrichment
- Wait for Clay webhook response
- Update Airtable with enriched data
- Mark leads as "ready for campaign"

### Field Mapping Logic

**Form ID → Campaign ID:**
```
If form_id detected:
  - Map form_id to campaign_name
  - Example: "unbounce-ai-webinar" → campaign_name = "AI Webinar - AI BDR"
  - Auto-assign SMS Campaign ID based on form mapping table
Else:
  - Leave campaign_name NULL
  - Admin manually assigns to campaign later
```

---

## 🎯 FEATURE 2: Lead Filtering & Bulk Actions

### Filters Needed

**Time-based filters:**
- Added in last hour (most important for bulk uploads)
- Added today
- Added this week
- Custom date range

**Status filters:**
- Responded (two-way conversation exists)
- Not started in sequence
- In sequence (steps 1, 2, 3)
- Booked
- Opted out
- High ICP (>= 70)
- High Engagement (>= 70)

**Campaign filters:**
- By campaign name
- By form ID/source
- Not assigned to campaign

### Bulk Actions

**Select leads → Apply action:**
1. Add to Campaign (choose campaign from dropdown)
2. Remove from Campaign
3. Claim all (assign to current user)
4. Mark as reviewed
5. Export selected (CSV download)
6. Bulk pause/resume

**UI Pattern:**
```
[ ] Select All (checkbox)
Filter: [Added in last hour ▼] [Campaign: All ▼] [Status: All ▼]

[✓] Lead 1 - John Doe (john@company.com) - Added 15 min ago
[✓] Lead 2 - Jane Smith (jane@acme.com) - Added 23 min ago
[ ] Lead 3 - Bob Johnson (bob@corp.com) - Added 2 hours ago

[3 selected] → [Add to Campaign ▼] [Apply]
```

---

## 🎯 FEATURE 3: Two-Way Messaging Visibility

### Dashboard Integration

**New Dashboard Card:**
```
┌──────────────────────────┐
│ RESPONSES                │
│ 12 New Replies           │
│ 8 Needs Review           │
│ [View All →]             │
└──────────────────────────┘
```

**Quick Access:**
- Click "Responses" card → filtered leads view
- Shows only leads with `conversation_thread` field populated
- Highlight unreviewed responses

### Airtable Schema Upgrades Required

**New Fields Needed:**
```
1. conversation_thread (Long Text / JSON)
   - Stores full conversation history
   - Format: [{ role: 'user', message: '...', timestamp: '...' }, { role: 'ai', ... }]

2. has_responded (Checkbox)
   - TRUE if lead has sent any inbound message
   - Auto-set by n8n when inbound SMS received

3. last_inbound_message (Long Text)
   - Most recent message from lead
   
4. last_inbound_at (DateTime)
   - When they last responded

5. response_status (Single Select)
   - Options: "No Response", "Responded", "Needs Review", "Resolved"
   
6. ai_agent_status (Single Select)
   - Options: "Active", "Paused", "Escalated to Human"
```

### Frontend Display

**Leads table adds column:**
```
| Name | Company | Status | Responded | Last Message | Actions |
|------|---------|--------|-----------|--------------|---------|
| John | Acme    | Step 2 | ✅ 2h ago | "Interested" | [View]  |
```

**Conversation View (Modal or Sidebar):**
```
┌─────────────────────────────────────┐
│ Conversation with John Doe          │
├─────────────────────────────────────┤
│ [OUTBOUND] 3 days ago               │
│ Hi John, saw you're at Acme...      │
├─────────────────────────────────────┤
│ [INBOUND] 2 days ago                │
│ Yes, tell me more                   │
├─────────────────────────────────────┤
│ [AI RESPONSE] 2 days ago            │
│ Great! Here's our calendar link...  │
└─────────────────────────────────────┘
```

---

## 🎯 FEATURE 4: Engagement Score

### Calculation Logic (AI-Powered)

**Input Data (from Unbounce tags):**
- Form views
- Page visits
- Downloads
- Email clicks
- Resource views
- Time on site
- Return visits

**AI Scoring Prompt:**
```
Based on these engagement indicators:
- Viewed pricing page: true
- Downloaded whitepaper: true
- Viewed 5 pages
- Return visitor: true
- Time on site: 8 minutes

Calculate engagement score 0-100 where:
- 0-30: Low engagement (tire kicker)
- 31-70: Medium engagement (curious)
- 71-100: High engagement (hot lead)

Return JSON: { score: 85, reasoning: "High engagement - viewed pricing, downloaded resource, return visitor" }
```

**Implementation:**
1. n8n receives Unbounce webhook with tags
2. Calls OpenAI with engagement data
3. Gets engagement score (0-100)
4. Writes to Airtable `engagement_score` field
5. Frontend displays like ICP score

### Frontend Display

**Dashboard cards:**
```
High ICP Leads: 245
High Engagement Leads: 189
High ICP + High Engagement: 87 ⭐ (hottest leads)
```

**Lead detail page:**
```
ICP Score: 85 🟢
Engagement Score: 92 🟢
Combined Priority: 🔥 HOT LEAD
```

---

## 🏗️ ARCHITECTURAL DECISION 1: Airtable vs PostgreSQL

### Current Architecture
```
User Action → PostgreSQL (fast read)
           ↓
         Airtable (source of truth)
           ↓
         n8n automations
           ↓
         Clay enrichment
           ↓
       Back to Airtable
           ↓
    Sync to PostgreSQL (cache)
```

### Option A: Stay with Airtable (RECOMMENDED for now)

**Pros:**
- ✅ Already working
- ✅ n8n integrations solid
- ✅ Webhooks configured
- ✅ No-code field changes (add conversation field easily)
- ✅ Visual data inspection
- ✅ Backup/rollback simple

**Cons:**
- ❌ Sync latency (5 min between Airtable update → PostgreSQL)
- ❌ Two sources of truth
- ❌ Schema changes need manual sync updates

**When to use:** Now through 10,000+ leads, proven workflow

### Option B: Move to PostgreSQL-Only

**Pros:**
- ✅ Single source of truth
- ✅ Real-time data (no sync lag)
- ✅ Better performance at scale (100k+ leads)
- ✅ Complex queries easier
- ✅ Transaction guarantees

**Cons:**
- ❌ Lose Airtable's no-code flexibility
- ❌ Need to rebuild all n8n webhooks to hit PostgreSQL
- ❌ Manual data inspection harder (need SQL or admin UI)
- ❌ Migration risk (move 11k leads + preserve history)
- ❌ 2-4 weeks of work to rebuild integrations

**When to use:** After 50k+ leads, when Airtable costs > $1k/month, or sync lag causes issues

### Hybrid Option C: Airtable for Automations, PostgreSQL for Portal (CURRENT - BEST)

**Keep:**
- Airtable = automation hub (n8n, Clay, webhooks)
- PostgreSQL = portal data (fast reads, analytics)
- 5-min sync keeps them aligned

**Upgrade:**
- Add conversation fields to Airtable
- Sync conversations to PostgreSQL
- Best of both worlds

**Recommendation:** **Stick with Hybrid (Option C)** for now. Add conversation fields to Airtable, sync them to PostgreSQL. Revisit full PostgreSQL migration only if:
- Lead volume > 100k
- Airtable costs > $1k/month
- Sync lag causes user complaints

---

## 🏗️ ARCHITECTURAL DECISION 2: Clay vs n8n Waterfall Enrichment

### Current: Clay (Paid, Simple)
```
n8n sends lead → Clay enrichment → Returns data
Cost: ~$0.10-0.50 per lead enriched
Speed: ~2-5 seconds per lead
Quality: High (50+ data sources)
```

### Alternative: n8n Waterfall (Free-ish, Complex)

**Waterfall Pattern:**
```
Lead comes in with email → 

Try Provider 1 (Hunter.io - find work email)
  ↓ If found → enrich company data → DONE
  ↓ If not found →
  
Try Provider 2 (Clearbit - email lookup)
  ↓ If found → enrich → DONE
  ↓ If not found →
  
Try Provider 3 (LinkedIn scraper)
  ↓ If found → enrich → DONE
  ↓ If not found →
  
Mark as "Unable to Enrich"
```

**Challenges:**
- Personal emails hard to convert to work emails (Gmail → john@company.com)
- Each provider has different API formats
- n8n waterfalls are complex (lots of IF nodes)
- Error handling difficult
- Rate limits per provider
- Cost still exists (each API has fees)

**Providers for Waterfall:**
1. Hunter.io (email finder - $49/month for 1k searches)
2. Clearbit (enrichment - $99/month)
3. Apollo.io (work email finder - free tier limited)
4. RocketReach (contact info - paid)
5. LinkedIn Sales Navigator (scraping - risky)

### Recommendation

**Start with Clay, plan for Hybrid:**

**Now (0-10k leads/month):**
- Use Clay (simple, reliable, $0.10-0.50 per lead)
- Cost: ~$500-1k/month for 1-2k enrichments
- Worth it for reliability

**Later (10k+ leads/month):**
- Build n8n waterfall for common cases (work emails from domains)
- Use Clay as fallback for hard cases (personal emails)
- Hybrid approach saves money on easy enrichments

**Personal Email Problem:**
- If lead has Gmail/Yahoo/etc., very hard to find work email
- Clay uses 50+ sources, better success rate
- n8n waterfall with free tools = lower success rate
- **Recommendation**: Keep Clay for personal emails, build n8n for work emails

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Two-Way Messaging Foundation (Week 1-2)

**Airtable Updates:**
1. Add conversation_thread field (Long Text)
2. Add has_responded field (Checkbox)
3. Add last_inbound_message field (Long Text)
4. Add last_inbound_at field (DateTime)
5. Add response_status field (Single Select)

**n8n Workflow:**
1. Inbound SMS webhook from SimpleTexting
2. Lookup lead in Airtable
3. Append to conversation_thread
4. Set has_responded = TRUE
5. Update last_inbound_message + timestamp
6. Call AI for auto-response or escalate

**Frontend:**
1. Add "Responded" column to leads table
2. Add filter: "Has Responded"
3. Add conversation view modal
4. Highlight on dashboard (New Responses card)

**Effort:** 16-20 hours

### Phase 2: Lead Upload & Field Mapping (Week 2-3)

**Frontend:**
1. Upload button on leads page
2. File picker (CSV/Excel)
3. Parse file, show preview
4. Column mapping UI (drag-drop or dropdowns)
5. Validation preview (show errors)
6. Upload with progress bar
7. Success summary (X inserted, Y errors)

**Backend:**
1. `POST /api/admin/leads/upload` endpoint
2. Parse CSV/Excel server-side
3. Validate mapped fields
4. Batch insert to leads table (mark as "pending_enrichment")
5. Trigger n8n bulk webhook
6. Return summary

**n8n Integration:**
1. Bulk leads webhook receives array
2. Split into individual leads
3. Send each to Clay for enrichment
4. Clay returns enriched data
5. Update Airtable with enriched fields
6. Set status = "Enriched, Ready for Campaign"

**Effort:** 20-24 hours

### Phase 3: Engagement Scoring (Week 3-4)

**Airtable:**
1. Add engagement_score field (Number 0-100)
2. Add engagement_reasoning field (Long Text)
3. Add unbounce_tags field (Long Text / JSON)

**n8n AI Scoring:**
1. When lead comes in with Unbounce tags
2. Extract engagement indicators
3. Call OpenAI: "Calculate engagement score based on: {tags}"
4. Parse response (score + reasoning)
5. Write to Airtable

**Frontend:**
1. Display engagement_score like ICP score
2. Add filter: "High Engagement (>= 70)"
3. Dashboard card: "Hot Leads" (High ICP + High Engagement)
4. Color coding: Green (70+), Yellow (40-69), Red (0-39)

**Effort:** 12-16 hours

### Phase 4: Bulk Actions & Filtering (Week 4)

**Lead Table Enhancements:**
1. Checkbox column for bulk select
2. "Select All" with filters
3. Bulk action dropdown:
   - Add to Campaign
   - Remove from Campaign
   - Claim
   - Pause
   - Export CSV
4. Filter dropdowns:
   - Added in last hour
   - Has responded
   - Campaign
   - Status
   - ICP score range
   - Engagement score range

**Backend:**
- `POST /api/leads/bulk-action` endpoint
- Accepts: { leadIds: [...], action: 'add_to_campaign', campaignId: '...' }
- Batch updates in database
- Update Airtable via webhook
- Return summary

**Effort:** 16-20 hours

---

## 🏗️ ARCHITECTURE RECOMMENDATIONS

### Recommendation 1: Stay Hybrid (Airtable + PostgreSQL)

**Why:**
- Current system works
- Adding conversation fields is simple in Airtable
- n8n integrations already stable
- PostgreSQL migration = high risk, low immediate value
- Sync latency (5 min) acceptable for current scale

**Action:** Enhance current architecture, don't rebuild

### Recommendation 2: Keep Clay for Now, Plan n8n Hybrid

**Phase 1 (Now):**
- Use Clay for all enrichment
- Cost: ~$500-1k/month
- Reliable, simple

**Phase 2 (3-6 months):**
- Build n8n waterfall for work emails (email@company.com)
- Success rate ~70% with free/cheap tools
- Falls back to Clay for hard cases (personal emails)
- Reduces Clay usage by 50-70%
- Cost savings: $300-500/month

**Phase 3 (6-12 months):**
- If volume justifies it, full n8n waterfall
- Only use Clay for edge cases
- Cost savings: $700-900/month

**Immediate Action:** Stick with Clay, document enrichment requirements for future waterfall

### Recommendation 3: Form ID → Campaign Auto-Assignment

**Create Mapping Table:**
```sql
CREATE TABLE form_campaign_mappings (
  id UUID PRIMARY KEY,
  form_id VARCHAR(255) UNIQUE,
  form_name VARCHAR(255),
  campaign_name VARCHAR(255),
  auto_add_to_campaign BOOLEAN DEFAULT TRUE
);

-- Example mappings
INSERT INTO form_campaign_mappings VALUES
  ('...', 'unbounce-ai-webinar', 'AI Webinar Opt-In', 'AI Webinar - AI BDR', TRUE),
  ('...', 'unbounce-database-mining', 'Database Mining Form', 'DataBase Mining', TRUE);
```

**Logic:**
1. Lead uploaded with form_id
2. Lookup mapping table
3. If auto_add_to_campaign = TRUE → set campaign_name
4. If FALSE → admin assigns manually

---

## 📊 FEATURE PRIORITY MATRIX

| Feature | Business Value | Technical Complexity | Effort | Priority |
|---------|---------------|---------------------|--------|----------|
| Two-Way Messaging Visibility | HIGH | MEDIUM | 16-20h | **P0** |
| Lead Upload + Mapping | HIGH | HIGH | 20-24h | **P0** |
| Bulk Actions & Filters | MEDIUM | LOW | 16-20h | **P1** |
| Engagement Scoring | MEDIUM | MEDIUM | 12-16h | **P1** |
| Campaign Auto-Assignment | HIGH | LOW | 4-6h | **P0** |
| n8n Waterfall (Clay replacement) | MEDIUM | VERY HIGH | 40-60h | **P2** |
| Full PostgreSQL Migration | LOW | VERY HIGH | 80-120h | **P3** |

**Recommended Build Order:**
1. ✅ Campaign Auto-Assignment (quick win, 4-6h)
2. ✅ Two-Way Messaging Visibility (critical for sales, 16-20h)
3. ✅ Lead Upload + Mapping (enable client self-service, 20-24h)
4. ✅ Bulk Actions (power user feature, 16-20h)
5. ✅ Engagement Scoring (nice-to-have, 12-16h)
6. ⏸️ n8n Waterfall (cost optimization, defer 3-6 months)
7. ⏸️ PostgreSQL Migration (defer 6-12 months or until pain point)

---

## 🚧 KNOWN CONSIDERATIONS

### Lead Upload Challenges

**1. Email Validation:**
- Need to dedupe against existing leads
- Check if email already in database
- Option: "Update existing" vs "Skip duplicates"

**2. Campaign Assignment:**
- If form_id provided → auto-assign
- If no form_id → leave NULL, admin assigns later
- Or: Ask during upload "Assign all to campaign? [Dropdown]"

**3. Enrichment Latency:**
- Clay takes 2-5 sec per lead
- For 1,000 lead upload → 30-90 minutes to enrich all
- Need status tracking: Uploaded → Enriching → Enriched → Ready

### Two-Way Messaging Challenges

**1. Conversation Storage:**
- JSON in Airtable Long Text field works
- But PostgreSQL JSONB would be better for queries
- **Solution:** Store JSON in both, sync on update

**2. Real-Time Updates:**
- Inbound SMS → n8n → Airtable → 5 min sync delay → Portal
- User sees response 5 min late
- **Solution:** n8n also hits `/api/leads/[id]/conversation` endpoint to update PostgreSQL immediately

**3. AI Agent Writes:**
- n8n generates AI response
- Writes to Airtable conversation_thread
- **Solution:** Also write to PostgreSQL via API for instant visibility

---

## 💡 QUICK WINS (Can Implement Today)

1. **Add "Added Today" Filter** (2 hours)
   - Add date filter to leads API
   - Add dropdown to leads page
   - Deploy

2. **Show Response Count on Dashboard** (1 hour)
   - Query `has_responded = TRUE` count
   - Add card to dashboard
   - Deploy

3. **Campaign Auto-Assignment** (4-6 hours)
   - Create form_campaign_mappings table
   - Add lookup in lead creation
   - Deploy

---

## 🎯 RECOMMENDED NEXT SESSION

**Focus:** Two-Way Messaging + Lead Upload

**Build Order:**
1. Add conversation fields to Airtable (30 min - manual)
2. Update sync to include conversation fields (2 hours)
3. Add "Has Responded" filter to leads page (2 hours)
4. Add conversation view modal (4 hours)
5. Add leads upload page (8 hours)
6. Add field mapping UI (6 hours)
7. Test end-to-end upload → enrichment → display (2 hours)

**Total:** 24-26 hours (3 working days)

**Outcome:** Users can upload leads via UI, see responses, and take bulk actions

---

## ❓ QUESTIONS TO RESOLVE

1. **For lead upload**: Accept only CSV, or also Excel (.xlsx)?
2. **For duplicates**: Skip, update, or ask user?
3. **For enrichment**: Should leads be visible before enrichment, or wait until enriched?
4. **For conversations**: Do we need to send replies from the portal, or only view?
5. **For engagement scoring**: Run on all existing leads, or only new uploads?

---

## 📁 FILES TO CREATE (Next Session)

```
src/app/(client)/leads/upload/page.tsx        - Upload UI with field mapping
src/app/api/admin/leads/upload/route.ts       - Upload endpoint
src/app/api/leads/[id]/conversation/route.ts  - Get/update conversation
src/components/ConversationView.tsx           - Reusable conversation modal
src/lib/csv-parser.ts                         - CSV/Excel parsing utility
migrations/add-conversation-fields.sql        - Add conversation columns
migrations/add-form-campaign-mapping.sql      - Campaign auto-assignment
migrations/add-engagement-score.sql           - Engagement tracking
```

---

**Ready to proceed with implementation or need clarification on any features?**




