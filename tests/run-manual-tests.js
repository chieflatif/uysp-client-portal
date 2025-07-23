#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class UYSPTestRunner {
  constructor() {
    this.testSuite = null;
    this.results = [];
    this.resultsDir = path.join(__dirname, 'results');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Ensure results directory exists
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

  generateCurlCommand(payload) {
    const payloadJson = JSON.stringify(payload);
    return `curl -X POST "${this.testSuite.webhook_url}" -H "Content-Type: application/json" -d '${payloadJson}' -s`;
  }

  async executeTest(test) {
    console.log(`\n🔄 Executing Test: ${test.id} - ${test.name}`);
    console.log(`📋 Category: ${test.categoryDescription}`);
    
    const startTime = Date.now();
    const testResult = {
      test_id: test.id,
      test_name: test.name,
      category: test.category,
      start_time: new Date().toISOString(),
      payload: test.payload,
      expected: test.expected,
      curl_command: this.generateCurlCommand(test.payload)
    };

    try {
      // Display the curl command
      console.log(`\n📤 Curl Command:`);
      console.log(testResult.curl_command);
      
      // Ask user to manually trigger n8n workflow
      console.log(`\n⚠️  MANUAL STEP REQUIRED:`);
      console.log(`1. Go to n8n workflow: ${this.testSuite.webhook_url}`);
      console.log(`2. Click "Execute Workflow" button`);
      console.log(`3. Press Enter when ready to send payload...`);
      
      await this.waitForEnter();
      
      // Execute the curl command
      console.log('🚀 Sending payload...');
      const curlOutput = execSync(testResult.curl_command, { encoding: 'utf8' });
      
      testResult.response = curlOutput;
      testResult.execution_time_ms = Date.now() - startTime;
      
      // Wait for processing
      console.log('⏳ Waiting 5 seconds for processing...');
      await this.sleep(5000);
      
      // Ask for manual verification
      const verificationResult = await this.manualVerification(test);
      testResult.verification = verificationResult;
      testResult.success = verificationResult.overall_success;
      
      testResult.end_time = new Date().toISOString();
      
      console.log(`${testResult.success ? '✅' : '❌'} Test ${test.id} ${testResult.success ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      testResult.error = error.message;
      testResult.success = false;
      testResult.end_time = new Date().toISOString();
      console.log(`❌ Test ${test.id} FAILED: ${error.message}`);
    }
    
    this.results.push(testResult);
    return testResult;
  }

  async manualVerification(test) {
    console.log(`\n🔍 Manual Verification for Test ${test.id}:`);
    console.log(`Expected results: ${JSON.stringify(test.expected, null, 2)}`);
    
    const verification = {
      airtable_record_created: await this.askYesNo('Was an Airtable record created?'),
      fields_normalized_correctly: await this.askYesNo('Were all fields normalized correctly?'),
      no_workflow_errors: await this.askYesNo('Did the workflow run without errors?')
    };
    
    // Category-specific verification
    if (test.category === 'boolean_conversions') {
      verification.boolean_fields_correct = await this.askYesNo('Are boolean fields showing as true/false (not strings)?');
    }
    
    if (test.category === 'duplicate_handling') {
      verification.duplicate_handled_correctly = await this.askYesNo('Was duplicate handling correct (update vs create)?');
    }
    
    if (test.category === 'edge_cases' && test.id === 'EC003') {
      verification.international_flag_set = await this.askYesNo('Was the international phone flag set correctly?');
    }
    
    // Ask for Airtable record ID if record was created
    if (verification.airtable_record_created) {
      verification.airtable_record_id = await this.askInput('Enter the Airtable record ID (rec...):');
    }
    
    // Overall success assessment
    const criticalChecks = [
      verification.airtable_record_created,
      verification.fields_normalized_correctly,
      verification.no_workflow_errors
    ];
    
    verification.overall_success = criticalChecks.every(check => check === true);
    
    return verification;
  }

  async askYesNo(question) {
    return new Promise((resolve) => {
      this.rl.question(`${question} (y/n): `, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async askInput(question) {
    return new Promise((resolve) => {
      this.rl.question(`${question} `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async waitForEnter() {
    return new Promise((resolve) => {
      this.rl.question('Press Enter to continue...', () => {
        resolve();
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showMainMenu() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 UYSP Comprehensive Test Suite Runner');
    console.log('='.repeat(60));
    console.log('1. Run all tests sequentially');
    console.log('2. Run tests by category');
    console.log('3. Run single test');
    console.log('4. View test results');
    console.log('5. Generate summary report');
    console.log('6. Exit');
    console.log('='.repeat(60));
    
    const choice = await this.askInput('Select option (1-6):');
    return choice;
  }

  async runAllTests() {
    const allTests = this.getAllTests();
    console.log(`\n🚀 Running ${allTests.length} tests sequentially...`);
    
    for (let i = 0; i < allTests.length; i++) {
      const test = allTests[i];
      console.log(`\n📊 Progress: ${i + 1}/${allTests.length}`);
      await this.executeTest(test);
      
      if (i < allTests.length - 1) {
        console.log('\n⏸️  Pausing before next test...');
        await this.waitForEnter();
      }
    }
    
    this.saveResults();
    this.generateSummaryReport();
  }

  async runTestsByCategory() {
    const categories = Object.keys(this.testSuite.test_categories);
    console.log('\n📂 Available categories:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat} - ${this.testSuite.test_categories[cat].description}`);
    });
    
    const choice = await this.askInput('Select category (1-' + categories.length + '):');
    const categoryIndex = parseInt(choice) - 1;
    
    if (categoryIndex >= 0 && categoryIndex < categories.length) {
      const selectedCategory = categories[categoryIndex];
      const categoryTests = this.testSuite.test_categories[selectedCategory].tests;
      
      console.log(`\n🎯 Running ${categoryTests.length} tests from category: ${selectedCategory}`);
      
      for (const test of categoryTests) {
        const testWithCategory = { ...test, category: selectedCategory };
        await this.executeTest(testWithCategory);
        await this.waitForEnter();
      }
      
      this.saveResults();
    } else {
      console.log('❌ Invalid category selection');
    }
  }

  async runSingleTest() {
    const allTests = this.getAllTests();
    console.log('\n📋 Available tests:');
    allTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.id} - ${test.name} (${test.category})`);
    });
    
    const choice = await this.askInput('Select test (1-' + allTests.length + '):');
    const testIndex = parseInt(choice) - 1;
    
    if (testIndex >= 0 && testIndex < allTests.length) {
      const selectedTest = allTests[testIndex];
      await this.executeTest(selectedTest);
      this.saveResults();
    } else {
      console.log('❌ Invalid test selection');
    }
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    const reportData = {
      test_session: {
        start_time: this.results.length > 0 ? this.results[0].start_time : new Date().toISOString(),
        end_time: new Date().toISOString(),
        total_tests: this.results.length,
        passed_tests: this.results.filter(r => r.success).length,
        failed_tests: this.results.filter(r => !r.success).length
      },
      test_results: this.results
    };
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);
  }

  generateSummaryReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.test_id}: ${result.test_name}`);
        if (result.error) console.log(`    Error: ${result.error}`);
      });
    }
    
    console.log(`\n💾 Detailed results saved in: ${this.resultsDir}`);
  }

  viewTestResults() {
    const files = fs.readdirSync(this.resultsDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      console.log('📭 No test results found');
      return;
    }
    
    console.log('\n📁 Available result files:');
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
  }

  async run() {
    console.log('🚀 Starting UYSP Test Runner...');
    
    const loaded = await this.loadTestSuite();
    if (!loaded) {
      this.rl.close();
      return;
    }
    
    while (true) {
      const choice = await this.showMainMenu();
      
      switch (choice) {
        case '1':
          await this.runAllTests();
          break;
        case '2':
          await this.runTestsByCategory();
          break;
        case '3':
          await this.runSingleTest();
          break;
        case '4':
          this.viewTestResults();
          break;
        case '5':
          this.generateSummaryReport();
          break;
        case '6':
          console.log('👋 Goodbye!');
          this.rl.close();
          return;
        default:
          console.log('❌ Invalid option');
      }
      
      await this.sleep(1000);
    }
  }
}

// Run the test runner if this script is executed directly
if (require.main === module) {
  const runner = new UYSPTestRunner();
  runner.run().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = UYSPTestRunner; 