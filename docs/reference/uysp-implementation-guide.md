✓ Updated uysp-implementation-guide.md - Added to Session 3: Qualification & Enrichment, Step 2: "If non-US prefix (e.g., not +1), route to human review queue"; Added to Session 5: Utilities & Complete System: "Stub for Phase 2: Add placeholder IF for two-way SMS (e.g., check for replies)."; Added to Session 0: Field Normalization, Step 3: "Merge with reality_based_tests_v2.json for unique 15+ payloads."; Added to Post-Implementation Checklist: "[ ] Claude API rate limits handled (backoff for 100 req/min).".
```uysp-implementation-guide.md
# UYSP Implementation Guide
*Step-by-Step Instructions with Critical Updates from Failure Analysis*

## Pre-Build Requirements

### Accounts & Access (1 hour setup)
- [ ] n8n cloud instance running ($150/month)
- [ ] Airtable Team plan active ($240/month)  
- [ ] Apollo Pro account ($99/month)
- [ ] SimpleTexting account with phone number
- [ ] Twilio account with Lookup API enabled
- [ ] Claude API key (claude-4-opus access)
- [ ] Zapier Starter plan ($29/month)

### Critical Documentation Check
- [ ] Pattern 00 (Field Normalization) loaded - **MANDATORY**
- [ ] Pattern 06 (Reality Testing) loaded - **MANDATORY**
- [ ] Platform Gotchas document reviewed
- [ ] Test payloads (10 variations) prepared

### Development Environment
- [ ] Claude Desktop with project docs loaded (PM role)
- [ ] Cursor with UYSP project created (Developer role)
- [ ] MCP tools verified working in both

---

## Session 0: Field Normalization (MANDATORY FIRST STEP)

### Why This is Session 0
**Discovery**: Without field normalization, 100% of workflows fail
**Reality**: Webhooks send 15+ variations of every field
**Solution**: Smart Field Mapper MUST be first node after webhook

### Step 1: Create Field Mapping Infrastructure

In Airtable:Create Field_Mapping_Log table with fields:timestamp (datetime)
unknown_field (text)
webhook_source (text) 
occurrence_count (number)
first_seen (datetime)
last_seen (datetime)
Update People table - ADD:field_mapping_success_rate (number)
raw_webhook_data (long text)
normalization_version (text)
### Step 2: Implement Smart Field Mapper
In n8n, create workflow: `uysp-field-normalizer-v1`

1. **Webhook Node**:
   - Type: Webhook
   - Method: POST
   - Path: test-normalizer
   - Authentication: None (for testing)

2. **Smart Field Mapper Node** (Code):
   - Copy EXACT code from Pattern 00
   - NO MODIFICATIONS
   - This handles 15+ variations per field

3. **Test Payload Logger** (Code):
   ```javascript
   // Log results for verification
   const input = $input.first().json;
   console.log('Normalized fields:', Object.keys(input.normalized));
   console.log('Unknown fields:', input.unknownFields);
   console.log('Capture rate:', 
     (input.fieldsCaptured / input.fieldsTotal * 100).toFixed(2) + '%'
   );
   return input;

Step 3: Test with ALL 10 VariationsCritical: Use Pattern 06 test payloadsFor each test:Click "Execute Workflow" in n8n
Send test payload via curl/TestSprite
Verify output shows 95%+ field capture
Check unknown fields array
Document any new variations found
Merge with reality_based_tests_v2.json for unique 15+ payloads.

Success CriteriaAll 10 test payloads processed
95%+ field capture rate achieved
Unknown fields logged to table
Downstream can use normalized data
Exported to backups/session-0-field-normalizer.json

Session 1: Foundation (2 hours)Prerequisites CheckSession 0 complete and tested
Pattern 01 loaded in Cursor
TEST_MODE=true in n8n env vars
Airtable base created with all tables

Step 1: Bootstrap Environment VariablesIn n8n, set these variables:

AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX  # From Airtable URL
TEST_MODE=true                       # Critical for safety
DAILY_COST_LIMIT=1                   # $1 for testing
CACHE_EXPIRY_DAYS=90
MAX_RETRIES=3
RETRY_DELAY_MS=5000
TEN_DLC_REGISTERED=false            # Until registered
SMS_MONTHLY_LIMIT=1000

Step 2: Create Main WorkflowCreate workflow: uysp-lead-processing-v1Webhook Receiver:Path: kajabi-leads
Authentication: Header Auth
Header Name: X-API-Key
Use credential for key storage
Import Field Normalizer:Add "Execute Workflow" node
Select: uysp-field-normalizer-v1
Pass webhook data through
Test Mode Check:IF node: {{ $env.TEST_MODE === 'true' }}
True path: Set test_mode_record = true
False path: Continue normal flow
Identity Resolution:Airtable Search node
Table ID: tblXXXXXX (NOT name!)
Filter: {email} = '{{ $node["Field Normalizer"].json.normalized.email }}'
Enable "Always Output Data" in Settings tab
Duplicate Check:IF node: {{ $node["Search People"].json.length > 0 }}
True: Update existing record
False: Create new record
Enable "Always Output Data" in Settings tab
Step 3: Test FoundationSend test payload (Pattern 06, Test 1)
Verify webhook receives (200 OK)
Check field normalization output
Confirm Airtable record created
Send same payload again
Verify duplicate is updated, not created

Success CriteriaWebhook receives and normalizes fields
Test mode properly enforced
Airtable create/update working
No duplicate records created
Exported to backups/session-1-foundation.json

Session 2: Compliance & Safety (2 hours)PrerequisitesSession 1 working completely
Pattern 02 loaded
DND_List table has test entries
SMS limits understood

Step 1: DND List ManagementInitialize DND Check:Add after field normalization
Airtable Search: DND_List
Filter: {phone} = '{{ $json.normalized.phone }}'
Check if opted out
Monthly SMS Count:Airtable Count: Communications
Filter: AND({sent_time} >= '{{ $now.startOf('month').toISO() }}')
Store count for limit check
Time Window Check:Code node for timezone logic
Check 8am-9pm recipient time
Account for area code timezone
Step 2: Compliance GatesCreate "SMS Pre-flight Check" node:javascript

const checks = {
  dnd: $node["DND Check"].json.length === 0,
  monthlyLimit: $node["Monthly Count"].json.count < 1000,
  timeWindow: checkTimeWindow($json.normalized.phone),
  tendlc: $env.TEN_DLC_REGISTERED === 'true' || 
          $node["Monthly Count"].json.count < 1000
};

if (!checks.dnd) throw new Error('Number on DND list');
if (!checks.monthlyLimit) throw new Error('Monthly limit exceeded');
if (!checks.timeWindow) throw new Error('Outside time window');
if (!checks.tendlc) throw new Error('10DLC limit exceeded');

return { 
  ...items[0].json,
  compliance_checks: checks,
  can_send_sms: Object.values(checks).every(c => c === true)
};

Success CriteriaDND list properly checked
Monthly limits enforced
Time windows calculated correctly
All compliance gates working
Exported to backups/session-2-compliance.json

Session 3: Qualification & Enrichment (3 hours)PrerequisitesSessions 1-2 complete
Pattern 03 loaded
Apollo API credentials added
Cost tracking tested

Step 1: Enrichment Cache SetupCheck Cache First:Airtable Search: Enrichment_Cache
Filter: AND({email} = '{{ $json.normalized.email }}', {cache_expiry} > NOW())
If found, use cached data
Cost Check Before API:Get today's costs from Daily_Costs
Add next API cost
If exceeds limit, HALT
Step 2: Two-Phase QualificationPhase 1 - Company Check:javascript

// Check known B2B domains first
const knownB2B = ['salesforce.com', 'hubspot.com', ...];
const domain = email.split('@')[1];

if (knownB2B.includes(domain)) {
  return { b2b_tech: true, used_api: false };
}

// Otherwise, call Apollo Org API
Phase 2 - Person Enrichment:Only if Phase 1 passes
Apollo People API call
Extract title, LinkedIn, company info
Route based on sales keywords
Step 3: ICP ScoringPrimary - Claude AI:Send enriched data to Claude
Get 0-100 score
Store scoring reasoning
Fallback - Domain Score:If Claude fails/timeout
Use domain-based scoring
Document which method used
If non-US prefix (e.g., not +1), route to human review queueSuccess CriteriaCache checks working
Cost tracking accurate
Two-phase qualification filters correctly
ICP scores assigned to all qualified
Human review queue populated
Exported to backups/session-3-qualification.json

Session 4: SMS Sending (2 hours)PrerequisitesSessions 1-3 complete
Pattern 04 loaded
SimpleTexting API configured
Test phone numbers ready

Step 1: Phone ValidationFormat to E.164:Strip all non-numeric
Add country code if missing
Validate length
Twilio Lookup (if not in test mode):Check if mobile vs landline
Get carrier info
Verify deliverable
Step 2: SMS Template Enginejavascript

const templates = {
  'webinar-signup': 
    `Hi {{ first_name }}, saw you signed up for our webinar! 
     Other {{ title }}s at {{ company }} love our framework. 
     Quick chat with Davidson? {{ link }}`,
  
  'default':
    `Hi {{ first_name }}, noticed you're the {{ title }} at {{ company }}. 
     We help similar teams close 20% more deals. 
     Worth a quick chat? {{ link }}`
};

// Shorten with tracking link
const finalMessage = await shortenLinks(
  fillTemplate(templates[source_form] || templates.default, data)
);

if (finalMessage.length > 135) {
  throw new Error('Message too long after personalization');
}

Step 3: Send & TrackSimpleTexting Send:Use test number in TEST_MODE
Include opt-out language
Get message ID
Log to Communications:Create record immediately
Include all tracking data
Set up for delivery webhook
Success CriteriaPhone validation working
Templates personalizing correctly
Length validation enforced
Test mode sends to test number only
Communications logged properly
Exported to backups/session-4-sms.json

Session 5: Utilities & Complete System (2 hours)PrerequisitesSessions 1-4 complete
Pattern 05 loaded
All components individually tested
Ready for full flow test

Step 1: Daily Metrics WorkflowCreate: uysp-daily-metrics-v1Schedule Trigger: Daily at 11pm
Calculate Metrics:Leads processed
SMS sent/delivered
Meetings booked
Costs by service
Field mapping success rate
Store in Daily_Metrics

Step 2: Error Handler WorkflowCreate: uysp-error-handler-v1Catch all workflow errors
Log to Error_Log table
Alert if critical
Auto-retry if transient

Step 3: Connect EverythingMain workflow calls all components
Error handling on every node
Cost tracking before every API
Batch processing for scale

Step 4: Full System TestRun all 10 test payloads through complete system:Webhook → Normalize → Qualify → Score → SMS
Verify each step with evidence
Check all tables updated correctly
Confirm costs tracked accurately
Stub for Phase 2: Add placeholder IF for two-way SMS (e.g., check for replies).

Success CriteriaAll 10 tests create proper records
Qualified leads get SMS (test mode)
Costs accurately tracked
Errors handled gracefully
Metrics calculating correctly
Exported ALL workflows to backups

Post-Implementation ChecklistSystem ValidationField normalization achieving 95%+ capture
No workflows without Smart Field Mapper
All IF/Switch nodes have "Always Output Data" ON
All table references use IDs not names
All expressions have proper spacing
Test mode confirmed working

Documentation CompleteAll workflows exported to JSON
Field mapping variations documented
Platform gotchas noted
Test results saved
Handoff guide created

Production ReadinessRemove TEST_MODE (when ready)
Set DAILY_COST_LIMIT=50
Verify 10DLC registration
Configure monitoring alerts
Train operations team
Claude API rate limits handled (backoff for 100 req/min).

Common Pitfalls to Avoid#1: Skipping Field NormalizationSymptom: No records created despite "successful" webhooks
Fix: Smart Field Mapper MUST be first node#2: Manual Credential UpdatesSymptom: "No authentication data defined"
Fix: Only update credentials via n8n UI#3: Testing Without VerificationSymptom: Green checkmarks but no Airtable records
Fix: Always verify actual record creation#4: Fixing in IsolationSymptom: Fix one thing, break three others
Fix: Test entire workflow after ANY change#5: Ignoring Platform LimitsSymptom: Workflow stops mysteriously
Fix: Check UI-only settings, spacing, table IDsEmergency RecoveryIf Workflow DeletedCheck backups/ folder
Import latest JSON
Reconfigure credentials in UI
Test with single payload

If Costs SpikeSet TEST_MODE=true immediately
Check Daily_Costs table
Review API call logs
Lower DAILY_COST_LIMIT

If No Records CreatingCheck field normalization first
Verify webhook receiving data
Check expression syntax (spaces!)
Confirm table IDs correct
Test each node individually

This guide incorporates all lessons learned from 50+ hours of implementation failures. Following these steps exactly, with special attention to Session 0 and evidence-based testing, will result in a working system.
