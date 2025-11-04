#!/bin/bash

# Test Kajabi API Access
# This script tests your Kajabi API credentials and explores available endpoints

# Load environment variables
set -a
source "$(dirname "$0")/../.env"
set +a

echo "🔍 Testing Kajabi API Access..."
echo "================================"
echo ""

# Test 1: Check API Health / Base URL
echo "Test 1: Testing API connectivity..."
curl -s -X GET "https://api.kajabi.com/v1" \
  -H "Authorization: Bearer ${KAJABI_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq . || echo "❌ Failed"

echo ""
echo "Test 2: List Form Submissions (last 5)..."
curl -s -X GET "https://api.kajabi.com/v1/form_submissions?page[limit]=5" \
  -H "Authorization: Bearer ${KAJABI_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq . || echo "❌ Failed"

echo ""
echo "Test 3: List Members/Contacts (last 5)..."
curl -s -X GET "https://api.kajabi.com/v1/members?page[limit]=5" \
  -H "Authorization: Bearer ${KAJABI_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq . || echo "❌ Failed"

echo ""
echo "Test 4: List Forms..."
curl -s -X GET "https://api.kajabi.com/v1/forms?page[limit]=5" \
  -H "Authorization: Bearer ${KAJABI_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq . || echo "❌ Failed"

echo ""
echo "Test 5: Get a specific form submission (with created_after filter)..."
FIVE_MIN_AGO=$(date -u -v-5M +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '5 minutes ago' +"%Y-%m-%dT%H:%M:%SZ")
curl -s -X GET "https://api.kajabi.com/v1/form_submissions?filter[created_after]=${FIVE_MIN_AGO}&page[limit]=10" \
  -H "Authorization: Bearer ${KAJABI_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq . || echo "❌ Failed"

echo ""
echo "✅ API Tests Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the JSON responses above"
echo "2. Verify form_submissions endpoint is available"
echo "3. Check if 'created_after' filter works for polling"
echo "4. Confirm form_id is included in submissions"




