# SOP: UYSP SMS Scheduler Workflow

## 1. Executive Summary
- **Workflow Name**: `UYSP-SMS-Scheduler-CLEAN`
- **ID**: `UAZWVFzMrJaVbvGM`
- **Purpose**: This is the core engine for all outbound SMS communications. It runs automatically, finds leads who are ready to receive a text, selects the correct message template for their step in the sequence, and sends it via SimpleTexting. It then logs a complete audit trail of every action in Airtable and sends a notification to Slack.
- **Trigger**: Runs automatically every hour during business hours (9 AM - 5 PM ET, Mon-Fri) via a Cron trigger, and can also be run manually for testing.

---

## 2. System Map

```mermaid
graph TD
    subgraph Airtable
        A[Leads Table<br/>(SMS Pipeline View)]
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
- **Business Logic**: It specifically looks at the `SMS Pipeline` view. This is the **single source of truth** for who is eligible to receive a message right now. A lead only appears in this view if they are either "Ready for SMS" or already "In Sequence". This prevents sending messages to unqualified or stopped leads.

### **Nodes: Get Settings & List Templates**
- **Action**: Fetches all records from the `Settings` and `SMS_Templates` tables in Airtable.
- **Business Logic**: This provides the critical configuration for the run:
    - From `Settings`: It gets the `Active Campaign` name for reporting and the `Fast Mode` toggle for testing.
    - From `SMS_Templates`: It gets the actual message body, A/B variant, and delay timing for each step of the sequence.

### **Node: Prepare Text (A/B)**
- **Action**: This is the primary "brain" of the workflow. It loops through each lead found and prepares the exact message to be sent.
- **Business Logic**:
    1.  **Sequence Gating**: It checks the lead's `SMS Sequence Position` and `SMS Last Sent At` fields to see if enough time has passed to send the next message (respecting the `Delay Days` or `Fast Delay Minutes` from the template).
    2.  **Template Selection**: It finds the correct template for the lead's `SMS Variant` (A/B) and their `nextStep`.
    3.  **Personalization**: It replaces `{Name}` in the template body with the lead's first name.
    4.  **Direct Link Guarantee**: This node **does not** perform any link rewriting. It uses the exact text from the template, ensuring the direct Calendly link is preserved.
    5.  **Campaign Assignment**: It sets the `campaign_id` that will be used for logging in Airtable and Slack, sourcing it from the template first, then falling back to the `Active Campaign` in Settings.

### **Nodes: Update ST Contact & SimpleTexting HTTP**
- **Action**: First, it creates or updates a contact in SimpleTexting with the lead's name and phone number, assigning them to a list and tag. Then, it sends the prepared message.
- **Business Logic**: This ensures that contacts exist and are properly organized in the SimpleTexting UI for manual review, and then sends the message.

### **Node: Parse SMS Response**
- **Action**: Processes the success or failure response from the SimpleTexting API.
- **Business Logic**: It sets the `sms_status` to "Sent" or "Failed" and carries forward all the prepared data (like `campaign_id`) for the next steps.

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
- **Business Logic**: This provides a permanent, unchangeable log of every single message sent. It records the lead ID, phone number, the exact text sent, the campaign name, and a timestamp.

### **Node: SMS Test Notify**
- **Action**: Posts a message to a designated Slack channel.
- **Business Logic**: Provides real-time visibility into the outbound sending activity. The message now correctly includes the **Status** and **Campaign Name** for clear reporting.

---

## 4. Maintenance & Troubleshooting
- **To Stop All Sending**: The fastest way is to uncheck the `Active` box on this workflow in the n8n dashboard.
- **If Messages Don't Send**:
    1. Check the `SMS Pipeline` view in Airtable. Are there any leads there?
    2. Check the `SMS Last Sent At` field for the leads. Has enough time passed for the next step?
    3. Check the execution log in n8n for this workflow. The error will usually be in the "SimpleTexting HTTP" node if it's a provider issue, or "Prepare Text (A/B)" if there's a data problem.
- **If Slack/Audit is Wrong**: The issue is likely in the `Parse SMS Response` node, where the data for later steps is prepared.

