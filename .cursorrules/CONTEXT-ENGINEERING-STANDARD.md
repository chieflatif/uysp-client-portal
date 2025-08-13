[AUTHORITATIVE]
Last Updated: 2025-08-09

# Context Engineering Standard (SSOT)

## Purpose
- Establish non-negotiable rules to eliminate hallucinations, enforce brutal honesty, and guarantee evidence-based outputs across all agents (Developer, PM, Testing).
- This document is the single source of truth for context engineering. Role guides must comply with this standard.

## Non‑Negotiable Principles
- Evidence‑First: No claim without tool evidence. Sequence: plan → execute tools → present evidence → conclude.
- Brutal Honesty: State limitations, uncertainties, and unknowns explicitly.
- Contradiction Handling: When user evidence (e.g., screenshots) contradicts claims, acknowledge immediately and verify with tools before proceeding.
- Separation of Capability vs Plan: If you cannot execute a step (permissions, environment), state so and present a verifiable plan rather than implying execution.
- Ask vs Assume: When a critical assumption exists, ask or clearly mark as assumption with impact.

## Mandatory Response Structure
- Intent: 1–2 lines summarizing the goal.
- Plan: ≤5 steps, tool calls and expected evidence.
- Actions: What was done, with tools actually called.
- Evidence Block (mandatory): Use the template below.
- Confidence Block (mandatory): Use the template below.
- Stop/Next Step: Explicit gating; do not proceed without user go if required.

### Evidence Block Template
```markdown
EVIDENCE COLLECTED
- Tool: <tool_name> → Result: <specific_id/output> (timestamp)
- Tool: <tool_name> → Result: <specific_id/output> (timestamp)
- Missing/Blocked: <what couldn’t be verified and why>
```

### Confidence Block Template
```markdown
CONFIDENCE
- Honesty (self‑assessment): <0–100%>  
- Evidence Coverage: <0–100%>  
- Key Facts Confidence: <low/med/high> with 1‑line justification each
Assumptions: <list>  
Risks: <list>
```

## Confidence Scoring Rubric
- Honesty: proportion of statements backed by direct evidence; penalize any unverified or contradicted claims.
- Evidence Coverage: % of critical claims with concrete tool outputs/IDs.  
- Key Facts Confidence: 
  - Low = weak evidence or single source; 
  - Medium = ≥2 corroborating signals; 
  - High = multi‑source evidence with direct IDs and timestamps.

## Verification Protocols
- Tool Precedence: Prefer internal tools over memory; prefer current outputs over stale docs.
- Screenshot Contradiction Protocol: Acknowledge user evidence, immediately verify with tools, correct course.
- UI vs Backend: Verify both when they can diverge (e.g., n8n parameters vs UI). Never claim “backend configured” without JSON evidence.
- Airtable Schema First: Before writing dates/booleans, check schema and match formats.

## Error Handling & Escalation
- Max 3 retries per failing operation. After that, stop and escalate with findings and evidence.
- Always provide a rollback or safe‑stop option.

## Logging & Traceability
- Include IDs, timestamps, execution IDs, record IDs, file paths.  
- Update memory bank when new facts become authoritative.

## Role Integration
- All role guides (Developer, PM, Testing) must implement this standard.
- Platform specifics live in `docs/CURRENT/critical-platform-gotchas.md`. Role guides should be role‑first; refer to gotchas as an annex, not as the core.

## Two-Tier Development Strategy (Cost Optimization)
- **Strategic Analysis Phase**: Expensive thinking models perform heavy-lifting research, validation, and comprehensive planning (Phase 0 + Phase 1).
- **Implementation Execution Phase**: Cost-efficient models execute the validated strategic plan with chunked implementation (≤5 operations per chunk).
- **PM Context Package Creation**: All development phase context packages must follow two-tier strategy structure with clear strategic/implementation separation.
- **Clear Handoffs**: Implementation agents receive complete strategic plans requiring no strategic decisions.

## Quick Footer (copy into every response)
```markdown
EVIDENCE COLLECTED
- Tool: <tool_name> → Result: <id/output> (timestamp)
- Missing/Blocked: <reason>

CONFIDENCE
- Honesty: <x%>  
- Evidence Coverage: <y%>  
- Key Facts: <low/med/high>  
Assumptions: <list> | Risks: <list>
```
