# Handover to Airtable Agent: Project Call Summaries

## Context
We have a Project Management dashboard that displays tasks, blockers, and status. We need to add an **Executive Summary** section that shows the latest project status call summary.

## What We Need You To Build in Airtable

### Base: `app4wIsBfpJTg7pWS` (Main UYSP base)

### Create New Table: "Project_Call_Summaries"

**Fields:**
1. **Call Date** (Date) - When the call happened
2. **Executive Summary** (Long Text) - 2-3 paragraph summary of the call
3. **Top Priorities** (Long Text) - Bulleted list of top 3-4 priorities discussed
4. **Key Decisions** (Long Text) - Important decisions made
5. **Blockers Discussed** (Long Text) - Any blockers that came up
6. **Next Steps** (Long Text) - Action items from the call
7. **Attendees** (Text) - Who was on the call (e.g., "Latif, Tanveer, Ian")
8. **Call Recording URL** (URL) - Link to recording if available
9. **Transcript** (Long Text) - Full call transcript (optional)
10. **Is Latest** (Checkbox) - Mark the most recent call (only ONE should be checked)
11. **Client** (Linked Record) → Link to Clients table (if it exists)
12. **Created At** (Created Time)
13. **Updated At** (Last Modified Time)

### Workflow for User

User will:
1. Have a project status call with client
2. Get transcript from call
3. Paste transcript into AI agent
4. AI agent creates executive summary + top priorities
5. User pastes into Airtable "Project_Call_Summaries" table
6. Check the "Is Latest" checkbox (dashboard will show this one)

### Sample Record

Here's what a record might look like:

```
Call Date: 2025-10-22
Executive Summary:
  Discussed Q4 priorities focusing on Kajabi integration, Davidson campaign launch,
  and two-way messaging system. Kajabi API upgrade is still blocked pending Ian's
  approval. Team is ready to move forward once approval received. Davidson campaign
  design approved, ready for implementation once Twilio setup complete.

Top Priorities:
  • Kajabi API Integration (BLOCKED - waiting on plan upgrade approval)
  • Davidson WhatsApp Campaign Launch (Q4 2025)
  • Two-Way AI Messaging System (Q1 2026 goal)
  • YouTube Engagement Tracking Research

Key Decisions:
  • Approved Davidson outreach sequence (2-3 text format)
  • Decided to build manual Kajabi backup plan while waiting for API
  • Confirmed Q1 2026 target for AI messaging system

Blockers Discussed:
  • Kajabi plan upgrade required for API access
  • Twilio phone number registration in progress

Next Steps:
  • Ian to approve Kajabi plan upgrade
  • Latif to complete Twilio registration
  • Tanveer to provide content resource mapping

Attendees: Latif, Tanveer, Ian
Is Latest: ☑️ (checked)
```

## What We'll Do Once You're Done

Once you create the table, reply back with:
1. **Table ID** (e.g., `tblXXXXXXXXXXXXXX`)
2. **Confirmation** that "Is Latest" field exists
3. **Sample record ID** (create one test record so we can verify structure)

We'll then:
1. Add API endpoint to fetch latest call summary
2. Add "Executive Summary" card to PM dashboard
3. Display the most recent call summary prominently at the top

## Questions for You

1. **Does a "Clients" table exist** in base `app4wIsBfpJTg7pWS`? If yes, should we link records?
2. **Do you want views created?** (e.g., "Latest Call Only", "All Calls Chronological")
3. **Should we add a "Call Type" field?** (e.g., "Weekly Status", "Planning", "Retrospective")

## Technical Notes

### Why "Is Latest" Checkbox?
We need a simple way to identify which call summary to show on the dashboard. Only ONE record should have this checked at a time. When user adds a new call:
1. Uncheck "Is Latest" on previous record
2. Check "Is Latest" on new record

### Alternative: Sort by Date
Instead of "Is Latest" checkbox, we could:
- Always fetch most recent by "Call Date" (sort descending, limit 1)
- Pros: No manual checkbox management
- Cons: If user backdates a call, wrong one might show

**Your recommendation?**

## Handover Back to Dev Agent

Once you reply with table structure confirmed, send this info:

```
✅ Airtable Setup Complete

Table: Project_Call_Summaries
Table ID: tblXXXXXXXXXXXXXX
Sample Record ID: recXXXXXXXXXXXXXX

Fields Created:
- Call Date (Date)
- Executive Summary (Long Text)
- Top Priorities (Long Text)
- Key Decisions (Long Text)
- Blockers Discussed (Long Text)
- Next Steps (Long Text)
- Attendees (Text)
- Call Recording URL (URL)
- Transcript (Long Text)
- Is Latest (Checkbox)
- Created At (Created Time)
- Updated At (Last Modified Time)

Views Created:
- [List any views you created]

Notes:
- [Any special instructions for dev agent]

Ready for integration!
```

Then the dev agent (me) will:
1. Extend `/src/lib/airtable/client.ts` with `getLatestProjectSummary()` method
2. Add to sync script
3. Create `Project_Summary` table in PostgreSQL
4. Add API endpoint `GET /api/clients/[id]/project/summary`
5. Add Executive Summary card to PM dashboard
6. Deploy

---

## Visual Mockup - Where This Will Appear

```
┌─────────────────────────────────────────────────────────────┐
│ Project Management Dashboard                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 EXECUTIVE SUMMARY - Latest Project Call              │ │
│ │ October 22, 2025                                         │ │
│ │                                                          │ │
│ │ Discussed Q4 priorities focusing on Kajabi integration, │ │
│ │ Davidson campaign launch, and two-way messaging...      │ │
│ │                                                          │ │
│ │ TOP PRIORITIES:                                          │ │
│ │ • Kajabi API Integration (BLOCKED)                       │ │
│ │ • Davidson WhatsApp Campaign                             │ │
│ │ • Two-Way AI Messaging System (Q1 2026)                  │ │
│ │                                                          │ │
│ │ [View Full Summary]                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [4 Active Blockers]  [Progress: 35%]  [21 Tasks]           │
│                                                              │
│ 🔍 Search: [____________]  [Filters...]                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Task              │ Priority │ Status    │ Owner │ Due │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Email Ian...      │ 🔴 Crit  │ Not Start │ Latif │ —  │  │
│ ...
```

---

**Ready for you to implement! Let us know when done.**
