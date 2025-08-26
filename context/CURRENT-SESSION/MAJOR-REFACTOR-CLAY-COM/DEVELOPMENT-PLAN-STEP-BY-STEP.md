# 🚀 **UYSP MAJOR REFACTOR - BULLETPROOF DEVELOPMENT PLAN**

**VERSION**: 1.0 FINAL  
**DATE**: August 21, 2025  
**STATUS**: AUTHORITATIVE - Follow Exactly  
**FOR**: AI Development Agents  

---

## ⚠️ **MANDATORY RULES FOR AI AGENTS**

1. **Follow this plan EXACTLY** - No creative interpretations
2. **Complete each phase fully before moving to next**
3. **Test every step** - Get evidence before proceeding
4. **Update status docs after each phase**
5. **If anything fails, STOP and report - don't improvise**

---

# **PHASE 0: INFRASTRUCTURE SETUP**

> NOTE (2025-08-21): Lead list (10k CSV) not yet available. Execute all pre-lead tasks below to completion. Defer any bulk dedup/enrichment that requires the list. Resume Phase 1/Phase 0 dedup immediately upon receipt.

## **Phase 0A: Airtable Setup (30 minutes)**

### **Step 0A.1: Create Companies Table**
```
1. Open Airtable base
2. Create new table "Companies"
3. Add EXACTLY these fields:
   - Domain (Primary field, Single line text)
   - Company Name (Single line text)
   - Industry (Single select)
   - Company Type (Single select: B2B SaaS, B2B Tech Services, Other B2B, B2C/Unknown)
   - Employee Count (Number)
   - Company Score Component (Number 0-25)
   - Last Enriched (Date)
   - Enrichment Provider (Single select: Apollo, Clearbit, PDL)
   - Enrichment Cost (Currency)

4. Create views:
   - All Companies (sort by Domain)
   - Needs Refresh (Last Enriched > 90 days ago)
   - High Value Companies (Company Score >= 20)
```

### **Step 0A.2: Create/Verify Leads Table**
```
1. Open existing Leads table (or create if missing)
2. Verify ALL these fields exist (create missing ones):

CORE FIELDS:
- Processing Status (Single select: Backlog, Queued, Processing, Ready for SMS, Complete, Failed)
- Source (Single select: Backlog, Webhook, Manual)
- Email (Email field)
- Phone (Phone field)
- First Name (Single line text)
- Last Name (Single line text)
- Job Title (Single line text)
- Company Domain (Single line text)
- Company (Link to Companies table)

ENRICHMENT FIELDS:
- Person Industry (Single line text)
- Job Level (Single select: Entry, Mid, Senior, Executive, C-Level)
- Location Country (Single line text)
- Location Confidence (Number 0-1)
- Enrichment Provider Used (Single line text)
- Enrichment Timestamp (Date & time)
- Raw Enrichment Data (Long text - JSON)

SCORING FIELDS:
- ICP Score (Number)
- Company Score Component (Number 0-25)
- Role Score Component (Number 0-45)
- Location Score Component (Number 0-20)
- Dynamic Signals Score (Number 0-10)
- Prime Fit Bonus (Checkbox)
- Score Reasoning (Long text)
- SMS Eligible (Checkbox)

SMS FIELDS:
- SMS Status (Single select: Not Sent, Queued, Sent, Delivered, Clicked, Replied, Meeting Booked)
- SMS Campaign ID (Single line text)
- SMS Sequence Position (Number)
- SMS Sent Count (Number)
- SMS Cost (Currency)
- Last SMS Sent (Date & time)

HRQ FIELDS:
- HRQ Status (Single select: None, Archive, Qualified, Manual Process)
- HRQ Reason (Single line text)
- Data Quality Score (Number 1-5)
- Validation Errors (Long text)

OBSERVABILITY FIELDS:
- Total Processing Cost (Currency)
- Error Log (Long text)
- Processing Duration (Number - seconds)
- Last Updated (Date & time)

3. Create views:
   - Batch Queue (Status = Backlog, sort by created time)
   - Processing Monitor (Status IN Queued,Processing, sort by Last Updated)
   - Human Review Queue (HRQ Status != None, sort by ICP Score desc)
   - SMS Pipeline (SMS Eligible = True AND SMS Status = Not Sent, sort by ICP Score desc)
   - Daily Stats Dashboard (group by created date)
   - Failed Processing (Status = Failed OR stuck processing)
```

**SUCCESS CRITERIA**: Both tables exist with all required fields and views

---

## **Phase 0B: n8n Workflow Setup (60 minutes)**

### **Step 0B.1: Create SMS Trigger Workflow**
```
1. Create new workflow: "UYSP-SMS-Trigger"
2. Add nodes EXACTLY as follows:

NODE 1: Airtable Trigger
- Type: n8n-nodes-base.airtable
- Operation: On Record Updated
- Base: [YOUR_BASE_ID]
- Table: Leads
- Trigger On: Records matching view
- View: SMS Pipeline
- Additional Options: Trigger on specific field changes = Processing Status

NODE 2: Delay 
- Type: n8n-nodes-base.wait
- Amount: 2
- Unit: seconds
- (Prevents race conditions)

NODE 3: Airtable Get Record
- Type: n8n-nodes-base.airtable  
- Operation: Get
- Base: [YOUR_BASE_ID]
- Table: Leads
- Record ID: ={{$json.id}}
- (Verify record still needs SMS)

NODE 4: IF Check Still Ready
- Type: n8n-nodes-base.if
- Condition: ={{$json.fields.SMS_Eligible}} equals true
- AND ={{$json.fields.SMS_Status}} equals "Not Sent"

NODE 5: HTTP Request (SimpleTexting)
- Type: n8n-nodes-base.httpRequest
- Method: POST
- URL: https://api-app2.simpletexting.com/v2/api/messages
- Authentication: Generic Credential Type → Header Auth (select your SimpleTexting credential)
- Headers:
  - Content-Type: application/json
- Body (single send):
```json
{
  "mode": "SINGLE",
  "accountPhone": "<your 10DLC digits e.g. 9094988474>",
  "contactPhone": "={{$json.fields.Phone.replace(/\D/g, '')}}",
  "text": "Hi {{$json.fields['First Name']}}, quick question about {{$json.fields['Company Domain']}} — 30s idea to increase booked meetings. Interested?"
}
```

NODE 6: Parse SMS Response
- Type: n8n-nodes-base.code
- Mode: Run Once for All Items
- JavaScript Code:
```javascript
const response = $input.first().json;
const httpStatusCode = $input.first().statusCode;

if (httpStatusCode !== 200) {
    return [{
        json: {
            sms_status: 'Failed',
            error_reason: `HTTP ${httpStatusCode}: ${response.message || 'Unknown error'}`,
            retry_needed: true,
            retry_count: 1
        }
    }];
}

if (response.status === 'partial_success' && response.failed_numbers) {
    return [{
        json: {
            sms_status: 'Partial Success',
            successful_count: response.successful_count || 0,
            failed_count: response.failed_numbers.length,
            failed_details: response.failed_numbers,
            retry_needed: true,
            campaign_id: response.campaign_id
        }
    }];
}

return [{
    json: {
        sms_status: 'Success',
        successful_count: response.total_sent || 1,
        failed_count: 0,
        campaign_id: response.campaign_id,
        estimated_cost: (response.total_sent || 1) * 0.01
    }
}];
```

NODE 7: Update Airtable Record
- Type: n8n-nodes-base.airtable
- Operation: Update
- Base: [YOUR_BASE_ID]
- Table: Leads
- Record ID: ={{$node["Airtable Get Record"].json.id}}
- Fields:
  - SMS Status: ={{$json.sms_status}}
  - SMS Campaign ID: ={{$json.campaign_id}}
  - SMS Cost: ={{$json.estimated_cost}}
  - Last SMS Sent: ={{$now}}
  - SMS Sent Count: ={{$node["Airtable Get Record"].json.fields.SMS_Sent_Count + 1}}

3. Connect nodes: Trigger → Delay → Get Record → IF → HTTP → Parse → Update
4. Set workflow to ACTIVE
```

### **Step 0B.2: Create Health Monitor Workflow**
```
1. Create new workflow: "UYSP-Health-Monitor"
2. Add nodes:

NODE 1: Schedule Trigger
- Type: n8n-nodes-base.cron
- Mode: Every 15 minutes
- Cron Expression: */15 * * * *

NODE 2: Query System Health
- Type: n8n-nodes-base.airtable
- Operation: Search (Return All=true)
- Base: [YOUR_BASE_ID]
- Table: Leads
- Options: Return All Records = true
- Filter By Formula: AND(DATETIME_DIFF(NOW(), {Last_Updated}, 'hours') > 2, {Processing_Status} = 'Processing')

NODE 3: Check Thresholds
- Type: n8n-nodes-base.code
- JavaScript Code:
```javascript
const records = $input.all();
const stuckProcessing = records.length;
const now = new Date();

// Define thresholds
const criticalIssues = [];

if (stuckProcessing > 100) {
    criticalIssues.push(`${stuckProcessing} leads stuck in Processing status > 2 hours`);
}

// Add more health checks here as needed

return [{
    json: {
        health_status: criticalIssues.length > 0 ? 'CRITICAL' : 'HEALTHY',
        issues: criticalIssues,
        stuck_processing_count: stuckProcessing,
        timestamp: now.toISOString()
    }
}];
```

NODE 4: IF Critical Issues
- Type: n8n-nodes-base.if
- Condition: ={{$json.health_status}} equals "CRITICAL"

NODE 5: Slack Alert
- Type: n8n-nodes-base.slack
- Resource: Send Message
- Channel: #sales-ops-alerts
- Message: 🚨 UYSP System Alert: {{$json.issues.join(', ')}}

3. Create DAILY reporting branch:

NODE 6: Schedule Trigger (Daily)
- Type: n8n-nodes-base.cron
- Mode: Custom
- Cron Expression: 0 9 * * * (9 AM daily)

NODE 7: Daily Stats Query
- Type: n8n-nodes-base.airtable
- Operation: Search (Return All=true)
- Base: [YOUR_BASE_ID]
- Table: Leads
- Filter By Formula: IS_AFTER({Created}, DATEADD(TODAY(), -1, 'day'))

NODE 8: Format Daily Report
- Type: n8n-nodes-base.code
- JavaScript Code:
```javascript
const records = $input.all();
const highValue = records.filter(r => r.json.fields.ICP_Score >= 70).length;
const smsEligible = records.filter(r => r.json.fields.SMS_Eligible === true).length;
const failed = records.filter(r => r.json.fields.Processing_Status === 'Failed').length;

const topCompanies = {};
records.forEach(r => {
    const domain = r.json.fields.Company_Domain;
    if (domain) topCompanies[domain] = (topCompanies[domain] || 0) + 1;
});

const topCompaniesList = Object.entries(topCompanies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain, count]) => `${domain} (${count})`)
    .join(', ');

const report = `🎯 Daily Lead Report - ${new Date().toDateString()}
├── Total Processed: ${records.length}
├── High-Value Leads: ${highValue} (Score ≥70)
├── SMS Eligible: ${smsEligible}
├── Failed Processing: ${failed}
└── Top Domains: ${topCompaniesList}`;

return [{ json: { report } }];
```

NODE 9: Send Daily Report
- Type: n8n-nodes-base.slack
- Channel: #sales-team
- Message: {{$json.report}}

4. Set workflow to ACTIVE
```

**SUCCESS CRITERIA**: Both workflows created, active, and tested

---

# **PHASE 1: CLAY SETUP (Apollo-only; minimal)**

## **Phase 1A: Clay Workspace Setup**
```
1. Log into Clay.com
2. Create new workspace: "UYSP - Refactor v2"
3. Create lists:
   - Raw Leads (email, first_name, last_name, phone, company, company_domain, source)
   - Companies To Enrich (company_domain unique, company_name, industry, employee_count, company_desc, enrichment_json)
   - Enriched Leads (optional)
4. Follow CLAY-SETUP-SHEET.md and CLAY-RUNBOOK-NONTECH.md for steps (normalize domain, filter personal, dedup by domain, enrich via Apollo, join back, writeback to Airtable)
```

**Note**: SKIP until lead list is ready. Do not attempt mock runs.

---

# **PRE-LEAD EXECUTION CHECKLIST (REQUIRED NOW)**

1) Realtime ingestion minimal flow verified (3 nodes) – keep active
2) Backlog ingestion workflow configured – ready for manual run when list arrives
3) Normalize adds `Company Domain` in both workflows (done 2025-08-21)
4) Implement and activate SMS Trigger workflow
5) Implement and activate Health Monitor + Daily Slack report
6) Configure credentials: Airtable PAT ok; add SimpleTexting + Slack
7) Update docs with evidence after each step (IDs, executions, records)

---

# **PHASE 2: INTEGRATION TESTING**

## **Phase 2A: Test Realtime Webhook**
```
1. Send test webhook:
curl -X POST [YOUR_WEBHOOK_URL] \
-H "Content-Type: application/json" \
-d '{"email":"test@stripe.com","first_name":"John","last_name":"Doe","phone":"+14155550123"}'

2. Verify in Airtable:
   - Record created in Leads table
   - Status = "Queued"
   - All fields populated correctly

3. Update status to test SMS trigger:
   - Change Processing Status to "Ready for SMS"
   - Set SMS Eligible to true
   - Verify SMS workflow triggers
```

## **Phase 2B: Test Backlog Processing**
```
1. Create small test CSV (5 rows)
2. Upload to backlog workflow
3. Verify all 5 records created in Airtable
```

**SUCCESS CRITERIA**: All workflows tested and working

---

# **STATUS UPDATES REQUIRED**

After completing each phase, update these files:

1. **memory_bank/active_context.md** - Add completion status
2. **context/CURRENT-SESSION/MAJOR-REFACTOR-CLAY-COM/SESSION-STATUS.md** - Update current phase
3. **memory_bank/progress.md** - Log completed phases

---

# **FAILURE HANDLING**

If any step fails:
1. **STOP immediately** - Don't proceed to next step
2. **Document exact error** - Copy error messages
3. **Report status** - Update user on what failed and why
4. **Wait for guidance** - Don't improvise fixes

---

# **COMPLETION CRITERIA**

System is ready when:
- ✅ All Airtable tables created with correct fields
- ✅ All n8n workflows created and active  
- ✅ Webhook test successful
- ✅ SMS trigger test successful
- ✅ Health monitoring working
- ✅ All status documents updated

**Only then proceed to actual lead processing.**

