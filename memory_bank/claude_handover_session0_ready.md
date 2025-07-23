# Claude Handover Document: Ready for Session 0
*Complete System State & Testing Requirements*

## Handover Summary
**Date**: July 23, 2025
**Current State**: Phase 00 COMPLETE - Ready for Session 0 Comprehensive Testing
**Previous Achievement**: Smart Field Mapper implemented with 98% field capture rate
**Next Goal**: Test ALL 15+ payload variations and achieve 95%+ success rate

## Critical Context for Next Claude

### What's Been Accomplished
1. **Phase 00 Field Normalization**: 100% Complete
   - Workflow ID: `eiVyE76nCF9g20zU`
   - Smart Field Mapper Node ID: `a3493afa-1eaf-41bb-99ca-68fe76209a29`
   - Evidence: 8 test records proving 98% capture rate
   - Version: `8aae242d-9586-4dee-befa-10be089392b2`

2. **GitHub Integration**: Complete (awaiting confirmation)
   - Repository: uysp-lead-qualification-v1
   - Version tagged: v0.1.0
   - Branches: main, develop, feature/session-0-testing
   - All sensitive data excluded from commits

3. **Documentation**: Fully updated
   - Memory bank current
   - Workflow backups created
   - Evidence logged
   - Checklists completed

## Session 0: Comprehensive Testing Requirements

### Overview
Session 0 is about testing the Smart Field Mapper with ALL payload variations to ensure robust field normalization before building additional components.

### Test Payload Location
Primary source: `/Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1/docs/reality_based_tests_v2.json`

### Critical Test Cases (Minimum 15)

1. **Standard Kajabi Format**
   ```json
   {
     "email": "test1@example.com",
     "name": "John Doe",
     "phone": "555-0001",
     "company": "Acme Corp",
     "source_form": "webinar-signup",
     "interested_in_coaching": "yes",
     "request_id": "session0-test-001"
   }
   ```

2. **ALL CAPS Variation**
   ```json
   {
     "EMAIL": "test2@example.com",
     "NAME": "Jane Doe",
     "PHONE": "555-0002",
     "COMPANY": "Tech Corp",
     "INTERESTED_IN_COACHING": "YES",
     "request_id": "session0-test-002"
   }
   ```

3. **Mixed Case Chaos**
   ```json
   {
     "Email": "test3@example.com",
     "Name": "Bob Smith",
     "Phone": "555-0003",
     "Company": "StartupCo",
     "request_id": "session0-test-003"
   }
   ```

4. **Alternative Field Names**
   ```json
   {
     "email_address": "test4@example.com",
     "full_name": "Alice Johnson",
     "phone_number": "555-0004",
     "company_name": "BigCorp",
     "form_name": "download-form",
     "request_id": "session0-test-004"
   }
   ```

5. **Boolean String Variations**
   ```json
   {
     "email": "test5@example.com",
     "name": "Charlie Brown",
     "interested_in_coaching": "yes",
     "qualified_lead": "true",
     "contacted": "1",
     "request_id": "session0-test-005"
   }
   ```

6. **Boolean True Values**
   ```json
   {
     "email": "test6@example.com",
     "name": "David Green",
     "interested_in_coaching": true,
     "qualified_lead": 1,
     "contacted": "on",
     "request_id": "session0-test-006"
   }
   ```

7. **International Phone - UK**
   ```json
   {
     "email": "test7@example.com",
     "name": "British User",
     "phone": "+44 7700 900123",
     "company": "UK Corp",
     "request_id": "session0-test-007"
   }
   ```

8. **International Phone - France**
   ```json
   {
     "email": "test8@example.com",
     "name": "French User",
     "phone": "+33 6 12 34 56 78",
     "company": "FR Corp",
     "request_id": "session0-test-008"
   }
   ```

9. **Missing Critical Fields**
   ```json
   {
     "email": "test9@example.com",
     "request_id": "session0-test-009"
   }
   ```

10. **Duplicate Email Test**
    ```json
    {
      "email": "test1@example.com",
      "name": "John Doe DUPLICATE",
      "phone": "555-9999",
      "request_id": "session0-test-010"
    }
    ```

11-15. **Additional Edge Cases**
    - CamelCase fields (emailAddress, firstName, lastName)
    - Underscore variations (first_name, last_name)
    - New Kajabi fields (email_address_1, phone_intl)
    - Boolean false values ("no", "false", "0")
    - Special characters in names

### Testing Protocol

#### For EACH Test Payload:
1. **Prepare Webhook**
   - Human must click "Execute Workflow" in n8n
   - Webhook enters listening mode for ONE request only

2. **Send Test**
   ```bash
   curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
     -H "Content-Type: application/json" \
     -H "X-API-Key: test-key" \
     -d '[TEST_PAYLOAD_HERE]'
   ```
   
   Or use Cursor with:
   ```
   n8n-mcp n8n_trigger_webhook_workflow \
     --webhookUrl "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
     --data '[TEST_PAYLOAD]'
   ```

3. **Verify Results**
   - Check n8n execution completed
   - Verify field normalization output
   - Confirm Airtable record created
   - Check field mapping success rate
   - Log any unknown fields

4. **Document Evidence**
   - Execution ID
   - Airtable record ID
   - Fields captured vs expected
   - Any errors or issues

### Success Metrics for Session 0

1. **Field Capture Rate**: Minimum 95% across ALL tests
2. **Boolean Conversions**: 100% accuracy
3. **International Detection**: 100% accuracy
4. **Duplicate Handling**: Updates, not creates
5. **Unknown Fields**: All logged to Field_Mapping_Log
6. **Workflow Stability**: Zero crashes/errors

### Evidence Collection Template

For each test, document:
```markdown
Test #[X]: [Test Name]
- Payload: [Brief description]
- Execution ID: [n8n execution ID]
- Airtable Record: [Record ID]
- Fields Expected: [X]
- Fields Captured: [Y]
- Success Rate: [Y/X * 100]%
- Unknown Fields: [List any]
- Issues: [Any problems]
```

### Platform Gotchas to Watch

1. **Webhook Test Mode**: Must click "Execute Workflow" before EACH test
2. **Single Request Only**: Webhook stops listening after one request
3. **Manual Testing**: Cannot batch test - must be sequential
4. **Evidence Required**: Always verify Airtable record created
5. **Field References**: Downstream nodes must use `$node["Smart Field Mapper"].json.normalized`

### After Session 0 Complete

1. **Calculate Overall Metrics**
   - Average field capture rate
   - Total unknown fields discovered
   - Boolean conversion accuracy
   - International detection accuracy

2. **Update Field Mapper** (if needed)
   - Add any legitimate new field variations discovered
   - Update boolean conversion logic if gaps found
   - Enhance international detection if needed

3. **Export Component**
   - Create standalone Smart Field Mapper component
   - Document all field variations handled
   - Save as reusable pattern

4. **Prepare for Session 1**
   - Confirm field normalization is bulletproof
   - Document any new platform gotchas discovered
   - Update test suite with edge cases found

## Key Resources & References

### MCP Tools Working Patterns
```javascript
// Test webhook (proven to work):
n8n-mcp n8n_trigger_webhook_workflow --webhookUrl "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" --data '{...}'

// Check Airtable records:
airtable-mcp search_records --baseId appuBf0fTe8tp8ZaF --tableId tblSk2Ikg21932uE0 --searchTerm "test@example.com"

// Get execution details:
n8n-mcp n8n_get_execution --id [execution_id] --includeData true
```

### File Locations
- Test Payloads: `/docs/reality_based_tests_v2.json`
- Pattern Files: `/patterns/00-field-normalization-mandatory.txt`
- Memory Bank: `/memory_bank/active_context.md`
- Evidence Log: `/memory_bank/evidence_log.md`

### Critical Node IDs
- Workflow: `eiVyE76nCF9g20zU`
- Smart Field Mapper: `a3493afa-1eaf-41bb-99ca-68fe76209a29`
- Webhook: `3b7db8f6-b8f7-47c2-a2f1-d4dd907f989f`
- Airtable Search: `ea62e228-6c8b-47a1-9e65-5de7ead82fb4`

## Instructions for Next Claude

1. **Start Here**: Read this handover document completely
2. **Verify State**: Check workflow still exists and is active
3. **Load Test Suite**: Get all test payloads from reality_based_tests_v2.json
4. **Begin Testing**: Guide human through systematic testing
5. **Track Evidence**: Document every test result
6. **Calculate Metrics**: Ensure 95%+ success rate
7. **Update Mapper**: If new variations discovered
8. **Complete Session**: Export component and prepare for Session 1

## Common Pitfalls to Avoid

1. **Rushing Tests**: Each webhook test requires manual activation
2. **Skipping Evidence**: Always verify Airtable records
3. **Ignoring Unknowns**: Check Field_Mapping_Log after each test
4. **Batch Testing**: Not possible - must test sequentially
5. **Success Theater**: HTTP 200 ≠ success, check actual data

## Session 0 Prompt for Cursor

```
===== UYSP SESSION 0: COMPREHENSIVE FIELD MAPPER TESTING =====

CURRENT STATE:
- Phase 00 Complete: Smart Field Mapper implemented
- Workflow ID: eiVyE76nCF9g20zU
- Ready for comprehensive testing

OBJECTIVE: Test 15+ payload variations to ensure 95%+ field capture

[Include specific test payloads and verification steps]
```

---

*This handover ensures continuity for Session 0 comprehensive testing. The Smart Field Mapper is ready - now we need to prove it handles ALL edge cases before building on top of it.*
