# 🛠️ Scripts Directory

**⚠️ CRITICAL - READ THIS FIRST**

## 🎯 **ACTIVE SCRIPTS - USE THESE**

### **Workflow Commands (PRIMARY)**
- **`git-workflow.sh`** ← Main workflow system (npm run branch)
- **`work-start.sh`** ← Session initialization (npm run start-work)

### **Backup Systems**  
- **`git-backup.sh`** ← Git backup branches (npm run backup)
- **`real-n8n-export.sh`** ← n8n + Airtable export (npm run real-backup)
- **`auto-backup.sh`** ← Smart scheduling (npm run auto-backup)
- **`enhanced-airtable-export.js`** ← Schema export (npm run schema-backup)

### **Workflow Management**
- **`workflow-positioner-cli.js`** ← n8n workflow positioning
- **`workflow-positioning-utils.js`** ← Positioning utilities  
- **`smart-positioning.js`** ← Smart positioning logic

### **Utilities**
- **`fix-airtable-upsert-architecture.js`** ← Airtable fixes

## 🚫 **DO NOT USE - REMOVED/DEPRECATED**

### **Removed Scripts:**
- ❌ `smart-branch.sh` (deleted - conflicted with git-workflow.sh)
- ❌ `session-2-backup.sh` (deleted - fake metadata backup)

### **Deprecated Patterns:**
- ❌ Multiple conflicting backup approaches  
- ❌ Scattered git command implementations
- ❌ Session-specific backup scripts

## 🎯 **QUICK REFERENCE**

### **Primary Commands:**
```bash
npm run start-work        # Initialize session
npm run branch <command>  # All git operations  
npm run real-backup       # Comprehensive backup
npm run auto-backup       # Smart backup
```

### **Command Mapping:**
| Command | Script | Purpose |
|---------|--------|---------|
| `npm run branch` | `git-workflow.sh` | Unified git operations |
| `npm run start-work` | `work-start.sh` | Session startup |
| `npm run backup` | `git-backup.sh` | Git backup branches |
| `npm run real-backup` | `real-n8n-export.sh` | Full export backup |
| `npm run auto-backup` | `auto-backup.sh` | Smart scheduling |
| `npm run schema-backup` | `enhanced-airtable-export.js` | Schema only |

---

**🚨 CLEANUP COMPLETED**: All conflicting/duplicate scripts removed. Single unified approach established.