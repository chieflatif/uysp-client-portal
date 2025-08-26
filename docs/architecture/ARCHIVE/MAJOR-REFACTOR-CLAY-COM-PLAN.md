# 🚀 UYSP Lead Qualification: Master Architecture & Development Plan (Option C)

**Document Version**: 2.0 (Reconstructed)
**Date**: 2025-08-26
**Status**: Authoritative

---

## 1. Executive Summary

This document is the definitive master plan for the UYSP Lead Qualification workflow. It is the result of a comprehensive recovery and synthesis effort following a significant documentation loss event. The architecture detailed herein, "Option C," was chosen for its robustness, simplicity, and clear separation of concerns.

The system is designed to process a large backlog of leads and handle real-time ingestion, automating the qualification, enrichment, and initial outreach processes to significantly increase meeting booking rates at a low cost.

**Core Architectural Principles:**
- **n8n is Minimal**: n8n's only roles are simple data ingestion to Airtable and triggering external systems (like SMS campaigns). It contains NO complex business logic, enrichment, or scoring.
- **Airtable is the Hub**: Airtable is the central source of truth for all lead data and processing status. It acts as a resilient queue and state machine between systems.
- **Clay is the Engine**: All complex data enrichment, validation, and scoring logic lives exclusively within Clay.com.
- **SimpleTexting is the Messenger**: All SMS sequence and campaign logic is managed natively within SimpleTexting. n8n's role is simply to initiate the campaign for a specific, qualified lead.

---

## 2. System Architecture Overview

```mermaid
graph TD
    subgraph "Data Sources"
        A[Lead Backlog CSV] 
        B[Real-time Webhooks (Kajabi)]
    end
    
    subgraph "n8n (Minimalist Processor)"
        C[Backlog Ingestion Workflow<br/>ID: qMXmmw4NUCh1qu8r]
        D[Real-time Ingestion Workflow<br/>ID: 2cdgp1qr9tXlONVL]
        E[SMS Trigger Workflow<br/>ID: D10qtcjjf2Vmmp5j]
        F[Health Monitoring Workflow<br/>ID: wNvsJojWTr0U2ypz]
    end
    
    subgraph "Airtable (Central Hub & State Machine)"
        G[Leads Table<br/>Status management & observability<br/>ID: tblYUvhGADerbD8EO]
        H[Companies Table<br/>Deduplicated company data]
        I[Views<br/>New, Processing, SMS Pipeline, HRQ]
    end
    
    subgraph "Clay.com (Enrichment & Logic Engine)"
        J[Company Enrichment<br/>One-time per domain via Apollo]
        K[Person Enrichment & ICP v4 Scoring]
    end
    
    subgraph "SimpleTexting (Outreach Platform)"
        L[SMS Drip Campaigns]
    end
    
    subgraph "Monitoring & Alerts"
        M[Slack Notifications<br/>Health alerts & sales reports]
    end
    
    A --> C
    B --> D
    C --> G
    D --> G
    
    I -- "Triggers" --> J
    J -- "Writes to" --> H
    I -- "Triggers" --> K
    K -- "Writes to" --> G

    I -- "Triggers" --> E
    E --> L

    F --> M
```

---

## 3. Component Breakdown & Implementation Details

### 3.1. n8n Workflows

The n8n instance contains four simple, specialized workflows. The guiding principle is that no single workflow should contain complex, branching logic.

#### a) Real-time Ingestion (`2cdgp1qr9tXlONVL`)
- **Status**: **ACTIVE & VERIFIED**
- **Trigger**: Webhook node listening at `/webhook/leads-intake`.
- **Flow**: `Webhook` -> `Normalize (Code)` -> `Airtable Upsert`.
- **Logic**: The `Normalize` node performs basic field mapping from incoming JSON to the Airtable schema. The `Airtable Upsert` node writes the record to the `Leads` table, matching on `Email`, and sets the initial `Processing Status` to "Queued".

#### b) Backlog Ingestion (`qMXmmw4NUCh1qu8r`)
- **Status**: **READY & VERIFIED**
- **Trigger**: Manual Trigger.
- **Flow**: `Manual Trigger` -> `Fetch CSV (HTTP)` -> `Parse CSV (Code)` -> `Normalize` -> `Airtable Upsert`.
- **Logic**: Designed to process a large CSV of leads. It fetches the CSV from a provided URL, parses it, and then uses the same `Normalize` and `Airtable Upsert` logic as the real-time workflow.

#### c) SMS Trigger (`D10qtcjjf2Vmmp5j`)
- **Status**: **CONFIGURED, AWAITING ACTIVATION**
- **Trigger**: Airtable Trigger node (currently disabled) watching the `SMS Pipeline` view in the `Leads` table.
- **Flow**: `Airtable Trigger` -> `Delay` -> `Airtable Get Record` -> `SimpleTexting HTTP` -> `Parse Response` -> `Airtable Update`.
- **Logic**: When a lead enters the `SMS Pipeline` view, this workflow triggers. It performs a quick check to prevent race conditions, then makes an API call to SimpleTexting to initiate a campaign. It then parses the response and updates the lead's status in Airtable. A temporary Slack notification path exists for testing purposes.
- **Critical Note**: This workflow requires **Bearer Token** authentication for the SimpleTexting API.

#### d) Health Monitor (`wNvsJojWTr0U2ypz`)
- **Status**: **CONFIGURED, AWAITING ACTIVATION**
- **Trigger**: Cron node, scheduled for every 15 minutes and once daily.
- **Flow**: `Cron` -> `Airtable Search` -> `Check Thresholds (Code)` -> `Slack Alert`.
- **Logic**: Periodically queries Airtable for leads stuck in a "Processing" state. If thresholds are exceeded, it sends an alert to Slack. It also generates a daily summary report.

### 3.2. Airtable Base (`app6cU9HecxLpgT0P`)

Airtable is the core of the system, acting as the database, state machine, and primary user interface for monitoring.

- **`Leads` Table (`tblYUvhGADerbD8EO`):** The central table where all lead data is stored and tracked. The `Processing Status` field is the key to the entire asynchronous workflow.
- **`Companies` Table:** Stores uniquely enriched company data. This table is populated by a one-time Clay process to avoid redundant API calls.
- **Key Views:**
    - `SMS Pipeline`: A view filtered for leads that are eligible for SMS outreach (`SMS Eligible` is true and `SMS Status` is "Not Sent"). This view triggers the `SMS Trigger` workflow.
    - `Human Review Queue (HRQ)`: A view for leads that require manual attention. The "Reason for Review" should be displayed prominently.
- **Trigger Field (`Last Updated Auto`):** A critical "Last modified time" field that watches the `SMS Eligible` and `SMS Status` fields. This is the field the n8n Airtable Trigger polls for changes.

### 3.3. Clay.com Integration

Clay is responsible for all "heavy lifting" in the process.

- **Company Enrichment (Bulk Process):** A one-time, manually initiated process.
    1.  **Source:** All leads from the Airtable `Leads` table.
    2.  **Filter:** Remove leads with personal email domains (gmail.com, etc.).
    3.  **Normalize & Deduplicate:** Extract the company domain from the email and create a unique list of domains.
    4.  **Enrich:** Use Apollo to enrich each unique domain, retrieving company name, industry, description, etc.
    5.  **Write Back:** Populate the Airtable `Companies` table with the enriched data.
- **Lead Enrichment & Scoring (Ongoing Process):**
    1.  **Trigger:** Monitors the `Leads` table for new records with `Processing Status` = "Queued".
    2.  **Logic:** For each new lead, Clay joins the company data from the `Companies` table, performs person-level enrichment (if necessary), and calculates the ICP v4.0 score.
    3.  **Write Back:** Updates the lead record in Airtable with the score, component scores, and sets the `Processing Status` based on the routing logic below.

#### HRQ Routing Logic
A lead must be routed to the Human Review Queue (by setting the `HRQ Status` field in Airtable) for the following reasons:
- **`Low Score`**: The lead's ICP score is below the qualification threshold (e.g., < 70).
- **`High-Value, Non-US`**: The lead's score is >= 70, but their phone number is not US-based.
- **`Enrichment Failed`**: Clay was unable to enrich the lead with the minimum data required for scoring.
- **`Location Flag`**: The lead's location is identified as Tier D with high confidence, requiring manual review.

### 3.4. SimpleTexting Integration
- **Campaign Logic:** All SMS message content, drip sequences, and timing are managed within the SimpleTexting platform. The following requirements must be configured in SimpleTexting:
    - **Three-Message Sequence:** A standard drip campaign should consist of three messages with appropriate delays.
    - **Business Hours Compliance:** Messages must only be sent during standard business hours (e.g., Monday-Friday, 9 AM - 5 PM EST).
    - **Stop on Reply/Booking:** All sequences for a lead must be automatically stopped if the lead replies to an SMS or books a meeting.
- **Triggering:** n8n's role is solely to make a single API call to SimpleTexting for a specific lead, telling it to start the pre-defined campaign.

---

## 4. Monitoring & Reporting

To ensure system health and track business performance, the following KPIs should be monitored, primarily through Airtable views and dashboards.

- **Ingestion & Processing Metrics:**
    - **Leads Processed per Day:** A count of leads that have moved out of the "Queued" status.
    - **Qualification Rate:** The percentage of processed leads with an ICP score >= 70.
    - **Enrichment Success Rate:** The percentage of leads that are successfully enriched by Clay.
- **Outreach & Conversion Metrics:**
    - **SMS Delivery Rate:** The percentage of initiated SMS campaigns that are successfully delivered.
    - **SMS Click Rate:** The percentage of delivered SMS messages that receive a click on the tracking link.
    - **SMS-to-Meeting Conversion Rate:** The percentage of leads who enter an SMS campaign and ultimately book a meeting.
- **Operational Health Metrics:**
    - **HRQ Volume:** The total number of leads currently in the Human Review Queue, grouped by reason.
    - **Error Rate:** The percentage of leads that end in a "Failed" status.
    - **Cost Per Meeting:** Total operational cost divided by the number of meetings booked.

---

## 5. Forward Implementation Roadmap

With the core infrastructure rebuilt and validated, the following steps will bring the system to full operational capacity.

1.  **Finalize SimpleTexting Integration:**
    - [ ] Securely add the SimpleTexting API Key to the n8n `SimpleTexting HTTP` node using **Bearer Token authentication**.
    - [ ] Re-enable the `Parse SMS Response` and `Airtable Update` nodes in the `UYSP-SMS-Trigger` workflow.
    - [ ] Conduct a full, end-to-end test with a single lead to verify that an SMS is sent and the lead's status is correctly updated in Airtable.
2.  **Activate Automated Workflows:**
    - [ ] Enable the Airtable Trigger in the `UYSP-SMS-Trigger` workflow.
    - [ ] Activate the `UYSP-Health-Monitor` workflow to begin periodic checks and daily reports.
3.  **Execute Bulk Company Enrichment:**
    - [ ] User to perform the one-time company enrichment process in Clay as outlined in the `CLAY-RUNBOOK-NONTECH.md`.
4.  **Process Lead Backlog:**
    - [ ] Once company enrichment is complete, begin processing the 10,000-lead backlog using the `UYSP Backlog Ingestion` workflow.
5.  **Establish Backup Procedures:**
    - [ ] Implement a regular, automated backup process for the n8n workflows. [[memory:7243075]] In this project, the workflow backup process should download JSON via the API rather than rewriting JSON files manually.
    - [ ] Document the procedure for restoring workflows and the Airtable base from backups.

---

## 5. Critical Platform Gotchas & Lessons Learned

- **Airtable Scripting:** Creating tables and fields via the scripting extension is highly sensitive to the API schema. Date, currency, and checkbox fields have specific, required options that can cause scripts to fail if omitted. The safest approach is to create fields with minimal types (e.g., text, number) and then convert them in the UI.
- **n8n Workflow Creation:** When creating workflows via API or tools, they may default to the user's personal workspace. Ensure the correct workspace/project is targeted.
- **SimpleTexting API:** The API requires `Bearer Token` authentication, not a custom `X-Authorization` header.
- **Airtable Triggers:** The Airtable Trigger node in n8n is most reliable when polling a "Last modified time" field.
