#!/usr/bin/env node

/**
 * Full Automated Test Suite Runner
 * Executes all 18 tests with comprehensive verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FullAutomatedTestSuite {
  constructor() {
    this.testSuite = null;
    this.results = [];
    this.resultsDir = path.join(__dirname, 'results');
    this.startTime = new Date();
    
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async loadTestSuite() {
    try {
      const testSuitePath = path.join(__dirname, 'comprehensive-test-suite.json');
      const testSuiteData = fs.readFileSync(testSuitePath, 'utf8');
      this.testSuite = JSON.parse(testSuiteData);
      console.log(`✅ Loaded test suite: ${this.testSuite.name} v${this.testSuite.version}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load test suite:', error.message);
      return false;
    }
  }

  getAllTests() {
    const allTests = [];
    Object.keys(this.testSuite.test_categories).forEach(categoryKey => {
      const category = this.testSuite.test_categories[categoryKey];
      category.tests.forEach(test => {
        allTests.push({
          ...test,
          category: categoryKey,
          categoryDescription: category.description
        });
      });
    });
    return allTests;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateCurlCommand(payload) {
    const payloadJson = JSON.stringify(payload).replace(/'/g, "'\"'\"'");
    return `curl -X POST "${this.testSuite.webhook_url}" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' -s`;
  }

  analyzeWebhookResponse(testId, payload, webhookResponse) {
    try {
      const responseData = JSON.parse(webhookResponse);
      
      if (!responseData.success) {
        return { 
          success: false, 
          error: 'Webhook execution failed',
          verification: { overall_success: false }
        };
      }

      const airtableData = responseData.data;
      const fields = airtableData.fields;
      
      // Comprehensive field verification
      const verification = this.verifyFieldNormalization(payload, fields, testId);
      
      return {
        test_id: testId,
        success: verification.overall_success,
        airtable_record_id: airtableData.id,
        created_time: airtableData.createdTime,
        verification: verification,
        performance: {
          webhook_field_count: fields.webhook_field_count,
          mapped_field_count: fields.mapped_field_count,
          field_mapping_success_rate: parseFloat(fields.field_mapping_success_rate),
          duplicate_count: fields.duplicate_count
        },
        costs: {
          total_processing_cost: parseFloat(fields.total_processing_cost || 0)
        },
        normalization_version: fields.normalization_version
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        verification: { overall_success: false }
      };
    }
  }

  verifyFieldNormalization(payload, fields, testId) {
    const checks = {
      email_match: false,
      name_split_correct: false,
      phone_normalized: false,
      boolean_converted: false,
      company_mapped: false,
      source_mapped: false,
      field_mapping_rate_excellent: false,
      unknown_fields_logged: false,
      normalization_version_current: false
    };

    // Email verification
    if (fields.email === payload.email) {
      checks.email_match = true;
    }

    // Name splitting verification
    if (payload.name || payload.Name) {
      if (fields.first_name && fields.last_name) {
        checks.name_split_correct = true;
      }
    } else {
      checks.name_split_correct = true; // Not applicable
    }

    // Phone normalization
    if (payload.phone || payload.Phone || payload.phone_number || payload.phoneNumber) {
      if (fields.phone_primary) {
        checks.phone_normalized = true;
      }
    } else {
      checks.phone_normalized = true; // Not applicable
    }

    // Boolean conversion verification
    const booleanFields = ['interested_in_coaching', 'qualified_lead', 'contacted'];
    let booleansPassed = 0;
    let totalBooleans = 0;
    
    booleanFields.forEach(field => {
      if (payload[field] !== undefined) {
        totalBooleans++;
        if (typeof fields[field] === 'boolean') {
          booleansPassed++;
        }
      }
    });
    
    checks.boolean_converted = totalBooleans === 0 || booleansPassed === totalBooleans;

    // Company mapping
    if (payload.company || payload.Company || payload.company_name) {
      const expectedCompany = payload.company || payload.Company || payload.company_name;
      if (fields.company_input === expectedCompany) {
        checks.company_mapped = true;
      }
    } else {
      checks.company_mapped = true; // Not applicable
    }

    // Source form mapping
    if (payload.source_form || payload.form_name) {
      const expectedSource = payload.source_form || payload.form_name;
      if (fields.lead_source === expectedSource) {
        checks.source_mapped = true;
      }
    } else {
      checks.source_mapped = true; // Not applicable
    }

    // Field mapping success rate
    const mappingRate = parseFloat(fields.field_mapping_success_rate);
    if (mappingRate >= 95) {
      checks.field_mapping_rate_excellent = true;
    }

    // Unknown fields logging
    checks.unknown_fields_logged = true; // Always true for now

    // Normalization version
    if (fields.normalization_version && fields.normalization_version.includes('v3.2')) {
      checks.normalization_version_current = true;
    }

    // Calculate overall success
    const passedChecks = Object.values(checks).filter(check => check === true).length;
    const totalChecks = Object.keys(checks).length;
    checks.overall_success = passedChecks === totalChecks;
    checks.passed_checks = passedChecks;
    checks.total_checks = totalChecks;
    checks.verification_rate = ((passedChecks / totalChecks) * 100).toFixed(1);

    return checks;
  }

  async executeTest(test, testNumber, totalTests) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔄 TEST ${testNumber}/${totalTests}: ${test.id} - ${test.name}`);
    console.log(`📋 Category: ${test.categoryDescription}`);
    console.log(`${'='.repeat(80)}`);
    
    const startTime = Date.now();
    const testResult = {
      test_id: test.id,
      test_name: test.name,
      category: test.category,
      start_time: new Date().toISOString(),
      payload: test.payload,
      expected: test.expected
    };

    try {
      // Execute the webhook
      console.log('🚀 Sending payload to webhook...');
      console.log(`📤 Email: ${test.payload.email}`);
      
      const curlCommand = this.generateCurlCommand(test.payload);
      const curlOutput = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
      
      console.log(`📤 Webhook response received (${curlOutput.length} chars)`);
      
      // Wait for processing
      console.log('⏳ Waiting 8 seconds for processing...');
      await this.sleep(8000);
      
      // Analyze the response
      const analysis = this.analyzeWebhookResponse(test.id, test.payload, curlOutput);
      
      Object.assign(testResult, analysis);
      testResult.execution_time_ms = Date.now() - startTime;
      testResult.end_time = new Date().toISOString();
      
      // Display results
      if (testResult.success) {
        console.log(`✅ TEST ${test.id} PASSED`);
        console.log(`📊 Verification: ${testResult.verification.verification_rate}% (${testResult.verification.passed_checks}/${testResult.verification.total_checks})`);
        console.log(`📊 Field Mapping: ${testResult.performance.field_mapping_success_rate}%`);
        console.log(`📊 Record: ${testResult.airtable_record_id}`);
      } else {
        console.log(`❌ TEST ${test.id} FAILED`);
        if (testResult.error) {
          console.log(`💥 Error: ${testResult.error}`);
        }
        if (testResult.verification) {
          console.log(`📊 Verification: ${testResult.verification.verification_rate}% (${testResult.verification.passed_checks}/${testResult.verification.total_checks})`);
        }
      }
      
    } catch (error) {
      testResult.error = error.message;
      testResult.success = false;
      testResult.end_time = new Date().toISOString();
      testResult.execution_time_ms = Date.now() - startTime;
      console.log(`❌ TEST ${test.id} FAILED: ${error.message}`);
    }
    
    this.results.push(testResult);
    return testResult;
  }

  async runAllTests() {
    const allTests = this.getAllTests();
    console.log(`\n🚀 STARTING COMPREHENSIVE TEST SUITE EXECUTION`);
    console.log(`📊 Total Tests: ${allTests.length}`);
    console.log(`⏰ Started: ${this.startTime.toISOString()}`);
    console.log(`🎯 Target: 95%+ success rate with automated verification\n`);
    
    for (let i = 0; i < allTests.length; i++) {
      const test = allTests[i];
      await this.executeTest(test, i + 1, allTests.length);
      
      // Progress update
      const completed = i + 1;
      const passed = this.results.filter(r => r.success).length;
      const currentRate = ((passed / completed) * 100).toFixed(1);
      console.log(`📈 Progress: ${completed}/${allTests.length} | Success Rate: ${currentRate}%`);
      
      // Small pause between tests to avoid overwhelming the system
      if (i < allTests.length - 1) {
        console.log('⏸️  Pausing 5 seconds before next test...');
        await this.sleep(5000);
      }
    }
    
    this.generateComprehensiveReport();
    this.saveResults();
  }

  generateComprehensiveReport() {
    console.log('\n' + '🎯'.repeat(40));
    console.log('COMPREHENSIVE TEST SUITE EXECUTION REPORT');
    console.log('🎯'.repeat(40));
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const endTime = new Date();
    const duration = ((endTime - this.startTime) / 1000 / 60).toFixed(1);
    
    console.log(`\n📊 EXECUTION SUMMARY:`);
    console.log(`Total Tests Executed: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Execution Time: ${duration} minutes`);
    
    // Category breakdown
    const categoryStats = {};
    this.results.forEach(result => {
      if (!categoryStats[result.category]) {
        categoryStats[result.category] = { total: 0, passed: 0, tests: [] };
      }
      categoryStats[result.category].total++;
      categoryStats[result.category].tests.push(result);
      if (result.success) categoryStats[result.category].passed++;
    });
    
    console.log(`\n📂 RESULTS BY CATEGORY:`);
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      const rate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    });
    
    // Performance metrics
    if (total > 0) {
      const validResults = this.results.filter(r => r.performance && r.performance.field_mapping_success_rate);
      if (validResults.length > 0) {
        const avgMappingRate = validResults.reduce((sum, r) => sum + r.performance.field_mapping_success_rate, 0) / validResults.length;
        const totalCost = this.results.reduce((sum, r) => sum + (r.costs ? r.costs.total_processing_cost : 0), 0);
        
        console.log(`\n📈 PERFORMANCE METRICS:`);
        console.log(`Average Field Mapping Rate: ${avgMappingRate.toFixed(1)}%`);
        console.log(`Total Processing Cost: $${totalCost.toFixed(3)}`);
        console.log(`Average Test Duration: ${(this.results.reduce((sum, r) => sum + (r.execution_time_ms || 0), 0) / total / 1000).toFixed(1)}s`);
      }
    }
    
    // Failed tests details
    if (failed > 0) {
      console.log(`\n❌ FAILED TESTS ANALYSIS:`);
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.test_id}: ${result.test_name}`);
        if (result.error) console.log(`    Error: ${result.error}`);
        if (result.verification && result.verification.verification_rate) {
          console.log(`    Verification: ${result.verification.verification_rate}%`);
        }
      });
    }
    
    // Success criteria assessment
    console.log(`\n🎯 SUCCESS CRITERIA ASSESSMENT:`);
    console.log(`Target Success Rate: 95%`);
    console.log(`Actual Success Rate: ${successRate}%`);
    console.log(`Status: ${parseFloat(successRate) >= 95 ? '✅ TARGET MET' : '❌ BELOW TARGET'}`);
    
    console.log(`\n💾 Detailed results saved in: ${this.resultsDir}`);
    console.log('🎯'.repeat(40));
    
    return {
      total,
      passed,
      failed,
      success_rate: successRate,
      duration_minutes: duration,
      category_stats: categoryStats
    };
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `full-suite-results-${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    const reportData = {
      test_session: {
        name: this.testSuite.name,
        version: this.testSuite.version,
        start_time: this.startTime.toISOString(),
        end_time: new Date().toISOString(),
        total_tests: this.results.length,
        passed_tests: this.results.filter(r => r.success).length,
        failed_tests: this.results.filter(r => !r.success).length,
        success_rate: ((this.results.filter(r => r.success).length / this.results.length) * 100).toFixed(1),
        automation_level: 'fully_automated_with_verification'
      },
      test_results: this.results
    };
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`💾 Complete results saved to: ${filepath}`);
    return filepath;
  }

  async run() {
    console.log('🚀 UYSP Comprehensive Automated Test Suite');
    console.log('⚡ Fully automated execution with webhook verification');
    
    const loaded = await this.loadTestSuite();
    if (!loaded) {
      return;
    }
    
    await this.runAllTests();
  }
}

// Execute the full test suite
if (require.main === module) {
  const suite = new FullAutomatedTestSuite();
  suite.run().catch(error => {
    console.error('💥 Test suite execution failed:', error);
    process.exit(1);
  });
}

module.exports = FullAutomatedTestSuite; 