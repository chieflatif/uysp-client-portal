# UYSP Workflow Backup Procedure

**Last Updated:** November 2, 2025  
**Scope:** Official backup procedure for UYSP Lead Qualification Agent project

## Overview

The UYSP n8n project contains multiple workflows in various states. This document defines the authoritative scope of what MUST be backed up and why.

## Backup Scope: ALL Non-Archived Workflows

**Total Workflows to Backup:** 20 (ALL active + inactive, NO archived)

### Why This Scope?

- **Active workflows** (10): Running in production, critical to operations
- **Inactive workflows** (10): Not archived, still critical but intentionally disabled for business reasons
  - Example: `UYSP-Kajabi-API-Polling` is inactive but critical infrastructure
  - Example: `UYSP-Message-Scheduler-v2` is inactive due to batch control strategy
  - These are NOT obsolete—they're paused for operational control
- **Archived workflows** (~17): EXCLUDED—these are historical and can be retrieved from n8n archive if needed

## Backup Procedure

### Automated Script

Use the official backup script:

```bash
./scripts/backup-uysp-only.sh
```

**What it does:**
1. Queries n8n API for all specified workflows
2. Downloads each workflow as JSON
3. Validates JSON integrity
4. Creates timestamped backup directory
5. Commits to Git with comprehensive commit message
6. Pushes to GitHub

**Trigger:** Run whenever:
- Major changes to workflows
- Before system upgrades
- On a regular schedule (weekly recommended)

### Manual Verification

To verify backup completeness:

```bash
# List all backed up workflows
ls -la workflows/uysp-complete-backup/

# Count workflows
find workflows/uysp-complete-backup -name "*.json" | wc -l
# Expected: 20 (or close to 20, accounting for ongoing development)

# Verify Git history
git log --oneline | grep "backup: UYSP"
```

## Complete Workflow List

### Active Production (10)
- `3aOAIMbsSZYoeOpW` - safety-check-module-v2
- `3nA0asUTWdgYuCMf` - UYSP-Engagement-Score-Calculator-v1
- `5xW2QG8x2RFQP8kx` - UYSP-Daily-Monitoring
- `CmaISo2tBtYRqNs0` - UYSP-SimpleTexting-Reply-Handler
- `IzWhzHKBdA6JZWAH` - UYSP-AI-Reply-Sentiment-v2
- `LiVE3BlxsFkHhG83` - UYSP-Calendly-Booked
- `MLnKXQYtfJDk9HXI` - UYSP-Workflow-Health-Monitor-v2
- `kJMMZ10anu4NqYUL` - UYSP-Kajabi-SMS-Scheduler
- `pQhwZYwBXbcARUzp` - UYSP-SMS-Inbound-STOP
- `vA0Gkp2BrxKppuSu` - UYSP-ST-Delivery V2

### Inactive (Still Critical, Not Archived) (10)
- `0scB7vqk8QHp8s5b` - UYSP-Kajabi-API-Polling ⚠️ CRITICAL: Intentionally inactive
- `2cdgp1qr9tXlONVL` - UYSP-Realtime-Ingestion_Gabriel
- `39yskqJT3V6enem2` - UYSP-Twilio-Status-Callback
- `A8L1TbEsqHY6d4dH` - UYSP Backlog Ingestion - Hardened
- `AlOblqD8q1G7Iuq8` - UYSP-AI-Inbound-Handler ⚠️ Two-way SMS (Twilio)
- `AvawSqsjApV43lAr` - UYSP-Twilio-Click-Tracker
- `UAZWVFzMrJaVbvGM` - UYSP-Message-Scheduler-v2 ⚠️ Batch control strategy
- `e9s0pmmlZfrZ3qjD` - UYSP-Kajabi-Realtime-Ingestion
- `ujkG0KbTYBIubxgK` - UYSP-Twilio-Inbound-Messages
- `wNvsJojWTr0U2ypz` - UYSP-Health-Monitor (Old version, superseded by v2)

### Archived (NOT Backed Up, ~17 total)
- Available in n8n project archive if needed
- Can be restored from n8n if required for historical reference

## Common Mistakes to Avoid

❌ **DON'T:** Only backup "active" workflows
- Many critical workflows are intentionally inactive

❌ **DON'T:** Include archived workflows
- These are historical and shouldn't be part of the standard backup rotation

❌ **DON'T:** Backup individual workflows manually
- Use the script to ensure consistency and proper documentation

✅ **DO:** Run the script regularly
✅ **DO:** Include both active AND inactive workflows
✅ **DO:** Document the reason for any additions/removals to this list

## Maintenance

### Adding a New Workflow to Backup

1. Get the workflow ID from n8n
2. Add to `scripts/backup-uysp-only.sh` in the appropriate section (ACTIVE or INACTIVE)
3. Update this document with the new workflow details
4. Test the backup script
5. Commit with message: `docs: Add [workflow-name] to backup scope`

### Removing a Workflow from Backup

1. Remove from `scripts/backup-uysp-only.sh`
2. Update this document
3. Document the reason in commit message (e.g., "archived", "decommissioned", etc.)

### Archiving a Workflow

When a workflow should no longer be part of regular backups:
1. Archive it in n8n project
2. Remove from `scripts/backup-uysp-only.sh`
3. Commit with: `backup: Archive [workflow-name]`

## Related Files

- **Backup Script:** `scripts/backup-uysp-only.sh`
- **Backup Location:** `workflows/uysp-complete-backup/`
- **Last Backup Manifest:** `workflows/uysp-complete-backup/BACKUP-MANIFEST.txt`
- **Backup History:** `git log --oneline | grep "backup: UYSP"`
- **Project Reference:** [UYSP n8n Project](https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows)

## Recovery

To restore a backed-up workflow:

```bash
# List available backups
ls -la workflows/uysp-complete-backup/ | grep "[workflow-name]"

# Get the JSON content
cat workflows/uysp-complete-backup/[workflow-file].json

# In n8n: Import > Paste JSON
```

---

**This is the source of truth for UYSP workflow backup scope. Update this document when procedures change.**
