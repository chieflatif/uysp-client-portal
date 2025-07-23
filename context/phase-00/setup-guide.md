# Phase 00: System Setup & Verification Guide
*Complete Infrastructure Setup Before Development*

**Version**: 3.1  
**Last Updated**: 2025-07-22  
**Critical**: This phase MUST be completed before ANY development work
**Workspace**: NEW n8n instance at https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/

## Overview

Phase 00 ensures all infrastructure components are properly configured in your NEW n8n workspace before development begins. We will USE existing workflows (not recreate) and AUTOMATE setup wherever possible.

## When to Execute Phase 00

1. **First time setup** - Before Session 0
2. **After catastrophic failure** - Recovering from deleted workflows
3. **Environment changes** - New n8n instance or Airtable base
4. **Verification needed** - When setup completeness is uncertain

## Step 0: Import Existing Workflow to NEW Workspace (5 minutes)

### CRITICAL: We're USING existing work, not recreating!

**From OLD workspace** (export if you still have access):
- Workflow: `uysp-lead-processing-WORKING` (ID: eiVyE76nCF9g20zU)
- Already has: Field normalization, deduplication, webhook handling

**To NEW workspace** (https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/):
1. Import the workflow JSON
2. Update credentials (will need to recreate in new workspace)
3. Update webhook URL to new instance
4. Verify Airtable connection to existing base

**If export not available**, we have the full workflow structure documented and can recreate ONLY the main workflow.

## Step 1: Environment Variables Configuration (AUTOMATED)

## Step 1: Environment Variables Configuration (AUTOMATED)

### Create `uysp-env-setup-v1` workflow to set all variables

Instead of manually setting 17+ variables, create this workflow:

```javascript
// Node 1: Define All Variables
const envVars = {
  // Core Configuration
  AIRTABLE_BASE_ID: 'appuBf0fTe8tp8ZaF',
  TEST_MODE: 'true',
  DAILY_COST_LIMIT: '1',
  CACHE_EXPIRY_DAYS: '90',
  MAX_RETRIES: '3',
  RETRY_DELAY_MS: '5000',
  TEN_DLC_REGISTERED: 'false',
  SMS_MONTHLY_LIMIT: '1000',
  
  // API Costs
  APOLLO_ORG_COST: '0.04',
  APOLLO_PERSON_COST: '0.04',
  TWILIO_COST: '0.015',
  SMS_COST: '0.02',
  LEADMAGIC_COST: '0.01',
  SMARTE_COST: '0.25',
  CLAUDE_API_COST: '0.001',
  
  // Workflow IDs
  WORKFLOW_MAIN_ID: 'eiVyE76nCF9g20zU',  // Update after import
  WORKFLOW_VERIFICATION_ID: 'PENDING'
};

// Node 2: Check Current State
const existing = [];
const missing = [];

Object.entries(envVars).forEach(([key, value]) => {
  if ($env[key]) {
    existing.push(key);
  } else {
    missing.push({ key, value });
  }
});

return { 
  total: Object.keys(envVars).length,
  existing: existing.length,
  missing: missing,
  status: missing.length === 0 ? '✅ All set' : `❌ ${missing.length} missing`
};

// Node 3: Set Missing Variables (Manual step required)
// Output instructions for human to set via UI
return {
  instructions: 'Copy these to Settings → Variables:',
  variables: missing,
  formatted: missing.map(v => `${v.key}=${v.value}`).join('\n')
};
```

**Human only needs to**:
1. Run workflow
2. Copy output to Settings → Variables
3. Re-run to verify

## Step 2: Create Missing Tables (AUTOMATED)

## Step 2: Create Missing Tables (AUTOMATED)

### Create `uysp-table-setup-v1` workflow

This workflow checks for missing tables and provides the exact creation commands:

```javascript
// Node 1: Check Existing Tables
// Use Airtable node to list bases and tables
const existingTables = ['People', 'Communications', ...]; // From Airtable response

const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

const missingTables = requiredTables.filter(t => !existingTables.includes(t));

// Node 2: Generate Creation Scripts
if (missingTables.includes('Human_Review_Queue')) {
  return {
    tableName: 'Human_Review_Queue',
    airtableMcpCommand: `airtable-mcp create_table --base-id appuBf0fTe8tp8ZaF --name "Human_Review_Queue"`,
    fields: [
      { name: "person_id", type: "multipleRecordLinks", linkedTableId: "tblSk2Ikg21932uE0" },
      { name: "review_reason", type: "singleSelect", 
        options: ["no_company_data", "non_b2b_unclear", "non_sales_role", 
                  "international", "data_quality_issues", "api_failure"] },
      { name: "created_date", type: "dateTime" },
      { name: "reviewed", type: "checkbox" },
      { name: "reviewer", type: "singleLineText" },
      { name: "review_date", type: "dateTime" },
      { name: "review_decision", type: "singleSelect", 
        options: ["qualify", "archive", "edit_and_retry", "escalate"] },
      { name: "review_notes", type: "richText" },
      { name: "priority", type: "singleSelect", options: ["High", "Medium", "Low"] },
      { name: "sla_deadline", type: "dateTime" },
      { name: "auto_archive_date", type: "dateTime" },
      { name: "international_prefix", type: "singleLineText" }
    ]
  };
}

// Node 3: Execute Creation (if MCP available)
// Otherwise output manual creation instructions
```

**Automation Options**:
1. **Best**: Use airtable-mcp from workflow (if connected)
2. **Good**: Output exact API calls for manual execution
3. **Fallback**: Provide Airtable UI instructions

## Step 3: Add Missing Fields (AUTOMATED)

## Step 3: Add Missing Fields (AUTOMATED)

### Create `uysp-field-updater-v1` workflow

```javascript
// Node 1: Get Current Schema
// Use Airtable to get table schema for People, Communications, Daily_Metrics

// Node 2: Identify Missing Fields
const requiredFields = {
  People: {
    // 2025 Updates
    'request_id': { type: 'singleLineText', description: 'Unique webhook request ID' },
    'qualified_lead': { type: 'checkbox', description: 'Boolean from webhook' },
    'contacted': { type: 'checkbox', description: 'Boolean from webhook' },
    
    // Field normalization
    'field_mapping_success_rate': { type: 'percent', precision: 0 },
    'normalization_version': { type: 'singleLineText' },
    'raw_webhook_data': { type: 'longText' },
    'validation_errors': { type: 'longText' },
    'webhook_field_count': { type: 'number' },
    'mapped_field_count': { type: 'number' },
    'unknown_field_list': { type: 'longText' },
    
    // Pipeline tracking
    'phase1_attempted': { type: 'checkbox' },
    'phase1_passed': { type: 'checkbox' },
    'phase2_attempted': { type: 'checkbox' },
    'phase2_passed': { type: 'checkbox' },
    'scoring_attempted': { type: 'checkbox' },
    'scoring_method_used': { type: 'singleSelect', options: ['claude_ai', 'domain_fallback', 'manual'] },
    
    // Cost tracking
    'apollo_org_cost': { type: 'currency', symbol: '

### A. Fix Daily_Costs Record

Update existing record with proper date:

```javascript
{
  "date": new Date().toISOString().split('T')[0],  // Today's date
  "apollo_org_costs": 0,
  "apollo_people_costs": 0,
  "twilio_costs": 0,
  "sms_costs": 0,
  "claude_costs": 0,  // NEW field
  "total_costs": 0,
  "budget_remaining": 50,
  "daily_limit": 50
}
```

### B. Load Test Data

**DND_List** (Required for compliance testing):
```javascript
[
  {
    "phone": "+14155551111",
    "email": "donotcontact@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "sms",
    "permanent": true,
    "reason": "Test DND entry - US number"
  },
  {
    "phone": "+447700900123",  // NEW: International test
    "email": "uktest@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "manual",
    "permanent": true,
    "reason": "International DND test"
  }
]
```

**Workflow_IDs** (Track all workflows):
```javascript
[
  {
    "Name": "uysp-lead-processing-v1",
    "id": "eiVyE76nCF9g20zU",
    "created_date": new Date().toISOString(),
    "description": "Main lead processing with field normalization v3",
    "status": "Active",
    "version": "3.0"
  },
  {
    "Name": "uysp-setup-verification-v1",
    "id": "[CREATE AND UPDATE]",
    "created_date": new Date().toISOString(),
    "description": "Phase 00 setup verification",
    "status": "Testing"
  }
]
```

**Field_Mapping_Log** (Initialize with known variations):
```javascript
{
  "timestamp": new Date().toISOString(),
  "webhook_name": "Initial Setup",
  "unknown_fields": JSON.stringify([]),
  "original_payload": "Setup record",
  "mapping_success_rate": 100,
  "reviewed": true
}
```

## Step 5: Create Verification Workflow (15 minutes)

Create `uysp-setup-verification-v1` with these nodes:

### Node 1: Check Environment Variables
```javascript
const requiredVars = [
  'AIRTABLE_BASE_ID', 'TEST_MODE', 'DAILY_COST_LIMIT',
  'APOLLO_ORG_COST', 'APOLLO_PERSON_COST', 'TWILIO_COST',
  'SMS_COST', 'CLAUDE_API_COST', 'MAX_RETRIES'
];

const missing = [];
const configured = {};

requiredVars.forEach(varName => {
  const value = $env[varName];
  if (!value) {
    missing.push(varName);
  } else {
    configured[varName] = value;
  }
});

return {
  envCheck: {
    required: requiredVars.length,
    configured: Object.keys(configured).length,
    missing: missing,
    status: missing.length === 0 ? '✅ All configured' : `❌ Missing ${missing.length}`
  }
};
```

### Node 2: Verify Tables Exist
```javascript
// Check all 11 required tables
const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

// Would connect to Airtable list tables
return { tableCheck: { required: 11, status: 'Check via Airtable' } };
```

### Node 3: Verify Critical Fields
```javascript
// Check for new fields added in 2025
const criticalFields = {
  People: ['request_id', 'qualified_lead', 'contacted', 
           'field_mapping_success_rate', 'phone_country_code'],
  Communications: ['tendlc_compliant', 'compliance_errors'],
  Daily_Metrics: ['field_mapping_success_rate']
};

return { fieldCheck: criticalFields };
```

### Node 4: Test Data Verification
```javascript
// Check for minimum test data
const checks = {
  dndEntries: 2,      // Including international
  workflowIds: 2,
  dailyCosts: 1,
  fieldMappingLog: 1
};

return { dataCheck: checks };
```

### Node 5: Generate Report
```javascript
const allChecks = {
  environment: $node["Check Environment Variables"].json,
  tables: $node["Verify Tables Exist"].json,
  fields: $node["Verify Critical Fields"].json,
  testData: $node["Test Data Verification"].json,
  timestamp: new Date().toISOString()
};

const allPassed = 
  allChecks.environment.envCheck.missing.length === 0 &&
  allChecks.tables.tableCheck.status.includes('✅') &&
  allChecks.testData.dataCheck.dndEntries >= 2;

return {
  setupComplete: allPassed,
  report: allChecks,
  nextSteps: allPassed ? 
    'Ready for Session 0: Field Normalization' : 
    'Fix issues before proceeding'
};
```

## Step 6: Loop Detection & Troubleshooting (NEW)

### Loop Detection Pattern
If ANY error repeats 3+ times:
1. **STOP** current approach
2. **SEARCH**: `exa.search("n8n [exact error message] workaround")`
3. **DOCUMENT**: Each attempt with exact errors
4. **TRY**: Different approach from search results
5. **ESCALATE**: If still failing after search

### Common Phase 00 Issues

**Table Creation Fails**:
- Verify personal access token has `schema.bases:write` scope
- Use Airtable UI as fallback
- Check base ID is correct

**Fields Won't Add**:
- Check field type compatibility
- For linked fields, verify table IDs
- Use UI for complex types

**Env Vars Not Working**:
- Refresh n8n after setting
- Check exact spelling (case-sensitive)
- Use expression editor to verify

**International Phone Test**:
- Ensure +44 number included in DND
- Verify phone_country_code field exists
- Test with actual international format

## Success Criteria Checklist

- [ ] **Environment**: All 17+ variables configured
- [ ] **Tables**: All 11 tables exist
- [ ] **Fields**: 
  - [ ] People: request_id, qualified_lead, contacted added
  - [ ] People: All tracking fields added
  - [ ] People: International handling fields added
  - [ ] Communications: Compliance fields added
  - [ ] Daily_Metrics: Performance fields added
- [ ] **Test Data**:
  - [ ] DND: 2+ entries (including international)
  - [ ] Workflow_IDs: Current workflows tracked
  - [ ] Daily_Costs: Today's date set
  - [ ] Field_Mapping_Log: Initialized
- [ ] **Verification**: Workflow created and shows all green
- [ ] **Loop Prevention**: MAX_RETRIES=3 configured

## Output Evidence Required

1. **Screenshot**: Verification workflow execution showing all ✅
2. **Query Results**: 
   ```sql
   -- DND List check
   SELECT * FROM DND_List WHERE phone LIKE '+44%'
   
   -- People fields check  
   SHOW FIELDS FROM People WHERE Field IN ('request_id', 'qualified_lead')
   ```
3. **Environment Variables**: Screenshot of n8n variables page
4. **Workflow Export**: `uysp-setup-verification-v1.json`

## Next Steps

Once Phase 00 shows 100% complete:
1. Proceed to **Session 0: Field Normalization**
2. Use the 15+ updated test payloads from reality_based_tests_v2.json
3. Ensure international phone routing logic is included
4. Set up Claude API rate limit handling (100 req/min)

---

*Remember: This phase prevents 90% of implementation failures. Do NOT skip any steps.* },
    'apollo_person_cost': { type: 'currency', symbol: '

### A. Fix Daily_Costs Record

Update existing record with proper date:

```javascript
{
  "date": new Date().toISOString().split('T')[0],  // Today's date
  "apollo_org_costs": 0,
  "apollo_people_costs": 0,
  "twilio_costs": 0,
  "sms_costs": 0,
  "claude_costs": 0,  // NEW field
  "total_costs": 0,
  "budget_remaining": 50,
  "daily_limit": 50
}
```

### B. Load Test Data

**DND_List** (Required for compliance testing):
```javascript
[
  {
    "phone": "+14155551111",
    "email": "donotcontact@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "sms",
    "permanent": true,
    "reason": "Test DND entry - US number"
  },
  {
    "phone": "+447700900123",  // NEW: International test
    "email": "uktest@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "manual",
    "permanent": true,
    "reason": "International DND test"
  }
]
```

**Workflow_IDs** (Track all workflows):
```javascript
[
  {
    "Name": "uysp-lead-processing-v1",
    "id": "eiVyE76nCF9g20zU",
    "created_date": new Date().toISOString(),
    "description": "Main lead processing with field normalization v3",
    "status": "Active",
    "version": "3.0"
  },
  {
    "Name": "uysp-setup-verification-v1",
    "id": "[CREATE AND UPDATE]",
    "created_date": new Date().toISOString(),
    "description": "Phase 00 setup verification",
    "status": "Testing"
  }
]
```

**Field_Mapping_Log** (Initialize with known variations):
```javascript
{
  "timestamp": new Date().toISOString(),
  "webhook_name": "Initial Setup",
  "unknown_fields": JSON.stringify([]),
  "original_payload": "Setup record",
  "mapping_success_rate": 100,
  "reviewed": true
}
```

## Step 5: Create Verification Workflow (15 minutes)

Create `uysp-setup-verification-v1` with these nodes:

### Node 1: Check Environment Variables
```javascript
const requiredVars = [
  'AIRTABLE_BASE_ID', 'TEST_MODE', 'DAILY_COST_LIMIT',
  'APOLLO_ORG_COST', 'APOLLO_PERSON_COST', 'TWILIO_COST',
  'SMS_COST', 'CLAUDE_API_COST', 'MAX_RETRIES'
];

const missing = [];
const configured = {};

requiredVars.forEach(varName => {
  const value = $env[varName];
  if (!value) {
    missing.push(varName);
  } else {
    configured[varName] = value;
  }
});

return {
  envCheck: {
    required: requiredVars.length,
    configured: Object.keys(configured).length,
    missing: missing,
    status: missing.length === 0 ? '✅ All configured' : `❌ Missing ${missing.length}`
  }
};
```

### Node 2: Verify Tables Exist
```javascript
// Check all 11 required tables
const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

// Would connect to Airtable list tables
return { tableCheck: { required: 11, status: 'Check via Airtable' } };
```

### Node 3: Verify Critical Fields
```javascript
// Check for new fields added in 2025
const criticalFields = {
  People: ['request_id', 'qualified_lead', 'contacted', 
           'field_mapping_success_rate', 'phone_country_code'],
  Communications: ['tendlc_compliant', 'compliance_errors'],
  Daily_Metrics: ['field_mapping_success_rate']
};

return { fieldCheck: criticalFields };
```

### Node 4: Test Data Verification
```javascript
// Check for minimum test data
const checks = {
  dndEntries: 2,      // Including international
  workflowIds: 2,
  dailyCosts: 1,
  fieldMappingLog: 1
};

return { dataCheck: checks };
```

### Node 5: Generate Report
```javascript
const allChecks = {
  environment: $node["Check Environment Variables"].json,
  tables: $node["Verify Tables Exist"].json,
  fields: $node["Verify Critical Fields"].json,
  testData: $node["Test Data Verification"].json,
  timestamp: new Date().toISOString()
};

const allPassed = 
  allChecks.environment.envCheck.missing.length === 0 &&
  allChecks.tables.tableCheck.status.includes('✅') &&
  allChecks.testData.dataCheck.dndEntries >= 2;

return {
  setupComplete: allPassed,
  report: allChecks,
  nextSteps: allPassed ? 
    'Ready for Session 0: Field Normalization' : 
    'Fix issues before proceeding'
};
```

## Step 6: Loop Detection & Troubleshooting (NEW)

### Loop Detection Pattern
If ANY error repeats 3+ times:
1. **STOP** current approach
2. **SEARCH**: `exa.search("n8n [exact error message] workaround")`
3. **DOCUMENT**: Each attempt with exact errors
4. **TRY**: Different approach from search results
5. **ESCALATE**: If still failing after search

### Common Phase 00 Issues

**Table Creation Fails**:
- Verify personal access token has `schema.bases:write` scope
- Use Airtable UI as fallback
- Check base ID is correct

**Fields Won't Add**:
- Check field type compatibility
- For linked fields, verify table IDs
- Use UI for complex types

**Env Vars Not Working**:
- Refresh n8n after setting
- Check exact spelling (case-sensitive)
- Use expression editor to verify

**International Phone Test**:
- Ensure +44 number included in DND
- Verify phone_country_code field exists
- Test with actual international format

## Success Criteria Checklist

- [ ] **Environment**: All 17+ variables configured
- [ ] **Tables**: All 11 tables exist
- [ ] **Fields**: 
  - [ ] People: request_id, qualified_lead, contacted added
  - [ ] People: All tracking fields added
  - [ ] People: International handling fields added
  - [ ] Communications: Compliance fields added
  - [ ] Daily_Metrics: Performance fields added
- [ ] **Test Data**:
  - [ ] DND: 2+ entries (including international)
  - [ ] Workflow_IDs: Current workflows tracked
  - [ ] Daily_Costs: Today's date set
  - [ ] Field_Mapping_Log: Initialized
- [ ] **Verification**: Workflow created and shows all green
- [ ] **Loop Prevention**: MAX_RETRIES=3 configured

## Output Evidence Required

1. **Screenshot**: Verification workflow execution showing all ✅
2. **Query Results**: 
   ```sql
   -- DND List check
   SELECT * FROM DND_List WHERE phone LIKE '+44%'
   
   -- People fields check  
   SHOW FIELDS FROM People WHERE Field IN ('request_id', 'qualified_lead')
   ```
3. **Environment Variables**: Screenshot of n8n variables page
4. **Workflow Export**: `uysp-setup-verification-v1.json`

## Next Steps

Once Phase 00 shows 100% complete:
1. Proceed to **Session 0: Field Normalization**
2. Use the 15+ updated test payloads from reality_based_tests_v2.json
3. Ensure international phone routing logic is included
4. Set up Claude API rate limit handling (100 req/min)

---

*Remember: This phase prevents 90% of implementation failures. Do NOT skip any steps.* },
    'twilio_cost': { type: 'currency', symbol: '

### A. Fix Daily_Costs Record

Update existing record with proper date:

```javascript
{
  "date": new Date().toISOString().split('T')[0],  // Today's date
  "apollo_org_costs": 0,
  "apollo_people_costs": 0,
  "twilio_costs": 0,
  "sms_costs": 0,
  "claude_costs": 0,  // NEW field
  "total_costs": 0,
  "budget_remaining": 50,
  "daily_limit": 50
}
```

### B. Load Test Data

**DND_List** (Required for compliance testing):
```javascript
[
  {
    "phone": "+14155551111",
    "email": "donotcontact@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "sms",
    "permanent": true,
    "reason": "Test DND entry - US number"
  },
  {
    "phone": "+447700900123",  // NEW: International test
    "email": "uktest@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "manual",
    "permanent": true,
    "reason": "International DND test"
  }
]
```

**Workflow_IDs** (Track all workflows):
```javascript
[
  {
    "Name": "uysp-lead-processing-v1",
    "id": "eiVyE76nCF9g20zU",
    "created_date": new Date().toISOString(),
    "description": "Main lead processing with field normalization v3",
    "status": "Active",
    "version": "3.0"
  },
  {
    "Name": "uysp-setup-verification-v1",
    "id": "[CREATE AND UPDATE]",
    "created_date": new Date().toISOString(),
    "description": "Phase 00 setup verification",
    "status": "Testing"
  }
]
```

**Field_Mapping_Log** (Initialize with known variations):
```javascript
{
  "timestamp": new Date().toISOString(),
  "webhook_name": "Initial Setup",
  "unknown_fields": JSON.stringify([]),
  "original_payload": "Setup record",
  "mapping_success_rate": 100,
  "reviewed": true
}
```

## Step 5: Create Verification Workflow (15 minutes)

Create `uysp-setup-verification-v1` with these nodes:

### Node 1: Check Environment Variables
```javascript
const requiredVars = [
  'AIRTABLE_BASE_ID', 'TEST_MODE', 'DAILY_COST_LIMIT',
  'APOLLO_ORG_COST', 'APOLLO_PERSON_COST', 'TWILIO_COST',
  'SMS_COST', 'CLAUDE_API_COST', 'MAX_RETRIES'
];

const missing = [];
const configured = {};

requiredVars.forEach(varName => {
  const value = $env[varName];
  if (!value) {
    missing.push(varName);
  } else {
    configured[varName] = value;
  }
});

return {
  envCheck: {
    required: requiredVars.length,
    configured: Object.keys(configured).length,
    missing: missing,
    status: missing.length === 0 ? '✅ All configured' : `❌ Missing ${missing.length}`
  }
};
```

### Node 2: Verify Tables Exist
```javascript
// Check all 11 required tables
const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

// Would connect to Airtable list tables
return { tableCheck: { required: 11, status: 'Check via Airtable' } };
```

### Node 3: Verify Critical Fields
```javascript
// Check for new fields added in 2025
const criticalFields = {
  People: ['request_id', 'qualified_lead', 'contacted', 
           'field_mapping_success_rate', 'phone_country_code'],
  Communications: ['tendlc_compliant', 'compliance_errors'],
  Daily_Metrics: ['field_mapping_success_rate']
};

return { fieldCheck: criticalFields };
```

### Node 4: Test Data Verification
```javascript
// Check for minimum test data
const checks = {
  dndEntries: 2,      // Including international
  workflowIds: 2,
  dailyCosts: 1,
  fieldMappingLog: 1
};

return { dataCheck: checks };
```

### Node 5: Generate Report
```javascript
const allChecks = {
  environment: $node["Check Environment Variables"].json,
  tables: $node["Verify Tables Exist"].json,
  fields: $node["Verify Critical Fields"].json,
  testData: $node["Test Data Verification"].json,
  timestamp: new Date().toISOString()
};

const allPassed = 
  allChecks.environment.envCheck.missing.length === 0 &&
  allChecks.tables.tableCheck.status.includes('✅') &&
  allChecks.testData.dataCheck.dndEntries >= 2;

return {
  setupComplete: allPassed,
  report: allChecks,
  nextSteps: allPassed ? 
    'Ready for Session 0: Field Normalization' : 
    'Fix issues before proceeding'
};
```

## Step 6: Loop Detection & Troubleshooting (NEW)

### Loop Detection Pattern
If ANY error repeats 3+ times:
1. **STOP** current approach
2. **SEARCH**: `exa.search("n8n [exact error message] workaround")`
3. **DOCUMENT**: Each attempt with exact errors
4. **TRY**: Different approach from search results
5. **ESCALATE**: If still failing after search

### Common Phase 00 Issues

**Table Creation Fails**:
- Verify personal access token has `schema.bases:write` scope
- Use Airtable UI as fallback
- Check base ID is correct

**Fields Won't Add**:
- Check field type compatibility
- For linked fields, verify table IDs
- Use UI for complex types

**Env Vars Not Working**:
- Refresh n8n after setting
- Check exact spelling (case-sensitive)
- Use expression editor to verify

**International Phone Test**:
- Ensure +44 number included in DND
- Verify phone_country_code field exists
- Test with actual international format

## Success Criteria Checklist

- [ ] **Environment**: All 17+ variables configured
- [ ] **Tables**: All 11 tables exist
- [ ] **Fields**: 
  - [ ] People: request_id, qualified_lead, contacted added
  - [ ] People: All tracking fields added
  - [ ] People: International handling fields added
  - [ ] Communications: Compliance fields added
  - [ ] Daily_Metrics: Performance fields added
- [ ] **Test Data**:
  - [ ] DND: 2+ entries (including international)
  - [ ] Workflow_IDs: Current workflows tracked
  - [ ] Daily_Costs: Today's date set
  - [ ] Field_Mapping_Log: Initialized
- [ ] **Verification**: Workflow created and shows all green
- [ ] **Loop Prevention**: MAX_RETRIES=3 configured

## Output Evidence Required

1. **Screenshot**: Verification workflow execution showing all ✅
2. **Query Results**: 
   ```sql
   -- DND List check
   SELECT * FROM DND_List WHERE phone LIKE '+44%'
   
   -- People fields check  
   SHOW FIELDS FROM People WHERE Field IN ('request_id', 'qualified_lead')
   ```
3. **Environment Variables**: Screenshot of n8n variables page
4. **Workflow Export**: `uysp-setup-verification-v1.json`

## Next Steps

Once Phase 00 shows 100% complete:
1. Proceed to **Session 0: Field Normalization**
2. Use the 15+ updated test payloads from reality_based_tests_v2.json
3. Ensure international phone routing logic is included
4. Set up Claude API rate limit handling (100 req/min)

---

*Remember: This phase prevents 90% of implementation failures. Do NOT skip any steps.* },
    'claude_cost': { type: 'currency', symbol: '

### A. Fix Daily_Costs Record

Update existing record with proper date:

```javascript
{
  "date": new Date().toISOString().split('T')[0],  // Today's date
  "apollo_org_costs": 0,
  "apollo_people_costs": 0,
  "twilio_costs": 0,
  "sms_costs": 0,
  "claude_costs": 0,  // NEW field
  "total_costs": 0,
  "budget_remaining": 50,
  "daily_limit": 50
}
```

### B. Load Test Data

**DND_List** (Required for compliance testing):
```javascript
[
  {
    "phone": "+14155551111",
    "email": "donotcontact@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "sms",
    "permanent": true,
    "reason": "Test DND entry - US number"
  },
  {
    "phone": "+447700900123",  // NEW: International test
    "email": "uktest@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "manual",
    "permanent": true,
    "reason": "International DND test"
  }
]
```

**Workflow_IDs** (Track all workflows):
```javascript
[
  {
    "Name": "uysp-lead-processing-v1",
    "id": "eiVyE76nCF9g20zU",
    "created_date": new Date().toISOString(),
    "description": "Main lead processing with field normalization v3",
    "status": "Active",
    "version": "3.0"
  },
  {
    "Name": "uysp-setup-verification-v1",
    "id": "[CREATE AND UPDATE]",
    "created_date": new Date().toISOString(),
    "description": "Phase 00 setup verification",
    "status": "Testing"
  }
]
```

**Field_Mapping_Log** (Initialize with known variations):
```javascript
{
  "timestamp": new Date().toISOString(),
  "webhook_name": "Initial Setup",
  "unknown_fields": JSON.stringify([]),
  "original_payload": "Setup record",
  "mapping_success_rate": 100,
  "reviewed": true
}
```

## Step 5: Create Verification Workflow (15 minutes)

Create `uysp-setup-verification-v1` with these nodes:

### Node 1: Check Environment Variables
```javascript
const requiredVars = [
  'AIRTABLE_BASE_ID', 'TEST_MODE', 'DAILY_COST_LIMIT',
  'APOLLO_ORG_COST', 'APOLLO_PERSON_COST', 'TWILIO_COST',
  'SMS_COST', 'CLAUDE_API_COST', 'MAX_RETRIES'
];

const missing = [];
const configured = {};

requiredVars.forEach(varName => {
  const value = $env[varName];
  if (!value) {
    missing.push(varName);
  } else {
    configured[varName] = value;
  }
});

return {
  envCheck: {
    required: requiredVars.length,
    configured: Object.keys(configured).length,
    missing: missing,
    status: missing.length === 0 ? '✅ All configured' : `❌ Missing ${missing.length}`
  }
};
```

### Node 2: Verify Tables Exist
```javascript
// Check all 11 required tables
const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

// Would connect to Airtable list tables
return { tableCheck: { required: 11, status: 'Check via Airtable' } };
```

### Node 3: Verify Critical Fields
```javascript
// Check for new fields added in 2025
const criticalFields = {
  People: ['request_id', 'qualified_lead', 'contacted', 
           'field_mapping_success_rate', 'phone_country_code'],
  Communications: ['tendlc_compliant', 'compliance_errors'],
  Daily_Metrics: ['field_mapping_success_rate']
};

return { fieldCheck: criticalFields };
```

### Node 4: Test Data Verification
```javascript
// Check for minimum test data
const checks = {
  dndEntries: 2,      // Including international
  workflowIds: 2,
  dailyCosts: 1,
  fieldMappingLog: 1
};

return { dataCheck: checks };
```

### Node 5: Generate Report
```javascript
const allChecks = {
  environment: $node["Check Environment Variables"].json,
  tables: $node["Verify Tables Exist"].json,
  fields: $node["Verify Critical Fields"].json,
  testData: $node["Test Data Verification"].json,
  timestamp: new Date().toISOString()
};

const allPassed = 
  allChecks.environment.envCheck.missing.length === 0 &&
  allChecks.tables.tableCheck.status.includes('✅') &&
  allChecks.testData.dataCheck.dndEntries >= 2;

return {
  setupComplete: allPassed,
  report: allChecks,
  nextSteps: allPassed ? 
    'Ready for Session 0: Field Normalization' : 
    'Fix issues before proceeding'
};
```

## Step 6: Loop Detection & Troubleshooting (NEW)

### Loop Detection Pattern
If ANY error repeats 3+ times:
1. **STOP** current approach
2. **SEARCH**: `exa.search("n8n [exact error message] workaround")`
3. **DOCUMENT**: Each attempt with exact errors
4. **TRY**: Different approach from search results
5. **ESCALATE**: If still failing after search

### Common Phase 00 Issues

**Table Creation Fails**:
- Verify personal access token has `schema.bases:write` scope
- Use Airtable UI as fallback
- Check base ID is correct

**Fields Won't Add**:
- Check field type compatibility
- For linked fields, verify table IDs
- Use UI for complex types

**Env Vars Not Working**:
- Refresh n8n after setting
- Check exact spelling (case-sensitive)
- Use expression editor to verify

**International Phone Test**:
- Ensure +44 number included in DND
- Verify phone_country_code field exists
- Test with actual international format

## Success Criteria Checklist

- [ ] **Environment**: All 17+ variables configured
- [ ] **Tables**: All 11 tables exist
- [ ] **Fields**: 
  - [ ] People: request_id, qualified_lead, contacted added
  - [ ] People: All tracking fields added
  - [ ] People: International handling fields added
  - [ ] Communications: Compliance fields added
  - [ ] Daily_Metrics: Performance fields added
- [ ] **Test Data**:
  - [ ] DND: 2+ entries (including international)
  - [ ] Workflow_IDs: Current workflows tracked
  - [ ] Daily_Costs: Today's date set
  - [ ] Field_Mapping_Log: Initialized
- [ ] **Verification**: Workflow created and shows all green
- [ ] **Loop Prevention**: MAX_RETRIES=3 configured

## Output Evidence Required

1. **Screenshot**: Verification workflow execution showing all ✅
2. **Query Results**: 
   ```sql
   -- DND List check
   SELECT * FROM DND_List WHERE phone LIKE '+44%'
   
   -- People fields check  
   SHOW FIELDS FROM People WHERE Field IN ('request_id', 'qualified_lead')
   ```
3. **Environment Variables**: Screenshot of n8n variables page
4. **Workflow Export**: `uysp-setup-verification-v1.json`

## Next Steps

Once Phase 00 shows 100% complete:
1. Proceed to **Session 0: Field Normalization**
2. Use the 15+ updated test payloads from reality_based_tests_v2.json
3. Ensure international phone routing logic is included
4. Set up Claude API rate limit handling (100 req/min)

---

*Remember: This phase prevents 90% of implementation failures. Do NOT skip any steps.* },
    'total_processing_cost': { type: 'currency', symbol: '

### A. Fix Daily_Costs Record

Update existing record with proper date:

```javascript
{
  "date": new Date().toISOString().split('T')[0],  // Today's date
  "apollo_org_costs": 0,
  "apollo_people_costs": 0,
  "twilio_costs": 0,
  "sms_costs": 0,
  "claude_costs": 0,  // NEW field
  "total_costs": 0,
  "budget_remaining": 50,
  "daily_limit": 50
}
```

### B. Load Test Data

**DND_List** (Required for compliance testing):
```javascript
[
  {
    "phone": "+14155551111",
    "email": "donotcontact@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "sms",
    "permanent": true,
    "reason": "Test DND entry - US number"
  },
  {
    "phone": "+447700900123",  // NEW: International test
    "email": "uktest@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "manual",
    "permanent": true,
    "reason": "International DND test"
  }
]
```

**Workflow_IDs** (Track all workflows):
```javascript
[
  {
    "Name": "uysp-lead-processing-v1",
    "id": "eiVyE76nCF9g20zU",
    "created_date": new Date().toISOString(),
    "description": "Main lead processing with field normalization v3",
    "status": "Active",
    "version": "3.0"
  },
  {
    "Name": "uysp-setup-verification-v1",
    "id": "[CREATE AND UPDATE]",
    "created_date": new Date().toISOString(),
    "description": "Phase 00 setup verification",
    "status": "Testing"
  }
]
```

**Field_Mapping_Log** (Initialize with known variations):
```javascript
{
  "timestamp": new Date().toISOString(),
  "webhook_name": "Initial Setup",
  "unknown_fields": JSON.stringify([]),
  "original_payload": "Setup record",
  "mapping_success_rate": 100,
  "reviewed": true
}
```

## Step 5: Create Verification Workflow (15 minutes)

Create `uysp-setup-verification-v1` with these nodes:

### Node 1: Check Environment Variables
```javascript
const requiredVars = [
  'AIRTABLE_BASE_ID', 'TEST_MODE', 'DAILY_COST_LIMIT',
  'APOLLO_ORG_COST', 'APOLLO_PERSON_COST', 'TWILIO_COST',
  'SMS_COST', 'CLAUDE_API_COST', 'MAX_RETRIES'
];

const missing = [];
const configured = {};

requiredVars.forEach(varName => {
  const value = $env[varName];
  if (!value) {
    missing.push(varName);
  } else {
    configured[varName] = value;
  }
});

return {
  envCheck: {
    required: requiredVars.length,
    configured: Object.keys(configured).length,
    missing: missing,
    status: missing.length === 0 ? '✅ All configured' : `❌ Missing ${missing.length}`
  }
};
```

### Node 2: Verify Tables Exist
```javascript
// Check all 11 required tables
const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

// Would connect to Airtable list tables
return { tableCheck: { required: 11, status: 'Check via Airtable' } };
```

### Node 3: Verify Critical Fields
```javascript
// Check for new fields added in 2025
const criticalFields = {
  People: ['request_id', 'qualified_lead', 'contacted', 
           'field_mapping_success_rate', 'phone_country_code'],
  Communications: ['tendlc_compliant', 'compliance_errors'],
  Daily_Metrics: ['field_mapping_success_rate']
};

return { fieldCheck: criticalFields };
```

### Node 4: Test Data Verification
```javascript
// Check for minimum test data
const checks = {
  dndEntries: 2,      // Including international
  workflowIds: 2,
  dailyCosts: 1,
  fieldMappingLog: 1
};

return { dataCheck: checks };
```

### Node 5: Generate Report
```javascript
const allChecks = {
  environment: $node["Check Environment Variables"].json,
  tables: $node["Verify Tables Exist"].json,
  fields: $node["Verify Critical Fields"].json,
  testData: $node["Test Data Verification"].json,
  timestamp: new Date().toISOString()
};

const allPassed = 
  allChecks.environment.envCheck.missing.length === 0 &&
  allChecks.tables.tableCheck.status.includes('✅') &&
  allChecks.testData.dataCheck.dndEntries >= 2;

return {
  setupComplete: allPassed,
  report: allChecks,
  nextSteps: allPassed ? 
    'Ready for Session 0: Field Normalization' : 
    'Fix issues before proceeding'
};
```

## Step 6: Loop Detection & Troubleshooting (NEW)

### Loop Detection Pattern
If ANY error repeats 3+ times:
1. **STOP** current approach
2. **SEARCH**: `exa.search("n8n [exact error message] workaround")`
3. **DOCUMENT**: Each attempt with exact errors
4. **TRY**: Different approach from search results
5. **ESCALATE**: If still failing after search

### Common Phase 00 Issues

**Table Creation Fails**:
- Verify personal access token has `schema.bases:write` scope
- Use Airtable UI as fallback
- Check base ID is correct

**Fields Won't Add**:
- Check field type compatibility
- For linked fields, verify table IDs
- Use UI for complex types

**Env Vars Not Working**:
- Refresh n8n after setting
- Check exact spelling (case-sensitive)
- Use expression editor to verify

**International Phone Test**:
- Ensure +44 number included in DND
- Verify phone_country_code field exists
- Test with actual international format

## Success Criteria Checklist

- [ ] **Environment**: All 17+ variables configured
- [ ] **Tables**: All 11 tables exist
- [ ] **Fields**: 
  - [ ] People: request_id, qualified_lead, contacted added
  - [ ] People: All tracking fields added
  - [ ] People: International handling fields added
  - [ ] Communications: Compliance fields added
  - [ ] Daily_Metrics: Performance fields added
- [ ] **Test Data**:
  - [ ] DND: 2+ entries (including international)
  - [ ] Workflow_IDs: Current workflows tracked
  - [ ] Daily_Costs: Today's date set
  - [ ] Field_Mapping_Log: Initialized
- [ ] **Verification**: Workflow created and shows all green
- [ ] **Loop Prevention**: MAX_RETRIES=3 configured

## Output Evidence Required

1. **Screenshot**: Verification workflow execution showing all ✅
2. **Query Results**: 
   ```sql
   -- DND List check
   SELECT * FROM DND_List WHERE phone LIKE '+44%'
   
   -- People fields check  
   SHOW FIELDS FROM People WHERE Field IN ('request_id', 'qualified_lead')
   ```
3. **Environment Variables**: Screenshot of n8n variables page
4. **Workflow Export**: `uysp-setup-verification-v1.json`

## Next Steps

Once Phase 00 shows 100% complete:
1. Proceed to **Session 0: Field Normalization**
2. Use the 15+ updated test payloads from reality_based_tests_v2.json
3. Ensure international phone routing logic is included
4. Set up Claude API rate limit handling (100 req/min)

---

*Remember: This phase prevents 90% of implementation failures. Do NOT skip any steps.* },
    
    // International
    'phone_country_code': { type: 'singleLineText' },
    'requires_international_handling': { type: 'checkbox' }
  },
  
  Communications: {
    'tendlc_compliant': { type: 'checkbox' },
    'compliance_errors': { type: 'longText' }
  },
  
  Daily_Metrics: {
    'enrichment_success_rate': { type: 'number' },
    'api_error_rate': { type: 'number' },
    'cache_hit_rate': { type: 'number' },
    'cost_per_meeting': { type: 'currency', symbol: '

### A. Fix Daily_Costs Record

Update existing record with proper date:

```javascript
{
  "date": new Date().toISOString().split('T')[0],  // Today's date
  "apollo_org_costs": 0,
  "apollo_people_costs": 0,
  "twilio_costs": 0,
  "sms_costs": 0,
  "claude_costs": 0,  // NEW field
  "total_costs": 0,
  "budget_remaining": 50,
  "daily_limit": 50
}
```

### B. Load Test Data

**DND_List** (Required for compliance testing):
```javascript
[
  {
    "phone": "+14155551111",
    "email": "donotcontact@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "sms",
    "permanent": true,
    "reason": "Test DND entry - US number"
  },
  {
    "phone": "+447700900123",  // NEW: International test
    "email": "uktest@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "manual",
    "permanent": true,
    "reason": "International DND test"
  }
]
```

**Workflow_IDs** (Track all workflows):
```javascript
[
  {
    "Name": "uysp-lead-processing-v1",
    "id": "eiVyE76nCF9g20zU",
    "created_date": new Date().toISOString(),
    "description": "Main lead processing with field normalization v3",
    "status": "Active",
    "version": "3.0"
  },
  {
    "Name": "uysp-setup-verification-v1",
    "id": "[CREATE AND UPDATE]",
    "created_date": new Date().toISOString(),
    "description": "Phase 00 setup verification",
    "status": "Testing"
  }
]
```

**Field_Mapping_Log** (Initialize with known variations):
```javascript
{
  "timestamp": new Date().toISOString(),
  "webhook_name": "Initial Setup",
  "unknown_fields": JSON.stringify([]),
  "original_payload": "Setup record",
  "mapping_success_rate": 100,
  "reviewed": true
}
```

## Step 5: Create Verification Workflow (15 minutes)

Create `uysp-setup-verification-v1` with these nodes:

### Node 1: Check Environment Variables
```javascript
const requiredVars = [
  'AIRTABLE_BASE_ID', 'TEST_MODE', 'DAILY_COST_LIMIT',
  'APOLLO_ORG_COST', 'APOLLO_PERSON_COST', 'TWILIO_COST',
  'SMS_COST', 'CLAUDE_API_COST', 'MAX_RETRIES'
];

const missing = [];
const configured = {};

requiredVars.forEach(varName => {
  const value = $env[varName];
  if (!value) {
    missing.push(varName);
  } else {
    configured[varName] = value;
  }
});

return {
  envCheck: {
    required: requiredVars.length,
    configured: Object.keys(configured).length,
    missing: missing,
    status: missing.length === 0 ? '✅ All configured' : `❌ Missing ${missing.length}`
  }
};
```

### Node 2: Verify Tables Exist
```javascript
// Check all 11 required tables
const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

// Would connect to Airtable list tables
return { tableCheck: { required: 11, status: 'Check via Airtable' } };
```

### Node 3: Verify Critical Fields
```javascript
// Check for new fields added in 2025
const criticalFields = {
  People: ['request_id', 'qualified_lead', 'contacted', 
           'field_mapping_success_rate', 'phone_country_code'],
  Communications: ['tendlc_compliant', 'compliance_errors'],
  Daily_Metrics: ['field_mapping_success_rate']
};

return { fieldCheck: criticalFields };
```

### Node 4: Test Data Verification
```javascript
// Check for minimum test data
const checks = {
  dndEntries: 2,      // Including international
  workflowIds: 2,
  dailyCosts: 1,
  fieldMappingLog: 1
};

return { dataCheck: checks };
```

### Node 5: Generate Report
```javascript
const allChecks = {
  environment: $node["Check Environment Variables"].json,
  tables: $node["Verify Tables Exist"].json,
  fields: $node["Verify Critical Fields"].json,
  testData: $node["Test Data Verification"].json,
  timestamp: new Date().toISOString()
};

const allPassed = 
  allChecks.environment.envCheck.missing.length === 0 &&
  allChecks.tables.tableCheck.status.includes('✅') &&
  allChecks.testData.dataCheck.dndEntries >= 2;

return {
  setupComplete: allPassed,
  report: allChecks,
  nextSteps: allPassed ? 
    'Ready for Session 0: Field Normalization' : 
    'Fix issues before proceeding'
};
```

## Step 6: Loop Detection & Troubleshooting (NEW)

### Loop Detection Pattern
If ANY error repeats 3+ times:
1. **STOP** current approach
2. **SEARCH**: `exa.search("n8n [exact error message] workaround")`
3. **DOCUMENT**: Each attempt with exact errors
4. **TRY**: Different approach from search results
5. **ESCALATE**: If still failing after search

### Common Phase 00 Issues

**Table Creation Fails**:
- Verify personal access token has `schema.bases:write` scope
- Use Airtable UI as fallback
- Check base ID is correct

**Fields Won't Add**:
- Check field type compatibility
- For linked fields, verify table IDs
- Use UI for complex types

**Env Vars Not Working**:
- Refresh n8n after setting
- Check exact spelling (case-sensitive)
- Use expression editor to verify

**International Phone Test**:
- Ensure +44 number included in DND
- Verify phone_country_code field exists
- Test with actual international format

## Success Criteria Checklist

- [ ] **Environment**: All 17+ variables configured
- [ ] **Tables**: All 11 tables exist
- [ ] **Fields**: 
  - [ ] People: request_id, qualified_lead, contacted added
  - [ ] People: All tracking fields added
  - [ ] People: International handling fields added
  - [ ] Communications: Compliance fields added
  - [ ] Daily_Metrics: Performance fields added
- [ ] **Test Data**:
  - [ ] DND: 2+ entries (including international)
  - [ ] Workflow_IDs: Current workflows tracked
  - [ ] Daily_Costs: Today's date set
  - [ ] Field_Mapping_Log: Initialized
- [ ] **Verification**: Workflow created and shows all green
- [ ] **Loop Prevention**: MAX_RETRIES=3 configured

## Output Evidence Required

1. **Screenshot**: Verification workflow execution showing all ✅
2. **Query Results**: 
   ```sql
   -- DND List check
   SELECT * FROM DND_List WHERE phone LIKE '+44%'
   
   -- People fields check  
   SHOW FIELDS FROM People WHERE Field IN ('request_id', 'qualified_lead')
   ```
3. **Environment Variables**: Screenshot of n8n variables page
4. **Workflow Export**: `uysp-setup-verification-v1.json`

## Next Steps

Once Phase 00 shows 100% complete:
1. Proceed to **Session 0: Field Normalization**
2. Use the 15+ updated test payloads from reality_based_tests_v2.json
3. Ensure international phone routing logic is included
4. Set up Claude API rate limit handling (100 req/min)

---

*Remember: This phase prevents 90% of implementation failures. Do NOT skip any steps.* },
    'field_mapping_success_rate': { type: 'number' }
  }
};

// Node 3: Generate Field Creation Commands
const missingFields = [];
Object.entries(requiredFields).forEach(([table, fields]) => {
  const existing = []; // From schema check
  Object.entries(fields).forEach(([fieldName, config]) => {
    if (!existing.includes(fieldName)) {
      missingFields.push({
        table,
        field: fieldName,
        config,
        command: `airtable-mcp create_field --table ${table} --name "${fieldName}" --type ${config.type}`
      });
    }
  });
});

return {
  totalMissing: missingFields.length,
  byTable: {
    People: missingFields.filter(f => f.table === 'People').length,
    Communications: missingFields.filter(f => f.table === 'Communications').length,
    Daily_Metrics: missingFields.filter(f => f.table === 'Daily_Metrics').length
  },
  commands: missingFields.map(f => f.command)
};

// Node 4: Batch Execute or Output Instructions
```

**Automation Strategy**:
1. Workflow identifies ALL missing fields
2. Generates exact commands for each
3. Either executes via MCP or outputs for manual run
4. Re-run to verify all fields added

## Step 4: Initialize Core Data (AUTOMATED)

### A. Fix Daily_Costs Record

Update existing record with proper date:

```javascript
{
  "date": new Date().toISOString().split('T')[0],  // Today's date
  "apollo_org_costs": 0,
  "apollo_people_costs": 0,
  "twilio_costs": 0,
  "sms_costs": 0,
  "claude_costs": 0,  // NEW field
  "total_costs": 0,
  "budget_remaining": 50,
  "daily_limit": 50
}
```

### B. Load Test Data

**DND_List** (Required for compliance testing):
```javascript
[
  {
    "phone": "+14155551111",
    "email": "donotcontact@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "sms",
    "permanent": true,
    "reason": "Test DND entry - US number"
  },
  {
    "phone": "+447700900123",  // NEW: International test
    "email": "uktest@example.com",
    "opt_out_date": new Date().toISOString(),
    "opt_out_source": "manual",
    "permanent": true,
    "reason": "International DND test"
  }
]
```

**Workflow_IDs** (Track all workflows):
```javascript
[
  {
    "Name": "uysp-lead-processing-v1",
    "id": "eiVyE76nCF9g20zU",
    "created_date": new Date().toISOString(),
    "description": "Main lead processing with field normalization v3",
    "status": "Active",
    "version": "3.0"
  },
  {
    "Name": "uysp-setup-verification-v1",
    "id": "[CREATE AND UPDATE]",
    "created_date": new Date().toISOString(),
    "description": "Phase 00 setup verification",
    "status": "Testing"
  }
]
```

**Field_Mapping_Log** (Initialize with known variations):
```javascript
{
  "timestamp": new Date().toISOString(),
  "webhook_name": "Initial Setup",
  "unknown_fields": JSON.stringify([]),
  "original_payload": "Setup record",
  "mapping_success_rate": 100,
  "reviewed": true
}
```

## Step 5: Create Verification Workflow (15 minutes)

Create `uysp-setup-verification-v1` with these nodes:

### Node 1: Check Environment Variables
```javascript
const requiredVars = [
  'AIRTABLE_BASE_ID', 'TEST_MODE', 'DAILY_COST_LIMIT',
  'APOLLO_ORG_COST', 'APOLLO_PERSON_COST', 'TWILIO_COST',
  'SMS_COST', 'CLAUDE_API_COST', 'MAX_RETRIES'
];

const missing = [];
const configured = {};

requiredVars.forEach(varName => {
  const value = $env[varName];
  if (!value) {
    missing.push(varName);
  } else {
    configured[varName] = value;
  }
});

return {
  envCheck: {
    required: requiredVars.length,
    configured: Object.keys(configured).length,
    missing: missing,
    status: missing.length === 0 ? '✅ All configured' : `❌ Missing ${missing.length}`
  }
};
```

### Node 2: Verify Tables Exist
```javascript
// Check all 11 required tables
const requiredTables = [
  'People', 'Communications', 'Daily_Costs', 'Daily_Metrics',
  'DND_List', 'Error_Log', 'Enrichment_Cache', 'Field_Mapping_Log',
  'Human_Review_Queue', 'Meetings', 'Workflow_IDs'
];

// Would connect to Airtable list tables
return { tableCheck: { required: 11, status: 'Check via Airtable' } };
```

### Node 3: Verify Critical Fields
```javascript
// Check for new fields added in 2025
const criticalFields = {
  People: ['request_id', 'qualified_lead', 'contacted', 
           'field_mapping_success_rate', 'phone_country_code'],
  Communications: ['tendlc_compliant', 'compliance_errors'],
  Daily_Metrics: ['field_mapping_success_rate']
};

return { fieldCheck: criticalFields };
```

### Node 4: Test Data Verification
```javascript
// Check for minimum test data
const checks = {
  dndEntries: 2,      // Including international
  workflowIds: 2,
  dailyCosts: 1,
  fieldMappingLog: 1
};

return { dataCheck: checks };
```

### Node 5: Generate Report
```javascript
const allChecks = {
  environment: $node["Check Environment Variables"].json,
  tables: $node["Verify Tables Exist"].json,
  fields: $node["Verify Critical Fields"].json,
  testData: $node["Test Data Verification"].json,
  timestamp: new Date().toISOString()
};

const allPassed = 
  allChecks.environment.envCheck.missing.length === 0 &&
  allChecks.tables.tableCheck.status.includes('✅') &&
  allChecks.testData.dataCheck.dndEntries >= 2;

return {
  setupComplete: allPassed,
  report: allChecks,
  nextSteps: allPassed ? 
    'Ready for Session 0: Field Normalization' : 
    'Fix issues before proceeding'
};
```

## Step 6: Loop Detection & Troubleshooting (NEW)

### Loop Detection Pattern
If ANY error repeats 3+ times:
1. **STOP** current approach
2. **SEARCH**: `exa.search("n8n [exact error message] workaround")`
3. **DOCUMENT**: Each attempt with exact errors
4. **TRY**: Different approach from search results
5. **ESCALATE**: If still failing after search

### Common Phase 00 Issues

**Table Creation Fails**:
- Verify personal access token has `schema.bases:write` scope
- Use Airtable UI as fallback
- Check base ID is correct

**Fields Won't Add**:
- Check field type compatibility
- For linked fields, verify table IDs
- Use UI for complex types

**Env Vars Not Working**:
- Refresh n8n after setting
- Check exact spelling (case-sensitive)
- Use expression editor to verify

**International Phone Test**:
- Ensure +44 number included in DND
- Verify phone_country_code field exists
- Test with actual international format

## Success Criteria Checklist

- [ ] **Environment**: All 17+ variables configured
- [ ] **Tables**: All 11 tables exist
- [ ] **Fields**: 
  - [ ] People: request_id, qualified_lead, contacted added
  - [ ] People: All tracking fields added
  - [ ] People: International handling fields added
  - [ ] Communications: Compliance fields added
  - [ ] Daily_Metrics: Performance fields added
- [ ] **Test Data**:
  - [ ] DND: 2+ entries (including international)
  - [ ] Workflow_IDs: Current workflows tracked
  - [ ] Daily_Costs: Today's date set
  - [ ] Field_Mapping_Log: Initialized
- [ ] **Verification**: Workflow created and shows all green
- [ ] **Loop Prevention**: MAX_RETRIES=3 configured

## Output Evidence Required

1. **Screenshot**: Verification workflow execution showing all ✅
2. **Query Results**: 
   ```sql
   -- DND List check
   SELECT * FROM DND_List WHERE phone LIKE '+44%'
   
   -- People fields check  
   SHOW FIELDS FROM People WHERE Field IN ('request_id', 'qualified_lead')
   ```
3. **Environment Variables**: Screenshot of n8n variables page
4. **Workflow Export**: `uysp-setup-verification-v1.json`

## Next Steps

Once Phase 00 shows 100% complete:
1. Proceed to **Session 0: Field Normalization**
2. Use the 15+ updated test payloads from reality_based_tests_v2.json
3. Ensure international phone routing logic is included
4. Set up Claude API rate limit handling (100 req/min)

---

*Remember: This phase prevents 90% of implementation failures. Do NOT skip any steps.*