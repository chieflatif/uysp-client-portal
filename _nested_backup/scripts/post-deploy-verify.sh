#!/bin/bash

###############################################################################
# POST-DEPLOYMENT VERIFICATION SCRIPT
#
# Purpose: Verify production deployment is working correctly
# When: Run this AFTER Render deployment completes (wait 3-5 minutes)
# Requirements: DATABASE_URL set to PRODUCTION database
#
# Usage: ./scripts/post-deploy-verify.sh
###############################################################################

set -e

echo "=============================================="
echo "🚀 POST-DEPLOYMENT VERIFICATION"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FAILED=0

print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    FAILED=$((FAILED + 1))
  fi
}

# Get production URL (default to Render URL)
PROD_URL="${PRODUCTION_URL:-https://uysp-portal-v2.onrender.com}"
echo -e "${BLUE}Testing production: $PROD_URL${NC}"
echo ""

echo "📋 Step 1: Production Database Check"
echo "---------------------------------------------"

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  echo "This should be your PRODUCTION database URL"
  echo "Export it: export DATABASE_URL='your-production-db-url'"
  exit 1
fi

# Verify it's production (check domain)
if echo "$DATABASE_URL" | grep -q "localhost"; then
  echo -e "${YELLOW}⚠️  WARNING: DATABASE_URL appears to be localhost${NC}"
  echo "Are you sure this is production?"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check critical tables exist in production
TABLES=("users" "leads" "user_activity_logs" "user_activity_sessions" "user_activity_summary")

for table in "${TABLES[@]}"; do
  if psql "$DATABASE_URL" -t -c "SELECT to_regclass('public.$table');" | grep -q "$table"; then
    print_result 0 "Production table '$table' exists"
  else
    print_result 1 "Production table '$table' MISSING"
  fi
done

echo ""
echo "📋 Step 2: Database Table Schema Verification"
echo "---------------------------------------------"

# Check user_activity_logs has correct columns
ACTIVITY_COLS=$(psql "$DATABASE_URL" -t -c "\d user_activity_logs" 2>/dev/null | grep -E "user_id|event_type|session_id" | wc -l)
if [ "$ACTIVITY_COLS" -ge 3 ]; then
  print_result 0 "user_activity_logs has correct schema"
else
  print_result 1 "user_activity_logs schema may be incorrect"
fi

# Check user_activity_sessions exists (not old user_sessions)
if psql "$DATABASE_URL" -t -c "SELECT to_regclass('public.user_activity_sessions');" | grep -q "user_activity_sessions"; then
  print_result 0 "user_activity_sessions table exists (correct name)"
else
  print_result 1 "user_activity_sessions table MISSING"
fi

echo ""
echo "📋 Step 3: Production Site Availability"
echo "---------------------------------------------"

# Test if site is up
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
  print_result 0 "Production site is accessible (HTTP $HTTP_CODE)"
else
  print_result 1 "Production site returned HTTP $HTTP_CODE"
fi

echo ""
echo "📋 Step 4: Test Activity Tracking Endpoint"
echo "---------------------------------------------"

# Test the tracking endpoint (will fail auth but should return 401, not 500)
TRACK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test","pageUrl":"/test"}' || echo "000")

if [ "$TRACK_RESPONSE" = "401" ]; then
  print_result 0 "Tracking API responds correctly (401 Unauthorized as expected)"
elif [ "$TRACK_RESPONSE" = "200" ]; then
  print_result 1 "Tracking API returned 200 without auth (security issue?)"
else
  print_result 1 "Tracking API returned unexpected code: $TRACK_RESPONSE"
fi

echo ""
echo "📋 Step 5: Recent Activity Data Check"
echo "---------------------------------------------"

# Check if there's any recent activity (last 24 hours)
RECENT_ACTIVITY=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM user_activity_logs WHERE created_at > NOW() - INTERVAL '24 hours';" 2>/dev/null || echo "ERROR")

if [ "$RECENT_ACTIVITY" = "ERROR" ]; then
  print_result 1 "Cannot query user_activity_logs"
elif [ "$RECENT_ACTIVITY" -gt 0 ]; then
  print_result 0 "Found $RECENT_ACTIVITY activity events in last 24 hours"

  # Show sample of recent activity
  echo ""
  echo "Recent activity sample:"
  psql "$DATABASE_URL" -c "SELECT event_type, page_url, created_at FROM user_activity_logs ORDER BY created_at DESC LIMIT 5;" 2>/dev/null || echo "Could not fetch sample"
else
  echo -e "${YELLOW}⚠️  No activity in last 24 hours${NC}"
  echo "   This is normal if tracking was just deployed"
  echo "   Have someone browse the site as an authenticated user to test"
fi

# Check session data
RECENT_SESSIONS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM user_activity_sessions WHERE session_start > NOW() - INTERVAL '24 hours';" 2>/dev/null || echo "ERROR")

if [ "$RECENT_SESSIONS" = "ERROR" ]; then
  print_result 1 "Cannot query user_activity_sessions"
elif [ "$RECENT_SESSIONS" -gt 0 ]; then
  print_result 0 "Found $RECENT_SESSIONS active sessions in last 24 hours"
else
  echo -e "${YELLOW}⚠️  No sessions in last 24 hours${NC}"
fi

echo ""
echo "📋 Step 6: Check Production Logs"
echo "---------------------------------------------"

echo -e "${BLUE}Render deployment logs:${NC}"
echo "Visit: https://dashboard.render.com/web/[your-service-id]/logs"
echo ""
echo "Look for:"
echo "  - Build completed successfully"
echo "  - No TypeScript errors"
echo "  - No database connection errors"
echo "  - Server started on port 3000 (or configured port)"

echo ""
echo "=============================================="
echo "📊 VERIFICATION SUMMARY"
echo "=============================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Production deployment is healthy!"
  echo ""
  echo "Next steps:"
  echo "1. Log in as a regular user and browse around"
  echo "2. Log in as SUPER_ADMIN and check User Activity dashboard"
  echo "3. Verify activity events appear within seconds"
  exit 0
else
  echo -e "${RED}❌ $FAILED CHECK(S) FAILED${NC}"
  echo ""
  echo "Production deployment has issues!"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check Render deployment logs for errors"
  echo "2. Verify migrations were applied: ./scripts/apply-migrations.sh"
  echo "3. Check if tables exist: psql \$DATABASE_URL -c '\\dt'"
  echo "4. Review API errors in production logs"
  exit 1
fi
