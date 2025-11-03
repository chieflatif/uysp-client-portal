#!/bin/bash

# PDL Phase 2 Person API Testing Script
# Tests all 3 PDL test payloads against live workflow

set -e

WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
TEST_DIR="/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/tests"
RESULTS_DIR="$TEST_DIR/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🧪 PHASE 2 PDL PERSON API TESTING"
echo "Timestamp: $TIMESTAMP"
echo "Webhook: $WEBHOOK_URL"
echo "Results: $RESULTS_DIR"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Test 1: Sales Executive (Expected: High PDL score)
echo "📋 Test 1: Sales Executive (sarah.johnson@salesforce.com)"
echo "Expected: PDL person score 70+, sales role detection true"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @"$TEST_DIR/payloads/PDL001-sales-executive.json" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  > "$RESULTS_DIR/PDL001-sales-exec-$TIMESTAMP.log" 2>&1

echo "✅ Test 1 completed. Waiting 5 seconds for processing..."
sleep 5

# Test 2: Tech Professional (Expected: Medium PDL score)  
echo "📋 Test 2: Tech Professional (mchen@microsoft.com)"
echo "Expected: PDL person score 40-60, sales role detection false"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @"$TEST_DIR/payloads/PDL002-tech-professional.json" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  > "$RESULTS_DIR/PDL002-tech-prof-$TIMESTAMP.log" 2>&1

echo "✅ Test 2 completed. Waiting 5 seconds for processing..."
sleep 5

# Test 3: Non-Sales Role (Expected: Lower PDL score)
echo "📋 Test 3: Non-Sales Role (emma.davis@university.edu)"  
echo "Expected: PDL person score 20-40, sales role detection false"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @"$TEST_DIR/payloads/PDL003-non-sales.json" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  > "$RESULTS_DIR/PDL003-non-sales-$TIMESTAMP.log" 2>&1

echo "✅ Test 3 completed. Waiting 10 seconds for final processing..."
sleep 10

echo ""
echo "🎯 PDL PHASE 2 TESTING COMPLETE"
echo "Results stored in: $RESULTS_DIR"
echo "Next: Verify Airtable records and PDL field population"
echo "Expected costs: 3 x $0.03 = $0.09 total"
echo ""
echo "Manual verification steps:"
echo "1. Check Airtable People table for 3 new PDL test records"
echo "2. Verify PDL fields populated (pdl_job_title, pdl_person_score, etc.)"
echo "3. Confirm cost tracking: pdl_person_cost = 0.03 per record"
echo "4. Validate sales role detection accuracy"
echo ""