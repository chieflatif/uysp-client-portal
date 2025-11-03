# SOP: Airtable Table - Settings

## 1. Executive Summary

- **Purpose**: The `Settings` table provides a centralized, dynamic configuration for the SMS outreach system. It allows for system-wide changes to be made from a single record in Airtable without requiring any modifications to n8n workflows.
- **Scope**: This SOP covers the fields and function of the `Settings` table.
- **Owner**: System Architect

## 2. How it Works

The `UYSP-SMS-Scheduler-CLEAN` workflow queries this table at the beginning of every execution. It fetches the single configuration record to determine the operating parameters for that run. This allows for real-time control over the entire SMS sending process.

For example, enabling `Test Mode` will instantly route all subsequent SMS messages to the specified `Test Phone` number, regardless of the actual lead data. This is crucial for safe testing and development. Similarly, activating `Fast Mode` overrides standard message delays, allowing an entire sequence to be tested in minutes instead of days.

## 3. Field Dictionary

| Field Name        | Type       | Description                                                                                                                                                             |
| ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active Campaign** | `singleLineText` | **Primary Key.** Defines the current SMS campaign being run. The `SMS Scheduler` will only send templates matching this campaign name from the `SMS_Templates` table. |
| **ab_ratio_a**    | `number`   | The weighting for message variant 'A'. For example, a value of `50` would mean 50% of messages use the 'A' variant.                                                    |
| **ab_ratio_b**    | `number`   | The weighting for message variant 'B'. For example, a value of `50` would mean 50% of messages use the 'B' variant. The sum of A and B should equal 100.                  |
| **Test Mode**     | `checkbox` | If checked (`true`), all outbound SMS messages will be sent to the `Test Phone` number, overriding the lead's actual phone number. **CRITICAL for testing.**              |
| **Test Phone**    | `singleLineText` | The phone number to use for all sends when `Test Mode` is active.                                                                                                       |
| **Fast Mode**     | `checkbox` | If checked (`true`), the system ignores the `Delay Days` in `SMS_Templates` and uses the `Fast Delay Minutes` instead, allowing for rapid sequence testing.               |
| **Click Tracking**| `checkbox` | (Future Use) If checked (`true`), enables the click tracking proxy for links in SMS messages. Currently inactive.                                                       |

## 4. Maintenance & Troubleshooting

- **Scheduler Not Sending**: If the `SMS Scheduler` is running but not sending messages, first check that the `Active Campaign` value in this table exactly matches a `Campaign` name in the `SMS_Templates` table.
- **Tests Not Working**: If `Test Mode` is on but messages are still going to live leads, ensure there are no caching issues in the n8n workflow. Deactivate and reactivate the workflow to force it to pull the latest settings.

## 5. Related SOPs & System Documents

- **SOPs**:
    - `SOP-Workflow-SMS-Scheduler.md`
    - `SOP-Airtable-SMS_Templates-Table.md`
- **Architecture**:
    - `docs/architecture/AIRTABLE-SCHEMA.md`
