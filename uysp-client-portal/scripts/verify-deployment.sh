#!/bin/bash

# Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh <URL> <EXPECTED_PRIMARY_MODEL>
# Example: ./scripts/verify-deployment.sh https://uysp-portal-v2.onrender.com gpt-4o

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}❌ Error: Missing arguments${NC}"
    echo "Usage: $0 <URL> <EXPECTED_PRIMARY_MODEL>"
    echo "Example: $0 https://uysp-portal-v2.onrender.com gpt-4o"
    exit 1
fi

URL="$1"
EXPECTED_MODEL="$2"
HEALTH_ENDPOINT="${URL}/api/health"

echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
echo "URL: $URL"
echo "Expected PRIMARY_MODEL: $EXPECTED_MODEL"
echo ""

# Call health endpoint
echo -e "${YELLOW}📡 Calling health endpoint...${NC}"
RESPONSE=$(curl -s "$HEALTH_ENDPOINT")

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to reach health endpoint${NC}"
    exit 1
fi

# Parse response
ACTUAL_MODEL=$(echo "$RESPONSE" | grep -o '"model":"[^"]*"' | head -1 | cut -d'"' -f4)
BUILD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
PRIMARY_KEY_SET=$(echo "$RESPONSE" | grep -o '"keyConfigured":[^,}]*' | head -1 | cut -d':' -f2)
FALLBACK_KEY_SET=$(echo "$RESPONSE" | grep -o '"keyConfigured":[^,}]*' | tail -1 | cut -d':' -f2)

echo -e "${GREEN}✅ Health endpoint responded${NC}"
echo "Build ID: $BUILD_ID"
echo "Actual PRIMARY_MODEL: $ACTUAL_MODEL"
echo "Primary API key configured: $PRIMARY_KEY_SET"
echo "Fallback API key configured: $FALLBACK_KEY_SET"
echo ""

# Verify model
if [ "$ACTUAL_MODEL" = "$EXPECTED_MODEL" ]; then
    echo -e "${GREEN}✅ VERIFICATION PASSED${NC}"
    echo "Deployed model matches expected model: $EXPECTED_MODEL"
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo "Expected: $EXPECTED_MODEL"
    echo "Got: $ACTUAL_MODEL"
    echo ""
    echo "This indicates Next.js is serving stale compiled code."
    echo "Run a manual redeploy with cache clear:"
    echo "render deploys create srv-d3r7o1u3jp1c73943qp0 --clear-cache --wait --confirm -o text"
    exit 1
fi
