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
2.  **Confirm all 10 test leads have been added.**
3.  **Verify the initial routing logic** by checking the following views and records:

    **A. Check the `HRQ -- Archive` View:**
    - **What to look for**: This view should contain **1 lead**: Alex Brooks-Potts.
    - **Why**: His `@gmail.com` email was identified as a personal email, and the system automatically archived it to prevent enrichment costs.
    - **Field Check for Alex**: `HRQ Status` = `Archive`, `HRQ Reason` = `Personal email`, `Processing Status` = `Complete`.

    **B. Check the `HRQ -- Review` View:**
    - **What to look for**: This view should contain **3 leads**: Saurabh, Neil, and Stephen.
    - **Why**: They were flagged for data quality issues.
    - **Field Check for Saurabh**: `HRQ Status` = `Review`, `HRQ Reason` = `Invalid phone`.
    - **Field Check for Neil**: `HRQ Status` = `Review`, `HRQ Reason` = `Invalid email`.
    - **Field Check for Stephen**: `HRQ Status` = `Review`, `HRQ Reason` = `Non-North America`.

    **C. Check the `Clay Queue` View:**
    - **What to look for**: This view should contain the remaining **6 leads** (Ryan, Max, Steve, Latif, Matt, Dan).
    - **Why**: These leads passed the initial validation and are now ready for enrichment. Their `Processing Status` should be `Queued`.

**What if it's wrong?**
- If leads are missing, check the n8n execution history for the `Backlog Ingestion` workflow. The error will likely be in the `Fetch CSV` node (URL/permission issue) or the `Airtable Upsert` node.
- If leads are in the wrong HRQ bucket, the logic in the `Normalize` node of the workflow needs to be reviewed.

**DO NOT PROCEED UNTIL ALL 10 LEADS ARE CORRECTLY ACCOUNTED FOR.**

---

## Phase 3: Clay Enrichment & Deduplication

### **Action 3.1: Trigger and Monitor Clay Enrichment**
**What's Happening**: Clay automatically detects the 6 new leads in the `Clay Queue` view. Now, we need to ensure it processes them correctly. This is a **semi-manual** step.

1.  **Log into Clay.com** and navigate to your UYSP Leads table.
2.  You should see the 6 new leads at the top of the table.
3.  Click the **"Run"** button and select **"Run all"** to start the enrichment waterfall.
4.  **Monitor the run in real-time**. Watch as the columns for `Job Title`, `Company Name`, `Location`, etc., begin to populate. Keep an eye on the "Status" column for any errors.

### **Verification 3.2: Confirm Enrichment & Deduplication Logic**
**What's Happening**: Clay is executing its multi-step waterfall: finding or creating companies, enriching person data, and then writing everything back to Airtable.

**Verification Steps**:

**A. Inside Clay.com:**
1.  **Check for Errors**: Once the run is complete, ensure there are no red error indicators on any of the 6 rows. The row for `Latif Horst` is *expected* to have empty enrichment fields, but it should not error out.
2.  **Spot Check Data**: Click on the row for `Ryan Lenzen` (`@salesforce.com`). Check the output of the "Find Airtable Company" step. It should show that it successfully found the existing Salesforce record.

**B. Inside Airtable - `Companies` Table:**
1.  **Verify Deduplication**: Search for "Attensi". There should be **ONLY ONE** record for this company, even though we imported two employees (Matt and Dan).
2.  **Verify New Company Creation**: You should see new records created for "Informatica" and "Docebo".
3.  **Verify No Duplicates**: Search for "Salesforce". The `Last Enriched` timestamp on this record should **NOT** have updated. This confirms Clay used the existing record instead of re-enriching it.

**C. Inside Airtable - `Leads` Table:**
1.  **Check the `Clay Queue` View**: This view should now be **empty**, as all leads have been processed.
2.  **Check Lead Updates**:
    - Find **Ryan, Max, Steve, Matt, and Dan**. Their records should now be populated with `Job Title`, `Linkedin URL - Person`, and `Location Country`.
    - Find **Latif Horst**. His enrichment fields should be empty.

**What if it's wrong?**
- If Clay errors out, click on the failed row in the Clay UI and check the "Run History". It will tell you exactly which step failed (e.g., "Apollo enrichment failed"). This is often due to an invalid API key or running out of credits.
- If company deduplication fails, check the "Find Airtable Company" step in your Clay waterfall to ensure it is correctly configured to search the `Domain` field in the `Companies` table.

**DO NOT PROCEED UNTIL CLAY HAS FINISHED AND DATA IS VERIFIED IN AIRTABLE.**

---

## Phase 4: Airtable Automations, Scoring & SMS Eligibility

### **Action 4.1: Monitor Airtable Automations**
**No manual action required.** The act of Clay writing data back to the `Leads` table triggers our internal Airtable automations.

### **Verification 4.2: Confirm Automation and Formula Logic**
**What's Happening**: The system is now calculating the ICP score and determining who is eligible for SMS outreach based on the newly enriched data.

**Verification Steps**:

**A. Verify Airtable Automation Runs:**
1.  In Airtable, click on **"Automations"** in the top bar.
2.  Find the **"Promote Ready & Timestamp"** automation. Click on it and view its **"Run history"**. You should see 5 successful runs, one for each successfully enriched lead.
3.  Find the **"Route Enrichment Failures"** automation and check its **"Run history"**. You should see one successful run for Latif Horst.

**B. Verify Field Updates in `Leads` Table:**
1.  **Check `Enrichment Timestamp`**: This field should now be populated for Ryan, Max, Steve, Matt, and Dan. It should be empty for Latif.
2.  **Check Status Changes**:
    - **Latif Horst**: `HRQ Status` should be `Review`, and `HRQ Reason` should be `Enrichment failed`. The "Route Enrichment Failures" automation should have then set his `Processing Status` to `Complete`.
    - **Ryan, Max, etc.**: The "Promote Ready" automation should have set their `Processing Status` to `Ready for SMS`.
3.  **Verify `ICP Score` Calculation**: For the 5 enriched leads, check that the `ICP Score` field has a value greater than 0. Spot-check one record to ensure the score is the sum of its components (`Company Score Component`, `Role Score Component`, etc.).
4.  **Verify `SMS Eligible` Checkbox**: Based on the `ICP Score` and `Location`, the `SMS Eligible` checkbox should be checked for the leads who meet the criteria (Score >= 70, in North America).

**C. Check the `SMS Pipeline` View:**
- **What to look for**: This view should now contain only the leads who have the `SMS Eligible` box checked.

**What if it's wrong?**
- If automations did not run, check their configuration to ensure the trigger conditions (e.g., `Job Title` is not empty) were met.
- If `ICP Score` is incorrect, the issue is with the formula in that Airtable field, not with Clay or n8n.
- If leads are not appearing in the `SMS Pipeline` view, they failed the `SMS Eligible` formula. Check their score and location to see why.

**DO NOT PROCEED UNTIL ALL SCORING AND STATUSES ARE VERIFIED.**

---

## Phase 5: SMS Scheduler Execution

#### **Action 5.1: Trigger the SMS Scheduler**
1.  In n8n, navigate to the **UYSP-SMS-Scheduler-CLEAN** (ID `UAZWVFzMrJaVbvGM`) workflow.
2.  Click **"Execute workflow"** at the top of the page.
3.  **Wait 30-60 seconds** for the workflow to complete.

#### **Verification 5.2: Verify SMS Scheduler Intelligence & Contact Management**
**What's Happening**: The SMS Scheduler runs our sophisticated lead selection logic:

**A. Lead Selection Logic** (from "List Due Leads" node):
```
AND(
  {Phone Valid} = TRUE,
  NOT({SMS Stop}) = TRUE,
  NOT({Booked}) = TRUE,
  LEN({Phone}) > 0,
  OR({Processing Status} = 'Queued', {Processing Status} = 'In Sequence'),
  OR({SMS Sequence Position} > 0, {SMS Eligible} = TRUE)
)
```

**B. Contact Creation Logic** (Update ST Contact node):
- Creates/updates contact in SimpleTexting with first/last name
- Assigns to `AI Webinar – Automation (System)` list
- Applies `uysp-automation` tag

**C. Message Personalization Logic** (Prepare Text A/B node):
- Selects appropriate template (Step 1, Variant A or B)
- Personalizes with first name
- Injects direct Calendly link: `https://calendly.com/rebel-rebelhq/1-2-1-latif`

Note: The send node reads `text` and `phone_digits` directly from `Prepare Text (A/B)` to avoid blanks during send.

**Verification Steps**:

**A. Check Your Test Phones**:
1. **Check your SMS app** for new messages
2. **Count the messages**: Should receive one SMS for each lead marked `SMS Eligible`
3. **Check personalization**: Each message should contain the correct first name
4. **Check link**: Each message should contain the **direct Calendly link** (e.g., `https://calendly.com/...`), NOT a `rebelhq.app.n8n.cloud` proxy link.

**B. Verify SimpleTexting Contact Creation**:
1. **Go to SimpleTexting** → **Contacts**
2. **Search for each sent contact** by phone number
3. **Verify contact details**: First name, last name should be populated
4. **Check List assignment**: Go to **Lists** → **AI Webinar – Automation (System)** → verify contacts appear here
5. **Check tag assignment**: Click into individual contacts and verify `uysp-automation` tag is applied

**C. Verify Airtable SMS Audit Trail**:
1. **Go to Airtable** → **SMS_Audit** table
2. **Check for new "Sent" records**: Should see one row for each SMS sent
3. **Verify critical fields**:
   - `Phone`: Should match the 10-digit phone from the lead
   - `Lead Record ID`: Should match the Airtable record ID of the lead
   - `Campaign ID`: Should be populated with the campaign name (e.g., "AI Sales Campaign").
   - `Status`: Should be "Sent"
   - `Sent At`: Should show current timestamp

**D. Verify Airtable Leads Table Updates**:
1. **Go to Airtable** → **Leads** table  
2. **For each SMS-sent lead, check these field updates**:
   - `SMS Status`: Should change from "Not Sent" to "Sent"
   - `SMS Campaign ID`: Should be populated
   - `SMS Sequence Position`: Should be 1 (first message)
   - `SMS Sent Count`: Should be 1
   - `SMS Last Sent At`: Should show current timestamp
   - `Processing Status`: Should change to "In Sequence"

**E. Verify Slack Notifications**:
1. **Check your Slack notifications channel**
2. **Look for SMS send alerts**: Should see notifications for each sent message
3. **Verify alert content**: Should show lead name, phone number, a "Sent" status, and the correct "Campaign Name".

**🚨 CRITICAL VERIFICATION POINTS**:
- **Lead Selection Logic**: Only SMS Eligible leads should receive messages
- **Contact Creation**: Contacts should appear in SimpleTexting with correct data
- **Audit Trail**: Every send should be logged in SMS_Audit with complete data
- **Status Updates**: All relevant Airtable fields should be updated correctly

**DO NOT PROCEED UNTIL ALL SMS LOGIC IS VERIFIED.**

---

### **STAGE 5: END-TO-END VALIDATION**

#### **Action 5.1: Test the Complete User Journey**
1. **On your test phone**, click the Calendly link in one of the received SMS messages
2. **Verify redirect**: Should go directly to the Calendly booking page
3. **Test booking flow**: Optionally complete a test booking to verify the full journey

#### **Verification 5.2: Final System State Check**
**What's Happening**: This is the final verification that all systems are in their expected state after the complete test run.

**A. Airtable Final State**:
1. **Leads Table**: 
   - Bad leads (Alex, Saurabh, Neil, Stephen) should have `HRQ Status` set and `Processing Status` = "Complete"
   - Good leads should have enrichment data, ICP scores, and SMS status updates
   - Latif should have failed enrichment and be in Manual Review
2. **Companies Table**: 
   - New companies created for Informatica, Docebo, Attensi
   - Salesforce should be unchanged
   - Only one Attensi record despite two employees
3. **SMS_Audit Table**: 
   - Complete audit trail for all sent messages
   - All required fields populated correctly

**B. SimpleTexting Final State**:
1. **Contacts**: Only SMS-eligible leads should appear as contacts
2. **Lists**: Contacts should be properly assigned to our automation list
3. **Tags**: Contacts should have the automation tag applied

**C. Clay.com Final State**:
1. **Leads Table**: All processed leads should show enrichment data
2. **Companies**: New companies should be enriched
3. **Run History**: No errors should be present

---

## Phase 4: Post-Test Cleanup

### **Step 1: Clean Test Data**
1. **Airtable**:
   - In the `Leads` table, delete all 10 test records you created
   - In the `SMS_Audit` table, delete the corresponding "Sent" records
   - In the `Companies` table, delete the test companies (Informatica, Docebo, Attensi)
2. **SimpleTexting**:
   - In `Contacts`, find and delete the test contacts (those who received SMS)
3. **Clay.com**:
   - Delete the test lead rows from your Clay table
4. **n8n**:
   - (Optional) Deactivate workflows if they shouldn't run automatically

### **Step 2: Document Results**
1. **Create a test results summary** noting any issues or unexpected behavior
2. **Update documentation** if any business logic needs adjustment
3. **Backup the system state** before moving to production

---

## Appendix: Critical Field Reference

### **Airtable Leads Table - Key Fields**:
- `Processing Status`: Controls workflow routing (Backlog → Queued → Ready for SMS → In Sequence → Completed)
- `HRQ Status`: Human Review Queue routing (Archive, Qualified, Review, Manual Process)
- `HRQ Reason`: Specific reason for HRQ routing
- `Phone Valid`: Checkbox - must be TRUE for SMS eligibility
- `ICP Score`: Calculated score (0-100) from 4 components + bonus
- `SMS Eligible`: Formula checkbox - final gate for SMS sending
- `SMS Status`: Current SMS state (Not Sent → Sent → Delivered → etc.)
- `SMS Campaign ID`: Links SMS sends to campaigns for reporting
- `SMS Sequence Position`: Current step in sequence (0, 1, 2, 3)

### **Critical Views**:
- **Clay Queue**: `Processing Status = "Queued"` AND `HRQ Status = "Qualified"` AND `Enrichment Timestamp is empty` (Clay monitors this)
- **HRQ — Review**: `HRQ Status = "Review"` (human review holding area)
- **SMS Pipeline**: Ensure it includes the states you want to send from (commonly `Ready for SMS` and `In Sequence`).

### **Critical Formulas**:
- **SMS Eligible**: `AND({Phone Valid}, {ICP Score} >= 70, OR(LOWER({Location Country}) = "united states", LOWER({Location Country}) = "canada"), {HRQ Status} != "Archive")`
- **ICP Score**: Sum of Company Score + Role Score + Location Score + Dynamic Signals + Prime Fit Bonus

This protocol ensures comprehensive validation of every component we've built over months of development.
