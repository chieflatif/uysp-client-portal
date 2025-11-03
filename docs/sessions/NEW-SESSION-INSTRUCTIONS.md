# NEW SESSION INSTRUCTIONS (ARCHIVED) — See Current Session Guide
## Complete Setup Guide for New Direction with Preserved Integration

> Archived. Use:
> - Current Session Guide: `context/CURRENT-SESSION/SESSION-GUIDE.md`
> - SSOT: `memory_bank/active_context.md`

---

## 🎯 **SITUATION SUMMARY**

### **What Happened**:
- ✅ **Foundational Systems Integration**: SUCCESSFULLY COMPLETED (99/100 health score)
- ❌ **Compliance Functionality**: FAILED (final.JSON not working)
- ✅ **Complete Backup**: All systems and work preserved in backup/20250801-141729
- 🔄 **New Direction**: Reverting to previous working JSON, new compliance approach needed

### **What's Preserved**:
- **Context Engineering System**: Fully operational with integrated rules and enforcement
- **Backup/Versioning System**: Automated 4-hour scheduling and Git workflows
- **Testing Infrastructure**: Evidence collection and UYSP-specific validation
- **Cross-System Integration**: Real-time correlation tracking and health monitoring
- **Complete Documentation**: User guides, patterns, troubleshooting, and procedures

### **What Needs Fresh Approach**:
- **Workflow JSON**: Revert to previous working version
- **Compliance Logic**: New implementation strategy required
- **Field Processing**: Different approach to compliance functionality

---

## 🚀 **NEW SESSION STARTUP PROTOCOL**

### **Step 1: Initialize Protected Session**

```bash
# Start new session with automatic backup check and system validation
npm run start-work
```

**Expected Output**:
- ✅ Auto-backup check (should show recent backup from session closure)
- ✅ Context engineering validation (.cursorrules/ loaded)
- ✅ Testing infrastructure health check
- ✅ Memory bank status update
- ✅ Cross-system correlation initiation

### **Step 2: Verify System Health**

```bash
# Confirm all foundational systems operational (should show 99/100)
npm run check-integrated-status
```

**Expected Results**:
- ✅ Context Engineering: 8/8 tests passed
- ✅ Backup/Versioning: 8/8 tests passed  
- ✅ Testing Infrastructure: 8/8 tests passed
- ✅ Cross-System Integration: 7/7 tests passed
- ✅ Overall Health Score: 99/100 (EXCELLENT)

### **Step 3: Create New Feature Branch**

```bash
# Create new branch with automatic pre-branch backup
npm run branch new feature-compliance-v2 "New compliance approach after v1 failure"
```

**What Happens Automatically**:
- ✅ **Pre-branch backup**: Creates backup/YYYYMMDD-HHMMSS
- ✅ **Comprehensive export**: n8n workflow + Airtable schema
- ✅ **Context preservation**: All .cursorrules/, memory_bank/, patterns/
- ✅ **Feature branch creation**: feature-compliance-v2 ready for development
- ✅ **Protection activation**: Development protection and correlation tracking

---

## 🔄 **WORKFLOW JSON REVERSION**

### **Step 4: Identify Working JSON Version**

```bash
# List all available workflow backups
ls -la workflows/backups/ | grep -E "(json|backup)" | sort -r

# Look for the most recent backup BEFORE the compliance failure
# Files will be named: uysp-lead-processing-WORKING-YYYYMMDD_HHMMSS.json
```

### **Available Backup Options** (based on backup listing):
```
uysp-lead-processing-WORKING-20250801_141716.json (CURRENT - FAILED)
uysp-lead-processing-WORKING-20250731_094349.json
uysp-lead-processing-WORKING-20250731_094247.json  
uysp-lead-processing-WORKING-20250731_094011.json
uysp-lead-processing-WORKING-20250731_093940.json
session-2-pre-implementation-20250724_161409.json
phase00-field-normalization-complete.json (BASELINE - KNOWN WORKING)
```

### **Recommended Reversion Strategy**:

#### **Option 1: Recent Working Version** (Recommended)
```bash
# Use the last working version before compliance implementation
# Likely: uysp-lead-processing-WORKING-20250731_094349.json
# This preserves most recent stable functionality
```

#### **Option 2: Known Stable Baseline**
```bash
# Use phase00-field-normalization-complete.json
# This is the confirmed working baseline with field normalization
# More conservative but definitely stable
```

### **Step 5: Implement JSON Reversion** (User Decision Required)

**IMPORTANT**: User must choose which JSON version to revert to based on:
- When the compliance issues started
- Which version was last known to work properly
- How much functionality you want to preserve vs. stability preference

**Command Structure** (user to execute after choosing version):
```bash
# Example (user replace YYYYMMDD_HHMMSS with chosen version):
cp workflows/backups/uysp-lead-processing-WORKING-YYYYMMDD_HHMMSS.json workflows/current-working.json

# Then import to n8n using MCP tools or manual import
```

---

## 🧪 **VALIDATION PROTOCOL**

### **Step 6: Test Reverted Workflow**

```bash
# Quick validation of reverted workflow
npm run run-tests
```

**Expected Evidence Collection**:
- ✅ Field normalization validation (≥95% target)
- ✅ Basic UYSP metrics collection
- ✅ Evidence file generation (JSON format)
- ✅ Cross-system correlation update
- ✅ Memory bank tracking update

**If tests fail**: Try earlier backup version until stable foundation found.

### **Step 7: Comprehensive Validation**

```bash
# Full validation once basic tests pass
npm run test-all
```

**Expected Comprehensive Evidence**:
- ✅ Complete UYSP workflow validation
- ✅ Evidence package (JSON + HTML reports)
- ✅ Field normalization ≥95%
- ✅ System health metrics
- ✅ Cost efficiency validation
- ✅ Stakeholder-friendly HTML dashboard

---

## 📋 **NEW COMPLIANCE APPROACH PLANNING**

### **Step 8: Document New Strategy**

#### **Update Active Context**:
```bash
# Update memory bank with new session objectives
# File: memory_bank/active_context.md
```

**New Session Context**:
```markdown
SESSION: New Compliance Approach v2
OBJECTIVE: Implement working compliance functionality with different strategy
STATUS: Fresh start after v1 failure
FOUNDATION: All integration work preserved and operational
APPROACH: [To be determined based on new strategy]
```

#### **Lessons from Previous Attempt**:
- **What to Avoid**: [Document what caused the compliance failure]
- **What to Preserve**: Field normalization, evidence collection, automated testing
- **New Strategy**: [Plan different approach to compliance logic]

### **Step 9: Plan Implementation Approach**

#### **Recommended Strategy Options**:

**Option A: Incremental Compliance**
- Start with working baseline
- Add compliance features one at a time
- Test each addition thoroughly before proceeding
- Use evidence-based validation at each step

**Option B: Parallel Development** 
- Keep working baseline as main workflow
- Create separate compliance validation workflow
- Integrate only after proven working independently
- Maintain fallback capability

**Option C: Simplified Compliance**
- Reduce complexity of compliance logic
- Focus on core compliance requirements only
- Add advanced features in later phases
- Prioritize stability over feature completeness

---

## ✅ **NEW SESSION READINESS CHECKLIST**

### **Before Beginning Development**:

#### **System Health Verification**:
- [ ] `npm run start-work` completed successfully
- [ ] `npm run check-integrated-status` shows 99/100 health score
- [ ] New feature branch created with `npm run branch`
- [ ] Workflow JSON reverted to working version
- [ ] Basic tests passing with `npm run run-tests`
- [ ] Memory bank updated with new session context

#### **Integration Preservation Confirmed**:
- [ ] Context Engineering rules loaded and enforced
- [ ] Backup system operational (4-hour scheduling active)
- [ ] Testing infrastructure collecting evidence
- [ ] Cross-system correlation tracking functional
- [ ] All documentation accessible and up-to-date

#### **Protection Mechanisms Active**:
- [ ] Cannot bypass backup requirements (.cursorrules/ enforcement)
- [ ] Cannot skip testing after changes (evidence validation)
- [ ] Cannot make success claims without evidence files
- [ ] Agent boundaries enforced (Testing vs Developer vs Context roles)
- [ ] Real-time health monitoring operational

---

## 🎯 **SUCCESS CRITERIA FOR NEW SESSION**

### **Development Goals**:
- **Working Compliance**: Achieve functional compliance logic (different approach)
- **Evidence-Based**: All success claims backed by comprehensive test evidence
- **Systematic Approach**: Follow integrated workflow (backup → develop → test → evidence)
- **Health Maintenance**: Maintain 99/100 integration health score
- **Stakeholder Communication**: Generate HTML reports for compliance validation

### **Quality Standards**:
- **Field Normalization**: ≥95% mapping accuracy maintained
- **UYSP Metrics**: Cost <$3/meeting, PDL qualification ≥90%
- **System Performance**: <2s execution time, no critical errors
- **Evidence Completeness**: 8-type evidence package for all success claims
- **Cross-System Harmony**: Real-time correlation tracking operational

### **Protection Standards**:
- **Backup Coverage**: No gaps >4 hours in backup protection
- **Testing Coverage**: Evidence collection after all code changes
- **Agent Compliance**: 100% boundary enforcement maintained
- **Documentation**: All changes documented with correlation tracking

---

## 🚀 **READY TO BEGIN**

**Command to Start New Session**:
```bash
npm run start-work
```

**Next Steps After System Verification**:
1. Create new feature branch
2. Revert to working JSON version
3. Validate basic functionality
4. Plan new compliance approach
5. Begin incremental development with evidence-based validation

**Integration Framework**: ✅ READY  
**Backup Protection**: ✅ ACTIVE  
**Testing Infrastructure**: ✅ OPERATIONAL  
**Evidence Collection**: ✅ READY  
**New Direction**: 🎯 READY TO BEGIN  

---

**The UYSP Lead Qualification System is ready for a fresh start with complete foundational protection and a new approach to compliance functionality.**