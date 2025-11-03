#!/bin/bash

###############################################################################
# APPLY DATABASE MIGRATIONS
#
# Purpose: Apply all SQL migrations to the database
# When: Run this before deploying if you have new migrations
# Requirements: DATABASE_URL set
#
# Usage: ./scripts/apply-migrations.sh
#        ./scripts/apply-migrations.sh specific-migration.sql
###############################################################################

set -e

echo "=============================================="
echo "📦 DATABASE MIGRATION TOOL"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  echo "Export it: export DATABASE_URL='your-connection-string'"
  exit 1
fi

echo -e "${GREEN}✅ Connected to database${NC}"
echo ""

# Specific migration file provided
if [ ! -z "$1" ]; then
  MIGRATION_FILE="migrations/$1"

  if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
  fi

  echo "Applying single migration: $MIGRATION_FILE"
  echo "---------------------------------------------"
  psql "$DATABASE_URL" -f "$MIGRATION_FILE"

  echo ""
  echo -e "${GREEN}✅ Migration applied successfully${NC}"
  exit 0
fi

# Apply all migrations
if [ ! -d "migrations" ]; then
  echo -e "${RED}❌ migrations/ directory not found${NC}"
  exit 1
fi

MIGRATION_FILES=$(ls migrations/*.sql 2>/dev/null | sort)

if [ -z "$MIGRATION_FILES" ]; then
  echo -e "${YELLOW}⚠️  No migration files found${NC}"
  exit 0
fi

echo "Found migrations:"
echo "$MIGRATION_FILES" | while read file; do
  echo "  - $(basename $file)"
done
echo ""

echo -e "${YELLOW}⚠️  This will apply ALL migrations to the database${NC}"
echo "Database: $(echo $DATABASE_URL | sed 's/@.*/@***/')"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted"
  exit 1
fi

echo ""
echo "Applying migrations..."
echo "---------------------------------------------"

APPLIED=0
FAILED=0

for migration in $MIGRATION_FILES; do
  echo ""
  echo "Applying: $(basename $migration)"

  if psql "$DATABASE_URL" -f "$migration" 2>&1; then
    echo -e "${GREEN}✅ Success${NC}"
    APPLIED=$((APPLIED + 1))
  else
    echo -e "${RED}❌ Failed${NC}"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "=============================================="
echo "📊 MIGRATION SUMMARY"
echo "=============================================="
echo "Applied: $APPLIED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All migrations applied successfully${NC}"

  echo ""
  echo "Verifying tables..."
  psql "$DATABASE_URL" -c "\dt" | grep -E "user_activity|leads|users"

  exit 0
else
  echo -e "${RED}❌ Some migrations failed${NC}"
  echo "Review errors above and fix before deploying"
  exit 1
fi
