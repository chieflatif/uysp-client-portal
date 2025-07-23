# Evidence Requirements: Session 1

After completing Webhook & Data Flow, provide:

## COMPONENT: Foundation Webhook System
**STATUS**: Complete

## EVIDENCE:

### Workflow Created
- Workflow ID: uysp-foundation-webhook-v1
- Execution IDs: [List all 8 test execution IDs]

### Test Results Summary
- Test 1 (New Lead): Record ID _____, Status: _____
- Test 2 (Duplicate Email): Updated Record ID _____, Status: _____
- Test 3 (Duplicate Phone): Updated Record ID _____, Status: _____
- Test 4 (Field Normalization): Record ID _____, Normalized Fields: _____
- Test 5 (Minimal Data): Record ID _____, Status: _____
- Test 6 (Auth Failure): Status: 401 Unauthorized ✓
- Test 7 (Test Mode): Record ID _____, test_mode_record: true ✓
- Test 8 (Complete Profile): Record ID _____, All Fields: _____

### Critical Metrics
- Authentication Success Rate: ___% (7/8 tests should succeed)
- Duplicate Prevention: ___% (Tests 2&3 must update, not create)
- Field Normalization Rate: ___% (Session 0 integration working)
- Test Mode Compliance: ___% (All records flagged correctly)

### Airtable Verification
- Total People Records Created: _____
- Total People Records Updated: _____
- Zero Duplicate Records: ✓ / ✗
- Test Mode Records Flagged: _____ / _____

### Integration Points Verified
- ✓ / ✗ Smart Field Mapper (Session 0) called successfully
- ✓ / ✗ Webhook authentication working
- ✓ / ✗ Identity resolution (email/phone matching)
- ✓ / ✗ Create/Update branching logic
- ✓ / ✗ Test mode enforcement

## Required Screenshots:
1. Workflow overview showing all nodes connected
2. Test execution results for all 8 tests
3. Airtable People table showing test records
4. Authentication failure response (Test 6)
5. Duplicate update proof (Tests 2&3)

## Export Location:
- Workflow backup: workflows/backups/session-1-foundation-webhook.json
- Test results: tests/session-1-results.json

## Next Session Readiness:
- ✓ / ✗ Webhook receiving and processing leads
- ✓ / ✗ No duplicate records being created
- ✓ / ✗ Field normalization integrated
- ✓ / ✗ Test mode working correctly
- ✓ / ✗ Ready for Session 2 (DND compliance) 