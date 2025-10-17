# Kajabi Integration - Session Folder
**Branch**: `feature/kajabi-integration`  
**Created**: October 17, 2025  
**Status**: 🔍 Investigation Phase

---

## 📁 FOLDER PURPOSE

This folder contains all work-in-progress documents for the Kajabi integration project. Think of this as the "working directory" for the current development session.

---

## 📄 DOCUMENTS IN THIS FOLDER

### 1. MASTER-TASK-LIST.md
**What it is**: The single source of truth for all tasks, dependencies, and progress tracking.

**Use this to**:
- See what needs to be done next
- Track overall progress
- Understand blockers and dependencies
- Update task status daily

**Update frequency**: Daily, or after completing any major task

---

### 2. LEAD-SOURCE-TRACKING-INVESTIGATION.md
**What it is**: Investigation and solution design for determining which Kajabi form/campaign triggered the lead capture.

**The problem**: When a lead registers for multiple webinars, how do we know which one to use for campaign routing?

**Use this to**:
- Understand the lead source tracking challenge
- Review potential solutions (4 options documented)
- Track investigation findings
- Make final solution decision

**Update frequency**: After API investigation complete, when solution chosen

---

### 3. KAJABI-API-INVESTIGATION-GUIDE.md
**What it is**: Step-by-step guide for systematically investigating Kajabi API capabilities.

**Use this to**:
- Test authentication
- Capture webhook payloads
- Analyze tag structures
- Document API endpoints
- Discover rate limits and quotas

**Update frequency**: During investigation (fill in as you test), final update when investigation complete

---

### 4. README.md (this file)
**What it is**: Quick orientation guide for this folder.

---

## 🚦 CURRENT STATUS

### What's Done:
✅ All planning documentation (81+ pages)  
✅ Technical spec complete  
✅ Investigation guides created  
✅ Task list established  
✅ Git branch created

### What's Blocking:
🔴 **Waiting for Kajabi API credentials from Ian**
- API key
- Site ID
- Test account access

### Next Steps:
1. Latif provides API credentials to Gabriel
2. Gabriel runs API investigation (2.5 hours)
3. Team makes lead source detection decision
4. Update specs with findings
5. Start Week 1 implementation

---

## 🔗 RELATED DOCUMENTS (Outside This Folder)

### Main Specification Documents
- `docs/architecture/KAJABI-INTEGRATION-SPEC.md` - Full technical spec (48 pages)
- `docs/architecture/KAJABI-INTEGRATION-SUMMARY.md` - Executive summary (7 pages)
- `docs/architecture/KAJABI-QUICK-START.md` - Developer quick start guide

### Session Documentation
- `context/CURRENT-SESSION/KAJABI-INTEGRATION-ACTION-CHECKLIST.md` - Detailed checklist
- `context/CURRENT-SESSION/KAJABI-TRANSCRIPT-ANALYSIS.md` - Transcript insights
- `context/CURRENT-SESSION/KAJABI-SESSION-SUMMARY.md` - Overall summary

---

## 📋 WORKFLOW

### Daily Work Routine:
1. **Start of day**: Read MASTER-TASK-LIST.md → identify next task
2. **During work**: Update relevant investigation docs with findings
3. **End of day**: Update MASTER-TASK-LIST.md progress section
4. **Major milestone**: Update all three docs + commit to git

### Decision-Making:
1. **Investigation findings** → Update investigation docs
2. **Solution chosen** → Update MASTER-TASK-LIST.md + main spec
3. **Task complete** → Check off in MASTER-TASK-LIST.md
4. **Blocker encountered** → Add to MASTER-TASK-LIST.md blockers section

---

## 🎯 HOW TO USE THIS FOLDER

### If you're Latif:
- Check MASTER-TASK-LIST.md for what Gabriel needs from you
- Review LEAD-SOURCE-TRACKING-INVESTIGATION.md to understand the challenge
- Provide API credentials to unblock investigation
- Answer open questions in investigation docs

### If you're Gabriel:
- Start with MASTER-TASK-LIST.md to see current priorities
- Use KAJABI-API-INVESTIGATION-GUIDE.md as your investigation checklist
- Document all findings in the investigation guide
- Update MASTER-TASK-LIST.md after each task
- Make solution recommendation in LEAD-SOURCE-TRACKING-INVESTIGATION.md

### If you're reviewing progress:
- Read MASTER-TASK-LIST.md → Overall progress section
- Check Update Log at bottom of MASTER-TASK-LIST.md
- Review blockers section to understand what's holding up work

---

## 🚀 QUICK START

**First time here?**
1. Read this README
2. Read MASTER-TASK-LIST.md (know what needs doing)
3. Skim LEAD-SOURCE-TRACKING-INVESTIGATION.md (understand the challenge)
4. Review KAJABI-API-INVESTIGATION-GUIDE.md (know how to investigate)

**Ready to work?**
1. Check MASTER-TASK-LIST.md → Immediate Priorities section
2. Find first unchecked task assigned to you
3. Follow instructions, use relevant investigation doc as guide
4. Document findings, check off task when complete

---

## 📝 FILE NAMING CONVENTION

All files in this folder use:
- UPPERCASE-WITH-DASHES.md
- Descriptive names
- .md extension (Markdown)

**Why?**: Easy to spot in file tree, clear purpose, consistent style

---

## 🔄 WHEN TO UPDATE

### MASTER-TASK-LIST.md
- ✅ Daily (end of day progress update)
- ✅ After completing any task
- ✅ When new blocker identified
- ✅ When decision made

### LEAD-SOURCE-TRACKING-INVESTIGATION.md
- ✅ After API investigation complete
- ✅ When solution chosen
- ✅ When new findings challenge assumptions

### KAJABI-API-INVESTIGATION-GUIDE.md
- ✅ During investigation (fill in as you test)
- ✅ After each API endpoint tested
- ✅ Final update when investigation complete

---

## 💡 PRO TIPS

1. **Keep task list current** - It's useless if outdated
2. **Document discoveries immediately** - Don't rely on memory
3. **Update blockers section** - Help others unblock you
4. **Use checkboxes** - Satisfying to check off! ✅
5. **Commit to git frequently** - Don't lose work
6. **Link between docs** - Cross-reference related info

---

## 📞 QUESTIONS?

- Check MASTER-TASK-LIST.md first (might be answered there)
- Review main spec documents (linked above)
- Ask in Slack: #uysp-debug
- Tag: @latif or @gabriel

---

**Last Updated**: October 17, 2025  
**Folder Status**: Active development  
**Next Review**: After API credentials received

---

*This folder is part of the Kajabi integration project. All files here are living documents - keep them updated!*

