# Session 0 Evidence Verification System

**Created**: July 23, 2025  
**Purpose**: Prevent catastrophic lies in testing claims  
**Status**: MANDATORY for all test executions  

## 🚨 EVIDENCE REQUIREMENTS

### MANDATORY DATA FOR EACH TEST
```
## Test [X.Y]: [Description]
**Time**: [ISO timestamp]
**Execution ID**: [n8n-execution-id]
**Status**: [SUCCESS/FAILURE]
**Airtable Record**: [rec-ID or N/A]
**Payload**: [exact JSON payload]
**Response**: [workflow response or error]
**Evidence**: [specific verification data]
**Notes**: [any observations]
---
```

### SUCCESS CRITERIA VERIFICATION
- [ ] ≥20 documented test executions
- [ ] ≥90% success rate with honest failure documentation
- [ ] Unknown field logging verified with actual unknown fields
- [ ] Boolean conversion verified with actual boolean inputs  
- [ ] International phone detection verified with non-US numbers
- [ ] Evidence committed to Git with timestamps
- [ ] Cross-verification between N8N, Airtable, and Git history

### EXECUTION LOG
*All test evidence will be documented below as testing progresses...*

## HONESTY COMMITMENT
I commit to documenting EVERY test execution with immutable evidence, including failures, and will NOT claim success without verifiable proof in this file and Git history.

**Signature**: [To be completed when testing begins]
**Date**: [To be completed when testing begins] 