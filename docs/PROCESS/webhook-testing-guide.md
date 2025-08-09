[AUTHORITATIVE]
Last Updated: 2025-08-08

# Webhook Testing Guide for UYSP System

## Overview
This guide covers how to properly test webhooks in n8n, addressing the common confusion around webhook behavior in test mode vs production mode.

## Key Concepts

### Test Mode vs Production Mode
- **Test Mode**: Webhook waits for ONE external request after clicking "Execute Workflow"
- **Production Mode**: Webhook always listening (when workflow is ACTIVE)

### The Credential Display "Issue" (Not Actually an Issue)
When you export or view workflows via API, credentials show as `null`:
```json
"credentials": {
  "airtableApi": {
    "id": null,
    "name": "Airtable API"
  }
}
```
**This is NORMAL** - n8n hides credential IDs in exports for security. Your credentials are still connected and working.

## Testing Methods

### Method 1: Automated Script (Recommended)

We've created an automated test script that handles everything:

```bash
# Location
/Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1/scripts/automated-webhook-test.sh

# Usage
./scripts/automated-webhook-test.sh
```

The script will:
1. Remind you to click "Execute Workflow" in n8n
2. Send a test payload with proper authentication
3. Show you the response
4. Guide you on what to check next

### Method 2: Direct curl Command

For production testing (no manual steps needed):

```bash
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"email":"test-'$(date +%s)'@example.com","name":"Test User","phone":"555-0001"}'
```

This works because the workflow is ACTIVE and the production webhook is always listening.

### Method 3: Test Mode with Manual Trigger

1. Open workflow in n8n UI
2. Click "Execute Workflow" button
3. Within 60 seconds, run:
```bash
curl -X POST "https://rebelhq.app.n8n.cloud/webhook-test/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## Testing Different Payload Variations

### Test Field Normalization
```bash
# ALL CAPS fields
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: [YOUR_API_KEY]" \
  -d '{"EMAIL":"CAPS@example.com","NAME":"CAPS TEST"}'

# Mixed case
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: [YOUR_API_KEY]" \
  -d '{"Email":"mixed@example.com","Name":"Mixed Case"}'

# Alternative field names
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: [YOUR_API_KEY]" \
  -d '{"email_address":"alt@example.com","full_name":"Alt Fields"}'
```

## What to Check After Testing

### 1. HTTP Response
- **200 OK**: Webhook received the request
- **401 Unauthorized**: API key issue
- **404 Not Found**: Wrong webhook URL
- **500 Error**: Workflow execution error

### 2. n8n Execution History
- Go to workflow executions
- Check for any error nodes
- Look for authentication errors specifically

### 3. Airtable Records
- Check if record was created in People table
- Verify all fields were mapped correctly
- Check field_mapping_success_rate

## Common Issues and Solutions

### "Workflow won't start"
- **Cause**: Trying to test by clicking Execute without external trigger
- **Solution**: Use curl command or test script

### "Credentials appear null in JSON"
- **Cause**: This is normal n8n security behavior
- **Solution**: Ignore unless you get actual auth errors

### "Webhook times out"
- **Cause**: Waited too long after clicking Execute
- **Solution**: Send test within 60 seconds of clicking Execute

### "No record created in Airtable"
- **Cause**: Usually field normalization issue
- **Solution**: Check Smart Field Mapper is first node after webhook

## Best Practices

1. **Use timestamp in test emails** to avoid duplicates:
   ```bash
   "email":"test-$(date +%s)@example.com"
   ```

2. **Test with production URL** when possible (no manual steps)

3. **Keep test payloads varied** to catch field normalization issues

4. **Check all three places**: HTTP response, n8n execution, Airtable records

5. **Document any new field variations** discovered during testing

## Quick Test Command

For immediate testing without reading the whole guide:

```bash
# Production webhook (always listening, no manual steps)
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"email":"quick-test-'$(date +%s)'@example.com","name":"Quick Test","phone":"555-0001"}'
```

Then check:
1. HTTP 200 response
2. n8n execution history
3. Airtable for new record
