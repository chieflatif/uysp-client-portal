# 📚 UYSP Documentation Directory - REORGANIZED 2025-01-27
[AUTHORITATIVE]
Last Updated: 2025-08-08
>
**⚠️ CRITICAL - NEW ORGANIZATIONAL STRUCTURE**

## 🎯 **FOLDER ORGANIZATION**

### **📁 CURRENT** (Active Development Documents)
>**Purpose**: Documents for active use in current Phase 2B development
>
- `README.md` - This guide (you are here)
- `critical-platform-gotchas.md` - Platform prevention measures (**ALWAYS CHECK**) [AUTHORITATIVE]
- `ICP-SCORING-V3-METHODOLOGY.md` - Current ICP scoring framework [AUTHORITATIVE]
- `PHASE-2B-TECHNICAL-REQUIREMENTS.md` - Current phase technical specs
- `MASTER-WORKFLOW-GUIDE.md` - Git, backup, session management [AUTHORITATIVE]

### **📁 PROCESS** (Workflow & Management)
>**Purpose**: How we work - procedures, workflows, and management
>
- `testing-registry-master.md` - **AUTHORITATIVE** testing status [AUTHORITATIVE]
- `documentation-control-system.md` - Documentation standards and control
- `webhook-testing-guide.md` - Testing procedures for webhooks  
- `UNIVERSAL-CURSOR-WORKFLOW-SYSTEM.md` - System replication guide

### **📁 ARCHITECTURE** (Technical Design)
>**Purpose**: System architecture and technical design documents
>
- `complete-enrichment-architecture-summary.md` - Complete system architecture
- `phase-2-enrichment-blueprint.md` - Next phase development guide
- `PDL-MIGRATION-ROADMAP.md` - PDL integration roadmap
- `PHASE-2-REMAINING-ROADMAP.md` - Remaining development phases
- `phone-number-lifecycle-strategy.md` - 3-field phone strategy

### **📁 ARCHIVE** (Historical/Outdated)
>**Purpose**: Documents that are no longer current but preserved for reference
>
- `outdated-2025-jan/` - Documents from previous organizational structure [HISTORICAL]
  - Note: Avoid referencing archived docs for current status. Use `PROCESS/testing-registry-master.md` and `CURRENT/*` instead.

---

## 🚀 **QUICK START GUIDE**

### **FOR CURRENT DEVELOPMENT** 
➡️ **Start Here**: `CURRENT/README.md` (this file)  
➡️ **Platform Issues**: `CURRENT/critical-platform-gotchas.md`  
➡️ **Current Phase**: `CURRENT/PHASE-2B-TECHNICAL-REQUIREMENTS.md`  
➡️ **ICP Methodology**: `CURRENT/ICP-SCORING-V3-METHODOLOGY.md`  

### **FOR WORKFLOW OPERATIONS**
➡️ **Git/Backup/Sessions**: `CURRENT/MASTER-WORKFLOW-GUIDE.md`  
➡️ **Testing Status**: `PROCESS/testing-registry-master.md`  
➡️ **Documentation Standards**: `PROCESS/documentation-control-system.md`  

### **FOR SYSTEM DESIGN**
➡️ **Overall Architecture**: `ARCHITECTURE/complete-enrichment-architecture-summary.md`  
➡️ **Future Planning**: `ARCHITECTURE/phase-2-enrichment-blueprint.md`  

---

## 🎯 **ROLE-BASED ACCESS**

### **PM AGENT**
**Primary Documents**:
- `memory_bank/active_context.md` - Current project state
- `context/CURRENT-SESSION/SESSION-GUIDE.md` - Current session context
- `PROCESS/testing-registry-master.md` - Testing coordination
- `CURRENT/ICP-SCORING-V3-METHODOLOGY.md` - Methodology oversight

### **DEVELOPER AGENT**  
**Primary Documents**:
- `CURRENT/critical-platform-gotchas.md` - Platform prevention
- `CURRENT/PHASE-2B-TECHNICAL-REQUIREMENTS.md` - Technical specs  
- `patterns/00-field-normalization-mandatory.txt` - Core patterns
- `ARCHITECTURE/complete-enrichment-architecture-summary.md` - System design

### **TESTING AGENT**
**Primary Documents**:
- `PROCESS/testing-registry-master.md` - Testing authority
- `PROCESS/webhook-testing-guide.md` - Testing procedures
- `tests/` directory - Test execution and evidence

---

## 🔄 **SESSION-BASED CONTEXT**

### **Current Session Context**
📁 `context/CURRENT-SESSION/` - Active Phase 2B development context  
📁 `context/ROLES/` - Persistent role responsibilities

### **Session Management**
All session transitions managed via `CURRENT/MASTER-WORKFLOW-GUIDE.md`

---

## ⚠️ **MIGRATION NOTES**

### **What Changed (2025-01-27)**
- **REORGANIZED**: Docs folder restructured by purpose, not chronology
- **ROLE ALIGNMENT**: Documentation now aligns with ROLE + SESSION structure
- **AUTHORITY CLARIFIED**: Each document has clear agent responsibility
- **OUTDATED ARCHIVED**: Phase 00 and old session docs moved to archive

### **Path Updates Required**
- Old: `docs/testing-registry-master.md` → New: `docs/PROCESS/testing-registry-master.md`
- Old: `docs/critical-platform-gotchas.md` → New: `docs/CURRENT/critical-platform-gotchas.md`
- Old: Session-based context → New: `context/CURRENT-SESSION/` + `context/ROLES/`

---

**🚨 IMPORTANT**: This reorganization ensures our three-agent system (PM, Developer, Testing) has clear document ownership and our role + session structure is properly supported.

**Last Updated**: 2025-01-27  
**Next Review**: After Phase 2B completion