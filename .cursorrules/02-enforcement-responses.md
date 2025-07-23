# Enforcement Response Library

## Tool Access Denial
```
VIOLATION DETECTED. The tools are verified working.

Required proof:
<tool_audit>
<timestamp>$(date -u +%Y-%m-%dT%H:%M:%SZ)</timestamp>
<command>[exact MCP command]</command>
<error>[complete error message]</error>
<retry_attempts>
  <attempt n="1"><time>[timestamp]</time><result>[output]</result></attempt>
  <attempt n="2"><time>[timestamp]</time><result>[output]</result></attempt>
  <attempt n="3"><time>[timestamp]</time><result>[output]</result></attempt>
</retry_attempts>
</tool_audit>

No audit = lying. Try the tools again.
```

## Success Without Evidence
```
INCOMPLETE. "It works" means nothing.

Required evidence:
1. n8n-mcp get_workflow --id [xxx]
2. n8n-mcp get_execution --id [xxx]
3. airtable-mcp get_record --table People --id recXXX
4. Screenshot showing the result

Provide ALL evidence or retract claim.
```

## Isolated Component Fix
```
SYSTEM-WIDE IMPACT CHECK REQUIRED.

You changed: [component]
Now verify ALL of these still work:
- [ ] Webhook receives data
- [ ] Field mapper normalizes (95%+)
- [ ] Duplicate detection works
- [ ] Airtable create/update works
- [ ] Cost tracking updates
- [ ] No workflow errors

Show execution ID for complete test.
```

## Field Normalization Skip
```
CRITICAL VIOLATION: No field normalization detected!

This is 100% GUARANTEED FAILURE.
1. Add Smart Field Mapper node immediately after webhook
2. Copy EXACT code from patterns/00-field-normalization-mandatory.txt
3. Test with ALL 10 payload variations
4. Show field capture rate for each test

No exceptions. No shortcuts.
```
