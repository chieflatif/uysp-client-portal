# UYSP Workflow Evidence Catalog (Corrected)

This document contains a detailed, evidence-based analysis of all n8n workflows in the UYSP Lead Qualification system. All analysis is based on direct inspection of the live n8n workflows and the live Airtable schema.

---

## WORKFLOW: UYSP-Calendly-Booked (LiVE3BlxsFkHhG83)
**Status**: Active | **Trigger**: Webhook (POST to `/calendly`)
**Purpose**: This workflow activates when a lead books a meeting via Calendly. It captures the invitee's details, finds the corresponding lead in the Airtable `Leads` table, and updates their status to 'Booked'. This action also halts any ongoing SMS sequences for that lead and sends a real-time notification to a designated Slack channel.

### Node Chain Analysis:
1. **Webhook (Calendly)** (`n8n-nodes-base.webhook`) → **Parse Calendly**
   - **Function**: Receives the initial booking data from a Calendly webhook.
   - **Parameters**: `httpMethod: "POST"`, `path: "calendly"`, `responseMode: "lastNode"`
   - **Dependencies**: External Calendly service.
   - **Outputs**: Raw JSON payload from Calendly.

2. **Parse Calendly** (`n8n-nodes-base.code`) → **Find Lead by Email**, **Booked Notify**
   - **Function**: Extracts and normalizes the invitee's email and phone number from the raw webhook data.
   - **Outputs**: A structured JSON object containing `email`, `phoneDigits`, `eventId`, and `bookedAt`.

3. **Find Lead by Email** (`n8n-nodes-base.airtable`) → **Mark Booked**
   - **Function**: Searches the `Leads` table (`tblYUvhGADerbD8EO`) to locate the lead who booked the meeting.
   - **Parameters**:
     - `base`: `app4wIsBfpJTg7pWS`
     - `table`: `tblYUvhGADerbD8EO`
     - `filterByFormula`: `=={{`OR(LOWER({Email})='${($json.email||'').toLowerCase()}', REGEX_REPLACE({Phone}, '\\\\D', '')='${$json.phoneDigits||''}')`}}`
   - **Dependencies**: `email` and `phoneDigits` from the `Parse Calendly` node.
   - **Outputs**: The Airtable record ID of the matching lead.

4. **Mark Booked** (`n8n-nodes-base.airtable`)
   - **Function**: Updates the lead's record in Airtable to reflect the new booking status.
   - **Parameters**: Sets multiple fields on the lead's record:
     - `Booked`: `true`
     - `Booked At`: `={{ $('Parse Calendly').item.json.bookedAt }}`
     - `SMS Stop`: `true`
     - `SMS Stop Reason`: "BOOKED"
     - `Processing Status`: "Completed"
   - **Dependencies**: The Airtable record `id` from `Find Lead by Email`.
   - **Outputs**: The updated Airtable record.

5. **Booked Notify** (`n8n-nodes-base.slack`) → **Respond 200**
   - **Function**: Sends a notification to a Slack channel to alert the team of the new booking.
   - **Dependencies**: Data from the `Parse Calendly` node.

6. **Respond 200** (`n8n-nodes-base.code`)
   - **Function**: Terminates the webhook path with a success status code.

### Business Rules Implemented:
- **Lead Identification**: A lead is uniquely identified by either their `Email` (case-insensitive) or their `Phone` number (digits only).
- **Booking Halts Outreach**: When a lead books a meeting, their `SMS Stop` flag is set to `true`.
- **Status Update on Booking**: A successful booking moves the lead's `Processing Status` to "Completed".
- **Real-time Team Notification**: The team is immediately notified via Slack of every new booking.

### Field Dependencies (`Leads` Table - `tblYUvhGADerbD8EO`):
- **Reads**:
  - `Email` (fldNiWIBmDRON3QGF)
  - `Phone` (fldPgDn3NiFexisIh)
- **Writes**:
  - `Booked` (fld7ZkTkUn6ZQLo6s)
  - `Booked At` (fldAygirJPGndIO2I)
  - `SMS Stop` (fldtzEwzW2Z07g3Kl)
  - `SMS Stop Reason` (fldgkvQgofdbAxXtQ)
  - `Processing Status` (fldAVrpORl3DMqTYu)

---

## WORKFLOW: UYSP-SMS-Inbound-STOP (pQhwZYwBXbcARUzp) (Corrected)
**Status**: Active | **Trigger**: Webhook (POST to `/simpletexting-inbound`)
**Purpose**: This workflow handles inbound SMS messages, specifically listening for opt-out (`STOP`) and opt-in (`UNSTOP`) commands for compliance. Upon receiving a command, it finds the corresponding lead in the `Leads` table and updates their `SMS Stop` status.

### Node Chain Analysis:
1. **Webhook (STOP)** (`n8n-nodes-base.webhook`) → **Parse Inbound**
   - **Function**: Catches incoming POST requests from the SimpleTexting service, triggered by SMS replies.
   - **Parameters**: `httpMethod: "POST"`, `path: "simpletexting-inbound"`

2. **Parse Inbound** (`n8n-nodes-base.code`) → **Find Lead by Phone**
   - **Function**: Parses the SMS data, extracts the phone number, and uses regex to determine if the message is a `STOP` or `UNSTOP` command. It ignores all other messages.
   - **Outputs**: A JSON object with the `phone_digits` and the detected `action` ('STOP' or 'UNSTOP').

3. **Find Lead by Phone** (`n8n-nodes-base.airtable`) → **Mark STOP/UNSTOP**
   - **Function**: Searches the `Leads` table (`tblYUvhGADerbD8EO`) to find the lead associated with the incoming phone number.
   - **Parameters**: `filterByFormula`: Matches the cleaned phone number against the `Phone` field.

4. **Mark STOP/UNSTOP** (`n8n-nodes-base.airtable`)
   - **Function**: Updates the lead's record based on the command received.
   - **Parameters**:
     - `SMS Stop`: Sets to `true` for 'STOP', `false` for 'UNSTOP'.
     - `SMS Stop Reason`: Sets to "STOP" or clears the field.
     - `Processing Status`: Sets to "Stopped" or "Queued".

### Business Rules Implemented:
- **SMS Opt-Out/Opt-In**: The system correctly handles standard SMS compliance words to manage a lead's subscription status.
- **Ignores General Replies**: The workflow is specifically designed to only act on opt-in/opt-out commands, ignoring all other conversational text.

### Field Dependencies (`Leads` Table - `tblYUvhGADerbD8EO`):
- **Reads**:
  - `Phone` (fldPgDn3NiFexisIh)
- **Writes**:
  - `SMS Stop` (fldtzEwzW2Z07g3Kl)
  - `SMS Stop Reason` (fldgkvQgofdbAxXtQ)
  - `Processing Status` (fldAVrpORl3DMqTYu)

---

## WORKFLOW: UYSP-Switchy-Click-Tracker (bA3vEZvfokE84AGY) (Corrected)
**Status**: Active | **Trigger**: Schedule (every 10 minutes) & Manual
**Purpose**: This workflow periodically checks for link-click activity. It fetches all leads from the `Leads` table that have a `Short Link ID`, queries the Switchy.io API to get the latest click count for each link, and updates the lead's record in Airtable with the new count. If new clicks are detected, it sends a Slack notification.

### Node Chain Analysis:
1. **Schedule / Manual Trigger** → **Leads to Check**
   - **Function**: Starts the workflow either every 10 minutes or when manually triggered.

2. **Leads to Check** (`n8n-nodes-base.airtable`) → **Query Clicks (Per Lead)**
   - **Function**: Retrieves all records from the `Leads` table (`tblYUvhGADerbD8EO`) where `Short Link ID` is not empty.

3. **Query Clicks (Per Lead)** (`n8n-nodes-base.httpRequest`) → **Compare Clicks**
   - **Function**: For each lead, it queries the Switchy.io GraphQL API to get the current click count for their assigned `Short Link ID`.

4. **Compare Clicks** (`n8n-nodes-base.code`) → **Update Lead Clicks**, **Filter New Clicks for Slack**
   - **Function**: Compares the new click count from Switchy.io with the `Click Count` stored in Airtable and calculates the difference (`delta`).

5. **Update Lead Clicks** (`n8n-nodes-base.airtable`)
   - **Function**: Updates the lead's record in the `Leads` table with the latest click data.
   - **Parameters**:
     - `Click Count`: The new total clicks from Switchy.io.
     - `Clicked Link`: Sets to `true` if the new click count is greater than 0.

6. **Filter New Clicks for Slack** (`n8n-nodes-base.code`) → **New Click Notification (Fixed)**
   - **Function**: Filters the list to include only leads with new clicks (`delta > 0`) and formats a Slack message.

7. **New Click Notification (Fixed)** (`n8n-nodes-base.slack`)
   - **Function**: Sends a notification to the `#uysp-sales-daily` Slack channel for each lead with new click activity.

### Business Rules Implemented:
- **Periodic Click Monitoring**: Checks for new link clicks every 10 minutes.
- **Click Attribution**: Clicks are tracked per lead based on the unique `Short Link ID`.
- **Real-time Click Alerts**: The sales team receives immediate Slack notifications for new clicks only.

### Field Dependencies (`Leads` Table - `tblYUvhGADerbD8EO`):
- **Reads**:
  - `Short Link ID` (fld1UaVO8Y8i8BlWn)
  - `Click Count` (fldaXIU6Qh6wnAgfA)
  - Other fields for Slack message: `First Name`, `Last Name`, `Email`, `Phone`, etc.
- **Writes**:
  - `Click Count` (fldaXIU6Qh6wnAgfA)
  - `Clicked Link` (fldwTw84hk3TU4cRH)

---

## WORKFLOW: UYSP-ST-Delivery V2 (vA0Gkp2BrxKppuSu) (Corrected)
**Status**: Active | **Trigger**: Webhook (POST to `/simpletexting-delivery`)
**Purpose**: This workflow processes delivery status notifications from SimpleTexting. It finds the corresponding lead in the `Leads` table, updates their `SMS Status`, and logs the event in the `SMS_Audit` table. It sends a Slack notification for any non-delivered messages.

### Node Chain Analysis:
1. **Webhook (ST Delivery)** → **Parse Delivery**
   - **Function**: Receives delivery receipt data from the SimpleTexting webhook.

2. **Parse Delivery** → **Find Lead**, **Write Audit Row**, **If**
   - **Function**: Extracts and standardizes the phone number, delivery status, and carrier from the webhook payload.

3. **Find Lead (by Campaign/Phone)** → **Update Lead Delivery**
   - **Function**: Locates the lead in the `Leads` table (`tblYUvhGADerbD8EO`) using the normalized phone number.

4. **Update Lead Delivery** → **Respond 200**
   - **Function**: Updates the lead's record with the new delivery status.
   - **Parameters**:
     - `SMS Status`: "Delivered" or "Undelivered".
     - `Error Log`: Notes the carrier information.

5. **Write Audit Row**
   - **Function**: Creates a new record in the `SMS_Audit` table (`tbl5TOGNGdWXTjhzP`) to log the delivery event.

6. **If** → **Delivery Notify**
   - **Function**: Proceeds only if the `delivery_status` is *not* "Delivered".

7. **Delivery Notify**
   - **Function**: Sends a Slack alert for any message that failed to deliver.

8. **Respond 200**
   - **Function**: Sends a success response to the webhook.

### Business Rules Implemented:
- **Delivery Status Tracking**: Actively tracks the final delivery status of every SMS message.
- **Failure Notification**: The team is alerted via Slack for any message that is not successfully delivered.
- **Comprehensive Auditing**: Every delivery event is logged in the `SMS_Audit` table.

### Field Dependencies:
- **`Leads` Table (`tblYUvhGADerbD8EO`)**:
  - **Reads**:
    - `Phone` (fldPgDn3NiFexisIh)
  - **Writes**:
    - `SMS Status` (fldiWpXT7gyOeoenD)
    - `Error Log` (fldmTdbljf8a88GNz)
- **`SMS_Audit` Table (`tbl5TOGNGdWXTjhzP`)**:
  - **Writes**:
    - `Event`, `Phone`, `Status`, `Carrier`, `Lead Record ID`, `Delivery At`, `Webhook Raw`

---

## WORKFLOW: UYSP-SMS-Scheduler-v2 (UAZWVFzMrJaVbvGM) (Inactive)
**Status**: Inactive | **Trigger**: Schedule (hourly between 1-11 PM UTC on weekdays) & Manual
**Purpose**: This is the primary engine for SMS outreach. It finds leads who are eligible to receive a message, determines the correct message content based on their position in the sequence and A/B testing variant, enforces multiple safety and compliance rules (time windows, batch sizes), sends the SMS, and updates the lead's status and audit trails in Airtable.

### Node Chain Analysis:
1. **Schedule / Manual Trigger** → **List Due Leads**
   - **Function**: Starts the workflow on a schedule or manually. The cron expression `0 13-23 * * 1-5` corresponds to hourly runs during business hours in a US timezone.

2. **List Due Leads** (`n8n-nodes-base.airtable`) → **Get Settings**
   - **Function**: Fetches the batch of leads to be processed. This is the main targeting query.
   - **Airtable Filter Formula**:
     ```
     AND(
       {Phone Valid},
       NOT({SMS Stop}),
       NOT({Booked}),
       LEN({Phone})>0,
       {SMS Eligible},
       NOT({Current Coaching Client}),
       OR(
         AND({Processing Status}='Ready for SMS', {SMS Batch Control}='Active'),
         {Processing Status}='In Sequence'
       )
     )
     ```

3. **Get Settings** (`n8n-nodes-base.airtable`) → **List Templates**
   - **Function**: Retrieves global configuration from the `Settings` table.

4. **List Templates** (`n8n-nodes-base.airtable`) → **Prepare Text (A/B)**
   - **Function**: Retrieves all message templates from the `SMS_Templates` table.

5. **Prepare Text (A/B)** (`n8n-nodes-base.code`) → **Generate Alias**
   - **Function**: This is the core logic node. It iterates through the due leads and applies numerous business rules to decide who to message and with what content.
   - **Outputs**: A filtered list of leads who are ready to be messaged *right now*, along with their specific message `text`, `variant`, `campaign_id`, and updated sequence position.

6. **Generate Alias** → **Create Short Link** → **Save Short Link** → **Update ST Contact** → **SimpleTexting HTTP**
   - **Function**: This sub-flow generates a unique short URL for click tracking via Switchy.io for each lead who doesn't already have one, saves it back to the lead's record, and updates the contact in SimpleTexting before sending the message.

7. **SimpleTexting HTTP** (`n8n-nodes-base.httpRequest`) → **Parse SMS Response**
   - **Function**: Sends the prepared SMS message via the SimpleTexting API.

8. **Parse SMS Response** (`n8n-nodes-base.code`) → **Airtable Update**
   - **Function**: Parses the API response from SimpleTexting to determine if the send was successful.
   - **Outputs**: Enriches the lead data with the send `sms_status`, `error_reason`, and the `next_pos` (next sequence position).

9. **Airtable Update** (`n8n-nodes-base.airtable`) → **Audit Sent**
   - **Function**: Updates the lead's record in the `Leads` table with the outcome of the send attempt.

10. **Audit Sent** (`n8n-nodes-base.airtable`) → **SMS Test Notify**
    - **Function**: Creates a detailed record of the send attempt in the `SMS_Audit` table for compliance and history.

11. **SMS Test Notify** (`n8n-nodes-base.slack`)
    - **Function**: Sends a summary notification to Slack after a batch is completed.

### Business Rules Implemented:

#### Lead Targeting & Eligibility (`List Due Leads` node)
- A lead must have a `Phone Valid`.
- They must NOT have opted out (`SMS Stop` is false).
- They must NOT have already `Booked` a meeting.
- They must NOT be a `Current Coaching Client`.
- They must be `SMS Eligible` (a formula field itself, see below).
- Their `Processing Status` must be either 'Ready for SMS' (with the global `SMS Batch Control` active) or already 'In Sequence'.

#### Core Logic & Safety (`Prepare Text (A/B)` node)
- **Time Window Enforcement**: The workflow aborts if the current time is outside 9 AM - 5 PM Eastern Time.
- **Batch Size Limit**: Processes a maximum of 25 leads per run to control volume.
- **24-Hour Duplicate Prevention**: A lead cannot be messaged if their `SMS Last Sent At` timestamp is within the last 24 hours.
- **Sequence Progression**: A lead only moves to the next step (`SMS Sequence Position` + 1) if the required time delay (`Delay Days` or `Fast Delay Minutes` from the template) has passed since their last message.
- **A/B Variant Assignment**: If a lead doesn't have a `SMS Variant` assigned, one is chosen based on the ratio in the `Settings` table.
- **Template Selection**: The correct message `Body` is chosen from the `SMS_Templates` table based on the lead's `SMS Variant` and their next sequence `Step`.

### Field Dependencies:

#### Reads from `Leads` Table (`tblYUvhGADerbD8EO`):
- `Phone Valid` (`fldCpTGfssWof1iNb`)
- `SMS Stop` (`fldtzEwzW2Z07g3Kl`)
- `Booked` (`fld7ZkTkUn6ZQLo6s`)
- `Phone` (`fldPgDn3NiFexisIh`)
- `SMS Eligible` (`fldPDAHzTnXo9enLj`) (Formula)
- `Current Coaching Client` (`fldyCaBCQIqbzwEeM`)
- `Processing Status` (`fldAVrpORl3DMqTYu`)
- `SMS Batch Control` (`fldqsBx3ZiuPC0bv3`)
- `SMS Sequence Position` (`fldIm565bl2kNw48c`)
- `SMS Last Sent At` (`fldjHyUk48hUwUq6O`)
- `SMS Variant` (`fldT24jVcEhyYS6iH`)
- `Short Link ID` (`fld1UaVO8Y8i8BlWn`)
- `Short Link URL` (`fldZ4pNQMU9eeEwqC`)

#### Reads from `Settings` Table (`tblErXnFNMKYhh3Xr`):
- `ab_ratio_a`
- `Fast Mode`
- `Active Campaign`

#### Reads from `SMS_Templates` Table (`tblsSX9dYMnexdAa7`):
- `Variant`, `Step`, `Body`, `Delay Days`, `Fast Delay Minutes`, `Campaign`

#### Writes to `Leads` Table (`tblYUvhGADerbD8EO`):
- `Short Link ID` (`fld1UaVO8Y8i8BlWn`)
- `Short Link URL` (`fldZ4pNQMU9eeEwqC`)
- `SMS Status` (`fldiWpXT7gyOeoenD`)
- `SMS Sequence Position` (`fldIm565bl2kNw48c`)
- `SMS Sent Count` (`fldDTrp621ZDgY070`)
- `SMS Variant` (`fldT24jVcEhyYS6iH`)
- `SMS Last Sent At` (`fldjHyUk48hUwUq6O`)
- `Processing Status` (`fldAVrpORl3DMqTYu`)
- `Error Log` (`fldmTdbljf8a88GNz`)

#### Writes to `SMS_Audit` Table (`tbl5TOGNGdWXTjhzP`):
- All fields, including `Event`, `Campaign ID`, `Phone`, `Status`, `Text`, etc.
