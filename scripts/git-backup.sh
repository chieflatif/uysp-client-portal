#!/bin/bash

# UYSP Git Backup Script
# Creates automated backup branches with project state

set -e  # Exit on any error

# Configuration
DATE=$(date +%Y%m%d-%H%M%S)
BRANCH="backup/$DATE"
CURRENT_BRANCH=$(git branch --show-current)

echo "🔄 Starting UYSP Git Backup..."
echo "🧪 Running documentation guardrails before backup..."
(
  bash "UYSP Lead Qualification V1/scripts/add-doc-headers.sh" "$(date +%F)"
  bash "UYSP Lead Qualification V1/scripts/validate-docs.sh"
  python3 "UYSP Lead Qualification V1/scripts/check-links.py"
) || { echo "❌ Docs validation failed. Aborting backup."; exit 1; }
echo "📅 Timestamp: $DATE"
echo "🌿 Current branch: $CURRENT_BRANCH"

# Verify we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Verify we're in the UYSP project
if [ ! -f "memory_bank/active_context.md" ]; then
    echo "❌ Error: Not in UYSP project directory"
    exit 1
fi

# Get current project status
if [ -f "memory_bank/active_context.md" ]; then
    PHASE_STATUS=$(grep -o "Phase [0-9][0-9]: [A-Z]*" memory_bank/active_context.md | head -1 || echo "Unknown Phase")
else
    PHASE_STATUS="Unknown Phase"
fi

echo "📊 Project Status: $PHASE_STATUS"

# Create backup branch
echo "🌿 Creating backup branch: $BRANCH"
git checkout -b $BRANCH

# Add all changes (including untracked files)
echo "📦 Adding all project files..."
git add -A

# Count files being backed up
FILE_COUNT=$(git diff --cached --name-only | wc -l)
echo "📁 Files in backup: $FILE_COUNT"

# Create comprehensive backup commit
echo "💾 Creating backup commit..."
git commit -m "backup: Automated backup $DATE

📊 Project Status: $PHASE_STATUS
📁 Files backed up: $FILE_COUNT
🌿 Source branch: $CURRENT_BRANCH

Components included:
- Memory bank state and progress
- All workflow exports and backups
- Pattern files and documentation
- Test results and evidence
- Configuration files
- Schema definitions

Backup created: $(date)"

# Push to remote (if remote exists)
if git remote | grep -q origin; then
    echo "☁️ Pushing backup to remote..."
    git push origin $BRANCH
    echo "✅ Backup pushed to remote: origin/$BRANCH"
else
    echo "⚠️ No remote 'origin' found - backup created locally only"
fi

# Return to original branch
echo "🔄 Returning to original branch: $CURRENT_BRANCH"
git checkout $CURRENT_BRANCH

# Cleanup old backup branches (keep last 30 days)
echo "🧹 Cleaning up old backups..."
THIRTY_DAYS_AGO=$(date -d "30 days ago" +%Y%m%d 2>/dev/null || date -v-30d +%Y%m%d 2>/dev/null || echo "20240101")

OLD_BRANCHES=$(git branch -r | grep "origin/backup/" | grep -E "backup/[0-9]{8}" | while read branch; do
    BRANCH_DATE=$(echo $branch | grep -o "[0-9]\{8\}" | head -1)
    if [ "$BRANCH_DATE" -lt "$THIRTY_DAYS_AGO" ]; then
        echo $branch
    fi
done)

if [ ! -z "$OLD_BRANCHES" ]; then
    echo "🗑️ Found old backups to clean up:"
    echo "$OLD_BRANCHES"
    # Note: Uncomment next lines to actually delete old backups
    # echo "$OLD_BRANCHES" | xargs -I {} git push origin --delete {}
    # echo "✅ Old backups cleaned up"
else
    echo "✅ No old backups to clean up"
fi

# Display backup summary
echo ""
echo "🎉 Backup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Backup ID: $BRANCH"
echo "📊 Project Status: $PHASE_STATUS"
echo "📁 Files backed up: $FILE_COUNT"
echo "🌿 Original branch: $CURRENT_BRANCH"
echo "⏰ Completed: $(date)"
echo ""
echo "To restore this backup:"
echo "git checkout $BRANCH"
echo ""
echo "To list all backups:"
echo "git branch -r | grep backup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 