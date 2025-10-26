# Schema Audit Summary - Phase 1 Safety Infrastructure

**Date**: October 26, 2025  
**Task**: Day 0 Schema Audit (Complete)  
**Branch**: feature/two-way-ai-messaging  
**Status**: ✅ Audit Complete - Awaiting Approval

---

## 📊 KEY FINDINGS

### The Numbers

| Metric | Count | Notes |
|--------|-------|-------|
| **Current Fields** | 107 | In People table |
| **Required New Fields** | 22 | For complete AI messaging (vs 16 in PRD simplified view) |
| **Reusable Fields** | 1 | `test_mode_record` already exists |
| **Redundant Fields** | 12 | Old SMS fields can be deprecated |
| **Final Total (Option A)** | 119 | After adding 22 + removing 10 redundant |
| **Final Total (Option B)** | 129 | After adding 22, keeping all existing |

### Critical Discovery: 22 Fields vs 16 Fields

**PRD Mentioned**: 16 fields  
**Audit Reveals**: 22 fields needed for complete safety

**Additional 6 Fields Are For**:
- Safety violation tracking (2 fields)
- Human handoff audit trail (3 fields)
- Performance & cost monitoring (3 fields)
- Content preferences (2 fields - can defer to Phase 4)

**Bottom Line**: We can do 20 fields Day 1 (defer content fields to Phase 4) or 22 fields (complete implementation).

---

## 🎯 THREE OPTIONS FOR YOU

### Option A: Full Implementation (RECOMMENDED) ⭐
```
Add: 22 new fields (complete safety)
Remove: 10 redundant fields (cleanup)
Total: 119 fields
Time: 3 hours
Safety: Maximum protection
```

**Why Recommended**:
- Complete safety coverage from Day 1
- Full audit trail for compliance
- Human handoff tracking built-in
- Performance monitoring enabled
- Clean schema (removes redundancies)

### Option B: Add All, Keep All
```
Add: 22 new fields
Remove: 0 fields
Total: 129 fields
Time: 2.5 hours
Safety: Maximum protection
```

**Why Choose This**:
- No risk of breaking anything
- Can clean up later
- Maximum safety from Day 1
- Keeps existing SMS fields as backup

### Option C: Minimum Implementation
```
Add: 16 core fields only
Remove: 0 fields
Total: 123 fields
Time: 2 hours
Safety: Basic (missing safety tracking)
```

**Why NOT Recommended**:
- Missing safety violation tracking
- No human handoff audit trail
- No performance monitoring
- Will need to add more fields later (more work)

---

## 📋 DETAILED FIELD COMPARISON

### Core Conversation Fields (5) - CRITICAL ✅

| Field | Type | Purpose | Can Skip? |
|-------|------|---------|-----------|
| `conversation_thread` | Long Text (JSON) | Full chat history | ❌ NO |
| `last_message_direction` | Single Select | Who sent last message | ❌ NO |
| `last_message_sent_at` | DateTime | When AI sent message | ❌ NO |
| `last_message_received_at` | DateTime | When prospect replied | ❌ NO |
| `active_conversation` | Checkbox | Active back-and-forth? | ❌ NO |

**These 5 are non-negotiable** - Core conversation state.

### Safety Control Fields (9) - CRITICAL ✅

| Field | Type | Purpose | Can Skip? |
|-------|------|---------|-----------|
| `ai_status` | Single Select | Active/Paused/Human | ❌ NO |
| `conversation_locked_by_human` | Checkbox | Human takeover lock | ⚠️ Nice to have |
| `pause_reason` | Long Text | Why paused | ⚠️ Nice to have |
| `pause_until` | DateTime | Resume date | ⚠️ Nice to have |
| `ai_message_count_today` | Number | Daily limit tracking | ❌ NO |
| `messages_in_last_2_hours` | Number | Runaway detection | ❌ NO |
| `last_safety_block_reason` | Long Text | Why blocked | ⚠️ Nice to have |
| `safety_violations_count` | Number | Total violations | ⚠️ Nice to have |
| `test_mode_lead` | Checkbox | Testing flag | ✅ Already exists! |

**6 are critical**, 3 are "nice to have" (can add later).

### Campaign State Fields (5) - CRITICAL ✅

| Field | Type | Purpose | Can Skip? |
|-------|------|---------|-----------|
| `campaign_stage` | Single Select | Current campaign stage | ❌ NO |
| `interest_type` | Single Select | Content vs Coaching | ❌ NO |
| `next_scheduled_contact` | DateTime | When to message next | ❌ NO |
| `schedule_set_at` | DateTime | When calculated | ❌ NO |
| `schedule_invalidated` | Checkbox | Schedule stale? | ❌ NO |

**All 5 critical** - Required for intelligent scheduling.

### Human Handoff Fields (3) - NICE TO HAVE ⚠️

| Field | Type | Purpose | Can Skip? |
|-------|------|---------|-----------|
| `human_assigned_to` | Link/Text | Who took over | ✅ Can add Phase 2 |
| `handback_note` | Long Text | Human's note | ✅ Can add Phase 2 |
| `takeover_timestamp` | DateTime | When | ✅ Can add Phase 2 |

**Can be added in Phase 2** if you want to minimize Day 1 changes.

### Audit & Performance Fields (3) - NICE TO HAVE ⚠️

| Field | Type | Purpose | Can Skip? |
|-------|------|---------|-----------|
| `total_ai_messages_sent` | Number | Lifetime count | ✅ Can track elsewhere |
| `total_ai_cost_usd` | Currency | Lifetime cost | ✅ Can track elsewhere |
| `last_ai_response_time_sec` | Number | Performance | ✅ Can track elsewhere |

**Can be deferred** if you want to track in separate analytics.

### Content Preferences (2) - PHASE 4 📅

| Field | Type | Purpose | Can Skip? |
|-------|------|---------|-----------|
| `content_interests` | Long Text | Topics | ✅ Add in Phase 4 |
| `preferred_content_frequency` | Number | Days between | ✅ Add in Phase 4 |

**Defer to Phase 4** (Content Library) - not needed for safety.

---

## 🎯 RECOMMENDED PHASED APPROACH

### Day 1 (Phase 1 - Safety) - Add 17 Fields ⭐

**MUST HAVE**:
- 5 Conversation fields
- 6 Safety control fields (skip 3 "nice to have")
- 5 Campaign state fields
- 1 already exists (`test_mode_lead`)

**Total**: 16 new fields + 1 repurposed = **17 fields Day 1**

### Phase 2 (AI Engine) - Add 3 Fields

**HUMAN HANDOFF**:
- 3 Human handoff tracking fields

**Total**: 3 additional fields

### Phase 4 (Content Library) - Add 2 Fields

**CONTENT**:
- 2 Content preference fields

**Total**: 2 additional fields

### Final Count: 22 Fields
- **Day 1**: 17 fields
- **Phase 2**: +3 fields = 20 total
- **Phase 4**: +2 fields = 22 total

---

## 🗑️ CLEANUP PLAN (Optional)

### Fields to Deprecate (10 High Confidence)

| Field | Replaced By | Safe to Remove? |
|-------|-------------|-----------------|
| `sms_sent` | `conversation_thread` | ✅ YES |
| `sms_sent_time` | `last_message_sent_at` | ✅ YES |
| `sms_clicked` | Communications table | ✅ YES |
| `sms_click_time` | Communications table | ✅ YES |
| `sms_opted_out` | DND_List table | ✅ YES |
| `sms_opt_out_time` | DND_List table | ✅ YES |
| `reengagement_count` | AI handles this | ✅ YES |
| `ready_for_sms` | AI safety module | ✅ YES |
| `should_enrich_phone` | One-time use | ✅ YES |
| `duplicate_count` | Ingestion only | ✅ YES |

### Fields to Keep (2 Low Confidence)

| Field | Why Keep? |
|-------|-----------|
| `meeting_booked` | Quick filter useful |
| `meeting_time` | Quick reference useful |

**Recommendation**: Remove 10, keep 2 for convenience.

---

## 📊 IMPACT ANALYSIS

### Frontend Impact

**TypeScript Types to Update**:
```typescript
// src/types/lead.ts
interface Lead {
  // ... existing fields ...
  
  // NEW: Conversation State
  conversation_thread?: string; // JSON array
  last_message_direction?: 'inbound' | 'outbound';
  last_message_sent_at?: Date;
  last_message_received_at?: Date;
  active_conversation?: boolean;
  
  // NEW: AI Control
  ai_status?: 'active' | 'paused' | 'human_takeover';
  ai_message_count_today?: number;
  messages_in_last_2_hours?: number;
  
  // NEW: Campaign State
  campaign_stage?: string;
  interest_type?: 'content' | 'coaching' | 'unknown';
  next_scheduled_contact?: Date;
  schedule_set_at?: Date;
  schedule_invalidated?: boolean;
  
  // ... etc
}
```

**Estimated Frontend Update Time**: 1 hour

### n8n Impact

**Workflows to Update**:
- None initially (new fields start empty)
- New workflows will reference these fields

**Field ID Documentation Required**:
- Document all 22 field IDs
- Create config file: `config/safety-field-ids.json`

**Estimated n8n Mapping Time**: 30 minutes

### Database Impact

**PostgreSQL Sync**:
- Add columns to `leads` table (cached data)
- Update sync workflow to include new fields

**Estimated DB Update Time**: 30 minutes

### Total Implementation Time

| Task | Time |
|------|------|
| Airtable schema (22 fields) | 1.5 hours |
| Create 3 new tables | 1 hour |
| Update Communications table (8 fields) | 30 minutes |
| Document field IDs | 30 minutes |
| Update frontend types | 1 hour |
| Update PostgreSQL | 30 minutes |
| Test with sample records | 1 hour |
| **TOTAL** | **6 hours** |

**Deployment Guide Estimate**: 16 hours (includes workflow development)  
**Actual Schema Work**: 6 hours  
**Difference**: 10 hours allocated for safety workflow development

---

## ✅ READY FOR APPROVAL

### What You Need to Decide

1. **Field Count**: 17 (Day 1 minimum) or 22 (complete)?
2. **Cleanup**: Remove 10 redundant fields or keep all?
3. **Phasing**: Add all Day 1 or spread across phases?

### Recommended Decision

**APPROVE**:
- ✅ Add 17 fields Day 1 (safety essentials)
- ✅ Add 3 fields Phase 2 (human handoff)
- ✅ Add 2 fields Phase 4 (content prefs)
- ✅ Deprecate 10 redundant fields (cleanup)
- ✅ Total final: 107 - 10 + 22 = **119 fields**

### Alternative: Minimum Day 1

**APPROVE**:
- ✅ Add 16 fields Day 1 (absolute minimum)
- ⏸️ Defer 6 fields to later phases
- ⏸️ Postpone cleanup
- ✅ Total Day 1: 107 + 16 = **123 fields**

---

## 📁 DELIVERABLES (Complete)

✅ **Audit Document**: `schema-audit.md` (complete field-by-field analysis)  
✅ **Approval Document**: `APPROVAL-REQUIRED.md` (quick decision guide)  
✅ **Summary**: `SCHEMA-AUDIT-SUMMARY.md` (this document)  
✅ **Schema Backup**: `current-schema-export.json` (reference)  

---

## ⏭️ NEXT STEPS (After Approval)

### Immediate Actions:
1. Get your approval (A, B, or C)
2. Create test Airtable base (duplicate)
3. Add approved fields to test base
4. Test with 5-10 sample records
5. Verify field IDs
6. Add fields to production
7. Create new tables (AI_Config, Client_Safety_Config, Message_Decision_Log)
8. Update Communications table
9. Export final schema
10. Proceed to Day 2 (Safety Module)

### Files to Create Next:
- `field-additions-plan.md` (after approval)
- `test-scenarios-safety.md` (safety testing plan)
- `field-ids-mapping.json` (for n8n integration)

---

## 🚦 STATUS

**Day 0 Audit**: ✅ COMPLETE  
**Stakeholder Approval**: ⏸️ PENDING  
**Day 1 Implementation**: 🔒 BLOCKED (waiting for approval)  

**Time Spent on Audit**: 2 hours  
**Time Saved by Finding Redundancies**: Prevents future confusion, cleaner schema  
**Next Milestone**: Day 1 - Airtable Schema Updates (6 hours)

---

**Questions? Ask now before we start adding fields.**

**Ready to approve? Reply with**:
- **"Option A"** - Full implementation (22 fields, remove 10) = 119 total
- **"Option B"** - Full implementation (22 fields, keep all) = 129 total
- **"Option C"** - Phased (17 Day 1, +5 later) = 124 total
- **"Custom"** - Tell me your specific preferences

---

*Schema audit complete per Phase 1, Day 0 requirements. All findings documented, backed up, and ready for implementation.*

