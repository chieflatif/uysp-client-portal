# n8n Minimal Workflows

## Workflow A: Realtime Ingestion
Nodes:
1) Webhook (POST /leads-intake)
2) Code (Normalize minimal mapping + Company Domain)
3) Airtable (Upsert by Email → Leads; updateAllMatches=false)

Notes:
- Test payload:
```json
{"email":"jane@stripe.com","phone":"+14155550123","first_name":"Jane","last_name":"Doe","job_title":"AE"}
```
- Upsert keys: email, phone

## Workflow B: SMS Trigger
Nodes:
1) Airtable Trigger (View: SMS Pipeline; Trigger Field: Last Updated Auto)
2) Delay 2s
3) Airtable Get Record (Leads by id)
4) Slack (SMS Test Notify) [pre-key]
5) HTTP Request (SimpleTexting) [post-key]
6) Code (Parse Response)
7) Airtable (Upsert by Email: update SMS fields)

Partial parsing snippet (n8n Function):
```javascript
const res = $input.first().json;
if (res.status === 'partial_success' && res.failed_numbers?.length) {
  return [{ json: { sms_status: 'Partial', failed_details: res.failed_numbers, retry_needed: true } }];
}
return [{ json: { sms_status: 'Sent', campaign_id: res.campaign_id } }];
```

Retry logic:
- Separate scheduled workflow hourly
- Query Leads where sms_status in [Partial, Failed] and retry_count < 3
- Re-send only failed numbers, increment retry_count
