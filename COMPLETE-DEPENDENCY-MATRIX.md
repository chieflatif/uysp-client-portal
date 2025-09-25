# UYSP Complete Dependency Matrix (Corrected)

This document maps all data dependencies within the UYSP Lead Qualification system, based on direct analysis of the live Airtable base and n8n workflows.

---

## Section 1: Airtable Schema and Table Relationships

### Table Summary

| Table Name        | ID                  | Purpose                                                                          |
| ----------------- | ------------------- | -------------------------------------------------------------------------------- |
| **Leads**         | `tblYUvhGADerbD8EO` | The central table for all leads, containing contact info, status, scores, and tracking data. |
| **SMS_Audit**     | `tbl5TOGNGdWXTjhzP` | A detailed, per-message audit log for all SMS communications.                    |
| **Settings**      | `tblErXnFNMKYhh3Xr` | Global settings for the system, such as campaign toggles and test mode.          |
| **SMS_Templates** | `tblsSX9dYMnexdAa7` | Stores the templates for different steps and variants of SMS campaigns.          |
| **Companies**     | `tblfAUBA0JFHLGaR4` | Stores company-level enriched data.                                              |
| **Table 1**       | `tblsEbROLIDxisXzV` | Unused default table.                                                            |
| **Leads Backup**  | `tblMD3rJA3MjW2e4v` | A backup or deprecated version of the Leads table.                               |

---

## Section 2: Field-Level Dependency Map (Active & Core Workflows)

This section details which Airtable fields are read from and written to by the active and core business logic workflows.

### Table: `Leads` (`tblYUvhGADerbD8EO`)

| Field Name (`ID`) | Read By | Write By |
|---|---|---|
| `Email` (`fldNiWIBmDRON3QGF`) | `UYSP-Calendly-Booked` | |
| `Phone` (`fldPgDn3NiFexisIh`) | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`, `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` | |
| `Booked` (`fld7ZkTkUn6ZQLo6s`) | `UYSP-SMS-Scheduler-v2` | `UYSP-Calendly-Booked` |
| `Booked At` (`fldAygirJPGndIO2I`) | | `UYSP-Calendly-Booked` |
| `SMS Stop` (`fldtzEwzW2Z07g3Kl`) | `UYSP-SMS-Scheduler-v2` | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP` |
| `SMS Stop Reason` (`fldgkvQgofdbAxXtQ`) | | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP` |
| `Processing Status` (`fldAVrpORl3DMqTYu`) | `UYSP-SMS-Scheduler-v2` | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`, `UYSP-SMS-Scheduler-v2` |
| `Short Link ID` (`fld1UaVO8Y8i8BlWn`) | `UYSP-Switchy-Click-Tracker`, `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `Click Count` (`fldaXIU6Qh6wnAgfA`) | `UYSP-Switchy-Click-Tracker` | `UYSP-Switchy-Click-Tracker` |
| `Clicked Link` (`fldwTw84hk3TU4cRH`) | | `UYSP-Switchy-Click-Tracker` |
| `SMS Status` (`fldiWpXT7gyOeoenD`) | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Error Log` (`fldmTdbljf8a88GNz`) | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Phone Valid` (`fldCpTGfssWof1iNb`) | `UYSP-SMS-Scheduler-v2` | |
| `SMS Eligible` (`fldPDAHzTnXo9enLj`) | `UYSP-SMS-Scheduler-v2` | |
| `Current Coaching Client` (`fldyCaBCQIqbzwEeM`) | `UYSP-SMS-Scheduler-v2` | |
| `SMS Batch Control` (`fldqsBx3ZiuPC0bv3`) | `UYSP-SMS-Scheduler-v2` | Airtable Automation |
| `SMS Sequence Position` (`fldIm565bl2kNw48c`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `SMS Last Sent At` (`fldjHyUk48hUwUq6O`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `SMS Variant` (`fldT24jVcEhyYS6iH`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `Short Link URL` (`fldZ4pNQMU9eeEwqC`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `SMS Sent Count` (`fldDTrp621ZDgY070`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |

### Table: `SMS_Audit` (`tbl5TOGNGdWXTjhzP`)

| Field Name | Read By | Write By |
|---|---|---|
| `Event` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Phone` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Status` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Carrier` | | `UYSP-ST-Delivery V2` |
| `Lead Record ID` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Delivery At` | | `UYSP-ST-Delivery V2` |
| `Webhook Raw` | | `UYSP-ST-Delivery V2` |
| `Campaign ID` | | `UYSP-SMS-Scheduler-v2` |
| `Text` | | `UYSP-SMS-Scheduler-v2` |
| `Email` | | `UYSP-SMS-Scheduler-v2` |
| `First Name` | | `UYSP-SMS-Scheduler-v2` |
| `Last Name` | | `UYSP-SMS-Scheduler-v2` |
| `Company Domain` | | `UYSP-SMS-Scheduler-v2` |
| `Total Messages To Phone` | | `UYSP-SMS-Scheduler-v2` |
| `Sent At` | | `UYSP-SMS-Scheduler-v2` |

### Table: `Settings` (`tblErXnFNMKYhh3Xr`)

| Field Name | Read By | Write By |
|---|---|---|
| `ab_ratio_a` | `UYSP-SMS-Scheduler-v2` | |
| `Fast Mode` | `UYSP-SMS-Scheduler-v2` | |
| `Active Campaign` | `UYSP-SMS-Scheduler-v2` | |

### Table: `SMS_Templates` (`tblsSX9dYMnexdAa7`)

| Field Name | Read By | Write By |
|---|---|---|
| `Variant` | `UYSP-SMS-Scheduler-v2` | |
| `Step` | `UYSP-SMS-Scheduler-v2` | |
| `Body` | `UYSP-SMS-Scheduler-v2` | |
| `Delay Days` | `UYSP-SMS-Scheduler-v2` | |
| `Fast Delay Minutes` | `UYSP-SMS-Scheduler-v2` | |
| `Campaign` | `UYSP-SMS-Scheduler-v2` | |

---

## Section 3: n8n Workflow Logic

This section provides a detailed breakdown of the critical logic contained within the code nodes of the `UYSP-SMS-Scheduler-v2` workflow.

### Node: `Prepare Text (A/B)`

This node is the primary brain of the SMS sending operation. It is responsible for selecting and preparing leads for dispatch.

**Key Logic & Business Rules:**
1.  **Gathers Inputs**: Collects all due leads from `List Due Leads`, settings from `Get Settings`, and templates from `List Templates`.
2.  **Time Window Enforcement**: The workflow will **only** execute between 9 AM and 5 PM Eastern Time. If run outside this window, it will immediately stop and process zero leads.
3.  **Batch Control**: The node processes **every single lead** passed to it from the `List Due Leads` node. Batch sizing is controlled **exclusively** within Airtable by manually setting the `{SMS Batch Control}` field to "Active" for the desired leads. There is no hard-coded batch limit in the workflow.
4.  **Country & Phone Validation**: It performs a basic check to ensure a lead is in the "United States" or "Canada" and has a 10-digit phone number.
5.  **24-Hour Duplicate Prevention**: This is a critical safety feature.
    *   It checks the `{SMS Last Sent At}` timestamp for each lead.
    *   **Crucially, this check only applies if a lead's `{SMS Sequence Position}` is greater than 0.**
    *   This ensures new leads (position 0) are never blocked, while preventing follow-up messages from being sent less than 24 hours apart.
6.  **Sequence & Delay Progression**: For leads with a position > 0, it checks if enough time has passed based on the `{Delay Days}` in the `SMS_Templates` table before allowing them to proceed.
7.  **A/B Variant Assignment**: Assigns a variant ("A" or "B") to new leads based on the ratio set in the `Settings` table.
8.  **Output**: Produces a final list of lead objects, each containing the formatted message text and all necessary data for the subsequent nodes.

### Node: `Parse SMS Response`

This node processes the results from the SimpleTexting API call.

**Key Logic & Business Rules:**
1.  **Determines Success/Failure**: Checks the API response to see if the message was sent successfully.
2.  **Permanent Failure Detection**: It contains specific logic to identify permanent, unrecoverable failures. It checks the error message for keywords like "invalid contact", "local unsubscribe", or "not a valid phone number".
3.  **Status Update Logic**:
    *   On a successful send, it increments the `{SMS Sequence Position}` and `{SMS Sent Count}`, and updates the `{SMS Last Sent At}` timestamp. If the new position is 3 or more, it sets `{Processing Status}` to "Complete".
    *   On a temporary failure, it leaves the position and count unchanged and logs the error.
    *   On a **permanent failure**, it sets the `{Processing Status}` directly to **"Complete"**, effectively removing the lead from the active pipeline.

---

## Section 4: Airtable Automations

The system uses native Airtable automations to automatically clean the pipeline and deactivate leads that no longer require processing.

### Automation 1: System: Deactivate Complete Leads
-   **Trigger**: When a record in the `Leads` table has its `{Processing Status}` field set to "Complete".
-   **Action**: It updates the record and clears the value in the `{SMS Batch Control}` field.
-   **Purpose**: To automatically remove successfully messaged or permanently failed leads from the active sending queue.

### Automation 2: System: Deactivate Stopped Leads
-   **Trigger**: When the `{SMS Stop}` checkbox is checked on a record in the `Leads` table.
-   **Action**: It updates the record and clears the value in the `{SMS Batch Control}` field.
-   **Purpose**: To ensure compliance by immediately and automatically removing any lead who has opted out from all future SMS batches.

---

## Section 5: External System Integration Points

This section documents the external APIs and services that the active UYSP workflows depend on.

### Calendly
- **Workflow**: `UYSP-Calendly-Booked`
- **Integration Type**: Inbound Webhook
- **Business Purpose**: To automatically update a lead's status to "Booked" in the `Leads` table, halting further SMS outreach.

### Switchy.io
- **Workflow**: `UYSP-Switchy-Click-Tracker`
- **Integration Type**: Outbound API Call (GraphQL)
- **Business Purpose**: To monitor lead engagement by tracking clicks on short links.

### SimpleTexting
- **Workflows**: `UYSP-SMS-Inbound-STOP`, `UYSP-ST-Delivery V2`
- **Integration Type**: Inbound Webhook
- **Business Purpose**: To handle SMS compliance (opt-outs/opt-ins) and to track the delivery status of every message sent.

### Slack
- **Workflows**: `UYSP-Calendly-Booked`, `UYSP-Switchy-Click-Tracker`, `UYSP-ST-Delivery V2`
- **Integration Type**: Outbound API Call
- **Business Purpose**: To provide real-time alerts to the team regarding lead activities and system events.

---

## Section 6: Workflow Interdependencies (Data-Driven)

The active workflows are tightly coupled through their shared use of the **Airtable `Leads` table**. Changes made by one workflow directly impact the behavior of others.

### Key Interdependency Points:

- **`SMS Stop` Field (`fldtzEwzW2Z07g3Kl`)**: This is a critical control field.
  - **Written by**: `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`, and the "Deactivate Stopped Leads" Airtable Automation.
  - **Implicitly Read by**: `UYSP-SMS-Scheduler-v2`, which must check this field to remain compliant.

- **`Processing Status` Field (`fldAVrpORl3DMqTYu`)**: This field tracks a lead's journey.
  - **Written by**: `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`, and crucially, `UYSP-SMS-Scheduler-v2` (which now sets it to "Complete" on permanent failure). It also triggers the "Deactivate Complete Leads" Airtable Automation.
  - **Implicitly Read by**: Any workflow that processes leads in a specific state.

- **`SMS Batch Control` Field (`fldqsBx3ZiuPC0bv3`)**: This is the primary manual control for the SMS pipeline.
  - **Read by**: `UYSP-SMS-Scheduler-v2`. This is the *only* thing that determines which leads are included in a run.
  - **Written to by**: The two new Airtable automations, which clear this field to remove leads from the pipeline automatically.

### Summary of Data Flow:

The system operates as a state machine with Airtable as the central state store.
1.  **Manual Action**: A user manually sets the `{SMS Batch Control}` field to "Active" to queue up leads.
2.  **Events** (SMS replies, bookings, clicks, deliveries) are captured by independent webhook workflows.
3.  Each workflow **mutates the state** of a record in the `Leads` table.
4.  **Automated Cleanup**: Airtable Automations monitor for "Complete" or "Stopped" states and automatically clear the `{SMS Batch Control}` field, ensuring the pipeline remains clean.
5.  Other workflows **read this state** to determine their own actions.
This architecture makes the integrity of the `Leads` table data paramount to the entire system's operation.
