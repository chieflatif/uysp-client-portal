# UYSP Lead Qualification System V1

[![Phase 00](https://img.shields.io/badge/Phase%2000-COMPLETE-brightgreen)]()
[![Session 1](https://img.shields.io/badge/Session%201-COMPLETE-brightgreen)]()
[![Phase 2A](https://img.shields.io/badge/Phase%202A%20PDL-COMPLETE-brightgreen)]()
[![Status](https://img.shields.io/badge/Status-Phase%202B%20Development-orange)]()

## 🎯 Overview

Automated lead qualification and SMS outreach system designed to process 700+ leads/week from Kajabi form submissions, scoring them 0-100 using AI, and converting high-value prospects into meetings at <$5 per meeting cost.

## 🏗️ Architecture

```
Kajabi Forms → Zapier → n8n Workflow → Airtable → SMS → Meetings
                        ↓
                  PDL Person API (Phase 2A ✅)
                        ↓
                  Claude AI Scoring (Phase 2B - IN DEVELOPMENT)
                        ↓
                  Slack Alerts (Human-First Approach)
```

### Technology Stack
- **Workflow Engine**: n8n (hosted)
- **Database**: Airtable (11 tables)
- **APIs**: PDL Person (✅ complete), OpenAI Claude (Phase 2B)
- **SMS**: SimpleTexting/Twilio
- **Forms**: Kajabi integration
- **Automation**: Zapier triggers
- **Alerts**: Slack integration (Phase 2B)

### Cost Structure
- **PDL Person**: $0.03 per person enrichment call (✅ operational)
- **ICP Scoring**: $0.01 per Claude AI scoring call (Phase 2B)
- **SMS**: $0.02 per message via SimpleTexting
- **Target**: <$5 per qualified meeting

## 📋 Current Status

### ✅ Completed Phases
- [x] **Phase 00: Field Normalization** (98% capture rate)
  - Smart Field Mapper handles 15+ field variations
  - Boolean conversions (yes/true/1 → boolean true)
  - International phone detection (+44, +33, +1)
  - Unknown fields logging infrastructure
  - Evidence: 8 test records validated

- [x] **Session 0: Initial Field Testing** 
  - 15+ payload variation tests executed
  - Field mapping validation complete
  - Platform gotcha prevention established

- [x] **Session 1: Foundation & Comprehensive Testing** ✅ COMPLETE
  - End-to-end lead processing validated
  - 3-field phone strategy operational  
  - Duplicate prevention and upsert logic working
  - Evidence: Multiple test execution reports

- [x] **Phase 2A: PDL Person Integration** ✅ COMPLETE  
  - PDL Person API integration operational ($0.03/call)
  - Person data enrichment and processing working
  - Human Review Queue for API failures operational
  - Error handling and routing logic verified
  - Evidence: Execution 1303, Record recCHAUgQeSNrr6bM, 98% testing confidence

### 🔄 **CURRENT PRIORITY**: Phase 2B - ICP Scoring System V3.0
- [ ] **IN DEVELOPMENT**: Engagement-focused ICP scoring algorithm based on client feedback
- [ ] **Key Changes**: AE-first targeting, company size nearly irrelevant, engagement primary factor
- [ ] **Human-First Workflow**: 75+ scores trigger immediate Slack alerts to Davidson
- [ ] **Required For**: Lead qualification and SMS eligibility (≥70 threshold)
- [ ] **Context Ready**: ICP Scoring V3.0 methodology and technical requirements documented

### 📅 Remaining Phase 2 Components  
- [ ] **Phase 2B: ICP Scoring V3.0** - Engagement (35%), Role (40%), Company (25%) + Slack integration
- [ ] **Phase 2C: Company Qualification** - PDL Company API + B2B tech verification
- [ ] **Phase 2D: Cost & Phone Strategy** - Budget limits + 3-field validation + international handling
- [ ] **Session 3: Compliance** - SMS/TCPA compliance
- [ ] **Session 4: Qualification** - Two-phase Apollo APIs
- [ ] **Session 5: SMS Sending** - Templates & delivery
- [ ] **Session 6: Utilities** - System integration
- [ ] **Session 7: Reality Testing** - End-to-end validation

## 🚀 Quick Start

### Prerequisites
- n8n instance (cloud or self-hosted)
- Airtable account with base access
- API credentials (Apollo, OpenAI, SMS provider)

### Setup Steps
1. **Import Workflow**
   ```bash
   # Import from backups
   cp workflows/backups/phase00-field-normalization-complete.json [n8n-import]
   ```

2. **Configure Environment**
   ```bash
   # Required environment variables
   AIRTABLE_BASE_ID=appuBf0fTe8tp8ZaF
   TEST_MODE=true
   DAILY_COST_LIMIT=50
   ```

3. **Deploy Components**
   - Smart Field Mapper: `patterns/exported/smart-field-mapper-v1.js`
   - Airtable Schema: `schemas/airtable-schemas-v2.json`
   - Test Payloads: `tests/reality-based-tests-v2.json`

### Testing
```bash
# Test webhook endpoint
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

## 📁 Project Structure

```
├── memory_bank/           # Project context and progress
├── patterns/              # Reusable code patterns
├── workflows/             # n8n workflow exports
├── schemas/               # Airtable and data schemas
├── tests/                 # Test payloads and results
├── docs/                  # Documentation and guides
├── config/                # Configuration files
├── scripts/               # Automation scripts
└── context/               # Session-specific documentation
```

## 🔧 Development

### 📚 **WORKFLOW SYSTEM**

**🎯 SINGLE SOURCE OF TRUTH**: See `docs/MASTER-WORKFLOW-GUIDE.md`

**🚀 TO REPLICATE IN NEW PROJECTS**: See `docs/UNIVERSAL-CURSOR-WORKFLOW-SYSTEM.md`

### 🧠 **CONTEXT ENGINEERING SYSTEM**

**🚨 NEXT MAJOR PROJECT**: See `docs/CONTEXT-ENGINEERING-PROJECT-BRIEF.md`  
(Comprehensive project brief for fresh AI agent to consolidate scattered context engineering system)

**Quick Commands**:
- `npm run start-work` - Initialize work session
- `npm run branch new session-X-name 'description'` - Create feature branch
- `npm run branch switch <name>` - Switch safely
- `npm run real-backup` - Comprehensive backup

### Commit Convention
```
type(scope): Subject line

- Bullet point details
- Evidence or metrics included
- Reference to workflow IDs

Evidence: Workflow ID [workflow-id]
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `backup`

## 📊 Evidence & Metrics

### Phase 00 Achievements
- **Test Records**: 8 successful records in Airtable
- **Field Variations**: 15+ supported per field type
- **Success Rate**: 98%+ field capture achieved
- **Boolean Logic**: 100% conversion accuracy
- **International Support**: 3 countries tested

### Workflow Identifiers
- **Main Workflow**: `wpg9K9s8wlfofv1u` ("UYSP WORKING PRE COMPLIANCE - TESTING ACTIVE")
- **Smart Field Mapper Node**: `b8d9c432-2f9f-455e-a0f4-06863abfa10f` (v4.6)
- **Current Status**: Phase 2A PDL Person integration complete, Phase 2B development ready
- **Branch**: `feature/phase-2b-icp-scoring` (active development)

### Phase 2A Evidence
- **Execution ID**: 1303 (PDL Person flow - 13.5s runtime, success status)
- **Airtable Record**: recCHAUgQeSNrr6bM (Human Review Queue)
- **Testing Confidence**: 98% (systematic 4-phase anti-whack-a-mole protocol)
- **PDL Integration**: Operational with proper error handling and routing

## 📚 Documentation

### **🎯 START HERE**
- **[MASTER WORKFLOW GUIDE](docs/MASTER-WORKFLOW-GUIDE.md)** ← Git, backup, versioning  
- **[Documentation Directory](docs/README.md)** ← All docs organized

### Implementation Guides  
- [Phase 00 Completion Report](docs/phase00-completion-report.md)
- [Session Transition Summary](docs/session-transition-summary.md)
- [Platform Gotchas Prevention](docs/critical-platform-gotchas.md)
- [Testing Registry](docs/testing-registry-master.md)

### Reference Materials
- [Patterns](patterns/) - Reusable code patterns
- [Tests](tests/) - Test suites and results
- [Memory Bank](memory_bank/) - Project context
- [Config](config/) - Configuration files

## 🔒 Security

### Protected Information
- API credentials and keys
- Production data and payloads
- Personal identifiable information
- Client-specific configurations

### Best Practices
- All sensitive data excluded from version control
- Environment variables for configuration
- Test mode enabled for development
- Regular backup automation

## 🤝 Contributing

1. Create feature branch from `develop`
2. Implement session requirements
3. Test with provided test suites
4. Update documentation and evidence
5. Create pull request with evidence

## 📞 Support

For technical issues or questions:
- Review [Platform Gotchas](context/platform-gotchas/)
- Check [Memory Bank](memory_bank/active_context.md)
- Consult [Implementation Guide](docs/)

## 🏷️ Version History

### v0.1.0 - Phase 00 Complete (2025-07-23)
- Smart Field Mapper implemented with 6 micro-chunks
- 98% field capture rate achieved across 8 test records
- Boolean conversions and international phone detection working
- Field_Mapping_Log infrastructure complete
- Platform gotchas documented and prevented

### v0.2.0 - Session 1 Foundation Complete (2025-08-04)
- End-to-end lead processing validated with comprehensive testing
- 3-field phone strategy operational
- Duplicate prevention and upsert logic working
- Three-agent system organization established

### v0.3.0 - Phase 2A PDL Person Integration Complete (2025-01-27)
- PDL Person API integration operational ($0.03/call)
- Person data enrichment and processing working
- Human Review Queue for API failures operational
- Error handling and routing logic verified (IF node boolean fix)
- Evidence: Execution 1303, Record recCHAUgQeSNrr6bM, 98% testing confidence

---

**Next Milestone**: Phase 2B ICP Scoring V3.0 - Engagement-focused algorithm with Slack integration
