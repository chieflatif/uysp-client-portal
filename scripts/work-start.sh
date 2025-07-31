#!/bin/bash

# UYSP Work Session Startup
# Run this when you start working to ensure fresh backups and system status

set -e

echo "🚀 UYSP Work Session Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Auto-backup check
echo "🔸 Step 1: Backup Protection Check"
./scripts/auto-backup.sh

echo ""
echo "🔸 Step 2: System Status Check"

# Check Git status
echo "📊 Git Status:"
UNSTAGED=$(git status --porcelain 2>/dev/null | wc -l)
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "  - Current branch: $BRANCH"
echo "  - Unstaged changes: $UNSTAGED files"

if [ "$UNSTAGED" -gt 0 ]; then
    echo "  ⚠️ You have unstaged changes - consider committing before major work"
else
    echo "  ✅ Working directory clean"
fi

# Check n8n workflow count
echo ""
echo "📊 Available Commands:"
echo "  - npm run real-backup      → Force fresh backup"
echo "  - npm run auto-backup      → Smart backup (4h interval)"
echo "  - npm run schema-backup    → Airtable schemas only"
echo "  - npm run position-main    → Position main workflow"
echo "  - npm run test-all         → Run comprehensive tests"

echo ""
echo "📊 Quick Access:"
echo "  - Workflow backups: ls workflows/backups/"
echo "  - Schema backups: ls data/schemas/"
echo "  - Test results: ls tests/results/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Work session initialized!"
echo "🎯 Your work is protected with automated backups"
echo "🎯 Next auto-backup in: 4 hours (or manual with npm run real-backup)"