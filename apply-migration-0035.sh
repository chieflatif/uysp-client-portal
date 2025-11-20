#!/bin/bash
set -euo pipefail

# Apply migration 0035 to fix missing password setup token columns
# This script applies the migration to add columns that the Drizzle schema expects

echo "🔧 Applying Migration 0035: Fix Missing Password Setup Token Columns"
echo "======================================================================"

# Allow overrides, but fall back to staging database
DATABASE_URL="${DATABASE_URL:-postgresql://uysp_client_portal_db_user:PuLMS841kifvBNpl3mGcLBl1WjIs0ey2@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com/uysp_client_portal_db}"
MIGRATION_DIR="src/lib/db/migrations"
MIGRATION_FILE="${MIGRATION_FILE:-$MIGRATION_DIR/0035_fix_missing_password_setup_token_columns.sql}"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Check if psql is available
if ! command -v psql >/dev/null 2>&1; then
    echo "❌ psql not found. Install it with: brew install postgresql"
    exit 1
fi

echo "📝 Applying migration from $MIGRATION_FILE ..."
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

echo "✅ Migration applied successfully!"
echo ""
echo "🔍 Verifying columns exist..."
psql "$DATABASE_URL" -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'users'
    AND column_name IN ('must_change_password', 'password_setup_token', 'password_setup_token_expiry')
  ORDER BY column_name;
"
