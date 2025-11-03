#!/bin/bash
# UYSP Webhook Test Script
# Use this to test your webhook workflow

# Configuration
WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook-test/kajabi-leads"
API_KEY="your-test-api-key"  # Replace with your test key

# Test Payloads
echo "🧪 Testing UYSP Webhook Workflow..."
echo "================================"

# Test 1: Basic credential test
echo "Test 1: Basic Credential Test"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "email": "credential-test@example.com",
    "name": "Credential Test",
    "phone": "555-0001",
    "company": "Test Corp"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n--------------------------------"

# Test 2: Field variation test (ALL CAPS)
echo "Test 2: Field Variation Test (ALL CAPS)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "EMAIL": "caps-test@example.com",
    "NAME": "CAPS TEST",
    "PHONE": "555-0002",
    "COMPANY": "CAPS CORP"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n--------------------------------"

# Test 3: Boolean field test
echo "Test 3: Boolean Field Test"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "email": "boolean-test@example.com",
    "name": "Boolean Test",
    "interested_in_coaching": "yes",
    "qualified_lead": true,
    "contacted": "1"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n================================"
echo "✅ Tests Complete!"
echo ""
echo "Now check in n8n:"
echo "1. Execution history for any errors"
echo "2. Airtable for created records"
echo "3. Field_Mapping_Log for unknown fields"
