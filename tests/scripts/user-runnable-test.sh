#!/bin/bash

# User-Runnable UYSP Field Normalization Test
# Run this yourself to verify the system is working

echo "🧪 UYSP Field Normalization Test - User Edition"
echo "=============================================="
echo ""

WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
TIMESTAMP=$(date +%s)

echo "📋 Test Scenarios:"
echo "1. Standard fields (email, name, phone, company)"
echo "2. ALL CAPS fields (EMAIL, NAME, PHONE)" 
echo "3. Alternative names (email_address, phone_number)"
echo "4. CamelCase fields (emailAddress, firstName)"
echo ""

# Test 1: Standard fields
echo "🔄 TEST 1: Standard Kajabi Format"
echo "Payload: standard fields..."
RESPONSE1=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test-standard-$TIMESTAMP@example.com\",
    \"name\": \"John Standard\",
    \"phone\": \"555-0001\",
    \"company\": \"Standard Corp\",
    \"request_id\": \"test-1-$TIMESTAMP\"
  }")

echo "✅ Response received"
echo "📊 Record ID: $(echo "$RESPONSE1" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
echo "📊 Success: $(echo "$RESPONSE1" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo ""

# Test 2: ALL CAPS
echo "🔄 TEST 2: ALL CAPS Fields"
echo "Payload: EMAIL, NAME, PHONE..."
RESPONSE2=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"EMAIL\": \"test-caps-$TIMESTAMP@example.com\",
    \"NAME\": \"Jane CAPS\",
    \"PHONE\": \"555-0002\",
    \"COMPANY\": \"CAPS CORP\",
    \"request_id\": \"test-2-$TIMESTAMP\"
  }")

echo "✅ Response received"
echo "📊 Record ID: $(echo "$RESPONSE2" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
echo "📊 Success: $(echo "$RESPONSE2" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo ""

# Test 3: Alternative field names
echo "🔄 TEST 3: Alternative Field Names"
echo "Payload: email_address, phone_number..."
RESPONSE3=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"email_address\": \"test-alt-$TIMESTAMP@example.com\",
    \"first_name\": \"Charlie\",
    \"last_name\": \"Alternative\",
    \"phone_number\": \"555-0003\",
    \"company_name\": \"Alt Corp\",
    \"request_id\": \"test-3-$TIMESTAMP\"
  }")

echo "✅ Response received"
echo "📊 Record ID: $(echo "$RESPONSE3" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
echo "📊 Success: $(echo "$RESPONSE3" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo ""

# Test 4: CamelCase
echo "🔄 TEST 4: CamelCase Fields"
echo "Payload: emailAddress, firstName..."
RESPONSE4=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"emailAddress\": \"test-camel-$TIMESTAMP@example.com\",
    \"firstName\": \"David\",
    \"lastName\": \"CamelCase\",
    \"phoneNumber\": \"555-0004\",
    \"companyName\": \"CamelCorp\",
    \"request_id\": \"test-4-$TIMESTAMP\"
  }")

echo "✅ Response received"
echo "📊 Record ID: $(echo "$RESPONSE4" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
echo "📊 Success: $(echo "$RESPONSE4" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo ""

echo "🎯 SUMMARY:"
echo "=========="
echo "Test 1 (Standard): $(echo "$RESPONSE1" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo "Test 2 (ALL CAPS): $(echo "$RESPONSE2" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo "Test 3 (Alternative): $(echo "$RESPONSE3" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo "Test 4 (CamelCase): $(echo "$RESPONSE4" | grep -o '"success":[^,]*' | cut -d':' -f2)"
echo ""

echo "🔍 To verify in Airtable:"
echo "1. Go to your Airtable base: https://airtable.com/appuBf0fTe8tp8ZaF"
echo "2. Check the Leads table for records with request_id containing: $TIMESTAMP"
echo "3. Verify field mapping worked correctly"
echo ""

echo "📝 Full Response Details:"
echo "========================"
echo ""
echo "TEST 1 RESPONSE:"
echo "$RESPONSE1" | jq . 2>/dev/null || echo "$RESPONSE1"
echo ""
echo "TEST 2 RESPONSE:"
echo "$RESPONSE2" | jq . 2>/dev/null || echo "$RESPONSE2"
echo ""
echo "TEST 3 RESPONSE:"
echo "$RESPONSE3" | jq . 2>/dev/null || echo "$RESPONSE3"
echo ""
echo "TEST 4 RESPONSE:"
echo "$RESPONSE4" | jq . 2>/dev/null || echo "$RESPONSE4"
echo ""

echo "✅ Test complete! Check the responses above and verify in Airtable." 