# SOP: Airtable Table - Leads

## 1. Executive Summary
- **Table Name**: `Leads`
- **ID**: `tblYUvhGADerbD8EO`
- **Purpose**: This is the central nervous system of the entire lead qualification and outreach process. Every lead, regardless of source, lives in this table. Its fields track a lead's journey from initial intake, through enrichment and scoring, to the final SMS outreach and booking. The `Processing Status` field acts as the primary "state machine" that controls what happens to a lead next.

---

## 2. System Map

```mermaid
graph TD
    subgraph Data Sources
        A[n8n: Lead Ingestion<br/>(Bulk & Realtime)]
        B[Clay.com<br/>(Enrichment Data)]
        C[n8n: SMS Scheduler<br/>(Status Updates)]
    end

    subgraph Core Table
        D[Leads Table]
    end

    subgraph Downstream Consumers
        E[Airtable View: Clay Queue]
        F[Airtable View: SMS Pipeline]
        G[n8n: SMS Scheduler]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    F --> G
```

---

## 3. Field Dictionary & Business Logic

This section details every critical field, explaining its purpose, who sets its value, and how it impacts the workflow.

### **Group: Core Lead Information**
- **`Lead`**: A formula field that combines First and Last Name for easy identification.
- **`Email`**, **`Phone`**, **`First Name`**, **`Last Name`**, **`Company`**: The raw data for a lead, typically sourced from the ingestion workflows (Kajabi or bulk CSV).
- **`Source`**: Set by the ingestion workflow to indicate if the lead came from `Backlog` (CSV) or `Webhook` (Kajabi).

### **Group: Processing & State Management**
- **`Processing Status`**: **(CRITICAL)** This is the master state field.
    - `Backlog`: Set by ingestion if a lead is invalid (e.g., personal email) and should not be processed.
    - `Queued`: The default state for new, valid leads. This makes them eligible for enrichment.
    - `Ready for SMS`: Set by an Airtable Automation when enrichment is complete and the lead is SMS-eligible.
    - `In Sequence`: Set by the SMS Scheduler after the first SMS is sent. The lead remains in this state until the sequence is finished.
    - `Completed`: Set by the SMS Scheduler after the final (3rd) SMS is sent.
    - `Stopped`: Set if a lead replies "STOP" or books a meeting.
- **`Record ID`**: A formula field that provides the unique Airtable ID for the record, used in all workflow update steps.

### **Group: Enrichment & Scoring (Data from Clay & Airtable Formulas)**
- **`Job Title`**, **`Linkedin URL - Person`**, **`Location Country`**, **`Company Type`**, etc.: These fields are populated exclusively by the **Clay.com** enrichment process.
- **`Enrichment Timestamp`**: Set by a dedicated **Airtable Automation** that triggers when Clay populates fields like `Job Title`. This is the official timestamp marking the completion of enrichment.
- **`ICP Score`**: A formula field that calculates the lead's score (0-100) based on the component scores. It is the sum of the four component fields plus a bonus.
- **`Company Score Component`**, **`Role Score Component`**, etc.: These numeric fields are set by Clay and represent the score for each individual aspect of the ICP model.
- **`SMS Eligible`**: **(CRITICAL)** A formula-driven checkbox that acts as the final gate before a lead can be sent an SMS. The logic is:
    - Phone must be valid, AND
    - ICP Score must be >= 70, AND
    - Location must be United States, AND
    - Lead must not be in the "Archive" HRQ Status.

### **Group: Human Review Queue (HRQ)**
- **`HRQ Status`**: Controls whether a lead needs manual attention.
    - `Qualified`: The lead is valid and progressing automatically.
    - `Archive`: The lead is invalid (e.g., personal email) and has been permanently removed from the active funnel.
    - `Review`: Set by an Airtable Automation when enrichment fails. This places the lead in the `HRQ — Review` view for a human to make a decision.
    - `Manual Process`: A status that can be manually set by a team member to indicate they are handling the lead outside the automated system.
- **`HRQ Reason`**: A text field explaining *why* a lead was sent to the HRQ (e.g., "Enrichment failed", "Personal email").

### **Group: SMS Outreach Tracking**
- **`SMS Status`**: Tracks the status of the *last sent* SMS message (e.g., "Sent", "Delivered"). Set by the SMS Scheduler and Delivery Webhook workflows.
- **`SMS Campaign ID`**: The name of the campaign the lead is a part of. Set by the SMS Scheduler.
- **`SMS Sequence Position`**: The current step the lead is on in the sequence (0, 1, 2, or 3). Incremented by the SMS Scheduler.
- **`SMS Sent Count`**: A running total of messages sent to the lead. Incremented by the SMS Scheduler.
- **`SMS Last Sent At`**: A timestamp of when the last message was sent. Used by the scheduler to calculate delays.
- **`SMS Stop` & `SMS Stop Reason`**: A checkbox and text field set by the STOP and Calendly webhooks to permanently halt messaging to a lead.

---

## 4. Key Views & Their Purpose
- **`Clay Queue`**: Shows leads with `Processing Status = "Queued"`. This is the view that the Clay.com integration monitors to find new leads to enrich.
- **`SMS Pipeline`**: Shows leads with `Processing Status = "Ready for SMS"` or `"In Sequence"`. This is the view the n8n SMS Scheduler monitors to find leads who are due for a message.
- **`HRQ — Review`**: Shows leads with `HRQ Status = "Review"`. This is the primary inbox for the team to handle leads that failed enrichment or require a manual decision.

---

## 5. Maintenance & Troubleshooting
- **If leads are not being enriched**: Check the `Clay Queue` view. If the lead is not there, check its `Processing Status` and `HRQ Status` to see why it was filtered out.
- **If leads are not being sent SMS**: Check the `SMS Pipeline` view. If the lead is not there, check the `SMS Eligible` checkbox and the formula's conditions (`ICP Score`, `Location`, etc.) to see why it's not qualifying.
- **Never manually edit `Processing Status` or `SMS Sequence Position`**: These fields are tightly controlled by the automation. To re-queue a lead, it's safer to clear all SMS fields and set the `Processing Status` back to `Ready for SMS`.

