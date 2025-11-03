# 📋 Documentation Audit Checklist

**Purpose**: Systematically audit Tier 2-3 uncertain documents to determine VibeOS vs. UYSP ownership

---

## 🟠 TIER 2: docs/architecture/ (Need to audit 19 files)

### Quick Decision Tree
```
Does it mention?
├─ "Airtable schema" → UYSP (keep)
├─ "Clay integration" → UYSP (keep)
├─ "SMS sequence" → UYSP (keep)
├─ "Behavioral tuning" → VibeOS (move)
├─ "Cascade" → VibeOS (move)
├─ "Memory architecture" → VibeOS (move)
├─ "Client portal spec" → UYSP (keep)
├─ "Lead enrichment" → UYSP (keep)
└─ "Framework export" → ? (need to check)
```

### Files to Audit

- [ ] `AIRTABLE-SCHEMA.md`
  - **Quick check**: First line mentions "Airtable"
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `ARCHIVE/` (folder)
  - **Action**: Is this UYSP archive or VibeOS archive?
  - **Decision**: _________

- [ ] `CLAY-BATCHING-AUTOMATION-PLAN.md`
  - **Quick check**: "Clay" = UYSP feature
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`
  - **Quick check**: "Client Portal" = UYSP
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `EXPLORABLE-DEV-ENV-INVENTORY.md`
  - **Quick check**: Development environment inventory?
  - **Could be**: VibeOS (framework) or UYSP-specific
  - **Decision**: ?
  - **Action**: Open file, check first 20 lines

- [ ] `INDEX.md`
  - **Quick check**: Architecture index
  - **Could be**: Overview of all architecture (which project?)
  - **Decision**: ?
  - **Action**: Open file, see what it indexes

- [ ] `INGRESS-NORMALIZATION-STANDARD.md`
  - **Quick check**: Data normalization
  - **Could be**: UYSP (data pipeline) or VibeOS (framework)
  - **Decision**: ?
  - **Action**: Open file, check context

- [ ] `LIST-DUE-LEADS-CRITICAL-CONFIG.md`
  - **Quick check**: "Leads" + "config" = UYSP
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `MAIN-DEVELOPMENT-PLAN.md`
  - **Quick check**: Main plan for what project?
  - **Could be**: UYSP or VibeOS
  - **Decision**: ?
  - **Action**: Open file, check context

- [ ] `N8N-MINIMAL-WORKFLOWS.md`
  - **Quick check**: n8n workflows
  - **Could be**: VibeOS framework example OR UYSP workflow
  - **Decision**: ?
  - **Action**: Open file, check if generic or UYSP-specific

- [ ] `SIMPLETEXTING-INTEGRATION.md`
  - **Quick check**: "SimpleTexting" = UYSP integration
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `SMS-CLAY-ENRICHMENT-SESSIONS-PLAN.md`
  - **Quick check**: "SMS" + "Clay" + "Enrichment" = UYSP feature
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `SMS-CLAY-ENRICHMENT-WIREFRAME.md`
  - **Quick check**: SMS/Clay wireframe = UYSP
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `SMS-DECISIONS-AND-OPEN-QUESTIONS.md`
  - **Quick check**: SMS decisions = UYSP
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `SMS-SEQUENCE-REALISTIC-ARCHITECTURE.md`
  - **Quick check**: SMS sequence = UYSP
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `SMS-SEQUENCE-SAFETY-PLAN.md`
  - **Quick check**: SMS sequence safety = UYSP
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `SMS-SEQUENCER-ADDENDUM.md`
  - **Quick check**: SMS sequencer = UYSP
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `UYSP-END-TO-END-WORKFLOW.html`
  - **Quick check**: "UYSP" in filename
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `UYSP-END-TO-END-WORKFLOW.md`
  - **Quick check**: "UYSP" in filename
  - **Decision**: ✅ UYSP (KEEP)

---

## 🟡 TIER 3: Root-Level Uncertain Files

### Context Clues for Decision Making

**Likely UYSP** (if mentions):
- Lead enrichment, Clay, SMS, SMS sequencing, booking, click tracking
- Apollo integration, calendly, Airtable, n8n
- UYSP-specific workflow, client portal features
- Session numbers, phase numbers, specific to our builds

**Likely VibeOS** (if mentions):
- Behavioral tuning, cascade, memory architecture, rules
- General framework, AI orchestration, general automation
- Operating system concepts
- Generic patterns (not UYSP-specific)

### Files to Audit

- [ ] `./129-DELETED-FILES-LIST.md`
  - **Purpose**: List of deleted files?
  - **Decision**: ?
  - **Action**: Open, check what was deleted (UYSP or VibeOS?)

- [ ] `./COMPLETE-BUSINESS-LOGIC-MAP.md`
  - **Purpose**: Map of business logic
  - **Could be**: UYSP business logic OR VibeOS general logic
  - **Decision**: ?
  - **Action**: Open, check context

- [ ] `./COMPLETE-DEPENDENCY-MATRIX.md`
  - **Purpose**: Dependencies matrix
  - **Could be**: UYSP dependencies OR VibeOS dependencies
  - **Decision**: ?
  - **Action**: Open, check what depends on what

- [ ] `./COMPLETE-LOSS-INVENTORY.md`
  - **Purpose**: What was lost/deleted?
  - **Could be**: UYSP recovery OR VibeOS recovery
  - **Decision**: ?
  - **Action**: Open, check context

- [ ] `./COMPREHENSIVE-RECOVERY-DOCUMENTATION.md`
  - **Purpose**: Recovery documentation
  - **Could be**: UYSP recovery OR VibeOS recovery plan
  - **Decision**: ?
  - **Action**: Open, check if mentions specific features

- [ ] `./CRITICAL-DEPENDENCIES-SUMMARY.md`
  - **Purpose**: Critical dependencies summary
  - **Could be**: UYSP OR VibeOS
  - **Decision**: ?
  - **Action**: Open, check what has dependencies

- [ ] `./DEEP-DIVE-SMS-SCHEDULER-ANALYSIS.md`
  - **Quick check**: "SMS Scheduler" = UYSP feature
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `./EMERGENCY-DISASTER-RECOVERY-PLAN.md`
  - **Purpose**: Disaster recovery
  - **Could be**: UYSP incident response OR VibeOS framework recovery
  - **Decision**: ?
  - **Action**: Open, check if mentions specific UYSP features

- [ ] `./FRESH-AGENT-COMPREHENSIVE-BRIEFING.md`
  - **Purpose**: Briefing for new agent
  - **Could be**: UYSP briefing OR VibeOS briefing
  - **Decision**: ?
  - **Action**: Open, check what project it briefs on

- [ ] `./FRESH-START-RECOVERY-PLAN.md`
  - **Purpose**: Fresh start plan
  - **Could be**: UYSP recovery OR VibeOS setup
  - **Decision**: ?
  - **Action**: Open, check context

- [ ] `./GAP-ANALYSIS-REPORT.md`
  - **Purpose**: Gap analysis (for what?)
  - **Could be**: UYSP gaps OR VibeOS gaps
  - **Decision**: ?
  - **Action**: Open, check what gaps are identified

- [ ] `./GOOGLE-DRIVE-RECOVERY-PROMPT.md`
  - **Purpose**: Google Drive recovery
  - **Could be**: UYSP file recovery OR VibeOS documentation recovery
  - **Decision**: ?
  - **Action**: Open, check context

- [ ] `./SCHEDULER-IMPROVEMENT-PROPOSAL-V3.md`
  - **Quick check**: "Scheduler" = SMS Scheduler (UYSP)
  - **Decision**: ✅ UYSP (KEEP)

- [ ] `./WORKFLOW-EVIDENCE-CATALOG.md`
  - **Purpose**: Evidence catalog
  - **Could be**: UYSP workflow evidence OR VibeOS framework evidence
  - **Decision**: ?
  - **Action**: Open, check what workflows are documented

---

## `framework-export-system/` (Entire Folder)

**Questions to answer**:
- [ ] Is this a generic VibeOS framework for exporting?
- [ ] Or is this specific to UYSP project?
- [ ] Check: `framework-export-system/docs/AI-AGENT-INSTRUCTIONS.md`
- [ ] Check: `framework-export-system/CLEANUP-ANALYSIS-MATRIX.md`

**Decision**: ?
**Action**: Open key files, determine if generic or UYSP-specific

---

## 📋 AUDIT PROCESS

### For Each File:

1. **Open the file**
2. **Read first 20 lines** (usually makes it clear)
3. **Look for keywords**:
   - UYSP keywords (Clay, SMS, lead, booking, etc.)
   - VibeOS keywords (cascade, behavioral, memory, etc.)
   - Project-specific names (Rebel HQ, client names, etc.)
4. **Decide**: ✅ KEEP (UYSP) or 📤 MOVE (VibeOS)
5. **Mark in checklist**

### Decision Guide:

| Decision | Action | Location |
|----------|--------|----------|
| ✅ UYSP (KEEP) | Leave in UYSP | `/UYSP Lead Qualification V1/` |
| 📤 VibeOS (MOVE) | Copy to VibeOS5 | `/VibeOS5/VibeOS/enhancements/uysp-workspace-debris/` |
| ❓ UNCERTAIN | Ask user | Wait for clarification |

---

## 🎯 AFTER AUDIT

**Summarize results**:
```
Total files audited: X
✅ KEEP in UYSP: X
📤 MOVE to VibeOS: X
❓ UNCERTAIN (ask user): X
```

Then execute cleanup:
```bash
# Move all MOVE files
cp -r [MOVE files] /VibeOS5/VibeOS/enhancements/uysp-workspace-debris/

# Delete from UYSP (after confirming copies exist)
rm [MOVE files]
```

---

**Ready to audit when you confirm the decision tree makes sense.**
