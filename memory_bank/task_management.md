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