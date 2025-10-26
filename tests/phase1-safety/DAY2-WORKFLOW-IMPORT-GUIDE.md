# Day 2 Workflow Import Guide

**Date**: October 26, 2025  
**Purpose**: How to import and configure the 3 new workflows in n8n  
**Status**: Workflows built - ready for import and testing

---

## 🎯 WHAT WAS BUILT

### 3 New Workflows Created:

1. **safety-check-module-v2** (9 nodes)
   - Comprehensive safety checking service
   - Called by other workflows
   - Returns SEND/BLOCK/CIRCUIT_BREAKER decisions

2. **UYSP-AI-Inbound-Handler** (24 nodes)
   - Main AI conversation workflow
   - Parallel webhook to existing system
   - Full error handling and fallbacks

3. **UYSP-Twilio-Click-Tracker** (12 nodes)
   - Track link clicks from SMS
   - Hot lead alerts
   - Updates Airtable engagement data

---

## ⚠️ CRITICAL: Manual Import Required

**Why not imported automatically?**
- MCP tool can CREATE workflows but may CORRUPT CREDENTIALS when updating
- Manual import in n8n UI is safer and allows credential configuration
- Each workflow needs manual credential assignments

---

## 📋 IMPORT STEPS (Do This in n8n UI)

### Step 1: Import safety-check-module-v2

1. Open n8n: https://rebelhq.app.n8n.cloud
2. Click **Workflows** → **+ New Workflow**
3. Click **⋮** (menu) → **Import from File**
4. Select: `/workflows/safety-check-module-v2.json`
5. **Configure Credentials**:
   - Find Lead Data node → Set Airtable credentials
   - Load Client Safety Config node → Set Airtable credentials
   - Update Lead - Circuit Breaker node → Set Airtable credentials
   - Log Decision node → Set Airtable credentials

6. **CRITICAL Settings** (manually set in UI):
   - IF nodes → Settings tab → **"Always Output Data" = ON**
   
7. **Save Workflow**
8. **Activate Workflow**
9. **Note the Webhook URL**: 
   - Open "Safety Check Input" webhook node
   - Copy URL: `https://rebelhq.app.n8n.cloud/webhook/safety-check`
   - You'll need this for the AI Handler workflow

---

### Step 2: Import UYSP-AI-Inbound-Handler

1. Click **+ New Workflow**
2. Import: `/workflows/UYSP-AI-Inbound-Handler.json`
3. **Configure Credentials**:
   - All Airtable nodes → Set Airtable credentials
   - Call OpenAI node → Set OpenAI API credentials
   - Send SMS via Twilio node → Set Twilio credentials
   - Send Slack Alert node (if present) → Set Slack credentials

4. **Configure Variables** (n8n Settings → Variables):
   - `N8N_WEBHOOK_URL` = `https://rebelhq.app.n8n.cloud`
   - `TWILIO_ACCOUNT_SID` = (your Twilio Account SID)
   - `TWILIO_MESSAGING_SERVICE_SID` = (create this in Step 3 below)

5. **Update Safety Check URL**:
   - Open "Call Safety Check Module" node
   - URL should be: `{{ $vars.N8N_WEBHOOK_URL }}/webhook/safety-check`
   - Verify it matches the webhook from safety-check-module-v2

6. **CRITICAL Settings**:
   - All IF nodes → Settings tab → **"Always Output Data" = ON**
   - All HTTP nodes → Settings tab → **"Continue On Fail" = ON**
   - OpenAI node → Settings tab → **"Retry On Fail" = ON, Max Tries = 2**
   - Airtable nodes → Settings tab → **"Retry On Fail" = ON, Max Tries = 3**

7. **Save Workflow**
8. **Activate Workflow**
9. **Note the Webhook URL**:
   - Open "Twilio AI Webhook" node
   - Copy URL: `https://rebelhq.app.n8n.cloud/webhook/twilio-ai`
   - Configure this in Twilio (Step 3)

---

### Step 3: Configure Twilio Messaging Service

**BEFORE importing click tracker, setup Twilio:**

1. Go to Twilio Console: https://console.twilio.com
2. Navigate to: **Messaging** → **Services**
3. Click **Create Messaging Service**
4. **Name**: UYSP AI Messaging
5. **Sender Pool**: Add your phone number (+1 818-699-0998)
6. **Features**:
   - ✅ Sticky Sender
   - ✅ Smart Encoding
   - ⚠️ **Link Shortening**: DECIDE NOW
     - Enable if you want click tracking ($3/day)
     - Use twil.io domain (instant) OR
     - Setup go.uysp.com (3 hours config)
   
7. **Webhooks** (Integration section):
   - **Inbound Messages**: `https://rebelhq.app.n8n.cloud/webhook/twilio-ai`
   - **Status Callbacks**: (keep existing `/webhook/twilio-status`)
   - **Click Tracking** (if link shortening enabled): `https://rebelhq.app.n8n.cloud/webhook/twilio-click`

8. **Save Service**
9. **Copy MessagingServiceSid**: `MG...` 
10. **Add to n8n Variables**:
    - n8n → Settings → Variables
    - Name: `TWILIO_MESSAGING_SERVICE_SID`
    - Value: `MG...` (the SID you copied)

---

### Step 4: Import UYSP-Twilio-Click-Tracker

1. Click **+ New Workflow**
2. Import: `/workflows/UYSP-Twilio-Click-Tracker.json`
3. **Configure Credentials**:
   - All Airtable nodes → Set Airtable credentials
   - Send Slack Alert node → Set Slack credentials

4. **CRITICAL Settings**:
   - All IF nodes → Settings tab → **"Always Output Data" = ON**
   - All Airtable nodes → Settings tab → **"Retry On Fail" = ON**

5. **Save Workflow**
6. **Activate Workflow** (only if link shortening enabled in Step 3)
7. **Note the Webhook URL**:
   - Should be: `https://rebelhq.app.n8n.cloud/webhook/twilio-click`
   - Should match what you configured in Twilio

---

## 🧪 TESTING CHECKLIST

### Test 1: Safety Check Module (Standalone)

**Method**: Use n8n's "Execute Workflow" feature

1. Open `safety-check-module-v2` workflow
2. Click **Execute Workflow** (top right)
3. **Webhook Test**: Send POST request to webhook URL
   ```bash
   curl -X POST https://rebelhq.app.n8n.cloud/webhook/safety-check \
     -H "Content-Type: application/json" \
     -d '{
       "lead_id": "rec_test_lead_1",
       "trigger_type": "inbound_reply",
       "client_id": "uysp_001"
     }'
   ```

4. **Expected Response**:
   ```json
   {
     "decision": "SEND" | "BLOCK" | "CIRCUIT_BREAKER",
     "decision_reason": "...",
     "safety_checks": { ... },
     "lead_id": "rec_...",
     "timestamp": "..."
   }
   ```

5. **Check Airtable**:
   - Message_Decision_Log → New entry with decision
   - Lead record → Updated if CIRCUIT_BREAKER

---

### Test 2: AI Inbound Handler (End-to-End)

**Method**: Send actual SMS to Twilio number

**IMPORTANT**: Use a test lead with `test_mode_record = true`!

1. **Create Test Lead in Airtable** (if not exists):
   - Phone: Your mobile number
   - `test_mode_record`: true
   - `ai_status`: active
   - `🤖 last_message_direction`: inbound
   - `SMS Stop`: false

2. **Send Test SMS**:
   - From: Your phone
   - To: +1 818-699-0998
   - Message: "Yes, I'm interested!"

3. **Watch n8n Executions**:
   - n8n → Executions tab
   - Should see new execution in UYSP-AI-Inbound-Handler
   - Click to see execution details

4. **Verify Each Step**:
   - ✅ Webhook received
   - ✅ Lead found
   - ✅ Safety check: SEND
   - ✅ Thread backup created
   - ✅ AI Config loaded
   - ✅ OpenAI called successfully
   - ✅ SMS sent via Twilio
   - ✅ Conversation thread updated
   - ✅ Lead state updated
   - ✅ Decision logged

5. **Check Airtable**:
   - Leads → Your test record:
     - `🤖 conversation_thread` = Updated with 2 messages (yours + AI)
     - `🤖 last_message_direction` = "outbound"
     - `SMS Last Sent At` = Current time
     - `🤖 total_ai_messages_sent` = Incremented
   - Message_Decision_Log → 2 entries:
     - RECEIVED (webhook receipt)
     - SENT (AI responded)

6. **Check Your Phone**:
   - Should receive AI response SMS

---

### Test 3: Error Handling (OpenAI Timeout)

**Method**: Temporarily break OpenAI credentials

1. **Break OpenAI Call**:
   - Open UYSP-AI-Inbound-Handler workflow
   - Edit "Call OpenAI" node
   - Change URL to invalid (e.g., add `/broken`)
   - Save workflow

2. **Send Test SMS** (same as Test 2)

3. **Verify Fallback**:
   - Watch execution
   - OpenAI call fails after retries
   - "Get Fallback Response" node executes
   - SMS sent with fallback message
   - Lead updated: `ai_status` = "human_takeover"
   - Decision logged: `decision` = "FALLBACK_SENT", `fallback_used` = true

4. **Fix OpenAI** (restore correct URL)

---

### Test 4: Safety Check - AI Has Last Word

**Method**: Setup lead state to block

1. **Update Test Lead**:
   - `🤖 last_message_direction` = "outbound" (AI sent last)
   - Save

2. **Send Test SMS**

3. **Verify BLOCK**:
   - Safety check returns: `decision = "BLOCK"`
   - No AI call made
   - No SMS sent
   - Decision logged: "AI already has last word"

4. **Reset Test Lead**:
   - `🤖 last_message_direction` = "inbound"

---

### Test 5: Click Tracking

**Method**: Send SMS with link, click it

**REQUIRES**: Link shortening enabled in Twilio!

1. **Send Test SMS with Link** (manually via Twilio Console):
   - To: Your phone
   - Body: "Check this out: https://calendly.com/jeremybelmont/discovery-call"
   - Use MessagingServiceSid (link shortening enabled)

2. **Verify Link Shortened**:
   - Received SMS should have: `https://twil.io/...` or `https://go.uysp.com/...`

3. **Click the Link** (on your phone)

4. **Watch n8n Executions**:
   - Should see execution in UYSP-Twilio-Click-Tracker

5. **Verify Updates**:
   - Leads → Your test record:
     - `Clicked Link` = true
     - `Click Count` = Incremented
     - `Last Reply At` = Click timestamp
   - SMS_Audit → Find sent message:
     - `Clicked` = true
     - `Clicked At` = Timestamp

6. **If Click Within 5 Min**:
   - Check Slack #uysp-ops-alerts
   - Should see: "🔥 HOT LEAD ALERT!"

---

## ⚙️ CONFIGURATION REFERENCE

### n8n Variables Required:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `N8N_WEBHOOK_URL` | `https://rebelhq.app.n8n.cloud` | n8n URL |
| `TWILIO_ACCOUNT_SID` | `AC...` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | `...` | Twilio Console → Account Info |
| `TWILIO_MESSAGING_SERVICE_SID` | `MG...` | Created in Step 3 |
| `OPENAI_API_KEY` | `sk-...` | OpenAI Platform → API Keys |

### Airtable Table IDs (Already in workflows):

| Table | Table ID |
|-------|----------|
| Leads | `tblYUvhGADerbD8EO` |
| SMS_Audit | `tbl5TOGNGdWXTjhzP` |
| AI_Config | `tbl34O5Cs0G1cDJbs` |
| Client_Safety_Config | `tblpM32X4ezKUV9Wj` |
| Message_Decision_Log | `tbl09qmd60wivdby2` |

---

## 🚨 TROUBLESHOOTING

### Issue: Webhook Not Firing

**Symptoms**: Send SMS, nothing happens in n8n

**Checks**:
1. Workflow is ACTIVE (green toggle)
2. Twilio webhook URL matches n8n webhook exactly
3. Test webhook directly with curl

**Fix**:
- Verify Twilio Messaging Service → Inbound Messages URL
- Should be: `https://rebelhq.app.n8n.cloud/webhook/twilio-ai`

---

### Issue: Safety Check Always Returns BLOCK

**Symptoms**: AI never responds

**Checks**:
1. Test lead has `ai_status` = "active"
2. Test lead has `SMS Stop` = false
3. Test lead has `🤖 last_message_direction` = "inbound"
4. Client_Safety_Config has `global_messaging_paused` = false

**Fix**:
- Update test lead fields
- Check Message_Decision_Log for `decision_reason`

---

### Issue: OpenAI Call Failing

**Symptoms**: Fallback always used

**Checks**:
1. OpenAI API key valid
2. OpenAI API key has credits
3. n8n credential configured correctly

**Test**:
- Call OpenAI directly via curl with same API key

---

### Issue: Airtable Updates Failing

**Symptoms**: State not updating, thread corruption

**Checks**:
1. Airtable credentials valid
2. Table IDs correct (not table names!)
3. Field IDs match actual fields

**Fix**:
- Re-verify field IDs in field-ids-correct-base.json
- Use table IDs everywhere, never names

---

## ✅ SUCCESS CRITERIA

**Day 2 Complete When**:
- [ ] All 3 workflows imported and active
- [ ] Twilio Messaging Service configured
- [ ] Test SMS → AI responds correctly
- [ ] Safety checks working (SEND vs BLOCK)
- [ ] Error handling tested (fallback works)
- [ ] Click tracking working (if enabled)
- [ ] All executions logged in Message_Decision_Log
- [ ] No errors in n8n execution logs

---

## 📊 NEXT STEPS (Day 3)

1. **Test All 20 Scenarios** (from day2-test-scenarios.md)
2. **Document Execution IDs** for each test
3. **Screenshot Airtable Updates** as evidence
4. **Create Test Results Summary**
5. **Sign Off Phase 1 Safety Module**

---

## 📁 FILES CREATED

### Workflows:
- `/workflows/safety-check-module-v2.json`
- `/workflows/UYSP-AI-Inbound-Handler.json`
- `/workflows/UYSP-Twilio-Click-Tracker.json`

### Documentation:
- `/tests/phase1-safety/day2-test-scenarios.md` (20 test cases)
- `/tests/phase1-safety/DAY2-WORKFLOW-IMPORT-GUIDE.md` (this file)

### Next:
- `/tests/phase1-safety/day2-test-results.md` (to create during testing)

---

**Status**: ✅ Workflows built and ready for import  
**Next Action**: Follow Steps 1-4 above to import workflows in n8n UI  
**Then**: Run Test Checklist to verify everything works

---

*Day 2 implementation complete. Workflows follow TDD approach - test scenarios written first, implementation second. All error handling patterns from ERROR-HANDLING-SPEC-COMPLETE.md implemented.*

