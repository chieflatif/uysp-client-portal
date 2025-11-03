# Project Call Automation - Complete Setup Guide

## 🎯 Your Actual Workflow

```
Otter.ai
   ↓ (NEED: Zapier automation)
Workspace OS Folder
   ↓ (WORKING: AI analysis)
Workspace OS AI
   ↓ (WORKING: MCP integration)
Notion Database
   ↓ (NEED: n8n webhook)
Airtable (Project_Call_Summaries)
   ↓ (WORKING: Frontend sync ✅)
uysp-client-portal Dashboard
```

---

## ✅ What's Already Working

1. **Workspace OS → Notion** ✅ (via MCP)
2. **Airtable Table Exists** ✅ (`Project_Call_Summaries` - table ID: `tblvpmq10bFkgDnHa`)
3. **Frontend Integration** ✅ (Portal already fetches from this table)
4. **API Endpoint** ✅ (`/api/clients/[id]/call-history/route.ts`)

---

## 🚧 What You Need to Build

### 1. Otter → Workspace OS (15 minutes)

**Use Zapier:**

1. **Create Zap**
   - Trigger: Otter.ai "New Transcript"
   - Action: Google Drive/Dropbox "Create Text File"
   
2. **Configure**
   - Folder: Your Workspace OS folder path
   - Filename: `{{Transcript Title}} - {{Created Date}}.txt`
   - Content: {{Transcript Text}}

3. **Test & Enable**

**See:** `OTTER-TO-WORKSPACE-AUTOMATION.md` for detailed steps

---

### 2. Notion → n8n → Airtable (30 minutes)

**Your Notion Database Should Have:**
- Database Name: "Project Calls" (or similar)
- Properties:
  - Call Date (Date)
  - Executive Summary (Text)
  - Top Priorities (Text)
  - Key Decisions (Text)
  - Blockers (Text)
  - Next Steps (Text)
  - Attendees (Text)
  - Call Recording URL (URL)
  - Transcript (Text)

**n8n Workflow:**

1. **Import Workflow**
   ```bash
   # File: N8N-NOTION-TO-AIRTABLE-WORKFLOW.md (this repo)
   # Import to n8n instance
   ```

2. **Configure Credentials**
   - **Airtable**: Personal Access Token
   - **Slack**: Webhook URL
   - **Notion**: Integration token

3. **Update Configuration**
   - Base ID: `app4wIsBfpJTg7pWS` (already set)
   - Table: `Project_Call_Summaries` (already set)
   - Webhook path: `/webhook/project-call-summary`

4. **Get Webhook URL**
   - Copy the n8n webhook URL
   - Format: `https://your-n8n-instance.com/webhook/project-call-summary`

5. **Connect Notion**
   - Use Notion API to create webhook subscription
   - Point to your n8n webhook URL
   - Watch for "page.created" events in your Notion database

**Result:** When Workspace OS creates a Notion page → n8n fires → Airtable updated → Frontend shows it

---

## 📊 Airtable Schema (Already Exists)

**Table:** `Project_Call_Summaries` (tblvpmq10bFkgDnHa)

**Fields:**
- Call Date
- Executive Summary
- Top Priorities
- Key Decisions
- Blockers Discussed
- Next Steps
- Attendees
- Call Recording URL
- Transcript
- Is Latest (Checkbox)
- Created At
- Updated At

**This matches your frontend code exactly!**

---

## 🎬 End-to-End Test

### Step 1: Record Test Call in Otter
- Record 2-minute test call
- Name it "Test - Project Call"

### Step 2: Verify Zapier Triggers
- Check Workspace OS folder
- Should see: `Test - Project Call - [date].txt`

### Step 3: Workspace OS Processes
- AI analyzes transcript
- Generates summary
- **Posts to Notion via MCP** (your existing process)

### Step 4: Verify n8n Triggers
- Check n8n executions
- Should see successful run
- Check Slack for notification

### Step 5: Verify Airtable Updated
- Go to Airtable `Project_Call_Summaries` table
- Should see new record
- "Is Latest" = checked
- Previous record "Is Latest" = unchecked

### Step 6: Verify Frontend Shows It
- Go to: https://uysp-portal-v2.onrender.com
- Navigate to project/client dashboard
- Should see latest call summary at top

---

## 🔧 Configuration Details

### Zapier Settings
```
Trigger: Otter.ai - New Transcript
Filter: (optional) Only if Folder = "Client Calls"
Action: Google Drive - Create File
- Folder: /Workspace/Transcripts/
- Filename: {{title}} - {{created}}.txt
- Content: {{transcript_text}}
```

### n8n Webhook Settings
```
Path: /webhook/project-call-summary
Method: POST
Response Mode: Immediately
Workspace: H4VRaaZhd8VKQANf (YOUR UYSP project)
```

### Notion Integration Settings
```
Integration Name: UYSP Call Notes Sync
Capabilities: Read content
Connected Database: [Your Project Calls database]
Webhook Event: page.created
Webhook URL: [Your n8n webhook URL]
```

---

## 💡 Important Notes

### "Is Latest" Flag Management
- n8n automatically manages this
- Only ONE record has "Is Latest" = true
- Frontend uses this to show most recent call
- Don't manually check/uncheck this field

### Workspace OS Integration
- **You already have:** Workspace OS → Notion (via MCP)
- **You just need:** Make sure it posts to the correct Notion database
- **The database** n8n watches should be the one Workspace OS posts to

### Frontend Already Works!
Your `uysp-client-portal` already has:
- `src/lib/airtable/client.ts` → `getLatestCallSummary()` method ✅
- API endpoint: `/api/clients/[id]/call-history` ✅
- Airtable fetch working ✅

**You literally just need:**
1. Otter → Workspace folder (Zapier)
2. Notion → n8n webhook connection

That's it!

---

## 🚀 Quick Start (1 Hour Total)

**Step 1: Otter → Workspace (15 min)**
1. Create Zapier account
2. Connect Otter
3. Set up file upload to your workspace folder
4. Test with one call
5. Enable Zap

**Step 2: n8n Setup (30 min)**
1. Import workflow JSON
2. Add credentials (Airtable, Slack)
3. Activate workflow
4. Get webhook URL

**Step 3: Notion → n8n (15 min)**
1. Create Notion integration
2. Set up webhook subscription (via Notion API)
3. Point to n8n webhook URL
4. Test with sample page

**Done!** Full automation working.

---

## 📞 Questions?

**Q: Where is my Workspace OS folder?**
A: Tell me and I'll give you exact Zapier config

**Q: What's my n8n instance URL?**
A: Check your existing workflows - you should have n8n already running

**Q: Do I need to change my Airtable schema?**
A: No! Your `Project_Call_Summaries` table is perfect as-is

**Q: Will this work with my existing frontend?**
A: Yes! Your frontend already reads from this table

---

## ✅ Success Criteria

After setup, your workflow should be:

1. Record call in Otter → Auto-appears in Workspace
2. Workspace OS analyzes → Posts to Notion
3. n8n sees new Notion page → Creates Airtable record
4. Frontend refreshes → Shows latest call summary

**Time from call → dashboard: ~2 minutes**
**Manual steps: Zero** (fully automated)

---

**Next:** Let me know your answers to the questions above and I'll give you copy-paste Zapier + Notion webhook configs!

