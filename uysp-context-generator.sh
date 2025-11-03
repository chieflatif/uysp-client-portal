bash

#!/bin/bash

# UYSP Complete Context Engineering Package
# This script creates all session-specific context documents for Cursor AI
# Validated and Finalized: July 22, 2025
# Changes: Completed Session 6; Updated Claude model to claude-4-opus-20250514; TCPA hour <=21; Added error handling

echo "=== UYSP Context Engineering Document Generator ==="
echo "Creating focused session documents for Cursor AI environment"
echo ""

# Set the base path (make dynamic if needed)
CURSOR_PROJECT="${CURSOR_PROJECT:-/Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1}"

# Create all session directories with error check
for i in {0..7}; do
    mkdir -p "$CURSOR_PROJECT/context/session-$i" || { echo "Error: Failed to create directory session-$i"; exit 1; }
done

echo "Creating session-specific context documents..."

# ========== SESSION 0: Field Normalization ==========
cat > "$CURSOR_PROJECT/context/session-0/README.md" << 'EOF'
# Session 0: Field Normalization Implementation

## What You're Building
A Smart Field Mapper that normalizes all webhook field variations into a consistent schema. This component processes 15+ variations of field names (email/Email/EMAIL/email_address) and ensures 95%+ field capture rate.

## Why This Matters
**CRITICAL**: Without field normalization, the system has a 100% FAILURE RATE. Webhooks send unpredictable field variations, and missing this component means zero records will be created in Airtable. This discovery came from 50+ hours of catastrophic failures.

## Prerequisites
- [ ] Pattern 00 loaded from patterns/00-field-normalization-mandatory.txt
- [ ] Test payloads ready (10 variations minimum)
- [ ] Field_Mapping_Log table exists in Airtable
- [ ] Understanding that this MUST be first node after webhook

## Deliverables
1. Smart Field Mapper implementation (Code node)
2. Test results showing 95%+ field capture rate
3. Unknown field tracking to Field_Mapping_Log
4. Exported component as reusable workflow

## Critical Requirements
1. MUST handle case-insensitive field matching
2. MUST track unknown fields for weekly review
3. MUST auto-split full names into first/last
4. MUST handle boolean conversions (yes/true/1 → true)
5. MUST be positioned IMMEDIATELY after webhook

## Success Metrics
- Field capture rate: 95%+ across all test payloads
- Zero workflow errors on missing fields
- All unknown fields logged for review
- Component exported and reusable
EOF

cat > "$CURSOR_PROJECT/context/session-0/pattern.md" << 'EOF'
# Implementation Pattern: Smart Field Mapper

## Critical Code Block: Field Normalization
```javascript
// COPY THIS EXACTLY - NO MODIFICATIONS
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

Integration PointsMUST use: This output in ALL downstream nodes via $node["Smart Field Mapper"].json.normalized
MUST check: mappingSuccess before proceeding
MUST handle: Unknown fields by logging to Field_Mapping_Log
MUST NOT: Reference original webhook data after this node
EOF

cat > "$CURSOR_PROJECT/context/session-0/tests.md" << 'EOF'Test Requirements: Session 0Test Payloads (ALL 10 REQUIRED)javascript

// Test 1: Standard Kajabi format
{ email: 'test1@example.com', name: 'John Doe', phone: '555-0001', company: 'Acme Corp' }

// Test 2: ALL CAPS variation
{ EMAIL: 'test2@example.com', NAME: 'Jane Doe', PHONE: '555-0002' }

// Test 3: Mixed case
{ Email: 'test3@example.com', Name: 'Bob Smith', Phone: '555-0003' }

// Test 4: Alternative field names
{ email_address: 'test4@example.com', full_name: 'Alice Johnson', phone_number: '555-0004' }

// Test 5: Underscore variations
{ first_name: 'Charlie', last_name: 'Brown', email_address: 'test5@example.com' }

// Test 6: CamelCase
{ emailAddress: 'test6@example.com', firstName: 'David', lastName: 'Green' }

// Test 7: Boolean strings
{ email: 'test7@example.com', interested_in_coaching: 'yes', qualified_lead: 'true' }

// Test 8: Boolean values
{ email: 'test8@example.com', interested_in_coaching: true, contacted: 1 }

// Test 9: Missing fields
{ email: 'test9@example.com' }

// Test 10: Unknown fields
{ email: 'test10@example.com', custom_field_xyz: 'value', another_unknown: 'data' }

Verification StepsCreate test workflow with Webhook → Smart Field Mapper → Debug nodes
For each payload:Send via curl/TestSprite
Check normalized output contains email
Verify capture rate >= 90%
Confirm unknownFields array populated correctly
Check Field_Mapping_Log for unknown field entries

Expected ResultsTests 1-8: 90-100% field capture rate
Test 9: Low capture rate but no errors
Test 10: Unknown fields tracked in unknownFields array
All tests: mappingSuccess = true (except empty payloads)
EOF

cat > "$CURSOR_PROJECT/context/session-0/evidence.md" << 'EOF'Evidence Requirements: Session 0After completing Smart Field Mapper, provide:

COMPONENT: Smart Field Mapper
STATUS: Complete
EVIDENCE:
- Workflow ID: uysp-field-mapper-test-v1
- Execution IDs: [List all 10 test execution IDs]
- Field Capture Rates:
  - Test 1: ___%
  - Test 2: ___%
  - Test 3: ___%
  - Test 4: ___%
  - Test 5: ___%
  - Test 6: ___%
  - Test 7: ___%
  - Test 8: ___%
  - Test 9: ___%
  - Test 10: ___%
- Average Capture Rate: ___%
- Unknown Fields Logged: [Count]
- Export Location: workflows/backups/session-0-field-mapper.json

Required Screenshots:Workflow overview showing Smart Field Mapper position
Test execution results showing normalized output
Field_Mapping_Log entries (if any unknowns)
EOF

========== SESSION 1: Foundation ==========cat > "$CURSOR_PROJECT/context/session-1/README.md" << 'EOF'Session 1: Foundation - Webhook & Data FlowWhat You're BuildingThe foundational data flow: webhook reception with authentication, test mode enforcement, identity resolution via Airtable, and duplicate prevention with create/update logic.Why This MattersThis establishes the core pipeline that all other components depend on. Without proper webhook handling and duplicate prevention, the system will create multiple records for the same person, corrupting data integrity.PrerequisitesSession 0 complete (Field Mapper ready)
Pattern 01 loaded (core patterns)
Airtable People table has required fields
Environment variables set (TEST_MODE=true)
Webhook authentication key created

DeliverablesAuthenticated webhook receiver
Test mode enforcement logic
Airtable identity resolution (search by email/phone)
Create/Update branching logic
Complete data flow test

Critical RequirementsSmart Field Mapper MUST be imported from Session 0
Use table IDs not names: tblXXXXXXXXXXXXXX
Enable "Always Output Data" on IF nodes (UI setting)
Expression spacing: {{ $json.field }} not {{$json.field}}
Test with duplicate scenarios

Success MetricsWebhook returns 200 OK for valid requests
Test mode properly enforced
No duplicate records created
Updates work for existing records
Field normalization integrated correctly
EOF

cat > "$CURSOR_PROJECT/context/session-1/pattern.md" << 'EOF'Implementation Pattern: Webhook & Airtable IntegrationWebhook Receiver Configurationjavascript

// Node: Webhook
Type: n8n-nodes-base.webhook
Settings:
  HTTP Method: POST
  Path: kajabi-leads
  Authentication: Header Auth
  Header Auth:
    Name: X-API-Key
    Value: {{ $credentials.webhookApiKey }}
  Response Code: 200
  Response Data: { "status": "received", "id": "{{ $json.request_id }}" }

Import Field Normalizationjavascript

// Node: Execute Workflow - Field Normalizer
Type: n8n-nodes-base.executeWorkflow
Settings:
  Source: Database
  Workflow: uysp-field-normalizer-v1
  Mode: Run Once for All Items

Test Mode Checkjavascript

// Node: Check Test Mode
Type: n8n-nodes-base.code
const testMode = $env.TEST_MODE === 'true';
const normalized = $json.normalized;

return {
  ...normalized,
  test_mode_record: testMode,
  processing_mode: testMode ? 'test' : 'production',
  timestamp: new Date().toISOString()
};

Identity Resolutionjavascript

// Node: Search Existing Records
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF  // Use YOUR base ID
Table ID: tblXXXXXXXXXXXXXX  // Use People table ID
Options:
  Filter By Formula: OR({email} = '{{ $json.email }}', {phone_primary} = '{{ $json.phone }}')
  Return All: true
Settings Tab:
  Always Output Data: ON  // CRITICAL UI SETTING

Duplicate Prevention Logicjavascript

// Node: Route Create vs Update
Type: n8n-nodes-base.switch
Mode: Rules
Rules:
  - When: {{ $json.length > 0 }}
    Output: Update Existing
  - When: {{ $json.length === 0 }}
    Output: Create New
Settings Tab:
  Always Output Data: ON  // CRITICAL UI SETTING

Create Branchjavascript

// Node: Create New Record
Type: n8n-nodes-base.airtable
Operation: Create
Base ID: appuBf0fTe8tp8ZaF
Table ID: tblXXXXXXXXXXXXXX
Fields:
  email: {{ $json.email }}
  first_name: {{ $json.first_name }}
  last_name: {{ $json.last_name }}
  phone_primary: {{ $json.phone }}
  company_input: {{ $json.company }}
  test_mode_record: {{ $json.test_mode_record }}
  created_date: {{ $now.toISO() }}
  request_id: {{ $json.request_id }}
  field_mapping_success_rate: {{ $json.captureRate }}

Update Branchjavascript

// Node: Update Existing Record
Type: n8n-nodes-base.airtable
Operation: Update
Base ID: appuBf0fTe8tp8ZaF
Table ID: tblXXXXXXXXXXXXXX
Record ID: {{ $json[0].id }}
Fields:
  // Update only changed fields
  last_activity: {{ $now.toISO() }}
  duplicate_count: {{ ($json[0].fields.duplicate_count || 0) + 1 }}

EOFcat > "$CURSOR_PROJECT/context/session-1/tests.md" << 'EOF'Test Requirements: Session 1Test ScenariosTest 1: Basic Webhook Receptionbash

curl -X POST https://[your-n8n-url]/webhook/kajabi-leads \
  -H "X-API-Key: [your-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "session1-test1@example.com",
    "name": "Test User One",
    "phone": "555-1001",
    "company": "Test Corp",
    "request_id": "session1-test-001"
  }'

Expected: 200 OK, Airtable record createdTest 2: Duplicate PreventionSend same payload again:bash

# Same as Test 1

Expected: 200 OK, Same record updated (not new record)Test 3: Missing Fieldsbash

curl -X POST https://[your-n8n-url]/webhook/kajabi-leads \
  -H "X-API-Key: [your-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "minimal@example.com",
    "request_id": "session1-test-003"
  }'

Expected: 200 OK, Record created with minimal dataTest 4: Invalid Authenticationbash

curl -X POST https://[your-n8n-url]/webhook/kajabi-leads \
  -H "X-API-Key: wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

Expected: 401 UnauthorizedVerification StepsCheck n8n execution logs for each test
Query Airtable for created records
Verify test_mode_record = true
Confirm duplicate_count increments
EOF

cat > "$CURSOR_PROJECT/context/session-1/evidence.md" << 'EOF'Evidence Requirements: Session 1After completing foundation workflow:

COMPONENT: Foundation Webhook & Data Flow
STATUS: Complete
EVIDENCE:
- Workflow ID: uysp-lead-processing-v1
- Webhook URL: /webhook/kajabi-leads
- Test Executions:
  - Test 1 (create): [execution-id]
  - Test 2 (update): [execution-id]
  - Test 3 (minimal): [execution-id]
  - Test 4 (auth fail): [execution-id]
- Airtable Records:
  - session1-test1@example.com: rec[xxx]
  - minimal@example.com: rec[xxx]
- Duplicate Prevention: Confirmed working
- Field Normalization: Integrated from Session 0
- Export Location: workflows/backups/session-1-foundation.json

Platform Gotchas Checked:"Always Output Data" enabled on Switch node
Table IDs used (not names)
Expression spacing correct
Credentials selected in UI
EOF

========== SESSION 2: Compliance & Safety ==========cat > "$CURSOR_PROJECT/context/session-2/README.md" << 'EOF'Session 2: Compliance & Safety ControlsWhat You're BuildingComprehensive SMS compliance system including DND list checking, TCPA time window validation, monthly SMS limit enforcement, and 10DLC registration status verification.Why This MattersSending SMS without proper compliance can result in legal penalties, carrier blocking, and damaged reputation. These controls prevent violations before they happen.PrerequisitesSession 1 complete (foundation working)
Pattern 02 loaded (compliance patterns)
DND_List table has test entries
Understanding of TCPA regulations
SMS limits configured (1000/month pre-10DLC)

DeliverablesDND list check implementation
Time window validation (8am-9pm local)
Monthly SMS count tracking
SMS pre-flight check combining all validations
Compliance tracking in Communications table

Critical RequirementsDND check MUST happen before ANY SMS attempt
Time windows based on recipient timezone (via area code)
Monthly limits enforced (1000 pre-10DLC)
All compliance checks logged
Violations must halt processing

Success MetricsZero SMS sent to DND numbers
Zero SMS sent outside time windows
Monthly limits never exceeded
All compliance checks tracked
Clear error messages for violations
EOF

cat > "$CURSOR_PROJECT/context/session-2/pattern.md" << 'EOF'Implementation Pattern: SMS Compliance GatesDND List Checkjavascript

// Node: Check DND List
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF
Table ID: [DND_List table ID]
Options:
  Filter By Formula: OR({phone} = '{{ $json.normalized.phone }}', {email} = '{{ $json.normalized.email }}')
  Return All: true
Settings:
  Always Output Data: ON

Monthly SMS Countjavascript

// Node: Get Monthly SMS Count
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF
Table ID: [Communications table ID]
Options:
  Filter By Formula: AND({sent_time} >= '{{ $now.startOf('month').toISO() }}', {message_type} = 'SMS')
  Return All: true

Time Window Validationjavascript

// Node: Check Time Window
Type: n8n-nodes-base.code

// Area code to timezone mapping
const areaCodeTimezones = {
  '415': 'America/Los_Angeles',
  '212': 'America/New_York',
  '312': 'America/Chicago',
  '713': 'America/Chicago',
  // Add more as needed
};

function getTimezoneFromPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const areaCode = cleaned.substring(1, 4); // Skip country code
  return areaCodeTimezones[areaCode] || 'America/Chicago'; // Default to Central
}

const phone = $json.normalized.phone;
const timezone = getTimezoneFromPhone(phone);
const localTime = DateTime.now().setZone(timezone);
const hour = localTime.hour;

const inWindow = hour >= 8 && hour <= 21;

return {
  ...$json,
  recipient_timezone: timezone,
  local_time: localTime.toISO(),
  local_hour: hour,
  time_window_valid: inWindow,
  time_window_reason: inWindow ? 'Within 8am-9pm' : `Outside window (${hour}:00 local)`
};

Combined Pre-flight Checkjavascript

// Node: SMS Pre-flight Check
Type: n8n-nodes-base.code

const dndResults = $node["Check DND List"].json;
const monthlyCount = $node["Get Monthly SMS Count"].json.length;
const timeCheck = $json;

const checks = {
  dnd_clear: dndResults.length === 0,
  monthly_limit_ok: monthlyCount < 1000,
  time_window_ok: timeCheck.time_window_valid,
  tendlc_ok: $env.TEN_DLC_REGISTERED === 'true' || monthlyCount < 1000,
  test_mode: $env.TEST_MODE === 'true'
};

const violations = [];
if (!checks.dnd_clear) violations.push('Number on DND list');
if (!checks.monthly_limit_ok) violations.push('Monthly SMS limit exceeded');
if (!checks.time_window_ok) violations.push(timeCheck.time_window_reason);
if (!checks.tendlc_ok) violations.push('10DLC registration required');

const canSend = violations.length === 0 || checks.test_mode;

return {
  ...$json,
  compliance_checks: checks,
  compliance_violations: violations,
  can_send_sms: canSend,
  compliance_timestamp: new Date().toISOString()
};

Route Based on Compliancejavascript

// Node: Route by Compliance
Type: n8n-nodes-base.switch
Mode: Rules
Rules:
  - When: {{ $json.can_send_sms === true }}
    Output: Proceed to SMS
  - When: {{ $json.can_send_sms === false }}
    Output: Compliance Violation
Settings:
  Always Output Data: ON

EOFcat > "$CURSOR_PROJECT/context/session-2/tests.md" << 'EOF'Test Requirements: Session 2Test Data SetupAdd to DND_List table:javascript

[
  {
    phone: "+14155551111",
    email: "donotcontact@example.com",
    opt_out_date: new Date().toISOString(),
    permanent: true
  },
  {
    phone: "+14155552222",
    email: "optout@example.com",
    opt_out_date: new Date().toISOString(),
    permanent: true
  }
]

Test ScenariosTest 1: Clean Number (Should Pass)json

{
  "email": "clean@example.com",
  "phone": "4155553333",
  "name": "Clean Test"
}

Expected: All compliance checks passTest 2: DND Number (Should Fail)json

{
  "email": "test@example.com",
  "phone": "4155551111",
  "name": "DND Test"
}

Expected: Blocked - "Number on DND list"Test 3: DND Email (Should Fail)json

{
  "email": "donotcontact@example.com",
  "phone": "4155559999",
  "name": "DND Email Test"
}

Expected: Blocked - "Number on DND list" (email match)Test 4: Time Window TestRun during business hours (8am-9pm): Should pass
Run after 9pm or before 8am: Should fail

Test 5: Monthly Limit TestSet monthly count to 999 in test
Next SMS should pass
Set to 1000+: Should fail

Verification StepsCheck compliance_checks object contains all fields
Verify violations array populated correctly
Confirm routing works based on can_send_sms
Check TEST_MODE override works
EOF

cat > "$CURSOR_PROJECT/context/session-2/evidence.md" << 'EOF'Evidence Requirements: Session 2After completing compliance system:

COMPONENT: SMS Compliance Controls
STATUS: Complete
EVIDENCE:
- Workflow ID: uysp-lead-processing-v1
- Node Count: [previous + 5 new nodes]
- Test Results:
  - Clean number: PASSED [execution-id]
  - DND phone: BLOCKED [execution-id]
  - DND email: BLOCKED [execution-id]
  - Time window: [PASSED/BLOCKED] [execution-id]
  - Monthly limit: [PASSED/BLOCKED] [execution-id]
- Compliance Features:
  - DND checking: ✓
  - Time windows: ✓
  - Monthly limits: ✓
  - 10DLC check: ✓
- Export Location: workflows/backups/session-2-compliance.json

Compliance Tracking Verified:All checks logged to compliance_checks object
Violations tracked in array
TEST_MODE allows bypass for testing
Clear error messages for each violation type
EOF

========== SESSION 3: Qualification & Enrichment ==========cat > "$CURSOR_PROJECT/context/session-3/README.md" << 'EOF'Session 3: Qualification & EnrichmentWhat You're BuildingTwo-phase qualification system that first checks if the company is B2B tech ($0.01), then enriches person data only if qualified ($0.025). Includes ICP scoring, cost tracking, and human review routing.Why This MattersThis saves significant money by filtering out 72% of leads before expensive person enrichment. It ensures we only spend on leads that match our ICP.PrerequisitesSessions 1-2 complete
Pattern 03 loaded (enrichment patterns)
Apollo API credentials configured
Daily_Costs table initialized
Understanding of two-phase logic

DeliverablesCompany qualification (Apollo Org API)
Person enrichment (Apollo People API)
ICP scoring with Claude AI
Cost tracking per API call
Human review routing for unclear cases

Critical RequirementsCheck costs BEFORE every API call
Cache enrichment data (90 days)
Route international phones to human review
Track which phase each lead reaches
Domain fallback if Claude fails

Success Metrics72% filtered at Phase 1 (saving money)
ICP scores assigned to qualified leads
Costs tracked accurately
International numbers routed correctly
Human review queue populated
EOF

cat > "$CURSOR_PROJECT/context/session-3/pattern.md" << 'EOF'Implementation Pattern: Two-Phase QualificationCost Check Before APIsjavascript

// Node: Get Today's Costs
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF
Table ID: [Daily_Costs table ID]
Options:
  Filter By Formula: {date} = '{{ $now.toFormat('yyyy-MM-dd') }}'
  Return All: false
  Limit: 1

javascript

// Node: Check Cost Limit
Type: n8n-nodes-base.code
const currentCosts = $json[0]?.fields?.total_costs || 0;
const nextCost = 0.01; // Apollo Org API
const dailyLimit = parseFloat($env.DAILY_COST_LIMIT || '50');

if (currentCosts + nextCost > dailyLimit) {
  throw new Error(`Daily cost limit exceeded: ${currentCosts} + ${nextCost} > ${dailyLimit}`);
}

return {
  ...$input.item.json,
  costs_checked: true,
  current_daily_spend: currentCosts,
  cost_headroom: dailyLimit - currentCosts
};

Phase 1: Company Qualificationjavascript

// Node: Check Known B2B Domains First
Type: n8n-nodes-base.code
const knownB2B = [
  'salesforce.com', 'hubspot.com', 'microsoft.com', 'oracle.com',
  'adobe.com', 'slack.com', 'zoom.us', 'atlassian.com'
];

const email = $json.normalized.email;
const domain = email.split('@')[1]?.toLowerCase();

const isKnownB2B = knownB2B.includes(domain);

return {
  ...$json,
  domain,
  known_b2b: isKnownB2B,
  skip_apollo_org: isKnownB2B
};

javascript

// Node: Apollo Organization API
Type: n8n-nodes-base.httpRequest
Method: GET
URL: https://api.apollo.io/v1/organizations/enrich
Authentication: Generic
Generic Auth Type: Header
Header Name: X-Api-Key
Header Value: {{ $credentials.apolloApiKey }}
Query Parameters:
  domain: {{ $json.domain }}
  
// Only runs if NOT known B2B

javascript

// Node: Process Phase 1 Result
Type: n8n-nodes-base.code
const apolloResult = $json;
const company = apolloResult.organization || {};

// B2B Tech indicators
const b2bKeywords = ['software', 'saas', 'technology', 'cloud', 'data', 'ai', 'platform'];
const industry = (company.industry || '').toLowerCase();
const description = (company.description || '').toLowerCase();

const isB2BTech = 
  company.is_public === false && // Not consumer brand
  (b2bKeywords.some(kw => industry.includes(kw)) ||
   b2bKeywords.some(kw => description.includes(kw)));

return {
  ...$input.item.json,
  company_enriched: company.name || $json.company,
  company_size: company.estimated_num_employees,
  industry: company.industry,
  phase1_passed: isB2BTech,
  phase1_reason: isB2BTech ? 'B2B Tech confirmed' : 'Not B2B Tech',
  apollo_org_cost: 0.01
};

Phase 2: Person Enrichment (Only if Phase 1 Passes)javascript

// Node: Apollo People API
Type: n8n-nodes-base.httpRequest
Method: GET
URL: https://api.apollo.io/v1/people/enrich
Authentication: Generic
Query Parameters:
  email: {{ $json.normalized.email }}
  
// Add cost check before this node

javascript

// Node: Process Phase 2 Result
Type: n8n-nodes-base.code
const person = $json.person || {};
const title = (person.title || '').toLowerCase();

// Sales role indicators
const salesKeywords = ['sales', 'account executive', 'business development', 'revenue'];
const nonSalesKeywords = ['engineer', 'support', 'marketing', 'success', 'analyst'];

const isSalesRole = 
  salesKeywords.some(kw => title.includes(kw)) &&
  !nonSalesKeywords.some(kw => title.includes(kw));

return {
  ...$input.item.json,
  title_current: person.title,
  linkedin_url: person.linkedin_url,
  phone_enriched: person.phone,
  phase2_passed: isSalesRole,
  phase2_reason: isSalesRole ? 'Sales role confirmed' : 'Non-sales role',
  apollo_person_cost: 0.025
};

ICP Scoringjavascript

// Node: ICP Score with Claude
Type: n8n-nodes-base.httpRequest
Method: POST
URL: https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {{ $credentials.claudeApiKey }}
  anthropic-version: 2023-06-01
Body:
{
  "model": "claude-4-opus-20250514",
  "max_tokens": 10,
  "messages": [{
    "role": "user",
    "content": "Score this sales professional 0-100:\nTitle: {{ $json.title_current }}\nCompany: {{ $json.company_enriched }}\nCompany Size: {{ $json.company_size }}\n\nReturn ONLY the number."
  }]
}

Human Review Routingjavascript

// Node: Determine Routing
Type: n8n-nodes-base.code
const score = parseInt($json.icp_score) || 0;
const hasPhone = !!($json.phone_primary || $json.phone_enriched);
const isInternational = $json.phone && !$json.phone.startsWith('+1');

let routing;
if (isInternational) routing = 'human_review';
else if (score >= 70 && hasPhone) routing = 'auto_qualify';
else if (score >= 70 && !hasPhone) routing = 'needs_phone';
else if (score < 70) routing = 'archive';
else routing = 'human_review';

return {
  ...$json,
  routing,
  routing_reason: `Score: ${score}, Phone: ${hasPhone}, Intl: ${isInternational}`
};

EOFcat > "$CURSOR_PROJECT/context/session-3/tests.md" << 'EOF'Test Requirements: Session 3Test ScenariosTest 1: Known B2B Domainjson

{
  "email": "test@salesforce.com",
  "name": "SF Test",
  "company": "Salesforce"
}

Expected: Skip Apollo Org API, proceed to Phase 2Test 2: Unknown Domain - B2B Techjson

{
  "email": "test@techstartup.io",
  "name": "Startup Test",
  "company": "TechStartup Inc"
}

Expected: Apollo Org API → Pass → Phase 2Test 3: Non-B2B Companyjson

{
  "email": "test@restaurant.com",
  "name": "Restaurant Test",
  "company": "Local Restaurant"
}

Expected: Apollo Org API → Fail → ArchiveTest 4: Sales Rolejson

{
  "email": "ae@b2bcompany.com",
  "name": "Account Exec",
  "title": "Senior Account Executive"
}

Expected: Phase 1 → Phase 2 → High ICP scoreTest 5: Non-Sales Rolejson

{
  "email": "engineer@b2bcompany.com",
  "name": "Engineer Test",
  "title": "Software Engineer"
}

Expected: Phase 1 → Phase 2 → Human reviewTest 6: International Phonejson

{
  "email": "test@ukcompany.co.uk",
  "phone": "+44 7700 900123",
  "name": "UK Test"
}

Expected: Route to human reviewTest 7: Cost LimitSet daily costs near limit
Process lead
Expected: Cost check blocks processing

Verification StepsVerify Phase 1 costs: $0.01 per lead
Verify Phase 2 only runs if Phase 1 passes
Check ICP scores assigned
Confirm routing logic works
Verify costs tracked in Daily_Costs
EOF

cat > "$CURSOR_PROJECT/context/session-3/evidence.md" << 'EOF'Evidence Requirements: Session 3After completing qualification system:

COMPONENT: Two-Phase Qualification & Enrichment
STATUS: Complete
EVIDENCE:
- Workflow Updates:
  - Node Count: [previous + 8-10 new nodes]
  - New branches: Phase 1/2, ICP Scoring, Routing
- Test Results:
  - Known B2B: Skipped API [execution-id]
  - Unknown B2B: Qualified [execution-id]
  - Non-B2B: Archived [execution-id]
  - Sales role: Score ___ [execution-id]
  - Non-sales: Human review [execution-id]
  - International: Human review [execution-id]
  - Cost limit: Blocked [execution-id]
- Cost Tracking:
  - Apollo Org: $0.01 logged ✓
  - Apollo Person: $0.025 logged ✓
  - Daily total updated ✓
- ICP Scoring:
  - Claude API working ✓
  - Scores 0-100 assigned ✓
  - Fallback ready ✓
- Export Location: workflows/backups/session-3-qualification.json

Routing Verification:Score 70+ with phone → auto_qualify
Score 70+ no phone → needs_phone
Score <70 → archive
International → human_review
Unclear → human_review
EOF

========== SESSION 4: SMS Sending ==========cat > "$CURSOR_PROJECT/context/session-4/README.md" << 'EOF'Session 4: SMS Sending ImplementationWhat You're BuildingComplete SMS sending system with phone validation, template personalization, SimpleTexting integration, tracking link generation, and delivery status handling.Why This MattersThis is where qualified leads actually receive messages. Poor implementation here means no meetings booked, wasted enrichment costs, and potential compliance violations.PrerequisitesSessions 1-3 complete
Pattern 04 loaded (SMS patterns)
SimpleTexting API configured
Test phone numbers ready
Compliance gates working

DeliverablesPhone number validation (E.164 format)
SMS template engine with personalization
SimpleTexting API integration
Tracking link generation
Communications logging

Critical RequirementsALL compliance checks must pass first
Message length <= 135 chars (with opt-out)
Test mode sends to test number only
Every SMS logged immediately
Delivery webhooks configured

Success MetricsValid phones formatted correctly
Templates personalize without exceeding length
Test mode prevents real sends
All SMS logged with tracking
Delivery status captured
EOF

cat > "$CURSOR_PROJECT/context/session-4/pattern.md" << 'EOF'Implementation Pattern: SMS SendingPhone Validationjavascript

// Node: Format Phone Number
Type: n8n-nodes-base.code

function formatToE164(phone) {
  if (!phone) return null;
  
  // Remove all non-numeric
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle US numbers
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }
  
  // Add + prefix
  if (!cleaned.startsWith('1')) {
    return null; // Non-US, route to human review
  }
  
  return '+' + cleaned;
}

const primaryPhone = $json.phone_primary || $json.phone;
const formatted = formatToE164(primaryPhone);

return {
  ...$json,
  phone_formatted: formatted,
  phone_valid: !!formatted,
  phone_country: formatted ? (formatted.startsWith('+1') ? 'US' : 'International') : 'Invalid'
};

SMS Template Enginejavascript

// Node: Generate SMS Message
Type: n8n-nodes-base.code

const templates = {
  'high_score': 'Hi {{first_name}}, noticed you\'re {{title}} at {{company}}. Other {{similar_title}}s love how we help close 20% more deals. Quick chat? {{link}}',
  'medium_score': 'Hi {{first_name}}, saw you joined our webinar. {{company}} teams like yours see great results with our framework. Worth discussing? {{link}}',
  'default': 'Hi {{first_name}}, thanks for your interest! Love to show how we help {{company}} teams excel. Free to chat? {{link}}'
};

function fillTemplate(template, data) {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    if (key === 'similar_title') {
      // Simplify title for readability
      const title = data.title || 'sales pros';
      if (title.includes('Account Executive')) return 'AEs';
      if (title.includes('Sales')) return 'sales pros';
      return 'teams';
    }
    return data[key] || '';
  });
}

const score = $json.icp_score || 0;
const templateKey = score >= 85 ? 'high_score' : score >= 70 ? 'medium_score' : 'default';
const template = templates[templateKey];

// Generate tracking link
const trackingLink = `https://go.uysp.com/${Date.now()}`;

const messageData = {
  first_name: $json.first_name || 'there',
  title: $json.title_current || 'sales professional',
  company: $json.company_enriched || $json.company || 'your company',
  link: trackingLink
};

const message = fillTemplate(template, messageData);
const withOptOut = message + ' Reply STOP to opt out';

if (withOptOut.length > 160) {
  throw new Error(`Message too long: ${withOptOut.length} chars`);
}

return {
  ...$json,
  sms_message: message,
  sms_full_message: withOptOut,
  sms_length: withOptOut.length,
  sms_template: templateKey,
  tracking_link: trackingLink
};

Test Mode Overridejavascript

// Node: Apply Test Mode
Type: n8n-nodes-base.code

const testMode = $env.TEST_MODE === 'true';
const testPhone = $env.TEST_PHONE || '+14155551234';

return {
  ...$json,
  sms_recipient: testMode ? testPhone : $json.phone_formatted,
  sms_test_mode: testMode,
  original_recipient: $json.phone_formatted
};

SimpleTexting Sendjavascript

// Node: Send SMS via SimpleTexting
Type: n8n-nodes-base.httpRequest
Method: POST
URL: https://api-app2.simpletexting.com/v2/api/messages
Authentication: Generic
Headers:
  Authorization: Bearer {{ $credentials.simpleTextingApiKey }}
Body Type: JSON
Body:
{
  "contactPhone": "{{ $json.sms_recipient }}",
  "text": "{{ $json.sms_full_message }}",
  "accountPhone": "{{ $credentials.simpleTextingPhone }}"
}

Log Communicationjavascript

// Node: Log to Communications
Type: n8n-nodes-base.airtable
Operation: Create
Base ID: appuBf0fTe8tp8ZaF
Table ID: [Communications table ID]
Fields:
  person_id: {{ $json.airtable_record_id }}
  message_type: "SMS"
  message_content: {{ $json.sms_full_message }}
  sent_time: {{ $now.toISO() }}
  template_used: {{ $json.sms_template }}
  tracking_link: {{ $json.tracking_link }}
  campaign: "initial_outreach"
  simpletexting_id: {{ $json.messageId }}
  test_mode_send: {{ $json.sms_test_mode }}
  cost_logged: 0.02
  tendlc_compliant: {{ $json.compliance_checks.tendlc_ok }}
  time_window_checked: {{ $json.compliance_checks.time_window_ok }}
  dnd_checked: {{ $json.compliance_checks.dnd_clear }}

Error Handlingjavascript

// Node: Handle SMS Errors
Type: n8n-nodes-base.code

const error = $json.error;
const errorType = error?.response?.status;

let shouldRetry = false;
let errorCategory = 'permanent';

if (errorType === 429) {
  shouldRetry = true;
  errorCategory = 'rate_limit';
} else if (errorType >= 500) {
  shouldRetry = true;
  errorCategory = 'temporary';
}

return {
  ...$input.item.json,
  sms_failed: true,
  sms_error: error.message,
  sms_error_category: errorCategory,
  should_retry: shouldRetry,
  retry_after: errorCategory === 'rate_limit' ? 60000 : 5000
};

EOFcat > "$CURSOR_PROJECT/context/session-4/tests.md" << 'EOF'Test Requirements: Session 4Test Phone Numbersjavascript

const testNumbers = {
  valid_mobile: '+14155551234',    // Your test number
  invalid_format: '415-555-1234',  // Missing country code
  international: '+447700900123',  // UK number
  landline: '+14155559999',        // Will fail mobile check
  short: '555-1234'               // Too short
};

Test ScenariosTest 1: Valid US Mobilejson

{
  "phone_primary": "(415) 555-1234",
  "first_name": "John",
  "company_enriched": "TechCorp",
  "title_current": "Account Executive",
  "icp_score": 85
}

Expected:Formats to +14155551234
High score template used
Message length < 160
Sent to test number in test mode

Test 2: International Phonejson

{
  "phone_primary": "+44 7700 900123",
  "first_name": "UK User"
}

Expected: Should route to human review (not US)Test 3: Template Length Checkjson

{
  "first_name": "Verylongfirstname",
  "company_enriched": "Company With An Extremely Long Name Inc",
  "title_current": "Senior Vice President of Business Development"
}

Expected: Error if > 160 chars with opt-outTest 4: Missing Personalizationjson

{
  "phone_primary": "4155551234",
  "email": "minimal@example.com"
}

Expected: Defaults used (Hi there, your company)Test 5: API Error SimulationUse invalid API key
Expected: Error logged, marked for retry

Test 6: Test Mode VerificationEnsure TEST_MODE=true
Send to real phone number
Expected: Goes to test number, not real recipient

Verification StepsCheck phone formatting logic
Verify template selection by score
Confirm message length validation
Test mode redirects all SMS
Communications table updated
Error handling works
EOF

cat > "$CURSOR_PROJECT/context/session-4/evidence.md" << 'EOF'Evidence Requirements: Session 4After completing SMS system:

COMPONENT: SMS Sending System
STATUS: Complete
EVIDENCE:
- Implementation:
  - Phone formatter working ✓
  - Template engine working ✓
  - SimpleTexting integrated ✓
  - Communications logging ✓
- Test Results:
  - Valid US: Sent successfully [execution-id]
  - International: Routed correctly [execution-id]
  - Long template: Length validated [execution-id]
  - Missing data: Defaults used [execution-id]
  - API error: Handled gracefully [execution-id]
  - Test mode: Confirmed working [execution-id]
- Message Examples:
  - High score: "[actual message]"
  - Medium score: "[actual message]"
  - Default: "[actual message]"
- Communications Records:
  - Test SMS 1: rec[xxx]
  - Test SMS 2: rec[xxx]
- Export Location: workflows/backups/session-4-sms.json

Test Mode Verification:Original recipient stored
Test number used for actual send
No real SMS sent during testing
Cost tracking shows $0.02 per SMS
EOF

========== SESSION 5: Utilities & Complete Flow ==========cat > "$CURSOR_PROJECT/context/session-5/README.md" << 'EOF'Session 5: Utilities & Complete System IntegrationWhat You're BuildingDaily metrics calculation, Calendly webhook handler, centralized error handling, and complete end-to-end workflow integration connecting all previous components.Why This MattersThis completes the system by adding monitoring, attribution tracking, and error recovery. Without these utilities, you're flying blind and can't optimize or troubleshoot effectively.PrerequisitesSessions 1-4 complete and tested
Pattern 05 loaded (utility patterns)
All components working individually
Understanding of complete flow
Calendly webhook access (optional)

DeliverablesDaily metrics aggregation workflow
Calendly meeting attribution handler
Centralized error handler
Human review queue view
Complete system integration test

Critical RequirementsMetrics run daily at 11pm
All errors logged with context
Cost tracking aggregated
Human review items tracked
End-to-end flow verified

Success MetricsDaily metrics calculating accurately
Errors categorized and logged
Meeting attribution working
Complete flow processes in <5 min
All components integrated
EOF

cat > "$CURSOR_PROJECT/context/session-5/pattern.md" << 'EOF'Implementation Pattern: System UtilitiesDaily Metrics Workflowjavascript

// Create separate workflow: uysp-daily-metrics-v1

// Node: Schedule Trigger
Type: n8n-nodes-base.scheduleTrigger
Settings:
  Trigger Times:
    Hour: 23
    Minute: 0
  Trigger Days: All

// Node: Get Today's Data
Type: n8n-nodes-base.airtable
Operation: Search
Table: People
Filter: {created_date} = TODAY()

// Node: Calculate Metrics
Type: n8n-nodes-base.code
const leads = $items;
const today = new Date().toISOString().split('T')[0];

// Process leads by source
const bySource = {};
leads.forEach(lead => {
  const source = lead.json.lead_source || 'unknown';
  bySource[source] = (bySource[source] || 0) + 1;
});

// Calculate enrichment success
const enriched = leads.filter(l => l.json.title_current).length;
const enrichmentRate = leads.length > 0 ? (enriched / leads.length * 100) : 0;

// Get SMS and meeting counts from other tables...

return {
  date: today,
  leads_processed: leads.length,
  leads_by_source: JSON.stringify(bySource),
  enrichment_success_rate: enrichmentRate,
  avg_processing_time: calculateAvgTime(leads),
  // ... other metrics
};

// Node: Save Daily Metrics
Type: n8n-nodes-base.airtable
Operation: Create
Table: Daily_Metrics

Calendly Webhook Handlerjavascript

// Create separate workflow: uysp-calendly-webhook-v1

// Node: Webhook Receiver
Type: n8n-nodes-base.webhook
Path: calendly-events
Method: POST

// Node: Validate Calendly Signature
Type: n8n-nodes-base.code
// TODO: Implement signature validation when ready
const isValid = true; // Placeholder
if (!isValid) throw new Error('Invalid signature');

return $json;

// Node: Extract Meeting Data
Type: n8n-nodes-base.code
const event = $json.event;
const invitee = $json.invitee;

// Extract tracking parameters from URL
const uri = new URL(invitee.cancel_url);
const utmSource = uri.searchParams.get('utm_source');
const utmContent = uri.searchParams.get('utm_content');

return {
  email: invitee.email,
  meeting_time: event.start_time,
  meeting_type: event.event_type,
  tracking_source: utmSource,
  tracking_content: utmContent,
  calendly_event_id: event.id
};

// Node: Find Person Record
Type: n8n-nodes-base.airtable
Operation: Search
Table: People
Filter: {email} = '{{ $json.email }}'

// Node: Create Meeting Record
Type: n8n-nodes-base.airtable
Operation: Create
Table: Meetings

Centralized Error Handlerjavascript

// Add to main workflow error handling

// Node: Capture Error Context
Type: n8n-nodes-base.code
const error = $json.error;
const context = {
  workflow: 'uysp-lead-processing-v1',
  execution_id: $execution.id,
  timestamp: new Date().toISOString(),
  node_name: error.node?.name || 'unknown',
  error_message: error.message,
  error_type: classifyError(error),
  lead_email: $items[0]?.json?.email || 'unknown'
};

function classifyError(err) {
  if (err.message.includes('rate limit')) return 'rate_limit';
  if (err.message.includes('Invalid API')) return 'auth_error';
  if (err.message.includes('Network')) return 'network_error';
  if (err.message.includes('compliance')) return 'compliance_block';
  return 'unknown';
}

// Node: Log to Error Table
Type: n8n-nodes-base.airtable
Operation: Create
Table: Error_Log
Fields: [context object]

// Node: Alert if Critical
Type: n8n-nodes-base.switch
Rules:
  - When: {{ $json.error_type === 'auth_error' }}
    Output: Send Alert
  - Default: Log Only

Human Review Queue (Airtable View)javascript

// This is configured in Airtable UI, not n8n
/*
View Name: "Human Review Queue"
Table: People
Filters:
  - routing = "human_review"
  - reviewed = false
  - created_date is within last 7 days
Sort:
  - priority DESC
  - created_date ASC
Fields shown:
  - email
  - company
  - routing_reason
  - created_date
  - review button
*/

Complete System Testjavascript

// Node: Generate Test Batch
Type: n8n-nodes-base.code
const testLeads = [
  {
    email: 'complete-test-1@salesforce.com',
    name: 'High Score Test',
    phone: '415-555-0001',
    company: 'Salesforce',
    source_form: 'system-test'
  },
  {
    email: 'complete-test-2@unknown.com',
    name: 'Medium Score Test',
    phone: '415-555-0002',
    company: 'Unknown Startup'
  },
  {
    email: 'complete-test-3@gmail.com',
    name: 'Low Score Test',
    company: 'Personal'
  }
];

return testLeads.map(lead => ({
  json: { ...lead, request_id: `system-test-${Date.now()}` }
}));

// Process through complete workflow...

EOFcat > "$CURSOR_PROJECT/context/session-5/tests.md" << 'EOF'Test Requirements: Session 5Component TestsDaily Metrics TestCreate test data for "today"
Run metrics calculation
Verify:Counts are accurate
Percentages calculate correctly
JSON fields properly formatted
Record created in Daily_Metrics
Error Handler TestSimulate various errors:API rate limit (429)
Invalid credentials (401)
Network timeout
Airtable conflict
SMS compliance block

Verify each creates appropriate Error_Log entryCalendly Webhook Testjson

{
  "event": {
    "id": "evt_123",
    "start_time": "2024-01-15T14:00:00Z",
    "event_type": "discovery_call"
  },
  "invitee": {
    "email": "test@qualified.com",
    "cancel_url": "https://calendly.com/cancel?utm_source=sms&utm_content=lead123"
  }
}

End-to-End System TestRun 10 test leads through complete system:High ICP B2B (should get SMS)
Medium ICP B2B (should get SMS)
Low ICP B2B (should archive)
Non-B2B (should archive at Phase 1)
No Company Data (human review)
International Phone (human review)
DND Number (compliance block)
After Hours (time window block)
Duplicate (should update)
Missing Email (should error gracefully)

Success CriteriaAll 10 tests complete without system errors
Appropriate routing for each test case
Metrics accurately reflect activity
Errors logged with proper classification
Total processing time <5 minutes for batch
EOF

cat > "$CURSOR_PROJECT/context/session-5/evidence.md" << 'EOF'Evidence Requirements: Session 5After completing utilities and integration:

COMPONENT: Utilities & Complete System
STATUS: Complete
EVIDENCE:
- New Workflows:
  - uysp-daily-metrics-v1: [workflow-id]
  - uysp-calendly-webhook-v1: [workflow-id]
- Error Handling:
  - Rate limit logged: [error-id]
  - Auth error logged: [error-id]
  - Compliance block logged: [error-id]
- Daily Metrics:
  - Test run successful: [execution-id]
  - Metrics record created: rec[xxx]
- System Test Results:
  - Test 1 (High B2B): SMS sent ✓
  - Test 2 (Medium B2B): SMS sent ✓
  - Test 3 (Low B2B): Archived ✓
  - Test 4 (Non-B2B): Phase 1 stop ✓
  - Test 5 (No company): Human review ✓
  - Test 6 (International): Human review ✓
  - Test 7 (DND): Blocked ✓
  - Test 8 (After hours): Blocked ✓
  - Test 9 (Duplicate): Updated ✓
  - Test 10 (No email): Error handled ✓
- Processing Metrics:
  - Average time per lead: ___ seconds
  - Total batch time: ___ minutes
- Export Locations:
  - Main: workflows/backups/session-5-complete.json
  - Metrics: workflows/backups/session-5-metrics.json
  - Calendly: workflows/backups/session-5-calendly.json

System Readiness:All components connected
Error handling comprehensive
Metrics tracking working
Ready for production testing
EOF

========== SESSION 6: Reality-Based Testing ==========cat > "$CURSOR_PROJECT/context/session-6/README.md" << 'EOF'Session 6: Reality-Based Testing & ValidationWhat You're BuildingA comprehensive testing suite that verifies the ENTIRE system end-to-end, focusing on actual Airtable records created, not just HTTP responses or console logs. This includes all 10+ payload variations, duplicate scenarios, compliance blocks, and qualification routing.Why This MattersPrevious "testing theater" (checking 200 OK but no records) caused 90% of failures. This ensures the system works in reality, with evidence like record IDs.PrerequisitesSessions 0-5 complete and integrated
Pattern 06 loaded (reality-based protocol)
All test payloads prepared (15+ consolidated)
Field_Mapping_Log ready for unknowns

DeliverablesAutomated test script for full system
Verification queries for Airtable records
Evidence report with IDs and rates
Unknown field analysis
Final system backup

Critical RequirementsMUST use external triggers (curl/TestSprite)
MUST wait 5s+ for processing
MUST verify Airtable records by ID
MUST check 98%+ field capture rate
MUST test ALL edge cases (duplicates, international, errors)

Success Metrics100% workflow execution success
Zero duplicate records
98%+ field mapping rate
All compliance/routing works
Full evidence collected
EOF

cat > "$CURSOR_PROJECT/context/session-6/pattern.md" << 'EOF'Implementation Pattern: Reality-Based TestingTest Execution Protocolbash

# Manual Test Protocol (Run for EACH test)
1. In n8n UI: Click "Execute Workflow" on main workflow
2. Wait 5 seconds for webhook to listen
3. Send payload via curl:
curl -X POST https://[n8n-url]/webhook/kajabi-leads \
  -H "X-API-Key: [key]" \
  -H "Content-Type: application/json" \
  -d '[test-payload-json]'

4. Wait 10-30 seconds for processing
5. Check n8n execution log for success
6. Query Airtable for record: filterByFormula({email} = 'test@example.com')
7. Verify fields populated correctly
8. Repeat for next test - MUST re-click "Execute Workflow"

Consolidated Test Payloads (15+ Unique)javascript

const consolidatedTests = [
  // From Session 0 (10 basic variations)
  { email: 'test1@example.com', name: 'John Doe', phone: '555-0001', company: 'Acme Corp' },
  { EMAIL: 'test2@example.com', NAME: 'Jane Doe', PHONE: '555-0002' },
  { Email: 'test3@example.com', Name: 'Bob Smith', Phone: '555-0003' },
  { email_address: 'test4@example.com', full_name: 'Alice Johnson', phone_number: '555-0004' },
  { first_name: 'Charlie', last_name: 'Brown', email_address: 'test5@example.com' },
  { emailAddress: 'test6@example.com', firstName: 'David', lastName: 'Green' },
  { email: 'test7@example.com', interested_in_coaching: 'yes', qualified_lead: 'true' },
  { email: 'test8@example.com', interested_in_coaching: true, contacted: 1 },
  { email: 'test9@example.com' },
  { email: 'test10@example.com', custom_field_xyz: 'value', another_unknown: 'data' },
  
  // Additional from updates (new variations, international)
  { email_address_1: 'test11@example.com', phone_intl: '+1 555-0011', user_email: 'test11@example.com' },
  { email: 'test12@example.com', phone: '+44 7700 900123', name: 'International User' },
  { email: 'test13@example.com', interested_in_coaching: 'checked', qualified_lead: 'y' },
  { email: 'test14@example.com', phone: 'invalid', name: 'Invalid Phone Test' },
  { email: 'test15@example.com', name: 'Duplicate Test', request_id: 'dup-test-001' } // Send twice for duplicate
];

Airtable Verification Queriesjavascript

// Query for record existence
filterByFormula: {email} = 'test1@example.com'
Expect: Exactly 1 record

// Verify field mapping
Check fields: email, first_name, last_name, phone, company all populated

// Check duplicates
filterByFormula: {email} = 'test15@example.com'
Expect: 1 record, duplicate_count >=1

// Unknown fields
Search Field_Mapping_Log for today's unknowns

Evidence Collection Scriptjavascript

// Run after all tests
const testResults = [];
// For each test...
testResults.push({
  test_id: 'test1',
  execution_id: '[from n8n]',
  record_id: '[from Airtable]',
  capture_rate: '98%',
  status: 'PASSED'
});

// Generate report
console.log(JSON.stringify(testResults, null, 2));

EOFcat > "$CURSOR_PROJECT/context/session-6/tests.md" << 'EOF'Test Requirements: Session 6Full System Edge CasesHigh ICP B2B (should get SMS)
Medium ICP B2B (should get SMS)
Low ICP B2B (should archive)
Non-B2B (should archive at Phase 1)
No Company Data (human review)
International Phone (human review)
DND Number (compliance block)
After Hours (time window block)
Duplicate (should update)
Missing Email (should error gracefully)
New Kajabi Variations (field mapping test)
Boolean 'checked'/'y' (conversion test)
Invalid Phone (validation fail)
Cost Limit Exceeded (circuit breaker)
Claude API Fail (fallback scoring)

Verification ProtocolFor each: Send payload, wait, query Airtable
Check: Record exists? Fields mapped? Routing correct?
Measure: Processing time <5 min
Log: Any unknowns to Field_Mapping_Log

Success Criteria100% execution success (no errors)
98%+ field mapping rate
Zero duplicates created
All compliance blocks work
Evidence: Record IDs, execution IDs for all
EOF

cat > "$CURSOR_PROJECT/context/session-6/evidence.md" << 'EOF'Evidence Requirements: Session 6After running all tests:

COMPONENT: Reality-Based System Testing
STATUS: Complete
EVIDENCE:
- Test Coverage: 15/15 scenarios
- Execution Success Rate: 100%
- Field Mapping Rate: ___% average
- Processing Times:
  - Average: ___ seconds
  - Max: ___ seconds
- Key Verifications:
  - Duplicates prevented: ✓
  - International routed: ✓
  - Compliance blocks: ✓
  - Routing accurate: ✓
- Sample Evidence:
  - Test 1 (High B2B): Execution [id], Record rec[xxx], SMS logged
  - Test 6 (International): Execution [id], Human review flagged
  - Test 10 (No email): Execution [id], Error logged
- Unknown Fields Discovered: [count/list]
- Final Backup: workflows/backups/session-6-complete-system.json

Platform Validation:All tests used external triggers
Webhook re-activated per test
No "testing theater" - All verified via Airtable
EOF

echo "=== Context Engineering Complete ==="
echo "All session documents created in $CURSOR_PROJECT/context/"
echo "Ready for Cursor AI sessions 0-6"
echo "Session 7 directory created as stub - implement later"

