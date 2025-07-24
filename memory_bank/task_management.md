# Task Management & Chunking Protocols

## Core Chunking Strategy

**Use chunking for all tasks: Identify issues in tables, fix one chunk at a time.**

### Task Identification Pattern
For complex tasks, break into maximum 3 issues and fix sequentially:

| Issue # | Description | Priority | Dependencies |
|---------|-------------|----------|--------------|
| 1 | [Main issue] | Critical | None |
| 2 | [Secondary issue] | High | Issue 1 complete |
| 3 | [Tertiary issue] | Medium | Issues 1-2 complete |

### Chunk Execution Format
**CHUNK X: [Issue] – Rules: [list], Tools: [list], Steps: [numbered]**

**Example:**
```
CHUNK 1: Smart Field Mapper Boolean Conversion
Rules: [Rule 7: Boolean conversion, Rule 2: Evidence-based]
Tools: [mcp_n8n_n8n_update_partial_workflow, curl, mcp_airtable_get_record]
Steps: 
1. Update boolean conversion logic in mapper
2. Test with known boolean payload
3. Verify Airtable record shows true/false values
4. Collect evidence and commit
```

Wait for user 'proceed' or 'go' before next chunk.

## Testing Task Management

### For Testing Tasks
1. Reference `tests/reality-based-tests-v3.json` for standardized payloads
2. Use n8n API for automated workflow activation where possible
3. Implement evidence collection automation
4. Include cleanup protocols with preservation

### Testing Sequence Pattern
| Phase | Task | Tools | Evidence Required |
|-------|------|-------|------------------|
| Setup | Workflow activation | n8n API | Activation confirmation |
| Execute | Run test payloads | curl, webhook | HTTP response codes |
| Verify | Check Airtable records | mcp_airtable_get_record | Record IDs |
| Cleanup | Remove test data | airtable-cleanup.js | Deletion counts |

## Evidence Collection Requirements

### Per Chunk Completion
- Tool execution results (success/failure)
- Evidence records (IDs, versions, timestamps)
- Git commit with descriptive message
- Table summary of changes

### Reality Check Protocol
Before any "complete" or "fixed" claims:
1. Use appropriate tool to fetch real data
2. If evidence missing: "Claim withheld due to lack of evidence. Running tool now."
3. Document assumptions vs. verified facts

## Context Engineering Integration

### Before Full Testing Execution
1. Update context engineering documentation
2. Append all new patterns/gotchas to phase00-completion-report.md
3. Commit changes with descriptive message
4. Present confirmation table to user
5. Only proceed on explicit user 'go' confirmation

### Documentation Update Table
| Update Type | File | Changes | Commit | Ready for Testing? |
|-------------|------|---------|--------|--------------------|
| [Type] | [File path] | [Summary] | [Hash] | [Yes/No] |

## Automation Patterns

### n8n Workflow Automation
- Use REST API for programmatic activation/execution
- Implement proper authentication with API keys
- Enable automated testing batches with deactivation post-run

### Airtable Operations
- Use batch operations (max 10 records per API call)
- Implement proper filtering to preserve production data
- Always backup before bulk operations

### Error Handling
- Auto-fail if >5% error rate in any test category
- Implement retry logic with exponential backoff
- Log all errors with context for debugging

## Honesty Declaration Protocol

**End every response with:**
HONESTY CHECK: [100% evidence-based / Assumptions: list]. No manipulations. If <100%, explain and correct.

This ensures transparency and prevents hallucination in task completion claims.

## KEY LEARNINGS INTEGRATION

### Technical Learnings Table
| Type | Description | File Reference | Status |
|------|-------------|----------------|--------|
| n8n API | REST API for workflow activation/execution | patterns/01-core-patterns.txt | ✅ Integrated |
| Airtable Boolean | Map false → null for checkbox fields | patterns/00-field-normalization-mandatory.txt | ✅ Integrated |
| Expression Safety | Use ternaries to preserve false values | docs/critical-platform-gotchas.md | ✅ Integrated |
| Cleanup Protocol | Batch delete with preservation filters | patterns/01-core-patterns.txt | ✅ Integrated |
| Evidence Blocks | Mandatory for all success claims | Updated task management protocols | ✅ Integrated |

### Non-Technical Learnings Table
| Type | Description | Implementation | Status |
|------|-------------|----------------|--------|
| Anti-Hallucination | Tool calls first, evidence blocks mandatory | All task protocols | ✅ Integrated |
| Chunking Protocol | ≤5 steps per chunk, user waits | Enhanced chunking strategy | ✅ Integrated |
| Honesty Assessment | End responses with honesty check | Honesty declaration protocol | ✅ Integrated |
| Task Management | Reference reality-based JSON, context updates | Testing task management | ✅ Integrated |

### Learnings Enforcement Protocol
1. **Before Implementation**: Reference technical learnings table for applicable patterns
2. **During Execution**: Use evidence blocks for all tool calls
3. **After Completion**: Update learnings table if new discoveries made
4. **Chunking**: Never exceed 5 operations without user confirmation
5. **Honesty**: End every response with evidence assessment

### Context Engineering Integration
- **Reference Pattern**: Always check learnings tables before starting tasks
- **Evidence Requirement**: Every success claim requires tool verification
- **Update Protocol**: Add new learnings to appropriate table with file references
- **Commit Pattern**: Git commit per chunk with learning integration notes