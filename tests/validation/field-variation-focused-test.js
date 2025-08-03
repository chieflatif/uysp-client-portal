#!/usr/bin/env node

/**
 * Field Variation Focused Test Runner
 * Tests the Priority 1 fix for Smart Field Mapper
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FieldVariationTester {
  constructor() {
    this.results = [];
    this.testSuite = null;
  }

  async loadTestSuite() {
    try {
      const testSuitePath = path.join(__dirname, 'comprehensive-test-suite.json');
      const testSuiteData = fs.readFileSync(testSuitePath, 'utf8');
      this.testSuite = JSON.parse(testSuiteData);
      return true;
    } catch (error) {
      console.error('❌ Failed to load test suite:', error.message);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateCurlCommand(payload) {
    return `curl -X POST "${this.testSuite.webhook_url}" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' -s`;
  }

  analyzeResponse(testId, payload, webhookResponse) {
    try {
      const responseData = JSON.parse(webhookResponse);
      
      if (!responseData.success) {
        return { success: false, error: 'Webhook execution failed' };
      }

      const fields = responseData.data.fields;
      
      return {
        success: true,
        test_id: testId,
        airtable_record_id: responseData.data.id,
        email_mapped: fields.email === payload.email || fields.email === payload.EMAIL || fields.email === payload.email_address || fields.email === payload.emailAddress,
        name_mapped: fields.first_name && fields.last_name,
        phone_mapped: !!fields.phone_primary,
        company_mapped: !!fields.company_input,
        field_mapping_rate: fields.field_mapping_success_rate,
        normalization_version: fields.normalization_version,
        webhook_field_count: fields.webhook_field_count,
        mapped_field_count: fields.mapped_field_count
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeTest(test, testNumber, totalTests) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔄 TEST ${testNumber}/${totalTests}: ${test.id} - ${test.name}`);
    console.log(`${'='.repeat(80)}`);
    
    const startTime = Date.now();

    try {
      console.log('🚀 Sending payload to webhook...');
      console.log(`📤 Payload: ${JSON.stringify(test.payload, null, 2)}`);
      
      const curlCommand = this.generateCurlCommand(test.payload);
      const curlOutput = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
      
      console.log(`📤 Response received (${curlOutput.length} chars)`);
      
      // Wait for processing
      console.log('⏳ Waiting 5 seconds for processing...');
      await this.sleep(5000);
      
      // Analyze the response
      const analysis = this.analyzeResponse(test.id, test.payload, curlOutput);
      analysis.execution_time_ms = Date.now() - startTime;
      
      if (analysis.success) {
        console.log(`✅ TEST ${test.id} PASSED`);
        console.log(`📊 Email mapped: ${analysis.email_mapped ? 'YES' : 'NO'}`);
        console.log(`📊 Field Mapping Rate: ${analysis.field_mapping_rate}%`);
        console.log(`📊 Version: ${analysis.normalization_version}`);
        console.log(`📊 Record: ${analysis.airtable_record_id}`);
      } else {
        console.log(`❌ TEST ${test.id} FAILED: ${analysis.error}`);
      }
      
      this.results.push(analysis);
      return analysis;
      
    } catch (error) {
      const failedResult = {
        success: false,
        test_id: test.id,
        error: error.message,
        execution_time_ms: Date.now() - startTime
      };
      
      console.log(`❌ TEST ${test.id} FAILED: ${error.message}`);
      this.results.push(failedResult);
      return failedResult;
    }
  }

  async runFieldVariationTests() {
    const fieldVariationTests = this.testSuite.test_categories.field_variations.tests;
    
    console.log(`\n🚀 TESTING FIELD VARIATION FIXES`);
    console.log(`📊 Total Field Variation Tests: ${fieldVariationTests.length}`);
    console.log(`🎯 Expected Result: All tests should now pass with comprehensive field mapping\n`);
    
    for (let i = 0; i < fieldVariationTests.length; i++) {
      const test = fieldVariationTests[i];
      await this.executeTest(test, i + 1, fieldVariationTests.length);
      
      // Small pause between tests
      if (i < fieldVariationTests.length - 1) {
        console.log('⏸️  Pausing 3 seconds before next test...');
        await this.sleep(3000);
      }
    }
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '🎯'.repeat(60));
    console.log('FIELD VARIATION TEST RESULTS - PRIORITY 1 FIX');
    console.log('🎯'.repeat(60));
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.success && r.email_mapped).length;
    const failed = total - passed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    console.log(`\n📊 FIELD VARIATION SUMMARY:`);
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    
    // Compare to previous results
    console.log(`\n📈 IMPROVEMENT ANALYSIS:`);
    console.log(`Previous Success Rate: 14.3% (1/7 tests)`);
    console.log(`Current Success Rate: ${successRate}%`);
    console.log(`Improvement: ${(parseFloat(successRate) - 14.3).toFixed(1)} percentage points`);
    
    if (passed > 0) {
      const avgMappingRate = this.results
        .filter(r => r.success && r.field_mapping_rate)
        .reduce((sum, r) => sum + r.field_mapping_rate, 0) / passed;
      
      console.log(`\n📊 PERFORMANCE METRICS:`);
      console.log(`Average Field Mapping Rate: ${avgMappingRate.toFixed(1)}%`);
      console.log(`Average Fields per Test: ${this.results.filter(r => r.success).reduce((sum, r) => sum + (r.mapped_field_count || 0), 0) / passed}`);
    }
    
    // Detailed results
    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach(result => {
      const status = result.success && result.email_mapped ? '✅' : '❌';
      console.log(`  ${status} ${result.test_id}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.success) {
        console.log(`    - Email Mapped: ${result.email_mapped ? 'YES' : 'NO'}`);
        console.log(`    - Field Rate: ${result.field_mapping_rate}%`);
        console.log(`    - Version: ${result.normalization_version}`);
      } else {
        console.log(`    - Error: ${result.error}`);
      }
    });
    
    console.log(`\n🎯 SUCCESS CRITERIA:`);
    console.log(`Target: 95%+ field variation success rate`);
    console.log(`Actual: ${successRate}%`);
    console.log(`Status: ${parseFloat(successRate) >= 95 ? '✅ TARGET MET' : '❌ BELOW TARGET'}`);
    
    if (parseFloat(successRate) >= 95) {
      console.log(`\n🎉 PRIORITY 1 FIX SUCCESSFUL!`);
      console.log(`Field normalization now handles comprehensive field variations.`);
    } else {
      console.log(`\n🔧 ADDITIONAL FIXES NEEDED:`);
      this.results.filter(r => !r.success || !r.email_mapped).forEach(result => {
        console.log(`- ${result.test_id}: ${result.error || 'Email mapping failed'}`);
      });
    }
  }

  async run() {
    console.log('🚀 Field Variation Focused Test Runner');
    console.log('⚡ Testing Priority 1 fixes for Smart Field Mapper');
    
    const loaded = await this.loadTestSuite();
    if (!loaded) {
      return;
    }
    
    await this.runFieldVariationTests();
  }
}

// Execute the field variation tests
if (require.main === module) {
  const tester = new FieldVariationTester();
  tester.run().catch(error => {
    console.error('💥 Field variation test failed:', error);
    process.exit(1);
  });
}

module.exports = FieldVariationTester; 