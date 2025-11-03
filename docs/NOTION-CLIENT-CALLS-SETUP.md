# Notion Client Calls Database - Complete Setup Guide

## 📌 Quick Reference

**Database Name:** Client Calls  
**Purpose:** Central repository for all client call notes, integrated with Airtable automation  
**Location:** Your Notion workspace → Client Management section  

---

## 🎯 What This Database Does

When you create a new page in this database:
1. Notion saves your call notes
2. Webhook fires to n8n
3. n8n finds/creates client in Airtable
4. Call note is stored with full context
5. Team gets Slack notification
6. Dashboard updates automatically

**Time saved:** 5-10 minutes per call (no manual data entry!)

---

## 📋 Database Structure

### Properties (Columns)

| Property | Type | Purpose | Required |
|----------|------|---------|----------|
| **Client Name** | Title | Name of the client company | ✅ Yes |
| **Call Date** | Date | When the call occurred | ✅ Yes |
| **Call Type** | Select | Category of call | No |
| **Executive Summary** | Text | 2-3 paragraph overview | ✅ Yes |
| **Top Priorities** | Text | Bulleted list of priorities | No |
| **Key Decisions** | Text | Important decisions made | No |
| **Blockers** | Text | Current blockers discussed | No |
| **Next Steps** | Text | Action items from call | No |
| **Attendees** | Text | Who was on the call | No |
| **Call Recording URL** | URL | Link to recording | No |
| **Full Transcript** | Text | Complete transcript | No |
| **Status** | Select | Processing status | No |
| **Synced to Airtable** | Checkbox | Manual confirmation | No |

---

## 🔧 Setup Instructions

### Step 1: Create the Database

1. In Notion, go to your desired workspace location
2. Type `/database` and select "Database - Inline"
3. Name it: **Client Calls**
4. You'll start with one property: "Client Name" (Title type)

### Step 2: Add Properties

Click "+ Add a property" and add each of these:

#### Call Date
- Type: **Date**
- Configuration:
  - Date format: Your preference (e.g., "Oct 23, 2025")
  - Include time: **No** (unchecked)
  - Time zone: Your timezone

#### Call Type
- Type: **Select**
- Options (create these):
  - 📊 Status Update (Blue)
  - 📋 Planning (Purple)
  - 🔄 Retrospective (Yellow)
  - 🚀 Kick-off (Green)
  - 🚨 Emergency (Red)
  - 📌 Other (Gray)

#### Executive Summary
- Type: **Text**
- Configuration: No special settings needed

#### Top Priorities
- Type: **Text**

#### Key Decisions
- Type: **Text**

#### Blockers
- Type: **Text**

#### Next Steps
- Type: **Text**

#### Attendees
- Type: **Text**

#### Call Recording URL
- Type: **URL**

#### Full Transcript
- Type: **Text**

#### Status
- Type: **Select**
- Options:
  - ✏️ Draft (Gray)
  - ⚙️ Processed (Yellow)
  - ✅ Synced to Airtable (Green)

#### Synced to Airtable
- Type: **Checkbox**

---

### Step 3: Create the Template

1. Click the "⌄" dropdown next to the "New" button
2. Select "+ New template"
3. Name it: **Client Call Template**
4. Set these default properties:
   - Status: Draft
   - Call Date: Today
   - Synced to Airtable: Unchecked
5. In the template body, paste this structure:

```markdown
## Executive Summary

[Write 2-3 paragraphs covering:
- What was discussed (main topics)
- Overall tone/sentiment of the call
- Major themes or patterns
- High-level outcomes]

---

## Top Priorities

- **Priority 1:** [Description]
- **Priority 2:** [Description]
- **Priority 3:** [Description]

---

## Key Decisions

- **Decision 1:** [What was decided and why]
- **Decision 2:** [What was decided and why]

---

## Blockers Discussed

- **Blocker 1:** [Description] (Owner: [Name], Due: [Date])
- **Blocker 2:** [Description] (Owner: [Name], Due: [Date])

---

## Next Steps

- [ ] **Action 1:** [Task description] (Owner: [Name], Due: [Date])
- [ ] **Action 2:** [Task description] (Owner: [Name], Due: [Date])
- [ ] **Action 3:** [Task description] (Owner: [Name], Due: [Date])

---

## Call Details

**Attendees:** [Names]  
**Duration:** [Minutes]  
**Recording:** [Link or "Not recorded"]

---

## Additional Notes

[Any other relevant context, observations, quotes, or follow-up needed]

---

## Quick Reference

- Use the checkboxes in "Next Steps" to track completion
- Update "Status" to "Synced to Airtable" after automation runs
- Check "Synced to Airtable" box once you verify data in Airtable
```

6. Click "Save"

---

### Step 4: Create Useful Views

#### View 1: All Calls (Default)
This view already exists. Configure it:
- Layout: Table
- Sort: Call Date (newest first)
- Group: None
- Filter: None

#### View 2: By Client
1. Click "+ Add a view"
2. Name: "By Client"
3. Layout: Table
4. Group by: Client Name
5. Sort within groups: Call Date (newest first)
6. Show: All properties

#### View 3: Recent (This Week)
1. Click "+ Add a view"
2. Name: "Recent (This Week)"
3. Layout: Table
4. Filter:
   - Call Date → Is on or after → One week ago (relative)
5. Sort: Call Date (newest first)

#### View 4: By Call Type
1. Click "+ Add a view"
2. Name: "By Call Type"
3. Layout: Board
4. Group by: Call Type
5. Sort: Call Date (newest first)

#### View 5: Needs Sync
1. Click "+ Add a view"
2. Name: "Needs Sync"
3. Layout: Table
4. Filter:
   - Synced to Airtable → Is unchecked
5. Sort: Call Date (newest first)
6. Use this to see which calls haven't been verified in Airtable yet

---

## 🎨 Customization Tips

### Add Icons to Properties
Make your database more visual:
- Click the property name
- Click "Edit property"
- Select an icon (e.g., 📅 for Call Date, 📝 for Executive Summary)

### Recommended Icons:
- Client Name: 🏢
- Call Date: 📅
- Call Type: 📋
- Executive Summary: 📝
- Top Priorities: ⭐
- Key Decisions: ✅
- Blockers: 🚧
- Next Steps: 👉
- Attendees: 👥
- Call Recording URL: 🎙️
- Full Transcript: 📄
- Status: 🔄
- Synced to Airtable: ✨

### Color Code Call Types
Use colors to quickly identify call types:
- Status Update → Blue (routine, regular)
- Planning → Purple (strategic, forward-looking)
- Retrospective → Yellow (reflection, lessons learned)
- Kick-off → Green (new, exciting)
- Emergency → Red (urgent, needs attention)

---

## 📝 How to Use (Daily Workflow)

### After Every Client Call:

1. **Get Your Transcript**
   - From your existing automated process
   - Usually saved to your transcripts folder

2. **Run AI Analysis**
   - Use your workspace AI to generate structured summary
   - Get executive summary, priorities, decisions, etc.

3. **Create New Call Note in Notion**
   - Open Notion → Client Calls database
   - Click "New" → "Client Call Template"
   - Or use the keyboard shortcut (Cmd/Ctrl + N)

4. **Fill in the Template**
   - **Client Name:** Type exact name (important for matching!)
   - **Call Date:** Select from calendar
   - **Call Type:** Choose from dropdown
   - **Executive Summary:** Paste generated summary (2-3 paragraphs)
   - **Top Priorities:** Paste or list key priorities
   - **Key Decisions:** Note important decisions
   - **Blockers:** Document any obstacles discussed
   - **Next Steps:** List action items (use checkboxes!)
   - **Attendees:** List who was on the call
   - **Call Recording URL:** Paste link if available
   - **Full Transcript:** (Optional) Paste full transcript

5. **Publish**
   - Click anywhere outside the modal
   - Or press `Cmd/Ctrl + Enter`
   - Status should be "Draft" initially

6. **Automation Runs**
   - Within 5-10 seconds, webhook fires
   - n8n processes the call note
   - Data synced to Airtable
   - Slack notification sent

7. **Verify (Optional)**
   - Check Airtable for new call note
   - Check Slack for notification
   - Once verified, update Status to "Synced to Airtable"
   - Check the "Synced to Airtable" box

---

## 💡 Best Practices

### Client Naming
**IMPORTANT:** Client names must match exactly with Airtable for proper linking.

**Good naming:**
- "Acme Corporation"
- "Tech Startup Inc"
- "Smith & Associates"

**Avoid:**
- Inconsistent capitalization ("acme corporation" vs "Acme Corporation")
- Abbreviations vs full names ("Tech Startup" vs "TSI")
- Extra spaces or special characters

**Pro Tip:** Create a **Client Directory** database in Notion with all client names, then link the "Client Name" property to that database using a Relation. This ensures consistency!

### Executive Summary Guidelines
A good executive summary should:
- Be 2-3 paragraphs (150-300 words)
- Cover main topics discussed
- Note overall client sentiment/tone
- Highlight any major changes or updates
- Be readable without needing to see the full transcript

**Example:**
```
Had a productive quarterly review call with Acme Corp today. The team
is very pleased with the progress on Phase 2 of the project and 
specifically called out the quality of the deliverables. They've seen
a 23% increase in efficiency since implementing our solution.

The main focus of the discussion was planning for Q4 expansion. They
want to roll out the system to their European offices, which will
require some localization work. Budget has been approved, and they're
targeting a January 1st launch date.

One concern was raised about the API integration with their legacy
system. Their IT team is requesting additional documentation. We agreed
to schedule a technical deep-dive next week to address this.
```

### Using Next Steps Effectively
- Use checkboxes (`- [ ]`) so you can track completion in Notion
- Assign owners: `(Owner: John Smith)`
- Set due dates: `(Due: Oct 30)`
- Be specific: "Send updated timeline" not "Follow up"

**Example:**
```
- [ ] Send updated project timeline via email (Owner: Jane, Due: Oct 25)
- [ ] Schedule technical deep-dive call (Owner: Mike, Due: Oct 27)
- [ ] Prepare API documentation (Owner: Engineering, Due: Nov 1)
- [ ] Get budget approval for Q4 expansion (Owner: Sales, Due: Oct 30)
```

### Blockers vs. Next Steps
**Blockers** = Things preventing progress (outside your immediate control)
- "Waiting on client to provide API credentials"
- "Third-party vendor delayed delivery"
- "Budget approval needed from CFO"

**Next Steps** = Actions you/team will take
- "Follow up with client about API credentials"
- "Escalate vendor delay to account manager"
- "Prepare budget proposal for CFO"

---

## 🔍 Advanced Features

### 1. Linked Databases
Create a **Clients** database in Notion:
- Properties: Company Name, Industry, Contact Email, Status
- Then change "Client Name" property in Call Notes to a **Relation**
- Link to the Clients database
- Benefits:
  - Autocomplete client names (consistency!)
  - See all calls for a client in one place
  - Add client metadata (industry, size, etc.)

### 2. Call Note Rollups
If you create a Clients database, add these rollup properties:
- **Total Calls:** Rollup → Count of linked call notes
- **Last Call Date:** Rollup → Max of Call Date from linked notes
- **Average Call Rating:** (if you add a Rating property)

### 3. Automated Reminders
Use Notion's built-in reminders:
1. Add a "Follow-up Date" property (Date type)
2. Set reminders for upcoming follow-ups
3. Get notified when action items are due

### 4. Call Analytics Dashboard
Create a separate "Dashboard" page with:
- Linked databases showing different views
- Call frequency charts (using Notion charts)
- Client health indicators
- Upcoming follow-ups

---

## 🚨 Troubleshooting

### Problem: Automation not firing

**Check:**
1. Did you publish the page? (Not just save as draft)
2. Is the Status set to something other than "Draft"? (Try "Processed")
3. Is the Notion integration connected to this database?
   - Click ••• → Connections
   - Should see "UYSP Call Notes Sync"
4. Check n8n for webhook errors

### Problem: Wrong client linked in Airtable

**Cause:** Client name in Notion doesn't exactly match name in Airtable

**Solution:**
1. Check exact spelling/capitalization in Airtable
2. Update Notion to match exactly
3. OR update client name in Airtable to match your Notion convention
4. Consider using a Relation property (see Advanced Features)

### Problem: Missing data in Airtable

**Check:**
1. Are all required fields filled in Notion?
   - Client Name ✅
   - Call Date ✅
   - Executive Summary ✅
2. Check n8n execution logs for errors
3. Verify property names match exactly (case-sensitive)

---

## 📊 Example Call Note

Here's what a complete, well-formatted call note looks like:

---

**Client Name:** Acme Corporation  
**Call Date:** October 23, 2025  
**Call Type:** 📊 Status Update  
**Attendees:** John Smith (CEO), Jane Doe (CTO), You  

### Executive Summary

Had an excellent Q4 planning call with the Acme Corp executive team. Overall
sentiment is very positive - they're thrilled with the 35% efficiency gains
achieved in Q3 and are eager to expand the implementation to their European
offices in Q1 2026.

The main discussion centered around budget allocation for the expansion and
technical requirements for multi-region deployment. They've already secured
preliminary approval for a $500K investment and are targeting a January 15
launch date for the EU rollout.

One blocker emerged: their compliance team needs additional documentation
regarding data residency requirements for EU customers. We agreed to schedule
a technical deep-dive with their legal and IT teams next week to address this.

### Top Priorities

- **Q1 2026 EU Expansion:** Roll out system to London, Paris, and Berlin offices
- **Compliance Documentation:** Complete data residency and GDPR documentation
- **Team Training:** Train 50+ EU-based users on the platform
- **Integration Enhancement:** Improve API performance for multi-region setup

### Key Decisions

- **Budget Approved:** $500K allocated for EU expansion (pending final compliance review)
- **Timeline Confirmed:** Target launch date of January 15, 2026
- **Technical Approach:** Deploy regional instances vs. single global instance (chose regional for compliance)
- **Next Engagement:** Weekly check-ins starting next Monday

### Blockers Discussed

- **Compliance Review:** Legal team needs data residency documentation (Owner: Legal, Due: Nov 5)
- **API Performance:** Current latency too high for EU users (Owner: Engineering, Due: Nov 15)

### Next Steps

- [ ] Send updated EU expansion proposal (Owner: Sales, Due: Oct 25)
- [ ] Schedule compliance review call with legal team (Owner: You, Due: Oct 27)
- [ ] Prepare technical architecture document for multi-region (Owner: Engineering, Due: Nov 1)
- [ ] Get final budget sign-off from CFO (Owner: John Smith, Due: Nov 3)
- [ ] Set up weekly check-in calls (Owner: You, Due: Oct 24)

### Call Details

**Duration:** 45 minutes  
**Recording:** https://zoom.us/rec/share/xxx...  

### Additional Notes

John mentioned they're considering a strategic partnership with another vendor
in the EU market - might be worth exploring co-marketing opportunities. Jane
also hinted at a potential acquisition they're evaluating, which could
significantly increase their user base.

Follow up on partnership opportunities in next call.

---

**Status:** ✅ Synced to Airtable  
**Synced to Airtable:** ✓

---

## ✅ Checklist: Is Your Database Ready?

Before using the automation, verify:

- [ ] Database created and named "Client Calls"
- [ ] All required properties added (Client Name, Call Date, Executive Summary, etc.)
- [ ] Call Type select options created
- [ ] Template created and tested
- [ ] All views created (All Calls, By Client, Recent, etc.)
- [ ] Notion integration created
- [ ] Integration connected to this database (••• → Connections)
- [ ] Webhook configured (via Notion API or n8n trigger)
- [ ] Test call note created and verified in Airtable
- [ ] Team trained on new process

---

## 📞 Support & Resources

**Having issues?**
- Review full implementation guide: `/docs/CLIENT-CALL-AUTOMATION-IMPLEMENTATION-GUIDE.md`
- Check workflow SOP: `/docs/sops/SOP-Workflow-Client-Call-Ingestion.md`
- System architecture: `/docs/architecture/CLIENT-CALL-SYSTEM-ARCHITECTURE.md`

**Notion Resources:**
- Notion API Documentation: https://developers.notion.com
- Database property types: https://notion.so/help/database-properties
- Templates guide: https://notion.so/help/templates

---

**Last Updated:** 2025-10-23  
**Version:** 1.0  
**Maintained by:** UYSP Development Team

