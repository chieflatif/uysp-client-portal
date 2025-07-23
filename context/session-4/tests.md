# Test Requirements: Session 4

## Test Phone Numbers
```javascript
const testNumbers = {
  valid_mobile: '+14155551234',    // Your test number
  invalid_format: '415-555-1234',  // Missing country code
  international: '+447700900123',  // UK number
  landline: '+14155559999',        // Will fail mobile check
  short: '555-1234'               // Too short
};
```

## Test Scenarios

### Test 1: Valid US Mobile
```json
{
  "phone_primary": "(415) 555-1234",
  "first_name": "John",
  "company_enriched": "TechCorp",
  "title_current": "Account Executive",
  "icp_score": 85
}
```

**Expected**:
- Formats to +14155551234
- High score template used
- Message length < 160
- Sent to test number in test mode

### Test 2: International Phone
```json
{
  "phone_primary": "+44 7700 900123",
  "first_name": "UK User"
}
```
**Expected**: Should route to human review (not US)

### Test 3: Template Length Check
```json
{
  "first_name": "Verylongfirstname",
  "company_enriched": "Company With An Extremely Long Name Inc",
  "title_current": "Senior Vice President of Business Development"
}
```
**Expected**: Error if > 160 chars with opt-out

### Test 4: Missing Personalization
```json
{
  "phone_primary": "4155551234",
  "email": "minimal@example.com"
}
```
**Expected**: Defaults used (Hi there, your company)

### Test 5: API Error Simulation
Use invalid API key  
**Expected**: Error logged, marked for retry

### Test 6: Test Mode Verification
Ensure TEST_MODE=true  
Send to real phone number  
**Expected**: Goes to test number, not real recipient

## Verification Steps
1. Check phone formatting logic
2. Verify template selection by score
3. Confirm message length validation
4. Test mode redirects all SMS
5. Communications table updated
6. Error handling works 