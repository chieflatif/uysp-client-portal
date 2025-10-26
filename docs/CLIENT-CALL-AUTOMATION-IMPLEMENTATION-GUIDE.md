# Client Call Automation - Complete Implementation Guide

## 🎯 Quick Start Overview

This guide will walk you through setting up the complete client call transcript automation system from scratch. Total setup time: **2-3 hours**.

**What You'll Build:**
- 📝 Notion database for call notes
- 🤖 n8n workflow for automation
- 📊 Airtable tables for client intelligence
- 🔔 Slack notifications
- ✨ Complete end-to-end automation

---

## 📋 Prerequisites

### Required Access & Accounts
- [ ] Notion workspace (with admin access to create integrations)
- [ ] n8n instance (cloud or self-hosted)
- [ ] Airtable account with Pro or Enterprise plan
- [ ] Slack workspace (with admin access to create apps)

### Required Information
- [ ] Airtable Base ID where you'll store client data
- [ ] Slack channel for notifications (e.g., `#client-updates`)
- [ ] n8n instance URL (e.g., `https://your-n8n.app.n8n.cloud`)

### Skills Needed
- Basic familiarity with Notion
- Basic understanding of webhooks (we'll explain everything)
- Ability to copy-paste and follow instructions carefully

---

## 🏗️ Implementation Steps

### Phase 1: Airtable Setup (30 minutes)

#### Step 1.1: Create `Clients` Table

1. Open your Airtable base
2. Create a new table called `Clients`
3. Add the following fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| Client Name | Single line text | Primary field |
| Status | Single select | Options: Active, Inactive, Prospect, Churned |
| Industry | Single line text | Leave blank for now |
| Company Size | Single select | Options: Small, Medium, Large, Enterprise |
| Primary Contact Name | Single line text | |
| Primary Contact Email | Email | |
| Primary Contact Phone | Phone number | |
| First Contact Date | Date | Include time: No |
| Source | Single select | Options: Referral, Direct, Call Notes, Kajabi, Other |
| Website | URL | |
| Notes | Long text | |
| Active Client | Checkbox | Default: unchecked |
| High Priority | Checkbox | Default: unchecked |
| Created At | Created time | |
| Updated At | Last modified time | |

4. Create these **Rollup/Lookup** fields (will link to Client_Call_Notes table we'll create next):
   - `Total Calls` (Rollup) - Count of linked call notes
   - `Latest Call Date` (Lookup) - From most recent call note
   - `Latest Call Summary` (Lookup) - From most recent call note

5. Create this **Formula** field:
   - `Days Since Last Call`: `DATETIME_DIFF(TODAY(), {Latest Call Date}, 'days')`
   - `At Risk`: `IF({Days Since Last Call} > 45, TRUE(), FALSE())`

#### Step 1.2: Create `Client_Call_Notes` Table

1. In the same base, create a new table called `Client_Call_Notes`
2. Add the following fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| Title | Formula | `CONCATENATE({Client Name}, " - ", DATETIME_FORMAT({Call Date}, 'MMM DD, YYYY'))` |
| Client | Link to another record | Link to: Clients table |
| Client Name | Lookup | From: Client → Client Name |
| Call Date | Date | Include time: No, **Required** |
| Call Type | Single select | Options: Status Update, Planning, Retrospective, Kick-off, Emergency, Other |
| Attendees | Single line text | |
| Call Duration | Number | Precision: 0, Format: Integer |
| Executive Summary | Long text | Enable rich text |
| Top Priorities | Long text | Enable rich text |
| Key Decisions | Long text | Enable rich text |
| Blockers Discussed | Long text | Enable rich text |
| Next Steps | Long text | Enable rich text |
| Call Recording URL | URL | |
| Full Transcript | Long text | |
| Notion Page ID | Single line text | |
| Is Latest | Checkbox | Default: unchecked |
| Created At | Created time | |
| Updated At | Last modified time | |

#### Step 1.3: Configure Table Links

1. Go back to `Clients` table
2. Update the rollup/lookup fields you created earlier:
   - **Total Calls**:
     - Field type: Count (rollup)
     - Link field: Client (from Client_Call_Notes)
     - Aggregation: COUNT(values)
   - **Latest Call Date**:
     - Field type: Lookup
     - Link field: Client (from Client_Call_Notes)
     - Lookup field: Call Date
     - Filter: Is Latest = ✓ (checked)
   - **Latest Call Summary**:
     - Field type: Lookup
     - Link field: Client (from Client_Call_Notes)
     - Lookup field: Executive Summary
     - Filter: Is Latest = ✓ (checked)

#### Step 1.4: Create Useful Views

**In `Clients` table:**
1. **Active Clients** view
   - Filter: Status = Active
   - Sort: Latest Call Date (newest first)
   - Group: None

2. **At Risk** view
   - Filter: At Risk = ✓
   - Sort: Days Since Last Call (largest first)

3. **High Priority** view
   - Filter: High Priority = ✓
   - Sort: Latest Call Date (newest first)

**In `Client_Call_Notes` table:**
1. **All Calls** view (default)
   - Sort: Call Date (newest first)

2. **Latest Calls Only** view
   - Filter: Is Latest = ✓
   - Group: Client

3. **By Client** view
   - Group: Client
   - Sort within groups: Call Date (newest first)

4. **Recent (7 Days)** view
   - Filter: `IS_AFTER({Call Date}, DATEADD(TODAY(), -7, 'days'))`
   - Sort: Call Date (newest first)

5. **With Blockers** view
   - Filter: Blockers Discussed is not empty
   - Sort: Call Date (newest first)

#### Step 1.5: Get API Access

1. Go to https://airtable.com/create/tokens
2. Click "Create new token"
3. Name it: `UYSP Client Call Automation`
4. Add these scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Add access to your specific base
6. Click "Create token"
7. **COPY THE TOKEN** - you'll need it for n8n setup
8. Store it securely (you can't see it again!)

✅ **Airtable setup complete!**

---

### Phase 2: Notion Setup (20 minutes)

#### Step 2.1: Create Notion Database

1. In your Notion workspace, navigate to where you want to store client calls
2. Type `/database` and select "Database - Inline"
3. Name it: `Client Calls`
4. Add these properties:

| Property Name | Type | Configuration |
|---------------|------|---------------|
| Client Name | Title | (default) |
| Call Date | Date | Include time: No |
| Call Type | Select | Options: Status Update, Planning, Retrospective, Kick-off, Emergency, Other |
| Executive Summary | Text | |
| Top Priorities | Text | |
| Key Decisions | Text | |
| Blockers | Text | |
| Next Steps | Text | |
| Attendees | Text | |
| Call Recording URL | URL | |
| Full Transcript | Text | |
| Status | Select | Options: Draft, Processed, Synced to Airtable |
| Synced to Airtable | Checkbox | |

#### Step 2.2: Create Call Note Template

1. Click the "⌄" dropdown next to "New" button
2. Select "New template"
3. Name it: "Client Call Template"
4. In the template body, paste:

```markdown
## Executive Summary
[2-3 paragraph overview of the call - what was discussed, major themes, overall tone]

## Top Priorities
- Priority 1
- Priority 2
- Priority 3

## Key Decisions
- Decision 1 - [Description]
- Decision 2 - [Description]

## Blockers Discussed
- Blocker 1 (Owner: [Name], Due: [Date])
- Blocker 2 (Owner: [Name], Due: [Date])

## Next Steps
- [ ] Action item 1 (Owner: [Name], Due: [Date])
- [ ] Action item 2 (Owner: [Name], Due: [Date])
- [ ] Action item 3 (Owner: [Name], Due: [Date])

## Attendees
[List names]

## Additional Notes
[Any other relevant context, observations, or follow-up needed]
```

4. Save template

#### Step 2.3: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Name: `UYSP Call Notes Sync`
4. Associated workspace: [Select your workspace]
5. Type: Internal
6. Capabilities:
   - ✓ Read content
   - ✓ Update content (optional, for future enhancements)
   - ✓ Insert content (optional)
7. Click "Submit"
8. **COPY THE "Internal Integration Token"** - you'll need this later
9. Store it securely

#### Step 2.4: Share Database with Integration

1. Go to your "Client Calls" database in Notion
2. Click the "•••" (three dots) menu in the top right
3. Scroll down and click "Add connections"
4. Find and select "UYSP Call Notes Sync"
5. Click "Confirm"

✅ **Notion setup complete!**

---

### Phase 3: Slack Setup (15 minutes)

#### Step 3.1: Create Slack Channel

1. In Slack, create a new channel called `#client-updates` (or use existing)
2. This is where automation notifications will be sent

#### Step 3.2: Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. App Name: `UYSP Automation`
5. Workspace: [Select your workspace]
6. Click "Create App"

#### Step 3.3: Enable Incoming Webhooks

1. In the left sidebar, click "Incoming Webhooks"
2. Toggle "Activate Incoming Webhooks" to **ON**
3. Scroll down and click "Add New Webhook to Workspace"
4. Select the `#client-updates` channel
5. Click "Allow"
6. **COPY THE WEBHOOK URL** - you'll need this for n8n
7. Store it securely

✅ **Slack setup complete!**

---

### Phase 4: n8n Workflow Setup (45 minutes)

#### Step 4.1: Import Workflow

1. Log in to your n8n instance
2. Go to Workflows
3. Click "Add Workflow" → "Import from File"
4. Upload: `/templates/n8n-client-call-ingestion.json` (from this repo)
5. Click "Import"

#### Step 4.2: Configure Credentials

**Airtable Credential:**
1. Click on any Airtable node
2. Under "Credentials", click "Create New"
3. Select "Airtable Personal Access Token"
4. Name: `UYSP Airtable`
5. Paste your Airtable token from Phase 1, Step 1.5
6. Click "Save"

**Slack Credential:**
1. Click on the "Send Slack Notification" node
2. Under "Credentials", click "Create New"
3. Select "Slack API"
4. Name: `UYSP Slack`
5. Method: "Webhook URL"
6. Paste your Slack webhook URL from Phase 3, Step 3.3
7. Click "Save"

#### Step 4.3: Update Configuration

1. **Update Base ID** in all Airtable nodes:
   - Find: `{{$credentials.airtableTokenApi.baseId}}`
   - Replace with your actual base ID (looks like `appXXXXXXXXXXXXX`)
   - You can find this in your Airtable URL when viewing the base

2. **Verify Table Names:**
   - Ensure all Airtable nodes reference:
     - Table: `Clients`
     - Table: `Client_Call_Notes`
   - If you named your tables differently, update here

3. **Update Slack Channel** (if different):
   - In "Send Slack Notification" node
   - Change channel from `#client-updates` to your channel name

#### Step 4.4: Get Webhook URL

1. Click on the "Webhook (Notion)" node
2. At the bottom, you'll see "Test URL" and "Production URL"
3. **COPY THE PRODUCTION URL**
4. It will look like: `https://your-n8n-instance.com/webhook/client-call`
5. Save this - you'll need it next

#### Step 4.5: Save & Activate Workflow

1. Click "Save" in the top right
2. Toggle the workflow to "Active"
3. Verify the status shows "Active" with a green indicator

✅ **n8n workflow imported and configured!**

---

### Phase 5: Connect Notion to n8n (30 minutes)

⚠️ **Important:** Notion does not natively support database webhooks in the UI. You'll need to use the Notion API to create a webhook subscription.

#### Step 5.1: Get Database ID

1. Open your "Client Calls" database in Notion
2. Click "Share" → "Copy link"
3. The URL will look like: `https://www.notion.so/workspace/[DATABASE_ID]?v=...`
4. Extract the `DATABASE_ID` (32-character alphanumeric string)
5. Save this value

#### Step 5.2: Create Webhook Subscription via API

Since Notion's webhook API requires some technical setup, here are two options:

**Option A: Use Postman or Insomnia (Recommended for non-developers)**

1. Download Postman: https://www.postman.com/downloads/
2. Open Postman
3. Create a new request:
   - Method: `POST`
   - URL: `https://api.notion.com/v1/webhooks`
   - Headers:
     - `Authorization`: `Bearer YOUR_NOTION_INTEGRATION_TOKEN`
     - `Content-Type`: `application/json`
     - `Notion-Version`: `2022-06-28`
   - Body (raw JSON):
```json
{
  "event_types": ["page.created"],
  "database_id": "YOUR_DATABASE_ID_HERE",
  "url": "YOUR_N8N_WEBHOOK_URL_HERE"
}
```
4. Replace:
   - `YOUR_NOTION_INTEGRATION_TOKEN` with token from Phase 2, Step 2.3
   - `YOUR_DATABASE_ID_HERE` with ID from Step 5.1
   - `YOUR_N8N_WEBHOOK_URL_HERE` with URL from Phase 4, Step 4.4
5. Click "Send"
6. You should get a 200 OK response with webhook details
7. **Save the `webhook_id` from the response** - you'll need it to delete/update later

**Option B: Use cURL (for command-line users)**

Run this command in your terminal:

```bash
curl -X POST https://api.notion.com/v1/webhooks \
  -H 'Authorization: Bearer YOUR_NOTION_INTEGRATION_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Notion-Version: 2022-06-28' \
  -d '{
    "event_types": ["page.created"],
    "database_id": "YOUR_DATABASE_ID_HERE",
    "url": "YOUR_N8N_WEBHOOK_URL_HERE"
  }'
```

Replace the placeholders with your actual values.

**Option C: Simplified Approach (Use n8n's Notion Trigger)**

If the API approach is too complex, you can use n8n's built-in Notion trigger:

1. In your n8n workflow, replace the Webhook node with a Notion Trigger node
2. Configure it to watch for "Database Item Created" events
3. Select your "Client Calls" database
4. This will poll Notion every 1-5 minutes instead of real-time webhooks
5. Trade-off: Slightly slower but much easier to set up

✅ **Notion connected to n8n!**

---

### Phase 6: Testing (30 minutes)

#### Step 6.1: Create Test Client Call

1. Go to your Notion "Client Calls" database
2. Click "New" → "Client Call Template"
3. Fill in test data:

```
Client Name: Test Corp
Call Date: [Today's date]
Call Type: Status Update

Executive Summary:
Had a great status call with Test Corp today. Discussed Q4 priorities
and reviewed their progress on the current project. Team is on track
and very satisfied with the deliverables so far. Identified one minor
blocker regarding API integration timeline.

Top Priorities:
- Complete API integration by end of month
- Finalize Q4 marketing campaign
- Schedule team training session

Key Decisions:
- Approved budget increase for additional developer resources
- Decided to extend API integration deadline by 2 weeks
- Agreed on bi-weekly check-ins moving forward

Blockers Discussed:
- API documentation incomplete (Owner: Engineering, Due: Oct 30)

Next Steps:
- [ ] Send updated project timeline (Owner: PM, Due: Oct 25)
- [ ] Schedule follow-up call (Owner: Sales, Due: Oct 27)
- [ ] Review API docs (Owner: Engineering, Due: Oct 30)

Attendees: John Doe, Jane Smith, You
```

4. Save the page

#### Step 6.2: Verify n8n Execution

1. Go to your n8n instance
2. Click "Executions" in the left sidebar
3. You should see a new execution for "UYSP-Client-Call-Ingestion"
4. Click on it to view details
5. Verify all nodes executed successfully (green checkmarks)

**If execution failed:**
- Check error message in n8n
- Common issues:
  - Wrong table names
  - Missing credentials
  - Incorrect field names in Airtable
  - Notion webhook not firing (use Option C from Phase 5)

#### Step 6.3: Verify Airtable Data

1. Go to your Airtable base
2. Open `Clients` table
3. You should see a new client: "Test Corp"
   - Status: Active
   - Source: Call Notes
   - Total Calls: 1
   - Latest Call Date: [Today]

4. Open `Client_Call_Notes` table
5. You should see a new call note:
   - Client: Test Corp (linked)
   - Call Date: [Today]
   - Executive Summary: [Your test summary]
   - Is Latest: ✓ (checked)

#### Step 6.4: Verify Slack Notification

1. Open Slack
2. Go to `#client-updates` channel
3. You should see a notification like:

```
🎙️ **New Client Call Processed**

**Client:** Test Corp
🆕 _New client created!_
**Date:** 2025-10-23
**Attendees:** John Doe, Jane Smith, You

**Executive Summary:**
Had a great status call with Test Corp today. Discussed Q4 priorities
and reviewed their progress on the current project...

**Top Priorities:**
- Complete API integration by end of month
- Finalize Q4 marketing campaign
- Schedule team training session

🔗 View in Notion
📊 View in Airtable

---
_Automated via UYSP Client Call Ingestion • 2025-10-23T15:30:00Z_
```

#### Step 6.5: Test "Is Latest" Flag Management

1. Create a second call note for "Test Corp" in Notion
2. Fill in different data, use tomorrow's date
3. Save it
4. Check Airtable `Client_Call_Notes` table
5. Verify:
   - First call note: Is Latest = ☐ (unchecked)
   - Second call note: Is Latest = ✓ (checked)
   - Clients table: Total Calls = 2

✅ **Testing complete! System is working!**

---

## 🎊 Congratulations!

Your client call automation system is now fully operational!

### What You've Built:

✅ Automated call note ingestion from Notion → Airtable  
✅ Smart client matching (finds existing or creates new)  
✅ Intelligent "Is Latest" flag management  
✅ Real-time Slack notifications  
✅ Complete audit trail in Airtable  
✅ Client intelligence dashboard views  

---

## 📖 User Guide: Daily Usage

### For You (Call Note Creator):

**After every client call:**

1. Get your call transcript (from your existing process)
2. Run through your AI workspace analyzer to generate summary
3. Open Notion → Client Calls database
4. Click "New" → "Client Call Template"
5. Fill in:
   - Client Name (exact match to existing client if possible)
   - Call Date
   - Paste generated summaries
   - Add attendees
6. Click "Create" or "Publish"
7. ✨ **That's it!** The automation handles the rest

**Within 5-10 seconds:**
- Client record updated in Airtable
- Call note created and linked
- Slack notification sent to team
- Dashboard views refreshed

---

## 🔧 Troubleshooting

### Problem: Call note created in Notion but nothing happens

**Check:**
1. Is the n8n workflow "Active"? (green toggle)
2. Check n8n Executions - is there a new execution?
3. If NO execution:
   - Notion webhook not firing → try Option C (Notion Trigger node)
   - Webhook URL wrong → verify URL in webhook subscription
4. If execution EXISTS but FAILED:
   - Check error message
   - Verify credentials are valid
   - Confirm table names match exactly

### Problem: Client not found, always creates duplicates

**Solution:**
- Standardize client naming in Notion
- Use exact same spelling/capitalization
- Update existing client names in Airtable to match Notion
- Consider adding a "Client" database in Notion and using a Relation property instead of text

### Problem: "Is Latest" flag not working

**Check:**
1. Go to n8n execution for that call
2. Look at "Find Old 'Is Latest' Notes" node
3. If it found 0 records → filter formula might be wrong
4. Manually fix:
   - Go to Airtable
   - Filter Client_Call_Notes for specific client
   - Uncheck all "Is Latest" except most recent

### Problem: Slack notification not sent

**Check:**
1. Webhook URL is correct
2. Channel name is correct (include #)
3. Slack app is installed in workspace
4. Test webhook URL directly with curl:

```bash
curl -X POST YOUR_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test message"}'
```

---

## 🚀 Next Steps & Enhancements

### Quick Wins (1-2 hours each):

1. **Add Call Type Filtering**
   - Create views in Airtable by Call Type
   - Add conditional Slack notifications (e.g., only alert on "Emergency" calls)

2. **Create Dashboard**
   - Use Airtable Interface Designer
   - Build client overview dashboard
   - Show "At Risk" clients, recent calls, upcoming follow-ups

3. **Email Digest**
   - Use Airtable automation
   - Send weekly email with all new call notes
   - Include summary statistics

### Advanced Features (1-2 days each):

1. **AI Sentiment Analysis**
   - Add OpenAI node to n8n workflow
   - Analyze call transcript for sentiment
   - Flag negative sentiment calls for review

2. **Automatic Action Items**
   - Parse "Next Steps" with regex or AI
   - Create tasks in project management tool
   - Assign to team members automatically

3. **Client Health Scoring**
   - Calculate health score in Airtable
   - Based on call frequency, sentiment, blocker count
   - Alert when client health drops below threshold

4. **Direct Workspace Integration**
   - Build API endpoint in workspace
   - Eliminate Notion copy-paste step
   - Automatically post to Notion after analysis

---

## 📚 Additional Resources

**Documentation:**
- Full SOP: `/docs/sops/SOP-Workflow-Client-Call-Ingestion.md`
- Architecture: `/docs/architecture/CLIENT-CALL-SYSTEM-ARCHITECTURE.md`
- Workflow JSON: `/templates/n8n-client-call-ingestion.json`

**Related Systems:**
- Airtable Schema: `/docs/architecture/AIRTABLE-SCHEMA.md`
- n8n Best Practices: `/docs/architecture/N8N-MINIMAL-WORKFLOWS.md`

**Support:**
- n8n Docs: https://docs.n8n.io
- Notion API: https://developers.notion.com
- Airtable API: https://airtable.com/api

---

## ✅ Final Checklist

Before considering this "production ready", confirm:

- [ ] Tested with at least 3 different clients
- [ ] Verified "Is Latest" flag management with 5+ calls
- [ ] Confirmed Slack notifications work consistently
- [ ] Validated client matching logic (existing vs. new)
- [ ] Documented your specific client naming conventions
- [ ] Backed up workflow JSON
- [ ] Saved all API keys/tokens securely
- [ ] Trained team on new process
- [ ] Created quick reference guide for daily use
- [ ] Set up monitoring/alerts for workflow failures

---

**🎉 You're all set! Enjoy your new automated client call intelligence system!**

**Questions or issues?** Check the troubleshooting section or review the detailed SOPs in the docs folder.

---

**Last Updated:** 2025-10-23  
**Version:** 1.0  
**Setup Time:** ~2-3 hours  
**Maintenance:** ~15 min/week

