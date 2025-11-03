# GOOGLE DRIVE RECOVERY ANALYSIS PROMPT FOR GEMINI

## SYSTEM MESSAGE FOR GEMINI

```
You are a Google Drive data recovery expert. I need comprehensive analysis and guidance on recovering deleted files and folders from Google Drive synchronization. This is a critical data recovery situation involving catastrophic loss of project documentation.

SITUATION OVERVIEW:
- A Cursor IDE project folder was being synchronized with Google Drive
- Critical project files and entire folders were deleted during a git merge conflict resolution
- The files were never committed to git, so git recovery is impossible
- Google Drive was actively syncing the project folder when the deletion occurred
- I need to understand Google Drive's recovery mechanisms and locate these files

ANALYSIS REQUIRED:

1. GOOGLE DRIVE RECOVERY MECHANISMS
   - How does Google Drive handle file deletions from synced folders?
   - What is the difference between "deleted from local" vs "deleted from Drive"?
   - How long does Google Drive retain deleted files in trash?
   - Does Google Drive maintain version history for files that were deleted?
   - What happens to folder structures when entire directories are deleted?

2. RECOVERY LOCATIONS TO CHECK
   - Where would deleted files appear in Google Drive web interface?
   - How to access Google Drive trash/bin functionality?
   - Are there hidden or archived locations for deleted sync files?
   - How to search for files by date range (specifically files deleted today)?

3. RECOVERY STRATEGIES
   - Step-by-step process to check Google Drive trash
   - How to search for files by name patterns in Google Drive
   - How to filter by modification/deletion date
   - How to recover entire folder structures vs individual files
   - What to do if files don't appear in standard trash location

4. TECHNICAL CONSIDERATIONS
   - Does Google Drive sync maintain local cache files anywhere?
   - Are there Google Drive desktop app logs that might show deletion events?
   - How to check Google Drive activity/audit logs for file operations?
   - What file recovery tools work with Google Drive sync folders?

Please provide detailed, actionable guidance for each of these areas. This is time-sensitive as deleted files may have retention limits.
```

## CRITICAL FILES TO SEARCH FOR

### PRIMARY TARGET: MAJOR-REFACTOR-CLAY-COM FOLDER
**Full Path**: `context/CURRENT-SESSION/MAJOR-REFACTOR-CLAY-COM/`

**Files in this folder:**
1. `SESSION-STATUS.md`
2. `DEVELOPMENT-PLAN-STEP-BY-STEP.md`
3. `AIRTABLE-SCHEMA.md`
4. `CLAY-RUNBOOK-NONTECH.md`
5. `N8N-MINIMAL-WORKFLOWS.md`
6. `SIMPLETEXTING-INTEGRATION.md`
7. `CLAY-SETUP-SHEET.md`
8. `CLAY-CONFIG.md`

### SECONDARY TARGET: ARCHITECTURE DOCUMENTS
**Full Path**: `docs/ARCHITECTURE/`

**Critical architecture files:**
1. `PHASE-2C-HUNTER-WATERFALL-FINAL-PLAN.md`
2. `PDL-MIGRATION-ROADMAP.md`
3. `PHASE-2-REMAINING-ROADMAP.md`
4. `complete-enrichment-architecture-summary.md`
5. `hunter-waterfall-development-plan.md`
6. `phase-2C-workflow-visual.html`
7. `phase-2C-workflow.mmd`
8. `phone-number-lifecycle-strategy.md`
9. `three-provider-waterfall-overview.md`

### TERTIARY TARGET: SYSTEM OVERVIEW
**Full Path**: `docs/system-overview/PROCESS/`

**Critical system files:**
1. `MAJOR-REFACTOR-CLAY-COM-PLAN.md` (THE MASTER PLAN)

### QUATERNARY TARGET: HANDOVER DOCUMENTS
**Full Path**: `docs/handovers/`

**Critical transcript files:**
1. `cursor_kickoff_major_refactor_for_clay.md` (4,344 lines)
2. `cursor_maintain_phase_0_realtime_ingest.md` (8,725 lines)
3. `handover_from_recovery_session.md` (created today, then lost)

## SEARCH KEYWORDS FOR GOOGLE DRIVE

If exact filename search fails, search for files containing these unique phrases:

### Content Keywords:
- "major-refactor-clay-com"
- "SimpleTexting API Integration"
- "Apollo-only enrichment strategy"
- "UYSP-SMS-Trigger workflow"
- "end-to-end SMS delivery"
- "Clay.com setup process"
- "n8n workflow cleanup"
- "Airtable trigger configuration"

### Project-Specific Terms:
- "UYSP Lead Qualification"
- "rebelhq.app.n8n.cloud"
- "appuBf0fTe8tp8ZaF" (Airtable base ID)
- "SimpleTexting v2 API"
- "MCP tools activation"

## GOOGLE DRIVE SEARCH STRATEGY

1. **Time-Based Search**: Look for files modified/deleted today's date
2. **Folder Structure Search**: Look for the specific folder paths listed above
3. **Content Search**: Use the keywords if Google Drive supports content search
4. **Activity Log**: Check Google Drive activity for bulk deletion events
5. **Trash Recovery**: Check if entire folders can be restored from trash

## RECOVERY PRIORITY ORDER

1. **HIGHEST**: `context/CURRENT-SESSION/MAJOR-REFACTOR-CLAY-COM/` folder
2. **HIGH**: `docs/system-overview/PROCESS/MAJOR-REFACTOR-CLAY-COM-PLAN.md`
3. **MEDIUM**: `docs/ARCHITECTURE/` folder contents
4. **LOW**: `docs/handovers/` transcript files

The MAJOR-REFACTOR-CLAY-COM folder is the absolute priority as it contains the current session's working documentation that cannot be recreated from any other source.
