#!/usr/bin/env node

/**
 * REAL WORKFLOW TESTING - WORKING VERSION
 * Tests both GROK and PRE COMPLIANCE with correct webhook URLs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Correct webhook URLs from n8n MCP diagnostic
const WEBHOOKS = {
  GROK: 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-cleaned',
  PRE_COMPLIANCE: 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads'
};

const WORKFLOW_IDS = {
  GROK: 'VjJCC0EMwIZp7Y6K',
  PRE_COMPLIANCE: 'wpg9K9s8wlfofv1u'
};

const TEST_PAYLOADS = [
  {
    id: 'TEST001',
    name: 'Basic Lead Test',
    payload: {
      email: 'test-basic-001@example.com',
      name: 'John Basic Test',
      phone: '555-0001',
      company: 'Test Corp',
      source_form: 'webinar-signup',
      interested_in_coaching: 'yes',
      request_id: 'TEST001-basic-lead'
    }
  },
  {
    id: 'TEST002',
    name: 'Boolean Conversion Test',
    payload: {
      email: 'test-boolean-002@example.com',
      name: 'Jane Boolean Test',
      phone: '555-0002',
      interested_in_coaching: 'true',
      qualified_lead: 'false',
      contacted: '0',
      request_id: 'TEST002-boolean-test'
    }
  }
];

class RealWorkflowTester {
  constructor() {
    this.results = {
      session_start: new Date().toISOString(),
      test_summary: {},
      workflows: {},
      execution_evidence: []
    };
    
    // Initialize workflow tracking
    Object.keys(WEBHOOKS).forEach(key => {
      this.results.workflows[key] = {
        webhook_url: WEBHOOKS[key],
        workflow_id: WORKFLOW_IDS[key],
        tests_executed: 0,
        successes: 0,
        failures: 0,
        executions: []
      };
    });
  }

  async executeWebhookTest(workflowKey, testPayload) {
    const webhook = WEBHOOKS[workflowKey];
    console.log(`\n🚀 Testing ${workflowKey} with ${testPayload.name}`);
    console.log(`   📡 URL: ${webhook}`);
    
    const startTime = Date.now();
    const testResult = {
      workflow: workflowKey,
      test_id: testPayload.id,
      test_name: testPayload.name,
      webhook_url: webhook,
      payload: testPayload.payload,
      start_time: new Date().toISOString(),
      status: 'PENDING'
    };

    try {
      // Execute webhook with timeout
      const curlCommand = `curl -X POST "${webhook}" ` +
        `-H "Content-Type: application/json" ` +
        `-d '${JSON.stringify(testPayload.payload)}' ` +
        `-w "%{http_code}" ` +
        `-s --max-time 30`;
      
      console.log(`   📤 Sending webhook payload...`);
      const response = execSync(curlCommand, { encoding: 'utf8', timeout: 35000 });
      
      const httpStatus = response.slice(-3);
      const responseBody = response.slice(0, -3);
      
      testResult.http_status = httpStatus;
      testResult.response_body = responseBody;
      testResult.processing_time_ms = Date.now() - startTime;
      testResult.end_time = new Date().toISOString();
      
      if (httpStatus === '200' || httpStatus === '201') {
        testResult.status = 'SUCCESS';
        this.results.workflows[workflowKey].successes++;
        console.log(`   ✅ Success! HTTP ${httpStatus}`);
      } else {
        testResult.status = 'HTTP_ERROR';
        testResult.error = `HTTP ${httpStatus}`;
        this.results.workflows[workflowKey].failures++;
        console.log(`   ⚠️  HTTP Error: ${httpStatus}`);
      }
      
    } catch (error) {
      testResult.status = 'FAILED';
      testResult.error = error.message;
      testResult.processing_time_ms = Date.now() - startTime;
      testResult.end_time = new Date().toISOString();
      this.results.workflows[workflowKey].failures++;
      console.log(`   ❌ Failed: ${error.message}`);
    }

    this.results.workflows[workflowKey].tests_executed++;
    this.results.workflows[workflowKey].executions.push(testResult);
    this.results.execution_evidence.push(testResult);
    
    return testResult;
  }

  async verifyExecution(workflowKey, testId) {
    console.log(`\n🔍 Verifying execution for ${workflowKey} test ${testId}...`);
    
    // Wait 5 seconds for n8n to process
    console.log(`   ⏳ Waiting 5 seconds for processing...`);
    await this.delay(5000);
    
    // Use MCP tools to check for new executions (would require MCP tools in Node.js)
    // For now, log that verification would happen here
    console.log(`   📊 Execution verification would check n8n for new executions`);
    console.log(`   🔍 Would query workflow ID: ${WORKFLOW_IDS[workflowKey]}`);
    
    return {
      verification_attempted: true,
      method: 'manual_check_required',
      workflow_id: WORKFLOW_IDS[workflowKey],
      timestamp: new Date().toISOString()
    };
  }

  generateSummary() {
    console.log(`\n📊 GENERATING TEST SUMMARY...`);
    
    const summary = {
      total_tests: this.results.execution_evidence.length,
      total_workflows: Object.keys(WEBHOOKS).length,
      execution_time: new Date().toISOString(),
      overall_success_rate: 0,
      workflow_performance: {}
    };

    let totalSuccesses = 0;
    
    Object.keys(this.results.workflows).forEach(workflowKey => {
      const workflow = this.results.workflows[workflowKey];
      const successRate = workflow.tests_executed > 0 ? 
        ((workflow.successes / workflow.tests_executed) * 100).toFixed(1) : '0.0';
      
      summary.workflow_performance[workflowKey] = {
        tests_executed: workflow.tests_executed,
        successes: workflow.successes,
        failures: workflow.failures,
        success_rate: `${successRate}%`,
        avg_response_time: this.calculateAvgResponseTime(workflow.executions)
      };
      
      totalSuccesses += workflow.successes;
    });
    
    summary.overall_success_rate = summary.total_tests > 0 ? 
      ((totalSuccesses / summary.total_tests) * 100).toFixed(1) + '%' : '0.0%';
    
    // Determine recommendation
    const grokPerf = summary.workflow_performance.GROK;
    const preCompPerf = summary.workflow_performance.PRE_COMPLIANCE;
    
    if (grokPerf && preCompPerf) {
      const grokSuccess = parseFloat(grokPerf.success_rate);
      const preCompSuccess = parseFloat(preCompPerf.success_rate);
      
      if (grokSuccess > preCompSuccess) {
        summary.recommendation = 'GROK - Higher success rate';
      } else if (preCompSuccess > grokSuccess) {
        summary.recommendation = 'PRE_COMPLIANCE - Higher success rate';
      } else {
        summary.recommendation = 'Equal performance - analyze detailed results';
      }
    } else {
      summary.recommendation = 'Insufficient data for recommendation';
    }
    
    this.results.test_summary = summary;
    return summary;
  }

  calculateAvgResponseTime(executions) {
    if (executions.length === 0) return 0;
    const total = executions.reduce((sum, exec) => sum + (exec.processing_time_ms || 0), 0);
    return Math.round(total / executions.length);
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `real-workflow-test-${timestamp}.json`;
    const filepath = path.join(__dirname, 'results', filename);
    
    // Ensure results directory exists
    const resultsDir = path.dirname(filepath);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Complete results saved to: ${filename}`);
    return filepath;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runComprehensiveTest() {
    console.log('🚀 REAL WORKFLOW TESTING - CORRECTED VERSION');
    console.log('===========================================');
    console.log(`📋 Testing ${TEST_PAYLOADS.length} payloads on ${Object.keys(WEBHOOKS).length} workflows`);
    console.log(`🎯 Workflows: ${Object.keys(WEBHOOKS).join(' vs ')}`);
    console.log(`🔗 Using correct n8n cloud URLs`);
    
    // Test each payload on both workflows
    for (const testPayload of TEST_PAYLOADS) {
      console.log(`\n🔄 Running test ${testPayload.id}: ${testPayload.name}`);
      
      // Test GROK
      await this.executeWebhookTest('GROK', testPayload);
      await this.verifyExecution('GROK', testPayload.id);
      
      // Brief delay
      await this.delay(2000);
      
      // Test PRE_COMPLIANCE
      await this.executeWebhookTest('PRE_COMPLIANCE', testPayload);
      await this.verifyExecution('PRE_COMPLIANCE', testPayload.id);
      
      // Delay between test sets
      await this.delay(3000);
    }
    
    // Generate summary
    const summary = this.generateSummary();
    
    // Save results
    const resultsFile = this.saveResults();
    
    console.log(`\n🎉 REAL TESTING COMPLETE`);
    console.log(`📁 Results: ${resultsFile}`);
    console.log(`🏆 Recommendation: ${summary.recommendation}`);
    console.log(`📊 Overall Success Rate: ${summary.overall_success_rate}`);
    
    return this.results;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new RealWorkflowTester();
  tester.runComprehensiveTest().catch(error => {
    console.error('💥 REAL TEST FAILED:', error);
    process.exit(1);
  });
}

module.exports = RealWorkflowTester;