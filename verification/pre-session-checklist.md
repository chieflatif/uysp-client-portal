# Pre-Session Verification Checklist

## Environment Check
- [ ] TEST_MODE=true in n8n variables
- [ ] Airtable base ID: appuBf0fTe8tp8ZaF
- [ ] n8n workspace: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/

## Tools Verification
```bash
# Run these commands:
n8n-mcp list_workflows
airtable-mcp list_tables --base-id appuBf0fTe8tp8ZaF
```

## Pattern Check
- [ ] patterns/00-field-normalization-mandatory.txt EXISTS
- [ ] Current session pattern loaded
- [ ] Test payloads ready in tests/payloads/

## Memory Bank Status
- [ ] memory_bank/active_context.md current
- [ ] memory_bank/progress.md updated
- [ ] memory_bank/evidence_log.md ready

## Platform Gotchas Reminder
- [ ] Human ready to enable "Always Output Data" in UI
- [ ] Human ready to select credentials in UI
- [ ] Human understands webhook test mode
