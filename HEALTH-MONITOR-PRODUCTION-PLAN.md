# 🏗️ PRODUCTION-GRADE HEALTH MONITOR: COMPREHENSIVE REBUILD PLAN

**Status**: 🔴 DESIGN PHASE  
**Approach**: Complete rebuild with proven patterns from existing workflows  
**Target**: 100% production-ready with zero shortcuts

---

## 📚 LESSONS LEARNED FROM EXISTING WORKFLOWS

### Pattern 1: UYSP-Daily-Monitoring (PROVEN WORKING)
**Architecture**: Sequential Airtable queries → Single Code node aggregation → Slack output

```
Trigger → Query 1 → Query 2 → ... → Query N → Build Summary (Code) → Slack
```

**Key Insights**:
1. ✅ Each query returns its own data
2. ✅ Code node uses `$items('NodeName', 0)` to reference EACH query independently
3. ✅ NO complex loops or data flow merging
4. ✅ Simple linear chain

**Why This Works**:
- n8n passes ALL previous node outputs to next node
- Code node can reference any previous node by name
- No loop execution issues
- Easy to debug

### Pattern 2: UYSP-Engagement-Score-Calculator (PROVEN WORKING)
**Architecture**: Trigger → Get Record → Calculate → Update

```
Airtable Trigger → Get Full Record → Code (Calculate) → Update Airtable
```

**Key Insights**:
1. ✅ Trigger fires once per record update
2. ✅ Get full record ensures all fields available
3. ✅ Code node runs `runOnceForEachItem` (single record)
4. ✅ Update uses record ID from calculation

### Pattern 3: Code Node Best Practices
**From Troubleshooting Docs**:

```javascript
// ✅ CORRECT - Reference previous node outputs
const workflows = $items('List Workflows', 0) || [];
const executions = $items('Get Executions', 0) || [];

// Process each workflow
const results = [];
for (const wf of workflows) {
  const wfId = wf.json.id;
  const wfExecs = executions.filter(e => e.json.workflowId === wfId);
  // Calculate metrics
  results.push({ json: {...} });
}
return results;
```

---

## 🎯 PRODUCTION DESIGN: THE RIGHT WAY

### Architecture: Parallel Query + Aggregation Pattern

```
Manual Trigger ─────────────────────┐
                                     ├→ List All Workflows
Schedule Trigger (15min) ───────────┘         ↓
                                    Code: Query ALL Workflow Executions
                                    (Single node, n8n API calls inside)
                                              ↓
                                    Code: Calculate ALL Health Metrics
                                    (Processes all workflows)
                                              ↓
                                    Split into Multiple Items
                                    (One item per workflow)
                                              ↓
                                    Update Airtable (Loop Mode)
                                    (Upsert each workflow's health data)
                                              ↓
                                    Code: Build Summary
                                    (Aggregate stats, identify issues)
                                              ↓
                                    Filter: Has Critical Issues?
                                          ↙           ↘
                                    Yes: Slack        No: End
```

### Why This Design Works

1. **No Complex Data Flow**: Linear chain, no merging needed
2. **Single Source of Truth**: One code node fetches ALL execution data
3. **Proper Loop Handling**: Split into items BEFORE Airtable update
4. **Efficient**: Only ONE pass through workflows
5. **Debuggable**: Each step has clear input/output
6. **Error-Resilient**: Can add error handling at each stage

---

## 📋 DETAILED NODE SPECIFICATIONS

### Node 1: Manual Trigger
```json
{
  "type": "n8n-nodes-base.manualTrigger",
  "typeVersion": 1,
  "parameters": {}
}
```
**Purpose**: Manual testing
**Output**: Empty trigger signal

---

### Node 2: Schedule Trigger (Every 15 Min)
```json
{
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "parameters": {
    "rule": {
      "interval": [{"field": "minutes", "minutesInterval": 15}]
    }
  }
}
```
**Purpose**: Auto-run every 15 minutes
**Output**: Empty trigger signal

---

### Node 3: Code - Fetch All Workflow Health Data
**Type**: `n8n-nodes-base.code`
**Mode**: `runOnceForAllItems`
**Purpose**: Query n8n API for workflows + executions, calculate metrics

**Complete Code**:
```javascript
// ════════════════════════════════════════════════════════════════
// HEALTH MONITOR: Complete Data Fetch & Calculation
// ════════════════════════════════════════════════════════════════

// n8n API credentials from environment
const n8nApiUrl = 'https://n8n.bizlaunchlab.com/api/v1';
const n8nApiKey = $env.N8N_API_KEY;

if (!n8nApiKey) {
  throw new Error('N8N_API_KEY environment variable not set');
}

const headers = {
  'X-N8N-API-KEY': n8nApiKey,
  'Content-Type': 'application/json'
};

// ────────────────────────────────────────────────────────────────
// STEP 1: Fetch All Workflows
// ────────────────────────────────────────────────────────────────

const workflowsResponse = await $http.get(`${n8nApiUrl}/workflows`, { headers });
const allWorkflows = workflowsResponse.data || [];

console.log(`Found ${allWorkflows.length} total workflows`);

// Critical workflows (need elevated priority)
const criticalWorkflows = [
  'UYSP-SMS-Scheduler-v2',
  'UYSP-Message-Scheduler-v2',
  'UYSP-AI-Reply-Sentiment-v2',
  'UYSP-Engagement-Score-Calculator-v1',
  'UYSP-Calendly-Booked',
  'UYSP-SMS-Inbound-STOP',
  'UYSP-Kajabi-API-Polling'
];

// ────────────────────────────────────────────────────────────────
// STEP 2: For Each Workflow, Fetch Execution Data
// ────────────────────────────────────────────────────────────────

const results = [];
const now = new Date();
const twentyFourHoursAgo = new Date(now - 24*60*60*1000);

for (const workflow of allWorkflows) {
  const workflowId = workflow.id;
  const workflowName = workflow.name;
  const isActive = workflow.active;

  console.log(`Processing: ${workflowName} (${workflowId})`);

  // Query last 100 executions for this workflow
  let executions = [];
  try {
    const execResponse = await $http.get(
      `${n8nApiUrl}/executions`,
      { 
        headers,
        params: {
          workflowId: workflowId,
          limit: 100,
          includeData: false
        }
      }
    );
    executions = execResponse.data.data || [];
  } catch (error) {
    console.log(`Failed to fetch executions for ${workflowName}: ${error.message}`);
    executions = [];
  }

  // ────────────────────────────────────────────────────────────
  // STEP 3: Filter to Last 24 Hours
  // ────────────────────────────────────────────────────────────

  const recentExecs = executions.filter(exec => {
    const finishedTime = new Date(exec.stoppedAt || exec.startedAt);
    return finishedTime >= twentyFourHoursAgo;
  });

  // ────────────────────────────────────────────────────────────
  // STEP 4: Calculate Metrics
  // ────────────────────────────────────────────────────────────

  const totalCount = recentExecs.length;
  const errorCount = recentExecs.filter(e => e.status === 'error').length;
  const successCount = recentExecs.filter(e => e.status === 'success').length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100 * 10) / 10 : 100;

  // Find last execution details
  const lastExecution = executions.length > 0 ? executions[0] : null;
  const lastError = executions.find(e => e.status === 'error');
  const lastSuccess = executions.find(e => e.status === 'success');

  // Calculate average execution time (in seconds)
  const executionTimes = recentExecs
    .filter(e => e.stoppedAt && e.startedAt)
    .map(e => {
      const start = new Date(e.startedAt);
      const stop = new Date(e.stoppedAt);
      return (stop - start) / 1000;
    });

  const avgExecutionTime = executionTimes.length > 0
    ? Math.round((executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length) * 100) / 100
    : 0;

  // ────────────────────────────────────────────────────────────
  // STEP 5: Determine Health Status
  // ────────────────────────────────────────────────────────────

  let status = 'Healthy';
  if (!isActive) {
    status = 'Inactive';
  } else if (errorCount > 0 && successRate < 90) {
    status = 'Error';
  } else if (successRate < 95 || errorCount > 5) {
    status = 'Warning';
  }

  // ────────────────────────────────────────────────────────────
  // STEP 6: Determine Priority
  // ────────────────────────────────────────────────────────────

  let priority = 'Medium';
  if (criticalWorkflows.includes(workflowName)) {
    priority = 'Critical';
  } else if (isActive && totalCount > 50) {
    priority = 'High';
  } else if (!isActive || totalCount === 0) {
    priority = 'Low';
  }

  // ────────────────────────────────────────────────────────────
  // STEP 7: Build Result Object
  // ────────────────────────────────────────────────────────────

  results.push({
    json: {
      workflow_id: workflowId,
      workflow_name: workflowName,
      status: status,
      is_active: isActive,
      last_execution_time: lastExecution ? (lastExecution.stoppedAt || lastExecution.startedAt) : null,
      last_success_time: lastSuccess ? lastSuccess.stoppedAt : null,
      last_error_time: lastError ? lastError.stoppedAt : null,
      last_error_message: lastError ? JSON.stringify(lastError.error || {}).substring(0, 500) : null,
      error_count_24h: errorCount,
      success_count_24h: successCount,
      success_rate: successRate,
      execution_count_24h: totalCount,
      avg_execution_time: avgExecutionTime,
      priority: priority,
      health_check_time: now.toISOString(),
      alert_sent: false,
      tags: workflow.tags ? workflow.tags.join(', ') : '',
      notes: ''
    }
  });

  console.log(`  → Status: ${status}, Priority: ${priority}, Success Rate: ${successRate}%`);
}

console.log(`\n✅ Processed ${results.length} workflows`);
return results;
```

**Output**: Array of workflow health objects (one per workflow)

---

### Node 4: Update Airtable (Loop Mode)
**Type**: `n8n-nodes-base.airtable`
**Operation**: `update` (with upsert capability)
**Mode**: Processes each input item separately

**Configuration**:
```json
{
  "parameters": {
    "operation": "update",
    "base": {"mode": "id", "value": "app4wIsBfpJTg7pWS"},
    "table": {"mode": "id", "value": "tblTeZVJ2eJ9BBN1b"},
    "columns": {
      "mappingMode": "defineBelow",
      "matchingColumns": ["fldGlDDLzdavPOOaE"],
      "value": {
        "fldGlDDLzdavPOOaE": "={{$json.workflow_id}}",
        "fldqz0v6OrA4oT79o": "={{$json.workflow_name}}",
        "fldefPJsm1jWMYdRS": "={{$json.status}}",
        "fldk1gfH9cQlgBZ9Z": "={{$json.is_active}}",
        "fldBwi4MO4kSvRykb": "={{$json.last_execution_time}}",
        "fldcKcCKr32OHV4qe": "={{$json.last_success_time}}",
        "fldCMIpGhjcVaPbDB": "={{$json.last_error_time}}",
        "fldi1tLdLvqAu5Lnz": "={{$json.last_error_message}}",
        "fldlcjuOj3tHjE1kB": "={{$json.error_count_24h}}",
        "fldFpcf4tXf2aI82Q": "={{$json.success_count_24h}}",
        "fldh6DQdYleUsjTlE": "={{$json.success_rate}}",
        "fldlXBnq4IkZIFNhA": "={{$json.execution_count_24h}}",
        "fldgrpwgOsitYdj20": "={{$json.avg_execution_time}}",
        "fldySqvYq4FV0bVZf": "={{$json.priority}}",
        "flduCQRXQBnDJV1ZZ": "={{$json.health_check_time}}",
        "fldT3P2DFqiKfXkRU": "={{$json.alert_sent}}",
        "fldhqrxDb1nbD32Jf": "={{$json.tags}}",
        "fldgfwe9qMwZdBPog": "={{$json.notes}}"
      }
    },
    "options": {
      "bulkSize": 10,
      "useFieldNames": false
    }
  },
  "onError": "continueRegularOutput"
}
```

**Key Features**:
- `matchingColumns`: Uses `Workflow ID` as unique key (upsert)
- `onError: continueRegularOutput`: Continues even if one record fails
- Maps ALL 18 Airtable fields
- Processes in batches of 10

---

### Node 5: Code - Build Alert Summary
**Type**: `n8n-nodes-base.code`
**Mode**: `runOnceForAllItems`

**Code**:
```javascript
const items = $input.all();

const critical_issues = items.filter(i => 
  i.json.status === 'Error' && i.json.priority === 'Critical'
);

const warnings = items.filter(i => 
  i.json.status === 'Warning' && i.json.priority === 'Critical'
);

const has_alerts = critical_issues.length > 0 || warnings.length > 0;

if (!has_alerts) {
  // No alerts needed
  return [{ json: { has_alerts: false, message: 'All workflows healthy' } }];
}

// Build alert message
const lines = [];
lines.push('🚨 *Workflow Health Alert*\\n');
lines.push(`*Time*: ${new Date().toLocaleString('en-US')}\\n`);

if (critical_issues.length > 0) {
  lines.push(`\\n*🔴 CRITICAL ERRORS (${critical_issues.length}):*`);
  critical_issues.forEach(i => {
    lines.push(`• *${i.json.workflow_name}*`);
    lines.push(`  Status: ${i.json.status}`);
    lines.push(`  Success Rate: ${i.json.success_rate}%`);
    lines.push(`  Errors (24h): ${i.json.error_count_24h}`);
    if (i.json.last_error_message) {
      lines.push(`  Last Error: ${i.json.last_error_message.substring(0, 100)}...`);
    }
    lines.push('');
  });
}

if (warnings.length > 0) {
  lines.push(`\\n*🟡 WARNINGS (${warnings.length}):*`);
  warnings.forEach(i => {
    lines.push(`• *${i.json.workflow_name}*`);
    lines.push(`  Success Rate: ${i.json.success_rate}%`);
    lines.push(`  Errors (24h): ${i.json.error_count_24h}`);
    lines.push('');
  });
}

lines.push('\\n_Check Airtable for full details_');

return [{ json: { has_alerts: true, message: lines.join('\\n') } }];
```

**Output**: Single object with alert status and message

---

### Node 6: IF - Has Alerts?
**Type**: `n8n-nodes-base.if`
**Condition**: `={{$json.has_alerts}} === true`

**Output**:
- TRUE branch: Send Slack alert
- FALSE branch: End quietly

---

### Node 7: Slack Alert
**Type**: `n8n-nodes-base.slack`
**Only Executes If**: Alerts detected

**Configuration**:
```json
{
  "parameters": {
    "resource": "message",
    "operation": "post",
    "select": "channel",
    "channelId": {"__rl": true, "mode": "list", "value": "C097CHUHNTG"},
    "text": "={{$json.message}}",
    "otherOptions": {}
  },
  "onError": "continueRegularOutput"
}
```

**Key**: Only sends when there are actual issues

---

## 🔒 ERROR HANDLING STRATEGY

### Level 1: Inline Error Handling
```javascript
try {
  const response = await $http.get(url, { headers });
  executions = response.data.data || [];
} catch (error) {
  console.log(`Failed to fetch executions: ${error.message}`);
  executions = []; // Continue with empty array
}
```

### Level 2: Node-Level Error Handling
- Airtable Update: `onError: "continueRegularOutput"`
- Slack Alert: `onError: "continueRegularOutput"`

### Level 3: Workflow-Level Error Handling
- Add Error Trigger workflow (Phase 2)
- Log errors to separate Airtable table

---

## ✅ VALIDATION CHECKLIST

Before deployment, verify:

1. **Data Flow**
   - [ ] Single code node fetches ALL data
   - [ ] Airtable receives ALL 18 fields
   - [ ] Workflow ID is unique key for upsert

2. **Logic**
   - [ ] 24-hour time window calculated correctly
   - [ ] Status logic: Inactive → Error → Warning → Healthy
   - [ ] Priority logic: Critical workflows identified
   - [ ] Success rate calculation: (success/total) * 100

3. **Error Handling**
   - [ ] API failures don't stop workflow
   - [ ] Missing data handled gracefully
   - [ ] Slack failures don't block Airtable updates

4. **Performance**
   - [ ] Batch Airtable updates (10 at a time)
   - [ ] Alert only when needed
   - [ ] Execution time < 2 minutes

5. **Testing**
   - [ ] Manual trigger works
   - [ ] All workflows appear in Airtable
   - [ ] Metrics are accurate
   - [ ] Alerts fire for intentional errors
   - [ ] Slack messages are readable

---

## 📊 EXPECTED RESULTS

### Airtable Table After First Run
- 13+ records (one per workflow)
- All 18 fields populated
- Timestamps in NY timezone
- Status distribution: mostly Healthy

### Slack Alerts
- ONLY when issues detected
- Clear, actionable information
- Links to Airtable for details

### Performance
- First run: ~60-90 seconds
- Subsequent runs: ~30-60 seconds
- API calls: ~26 (2 per workflow + base queries)

---

## 🚀 DEPLOYMENT SEQUENCE

1. **Backup Current Workflow** (version control)
2. **Delete Current Broken Workflow** (clean slate)
3. **Build New Workflow** (node by node, validate each)
4. **Manual Test** (check outputs at each step)
5. **Verify Airtable** (all fields populated correctly)
6. **Test Alert Logic** (force an error condition)
7. **Activate Schedule** (only after all tests pass)
8. **Monitor First 3 Runs** (verify stability)

---

## 📝 EVIDENCE CAPTURE

For each deployment step, capture:
- Workflow ID
- Node count
- First execution ID
- Validation result
- Airtable record count
- Any errors or warnings

---

**Next Action**: Build this workflow using proper MCP sequence:
1. Validate design
2. Create workflow (inactive)
3. Build nodes incrementally
4. Validate each node
5. Test manually
6. Activate only when verified

**Estimated Build Time**: 2-3 hours (proper, no shortcuts)
**Production Ready**: ✅ YES (when complete)

