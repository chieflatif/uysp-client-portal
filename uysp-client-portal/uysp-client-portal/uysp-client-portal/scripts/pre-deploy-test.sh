#!/bin/bash

###############################################################################
# PRE-DEPLOYMENT VALIDATION SCRIPT
#
# Purpose: Validate ALL changes work correctly BEFORE deploying to production
# When: Run this BEFORE git push
# Requirements: Local dev environment, DATABASE_URL set
#
# Usage: ./scripts/pre-deploy-test.sh
###############################################################################

set -e  # Exit on any error

echo "=============================================="
echo "🔍 PRE-DEPLOYMENT VALIDATION"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    FAILED=$((FAILED + 1))
  fi
}

echo "📋 Step 1: Check Environment"
echo "---------------------------------------------"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  echo "Export it: export DATABASE_URL='your-connection-string'"
  exit 1
fi
print_result 0 "DATABASE_URL is set"

echo ""
echo "📋 Step 2: Database Schema Validation"
echo "---------------------------------------------"

# Check critical tables exist
TABLES=("users" "leads" "user_activity_logs" "user_activity_sessions" "user_activity_summary")

for table in "${TABLES[@]}"; do
  if psql "$DATABASE_URL" -t -c "SELECT to_regclass('public.$table');" | grep -q "$table"; then
    print_result 0 "Table '$table' exists"
  else
    print_result 1 "Table '$table' MISSING"
  fi
done

echo ""
echo "📋 Step 3: Check Recent Migrations"
echo "---------------------------------------------"

# List recent migrations that should be applied
if [ -d "migrations" ]; then
  echo "Recent migration files:"
  ls -lt migrations/*.sql 2>/dev/null | head -5 | awk '{print "  " $9}'

  # Check if user_activity tables have data or are at least empty (means they exist)
  ACTIVITY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM user_activity_logs;" 2>/dev/null || echo "ERROR")
  if [ "$ACTIVITY_COUNT" = "ERROR" ]; then
    print_result 1 "Cannot query user_activity_logs - table may not exist"
  else
    print_result 0 "user_activity_logs table is accessible (rows: $ACTIVITY_COUNT)"
  fi
else
  echo -e "${YELLOW}⚠️  No migrations directory found${NC}"
fi

echo ""
echo "📋 Step 4: TypeScript Type Check"
echo "---------------------------------------------"

if command -v npm &> /dev/null; then
  if npm run type-check &> /dev/null; then
    print_result 0 "TypeScript types are valid"
  else
    echo "Running type check..."
    npm run type-check || true
    print_result 1 "TypeScript errors found"
  fi
else
  echo -e "${YELLOW}⚠️  npm not found - skipping type check${NC}"
fi

echo ""
echo "📋 Step 5: Build Test"
echo "---------------------------------------------"

if command -v npm &> /dev/null; then
  echo "Testing build (this may take a minute)..."
  if npm run build &> /dev/null; then
    print_result 0 "Build succeeds"
  else
    print_result 1 "Build FAILED - fix errors before deploying"
  fi
else
  echo -e "${YELLOW}⚠️  npm not found - skipping build test${NC}"
fi

echo ""
echo "📋 Step 6: Critical API Endpoints Check"
echo "---------------------------------------------"

# Check if critical API route files exist
API_ROUTES=(
  "src/app/api/analytics/track/route.ts"
  "src/app/api/analytics/user-activity/route.ts"
  "src/app/api/analytics/campaigns/route.ts"
)

for route in "${API_ROUTES[@]}"; do
  if [ -f "$route" ]; then
    # Check for common issues in the route
    if grep -q "userSessions" "$route" 2>/dev/null; then
      print_result 1 "$route still uses OLD 'userSessions' (should be 'userActivitySessions')"
    else
      print_result 0 "$(basename $(dirname $route))/$(basename $route) exists and uses correct schema"
    fi
  else
    print_result 1 "$route MISSING"
  fi
done

echo ""
echo "📋 Step 7: Check for Common Mistakes"
echo "---------------------------------------------"

# Check for console.log in production code (should use console.error/debug)
CONSOLE_LOGS=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 10 ]; then
  echo -e "${YELLOW}⚠️  Found $CONSOLE_LOGS console.log statements (consider using proper logging)${NC}"
else
  print_result 0 "Reasonable number of console.log statements ($CONSOLE_LOGS)"
fi

# Check for TODO/FIXME comments
TODO_COUNT=$(grep -r "TODO\|FIXME" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $TODO_COUNT TODO/FIXME comments${NC}"
  grep -r "TODO\|FIXME" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5
fi

echo ""
echo "=============================================="
echo "📊 VALIDATION SUMMARY"
echo "=============================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Safe to deploy:"
  echo "  git push"
  echo ""
  echo "After deployment, run:"
  echo "  ./scripts/post-deploy-verify.sh"
  exit 0
else
  echo -e "${RED}❌ $FAILED CHECK(S) FAILED${NC}"
  echo ""
  echo "DO NOT DEPLOY until all checks pass!"
  echo "Fix the issues above and run this script again."
  exit 1
fi
