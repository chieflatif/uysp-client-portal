# SimpleTexting Integration

## Requirements
- 10DLC number configured
- API Key available
- Drip campaign (3 messages) created

## API – Base & Endpoints (v2)
Base: `https://api-app2.simpletexting.com/v2/api`

Common header:
```
Authorization: Bearer <API_TOKEN>
Content-Type: application/json
```

### Lists (smoke test)
GET `https://api-app2.simpletexting.com/v2/api/contact-lists?page=0&size=1`

### Send single message
POST `https://api-app2.simpletexting.com/v2/api/messages`

### Evaluate message (no send)
POST `https://api-app2.simpletexting.com/v2/api/messages/evaluate`

Body example (single send):
```json
{
  "mode": "SINGLE",
  "accountPhone": "19095551234",
  "contactPhone": "14155550123",
  "text": "<Your first message>"
}
```

## n8n Configuration
### HTTP Request Node
- Authentication: Generic Credential Type → Header Auth → select your "SimpleTexting API (Prod)"
- URL: Base + endpoint (see above)
- Send: JSON; Content-Type: application/json
- Body (single send): `{ "mode": "SINGLE", "accountPhone": "<digits>", "contactPhone": "<digits>", "text": "..." }`

### Post-send Writeback Node
- Operation: Upsert
- Matching Columns: ["Email"]
- Map: SMS Status, SMS Campaign ID, SMS Cost, Last SMS Sent (now), SMS Sent Count (+1)

## n8n Response Parsing (Code)
```javascript
const res = $input.first().json;
if ($input.first().statusCode !== 200) {
  return [{ json: { sms_status: 'Failed', error_reason: res.message, retry_needed: true } }];
}
if (res.status === 'partial_success' && res.failed_numbers?.length) {
  return [{ json: { sms_status: 'Partial', failed_details: res.failed_numbers, retry_needed: true } }];
}
return [{ json: { sms_status: 'Sent', campaign_id: res.campaign_id } }];
```

## Webhooks
- Configure delivery/click/reply/stop webhooks → n8n endpoint
- Update Airtable: sms_status, last_sms_sent, sms_sent_count
- Stop sequence on booking/reply as needed
