# System Messages: AI Messaging Development

**Purpose**: Quick context for developers at each phase  
**Format**: Copy/paste to AI agent  
**Method**: Test-driven, evidence-based

---

## PHASE 1: Safety Infrastructure

```
TASK: Build safety layer (16 hours)

SPEC: PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md → "Safety-First Architecture"
STEPS: DEPLOYMENT-GUIDE-TWO-WAY-AI.md → Phase 1

TDD:
1. Write 20 tests (from deployment guide)
2. Tests fail
3. Add 16 fields to Airtable People table
4. Build safety-check-module in n8n
5. Tests pass
6. Evidence: /tests/phase1-safety/

DONE WHEN:
✅ 20 tests passing
✅ 0 double-messages possible
✅ Schema exported
✅ Sign-off complete
```

---

## PHASE 2: AI Engine

```
TASK: Build conversation engine (21 hours)

PREREQUISITE: Phase 1 sign-off

SPEC: PRD → "AI Agent Architecture", "Error Handling Matrix"
STEPS: DEPLOYMENT-GUIDE → Phase 2

TDD:
1. Write 8 conversation tests
2. Create AI_Config table
3. Build inbound-message-handler workflow
4. Tests pass
5. Evidence: /tests/phase2-ai/

DONE WHEN:
✅ AI responds correctly
✅ Errors handled gracefully
✅ Conversation_thread JSON valid
```

---

## PHASE 3: Frontend UI

```
TASK: Build conversation view (18 hours)

PREREQUISITE: Phase 2 working

SPEC: PRD → "Feature Specifications"
DESIGN: REBEL-HQ-DESIGN-SYSTEM.md
STEPS: DEPLOYMENT-GUIDE → Phase 3

TDD:
1. API endpoints + tests
2. Component tests
3. Build UI
4. Integration tests

DONE WHEN:
✅ Beautiful chat UI
✅ Human takeover works
✅ All tests passing
```

---

## PHASE 4: Content Library

```
TASK: Content management (8 hours)

SPEC: PRD → "Content Library Specifications"
STEPS: DEPLOYMENT-GUIDE → Phase 4

Simple: 5-10 pieces, topic tags, done.

DONE WHEN:
✅ Can add/edit content
✅ AI retrieves correctly
✅ Fallbacks work
```

---

## PHASE 5: Multi-Tenant

```
TASK: Template + testing (13 hours)

SPEC: PRD → "Multi-Tenant Structure"
STEPS: DEPLOYMENT-GUIDE → Phase 5

Test with 2 clients, verify isolation.

DONE WHEN:
✅ Template base created
✅ 2 clients working
✅ No cross-contamination
```

---

**Use these, not the PRD, for quick context.**

