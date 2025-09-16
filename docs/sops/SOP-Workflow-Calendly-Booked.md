# SOP: n8n Workflow - UYSP-Calendly-Booked

## 1. Executive Summary

- **Purpose**: This workflow handles the critical business event of a lead booking a meeting via Calendly. Its primary function is to immediately stop any further automated SMS messages from being sent to that lead and to update their status to "Completed" in Airtable.
- **Trigger**: It is triggered by a webhook from Calendly, which fires the moment an invitee schedules an event.
    - Webhook subscription (active): scope=organization; events=[invitee.created, invitee.canceled]; callback `https://rebelhq.app.n8n.cloud/webhook/calendly`.
- **Key Actions**:
    - Parses the incoming Calendly data to extract the lead's email and phone (normalized digits).
    - Finds the corresponding lead in the Airtable `Leads` table by email OR phone.
    - Sets the `Booked` flag to `true`.
    - Sets the `SMS Stop` flag to `true` to halt any future messages.
    - Updates the lead's `Processing Status` to "Completed".

## 2. System Map

```mermaid
graph TD
    A[Calendly Event Booked] --> B(Webhook Node);
    B --> C(Parse Calendly);
    C --> D[Find Lead (Email or Phone)];
    D --> E[Mark Booked];
    E --> F(Respond 200);
```

## 3. Node-by-Node Breakdown

1.  **`Webhook (Calendly)`**
    - **Purpose**: Catches the real-time `invitee.created` event from Calendly.
    - **Details**: Listens for `POST` on `/webhook/calendly`. Subscription is managed via Calendly API (org‑scoped) and returns 200 after the last node.

2.  **`Parse Calendly`**
    - **Purpose**: Extract the lead's email, phone, and meeting time from the Calendly payload.
    - **Details**: Code node reads `payload.invitee.email` and phone from either `payload.invitee.phone_number` or from `payload.questions_and_answers` (question contains "phone"). Phone is normalized to digits (strip non‑digits; drop leading 1 for NANP 11‑digit inputs) to enable robust matching.

3.  **`Find Lead (Email or Phone)`**
    - **Purpose**: Locate the correct lead record in `Leads` using email OR normalized phone digits.
    - **Details**: Airtable Search using a case-insensitive email check OR a digits-only phone comparison.
      - Filter by formula used:
        ``
        ={{`OR(
          LOWER({Email})='${($json.email||'').toLowerCase()}',
          REGEX_REPLACE({Phone}, '\\D', '')='${$json.phoneDigits||''}'
        )`}}
        ``
      - Assumes `Phone` stores the lead’s phone. If using a different field, update the formula accordingly.

4.  **`Mark Booked`**
    - **Purpose**: Updates the lead's record in Airtable to reflect the successful booking.
    - **Details**: An Airtable "Update" node that performs several critical actions on the found lead record:
        - `Booked`: Sets the checkbox to `true`.
        - `Booked At`: Logs the timestamp of the meeting.
        - `SMS Stop`: Sets the checkbox to `true`. **This is the most critical step**, as it immediately removes the lead from any further consideration by the `SMS Scheduler` workflow.
        - `SMS Stop Reason`: Sets the reason to "BOOKED".
        - `Processing Status`: Sets the status to "Completed", signifying the successful end of this lead's journey through the automated funnel.

5.  **`Respond 200`**
    - **Purpose**: Sends an immediate "OK" (HTTP 200) response back to Calendly.
    - **Details**: A simple Code node that returns a success message. This is important to let Calendly know that the webhook was received and processed successfully, preventing Calendly from attempting to resend it.

## 4. Business Logic

- **Immediate Funnel Exit**: The core logic is to provide an immediate and automated exit from the SMS funnel the moment a lead takes the desired action (booking a meeting). This prevents the awkward and unprofessional situation of sending follow-up messages to a lead who has already converted.
- **Single Source of Truth**: By updating the lead's status directly in Airtable, it ensures that all other parts of the system (like the `SMS Scheduler`) have an up-to-date and accurate view of the lead's status without needing complex cross-workflow communication.

### Matching Rules (Email OR Phone)
- Email match is case‑insensitive exact match against `Leads.Email`.
- Phone match compares digits only; Calendly phone is normalized to digits and matched to `REGEX_REPLACE({Phone}, '\\D', '')`.
- Either condition matching is sufficient to update the record.

## 5. Maintenance & Troubleshooting

- **Symptom**: Leads are booking meetings, but still receiving SMS messages.
    - **Likely Causes**:
        - Webhook not firing (no recent executions in n8n)
        - Email and phone both missing or not captured from Calendly
        - Phone field in Airtable differs from `{Phone}` used in the formula
    - **Solution**:
        1.  Check n8n Executions. If none, re‑save the Calendly webhook (Invitee Created) to: `/webhook/calendly`.
        2.  Confirm Calendly form includes a Phone Number question; verify payload shows `invitee.phone_number` or `questions_and_answers` with phone.
        3.  If your phone is stored in another field, update the Airtable formula reference from `{Phone}` to that field.
        4.  Ensure Airtable credentials are valid and `Mark Booked` can update records.

## 6. Related SOPs & System Documents

- **SOPs**: `SOP-Airtable-Leads-Table.md`, `SOP-Workflow-SMS-Scheduler.md`
- **Architecture**: `docs/architecture/AIRTABLE-SCHEMA.md`

