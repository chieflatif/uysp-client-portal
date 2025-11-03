[HISTORICAL]
Last Updated: 2025-08-08

# Session 2: Document Attachment Guide
*Optimal Context Engineering for Compliance & Safety Development*

## 🎯 **MANDATORY ATTACHMENT STRATEGY** [[memory:4136715]]

Based on our context engineering upgrade and Session 2 compliance development requirements, here are the **exact documents** you should attach to each Session 2 prompt:

### **CORE FOUNDATION** (Always Attach - 5 Documents)

1. **`.cursorrules/00-CRITICAL-ALWAYS.md`** ✅ 
   - **Why**: Contains context engineering upgrade protocols
   - **Key**: Anti-hallucination rules, evidence requirements, chunking protocols
   - **Usage**: Referenced for every tool call and success claim

2. **`docs/critical-platform-gotchas.md`** ✅
   - **Why**: Session 2 requires DND list and SMS compliance integration
   - **Key**: Airtable boolean mapping, API automation, expression safety
   - **Usage**: First reference before any compliance operations

3. **`memory_bank/active_context.md`** ✅
   - **Why**: Current state tracking and Session 1 completion status
   - **Key**: Phone versioning strategy, testing infrastructure status
   - **Usage**: State verification and foundation confirmation

4. **`patterns/02-compliance-patterns.txt`**
   - **Why**: Session 2 core implementation patterns for compliance
   - **Key**: DND checking, TCPA time windows, SMS limits, retry logic
   - **Usage**: Implementation reference for all compliance features

5. **`docs/reference/uysp-critical-patterns & enforcement.md`** ✅
   - **Why**: Contains enforcement rules and proven patterns
   - **Key**: Evidence requirements, testing protocols, integration rules
   - **Usage**: Enforcement reference throughout session

---

### **SESSION 2 SPECIFIC** (Compliance Focus - 4 Documents)

6. **`docs/phase-2-enrichment-blueprint.md`**
   - **Why**: Complete compliance and enrichment architecture
   - **Key**: ICP scoring thresholds, US-only phone validation, qualifying criteria
   - **Usage**: Strategic compliance requirements and integration points

7. **`docs/phone-number-lifecycle-strategy.md`**
   - **Why**: 3-field phone strategy critical for SMS compliance
   - **Key**: phone_original, phone_recent, phone_validated lifecycle
   - **Usage**: Phone handling integration with compliance checks

8. **`context/session-2/session-2-context-package.md`**
   - **Why**: Complete Session 2 development context
   - **Key**: Compliance implementation strategy, testing scenarios
   - **Usage**: Session-specific development guidance

9. **`docs/testing-registry-master.md`** ✅
   - **Why**: Single source of truth for testing status and requirements
   - **Key**: Session 1 completion evidence, testing protocols
   - **Usage**: Foundation verification and testing consistency

---

### **SPECIALIZED REFERENCE** (As Needed - 3 Documents)

10. **`patterns/04-sms-patterns.txt`** (When SMS Implementation)
    - **Why**: SMS delivery and template patterns
    - **Key**: SimpleTexting integration, delivery tracking
    - **Usage**: SMS sending implementation guidance

11. **`docs/documentation-control-system.md`** (For Updates)
    - **Why**: Ensures only authoritative documents referenced
    - **Key**: Documentation hierarchy and update protocols
    - **Usage**: Maintaining documentation consistency

12. **`tests/reality-based-tests-v3.json`** (For Testing)
    - **Why**: Test payloads and verification protocols
    - **Key**: Compliance test scenarios, edge cases
    - **Usage**: Validation of compliance implementation

---

## 📋 **SESSION 2 ATTACHMENT PROTOCOL**

### **For Compliance Development Tasks**
**ALWAYS ATTACH (9 documents)**:
1. `.cursorrules/00-CRITICAL-ALWAYS.md`
2. `docs/critical-platform-gotchas.md`
3. `memory_bank/active_context.md`
4. `patterns/02-compliance-patterns.txt`
5. `docs/reference/uysp-critical-patterns & enforcement.md`
6. `docs/phase-2-enrichment-blueprint.md`
7. `docs/phone-number-lifecycle-strategy.md`
8. `context/session-2/session-2-context-package.md`
9. `docs/testing-registry-master.md`

### **For SMS Implementation Tasks**
**ADD TO CORE SET**:
- `patterns/04-sms-patterns.txt`
- `tests/reality-based-tests-v3.json`

### **For Testing & Validation Tasks**
**ADD TO CORE SET**:
- `tests/reality-based-tests-v3.json`
- Session 2 specific test files when created

---

## 🎯 **CONTEXT ENGINEERING INTEGRATION**

### **Evidence Requirements for Session 2**
Every compliance feature implementation MUST include:
```
COMPLIANCE FEATURE: [Name]
STATUS: Complete
EVIDENCE:
- Workflow ID: ___
- Execution ID: ___
- Compliance Test Results: ___/18 passed
- DND Check: [Pass/Fail with record ID]
- Time Window: [Valid/Invalid with timestamp]
- SMS Limit: [Under/Over limit with count]
- Airtable Records: [IDs of compliance logs]
- Integration: [Preserves Sessions 0 & 1 functionality]
```

### **Chunking Strategy for Session 2**
Break compliance development into ≤5 step chunks:
1. **Chunk 1**: DND List Management
2. **Chunk 2**: TCPA Time Window Validation  
3. **Chunk 3**: SMS Monthly Limit Enforcement
4. **Chunk 4**: Universal Retry Logic
5. **Chunk 5**: Compliance Tracking Integration

### **Success Verification Protocol**
After each chunk, provide evidence table:
| Component | Tool Used | Status | Evidence | Integration Check |
|-----------|-----------|--------|----------|-------------------|
| DND Check | mcp_airtable | ✅/❌ | Record ID | Session 1 preserved |
| Time Window | n8n workflow | ✅/❌ | Execution ID | Phone strategy intact |

## 🚨 **CRITICAL SUCCESS FACTORS**

### **Must Preserve Previous Sessions**
- ✅ Sessions 0 & 1 functionality intact
- ✅ 3-field phone strategy preserved
- ✅ Field normalization working
- ✅ Testing infrastructure operational

### **Compliance Integration Points**
- ✅ Integrate with Smart Field Mapper output
- ✅ Use phone_validated field for SMS eligibility
- ✅ Route US-only leads per enrichment blueprint
- ✅ Maintain ICP scoring ≥70 requirement for SMS

### **Documentation Control**
- ✅ Reference only authoritative documents
- ✅ Update testing registry upon completion
- ✅ Maintain evidence chain for all changes
- ✅ Follow git workflow for all commits

This attachment strategy ensures Session 2 compliance development has complete context while preserving all previous session achievements and following our upgraded context engineering protocols. 