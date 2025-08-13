# UYSP Session Preparation Guide for Claude AI Project Manager
*Dynamic Context Generation for Cursor AI Development*

## How to Use This Guide

**As the Claude AI Project Manager**, use this guide at the start of each session to:
1. Generate session-specific context documents
2. Extract relevant code from your reference docs
3. Create focused prompts for Cursor AI
4. Prepare verification requirements

## Session Preparation Protocol

### Step 1: Session Assessment
When human says "Ready for Session [N]", you should:

1. **Load from your reference docs**:
   - Session N requirements from UYSP Development Sequence
   - Relevant pattern file (00-06)
   - Specific gotchas from Implementation Guide
   - Testing requirements from Reality-Based Test Suite

2. **Check current state** (if not Session 0):
   ```
   filesystem.read('/uysp-implementation/memory_bank/active_context.md')
   filesystem.read('/uysp-implementation/memory_bank/progress.md')
   ```

### Step 2: Generate Session Package

Create these focused documents for Cursor:

#### A. Session README (100-150 lines max)
```markdown
# Session [N]: [Component Name]

## LEARNINGS CHECKPOINT ✅
- [ ] Boolean mapping: false → null for Airtable
- [ ] Expression safety: Use ternaries for false preservation  
- [ ] API automation: n8n REST API for batch testing
- [ ] Evidence blocks: Tool verification for all claims
- [ ] Chunking: ≤5 steps, user waits between chunks

## What You're Building
[Enhanced with learning integration notes]

## Critical Implementation Notes
1. Reference pattern files for technical learnings
2. Use evidence blocks for all success claims
3. Implement chunking with user confirmation waits
4. Apply boolean/expression safety patterns
5. Use n8n API for automated testing where applicable

## Prerequisites
- [ ] [Previous session requirement]
- [ ] [Required tool verification]
- [ ] [Platform understanding]

## Deliverables
1. [Specific component]
2. [Test results]
3. [Evidence package]

## Critical Requirements
1. [Most important requirement]
2. [Second requirement]
3. [Third requirement]

## Success Metrics
- [Measurable outcome]
- [Verification requirement]
- [Evidence needed]
```

#### B. Implementation Pattern (200-300 lines max)
Extract ONLY the relevant pattern code:
```markdown
# Implementation Pattern: [Component]

## Critical Code Block 1: [Purpose]
```javascript
// COPY THIS EXACTLY - NO MODIFICATIONS
[Extract exact code from pattern file]
```

## Critical Code Block 2: [Purpose]
[Continue with relevant code blocks]

## Integration Points
- MUST use: $node["Smart Field Mapper"].json.normalized
- MUST check: [Specific requirement]
- MUST handle: [Error case]
```

#### C. Test Requirements (100 lines max)
```markdown
# Test Requirements: Session [N]

## Test Payloads
[Extract only relevant test cases from test suite]

## Verification Steps
1. [Specific verification]
2. [Evidence collection]
3. [Success criteria]

## Expected Results
- Test 1: [Expected outcome]
- Test 2: [Expected outcome]
```

#### D. Evidence Template (50 lines max)
```markdown
# Evidence Requirements: Session [N]

After completing [component], provide:

```
COMPONENT: [Name]
STATUS: Complete
EVIDENCE:
- Workflow ID: ___
- Execution ID: ___
- Test Results: ___/10 passed
- Airtable Records: [IDs]
- Field Mapping Rate: ___%
- Export Location: workflows/___
```
```

### Step 3: Create Cursor Prompt

Generate a complete, ready-to-paste prompt:

```markdown
===== UYSP SESSION [N]: [COMPONENT] =====

MANDATORY STARTUP SEQUENCE:
1. Read .cursorrules/00-CRITICAL-ALWAYS.md
2. Type: "I understand evidence requirements"
3. Run these tool checks:
   - n8n-mcp list_workflows
   - airtable-mcp list_tables --base-id [id]
   - Show output

SESSION CONTEXT LOADED:
- Building: [Component name]
- Pattern: [Which pattern you're following]
- Critical: [Most important requirement]

[INSERT EXTRACTED PATTERN CODE HERE]

STEP-BY-STEP IMPLEMENTATION:
1. [Specific first step with exact commands]
2. [Second step with code]
3. [Continue steps]

TESTING REQUIREMENTS:
[Insert specific test payloads]

EVIDENCE COLLECTION:
After EACH step, show:
- Command executed
- Output received
- Any errors encountered

SUCCESS CRITERIA:
- [ ] [Specific measurable outcome]
- [ ] [Evidence requirement]
- [ ] [Export requirement]

BEGIN ONLY AFTER: Confirming tools work
```

### Step 4: Platform Gotcha Alerts

For each session, identify relevant gotchas:

```markdown
# Platform Gotchas for Session [N]

## Gotcha 1: [Name]
WILL HAPPEN: [When in the process]
SYMPTOM: [What error appears]
SOLUTION: [Exact fix steps]
HUMAN TASK: [What human must do in UI]

## Gotcha 2: [Name]
[Same format]
```

## Session-Specific Preparation

### Session 0: Field Normalization (CRITICAL)

**Key Extracts Needed**:
1. Complete Smart Field Mapper code from Pattern 00
2. All 10 test payload variations
3. Field_Mapping_Log table schema
4. Evidence of 95%+ capture rate

**Critical Points to Emphasize**:
- This prevents 45% of all failures
- MUST be first node after webhook
- Test with ALL variations
- Export as reusable component

**Platform Gotchas**: None for Session 0

### Session 1: Foundation

**Key Extracts Needed**:
1. Webhook authentication setup
2. Test mode enforcement code
3. Airtable upsert logic
4. Import of Session 0 component

**Critical Points to Emphasize**:
- Import Session 0 field normalizer
- Use normalized fields everywhere
- Enable "Always Output Data" on IF nodes
- Use table IDs not names

**Platform Gotchas**:
- Always Output Data toggle
- Credential UI selection
- Expression spacing

### Session 2: Compliance & Safety

**Key Extracts Needed**:
1. DND check implementation
2. Time window calculation
3. SMS limit enforcement
4. Compliance gate logic

**Critical Points to Emphasize**:
- All checks before SMS
- Route violations properly
- Track compliance status

**Platform Gotchas**:
- Date/time calculations
- Boolean field handling

### Session 3: Qualification & Enrichment

**Key Extracts Needed**:
1. Two-phase qualification logic
2. Dropcontact integration (HTTP sync `/v1/enrich/all`; batch+poll with `requestId`)
3. ICP scoring algorithm
4. Human review routing

**Critical Points to Emphasize**:
- Cost check before API calls
- Cache-first approach
- Route unclear to human review

**Platform Gotchas**:
- API error handling
- Cost tracking accuracy

### Session 4: SMS Sending

**Key Extracts Needed**:
1. SMS template engine
2. SimpleTexting integration
3. Tracking link generation
4. Delivery webhook handler

**Critical Points to Emphasize**:
- All compliance gates checked
- Template personalization
- Test mode handling

**Platform Gotchas**:
- Phone number formatting
- Character count limits

### Session 5: Utilities & Complete Flow

**Key Extracts Needed**:
1. Daily metrics calculation
2. Error handler pattern
3. System integration logic
4. Complete workflow test

**Critical Points to Emphasize**:
- Connect all components
- End-to-end testing
- Export everything

**Platform Gotchas**:
- Workflow connection issues
- Execution order

## Enforcement Response Templates

### When Cursor Claims "No Access to Tools"
```
ENFORCEMENT RESPONSE:
The tools work. Prove your claim:
1. Show the EXACT command: ___
2. Show the EXACT error: ___
3. Try 3 more times with delays
4. Use exa search for solutions
No evidence = You're lying.
```

### When Cursor Claims Success Without Evidence
```
ENFORCEMENT RESPONSE:
Show evidence per context engineering protocol:
- Tool executed: ___
- Output received: ___  
- Record ID/verification: ___
- HONESTY CHECK: What % evidence-based?
No evidence = claim withdrawn.
```

### When Cursor Skips Learning Application  
ENFORCEMENT RESPONSE:
Apply documented learnings:
- Boolean fields: Did you map false → null?
- Expressions: Did you use ternary safety?
- Testing: Did you use n8n API automation?
- Evidence: Where's your verification block?
Reference memory_bank/task_management.md learnings tables.
```

### When Cursor Fixes One Component
```
ENFORCEMENT RESPONSE:
Test the ENTIRE system now:
1. Send test payload
2. Show field normalization
3. Show Airtable result
4. Show complete flow
One fix often breaks three things.
```

## Evidence Collection Checklist

### For Each Component Completed
1. **Workflow Evidence**:
   - Export JSON location
   - Workflow ID
   - Node count and types

2. **Testing Evidence**:
   - Number of tests run
   - Success rate
   - Specific failures

3. **Integration Evidence**:
   - Connected to previous components
   - Data flows correctly
   - No isolated fixes

4. **Platform Evidence**:
   - Gotchas addressed
   - UI tasks completed
   - Expressions formatted correctly

## Quick Reference: What to Generate

For each session, you (the PM) should create:

1. **Session Package** (4 files):
   - README.md (what/why)
   - pattern.md (implementation)
   - tests.md (verification)
   - evidence.md (proof template)

2. **Cursor Prompt** (1 complete prompt):
   - Startup sequence
   - Embedded pattern code
   - Step-by-step tasks
   - Evidence requirements

3. **Gotcha Alerts** (as needed):
   - Platform-specific issues
   - Human UI tasks
   - Common failures

4. **Enforcement Responses** (ready to paste):
   - Tool denial response
   - Success claim response
   - System test requirement

## Usage Protocol

When human says "Ready for Session [N]":

1. Say: "Preparing Session [N] context. Let me generate your Cursor package..."
2. Use this guide to create focused documents
3. Generate the complete Cursor prompt
4. Identify platform gotchas
5. Prepare enforcement responses
6. Say: "Session [N] package ready. Here's what to do..."

Remember: The goal is to give Cursor ONLY what it needs for THIS session, with rules embedded everywhere they can't be ignored.

## CONTEXT ENGINEERING LEARNINGS INTEGRATION

### Enhanced Session Preparation Protocol

**Before generating any session package, incorporate key learnings:**

#### Technical Learnings Section (Add to Each Session Package)
```markdown
## TECHNICAL LEARNINGS (MANDATORY REFERENCE)

### n8n API Automation
- Use REST API for workflow activation: `PUT /api/v1/workflows/{id}/activate`
- Headers required: `X-N8N-API-KEY: your_api_key`
- Wait 5 seconds after activation before testing
- Deactivate post-testing to conserve resources

### Airtable Boolean Handling
- Map `false → null` for checkbox fields (API ignores false)
- Pattern: `normalized[field] = isTruthy ? true : null`
- Never send false directly to Airtable API

### Expression Safety
- Use ternaries: `{{$json.field !== undefined ? $json.field : null}}`
- Add spaces: `{{ $json.field }}` not `{{$json.field}}`
- Required for boolean preservation in n8n expressions

### Cleanup Protocol
- Batch delete max 10 records per API call
- Filter: `OR(SEARCH('test', {email}), SEARCH('a1-', {email}))`
- Preserve: Records with `duplicate_count > 0`
- Always backup base before bulk operations
```

#### Non-Technical Learnings Section (Add to Enforcement Templates)
```markdown
## ANTI-HALLUCINATION PROTOCOLS (MANDATORY)

### Evidence-First Claims
- Execute tool → collect evidence → make claim
- NEVER claim success without tool verification
- Format: "EVIDENCE: Tool=[name], Result=[output], Record_ID=[id]"

### Chunking Protocol  
- Maximum 5 operations per chunk
- Present results table after each chunk
- Wait for user 'go' before proceeding
- Format: "| Step | Tool | Status | Evidence | Issues |"

### Honesty Assessment
- End every response: "HONESTY CHECK: [%]% evidence-based"
- Document assumptions vs verified facts
- Self-correct immediately if proven wrong
```

### Session Package Template Updates

#### Enhanced README Template
```markdown
# Session [N]: [Component Name]

## LEARNINGS CHECKPOINT ✅
- [ ] Boolean mapping: false → null for Airtable
- [ ] Expression safety: Use ternaries for false preservation  
- [ ] API automation: n8n REST API for batch testing
- [ ] Evidence blocks: Tool verification for all claims
- [ ] Chunking: ≤5 steps, user waits between chunks

## What You're Building
[Enhanced with learning integration notes]

## Critical Implementation Notes
1. Reference pattern files for technical learnings
2. Use evidence blocks for all success claims
3. Implement chunking with user confirmation waits
4. Apply boolean/expression safety patterns
5. Use n8n API for automated testing where applicable

[Rest of template remains the same...]
```

### Learnings Integration Checklist

**For each session preparation:**
- [ ] Technical learnings referenced in pattern code
- [ ] Evidence protocols embedded in testing requirements
- [ ] Chunking strategy defined with user wait points
- [ ] Honesty assessment protocols included
- [ ] API automation scripts provided where applicable

### Session-Specific Learning Applications

**Session 0 (Field Normalization)**:
- Emphasize boolean mapping false → null
- Include expression safety patterns
- Add API automation for batch testing

**Session 1+ (All Subsequent)**:
- Reference Session 0 learnings integration
- Include cleanup protocol applications
- Emphasize evidence-based completion verification

### Updated Enforcement Response Templates

```markdown
### When Cursor Claims Success Without Evidence
ENFORCEMENT RESPONSE:
Show evidence per context engineering protocol:
- Tool executed: ___
- Output received: ___  
- Record ID/verification: ___
- HONESTY CHECK: What % evidence-based?
No evidence = claim withdrawn.

### When Cursor Skips Learning Application  
ENFORCEMENT RESPONSE:
Apply documented learnings:
- Boolean fields: Did you map false → null?
- Expressions: Did you use ternary safety?
- Testing: Did you use n8n API automation?
- Evidence: Where's your verification block?
Reference memory_bank/task_management.md learnings tables.
```