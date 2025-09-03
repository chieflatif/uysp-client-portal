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

## Workflow B: SMS Scheduler (current)
Nodes:
1) Schedule (Cron: `0 14-21 * * 1-5` UTC)
2) Airtable Search (List Due Leads with smart eligibility filter)
3) Code (Prepare Text A/B, select template, personalize)
4) HTTP Request (SimpleTexting send)
5) Airtable Update (update by ID: SMS fields)
6) Slack (notify)

Partial parsing snippet (n8n Function):
```javascript
const res = $input.first().json;
if (res.status === 'partial_success' && res.failed_numbers?.length) {
  return [{ json: { sms_status: 'Partial', failed_details: res.failed_numbers, retry_needed: true } }];
}
return [{ json: { sms_status: 'Sent', campaign_id: res.campaign_id } }];
```

Minimal set (current):
- UYSP-SMS-Scheduler, UYSP-ST-Delivery V2, UYSP-SMS-Inbound-STOP, UYSP-Calendly-Booked, UYSP-Daily-Monitoring
