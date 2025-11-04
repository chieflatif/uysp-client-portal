# Webinar Campaign System - Implementation Summary

**Date**: 2025-11-02  
**Status**: ✅ Approved & Ready  
**Spec**: `WEBINAR-SYSTEM-FINAL-APPROVED.md`

---

## What We're Building

A **time-sensitive webinar nurture system** that sends 4 messages to leads who register for live webinars:
1. **Acknowledgment** (immediate)
2. **Value/Anticipation** (12-24 hours after registration, if >24 hours until webinar)
3. **24-hour reminder**
4. **1-hour reminder**

---

## Key Architectural Decisions

### ✅ Backward Compatibility First
- **ZERO changes** to existing 21 campaigns
- All existing templates default to `Template Type = "Standard"`
- Standard scheduler continues as-is (just filters out webinars)
- Webinar system is completely isolated

### ✅ SMS_Templates Extension
**NEW FIELD**: `Template Type` (Webinar / Standard)

**Before**:
```
Campaign: "pricing_rules", Step: 1, Variant: A → Body
```

**After**:
```
Campaign: "pricing_rules", Template Type: "Standard", Step: 1, Variant: A → Body
Campaign: "Q4-Webinar", Template Type: "Webinar", Step: 1, Variant: A → Body
```

**Lookup Logic**:
```javascript
// OLD (still works):
template = find(campaign === lead.campaign_name && step === position && variant === lead.variant)

// NEW (more specific):
template = find(
  campaign === lead.campaign_name && 
  template_type === lead.lead_source &&  // "Standard" or "Webinar"
  step === position && 
  variant === lead.variant
)
```

---

## Schema Changes

### Airtable
1. **NEW TABLE**: `Campaigns` (13 fields)
2. **UPDATE**: `Leads` table (+4 fields: Form ID, Webinar Datetime, Lead Source, Linked Campaign)
3. **UPDATE**: `SMS_Templates` table (+1 field: Template Type)

### PostgreSQL
1. **EXTEND**: `campaigns` table (+9 columns)
2. **EXTEND**: `leads` table (+4 columns)
3. **EXTEND**: `sms_templates` table (+1 column: `template_type`)

---

## Workflow Changes

### Kajabi API Polling (UPDATE)
- Add campaign lookup from Airtable Campaigns table
- Set `Lead Source` based on campaign type
- Copy webinar fields to lead record

### Standard Scheduler (UPDATE)
- Filter: Only `Lead Source = "Standard"`
- Template filter: Only `Template Type = "Standard"`

### Webinar Scheduler (NEW)
- Filter: Only `Lead Source = "Webinar"` + `Webinar Datetime > NOW()`
- Dynamic timing logic based on hours until webinar
- Template filter: Only `Template Type = "Webinar"`

---

## UI (New Page)

**Path**: `/admin/campaigns`

**Features**:
- List all campaigns (client-specific)
- Create/edit campaigns
- Client dropdown (SUPER_ADMIN)
- Conditional fields (webinar-specific fields only show if type = "Webinar")

**Data Flow**:
```
UI → PostgreSQL campaigns table → Sync Queue → Airtable Campaigns table
```

---

## Critical Clarification

**"AI Webinar- AI SMS" in your current templates**:
- This is a **Standard** campaign (default)
- It's NOT a webinar nurture sequence
- It's a regular SMS campaign that mentions a past webinar
- **NO CHANGES** to this or any existing campaign

**New Webinar Campaigns**:
- Created specifically for live/upcoming webinars
- Use `Template Type = "Webinar"`
- Time-sensitive message timing
- Completely isolated from standard operations

---

## Timeline

- **Week 1**: Airtable schema
- **Week 2**: PostgreSQL schema + sync
- **Week 3**: UI implementation
- **Week 4**: SMS_Templates extension
- **Week 5**: n8n workflow updates
- **Week 6**: End-to-end testing
- **Week 7**: Production deployment

---

## Risk: LOW

- Extends existing patterns (campaigns, sync, scheduler)
- Defaults protect existing behavior
- Complete isolation via `Lead Source` + `Template Type`
- Rollback: Deactivate webinar scheduler, all leads route to standard

---

## Next Steps

1. Review final spec: `WEBINAR-SYSTEM-FINAL-APPROVED.md`
2. Create Campaigns table in Airtable (Phase 1.1)
3. Capture field IDs
4. Begin implementation

---

**Questions?** Review the full spec for all implementation details.
