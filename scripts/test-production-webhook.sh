#!/bin/bash

# Production Webhook Test Script - Phase 00 Validation
# Uses production URL directly since webhook is ACTIVE

echo "🚀 TESTING PRODUCTION WEBHOOK - PHASE 00"
echo "========================================="

# Test Data
TIMESTAMP=$(date +%s)
EMAIL="prod-test-${TIMESTAMP}@example.com"
NAME="Prod Test ${TIMESTAMP}"
PHONE="415-555-$(printf "%04d" $((RANDOM % 10000)))"

echo "📧 Test Email: $EMAIL"
echo "👤 Test Name: $NAME" 
echo "📞 Test Phone: $Phone"
echo ""

# Production URL (workflow is ACTIVE)
WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"

echo "🎯 Target URL: $WEBHOOK_URL"
echo "🔑 Auth: Using workflow's expected credential format"
echo ""

# Test with minimal auth - no hardcoded keys
echo "📤 Sending test payload..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}s" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"$NAME\", 
    \"phone\": \"$PHONE\",
    \"company\": \"Test Corp\",
    \"source_form\": \"webhook_test\"
  }")

echo "📥 Response:"
echo "$RESPONSE"
echo ""

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ SUCCESS: Webhook accepted payload (Status: $HTTP_STATUS)"
    echo "🔍 Next: Check n8n executions and Airtable for record"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo "❌ AUTH ERROR: Credential mismatch detected"
    echo "💡 Solution: Check webhook credential vs hardcoded auth"
else
    echo "⚠️  UNEXPECTED: Status $HTTP_STATUS"
fi

echo ""
echo "🔧 Manual verification steps:"
echo "1. Check n8n executions: https://rebelhq.app.n8n.cloud/executions"
echo "2. Check Airtable People table for: $EMAIL" 
echo "3. If 403: Webhook credential needs updating" 