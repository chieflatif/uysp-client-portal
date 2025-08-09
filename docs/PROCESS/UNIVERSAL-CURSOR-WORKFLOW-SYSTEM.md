[AUTHORITATIVE]
Last Updated: 2025-08-08

# 🚀 Universal Cursor AI Workflow System - Complete Implementation Guide

**PURPOSE**: This document enables ANY Cursor AI agent to replicate the UYSP dual backup, branching, and documentation system in NEW projects.

**ORIGIN PROJECT**: UYSP Lead Qualification V1  
**TESTED STATUS**: Production-ready, battle-tested with cloud services (n8n, Airtable)  
**TARGET USER**: Non-technical users who need robust automation protection  

---

## 📋 **WHAT THIS SYSTEM PROVIDES**

### ✅ **Core Capabilities**
- **Dual Backup**: Local JSON exports + GitHub cloud backup
- **Smart Automation**: 4-hour intelligent backup intervals
- **Voice Commands**: Simple `npm run` commands for all operations
- **Branch Protection**: Pre-branch backups prevent work loss
- **Real Exports**: Actual workflow/schema JSON (not metadata)
- **Recovery Instructions**: Auto-generated restoration guides
- **Documentation Control**: Single source of truth structure

### ✅ **Critical Protection Against**
- AI agents deleting workflows (n8n, Zapier, etc.)
- Cloud service data loss (Airtable, databases)
- Complex branching confusion for non-technical users
- Scattered documentation chaos
- Fake backup scripts creating false security

---

## 🏗️ **COMPLETE IMPLEMENTATION GUIDE**

### **PHASE 1: Project Structure Setup (5 minutes)**

#### **1.1 Create Directory Structure**
```bash
mkdir -p scripts workflows/backups data/schemas docs memory_bank patterns tests
```

#### **1.2 Initialize Git & npm**
```bash
git init
npm init -y
```

#### **1.3 Essential Files to Create**
1. **`.gitignore`** (Recommended)
```
node_modules/
.env
.backup_tracker
.DS_Store
```

2. **`package.json`** - Add these scripts section:
```json
{
  "scripts": {
    "start-work": "bash scripts/work-start.sh",
    "branch": "bash scripts/git-workflow.sh",
    "backup": "bash scripts/git-backup.sh",
    "real-backup": "bash scripts/real-n8n-export.sh",
    "auto-backup": "bash scripts/auto-backup.sh",
    "schema-backup": "node scripts/enhanced-airtable-export.js"
  }
}
```

---

### **PHASE 2: Core Scripts Implementation (15 minutes)**

#### **2.1 Primary Workflow Script**
**File**: `scripts/git-workflow.sh`  
**Source**: [UYSP: scripts/git-workflow.sh](../../scripts/git-workflow.sh)

**🔧 CUSTOMIZATION REQUIRED**:
```bash
# Line 4: Update comment with your project name
# UYSP Git Workflow → [YOUR_PROJECT] Git Workflow

# Lines 55-56: Update branch naming pattern examples
echo "Example: npm run branch new session-2-compliance 'SMS/TCPA compliance'"
# → Update to your project's session/feature pattern
```

#### **2.2 Session Initialization Script**  
**File**: `scripts/work-start.sh`  
**Source**: [UYSP: scripts/work-start.sh](../../scripts/work-start.sh)

**🔧 CUSTOMIZATION REQUIRED**:
```bash
# Line 1: Update header
echo "🚀 UYSP Work Session Starting..."
# → echo "🚀 [YOUR_PROJECT] Work Session Starting..."

# Lines 33-35: Update command list to match your project needs
```

#### **2.3 Git Backup System**
**File**: `scripts/git-backup.sh`  
**Source**: [UYSP: scripts/git-backup.sh](../../scripts/git-backup.sh)

**🔧 CUSTOMIZATION REQUIRED**:
```bash
# Lines 15-20: Update project-specific status detection
PHASE_STATUS="Unknown"
if [ -f "memory_bank/active_context.md" ]; then
    PHASE_STATUS="Active Development"
fi
# → Update to match your project's status files
```

#### **2.4 Real Export Backup Script**
**File**: `scripts/real-n8n-export.sh`  
**Source**: [UYSP: scripts/real-n8n-export.sh](../../scripts/real-n8n-export.sh)

**🔧 CRITICAL CUSTOMIZATION REQUIRED**:
```bash
# Lines 9-10: MUST UPDATE with your IDs
WORKFLOW_ID="CefJB1Op3OySG8nb" # → Your main workflow ID
AIRTABLE_BASE_ID="appuBf0fTe8tp8ZaF" # → Your Airtable base ID
```

#### **2.5 Enhanced Schema Export**
**File**: `scripts/enhanced-airtable-export.js`  
**Source**: [UYSP: scripts/enhanced-airtable-export.js](../../scripts/enhanced-airtable-export.js)

**🔧 CRITICAL CUSTOMIZATION REQUIRED**:
```javascript
// Line 6: Update base ID
const AIRTABLE_BASE_ID = 'appuBf0fTe8tp8ZaF'; // → Your base ID

// Lines 33-42: Update key field patterns for your project
if (['email', 'phone_primary', 'first_name', /* your fields */].includes(field.name)) {
    keyFields[field.name] = field.id;
}
```

#### **2.6 Auto-Backup System**
**File**: `scripts/auto-backup.sh`  
**Source**: [UYSP: scripts/auto-backup.sh](../../scripts/auto-backup.sh)

**🔧 CUSTOMIZATION REQUIRED**:
```bash
# Lines 81-83: Update backup file pattern to match your exports
echo "📁 Total workflow backups:        $(ls ./workflows/backups/[YOUR_PATTERN]-*.json 2>/dev/null | wc -l)"
```

---

### **PHASE 3: Documentation Structure (10 minutes)**

#### **3.1 Master Documentation Guide**
**File**: `docs/CURRENT/MASTER-WORKFLOW-GUIDE.md`  
**Template Source**: [UYSP: docs/CURRENT/MASTER-WORKFLOW-GUIDE.md](../../docs/CURRENT/MASTER-WORKFLOW-GUIDE.md)

**🔧 CUSTOMIZATION REQUIRED**:
- Replace all "UYSP" references with your project name
- Update workflow IDs in examples
- Update base IDs in examples  
- Customize session naming patterns

#### **3.2 Documentation Navigation Hub**
**File**: `docs/README.md`  
**Template Source**: [UYSP: docs/README.md](../../docs/README.md)

**🔧 CUSTOMIZATION REQUIRED**:
- Update project-specific guide names
- Add your project's specific documentation files

#### **3.3 Scripts Directory Guide**
**File**: `scripts/README.md`  
**Template Source**: [UYSP: scripts/README.md](../../scripts/README.md)

**🔧 CUSTOMIZATION REQUIRED**:
- Update script names if you modify them
- Add any project-specific scripts

#### **3.4 Main Project README Updates**
**File**: `docs/README.md`  
**Template Section**: [UYSP: docs/README.md](../../docs/README.md)

**Add this section**:
```markdown
## 🔧 Development

### 📚 **WORKFLOW SYSTEM**

**🎯 SINGLE SOURCE OF TRUTH**: See `docs/MASTER-WORKFLOW-GUIDE.md`

**Quick Commands**:
- `npm run start-work` - Initialize work session
- `npm run branch new session-X-name 'description'` - Create feature branch
- `npm run branch switch <name>` - Switch safely
- `npm run real-backup` - Comprehensive backup
```

---

### **PHASE 4: Service-Specific Configurations**

#### **4.1 For n8n Projects**
**Requirements**:
- MCP n8n tools installed
- Workflow ID identified
- API access configured

**Setup**:
1. Get your main workflow ID: Use n8n MCP `list_workflows`
2. Test export: Use n8n MCP `export_workflow`  
3. Update `scripts/real-n8n-export.sh` line 9 with your workflow ID

#### **4.2 For Airtable Projects**
**Requirements**:
- MCP Airtable tools installed
- Base ID identified
- API key configured

**Setup**:
1. Get your base ID from Airtable URL
2. List tables: Use Airtable MCP `list_tables`
3. Update `scripts/enhanced-airtable-export.js` line 6 with your base ID
4. Update key field patterns (lines 33-42) for your specific tables

#### **4.3 For Other Cloud Services**
**Pattern to Follow**:
1. Create service-specific export script in `scripts/`
2. Add export call to `scripts/real-export.sh` (rename from real-n8n-export.sh)
3. Update `package.json` script names accordingly
4. Test export produces real JSON/data files

---

## 🚨 **CRITICAL IMPLEMENTATION REQUIREMENTS**

### **✅ MUST-DO CHECKLIST**

#### **Before First Use**:
- [ ] Updated all service IDs (workflow, base, etc.)
- [ ] Tested real export produces actual JSON files  
- [ ] Verified MCP tools work with your services
- [ ] Updated project name in all scripts/docs
- [ ] Created initial git commit
- [ ] Added GitHub remote origin

#### **Validation Tests**:
```bash
# Test each command works
npm run start-work
npm run branch status  
npm run real-backup
npm run auto-backup

# Verify real files created
ls -la workflows/backups/
ls -la data/schemas/

# Check git integration
git status
git log --oneline
```

#### **Common Failure Points**:
1. **Wrong Service IDs**: Exports fail silently or create empty files
2. **Missing MCP Tools**: Commands fail with "command not found"  
3. **Permission Issues**: Scripts not executable (`chmod +x scripts/*.sh`)
4. **Path Problems**: Scripts assume specific directory structure

---

## 🎯 **USER TRAINING GUIDE**

### **Essential Commands (Memorize These)**
```bash
npm run start-work              # Start any work session
npm run branch new <name> <desc> # Create new feature branch  
npm run branch switch <name>    # Switch branches safely
npm run branch status           # Check current state
npm run real-backup             # Force fresh backup
```

### **Recovery Scenarios**

#### **Scenario 1: AI Agent Deleted Workflow**
```bash
# 1. Check latest backup
ls -t workflows/backups/

# 2. Find recovery instructions  
ls -t data/schemas/*recovery*.md

# 3. Restore from most recent backup
# Follow instructions in recovery file
```

#### **Scenario 2: Lost Work After Branch Switch**
```bash
# 1. Check backup branches
npm run branch list | grep backup

# 2. Switch to backup branch
git checkout backup/[TIMESTAMP]

# 3. Create recovery branch
npm run branch new session-X-recovery 'Restore lost work'
```

#### **Scenario 3: Corrupted Project State**
```bash
# 1. Check GitHub backups
git remote -v
git fetch origin

# 2. List remote backup branches
git branch -r | grep backup

# 3. Pull clean state
git checkout origin/backup/[RECENT_TIMESTAMP]
```

---

## 📊 **SYSTEM ARCHITECTURE REFERENCE**

### **File Organization Pattern**
```
PROJECT_ROOT/
├── scripts/                    # All automation
│   ├── README.md              # Script navigation
│   ├── git-workflow.sh        # Main workflow commands  
│   ├── work-start.sh          # Session initialization
│   ├── real-[service]-export.sh # Service export scripts
│   ├── auto-backup.sh         # Scheduled backups
│   └── enhanced-[service]-export.js # Schema exports
├── docs/                      # Documentation hub
│   ├── README.md              # Documentation navigation
│   └── MASTER-WORKFLOW-GUIDE.md # Single source of truth
├── workflows/backups/         # Local workflow exports  
├── data/schemas/              # Schema exports + recovery
├── memory_bank/               # Project context (optional)
└── tests/                     # Testing framework (optional)
```

### **Command Flow Architecture**
```
npm run start-work
    ↓
work-start.sh
    ↓  
auto-backup.sh → real-[service]-export.sh → GitHub push
    
npm run branch new
    ↓
git-workflow.sh → backup → create branch → initial commit → push
```

### **Backup Redundancy Strategy**
1. **Local JSON**: `workflows/backups/` + `data/schemas/`
2. **Git Backup Branches**: `backup/YYYYMMDD-HHMM`  
3. **GitHub Remote**: All branches + files pushed
4. **Recovery Instructions**: Auto-generated restoration guides

---

## 🏆 **SUCCESS CRITERIA**

### **System Working Correctly When**:
- ✅ User can run `npm run start-work` and see status
- ✅ `npm run branch new` creates branches with backups
- ✅ `npm run real-backup` produces actual JSON files > 1KB
- ✅ Auto-backup runs every 4 hours without intervention  
- ✅ All documentation points to single master guide
- ✅ Recovery instructions auto-generate with each schema export
- ✅ No confusion about which scripts/commands to use

### **User Experience Success**:
- ✅ Non-technical user can follow voice commands
- ✅ Work never lost due to AI agent actions  
- ✅ Branch switching feels safe (automatic backups)
- ✅ Documentation easy to find and follow
- ✅ Recovery possible without technical expertise

---

## 🔗 **DIRECT FILE LINKS FOR COPYING**

### **Core Scripts (Copy These Exactly)**:
- [git-workflow.sh](../../scripts/git-workflow.sh) - Main workflow system
- [work-start.sh](../../scripts/work-start.sh) - Session initialization  
- [git-backup.sh](../../scripts/git-backup.sh) - Git backup branches
- [auto-backup.sh](../../scripts/auto-backup.sh) - Smart scheduling

### **Service Export Scripts (Customize These)**:
- [real-n8n-export.sh](../../scripts/real-n8n-export.sh) - n8n workflow export
- [enhanced-airtable-export.js](../../scripts/enhanced-airtable-export.js) - Airtable schemas

### **Documentation Templates (Customize These)**:
- [MASTER-WORKFLOW-GUIDE.md](../../docs/CURRENT/MASTER-WORKFLOW-GUIDE.md) - Main documentation
- [docs/README.md](../../docs/README.md) - Documentation navigation  
- [scripts/README.md](../../scripts/README.md) - Scripts navigation

### **Configuration Templates**:
- [package.json scripts section](../../package.json) - npm commands
- [README.md workflow section](../../docs/README.md) - Project documentation

---

## ⚠️ **IMPLEMENTATION WARNINGS**

### **Critical Don'ts**:
- ❌ **DON'T** skip service ID customization (will create fake backups)
- ❌ **DON'T** modify core logic without testing (backup system is delicate)  
- ❌ **DON'T** create additional backup scripts (causes confusion)
- ❌ **DON'T** skip documentation cleanup (creates chaos)

### **Testing Requirements**:
- ✅ **MUST** test real export creates actual JSON before trusting system
- ✅ **MUST** verify MCP tools work with your specific services
- ✅ **MUST** confirm git push works to your GitHub remote
- ✅ **MUST** validate auto-backup timing works correctly

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues & Solutions**:

**Issue**: "Command not found" errors  
**Solution**: Run `chmod +x scripts/*.sh` to make scripts executable

**Issue**: Empty backup files created  
**Solution**: Check service IDs are correct, test MCP tools manually

**Issue**: Git push fails  
**Solution**: Verify GitHub remote exists: `git remote -v`

**Issue**: Documentation not updating  
**Solution**: Clear any cached/old documentation files first

**Issue**: Auto-backup not running  
**Solution**: Check `.backup_tracker` file exists and has valid timestamp

---

## 🎯 **FINAL VALIDATION**

### **System Ready When ALL These Pass**:
```bash
# 1. Basic commands work
npm run start-work && echo "✅ Session start works"
npm run branch status && echo "✅ Git workflow works"  
npm run real-backup && echo "✅ Real backup works"

# 2. Files actually created
[ -f ".backup_tracker" ] && echo "✅ Auto-backup system ready"
[ "$(ls workflows/backups/*.json 2>/dev/null | wc -l)" -gt 0 ] && echo "✅ Workflow backups exist"
[ "$(ls data/schemas/*.json 2>/dev/null | wc -l)" -gt 0 ] && echo "✅ Schema backups exist"

# 3. Documentation accessible  
[ -f "docs/MASTER-WORKFLOW-GUIDE.md" ] && echo "✅ Master guide exists"
[ -f "scripts/README.md" ] && echo "✅ Scripts guide exists"

# 4. Git integration working
git remote -v | grep origin && echo "✅ GitHub remote configured"
git branch | grep backup && echo "✅ Backup branches exist"
```

**🎉 When all checks pass**: Your project has the complete UYSP workflow protection system!

---

**📋 IMPLEMENTATION ESTIMATE**: 30-45 minutes for complete setup  
**🛡️ PROTECTION LEVEL**: Production-grade, battle-tested  
**🎯 USER SKILL REQUIRED**: Non-technical (simple voice commands)  
**🔄 MAINTENANCE**: Fully automated, zero ongoing effort required