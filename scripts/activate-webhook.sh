#!/bin/bash

# Automated Webhook Activation Script - Tests All Auth Methods
echo "🔐 WEBHOOK AUTH DEBUGGING - Phase 00"
echo "===================================="

WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg"

# Test data
EMAIL="auth-test-$(date +%s)@example.com"
PAYLOAD="{\"email\": \"$EMAIL\", \"name\": \"Auth Test\", \"phone\": \"415-555-0001\"}"

echo "📧 Test Email: $EMAIL"
echo ""

# Test 1: No Auth
echo "🧪 Test 1: No Authentication"
RESPONSE1=$(curl -s -w "STATUS:%{http_code}" -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d "$PAYLOAD")
echo "Result: $RESPONSE1"
echo ""

# Test 2: X-API-Key Header  
echo "🧪 Test 2: X-API-Key Header"
RESPONSE2=$(curl -s -w "STATUS:%{http_code}" -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -H "X-API-Key: $TOKEN" -d "$PAYLOAD")
echo "Result: $RESPONSE2"
echo ""

# Test 3: Authorization Bearer
echo "🧪 Test 3: Authorization Bearer"
RESPONSE3=$(curl -s -w "STATUS:%{http_code}" -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$PAYLOAD")
echo "Result: $RESPONSE3"
echo ""

# Test 4: Authorization Basic (encoded)
echo "🧪 Test 4: Authorization Basic"
BASIC_AUTH=$(echo -n ":$TOKEN" | base64)
RESPONSE4=$(curl -s -w "STATUS:%{http_code}" -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -H "Authorization: Basic $BASIC_AUTH" -d "$PAYLOAD")
echo "Result: $RESPONSE4"
echo ""

# Analysis
echo "📊 ANALYSIS:"
if echo "$RESPONSE1" | grep -q "STATUS:200\|STATUS:201"; then
    echo "✅ SUCCESS: No auth needed - webhook open"
elif echo "$RESPONSE2" | grep -q "STATUS:200\|STATUS:201"; then
    echo "✅ SUCCESS: X-API-Key header works"
elif echo "$RESPONSE3" | grep -q "STATUS:200\|STATUS:201"; then
    echo "✅ SUCCESS: Bearer token works"  
elif echo "$RESPONSE4" | grep -q "STATUS:200\|STATUS:201"; then
    echo "✅ SUCCESS: Basic auth works"
else
    echo "❌ ALL TESTS FAILED - Manual UI fix required"
    echo "💡 Solution: Change webhook auth to 'None' in n8n UI"
fi 