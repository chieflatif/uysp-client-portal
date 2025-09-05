# SOP: Bulk Import End-to-End Test Protocol (Complete & Detailed)

[AUTHORITATIVE]

## 1. Purpose & Scope

This document provides a comprehensive, sequential protocol for executing a full end-to-end test of the bulk lead import and SMS outreach system. **This is a procedural guide that validates every piece of logic and intelligence we've built over months of development.** You will perform an action, then immediately verify its outcome by checking specific fields, formulas, and triggers before proceeding to the next step.

**This is the final validation gate before deploying to the client's live environment.**

**Systems Under Test**:
- UYSP Backlog Ingestion (ID qMXmmw4NUCh1qu8r)
- Clay.com Enrichment Pipeline
- UYSP-SMS-Scheduler (ID D10qtcjjf2Vmmp5j)
- SimpleTexting API & UI
- Airtable Leads, Companies, and SMS_Audit tables

---

## Phase 0: One-Time Environment Setup

**Objective**: To perform the initial configuration of the SimpleTexting environment. **This only needs to be done once.**

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
| **n8n** | Workflow Status | [ ] | UYSP Backlog Ingestion is **Active**. |
| | Workflow Status | [ ] | UYSP-SMS-Scheduler is **Active**. |
| **Airtable** | Test Mode | [ ] | In Settings table, `Test Mode` field is **checked**. |
| | Test Phone | [ ] | In Settings table, `Test Phone` field contains your **correct mobile number**. |
| **SimpleTexting** | List Exists | [ ] | `Contacts` > `Lists`: `AI Webinar – Automation (System)` **exists**. |
| | Tag | [ ] | The `uysp-automation` tag **will be created by the API** on the first run. |
| **API Quotas**| Clay Credits | [ ] | Confirm you have sufficient credits for the test run. |

---

## Phase 2: Test Data Preparation

### **Step 1: Prepare Test Data**
**Your test data is already prepared at**: https://docs.google.com/spreadsheets/d/13zn4hMDC4wUSmSY12g-_tU74N3wlsBLX1fhjQrQpxik/edit?gid=0#gid=0

**Column Mapping** (your sheet has different column order):
- Column A: Last Name
- Column B: First Name  
- Column C: Phone
- Column D: Email

**Test Data Overview** (already in your sheet):

| First Name | Last Name | Email | Phone |
| :--- | :--- | :--- | :--- |
| Alex | Brooks-Potts | alexander.brooks-potts@gmail.com | 8319990767 |
| Saurabh | Mishra | saumishr@akamai.com | 111111111 |
| Neil | Wadhwa | zcxfg | 8319990767 |
| Ryan | Lenzen | rlenzen@salesforce.com | 8319990767 |
| Max | Kaplan | mkaplan@informatica.com | 8319990767 |
| Steve | Harris | steve.harris@docebo.com | 8319990500 |
| Latif | Horst | rebel@rebelhq.ai | 8319990500 |
| Matt | Carregal | matcar@attensi.com | 8319990500 |
| Dan | Flaherty | dan.flaherty@attensi.com | 5593310097 |
| Stephen | McLeod | smcleod@anthesis.co.uk | 7984812020 |

**Critical Notes**:
- NO Company column needed - Clay will enrich this
- NO Job Title column needed - Clay will enrich this  
- These are REAL people and REAL company emails (not test data)
- Only phone numbers are changed to prevent texting real people

**What Each Lead Tests**:
- **Alex**: Personal email (@gmail.com) → Should route to HRQ Archive
- **Saurabh**: Bad phone number (111111111) → Should route to HRQ for manual review
- **Neil**: Invalid email (zcxfg) → System should handle bad email appropriately
- **Ryan**: Salesforce domain (existing company) → Should use existing enrichment data
- **Max**: Informatica domain (new company) → Should create new company & enrich
- **Steve**: Docebo domain (duplicate test) → Should handle duplicate domain logic
- **Latif**: rebel@rebelhq.ai → Won't find enrichment data, tests failure path
- **Matt & Dan**: Both @attensi.com → Tests duplicate detection (should only enrich company once)
- **Stephen**: UK domain (.co.uk) → Should fully score but route to HRQ as non-North America

### **Step 2: Generate the CSV Export URL**

**⚠️ PERMISSION ISSUE DETECTED**: The Google Sheet needs to be made public for n8n to access it.

**Fix the permissions**:
1. In your Google Sheet, click the **Share** button (top right)
2. Under "General access", change from "Restricted" to **"Anyone with the link"**
3. Set permission level to **"Viewer"**
4. Click **Done**

**Then use this CSV export URL**:
```
https://docs.google.com/spreadsheets/d/13zn4hMDC4wUSmSY12g-_tU74N3wlsBLX1fhjQrQpxik/export?format=csv&gid=0
```

**Alternative Method** (if permissions still fail):
1. Download the CSV file manually from Google Sheets: **File > Download > Comma Separated Values (.csv)**
2. Upload the CSV to a public file hosting service (Dropbox, Google Drive public link, etc.)
3. Use that public URL in the n8n workflow

**To verify**: Test the CSV URL in an incognito browser window - it should download the file without requiring login.

---

## Phase 3: Sequential Test Execution & Verification

### **STAGE 1: BULK INGESTION & INITIAL ROUTING**

#### **Action 1.1: Trigger the Bulk Import**
1.  In n8n, navigate to the **UYSP Backlog Ingestion** (ID `qMXmmw4NUCh1qu8r`) workflow.
2.  Click on the **"Fetch CSV"** node in the workflow.
3.  In the right panel, find the **URL** field and paste this URL:
    ```
    https://docs.google.com/spreadsheets/d/13zn4hMDC4wUSmSY12g-_tU74N3wlsBLX1fhjQrQpxik/export?format=csv&gid=0
    ```
4.  Click **"Execute workflow"** at the top of the page.
5.  **Wait 30-60 seconds** for the workflow to complete.

#### **Verification 1.2: Check Smart Field Mapper Logic & HRQ Routing**
**What's Happening**: The ingestion workflow imports all 10 leads and immediately runs them through our "Smart Field Mapper" node. This node applies our first layer of business intelligence:
- **Personal Email Detection**: Checks if email domain is @gmail.com, @yahoo.com, etc.
- **Phone Validation**: Validates phone number format and length
- **Email Format Validation**: Checks for valid email structure
- **Geographic Routing**: Identifies non-North American domains

**Critical Fields Being Set**:
- `HRQ Status`: Gets set to "Archive" or "Manual Review" for problem leads
- `HRQ Reason`: Gets populated with the specific reason (e.g., "Personal email")
- `Processing Status`: Gets set to "Complete" for bad leads, "Queued" for good leads
- `Phone Valid`: Checkbox gets checked for valid phone numbers

**Verification Steps**:
1. **Go to Airtable** → **Leads** table
2. **Find each test lead** and verify the following exact field values:

| Lead Name | Check These Fields | Expected Values |
| :--- | :--- | :--- |
| **Alex Brooks-Potts** | `HRQ Status`, `HRQ Reason`, `Processing Status` | `Archive`, "Personal email", `Complete` |
| **Saurabh Mishra** | `HRQ Status`, `HRQ Reason`, `Processing Status`, `Phone Valid` | `Manual Review`, "Invalid phone", `Complete`, unchecked |
| **Neil Wadhwa** | `HRQ Status`, `HRQ Reason`, `Processing Status` | `Manual Review`, "Invalid email", `Complete` |
| **Stephen McLeod** | `HRQ Status`, `HRQ Reason`, `Processing Status` | `Manual Review`, "Non-North America", `Complete` |
| **Ryan, Max, Steve, Matt, Dan** | `Processing Status`, `Phone Valid` | `Queued`, checked |
| **Latif Horst** | `Processing Status` | `Queued` (will change later when Clay fails) |

**🚨 CRITICAL CHECK**: Go to the **Clay Queue** view in the Leads table. You should see ONLY the 6 leads with `Processing Status` = `Queued`. The other 4 should NOT appear here.

**DO NOT PROCEED UNTIL ALL FIELD VALUES ARE VERIFIED.**

---

### **STAGE 2: CLAY ENRICHMENT MONITORING**

#### **Action 2.1: Monitor Clay Automatic Pickup**
**No manual action required.** Clay.com automatically monitors the **Clay Queue** view in Airtable.

#### **Verification 2.2: Confirm Clay Processing & Company Logic**
**What's Happening**: Clay detects the new leads in the Clay Queue view and automatically imports them. Clay then runs its enrichment waterfall:
1. **Company Domain Extraction**: Gets domain from email (e.g., salesforce.com from rlenzen@salesforce.com)
2. **Company Enrichment**: Looks up company data or uses existing data
3. **Person Enrichment**: Finds job title, location, LinkedIn for each person
4. **Duplicate Detection**: Ensures Matt and Dan (both @attensi.com) only trigger ONE company enrichment

**Critical Systems to Monitor**:

**A. Clay.com Table Monitoring**:
1. **Log into Clay.com**
2. **Navigate to your UYSP Leads table**
3. **Watch for new rows**: The 6 valid leads should appear as new rows
4. **Monitor enrichment columns**: Watch as `Job Title`, `Company`, `Location`, etc. populate in real-time
5. **Check run status**: Ensure no error indicators appear on the rows

**B. Airtable Companies Table**:
1. **Go to Airtable** → **Companies** table
2. **Check for new companies**: Look for newly created records for:
   - **Informatica** (from Max Kaplan)
   - **Docebo** (from Steve Harris)  
   - **Attensi** (from Matt & Dan - should be ONLY ONE record)
3. **Verify existing company**: **Salesforce** should NOT be re-enriched (no new timestamp)

**C. Airtable Leads Table Status Changes**:
1. **Monitor the Clay Queue view**: Leads should disappear from this view as Clay picks them up (filter: `Processing Status = "Queued"` AND `HRQ Status = "Qualified"` AND `Enrichment Timestamp is empty`).
2. After enrichment writeback, eligible leads are moved by automation to **Processing Status = "Ready for SMS"**.
3. If enrichment fails (no `Job Title` and no `Linkedin URL - Person`), automation sets **HRQ Status = "Review"** and **HRQ Reason = "Enrichment failed"**; these appear in the `HRQ — Review` view for manual decision.

**🚨 CRITICAL VERIFICATION**: 
- **Companies Table**: Only ONE Attensi record despite two employees
- **Clay Queue View**: Should be empty when Clay finishes
- **Latif's Status**: Should fail and route to Manual Review

**DO NOT PROCEED UNTIL CLAY ENRICHMENT IS COMPLETE AND VERIFIED.**

---

### **STAGE 3: POST-ENRICHMENT SCORING & SMS ELIGIBILITY**

#### **Action 3.1: Monitor Automatic Formula Calculations**
**No manual action required.** When Clay writes data back to Airtable, it triggers our formula calculations and a dedicated Airtable Automation to stamp the `Enrichment Timestamp`.

#### **Verification 3.2: Verify ICP Scoring Intelligence & SMS Eligibility Logic**
**What's Happening**: Clay writes enriched data back to the Leads table, which triggers our sophisticated scoring formulas and automations:

**A. Enrichment Timestamp Automation (Airtable)**
- An Airtable Automation runs when `Job Title` or `Linkedin URL - Person` are updated.
- It sets the `Enrichment Timestamp` to the current time. This is the **source of truth** for when enrichment is considered complete.

**B. ICP Score Calculation** (Formula: sum of 4 components + bonus):
- **Company Score Component** (0-25): Based on `Company Type` field
- **Role Score Component** (0-45): Based on `Job Title` analysis
- **Location Score Component** (0-20): Based on `Location Country` (US=20, Canada=18, etc.)
- **Dynamic Signals Score** (0-10): Based on various signals
- **Prime Fit Bonus** (+5): Checkbox for perfect matches

**C. SMS Eligible Formula** (Critical business logic):
```
AND(
  {Phone Valid} = TRUE,
  {ICP Score} >= 70,
  OR(
    LOWER({Location Country}) = "united states",
    LOWER({Location Country}) = "canada"
  ),
  {HRQ Status} != "Archive"
)
```

**Verification Steps**:
1. **Go to Airtable** → **Leads** table
2. **For each enriched lead, verify these calculations**:

| Lead Name | Check These Fields | Expected Calculation Results |
| :--- | :--- | :--- |
| **Ryan Lenzen** | `Job Title`, `Company`, `Location Country`, `ICP Score`, `SMS Eligible` | Should have Salesforce data, US location, score likely 70+, SMS Eligible = checked |
| **Max Kaplan** | `Job Title`, `Company`, `Location Country`, `ICP Score`, `SMS Eligible` | Should have Informatica data, US location, score calculation, SMS Eligible if 70+ |
| **Steve Harris** | `Job Title`, `Company`, `Location Country`, `ICP Score`, `SMS Eligible` | Should have Docebo data, location data, score calculation, SMS Eligible if 70+ |
| **Matt Carregal** | `Job Title`, `Company`, `Location Country`, `ICP Score`, `SMS Eligible` | Should link to same Attensi company as Dan, score calculation |
| **Dan Flaherty** | `Job Title`, `Company`, `Location Country`, `ICP Score`, `SMS Eligible` | Should link to same Attensi company as Matt, score calculation |
| **Latif Horst** | `HRQ Status`, `HRQ Reason`, `Processing Status` | Should be `Review`, "Enrichment failed", unchanged until human action |

**🚨 CRITICAL VERIFICATION POINTS**:
- **Company Linking**: Matt and Dan should both link to the SAME Attensi company record
- **Score Components**: Check that each component (Company, Role, Location, Dynamic) has a value
- **SMS Eligible Logic**: Only leads with score 70+, valid phone, and North America should be checked
- **Processing Status**: SMS Eligible leads should show `Ready for SMS`

3. **Check the SMS Eligible view** in Leads table - only qualified leads should appear here

**DO NOT PROCEED UNTIL ALL SCORING LOGIC IS VERIFIED.**

---

### **STAGE 4: SMS SCHEDULER EXECUTION**

#### **Action 4.1: Trigger the SMS Scheduler**
1.  In n8n, navigate to the **UYSP-SMS-Scheduler-CLEAN** (ID `UAZWVFzMrJaVbvGM`) workflow.
2.  Click **"Execute workflow"** at the top of the page.
3.  **Wait 30-60 seconds** for the workflow to complete.

#### **Verification 4.2: Verify SMS Scheduler Intelligence & Contact Management**
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
