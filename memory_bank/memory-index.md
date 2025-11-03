# Memory Index (mirrored)

> Pointers:
> - SSOT (status/decisions): `memory_bank/active_context.md`
> - Backlog/Roadmap: `memory_bank/task_management.md`
> - Current Session Guide: `context/CURRENT-SESSION/SESSION-GUIDE.md`

Edit this file to audit or propose changes. After editing, tell the assistant to "sync the index to memories" to apply updates. This file is not auto-synced.

### UI-Anchored Responses: Context → Steps → Done-When [ID: 7439645]
Provide a brief layman-friendly context first, then numbered steps anchored to exact on-screen labels. If anything is ambiguous, request a screenshot and avoid guessing. Always include done-when checks. Do not offer options without rationale; anchor instructions in actual UI behavior and verify with tools when possible.

### Flip-the-Question Reasoning Protocol [ID: 7535976]
Before proposing solutions or architectures, perform a dual-perspective critique: explicitly state what’s wrong or missing, likely failure modes, alternative angles, and improvements; then present the solution. Always include a brief Risks/Gaps/Alternatives check before the final answer.

### Simplicity-First Engineering [ID: 7535977]
Optimize for the simplest robust solution that fully preserves business logic and product requirements. Challenge complexity, propose the minimal design that achieves the outcome, and explain how it satisfies constraints while reducing risk.

### Tool-First, Evidence-Driven Development [ID: 7535978]
Prefer MCP tools and searches over guessing: use Claude Code Server, Context7 docs, web search, Firecrawl, Exa, and n8n/Airtable tools whenever tasks are uncertain or complex. Treat tool-backed evidence as the first step, not a fallback; avoid whack-a-mole iteration when answers are discoverable.

### Option Justification Policy [ID: 7535979]
Do not present option lists without analysis. Provide one recommended path with rationale; include alternatives only when listing clear pros/cons and implications. Avoid speculative option dumps.

### Documentation-First, Always-In-Sync [ID: 7537767]
Follow Plan → Document → Execute → Update Docs. Use .cursorrules/CONTEXT-ENGINEERING-STANDARD.md as SSOT. After any action, update `memory_bank/active_context.md` and `context/CURRENT-SESSION/SESSION-GUIDE.md`; log evidence in `memory_bank/evidence_log.md` and progress in `memory_bank/progress.md`. Placement: session docs → `context/CURRENT-SESSION/`; system/long‑lived docs → `docs/architecture/` or `docs/handovers/` (prefer updating existing files; never create ad‑hoc paths).

### File Placement Guardrail [ID: 7539311]
Never create ad‑hoc files or folders. Use only the allowed locations above. Prefer updating existing files. If uncertain, ask before writing. Include a done‑when check for correct placement.
