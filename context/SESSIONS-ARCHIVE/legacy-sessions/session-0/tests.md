# Test Requirements: Session 0

## Test Payloads (ALL 10 REQUIRED)

```javascript
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
```

## Verification Steps

1. Create test workflow with Webhook → Smart Field Mapper → Debug nodes
2. For each payload:
   - Send via curl/TestSprite
   - Check normalized output contains email
   - Verify capture rate >= 90%
   - Confirm unknownFields array populated correctly
3. Check Field_Mapping_Log for unknown field entries

## Expected Results

- Tests 1-8: 90-100% field capture rate
- Test 9: Low capture rate but no errors
- Test 10: Unknown fields tracked in unknownFields array
- All tests: mappingSuccess = true (except empty payloads) 