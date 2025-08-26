# Verified System State & Configuration

**Document Version**: 1.0 (Reconstructed)
**Date**: 2025-08-26
**Status**: Authoritative Reference

---

## 1. Overview

This document provides a verified snapshot of the live, operational components of the UYSP Lead Qualification system. It is based on direct inspection of the production environment and the analysis of recovered development transcripts. This serves as a practical reference to complement the Master Architecture plan.

## 2. n8n Workflows

The system utilizes four distinct, minimal workflows, each with a specific purpose.

| Workflow Name | ID | Status | Trigger | Description |
| :--- | :--- | :--- | :--- | :--- |
| **UYSP-Realtime-Ingestion** | `2cdgp1qr9tXlONVL` | ✅ **Active** | Webhook | Handles new leads from sources like Kajabi in real-time. |
| **UYSP Backlog Ingestion** | `qMXmmw4NUCh1qu8r` | ✅ **Ready** | Manual | Processes bulk leads from a CSV file. |
| **UYSP-SMS-Trigger** | `D10qtcjjf2Vmmp5j` | 🟡 **Configured** | Airtable Trigger | Initiates SMS campaigns for qualified leads. (Trigger disabled pending final checks). |
| **UYSP-Health-Monitor** | `wNvsJojWTr0U2ypz` | 🟡 **Configured** | Cron (Schedule) | Performs periodic health checks and sends daily reports. (Inactive pending final checks). |

### Key Workflow Details:
- **Realtime Ingestion:** A 3-node flow (`Webhook` -> `Normalize` -> `Airtable Upsert`). It's stable and has been successfully tested.
- **Backlog Ingestion:** A 5-node flow (`Manual Trigger` -> `Fetch CSV` -> `Parse CSV` -> `Normalize` -> `Airtable Upsert`). It's been tested and is ready for use.
- **SMS Trigger:** The core logic is in place to call the SimpleTexting API. The Airtable Trigger mechanism is configured but currently disabled.
- **Health Monitor:** All nodes for system checks and Slack reporting are configured. The workflow is ready to be activated.

---

## 3. Airtable Base

- **Base ID**: `app6cU9HecxLpgT0P`
- **Base Name**: "UYSP Lead Qualification (Option C)"

### Tables & Views:
- **`Leads` Table (`tblYUvhGADerbD8EO`):** This is the central hub for all lead data. Its `Processing Status` field orchestrates the entire asynchronous workflow. The schema is comprehensive, including fields for scoring, SMS tracking, and observability.
- **`Companies` Table:** This table is designed to hold uniquely enriched company data to prevent redundant API calls.
- **`SMS Pipeline` View:** This is a critical view in the `Leads` table. It is filtered to show only leads where `SMS Eligible` is true and `SMS Status` is "Not Sent". This view acts as the trigger for the `UYSP-SMS-Trigger` n8n workflow.

---

## 4. Integrations

### SimpleTexting
- **Status**: ✅ **Confirmed Working**
- **Authentication**: The integration requires **Bearer Token** authentication.
- **Functionality**: End-to-end SMS delivery has been confirmed. All campaign logic (drip sequences, timing) is managed within the SimpleTexting platform itself.

### Slack
- **Status**: ✅ **Confirmed Working**
- **Functionality**: Slack is used for system alerts (from the Health Monitor) and daily sales reports. Notifications are sent to the `C097CHUHNTG` channel.

### Clay.com
- **Status**: 🟡 **Configured (Pending Execution)**
- **Functionality**: Clay is configured to be the primary engine for enrichment and scoring. A detailed runbook (`CLAY-RUNBOOK-NONTECH.md`) and setup sheet (`CLAY-SETUP-SHEET.md`) have been created to guide the user through the one-time bulk company enrichment process and ongoing lead processing. The enrichment strategy is **Apollo-only**.

---

## 5. Risks & Gaps (Live System)

The following points were identified during the analysis of the live system and development history:
- **Airtable Update (post-SMS) is disabled:** In the `UYSP-SMS-Trigger` workflow, the final node that updates the lead's status in Airtable after an SMS is sent is currently disabled. This will need to be enabled for full functionality.
- **Health Monitor is inactive:** The `UYSP-Health-Monitor` workflow is fully configured but not yet activated.
- **Airtable Trigger is disabled:** The Airtable Trigger in the `UYSP-SMS-Trigger` workflow is disabled. The system currently relies on manual testing paths. This needs to be enabled for the full, automated SMS outreach process to function.
