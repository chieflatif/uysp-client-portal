# Webhook Testing Gotchas

## Gotcha #5: Test Mode Webhook Limitations
**Critical**: Development webhooks are NOT like production

**Process**:
1. Click "Execute Workflow" in n8n UI
2. Webhook listens for ONE request only
3. After receiving request, it STOPS
4. Must click Execute again for next test

**Common Mistake**: Sending multiple payloads without re-executing  
**Result**: Only first payload processed, rest ignored

## Gotcha #12: Webhook URL Changes
**Dev URL**: `https://[instance].app.n8n.cloud/webhook-test/[path]`  
**Prod URL**: `https://[instance].app.n8n.cloud/webhook/[path]`

**Issue**: URLs change between environments  
**Solution**: Use environment variables for base URL

## Testing Protocol
```bash
# Step 1: Click "Execute Workflow" in n8n UI first!
echo "Ready to send test payload"
read -p "Press enter after clicking Execute..."

# Step 2: Send payload
curl -X POST https://[instance].app.n8n.cloud/webhook-test/kajabi-leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Step 3: Check execution in n8n UI
echo "Check Executions list in n8n"
echo "Click Execute again for next test"
```

## Cannot Test From
- n8n built-in test button (doesn't work for webhooks)
- Inside n8n interface
- Automated test runners without manual execution

## Must Test With
- External tools (curl, Postman, TestSprite)
- Manual "Execute Workflow" click each time
- One payload per execution 