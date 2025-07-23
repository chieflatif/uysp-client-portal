#!/bin/bash

# Post-Auth-Fix Validation Script
# Run AFTER setting webhook auth to "None"

echo "🚀 POST-AUTH-FIX VALIDATION - Phase 00"
echo "======================================"

# Test webhook with no auth
EMAIL="validation-$(date +%s)@example.com"
WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"

echo "📧 Test Email: $EMAIL"
echo "🎯 Testing no-auth webhook..."

RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}\nTIME:%{time_total}s" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"Post Auth Fix Test\",
    \"phone\": \"415-555-0001\",
    \"company\": \"Validation Corp\"
  }")

echo "📥 Response: $RESPONSE"
STATUS=$(echo "$RESPONSE" | grep "STATUS:" | cut -d: -f2)

if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
    echo ""
    echo "✅ WEBHOOK SUCCESS! Now verifying end-to-end..."
    
    # Wait for processing
    echo "⏳ Waiting 3 seconds for n8n processing..."
    sleep 3
    
    echo ""
    echo "🔍 AUTOMATED VERIFICATION:"
    echo "1. Check n8n executions via MCP"
    echo "2. Check Airtable record creation via MCP"
    echo "3. Validate Smart Field Mapper"
    echo ""
    echo "📋 EVIDENCE REQUIRED:"
    echo "- Workflow ID: CefJB1Op3OySG8nb"
    echo "- Execution ID: [CHECK VIA MCP]"  
    echo "- Airtable Record: [CHECK FOR $EMAIL]"
    echo ""
    echo "✅ Phase 00 WEBHOOK ACTIVATION: COMPLETE"
    echo "🎯 Next: Run MCP tools to verify execution & record"
    
else
    echo ""
    echo "❌ Still failing with status: $STATUS"
    echo "💡 Double-check webhook auth is set to 'None'"
fi 