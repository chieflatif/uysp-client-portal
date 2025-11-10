#!/bin/bash
#
# EMERGENCY MIGRATION: Fix Missing Password Setup Token Columns
# This script applies migration 0035 to fix authentication failure
#
# ROOT CAUSE: Migration 0032 was deleted as "duplicate" but it wasn't
# IMPACT: Production authentication completely broken
# SOLUTION: Re-add the missing columns to users table

set -e  # Exit on error

echo "🚨 EMERGENCY MIGRATION: Fix Authentication Failure"
echo "=================================================="
echo ""
echo "This migration adds missing columns to the users table:"
echo "  - password_setup_token"
echo "  - password_setup_token_expiry"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  echo ""
  echo "Get DATABASE_URL from Render:"
  echo "  https://dashboard.render.com/postgres/dpg-d3q9raodl3ps73bp1r50-a"
  echo ""
  echo "Then run:"
  echo "  export DATABASE_URL='postgresql://...'"
  echo "  ./apply-migration-0035.sh"
  exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Show what will be executed
echo "📄 Migration SQL:"
echo "----------------------------"
cat migrations/0035_fix_missing_password_setup_token_columns.sql | grep -v "^--" | grep -v "^$"
echo ""
echo "----------------------------"
echo ""

# Confirm before proceeding
read -p "⚠️  Apply this migration to PRODUCTION? (yes/NO) " -r
echo ""

if [[ ! $REPLY == "yes" ]]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "🚀 Applying migration..."
echo ""

# Apply migration using psql
psql "$DATABASE_URL" -f migrations/0035_fix_missing_password_setup_token_columns.sql

echo ""
echo "✅ Migration complete!"
echo ""

# Verify the columns were added
echo "🔍 Verifying columns..."
psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE '%password_setup%';"

echo ""
echo "✅ Authentication should now work!"
echo ""
echo "Next steps:"
echo "  1. Test login at https://uysp-portal-v2.onrender.com/login"
echo "  2. Monitor logs: https://dashboard.render.com/web/srv-d3r7o1u3jp1c73943qp0/logs"
echo ""
