# Evidence Collection Templates

## Component Complete
```
COMPONENT: [Name]
STATUS: Complete
EVIDENCE:
- Workflow ID: ___
- Export Path: workflows/backups/[timestamp]-[component].json
- Test Payload: tests/payloads/[test-name].json
- Test Result: tests/results/[timestamp]-result.json
- Airtable Records: [rec1, rec2, rec3]
- Field Success Rate: ___%
```

## Test Execution
```
TEST: [Description]
PAYLOAD: [Reference]
EVIDENCE:
- Execution ID: ___
- Duration: ___ms
- Webhook Response: 200
- Fields Normalized: __/__
- Airtable Created: recXXXXXXXXXXXXXX
- Screenshot: tests/results/[timestamp].png
```

## Error Resolution
```
ERROR: [Type]
SYMPTOM: [What happened]
DIAGNOSIS: [Root cause]
FIX: [What changed]
EVIDENCE:
- Before: [State/Error]
- After: [Working state]
- Verification: [How tested]
```
