#!/bin/bash

# UYSP Portal - Database Migration Runner
# Run this script to apply the latest migrations to production

set -e  # Exit on error

echo "🔄 UYSP Portal - Database Migration"
echo "===================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  echo ""
  echo "To run migrations, you need to:"
  echo "1. Get DATABASE_URL from Render dashboard"
  echo "2. Run: export DATABASE_URL='postgresql://...'"
  echo "3. Run this script again"
  exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Show current migration status
echo "📊 Current Migration Status:"
echo "----------------------------"
npm run db:migrate || true
echo ""

# Confirm before proceeding
read -p "⚠️  Apply pending migrations? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "🚀 Applying migrations..."
echo ""

# Run migrations
npm run db:migrate

echo ""
echo "✅ Migration complete!"
echo ""
echo "🔍 Verify the migration:"
echo "   1. Check Render logs for any errors"
echo "   2. Test sync queue: https://uysp-portal-v2.onrender.com/api/admin/sync-queue"
echo ""
