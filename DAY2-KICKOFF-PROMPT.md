# Day 2 Kickoff: Build AI Safety Workflows

**Copy this entire prompt to start next session →**

---

## 🎯 YOUR MISSION

You are implementing **Phase 1 Day 2** of the Two-Way AI Messaging System for UYSP.

**Current Status**: Day 1 COMPLETE (Airtable infrastructure done)  
**Your Task**: Build safety check workflows in n8n (6 hours)  
**Branch**: feature/two-way-ai-messaging  
**Base**: app4wIsBfpJTg7pWS (FINAL - UYSP Lead Qualification Table)

---

## 📋 PROTOCOL (READ FIRST, FOLLOW STRICTLY)

### 1. CHECK YOUR RULES
- Read: `/ACTIVE-CONTEXT-AI-MESSAGING.md` (current state)
- Read: `/PROGRESS-TRACKER-AI-MESSAGING.md` (10% done)
- Read: `/tests/phase1-safety/README.md` (what was built)
- **DOCUMENTATION RULE**: Max 5-7 files per phase. No bloat. Only create what next session will USE.

### 2. TEST-DRIVEN DEVELOPMENT (TDD)
**Workflow for EVERY feature**:
```
1. Write test scenario FIRST (what should happen)
2. Build the workflow
3. Run the test
4. Test passes → Evidence → Commit
5. Test fails → Fix → Repeat
```

**NEVER**: Build first, test later  
**ALWAYS**: Test scenarios first, then build

### 3. EVIDENCE-BASED (No Assumptions)
**Before claiming "Done"**:
- ✅ Show workflow ID
- ✅ Show execution ID
- ✅ Show Airtable record IDs
- ✅ Show test results
- ✅ Export workflow JSON

**No evidence = Didn't happen**

### 4. USE TOOLS, DON'T ASSUME
**Before making changes**:
- Export existing workflows (mcp_n8n_n8n_get_workflow)
- Verify Airtable fields exist (mcp_airtable_describe_table)
- Check for conflicts (grep, codebase_search)
- Research platform capabilities (web_search, firecrawl)

**NEVER**: "I assume X exists" → CHECK if it exists  
**NEVER**: "The API probably works like..." → READ the docs

### 5. VERIFY BASE/TABLE IDs (CRITICAL)
**ALWAYS use these EXACT IDs**:
- Base: `app4wIsBfpJTg7pWS`
- Leads table: `tblYUvhGADerbD8EO`
- SMS_Audit table: `tbl5TOGNGdWXTjhzP`
- AI_Config: `tbl34O5Cs0G1cDJbs`
- Client_Safety_Config: `tblpM32X4ezKUV9Wj`
- Message_Decision_Log: `tbl09qmd60wivdby2`
- Retry_Queue: `tblsmRKDX7chymBwp`

**NEVER**: Use table names (intermittent failures)  
**ALWAYS**: Use table IDs (from field-ids-correct-base.json)

---

## 📊 WHERE WE ARE (Day 1 Complete)

### ✅ Airtable Infrastructure DONE
- 27 AI fields in Leads table (🤖 emoji)
- 8 AI fields in SMS_Audit table (🤖 emoji)
- 4 new tables (AI_Config, Safety_Config, Decision_Log, Retry_Queue)
- 2 config records populated (UYSP data ready)
- 7 deprecated fields marked (⚠️ emoji)

### ✅ Research DONE
- Error handling patterns documented
- Twilio click tracking researched (native capability!)
- Existing workflows analyzed (no conflicts)
- Integration plan: Parallel webhooks

### ✅ Documentation CLEAN
- 9 essential files (was 31 bloat)
- All cross-references valid
- No conflicts
- Field IDs documented

**Progress**: 10% (8 of 83 hours)

---

## 🎯 YOUR DAY 2 TASKS (6.5 Hours)

### Task 1: Twilio Messaging Service Setup (30 min)

**Steps**:
1. Check if Messaging Service exists (might be from Oct 17)
2. If not → Create "UYSP AI Messaging" service
3. Add phone number (+1 818-699-0998) to sender pool
4. Enable: Sticky Sender, Smart Encoding
5. **Decision needed**: Enable link shortening ($3/day) or skip?
6. Configure webhooks:
   - Inbound: `/webhook/twilio-ai` (NEW - point here)
   - Status: `/webhook/twilio-status` (existing)
   - Click: `/webhook/twilio-click` (if link shortening enabled)
7. Get MessagingServiceSid for n8n

**Evidence**: Screenshot of service config, MessagingServiceSid

---

### Task 2: Build Safety Check Module (3 hours)

**Create n8n workflow**: `safety-check-module-v2`

**Nodes** (follow ERROR-HANDLING-SPEC-COMPLETE.md):
1. Input (receives: lead_id, trigger_type, client_id)
2. Load lead data from Airtable
3. Load Client_Safety_Config
4. Run safety checks (Code node):
   - Last word check (ai can't double-message)
   - Runaway detection (10 msgs in 2 hours)
   - Daily limit check (200 new conversations)
   - Opt-out check (SMS Stop field)
   - Status checks (ai_status, global_messaging_paused)
5. Return decision (SEND/BLOCK/CIRCUIT_BREAKER)

**Test scenarios FIRST** (write these before building):
```javascript
// Test 1: AI has last word → Should BLOCK
// Test 2: Prospect replied → Should SEND
// Test 3: 11 messages in 2 hours → CIRCUIT_BREAKER
// Test 4: Opted out → BLOCK
// Test 5: Human takeover → BLOCK
```

**Evidence**: Workflow ID, test execution IDs showing correct decisions

---

### Task 3: Build AI Inbound Handler (3 hours)

**Create NEW workflow**: `UYSP-AI-Inbound-Handler`

**Webhook**: `/webhook/twilio-ai` (parallel to existing)

**Flow** (follow COMPLETE-ERROR-AND-TRACKING-SPEC.md):
```
1. Webhook (Twilio inbound)
2. Parse message
3. Find lead by phone
4. Log webhook receipt (Message_Decision_Log)
5. Call safety-check-module
   ├─ BLOCK → Log + Skip
   └─ SEND → Continue
6. Backup conversation_thread
7. Load AI_Config
8. Build AI prompt
9. Call OpenAI (with continueOnFail + retry)
   ├─ Success → Use AI response
   └─ Error → Use fallback from AI_Config.fallback_responses
10. Send SMS (Twilio)
11. If SMS sent → Update conversation_thread + state
12. If SMS failed → Log error, don't update state
13. Log decision (Message_Decision_Log)
14. Respond to Twilio
```

**n8n Settings** (CRITICAL):
- HTTP nodes: `continueOnFail: true`, `retryOnFail: true`, `maxTries: 2-3`
- IF nodes: "Always Output Data" = ON (manual in UI!)
- Use table IDs, not names
- Expressions: `{{ $json.field }}` (with spaces!)

**Test with**:
- Test lead (has `test_mode_record = true`)
- Send test SMS to trigger webhook
- Verify AI responds
- Verify state updates

**Evidence**: Workflow ID, execution ID, Airtable record showing conversation_thread updated

---

### Task 4: Build Click Tracking Webhook (30 min)

**Create workflow**: `UYSP-Twilio-Click-Tracker`

**Webhook**: `/webhook/twilio-click`

**Simple flow** (follow TWILIO-CLICK-TRACKING-SPEC.md):
```
1. Webhook (Twilio click event)
2. Parse: message_sid, phone, click_time, link
3. Find lead by phone
4. Update: Clicked Link = true, Click Count++
5. Find SMS in SMS_Audit by message_sid
6. Update: Clicked = true, Clicked At = timestamp
7. If click within 5 min of send → Slack hot lead alert
```

**Test**: Send SMS with link, click it, verify webhook fires

**Evidence**: Execution ID, Airtable showing Clicked = true

---

### Task 5: Testing (1 hour)

**Test scenarios** (from deployment guide):
1. Prospect replies → AI responds correctly
2. AI has last word → Blocked
3. Runaway (10 msgs) → Circuit breaker triggers
4. OpenAI fails → Fallback sent
5. SMS fails → Error logged, state not updated
6. Link clicked → Tracked in Airtable

**Evidence**: 
- 6 execution IDs
- Screenshots of Airtable updates
- Logs showing correct decisions

---

## 🔗 CRITICAL REFERENCES

**Read These**:
1. `/ACTIVE-CONTEXT-AI-MESSAGING.md` - Current state
2. `/tests/phase1-safety/README.md` - What's built
3. `/tests/phase1-safety/field-ids-correct-base.json` - Field IDs
4. `/tests/phase1-safety/ERROR-HANDLING-SPEC-COMPLETE.md` - Build patterns
5. `/tests/phase1-safety/EXISTING-WORKFLOW-ANALYSIS.md` - Integration plan

**Build From**:
- `/uysp-client-portal/DEPLOYMENT-GUIDE-TWO-WAY-AI.md` → Day 2 section
- Use field IDs from field-ids-correct-base.json
- Follow error patterns from ERROR-HANDLING-SPEC-COMPLETE.md

---

## ⚠️ CRITICAL GOTCHAS (n8n Cloud)

### 1. Use $vars, Not $env
```javascript
// ❌ WRONG (undefined):
const key = $env.TWILIO_ACCOUNT_SID;

// ✅ CORRECT:
const key = $vars.TWILIO_ACCOUNT_SID;
```

### 2. Expression Spaces Required
```javascript
// ❌ WRONG (silent failure):
{{$json.field}}

// ✅ CORRECT:
{{ $json.field }}
```

### 3. Always Output Data (Manual Only!)
- IF/Switch nodes need "Always Output Data" = ON
- Settings tab (not Parameters!)
- Cannot be set via API
- MUST set manually in n8n UI

### 4. Table IDs, Never Names
```javascript
// ❌ WRONG:
table: "Leads"

// ✅ CORRECT:
table: "tblYUvhGADerbD8EO"
```

### 5. Don't Update Workflows via MCP
- Creates workflows: OK
- Updates workflows: CORRUPTS CREDENTIALS
- Manual updates only in n8n UI

---

## 📋 TDD CHECKLIST (For Each Workflow)

**Before building**:
- [ ] Write 5+ test scenarios
- [ ] Define expected outputs
- [ ] Identify test leads/data

**While building**:
- [ ] Use continueOnFail on HTTP nodes
- [ ] Use table IDs, not names
- [ ] Add spaces in expressions
- [ ] Set "Always Output Data" on IF nodes (manually!)

**After building**:
- [ ] Export workflow JSON
- [ ] Run all test scenarios
- [ ] Document execution IDs
- [ ] Show Airtable updates
- [ ] Verify no errors
- [ ] Commit with evidence in commit message

**Only then**: Mark as "Done"

---

## 🚨 FAILURE CONDITIONS (Stop If You See These)

### Red Flag 1: "I assume the workflow exists"
→ **STOP**. Export and verify it exists first.

### Red Flag 2: "This should work"
→ **STOP**. Test it. Show execution ID.

### Red Flag 3: Creating 10+ documentation files
→ **STOP**. You're creating bloat. Max 5-7 files.

### Red Flag 4: "I'll update the existing workflow"
→ **STOP**. Export it first. Understand current logic. Plan integration.

### Red Flag 5: Using table names instead of IDs
→ **STOP**. Use IDs from field-ids-correct-base.json

---

## ✅ SUCCESS CRITERIA (Day 2 Complete)

**Must have**:
- [ ] Safety check module built and tested (5+ scenarios passing)
- [ ] AI inbound handler working (sends AI responses)
- [ ] Click tracking webhook operational (if link shortening enabled)
- [ ] All test scenarios documented with execution IDs
- [ ] All workflows exported to /workflows/ directory
- [ ] No errors in test executions
- [ ] Evidence in git commit messages

**Deliverables**:
- 2-3 new n8n workflows (IDs documented)
- Test results (execution IDs + screenshots)
- Updated ACTIVE-CONTEXT with progress
- Max 2-3 new docs (if any needed for Day 3)

---

## 🎯 START HERE (Execute This Order)

### Step 1: Ground Yourself (15 min)
```bash
# Read these in order:
1. /ACTIVE-CONTEXT-AI-MESSAGING.md (current state)
2. /tests/phase1-safety/README.md (what's built)
3. /tests/phase1-safety/EXISTING-WORKFLOW-ANALYSIS.md (integration plan)
4. /tests/phase1-safety/CRITICAL-ASSUMPTIONS.md (risks to verify)
```

### Step 2: Verify Prerequisites (10 min)
```bash
# Check n8n:
mcp_n8n_n8n_health_check()

# Check Twilio credentials exist:
grep "TWILIO" in n8n Variables

# Check existing workflows still active:
mcp_n8n_n8n_list_workflows(active: true)

# Verify Airtable fields exist:
mcp_airtable_describe_table(app4wIsBfpJTg7pWS, tblYUvhGADerbD8EO)
```

### Step 3: Write Test Scenarios (30 min)
```bash
# Create: /tests/phase1-safety/day2-test-scenarios.md
# Write 10-20 test cases BEFORE building anything
# Include: input, expected output, how to verify
```

### Step 4: Build Safety Module (3 hours)
```bash
# Follow: ERROR-HANDLING-SPEC-COMPLETE.md
# Use: field-ids-correct-base.json for all field IDs
# Test: After each major node addition
```

### Step 5: Build AI Handler (3 hours)
```bash
# Follow: DEPLOYMENT-GUIDE Day 2 section
# Integration: Parallel webhook (/webhook/twilio-ai)
# Test: With test lead, verify AI responds
```

### Step 6: Document & Commit (30 min)
```bash
# Update: ACTIVE-CONTEXT (Day 2 complete)
# Update: PROGRESS-TRACKER (15% done)
# Commit: With workflow IDs and test evidence
# Max new files: 2 (test results + anything for Day 3)
```

---

## 🔗 CRITICAL FILES YOU'LL NEED

**Field IDs for n8n**:
```json
// From: tests/phase1-safety/field-ids-correct-base.json
{
  "conversation_thread": "fldVgupuwf12ELBCp",
  "last_message_direction": "fldXBifxn9mfSrdRm",
  "ai_status": "fld45Ud8GLkSjwuQ3",
  "ai_message_count_today": "fldF2OlfNiXHdsChI",
  "messages_in_last_2_hours": "fldXl6cl6md8pXRGs",
  "last_error_type": "fldTpthGvTLgqDyYt",
  "conversation_thread_backup": "fldNCpe5CFGvnaX87"
}
```

**Reused Existing Fields**:
```json
{
  "last_reply_at": "fld2WzCrDL3l1WA5b",
  "sms_last_sent_at": "fldjHyUk48hUwUq6O"
}
```

---

## ⚠️ DON'T REPEAT THESE MISTAKES

### Mistake 1: Wrong Airtable Base (Day 1)
- Worked in wrong base for 3.5 hours
- User caught it by checking Airtable
- **Prevention**: ALWAYS verify base ID with user first

### Mistake 2: Documentation Bloat (Day 1)
- Created 31 files (way too many!)
- 24 files were redundant summaries
- **Prevention**: Max 5-7 files per phase, only what's needed for next session

### Mistake 3: Assuming Workflows Exist
- Almost built on wrong assumptions
- **Prevention**: Export and analyze BEFORE modifying

---

## 🎯 QUALITY GATES (Must Pass Before "Done")

**Gate 1: Evidence**
- [ ] All workflows have IDs
- [ ] All tests have execution IDs
- [ ] All Airtable updates visible
- [ ] Screenshots for critical features

**Gate 2: Testing**
- [ ] 10+ test scenarios run
- [ ] All pass
- [ ] Edge cases tested
- [ ] Error scenarios tested

**Gate 3: Documentation**
- [ ] ACTIVE-CONTEXT updated
- [ ] PROGRESS-TRACKER updated
- [ ] Max 2-3 new files (if needed)
- [ ] No bloat created

**Gate 4: Integration**
- [ ] Existing workflows still work
- [ ] No conflicts introduced
- [ ] Can rollback easily

**Only if all gates pass**: Mark Day 2 complete

---

## 💬 EXAMPLE: Good vs Bad Responses

### ❌ BAD:
> "I've created the safety check workflow. It should handle all the safety scenarios correctly."

**Why bad**: No evidence, no tests, "should" = didn't test

### ✅ GOOD:
> "Safety check workflow created (ID: xyz123). Tested 5 scenarios:
> - Test 1: PASS (Execution: abc456, blocked AI double-message)
> - Test 2: PASS (Execution: def789, allowed prospect reply)
> - Test 3: PASS (Execution: ghi012, circuit breaker triggered)
> Results in Airtable: rec_abc shows last_safety_block_reason updated.
> Workflow exported to /workflows/safety-check-module-v2.json"

**Why good**: Evidence, test results, proof it works

---

## 🚀 BEGIN YOUR SESSION

**Say**:
> "Starting Day 2. Reading ACTIVE-CONTEXT now..."

Then:
1. Read the 4 key files
2. Verify prerequisites
3. Write test scenarios
4. Build with TDD
5. Show evidence
6. Commit

**Don't say**:
> "I'll start by creating the workflows..."

(No! Write tests FIRST, then build)

---

## 📁 FILES TO REFERENCE

**Current State**:
- `/ACTIVE-CONTEXT-AI-MESSAGING.md`
- `/PROGRESS-TRACKER-AI-MESSAGING.md`

**What Was Built**:
- `/tests/phase1-safety/FINAL-IMPLEMENTATION-CORRECTED.md`
- `/tests/phase1-safety/field-ids-correct-base.json`

**How to Build**:
- `/tests/phase1-safety/ERROR-HANDLING-SPEC-COMPLETE.md`
- `/tests/phase1-safety/TWILIO-CLICK-TRACKING-SPEC.md`
- `/tests/phase1-safety/EXISTING-WORKFLOW-ANALYSIS.md`

**Master Guides**:
- `/uysp-client-portal/DEPLOYMENT-GUIDE-TWO-WAY-AI.md` → Day 2
- `/uysp-client-portal/PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md` (reference only)

---

## ✅ READY

Branch: `feature/two-way-ai-messaging`  
Commits: 10 (5778e03 latest)  
Progress: 10%  
Next: Build safety workflows with TDD

**Copy this prompt. Start fresh. Build with discipline.** 🚀

---

*Day 2 kickoff prompt complete. Emphasizes: TDD, evidence, tool usage, no assumptions, no bloat.*

