# Kajabi Integration - Quick Start Guide
**For**: Developers starting the build  
**Prerequisites**: Read Executive Summary first  
**Time to Build**: 8-10 hours over 3 weeks

---

## 🚀 START HERE

### What You're Building
A real-time integration that captures Kajabi form submissions → enriches leads → sends campaign-specific SMS.

### What You Have
- ✅ Full technical spec (48 pages)
- ✅ Day-by-day build plan (3 weeks)
- ✅ Test cases and validation criteria
- ✅ Airtable schema definitions
- ✅ n8n workflow specifications

### What You Need
- ⏳ Kajabi API credentials (get from client)
- ⏳ List of tags and campaign mappings (get from client)
- ⏳ Message templates for each campaign (get from client)

---

## 📋 PRE-BUILD CHECKLIST (15 minutes)

### Information Gathering
```bash
# From client (Ian):
- [ ] Kajabi API key: _______________________
- [ ] Kajabi site ID: _______________________
- [ ] List of forms: _______________________
- [ ] Tag → Campaign mapping:
      "JB Webinar" → webinar_jb_2024
      "Sales Webinar" → webinar_sales_2024
      [Add more as needed]
```

### Environment Setup
```bash
# Verify access:
- [ ] n8n Cloud: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf
- [ ] Airtable Base: app4wIsBfpJTg7pWS
- [ ] Slack channel: #uysp-debug

# Backup current state:
- [ ] Export all workflows → save to workflows/backups/pre-kajabi-[date].json
- [ ] Airtable schema snapshot → save to data/schemas/pre-kajabi-schema-[date].json
```

---

## 🔧 BUILD SEQUENCE (8-10 hours)

### STEP 1: Airtable Schema (30 minutes)

**1.1 Update Leads Table**
```
Navigate to: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO

Add these fields:
┌─────────────────────────┬──────────────────┬────────────────────────────┐
│ Field Name              │ Type             │ Notes                      │
├─────────────────────────┼──────────────────┼────────────────────────────┤
│ Kajabi Contact ID       │ Text             │ Unique ID from Kajabi      │
│ Kajabi Tags             │ Long Text        │ JSON array of tags         │
│ Campaign Assignment     │ Single Select    │ Options: webinar_jb_2024,  │
│                         │                  │ webinar_sales_2024,        │
│                         │                  │ default_nurture            │
│ Lead Source Detail      │ Text             │ Human-readable source      │
│ Kajabi Member Status    │ Single Select    │ Options: Prospect, Active, │
│                         │                  │ Trial, Churned             │
│ Kajabi Last Sync        │ DateTime         │ When last synced           │
└─────────────────────────┴──────────────────┴────────────────────────────┘

Update existing field:
- Source: Add option "Kajabi-Webhook"
```

**1.2 Create SMS_Templates Table**
```
Create new table: SMS_Templates

Fields:
┌─────────────────────────┬──────────────────┬────────────────────────────┐
│ Field Name              │ Type             │ Configuration              │
├─────────────────────────┼──────────────────┼────────────────────────────┤
│ Campaign ID             │ Text             │ Primary field              │
│ Campaign Name           │ Text             │                            │
│ Kajabi Tag Match        │ Text             │ Tag to match               │
│ Sequence Position       │ Number           │ Integer, 1-10              │
│ Message Template        │ Long Text        │ Supports {{variables}}     │
│ Active                  │ Checkbox         │ Default: checked           │
│ Created Date            │ DateTime         │ Auto-created               │
└─────────────────────────┴──────────────────┴────────────────────────────┘

Add initial records:
1. Campaign ID: webinar_jb_2024
   Kajabi Tag Match: JB Webinar
   Sequence Position: 1
   Message Template: [Get from client]
   Active: ✓

2. Campaign ID: default_nurture
   Kajabi Tag Match: *
   Sequence Position: 1
   Message Template: [Get from client]
   Active: ✓
```

**1.3 Create Kajabi_Sync_Audit Table**
```
Create new table: Kajabi_Sync_Audit

Fields:
┌─────────────────────────┬──────────────────┬────────────────────────────┐
│ Field Name              │ Type             │ Configuration              │
├─────────────────────────┼──────────────────┼────────────────────────────┤
│ Kajabi Contact ID       │ Text             │                            │
│ Lead Email              │ Email            │                            │
│ Sync Timestamp          │ DateTime         │ Auto-created               │
│ Duplicate Found         │ Checkbox         │                            │
│ Campaign Assigned       │ Text             │                            │
│ Tags Captured           │ Long Text        │ Raw JSON                   │
│ Lead Record ID          │ Text             │ Link to Leads              │
│ Error Log               │ Long Text        │ If errors occurred         │
└─────────────────────────┴──────────────────┴────────────────────────────┘
```

**Done-when**: All 3 tables created, test records added

---

### STEP 2: n8n Credential Setup (10 minutes)

**2.1 Create Kajabi API Credential**
```
Navigate: n8n Cloud → Credentials → Add Credential

Type: HTTP Header Auth
Name: Kajabi API
Header Name: Authorization
Header Value: Bearer [PASTE API KEY FROM CLIENT]

Test: Save and verify no errors
```

**Done-when**: Credential saved, test call succeeds

---

### STEP 3: Build n8n Workflow (4 hours)

**3.1 Create New Workflow**
```
Name: UYSP-Kajabi-Realtime-Ingestion
Description: Captures leads from Kajabi forms and routes to Airtable
Status: Inactive (until testing complete)
```

**3.2 Add Nodes (Copy from spec for full config)**

```javascript
// Node 1: Webhook
Type: Webhook (POST)
Path: kajabi-leads
Settings:
  - Response Code: 200
  - Response Mode: onReceived
  
// Node 2: Extract Contact ID
Type: Code
Code: [See full spec - line 142]

// Node 3: Kajabi API - Get Contact
Type: HTTP Request
Method: GET
URL: https://api.kajabi.com/v1/contacts/{{ $json.kajabi_contact_id }}
Auth: Use "Kajabi API" credential
Options: Retry 3x, 2s between

// Node 4: Smart Field Mapper
Type: Code
Code: [See full spec - line 223]
Key function: Extract tags, determine campaign, normalize fields

// Node 5: Duplicate Check
Type: Airtable (Search)
Operation: Search
Table: Leads
Filter: {Email} = "{{ $json.email }}"

// Node 6: Route by Duplicate
Type: IF
Condition: {{ $json.id }} (checks if search found record)

// Node 7a: Update Existing (TRUE path)
Type: Airtable (Update)
Fields: [See full spec - line 550]
⚠️ Important: Do NOT overwrite enrichment data

// Node 7b: Create New (FALSE path)
Type: Airtable (Create)
Fields: [See full spec - line 566]
✅ Map all fields from Smart Field Mapper

// Node 8: Merge Paths
Type: Code (pass-through)

// Node 9: Log to Audit
Type: Airtable (Create)
Table: Kajabi_Sync_Audit

// Node 10: Slack Notification (optional)
Type: Slack
Channel: #uysp-debug
Message: "✅ Kajabi lead captured: {{ $json.email }}"
```

**3.3 Critical Gotchas**
```
☑️ All Airtable nodes: Use credential "Airtable UYSP Option C"
☑️ All expressions: Space syntax {{ $json.field }}
☑️ Settings tab: "Always Output Data" = OFF
☑️ Error handling: HTTP nodes set to "Continue on fail"
☑️ Execution order: v1 (in workflow settings)
```

**Done-when**: Workflow builds without errors, ready for testing

---

### STEP 4: Testing (2 hours)

**4.1 Manual Test Setup**
```bash
# Create Postman collection or use curl

# Test 1: New lead with tag
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '{
    "relationships": {
      "contact": {
        "data": {
          "id": "REAL_CONTACT_ID_FROM_KAJABI"
        }
      }
    }
  }'

# Expected: 
- n8n execution completes
- Airtable record created in Leads table
- All fields mapped correctly
- Kajabi_Sync_Audit log created
```

**4.2 Test Cases**
```
☑️ Test 1: New lead, JB Webinar tag → Campaign assigned correctly
☑️ Test 2: Duplicate email → Existing record updated, not duplicated
☑️ Test 3: No tags → Default campaign assigned
☑️ Test 4: Invalid email → Error logged, no record created
☑️ Test 5: API timeout → Retries work, eventual success or Slack alert
```

**Done-when**: 5/5 test cases pass

---

### STEP 5: Clay Integration Verification (1 hour)

**5.1 End-to-End Test**
```
1. Send test lead through real Kajabi form
2. Verify n8n execution completes (check executions tab)
3. Check Airtable Leads table:
   - Record exists
   - Processing Status = "Queued"
   - All fields populated
4. Wait <5 minutes
5. Verify Clay picks up lead:
   - Check Clay dashboard for activity
   - OR watch Airtable for Enrichment Outcome to populate
6. Verify Processing Status changes to "Ready for SMS"
```

**Done-when**: Lead flows Kajabi → n8n → Airtable → Clay → Back to Airtable

---

### STEP 6: Update SMS Scheduler (2 hours)

**6.1 Modify Existing Workflow**
```
Workflow: UYSP-SMS-Scheduler-v2 (ID: UAZWVFzMrJaVbvGM)

Insert NEW nodes after "Get Leads Due for SMS":

// New Node A: Get SMS Template
Type: Airtable (Search)
Table: SMS_Templates
Filter: AND(
  {Campaign ID} = "{{ $json.campaign_assignment }}",
  {Sequence Position} = {{ $json.sms_sequence_position || 1 }},
  {Active} = TRUE()
)

// New Node B: Check Template Found
Type: IF
Condition: {{ $json.id }} (template found?)
TRUE → Use template
FALSE → Get default template

// New Node C: Fallback to Default
Type: Airtable (Search)
Table: SMS_Templates
Filter: {Campaign ID} = "default_nurture"

// Update existing "Prepare Message" node:
Change template source from Settings table to:
{{ $json.fields['Message Template'] }}

Variables to replace:
- {{first_name}} → $json.first_name
- {{last_name}} → $json.last_name
- {{title}} → $json.title
- {{company}} → $json.company_enriched || $json.company
- {{calendly_link}} → $json.calendly_link or hardcoded URL
```

**Done-when**: Scheduler looks up templates by campaign, sends correct message

---

### STEP 7: Campaign Testing (1 hour)

**7.1 Full Flow Tests**
```
☑️ Test A: Lead with "JB Webinar" tag
   - Enters webinar_jb_2024 campaign
   - Gets JB Webinar message (not default)
   
☑️ Test B: Lead with "Sales Webinar" tag
   - Enters webinar_sales_2024 campaign
   - Gets Sales Webinar message (different from JB)
   
☑️ Test C: Lead with unrecognized tag
   - Enters default_nurture campaign
   - Gets generic message
   
☑️ Test D: Multiple campaigns
   - Lead 1 with JB tag → JB message
   - Lead 2 with Sales tag → Sales message
   - Verify no cross-contamination
```

**Done-when**: Campaign logic works 100% accurately

---

## ✅ LAUNCH CHECKLIST

### Before Production
```
☑️ All test cases pass (10/10 tests)
☑️ No execution failures for 48 hours
☑️ Duplicate detection 100% accurate (manual audit of 20 duplicates)
☑️ Campaign assignment 100% accurate (manual review of 20 leads)
☑️ Client can add new campaign in Airtable without help
☑️ Monitoring alerts configured (Slack #uysp-debug)
☑️ Runbook created for troubleshooting
☑️ Backup workflows saved
```

### Production Rollout
```
Week 3, Day 1-2: Soft Launch
☑️ Enable for 1 low-risk form only
☑️ Monitor for 48 hours
☑️ Verify 99%+ success rate

Week 3, Day 3-4: Full Rollout
☑️ Enable webhook for all Kajabi forms
☑️ Test one lead per form
☑️ Monitor for anomalies

Week 3, Day 5-7: Optimization
☑️ Review error logs
☑️ Optimize campaign rules if needed
☑️ Client check-in call
```

---

## 🚨 TROUBLESHOOTING

### Common Issues

**Issue 1: Webhook not receiving data**
```
Check:
- Kajabi webhook configuration (correct URL?)
- n8n webhook is active (not paused?)
- Test mode vs production mode in Kajabi

Fix:
- Verify webhook URL matches n8n path exactly
- Check Kajabi webhook history for delivery failures
```

**Issue 2: Kajabi API returns 401**
```
Check:
- API credential in n8n (correct key?)
- Kajabi plan has API access?

Fix:
- Regenerate API key in Kajabi
- Update credential in n8n
```

**Issue 3: Duplicates being created**
```
Check:
- Email field populated from webhook?
- Airtable search node configured correctly?
- Filter formula syntax correct?

Fix:
- Debug Smart Field Mapper output
- Verify email normalization working
- Check Airtable search results
```

**Issue 4: Wrong campaign assigned**
```
Check:
- Tags being captured from API response?
- Tag matching logic case-sensitive?
- Priority order correct?

Fix:
- Log raw tags to audit table
- Use case-insensitive matching
- Review campaign assignment code
```

---

## 📞 SUPPORT RESOURCES

### Documentation
- Full Spec: `docs/architecture/KAJABI-INTEGRATION-SPEC.md`
- Executive Summary: `docs/architecture/KAJABI-INTEGRATION-SUMMARY.md`
- Action Checklist: `context/CURRENT-SESSION/KAJABI-INTEGRATION-ACTION-CHECKLIST.md`
- Transcript Analysis: `context/CURRENT-SESSION/KAJABI-TRANSCRIPT-ANALYSIS.md`

### Platform Documentation
- Kajabi API: https://developers.kajabi.com/reference/getting-started
- n8n Nodes: https://docs.n8n.io/integrations/builtin/app-nodes/
- Airtable API: https://airtable.com/developers/web/api/introduction

### Team
- Technical Lead: Gabriel Neuman
- Product Owner: Latif Horst
- Slack: #uysp-debug

---

## 🎯 QUICK REFERENCE

### Kajabi API Endpoints
```
GET /v1/contacts/{id}
POST /v1/contacts/{email}/tags
```

### n8n Expression Syntax
```javascript
// Correct:
{{ $json.field }}
{{ $json.nested?.field || 'default' }}

// Wrong:
{{$json.field}}  // Missing spaces
$json.field  // Missing brackets
```

### Airtable Field Names
```
Critical fields:
- email (dedup key)
- kajabi_contact_id (for sync)
- campaign_assignment (for SMS routing)
- processing_status (for Clay queue)
```

### Campaign Priority Order
```
1. Webinar tags (highest priority)
2. Course tags
3. Newsletter tags
4. Default (catch-all)
```

---

## 🎉 SUCCESS INDICATORS

### You're Done When:
✅ Kajabi form submission → Airtable record in <10 seconds  
✅ 100% duplicate detection accuracy  
✅ Campaign assignment works 100% of time  
✅ Clay enrichment happens automatically  
✅ SMS sends campaign-specific message  
✅ Client can manage campaigns independently  
✅ Zero execution failures for 7 days  
✅ Ian says "this just works"

---

## 📊 ESTIMATED TIME BREAKDOWN

```
Pre-build setup:        30 min   │ ████
Airtable schema:        30 min   │ ████
n8n workflow build:     4 hours  │ ████████████████████████████████
Testing:                2 hours  │ ████████████████
Clay integration:       1 hour   │ ████████
SMS scheduler update:   2 hours  │ ████████████████
Campaign testing:       1 hour   │ ████████
                        ─────────
Total:                  10.5 hrs │ 100%
```

---

## 💡 PRO TIPS

1. **Start with hardcoded campaign mapping** - Faster to build, easier to debug
2. **Log everything to audit table** - You'll thank yourself later
3. **Test with real Kajabi data** - Mock data hides edge cases
4. **Use test form first** - Don't go all-in on day 1
5. **Monitor Slack channel** - Catch errors before client does
6. **Document as you go** - Future you will appreciate it
7. **Client training is critical** - They need to manage campaigns themselves

---

**Ready to build?** Start with Step 1 (Airtable Schema) and work through sequentially!

**Questions?** Check the full spec or ask for help in #uysp-debug

---

*Last Updated: October 17, 2025*  
*Version: 1.0*  
*Status: Ready for Build*

