# Schema Audit - People Table
## Two-Way AI Messaging System - Phase 1 Safety Infrastructure

**Date**: October 26, 2025  
**Auditor**: AI Assistant  
**Base**: UYSP Lead Qualification (appuBf0fTe8tp8ZaF)  
**Current Field Count**: 107 fields

---

## EXECUTIVE SUMMARY

**Current State**: 107 fields in People table  
**Required New Fields**: 22 fields needed for AI messaging  
**Fields We Can Reuse**: 6 existing fields  
**Fields to Add**: 16 new fields  
**Fields to Deprecate**: 12 fields (recommended cleanup)  
**Net Change**: +16 fields, -12 deprecated = +4 total

---

## FIELD-BY-FIELD AUDIT

### EXISTING FIELDS THAT WE CAN REUSE ✅

| Field Name | Current Type | Current Purpose | AI Messaging Use | Action |
|------------|--------------|-----------------|------------------|---------|
| `interested_in_coaching` | Checkbox | Tracks coaching interest | Maps to `interest_type` (coaching vs content) | **KEEP - REPURPOSE** |
| `last_activity` | Date | Last activity timestamp | Can inform conversation state | **KEEP - REFERENCE** |
| `Communications` | Link | Links to Communications table | Already tracking messages | **KEEP - ENHANCE** |
| `contacted` | Checkbox | Has been contacted | Conversation state indicator | **KEEP - REFERENCE** |
| `test_mode_record` | Checkbox | Test/demo record flag | Perfect for `test_mode_lead` | **RENAME/REUSE** |
| `errors_log` | Long Text | Error logging | Can log AI errors here | **KEEP - USE FOR AI ERRORS** |

### REQUIRED FIELDS - CONVERSATION STATE (6 fields needed)

| Required Field | Exists? | Current Equivalent | Action |
|----------------|---------|-------------------|---------|
| `conversation_thread` | ❌ NO | None | **ADD NEW** - JSON array of full conversation |
| `last_message_direction` | ❌ NO | None | **ADD NEW** - "inbound" or "outbound" |
| `last_message_sent_at` | ⚠️ PARTIAL | `sms_sent_time` exists but different purpose | **ADD NEW** - needs datetime precision |
| `last_message_received_at` | ❌ NO | None | **ADD NEW** - track when prospect replied |
| `active_conversation` | ❌ NO | None | **ADD NEW** - boolean for active chat |
| `test_mode_lead` | ✅ YES | `test_mode_record` | **RENAME EXISTING** - already have this! |

### REQUIRED FIELDS - MESSAGING CONTROL (4 fields needed)

| Required Field | Exists? | Current Equivalent | Action |
|----------------|---------|-------------------|---------|
| `ai_status` | ❌ NO | None | **ADD NEW** - "active", "paused", "human_takeover" |
| `conversation_locked_by_human` | ❌ NO | None | **ADD NEW** - checkbox for human override |
| `pause_reason` | ❌ NO | `review_notes` could be used | **ADD NEW** - specific to AI pause |
| `pause_until` | ❌ NO | None | **ADD NEW** - datetime for temp pause |

### REQUIRED FIELDS - CAMPAIGN STATE (5 fields needed)

| Required Field | Exists? | Current Equivalent | Action |
|----------------|---------|-------------------|---------|
| `campaign_stage` | ❌ NO | `lead_status` is different | **ADD NEW** - AI-specific stages |
| `interest_type` | ⚠️ PARTIAL | `interested_in_coaching` | **ADD NEW** - broader than just coaching |
| `next_scheduled_contact` | ❌ NO | None | **ADD NEW** - critical for scheduling |
| `schedule_set_at` | ❌ NO | None | **ADD NEW** - when schedule was calculated |
| `schedule_invalidated` | ❌ NO | None | **ADD NEW** - safety check for stale schedules |

### REQUIRED FIELDS - SAFETY TRACKING (4 fields needed)

| Required Field | Exists? | Current Equivalent | Action |
|----------------|---------|-------------------|---------|
| `ai_message_count_today` | ❌ NO | None | **ADD NEW** - daily counter (resets midnight) |
| `messages_in_last_2_hours` | ❌ NO | None | **ADD NEW** - runaway detection |
| `last_safety_block_reason` | ❌ NO | None | **ADD NEW** - why message was blocked |
| `safety_violations_count` | ❌ NO | None | **ADD NEW** - total violations counter |

### REQUIRED FIELDS - HUMAN HANDOFF (3 fields needed)

| Required Field | Exists? | Current Equivalent | Action |
|----------------|---------|-------------------|---------|
| `human_assigned_to` | ❌ NO | None | **ADD NEW** - link to user who took over |
| `handback_note` | ❌ NO | `review_notes` exists | **ADD NEW** - specific to AI handback |
| `takeover_timestamp` | ❌ NO | None | **ADD NEW** - when human took over |

### REQUIRED FIELDS - AUDIT (3 fields needed)

| Required Field | Exists? | Current Equivalent | Action |
|----------------|---------|-------------------|---------|
| `total_ai_messages_sent` | ❌ NO | None | **ADD NEW** - lifetime counter |
| `total_ai_cost_usd` | ⚠️ SIMILAR | `claude_cost` exists for scoring | **ADD NEW** - separate for messaging |
| `last_ai_response_time_sec` | ❌ NO | None | **ADD NEW** - performance tracking |

### REQUIRED FIELDS - CONTENT PREFERENCES (2 fields needed)

| Required Field | Exists? | Current Equivalent | Action |
|----------------|---------|-------------------|---------|
| `content_interests` | ❌ NO | None | **ADD NEW** - topics they care about |
| `preferred_content_frequency` | ❌ NO | None | **ADD NEW** - days between content |

---

## EXISTING FIELDS - REDUNDANT/DEPRECATED (Cleanup Opportunity)

| Field Name | Current Purpose | Why Redundant | Recommendation |
|------------|-----------------|---------------|----------------|
| `sms_sent` | Checkbox if SMS sent | Replaced by `conversation_thread` | **DEPRECATE** - AI will track in conversation |
| `sms_sent_time` | Date SMS sent | Replaced by `last_message_sent_at` | **DEPRECATE** - more precise field coming |
| `sms_clicked` | Checkbox if clicked | Can track in Communications table | **DEPRECATE** - move to Communications |
| `sms_click_time` | Date clicked | Can track in Communications table | **DEPRECATE** - move to Communications |
| `sms_opted_out` | Checkbox opted out | Move to DND_List table entirely | **DEPRECATE** - use DND table |
| `sms_opt_out_time` | Date opted out | Move to DND_List table | **DEPRECATE** - use DND table |
| `reengagement_count` | Number of reengagement | Not relevant for AI convos | **DEPRECATE** - AI handles this differently |
| `ready_for_sms` | Checkbox ready | AI decides when to message | **DEPRECATE** - safety module handles this |
| `should_enrich_phone` | Checkbox for enrichment | One-time process, not needed ongoing | **DEPRECATE** - or archive after use |
| `duplicate_count` | Number of dupes | Handled at ingestion | **DEPRECATE** - not needed in active record |
| `meeting_booked` | Checkbox booked | Tracked in Communications/Calendly | **CONSIDER KEEPING** - quick filter useful |
| `meeting_time` | Date of meeting | Tracked in Calendly | **CONSIDER KEEPING** - quick reference useful |

**Note**: These fields aren't actively harmful, but cleaning them up will make the table more manageable and reduce confusion.

---

## EXISTING FIELDS - KEEP AS-IS (Critical for Current System)

**Lead Identity & Contact:**
- `email`, `first_name`, `last_name`, `phone_primary`, `phone_enriched`, `phone_original`, `phone_recent`, `phone_validated`
- `linkedin_url`, `company_input`, `company_enriched`, `title_current`
- `kajabi_id` (integration key)

**Qualification & Scoring:**
- `icp_score`, `icp_tier`, `score_breakdown`, `scoring_date`, `scoring_method`
- `scoring_model`, `scoring_attempted`, `scoring_method_used`

**Lead Management:**
- `lead_source`, `lead_status`, `routing`, `processing_status`
- `created_date`, `last_enriched`, `processing_started`, `processing_completed`

**Enrichment Tracking:**
- `enrichment_attempted`, `enrichment_failed`, `enrichment_confidence`, `enrichment_path`
- `title_found`, `company_verified`
- All PDL/Hunter/Dropcontact fields (response times, retry counts, costs, errors)

**Cost Tracking:**
- `apollo_org_cost`, `apollo_person_cost`, `twilio_cost`, `claude_cost`
- `dropcontact_cost`, `pdl_cost`, `hunter_cost`
- `total_processing_cost`

**Data Quality:**
- `phone_type`, `phone_country_code`, `international_phone`, `requires_international_handling`
- `phone_validated`, `field_mapping_success_rate`

**Review & QA:**
- `reviewed`, `review_notes`, `qualified_lead`, `contacted`

**Workflow Tracking:**
- `workflow_id`, `request_id`, `test_mode_record`

**Phase Tracking:**
- `phase1_attempted`, `phase1_passed`, `phase2_attempted`, `phase2_passed`
- `routing` (qualification routing)

**Archive:**
- `archived_date`, `archived_reason`

**Other:**
- `linkedin_location`, `raw_webhook_data`, `validation_errors`
- `webhook_field_count`, `mapped_field_count`, `unknown_field_list`
- `normalization_version`

---

## FINAL FIELD MAPPING

### FIELDS TO ADD (16 New Fields)

**Conversation State:**
1. `conversation_thread` (Long Text - JSON) - Full conversation history
2. `last_message_direction` (Single Select: "outbound", "inbound")
3. `last_message_sent_at` (DateTime with time)
4. `last_message_received_at` (DateTime with time)
5. `active_conversation` (Checkbox)

**Messaging Control:**
6. `ai_status` (Single Select: "active", "paused", "human_takeover")
7. `conversation_locked_by_human` (Checkbox)
8. `pause_reason` (Long Text)
9. `pause_until` (DateTime)

**Campaign State:**
10. `campaign_stage` (Single Select: "confirmation", "intent_qualify", etc.)
11. `interest_type` (Single Select: "content", "coaching", "unknown")
12. `next_scheduled_contact` (DateTime)
13. `schedule_set_at` (DateTime)
14. `schedule_invalidated` (Checkbox)

**Safety Tracking:**
15. `ai_message_count_today` (Number, default 0)
16. `messages_in_last_2_hours` (Number, default 0)
17. `last_safety_block_reason` (Long Text)
18. `safety_violations_count` (Number, default 0)

**Human Handoff:**
19. `human_assigned_to` (Link to Users table - if exists, or Single Line Text)
20. `handback_note` (Long Text)
21. `takeover_timestamp` (DateTime)

**Audit:**
22. `total_ai_messages_sent` (Number)
23. `total_ai_cost_usd` (Currency USD)
24. `last_ai_response_time_sec` (Number)

**Content Preferences:**
25. `content_interests` (Long Text - comma-separated)
26. `preferred_content_frequency` (Number - days)

**Total: 22 NEW FIELDS** (not 16 - PRD was simplified, we need all these for complete safety)

### FIELDS TO REPURPOSE (1 Rename)

1. `test_mode_record` → Keep as-is, use for `test_mode_lead` functionality

### FIELDS TO DEPRECATE (12 Fields - Optional Cleanup)

1. `sms_sent` - Replaced by conversation_thread
2. `sms_sent_time` - Replaced by last_message_sent_at
3. `sms_clicked` - Move to Communications table
4. `sms_click_time` - Move to Communications table
5. `sms_opted_out` - Use DND_List table
6. `sms_opt_out_time` - Use DND_List table
7. `reengagement_count` - Not relevant for AI
8. `ready_for_sms` - AI safety module decides
9. `should_enrich_phone` - One-time flag
10. `duplicate_count` - Handled at ingestion
11. *(Optional)* `meeting_booked` - If tracked elsewhere
12. *(Optional)* `meeting_time` - If tracked elsewhere

---

## FINAL SCHEMA CHANGE PLAN

### Summary

**Add**: 22 new fields (safety-first AI messaging)  
**Repurpose**: 1 existing field (`test_mode_record`)  
**Deprecate**: 12 fields (cleanup - optional)  
**Keep**: 95 existing fields (unchanged)

**New Total**: 107 - 12 + 22 = **117 fields** (if we deprecate)  
**Or**: 107 + 22 = **129 fields** (if we keep everything)

**Recommendation**: Add 22 new fields now, deprecate 12 old fields during cleanup phase (not blocking).

---

## DEPENDENCIES & NOTES

### Communications Table Enhancement Required

The existing `Communications` table needs these additional fields (from PRD):

**ADD TO COMMUNICATIONS:**
1. `ai_generated` (Checkbox)
2. `ai_confidence` (Number 0-100)
3. `ai_model_used` (Single Line Text - always "gpt-4o-mini")
4. `ai_cost` (Currency USD)
5. `tokens_used` (Number)
6. `conversation_turn_number` (Number)
7. `escalated_to_human` (Checkbox)
8. `human_reviewed` (Checkbox)

**EXISTING IN COMMUNICATIONS (Already Good):**
- `person_id` (Link to People)
- `message_type` (SMS/Email)
- `message_content` (Long Text)
- `sent_time` (Date)
- `clicked` (Checkbox)
- `click_time` (Date)
- `simpletexting_id` (Message ID)
- `delivery_status` (Status)
- `opt_out_received` (Checkbox)
- `test_mode_send` (Checkbox)
- `cost_logged` (Currency)

**Communications table is 80% ready** - just needs AI-specific fields added.

---

## NEW TABLES REQUIRED

### 1. AI_Config Table (NEW)
**Purpose**: Client-specific AI configuration  
**Records**: 1 record per client (UYSP = 1 record)  
**Fields**: ~25 fields (see PRD Section: Table 4)  
**Priority**: CRITICAL - Required Day 1

### 2. Client_Safety_Config Table (NEW)
**Purpose**: Safety limits and circuit breakers  
**Records**: 1 record per client  
**Fields**: ~15 fields (see PRD Section: Table 7)  
**Priority**: CRITICAL - Required Day 1

### 3. Message_Decision_Log Table (NEW)
**Purpose**: Audit trail for every message decision  
**Records**: 1 per message decision (SEND or BLOCK)  
**Fields**: ~15 fields (see PRD Section: Table 8)  
**Priority**: CRITICAL - Required Day 1

### 4. Content_Library Table (NEW)
**Purpose**: Content resources for AI to recommend  
**Records**: 5-10 per client  
**Fields**: ~12 fields (see PRD Section: Table 3)  
**Priority**: MEDIUM - Required Phase 4 (Week 4)

---

## RISK ASSESSMENT

### Low Risk ✅
- Adding new fields to existing table (non-breaking)
- Existing workflows unaffected by new fields
- New fields start empty/default

### Medium Risk ⚠️
- 22 new fields is significant (table complexity)
- Must document each field clearly
- Frontend queries may need updates

### High Risk 🚨
- **NONE** - This is additive, not destructive

### Mitigation
1. ✅ Full backup before any changes (required in deployment guide)
2. ✅ Add fields in test base first
3. ✅ Test with test_mode_record = TRUE leads
4. ✅ Document field IDs for n8n integration
5. ✅ Update frontend schema definitions

---

## APPROVAL CHECKLIST

Before proceeding to Day 1 (adding fields):

- [ ] **Schema exported and backed up** (current state preserved)
- [ ] **Stakeholder review** - Approve 22 new fields vs 16 planned
- [ ] **Confirm field names** - Match PRD exactly or customize?
- [ ] **Deprecation strategy** - Remove 12 old fields now or later?
- [ ] **Test base ready** - Duplicate base for testing
- [ ] **Field ID tracking** - Plan to document all new field IDs
- [ ] **Frontend impact** - Update TypeScript types
- [ ] **n8n mapping** - Plan to map field IDs in workflows

---

## NEXT STEPS

### Immediate (Pending Approval)
1. ✅ Get stakeholder approval on 22 fields (vs 16 in PRD)
2. Export current schema to JSON (backup)
3. Create test Airtable base
4. Add 22 fields to test base
5. Test with sample records
6. Document field IDs
7. Proceed to Day 1 implementation

### Day 1 Tasks (After Approval)
1. Add 22 fields to People table (production)
2. Create AI_Config table (1 record)
3. Create Client_Safety_Config table (1 record)
4. Create Message_Decision_Log table (empty, will populate)
5. Enhance Communications table (8 new fields)
6. Export updated schema
7. Document all field IDs for n8n
8. Update frontend TypeScript types

---

## QUESTIONS FOR STAKEHOLDER

1. **Field Count**: PRD mentioned 16 fields, audit shows we need 22 for complete safety. Approve all 22?
2. **Deprecation**: Remove 12 redundant SMS fields now or postpone cleanup?
3. **Field Names**: Use exact PRD names or customize (e.g., `ai_status` vs `ai_agent_status`)?
4. **Communications Enhancement**: Add 8 AI fields to Communications table now or Phase 2?
5. **Test Base**: Create duplicate test base or test in production with `test_mode_record = TRUE`?

---

**Audit Status**: ✅ Complete - Ready for Approval  
**Next Document**: `field-additions-plan.md` (after approval)  
**Estimated Time to Implement**: 2-3 hours (Day 1 - Airtable Schema Updates)

---

*This audit provides a complete field-by-field analysis of the existing People table against AI messaging requirements. The recommendation is to add 22 new fields (not 16) for complete safety coverage, repurpose 1 existing field, and optionally deprecate 12 redundant fields during cleanup.*

