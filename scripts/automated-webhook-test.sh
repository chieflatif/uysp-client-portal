#!/bin/bash
# UYSP Automated Webhook Test Script - NO MANUAL BULLSHIT
# This uses the ACTUAL webhook URLs and API key from your workflow

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration from your ACTUAL workflow
TEST_URL="https://rebelhq.app.n8n.cloud/webhook-test/kajabi-leads"
PROD_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg"

echo -e "${GREEN}🚀 UYSP Webhook Automated Test${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Testing webhooks in n8n requires ONE step:${NC}"
echo -e "${YELLOW}1. In n8n UI, click 'Execute Workflow' button${NC}"
echo -e "${YELLOW}2. Then run this script${NC}"
echo ""
echo "Press ENTER when you've clicked 'Execute Workflow' in n8n..."
read

# Test 1: Basic test to check credentials
echo -e "\n${GREEN}Test 1: Basic Credential Test${NC}"
echo "Testing webhook at: $TEST_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$TEST_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "email": "credential-test@example.com",
    "name": "Credential Test",
    "phone": "555-0001",
    "company": "Test Corp"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS: HTTP $HTTP_CODE${NC}"
    echo "Response: $BODY"
    echo ""
    echo -e "${GREEN}Webhook is working! Now check:${NC}"
    echo "1. n8n execution history - any auth errors?"
    echo "2. Airtable - was record created?"
else
    echo -e "${RED}❌ FAILED: HTTP $HTTP_CODE${NC}"
    echo "Response: $BODY"
    echo ""
    echo "Common issues:"
    echo "- Did you click 'Execute Workflow' first?"
    echo "- Is the workflow active?"
    echo "- Check the API key matches"
fi

echo ""
echo "================================"
echo ""
echo "Want to test more payloads? The webhook is now closed."
echo "You need to click 'Execute Workflow' again for each test."
echo ""
echo -e "${YELLOW}For PRODUCTION testing (no Execute button needed):${NC}"
echo "Change TEST_URL to PROD_URL in this script"
