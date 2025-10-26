# Day 2 Test Scenarios - Safety Module & AI Handler

**Date**: October 26, 2025  
**Purpose**: Define test scenarios BEFORE building (TDD approach)  
**Status**: Test definitions - no implementation yet  
**Coverage**: Safety checks, AI handler, error handling, click tracking

---

## 🎯 TEST-DRIVEN DEVELOPMENT PROTOCOL

**Workflow**:
1. ✅ Define test scenarios (this file)
2. ⏸️ Identify test data needed (leads, config)
3. ⏸️ Build workflows
4. ⏸️ Run tests
5. ⏸️ Document results (execution IDs)
6. ⏸️ Fix failures
7. ⏸️ Commit when all pass

---

## 📋 TEST DATA REQUIREMENTS

### Test Lead Records Needed

Create these in Airtable `Leads` table for testing:

**Test Lead 1: Happy Path**
- Phone: +1 (555) 001-0001
- `test_mode_record`: true
- `ai_status`: active
- `🤖 last_message_direction`: inbound (prospect replied)
- `🤖 messages_in_last_2_hours`: 2
- `🤖 ai_message_count_today`: 5
- `SMS Stop`: false

**Test Lead 2: AI Has Last Word (Should Block)**
- Phone: +1 (555) 002-0002
- `test_mode_record`: true
- `ai_status`: active
- `🤖 last_message_direction`: outbound (AI last messaged)
- `🤖 messages_in_last_2_hours`: 3
- `SMS Stop`: false

**Test Lead 3: Runaway Conversation (Circuit Breaker)**
- Phone: +1 (555) 003-0003
- `test_mode_record`: true
- `ai_status`: active
- `🤖 last_message_direction`: inbound
- `🤖 messages_in_last_2_hours`: 11 (over limit!)
- `SMS Stop`: false

**Test Lead 4: Opted Out**
- Phone: +1 (555) 004-0004
- `test_mode_record`: true
- `ai_status`: active
- `🤖 last_message_direction`: inbound
- `SMS Stop`: true
- `SMS Stop Reason`: STOP

**Test Lead 5: Human Takeover**
- Phone: +1 (555) 005-0005
- `test_mode_record`: true
- `ai_status`: human_takeover
- `🤖 conversation_locked_by_human`: true
- `🤖 human_assigned_to`: "Latif"

**Test Lead 6: Paused AI**
- Phone: +1 (555) 006-0006
- `test_mode_record`: true
- `ai_status`: paused
- `🤖 pause_until`: (1 hour from now)
- `🤖 pause_reason`: "Testing pause functionality"

**Test Lead 7: Daily Limit Reached**
- Phone: +1 (555) 007-0007
- `test_mode_record`: true
- `ai_status`: active
- `🤖 ai_message_count_today`: 201 (over daily limit!)

---

## 🛡️ SAFETY MODULE TEST SCENARIOS

### Test Group 1: Last Word Check

**Test 1.1: Prospect Has Last Word (SEND)**
```json
{
  "test_id": "safety-001",
  "test_name": "Prospect replied - AI can respond",
  "input": {
    "lead_id": "rec_test_lead_1",
    "trigger_type": "inbound_reply",
    "client_id": "uysp_001"
  },
  "expected_checks": {
    "last_word": "PASS (prospect has last word)",
    "runaway": "PASS (2 messages in 2 hours)",
    "daily_limit": "PASS (5 messages today)",
    "opt_out": "PASS (not opted out)",
    "status": "PASS (ai_status = active)"
  },
  "expected_decision": "SEND",
  "expected_decision_reason": "All safety checks passed"
}
```

**Test 1.2: AI Has Last Word (BLOCK)**
```json
{
  "test_id": "safety-002",
  "test_name": "AI already responded - should block",
  "input": {
    "lead_id": "rec_test_lead_2",
    "trigger_type": "inbound_reply",
    "client_id": "uysp_001"
  },
  "expected_checks": {
    "last_word": "FAIL (AI has last word)",
    "runaway": "PASS",
    "daily_limit": "PASS",
    "opt_out": "PASS",
    "status": "PASS"
  },
  "expected_decision": "BLOCK",
  "expected_decision_reason": "AI already has last word - waiting for prospect reply"
}
```

---

### Test Group 2: Runaway Detection

**Test 2.1: Normal Conversation (SEND)**
```json
{
  "test_id": "safety-003",
  "test_name": "Normal conversation pace",
  "input": {
    "lead_id": "rec_test_lead_1",
    "messages_in_last_2_hours": 5
  },
  "expected_checks": {
    "runaway": "PASS (5 < 10 limit)"
  },
  "expected_decision": "SEND"
}
```

**Test 2.2: Runaway Detected (CIRCUIT_BREAKER)**
```json
{
  "test_id": "safety-004",
  "test_name": "Too many messages - circuit breaker",
  "input": {
    "lead_id": "rec_test_lead_3",
    "messages_in_last_2_hours": 11
  },
  "expected_checks": {
    "runaway": "FAIL (11 >= 10 limit)"
  },
  "expected_decision": "CIRCUIT_BREAKER",
  "expected_decision_reason": "Runaway conversation detected: 11 messages in 2 hours",
  "expected_updates": {
    "ai_status": "paused",
    "pause_reason": "Circuit breaker: runaway conversation",
    "last_safety_block_reason": "runaway_conversation"
  },
  "expected_alert": "Slack alert to #critical-alerts"
}
```

---

### Test Group 3: Daily Limit

**Test 3.1: Within Daily Limit (SEND)**
```json
{
  "test_id": "safety-005",
  "test_name": "Within daily message limit",
  "input": {
    "ai_message_count_today": 50
  },
  "expected_checks": {
    "daily_limit": "PASS (50 < 200 limit)"
  },
  "expected_decision": "SEND"
}
```

**Test 3.2: Daily Limit Reached (BLOCK)**
```json
{
  "test_id": "safety-006",
  "test_name": "Daily limit exceeded",
  "input": {
    "lead_id": "rec_test_lead_7",
    "ai_message_count_today": 201
  },
  "expected_checks": {
    "daily_limit": "FAIL (201 > 200 limit)"
  },
  "expected_decision": "BLOCK",
  "expected_decision_reason": "Daily message limit reached (201/200)",
  "expected_updates": {
    "last_safety_block_reason": "daily_limit_reached"
  }
}
```

---

### Test Group 4: Opt-Out Check

**Test 4.1: Active SMS (SEND)**
```json
{
  "test_id": "safety-007",
  "test_name": "SMS not opted out",
  "input": {
    "SMS Stop": false
  },
  "expected_checks": {
    "opt_out": "PASS (not opted out)"
  },
  "expected_decision": "SEND"
}
```

**Test 4.2: Opted Out (BLOCK)**
```json
{
  "test_id": "safety-008",
  "test_name": "Prospect opted out",
  "input": {
    "lead_id": "rec_test_lead_4",
    "SMS Stop": true,
    "SMS Stop Reason": "STOP"
  },
  "expected_checks": {
    "opt_out": "FAIL (opted out)"
  },
  "expected_decision": "BLOCK",
  "expected_decision_reason": "Prospect opted out via STOP",
  "expected_updates": {
    "last_safety_block_reason": "opted_out"
  }
}
```

---

### Test Group 5: AI Status Checks

**Test 5.1: AI Active (SEND)**
```json
{
  "test_id": "safety-009",
  "test_name": "AI status active",
  "input": {
    "ai_status": "active"
  },
  "expected_checks": {
    "status": "PASS (AI active)"
  },
  "expected_decision": "SEND"
}
```

**Test 5.2: AI Paused (BLOCK)**
```json
{
  "test_id": "safety-010",
  "test_name": "AI paused",
  "input": {
    "lead_id": "rec_test_lead_6",
    "ai_status": "paused",
    "pause_until": "2025-10-26T15:00:00Z"
  },
  "expected_checks": {
    "status": "FAIL (AI paused until 3pm)"
  },
  "expected_decision": "BLOCK",
  "expected_decision_reason": "AI paused until 2025-10-26T15:00:00Z"
}
```

**Test 5.3: Human Takeover (BLOCK)**
```json
{
  "test_id": "safety-011",
  "test_name": "Human took over conversation",
  "input": {
    "lead_id": "rec_test_lead_5",
    "ai_status": "human_takeover",
    "conversation_locked_by_human": true,
    "human_assigned_to": "Latif"
  },
  "expected_checks": {
    "status": "FAIL (human takeover)"
  },
  "expected_decision": "BLOCK",
  "expected_decision_reason": "Conversation assigned to human: Latif"
}
```

---

### Test Group 6: Global Messaging Paused

**Test 6.1: Global System Active (SEND)**
```json
{
  "test_id": "safety-012",
  "test_name": "Global messaging enabled",
  "input": {
    "global_messaging_paused": false
  },
  "expected_checks": {
    "global_pause": "PASS (messaging enabled)"
  },
  "expected_decision": "SEND"
}
```

**Test 6.2: Global Circuit Breaker (BLOCK)**
```json
{
  "test_id": "safety-013",
  "test_name": "Global circuit breaker triggered",
  "input": {
    "global_messaging_paused": true,
    "pause_reason": "Circuit breaker: 10 AI errors in 1 hour"
  },
  "expected_checks": {
    "global_pause": "FAIL (global pause active)"
  },
  "expected_decision": "BLOCK",
  "expected_decision_reason": "Global messaging paused: Circuit breaker: 10 AI errors in 1 hour"
}
```

---

## 🤖 AI INBOUND HANDLER TEST SCENARIOS

### Test Group 7: End-to-End Happy Path

**Test 7.1: Receive Message → AI Responds → State Updated**
```json
{
  "test_id": "e2e-001",
  "test_name": "Complete happy path",
  "steps": [
    {
      "step": 1,
      "action": "Webhook receives inbound SMS",
      "input": {
        "From": "+15550010001",
        "Body": "Yes, I'm interested in coaching!",
        "MessageSid": "SM_test_001"
      },
      "verify": "Message_Decision_Log entry created (decision: RECEIVED)"
    },
    {
      "step": 2,
      "action": "Find lead by phone",
      "verify": "Lead found: rec_test_lead_1"
    },
    {
      "step": 3,
      "action": "Run safety checks",
      "verify": "Safety decision: SEND"
    },
    {
      "step": 4,
      "action": "Load conversation context",
      "verify": "conversation_thread loaded and parsed"
    },
    {
      "step": 5,
      "action": "Call OpenAI",
      "verify": "AI response generated"
    },
    {
      "step": 6,
      "action": "Send SMS via Twilio",
      "verify": "SMS sent successfully (MessageSid returned)"
    },
    {
      "step": 7,
      "action": "Update conversation_thread",
      "verify": "Thread updated with inbound + outbound messages"
    },
    {
      "step": 8,
      "action": "Update state fields",
      "verify_updates": {
        "last_message_direction": "outbound",
        "SMS Last Sent At": "(current timestamp)",
        "total_ai_messages_sent": "incremented",
        "ai_message_count_today": "incremented"
      }
    },
    {
      "step": 9,
      "action": "Log decision",
      "verify": "Message_Decision_Log updated (decision: SENT, message_content: AI response)"
    }
  ],
  "success_criteria": {
    "sms_sent": true,
    "state_updated": true,
    "thread_valid": true,
    "decision_logged": true
  }
}
```

---

### Test Group 8: Error Handling

**Test 8.1: OpenAI Timeout → Fallback Sent**
```json
{
  "test_id": "error-001",
  "test_name": "OpenAI timeout - use fallback",
  "scenario": "Simulate OpenAI API timeout (15 seconds)",
  "steps": [
    {
      "step": 1,
      "action": "Webhook receives message",
      "input": {"From": "+15550010001", "Body": "Hello"}
    },
    {
      "step": 2,
      "action": "Safety checks PASS"
    },
    {
      "step": 3,
      "action": "Call OpenAI (simulate timeout)",
      "simulate_error": {
        "type": "timeout",
        "after_seconds": 15
      }
    },
    {
      "step": 4,
      "action": "OpenAI retries (2x) - all timeout"
    },
    {
      "step": 5,
      "action": "Fallback handler triggered",
      "verify": "Load fallback from AI_Config.fallback_responses.ai_timeout"
    },
    {
      "step": 6,
      "action": "Send fallback SMS",
      "expected_message": "Thanks for your message! Let me get you the right information. Someone from our team will follow up within 24 hours."
    },
    {
      "step": 7,
      "action": "Update lead state",
      "verify_updates": {
        "last_error_type": "ai_timeout",
        "last_error_at": "(current timestamp)",
        "ai_status": "human_takeover",
        "pause_reason": "AI call failed: timeout after 15s"
      }
    },
    {
      "step": 8,
      "action": "Log decision",
      "verify": "Message_Decision_Log (decision: FALLBACK_SENT, fallback_used: true)"
    }
  ],
  "success_criteria": {
    "fallback_sent": true,
    "state_updated": true,
    "human_notified": true,
    "no_silent_failure": true
  }
}
```

**Test 8.2: SMS Send Failed → State NOT Updated**
```json
{
  "test_id": "error-002",
  "test_name": "SMS send fails - don't update conversation",
  "scenario": "Simulate Twilio API error (invalid phone)",
  "steps": [
    {
      "step": 1,
      "action": "AI generates response",
      "ai_response": "Great question! Here's what you need to know..."
    },
    {
      "step": 2,
      "action": "Send SMS (simulate failure)",
      "simulate_error": {
        "type": "twilio_error",
        "code": 21211,
        "message": "Invalid 'To' Phone Number"
      }
    },
    {
      "step": 3,
      "action": "SMS error handler",
      "verify": "Error classified as 'invalid_phone'"
    },
    {
      "step": 4,
      "action": "Update lead error state",
      "verify_updates": {
        "last_error_type": "invalid_phone",
        "last_error_at": "(timestamp)",
        "ai_status": "paused"
      }
    },
    {
      "step": 5,
      "action": "Conversation thread check",
      "verify": "conversation_thread NOT UPDATED (message never sent!)"
    },
    {
      "step": 6,
      "action": "Last message direction check",
      "verify": "last_message_direction NOT CHANGED"
    }
  ],
  "critical_checks": {
    "conversation_thread_unchanged": true,
    "last_message_direction_unchanged": true,
    "error_logged": true,
    "reason": "State consistency - only update if message actually sent"
  }
}
```

**Test 8.3: Conversation Thread Corruption → Rebuild from SMS_Audit**
```json
{
  "test_id": "error-003",
  "test_name": "Corrupted thread - rebuild from SMS history",
  "scenario": "conversation_thread field has invalid JSON",
  "setup": {
    "lead_conversation_thread": "{invalid json here[["
  },
  "steps": [
    {
      "step": 1,
      "action": "Load conversation context",
      "result": "JSON.parse() throws error"
    },
    {
      "step": 2,
      "action": "Corruption handler triggered",
      "verify": "safeParseThread() catches error"
    },
    {
      "step": 3,
      "action": "Load SMS_Audit history",
      "query": "filterByFormula: {Lead Record ID} = 'rec_test_lead_1'",
      "verify": "SMS history loaded (source of truth)"
    },
    {
      "step": 4,
      "action": "Rebuild conversation thread",
      "verify": "Thread reconstructed from SMS_Audit records"
    },
    {
      "step": 5,
      "action": "Save recovered thread",
      "verify_updates": {
        "conversation_thread": "(valid JSON array)",
        "last_error_type": "json_corrupt_recovered",
        "last_error_at": "(timestamp)"
      }
    },
    {
      "step": 6,
      "action": "Continue processing",
      "verify": "Workflow continues with recovered thread"
    }
  ],
  "success_criteria": {
    "thread_recovered": true,
    "processing_continues": true,
    "error_logged": true
  }
}
```

---

### Test Group 9: State Consistency

**Test 9.1: Backup Thread Before Update**
```json
{
  "test_id": "state-001",
  "test_name": "Backup conversation thread before modifying",
  "steps": [
    {
      "step": 1,
      "action": "Load current conversation_thread",
      "current_thread": "[{...existing messages...}]"
    },
    {
      "step": 2,
      "action": "Backup to conversation_thread_backup",
      "verify": "conversation_thread_backup field updated with current thread"
    },
    {
      "step": 3,
      "action": "Append new message to thread"
    },
    {
      "step": 4,
      "action": "Validate JSON",
      "verify": "JSON.parse() succeeds on new thread"
    },
    {
      "step": 5,
      "action": "Update conversation_thread",
      "verify": "New thread saved successfully"
    }
  ],
  "recovery_test": {
    "if_step_5_fails": "conversation_thread_backup preserves last known good state",
    "can_restore": true
  }
}
```

---

## 🔗 CLICK TRACKING TEST SCENARIOS

### Test Group 10: Click Tracking

**Test 10.1: Link Clicked → Tracked in Airtable**
```json
{
  "test_id": "click-001",
  "test_name": "Track link click from SMS",
  "prerequisite": "Send SMS with link: 'Check this out: https://example.com/resource'",
  "steps": [
    {
      "step": 1,
      "action": "Twilio click webhook fires",
      "input": {
        "MessageSid": "SM_test_002",
        "To": "+15550010001",
        "ClickedAt": "2025-10-26T14:30:00Z",
        "Link": "https://example.com/resource"
      }
    },
    {
      "step": 2,
      "action": "Find lead by phone",
      "verify": "Lead found: rec_test_lead_1"
    },
    {
      "step": 3,
      "action": "Update lead",
      "verify_updates": {
        "Clicked Link": true,
        "Click Count": "incremented",
        "Last Reply At": "2025-10-26T14:30:00Z (engagement signal!)",
        "active_conversation": true
      }
    },
    {
      "step": 4,
      "action": "Find SMS in SMS_Audit",
      "query": "Search for MessageSid: SM_test_002",
      "verify": "SMS_Audit record found"
    },
    {
      "step": 5,
      "action": "Update SMS_Audit",
      "verify_updates": {
        "Clicked": true,
        "Clicked At": "2025-10-26T14:30:00Z"
      }
    }
  ],
  "success_criteria": {
    "lead_updated": true,
    "sms_audit_updated": true,
    "engagement_tracked": true
  }
}
```

**Test 10.2: Hot Lead - Click Within 5 Minutes**
```json
{
  "test_id": "click-002",
  "test_name": "Fast click = hot lead alert",
  "scenario": "Link clicked within 5 minutes of send",
  "steps": [
    {
      "step": 1,
      "action": "SMS sent at 14:00:00",
      "message_sid": "SM_test_003"
    },
    {
      "step": 2,
      "action": "Click webhook at 14:03:30 (3.5 minutes later)",
      "verify": "Time delta < 5 minutes"
    },
    {
      "step": 3,
      "action": "Update Airtable (same as above)"
    },
    {
      "step": 4,
      "action": "Hot lead check",
      "verify": "Click within 5 min = VERY interested"
    },
    {
      "step": 5,
      "action": "Send Slack alert",
      "expected_message": "🔥 HOT LEAD: [Lead Name] clicked link 3.5 min after send!",
      "channel": "#sales-alerts"
    }
  ],
  "success_criteria": {
    "hot_lead_detected": true,
    "slack_alert_sent": true,
    "sales_notified": true
  }
}
```

---

## 📊 TEST RESULTS TEMPLATE

For each test, document results in this format:

```markdown
## Test Results: [test_id]

**Execution Date**: YYYY-MM-DD HH:MM  
**Workflow ID**: [n8n workflow ID]  
**Execution ID**: [n8n execution ID]  
**Result**: ✅ PASS | ❌ FAIL

### Input Data
- Lead: [record ID]
- Phone: [phone number]
- Test data: [JSON]

### Expected Outcome
[What should happen]

### Actual Outcome
[What actually happened]

### Evidence
- Workflow execution: [screenshot or log]
- Airtable updates: [screenshot showing field changes]
- Decision log entry: [record ID in Message_Decision_Log]
- Error logs (if any): [details]

### Pass/Fail Criteria
- [ ] Safety decision correct
- [ ] State updated correctly
- [ ] Logs created
- [ ] No silent failures

### Notes
[Any observations, edge cases discovered, etc.]
```

---

## ✅ TEST COVERAGE SUMMARY

| Test Area | Scenarios | Priority | Status |
|-----------|-----------|----------|--------|
| Last Word Check | 2 | HIGH | ⏸️ Pending |
| Runaway Detection | 2 | HIGH | ⏸️ Pending |
| Daily Limit | 2 | MEDIUM | ⏸️ Pending |
| Opt-Out Check | 2 | HIGH | ⏸️ Pending |
| AI Status | 3 | HIGH | ⏸️ Pending |
| Global Pause | 2 | MEDIUM | ⏸️ Pending |
| End-to-End Happy Path | 1 | CRITICAL | ⏸️ Pending |
| OpenAI Errors | 1 | CRITICAL | ⏸️ Pending |
| SMS Errors | 1 | CRITICAL | ⏸️ Pending |
| Thread Corruption | 1 | HIGH | ⏸️ Pending |
| State Consistency | 1 | HIGH | ⏸️ Pending |
| Click Tracking | 2 | MEDIUM | ⏸️ Pending |
| **TOTAL** | **20** | | **0% Complete** |

---

## 🎯 NEXT STEPS

1. **Create Test Leads** (30 min)
   - Add 7 test leads to Airtable with required field values
   - Mark with `test_mode_record = true`

2. **Build Workflows** (5 hours)
   - safety-check-module-v2
   - UYSP-AI-Inbound-Handler
   - UYSP-Twilio-Click-Tracker

3. **Run Tests** (1 hour)
   - Execute each scenario
   - Document execution IDs
   - Screenshot Airtable changes

4. **Document Results** (30 min)
   - Create test-results.md
   - Export workflows
   - Commit with evidence

---

**Status**: ✅ Test scenarios defined  
**Next**: Create test lead records in Airtable  
**Then**: Build workflows to make tests pass

---

*20 test scenarios defined. TDD approach: tests first, implementation second. No silent failures allowed.*

