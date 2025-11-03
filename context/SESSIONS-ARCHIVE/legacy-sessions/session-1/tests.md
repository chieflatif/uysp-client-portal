# Test Requirements: Session 1

## Test Payloads (ALL 8 REQUIRED)

```javascript
// Test 1: New lead - should create
{
  "email": "test1@newcompany.com",
  "name": "John Doe",
  "phone": "555-0001",
  "company": "New Company",
  "source_form": "webinar-signup",
  "request_id": "test-session1-001"
}

// Test 2: Duplicate email - should update
{
  "email": "test1@newcompany.com",
  "name": "John Updated",
  "phone": "555-0001",
  "company": "Updated Company",
  "source_form": "contact-form",
  "request_id": "test-session1-002"
}

// Test 3: Duplicate phone - should update
{
  "email": "different@email.com",
  "name": "Jane Doe",
  "phone": "555-0001",
  "company": "Phone Match Co",
  "source_form": "demo-request",
  "request_id": "test-session1-003"
}

// Test 4: Field normalization test
{
  "EMAIL": "TEST4@UPPERCASE.COM",
  "full_name": "Bob Smith",
  "phone_number": "555-0004",
  "Company": "Mixed Case Corp",
  "source": "newsletter",
  "request_id": "test-session1-004"
}

// Test 5: Missing fields test
{
  "email": "test5@minimal.com",
  "request_id": "test-session1-005"
}

// Test 6: Authentication failure (no X-API-Key)
{
  "email": "test6@noauth.com",
  "name": "Should Fail",
  "request_id": "test-session1-006"
}

// Test 7: Test mode verification
{
  "email": "test7@testmode.com",
  "name": "Test Mode User",
  "phone": "555-0007",
  "company": "Test Corp",
  "source_form": "test-form",
  "request_id": "test-session1-007"
}

// Test 8: Complete profile
{
  "email": "test8@complete.com",
  "name": "Complete User",
  "phone": "555-0008",
  "company": "Complete Corp",
  "source_form": "full-form",
  "interested_in_coaching": "yes",
  "industry": "Technology",
  "request_id": "test-session1-008"
}
```

## Expected Results

| Test | Expected Action | Verify |
|------|----------------|---------|
| Test 1 | CREATE new record | Airtable record created |
| Test 2 | UPDATE existing (email match) | Name updated to "John Updated" |
| Test 3 | UPDATE existing (phone match) | Email updated |
| Test 4 | CREATE with normalized fields | Fields properly normalized |
| Test 5 | CREATE with minimal data | No errors, required fields only |
| Test 6 | REJECT (401 Unauthorized) | No record created |
| Test 7 | CREATE with test_mode_record=true | Test mode flag set |
| Test 8 | CREATE complete profile | All fields populated |

## Critical Validations

1. **Field Normalization**: All tests should pass through Session 0 Smart Field Mapper first
2. **Duplicate Prevention**: Tests 2&3 must NOT create new records
3. **Test Mode**: All records should have test_mode_record=true when TEST_MODE=true
4. **Authentication**: Test 6 must fail without proper X-API-Key header
5. **Error Handling**: Failed tests must not crash workflow
6. **Response Codes**: 
   - 200 for successful processing
   - 401 for authentication failure
   - 400 for validation errors

## Test Headers Required

```javascript
// For Tests 1-5, 7-8
{
  "X-API-Key": "your-webhook-api-key",
  "Content-Type": "application/json"
}

// For Test 6 (should fail)
{
  "Content-Type": "application/json"
  // No X-API-Key header
}
``` 