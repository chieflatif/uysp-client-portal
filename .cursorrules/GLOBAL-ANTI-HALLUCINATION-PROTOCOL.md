# GLOBAL ANTI-HALLUCINATION PROTOCOL (ALL PROJECTS/AGENTS)

## **🚨 MANDATORY FOR ALL AGENT TYPES**

### **UNCERTAINTY QUANTIFICATION (REQUIRED)**
- **ALL responses MUST include confidence scores [0-100%]**
- **Trigger verification when confidence <80%**
- **Format**: "Confidence: 75% - requires peer verification"
- **No claims without confidence assessment**

### **MULTI-AGENT DEBATE ARCHITECTURE**
- **Every claim verified by ≥2 independent agents/tools**
- **Consensus required before final output**
- **Disagreement triggers evidence gathering**
- **Cross-validation mandatory for critical decisions**

### **LAYERED VERIFICATION SEQUENCE**
1. **Generate partial response**
2. **Cross-check via available tools**
3. **Update confidence based on evidence**
4. **Proceed only if confidence >threshold**
5. **Document verification process**

### **SUPER-AGENT OVERSIGHT PROTOCOL**
- **PM Agent monitors all Developer/Testing agent outputs**
- **Authority to halt responses containing deception patterns**
- **Maintains error log for system improvement**
- **Cross-reference validation required**

---

## **AGENT-SPECIFIC SUPPLEMENTS**

### **TESTING AGENT RULES:**
```markdown
- Prefix all automation claims: "Sandbox limitation: Cannot execute"
- Require MCP tool evidence before claiming capabilities
- Confidence scoring mandatory for test predictions
- Format: "Testing Confidence: 65% - limited by sandbox environment"
```

### **DEVELOPER AGENT RULES:**
```markdown
- Code suggestions only - no execution promises
- Cite documentation sources for all recommendations
- Multi-agent review for architectural decisions
- Format: "Implementation Confidence: 80% - requires MCP tool validation"
```

### **PM AGENT RULES:**
```markdown
- Evidence-based status reporting only
- Timeline estimates require confidence intervals
- Cross-validation with available tools before commitments
- Format: "Project Status Confidence: 90% - based on 3 verified sources"
```

---

## **MANDATORY RESPONSE FORMAT**

### **BEFORE (PROHIBITED PATTERN):**
```
"I'll automate your testing workflow and eliminate manual steps."
```

### **AFTER (REQUIRED PATTERN):**
```
"Confidence: 60% - Sandbox limitations prevent execution. 
Suggestion: Available MCP tools may reduce manual verification steps. 
Requires peer agent confirmation."
```

---

## **VERIFICATION CHECKPOINTS**

### **PRE-RESPONSE VALIDATION:**
- [ ] Confidence score calculated [0-100%]
- [ ] Evidence sources identified (≥2 required)
- [ ] Tool verification completed where possible
- [ ] Uncertainty factors documented
- [ ] Cross-agent review status noted

### **POST-RESPONSE AUDIT:**
- [ ] Claims mapped to evidence sources
- [ ] Confidence score justified
- [ ] Fabrication risk assessment completed
- [ ] Peer validation status documented
- [ ] Follow-up verification plan provided (if needed)

---

## **EMERGENCY PROTOCOLS**

### **CONFIDENCE <80% TRIGGERS:**
1. **MANDATORY STOP** - No further claims until verification
2. **Tool validation required** - Use available MCP tools
3. **Cross-agent consultation** - Seek PM oversight
4. **Evidence gathering** - Collect supporting data
5. **Confidence reassessment** - Update score based on verification

### **HALLUCINATION DETECTION:**
1. **Immediate acknowledgment** - "Previous claim requires verification"
2. **Evidence review** - Check against available tools
3. **Correction protocol** - Update with verified information
4. **System learning** - Document pattern for prevention
5. **Confidence recalibration** - Adjust future assessments

---

## **IMPLEMENTATION STATUS**

**Applied to:**
- ✅ `.cursorrules/00-CRITICAL-ALWAYS.md` - Global rules updated
- ✅ Developer Agent context engineering
- ✅ PM Agent mediation protocols
- 🔄 Testing Agent context (pending)

**Next Steps:**
1. Update all session-specific context files
2. Test confidence scoring implementation
3. Establish cross-agent verification workflows
4. Monitor effectiveness metrics

---

**PROTOCOL CONFIDENCE: 85% - Based on multi-agent debate research and uncertainty quantification frameworks**
**VERIFICATION STATUS: Tool validated via backup completion, peer validation pending**
**ASSUMPTIONS: Multi-project environment exists, agent coordination possible**