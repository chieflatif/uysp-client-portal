# COMPREHENSIVE MONITORING & ERROR HANDLING RECOVERY PLAN
**Date:** Nov 4, 2025  
**Severity:** CRITICAL  
**Impact:** 100+ leads with corrupted data, zero monitoring coverage

---

## PHASE 1: IMMEDIATE DATA RECOVERY (NOW - 30 MIN)

### 1.1 Run Backfill Workflow
**Workflow:** `UYSP-Kajabi-Tags-BACKFILL-OneTime` (ID: 32tA1P0rVLTpwwiA)
**Status:** ✅ READY - Rate limiting added
**Action:** Manual execution required

**Steps:**
1. Go to: https://rebelhq.app.n8n.cloud/workflows/32tA1P0rVLTpwwiA
2. Click "Execute Workflow"
3. Monitor execution (expect 5-10 minutes for 100 leads)
4. Verify: Check Airtable for populated "Kajabi Tags"

**Expected Results:**
- ~100 leads updated
- "Kajabi Tags" populated
- "Engagement - Tag Count" updated
- "Kajabi Contact ID" populated

**Validation:**
```sql
SELECT COUNT(*) as fixed 
FROM leads 
WHERE kajabi_tags IS NOT NULL AND kajabi_tags != '';
```

---

## PHASE 2: CRITICAL WORKFLOW HARDENING (1-2 HOURS)

### 2.1 Fix Kajabi Polling Error Handling
**Workflow:** `UYSP-Kajabi-API-Polling` (ID: 0scB7vqk8QHp8s5b)
**Priority:** P0 - CRITICAL

**Changes Required:**

#### A. Remove Dangerous `continueRegularOutput`
**Nodes to Update:**
- `Fetch Kajabi Pages (Parallel)` → STOP on API errors
- `Get Kajabi Contact via Search` → RETRY with backoff
- `Parse Tags & Detect Client Status` → STOP on parse errors
- `UPSERT Lead (Protected)` → STOP on Airtable errors

#### B. Add Retry Logic
**Node:** `Fetch Kajabi Pages (Parallel)`
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 10000,
  "onError": "stopWorkflow"
}
```

**Node:** `Get Kajabi Contact via Search`
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 5000,
  "options": {
    "batching": {
      "batch": {
        "batchSize": 5,
        "batchInterval": 1000
      }
    }
  }
}
```

#### C. Add Rate Limit Detection
**New Node:** "Check for Rate Limit Errors" (Code node after Fetch Kajabi Pages)
```javascript
const items = $input.all();
const rateLimitErrors = items.filter(item => {
  const error = item.json.error;
  return error && (
    error.description?.includes('429') ||
    error.description?.includes('Too Many Requests')
  );
});

if (rateLimitErrors.length > 0) {
  throw new Error(`RATE LIMIT HIT: ${rateLimitErrors.length} requests blocked. Stopping workflow to prevent data corruption.`);
}

return items.filter(item => !item.json.error);
```

#### D. Add Pre-UPSERT Validation
**New Node:** "Validate Data Quality" (before UPSERT)
```javascript
const leads = $input.all();
const invalid = [];

for (const lead of leads) {
  const data = lead.json;
  
  // CRITICAL: Must have email
  if (!data.email || data.email.trim() === '') {
    invalid.push({ email: 'MISSING', reason: 'No email' });
    continue;
  }
  
  // CRITICAL: Must have Kajabi tags (if contact exists)
  if (!data.kajabi_tags && data.kajabi_contact_id) {
    invalid.push({ 
      email: data.email, 
      reason: 'Contact found but zero tags - potential API failure' 
    });
  }
  
  // WARNING: Missing form ID
  if (!data.form_id) {
    console.log(`WARNING: ${data.email} missing form_id`);
  }
}

if (invalid.length > 0) {
  throw new Error(`DATA QUALITY FAILURE: ${invalid.length} leads failed validation. Details: ${JSON.stringify(invalid.slice(0, 5))}`);
}

return leads;
```

**Estimated Time:** 45 minutes  
**Risk:** Medium (workflow changes)  
**Testing:** Run on test Airtable first

---

### 2.2 Fix Health Monitor Workflow
**Workflow:** `UYSP-Workflow-Health-Monitor-v2` (ID: MLnKXQYtfJDk9HXI)
**Priority:** P0 - CRITICAL

**Changes Required:**

#### A. Fix n8n API URL
```javascript
// WRONG:
const n8nApiUrl = 'https://n8n.bizlaunchlab.com/api/v1';

// CORRECT:
const n8nApiUrl = 'https://rebelhq.app.n8n.cloud/api/v1';
```

#### B. Fix Environment Variable Access
```javascript
// WRONG:
const n8nApiKey = $env.N8N_API_KEY;

// CORRECT:
const n8nApiKey = '{{$credentials.n8nApi.apiKey}}';
// OR use workflow environment variable
```

#### C. Add Historical Execution Analysis
**New Logic:**
```javascript
// Check last 30 executions for patterns
const recentExecs = executions.slice(0, 30);

// DETECT SILENT FAILURES:
// 1. Abnormally fast executions (<10 seconds for multi-step workflows)
const suspiciousFast = recentExecs.filter(e => {
  const duration = (new Date(e.stoppedAt) - new Date(e.startedAt)) / 1000;
  return duration < 10 && e.status === 'success';
});

// 2. Error patterns even in "success" executions
const hiddenErrors = recentExecs.filter(e => {
  // Need to fetch execution details to check for internal errors
  return e.status === 'success' && /* check execution data */;
});

if (suspiciousFast.length > 5) {
  status = 'Warning';
  notes += `${suspiciousFast.length} abnormally fast executions detected. `;
}
```

#### D. Add Data Quality Metrics
**New Node:** "Check Airtable Data Quality"
```javascript
// Query Leads table for empty Kajabi Tags
const emptyTagsFormula = "OR({Kajabi Tags} = BLANK(), LEN({Kajabi Tags}) = 0)";
const emptyTagsCount = /* Airtable query */;

// Query total leads synced in last 24h
const recentLeadsFormula = "IS_AFTER({Kajabi Last Sync}, DATEADD(NOW(), -1, 'day'))";
const recentLeadsCount = /* Airtable query */;

const emptyTagsPercent = (emptyTagsCount / recentLeadsCount) * 100;

if (emptyTagsPercent > 5) {
  // CRITICAL: >5% leads missing tags
  return {
    status: 'Error',
    message: `DATA CORRUPTION: ${emptyTagsCount} leads (${emptyTagsPercent}%) missing Kajabi Tags`,
    action_required: 'Run backfill workflow immediately'
  };
}
```

**Estimated Time:** 1 hour  
**Risk:** Low (monitoring only)  
**Testing:** Manual trigger first

---

## PHASE 3: NEW MONITORING LAYER (2-3 HOURS)

### 3.1 Create Data Quality Monitor
**New Workflow:** `UYSP-Data-Quality-Monitor`
**Trigger:** Every 1 hour
**Priority:** P1 - HIGH

**Checks:**
1. **Empty Kajabi Tags** (should be <1%)
2. **Missing Form IDs** (should be 0%)
3. **Invalid Phone Formats** (should be <5%)
4. **Duplicate Emails** (should be 0)
5. **Engagement Score Anomalies** (tag_count=0 but engagement=Green)

**Alert Thresholds:**
- Error: >5% data quality issues
- Warning: >1% data quality issues
- Info: Daily summary

**Outputs:**
- Airtable: Data Quality Dashboard
- Slack: Alerts to #uysp-monitoring
- Email: Daily digest

---

### 3.2 Create API Health Monitor
**New Workflow:** `UYSP-API-Health-Monitor`
**Trigger:** Every 5 minutes
**Priority:** P1 - HIGH

**Checks:**
1. **Kajabi API Status** (test endpoint)
2. **Airtable API Status** (test query)
3. **Rate Limit Headers** (track usage %)
4. **Response Times** (baseline performance)

**Alert on:**
- Rate limit >80% of quota
- API errors in last 3 requests
- Response time >5 seconds

---

### 3.3 Enhance Execution Pattern Detection
**Add to Health Monitor:**

**Anomaly Detection:**
```javascript
const patterns = {
  // Normal: 3-13 minutes for Kajabi polling
  normalDuration: { min: 180, max: 780 },
  
  // Detect rate limit pattern
  suspiciousFastSuccess: execution => {
    return execution.status === 'success' && 
           execution.duration < 10000; // <10 sec
  },
  
  // Detect partial failures
  inconsistentItemCounts: execution => {
    const inputItems = execution.nodes['Parse All Submissions']?.itemsOutput || 0;
    const outputItems = execution.nodes['UPSERT Lead (Protected)']?.itemsOutput || 0;
    return inputItems > 0 && outputItems === 0;
  },
  
  // Detect API errors even in "success"
  containsAPIErrors: execution => {
    // Check each node for error objects in output
    return Object.values(execution.nodes).some(node => 
      node.data?.output?.some(output => 
        output.some(item => item.json.error)
      )
    );
  }
};
```

---

## PHASE 4: GOVERNANCE & SOPs (1 HOUR)

### 4.1 Create Missing SOPs
**File:** `knowledge/governance/n8n-monitoring-sops.md`

**SOPs to Create:**

#### SOP§8.1: API Rate Limit Response
- Detection criteria (HTTP 429, rate limit headers)
- Immediate actions (stop workflow, delay retry)
- Escalation (Slack alert, backfill trigger)
- Prevention (request batching, quota monitoring)

#### SOP§8.2: Data Quality Gates
- Pre-UPSERT validation requirements
- Mandatory fields by table
- Data quality thresholds
- Audit trail requirements

#### SOP§8.3: Silent Failure Detection
- Execution duration baselines by workflow
- Item count consistency checks
- Error object detection in "success" executions
- Historical pattern analysis

#### SOP§8.4: Backfill Procedures
- When to trigger backfill
- How to identify affected records
- Validation before/after
- Rollback procedures

#### SOP§8.5: Incident Response
- Alert triage (Critical/Warning/Info)
- Escalation paths
- Communication templates
- Post-incident review requirements

---

### 4.2 Update Workflow Documentation
**File:** `COMPLETE-DEPENDENCY-MATRIX.md`

**Add:**
- Error handling patterns by workflow
- Expected execution times
- Data quality requirements
- Monitoring coverage matrix

---

## PHASE 5: TESTING & VALIDATION (1 HOUR)

### 5.1 Test Kajabi Polling with Errors
**Scenarios:**
1. Simulate API rate limit → Should STOP workflow
2. Missing tags in response → Should flag for review
3. Invalid email format → Should skip lead
4. Airtable UPSERT failure → Should STOP workflow

### 5.2 Test Health Monitor Detection
**Scenarios:**
1. Manually trigger fast execution → Should detect anomaly
2. Create lead with empty tags → Should trigger alert
3. Introduce API error → Should alert within 15 min

### 5.3 Test Data Quality Monitor
**Scenarios:**
1. Create 10 leads without tags → Should alert
2. Create duplicate email → Should detect
3. Invalid phone format → Should flag

---

## PHASE 6: DEPLOYMENT (30 MIN)

### 6.1 Workflow Updates
1. Backup all workflows (use version control)
2. Update Kajabi Polling workflow
3. Update Health Monitor workflow
4. Deploy new Data Quality Monitor
5. Deploy new API Health Monitor

### 6.2 Monitoring Dashboard
**Create Airtable View:** "Monitoring Dashboard"
- Workflow health status
- Data quality metrics
- API performance metrics
- Recent alerts

### 6.3 Alert Configuration
**Slack Channel:** #uysp-monitoring
- Critical: Immediate @ mention
- Warning: Hourly digest
- Info: Daily summary

---

## PHASE 7: POST-DEPLOYMENT VALIDATION (30 MIN)

### 7.1 Verify Backfill Completed
- Check Airtable: All leads have tags
- Check portal: Engagement scores updated
- Verify: No empty tag fields remain

### 7.2 Verify Monitoring Active
- Health Monitor running every 15 min
- Data Quality Monitor running hourly
- Alerts flowing to Slack
- Airtable dashboard updating

### 7.3 Trigger Test Failures
- Temporarily disable Kajabi API
- Confirm: Health Monitor detects within 15 min
- Confirm: Slack alert received
- Confirm: Workflow stopped (no data corruption)

---

## METRICS & SUCCESS CRITERIA

### Data Quality
- **Target:** 0% leads with empty Kajabi Tags
- **Threshold:** <1% acceptable (new leads only)
- **Alert:** >1% triggers warning, >5% triggers critical

### Monitoring Coverage
- **Target:** 100% critical workflows monitored
- **Check Frequency:** Every 15 minutes
- **Alert Latency:** <15 minutes from failure

### Error Detection
- **Target:** 100% silent failures detected
- **False Positive Rate:** <5%
- **Backfill Trigger:** Automatic on detection

### Incident Response
- **Detection to Alert:** <15 minutes
- **Alert to Action:** <30 minutes
- **Recovery to Validation:** <1 hour

---

## TIMELINE

| Phase | Duration | Status | Owner |
|-------|----------|--------|-------|
| Phase 1: Backfill | 30 min | ⏳ READY | USER (manual trigger) |
| Phase 2: Workflow Fixes | 2 hours | 🔧 PLANNED | AI Agent |
| Phase 3: New Monitors | 3 hours | 📋 PLANNED | AI Agent |
| Phase 4: Governance | 1 hour | 📝 PLANNED | AI Agent |
| Phase 5: Testing | 1 hour | 🧪 PLANNED | AI Agent |
| Phase 6: Deployment | 30 min | 🚀 PLANNED | AI Agent |
| Phase 7: Validation | 30 min | ✅ PLANNED | USER + AI Agent |

**Total Estimated Time:** 8-9 hours

---

## RISK MITIGATION

### High Risk Actions
1. **Modifying active Kajabi Polling workflow**
   - Mitigation: Create backup version first
   - Mitigation: Test on inactive copy
   - Mitigation: Deploy during low-traffic hours

2. **Backfill running during active polling**
   - Mitigation: Rate limiting (1 req/2 sec)
   - Mitigation: Monitor Kajabi API quota
   - Mitigation: Pause if rate limit hit

3. **New monitors generating false alerts**
   - Mitigation: Set conservative thresholds initially
   - Mitigation: Test all alert paths
   - Mitigation: Phased rollout (test → staging → prod)

### Rollback Plan
**If anything fails:**
1. Restore workflow from backup version
2. Disable new monitors
3. Run data validation queries
4. Manual review of affected records

---

## LONG-TERM PREVENTION

### 1. Circuit Breaker Pattern
- Track API error rates
- Auto-pause workflow if >10% errors
- Auto-resume after cooldown period

### 2. Data Quality Scoring
- Track data completeness %
- Track field population rates
- Trend analysis for degradation

### 3. Proactive Rate Limit Management
- Monitor Kajabi API quota usage
- Predict rate limit timing
- Schedule polling to avoid limits

### 4. Automated Recovery
- Auto-trigger backfill on quality drop
- Auto-adjust polling frequency
- Auto-scaling batch sizes

---

## DEPENDENCIES

### Required Credentials
- ✅ Airtable API (Zir5IhIPeSQs72LR)
- ✅ Kajabi OAuth2 (8ptvvz2OxejUnrK6)
- ✅ Slack OAuth2 (OyxQzoqNPQocHdnn)
- ❓ n8n API Key (needs configuration)

### Required Tables
- ✅ Leads (tblYUvhGADerbD8EO)
- ✅ Settings (tblErXnFNMKYhh3Xr)
- ✅ Campaigns (tblnIn8c1spOrImuz)
- ❓ Workflow Health (tblTeZVJ2eJ9BBN1b) - verify exists

### Required Integrations
- ✅ Kajabi API
- ✅ Airtable API
- ✅ Slack webhooks
- ❓ n8n API (needs setup)

---

## APPROVAL GATES

### Phase 1 (Backfill)
- ✅ Workflow validated
- ✅ Rate limiting added
- ⏳ **USER APPROVAL REQUIRED TO RUN**

### Phase 2 (Workflow Fixes)
- 🔧 Changes drafted
- ⏳ USER REVIEW REQUIRED
- ⏳ Backup confirmation required
- ⏳ Deploy approval required

### Phase 3-7
- 📋 Plan documented
- ⏳ USER APPROVAL FOR FULL EXECUTION

---

## EVIDENCE COLLECTION

### Captured
- ✅ Execution logs (23873, 24076)
- ✅ API error responses (HTTP 429)
- ✅ Airtable data (100 leads without tags)
- ✅ Health monitor failures

### Required
- ⏳ Complete execution history (Nov 1-4)
- ⏳ Rate limit frequency analysis
- ⏳ Data quality baseline
- ⏳ Monitoring coverage gaps

---

## NEXT IMMEDIATE ACTION

**YOU MUST:**
1. Go to n8n: https://rebelhq.app.n8n.cloud/workflows/32tA1P0rVLTpwwiA
2. Click "Execute Workflow" on backfill
3. Reply "BACKFILL RUNNING" so I can proceed with Phase 2

**THEN I WILL:**
1. Fix Kajabi Polling error handling
2. Fix Health Monitor
3. Build new Data Quality Monitor
4. Create missing SOPs
5. Test everything
6. Deploy with validation

