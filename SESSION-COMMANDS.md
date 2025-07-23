# 🎯 UYSP Session Commands - Quick Reference

## The Only Commands You Need to Remember

### 🚀 Starting a New Session
Tell Cursor: "Run start session X"
```bash
./scripts/start-session.sh 0 testing      # For Session 0: Comprehensive Testing
./scripts/start-session.sh 1 foundation   # For Session 1: Foundation
./scripts/start-session.sh 2 compliance   # For Session 2: Compliance  
./scripts/start-session.sh 3 qualification # For Session 3: Qualification
./scripts/start-session.sh 4 sms          # For Session 4: SMS Sending
./scripts/start-session.sh 5 integration  # For Session 5: Integration
```

### 💾 Saving Your Work (Do This Often!)
Tell Cursor: "Checkpoint" or "Save my work"
```bash
./scripts/checkpoint.sh
```
Or with a custom message:
```bash
./scripts/checkpoint.sh "finished webhook setup"
./scripts/checkpoint.sh "boolean conversion working"
./scripts/checkpoint.sh "testing complete"
```

### ✅ Finishing a Session
Tell Cursor: "Complete session X"
```bash
./scripts/complete-session.sh 0   # When done with Session 0
./scripts/complete-session.sh 1   # When done with Session 1
./scripts/complete-session.sh 2   # When done with Session 2
# etc...
```

### 🔍 Check Where You Are
Tell Cursor: "Show status"
```bash
./scripts/status.sh
```

## 📋 Your Typical Workflow

1. **Morning**: "Run start session 1 foundation"
2. **After each component works**: "Checkpoint"
3. **Before lunch**: "Checkpoint"  
4. **After testing**: "Checkpoint finished testing"
5. **End of session**: "Complete session 1"

## 🎨 What Each Command Does (Behind the Scenes)

| You Say | Script Runs | What Happens |
|---------|-------------|--------------|
| "Start session 1 foundation" | `start-session.sh` | Creates Git branch, sets up workspace, creates session log |
| "Checkpoint" | `checkpoint.sh` | Saves to Git + uploads to GitHub + updates session log |
| "Complete session 1" | `complete-session.sh` | Tags completion, updates docs, returns to develop |
| "Show status" | `status.sh` | Shows current branch, unsaved changes, GitHub sync |

## 💡 Pro Tips

- **Checkpoint often** - Every 30-60 minutes or when something works
- **Always complete sessions** - This creates a permanent record with evidence
- **Check status if confused** - Shows exactly where you are and what to do next
- **These scripts handle all Git complexity** - No need to learn Git commands!

## 🚨 If Something Goes Wrong

Just run:
```bash
./scripts/status.sh
```

It will tell you:
- What branch you're on
- What needs to be saved
- Whether you're synced with GitHub
- Recommended next commands

## 📚 Session Details

### Session 0: Comprehensive Testing 🧪
**Goal**: Test field normalization with 15+ payload variations
**When to start**: After Phase 00 complete
**Duration**: ~1 day

### Session 1: Foundation 🏗️
**Goal**: Webhook authentication, duplicate prevention, data flow
**When to start**: After Session 0 complete
**Duration**: ~1-2 days

### Session 2: Compliance 📋
**Goal**: SMS/TCPA compliance, DND lists, cost tracking
**When to start**: After Session 1 complete
**Duration**: ~1-2 days

### Session 3: Qualification 🎯
**Goal**: Two-phase Apollo APIs, AI scoring, company enrichment
**When to start**: After Session 2 complete
**Duration**: ~2-3 days

### Session 4: SMS Sending 📱
**Goal**: SMS templates, SimpleTexting integration, delivery tracking
**When to start**: After Session 3 complete
**Duration**: ~1-2 days

### Session 5: Integration 🔧
**Goal**: Calendly integration, metrics dashboard, system utilities
**When to start**: After Session 4 complete
**Duration**: ~1-2 days

## 🔄 Emergency Commands

### If You Get Lost
```bash
./scripts/status.sh                    # Show where you are
git branch                             # List all branches
git checkout develop                   # Go back to develop branch
```

### If You Need to Switch Sessions
```bash
./scripts/checkpoint.sh               # Save current work
git checkout develop                  # Switch to develop
./scripts/start-session.sh X name    # Start different session
```

### If GitHub Gets Out of Sync
```bash
./scripts/checkpoint.sh              # This handles GitHub sync automatically
# Or manually:
git pull --rebase                     # Get latest changes
git push                              # Upload your changes
```

## 🎉 Success Indicators

You'll know things are working when:
- ✅ `./scripts/status.sh` shows "All changes saved"
- ✅ `./scripts/status.sh` shows "In sync with GitHub"
- ✅ Your session log gets updated with each checkpoint
- ✅ No error messages when running scripts

## 🆘 Get Help

### If Scripts Don't Work
1. Check you're in the right directory: `/Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1`
2. Make sure scripts are executable: `chmod +x scripts/*.sh`
3. Run `./scripts/status.sh` to see any issues

### If Git Gets Confused
The automation handles 99% of Git complexity, but if something breaks:
1. Run `./scripts/status.sh` first
2. Save your work: `./scripts/checkpoint.sh "emergency save"`
3. The scripts will usually fix sync issues automatically

---

## 🚀 Remember: These 4 Commands Are ALL You Need!

1. **Start**: `./scripts/start-session.sh X name`
2. **Save**: `./scripts/checkpoint.sh`
3. **Complete**: `./scripts/complete-session.sh X`
4. **Status**: `./scripts/status.sh`

The scripts handle everything else automatically! 🎯 