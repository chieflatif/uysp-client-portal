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
- **Risk**: This node is a **critical single point of failure for the entire SMS sending process**. It handles time window enforcement, batch sizing, duplicate prevention, A/B testing, and sequence progression. Any bug introduced into this node's code will bypass all other checks and directly impact outreach.
- **Impact**: **High**. A logic error here could lead to sending messages at the wrong time, to the wrong people, or in the wrong sequence, with significant reputation and compliance risks.

## 2. Cascade Failure Scenarios

### Scenario 1: `Settings` Table Misconfiguration
- **Trigger**: A user accidentally deletes the `ab_ratio_a` value or sets `Fast Mode` to true in the `Settings` table.
- **Cascade**:
  1. The `Prepare Text (A/B)` node in `UYSP-SMS-Scheduler-v2` reads the incorrect settings.
  2. If `ab_ratio_a` is missing, the A/B test variant assignment may default to a single variant, skewing test results.
  3. If `Fast Mode` is enabled, all message delays are reduced to minutes instead of days. **Result**: The entire lead database could be messaged multiple times in a single day, leading to massive spam complaints, carrier blocks, and budget depletion.

### Scenario 2: `SMS Eligible` Formula Error
- **Trigger**: The formula for `SMS Eligible` in the `Leads` table is edited, and the `NOT({SMS Stop})` condition is accidentally removed.
- **Cascade**:
  1. The `List Due Leads` node in `UYSP-SMS-Scheduler-v2` now includes leads who have sent a `STOP` message in its list of eligible leads.
  2. The scheduler proceeds to send messages to these opted-out leads.
- **Conclusion**: This represents a **critical compliance failure** and would likely result in carrier penalties and legal issues. The dependency is implicit and not visible within n8n, making it particularly high-risk.

## 3. Change Impact Assessment Summary
- **Most Critical Component**: The **`Leads` table in Airtable**. Any change to its schema, particularly to the fields referenced in the `SMS Eligible` formula or the main `List Due Leads` filter, poses the highest risk of catastrophic failure.
- **Highest Risk Workflow**: The **`UYSP-SMS-Scheduler-v2` workflow**, specifically the `Prepare Text (A/B)` node. Changes here require the most rigorous testing.
- **Silent Failures**: The system is vulnerable to silent failures caused by unexpected changes in external API payloads (e.g., Calendly) or misconfigurations in the Airtable `Settings` table.
