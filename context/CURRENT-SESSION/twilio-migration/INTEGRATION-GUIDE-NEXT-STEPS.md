# Two-Way Conversation System - Integration Guide
**Created**: October 17, 2025, 2:15 AM PST  
**Status**: Core components built - Ready for workflow integration  
**Approach**: UI-based integration (cleanest for credentialed nodes)  
**Time Required**: 1-2 hours

---

## ✅ WHAT'S COMPLETE (Ready to Integrate)

### **Code Modules Built:**
1. ✅ `intent-classifier-v1.js` (436 lines) - 12-category intent detection
2. ✅ `response-generator-v1.js` (~400 lines) - AQA framework responses
3. ✅ `action-handler-v1.js` (~300 lines) - Airtable updates + notifications

### **Airtable Schema:**
1. ✅ Settings table: 6 new client control fields
2. ✅ Leads table: 12 new conversation/qualification fields

### **Existing Workflows:**
1. ✅ UYSP-Twilio-Inbound-Messages (ujkG0KbTYBIubxgK) - Currently active, basic version

---

## 🏗️ INTEGRATION PLAN

### **Option A: Enhance Existing Workflow (Recommended)**

**Workflow**: UYSP-Twilio-Inbound-Messages (ID: ujkG0KbTYBIubxgK)

**Current Nodes** (9 nodes):
1. Twilio Inbound Webhook ✅
2. Parse Inbound Message ✅
3. Find Lead by Phone ✅
4. Log Reply to Audit ✅
5. Handle STOP ✅
6. Update Lead - STOP ✅
7. Prepare Slack Notification ✅
8. Slack Reply Notification ✅
9. Respond to Twilio ✅

**Nodes to Add** (5 new nodes):
10. Get Settings (load client config)
11. Classify Intent (intent-classifier-v1.js)
12. Generate Response (response-generator-v1.js)
13. Execute Actions (action-handler-v1.js)
14. Send Auto-Response (Twilio HTTP)
15. Update Lead Record (dynamic Airtable update)
16. Conditional Slack Router (smart notifications)

**New Flow** (enhanced):
```
Webhook → Parse → Find Lead → Get Settings
                                      ↓
                                Classify Intent
                                      ↓
                                Generate Response
                                      ↓
                                Execute Actions
                                      ↓
                    ┌──────────────┴──────────────┐
                    ↓                              ↓
              Send Auto-Response            Update Lead Record
                    ↓                              ↓
              Log to Audit                   Slack Notifications
                    ↓                              ↓
                    └──────────────┬──────────────┘
                                   ↓
                            Respond to Twilio
```

---

## 📋 STEP-BY-STEP INTEGRATION (n8n UI)

### **Step 1: Add Get Settings Node** (2 min)

1. Open workflow: UYSP-Twilio-Inbound-Messages
2. Click the canvas (not a node)
3. Press **"+"** or drag to add new node
4. Search: "Airtable"
5. Configure:
   - **Operation**: Search
   - **Base**: app4wIsBfpJTg7pWS
   - **Table**: Settings (tblErXnFNMKYhh3Xr)
   - **Return All**: Yes
6. Position: After "Find Lead by Phone"
7. Name it: "Get Settings"
8. Connect: "Find Lead by Phone" → "Get Settings"
9. Save

---

### **Step 2: Add Classify Intent Node** (5 min)

1. Add new Code node
2. Name: "Classify Intent"
3. Copy code from: `intent-classifier-v1.js`
4. Paste into code editor
5. Position: After "Get Settings"
6. Connect: "Get Settings" → "Classify Intent"
7. Save

---

### **Step 3: Add Generate Response Node** (5 min)

1. Add new Code node
2. Name: "Generate Response"
3. Copy code from: `response-generator-v1.js`
4. Paste into code editor
5. Position: After "Classify Intent"
6. Connect: "Classify Intent" → "Generate Response"
7. Save

---

### **Step 4: Add Execute Actions Node** (5 min)

1. Add new Code node
2. Name: "Execute Actions"
3. Copy code from: `action-handler-v1.js`
4. Paste into code editor
5. Position: After "Generate Response"
6. Connect: "Generate Response" → "Execute Actions"
7. Save

---

### **Step 5: Add Send Auto-Response Node** (10 min)

1. Add new HTTP Request node
2. Name: "Send Auto-Response"
3. Configure:
   - **Method**: POST
   - **URL**: `https://api.twilio.com/2010-04-01/Accounts/AC[REDACTED]/Messages.json`
   - **Authentication**: Generic Credential → HTTP Basic Auth
   - **Credential**: Twilio API
   - **Send Body**: Yes
   - **Content Type**: Form Urlencoded
   - **Body Parameters**:
     - Name: `To`, Value: `={{ $json.to_number }}`
     - Name: `From`, Value: `={{ $json.from_number }}`
     - Name: `Body`, Value: `={{ $json.response_text }}`
   - **Never Error**: ON
4. Position: After "Execute Actions"
5. Connect: "Execute Actions" → "Send Auto-Response"
6. Save

---

### **Step 6: Add Update Lead Record Node** (10 min)

1. Add new Airtable node
2. Name: "Update Lead Record"
3. Configure:
   - **Operation**: Update
   - **Base**: app4wIsBfpJTg7pWS
   - **Table**: Leads (tblYUvhGADerbD8EO)
   - **Columns**: Define below
   - **Map ALL fields dynamically** from `$json.lead_updates` object:
     ```
     For each field in lead_updates:
     - Conversation Status: ={{ $json.lead_updates['Conversation Status'] }}
     - Last Reply At: ={{ $json.lead_updates['Last Reply At'] }}
     - Last Reply Text: ={{ $json.lead_updates['Last Reply Text'] }}
     - Reply Count: ={{ $json.lead_updates['Reply Count'] }}
     - Conversation Summary: ={{ $json.lead_updates['Conversation Summary'] }}
     - SMS Stop: ={{ $json.lead_updates['SMS Stop'] }}
     - SMS Stop Reason: ={{ $json.lead_updates['SMS Stop Reason'] }}
     - Processing Status: ={{ $json.lead_updates['Processing Status'] }}
     - Follow-up Date: ={{ $json.lead_updates['Follow-up Date'] }}
     - Follow-up Type: ={{ $json.lead_updates['Follow-up Type'] }}
     - Follow-up Note: ={{ $json.lead_updates['Follow-up Note'] }}
     - Manual Follow-up Required: ={{ $json.lead_updates['Manual Follow-up Required'] }}
     - Nurture Tag: ={{ $json.lead_updates['Nurture Tag'] }}
     - Current Coaching Client: ={{ $json.lead_updates['Current Coaching Client'] }}
     - Booked: ={{ $json.lead_updates['Booked'] }}
     - id: ={{ $json.lead_updates.id }}
     ```
   - **Matching Columns**: id
   - **Typecast**: ON
4. Position: After "Send Auto-Response"
5. Connect: "Send Auto-Response" → "Update Lead Record"
6. Save

---

### **Step 7: Add Conditional Slack Router** (10 min)

1. Add new Code node
2. Name: "Route Slack Notifications"
3. Code:
```javascript
const actionData = $items('Execute Actions')[0].json;

if (!actionData.should_notify_slack) {
  console.log('No Slack notification needed');
  return [];
}

return [{ json: {
  slack_message: actionData.slack_message,
  priority: actionData.slack_priority,
  channel: actionData.slack_channel
}}];
```
4. Position: Parallel to "Update Lead Record"
5. Connect: "Execute Actions" → "Route Slack Notifications"
6. Save

---

### **Step 8: Add Smart Slack Notification Node** (5 min)

1. Add new Slack node
2. Name: "Send Smart Notification"
3. Configure:
   - **Authentication**: OAuth2
   - **Channel**: uysp-ops-alerts
   - **Message**: `={{ $json.slack_message }}`
4. Position: After "Route Slack Notifications"
5. Connect: "Route Slack Notifications" → "Send Smart Notification"
6. Save

---

### **Step 9: Update Log Reply to Audit Node** (5 min)

**Enhance to include intent data:**

1. Click existing "Log Reply to Audit" node
2. Add these fields to the column mappings:
   ```
   Intent Detected: ={{ $items('Classify Intent')[0]?.json.intent || 'Not Classified' }}
   Message Direction: Inbound
   Auto-Response Sent: true
   Response Text: ={{ $items('Generate Response')[0]?.json.response_text || '' }}
   ```
3. Save

---

### **Step 10: Remove Old Nodes** (2 min)

**These nodes are now replaced by the intelligent system:**

1. Delete: "Handle STOP" (old simple version)
2. Delete: "Update Lead - STOP" (replaced by Execute Actions)
3. Delete: "Prepare Slack Notification" (replaced by Route Slack)
4. Delete: "Slack Reply Notification" (replaced by Send Smart Notification)

**Keep**:
- Twilio Inbound Webhook ✅
- Parse Inbound Message ✅
- Find Lead by Phone ✅
- Respond to Twilio ✅

---

### **Step 11: Final Connections** (5 min)

**Wire the complete flow:**

```
1. Twilio Inbound Webhook
     ↓
2. Parse Inbound Message
     ↓
3. Find Lead by Phone
     ↓
4. Get Settings
     ↓
5. Classify Intent
     ↓
6. Generate Response
     ↓
7. Execute Actions
     ├─→ 8. Send Auto-Response
     │        ↓
     │   9. Update Lead Record
     │        ↓
     │   10. Log Reply to Audit (enhanced)
     │
     └─→ 11. Route Slack Notifications
              ↓
         12. Send Smart Notification
              ↓
         13. Respond to Twilio (final)
```

---

## ⚡ QUICK INTEGRATION (Alternative Approach)

**If UI integration is tedious**, I can create a brand NEW workflow with everything pre-wired:

**New Workflow**: "UYSP-Twilio-Conversations-v2"

**Benefits:**
- ✅ All nodes pre-configured
- ✅ All connections pre-wired
- ✅ Clean, organized layout
- ✅ Test without touching existing workflow

**Then**: Once tested and working, deactivate old workflow, use new one

**Should I create the new workflow instead?** This might be faster and cleaner! [[memory:8684270]]

---

## 🧪 TESTING SCENARIOS (When Integration Complete)

### **Test 1: Positive Interest**
**Send to workflow**: "Yes I'm interested"
**Expected**:
- Intent: POSITIVE_INTEREST
- Response: Qualifying question OR booking link (depending on settings)
- Airtable: Conversation Status = "Replied - Interested"
- Slack: Hot lead notification

---

### **Test 2: Soft No - Timing**
**Send**: "Not right now, check back in a few weeks"
**Expected**:
- Intent: SOFT_NO_TIMING
- Response: "How about I drop you a note in a few weeks?"
- Airtable: Follow-up Date = +14 days, Nurture Tag = "Timing-Issue"
- Slack: Nurture opportunity notification

---

### **Test 3: Already a Member**
**Send**: "I'm already a member why am I getting this"
**Expected**:
- Intent: EXISTING_MEMBER
- Response: Apology + immediate stop
- Airtable: Current Coaching Client = TRUE, SMS Stop = TRUE
- Slack: Data quality alert to ops

---

### **Test 4: Question with AQA**
**Send**: "How long is the call?"
**Expected**:
- Intent: QUESTION_PROCESS
- Response: "30 minutes [Name]. What's your biggest challenge - prospecting, closing, or something else?"
- Airtable: Conversation Status = "Replied - Question"
- Slack: Question notification

---

### **Test 5: Personal Outreach Request**
**Send**: "Can someone call me?"
**Expected**:
- Intent: OUTREACH_REQUEST
- Response: "I'll have team reach out within few hours..."
- Airtable: Manual Follow-up Required = TRUE, Priority = HIGH
- Slack: URGENT hot lead alert

---

## 🎯 RECOMMENDATION: CREATE NEW WORKFLOW

**I think creating a fresh "v2" workflow will be faster and cleaner than modifying the existing one through the API.**

**Shall I:**

**Option A**: Create complete new workflow with all components pre-wired (30 min)  
**Option B**: Provide detailed UI instructions for you to integrate manually (above)  
**Option C**: Continue trying to update via MCP API (slower, more complex)  

**My recommendation: Option A** - I'll create "UYSP-Twilio-Conversations-v2" with everything integrated, then you just activate it!

**Proceed with Option A?** [[memory:8472508]]

