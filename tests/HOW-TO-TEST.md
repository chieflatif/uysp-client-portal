# How to Execute Tests (For AI Agents)

## The Three-Step Testing Process

### Step 1: Pre-Test Setup (Use API Tools)
```bash
# Check current state
curl -H "Authorization: Bearer $N8N_API_KEY" https://rebelhq.app.n8n.cloud/api/v1/workflows
curl -H "Authorization: Bearer $AIRTABLE_API_KEY" "https://api.airtable.com/v0/$BASE_ID/People?maxRecords=5"

# Document baseline (append to Airtable test log)
curl -X POST -H "Authorization: Bearer $AIRTABLE_API_KEY" -H "Content-Type: application/json" "https://api.airtable.com/v0/$BASE_ID/TestLogs" --data '{"fields": {"Note": "Starting with X workflows and Y records"}}'

# If 429, wait 60s + retry
```

### Step 2: Run Test Script (NO API Tools)
```bash
# Run the wrapper which executes scripts locally
node tests/comprehensive/test-runner-wrapper.js quick
```

### Step 3: Validate & Analyze (Use API Tools Extensively)
```bash
# Get the test email that was sent
TEST_EMAIL="[email from script output]"

# Verify Airtable record
curl -H "Authorization: Bearer $AIRTABLE_API_KEY" "https://api.airtable.com/v0/$BASE_ID/People?filterByFormula={email}='${TEST_EMAIL}'"

# Get n8n execution details (with pagination if needed)
curl -H "Authorization: Bearer $N8N_API_KEY" "https://rebelhq.app.n8n.cloud/api/v1/executions/[execution_id]?includeData=true&limit=50"

# Analyze specific node if failed (via full execution data)
# Monitor quota: Track calls <100/hour

# If rate limited, wait 60s + retry
```

## What Success Looks Like

### Good Test Report:
```
Test: High-value AE Lead
Script Status: HTTP 200
Airtable Verification: ✅ Record created (ID: rec123ABC)
- Email: test@salesforce.com ✅
- ICP Score: 92 ✅  
- Tier: Ultra ✅
- Routing: sales_team ✅
n8n Execution: ✅ All 12 nodes passed
Data Flow: Webhook → Normalizer → Scorer → Router → Airtable
Business Outcome: ACHIEVED - Lead qualified and routed correctly
API Quota: 5 calls used
```

### Good Failure Analysis:
```
Test: International Lead
Script Status: HTTP 200 (misleading!)
Airtable Verification: ❌ No record created
n8n Execution: Failed at node 7 "ICP Scorer"
Error Details:
- Node: ICP Scorer
- Input: {phone: "+44 7700 900123", country: undefined}
- Error: "Cannot read property 'toLowerCase' of undefined"
- Root Cause: Country extraction failing on UK phone numbers
- Line: scorer.js:147 - country.toLowerCase()
Fix Required: Add null check for country field before toLowerCase()
Business Impact: International leads being dropped silently
API Quota: 8 calls used
```
