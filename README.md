# UYSP Lead Qualification System V1

[![Phase 00](https://img.shields.io/badge/Phase%2000-COMPLETE-brightgreen)]()
[![Field Capture](https://img.shields.io/badge/Field%20Capture-98%25-brightgreen)]()
[![Status](https://img.shields.io/badge/Status-Ready%20for%20Session%200-blue)]()

## 🎯 Overview

Automated lead qualification and SMS outreach system designed to process 700+ leads/week from Kajabi form submissions, scoring them 0-100 using AI, and converting high-value prospects into meetings at <$5 per meeting cost.

## 🏗️ Architecture

```
Kajabi Forms → Zapier → n8n Workflow → Airtable → SMS → Meetings
                        ↓
                  Apollo API (2-phase)
                        ↓
                  Claude AI Scoring
```

### Technology Stack
- **Workflow Engine**: n8n (hosted)
- **Database**: Airtable (11 tables)
- **APIs**: Apollo (company + person), OpenAI Claude
- **SMS**: SimpleTexting/Twilio
- **Forms**: Kajabi integration
- **Automation**: Zapier triggers

### Cost Structure
- **Phase 1**: $0.01 per Apollo Organization API call
- **Phase 2**: $0.025 per Apollo People API call  
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

### 🔄 In Progress
- [ ] **Session 0: Comprehensive Testing** 
  - 15+ payload variation tests
  - Field mapping validation
  - Unknown field detection verification

### 📅 Planned Sessions
- [ ] **Session 1: Foundation** - Webhook & data flow
- [ ] **Session 2: Compliance** - SMS/TCPA compliance
- [ ] **Session 3: Qualification** - Two-phase Apollo APIs
- [ ] **Session 4: SMS Sending** - Templates & delivery
- [ ] **Session 5: Utilities** - System integration
- [ ] **Session 6: Reality Testing** - End-to-end validation

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

### Branching Strategy
- **main**: Production-ready code only
- **develop**: Integration branch for completed sessions
- **feature/session-X**: Individual session work
- **backup/YYYYMMDD**: Daily backup branches

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
- **Main Workflow**: `CefJB1Op3OySG8nb`
- **Smart Field Mapper Node**: `a3493afa-1eaf-41bb-99ca-68fe76209a29`
- **Current Version**: `87e5e6cd-0626-4f94-b58b-423aadfe4f00`

## 📚 Documentation

### Implementation Guides
- [Phase 00 Completion Report](docs/phase00-completion-report.md)
- [Session 0 Readiness Guide](context/session-0/ready.md)
- [Platform Gotchas Prevention](context/platform-gotchas/)
- [Field Normalization Patterns](patterns/00-field-normalization-mandatory.txt)

### Reference Materials
- [Airtable Schemas](schemas/)
- [Test Suites](tests/)
- [Memory Bank](memory_bank/)
- [Critical Patterns](patterns/)

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

---

**Next Milestone**: Session 0 comprehensive testing with 15+ payload variations
