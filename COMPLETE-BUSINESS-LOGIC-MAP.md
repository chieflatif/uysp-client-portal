# UYSP Complete Business Logic Map (Corrected)

This document maps the business logic and rules within the UYSP system, based on direct analysis of n8n workflows and the live Airtable base.

---

## Section 1: Core Business Process Mapping

### A. SMS Sequence Management

#### Message Progression & A/B Testing
- **Rule**: Leads progress through a multi-step SMS sequence (up to 3 steps). The message content for each step is determined by an A/B test variant (`A` or `B`) assigned to the lead.
- **Evidence**: `UYSP-SMS-Scheduler-v2` (`Prepare Text (A/B)` node) selects a template from the `SMS_Templates` table where the `Step` and `Variant` match the lead's `SMS Sequence Position` and `SMS Variant`. If no variant is assigned, one is chosen based on the `ab_ratio_a` in the `Settings` table.

#### Delay Calculation
- **Rule**: There is a mandatory delay between messages. In normal mode, this is controlled by `Delay Days` in the `SMS_Templates` table. In `Fast Mode` (a global setting), a shorter `Fast Delay Minutes` is used for testing.
- **Evidence**: `UYSP-SMS-Scheduler-v2` (`Prepare Text (A/B)` node) calculates the required delay and compares it to the time elapsed since `SMS Last Sent At`.

#### Duplicate Prevention & Rate Limiting
- **Rule**: A lead cannot be sent an SMS if they have already received one within the last 24 hours, regardless of sequence position.
- **Evidence**: `UYSP-SMS-Scheduler-v2` (`Prepare Text (A/B)` node) explicitly checks if `now - SMS Last Sent At < 24 hours` and aborts if true.

#### Compliance: Stop/Unsubscribe Handling
- **Rule**: Leads who reply with keywords like `STOP` are immediately opted out of all further messaging.
- **Evidence**: `UYSP-SMS-Inbound-STOP` workflow sets the `SMS Stop` flag to `true` in the `Leads` table. The `UYSP-SMS-Scheduler-v2` workflow's primary query (`List Due Leads`) explicitly excludes leads where `SMS Stop` is true.

#### Compliance: Business Hours Enforcement
- **Rule**: SMS messages can only be sent between 9 AM and 5 PM Eastern Time on weekdays.
- **Evidence**: `UYSP-SMS-Scheduler-v2` (`Prepare Text (A/B)` node) contains a hardcoded check of the current hour in the `America/New_York` timezone and will abort the entire batch if outside this window.

### B. Lead Qualification & Pipeline Management

#### Initial Lead Targeting
- **Rule**: To be eligible for an SMS, a lead must meet a combination of criteria, including having a valid phone, not having opted out, not being a current client, and having the correct processing status.
- **Evidence**: The Airtable filter formula in the `List Due Leads` node of `UYSP-SMS-Scheduler-v2` combines multiple fields (`Phone Valid`, `SMS Stop`, `Booked`, `Current Coaching Client`, `Processing Status`, `SMS Eligible`) to create the master list of eligible leads.

#### Status Progression
- **Rule**: A lead's `Processing Status` is updated as they move through the funnel.
- **Evidence**:
  - `Ready for SMS` / `In Sequence` -> `In Sequence` / `Complete`: `UYSP-SMS-Scheduler-v2` updates the status upon successful sending.
  - `-> Stopped`: `UYSP-SMS-Inbound-STOP` updates the status upon receiving a `STOP` command.
  - `-> Completed`: `UYSP-Calendly-Booked` updates the status when a meeting is booked.

### C. Data Flow & Auditing

#### SMS Delivery Tracking
- **Rule**: The final delivery status ("Delivered" or "Undelivered") of every SMS is tracked.
- **Evidence**: `UYSP-ST-Delivery V2` receives a webhook from SimpleTexting and updates the `SMS Status` field in the `Leads` table.

#### Comprehensive Audit Trail
- **Rule**: Every attempted SMS send and every received delivery receipt must be logged.
- **Evidence**:
  - `UYSP-SMS-Scheduler-v2` writes a "Send Attempt" record to the `SMS_Audit` table after every send.
  - `UYSP-ST-Delivery V2` writes a "Delivery" record to the `SMS_Audit` table upon receiving a receipt.
