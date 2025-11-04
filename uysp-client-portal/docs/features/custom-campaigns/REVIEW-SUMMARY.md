# Custom Tag-Based SMS Campaigns - Review Summary

**Date**: 2025-11-03  
**Phase**: Research & Planning Complete  
**Status**: 🟡 **AWAITING YOUR APPROVAL** to proceed with implementation

---

## WHAT'S BEEN COMPLETED ✅

### Phase 1: Research (~2 hours)

I've completed a comprehensive analysis of your codebase and documented:

1. **[RESEARCH-FINDINGS.md](./RESEARCH-FINDINGS.md)** (15 sections, ~200 lines)
   - Analyzed existing campaign architecture
   - Mapped SMS template & message storage patterns
   - Reviewed Airtable sync mechanisms
   - Verified n8n SMS scheduler compatibility
   - Identified tag storage requirements
   - Answered all 7 critical questions from PRD

2. **[TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md)** (9 sections, ~600 lines)
   - Complete database schema changes (SQL + TypeScript)
   - 5 new/extended API endpoints with full code
   - UI component specifications
   - Testing strategy
   - Deployment checklist
   - Rollback plan

---

## 🔍 KEY FINDINGS

### ✅ GOOD NEWS

**Verdict**: **Feasible - Can extend existing architecture with minor additions**

1. **Zero Scheduler Changes Needed** 🎉
   - Existing scheduler is 100% compatible
   - Just need to sync custom messages to SMS_Templates table
   - Scheduler will treat custom campaigns like any other campaign

2. **Clean Data Model** ✅
   - Extend campaigns table (not create new table)
   - Store messages in JSONB field (simple, flexible)
   - Reuse existing sync queue patterns

3. **Established Patterns** ✅
   - Direct database update + Airtable sync queue (proven pattern)
   - Existing analytics dashboard can be extended easily
   - Permission system already supports multi-tenant isolation

### 🚨 CRITICAL DISCOVERY

**Kajabi Tags Are NOT Currently Synced** 

**What I Found**:
- No `kajabiTags` field exists in leads table
- No tag mapping in Airtable sync client
- Tags field doesn't appear anywhere in the schema

**What This Means**:
- Need to add `kajabiTags text[]` field to leads table (simple migration)
- Need to update Airtable mapper to pull tags from `"Kajabi Tags"` field
- Need to create GIN index for fast array searches

**Impact**: +1 hour for tag integration (already included in estimate)

**Risk**: If Airtable doesn't have Kajabi Tags field, we'll need to populate it via Kajabi API first

---

## 📋 PROPOSED TECHNICAL APPROACH

### 1. Database Schema Changes

**Add to leads table**:
```sql
ALTER TABLE leads ADD COLUMN kajabi_tags text[];
CREATE INDEX idx_leads_kajabi_tags ON leads USING GIN (kajabi_tags);
```

**Extend campaigns table**:
```sql
ALTER TABLE campaigns
  ADD COLUMN target_tags text[],      -- Tags to filter leads
  ADD COLUMN messages jsonb,          -- 1-3 messages with delays
  ADD COLUMN start_datetime timestamp,
  ALTER COLUMN form_id DROP NOT NULL; -- Custom campaigns don't have forms
```

**Why JSONB for messages?**
- Simple (no joins)
- Flexible (can add fields without migrations)
- Fast (no separate table queries)
- Atomic (messages deleted with campaign)

### 2. Message Storage Strategy

**✅ HYBRID APPROACH** (Best of both worlds):

1. **Store in campaigns.messages** (source of truth)
   - User creates messages in UI → Saved to campaigns.messages JSONB
   - Messages tied to campaign lifecycle
   - Easy to query, edit, delete

2. **Sync to SMS_Templates on activation** (for scheduler)
   - When user activates campaign → Copy messages to SMS_Templates
   - Scheduler loads templates from SMS_Templates (existing logic)
   - Zero scheduler changes needed

**Benefits**:
- ✅ Scheduler compatibility (zero changes)
- ✅ Simple data model (JSONB)
- ✅ Flexible (can query both ways)

### 3. Lead Assignment Flow

**When user activates campaign**:

1. Query leads matching tags:
   ```sql
   WHERE kajabi_tags && ARRAY['Q4 Webinar', 'High Engagement']
     AND sms_stop = false
     AND booked = false
   ```

2. Check conflicts (leads in other active campaigns)

3. User chooses resolution:
   - **Skip**: Don't enroll conflicting leads
   - **Override**: Pause old campaigns, move leads to new campaign
   - **Delay**: Schedule start after conflicts end

4. Batch update leads:
   ```sql
   UPDATE leads SET
     campaign_link_id = $newCampaignId,
     sms_sequence_position = 0,
     sms_last_sent_at = NULL
   WHERE id = ANY($selectedLeadIds)
   ```

5. Queue Airtable sync (eventual consistency)

**Why direct database update?**
- Scheduler needs immediate effect (can't wait 5 minutes for sync)
- Airtable sync happens in background (eventual consistency is OK)

### 4. AI Message Generation

**Direct OpenAI API call from Next.js route**

**Why NOT n8n?**
- Faster UX (no hop to n8n)
- Easier debugging
- Simpler error handling
- Better prompt control

**Model**: GPT-4 (better compliance, worth $0.01/generation)

**System Prompt** (enforces):
- Under 160 characters
- Sender identification
- Placeholder usage
- Professional tone

**Fallback**: If API fails → Show manual mode with helper text

### 5. Tag Filtering UI

**Multi-select dropdown** with:
- Search/filter tags
- Show count per tag: `"Q4 Webinar (127)"`
- Live preview: "X leads match your selection"

**Query Performance**:
```sql
-- Fast tag deduplication (<100ms for 10K leads):
SELECT DISTINCT tag, COUNT(*) as lead_count
FROM leads, UNNEST(kajabi_tags) AS tag
WHERE client_id = $1
GROUP BY tag
ORDER BY lead_count DESC
```

**Caching**: Redis with 5-minute TTL

---

## 📊 ESTIMATED TIMELINE

### Phase 1: Database Schema (1 hour)
- Add kajabiTags to leads
- Extend campaigns table
- Run migrations
- Update TypeScript types

### Phase 2: Airtable Sync (1 hour)
- Update airtable/client.ts mapper
- Test tag sync with sample data

### Phase 3: API Routes (4 hours)
- GET /api/admin/tags - List unique tags
- POST /api/admin/campaigns/preview-leads - Count matching leads
- POST /api/admin/campaigns - Extend for Custom type
- POST /api/admin/campaigns/generate-message - AI generation
- POST /api/admin/campaigns/[id]/activate - Enroll leads

### Phase 4: UI Components (6 hours)
- TagSelector component (multi-select)
- MessageBuilder component (AI + manual modes)
- CustomCampaignBuilder wizard (4-step)
- Integrate with existing campaigns page

### Phase 5: Testing & Integration (2 hours)
- Unit tests (tag filtering, conflict detection)
- End-to-end test (create → activate → scheduler picks up)
- Verify analytics integration

**TOTAL**: **14-16 hours** (2-3 days)

---

## 🎯 WHAT NEEDS YOUR APPROVAL

### 1. Data Model Decisions

- [ ] **JSONB for messages** (vs separate table)
  - ✅ Pro: Simple, flexible, fast
  - ❌ Con: Can't query messages independently (not needed)
  
- [ ] **Direct DB update for lead assignment** (vs queue-only)
  - ✅ Pro: Immediate scheduler effect
  - ❌ Con: Bypasses Airtable temporarily (eventual consistency)

- [ ] **Sync messages to SMS_Templates on activation**
  - ✅ Pro: Zero scheduler changes
  - ❌ Con: Duplicate data (acceptable trade-off)

### 2. Kajabi Tags Field Name

**Question**: What is the exact field name in Airtable?
- Is it `"Kajabi Tags"`?
- Or `"Tags"`?
- Or something else?

**Action Needed**: Please verify this field exists in your Airtable base before we proceed

### 3. AI Integration

- [ ] **Direct OpenAI API call** (not n8n workflow)
  - Model: GPT-4 (~$0.01 per generation)
  - Faster UX, simpler debugging
  
- [ ] **Rate Limit**: 10 generations per minute per client (OK?)

### 4. Conflict Resolution

- [ ] **Default resolution**: Skip (safest) or Override (more aggressive)?
- [ ] **Delay resolution**: Implement in v1 or defer to v1.1?

---

## ⚠️ RISKS & MITIGATIONS

### Risk 1: Kajabi Tags Not Available in Airtable
**Likelihood**: MEDIUM  
**Impact**: HIGH - Blocks entire feature  
**Mitigation**: 
- I'll verify Airtable field exists first
- If missing: You'll need to populate via Kajabi API
- Fallback: Use other fields (leadSource, formId) temporarily

### Risk 2: Large Tag Volume (100+ unique tags)
**Likelihood**: LOW  
**Impact**: MEDIUM - UI performance  
**Mitigation**: 
- GIN index for fast queries
- Redis caching (5-min TTL)
- Paginate dropdown if > 200 tags

### Risk 3: Over-Messaging (Conflict Bugs)
**Likelihood**: MEDIUM  
**Impact**: MEDIUM - Compliance issues  
**Mitigation**: 
- Strict conflict detection before enrollment
- Audit log all campaign switches
- Safety check: Max 1 message per lead per day

---

## 🚀 NEXT STEPS

### If You Approve This Approach:

1. **Verify Kajabi Tags Field** (5 min)
   - Check Airtable → Leads table → Confirm field name
   - Send me exact field name (e.g., `"Kajabi Tags"` or `"Tags"`)

2. **I'll Begin Implementation** (2-3 days)
   - Phase 1: Database schema + migrations
   - Phase 2: API routes
   - Phase 3: UI components
   - Phase 4: Testing & deployment

3. **Deployment Plan**
   - Deploy to staging first
   - Test with 1-2 sample campaigns
   - Monitor scheduler logs
   - Deploy to production

---

## 📚 DOCUMENTATION CREATED

All documentation is in `uysp-client-portal/docs/features/custom-campaigns/`:

1. **[PRD.md](./PRD.md)** - Product requirements (from your handoff)
2. **[RESEARCH-FINDINGS.md](./RESEARCH-FINDINGS.md)** - Complete codebase analysis
3. **[TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md)** - Implementation specification
4. **[REVIEW-SUMMARY.md](./REVIEW-SUMMARY.md)** - This document (for your review)

---

## ✅ READY TO PROCEED?

**Please review and confirm**:

- [ ] Data model approach (JSONB messages, direct DB update)
- [ ] Kajabi Tags field name in Airtable
- [ ] AI integration (OpenAI API, GPT-4)
- [ ] Timeline (2-3 days for full implementation)
- [ ] Any questions or concerns?

**Reply with**:
- ✅ "Approved - proceed with implementation"
- 🔧 "Changes needed: [describe changes]"
- ❓ "Questions: [ask questions]"

---

**I'm ready to start building as soon as you approve!** 🚀
