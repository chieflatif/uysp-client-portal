# Kajabi Integration - Action Checklist
**Created**: October 17, 2025  
**Owner**: Latif + Gabriel  
**Target Start**: Week of October 21, 2025

---

## ✅ PRE-IMPLEMENTATION CHECKLIST

### Information Gathering (Client - Ian)
- [ ] **Kajabi API Access Confirmed**
  - Kajabi plan level: _______________
  - API key obtained: Yes / No
  - Site ID: _______________
  
- [ ] **Kajabi Form Inventory**
  - How many forms capture leads? _______________
  - List of form names:
    - [ ] _________________________
    - [ ] _________________________
    - [ ] _________________________
  
- [ ] **Tag Schema Documentation**
  - Export all existing tags from Kajabi
  - Document which tags indicate what campaign
  - Example: "JB Webinar" = webinar_jb_2024 campaign
  
- [ ] **Custom Fields Mapping**
  - [ ] LinkedIn URL field: `custom_##` → Value: __________
  - [ ] Coaching Interest: `custom_##` → Value: __________
  - [ ] Other important fields:
    - Field name: __________ | Custom field ID: __________
    - Field name: __________ | Custom field ID: __________

- [ ] **Campaign Message Templates**
  - [ ] JB Webinar - Sequence 1 message: _________________________
  - [ ] JB Webinar - Sequence 2 message: _________________________
  - [ ] Sales Webinar - Sequence 1 message: _________________________
  - [ ] Default/Fallback message: _________________________

- [ ] **Business Rules Confirmation**
  - [ ] Keep Kajabi email sequences untouched? Yes / No
  - [ ] Default action for untagged leads? Archive / Generic nurture / Hold
  - [ ] SMS sending hours: 9am-5pm EST / Custom: __________
  - [ ] Weekend SMS? Yes / No

### Technical Setup (Gabriel)
- [ ] **Kajabi API Credential Created in n8n**
  - Credential name: "Kajabi API"
  - Type: HTTP Header Auth
  - Header: `Authorization: Bearer {key}`
  - Tested: Yes / No

- [ ] **Airtable Schema Updated**
  - [ ] Leads table - 6 new fields added
  - [ ] SMS_Templates table created
  - [ ] Kajabi_Sync_Audit table created
  - [ ] Test record created in each table

- [ ] **Kajabi Webhook Configured**
  - Event type: `form.submitted`
  - Target URL: `https://rebelhq.app.n8n.cloud/webhook/kajabi-leads`
  - Status: Active
  - Test event sent: Yes / No

- [ ] **Development Environment Ready**
  - [ ] n8n workspace: `H4VRaaZhd8VKQANf` (Project workspace)
  - [ ] Airtable base: `app4wIsBfpJTg7pWS`
  - [ ] Test Slack channel: `#uysp-debug`
  - [ ] Backup taken of current workflows

---

## 🏗️ IMPLEMENTATION CHECKLIST

### Phase 1: Core Integration (Week 1)

#### Day 1: Schema & Setup
- [ ] **Airtable - Leads Table Updates**
  - [ ] Add field: `Kajabi Contact ID` (Text)
  - [ ] Add field: `Kajabi Tags` (Long Text)
  - [ ] Add field: `Campaign Assignment` (Single Select)
  - [ ] Add field: `Lead Source Detail` (Text)
  - [ ] Add field: `Kajabi Member Status` (Single Select: Prospect/Active/Trial/Churned)
  - [ ] Add field: `Kajabi Last Sync` (DateTime)
  - [ ] Update field: `Source` - Add option "Kajabi-Webhook"

- [ ] **Airtable - SMS_Templates Table Creation**
  - [ ] Create table: `SMS_Templates`
  - [ ] Add field: `Campaign ID` (Text, Primary Key)
  - [ ] Add field: `Campaign Name` (Text)
  - [ ] Add field: `Kajabi Tag Match` (Text)
  - [ ] Add field: `Sequence Position` (Number)
  - [ ] Add field: `Message Template` (Long Text)
  - [ ] Add field: `Active` (Checkbox)
  - [ ] Add field: `Created Date` (DateTime)

- [ ] **Airtable - Kajabi_Sync_Audit Table Creation**
  - [ ] Create table: `Kajabi_Sync_Audit`
  - [ ] Add field: `Kajabi Contact ID` (Text)
  - [ ] Add field: `Lead Email` (Email)
  - [ ] Add field: `Sync Timestamp` (DateTime)
  - [ ] Add field: `Duplicate Found` (Checkbox)
  - [ ] Add field: `Campaign Assigned` (Text)
  - [ ] Add field: `Tags Captured` (Long Text)
  - [ ] Add field: `Lead Record ID` (Text)
  - [ ] Add field: `Error Log` (Long Text)

- [ ] **Populate Initial Campaign Templates**
  - [ ] Campaign: `webinar_jb_2024` | Tag: "JB Webinar" | Message: [client to provide]
  - [ ] Campaign: `webinar_sales_2024` | Tag: "Sales Webinar" | Message: [client to provide]
  - [ ] Campaign: `default_nurture` | Tag: "*" | Message: [client to provide]

#### Day 2-3: Build n8n Workflow
- [ ] **Create Workflow: "UYSP-Kajabi-Realtime-Ingestion"**
  - [ ] Node 1: Webhook receiver (POST /webhook/kajabi-leads)
  - [ ] Node 2: Extract Contact ID (Code node)
  - [ ] Node 3: Kajabi API - Get Contact Details (HTTP Request)
  - [ ] Node 4: Smart Field Mapper - Kajabi Edition (Code node)
  - [ ] Node 5: Duplicate Check (Airtable Search)
  - [ ] Node 6: Route by Duplicate (IF node)
  - [ ] Node 7a: Update Existing Lead (Airtable Update) - TRUE path
  - [ ] Node 7b: Create New Lead (Airtable Create) - FALSE path
  - [ ] Node 8: Merge Paths (Code node)
  - [ ] Node 9: Log to Kajabi_Sync_Audit (Airtable Create)
  - [ ] Node 10: Success Notification (Slack - optional)

- [ ] **Node Configuration Details**
  - [ ] All Airtable nodes use credential: "Airtable UYSP Option C"
  - [ ] All HTTP nodes use credential: "Kajabi API"
  - [ ] All nodes have "Always Output Data" OFF (Settings tab)
  - [ ] Expression syntax uses spaces: `{{ $json.field }}`
  - [ ] Error handling: Continue on fail for API nodes

- [ ] **Workflow Settings**
  - [ ] Execution Order: v1
  - [ ] Save Execution Data: On Error
  - [ ] Timeout: 120 seconds

#### Day 4: Initial Testing
- [ ] **Manual Testing Setup**
  - [ ] Create Postman collection for test webhooks
  - [ ] Prepare 5 test payloads (new lead, duplicate, no tags, invalid email, API error)

- [ ] **Test Cases Executed**
  - [ ] Test 1: New lead with JB Webinar tag → Record created, campaign assigned
  - [ ] Test 2: Duplicate email → Record updated, duplicate_count incremented
  - [ ] Test 3: Lead with no tags → Default campaign assigned
  - [ ] Test 4: Invalid email format → Error logged, no record created
  - [ ] Test 5: Kajabi API timeout → Retry logic works, Slack alerted

- [ ] **Integration Validation**
  - [ ] Lead appears in Airtable Leads table
  - [ ] All fields mapped correctly
  - [ ] Clay picks up lead in queue (Processing Status = "Queued")
  - [ ] Kajabi_Sync_Audit log created
  - [ ] No execution errors in n8n

#### Day 5: Clay Integration Verification
- [ ] **End-to-End Test**
  - [ ] Send test lead through Kajabi form
  - [ ] Verify webhook captured in n8n (check execution)
  - [ ] Verify record in Airtable Leads table
  - [ ] Verify Clay starts enrichment (<5 min)
  - [ ] Verify enrichment completes and writes back to Airtable
  - [ ] Verify Processing Status changes to "Ready for SMS"

- [ ] **Error Handling Tests**
  - [ ] Test: Kajabi API returns 500 → Lead held, Slack alert sent
  - [ ] Test: Duplicate with different tag → Original campaign preserved or updated?
  - [ ] Test: Missing email → Logged, no Airtable record created
  - [ ] Test: Malformed webhook payload → Error caught, logged

### Phase 2: Campaign-Aware SMS (Week 2)

#### Day 1-2: Update SMS Scheduler
- [ ] **Modify Workflow: "UYSP-SMS-Scheduler-v2"**
  - [ ] Add node: "Get SMS Template" (Airtable Search)
    - Filter: `Campaign ID = {{campaign_assignment}}` AND `Sequence Position = {{sms_sequence_position}}` AND `Active = TRUE`
  - [ ] Add node: "Check Template Found" (IF node)
  - [ ] Add node: "Fallback to Default Template" (FALSE path)
  - [ ] Update node: "Prepare Message" - Use template from lookup
  - [ ] Update node: "Send SMS" - No changes needed

- [ ] **Template Variable Replacement**
  - [ ] Test: `{{first_name}}` replaced correctly
  - [ ] Test: `{{last_name}}` replaced correctly
  - [ ] Test: `{{title}}` replaced correctly
  - [ ] Test: `{{company}}` replaced correctly
  - [ ] Test: `{{calendly_link}}` replaced correctly

- [ ] **Campaign Logic Testing**
  - [ ] Lead with campaign "webinar_jb_2024" gets correct template
  - [ ] Lead with unrecognized campaign gets default template
  - [ ] Lead with no campaign gets default template
  - [ ] Sequence position 2 uses correct template (not position 1)

#### Day 3-4: End-to-End Campaign Testing
- [ ] **Full Flow Test - JB Webinar Campaign**
  - [ ] Create test lead with "JB Webinar" tag in Kajabi
  - [ ] Verify campaign_assignment = "webinar_jb_2024"
  - [ ] Verify lead enriched by Clay
  - [ ] Verify SMS template lookup finds correct template
  - [ ] Verify message sent with correct content
  - [ ] Verify SMS_Audit log created with campaign info

- [ ] **Full Flow Test - Sales Webinar Campaign**
  - [ ] Create test lead with "Sales Webinar" tag
  - [ ] Verify different message sent (not JB Webinar message)

- [ ] **Full Flow Test - Default Campaign**
  - [ ] Create test lead with unrecognized tag
  - [ ] Verify default template used

#### Day 5: Client Training & Handover
- [ ] **Create Campaign Management SOP**
  - [ ] Document: How to add new campaign in SMS_Templates
  - [ ] Document: How to update message template
  - [ ] Document: How to deactivate campaign
  - [ ] Screen recording: Adding a campaign (5 min video)

- [ ] **Train Client**
  - [ ] Walk through SMS_Templates table
  - [ ] Show how to add new campaign
  - [ ] Practice: Client adds test campaign
  - [ ] Review Kajabi_Sync_Audit for monitoring

### Phase 3: Production Rollout (Week 3)

#### Day 1-2: Soft Launch
- [ ] **Enable for Single Test Form**
  - [ ] Choose low-stakes form (e.g., newsletter signup)
  - [ ] Update Kajabi webhook for this form only
  - [ ] Monitor for 48 hours

- [ ] **Monitoring Checklist**
  - [ ] Check n8n executions every 4 hours
  - [ ] Review Kajabi_Sync_Audit for errors
  - [ ] Slack alerts configured and working
  - [ ] Compare Kajabi form count vs Airtable records (should match 100%)

#### Day 3-4: Full Rollout
- [ ] **Enable for All Kajabi Forms**
  - [ ] Update webhook configuration for all forms
  - [ ] Test one lead per form
  - [ ] Verify all forms flowing correctly

- [ ] **Create Monitoring Dashboard**
  - [ ] Airtable view: Kajabi leads from last 7 days
  - [ ] Airtable view: Duplicate leads (duplicate_count > 3)
  - [ ] Airtable view: Failed syncs (check Kajabi_Sync_Audit)
  - [ ] Slack alert: Daily summary of Kajabi leads captured

#### Day 5-7: Optimization & Documentation
- [ ] **Review & Optimize**
  - [ ] Review error logs - any patterns?
  - [ ] Optimize campaign assignment rules if needed
  - [ ] Fix any edge cases discovered

- [ ] **Documentation**
  - [ ] Create troubleshooting runbook
  - [ ] Document common issues and fixes
  - [ ] Create weekly report template (Google Sheet or Airtable)

- [ ] **Client Check-in**
  - [ ] Schedule 30-min review call
  - [ ] Review metrics: capture rate, campaign distribution, SMS results
  - [ ] Gather feedback for improvements
  - [ ] Discuss Phase 2 features (write-back, WhatsApp)

---

## 🎯 SUCCESS CRITERIA

### Must Pass Before Production
- [ ] 99% webhook capture rate (test with 100 leads)
- [ ] <10 second processing time (webhook to Airtable)
- [ ] 100% duplicate detection accuracy (manual audit of 50 duplicates)
- [ ] 100% campaign assignment accuracy (manual review of 20 leads)
- [ ] 0 execution failures for 48 hours
- [ ] Client can add new campaign without help

### Business Success Metrics (30 Days)
- [ ] Lead qualification rate >60% (ICP score >70)
- [ ] SMS delivery rate >97%
- [ ] Meeting book rate >5% of qualified Kajabi leads
- [ ] Client NPS score: 9 or 10 (enthusiastic)
- [ ] Zero "the system is broken" support tickets

---

## 🚨 ROLLBACK PLAN

### If Critical Issues Occur:
1. **Immediate**: Deactivate Kajabi webhook (stops new leads)
2. **Backup**: Revert to manual lead import if needed
3. **Debug**: Review last 10 executions in n8n for error patterns
4. **Fix**: Apply fix in test workflow first, then production
5. **Reactivate**: Only after 10 successful test executions

### Rollback Triggers:
- Execution failure rate >10% for 1 hour
- Duplicate explosion (>5 leads with duplicate_count >10)
- Clay enrichment stops working for Kajabi leads
- Client reports "leads are missing"
- SMS sending to wrong campaigns (>5% mismatch rate)

---

## 📞 SUPPORT & ESCALATION

### Tier 1: Self-Service (Client)
- Check Kajabi_Sync_Audit table for recent syncs
- Review Slack #uysp-debug channel for alerts
- Refer to troubleshooting runbook

### Tier 2: Gabriel Support
- Email: [gabriel email]
- Slack DM
- Response SLA: 4 hours business hours

### Tier 3: System Issues (Latif)
- For: n8n workflow errors, Airtable schema issues, Clay integration breaks
- Response SLA: 2 hours

---

## 📝 NOTES & DECISIONS LOG

### Decision 1: Email-Only Deduplication
**Date**: Oct 17, 2025  
**Decision**: Use email as primary deduplication key (not phone)  
**Rationale**: Kajabi allows duplicate emails, but this is how we merge records. Phone numbers less reliable (formatting, international, missing).  
**Owner**: Latif

### Decision 2: Campaign Assignment Priority
**Date**: Oct 17, 2025  
**Decision**: First matching tag wins (priority order: Webinars > Courses > Default)  
**Rationale**: Simplest logic, easy to understand. Can enhance later with multi-tag campaigns.  
**Owner**: Gabriel

### Decision 3: No Write-Back at Launch
**Date**: Oct 17, 2025  
**Decision**: Defer Kajabi write-back to Phase 2  
**Rationale**: Client (Ian) doesn't need it now. Adds complexity and risk. Focus on core flow first.  
**Owner**: Latif

### Decision 4: _________________
**Date**: __________  
**Decision**: __________________________  
**Rationale**: __________________________  
**Owner**: __________

---

**Last Updated**: October 17, 2025  
**Next Review**: October 21, 2025 (Kickoff call with Gabriel)

