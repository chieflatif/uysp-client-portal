# Implementation Pattern: Reality-Based Testing

## Test Execution Protocol

```bash
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
```

## Consolidated Test Payloads (15+ Unique)

```json
[
  // From Session 0 (10 basic variations)
  { "email": "test1@example.com", "name": "John Doe", "phone": "555-0001", "company": "Acme Corp" },
  { "EMAIL": "test2@example.com", "NAME": "Jane Doe", "PHONE": "555-0002" },
  { "Email": "test3@example.com", "Name": "Bob Smith", "Phone": "555-0003" },
  { "email_address": "test4@example.com", "full_name": "Alice Johnson", "phone_number": "555-0004" },
  { "first_name": "Charlie", "last_name": "Brown", "email_address": "test5@example.com" },
  { "emailAddress": "test6@example.com", "firstName": "David", "lastName": "Green" },
  { "email": "test7@example.com", "interested_in_coaching": "yes", "qualified_lead": "true" },
  { "email": "test8@example.com", "interested_in_coaching": true, "contacted": 1 },
  { "email": "test9@example.com" },
  { "email": "test10@example.com", "custom_field_xyz": "value", "another_unknown": "data" },
  
  // Additional from updates (new variations, international)
  { "email_address": "test11@example.com", "phone_intl": "+1 555-0011", "user_email": "test11@example.com" },
  { "email": "test12@example.com", "phone": "+44 7700 900123", "name": "International User" },
  { "email": "test13@example.com", "interested_in_coaching": "checked", "qualified_lead": "y" },
  { "email": "test14@example.com", "phone": "invalid", "name": "Invalid Phone Test" },
  { "email": "test15@example.com", "name": "Duplicate Test", "request_id": "dup-test-001" } // Send twice for duplicate
]
```

## Airtable Verification Queries

```javascript
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
```

## Evidence Collection Script

```javascript
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
``` 