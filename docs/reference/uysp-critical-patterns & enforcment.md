# UYSP Critical Patterns & Enforcement
*The Non-Negotiable Rules That Prevent Project Failure*

## 🚨 MANDATORY PRE-FLIGHT CHECKLIST (BEFORE ANY WEBHOOK WORK)

### Field Normalization Verification
- [ ] Smart Field Mapper node is FIRST after webhook
- [ ] All 10 core field variations mapped
- [ ] Unknown field tracking enabled
- [ ] Test with 10+ payload variations
- [ ] Field_Mapping_Log table exists

### Platform Settings Check
- [ ] "Always Output Data" enabled in UI for ALL IF/Switch nodes
- [ ] Credentials selected via UI (never programmatic)
- [ ] Expression spaces verified: `{{ $json.field }}` ✓
- [ ] Table IDs used, not names: `tblXXXXXX` ✓
- [ ] TEST_MODE=true for development

### Evidence Requirements Ready
- [ ] Airtable verification queries prepared
- [ ] Execution log checks ready
- [ ] Record ID tracking enabled
- [ ] Export workflow process documented

---

## PATTERN 00: FIELD NORMALIZATION - LIFE OR DEATH

### The Discovery That Changed Everything
**What We Thought**: Webhook fields would be consistent
**Reality**: Kajabi sends 15+ variations randomly (email/Email/EMAIL/email_address)
**Impact**: 100% FAILURE RATE without normalization
**Solution**: Smart Field Mapper as MANDATORY first node

### Implementation (NO MODIFICATIONS WITHOUT TESTING)

```javascript
// MANDATORY FIRST NODE AFTER EVERY WEBHOOK
const input = $input.first().json;
const normalized = {};
const mappedFields = new Set();

// Core field mappings - UPDATE WEEKLY from Field_Mapping_Log
const fieldMappings = {
  email: ['email', 'Email', 'EMAIL', 'email_address', 'emailAddress', 'e-mail', 'contact_email', 'EmailAddress', 'user_email', 'primary_email'],
  phone: ['phone', 'Phone', 'PHONE', 'phone_number', 'phoneNumber', 'mobile', 'cellphone', 'telephone', 'cell', 'mobile_number', 'contact_phone'],
  name: ['name', 'Name', 'NAME', 'full_name', 'fullName', 'contact_name', 'display_name', 'user_name', 'customer_name'],
  first_name: ['first_name', 'firstName', 'fname', 'given_name', 'forename', 'FirstName', 'first'],
  last_name: ['last_name', 'lastName', 'lname', 'surname', 'family_name', 'LastName', 'last'],
  company: ['company', 'Company', 'company_name', 'companyName', 'organization', 'org', 'business', 'employer', 'company_name'],
  title: ['title', 'Title', 'job_title', 'jobTitle', 'position', 'role', 'job_role', 'designation'],
  source_form: ['source_form', 'form_name', 'formName', 'source', 'form_id', 'lead_source', 'form'],
  interested_in_coaching: ['interested_in_coaching', 'coaching_interest', 'wants_coaching', 'coaching', 'interest_coaching'],
  linkedin_url: ['linkedin_url', 'linkedin', 'linkedinUrl', 'linkedin_profile', 'linkedIn', 'linkedin_link'],
  request_id: ['request_id', 'requestId', 'request', 'id', 'tracking_id', 'unique_id']
};

// Case-insensitive field finder
function findField(aliases) {
  for (const key of Object.keys(input)) {
    if (aliases.some(alias => alias.toLowerCase() === key.toLowerCase())) {
      mappedFields.add(key);
      return input[key];
    }
  }
  return null;
}

// Map all fields
Object.entries(fieldMappings).forEach(([normalizedName, aliases]) => {
  const value = findField(aliases);
  if (value !== null && value !== undefined && value !== '') {
    normalized[normalizedName] = value;
  }
});

// Critical: Auto-split full name if needed
if (normalized.name && !normalized.first_name) {
  const parts = normalized.name.trim().split(/\s+/);
  normalized.first_name = parts[0] || '';
  normalized.last_name = parts.slice(1).join(' ') || '';
}

// Critical: Handle boolean variations for Airtable
['interested_in_coaching', 'qualified_lead', 'contacted'].forEach(field => {
  if (normalized[field] !== undefined) {
    const val = String(normalized[field]).toLowerCase();
    normalized[field] = ['true', 'yes', '1', 'on', 'y', 'checked'].includes(val);
  }
});

// Track unknown fields for weekly review
const unknownFields = Object.keys(input).filter(k => !mappedFields.has(k));

// Return enriched data structure
return {
  normalized,
  original: input,
  unknownFields,
  mappingSuccess: Object.keys(normalized).length > 0,
  timestamp: new Date().toISOString(),
  fieldsCaptured: Object.keys(normalized).length,
  fieldsTotal: Object.keys(input).length
};

Integration Rules (NON-NEGOTIABLE)ALL downstream nodes reference: $node["Smart Field Mapper"].json.normalized
NEVER reference webhook data directly after this node
If mapping fails (mappingSuccess = false), route to human review
Weekly review of unknownFields in Field_Mapping_Log table

Testing Requirements Test with ALL 10 variations from Testing Protocol
 Verify 95%+ field capture rate
 Check Field_Mapping_Log for unknowns
 Confirm all downstream nodes use normalized data
 Export working configuration

PATTERN 06: REALITY-BASED TESTING PROTOCOLThe Testing Theater That Failed UsWhat We Did (WRONG):✗ Checked HTTP 200 responses
✗ Verified webhook received
✗ Looked at execution "started"
✗ Celebrated green checkmarks

What Actually Matters:✓ Did a record get created in Airtable?
✓ Were ALL fields mapped correctly?
✓ Did the workflow complete end-to-end?
✓ Can we retrieve the record by ID?

Webhook Test Mode Reality CheckCRITICAL: n8n test mode is NOT like productionManual Activation Required: Click "Execute Workflow" BEFORE each test
Single Request Only: Webhook listens for ONE request then stops
External Trigger Required: Use curl/TestSprite/code_execution
Cannot Test from UI: The test button doesn't work for webhooks
Reset Required: Must re-activate for each test

Mandatory Test Payload Set (MINIMUM 10)javascript

const mandatoryTestPayloads = [
  // Test 1: Standard Kajabi format
  { 
    email: 'test1@example.com', 
    name: 'John Doe', 
    phone: '555-0001',
    company: 'Acme Corp',
    source_form: 'webinar-signup'
  },
  
  // Test 2: ALL CAPS variation
  { 
    EMAIL: 'test2@example.com', 
    NAME: 'Jane Doe', 
    PHONE: '555-0002',
    COMPANY: 'Tech Corp'
  },
  
  // Test 3: Mixed case chaos
  { 
    Email: 'test3@example.com', 
    Name: 'Bob Smith', 
    Phone: '555-0003',
    Company: 'StartupCo'
  },
  
  // Test 4: Alternative field names
  { 
    email_address: 'test4@example.com', 
    full_name: 'Alice Johnson', 
    phone_number: '555-0004',
    company_name: 'BigCorp'
  },
  
  // Test 5: Boolean variations - string
  { 
    email: 'test5@example.com',
    interested_in_coaching: 'yes',
    name: 'Charlie Brown'
  },
  
  // Test 6: Boolean variations - boolean
  { 
    email: 'test6@example.com',
    interested_in_coaching: true,
    name: 'David Green'
  },
  
  // Test 7: Boolean variations - numeric
  { 
    email: 'test7@example.com',
    interested_in_coaching: '1',
    name: 'Eve White'
  },
  
  // Test 8: Missing critical fields
  { 
    email: 'test8@example.com'
    // No name, phone, or company
  },
  
  // Test 9: Duplicate test (same as Test 1)
  { 
    email: 'test1@example.com', 
    name: 'John Doe DUPLICATE',
    phone: '555-0001'
  },
  
  // Test 10: International format
  { 
    email: 'test10@example.com',
    phone: '+44 7700 900123',
    name: 'International User'
  }
];

Verification Requirements (ALL MUST PASS)javascript

async function verifyTestSuccess(testEmail, webhookUrl) {
  const results = {
    payload_sent: false,
    webhook_received: false,
    workflow_executed: false,
    airtable_record_created: false,
    all_fields_mapped: false,
    execution_successful: false
  };
  
  // Step 1: Send payload
  console.log(`Testing with email: ${testEmail}`);
  const response = await sendTestPayload(webhookUrl, payload);
  results.payload_sent = response.status === 200;
  
  // Step 2: Wait for processing
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 3: Check Airtable for ACTUAL record
  const records = await airtable.searchRecords({
    tableId: 'tblXXXXXXXXXXXXXX', // Use actual table ID
    filter: `{email} = '${testEmail}'`
  });
  
  results.airtable_record_created = records.length > 0;
  
  if (records.length > 0) {
    // Step 4: Verify field mapping
    const record = records[0];
    const expectedFields = ['email', 'first_name', 'last_name', 'phone', 'company'];
    const mappedFields = Object.keys(record.fields);
    results.all_fields_mapped = expectedFields.every(f => mappedFields.includes(f));
    
    // Step 5: Check execution logs
    const execution = await n8n.getLatestExecution();
    results.workflow_executed = execution.status === 'success';
    results.execution_successful = !execution.error;
  }
  
  // Step 6: Generate evidence
  const evidence = {
    recordId: records[0]?.id || 'NOT_CREATED',
    executionId: execution?.id || 'NOT_FOUND',
    fieldsCaptured: Object.keys(records[0]?.fields || {}).length,
    testTimestamp: new Date().toISOString()
  };
  
  return { results, evidence };
}

Success Criteria Checklist100% of test emails create records
95%+ field mapping success rate  
Zero workflow execution errors
All duplicates handled correctly (updated, not created)
Boolean conversions working
International phones handled
Missing fields don't break flow

Evidence Required for "Complete"Screenshot of n8n executions showing all "Success"
Airtable record IDs for all 10 test emails
Execution IDs from n8n for all tests
Field mapping report showing capture rates
Exported workflow JSON saved to backups/
Field_Mapping_Log entries showing unknowns

CRITICAL PLATFORM GOTCHAS1. "Always Output Data" ToggleLocation: Settings tab (NOT Parameters tab)
Required for: ALL IF and Switch nodes
Symptom: "No output data returned" errors
Fix: Human must manually enable in UI
API Access: NONE - Cannot be set programmatically

2. Credential Corruption BugTrigger: ANY programmatic workflow update
Result: Credential IDs set to null
Symptom: "No authentication data defined on node!"
Fix: Human re-selects credential in UI
Prevention: NEVER update workflows via MCP

3. Expression Syntax Space RequirementCorrect: {{ $json.field }} (with spaces)
Wrong: {{$json.field}} (no spaces)
Result: Silent failure, empty values
No Error: Fails without any warning

4. Webhook Test Mode BehaviorNot Like Production: Requires manual trigger
Process: Execute Workflow → Send request → Stop
Each Test: Must click Execute Workflow again
Common Error: Sending multiple tests without re-activation

5. Table Reference RequirementsCorrect: tblXXXXXXXXXXXXXX (table ID)
Wrong: People (table name)
Result: Intermittent "table not found" errors
Fix: Always use IDs from Airtable UI

ENFORCEMENT RULES FOR CURSOR AIRule 1: Tools Work - Zero Tolerance for LiesWhen Cursor claims "I don't have access to tools":

VIOLATION. The tools work. Prove your claim:
1. Show exact command attempted
2. Show exact error message
3. Show 3 retry attempts with delays
4. Show web_search for solution
5. Use code_execution as backup

No evidence = You're lying.

Standardize audits: Use format <tool_audit><command>exact command</command><error>exact error</error><retries>3 attempts</retries></tool_audit>.Rule 2: Evidence-Based Success OnlyWhen Cursor claims "Successfully created!":

PROVE IT. Show me:
- Workflow ID: ___
- Execution ID: ___
- Airtable Record IDs: ___
- Field mapping success rate: ___%
- Screenshot of working result

No IDs = Didn't happen.

Rule 3: System-Wide Testing RequiredWhen Cursor fixes one component:

STOP. Test the ENTIRE system:
1. Webhook receives data?
2. Field mapper normalizes?
3. Airtable search works?
4. Create/Update logic correct?
5. All data flows through?

One fix often breaks three things.

Rule 4: Field Normalization is MandatoryFor EVERY webhook integration:

REQUIREMENT CHECKLIST:
[ ] Smart Field Mapper is first node
[ ] All field variations handled
[ ] Unknown fields logged
[ ] Downstream uses normalized only
[ ] 10 payload tests complete

Rule 5: No Isolated FixesThe Cascade Failure Pattern:

"Fixed credential!" → Broke connections
"Fixed connections!" → Broke field references  
"Fixed fields!" → Broke Airtable search
"Fixed search!" → Original credential broken

ALWAYS test full workflow after ANY change.

Rule 6: Loop Detection EnforcementWhen Cursor repeats an action/fix 3+ times: LOOP DETECTED. You've tried this 3 times. 1. STOP the current approach 2. Run: web_search 'n8n [exact error message]' 3. Document each attempt clearly 4. Try different approach from search 5. Escalate to PM if still failing Example: "Fixed webhook!" → Test fails → "Fixed webhook!" → STOP.VIOLATION EXAMPLES FROM ACTUAL FAILURESExample 1: The "No Access" Lie

Cursor: "I cannot access MCP tools to create the workflow"
Reality: Used same tools 5 minutes earlier
Evidence: User confirmed tools working
Result: 2 hours wasted on manual steps

Example 2: The False Success

Cursor: "Successfully created the workflow! It's working perfectly!"
Reality: Zero records created in Airtable
Evidence: Workflow had no field normalization
Result: 100% failure rate on all leads

Example 3: The Isolation Fix Disaster

Cursor: "Found the issue - fixing the webhook authentication"
Reality: Fix broke field normalization
Next: "Fixing field normalization"  
Reality: Broke duplicate detection
Next: "Fixing duplicate detection"
Reality: Broke Airtable connection
Result: 12 hours, nothing working

Example 4: Testing Theater

Cursor: "All tests passing! ✅✅✅"
Reality: Only checking HTTP 200 responses
Evidence: No Airtable records created
Result: False confidence, complete failure

WEEKLY REVIEW REQUIREMENTSField Mapping AnalysisQuery Field_Mapping_Log for unknown fields
Identify patterns in unknowns
Add legitimate variations to mapper
Update normalization code
Retest with new variations

Testing Coverage CheckReview test success rates
Identify edge cases missed
Add new test scenarios
Update verification scripts
Document new requirements

Platform Gotcha ReviewCheck for new n8n quirks discovered
Document workarounds found
Update UI instruction guides
Share findings with team

Loop Pattern Analysis: Review logs for repeated errors; update rules if new loops found.SUCCESS METRICSComponent Complete CriteriaAll patterns implemented exactly as specified
10+ test payloads processed successfully
Evidence documented (IDs, screenshots)
Workflow exported and backed up
No errors in last 5 executions
Field normalization achieving 95%+ capture
Human review queue < 5% of volume

Red Flags Requiring Immediate StopAny webhook without field normalization
Success claims without evidence
Testing without Airtable verification
Fixes without full system testing
Platform gotchas ignored

This document represents hard-won lessons from 50+ hours of failures. Every rule exists because ignoring it caused catastrophic failure. There are no exceptions.

