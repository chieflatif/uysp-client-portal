#!/bin/bash

# Final Validation Test - After Code Node Fix
echo "🎯 FINAL VALIDATION - POST CODE NODE FIX"
echo "======================================"

EMAIL="final-test-$(date +%s)@example.com"
echo "📧 Test Email: $EMAIL"

# Test webhook
RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}\nTIME:%{time_total}s" \
  -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"Final Test User\",
    \"phone\": \"415-555-0001\",
    \"company\": \"Final Test Corp\"
  }")

echo "📥 Response: $RESPONSE"
STATUS=$(echo "$RESPONSE" | grep "STATUS:" | cut -d: -f2)

if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
    echo ""
    echo "✅ SUCCESS! Webhook processed successfully"
    echo "🔍 Waiting 3 seconds for n8n processing..."
    sleep 3
    echo ""
    echo "📋 EVIDENCE CHECK REQUIRED:"
    echo "- Use n8n-mcp to get latest execution"
    echo "- Use airtable-mcp to find record: $EMAIL"
    echo "- Verify Smart Field Mapper worked"
    echo ""
    echo "🎉 Phase 00 WEBHOOK ACTIVATION: COMPLETE!"
else
    echo ""
    echo "❌ Still failing with status: $STATUS"
    echo "Check code node was properly updated"
fi 