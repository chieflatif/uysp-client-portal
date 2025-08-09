# Test Requirements: Session 2

## Test Payloads (ALL 9 REQUIRED)

```javascript
// Test 1: Clean lead - should pass all compliance
{
  "email": "clean@test.com",
  "name": "Clean User",
  "phone_primary": "2125551001",  // NYC area code, EST
  "person_id": "recTestClean001",
  "test_timestamp": "2025-01-15T14:00:00Z"  // 9 AM EST = compliant
}

// Test 2: DND list phone number - should block
{
  "email": "clean@test.com",
  "name": "DND Phone Test",
  "phone_primary": "2125551999",  // Add this to DND_List first
  "person_id": "recTestDND001",
  "test_timestamp": "2025-01-15T14:00:00Z"
}

// Test 3: DND list email - should block
{
  "email": "dnd@blocked.com",  // Add this to DND_List first
  "name": "DND Email Test",
  "phone_primary": "2125551002",
  "person_id": "recTestDND002",
  "test_timestamp": "2025-01-15T14:00:00Z"
}

// Test 4: TCPA violation (too early) - should block
{
  "email": "early@test.com",
  "name": "Early Bird",
  "phone_primary": "2125551003",
  "person_id": "recTestTCPA001",
  "test_timestamp": "2025-01-15T11:00:00Z"  // 6 AM EST = violation
}

// Test 5: TCPA violation (too late) - should block
{
  "email": "night@test.com",
  "name": "Night Owl",
  "phone_primary": "2125551004",
  "person_id": "recTestTCPA002",
  "test_timestamp": "2025-01-15T03:00:00Z"  // 10 PM EST = violation
}

// Test 6: Monthly limit exceeded - should block
{
  "email": "limit@test.com",
  "name": "Limit Test",
  "phone_primary": "2125551005",
  "person_id": "recTestLimit001",
  "monthly_sms_override": 1001,  // Simulate limit exceeded
  "test_timestamp": "2025-01-15T14:00:00Z"
}

// Test 7: 10DLC not registered - should block
{
  "email": "no10dlc@test.com",
  "name": "No 10DLC",
  "phone_primary": "2125551006",
  "person_id": "recTest10DLC001",
  "test_timestamp": "2025-01-15T14:00:00Z",
  "ten_dlc_override": false
}

// Test 8: West Coast timezone - should pass
{
  "email": "westcoast@test.com",
  "name": "West Coast User",
  "phone_primary": "2135551007",  // LA area code, PST
  "person_id": "recTestWest001",
  "test_timestamp": "2025-01-15T17:00:00Z"  // 9 AM PST = compliant
}

// Test 9: Opt-out request processing
{
  "From": "+12125551008",
  "Body": "STOP",
  "MessageSid": "test-message-sid-001",
  "AccountSid": "test-account-sid"
}
```

## Pre-Test Setup Required

```javascript
// Add these records to DND_List table before testing:
[
  {
    "phone_number": "+12125551999",
    "email": null,
    "reason": "MANUAL_ADD",
    "added_at": "2025-01-15T10:00:00Z",
    "source": "test_setup"
  },
  {
    "phone_number": null,
    "email": "dnd@blocked.com",
    "reason": "EMAIL_OPT_OUT",
    "added_at": "2025-01-15T10:00:00Z",
    "source": "test_setup"
  }
]

// Set environment variables:
SMS_MONTHLY_LIMIT=1000
TEN_DLC_REGISTERED=true
TEST_MODE=true
```

## Expected Results

| Test | Expected Result | Compliance Status | Block Reasons |
|------|----------------|-------------------|---------------|
| Test 1 | PASS | APPROVED | [] |
| Test 2 | BLOCK | BLOCKED | ["DND_LIST"] |
| Test 3 | BLOCK | BLOCKED | ["DND_LIST"] |
| Test 4 | BLOCK | BLOCKED | ["TCPA_HOURS"] |
| Test 5 | BLOCK | BLOCKED | ["TCPA_HOURS"] |
| Test 6 | BLOCK | BLOCKED | ["MONTHLY_LIMIT"] |
| Test 7 | BLOCK | BLOCKED | ["NO_10DLC"] |
| Test 8 | PASS | APPROVED | [] |
| Test 9 | OPT_OUT | DND_ADDED | N/A |

## Critical Validations

1. **DND Check**: Tests 2&3 must identify DND matches (phone/email)
2. **TCPA Hours**: Tests 4&5 must calculate correct local time
3. **Timezone**: Test 8 must handle PST correctly (3-hour difference)
4. **Monthly Limits**: Test 6 must check current month SMS count
5. **10DLC Status**: Test 7 must verify registration status
6. **Opt-out Processing**: Test 9 must add to DND_List automatically
7. **Multiple Blocks**: If multiple violations, all should be listed

## Test Environment Variables

```bash
# For Tests 1-6, 8 (normal operation)
SMS_MONTHLY_LIMIT=1000
TEN_DLC_REGISTERED=true
TEST_MODE=true

# For Test 7 (10DLC failure simulation)
TEN_DLC_REGISTERED=false
```

## Verification Steps

1. **Before Tests**: Clean DND_List, add test records
2. **During Tests**: Monitor compliance_passed field
3. **After Tests**: Verify DND_List additions from opt-outs
4. **Cleanup**: Remove test DND records

## Integration Points

- Session 1 webhook feeds into compliance checks
- All leads must pass through compliance before SMS
- Failed compliance logs to Error_Log table
- Successful compliance proceeds to qualification (Session 3) 