# Custom Tag-Based SMS Campaigns

**Feature Status**: 📝 Planning  
**Target**: Week 4 Implementation  
**Repository**: `chieflatif/uysp-client-portal`

---

## Documentation Index

1. **PRD.md** - Product Requirements (business & user focused)
2. **RESEARCH-FINDINGS.md** - Technical research results (created by implementation agent)
3. **TECHNICAL-SPEC.md** - Detailed technical design (created by implementation agent)
4. **IMPLEMENTATION-LOG.md** - Build progress and decisions (created during build)

---

## Quick Context

**What**: UI for creating custom SMS campaigns by selecting leads via Kajabi tags

**Why**: Re-engage specific lead segments with targeted multi-message sequences

**Key Feature**: Hybrid message builder (AI generation + manual editing with placeholder buttons)

**Data Flow**: UI → PostgreSQL → Sync Queue → Airtable → n8n Scheduler → SMS

---

## Next Steps

1. Read `PRD.md` (this folder)
2. Conduct research (see Technical Research section in PRD)
3. Create `RESEARCH-FINDINGS.md` with answers to open questions
4. Create `TECHNICAL-SPEC.md` with proposed approach
5. Get user approval
6. Build feature
7. Document in `IMPLEMENTATION-LOG.md`

---

**All work happens in this repository**: `uysp-client-portal/`  
**Do NOT create files in workspace root**

