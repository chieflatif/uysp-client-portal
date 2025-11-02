# Import New AI Workflows - Clickable Links

**Date**: October 26, 2025  
**Purpose**: Add 3 new AI messaging workflows to UYSP workspace

---

## 🎯 UYSP WORKSPACE

**Workspace**: UYSP Lead Qualification Agent  
**Workspace ID**: H4VRaaZhd8VKQANf  
**URL**: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows

---

## 📋 NEW WORKFLOWS TO IMPORT (3 Files)

### 1. safety-check-module-v2 ⭐ CRITICAL

**Purpose**: 7 safety checks, returns SEND/BLOCK/CIRCUIT_BREAKER decision  
**Nodes**: 9  
**File**: `/workflows/safety-check-module-v2.json`

**Import Steps**:
1. Click: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows
2. Click "+ Add workflow"  
3. Click ⋮ menu → "Import from File"
4. Select: `workflows/safety-check-module-v2.json`
5. Configure Airtable credentials on all nodes
6. Save & Activate

---

### 2. UYSP-AI-Inbound-Handler ⭐⭐ MOST CRITICAL

**Purpose**: Main AI conversation workflow  
**Nodes**: 24  
**File**: `/workflows/UYSP-AI-Inbound-Handler.json`

**Import Steps**:
1. Click: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows
2. Click "+ Add workflow"
3. Click ⋮ menu → "Import from File"
4. Select: `workflows/UYSP-AI-Inbound-Handler.json`
5. Configure credentials:
   - Airtable nodes → Airtable UYSP Option C
   - Call OpenAI node → OpenAI credentials
   - Send SMS node → Twilio credentials
6. **CRITICAL**: All IF nodes → Settings tab → "Always Output Data" = ON
7. Save & Activate

---

### 3. UYSP-Twilio-Click-Tracker

**Purpose**: Track link clicks from SMS  
**Nodes**: 12  
**File**: `/workflows/UYSP-Twilio-Click-Tracker.json`

**Import Steps**:
1. Click: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows
2. Click "+ Add workflow"
3. Click ⋮ menu → "Import from File"
4. Select: `workflows/UYSP-Twilio-Click-Tracker.json`
5. Configure credentials:
   - Airtable nodes → Airtable UYSP Option C
   - Slack node → Slack account
6. **CRITICAL**: All IF nodes → Settings tab → "Always Output Data" = ON
7. Save & Activate

---

## ⚠️ EXISTING WORKFLOW ISSUE FOUND

**Problem**: 2 UYSP workflows are in your PERSONAL workspace instead of UYSP workspace

**In Wrong Workspace** (wvkG5jFMc7QXvOh5 - Personal):
- UYSP-Twilio-Inbound-Messages (ujkG0KbTYBIubxgK)
- UYSP-Twilio-Status-Callback (39yskqJT3V6enem2)

**Should Be In** (H4VRaaZhd8VKQANf - UYSP workspace):
- Move these 2 workflows when convenient

**How to Move**:
1. Export workflow from personal workspace
2. Import into UYSP workspace
3. Update Twilio webhook URLs
4. Test
5. Deactivate old workflow

---

## 🔧 AFTER IMPORT - SETUP REQUIRED

**n8n Variables** (Settings → Variables):
- `N8N_WEBHOOK_URL` = https://rebelhq.app.n8n.cloud
- `TWILIO_ACCOUNT_SID` = (from Twilio console)
- `TWILIO_MESSAGING_SERVICE_SID` = (create Messaging Service first)

**Twilio Messaging Service** (create first):
- Service name: "UYSP AI Messaging"
- Add phone: +1 818-699-0998
- Webhooks:
  - Inbound: https://rebelhq.app.n8n.cloud/webhook/twilio-ai
  - Status: https://rebelhq.app.n8n.cloud/webhook/twilio-status
  - Click: https://rebelhq.app.n8n.cloud/webhook/twilio-click

---

## ✅ WORKFLOW LOCATION AFTER IMPORT

All 5 UYSP workflows in one workspace:
- UYSP-Calendly-Booked ✅ (already in workspace)
- UYSP-ST-Delivery V2 ✅ (already in workspace)
- safety-check-module-v2 (NEW - you'll import)
- UYSP-AI-Inbound-Handler (NEW - you'll import)
- UYSP-Twilio-Click-Tracker (NEW - you'll import)

Plus eventually move these 2:
- UYSP-Twilio-Inbound-Messages (move from personal)
- UYSP-Twilio-Status-Callback (move from personal)

**Total**: 7 UYSP workflows in H4VRaaZhd8VKQANf workspace

---

## 📁 WORKFLOW FILES

**Location**: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/workflows/`

**Files to Import**:
```
workflows/
├── safety-check-module-v2.json ⭐ IMPORT FIRST
├── UYSP-AI-Inbound-Handler.json ⭐ IMPORT SECOND  
└── UYSP-Twilio-Click-Tracker.json ⭐ IMPORT THIRD
```

**Detailed Import Guide**: `tests/phase1-safety/DAY2-WORKFLOW-IMPORT-GUIDE.md`

---

**Next**: Import 3 workflows → Setup credentials → Activate → Test

