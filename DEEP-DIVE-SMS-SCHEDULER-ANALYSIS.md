# Forensic Analysis: UYSP-SMS-Scheduler-v2

This document provides a comprehensive, systematic, and forensic analysis of the `UYSP-SMS-Scheduler-v2` workflow. The analysis traces all business logic from its implementation in the workflow back to its source data, formulas, and configurations in Airtable, and forward to its impact on the system state.

---
## Introduction: Workflow Purpose

The `UYSP-SMS-Scheduler-v2` workflow is the primary engine for SMS outreach. It is a stateful, scheduled process that performs the following core functions:
1.  **Selects** a batch of eligible leads based on a complex set of criteria stored in Airtable.
2.  **Enforces** a multi-layered set of safety and compliance rules (time windows, batch sizes, frequency caps).
3.  **Determines** the correct message content for each lead based on their position in a sequence and an A/B testing framework.
4.  **Executes** the SMS send via the SimpleTexting API.
5.  **Mutates** the lead's state in Airtable to reflect the outcome of the send attempt.
6.  **Logs** a detailed audit trail for every send attempt.

---
## Part 1: Lead Selection & Targeting (The "List Due Leads" Node)

The entire process begins with a single Airtable query that acts as the master gatekeeper.

### 1.1 The Airtable Filter Formula

The workflow queries the `Leads` table with the following formula:
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

### 1.2 Forensic Breakdown of the Filter Conditions

Each condition in this formula represents a critical, non-negotiable business rule:

| Condition | Business Rule | Source of Truth | Forward Impact |
| :--- | :--- | :--- | :--- |
| **`{Phone Valid}` = true** | The lead must have a phone number that has been successfully validated. | A boolean flag set during an earlier (currently inactive) data enrichment/validation workflow. | Prevents wasting money sending SMS to invalid numbers. |
| **`NOT({SMS Stop})`** | The lead must NOT have opted out of SMS communication. | A boolean flag set to `true` by the `UYSP-SMS-Inbound-STOP` workflow when a lead replies `STOP`. | **CRITICAL COMPLIANCE**: This is the primary mechanism that honors opt-out requests. |
| **`NOT({Booked})`** | The lead must NOT have already booked a meeting. | A boolean flag set to `true` by the `UYSP-Calendly-Booked` workflow. | Prevents sending follow-up messages to a lead who has already converted, which would be unprofessional. |
| **`LEN({Phone})>0`** | A basic sanity check that the phone number field is not empty. | The `Phone` field in the `Leads` table. | Prevents errors in downstream nodes that require a phone number. |
| **`{SMS Eligible}` = true** | The lead must pass a secondary, more complex set of eligibility criteria. | **This is a formula field.** Its logic is managed entirely within Airtable. (See section 1.3 for a deep dive). | This is a major dependency. Changes to this formula can silently alter the entire target audience. |
| **`NOT({Current Coaching Client})`** | The lead must not be an existing coaching client. | A boolean flag likely set manually or through a separate data import process. | Prevents sending marketing messages to active clients. |
| **`OR(...)` Clause** | The lead's status must be valid for outreach. | The `Processing Status` field in the `Leads` table. | This logic allows the scheduler to pick up both brand new leads (`Ready for SMS`) and leads already part of a sequence (`In Sequence`). |
| **`{SMS Batch Control}='Active'`** | The global SMS sending toggle must be active for new leads to be processed. | The `SMS Batch Control` field in the `Leads` table. This is unusual; it should likely be in the `Settings` table. | Acts as a secondary safety switch, specifically for injecting new leads into the funnel. |

### 1.3 Deep Dive: The `{SMS Eligible}` Formula Field

This formula is a critical dependency, as its logic is "hidden" in Airtable but controls the entire workflow.
**Formula Definition:**
```
AND(
  {Phone Valid},
  OR(LOWER({Location Country}) = "united states", LOWER({Location Country}) = "canada"),
  {HRQ Status} != "Archive",
  NOT({Current Coaching Client}),
  NOT({SMS Stop}),
  NOT({Booked})
)
```
**Forensic Breakdown of `{SMS Eligible}`:**
- **`{Phone Valid}`**: Redundant check, already in the main filter.
- **`OR(LOWER({Location Country}) = "united states", ...)`**: **GEOGRAPHIC COMPLIANCE**. Enforces the rule that SMS messages are only sent to leads in the US and Canada.
- **`{HRQ Status} != "Archive"`**: The lead must not have been manually archived by the Human Review Queue. This is a manual override to stop processing a lead.
- **`NOT({Current Coaching Client})`**: Redundant check.
- **`NOT({SMS Stop})`**: Redundant check.
- **`NOT({Booked})`**: Redundant check.

**Conclusion**: The `{SMS Eligible}` formula is a **compliance and data quality gate**. Its dependencies on `Location Country` and `HRQ Status` are critical business rules that are not immediately visible from the n8n workflow alone.

---
*Analysis of the Core Logic (`Prepare Text (A/B)` node) will follow.*

---
## Part 2: Core Processing & Business Logic (The "Prepare Text (A/B)" Node)

This single Code node is the brain of the scheduler. It takes the list of theoretically eligible leads from the previous node and applies a series of critical, time-sensitive business rules to build the final batch of messages to be sent *in that specific run*.

### 2.1 Safety & Compliance Gates (Applied to the Entire Batch)

These rules are checked once at the beginning of the node's execution. If any of these rules fail, the entire batch is aborted, and **no messages are sent**.

| Rule | Implementation | Source of Truth | Forward Impact |
| :--- | :--- | :--- | :--- |
| **Time Window Enforcement** | `const currentHour = new Date().toLocaleString("en-US", {timeZone: "America/New_York"}).getHours(); if (currentHour < 9 || currentHour >= 17) { return []; }` | The code is hardcoded to the `America/New_York` timezone. | **CRITICAL COMPLIANCE**: Prevents sending messages outside of legal business hours (9 AM - 5 PM Eastern), reducing legal risk and negative customer experience. |
| **Batch Size Limit** | `const limitedLeads = leads.slice(0, 25);` | The batch size `25` is hardcoded directly in the script. | **RATE LIMITING**: Prevents sending a large burst of messages at once, which can trigger carrier spam filters and ensures a controlled flow of leads into the sequence. |

### 2.2 Per-Lead Logic (Applied Iteratively to Each Lead in the Batch)

After the global safety checks pass, the node iterates through each of the (up to) 25 leads and applies another set of rules to determine if that specific lead should receive a message *now*.

| Rule | Implementation | Source of Truth | Forward Impact |
| :--- | :--- | :--- | :--- |
| **24-Hour Resend Lock** | `if (msSinceLastSend < 24 * 60 * 60 * 1000) { continue; }` | The `SMS Last Sent At` field in the `Leads` table. | **CRITICAL COMPLIANCE & ANTI-SPAM**: This is the most important frequency cap, preventing any lead from receiving more than one message in any 24-hour period. |
| **Sequence Progression** | The code checks if the time since `SMS Last Sent At` is greater than the required delay for the next `Step` in the sequence. | The `SMS Sequence Position` and `SMS Last Sent At` fields in the `Leads` table, and the `Delay Days` / `Fast Delay Minutes` fields in the `SMS_Templates` table (controlled by the `Fast Mode` boolean in the `Settings` table). | This logic orchestrates the entire multi-day SMS campaign, ensuring messages are spaced out correctly to feel like a natural follow-up sequence. |
| **A/B Variant Assignment** | `pickVariant(rec['SMS Variant'])` function uses `Math.random()*100 < aPct` if no variant is set. | The `SMS Variant` field in `Leads` (if it exists) or the `ab_ratio_a` field from the `Settings` table. | Controls the A/B testing framework. An incorrect ratio in the `Settings` table can skew test results. |
| **Template Selection** | `tmplFor(variant, nextStep)` function finds a record in the `SMS_Templates` table. | `SMS_Templates` table. | The system is entirely dependent on this table having a valid `Body` for every combination of `Variant` and `Step`. If a template is missing, the lead is silently skipped for that run. |

### 2.3 Conclusion: A Multi-Layered Gatekeeping System

The scheduler's logic is a funnel. Of the hundreds of leads in the database, only a fraction will be selected by the initial Airtable query. Of those, the entire batch might be stopped by the time window. And of that batch, only a handful of leads will actually pass the individual timing and sequence checks to receive a message. This demonstrates a robust, defense-in-depth approach to automated outreach.

---
*Analysis of the State Mutation & Auditing will follow.*

---
## Part 3: State Mutation & Auditing (Post-Send Actions)

After a message is successfully sent by the `SimpleTexting HTTP` node, the workflow's final critical responsibility is to update the Airtable base to reflect this action. This prevents the same message from being sent again and ensures a clear audit trail.

### 3.1 State Mutation (The "Airtable Update" Node)

This node is the "forward impact" of a successful send. It modifies the lead's record in the `Leads` table to change their state within the system.

| Field Updated | New Value Logic | Business Rule | Downstream Impact |
| :--- | :--- | :--- | :--- |
| **`SMS Status`** | Sets to "Sent". | Provides an immediate, though temporary, status indicating the message has been handed off to the carrier. | This status will be overwritten by the `UYSP-ST-Delivery V2` workflow, which provides the final "Delivered" or "Undelivered" status from the carrier. |
| **`SMS Sequence Position`** | Increments the previous position by 1 (`next_pos = prev_pos + 1`). | **SEQUENCE PROGRESSION**: This is the core mechanism that moves a lead to the next step in the funnel. | On the next run of the scheduler, the lead will be evaluated for the next step's template and delay, rather than the one just sent. |
| **`SMS Sent Count`** | Increments the previous count by 1 (`next_count = prev_count + 1`). | Tracks the total number of messages sent to this lead. | Provides a simple metric for analyzing outreach intensity and can be used in the future for global frequency capping (e.g., "stop after 5 messages"). |
| **`SMS Variant`** | Sets the A/B variant (`A` or `B`) that was used for this send. | **PERSISTENCE**: This ensures that once a lead is assigned to a variant, they stay in that track for the entire sequence, which is essential for valid A/B testing. | All future messages in the sequence will use templates from this same variant. |
| **`SMS Last Sent At`** | Sets to the current timestamp (`$now`). | Records the precise time of the send attempt. | **CRITICAL DEPENDENCY**: This timestamp is the basis for *all* future timing calculations, including the 24-hour resend lock and the multi-day sequence delays. |
| **`Processing Status`** | Sets to `In Sequence` or `Complete` (if `next_pos >= 3`). | Manages the lead's overall journey in the pipeline. | Setting the status to `Complete` gracefully exits the lead from the scheduler's primary query, preventing them from being processed further. |
| **`Error Log`** | Records the error message from the API if the send fails. | Provides a direct, lead-specific record of any technical failures. | Allows for easy debugging of specific lead issues without needing to check n8n execution logs. |

### 3.2 Auditing (The "Audit Sent" Node)

This node creates an immutable record of the send attempt in a separate table, providing a compliance and debugging log that is independent of the lead's current state.

- **Rule**: Every single message sent by the scheduler must have a corresponding, detailed entry in the `SMS_Audit` table.
- **Implementation**: The `Audit Sent` node performs an Airtable "Create Record" operation into the `SMS_Audit` table (`tbl5TOGNGdWXTjhzP`).
- **Data Logged**:
  - `Event`: Hardcoded to "Send Attempt".
  - `Campaign ID`, `Phone`, `Status`, `Text`: All the details of the message that was sent.
  - `Lead Record ID`: A direct link back to the lead who was contacted.
  - `Sent At`: A timestamp for the event.
- **Forward Impact**: This table is the definitive historical record. It can be used to prove that a message was or was not sent, to debug why a lead has a certain status, and to analyze the performance of different campaigns or message templates over time. It is the source of truth for all historical reporting.

---
## Final Conclusion

The `UYSP-SMS-Scheduler-v2` workflow is a highly sophisticated and rule-intensive process that functions as the heart of the UYSP outreach system. Its primary dependencies are not on other workflows, but on the intricate schema and data integrity of three key Airtable tables: `Leads` (for state), `Settings` (for global configuration), and `SMS_Templates` (for content). Its internal logic provides a robust series of checks and balances, but its heavy reliance on hardcoded values (batch size, time window) and Airtable formulas (`SMS Eligible`) makes it critical to have comprehensive documentation and rigorous testing for any proposed changes.

---
## Part 4: API Resilience and Failure Mode Analysis

The scheduler's reliability is critically dependent on the availability and performance of two external APIs: Switchy.io and SimpleTexting. This section analyzes how the workflow is configured to handle potential failures from these services.

### 4.1. API Call Configuration

Both the `Create Short Link (Switchy)` and `SimpleTexting HTTP` nodes are configured with the following option:
```json
"options": {
  "response": {
    "response": {
      "neverError": true
    }
  }
}
```
- **Analysis**: The `neverError: true` setting is a crucial piece of the error handling strategy. It tells the n8n engine **not to halt the entire workflow execution if an API call fails** (e.g., returns a 4xx or 5xx status code). Instead, the error is passed down as a regular JSON output to the next node in the sequence. This prevents a single failed API call from stopping the entire batch.

### 4.2. Failure Scenario: Switchy.io API is Down
1.  **Trigger**: The `Create Short Link (Switchy)` node attempts to create a link but the API is unavailable or returns an error.
2.  **Immediate Impact**: Because of `neverError: true`, the workflow does not stop. The node outputs an error message instead of a link object.
3.  **Downstream Logic**: The `Save Short Link` node receives this error. The `Short Link URL` it tries to save will be invalid (e.g., `https://hi.switchy.io/undefined`).
4.  **Final Impact on SMS**: The `SimpleTexting HTTP` node has a `.replace()` function to insert the link. Since the link from the failed `Save Short Link` node is invalid, the replacement fails, and the **default fallback URL (`https://hi.switchy.io/UYSP`) is used in the message instead**.
5.  **Conclusion**: The workflow is **resilient** to a Switchy.io failure. The SMS will still be sent, but it will contain a generic link rather than a unique, trackable one. This is a graceful degradation of service.

### 4.3. Failure Scenario: SimpleTexting API is Down
1.  **Trigger**: The `SimpleTexting HTTP` node attempts to send an SMS but the API is unavailable or returns an error.
2.  **Immediate Impact**: `neverError: true` prevents the workflow from halting. The node outputs the error message from the API.
3.  **Downstream Logic**: The `Parse SMS Response` node is explicitly designed to handle this. It checks if a valid response ID exists (`sent = Boolean(httpId)`). If not, it sets `sms_status` to "Failed" and captures the `error_reason`.
4.  **Final Impact on Airtable**: The final `Airtable Update` node receives this "Failed" status.
    - It updates the lead's `SMS Status` to "Failed".
    - Crucially, it **does not** increment the `SMS Sequence Position` or `SMS Sent Count`.
    - It logs the specific API error message in the lead's `Error Log` field.
5.  **Conclusion**: The workflow is **highly resilient** to a SimpleTexting failure. It not only prevents the failure from stopping the batch, but it also correctly updates the lead's state to reflect the failure and ensures that the system will automatically **retry sending to that same lead on the next run** because their sequence position has not advanced. This is a robust and well-designed error handling loop.

---
## Part 5: Upstream Data Dependencies (The Data Supply Chain)

The forensic analysis confirms that the SMS Scheduler is the final step in a longer data processing pipeline. Its reliability is critically dependent on the successful execution of at least two upstream workflows that prepare the data in the `Leads` table.

### 5.1. The Ingestion Workflow: `UYSP Backlog Ingestion`

- **Purpose**: This workflow is responsible for the initial import of leads from an external Google Sheet into the Airtable `Leads` table.
- **Evidence**: Analysis of the workflow's `Normalize` and `Airtable Upsert Leads` nodes.
- **Key Fields Written that Impact the Scheduler**:
  - `Phone`: Provides the raw phone number.
  - `HRQ Status` & `HRQ Reason`: Performs initial data validation. If a phone or email is invalid on import, it sets the status to "Archive," immediately making the lead ineligible for the scheduler.
  - `Current Coaching Client`: Sets the flag that prevents messaging active clients.
- **Dependency Conclusion**: The scheduler will not process any lead that has not first been successfully processed by this ingestion workflow.

### 5.2. The "Missing" Enrichment Workflow

- **Analysis Gap**: The ingestion workflow populates the raw data, but it does **not** populate two of the fields that are critical for the scheduler's `{SMS Eligible}` formula:
  1.  `Phone Valid`
  2.  `Location Country`
- **Conclusion**: There is a **critical, undiscovered workflow** that must run after `UYSP Backlog Ingestion` and before `UYSP-SMS-Scheduler-v2`.
- **Hypothesis**: This missing workflow is likely an "enrichment" process. It probably takes the raw phone number, uses a third-party service (like Twilio Lookup, which was mentioned in the old schema file) to validate it and get the country code, and then sets the `Phone Valid` and `Location Country` fields. Without this workflow, no lead would ever pass the `{SMS Eligible}` check, and the scheduler would never send any messages. **Finding and analyzing this workflow is the next critical step to fully understanding the end-to-end system.**
