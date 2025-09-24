# UYSP Gap Analysis Report (Corrected)

This document identifies discrepancies between the system's documented SOPs and its actual, evidence-based implementation, verified against the live n8n and Airtable systems.

---

## GAP ANALYSIS: System-Wide Findings

### 1. Airtable Table Naming Discrepancies
- **Issue**: Multiple SOPs (`SOP-Workflow-Calendly-Booked.md`, `SOP-Workflow-SMS-Inbound-STOP.md`, `SOP-Workflow-ST-Delivery.md`) consistently refer to the main leads table as `Leads` and the audit table as `SMS_Audit`.
- **Reality**: This is **CORRECT**. My initial analysis, based on a faulty schema file, was wrong. The live system uses `Leads` and `SMS_Audit`.
- **Conclusion**: The SOPs are correct on this point. My previous finding of an error was mistaken.

### 2. `UYSP-SMS-Inbound-STOP` Workflow Functionality
- **Issue**: The `SOP-Workflow-SMS-Inbound-STOP.md` describes a workflow that only handles STOP/UNSTOP commands. The `SIMPLETEXTING-INTEGRATION.md` architecture document claims click tracking on n8n is disabled.
- **Reality**: Your action to delete the click-tracking nodes from this workflow has brought it into alignment with its primary documented purpose. The workflow now correctly functions *only* as a STOP/UNSTOP handler.
- **Conclusion**: The SOP is now **CORRECT**. The architecture document is still incorrect, as click tracking *is* handled by n8n, just via the dedicated `UYSP-Switchy-Click-Tracker` workflow, not disabled entirely.

---

## GAP ANALYSIS: Per-Workflow

### `UYSP-Calendly-Booked`
- **Discrepancy**: The SOP claims the webhook URL is `/webhook/calendly`.
- **Reality**: The webhook node in the workflow is configured for the path `/calendly`.
- **Impact**: This is a minor but potentially breaking discrepancy. If the webhook in Calendly was ever configured using the SOP, it would fail.
- **Recommendation**: Update the SOP to use the correct path: `/calendly`.

### `UYSP-SMS-Scheduler-v2`
- **Issue**: This is the most complex workflow, but its SOP (`SOP-Workflow-SMS-Scheduler.md`) was not on the initial list. A full comparison is not yet possible.
- **Observation**: The workflow contains numerous critical, hardcoded business rules not immediately apparent from any high-level documentation (e.g., the 25-lead batch size limit, the 9 AM - 5 PM Eastern Time sending window, the 24-hour resend lock).
- **Recommendation**: A detailed, new SOP should be created for `UYSP-SMS-Scheduler-v2` that explicitly documents these critical rules found in the `Prepare Text (A/B)` node.

### `UYSP-Switchy-Click-Tracker`
- **Observation**: There does not appear to be a dedicated SOP for this active workflow in the `docs/sops` directory. Its existence and function contradict the architecture document's claim that click tracking is disabled on n8n.
- **Recommendation**: Create a new SOP for this workflow. Update the architecture document to reference this workflow as the correct method for click tracking.
