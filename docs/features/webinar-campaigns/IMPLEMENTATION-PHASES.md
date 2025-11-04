# Webinar Campaign System - Implementation Phases

**Date**: 2025-11-02  
**Strategy**: Backend First → Test → Frontend Second

---

## 🎯 Two-Phase Approach

### Phase A: Backend (Airtable + n8n) - 3-4 weeks
**Goal**: Fully functional webinar messaging system  
**Testing**: Complete end-to-end in Airtable/n8n before touching UI  
**Deliverable**: Webinar leads flow through system and receive correct messages

### Phase B: Frontend (Client Portal UI) - 2-3 weeks  
**Goal**: Campaign management interface  
**Prerequisites**: Phase A complete and validated  
**Deliverable**: Admins can create/manage campaigns via UI

---

## 📋 PHASE A: BACKEND IMPLEMENTATION

### Scope
- Airtable schema changes (Campaigns table, Leads updates, SMS_Templates update)
- n8n workflow updates (Kajabi polling, Standard scheduler, Webinar scheduler)
- PostgreSQL schema (for read cache only)
- Background sync logic (Airtable → PostgreSQL)

### What's NOT in Phase A
- ❌ No UI pages
- ❌ No API routes for campaign CRUD
- ❌ No campaign form components
- ❌ No admin interface changes

### Phase A Deliverables
1. ✅ Campaigns table exists in Airtable (manual creation/editing)
2. ✅ Leads route correctly based on Lead Source
3. ✅ Webinar scheduler sends messages with correct timing
4. ✅ Standard scheduler unchanged, excludes webinars
5. ✅ Templates isolated by Template Type
6. ✅ PostgreSQL mirrors Airtable (read cache working)
7. ✅ End-to-end test: Register lead → Receives 4 messages

### Phase A Testing
- Create test campaign manually in Airtable
- Simulate lead registration via Kajabi webhook
- Verify message sequence timing
- Confirm no impact on existing 21 campaigns
- Validate multi-tenant isolation

---

## 📋 PHASE B: FRONTEND IMPLEMENTATION

### Prerequisites
- ✅ Phase A complete and validated
- ✅ Backend sync working flawlessly
- ✅ At least one successful webinar campaign run

### Scope
- UI page: `/admin/campaigns`
- API routes: `/api/admin/campaigns` (GET, POST, PATCH)
- Campaign list component
- Campaign form component (with conditional webinar fields)
- Client dropdown integration (SUPER_ADMIN)
- Write operations via sync queue

### Phase B Deliverables
1. ✅ Admins can view campaigns in UI
2. ✅ Admins can create new campaigns
3. ✅ Admins can edit existing campaigns
4. ✅ Admins can activate/deactivate campaigns
5. ✅ SUPER_ADMIN can switch between clients
6. ✅ Writes queue to Airtable correctly
7. ✅ UI reflects Airtable state within 5 minutes

### Phase B Testing
- Create campaign via UI → Appears in Airtable
- Edit campaign via UI → Updates in Airtable
- Test as ADMIN (single client) and SUPER_ADMIN (multi-client)
- Verify write queue and conflict detection

---

## 🚀 Implementation Order

### PHASE A: BACKEND (Start Here)

**Week 1: Airtable Schema**
1. Create Campaigns table (13 fields)
2. Update Leads table (+4 fields)
3. Update SMS_Templates table (+1 field)
4. Capture all field IDs
5. Create test campaign manually

**Week 2: n8n Workflows**
1. Update Kajabi API Polling (add campaign lookup)
2. Update Standard SMS Scheduler (filter webinars out)
3. Create Webinar SMS Scheduler (new workflow)
4. Test lead routing
5. Test message sending

**Week 3: PostgreSQL & Sync**
1. Run migration (extend 3 tables)
2. Update schema.ts
3. Add `streamAllCampaigns()` to AirtableClient
4. Add `mapToDatabaseCampaign()` to AirtableClient
5. Create `sync-campaigns.ts`
6. Update admin sync route
7. Test sync: Airtable → PostgreSQL

**Week 4: End-to-End Testing**
1. Full webinar sequence (register 7 days out)
2. Edge cases (register 1 day out, 1 hour out)
3. Verify timing accuracy
4. Confirm backward compatibility (21 campaigns untouched)
5. Multi-tenant isolation test

---

### PHASE B: FRONTEND (After Phase A validated)

**Week 5: API Layer**
1. Create `/api/admin/campaigns/route.ts` (GET, POST)
2. Create `/api/admin/campaigns/[id]/route.ts` (PATCH)
3. Integrate with sync queue
4. Test API endpoints

**Week 6: UI Components**
1. Create `/admin/campaigns/page.tsx`
2. Create campaign list component
3. Create campaign form component
4. Add client dropdown
5. Wire up API calls

**Week 7: UI Testing & Polish**
1. CRUD operations testing
2. Role-based access (ADMIN vs SUPER_ADMIN)
3. Form validation
4. Error handling
5. Loading states

---

## 🎯 Why This Approach?

### Backend First Benefits
1. ✅ **Validate core logic** before building UI around it
2. ✅ **Test messaging system** without UI complexity
3. ✅ **Iterate on timing** without redeploying frontend
4. ✅ **Catch Airtable issues** early
5. ✅ **Verify backward compatibility** in isolation

### Separation Benefits
1. ✅ **Clear success criteria** for each phase
2. ✅ **Can pause between phases** without broken state
3. ✅ **Different skill sets** (n8n vs React)
4. ✅ **Easier debugging** (isolate backend vs frontend issues)
5. ✅ **Backend can work without UI** (manual Airtable entry is fine)

---

## 📊 Effort Distribution

**Phase A (Backend)**: ~60% of work
- More complex (timing logic, workflow updates, routing)
- Higher risk (touches active messaging system)
- Requires careful testing

**Phase B (Frontend)**: ~40% of work
- Follows existing patterns (campaigns table already exists for standard)
- Lower risk (UI-only, doesn't affect messaging)
- Can iterate rapidly

---

## ⚠️ Critical Handoff Between Phases

**Before starting Phase B, verify**:
1. ✅ At least 3 successful webinar sequences completed
2. ✅ Zero errors in webinar scheduler logs
3. ✅ Standard scheduler still working for existing campaigns
4. ✅ PostgreSQL sync running clean (no errors)
5. ✅ Timing validation passed (messages at correct intervals)

**If any issues in Phase A**: Fix before proceeding to Phase B.

---

## 📁 Documentation Split

**Phase A Documentation**:
- WEBINAR-SYSTEM-FINAL-APPROVED.md → Sections: PHASE 1, 2, 3, 4, 6, 7
- Focus: Schema, sync, workflows

**Phase B Documentation**:
- WEBINAR-SYSTEM-FINAL-APPROVED.md → Section: PHASE 5
- Focus: UI, API routes, components

---

**Current Status**: Ready to start Phase A (Backend)  
**Next Action**: Week 1 - Create Campaigns table in Airtable

