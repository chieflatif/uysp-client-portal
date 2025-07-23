#!/bin/bash

# UYSP Status - Show current Git/session status in simple terms
# Usage: ./scripts/status.sh

echo "🔍 UYSP Project Status"
echo "====================="

# Verify we're in the UYSP project
if [ ! -f "memory_bank/active_context.md" ]; then
    echo "❌ Error: Not in UYSP project directory"
    echo "💡 Make sure you're in: /Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1"
    exit 1
fi

# Current branch and session detection
BRANCH=$(git branch --show-current)
echo "📍 Current branch: $BRANCH"

# Analyze branch type and show context
if [[ $BRANCH == feature/session-* ]]; then
    SESSION_NUM=$(echo $BRANCH | sed 's/feature\/session-\([0-9]\+\).*/\1/')
    SESSION_NAME=$(echo $BRANCH | sed 's/feature\/session-[0-9]\+-\(.*\)/\1/')
    echo "🎯 Working on: Session $SESSION_NUM ($SESSION_NAME)"
    
    # Check session log
    SESSION_LOG="memory_bank/sessions/session-$SESSION_NUM-log.md"
    if [ -f "$SESSION_LOG" ]; then
        echo "📝 Session log: Found"
        # Check if session is complete
        if grep -q "✅ COMPLETE" "$SESSION_LOG"; then
            echo "✅ Session status: COMPLETE"
        else
            echo "🔄 Session status: IN PROGRESS"
        fi
    else
        echo "⚠️  Session log: Missing"
    fi
elif [[ $BRANCH == "main" ]]; then
    echo "🏠 On main branch (production-ready code)"
elif [[ $BRANCH == "develop" ]]; then
    echo "🔧 On develop branch (integration)"
elif [[ $BRANCH == hotfix/* ]]; then
    echo "🚨 On hotfix branch (emergency fix)"
else
    echo "🌿 On feature/utility branch"
fi

# Check for uncommitted changes
CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$CHANGES" -gt 0 ]; then
    echo "⚠️  Unsaved changes: $CHANGES files"
    echo "📋 Changed files:"
    git status --short | head -10
    if [ "$CHANGES" -gt 10 ]; then
        echo "   ... and $(($CHANGES - 10)) more files"
    fi
    echo "💡 Run './scripts/checkpoint.sh' to save progress"
else
    echo "✅ All changes saved and committed"
fi

# Last commit info
echo "📝 Last commit: $(git log -1 --format='%ar' 2>/dev/null || echo 'No commits')"
LAST_MESSAGE=$(git log -1 --format='%s' 2>/dev/null | head -c 60)
if [ ! -z "$LAST_MESSAGE" ]; then
    echo "   Message: $LAST_MESSAGE..."
fi

# Remote synchronization status
if git remote | grep -q origin; then
    echo "☁️  GitHub status:"
    
    # Fetch latest info quietly
    git fetch origin 2>/dev/null || true
    
    # Check if branch exists on remote
    if git ls-remote --heads origin $BRANCH | grep -q $BRANCH; then
        BEHIND=$(git rev-list HEAD..origin/$BRANCH --count 2>/dev/null || echo "0")
        AHEAD=$(git rev-list origin/$BRANCH..HEAD --count 2>/dev/null || echo "0")
        
        if [ "$BEHIND" -gt 0 ] && [ "$AHEAD" -gt 0 ]; then
            echo "   ⚠️  Diverged: $AHEAD ahead, $BEHIND behind"
            echo "   💡 Run 'git pull --rebase' then 'git push'"
        elif [ "$BEHIND" -gt 0 ]; then
            echo "   ⬇️  Behind by $BEHIND commits"
            echo "   💡 Run 'git pull' to update"
        elif [ "$AHEAD" -gt 0 ]; then
            echo "   ⬆️  Ahead by $AHEAD commits"
            echo "   💡 Run 'git push' to upload"
        else
            echo "   ✅ In sync with GitHub"
        fi
    else
        echo "   🆕 Branch not on GitHub yet"
        echo "   💡 Run './scripts/checkpoint.sh' to upload"
    fi
    
    # Show GitHub URL if available
    REPO_URL=$(git config --get remote.origin.url 2>/dev/null | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    if [ ! -z "$REPO_URL" ]; then
        echo "   🔗 GitHub: $REPO_URL"
    fi
else
    echo "📡 No GitHub remote configured"
    echo "   💡 Add with: git remote add origin [repo-url]"
fi

# Project phase status
echo ""
echo "📊 UYSP Development Progress:"

# Check version tags
LATEST_TAG=$(git tag -l "v*" | sort -V | tail -1)
if [ ! -z "$LATEST_TAG" ]; then
    echo "   🏷️  Latest version: $LATEST_TAG"
fi

# Check session completion tags
COMPLETED_SESSIONS=$(git tag -l "session-*-complete" | wc -l | tr -d ' ')
echo "   ✅ Completed sessions: $COMPLETED_SESSIONS"

# Show session status overview
echo "   📋 Session Overview:"
for i in {0..5}; do
    SESSION_TAG="session-$i-complete"
    SESSION_LOG="memory_bank/sessions/session-$i-log.md"
    
    if git tag -l | grep -q "$SESSION_TAG"; then
        echo "      Session $i: ✅ COMPLETE"
    elif [ -f "$SESSION_LOG" ]; then
        if grep -q "✅ COMPLETE" "$SESSION_LOG"; then
            echo "      Session $i: ✅ COMPLETE (not tagged)"
        else
            echo "      Session $i: 🔄 IN PROGRESS"
        fi
    else
        echo "      Session $i: ⏸️  Not started"
    fi
done

# Check critical files
echo ""
echo "🔧 Environment Status:"

# Check if critical files exist
if [ -f "memory_bank/active_context.md" ]; then
    echo "   ✅ Memory bank active"
else
    echo "   ❌ Memory bank missing"
fi

if [ -f "patterns/00-field-normalization-mandatory.txt" ]; then
    echo "   ✅ Field normalization patterns available"
else
    echo "   ⚠️  Field normalization patterns missing"
fi

if [ -f "workflows/backups/phase00-field-normalization-complete.json" ]; then
    echo "   ✅ Phase 00 backup available"
else
    echo "   ⚠️  Phase 00 backup missing"
fi

# Quick command recommendations
echo ""
echo "💡 Quick Commands:"

if [[ $BRANCH == feature/session-* ]]; then
    echo "   ./scripts/checkpoint.sh              - Save current progress"
    echo "   ./scripts/checkpoint.sh \"message\"    - Save with custom message"
    echo "   ./scripts/complete-session.sh $SESSION_NUM      - Finish current session"
elif [[ $BRANCH == "develop" ]] || [[ $BRANCH == "main" ]]; then
    echo "   ./scripts/start-session.sh 0 testing   - Start Session 0"
    echo "   ./scripts/start-session.sh 1 foundation - Start Session 1"
    echo "   ./scripts/git-backup.sh               - Create backup branch"
else
    echo "   ./scripts/checkpoint.sh              - Save current work"
    echo "   git checkout develop                 - Switch to develop"
    echo "   ./scripts/start-session.sh N name   - Start new session"
fi

echo "   ./scripts/status.sh                  - Show this status again"

# Show any issues or recommendations
echo ""
echo "🔍 Health Check:"

# Check for common issues
ISSUES=0

# Check git status
if ! git status &>/dev/null; then
    echo "   ❌ Git repository issues detected"
    ISSUES=$((ISSUES + 1))
fi

# Check for .gitignore
if [ ! -f ".gitignore" ]; then
    echo "   ⚠️  .gitignore file missing"
    ISSUES=$((ISSUES + 1))
fi

# Check for untracked important files
UNTRACKED_IMPORTANT=$(git ls-files --others --exclude-standard | grep -E "\.(md|json|sh|txt)$" | wc -l | tr -d ' ')
if [ "$UNTRACKED_IMPORTANT" -gt 0 ]; then
    echo "   ⚠️  $UNTRACKED_IMPORTANT untracked important files"
    echo "   💡 Run 'git status' to see them"
    ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
    echo "   ✅ All systems healthy"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Context-aware summary message
if [[ $BRANCH == feature/session-* ]] && [ "$CHANGES" -gt 0 ]; then
    echo "🎯 You're working on Session $SESSION_NUM with unsaved changes."
    echo "💡 Use './scripts/checkpoint.sh' to save progress!"
elif [[ $BRANCH == feature/session-* ]] && [ "$CHANGES" -eq 0 ]; then
    echo "✅ Session $SESSION_NUM work is saved. Keep coding!"
elif [[ $BRANCH == "develop" ]] || [[ $BRANCH == "main" ]]; then
    echo "🚀 Ready to start a new session or continue development!"
else
    echo "🔧 Development ready. Use status commands above to navigate."
fi 