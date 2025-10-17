# Twilio Integration - Machine Spec
**For**: AI Agent reference during prototype build  
**Source Workflow**: UAZWVFzMrJaVbvGM (UYSP-SMS-Scheduler-v2)  
**Target**: UYSP-Twilio-SMS-Prototype

---

## TWILIO CREDENTIALS

```json
{
  "account_sid": "Get from Twilio Console",
  "auth_token": "Get from Twilio Console",
  "phone_number": "+1XXXXXXXXXX (purchase in Twilio)",
  "whatsapp_number": "whatsapp:+1XXXXXXXXXX (same number with prefix)"
}
```

---

## NODE REPLACEMENT SPEC

### REPLACE: "SimpleTexting HTTP" node

**Current Node Config (SimpleTexting):**
```json
{
  "id": "sms",
  "name": "SimpleTexting HTTP",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api-app2.simpletexting.com/v2/api/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": {
      "contactPhone": "={{ $items('Prepare Text (A/B)',0)[$itemIndex].json.phone_digits }}",
      "accountPhone": "3102218890",
      "mode": "AUTO",
      "text": "={{ $items('Prepare Text (A/B)',0)[$itemIndex].json.text }}"
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "E4NDaEmBWVX3rawT"
    }
  }
}
```

**New Node Config (Twilio):**
```json
{
  "id": "twilio-sms",
  "name": "Twilio SMS HTTP",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.twilio.com/2010-04-01/Accounts/{{ $credentials.TWILIO_ACCOUNT_SID }}/Messages.json",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpBasicAuth",
    "sendBody": true,
    "specifyBody": "raw",
    "contentType": "application/x-www-form-urlencoded",
    "body": "To=+1{{ $items('Prepare Text (A/B)',0)[$itemIndex].json.phone_digits }}&From={{ $vars.TWILIO_PHONE_NUMBER }}&Body={{ encodeURIComponent($items('Prepare Text (A/B)',0)[$itemIndex].json.text) }}&StatusCallback={{ $vars.N8N_BASE_URL }}/webhook/twilio-status",
    "options": {
      "response": {
        "response": {
          "neverError": true
        }
      }
    }
  },
  "credentials": {
    "httpBasicAuth": {
      "id": "TWILIO_CREDENTIAL_ID"
    }
  }
}
```

---

## RESPONSE PARSER UPDATE

### MODIFY: "Parse SMS Response" node

**Add to beginning of code:**
```javascript
// Detect provider from response structure
const stItems = $items('SimpleTexting HTTP', 0) || [];
const twilioItems = $items('Twilio SMS HTTP', 0) || [];
const usingTwilio = twilioItems.length > 0;

const items = usingTwilio ? twilioItems : stItems;
```

**Update message ID extraction:**
```javascript
// Old (SimpleTexting):
const httpId = resp.id || '';

// New (Twilio-compatible):
const httpId = resp.sid || resp.id || '';  // Twilio uses 'sid', ST uses 'id'
```

**Add cost extraction:**
```javascript
// Twilio includes price in response
const sms_cost = resp.price ? Math.abs(parseFloat(resp.price)) : 0.01;
```

---

## TWILIO WEBHOOK PAYLOADS

### Delivery Status Webhook
**Endpoint**: POST /webhook/twilio-status

**Payload (form-encoded):**
```
MessageSid=SM123abc456def
MessageStatus=delivered
To=+15555555555
From=+19095551234
ErrorCode=
ErrorMessage=
```

**Parse in n8n:**
```javascript
const payload = $input.first().json;
// n8n auto-parses form data to JSON
const messageSid = payload.MessageSid;
const status = payload.MessageStatus;  // queued, sent, delivered, failed, undelivered
```

### Inbound Message Webhook
**Endpoint**: POST /webhook/twilio-inbound

**Payload:**
```
MessageSid=SM123abc
From=+15555555555
To=+19095551234
Body=YES I'm interested
NumMedia=0
```

---

## N8N VARIABLES TO CREATE

```
TWILIO_PHONE_NUMBER: +19095551234
TWILIO_ACCOUNT_SID: ACXXXXXXXXXXXXXXXX
N8N_BASE_URL: https://rebelhq.app.n8n.cloud
```

---

## TESTING PAYLOADS

### Test 1: Basic SMS
```json
{
  "phone_digits": "YOUR_PHONE_10_DIGITS",
  "text": "Test from Twilio prototype",
  "id": "test_rec_001",
  "first_name": "Test",
  "email": "test@example.com"
}
```

### Test 2: WhatsApp
```json
{
  "phone_digits": "INTERNATIONAL_PHONE",
  "text": "WhatsApp test from Twilio",
  "channel": "whatsapp",
  "id": "test_rec_002"
}
```

---

## WORKFLOW CLONE PROCEDURE

**Via n8n MCP:**
```javascript
// Step 1: Get source workflow
mcp_n8n_n8n_get_workflow({ id: "UAZWVFzMrJaVbvGM" })

// Step 2: Modify nodes (replace SimpleTexting with Twilio)

// Step 3: Create new workflow
mcp_n8n_n8n_create_workflow({
  name: "UYSP-Twilio-SMS-Prototype",
  nodes: [MODIFIED_NODES],
  connections: [SAME_CONNECTIONS],
  settings: {executionOrder: "v1"}
})
```

---

## SUCCESS CRITERIA

```
[x] Twilio account created
[x] Phone number purchased
[x] n8n credential configured
[x] Workflow duplicated
[x] SimpleTexting node replaced
[x] Test SMS sent successfully
[x] Response parsed correctly
[x] Airtable updated
[x] Cost tracking works
[x] WhatsApp test (bonus)
```

---

**Everything needed to build the prototype is documented here.**

