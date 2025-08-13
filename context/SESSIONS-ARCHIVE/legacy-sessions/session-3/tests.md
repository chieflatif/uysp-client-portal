# Test Requirements: Session 3

## Test Scenarios

### Test 1: Known B2B Domain
```json
{
  "email": "test@salesforce.com",
  "name": "SF Test",
  "company": "Salesforce"
}
```
**Expected**: Skip Apollo Org API, proceed to Phase 2

### Test 2: Unknown Domain - B2B Tech
```json
{
  "email": "test@techstartup.io",
  "name": "Startup Test",
  "company": "TechStartup Inc"
}
```
**Expected**: Apollo Org API → Pass → Phase 2

### Test 3: Non-B2B Company
```json
{
  "email": "test@restaurant.com",
  "name": "Restaurant Test",
  "company": "Local Restaurant"
}
```
**Expected**: Apollo Org API → Fail → Archive

### Test 4: Sales Role
```json
{
  "email": "ae@b2bcompany.com",
  "name": "Account Exec",
  "title": "Senior Account Executive"
}
```
**Expected**: Phase 1 → Phase 2 → High ICP score

### Test 5: Non-Sales Role
```json
{
  "email": "engineer@b2bcompany.com",
  "name": "Engineer Test",
  "title": "Software Engineer"
}
```
**Expected**: Phase 1 → Phase 2 → Human review

### Test 6: International Phone
```json
{
  "email": "test@ukcompany.co.uk",
  "phone": "+44 7700 900123",
  "name": "UK Test"
}
```
**Expected**: Route to human review

### Test 7: Cost Limit
Set daily costs near limit  
Process lead  
**Expected**: Cost check blocks processing

## Verification Steps
1. Verify Phase 1 costs: $0.01 per lead
2. Verify Phase 2 only runs if Phase 1 passes
3. Check ICP scores assigned
4. Confirm routing logic works
5. Verify costs tracked in Daily_Costs 