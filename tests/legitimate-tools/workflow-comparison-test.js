#!/usr/bin/env node

/**
 * WORKFLOW COMPARISON TEST RUNNER
 * Tests GROK vs PRE COMPLIANCE workflows with identical payloads
 * Uses curl commands to test webhooks and measures execution results
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test Configuration
const WORKFLOWS = {
  GROK: {
    id: 'VjJCC0EMwIZp7Y6K',
    name: 'GROK (Fixed)',
    webhook: 'kajabi-leads-cleaned',
    description: '16 nodes, Smart Field Mapper v4.6, recently fixed formula'
  },
  PRE_COMPLIANCE: {
    id: 'wpg9K9s8wlfofv1u',
    name: 'PRE COMPLIANCE',
    webhook: 'kajabi-leads',
    description: '19 nodes, Smart Field Mapper v4.6, advanced compliance'
  }
};

const TEST_PAYLOADS = [
  {
    id: 'COMP001',
    name: 'Standard Lead',
    payload: {
      email: 'comp-test-001@example.com',
      name: 'John Comparison',
      phone: '555-0001',
      company: 'Comparison Corp',
      source_form: 'webinar-signup',
      interested_in_coaching: 'yes',
      request_id: 'COMP001-standard'
    }
  },
  {
    id: 'COMP002', 
    name: 'Boolean Test',
    payload: {
      email: 'comp-test-002@example.com',
      name: 'Jane Boolean',
      phone: '555-0002',
      interested_in_coaching: 'true',
      qualified_lead: 'false',
      contacted: '0',
      request_id: 'COMP002-boolean'
    }
  },
  {
    id: 'COMP003',
    name: 'Field Variation',
    payload: {
      email_address: 'comp-test-003@example.com',
      full_name: 'Bob Variation',
      phone_number: '555-0003',
      company_name: 'Field Test Inc',
      request_id: 'COMP003-variation'
    }
  }
];

class WorkflowComparisonTester {
  constructor() {
    this.results = {
      session_start: new Date().toISOString(),
      workflows: {},
      comparisons: [],
      summary: {}
    };
    
    // Initialize workflow results
    Object.keys(WORKFLOWS).forEach(key => {
      this.results.workflows[key] = {
        info: WORKFLOWS[key],
        executions: [],
        performance: {},
        issues: []
      };
    });
  }

  async executeWorkflowTest(workflowKey, payload) {
    const workflow = WORKFLOWS[workflowKey];
    const webhookUrl = `https://n8n.latifhorst.com/webhook/${workflow.webhook}`;
    
    console.log(`\n🧪 Testing ${workflow.name} with ${payload.name}`);
    console.log(`   📡 Webhook: ${workflow.webhook}`);
    
    const executionStart = Date.now();
    const execution = {
      test_id: payload.id,
      test_name: payload.name,
      workflow_id: workflow.id,
      webhook_url: webhookUrl,
      payload: payload.payload,
      start_time: new Date().toISOString(),
      status: 'PENDING'
    };

    try {
      // Send webhook payload
      const curlCommand = `curl -X POST "${webhookUrl}" ` +
        `-H "Content-Type: application/json" ` +
        `-d '${JSON.stringify(payload.payload)}' ` +
        `-w "%{http_code}" ` +
        `-s`;
      
      console.log(`   📤 Sending payload...`);
      const response = execSync(curlCommand, { encoding: 'utf8', timeout: 15000 });
      
      execution.webhook_response = response;
      execution.http_status = response.slice(-3); // Last 3 chars should be HTTP status
      
      console.log(`   📨 Response: ${response || 'Empty'}`);
      
      // Wait for processing
      console.log(`   ⏳ Waiting 8 seconds for processing...`);
      await this.delay(8000);
      
      execution.processing_time_ms = Date.now() - executionStart;
      execution.end_time = new Date().toISOString();
      execution.status = 'COMPLETED';
      
      console.log(`   ✅ Webhook execution completed`);
      
      // Store execution
      this.results.workflows[workflowKey].executions.push(execution);
      
      return execution;
      
    } catch (error) {
      execution.error = error.message;
      execution.status = 'FAILED';
      execution.end_time = new Date().toISOString();
      execution.processing_time_ms = Date.now() - executionStart;
      
      console.log(`   ❌ Execution failed: ${error.message}`);
      
      this.results.workflows[workflowKey].executions.push(execution);
      this.results.workflows[workflowKey].issues.push({
        test_id: payload.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return execution;
    }
  }

  async compareExecutions(testId) {
    console.log(`\n🔍 Analyzing executions for ${testId}...`);
    
    const grokExecution = this.results.workflows.GROK.executions.find(e => e.test_id === testId);
    const preComplianceExecution = this.results.workflows.PRE_COMPLIANCE.executions.find(e => e.test_id === testId);
    
    if (!grokExecution || !preComplianceExecution) {
      console.log(`   ⚠️  Missing execution data for ${testId}`);
      return null;
    }
    
    const comparison = {
      test_id: testId,
      grok: {
        status: grokExecution.status,
        processing_time_ms: grokExecution.processing_time_ms,
        http_status: grokExecution.http_status,
        error: grokExecution.error || null
      },
      pre_compliance: {
        status: preComplianceExecution.status,
        processing_time_ms: preComplianceExecution.processing_time_ms,
        http_status: preComplianceExecution.http_status,
        error: preComplianceExecution.error || null
      },
      analysis: {}
    };
    
    // Performance comparison
    if (grokExecution.processing_time_ms && preComplianceExecution.processing_time_ms) {
      const timeDiff = preComplianceExecution.processing_time_ms - grokExecution.processing_time_ms;
      comparison.analysis.performance = {
        faster_workflow: timeDiff > 0 ? 'GROK' : 'PRE_COMPLIANCE',
        time_difference_ms: Math.abs(timeDiff),
        grok_time: grokExecution.processing_time_ms,
        pre_compliance_time: preComplianceExecution.processing_time_ms
      };
    }
    
    // Success comparison
    comparison.analysis.reliability = {
      grok_success: grokExecution.status === 'COMPLETED',
      pre_compliance_success: preComplianceExecution.status === 'COMPLETED',
      more_reliable: grokExecution.status === preComplianceExecution.status ? 'EQUAL' : 
                    (grokExecution.status === 'COMPLETED' ? 'GROK' : 'PRE_COMPLIANCE')
    };
    
    console.log(`   📊 Performance: ${comparison.analysis.performance?.faster_workflow || 'Unknown'} is faster`);
    console.log(`   🛡️  Reliability: ${comparison.analysis.reliability.more_reliable} is more reliable`);
    
    this.results.comparisons.push(comparison);
    
    return comparison;
  }

  generateSummary() {
    console.log(`\n📊 GENERATING COMPREHENSIVE SUMMARY...`);
    
    const summary = {
      total_tests: TEST_PAYLOADS.length,
      workflows_tested: Object.keys(WORKFLOWS).length,
      test_completion_time: new Date().toISOString()
    };
    
    // Workflow performance summary
    Object.keys(WORKFLOWS).forEach(key => {
      const workflow = this.results.workflows[key];
      const executions = workflow.executions;
      
      const successful = executions.filter(e => e.status === 'COMPLETED').length;
      const failed = executions.filter(e => e.status === 'FAILED').length;
      const avgTime = executions.length > 0 ? 
        executions.reduce((sum, e) => sum + (e.processing_time_ms || 0), 0) / executions.length : 0;
      
      summary[key.toLowerCase()] = {
        total_executions: executions.length,
        successful_executions: successful,
        failed_executions: failed,
        success_rate: executions.length > 0 ? ((successful / executions.length) * 100).toFixed(1) + '%' : '0%',
        average_processing_time_ms: Math.round(avgTime),
        issues_count: workflow.issues.length
      };
    });
    
    // Overall recommendation
    const grokStats = summary.grok;
    const preComplianceStats = summary.pre_compliance;
    
    if (grokStats && preComplianceStats) {
      const grokSuccess = parseFloat(grokStats.success_rate);
      const preComplianceSuccess = parseFloat(preComplianceStats.success_rate);
      
      if (grokSuccess > preComplianceSuccess) {
        summary.recommendation = 'GROK - Higher success rate';
      } else if (preComplianceSuccess > grokSuccess) {
        summary.recommendation = 'PRE_COMPLIANCE - Higher success rate';
      } else if (grokStats.average_processing_time_ms < preComplianceStats.average_processing_time_ms) {
        summary.recommendation = 'GROK - Equal success, faster processing';
      } else {
        summary.recommendation = 'PRE_COMPLIANCE - Equal or better performance';
      }
    }
    
    this.results.summary = summary;
    
    console.log(`\n🎯 SUMMARY GENERATED:`);
    console.log(`   Tests: ${summary.total_tests}`);
    console.log(`   GROK Success: ${summary.grok?.success_rate || 'N/A'}`);
    console.log(`   PRE COMPLIANCE Success: ${summary.pre_compliance?.success_rate || 'N/A'}`);
    console.log(`   Recommendation: ${summary.recommendation || 'Insufficient data'}`);
    
    return summary;
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `workflow-comparison-${timestamp}.json`;
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
    console.log('🚀 WORKFLOW COMPARISON TEST - GROK vs PRE COMPLIANCE');
    console.log('====================================================');
    console.log(`📋 Testing ${TEST_PAYLOADS.length} payloads on both workflows`);
    console.log(`🎯 Workflows: ${Object.values(WORKFLOWS).map(w => w.name).join(' vs ')}`);
    
    // Execute all tests on both workflows
    for (const payload of TEST_PAYLOADS) {
      console.log(`\n🔄 Running test ${payload.id}: ${payload.name}`);
      
      // Test GROK
      await this.executeWorkflowTest('GROK', payload);
      
      // Brief delay between workflow tests
      await this.delay(2000);
      
      // Test PRE COMPLIANCE
      await this.executeWorkflowTest('PRE_COMPLIANCE', payload);
      
      // Compare results
      await this.compareExecutions(payload.id);
      
      // Longer delay between test sets
      await this.delay(3000);
    }
    
    // Generate final summary
    const summary = this.generateSummary();
    
    // Save all results
    const resultsFile = this.saveResults();
    
    console.log(`\n🎉 COMPREHENSIVE TESTING COMPLETE`);
    console.log(`📁 Results: ${resultsFile}`);
    console.log(`🏆 Recommendation: ${summary.recommendation}`);
    
    return this.results;
  }
}

// Export for potential module use
module.exports = WorkflowComparisonTester;

// Run if called directly
if (require.main === module) {
  const tester = new WorkflowComparisonTester();
  tester.runComprehensiveTest().catch(error => {
    console.error('💥 COMPARISON TEST FAILED:', error);
    process.exit(1);
  });
}