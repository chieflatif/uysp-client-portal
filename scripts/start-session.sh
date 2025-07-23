#!/bin/bash

# UYSP Session Starter - Automated session setup with proper Git workflow
# Usage: ./scripts/start-session.sh [number] [name]

set -e  # Exit on any error

SESSION_NUMBER=$1
SESSION_NAME=$2

# Validate inputs
if [ -z "$SESSION_NUMBER" ] || [ -z "$SESSION_NAME" ]; then
  echo "❌ Usage: ./scripts/start-session.sh [number] [name]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/start-session.sh 0 testing      # Session 0: Comprehensive Testing"
  echo "  ./scripts/start-session.sh 1 foundation   # Session 1: Foundation"
  echo "  ./scripts/start-session.sh 2 compliance   # Session 2: Compliance"
  echo "  ./scripts/start-session.sh 3 qualification # Session 3: Qualification"
  echo "  ./scripts/start-session.sh 4 sms          # Session 4: SMS Sending"
  echo "  ./scripts/start-session.sh 5 integration  # Session 5: Integration"
  echo ""
  exit 1
fi

# Verify we're in the UYSP project
if [ ! -f "memory_bank/active_context.md" ]; then
    echo "❌ Error: Not in UYSP project directory"
    echo "💡 Make sure you're in: /Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1"
    exit 1
fi

echo "🚀 Starting UYSP Session $SESSION_NUMBER: $SESSION_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save current work
echo "📦 Saving current work..."
CURRENT_BRANCH=$(git branch --show-current)
if [ ! -z "$(git status --porcelain)" ]; then
    git add .
    git commit -m "chore: checkpoint before starting session $SESSION_NUMBER" || echo "✅ Nothing new to commit"
else
    echo "✅ No unsaved changes found"
fi

# Switch to develop branch
echo "🔄 Switching to develop branch..."
git checkout develop
if git remote | grep -q origin; then
    echo "⬇️  Pulling latest changes from GitHub..."
    git pull origin develop || echo "⚠️  No remote updates (or not connected to GitHub yet)"
else
    echo "ℹ️  No remote configured - working locally"
fi

# Create new feature branch
BRANCH_NAME="feature/session-$SESSION_NUMBER-$SESSION_NAME"
echo "🌿 Creating feature branch: $BRANCH_NAME"

if git show-ref --quiet refs/heads/$BRANCH_NAME; then
    echo "⚠️  Branch $BRANCH_NAME already exists, switching to it..."
    git checkout $BRANCH_NAME
else
    git checkout -b $BRANCH_NAME
    echo "✅ Created new branch: $BRANCH_NAME"
fi

# Create session directory structure
echo "📁 Setting up session workspace..."
mkdir -p memory_bank/sessions
mkdir -p context/session-$SESSION_NUMBER
mkdir -p tests/session-$SESSION_NUMBER

# Create session log with proper template
echo "📝 Creating session log..."
SESSION_LOG="memory_bank/sessions/session-$SESSION_NUMBER-log.md"
cat > $SESSION_LOG << EOF
# Session $SESSION_NUMBER: $SESSION_NAME

**Started**: $(date)  
**Branch**: \`$BRANCH_NAME\`  
**Status**: 🔄 IN PROGRESS  

## 🎯 Session Goals
$(case $SESSION_NUMBER in
  0) echo "- [ ] Execute 15+ payload variation tests
- [ ] Validate 95%+ field capture rate across all variations  
- [ ] Verify unknown field logging functionality
- [ ] Document field mapping patterns and edge cases
- [ ] Test boolean conversions across all scenarios
- [ ] Validate international phone detection for edge cases";;
  1) echo "- [ ] Implement duplicate prevention logic
- [ ] Add webhook authentication validation
- [ ] Create comprehensive data flow foundation
- [ ] Establish error handling patterns
- [ ] Document foundation patterns";;
  2) echo "- [ ] Implement SMS/TCPA compliance checks
- [ ] Add DND (Do Not Disturb) list integration  
- [ ] Create cost tracking and daily limits
- [ ] Establish opt-out handling
- [ ] Document compliance procedures";;
  3) echo "- [ ] Implement two-phase Apollo API qualification
- [ ] Add AI-powered ICP scoring (0-100)
- [ ] Create company and person enrichment
- [ ] Establish routing logic based on scores
- [ ] Document qualification patterns";;
  4) echo "- [ ] Implement SMS template system
- [ ] Add SimpleTexting/Twilio integration
- [ ] Create personalized message generation
- [ ] Establish delivery tracking
- [ ] Test SMS sending workflows";;
  5) echo "- [ ] Add system integration utilities
- [ ] Implement Calendly booking integration
- [ ] Create comprehensive metrics dashboard
- [ ] Establish monitoring and alerting
- [ ] Complete end-to-end integration";;
  *) echo "- [ ] Complete session objectives (see implementation guide)
- [ ] Test all components thoroughly
- [ ] Document patterns and evidence";;
esac)

## 📋 Implementation Progress

### Phase 1: Setup
- [x] Session environment created
- [x] Git branch established
- [ ] Implementation guide reviewed
- [ ] Environment variables verified

### Phase 2: Development
- [ ] Core components implemented
- [ ] Initial testing complete
- [ ] Integration points working

### Phase 3: Testing
- [ ] Comprehensive testing complete
- [ ] Edge cases handled
- [ ] Performance validated

### Phase 4: Documentation
- [ ] Evidence collected and documented
- [ ] Patterns documented
- [ ] Session completion verified

## 🔧 Development Notes

### Checkpoints Saved
- $(date): Session started

### Issues & Solutions

### Key Discoveries

## 📊 Evidence Collection

### Test Results

### Workflow IDs & Versions

### Success Metrics

## ✅ Completion Criteria
- [ ] All session goals achieved
- [ ] Evidence documented with proof
- [ ] Tests passing with 95%+ success rate
- [ ] Code committed and pushed to GitHub
- [ ] Session log completed

---
**Session Status**: Ready for development
EOF

# Create session context file
echo "📋 Creating session context..."
CONTEXT_FILE="context/session-$SESSION_NUMBER/README.md"
cat > $CONTEXT_FILE << EOF
# Session $SESSION_NUMBER: $SESSION_NAME

## Current State
- **Branch**: \`$BRANCH_NAME\`
- **Started**: $(date)
- **Previous Session**: See memory_bank/sessions/ for history

## Quick Links
- [Session Log](../../memory_bank/sessions/session-$SESSION_NUMBER-log.md)
- [Implementation Guide](../docs/reference/uysp-implementation-guide.md)
- [Test Payloads](../../tests/session-$SESSION_NUMBER/)

## Next Steps
1. Review session goals in the log file
2. Check implementation guide for Session $SESSION_NUMBER specifics
3. Start with first component implementation
4. Use \`./scripts/checkpoint.sh\` frequently to save progress

## Commands for This Session
\`\`\`bash
# Save progress
./scripts/checkpoint.sh "component X working"

# Check status
./scripts/status.sh

# Complete session
./scripts/complete-session.sh $SESSION_NUMBER
\`\`\`
EOF

# Add and commit the session setup
echo "💾 Committing session setup..."
git add memory_bank/sessions/ context/session-$SESSION_NUMBER/ tests/session-$SESSION_NUMBER/
git commit -m "feat: initialize session $SESSION_NUMBER - $SESSION_NAME

- Created session log and workspace
- Set up branch: $BRANCH_NAME
- Ready for development

Session Goals:
$(case $SESSION_NUMBER in
  0) echo "- Comprehensive field normalization testing";;
  1) echo "- Foundation webhook and data flow";;
  2) echo "- SMS compliance and safety controls";;
  3) echo "- Two-phase qualification with AI scoring";;
  4) echo "- SMS sending and template system";;
  5) echo "- System integration and utilities";;
  *) echo "- Session $SESSION_NUMBER implementation";;
esac)"

# Push to GitHub if remote exists
if git remote | grep -q origin; then
    echo "☁️  Pushing session setup to GitHub..."
    git push -u origin $BRANCH_NAME
    echo "✅ Session uploaded to GitHub"
else
    echo "ℹ️  Session created locally (no GitHub remote configured)"
fi

# Session completion summary
echo ""
echo "🎉 Session $SESSION_NUMBER: $SESSION_NAME Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Started: $(date)"
echo "🌿 Branch: $BRANCH_NAME"
echo "📝 Session Log: $SESSION_LOG"
echo "📋 Context: $CONTEXT_FILE"
echo ""
echo "🚀 Next Steps:"
echo "1. Review session goals in the log file"
echo "2. Check implementation guide for Session $SESSION_NUMBER"
echo "3. Start development work"
echo "4. Use './scripts/checkpoint.sh' frequently to save progress"
echo ""
echo "💡 Quick Commands:"
echo "  ./scripts/status.sh                  - Check current status"
echo "  ./scripts/checkpoint.sh             - Save progress"  
echo "  ./scripts/complete-session.sh $SESSION_NUMBER - Finish session"
echo ""
echo "Happy coding! 🚀" 