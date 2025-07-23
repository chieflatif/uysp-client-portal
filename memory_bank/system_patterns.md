memory_bank/system_patterns.md
# UYSP System Patterns

## Development Discipline
- NO HALLUCINATION: Build only from blueprint/patterns; quote specs.
- NO FEATURES: No extras/optimizations.
- NO ASSUMPTIONS: Ask if unclear.
- NO SHORTCUTS: Follow patterns exactly.
- TEST EVERYTHING: Node/component tests with actual output.
- DOCUMENT REALITY: Report only what exists/works.

## Role Boundaries
Responsible: n8n workflows (n8n-mcp), Airtable schema (airtable-mcp), testing (testsprite); Cursor as developer agent, Claude Desktop as manager.
Not: Business decisions, architecture changes, tool choices, teaching.

## Document Strategy
- Load only specified: Current session pattern, blueprint sections.
- Reference: Section/quote, no paraphrase.
- Check existence first.

## Session Structure
- Verify state: List workflows/tables.
- State next: Component, pattern ref, outcome.
- Response: Acknowledge, load, build, report, test.

## MCP Usage
- n8n-mcp: Create nodes/workflows.
- airtable-mcp: Create tables/records.
- testsprite: Test webhooks/APIs.
- claude-code-mcp: Code execution for fallbacks; announce switch before use.
Fallback: Diagnose, alternative (JSON), manual steps; switch to claude-code-mcp with announcement.

## Building Standards
- Pre-Build: Exists? Pattern? Output? Tests?
- Exact: No additions.
- Test Points: After component, before next, session end.
- Code Nodes: Try-catch, return success/data.
- Anti-Patterns: No caching/scheduling unless specified.

## Testing Protocol
- Prove: Show actual output, not assumptions.
- One file/session: e.g., Session1_tests.md with checks.
- Verification: Curl/response examples.

## Progress Reporting
- Component: ✓ Nodes, connections, tests, notes.
- Session: % complete, ✓/⏳/⏹ items.

## Implementation Rules
- Blueprint Alignment: Verify before build.
- Scope: No creep (e.g., no templates beyond spec).
- State: After component, list built/works/next/not.

## Patterns Integration
Incorporate exact node configs from patterns/*.txt.
- Core: Bootstrap vars/tables, webhook auth, upsert.
- Compliance: DND init, pre-flight checks.
- Enrichment: Two-phase, cache, scoring.
- SMS: Sending with checks, monthly count.
- Utilities: Metrics, Calendly, error handler.

## Common Tasks
- Workflows: Create inactive, log ID.
- Variables: Set in n8n.
- Credentials: Placeholders, human adds.

## Troubleshooting
- API 429: Retry exponential.
- Airtable 422: Check types.
- Webhook 404: Active/URL.

## Violations to Avoid
- No "added notifications".
- No "should work"—prove.
- No scope expansion.

Success: Matches blueprint exactly, tested, no extras.