#!/bin/bash

# Test After Workflow Activation
echo "🚨 CRITICAL: WORKFLOW MUST BE ACTIVE FIRST!"
echo "1. Open n8n UI"
echo "2. Toggle workflow to ACTIVE (top-right)"  
echo "3. Then run this test"
echo ""
read -p "Press ENTER after activating workflow..."

EMAIL="activation-test-$(date +%s)@example.com"
echo "📧 Testing with: $EMAIL"

RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" \
  -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"Activation Test\",
    \"phone\": \"415-555-0001\",
    \"company\": \"Test Corp\"
  }")

echo "📥 Response: $RESPONSE"
STATUS=$(echo "$RESPONSE" | grep "STATUS:" | cut -d: -f2)

if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
    echo ""
    echo "✅ SUCCESS! Webhook is working!"
    echo "🔍 Now check with MCP tools for:"
    echo "- New execution in n8n"
    echo "- New record in Airtable: $EMAIL"
else
    echo ""
    echo "❌ Status: $STATUS"
    if [ "$STATUS" = "404" ]; then
        echo "Workflow still INACTIVE - check n8n UI toggle"
    fi
fi 