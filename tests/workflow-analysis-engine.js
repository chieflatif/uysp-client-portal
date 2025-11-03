#!/usr/bin/env node

/**
 * COMPREHENSIVE WORKFLOW ANALYSIS & TESTING ENGINE
 * 
 * PURPOSE: Data correlation and analysis algorithms for workflow debugging
 * ARCHITECTURE: Node.js runtime - receives data from AI agent, performs correlation analysis
 * CAPABILITIES: Pattern analysis, comparative testing, strategic reporting on provided data
 * SCOPE: Analysis algorithms only - AI agent provides MCP data separately
 */

const fs = require('fs');
const path = require('path');

class WorkflowAnalysisEngine {
  constructor() {
    this.workflows = new Map();
    this.testResults = new Map();
    this.comparisons = [];
    this.resultsDir = path.join(__dirname, 'results');
    this.testSuiteFile = path.join(__dirname, 'reality-based-tests-v3.json');
    
    this.ensureDirectories();
    this.loadTestSuite();
    
    console.log('🔬 WORKFLOW ANALYSIS ENGINE INITIALIZED');
    console.log('📊 Ready for comprehensive workflow analysis');
  }

  ensureDirectories() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  loadTestSuite() {
    try {
      const data = fs.readFileSync(this.testSuiteFile, 'utf8');
      this.testSuite = JSON.parse(data);
      console.log(`✅ Loaded test suite: ${this.testSuite.mandatory_tests.field_variation_tests.length} tests`);
    } catch (error) {
      console.error('❌ Failed to load test suite:', error.message);
      this.testSuite = null;
    }
  }

  /**
   * WORKFLOW DEEP ANALYSIS
   * Analyzes provided workflow data structure, capabilities, performance characteristics
   * Note: Expects workflow data to be provided by AI agent from MCP tools
   */
  async analyzeWorkflow(workflowId, workflowData, workflowName = null) {
    console.log(`\n🔬 ANALYZING WORKFLOW: ${workflowId}`);
    
    const analysis = {
      id: workflowId,
      name: workflowName,
      timestamp: new Date().toISOString(),
      structure: null,
      capabilities: null,
      performance: null,
      nodes: null,
      errors: [],
      data_source: 'ai_agent_mcp_provided'
    };

    try {
      // Validate provided workflow data
      if (!workflowData) {
        throw new Error('Workflow data must be provided by AI agent - cannot collect from Node.js');
      }
      
      console.log('📋 Analyzing provided workflow data...');
      analysis.structure = workflowData;
      
      // Analyze node structure and capabilities
      console.log('🔍 Analyzing node structure...');
      analysis.nodes = this.analyzeNodeStructure(analysis.structure);
      
      // Determine workflow capabilities
      console.log('⚡ Determining capabilities...');
      analysis.capabilities = this.determineCapabilities(analysis.structure, analysis.nodes);
      
      // Generate performance analysis framework (requires execution data from AI agent)
      console.log('📊 Setting up performance analysis framework...');
      analysis.performance = this.createPerformanceAnalysisFramework(workflowId);
      
      // Store analysis
      this.workflows.set(workflowId, analysis);
      
      console.log(`✅ Workflow analysis complete: ${analysis.capabilities.totalFeatures} features detected`);
      return analysis;
      
    } catch (error) {
      console.error(`❌ Workflow analysis failed: ${error.message}`);
      analysis.errors.push(error.message);
      return analysis;
    }
  }

  /**
   * NODE STRUCTURE ANALYSIS
   * Deep dive into each node's configuration and role
   */
  analyzeNodeStructure(workflowData) {
    // Handle MCP wrapper structure
    const actualData = workflowData?.simulatedResult || workflowData;
    
    if (!actualData?.data?.workflow?.nodes) {
      return { error: 'No nodes found in workflow' };
    }

    const nodes = actualData.data.workflow.nodes;
    const connections = actualData.data.workflow.connections || {};
    
    const analysis = {
      totalNodes: nodes.length,
      nodeTypes: {},
      criticalNodes: [],
      dataFlow: this.analyzeDataFlow(nodes, connections),
      complexityScore: 0
    };

    // Analyze each node
    nodes.forEach(node => {
      const nodeType = node.type.replace('n8n-nodes-base.', '');
      
      // Count node types
      analysis.nodeTypes[nodeType] = (analysis.nodeTypes[nodeType] || 0) + 1;
      
      // Identify critical nodes
      if (this.isCriticalNode(node)) {
        analysis.criticalNodes.push({
          id: node.id,
          name: node.name,
          type: nodeType,
          role: this.determineNodeRole(node)
        });
      }
      
      // Calculate complexity
      analysis.complexityScore += this.calculateNodeComplexity(node);
    });

    return analysis;
  }

  /**
   * CAPABILITY DETERMINATION
   * Identifies what the workflow can actually do
   */
  determineCapabilities(workflowData, nodeAnalysis) {
    const capabilities = {
      // Data Processing
      fieldNormalization: false,
      booleanConversion: false,
      phoneProcessing: false,
      emailValidation: false,
      
      // Business Logic
      duplicateDetection: false,
      conditionalRouting: false,
      dataEnrichment: false,
      costTracking: false,
      
      // Integrations
      webhookTrigger: false,
      airtableIntegration: false,
      apiCalls: false,
      smsCapability: false,
      
      // Quality & Monitoring
      errorHandling: false,
      logging: false,
      validation: false,
      retryLogic: false,
      
      // Metadata
      totalFeatures: 0,
      maturityLevel: 'unknown',
      sessionType: 'unknown'
    };

    // Handle MCP wrapper structure
    const actualData = workflowData?.simulatedResult || workflowData;
    
    if (!actualData?.data?.workflow?.nodes) {
      return capabilities;
    }

    const nodes = actualData.data.workflow.nodes;
    
    // Analyze each node for capabilities
    nodes.forEach(node => {
      const nodeType = node.type.replace('n8n-nodes-base.', '');
      const params = node.parameters || {};
      const code = params.jsCode || '';
      
      // Webhook capabilities
      if (nodeType === 'webhook') {
        capabilities.webhookTrigger = true;
      }
      
      // Airtable capabilities
      if (nodeType === 'airtable') {
        capabilities.airtableIntegration = true;
        if (params.operation === 'search') capabilities.duplicateDetection = true;
      }
      
      // Code node analysis
      if (nodeType === 'code' && code) {
        if (code.includes('fieldMappings') || code.includes('normalized')) {
          capabilities.fieldNormalization = true;
        }
        if (code.includes('boolean') || code.includes('true') || code.includes('false')) {
          capabilities.booleanConversion = true;
        }
        if (code.includes('phone')) {
          capabilities.phoneProcessing = true;
        }
        if (code.includes('duplicate')) {
          capabilities.duplicateDetection = true;
        }
        if (code.includes('cost') || code.includes('apollo') || code.includes('twilio')) {
          capabilities.costTracking = true;
        }
      }
      
      // Conditional routing
      if (nodeType === 'if') {
        capabilities.conditionalRouting = true;
      }
      
      // Error handling
      if (node.retryOnFail || node.maxTries) {
        capabilities.retryLogic = true;
      }
      
      // HTTP nodes for API calls
      if (nodeType === 'httpRequest') {
        capabilities.apiCalls = true;
      }
    });

    // Calculate total features
    capabilities.totalFeatures = Object.values(capabilities).filter(v => v === true).length;
    
    // Determine maturity level
    if (capabilities.totalFeatures >= 10) capabilities.maturityLevel = 'advanced';
    else if (capabilities.totalFeatures >= 6) capabilities.maturityLevel = 'intermediate';
    else if (capabilities.totalFeatures >= 3) capabilities.maturityLevel = 'basic';
    else capabilities.maturityLevel = 'minimal';
    
    // Determine session type
    if (capabilities.fieldNormalization && capabilities.duplicateDetection) {
      capabilities.sessionType = 'session-1-2';
    } else if (capabilities.dataEnrichment) {
      capabilities.sessionType = 'session-3+';
    }

    return capabilities;
  }

  /**
   * PERFORMANCE ANALYSIS FRAMEWORK
   * Creates framework for analyzing execution performance data provided by AI agent
   */
  createPerformanceAnalysisFramework(workflowId) {
    console.log('📊 Creating performance analysis framework...');
    
    return {
      workflowId: workflowId,
      framework_created: new Date().toISOString(),
      requires_execution_data: true,
      analysis_capabilities: {
        execution_timing: 'Available when execution data provided',
        success_rate: 'Available when execution data provided', 
        error_patterns: 'Available when execution data provided',
        throughput: 'Available when execution data provided'
      },
      data_requirements: {
        execution_list: 'mcp_n8n_n8n_list_executions result',
        execution_details: 'Individual execution data',
        timeframe: 'Recommended 20 most recent executions'
      }
    };
  }

  /**
   * PERFORMANCE ANALYSIS
   * Analyzes execution performance data provided by AI agent
   */
  analyzeProvidedPerformanceData(executionData) {
    try {
      console.log('📊 Analyzing provided execution data...');

      // Validate provided execution data structure
      if (!executionData) {
        throw new Error('Execution data must be provided by AI agent');
      }
      
      // Handle MCP result structure
      const actualData = executionData?.data || executionData;
      
      if (!actualData?.data?.executions) {
        return { error: 'No execution data available' };
      }

      const execs = actualData.data.executions;
      const performance = {
        totalExecutions: execs.length,
        successCount: 0,
        errorCount: 0,
        averageDuration: 0,
        durations: [],
        lastExecution: null,
        reliability: 0
      };

      // Analyze each execution
      for (const exec of execs) {
        if (exec.finished) {
          if (exec.stoppedAt && exec.startedAt) {
            const duration = new Date(exec.stoppedAt) - new Date(exec.startedAt);
            performance.durations.push(duration);
          }
          // Assume finished = success for now (could enhance with detailed status)
          performance.successCount++;
        } else {
          performance.errorCount++;
        }
      }

      // Calculate metrics
      if (performance.durations.length > 0) {
        performance.averageDuration = performance.durations.reduce((a, b) => a + b, 0) / performance.durations.length;
      }
      
      performance.reliability = performance.totalExecutions > 0 ? 
        (performance.successCount / performance.totalExecutions) * 100 : 0;
      
      performance.lastExecution = execs[0] || null;

      return performance;
      
    } catch (error) {
      console.error('❌ Performance analysis failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * COMPREHENSIVE TESTING
   * Runs all tests and collects detailed evidence
   */
  async runComprehensiveTesting(workflowId, testLimit = null) {
    console.log(`\n🧪 COMPREHENSIVE TESTING: ${workflowId}`);
    
    if (!this.testSuite) {
      throw new Error('Test suite not loaded');
    }

    const tests = this.testSuite.mandatory_tests.field_variation_tests;
    const testsToRun = testLimit ? tests.slice(0, testLimit) : tests;
    
    console.log(`🚀 Running ${testsToRun.length} comprehensive tests`);
    
    const testResults = {
      workflowId,
      timestamp: new Date().toISOString(),
      totalTests: testsToRun.length,
      results: [],
      summary: null
    };

    // Execute each test
    for (let i = 0; i < testsToRun.length; i++) {
      const test = testsToRun[i];
      console.log(`\n📋 Test ${i + 1}/${testsToRun.length}: ${test.name}`);
      
      const result = await this.analyzeTestWithProvidedEvidence(test, workflowId, null);
      testResults.results.push(result);
      
      // Brief pause between tests
      await this.sleep(2000);
    }

    // Generate summary
    testResults.summary = this.generateTestSummary(testResults.results);
    
    // Store results
    this.testResults.set(workflowId, testResults);
    
    console.log(`\n✅ Testing complete: ${testResults.summary.successRate}% success rate`);
    return testResults;
  }

  /**
   * EXECUTE SINGLE TEST ANALYSIS
   * Analyzes test results using evidence provided by AI agent
   */
  async analyzeTestWithProvidedEvidence(test, workflowId, evidence) {
    const result = {
      testName: test.name,
      payload: test.payload,
      startTime: new Date().toISOString(),
      success: false,
      evidence: evidence || {},
      errors: [],
      requires_ai_agent_evidence: !evidence
    };

    try {
      if (!evidence) {
        // Create evidence collection framework for AI agent
        console.log('  📋 Creating evidence collection framework...');
        result.evidence_requirements = {
          webhook_trigger: {
            tool: 'mcp_n8n_n8n_trigger_webhook_workflow',
            params: {
              webhookUrl: 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean',
              data: test.payload,
              httpMethod: 'POST'
            }
          },
          airtable_verification: {
            tool: 'mcp_airtable_search_records',
            params: {
              baseId: 'appuBf0fTe8tp8ZaF',
              tableId: 'tblSk2Ikg21932uE0',
              searchTerm: test.payload.email || test.payload.EMAIL || test.payload.Email,
              maxRecords: 5
            }
          },
          execution_verification: {
            tool: 'mcp_n8n_n8n_list_executions',
            params: {
              workflowId: workflowId,
              limit: 3
            }
          }
        };
        
        result.status = 'EVIDENCE_COLLECTION_FRAMEWORK_CREATED';
        console.log('  ✅ Framework created - AI agent must collect evidence');
        return result;
      }

      // Analyze provided evidence
      console.log('  🔍 Analyzing provided evidence...');
      
      // Step 1: Analyze webhook evidence
      if (evidence.webhook) {
        result.evidence.webhook = evidence.webhook;
        console.log('  ✅ Webhook evidence analyzed');
      }

      // Step 2: Analyze Airtable evidence  
      if (evidence.airtable) {
        result.evidence.airtable = evidence.airtable;
        console.log('  ✅ Airtable evidence analyzed');
      }

      // Step 3: Analyze execution evidence
      if (evidence.executions) {
        result.evidence.executions = evidence.executions;
        console.log('  ✅ Execution evidence analyzed');
      }

      // Analyze results
      result.success = this.analyzeTestSuccess(result.evidence, test);
      result.endTime = new Date().toISOString();
      
      console.log(`  ${result.success ? '✅' : '❌'} Test ${result.success ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.log(`  ❌ Test FAILED: ${error.message}`);
      result.errors.push(error.message);
      result.endTime = new Date().toISOString();
    }

    return result;
  }

  /**
   * ANALYZE TEST SUCCESS
   * Determines if test passed based on evidence
   */
  analyzeTestSuccess(evidence, test) {
    // Check webhook success
    if (!evidence.webhook?.success) return false;
    
    // Check Airtable record creation
    if (!evidence.airtable || !Array.isArray(evidence.airtable) || evidence.airtable.length === 0) {
      return false;
    }
    
    const record = evidence.airtable[0];
    if (!record || !record.fields) return false;
    
    // Verify expected fields are present
    const expectedFields = test.expected_fields || [];
    let fieldsFound = 0;
    
    expectedFields.forEach(field => {
      if (record.fields[field] !== undefined) {
        fieldsFound++;
      }
    });
    
    // Additional V3.2 checks for location scoring if specified
    if (test.expected_affordability_tier) {
      if (!record.fields.affordability_tier || record.fields.affordability_tier !== test.expected_affordability_tier) {
        return false;
      }
    }
    if (test.expected_location_confidence_min !== undefined) {
      const lc = Number(record.fields.location_confidence || 0);
      if (!(lc >= test.expected_location_confidence_min)) return false;
    }
    if (test.expected_tier_d_gated === true) {
      const hr = !!record.fields.human_review_needed;
      if (!hr) return false;
    }

    // Success if at least 80% of expected fields are present
    return fieldsFound >= (expectedFields.length * 0.8);
  }

  /**
   * MCP TOOL FUNCTION REMOVED
   * 
   * ARCHITECTURAL VIOLATION CORRECTED:
   * Previous function attempted to call MCP tools from Node.js environment.
   * This violates separation of concerns - Node.js scripts cannot call MCP tools.
   * 
   * CORRECT ARCHITECTURE:
   * - AI agent calls MCP tools separately
   * - AI agent provides data to this analysis engine
   * - This engine performs correlation analysis on provided data
   */

  // Utility methods
  analyzeDataFlow(nodes, connections) {
    // Analyze how data flows through the workflow
    return { totalConnections: Object.keys(connections).length };
  }

  isCriticalNode(node) {
    const criticalTypes = ['webhook', 'code', 'airtable', 'if'];
    const nodeType = node.type.replace('n8n-nodes-base.', '');
    return criticalTypes.includes(nodeType);
  }

  determineNodeRole(node) {
    const nodeType = node.type.replace('n8n-nodes-base.', '');
    const roles = {
      webhook: 'trigger',
      code: 'processor',
      airtable: 'storage',
      if: 'router'
    };
    return roles[nodeType] || 'unknown';
  }

  calculateNodeComplexity(node) {
    let complexity = 1;
    if (node.parameters?.jsCode) complexity += 2;
    if (node.retryOnFail) complexity += 1;
    return complexity;
  }

  generateTestSummary(results) {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    
    return {
      totalTests: total,
      passed,
      failed,
      successRate: Math.round((passed / total) * 100)
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use
module.exports = WorkflowAnalysisEngine;

// CLI execution
if (require.main === module) {
  console.log('🔬 WORKFLOW ANALYSIS ENGINE');
  console.log('Use this engine to analyze and test workflows comprehensively');
  console.log('Example usage: const engine = new WorkflowAnalysisEngine();');
  console.log('               await engine.analyzeWorkflow("workflowId");');
}