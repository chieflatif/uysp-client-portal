# SOP: Airtable Table - SMS_Templates

## 1. Executive Summary

- **Purpose**: The `SMS_Templates` table stores the content and logic for all SMS messages sent by the system. It enables multi-step, multi-variant SMS sequences that can be managed entirely within Airtable.
- **Scope**: This SOP covers the structure and usage of the `SMS_Templates` table.
- **Owner**: System Architect

## 2. How it Works

The `UYSP-SMS-Scheduler-CLEAN` workflow queries this table along with the `Settings` table on each run. It looks for templates that match the `Active Campaign` defined in `Settings`.

The table is designed to support complex sequences:
- **Campaigns**: A campaign is a collection of messages (e.g., "AI Webinar Follow-up").
- **Steps**: Each message in a sequence has a `Step` number (1, 2, 3...). The scheduler sends messages in ascending order based on the lead's current `SMS Sequence Step`.
- **Variants**: Each step can have multiple variants (e.g., 'A', 'B') for A/B testing. The scheduler uses the ratios from the `Settings` table to decide which variant to send.
- **Delays**: The `Delay Days` field controls the time between steps. This can be overridden by `Fast Mode` in the `Settings` table for rapid testing.

The `Body` of the message can contain placeholders like `{firstName}` which are dynamically replaced with lead data by the `Prepare Text (A/B)` node in the workflow.

## 3. Field Dictionary

| Field Name          | Type           | Description                                                                                                                                 |
| ------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Campaign**        | `singleLineText` | The name of the campaign this template belongs to. Must exactly match the `Active Campaign` in the `Settings` table to be used.             |
| **Variant**         | `singleSelect` | The variant of the message ('A' or 'B'). Used for A/B testing.                                                                               |
| **Step**            | `number`       | The order of this message in the sequence (1, 2, 3, etc.).                                                                                   |
| **Delay Days**      | `number`       | The number of days to wait after the *previous* step before sending this message. The delay for Step 1 is effectively 0.                        |
| **Body**            | `singleLineText` | The text content of the SMS message. Can include dynamic variables like `{firstName}`.                                                      |
| **Fast Delay Minutes**| `number`       | The number of minutes to wait before sending this message when `Fast Mode` is enabled in the `Settings` table. This overrides `Delay Days`. |

## 4. Maintenance & Troubleshooting

- **Messages Not Sending**: Ensure the `Campaign` name here matches the `Active Campaign` in `Settings`. Also, ensure there is a template for each `Step` number in the sequence.
- **Incorrect Message Content**: Double-check the `Body` field for typos or incorrect variable names. The only currently supported variable is `{firstName}`.
- **Sequence Stalling**: If a sequence stops, verify that a template exists for the next `Step` number that the leads are expecting.

## 5. Related SOPs & System Documents

- **SOPs**:
    - `SOP-Workflow-SMS-Scheduler.md`
    - `SOP-Airtable-Settings-Table.md`
- **Architecture**:
    - `docs/architecture/AIRTABLE-SCHEMA.md`
