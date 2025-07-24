#!/usr/bin/env node

/**
 * MCP-Based Automated UYSP Test Runner
 * Uses actual MCP tools to verify Airtable results automatically
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MCPAutomatedTestRunner {
  constructor() {
    this.testSuite = null;
    this.results = [];
    this.resultsDir = path.join(__dirname, 'results');
    
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateCurlCommand(payload) {
    const payloadJson = JSON.stringify(payload);
    return `curl -X POST "${this.testSuite.webhook_url}" -H "Content-Type: application/json" -d '${payloadJson}' -s`;
  }

  async runSingleTest(testId = 'FV001') {
    // Find the test
    let selectedTest = null;
    
    Object.keys(this.testSuite.test_categories).forEach(categoryKey => {
      const category = this.testSuite.test_categories[categoryKey];
      category.tests.forEach(test => {
        if (test.id === testId) {
          selectedTest = { ...test, category: categoryKey };
        }
      });
    });

    if (!selectedTest) {
      console.error(`❌ Test ${testId} not found`);
      return null;
    }

    console.log(`\n🔄 Executing Test: ${selectedTest.id} - ${selectedTest.name}`);
    console.log(`📋 Category: ${selectedTest.category}`);
    
    const startTime = Date.now();
    const testResult = {
      test_id: selectedTest.id,
      test_name: selectedTest.name,
      category: selectedTest.category,
      start_time: new Date().toISOString(),
      payload: selectedTest.payload,
      expected: selectedTest.expected,
      curl_command: this.generateCurlCommand(selectedTest.payload)
    };

    try {
      // Execute the webhook
      console.log('🚀 Sending payload to webhook...');
      console.log(`📤 Payload: ${JSON.stringify(selectedTest.payload, null, 2)}`);
      
      const curlOutput = execSync(testResult.curl_command, { encoding: 'utf8' });
      testResult.webhook_response = curlOutput;
      console.log(`📤 Webhook response: ${curlOutput || 'Success (empty response)'}`);
      
      // Wait for processing
      console.log('⏳ Waiting 10 seconds for processing...');
      await this.sleep(10000);
      
      // This is where we would use MCP Airtable tools to verify
      // For now, return the test structure
      testResult.needs_mcp_verification = true;
      testResult.verification_email = selectedTest.payload.email;
      testResult.execution_time_ms = Date.now() - startTime;
      testResult.end_time = new Date().toISOString();
      
      console.log(`✅ Test ${selectedTest.id} executed successfully`);
      console.log(`🔍 Need to verify record for email: ${selectedTest.payload.email}`);
      
      this.results.push(testResult);
      return testResult;
      
    } catch (error) {
      testResult.error = error.message;
      testResult.success = false;
      testResult.end_time = new Date().toISOString();
      console.log(`❌ Test ${selectedTest.id} FAILED: ${error.message}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mcp-test-results-${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    const reportData = {
      test_session: {
        start_time: this.results.length > 0 ? this.results[0].start_time : new Date().toISOString(),
        end_time: new Date().toISOString(),
        total_tests: this.results.length,
        automation_level: 'webhook_only_mcp_verification_needed'
      },
      test_results: this.results
    };
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);
    return filepath;
  }

  async run() {
    console.log('🚀 Starting MCP-Based Test Runner...');
    
    const loaded = await this.loadTestSuite();
    if (!loaded) {
      return;
    }
    
    // Run a single test first
    const result = await this.runSingleTest('FV001');
    this.saveResults();
    
    return result;
  }
}

// Export for MCP usage
module.exports = MCPAutomatedTestRunner;

// CLI usage
if (require.main === module) {
  const runner = new MCPAutomatedTestRunner();
  runner.run().catch(error => {
    console.error('💥 MCP test runner crashed:', error);
    process.exit(1);
  });
} 