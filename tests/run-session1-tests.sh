#!/bin/bash

# UYSP Session 1 Test Suite
# This script runs all required tests for Session 1 completion

WEBHOOK_URL="https://app.n8n.io/webhook/kajabi-leads"
API_KEY="test-key-replace-with-actual"

echo "=== UYSP Session 1 Test Suite ==="
echo "Webhook URL: $WEBHOOK_URL"
echo "Starting tests..."
echo ""

# Test 1: High-value lead
echo "Test 1: High-value lead"
echo "Expected: Record created in Airtable, test_mode=true"
curl -X POST "$WEBHOOK_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @high-value-lead.json \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

sleep 2

# Test 2: Duplicate prevention
echo "Test 2: Duplicate prevention" 
echo "Expected: No duplicate created (same request_id)"
curl -X POST "$WEBHOOK_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @duplicate-prevention.json \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

sleep 2

# Test 3: Test mode verification
echo "Test 3: Test mode verification"
echo "Expected: No real API calls made"
curl -X POST "$WEBHOOK_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @test-mode-verification.json \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

sleep 2

# Test 4: Daily costs initialization
echo "Test 4: Daily costs initialization"
echo "Expected: Daily_Costs record created/updated"
curl -X POST "$WEBHOOK_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @daily-costs-init.json \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n\n"

echo "=== Test Suite Complete ==="
echo ""
echo "Next Steps:"
echo "1. Check Airtable People table for 4 test records"
echo "2. Verify test_mode_record is checked for all"
echo "3. Confirm no duplicates were created"
echo "4. Check Daily_Costs table has today's record"
echo ""
echo "If all tests passed with 200 OK status, Session 1 is complete!"
