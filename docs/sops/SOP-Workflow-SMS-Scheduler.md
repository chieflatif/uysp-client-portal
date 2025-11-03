# SOP: UYSP SMS Scheduler Workflow

## 1. Executive Summary
- **Workflow Name**: `UYSP-SMS-Scheduler-v2`
- **ID**: `UAZWVFzMrJaVbvGM`
- **Purpose**: This is the core engine for all outbound SMS communications. It finds leads who have been manually selected for outreach, selects the correct message template for their step in the sequence, and sends it via SimpleTexting. It then logs a complete audit trail of every action in Airtable and sends a notification to Slack.
- **Trigger**: This workflow is run **manually**. It is activated on-demand for a specific batch of leads. The batch is defined in Airtable by setting the `{SMS Batch Control}` field to "Active" for the desired leads. **This workflow MUST NOT be set to run on an automatic Cron schedule.**

---

## 2. System Map

```mermaid
graph TD
    subgraph Airtable
        A[Leads Table<br/>(Manual Batch Selection)]
        B[Settings Table]
        C[SMS_Templates Table]
        D[SMS_Audit Table]
    end

    subgraph n8n Workflow
        E[List Due Leads]
        F[Get Settings & Templates]
        G[Prepare Text (A/B)]
        H[Update ST Contact]
        I[SimpleTexting HTTP Send]
        J[Parse Response]
        K[Airtable Update]
        L[Audit Sent]
        M[SMS Test Notify]
    end

    subgraph External
        N[SimpleTexting API]
        O[Slack Channel]
    end

    A --> E
    B --> F
    C --> F
    E --> F
    F --> G
    G --> H
    H --> I
    I --> N
    N --> J
    J --> K
    K --> L
    L --> D
    L --> M
    M --> O
```

---

## 3. Detailed Breakdown & Business Logic

This workflow executes in a precise, linear sequence to ensure data integrity and reliable messaging.

### **Node: List Due Leads**
- **Action**: Searches the `Leads` table in Airtable.
- **Business Logic**: It searches for all records where the **`{SMS Batch Control}`** field is set to "Active". This is the **single source of truth** for who will be processed in a given run. This manual, explicit selection process is a critical safeguard to prevent accidental messaging and ensure full control over the outreach process.

### **Nodes: Get Settings & List Templates**
- **Action**: Fetches all records from the `Settings` and `SMS_Templates` tables in Airtable.
- **Business Logic**: This provides the critical configuration for the run:
    - From `Settings`: It gets the `Fast Mode` toggle for testing.
    - From `SMS_Templates`: It gets the actual message body, A/B variant, and delay timing for each step of the sequence.

### **Node: Prepare Text (A/B)**
- **Action**: This is the primary "brain" of the workflow. It loops through each lead found and prepares the exact message to be sent.
- **Business Logic**:
    1.  **Sequence Gating**: It checks the lead's `SMS Sequence Position` and `SMS Last Sent At` fields to see if enough time has passed to send the next message (respecting the `Delay Days` or `Fast Delay Minutes` from the template).
    2.  **Template Selection**: It finds the correct template for the lead's `SMS Variant` (A/B) and their `nextStep`.
    3.  **Personalization**: It replaces `{Name}` in the template body with the lead's first name.
    4.  **Direct Link Guarantee**: This node **does not** perform any link rewriting. It uses the exact text from the template, ensuring the direct Calendly link is preserved.
    5.  **Segmentation Marker**: No campaign assignment. Contacts are marked in SimpleTexting by appending a Note token (e.g., `[uysp:ai_webinar_bdr_2025q3]`) prior to sending.
    6.  **Time Window Enforcement (CRITICAL)**: The code in this node strictly enforces that messages can only be sent between 9 AM and 5 PM Eastern Time. It will not process any leads outside of this window.
    7.  **Duplicate Prevention (CRITICAL)**: The code also contains a safeguard that prevents sending a follow-up message to the same lead within a 24-hour period.

### **Nodes: Update ST Contact & SimpleTexting HTTP**
- **Action**: First, it upserts the SimpleTexting contact and appends the Note token via `PUT /v2/api/contacts/{phone}` with `{comment}`. Then, it sends the prepared message via `POST /v2/api/messages`.
- **Business Logic**: Ensures contacts are marked for UI segmentation. No lists/tags or UI Campaigns are used.

### **Node: Parse SMS Response**
- **Action**: Processes the success or failure response from the SimpleTexting API.
- **Business Logic**: Sets `sms_status` and downstream counters/timestamps. No campaign identifiers are propagated.

### **Node: Airtable Update**
- **Action**: Updates the original lead record in the `Leads` table.
- **Business Logic**: This is a critical state-change step. It updates:
    - `SMS Status` to "Sent"
    - `SMS Sequence Position` (increments by 1)
    - `SMS Sent Count` (increments by 1)
    - `SMS Last Sent At` to the current time
    - `Processing Status` to "In Sequence" (or "Completed" if it was the last message).

### **Node: Audit Sent**
- **Action**: Creates a new record in the `SMS_Audit` table.
- **Business Logic**: Logs lead ID, phone number, text, and timestamp. No campaign field is written.

### **Node: SMS Test Notify**
- **Action**: Posts a message to a designated Slack channel.
- **Business Logic**: Provides real-time visibility (status, identity). No campaign content.

---

## 4. Maintenance & Troubleshooting
- **To Stop All Sending**: The fastest way is to uncheck the `Active` box on this workflow in the n8n dashboard. Alternatively, ensure no leads have their `{SMS Batch Control}` field set to "Active" in Airtable.
- **If Messages Don't Send**:
    1. Check the `Leads` table in Airtable. Are there any leads with `{SMS Batch Control}` set to "Active"?
    2. Check the `SMS Last Sent At` field for the leads. Has enough time passed for the next step?
    3. Check the execution log in n8n for this workflow. The error will usually be in the "SimpleTexting HTTP" node if it's a provider issue, or "Prepare Text (A/B)" if there's a data or time window issue.
- **If Slack/Audit is Wrong**: The issue is likely in the `Parse SMS Response` node, where the data for later steps is prepared.

### Dependency: Calendly Bookings
- Booking updates are applied by `UYSP-Calendly-Booked` (POST `/webhook/calendly`). Subscription is active via Calendly API (org‑scoped).
- Matching logic: Email OR normalized phone digits (digits-only comparison against Airtable `{Phone}`) to handle alternate booking emails.
- Expected fields updated on booking: `Booked` = true, `Booked At` set, `SMS Stop` = true, `SMS Stop Reason` = BOOKED, `Processing Status` = Completed.

