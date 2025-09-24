# UYSP Complete Dependency Matrix (Corrected)

This document maps all data dependencies within the UYSP Lead Qualification system, based on direct analysis of the live Airtable base and n8n workflows.

---

## Section 1: Airtable Schema and Table Relationships

### Table Summary

| Table Name        | ID                  | Purpose                                                                          |
| ----------------- | ------------------- | -------------------------------------------------------------------------------- |
| **Leads**         | `tblYUvhGADerbD8EO` | The central table for all leads, containing contact info, status, scores, and tracking data. |
| **SMS_Audit**     | `tbl5TOGNGdWXTjhzP` | A detailed, per-message audit log for all SMS communications.                    |
| **Settings**      | `tblErXnFNMKYhh3Xr` | Global settings for the system, such as campaign toggles and test mode.          |
| **SMS_Templates** | `tblsSX9dYMnexdAa7` | Stores the templates for different steps and variants of SMS campaigns.          |
| **Companies**     | `tblfAUBA0JFHLGaR4` | Stores company-level enriched data.                                              |
| **Table 1**       | `tblsEbROLIDxisXzV` | Unused default table.                                                            |
| **Leads Backup**  | `tblMD3rJA3MjW2e4v` | A backup or deprecated version of the Leads table.                               |

---

## Section 2: Field-Level Dependency Map (Active & Core Workflows)

This section details which Airtable fields are read from and written to by the active and core business logic workflows.

### Table: `Leads` (`tblYUvhGADerbD8EO`)

| Field Name (`ID`) | Read By | Write By |
|---|---|---|
| `Email` (`fldNiWIBmDRON3QGF`) | `UYSP-Calendly-Booked` | |
| `Phone` (`fldPgDn3NiFexisIh`) | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`, `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` | |
| `Booked` (`fld7ZkTkUn6ZQLo6s`) | `UYSP-SMS-Scheduler-v2` | `UYSP-Calendly-Booked` |
| `Booked At` (`fldAygirJPGndIO2I`) | | `UYSP-Calendly-Booked` |
| `SMS Stop` (`fldtzEwzW2Z07g3Kl`) | `UYSP-SMS-Scheduler-v2` | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP` |
| `SMS Stop Reason` (`fldgkvQgofdbAxXtQ`) | | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP` |
| `Processing Status` (`fldAVrpORl3DMqTYu`) | `UYSP-SMS-Scheduler-v2` | `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`, `UYSP-SMS-Scheduler-v2` |
| `Short Link ID` (`fld1UaVO8Y8i8BlWn`) | `UYSP-Switchy-Click-Tracker`, `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `Click Count` (`fldaXIU6Qh6wnAgfA`) | `UYSP-Switchy-Click-Tracker` | `UYSP-Switchy-Click-Tracker` |
| `Clicked Link` (`fldwTw84hk3TU4cRH`) | | `UYSP-Switchy-Click-Tracker` |
| `SMS Status` (`fldiWpXT7gyOeoenD`) | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Error Log` (`fldmTdbljf8a88GNz`) | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Phone Valid` (`fldCpTGfssWof1iNb`) | `UYSP-SMS-Scheduler-v2` | |
| `SMS Eligible` (`fldPDAHzTnXo9enLj`) | `UYSP-SMS-Scheduler-v2` | |
| `Current Coaching Client` (`fldyCaBCQIqbzwEeM`) | `UYSP-SMS-Scheduler-v2` | |
| `SMS Batch Control` (`fldqsBx3ZiuPC0bv3`) | `UYSP-SMS-Scheduler-v2` | |
| `SMS Sequence Position` (`fldIm565bl2kNw48c`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `SMS Last Sent At` (`fldjHyUk48hUwUq6O`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `SMS Variant` (`fldT24jVcEhyYS6iH`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `Short Link URL` (`fldZ4pNQMU9eeEwqC`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |
| `SMS Sent Count` (`fldDTrp621ZDgY070`) | `UYSP-SMS-Scheduler-v2` | `UYSP-SMS-Scheduler-v2` |

### Table: `SMS_Audit` (`tbl5TOGNGdWXTjhzP`)

| Field Name | Read By | Write By |
|---|---|---|
| `Event` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Phone` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Status` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Carrier` | | `UYSP-ST-Delivery V2` |
| `Lead Record ID` | | `UYSP-ST-Delivery V2`, `UYSP-SMS-Scheduler-v2` |
| `Delivery At` | | `UYSP-ST-Delivery V2` |
| `Webhook Raw` | | `UYSP-ST-Delivery V2` |
| `Campaign ID` | | `UYSP-SMS-Scheduler-v2` |
| `Text` | | `UYSP-SMS-Scheduler-v2` |
| `Email` | | `UYSP-SMS-Scheduler-v2` |
| `First Name` | | `UYSP-SMS-Scheduler-v2` |
| `Last Name` | | `UYSP-SMS-Scheduler-v2` |
| `Company Domain` | | `UYSP-SMS-Scheduler-v2` |
| `Total Messages To Phone` | | `UYSP-SMS-Scheduler-v2` |
| `Sent At` | | `UYSP-SMS-Scheduler-v2` |

### Table: `Settings` (`tblErXnFNMKYhh3Xr`)

| Field Name | Read By | Write By |
|---|---|---|
| `ab_ratio_a` | `UYSP-SMS-Scheduler-v2` | |
| `Fast Mode` | `UYSP-SMS-Scheduler-v2` | |
| `Active Campaign` | `UYSP-SMS-Scheduler-v2` | |

### Table: `SMS_Templates` (`tblsSX9dYMnexdAa7`)

| Field Name | Read By | Write By |
|---|---|---|
| `Variant` | `UYSP-SMS-Scheduler-v2` | |
| `Step` | `UYSP-SMS-Scheduler-v2` | |
| `Body` | `UYSP-SMS-Scheduler-v2` | |
| `Delay Days` | `UYSP-SMS-Scheduler-v2` | |
| `Fast Delay Minutes` | `UYSP-SMS-Scheduler-v2` | |
| `Campaign` | `UYSP-SMS-Scheduler-v2` | |

---

## Section 3: External System Integration Points

This section documents the external APIs and services that the active UYSP workflows depend on.

### Calendly
- **Workflow**: `UYSP-Calendly-Booked`
- **Integration Type**: Inbound Webhook
- **Business Purpose**: To automatically update a lead's status to "Booked" in the `Leads` table, halting further SMS outreach.

### Switchy.io
- **Workflow**: `UYSP-Switchy-Click-Tracker`
- **Integration Type**: Outbound API Call (GraphQL)
- **Business Purpose**: To monitor lead engagement by tracking clicks on short links.

### SimpleTexting
- **Workflows**: `UYSP-SMS-Inbound-STOP`, `UYSP-ST-Delivery V2`
- **Integration Type**: Inbound Webhook
- **Business Purpose**: To handle SMS compliance (opt-outs/opt-ins) and to track the delivery status of every message sent.

### Slack
- **Workflows**: `UYSP-Calendly-Booked`, `UYSP-Switchy-Click-Tracker`, `UYSP-ST-Delivery V2`
- **Integration Type**: Outbound API Call
- **Business Purpose**: To provide real-time alerts to the team regarding lead activities and system events.

---

## Section 4: Workflow Interdependencies (Data-Driven)

The active workflows are tightly coupled through their shared use of the **Airtable `Leads` table**. Changes made by one workflow directly impact the behavior of others.

### Key Interdependency Points:

- **`SMS Stop` Field (`fldtzEwzW2Z07g3Kl`)**: This is a critical control field.
  - **Written by**: `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`.
  - **Implicitly Read by**: Any SMS sending workflow, which must check this field to remain compliant.

- **`Processing Status` Field (`fldAVrpORl3DMqTYu`)**: This field tracks a lead's journey.
  - **Written by**: `UYSP-Calendly-Booked`, `UYSP-SMS-Inbound-STOP`.
  - **Implicitly Read by**: Any workflow that processes leads in a specific state (e.g., sending workflows would only select leads with a status of "Ready for SMS").

- **`SMS Status` Field (`fldiWpXT7gyOeoenD`)**: Tracks the state of the last SMS message.
  - **Written by**: `UYSP-ST-Delivery V2`.
  - **Implicitly Read by**: Follow-up logic and other workflows like `UYSP-Switchy-Click-Tracker` that might act based on this status.

### Summary of Data Flow:

The system operates as a state machine with Airtable as the central state store.
1.  **Events** (SMS replies, bookings, clicks, deliveries) are captured by independent webhook workflows.
2.  Each workflow **mutates the state** of a record in the `Leads` table.
3.  Other workflows **read this state** to determine their own actions.
This architecture makes the integrity of the `Leads` table data paramount to the entire system's operation.
