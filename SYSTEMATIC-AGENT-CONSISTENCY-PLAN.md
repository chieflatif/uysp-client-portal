# 🔧 SYSTEMATIC AGENT CONSISTENCY PLAN
## **CREATE IDENTICAL STRUCTURE FOR ALL THREE AGENTS**

## **📊 CURRENT INCONSISTENCY REVEALED:**

**PM AGENT**:
- context/PM/: 1 file (context loader)
- docs/agents/PM/: **EMPTY** (0 files)
- .cursorrules/PM/: 1 file (master guide)

**TESTING AGENT**:
- context/TESTING/: 4 files (mixed content)
- docs/agents/TESTING/: 2 files 
- .cursorrules/TESTING/: 4 files (comprehensive)

**DEVELOPER AGENT**:
- context/DEVELOPER/: 1 file (README.md) 
- docs/agents/DEVELOPER/: 2 files (comprehensive)
- .cursorrules/DEVELOPER/: 2 files (master guide + contamination)

## **✅ TARGET: IDENTICAL STRUCTURE FOR ALL THREE AGENTS**

```
CONSISTENT TARGET STRUCTURE:
├── context/[AGENT]/
│   └── [AGENT]-CONTEXT-LOADER.md         # SAME FOR ALL
├── docs/agents/[AGENT]/
│   ├── [AGENT]-HANDOVER-PACKAGE.md       # SAME FOR ALL
│   └── [AGENT]-KICKOFF-PROMPT.md         # SAME FOR ALL
└── .cursorrules/[AGENT]/
    ├── [AGENT]-MASTER-GUIDE.md           # SAME FOR ALL
    └── [AGENT]-ANTI-HALLUCINATION-PROTOCOL.md # SAME FOR ALL
```

## **🔧 SYSTEMATIC ACTIONS REQUIRED:**

### **1. STANDARDIZE CONTEXT/ (Context Loaders Only)**
- ✅ PM: Already has context loader
- 🔧 TESTING: Replace 4 files with single context loader
- 🔧 DEVELOPER: Replace README with proper context loader

### **2. STANDARDIZE docs/agents/ (Handover + Kickoff)**
- 🔧 PM: CREATE handover package + kickoff prompt
- 🔧 TESTING: CREATE handover package + kickoff prompt  
- ✅ DEVELOPER: Already has both files

### **3. STANDARDIZE .cursorrules/ (Master Guide + Anti-Hallucination)**
- 🔧 PM: ADD anti-hallucination protocol
- 🔧 TESTING: CONSOLIDATE to master guide + anti-hallucination  
- ✅ DEVELOPER: Already has both

### **4. CLEAN NAMING CONSISTENCY**
- Standardize file naming across all agents
- Remove duplicates and scattered content
- Ensure identical structure pattern

**EXECUTING SYSTEMATIC CLEANUP NOW...**