# UYSP Portal - Final Development Roadmap

**Created**: 2025-10-21  
**Status**: Ready for Implementation  
**Next Session**: Start with Feature 1A (Campaign Auto-Assignment)

---

## 🎯 PRIORITY FEATURES (Build Order)

### Feature 1A: Campaign Auto-Assignment (4-6 hours) ⭐ QUICK WIN
**Priority**: P0 - Build FIRST (tomorrow)

**What it does:**
- When lead uploaded with `form_id`, auto-assign to correct campaign
- Uses mapping table (form → campaign)
- Saves manual assignment work

**Implementation:**
1. Create `form_campaign_mappings` table
2. Add API endpoint to manage mappings
3. Update lead creation to check mappings
4. Auto-set `campaign_name` based on `form_id`

**Files to create:**
- `migrations/add-form-campaign-mappings.sql`
- `src/app/api/admin/form-mappings/route.ts`
- `src/app/(client)/admin/form-mappings/page.tsx`

**Effort:** 4-6 hours  
**Value:** Immediate workflow improvement

---

### Feature 1B: Two-Way Messaging Visibility (16-20 hours) ⭐ CRITICAL
**Priority**: P0 - Build SECOND

**What it does:**
- Show full conversation history for each lead
- Highlight new responses on dashboard
- Filter leads by "Has Responded"
- Beautiful chat UI (like iMessage)

**Airtable Changes (Manual - 30 min):**
```
Add these fields to Leads table:
1. conversation_thread (Long Text) - stores JSON array
2. has_responded (Checkbox)
3. last_inbound_message (Long Text)
4. last_inbound_at (DateTime)
5. response_count (Number)
```

**Implementation:**
1. Update sync to include conversation fields (2h)
2. Add "Responses" card to dashboard (1h)
3. Add "Has Responded" filter to leads table (2h)
4. Create conversation view modal component (6-8h)
5. Add conversation API endpoint (2h)
6. n8n workflow updates (3-4h)

**Files to create:**
- `src/components/ConversationView.tsx`
- `src/app/api/leads/[id]/conversation/route.ts`
- `migrations/add-conversation-fields.sql`

**Effort:** 16-20 hours  
**Value:** Critical for sales team

---

### Feature 2: Lead File Upload with Mapping (20-24 hours)
**Priority**: P0 - Build THIRD

**What it does:**
- Upload CSV/Excel with leads
- Map their columns to our fields
- Trigger bulk enrichment
- Show in "Added in last hour" filter

**Implementation:**
1. File upload page with drag-drop (4h)
2. CSV/Excel parser (use papaparse) (2h)
3. Column mapping UI (6h)
4. Upload API endpoint (4h)
5. Validation & error handling (2h)
6. Progress tracking (2h)
7. n8n bulk webhook integration (2-4h)

**Libraries needed:**
```bash
npm install papaparse xlsx
npm install --save-dev @types/papaparse
```

**Files to create:**
- `src/app/(client)/leads/upload/page.tsx`
- `src/app/api/admin/leads/upload/route.ts`
- `src/lib/csv-parser.ts`
- `src/components/ColumnMapper.tsx`

**Effort:** 20-24 hours  
**Value:** Enables client self-service

---

### Feature 3: Bulk Actions & Advanced Filters (16-20 hours)
**Priority**: P1 - Build FOURTH

**What it does:**
- Select multiple leads (checkboxes)
- Apply bulk actions (add to campaign, export, etc.)
- Advanced filters (added in last hour, responded, etc.)

**Implementation:**
1. Add checkbox column to leads table (2h)
2. Bulk select logic (2h)
3. Bulk action dropdown + handlers (4h)
4. Advanced filter UI (4h)
5. Filter API enhancements (2h)
6. Bulk update API endpoints (4h)

**Files to create:**
- `src/app/api/leads/bulk-action/route.ts`
- `src/components/LeadFilters.tsx`
- `src/components/BulkActionBar.tsx`

**Effort:** 16-20 hours  
**Value:** Power user efficiency

---

### Feature 4: Engagement Scoring (12-16 hours)
**Priority**: P1 - Build FIFTH

**What it does:**
- AI calculates engagement score from Unbounce tags
- Display like ICP score
- "Hot Leads" filter (High ICP + High Engagement)

**Airtable Changes:**
```
Add fields:
1. engagement_score (Number 0-100)
2. engagement_reasoning (Long Text)
3. unbounce_tags (Long Text / JSON)
```

**Implementation:**
1. Update Airtable schema (manual)
2. n8n AI scoring workflow (4h)
3. Sync engagement fields (2h)
4. Display engagement score in UI (2h)
5. Add engagement filters (2h)
6. "Hot Leads" dashboard card (2h)

**Effort:** 12-16 hours  
**Value:** Better lead prioritization

---

## 🏗️ ARCHITECTURAL DECISIONS (FINAL)

### Decision 1: Keep Airtable + PostgreSQL Hybrid ✅

**Rationale:**
- Airtable = automation hub (n8n, webhooks, Clay)
- PostgreSQL = portal performance (fast reads)
- Migration to PostgreSQL-only = 80-120 hours, high risk
- Current hybrid works well

**Action:** Enhance hybrid, don't migrate

### Decision 2: Keep Clay, Plan n8n Hybrid Later ✅

**Now (0-10k leads/month):**
- Use Clay for all enrichment
- Cost: $500-1k/month
- Reliable, worth the cost

**6 months (10k+ leads/month):**
- Build n8n waterfall for work emails
- Clay fallback for personal emails
- Save $300-500/month

**Action:** Defer n8n waterfall to Q2 2026

### Decision 3: Conversation Storage in Airtable JSON ✅

**Why:**
- Simple (one Long Text field)
- AI reads full history
- Portal displays beautifully
- No separate database needed

**Action:** Implement as planned

---

## 📅 SPRINT PLANNING (Next 2 Weeks)

### Week 1: Core Workflow (40 hours)
**Monday-Tuesday:**
- Feature 1A: Campaign Auto-Assignment (4-6h)
- Start Feature 1B: Two-Way Messaging (8h)

**Wednesday-Thursday:**
- Finish Feature 1B: Two-Way Messaging (8h)
- Start Feature 2: Lead Upload (8h)

**Friday:**
- Continue Feature 2: Lead Upload (8h)

**Weekend Deliverable:**
- ✅ Campaign auto-assignment working
- ✅ Conversations visible in portal
- ✅ Upload page 50% complete

### Week 2: Power Features (40 hours)
**Monday-Tuesday:**
- Finish Feature 2: Lead Upload (8h)
- Start Feature 3: Bulk Actions (8h)

**Wednesday-Thursday:**
- Finish Feature 3: Bulk Actions (8h)
- Start Feature 4: Engagement Scoring (8h)

**Friday:**
- Finish Feature 4: Engagement Scoring (4h)
- Polish, testing, deployment (4h)

**End of Week 2 Deliverable:**
- ✅ Full lead upload with mapping
- ✅ Bulk actions working
- ✅ Engagement scores displaying
- ✅ All features deployed to production

---

## 🗂️ WHERE TO START TOMORROW

**First thing to build:** Campaign Auto-Assignment

**Steps:**
1. Read `NEXT-FEATURES-PLANNING.md` for context
2. Create form_campaign_mappings table migration
3. Build admin UI to manage form → campaign mappings
4. Update lead creation logic to check mappings
5. Test with sample upload
6. Deploy

**Estimated time:** 4-6 hours  
**Immediate value:** Automates campaign assignment

---

## 📚 REFERENCE DOCUMENTS

**For next developer/session:**
1. `NEXT-FEATURES-PLANNING.md` - Detailed feature specs
2. `REBEL-HQ-DESIGN-SYSTEM.md` - Styling guide
3. `SESSION-COMPLETE-ADMIN-AUTOMATION.md` - What was built today
4. `HANDOVER-CRITICAL-DATA-SYNC-FIX.md` - Sync architecture
5. This file - Build order and priorities

---

## 🎯 SUCCESS METRICS

**After 2 weeks, you should have:**
- ✅ Clients can upload CSV with leads
- ✅ Leads auto-assign to campaigns based on form ID
- ✅ Sales team sees two-way conversations
- ✅ Bulk actions available (select 50 leads → add to campaign)
- ✅ Engagement scores show hot leads
- ✅ "Added in last hour" filter for new uploads
- ✅ All deployed to production

**Business Impact:**
- Clients self-serve (upload leads themselves)
- Sales team efficiency (see responses instantly)
- Better lead prioritization (ICP + Engagement)
- Faster campaign assignment (automated)

---

**ROADMAP FINALIZED - Ready for Implementation** 🚀






