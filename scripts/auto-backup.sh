#!/bin/bash

# UYSP Auto-Backup System
# Simple automated backup with intelligent scheduling
# Runs every time you start work to ensure fresh backups

set -e

BACKUP_DIR="./workflows/backups"
SCHEMAS_DIR="./data/schemas"
LAST_BACKUP_FILE="./.backup_tracker"

echo "🔄 Auto-Backup System Starting..."

# Check when last backup was made
if [ -f "$LAST_BACKUP_FILE" ]; then
    LAST_BACKUP=$(cat "$LAST_BACKUP_FILE")
    LAST_BACKUP_DATE=$(date -d "$LAST_BACKUP" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$LAST_BACKUP" +%s 2>/dev/null || echo "0")
    CURRENT_DATE=$(date +%s)
    HOURS_SINCE=$((($CURRENT_DATE - $LAST_BACKUP_DATE) / 3600))
else
    HOURS_SINCE=999
    echo "📅 No previous backup found"
fi

echo "⏰ Hours since last backup: $HOURS_SINCE"

# Backup if it's been more than 4 hours OR if no recent backups exist
MIN_HOURS=4
# New pattern: priority-labeled exports, with fallback to old WORKING pattern
RECENT_BACKUPS=$(find "$BACKUP_DIR" \( -name "PRIORITY-1-PRIMARY-*.json" -o -name "PRIORITY-2-SECONDARY-*.json" -o -name "uysp-lead-processing-WORKING-*.json" \) -mtime -1 2>/dev/null | wc -l || echo "0")

if [ "$HOURS_SINCE" -gt "$MIN_HOURS" ] || [ "$RECENT_BACKUPS" -eq "0" ]; then
    echo "🚀 Creating fresh backup (${HOURS_SINCE}h since last backup)"
    
    # Run real backup
    ./scripts/real-n8n-export.sh
    
    # Update backup tracker
    date "+%Y-%m-%d %H:%M:%S" > "$LAST_BACKUP_FILE"
    
    echo "✅ Auto-backup completed successfully"
    echo "📅 Next backup due in ${MIN_HOURS} hours"
    
    # Cleanup old backups (keep last 10 of each pattern)
    echo "🧹 Cleaning up old backups..."
    cd "$BACKUP_DIR"
    ls -t PRIORITY-1-PRIMARY-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t PRIORITY-2-SECONDARY-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t uysp-lead-processing-WORKING-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    cd - > /dev/null
    
    # Cleanup old schemas (keep last 10)
    cd "$SCHEMAS_DIR"
    ls -t airtable-enhanced-schema-*.json | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t recovery-instructions-*.md | tail -n +11 | xargs rm -f 2>/dev/null || true
    cd - > /dev/null
    
    echo "🗑️ Cleanup completed (keeping 10 most recent backups)"
    
else
    echo "⏭️ Skipping backup (recent backup exists, ${HOURS_SINCE}h ago)"
    echo "📁 Recent backups available:"
    find "$BACKUP_DIR" -name "uysp-lead-processing-WORKING-*.json" -mtime -1 -exec basename {} \; | head -3
fi

# Display backup status
echo ""
echo "📊 BACKUP STATUS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Total workflow backups: $(find "$BACKUP_DIR" \( -name "PRIORITY-1-PRIMARY-*.json" -o -name "PRIORITY-2-SECONDARY-*.json" -o -name "uysp-lead-processing-WORKING-*.json" \) | wc -l)"
echo "📁 Total schema backups: $(find "$SCHEMAS_DIR" -name "airtable-enhanced-schema-*.json" | wc -l)"
echo "📅 Last backup: $(ls -t "$BACKUP_DIR"/PRIORITY-1-PRIMARY-*.json "$BACKUP_DIR"/PRIORITY-2-SECONDARY-*.json "$BACKUP_DIR"/uysp-lead-processing-WORKING-*.json 2>/dev/null | head -1 | xargs stat -f %Sm 2>/dev/null || ls -lt "$BACKUP_DIR"/PRIORITY-1-PRIMARY-*.json "$BACKUP_DIR"/PRIORITY-2-SECONDARY-*.json "$BACKUP_DIR"/uysp-lead-processing-WORKING-*.json 2>/dev/null | head -1 | awk '{print $6, $7, $8}' || echo 'No backups found')"
echo "☁️ GitHub sync: $(git status --porcelain 2>/dev/null | wc -l | awk '{if($1==0) print "✅ Synced"; else print "⚠️ Pending"}')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Quick integrity check
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/PRIORITY-1-PRIMARY-*.json "$BACKUP_DIR"/PRIORITY-2-SECONDARY-*.json "$BACKUP_DIR"/uysp-lead-processing-WORKING-*.json 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
    SIZE=$(wc -c < "$LATEST_BACKUP")
    if [ "$SIZE" -gt 50000 ]; then
        echo "✅ Latest backup integrity: GOOD (${SIZE} bytes)"
    else
        echo "⚠️ Latest backup integrity: SUSPICIOUS (${SIZE} bytes - too small)"
    fi
fi

echo ""
echo "🎯 To manually force backup: npm run real-backup"
echo "🎯 To view backup history: ls -la workflows/backups/"