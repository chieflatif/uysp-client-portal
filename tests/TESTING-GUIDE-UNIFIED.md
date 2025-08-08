# UYSP Testing Suite - Unified Guide

## 🎯 QUICK START - Choose Your Method

Your testing suite is **FULLY FUNCTIONAL**. Pick the method that suits your needs:

### Method 1: Interactive Node.js Runner (Recommended)
```bash
cd tests
node run-manual-tests.js
```
**Best for**: Manual testing, detailed verification, learning the system

### Method 2: Python Comprehensive Validator 
```bash
cd tests
python3 session-0-real-data-validator.py
```
**Best for**: Automated validation, batch testing, CI/CD

### Method 3: Bash Script Runner
```bash
cd tests
chmod +x test-runner.sh
./test-runner.sh
```
**Best for**: Shell-based workflows, simple automation

## 🔧 Prerequisites Check

**All your dependencies are already installed and working:**
- ✅ Node.js v24.3.0
- ✅ Python 3.9.6 with pandas, requests, python-dotenv
- ✅ bash with jq and bc utilities
- ✅ Comprehensive test suite JSON (18 tests across 5 categories)

## 📋 Available Test Categories

1. **Field Variations (FV001-FV007)** - 7 tests
   - Standard Kajabi format, ALL CAPS, Mixed case, Alternative names, etc.

2. **Boolean Conversions (BC001-BC004)** - 4 tests  
   - String "yes"/"no", "true"/"false", "1"/"0" conversions

3. **Edge Cases (EC001-EC004)** - 4 tests
   - Missing fields, empty values, international phones

4. **Duplicate Handling (DH001-DH002)** - 2 tests
   - Email-based duplicate detection and updates

5. **Compliance Tests (CT001)** - 1 test
   - DND list checking and compliance validation

## 🚀 Detailed Usage Instructions

### Node.js Interactive Runner

```bash
cd tests
node run-manual-tests.js
```

**Features:**
- Interactive menu system
- Manual verification prompts for accuracy
- Automatic results logging
- Category-based or individual test execution
- Built-in summary reporting

**Flow:**
1. Select test execution option (all/category/single)
2. For each test:
   - Review payload being sent
   - Manually trigger n8n workflow (click "Execute Workflow")
   - Script sends webhook payload
   - Manually verify results in Airtable
   - Confirm pass/fail status
3. View comprehensive summary

### Python Comprehensive Validator

```bash
cd tests
python3 session-0-real-data-validator.py
```

**Features:**
- Automated CSV data processing
- Real Kajabi export validation
- Field mapping statistics
- Duplicate testing with email tracking
- Phone versioning strategy testing
- JSON result reports with timestamps

**Output:** Detailed reports in `tests/results/` directory

### Bash Script Runner

```bash
cd tests
chmod +x test-runner.sh  # First time only
./test-runner.sh
```

**Features:**
- Color-coded terminal output
- Automated curl execution
- Manual verification checkpoints
- Text-based reporting
- Category selection menu

## 📊 Understanding Test Results

### Expected Success Rates (Based on Historical Data)
- **Field Mapping**: 80-98% (Goal: >95%)
- **Boolean Conversion**: 100% (Critical: Must be 100%)
- **Integration Tests**: 90-95%
- **Duplicate Handling**: 100%
- **Overall System**: >90% for production readiness

### Test Evidence Requirements
- ✅ Airtable record creation confirmed
- ✅ Field normalization accuracy verified
- ✅ Boolean fields showing as checkboxes (not strings)
- ✅ No workflow execution errors
- ✅ Duplicate handling working correctly

## 🔍 Troubleshooting Common Issues

### "Test runner won't start"
**Cause**: Interactive runner waiting for user input
**Solution**: The runner is working! It's waiting for you to select a menu option

### "Python script errors"
**Cause**: Missing environment variables
**Solution**: Create `.env` file or run with available data

### "Bash script permission denied"
**Solution**: `chmod +x test-runner.sh`

### "jq command not found"
**Solution**: `brew install jq` (macOS) or use Node.js runner instead

### "Tests failing consistently"
**Check**:
1. n8n workflow is active and accessible
2. Webhook URL is correct: `https://rebelhq.app.n8n.cloud/webhook/kajabi-leads`
3. Airtable base permissions are properly configured
4. Smart Field Mapper node is functioning

## 📁 File Structure Reference

```
tests/
├── 🔧 TESTING-GUIDE-UNIFIED.md         # This guide (START HERE)
├── 📋 README.md                        # Original documentation
├── 🎯 comprehensive-test-suite.json    # Test definitions (18 tests)
├── 🚀 run-manual-tests.js             # Interactive Node.js runner  
├── 🐍 session-0-real-data-validator.py # Python comprehensive validator
├── 🛠️  test-runner.sh                  # Bash automation script
├── 📊 comprehensive-test-runner.js     # Advanced automation (experimental)
├── payloads/                          # Individual test JSON files
├── results/                           # Test execution results
└── evidence/                          # Historical test evidence
```

## 🎯 Quick Test Execution Commands

```bash
# Quick validation (5 minutes)
cd tests && node run-manual-tests.js
# Select option 2 (Run tests by category)
# Select Field Variations (most critical)

# Full comprehensive test (30 minutes)
cd tests && python3 session-0-real-data-validator.py

# Automated shell execution (15 minutes)
cd tests && ./test-runner.sh
# Select option 1 (Run all tests)
```

## 📈 Test Results Interpretation

### Production Ready Criteria
- ✅ Field mapping: >95% success rate
- ✅ Boolean conversion: 100% (no string values in Airtable checkboxes)
- ✅ No workflow errors during execution
- ✅ Duplicate handling prevents duplicate records
- ✅ International phone numbers detected correctly

### Red Flags (Investigate Immediately)
- ❌ Field mapping <80% (Smart Field Mapper regression)
- ❌ Boolean "false"/"0" showing as strings (original bug return)
- ❌ New records created for existing emails (duplicate prevention broken)
- ❌ Workflow errors or timeouts (infrastructure issues)

## 🔄 Continuous Testing Protocol

**For Development:**
```bash
# After any workflow changes
cd tests && node run-manual-tests.js
# Run critical tests (Field Variations + Boolean Conversions)
```

**For Production Releases:**
```bash
# Full validation before deployment
cd tests && python3 session-0-real-data-validator.py
# Review all results files in results/ directory
```

## 📞 Support & Documentation

- **Current Status**: All testing infrastructure is functional and validated
- **Historical Evidence**: See `tests/results/` for past test executions
- **Issue Tracking**: Check `docs/testing-registry-master.md` for phase completion status
- **Architecture**: Reference [[memory:3931908]] for MCP workflow integration patterns

---

**Last Updated**: January 2025  
**Validation Status**: ✅ All test runners validated and working  
**Next Review**: After any Smart Field Mapper or workflow modifications