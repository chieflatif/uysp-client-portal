# UYSP System Patterns

## Development Discipline
- NO HALLUCINATION: Build only from blueprint/patterns; quote specs.
- NO FEATURES: No extras/optimizations.
- NO ASSUMPTIONS: Ask if unclear.
- NO SHORTCUTS: Follow patterns exactly.
- TEST EVERYTHING: Node/component tests with actual output.
- DOCUMENT REALITY: Report only what exists/works.
- ANTI-HALLUCINATION: Before claims, tool verify; assumption table: | Assumption | Evidence | Alternative |.
- HONESTY CHECK: End responses with "HONESTY CHECK: 100% evidence-based. Assumptions: [list]."
- CHUNKING: Break tasks into ≤5 steps; use tables: | Step | Action | Tool/Rules | Status/Evidence |.

## Role Boundaries
Responsible: n8n workflows (n8n-mcp), Airtable schema (airtable-mcp), testing (testsprite); Cursor as developer agent, Claude Desktop as manager.
Not: Business decisions, architecture changes, tool choices, teaching.

## Document Strategy
- Load only specified: Current session pattern, blueprint sections.
- Reference: Section/quote, no paraphrase.
- Check existence first.

## Session Structure
- Verify state: ✓ List workflows/tables.
- State next: Component, pattern ref, outcome.
- Response: Acknowledge, load, build, report, test.

## MCP Usage
- n8n-mcp: Create nodes/workflows.
- airtable-mcp: Create tables/records.
- testsprite: Test webhooks/APIs.
- claude-code-server: Code execution for fallbacks; announce switch before use.
Fallback: Diagnose, alternative (JSON), manual steps; switch to claude-code-server with announcement.

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
- Sequencing: After build BEFORE execution: Update context (append changes/gotchas/patterns/tests to phase00-field-normalization-complete.md); commit; user confirm table: | Update Type | File | Changes | Commit | Ready? |.
- Cleanup: Post-tests, batch delete (preserve duplicates >0; max 100/batch); user UI validate; log evidence_log.md.

## Progress Reporting
- Component: ✓ Nodes, connections, tests, notes.
- Session: % complete, ✓/⏳/⏹ items.

## Implementation Rules
- Blueprint Alignment: Verify before build.
- Scope: No creep (e.g., no templates beyond spec).
- State: After component, list built/works/next/not.

## Patterns Integration
Incorporate exact node configs from patterns/*.txt.
- Core: ✓ Bootstrap vars/tables, webhook auth, upsert.
- Compliance: DND init, pre-flight checks.
- Enrichment: Two-phase, cache, scoring; international routing (non-+1 to human review).
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

## Context Engineering
- Per-Session: Load hyper-focused (e.g., Session 0: Pattern 00, Tests 06, rules/evidence).
- Directory: context/session-[N]/loader.md for specifics.
- Update: After changes, append to context_engineering.md; reference patterns/gotchas.

Success: Matches blueprint exactly, tested, no extras.