#!/usr/bin/env node

/**
 * UYSP Airtable Verification Queries
 * Provides functions to verify test results in Airtable
 */

class AirtableVerifier {
  constructor(baseId = 'appuBf0fTe8tp8ZaF') {
    this.baseId = baseId;
    this.apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
    
    if (!this.apiKey) {
      console.warn('⚠️  AIRTABLE_API_KEY not found in environment variables');
      console.warn('Manual verification will be required');
    }
  }

  /**
   * Generate filter formula to find record by email
   */
  getEmailFilterFormula(email) {
    return `{email} = '${email}'`;
  }

  /**
   * Generate filter formula to find record by request_id
   */
  getRequestIdFilterFormula(requestId) {
    return `{request_id} = '${requestId}'`;
  }

  /**
   * Manual verification queries (for copy-paste into Airtable)
   */
  getManualVerificationQueries(testPayload) {
    const queries = {
      find_by_email: {
        table: "Leads",
        filter: this.getEmailFilterFormula(testPayload.email),
        description: "Find the lead record created by this test"
      },
      
      check_normalization: {
        description: "Verify these fields were normalized correctly:",
        fields_to_check: [
          "email (should match payload)",
          "first_name (should be extracted from name)",
          "last_name (should be extracted from name)", 
          "phone_primary (should be normalized)",
          "company (should match payload)",
          "field_mapping_success_rate (should be > 95%)"
        ]
      },
      
      check_boolean_fields: {
        description: "Verify boolean fields show true/false (not strings):",
        boolean_fields: [
          "interested_in_coaching",
          "qualified_lead", 
          "contacted"
        ]
      },
      
      check_phone_logic: {
        description: "Verify phone number logic:",
        checks: [
          "phone_country_code (should show detected country code)",
          "international_phone (true for non-US, false for US)",
          "phone_primary (should be normalized format)"
        ]
      }
    };
    
    return queries;
  }

  /**
   * Generate verification checklist for a specific test
   */
  generateVerificationChecklist(testId, testPayload) {
    console.log(`\n🔍 VERIFICATION CHECKLIST FOR ${testId}`);
    console.log('=' .repeat(50));
    
    const queries = this.getManualVerificationQueries(testPayload);
    
    console.log('\n📋 1. Find the record:');
    console.log(`   Table: ${queries.find_by_email.table}`);
    console.log(`   Filter: ${queries.find_by_email.filter}`);
    
    console.log('\n📋 2. Check field normalization:');
    queries.check_normalization.fields_to_check.forEach(field => {
      console.log(`   ☐ ${field}`);
    });
    
    if (testPayload.interested_in_coaching || testPayload.qualified_lead || testPayload.contacted) {
      console.log('\n📋 3. Check boolean conversions:');
      queries.check_boolean_fields.boolean_fields.forEach(field => {
        if (testPayload[field] !== undefined) {
          console.log(`   ☐ ${field}: should be true/false, not string "${testPayload[field]}"`);
        }
      });
    }
    
    if (testPayload.phone) {
      console.log('\n📋 4. Check phone logic:');
      queries.check_phone_logic.checks.forEach(check => {
        console.log(`   ☐ ${check}`);
      });
    }
    
    console.log('\n📋 5. Check workflow execution:');
    console.log('   ☐ No errors in n8n execution log');
    console.log('   ☐ All expected fields populated');
    console.log('   ☐ Field mapping success rate > 95%');
    
    console.log('\n' + '=' .repeat(50));
  }

  /**
   * Check if record exists by email (manual instruction)
   */
  checkRecordExists(email) {
    console.log(`\n📋 MANUAL CHECK: Record Exists`);
    console.log(`1. Go to Airtable base: ${this.baseId}`);
    console.log(`2. Open the "Leads" table`);
    console.log(`3. Use filter: ${this.getEmailFilterFormula(email)}`);
    console.log(`4. Verify exactly 1 record is found`);
    
    return {
      action: 'manual_check',
      filter_formula: this.getEmailFilterFormula(email),
      expected_count: 1
    };
  }

  /**
   * Verify fields were normalized correctly (manual instruction)
   */
  verifyFieldsNormalized(recordId, expectedFields) {
    console.log(`\n📋 MANUAL CHECK: Field Normalization`);
    console.log(`1. Open record: ${recordId}`);
    console.log(`2. Verify these fields are populated correctly:`);
    
    expectedFields.forEach(field => {
      console.log(`   - ${field}`);
    });
    
    return {
      action: 'manual_check',
      record_id: recordId,
      fields_to_verify: expectedFields
    };
  }

  /**
   * Check duplicate prevention (manual instruction)
   */
  checkDuplicatePrevention(email) {
    console.log(`\n📋 MANUAL CHECK: Duplicate Prevention`);
    console.log(`1. Search for email: ${email}`);
    console.log(`2. Verify only 1 record exists (no duplicates)`);
    console.log(`3. If testing duplicate handling, verify record was UPDATED not CREATED`);
    
    return {
      action: 'manual_check', 
      email: email,
      expected_behavior: 'single_record_updated_not_created'
    };
  }

  /**
   * Verify compliance gates (manual instruction)
   */
  verifyComplianceGates(recordId) {
    console.log(`\n📋 MANUAL CHECK: Compliance Gates`);
    console.log(`1. Open record: ${recordId}`);
    console.log(`2. Check compliance fields:`);
    console.log(`   - do_not_call (should be true for DND numbers)`);
    console.log(`   - sms_opt_out (should be true if opted out)`);
    console.log(`   - international_phone (should be true for non-US)`);
    console.log(`3. Verify appropriate routing was applied`);
    
    return {
      action: 'manual_check',
      record_id: recordId,
      compliance_fields: ['do_not_call', 'sms_opt_out', 'international_phone']
    };
  }

  /**
   * Generate summary report template
   */
  generateSummaryReport(testResults) {
    console.log('\n📊 TEST VERIFICATION SUMMARY');
    console.log('=' .repeat(50));
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.verified === true).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`Total Tests Verified: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.filter(r => r.verified === false).forEach(result => {
        console.log(`  - ${result.test_id}: ${result.failure_reason || 'Unknown failure'}`);
      });
    }
    
    console.log('=' .repeat(50));
    
    return {
      total: totalTests,
      passed: passedTests, 
      failed: failedTests,
      success_rate: successRate
    };
  }

  /**
   * Generate test-specific verification instructions
   */
  getTestSpecificVerification(testId, testPayload) {
    const instructions = [];
    
    // Field variation tests
    if (testId.startsWith('FV')) {
      instructions.push('Verify field name variations were mapped correctly');
      instructions.push('Check that alternative field names (email_address, phoneNumber, etc.) were normalized');
    }
    
    // Boolean conversion tests  
    if (testId.startsWith('BC')) {
      instructions.push('Verify boolean fields show true/false (not strings)');
      instructions.push('Check Airtable checkbox fields are properly checked/unchecked');
    }
    
    // Edge case tests
    if (testId.startsWith('EC')) {
      if (testId === 'EC003') {
        instructions.push('Verify international_phone flag is set to true');
        instructions.push('Check that phone_country_code shows +44');
      }
      instructions.push('Verify workflow handled edge case gracefully');
    }
    
    // Duplicate handling tests
    if (testId.startsWith('DH')) {
      instructions.push('Verify only 1 record exists for the email');
      instructions.push('Check that duplicate was UPDATED, not created new');
      instructions.push('Verify latest values are in the record');
    }
    
    // Compliance tests
    if (testId.startsWith('CT')) {
      instructions.push('Verify compliance flags are set correctly');
      instructions.push('Check that appropriate routing was applied');
    }
    
    return instructions;
  }
}

// Export for use in other modules
module.exports = AirtableVerifier;

// CLI usage
if (require.main === module) {
  const verifier = new AirtableVerifier();
  
  // Example usage
  const examplePayload = {
    email: "test-example@example.com",
    name: "Test User",
    phone: "+1-555-123-4567",
    interested_in_coaching: "yes"
  };
  
  console.log('🧪 UYSP Airtable Verification Queries');
  console.log('This module provides verification functions for test results');
  
  verifier.generateVerificationChecklist('FV001', examplePayload);
} 