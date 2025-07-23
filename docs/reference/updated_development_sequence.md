✓ Updated updated_development_sequence.md - Added "Enhanced: Add international routing to human review if non-US phone detected (e.g., non-+1 prefixes)." to Session 3: Qualification & Enrichment; Added "[ ] Verify nested expressions work but use simple ones per 2025 Airtable updates." to Session 7: Final Polish checklist; Added "Session 8: Phase 2 Prep" stub with specified content.
```updated_development_sequence.md
# UYSP Development Sequence - Updated with Critical Discoveries

This document outlines the phased, session-based development process for the UYSP system. **UPDATED** to include mandatory field normalization as Session 0 and other critical discoveries from failure analysis.

## Pre-Build Checklist (30-60 minutes)
- Verify MCP Tools: Test n8n-mcp, airtable-mcp, context7, testsprite
- Create Airtable Base: Use airtable-mcp with updated schemas v2
- Set Up n8n: Add credentials; set TEST_MODE=true
- Load Critical Patterns: 00-field-normalization-mandatory.txt, 06-reality-based-testing-protocol.txt
- **NEW**: Create Field_Mapping_Log table in Airtable (MANDATORY)

Fallback: If MCP fails, generate JSON/manuals via AI.

## Session 0: Field Normalization (MANDATORY FIRST - 1 hour)
**DISCOVERY**: Without this, 100% failure rate on all webhooks
**Goal**: Smart Field Mapper implementation and testing
**Load**: 00-field-normalization-mandatory.txt (CRITICAL PATTERN)

**Build**:
- Field_Mapping_Log table in Airtable (if not created in pre-build)
- Smart Field Mapper workflow component
- Test with ALL 10 field variations from Reality-Based Test Suite v2
- Unknown field logging system

**Test**: 
- Process all 10 payload variations from test suite
- Verify 95%+ field capture rate
- Check Field_Mapping_Log for unknowns
- **EVIDENCE REQUIRED**: Field mapping success rates, not just HTTP 200s

**Success Criteria**:
- [ ] Smart Field Mapper handles email/Email/EMAIL/email_address variations
- [ ] Boolean conversions working (yes/true/1 → true)
- [ ] Name splitting functional (full_name → first_name + last_name)
- [ ] Unknown fields logged to Field_Mapping_Log
- [ ] 95%+ field capture rate achieved
- [ ] Exported as reusable component

**Checkpoint**: Field normalization working with evidence - MANDATORY before Session 1

## Session 1: Foundation (2 hours)
**Goal**: Webhook reception, test mode, Airtable basics
**Load**: Blueprint (Env Vars, Webhooks, Schemas); patterns/01-core-patterns.txt
**PREREQUISITE**: Session 0 MUST be complete

**Build**:
- Bootstrap: Set environment variables, create remaining tables via airtable-mcp
- Webhook Receiver: Authentication, integrate Session 0 Smart Field Mapper as FIRST NODE
- Test Mode Enforcement  
- Airtable Upsert: With duplicate prevention and multiple match logging
- **CRITICAL**: All downstream nodes use normalized data from Session 0

**Test**: 
- Send Test Payload 1 via testsprite
- Verify field normalization working
- Check Airtable record created with ALL expected fields
- **EVIDENCE REQUIRED**: Airtable record ID, execution ID, field count

**Platform Gotchas to Check**:
- [ ] "Always Output Data" enabled on all IF/Switch nodes (Settings tab)
- [ ] Credentials selected via UI (never programmatically)
- [ ] Expressions have proper spacing: `{{ $json.field }}`
- [ ] Table references use IDs not names: `tblXXXXXX`

**Checkpoint**: Workflow ID noted in Workflow_IDs table, field normalization integrated

## Session 1.5: Platform Gotcha Prevention (30 minutes)
**NEW SESSION**: Address critical platform issues discovered during failures
**Goal**: Prevent the most common failure modes

**Manual UI Tasks** (Cannot be automated):
- [ ] Human enables "Always Output Data" on all IF/Switch nodes
- [ ] Human verifies all credentials selected via dropdown
- [ ] Human confirms webhook test mode activation process

**Validation**:
- [ ] Test payload with missing fields doesn't break workflow
- [ ] Expression syntax validated with proper spacing
- [ ] Airtable operations use table IDs consistently

## Session 2: Compliance & Safety (2 hours)
**Goal**: DND, SMS limits, pre-flight checks
**Load**: Blueprint (API Configs, Compliance); patterns/02-compliance-patterns.txt

**Build**:
- DND List initialization and checking
- SMS Pre-flight: 10DLC, monthly count, DND, TCPA time windows
- Universal retry logic for rate limits
- **Enhanced**: Compliance tracking fields in Communications table
- Integrate into Session 1 workflow

**Test**: 
- Simulate opt-out scenarios; verify blocking
- Test time window validation
- Check monthly limit enforcement
- **EVIDENCE REQUIRED**: Compliance checks logged, no SMS sent to DND numbers

**Checkpoint**: Compliance enforced with tracking

## Session 3: Qualification & Enrichment (3 hours)  
**Goal**: Two-phase qualification, caching, scoring, phone validation
**Load**: Blueprint (Enrichment Waterfall, ICP Algorithm); patterns/03-enrichment-patterns.txt

**Build**:
- Two-Phase Qualification: Company check → Person enrichment with human review routing
- Enrichment cache checking (90-day expiry)
- ICP Scoring: Claude AI with domain fallback
- Phone validation: International routing to human review
- Cost logging and API call tracking per lead
- **Enhanced**: Processing pipeline tracking fields
- Integrate into Session 1 workflow
Enhanced: Add international routing to human review if non-US phone detected (e.g., non-+1 prefixes).

**Test**: 
- Process 10 samples covering all routing scenarios
- Check qualification accuracy and routing decisions
- Verify cost tracking per lead
- **EVIDENCE REQUIRED**: ICP scores assigned, routing decisions logged, costs tracked

**Checkpoint**: Qualified leads ready for SMS with full tracking

## Session 4: SMS Sending (2 hours)
**Goal**: SMS with compliance, templates, delivery handling  
**Load**: Blueprint (SMS Templates, Cost Control); patterns/04-sms-patterns.txt

**Build**:
- SMS template engine with personalization
- Full compliance checking before send
- SMS sending via SimpleTexting API
- Monthly SMS count tracking
- Error recovery for failed sends
- SMS delivery webhook handler
- **Enhanced**: Delivery tracking and compliance logging

**Test**:
- Simulate SMS sends in TEST_MODE
- Verify template personalization
- Check compliance gate enforcement
- Test delivery webhook processing
- **EVIDENCE REQUIRED**: SMS logged in Communications, delivery status tracked

**Checkpoint**: SMS system operational with full compliance

## Session 5: Utilities & Complete Flow (2 hours)
**Goal**: Metrics, error handling, end-to-end integration
**Load**: Blueprint (Monitoring, Volumes); patterns/05-utility-patterns.txt

**Build**:
- Daily metrics calculation with enhanced performance tracking
- Calendly webhook handler for meeting attribution
- Centralized error handler with detailed logging
- Human review queue management
- **NEW**: Circuit breaker for cost limits
- Connect all components into uysp-lead-processing-v1

**Test**:
- Run 50 test leads through complete system
- Verify end-to-end flow from webhook to SMS
- Check all metrics calculating correctly
- Test error handling and recovery
- **EVIDENCE REQUIRED**: Complete flow metrics, error handling working

**Checkpoint**: Full system operational with monitoring

## Session 6: Reality-Based Testing (2 hours)
**Goal**: Comprehensive testing with actual verification
**Load**: Reality-Based Test Suite v2, 06-Reality-Based Testing Protocol.txt

**Execute All Test Categories**:
- Field variation tests (10+ payload types)
- Duplicate prevention scenarios
- Error condition handling
- Platform gotcha verification
- End-to-end integration tests
- Circuit breaker testing

**Verification Protocol**:
- Check ACTUAL Airtable records created (not just HTTP 200s)
- Verify field mapping success rates
- Confirm workflow completion without errors
- Validate all tracking fields populated
- **EVIDENCE REQUIRED**: Record IDs, execution IDs, field capture rates

**Success Criteria**:
- [ ] 95%+ field mapping success rate
- [ ] Zero duplicate records created
- [ ] 100% workflow execution success
- [ ] All compliance checks passing
- [ ] Cost tracking accurate

## Session 7: Final Polish & Go-Live Prep (1 hour)
**Goal**: Production readiness verification
**Load**: Blueprint (Phase 1 Checklist, Go-Live Requirements)

**Final Validations**:
- Export all workflows to backups
- Verify 10DLC registration status
- Confirm all API credentials valid
- Test circuit breaker functionality
- Validate human review queue setup

**Go-Live Checklist**:
- [ ] TEST_MODE=false (only after 10DLC approved)
- [ ] DAILY_COST_LIMIT=50 
- [ ] All workflows active and tested
- [ ] Monitoring alerts configured
- [ ] Team trained on human review queue
- [ ] Verify nested expressions work but use simple ones per 2025 Airtable updates.

## Session 8: Phase 2 Prep
Goal: Add two-way SMS and re-engagement stubs; Build: Placeholder nodes for Claude AI conversations and batch mining; Test: Simulate opt-outs and replies.

## Critical Success Factors (From Failure Analysis)

### Mandatory Session Order:
1. **Session 0** - Field normalization (cannot skip)
2. **Session 1** - Foundation (must use Session 0 output)
3. **Session 1.5** - Platform gotcha prevention (manual UI tasks)
4. **Sessions 2-5** - Build incrementally 
5. **Session 6** - Reality-based testing (verify everything)
6. **Session 7** - Go-live preparation

### Evidence Requirements:
- Every "success" claim must include Airtable record IDs
- All tests must verify actual record creation
- Field mapping success rates must be measured
- Execution IDs required for all workflow tests

### Platform Gotcha Prevention:
- Smart Field Mapper MUST be first node after every webhook
- "Always Output Data" enabled on all conditional nodes
- Credentials selected via UI only (never programmatically)  
- Table references use IDs not names
- Expression syntax includes proper spacing

### Recovery Preparedness:
- Export workflows after each session
- Document any platform-specific workarounds discovered
- Maintain backup procedures throughout development
- Test recovery from component failures

## Monitoring Progress
Track completion in memory_bank/progress.md with evidence:
- Session completion with workflow/record IDs
- Field mapping success rates achieved
- Platform gotchas addressed
- Evidence collected for each milestone

*This sequence incorporates all lessons learned from the original implementation failures and provides a proven path to success.*