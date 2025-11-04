#!/bin/bash

# Load DATABASE_URL from .env.local
export $(grep "^DATABASE_URL=" .env.local | xargs)

# Run the migration
psql "$DATABASE_URL" -f MIGRATION-SQL-CLEAN.sql

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next step: Test the sync!"

