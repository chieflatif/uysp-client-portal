#!/bin/bash

# UYSP Git Workflow - Unified Branching & Backup System
# Based on established git-workflow.md patterns + integrated backup system
# Consolidates: git-backup.sh + smart-branch.sh into single approach

set -e

OPERATION="$1"
BRANCH_NAME="$2"
DESCRIPTION="$3"

echo "🌿 UYSP Git Workflow System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Help function - matches our established patterns
show_help() {
    echo "Usage: npm run branch <operation> [branch-name] [description]"
    echo ""
    echo "🔹 BRANCH OPERATIONS:"
    echo "  new <session-X-name> <description>    → Create feature branch with backup"
    echo "  switch <branch-name>                  → Switch with checkpoint backup"
    echo "  backup                                → Create backup branch (from git-backup.sh)"
    echo "  status                                → Show current workflow status"
    echo "  list                                  → List branches with backup info"
    echo ""
    echo "🔹 ESTABLISHED PATTERNS (from docs/git-workflow.md):"
    echo "  Feature branches: feature/session-X-description"
    echo "  Backup branches: backup/YYYYMMDD-HHMM"
    echo "  Hotfix branches: hotfix/description"
    echo ""
    echo "🔹 EXAMPLES:"
    echo "  npm run branch new session-2-compliance 'SMS/TCPA compliance implementation'"
    echo "  npm run branch switch develop"
    echo "  npm run branch backup"
    echo "  npm run branch status"
    echo ""
    echo "🔹 INTEGRATION:"
    echo "  - Pre-branch backup (from git-backup.sh)"
    echo "  - n8n workflow export (from real-n8n-export.sh)"
    echo "  - Follows semantic commit messages"
    echo "  - Maintains existing branch naming conventions"
}

# Get current state
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_TIME=$(date +%Y%m%d_%H%M%S)

# Create new feature branch (follows established patterns)
create_feature_branch() {
    local BRANCH_SUFFIX="$1"
    local DESC="$2"
    
    if [ -z "$BRANCH_SUFFIX" ] || [ -z "$DESC" ]; then
        echo "❌ Error: Branch suffix and description required"
        echo "Usage: npm run branch new <session-X-name> <description>"
        echo "Example: npm run branch new session-2-compliance 'SMS/TCPA compliance'"
        exit 1
    fi
    
    # Follow established naming convention: feature/session-X-description
    local FEATURE_BRANCH="feature/${BRANCH_SUFFIX}"
    
    echo "📋 Creating feature branch: $FEATURE_BRANCH"
    echo "📝 Description: $DESC"
    echo "🌿 Source branch: $CURRENT_BRANCH"
    
    # Step 1: Use existing git-backup.sh for pre-branch backup
    echo ""
    echo "🔸 Step 1: Creating pre-branch backup (using git-backup.sh)..."
    
    # Ensure we're backed up before branching
    ./scripts/git-backup.sh
    
    # Step 2: Create feature branch following established patterns
    echo ""
    echo "🔸 Step 2: Creating feature branch..."
    
    # Ensure we're on develop or main for new feature branches
    if [ "$CURRENT_BRANCH" != "develop" ] && [ "$CURRENT_BRANCH" != "main" ]; then
        echo "⚠️ Warning: Creating feature branch from $CURRENT_BRANCH (not develop/main)"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Cancelled"
            exit 1
        fi
    fi
    
    # Create and switch to new branch
    git checkout -b "$FEATURE_BRANCH"
    
    # Step 3: Create comprehensive backup with new system
    echo ""
    echo "🔸 Step 3: Creating comprehensive workflow backup..."
    ./scripts/real-n8n-export.sh
    
    # Step 4: Create initial commit following established commit message format
    echo ""
    echo "🔸 Step 4: Creating initial commit..."
    
    git add -A
    git commit -m "feat(${BRANCH_SUFFIX}): Initialize ${BRANCH_SUFFIX} branch

📝 Description: $DESC
🌿 Source: $CURRENT_BRANCH
📅 Created: $(date)

🎯 Session Goals:
- $DESC

📦 Initial Setup:
- Branch initialized with comprehensive backup
- n8n workflow export included
- Airtable schema backup included
- Follows established git-workflow.md patterns

Evidence: Pre-branch backup completed
Workflow: Current state exported

🤖 Created by git-workflow.sh (unified system)"
    
    # Push to remote
    if git remote | grep -q origin; then
        git push -u origin "$FEATURE_BRANCH"
        echo "✅ Feature branch pushed to GitHub: $FEATURE_BRANCH"
    fi
    
    echo ""
    echo "🎉 FEATURE BRANCH CREATED!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌿 Branch: $FEATURE_BRANCH"
    echo "📝 Description: $DESC"
    echo "📦 Backup: Complete (pre-branch + comprehensive)"
    echo "☁️ GitHub: Pushed"
    echo ""
    echo "🎯 You're now on: $FEATURE_BRANCH"
    echo "🎯 Follow workflow: docs/git-workflow.md"
    echo "🎯 Next steps: Start implementation with regular commits"
}

# Smart branch switching with checkpoint
switch_branch() {
    local TARGET_BRANCH="$1"
    
    if [ -z "$TARGET_BRANCH" ]; then
        echo "❌ Error: Target branch name required"
        echo "Usage: npm run branch switch <branch-name>"
        exit 1
    fi
    
    echo "🔄 Switching from: $CURRENT_BRANCH"
    echo "🎯 Switching to: $TARGET_BRANCH"
    
    # Create checkpoint using existing backup system if we have changes
    if [ -n "$(git status --porcelain)" ]; then
        echo ""
        echo "🔸 Creating checkpoint backup..."
        
        # Use our real-backup system for checkpoint
        ./scripts/real-n8n-export.sh
        
        # Commit any remaining changes
        git add -A
        git commit -m "backup: Checkpoint before switching to $TARGET_BRANCH

🌿 From: $CURRENT_BRANCH
🎯 To: $TARGET_BRANCH
⏰ Created: $(date)

Automated checkpoint with comprehensive backup"
        
        if git remote | grep -q origin; then
            git push origin "$CURRENT_BRANCH"
            echo "✅ Checkpoint pushed to GitHub"
        fi
    else
        echo "✅ No changes to checkpoint"
    fi
    
    # Switch to target branch
    git checkout "$TARGET_BRANCH"
    
    echo ""
    echo "✅ BRANCH SWITCH COMPLETE!"
    echo "🌿 Now on: $TARGET_BRANCH"
    echo "🔄 Previous: $CURRENT_BRANCH (checkpointed)"
}

# Use existing git-backup.sh system
create_backup() {
    echo "🔸 Creating backup using established git-backup.sh system..."
    ./scripts/git-backup.sh
    echo "✅ Backup complete - follows established backup/ branch pattern"
}

# Show comprehensive status
show_status() {
    echo "📊 GIT WORKFLOW STATUS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌿 Current Branch: $CURRENT_BRANCH"
    echo "📅 Current Time: $(date)"
    
    # Git status
    echo ""
    echo "📊 Working Directory:"
    UNSTAGED=$(git status --porcelain | wc -l)
    echo "  📁 Unstaged changes: $UNSTAGED files"
    
    # Check if we're following established patterns
    echo ""
    echo "📋 Branch Pattern Check:"
    case "$CURRENT_BRANCH" in
        "main")
            echo "  ✅ On main branch (production-ready code only)"
            ;;
        "develop")
            echo "  ✅ On develop branch (integration branch)"
            ;;
        feature/session-*)
            echo "  ✅ On feature branch (follows session pattern)"
            ;;
        feature/*)
            echo "  ✅ On feature branch"
            ;;
        hotfix/*)
            echo "  ✅ On hotfix branch (emergency fixes)"
            ;;
        backup/*)
            echo "  ⚠️ On backup branch (restore/review mode)"
            ;;
        *)
            echo "  ⚠️ Non-standard branch name (see docs/git-workflow.md)"
            ;;
    esac
    
    # Recent backups
    echo ""
    echo "📦 Recent Backups:"
    find workflows/backups -name "*.json" -mtime -1 2>/dev/null | head -3 | while read backup; do
        echo "  📄 $(basename "$backup")"
    done
    
    # Show established branch structure
    echo ""
    echo "🌿 Branch Structure (from docs/git-workflow.md):"
    git branch -a | head -10
    
    echo ""
    echo "🎯 Workflow Commands:"
    echo "  npm run branch new <session-X-name> <desc>  → New feature branch"
    echo "  npm run branch switch <name>                → Switch with checkpoint"
    echo "  npm run branch backup                       → Backup current state"
    echo "  npm run real-backup                         → n8n + Airtable export"
    echo "  npm run auto-backup                         → Smart 4h intervals"
}

# Execute operation
case "$OPERATION" in
    "new"|"create")
        create_feature_branch "$BRANCH_NAME" "$DESCRIPTION"
        ;;
    "switch"|"checkout")
        switch_branch "$BRANCH_NAME"
        ;;
    "backup")
        create_backup
        ;;
    "status")
        show_status
        ;;
    "list")
        echo "🌿 All Branches:"
        git branch -a
        echo ""
        echo "🔗 Backup Branches (established pattern):"
        git branch -a | grep backup || echo "  No backup branches found"
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown operation: $OPERATION"
        show_help
        exit 1
        ;;
esac