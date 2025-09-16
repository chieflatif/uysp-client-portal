# SOP: Bulk Import End-to-End Test Protocol (Comprehensive V2)

[AUTHORITATIVE]

## 1. Purpose & Scope

This document provides a comprehensive, sequential protocol for executing a full end-to-end test of the bulk lead import and SMS outreach system. **This is a procedural guide that validates every piece of logic and intelligence we've built.** You will perform an action, then immediately verify its outcome by checking specific fields, formulas, and triggers before proceeding to the next step.

**This is the final validation gate before deploying to any live environment.**

**Systems Under Test**:
- n8n: `UYSP Backlog Ingestion` Workflow
- n8n: `UYSP-SMS-Scheduler-CLEAN` Workflow
- Clay.com: Enrichment & Deduplication Waterfall
- Airtable: `Leads`, `Companies`, `SMS_Audit` tables and all associated Automations.
- SimpleTexting API & UI
- Slack Notifications

---

## Phase 0: One-Time Environment Setup

**Objective**: To perform the initial configuration of the SimpleTexting environment. **This only needs to be done once per SimpleTexting account.**

### In SimpleTexting - Create the List:
1.  Log in to your SimpleTexting account.
2.  On the left-hand menu, click on **`Contacts`**.
3.  At the top of the page that loads, click the **`Lists`** tab.
4.  In the top-right corner, click the blue **`New List`** button.
5.  For the `List name`, type exactly: `AI Webinar – Automation (System)`
6.  Click **`Create`**.

---

## Phase 1: Pre-Test System Verification (Flight Check)

**Objective**: To guarantee the system is in a known, safe, and ready state *before* introducing any test data.

| System | Item | Check | Expected State |
| :--- | :--- | :--- | :--- |
| **n8n** | Workflow Status | [ ] | `UYSP Backlog Ingestion` is **Active**. |
| | Workflow Status | [ ] | `UYSP-SMS-Scheduler-CLEAN` is **Active**. |
| **Airtable** | Test Mode | [ ] | In `Settings` table, `Test Mode` field is **checked**. |
| | Test Phone | [ ] | In `Settings` table, `Test Phone` field contains your **correct mobile number**. |
| | Active Campaign | [ ] | In `Settings` table, `Active Campaign` is set to the campaign you intend to test. |
| **SimpleTexting**| List Exists | [ ] | `Contacts` > `Lists`: `AI Webinar – Automation (System)` **exists**. |
| **API Quotas**| Clay Credits | [ ] | Confirm you have sufficient credits for the test run. |

---

## Phase 2: Test Data Preparation & Ingestion

### **Action 2.1: Prepare the Test Data URL**
1.  **Open the master test data sheet**: [Google Sheet Link](https://docs.google.com/spreadsheets/d/13zn4hMDC4wUSmSY12g-_tU74N3wlsBLX1fhjQrQpxik/edit?gid=0#gid=0)
2.  **Confirm Permissions**: Click the **Share** button (top right). Under "General access", ensure it is set to **"Anyone with the link"** and the role is **"Viewer"**. This is critical for n8n to access the data.
3.  **Copy the CSV Export URL**: This is the URL you will give to n8n.
    ```
    https://docs.google.com/spreadsheets/d/13zn4hMDC4wUSmSY12g-_tU74N3wlsBLX1fhjQrQpxik/export?format=csv&gid=0
    ```

### **Action 2.2: Trigger the Bulk Import**
1.  In n8n, navigate to the **`UYSP Backlog Ingestion`** workflow.
2.  Click **"Execute workflow"**.
3.  In the "Workflow execution data" prompt, paste the CSV Export URL from the previous step into the `url` field.
4.  Click **"Ok"**.
5.  **Wait 30-60 seconds** for the workflow to complete. It should show "Success".

### **Verification 2.3: Check Initial Ingestion & HRQ Routing**
**What's Happening**: The `Backlog Ingestion` workflow has just run its first layer of intelligence, sorting good leads from bad ones *before* they are sent to Clay for enrichment.

**Verification Steps**:
1.  **Go to Airtable** → **`Leads`** table.
2.  **Confirm all test leads have been added.**
3.  **Verify the initial routing logic** by checking the following views and records:

    **A. Check the `HRQ -- Archive` View:**
    - **What to look for**: Personal emails, invalid emails, and invalid phones are **archived immediately**.
    - **Field Check**: `HRQ Status` = `Archive`, `Processing Status` = `Complete`, `HRQ Reason` populated.

    **B. Check the `Clay Queue` View:**
    - **Filter (authoritative)**: `Processing Status = "Queued" AND HRQ Status = "None" AND Enrichment Timestamp is blank`.
    - **What to look for**: Only valid leads enter this view to be picked up by Clay.

**What if it's wrong?**
- If leads are missing, check the n8n execution history for the `Backlog Ingestion` workflow.
- If leads are in the wrong HRQ bucket, the logic in the `Normalize` node of the workflow needs to be reviewed.

---

## Phase 3: Clay Enrichment & Deduplication

### **Action 3.1: Trigger and Monitor Clay Enrichment**
**What's Happening**: Clay automatically detects the new leads in the `Clay Queue` view. Now, we need to ensure it processes them correctly. This is a **semi-manual** step.

1.  **Log into Clay.com** and navigate to your UYSP Leads table.
2.  Click **"Run all"** to start the enrichment waterfall.
3.  Watch for columns like `Job Title`, `Linkedin URL - Person`, `Location Country` to populate.

### **Verification 3.2: Confirm Enrichment & Deduplication Logic**
- Ensure no errors in Clay run history.
- In Airtable `Companies`, verify dedupe by `Domain` (one record per domain).
- In Airtable `Leads`, the `Clay Queue` view should become empty once automations write the `Enrichment Timestamp`.

---

## Phase 4: Airtable Automations, Scoring & SMS Eligibility

### **Action 4.1: Monitor Airtable Automations**
Automations should write `Enrichment Timestamp`, promote to `Ready for SMS`, or route failures to `Review`.

### **Verification 4.2: Confirm Automation and Formula Logic**
- `Enrichment Timestamp` is set for enriched leads.
- `Processing Status` transitions: `Queued` → `Ready for SMS` (success) or `Complete` (failure).
- `SMS Eligible` formula gates new sends (ICP ≥ 70, US/Canada, Phone Valid, not Archived).

---

## Phase 5: SMS Scheduler Execution

- Use the documented filter formula in the scheduler (`Phone Valid`, not stopped/booked, `Queued` or `In Sequence`, and `SMS Eligible` for first sends).

---

## Appendix: Critical Field Reference

### **Critical Views**:
- **Clay Queue**: `Processing Status = "Queued"` AND `HRQ Status = "None"` AND `Enrichment Timestamp` is blank.
- **HRQ — Archive**: personal/invalid email or invalid phone (status already `Complete`).
- **SMS Pipeline**: `Ready for SMS` or `In Sequence` plus `SMS Eligible` logic for first sends.
