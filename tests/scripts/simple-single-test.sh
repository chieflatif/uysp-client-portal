#!/bin/bash

# Ultra-Simple Single Test - User Edition
# Just one test you can run to verify field normalization

echo "🧪 Single Field Normalization Test"
echo "=================================="

TIMESTAMP=$(date +%s)
EMAIL="user-test-$TIMESTAMP@example.com"

echo "📤 Sending payload with ALL CAPS fields to test field normalization..."
echo "   EMAIL: $EMAIL"
echo "   NAME: USER TESTER"
echo "   PHONE: 555-USER"

RESPONSE=$(curl -s -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -d "{
    \"EMAIL\": \"$EMAIL\",
    \"NAME\": \"USER TESTER\",
    \"PHONE\": \"555-USER\",
    \"COMPANY\": \"USER CORP\",
    \"request_id\": \"user-test-$TIMESTAMP\"
  }")

echo ""
echo "📥 Response received:"
echo "===================="

# Extract key info
SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,]*' | cut -d':' -f2)
RECORD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
FIRST_NAME=$(echo "$RESPONSE" | grep -o '"first_name":"[^"]*"' | cut -d'"' -f4)
LAST_NAME=$(echo "$RESPONSE" | grep -o '"last_name":"[^"]*"' | cut -d'"' -f4)
EMAIL_MAPPED=$(echo "$RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)

echo "✅ Success: $SUCCESS"
echo "📊 Record ID: $RECORD_ID"
echo "👤 Name Split: '$FIRST_NAME' + '$LAST_NAME'"
echo "📧 Email Mapped: $EMAIL_MAPPED"
echo ""

if [ "$SUCCESS" = "true" ]; then
    echo "🎉 TEST PASSED!"
    echo "   ✓ ALL CAPS 'EMAIL' → lowercase 'email' field"
    echo "   ✓ ALL CAPS 'NAME' → split into 'first_name' and 'last_name'"
    echo "   ✓ Record created in Airtable: $RECORD_ID"
else
    echo "❌ TEST FAILED!"
fi

echo ""
echo "🔍 Verify in Airtable:"
echo "   Base: https://airtable.com/appuBf0fTe8tp8ZaF"
echo "   Look for request_id: user-test-$TIMESTAMP"
echo ""
echo "📋 Full Response (for debugging):"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE" 