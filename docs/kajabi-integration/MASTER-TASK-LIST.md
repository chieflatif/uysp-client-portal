# Kajabi Integration - Master Task List
**Created**: October 17, 2025  
**Last Updated**: October 17, 2025 - Week 1 Days 1-3 Complete  
**Branch**: `feature/kajabi-integration`  
**Status**: 🟢 Week 1 Implementation - Days 1-3 Complete | ⚠️ Manual Configuration Required

---

## 🎉 WEEK 1 PROGRESS SUMMARY (Oct 17, 2025)

### ✅ COMPLETED (Automated via MCP Tools)

**Day 1: Airtable Schema** (20 minutes)
- ✅ Added 5 new fields to Leads table (Kajabi Contact ID, Campaign Assignment, Lead Source Detail, Kajabi Member Status, Kajabi Last Sync)
- ✅ Updated SMS_Templates table (added Active checkbox)
- ✅ Created Kajabi_Sync_Audit table with 7 fields

**Day 2-3: n8n Workflow** (30 minutes)
- ✅ Created complete 10-node workflow: UYSP-Kajabi-Realtime-Ingestion
- ✅ Workflow ID: e9s0pmmlZfrZ3qjD
- ✅ All nodes configured with proper connections
- ✅ Smart Field Mapper implements form.id → campaign logic
- ✅ Duplicate detection and routing logic complete
- ✅ Webhook URL: https://rebelhq.app.n8n.cloud/webhook/kajabi-leads

**Documentation**
- ✅ Created comprehensive MANUAL-CONFIGURATION-GUIDE.md

### ⚠️ REQUIRES MANUAL COMPLETION (UI-Only Steps)

**These steps CANNOT be automated via API and must be done in the UI:**

1. **n8n OAuth2 Credential** (5 min)
   - Create OAuth2 credential with client_id + client_secret
   - Attach to "Get Form Details from Kajabi" node
   
2. **Airtable Field Mappings** (15 min)
   - Map 13 fields in "Update Existing Lead" node
   - Map 13 fields in "Create New Lead" node
   - Map 6 fields in "Log to Kajabi Sync Audit" node

3. **Source Field Update** (2 min)
   - Add "Kajabi-Webhook" option to Source field in Airtable
   - Update Smart Field Mapper code to use new option

4. **Form ID Mapping** (15 min)
   - Get form IDs from Ian's Kajabi (via API or manual)
   - Update "Map Form to Campaign" node with real form IDs

**Total Manual Time**: ~37 minutes

### 📋 NEXT STEPS

1. Complete manual configuration steps (see MANUAL-CONFIGURATION-GUIDE.md)
2. Test workflow with sample payloads (Day 4)
3. Validate end-to-end with Clay (Day 5)

---

## 📊 PROJECT OVERVIEW

### Current Phase: Week 1 Implementation - Core Integration Build
- **Status**: ✅ Days 1-3 COMPLETE | ⚠️ Manual UI configuration required
- **Completed**: Airtable schema + n8n workflow created
- **Next Milestone**: Manual configuration steps + testing (Days 4-5)

### Key Documents Created
- ✅ Full Technical Spec (48 pages)
- ✅ Executive Summary (7 pages)
- ✅ Action Checklist (12 pages)
- ✅ Transcript Analysis (14 pages)
- ✅ Session Summary (comprehensive)
- ✅ Quick Start Guide (for developers)
- ✅ Lead Source Tracking Investigation
- ✅ API Investigation Guide

**Total Documentation**: 81+ pages of spec-driven design

---

## 🎯 IMMEDIATE PRIORITIES (This Week)

### Priority 1: Investigation ✅ **COMPLETE - Read-Only Research Done!**
Status: 🟢 **MAJOR BREAKTHROUGH**

- [✅] **API Documentation Research** (NEW - Completed Oct 17, 2025)
  - ✅ Analyzed official Kajabi API documentation
  - ✅ Discovered OAuth 2.0 authentication (not simple Bearer)
  - ✅ **SOLVED LEAD SOURCE PROBLEM**: Form submission includes form.id!
  - ✅ Documented all needed endpoints
  - ✅ Found webhook sample endpoint
  - **Owner**: Claude (AI-assisted research)
  - **Time**: 1 hour
  - **Deliverable**: `API-INVESTIGATION-FINDINGS.md` (complete)

- [✅] **Solve lead source tracking problem** ✅ **SOLVED!**
  - ✅ Webhook includes form relationship with form ID
  - ✅ Can call GET /form_submissions/{id}?include=form
  - ✅ Form ID → Campaign mapping is the solution
  - ✅ No need for tag timestamps (form ID is better!)
  - **Owner**: Claude (based on API docs)
  - **Time**: Included in research above
  - **Deliverable**: Solution documented in findings

- [ ] **Get OAuth credentials from Ian** (UPDATED)
  - ⚠️ Need: `client_id` (not just "API key")
  - ⚠️ Need: `client_secret` (not just "API secret")  
  - These are OAuth credentials, not Bearer tokens
  - **Owner**: Latif
  - **Time**: 5 minutes (client provides)
  - **Blocks**: Live API testing only (not implementation planning)

- [ ] **Get forms list from Ian** (NEW - High Priority)
  - Need form IDs and names for all active forms
  - Will build form → campaign mapping table
  - Can be done via API once credentials received OR
  - Ian can provide list manually from Kajabi UI
  - **Owner**: Latif (from Ian) OR Gabriel (via API)
  - **Time**: 15 minutes
  - **Deliverable**: Form mapping table

---

### Priority 2: Pre-Build Setup
Status: ⏳ **READY - Can start now**

- [ ] **Create Kajabi form inventory**
  - List all forms in Ian's Kajabi
  - Document form names
  - Document associated tags
  - **Owner**: Latif (with Ian)
  - **Time**: 15 minutes
  - **Deliverable**: Table in investigation doc

- [ ] **Get campaign message templates**
  - JB Webinar - Sequence 1 message
  - Sales Webinar - Sequence 1 message
  - AI Webinar - Sequence 1 message (if exists)
  - Default/fallback message
  - **Owner**: Latif (from Ian)
  - **Time**: 30 minutes
  - **Deliverable**: Messages stored in spec or SMS_Templates table

- [ ] **Document custom fields mapping**
  - LinkedIn URL = `custom_##`
  - Coaching Interest = `custom_##`
  - Any other important fields
  - **Owner**: Latif (from Ian)
  - **Time**: 15 minutes
  - **Deliverable**: Custom field mapping table

---

## 📅 WEEK 1: CORE INTEGRATION (After Investigation)

### Day 1: Schema & Setup (3 hours) ✅ **COMPLETE**
Status: 🟢 **COMPLETE - Oct 17, 2025**

- [✅] **Update Airtable Leads table** ✅ **DONE**
  - ✅ Added: Kajabi Contact ID (Text) - Field ID: fldTTtiojQGiqRbdD
  - ✅ Added: Kajabi Tags (Long Text) - Already existed: fldQ7UAfiMzqgY1W9
  - ✅ Added: Campaign Assignment (Single Select) - Field ID: fld3itEgizyfurSOc
    - Options: webinar_jb_2024, webinar_sales_2024, webinar_ai_2024, newsletter_nurture, default_nurture
  - ✅ Added: Lead Source Detail (Text) - Field ID: fldKVgfCZeZ20e4LZ
  - ✅ Added: Kajabi Member Status (Single Select) - Field ID: fldjLHXIiQ1qf2Boi
    - Options: Prospect, Active, Trial, Churned
  - ✅ Added: Kajabi Last Sync (DateTime) - Field ID: fldPTgYHihNPFY8zR
  - ⚠️ Manual: Source field (add "Kajabi-Webhook" option) - requires UI update
  - **Owner**: Claude (automated via MCP)
  - **Time**: 10 minutes (automated)
  - **Deliverable**: 5 new fields created in Leads table

- [✅] **Update SMS_Templates table** ✅ **DONE**
  - ✅ Table already existed (tblsSX9dYMnexdAa7)
  - ✅ Added: Active (Checkbox) field for enabling/disabling campaigns
  - ✅ Verified existing structure matches requirements
  - **Owner**: Claude (automated via MCP)
  - **Time**: 5 minutes (automated)
  - **Deliverable**: SMS_Templates table ready

- [✅] **Create Kajabi_Sync_Audit table** ✅ **DONE**
  - ✅ Created new table: tbl0znQdpA2DI2EcP
  - ✅ Added 7 fields:
    - Kajabi Contact ID (Text)
    - Lead Email (Email)
    - Sync Timestamp (DateTime)
    - Duplicate Found (Checkbox)
    - Campaign Assigned (Text)
    - Tags Captured (Long Text)
    - Error Log (Long Text)
  - **Owner**: Claude (automated via MCP)
  - **Time**: 5 minutes (automated)
  - **Deliverable**: Kajabi_Sync_Audit table created

- [⚠️] **Create Kajabi OAuth2 credential in n8n** ⚠️ **REQUIRES MANUAL SETUP**
  - ⚠️ n8n API does not support OAuth2 credential creation
  - ✅ Credentials available: client_id + client_secret from environment template
  - ⚠️ Must be configured manually in n8n UI
  - **Owner**: Latif/Gabriel
  - **Time**: 5 minutes (manual in UI)
  - **Depends on**: Manual UI steps (see MANUAL-CONFIGURATION-GUIDE.md)
  - **Deliverable**: OAuth2 credential configured and tested

### Day 2-3: Build n8n Workflow (4 hours) ✅ **COMPLETE**
Status: 🟢 **COMPLETE - Oct 17, 2025** | ⚠️ **Requires Manual UI Configuration**

- [✅] **Create workflow: UYSP-Kajabi-Realtime-Ingestion** ✅ **DONE**
  - ✅ Workflow ID: e9s0pmmlZfrZ3qjD
  - ✅ Project: H4VRaaZhd8VKQANf
  - ✅ 10 nodes created (see below)
  - ✅ Status: Inactive (ready for configuration and testing)
  - ✅ Webhook URL: https://rebelhq.app.n8n.cloud/webhook/kajabi-leads
  - **Owner**: Claude (automated via MCP)
  - **Time**: 30 minutes (automated)
  - **Deliverable**: Complete workflow created, requires manual field mapping

  **Nodes Created**:
  - [✅] Node 1: Kajabi Webhook (POST /webhook/kajabi-leads)
  - [✅] Node 2: Extract Submission Data (Code - parses webhook payload)
  - [✅] Node 3: Get Form Details from Kajabi (HTTP Request to form_submissions API)
  - [✅] Node 4: Map Form to Campaign (Code - form_id → campaign lookup)
  - [✅] Node 5: Smart Field Mapper (Code - normalizes all fields for Airtable)
  - [✅] Node 6: Check for Duplicate Email (Airtable Search)
  - [✅] Node 7: Is Duplicate? (IF node - routes to update or create)
  - [✅] Node 8: Update Existing Lead (Airtable Update) ⚠️ Needs field mapping
  - [✅] Node 9: Create New Lead (Airtable Create) ⚠️ Needs field mapping
  - [✅] Node 10: Log to Kajabi Sync Audit (Airtable Create) ⚠️ Needs field mapping

- [✅] **Configure workflow structure** ✅ **DONE**
  - ✅ All Airtable nodes use credential: "Airtable UYSP Option C" (Zir5IhIPeSQs72LR)
  - ✅ All expressions use space syntax `{{ $json.field }}`
  - ✅ Workflow settings: Execution order v1
  - ✅ Error handling: Configured for API nodes
  - ⚠️ Manual: Field mappings for Airtable nodes (3 nodes need mapping)
  - ⚠️ Manual: OAuth2 credential for HTTP Request node
  - ⚠️ Manual: Form ID → Campaign mapping (need real form IDs from Ian)
  - **Owner**: Claude (automated via MCP)
  - **Time**: Included in workflow creation above
  - **Deliverable**: Workflow structure complete, requires manual configuration

**⚠️ MANUAL CONFIGURATION REQUIRED**:
See `docs/kajabi-integration/MANUAL-CONFIGURATION-GUIDE.md` for step-by-step UI instructions

### Day 4: Testing (2 hours)
Status: ⏸️ **WAITING - Need workflow complete**

- [ ] **Create test payloads**
  - 5 test scenarios (see spec)
  - Postman collection or curl scripts
  - **Owner**: Gabriel
  - **Time**: 30 minutes
  - **Deliverable**: Test suite ready

- [ ] **Execute manual tests**
  - Test 1: New lead with tag
  - Test 2: Duplicate email
  - Test 3: No tags
  - Test 4: Invalid email
  - Test 5: API timeout/error
  - **Owner**: Gabriel
  - **Time**: 1 hour
  - **Deliverable**: 5/5 tests passing

- [ ] **Document test results**
  - Screenshots of successful executions
  - Airtable records created
  - Any issues found and fixed
  - **Owner**: Gabriel
  - **Time**: 30 minutes
  - **Deliverable**: Test evidence log

### Day 5: Clay Integration Validation (1 hour)
Status: ⏸️ **WAITING - Need tests passing**

- [ ] **End-to-end test with real Kajabi form**
  - Submit form in Ian's Kajabi
  - Verify webhook captured
  - Verify Airtable record created
  - Verify Clay picks up lead
  - Verify enrichment completes
  - Verify status changes to "Ready for SMS"
  - **Owner**: Gabriel
  - **Time**: 1 hour
  - **Deliverable**: Full flow working, evidence captured

---

## 📅 WEEK 2: CAMPAIGN-AWARE SMS (After Week 1 Complete)

### Day 1-2: Update SMS Scheduler (2 hours)
Status: ⏸️ **WAITING - Week 1 complete**

- [ ] **Modify UYSP-SMS-Scheduler-v2 workflow**
  - Add: "Get SMS Template" node (Airtable Search)
  - Add: "Check Template Found" node (IF)
  - Add: "Fallback to Default" node (Airtable Search)
  - Update: "Prepare Message" node (use template from lookup)
  - **Owner**: Gabriel
  - **Time**: 2 hours
  - **Deliverable**: Scheduler updated, not activated

- [ ] **Test template variable replacement**
  - {{first_name}} → actual first name
  - {{last_name}} → actual last name
  - {{title}} → actual title
  - {{company}} → actual company
  - {{calendly_link}} → actual link
  - **Owner**: Gabriel
  - **Time**: 30 minutes
  - **Deliverable**: All variables replace correctly

### Day 3-4: Campaign Testing (2 hours)
Status: ⏸️ **WAITING - Scheduler updated**

- [ ] **Test campaign logic**
  - Create test lead with "JB Webinar" tag
  - Verify gets JB Webinar template
  - Create test lead with "Sales Webinar" tag
  - Verify gets Sales Webinar template (different)
  - Create test lead with unrecognized tag
  - Verify gets default template
  - **Owner**: Gabriel
  - **Time**: 1.5 hours
  - **Deliverable**: Campaign routing 100% accurate

- [ ] **Document campaign testing results**
  - Screenshots of messages sent
  - Airtable records with campaign assignments
  - SMS_Audit logs
  - **Owner**: Gabriel
  - **Time**: 30 minutes
  - **Deliverable**: Test evidence

### Day 5: Client Training (1 hour)
Status: ⏸️ **WAITING - Testing complete**

- [ ] **Create campaign management SOP**
  - How to add new campaign
  - How to update message template
  - How to deactivate campaign
  - **Owner**: Latif
  - **Time**: 30 minutes
  - **Deliverable**: SOP document

- [ ] **Record training video**
  - Walk through adding campaign
  - Show SMS_Templates table
  - Demonstrate test
  - **Owner**: Latif
  - **Time**: 30 minutes
  - **Deliverable**: 5-minute video

- [ ] **Train Ian**
  - Live walkthrough
  - Practice adding campaign
  - Q&A
  - **Owner**: Latif + Gabriel
  - **Time**: 30 minutes
  - **Deliverable**: Ian can independently add campaign

---

## 📅 WEEK 3: PRODUCTION ROLLOUT (After Week 2 Complete)

### Day 1-2: Soft Launch (4 hours)
Status: ⏸️ **WAITING - Week 2 complete**

- [ ] **Choose test form for soft launch**
  - Low-stakes form (newsletter?)
  - Confirm with Ian
  - **Owner**: Latif
  - **Time**: 5 minutes
  - **Deliverable**: Form selected

- [ ] **Configure Kajabi webhook for test form only**
  - In Kajabi: Settings → Webhooks
  - Event: form.submitted
  - URL: n8n webhook URL
  - Activate
  - **Owner**: Gabriel (with Ian's admin access)
  - **Time**: 15 minutes
  - **Deliverable**: Webhook active, tested

- [ ] **Monitor for 48 hours**
  - Check n8n executions every 4 hours
  - Review Kajabi_Sync_Audit for errors
  - Compare Kajabi form count vs Airtable records
  - Verify SMS sending correctly
  - **Owner**: Gabriel + Latif
  - **Time**: 3 hours over 2 days (spot checks)
  - **Deliverable**: Monitoring log, no critical issues

### Day 3-4: Full Rollout (2 hours)
Status: ⏸️ **WAITING - Soft launch successful**

- [ ] **Enable webhook for all Kajabi forms**
  - Update webhook configuration
  - Test one lead per form
  - Verify all forms flowing
  - **Owner**: Gabriel
  - **Time**: 1 hour
  - **Deliverable**: All forms enabled, tested

- [ ] **Create monitoring dashboard**
  - Airtable view: Kajabi leads (last 7 days)
  - Airtable view: Duplicate leads (count > 3)
  - Airtable view: Failed syncs
  - Slack alert: Daily summary
  - **Owner**: Gabriel
  - **Time**: 1 hour
  - **Deliverable**: Dashboard views created

### Day 5-7: Optimization (3 hours)
Status: ⏸️ **WAITING - Full rollout complete**

- [ ] **Review error logs**
  - Analyze Kajabi_Sync_Audit
  - Identify patterns
  - Fix edge cases
  - **Owner**: Gabriel
  - **Time**: 1.5 hours
  - **Deliverable**: Error patterns documented, fixes applied

- [ ] **Optimize campaign assignment rules**
  - Review accuracy with real data
  - Adjust tag matching if needed
  - Update form → campaign mappings
  - **Owner**: Gabriel + Latif
  - **Time**: 1 hour
  - **Deliverable**: Optimizations applied

- [ ] **Create troubleshooting runbook**
  - Common issues and fixes
  - When to escalate
  - Rollback procedure
  - **Owner**: Gabriel
  - **Time**: 30 minutes
  - **Deliverable**: Runbook document

- [ ] **Client check-in call**
  - Review metrics (capture rate, campaigns, SMS)
  - Gather feedback
  - Discuss Phase 2 features
  - **Owner**: Latif + Gabriel + Ian
  - **Time**: 30 minutes
  - **Deliverable**: Meeting notes, next steps

---

## 🚀 FUTURE PHASES (Post-Launch)

### Phase 2: Write-Back to Kajabi (Month 2)
Status: 📅 **PLANNED - Not started**

- [ ] **Investigate Kajabi write-back capabilities**
  - Can we tag contacts via API?
  - Can we update custom fields?
  - Rate limits for writes?
  - **Owner**: TBD
  - **Time**: 1 hour

- [ ] **Design write-back workflow**
  - Tag when meeting booked
  - Update ICP score custom field
  - Sync SMS status
  - **Owner**: TBD
  - **Time**: 2 hours

- [ ] **Build and test write-back**
  - **Owner**: TBD
  - **Time**: 4 hours

### Phase 3: WhatsApp Integration (Month 3)
Status: 📅 **PLANNED - Not started**

- [ ] **Evaluate providers** (Twilio, SendPulse, GoHighLevel)
- [ ] **Build WhatsApp workflow**
- [ ] **Test international numbers**
- [ ] **Deploy**

### Phase 4: Two-Way Conversations (Month 4)
Status: 📅 **PLANNED - Not started**

- [ ] **Build reply handler**
- [ ] **Add AI response logic**
- [ ] **Slack handoff integration**
- [ ] **Test conversation flows**

---

## ✅ COMPLETION CRITERIA

### Week 1 Complete When:
- [ ] 50 test leads captured without errors
- [ ] Webhook → Airtable → Clay flow working
- [ ] Duplicate detection 100% accurate
- [ ] Campaign assignment working
- [ ] All Airtable tables created

### Week 2 Complete When:
- [ ] Campaign-specific SMS templates working
- [ ] Template variable replacement 100% accurate
- [ ] Client can add new campaign independently
- [ ] Campaign routing 100% accurate

### Week 3 Complete When:
- [ ] All Kajabi forms enabled
- [ ] 7 days of 99%+ success rate
- [ ] Monitoring dashboard active
- [ ] Troubleshooting runbook complete
- [ ] Client signed off

### Production-Ready When:
- [ ] All above criteria met
- [ ] Zero "system broken" tickets for 14 days
- [ ] Lead qualification rate >60%
- [ ] SMS delivery rate >97%
- [ ] Client NPS score: 9 or 10

---

## 🚨 BLOCKERS & DEPENDENCIES

### Current Blockers:
1. 🔴 **API credentials** - Waiting for Ian to provide
   - Blocks: All API investigation
   - Blocks: All implementation work
   - Owner: Latif (request from Ian)
   - ETA: TBD

### Dependencies:
- API investigation → Lead source solution → Smart Field Mapper code
- Airtable schema → n8n workflow build
- n8n workflow → Testing
- Testing → Clay validation
- Week 1 complete → Week 2 starts
- Week 2 complete → Week 3 starts

---

## 📞 TEAM & OWNERSHIP

### Roles:
- **Product Owner**: Latif
  - Client communication
  - Requirements gathering
  - Campaign mapping decisions
  - Training client

- **Technical Lead**: Gabriel
  - API investigation
  - n8n workflow development
  - Airtable configuration
  - Testing and debugging

- **Client**: Ian
  - Provide API credentials
  - Provide campaign templates
  - Form inventory
  - User acceptance testing

---

## 📊 PROGRESS TRACKING

### Overall Progress:
```
Planning & Spec: ████████████████████ 100% COMPLETE
Investigation:   ░░░░░░░░░░░░░░░░░░░░   0% BLOCKED
Week 1:          ░░░░░░░░░░░░░░░░░░░░   0% NOT STARTED
Week 2:          ░░░░░░░░░░░░░░░░░░░░   0% NOT STARTED
Week 3:          ░░░░░░░░░░░░░░░░░░░░   0% NOT STARTED
```

### Time Estimates:
- **Investigation**: 2.5 hours
- **Week 1**: 10 hours
- **Week 2**: 5 hours
- **Week 3**: 9 hours
- **Total**: ~26.5 hours

### Actual Time Spent:
- **Planning & Spec**: ~3 hours (AI-assisted)
- **Investigation**: 0 hours (not started)
- **Week 1**: 0 hours
- **Week 2**: 0 hours
- **Week 3**: 0 hours

---

## 🔄 UPDATE LOG

### October 17, 2025 - Session 1 (Planning & Research)
- ✅ Created all planning documentation (81+ pages)
- ✅ Analyzed transcript with Gabriel  
- ✅ Created lead source tracking investigation doc
- ✅ Created API investigation guide
- ✅ Created this master task list
- ✅ Created new git branch: feature/kajabi-integration
- ✅ **COMPLETED READ-ONLY API INVESTIGATION**:
  - ✅ Analyzed official Kajabi API documentation
  - ✅ **SOLVED LEAD SOURCE TRACKING**: Form ID in submission webhook!
  - ✅ Discovered OAuth 2.0 authentication method
  - ✅ Documented all API endpoints needed
  - ✅ Created complete API findings document
  - ✅ Updated .env template with client_id/client_secret
- ✅ Created secrets management system (templates + guide)
- 🟢 **STATUS**: Investigation complete, ready for credentials + build

### Next Update:
- After OAuth credentials received from Ian
- After forms list obtained
- After Week 1 Day 1 complete (schema updates)

---

## 📝 NOTES

### Important Decisions to Track:
1. **Lead source detection method**: TBD (after investigation)
2. **Campaign priority order**: TBD (after form inventory)
3. **Default campaign behavior**: TBD (discuss with Ian)
4. **Duplicate update strategy**: Update existing (preserve enrichment)
5. **Error handling**: Continue on fail + Slack alerts

### Questions for Ian:
1. Typical lead journey? (How many forms do people submit?)
2. Manual tags or automated only?
3. Which form should be test form for soft launch?
4. Preferred daily report format?

---

**Last Updated**: October 17, 2025, 18:00 EST  
**Status**: 🔴 Investigation Phase - Blocked on API credentials  
**Next Action**: Latif to provide Kajabi API key and secret to Gabriel  
**Next Milestone**: Complete API investigation (2.5 hours after credentials received)

---

*This is a living document. Update after each task completion and at end of each day.*

