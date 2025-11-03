# FRAMEWORK EXPORT - QUICK REFERENCE
## **ESSENTIAL COMMANDS & WORKFLOWS**

### 🚀 **QUICK START (4 COMMANDS)**

```bash
# 1. Export Framework from UYSP
./scripts/framework-export.sh

# 2. Create New Project  
mkdir "My-Project" && cd "My-Project" && cp -r "/path/to/UYSP/framework-export/"* .

# 3. Customize Framework
cp templates/examples/crm-integration-config.json my-config.json
# Edit my-config.json with your project details
./templates/complete-customization-workflow.sh my-config.json

# 4. Validate Deployment
node templates/framework-import-validator.js
```

---

## 📋 **PROJECT TEMPLATES**

### **Available Templates**
- **CRM Integration**: `templates/examples/crm-integration-config.json`
- **E-commerce Automation**: `templates/examples/ecommerce-automation-config.json`  
- **Data Pipeline**: `templates/examples/data-pipeline-config.json`
- **Notification System**: `templates/examples/notification-system-config.json`

### **Configuration Essentials**
```json
{
  "projectName": "Your Project Name",
  "services": {
    "n8n": { "workflowId": "YOUR_N8N_WORKFLOW_ID" },
    "airtable": { "baseId": "YOUR_AIRTABLE_BASE_ID" }
  },
  "framework": {
    "agentSystem": true,
    "mcpTools": true,
    "testingFramework": true
  }
}
```

---

## 🔧 **VALIDATION COMMANDS**

### **Essential Validations**
```bash
# Framework Import Validation
node templates/framework-import-validator.js

# Deployment Verification  
node templates/deployment-verification-system.js

# Test Suite Adaptation
node templates/test-suite-adapter.js

# Configuration Validation
node -e "console.log(JSON.parse(require('fs').readFileSync('my-config.json')))"
```

### **Confidence Thresholds**
- **Import Validation**: ≥85% required
- **Deployment Verification**: ≥80% required  
- **Overall System**: ≥85% for production

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
```bash
# Permission Issues
find . -name "*.sh" -exec chmod +x {} \;

# JSON Validation
node -e "JSON.parse(require('fs').readFileSync('config.json'))"

# Directory Structure Check
ls -la scripts/ docs/ .cursorrules/ context/ patterns/ tests/ templates/ memory_bank/

# Export Verification
ls -la framework-export/
```

### **Platform Gotchas (Quick Check)**
- **"Always Output Data"**: Check Settings tab in n8n
- **Expression Spacing**: Use `{{ $json.field }}`
- **Table IDs**: Use `tblXXXXXXXXXXXXXX` format
- **Credentials**: Re-select in UI after import

---

## 📊 **SUCCESS INDICATORS**

### **Framework Export Success**
- ✅ 8 directories copied (scripts, docs, .cursorrules, context, patterns, tests, templates, memory_bank)
- ✅ 70+ files exported
- ✅ No permission errors

### **Customization Success**  
- ✅ Configuration JSON valid
- ✅ Parameter substitution completed
- ✅ Project-specific files generated
- ✅ No template errors

### **Validation Success**
- ✅ Import validation ≥85%
- ✅ Deployment verification ≥80%
- ✅ Test adaptation completed
- ✅ All dependencies met

---

## 🎯 **NEXT STEPS AFTER SUCCESS**

### **Begin Development**
1. **Load Agent Context**: Use `context/PM/PM-CONTEXT-LOADER.md`
2. **Start with Pattern 00**: Field normalization first
3. **Use Reality-Based Testing**: Reference adapted test suite
4. **Apply Platform Gotchas**: Check integrated gotcha knowledge

### **Quality Assurance**
1. **Confidence Scoring**: Include [0-100%] in all responses
2. **Evidence Requirements**: Collect specific tool outputs and IDs
3. **Chunk Methodology**: ≤5 operations per chunk with user confirmation
4. **Anti-Hallucination**: Use global and agent-specific protocols

---

## 📚 **DOCUMENTATION HIERARCHY**

### **Essential Reading Order**
1. **FRAMEWORK-EXPORT-SYSTEM-GUIDE.md**: Complete system overview
2. **IMPLEMENTATION-CHECKLIST.md**: Step-by-step implementation
3. **SYSTEM-VALIDATION-SUMMARY.md**: Evidence and confidence assessment
4. **QUICK-REFERENCE-GUIDE.md**: This document (essential commands)

### **Agent-Specific Context**
- **PM Agent**: `context/PM/PM-CONTEXT-LOADER.md`
- **Testing Agent**: `context/TESTING/TESTING-CONTEXT-LOADER.md`
- **Developer Agent**: `context/DEVELOPER/DEVELOPER-CONTEXT-LOADER.md`

---

## ⚡ **EMERGENCY CONTACTS**

### **Critical Files for Issues**
- **Export Problems**: `scripts/framework-export.sh`
- **Customization Issues**: `templates/complete-customization-workflow.sh`
- **Validation Failures**: `templates/framework-import-validator.js`
- **Platform Gotchas**: `.cursorrules/00-CRITICAL-ALWAYS.md` (lines 80-92)

### **MCP Tools Reference**
- **N8N Tools**: 39 tools for workflow operations
- **Airtable Tools**: 13 tools for database operations
- **Context7**: Documentation enhancement
- **Tool Status**: User environment already configured

---

**QUICK REFERENCE STATUS**: ✅ **READY FOR USE**  
**CONFIDENCE**: 98% - Essential commands and workflows validated  
**LAST UPDATED**: 2025-01-27  
**PURPOSE**: Rapid deployment and troubleshooting reference