# UYSP Comprehensive Test Suite

## Overview

This test suite provides comprehensive testing for the UYSP lead qualification webhook system. It includes tests for field normalization, boolean conversions, duplicate handling, edge cases, and compliance verification.

## Test Suite Components

### 📋 Core Files

1. **`comprehensive-test-suite.json`** - Complete test specification with all test cases
2. **`run-manual-tests.js`** - Interactive Node.js test runner
3. **`test-runner.sh`** - Bash script for automated execution  
4. **`verification-queries.js`** - Airtable verification helpers
5. **`payloads/`** - Individual JSON payload files for each test
6. **`results/`** - Test execution results and reports

## Test Categories

### 🔄 Field Variations (FV001-FV007)
Tests different field name variations to ensure the Smart Field Mapper handles all webhook formats:
- Standard Kajabi format
- ALL CAPS fields  
- Mixed case variations
- Alternative field names (email_address, phone_number)
- Underscore variations (first_name, last_name)
- CamelCase fields (emailAddress, phoneNumber)
- LinkedIn URL variations

### ✅ Boolean Conversions (BC001-BC004)  
Tests boolean field conversion to ensure proper Airtable checkbox handling:
- String variations: "yes", "YES", "Yes"
- Boolean values: true, "true", "TRUE"
- Numeric values: 1, "1", "on"
- False variations: "no", false, "0"

### ⚠️ Edge Cases (EC001-EC004)
Tests error handling and edge case scenarios:
- Missing critical fields
- Empty/null values
- International phone numbers
- Special characters in data

### 🔄 Duplicate Handling (DH001-DH002)
Tests duplicate prevention logic:
- Exact duplicate emails (should update, not create)
- Case insensitive email matching

### 🛡️ Compliance Tests (CT001)
Tests compliance gate functionality:
- DND (Do Not Call) list checking
- SMS opt-out verification
- Compliance logging

## How to Run Tests

### Option 1: Interactive Node.js Runner (Recommended)

```bash
cd tests
node run-manual-tests.js
```

**Features:**
- Interactive menu system
- Run all tests or by category
- Manual verification prompts
- Automatic results logging
- Progress tracking

### Option 2: Bash Script Runner

```bash
cd tests
chmod +x test-runner.sh
./test-runner.sh
```

**Features:**
- Automated test execution
- Color-coded output
- Automatic report generation
- Prerequisites checking

### Option 3: Manual Individual Tests

```bash
# Example: Run single test
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -d @payloads/FV001-standard-kajabi.json
```

## Test Execution Process

### Before Each Test:
1. **Manual Step**: Go to n8n workflow and click "Execute Workflow"
2. **Automated**: Send payload via curl
3. **Wait**: 5 seconds for processing
4. **Manual**: Verify results in Airtable
5. **Document**: Record pass/fail status

### Verification Checklist:
- ✅ Airtable record created
- ✅ All fields normalized correctly  
- ✅ Boolean fields show true/false (not strings)
- ✅ Phone country code detected
- ✅ No workflow errors
- ✅ Field mapping success rate > 95%

## Expected Results

### Success Criteria:
- **Field Normalization**: ≥95% fields captured correctly
- **Duplicate Prevention**: Zero duplicate records created  
- **Compliance Gates**: All checks enforced properly
- **Error Handling**: Graceful degradation on edge cases
- **Processing Time**: Under 5 seconds per lead

### Sample Success Rates:
- **Field Variations**: 100% (all field name variations mapped)
- **Boolean Conversions**: 100% (all boolean strings converted)  
- **International Detection**: 100% (country codes identified)
- **Duplicate Prevention**: 100% (updates instead of creates)

## Troubleshooting

### Common Issues:

#### "Workflow not executing"
- **Cause**: n8n workflow not manually activated
- **Solution**: Click "Execute Workflow" button before sending payload

#### "Fields not normalized"  
- **Cause**: Smart Field Mapper configuration issue
- **Solution**: Check field mapping logic in workflow node

#### "Boolean fields showing as strings"
- **Cause**: Boolean conversion logic not working
- **Solution**: Verify boolean conversion code in Smart Field Mapper

#### "Duplicate records created"
- **Cause**: Duplicate prevention logic failing
- **Solution**: Check Airtable Search and Duplicate Handler nodes

#### "International phone not detected"
- **Cause**: Phone detection logic error
- **Solution**: Verify international phone detection regex

### Verification Helpers:

```bash
# Generate verification checklist for a specific test
node verification-queries.js

# Check test results
ls -la results/

# View latest test report  
cat results/test-results-*.json | jq '.test_session'
```

## Adding New Tests

### 1. Add to Test Suite JSON:
```json
{
  "id": "NEW001", 
  "name": "New Test Case",
  "payload": {
    "email": "test-new@example.com",
    "custom_field": "test_value"
  },
  "expected": {
    "normalized_fields": ["email", "custom_field"],
    "airtable_record": true
  }
}
```

### 2. Create Payload File:
```bash
echo '{"email": "test-new@example.com"}' > payloads/NEW001-new-test.json
```

### 3. Update Verification:
Add test-specific verification logic to `verification-queries.js`

## File Structure

```
tests/
├── comprehensive-test-suite.json    # Master test specification
├── run-manual-tests.js             # Interactive Node.js runner
├── test-runner.sh                  # Bash automation script  
├── verification-queries.js         # Airtable verification helpers
├── README.md                       # This documentation
├── payloads/                       # Individual test payloads
│   ├── FV001-standard-kajabi.json
│   ├── FV002-all-caps.json
│   ├── BC001-bool-yes.json
│   └── EC003-international.json
└── results/                        # Test execution results
    ├── test-results-TIMESTAMP.json
    └── test-report-TIMESTAMP.txt
```

## Integration with CI/CD

### Environment Variables:
```bash
export WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
export AIRTABLE_BASE_ID="appuBf0fTe8tp8ZaF"
export TEST_MODE="true"
```

### Automated Testing:
```bash
# Run all tests and generate report
./test-runner.sh > test-execution.log 2>&1

# Check exit code for CI/CD
if [ $? -eq 0 ]; then
  echo "All tests passed"
else  
  echo "Some tests failed"
  exit 1
fi
```

## Support

For issues with the test suite:
1. Check the troubleshooting section above
2. Verify webhook URL and n8n workflow status
3. Ensure Airtable base permissions are correct
4. Review test execution logs in `results/` directory

**Last Updated**: July 23, 2025  
**Version**: 1.0  
**Maintainer**: UYSP Development Team 