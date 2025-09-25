# UYSP Critical Dependencies Summary (Corrected)

This document summarizes the highest-risk dependencies and single points of failure based on a deep analysis of the live UYSP system.

---

## 1. High-Risk Dependencies & Single Points of Failure

### Airtable Base (`app4wIsBfpJTg7pWS`)
- **Description**: The entire system's logic, state, and configuration are stored and managed within this single Airtable base. It is the definitive source of truth for all workflows.
- **Risk**: This is the **primary single point of failure**. Any performance degradation, schema lock, or outage of the Airtable API will cause immediate, system-wide failure.
- **Impact**: **Critical**. All automated processes would halt. Compliance actions like `STOP` requests could be missed. No new leads could be processed or messaged.

### Critical Airtable Formula Fields
- **Description**: The `Leads` table contains complex formula fields, like `SMS Eligible`, that encapsulate significant business logic.
- **Risk**: An accidental change to the logic of these formulas can have widespread, unintended consequences. Because the logic is hidden within an Airtable field, it is not immediately visible in the n8n workflows that depend on it.
- **Impact**: **High**. For example, a minor change to the `SMS Eligible` formula could either halt all messaging or, worse, cause messages to be sent to non-compliant or unqualified leads.

### The `Prepare Text (A/B)` Node
- **Description**: This single Code node within the `UYSP-SMS-Scheduler-v2` workflow contains the majority of the system's core outreach logic.
- **Risk**: This node is a **critical single point of failure for the entire SMS sending process**. It handles time window enforcement, duplicate prevention, and sequence progression. Batch sizing is now controlled manually in Airtable, reducing the risk of accidental mass-messaging from this node.
- **Impact**: **High**. A logic error here could still lead to sending messages at the wrong time or in the wrong sequence, but the risk of sending to an incorrect batch of leads has been eliminated.

## 2. Process Flow & Control Mechanisms

### Lead Selection & Batch Control
The system's batch control mechanism has been simplified and hardened.
- **Primary Control**: The **`{SMS Batch Control}`** field in the `Leads` table is the **single source of truth** for which leads will be processed. The n8n workflow now processes ALL leads that have this field set to "Active".
- **Risk Mitigation**: This manual, explicit selection process eliminates the risk of the workflow accidentally processing the wrong leads or exceeding a safe batch size.

### Automated Pipeline Cleanup
The system now uses two Airtable Automations to keep the pipeline clean.
- **Mechanism**: Automations monitor the `{Processing Status}` and `{SMS Stop}` fields. When a lead is marked "Complete" (either by finishing the sequence or by a permanent failure) or "Stopped", the automation automatically clears the `{SMS Batch Control}` field.
- **Benefit**: This prevents "dead" leads from cluttering the pipeline and causing confusion during manual batch selection. It ensures that any lead with "Active" batch control is genuinely eligible for messaging.

## 3. Change Impact Assessment Summary
- **Most Critical Component**: The **`Leads` table in Airtable**. The integrity of the `{SMS Batch Control}`, `{Processing Status}`, and `{SMS Stop}` fields is paramount, as they now directly control the entire sending and cleanup process.
- **Highest Risk Workflow**: The **`UYSP-SMS-Scheduler-v2` workflow**, specifically the `Prepare Text (A/B)` node. While safer now, changes to its timing and sequencing logic require the most rigorous testing.
- **Silent Failures**: The system is still vulnerable to silent failures caused by unexpected changes in external API payloads or misconfigurations in the Airtable `Settings` table. The new automated cleanup process, however, reduces the risk of these failures causing persistent pipeline clutter.
