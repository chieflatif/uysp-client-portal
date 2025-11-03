# Otter → Workspace OS Automation

## 🎯 Goal

Automatically grab transcripts from Otter.ai and drop them into your Workspace OS folder so your AI analysis can pick them up.

---

## 🔧 Solution Options

### Option 1: Zapier (Easiest - Recommended)

**Trigger:** New Transcript in Otter.ai  
**Action:** Upload file to folder (Dropbox/Google Drive/OneDrive)

**Setup Steps:**

1. **Connect Otter to Zapier**
   - Log into Zapier: https://zapier.com
   - Click "Create Zap"
   - Search for "Otter.ai" as trigger
   - Choose trigger: "New Transcript"
   - Connect your Otter account
   - Test trigger (record a test call or use existing)

2. **Add Filter (Optional but Recommended)**
   - Add step: "Filter"
   - Condition: Only continue if:
     - Transcript Title contains "Client Call" OR
     - Transcript Length > 5 minutes OR
     - Folder equals "Client Calls"
   - This prevents test recordings from cluttering your workspace

3. **Configure File Action**
   
   **If using Dropbox:**
   - Action: "Upload File"
   - Folder: `/Workspace/Client Calls/Transcripts/`
   - File: Use Otter's "Transcript Text" or "Export URL"
   - Filename: `{{Transcript Title}} - {{Date}}.txt`
   
   **If using Google Drive:**
   - Action: "Upload File"
   - Folder: Your Workspace OS folder
   - File Content: Otter transcript text
   - Filename: `{{Transcript Title}} - {{Date Created}}.txt`
   
   **If using Local Folder (requires Zapier CLI):**
   - Use Webhooks to hit a local endpoint
   - Local script saves file to workspace folder

4. **Test and Enable**
   - Test the Zap with a sample transcript
   - Verify file appears in your workspace folder
   - Turn Zap ON

**Cost:** Free tier supports 100 tasks/month (likely enough for client calls)

---

### Option 2: Make.com (More Flexible)

Similar to Zapier but with more advanced routing logic.

**Scenario:**
1. **Watch Otter for New Transcripts** (trigger)
2. **Parse Transcript Metadata** (filter by client name, date, etc.)
3. **Upload to Cloud Storage** (Dropbox/Google Drive)
4. **Send Notification** (Slack/Email when file is ready)

**Advantages:**
- More granular control
- Can add data enrichment (extract client name from transcript)
- Can format filename with metadata

---

### Option 3: Otter API + Script (Custom)

If Otter doesn't integrate with Zapier/Make:

**Create a Node.js script that:**
```javascript
// Run every 5 minutes (cron job)
// 1. Check Otter API for new transcripts
// 2. Download transcript text
// 3. Save to local workspace folder
// 4. Mark as processed
```

**Requirements:**
- Otter API access (may require paid plan)
- Script running on your machine or server
- Cron job scheduler

---

## 📂 Recommended Folder Structure

```
/Workspace/Client Calls/
├── Transcripts/           ← Otter drops here
│   ├── raw/              ← Unprocessed
│   └── processed/        ← After AI analysis
├── Summaries/            ← AI-generated summaries
└── Archives/             ← Old calls
```

**Workflow:**
1. Otter → `/Transcripts/raw/[filename].txt`
2. Workspace OS watches `/Transcripts/raw/`
3. AI analyzes → saves to `/Summaries/`
4. Moves original to `/Transcripts/processed/`

---

## 🚦 Quick Start (Recommended Path)

**Today (10 minutes):**
1. Sign up for Zapier (free)
2. Connect Otter account
3. Create Zap: Otter → Google Drive
4. Test with one call
5. Enable Zap

**Tomorrow:**
- All new Otter transcripts auto-appear in workspace
- Your existing Workspace OS process takes over from there

---

## 🔗 Integration with Rest of Your System

**Once this is set up:**

```
Otter (auto) → Workspace folder → Workspace OS AI → Notion (via MCP) → n8n → Airtable → Frontend ✅
```

**What you still need:**
- n8n workflow: Notion → Airtable (I've already built docs for this)
- Table: `Project_Call_Summaries` (already exists ✅)
- Frontend integration: (already exists ✅ per your code)

---

## ❓ Questions to Answer

Before I finalize this automation:

1. **Where is your Workspace OS folder?**
   - Dropbox?
   - Google Drive?
   - Local machine?
   - OneDrive?

2. **What format do you want from Otter?**
   - Plain text (.txt)?
   - SRT subtitle file?
   - Include speaker labels?

3. **How does Workspace OS detect new files?**
   - File watcher?
   - Manual trigger?
   - Polling a folder?

4. **Do you have Otter.ai Pro/Business?**
   - Affects API access
   - May affect Zapier integration options

Let me know these details and I'll give you the exact Zap configuration to copy-paste!

---

**Next:** Once this is working, I'll update the n8n workflow docs to match your actual `Project_Call_Summaries` table schema.

