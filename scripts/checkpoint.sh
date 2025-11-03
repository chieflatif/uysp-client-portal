#!/bin/bash

# UYSP Checkpoint - Save progress during development
# Usage: ./scripts/checkpoint.sh [optional custom message]

set -e  # Exit on any error

MESSAGE=${1:-"checkpoint: work in progress"}

echo "💾 Creating UYSP Checkpoint..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify we're in the UYSP project
if [ ! -f "memory_bank/active_context.md" ]; then
    echo "❌ Error: Not in UYSP project directory"
    echo "💡 Make sure you're in: /Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1"
    exit 1
fi

# Get current branch info
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if there are changes to save
CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$CHANGES" -eq 0 ]; then
    echo "✅ No changes to save - everything is already committed!"
    
    # Still update session log with checkpoint timestamp
    if [[ $CURRENT_BRANCH == feature/session-* ]]; then
        SESSION_NUM=$(echo $CURRENT_BRANCH | sed 's/feature\/session-\([0-9]\+\).*/\1/')
        SESSION_LOG="memory_bank/sessions/session-$SESSION_NUM-log.md"
        if [ -f "$SESSION_LOG" ]; then
            # Add checkpoint entry under Development Notes
            sed -i '' '/### Checkpoints Saved/a\
- '"$(date)"': '"$MESSAGE"' (no changes)' "$SESSION_LOG"
            echo "📝 Updated session log: $SESSION_LOG"
        fi
    fi
    
    exit 0
fi

# Show what's being saved
echo "📋 Changes to save ($CHANGES files):"
git status --short | head -20
if [ "$CHANGES" -gt 20 ]; then
    echo "... and $(($CHANGES - 20)) more files"
fi

# Detect session context for better commit messages
SESSION_CONTEXT=""
if [[ $CURRENT_BRANCH == feature/session-* ]]; then
    SESSION_NUM=$(echo $CURRENT_BRANCH | sed 's/feature\/session-\([0-9]\+\).*/\1/')
    SESSION_NAME=$(echo $CURRENT_BRANCH | sed 's/feature\/session-[0-9]\+-\(.*\)/\1/')
    SESSION_CONTEXT="(Session $SESSION_NUM: $SESSION_NAME) "
fi

# Create meaningful commit message
COMMIT_MESSAGE="chore: $SESSION_CONTEXT$MESSAGE"

# Check if this looks like a feature completion
if echo "$MESSAGE" | grep -q -E "(complete|finish|working|done|implement|add)"; then
    COMMIT_MESSAGE="feat: $SESSION_CONTEXT$MESSAGE"
elif echo "$MESSAGE" | grep -q -E "(fix|bug|error|issue)"; then
    COMMIT_MESSAGE="fix: $SESSION_CONTEXT$MESSAGE"
elif echo "$MESSAGE" | grep -q -E "(test|testing)"; then
    COMMIT_MESSAGE="test: $SESSION_CONTEXT$MESSAGE"
elif echo "$MESSAGE" | grep -q -E "(doc|documentation)"; then
    COMMIT_MESSAGE="docs: $SESSION_CONTEXT$MESSAGE"
fi

# Add and commit changes
echo "💾 Saving changes..."
git add .
git commit -m "$COMMIT_MESSAGE"

# Update session log if we're in a session branch
if [[ $CURRENT_BRANCH == feature/session-* ]]; then
    SESSION_LOG="memory_bank/sessions/session-$SESSION_NUM-log.md"
    if [ -f "$SESSION_LOG" ]; then
        # Add checkpoint entry under Development Notes
        sed -i '' '/### Checkpoints Saved/a\
- '"$(date)"': '"$MESSAGE" "$SESSION_LOG"
        
        # Stage and commit the log update
        git add "$SESSION_LOG"
        git commit --amend --no-edit
        echo "📝 Updated session log: $SESSION_LOG"
    fi
fi

# Get commit hash for reference
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "✅ Changes saved! Commit: $COMMIT_HASH"

# Push to GitHub if remote exists
if git remote | grep -q origin; then
    echo "☁️  Uploading to GitHub..."
    
    # Check if we're ahead/behind
    git fetch origin $CURRENT_BRANCH 2>/dev/null || true
    BEHIND=$(git rev-list HEAD..origin/$CURRENT_BRANCH --count 2>/dev/null || echo "0")
    AHEAD=$(git rev-list origin/$CURRENT_BRANCH..HEAD --count 2>/dev/null || echo "1")
    
    if [ "$BEHIND" -gt 0 ]; then
        echo "⚠️  Remote branch is ahead by $BEHIND commits"
        echo "🔄 Pulling and rebasing..."
        git pull --rebase origin $CURRENT_BRANCH
    fi
    
    # Push current branch
    git push -u origin $CURRENT_BRANCH
    echo "✅ Uploaded to GitHub!"
    
    # Show GitHub info
    if command -v git config &> /dev/null; then
        REPO_URL=$(git config --get remote.origin.url 2>/dev/null | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
        if [ ! -z "$REPO_URL" ]; then
            echo "🔗 View on GitHub: $REPO_URL/tree/$CURRENT_BRANCH"
        fi
    fi
else
    echo "ℹ️  No GitHub remote configured - saved locally only"
    echo "💡 Add remote with: git remote add origin [your-repo-url]"
fi

# Show project status
echo ""
echo "📊 Current Status:"
echo "  Branch: $CURRENT_BRANCH"
echo "  Last commit: $COMMIT_HASH"
echo "  Changes saved: $CHANGES files"

# Show useful next steps
echo ""
echo "💡 What's next?"
if [[ $CURRENT_BRANCH == feature/session-* ]]; then
    echo "  Continue working on Session $SESSION_NUM"
    echo "  Use './scripts/checkpoint.sh \"your message\"' to save progress"
    echo "  Use './scripts/complete-session.sh $SESSION_NUM' when done"
else
    echo "  Continue development work"
    echo "  Use './scripts/start-session.sh N name' to begin a session"
fi
echo "  Use './scripts/status.sh' to check current state"

echo ""
echo "🎯 Checkpoint complete! Keep up the great work! 🚀" 