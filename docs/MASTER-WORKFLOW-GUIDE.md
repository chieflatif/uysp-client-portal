# 🌿 UYSP WORKFLOW SYSTEM - MASTER GUIDE
**THE SINGLE SOURCE OF TRUTH FOR ALL GIT, BACKUP, AND VERSIONING**

📅 **Created**: July 31, 2025  
🎯 **Purpose**: Replace all scattered documentation with ONE clear system  
⚠️ **Status**: This is the ONLY workflow documentation - ignore all others  

---

## 🚀 **QUICK START - YOUR VOICE COMMANDS**

### **Essential Commands (MEMORIZE THESE)**
```bash
# Start work session (backup check + status)
npm run start-work

# Create new feature branch with automatic backup
npm run branch new session-3-qualification 'Apollo API integration'

# Switch branches safely with checkpoint
npm run branch switch develop

# Manual backup (Git + n8n + Airtable)
npm run real-backup

# Smart backup (only if 4+ hours old)
npm run auto-backup

# Status check (branches, backups, etc.)
npm run branch status
```

### **Emergency Commands**
```bash
# Quick Git backup branch (established pattern)
npm run backup

# Just Airtable schemas
npm run schema-backup

# Show all branches and backups
npm run branch list
```

---

## 🌿 **BRANCH STRUCTURE** 

### **Established Naming Conventions**
- **`main`**: Production-ready code only (protected)
- **`develop`**: Integration branch for completed sessions
- **`feature/session-X-name`**: Your working branches
- **`backup/YYYYMMDD-HHMM`**: Automated backup branches
- **`hotfix/description`**: Emergency fixes

### **Current Branch Check**
```bash
npm run branch status
```
Shows:
- ✅ Current branch follows patterns
- 📁 Number of unstaged changes  
- 📦 Recent backups
- 🌿 Available branches

---

## 🔄 **WORKFLOW PROCESS**

### **1. Starting New Work**
```bash
# Initialize work session
npm run start-work

# Create feature branch (follows pattern: feature/session-X-name)
npm run branch new session-2-compliance 'SMS/TCPA compliance implementation'
```

**What happens automatically:**
1. Pre-branch backup using established `git-backup.sh`
2. Creates `feature/session-2-compliance` branch
3. Comprehensive n8n workflow export (107KB real JSON)
4. Airtable schema backup with recovery instructions
5. Initial commit with semantic message format
6. Push to GitHub

### **2. During Development**
```bash
# Regular commits (manually as you work)
git add files
git commit -m "feat(compliance): Add SMS compliance checking

- DND list integration implemented
- Time window validation added
- TCPA compliance logging

Evidence: Test records recABC123, recDEF456"

# Push regularly for safety
git push origin feature/session-2-compliance
```

### **3. Switching Work**
```bash
# Safe switch with checkpoint backup
npm run branch switch develop
```

**What happens automatically:**
1. Creates checkpoint backup of current work
2. Real n8n + Airtable export for safety
3. Commits any uncommitted changes
4. Switches to target branch
5. GitHub sync

### **4. Manual Backups Anytime**
```bash
# Force fresh backup (dual: local + GitHub)
npm run real-backup

# Smart backup (only if 4+ hours since last)
npm run auto-backup

# Quick Git backup branch (established pattern)
npm run backup
```

---

## 📦 **BACKUP SYSTEM**

### **Three Types of Backups** 

#### **1. Git Backup Branches** (`npm run backup`)
- **Uses**: Established `scripts/git-backup.sh`
- **Creates**: `backup/YYYYMMDD-HHMM` branches
- **Contains**: Complete project state snapshot
- **Pattern**: 30-day retention, auto-cleanup

#### **2. Real Workflow Backups** (`npm run real-backup`)
- **Creates**: `workflows/backups/uysp-lead-processing-WORKING-TIMESTAMP.json`
- **Size**: 107KB real n8n JSON (not fake metadata)
- **Plus**: Airtable schemas with recovery instructions
- **Auto**: Local save + GitHub commit + push

#### **3. Smart Auto-Backup** (`npm run auto-backup`)
- **When**: Every 4 hours or when no recent backups
- **Combines**: Real workflow + Airtable schemas + Git
- **Cleanup**: Keeps 10 most recent, deletes old
- **Status**: Shows backup age and integrity

### **Backup Status Check**
```bash
npm run start-work
# Shows backup summary, integrity check, GitHub sync status
```

---

## 🏷️ **VERSIONING SYSTEM**

### **Semantic Versioning Pattern**
- **v0.x.x**: Pre-production development phases
- **v1.0.0**: First production release (after Session 6)

### **Version Tags by Session**
- **v0.2.0**: Session 0 Complete - Comprehensive Testing
- **v0.3.0**: Session 1 Complete - Foundation  
- **v0.4.0**: Session 2 Complete - Compliance
- **v0.5.0**: Session 3 Complete - Qualification
- **v0.6.0**: Session 4 Complete - SMS Sending
- **v0.7.0**: Session 5 Complete - Utilities
- **v0.8.0**: Session 6 Complete - Reality Testing
- **v1.0.0**: Production Release - Full System

### **Commit Message Format**
```
type(scope): Subject line (max 50 chars)

- Bullet point details about changes
- Evidence or metrics included when applicable  
- Reference to workflow IDs or test results

Evidence: [Workflow ID / Test Results / Record IDs]
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `backup`, `config`

---

## 🚨 **DISASTER RECOVERY**

### **If AI Agent Deletes n8n Workflow**
1. **Check latest backup**: `ls workflows/backups/uysp-lead-processing-WORKING-*.json`
2. **Import to n8n**: Use most recent 107KB JSON file
3. **Verify integrity**: File should be 100KB+, contain "nodes" and "connections"

### **If You Need to Rollback**
```bash
# View available backups
npm run branch list

# Switch to backup branch
git checkout backup/20250731-0943

# Create recovery branch  
git checkout -b recovery/restore-from-backup

# Verify and merge as needed
```

### **If Branch is Messed Up**
```bash
# Create checkpoint first
npm run branch backup

# Switch to known good branch
npm run branch switch develop

# Start fresh
npm run branch new session-X-recovery 'Fix and continue work'
```

---

## 📁 **FILE LOCATIONS**

### **Scripts (DON'T MODIFY)**
- `scripts/git-workflow.sh` - Main workflow commands
- `scripts/git-backup.sh` - Established backup system  
- `scripts/real-n8n-export.sh` - n8n + Airtable export
- `scripts/auto-backup.sh` - Smart scheduling
- `scripts/work-start.sh` - Session initialization

### **Backups**
- `workflows/backups/` - Real n8n workflow exports (107KB each)
- `data/schemas/` - Airtable schema backups with recovery instructions
- Remote: GitHub origin branches (backup/*, feature/*)

### **Documentation**
- **THIS FILE**: `docs/MASTER-WORKFLOW-GUIDE.md` (YOU ARE HERE)
- All others are deprecated/supplementary only

---

## ❓ **TROUBLESHOOTING**

### **Command Not Found**
```bash
# Check if npm scripts exist
npm run branch help
npm run start-work
```

### **Git Issues**
```bash
# Check current state
npm run branch status

# See git status
git status
git log --oneline -5
```

### **Backup Issues**
```bash
# Check backup integrity
ls -la workflows/backups/uysp-lead-processing-WORKING-*.json

# Check latest file size (should be 100KB+)
wc -c workflows/backups/uysp-lead-processing-WORKING-*.json | tail -1
```

### **Lost Work**
```bash
# Check all backup branches
git branch -a | grep backup

# Check file backups
ls -la workflows/backups/ | head -10
```

---

## 🎯 **WHAT'S DIFFERENT NOW**

### **✅ SINGLE UNIFIED SYSTEM**
- **Before**: Multiple conflicting scripts and docs
- **Now**: One command system (`npm run branch`)

### **✅ COMPREHENSIVE BACKUPS**
- **Before**: Git branches only
- **Now**: Git + real n8n JSON + Airtable schemas

### **✅ NON-TECHNICAL FRIENDLY**
- **Before**: Complex git commands
- **Now**: Simple voice commands with automatic safety

### **✅ DISASTER PROOF**
- **Before**: Vulnerable to AI agent deletions
- **Now**: Multiple backup layers (local + GitHub + real exports)

---

## 🚀 **GET STARTED NOW**

1. **Initialize your session**: `npm run start-work`
2. **Check status**: `npm run branch status`  
3. **Create new work branch**: `npm run branch new session-X-name 'Description'`
4. **Work normally, commit regularly**
5. **Switch safely**: `npm run branch switch <target>`

**🎯 MEMORIZE**: `npm run start-work` and `npm run branch` - these are your main commands.

---

*This guide replaces ALL previous workflow documentation. Ignore scattered references in other files.*