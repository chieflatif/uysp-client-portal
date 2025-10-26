# Project Call Automation - Quick Reference

## 🎯 What This Is

Complete automation for your client call workflow: Otter → Workspace OS → Notion → Airtable → Dashboard

---

## 📁 Documentation Files

### Start Here
**`PROJECT-CALL-AUTOMATION-SETUP.md`** - Complete setup guide  
Read this first. Has your actual workflow and exact steps.

### Implementation Details
**`OTTER-TO-WORKSPACE-AUTOMATION.md`** - Zapier setup for Otter → Workspace  
**`N8N-NOTION-TO-AIRTABLE-WORKFLOW.md`** - n8n workflow JSON (ready to import)

---

## ✅ What Already Works

1. ✅ **Workspace OS → Notion** (via MCP)
2. ✅ **Airtable Table** (`Project_Call_Summaries`)
3. ✅ **Frontend Integration** (uysp-client-portal)
4. ✅ **API Endpoints** (call history, latest summary)

---

## 🚧 What You Need to Build

1. **Otter → Workspace OS** - Zapier automation (15 min)
2. **Notion → n8n** - Webhook connection (30 min)

**Total Setup Time:** 45 minutes

---

## 🎬 Your Workflow (After Setup)

```
1. Client call happens
2. Record in Otter.ai
3. ✨ Zapier: Otter → Workspace folder (automatic)
4. ✨ Workspace OS: Analyze → Notion (automatic, via MCP)
5. ✨ n8n: Notion → Airtable (automatic, via webhook)
6. ✨ Frontend: Shows latest call (automatic, already working)
```

**Your involvement:** Record the call. That's it.

---

## 📊 Technical Stack

- **Otter.ai** - Call recording & transcription
- **Zapier** - File automation
- **Workspace OS** - AI analysis (your existing setup)
- **Notion** - Central call database
- **n8n** - Automation engine (webhook processor)
- **Airtable** - Data storage (`app4wIsBfpJTg7pWS`)
- **uysp-client-portal** - Frontend dashboard

---

## 🔗 Key Information

**Airtable:**
- Base ID: `app4wIsBfpJTg7pWS`
- Table: `Project_Call_Summaries`
- Table ID: `tblvpmq10bFkgDnHa`

**Frontend:**
- URL: https://uysp-portal-v2.onrender.com
- API: `/api/clients/[id]/call-history`
- Method: `getLatestCallSummary()` (already exists)

**n8n Workspace:**
- Project ID: `H4VRaaZhd8VKQANf`
- Webhook path: `/webhook/project-call-summary`

---

## 🚀 Quick Start

1. Read `PROJECT-CALL-AUTOMATION-SETUP.md`
2. Set up Zapier (Otter → Workspace)
3. Import n8n workflow
4. Connect Notion webhook
5. Test end-to-end
6. Done!

---

**Questions?** See the setup guide or ask me for specific configs.

