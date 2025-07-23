# UYSP Git Workflow & Branching Strategy

## Branch Structure

### Main Branches
- **`main`**: Production-ready code only
  - Only fully tested, documented components
  - Each commit represents a completed phase/session
  - Protected branch requiring review
  - Tagged with version numbers

- **`develop`**: Integration branch for completed sessions
  - Features merge here after completion
  - Continuous integration testing
  - Daily backup point
  - Pre-production staging

### Feature Branches
- **`feature/session-0-testing`**: Session 0 comprehensive testing
- **`feature/session-1-foundation`**: Webhook & data flow foundation
- **`feature/session-2-compliance`**: SMS/TCPA compliance implementation
- **`feature/session-3-qualification`**: Two-phase Apollo API qualification
- **`feature/session-4-sms-sending`**: SMS templates and delivery
- **`feature/session-5-utilities`**: System integration and utilities
- **`feature/session-6-reality-testing`**: End-to-end validation

### Utility Branches
- **`hotfix/*`**: Emergency production fixes
  - Branch from `main`
  - Merge back to both `main` and `develop`
  - Immediate deployment fixes

- **`backup/YYYYMMDD-HHMM`**: Daily automated backup branches
  - Created via automated script
  - Full project state snapshots
  - Retention: 30 days

## Commit Message Convention

### Format
```
type(scope): Subject line (max 50 chars)

- Bullet point details about changes
- Evidence or metrics included when applicable
- Reference to workflow IDs or test results
- Links to relevant documentation

Evidence: [Workflow ID / Test Results / Record IDs]
Closes: #issue-number (if applicable)
```

### Commit Types
- **`feat`**: New feature or component implementation
- **`fix`**: Bug fixes and issue resolution
- **`docs`**: Documentation updates and additions
- **`test`**: Test additions, modifications, or results
- **`refactor`**: Code improvements without functionality changes
- **`backup`**: Automated backup commits
- **`config`**: Configuration file updates
- **`security`**: Security-related changes

### Scope Examples
- `(field-mapper)`: Smart Field Mapper changes
- `(workflow)`: n8n workflow modifications
- `(airtable)`: Airtable schema or integration changes
- `(docs)`: Documentation updates
- `(tests)`: Test suite modifications
- `(memory-bank)`: Memory bank updates

### Example Commits
```bash
# Feature implementation
feat(field-mapper): Add international phone detection

- Implement country code extraction (+44, +33, +1)
- Add international_phone boolean flag
- Safe routing for ambiguous US numbers
- Test coverage for 3 countries

Evidence: Test records rec9YIDIRa9vGyKYI, rechxq4E82QAb9nHm
Workflow: CefJB1Op3OySG8nb version 87e5e6cd

# Bug fix
fix(workflow): Resolve boolean conversion string issue

- Convert string "true" to actual boolean values
- Update Airtable checkbox field handling
- Prevent validation errors on boolean fields

Evidence: Record recGyBeVGHPUJzrB0 shows boolean true, not string
Closes: #issue-47

# Documentation
docs(session-0): Add comprehensive testing guide

- Document 15+ test payload variations
- Include success criteria and evidence requirements
- Add troubleshooting for common issues

# Test results
test(field-normalization): Complete Phase 00 validation

- 8 test records created successfully
- 98% field capture rate achieved
- Boolean conversions 100% accurate
- International detection working

Evidence: Records rec0LUBkgxv5xGnld through rechxq4E82QAb9nHm
```

## Workflow Process

### 1. Starting New Work
```bash
# Ensure develop is current
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/session-X-description

# Start implementation
git add files
git commit -m "feat(scope): Initial implementation"
```

### 2. During Development
```bash
# Regular commits with evidence
git add changed-files
git commit -m "feat(scope): Add specific component

- Implementation details
- Test results or evidence
- Reference IDs

Evidence: [specific evidence]"

# Push regularly for backup
git push origin feature/session-X-description
```

### 3. Completing Session
```bash
# Final testing and documentation
git add tests/ docs/ memory_bank/
git commit -m "test(session-X): Complete validation with evidence

- All success criteria met
- Documentation updated
- Evidence collected and verified

Evidence: [comprehensive evidence list]"

# Create pull request
gh pr create --title "Session X: Description" --body "Detailed PR description"
```

### 4. Merging to Develop
```bash
# After review approval
git checkout develop
git pull origin develop
git merge --no-ff feature/session-X-description
git push origin develop

# Tag if major milestone
git tag -a v0.X.0 -m "Session X Complete: Description"
git push origin v0.X.0
```

### 5. Production Release
```bash
# When ready for production
git checkout main
git pull origin main
git merge --no-ff develop
git push origin main

# Production tag
git tag -a v1.0.0 -m "Production Release: Full UYSP System"
git push origin v1.0.0
```

## Backup Strategy

### Daily Automated Backups
```bash
#!/bin/bash
# scripts/git-backup.sh
DATE=$(date +%Y%m%d-%H%M%S)
BRANCH="backup/$DATE"

git checkout -b $BRANCH
git add -A
git commit -m "backup: Automated backup $DATE

- Complete project state captured
- All workflow versions included
- Memory bank state preserved
- Test results archived"

git push origin $BRANCH
git checkout develop
```

### Manual Backups Before Major Changes
```bash
# Before risky operations
git checkout -b backup/before-major-change-$(date +%Y%m%d)
git add -A
git commit -m "backup: Before [description of change]"
git push origin backup/before-major-change-$(date +%Y%m%d)
git checkout develop
```

## Version Numbering

### Semantic Versioning (MAJOR.MINOR.PATCH)
- **v0.x.x**: Pre-production development phases
- **v1.0.0**: First production release (after Session 6 completion)
- **v1.x.0**: Minor feature additions
- **v1.x.x**: Patch releases and bug fixes

### Version Tags by Phase
- **v0.1.0**: Phase 00 Complete - Field Normalization
- **v0.2.0**: Session 0 Complete - Comprehensive Testing
- **v0.3.0**: Session 1 Complete - Foundation
- **v0.4.0**: Session 2 Complete - Compliance
- **v0.5.0**: Session 3 Complete - Qualification
- **v0.6.0**: Session 4 Complete - SMS Sending
- **v0.7.0**: Session 5 Complete - Utilities
- **v0.8.0**: Session 6 Complete - Reality Testing
- **v1.0.0**: Production Release - Full System

## Best Practices

### Do's ✅
- Commit frequently with meaningful messages
- Include evidence in commit messages
- Tag major milestones
- Update documentation with changes
- Test before committing
- Use descriptive branch names
- Reference workflow IDs and record IDs

### Don'ts ❌
- Commit credentials or sensitive data
- Push directly to main branch
- Use vague commit messages
- Skip documentation updates
- Commit untested code
- Force push to shared branches
- Include real client data in commits

## Emergency Procedures

### Rollback Process
```bash
# If last commit needs rollback
git reset --hard HEAD~1

# If need to rollback to specific version
git reset --hard v0.X.0

# Create hotfix for production issue
git checkout main
git checkout -b hotfix/critical-issue
# Fix issue
git commit -m "hotfix: Fix critical production issue"
git checkout main
git merge hotfix/critical-issue
git checkout develop
git merge hotfix/critical-issue
```

### Disaster Recovery
```bash
# Restore from backup branch
git checkout backup/YYYYMMDD-HHMM
git checkout -b recovery/restore-from-backup
# Verify and merge changes as needed
```

This workflow ensures comprehensive version control, evidence tracking, and disaster recovery for the UYSP Lead Qualification system. 