/**
 * Test Runner Wrapper
 * This is what the AI Testing Agent executes locally
 * NO API TOOLS HERE - just orchestration
 * Pure JS, no execSync/npm (cloud-compatible local run)
 */

const fs = require('fs');
const path = require('path');
const { runQuickTests } = require('../quick/index.js');

class TestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      phase: 'unknown',
      scriptOutput: null,
      validationInstructions: [],
      analysisRequirements: []
    };
  }

  async runTest(testType = 'quick') {
    console.log(`
╔════════════════════════════════════════════╗
║   UYSP Test Runner - ${testType.toUpperCase()}          ║
║   Reality-Based Testing Protocol v3.1      ║
╚════════════════════════════════════════════╝
    `);

    // Step 1: Pre-test instructions for AI
    this.results.validationInstructions.push(
      'BEFORE PROCEING: Use n8n API to verify workflows are active (curl -H "Authorization: Bearer $N8N_API_KEY" https://rebelhq.app.n8n.cloud/api/v1/workflows)',
      'BEFORE PROCEEDING: Use Airtable API to count current People records (curl -H "Authorization: Bearer $AIRTABLE_API_KEY" "https://api.airtable.com/v0/$BASE_ID/People?maxRecords=1")'
    );

    // Step 2: Run the actual test script (no API here, direct call)
    console.log('\n📝 Executing test script (no API tools) ...\n');
    
    try {
      const output = await runQuickTests();
      this.results.scriptOutput = JSON.stringify(output, null, 2);
      console.log(this.results.scriptOutput);
    } catch (error) {
      this.results.scriptOutput = error.message;
      this.results.error = true;
    }

    // Step 3: Post-test validation instructions
    console.log('\n🔍 VALIDATION REQUIRED - Use API Tools:\n');
    
    this.results.validationInstructions.push(
      'NOW: Search Airtable for any test records created via API',
      'NOW: Get the latest n8n execution with full data via API',
      'NOW: Analyze each node input/output for failures',
      'NOW: Verify business outcomes actually occurred',
      'HANDLE RATE LIMITS: If 429, wait 60s + retry'
    );

    // Step 4: Analysis requirements
    this.results.analysisRequirements = [
      'Extract exact error messages from failed nodes',
      'Compare expected vs actual field mappings',
      'Trace data flow through entire workflow',
      'Identify root cause, not symptoms',
      'Provide specific fix recommendations'
    ];

    // Save instructions for AI agent
    const reportPath = path.join(
      __dirname, 
      '../results',
      `test-run-${this.results.timestamp}.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`
╔════════════════════════════════════════════════════╗
║   VALIDATION & ANALYSIS TASKS                      ║
╠════════════════════════════════════════════════════╣
║   1. Verify Airtable records (use Airtable API)    ║
║   2. Get execution details (use n8n API)           ║
║   3. Analyze node-by-node data flow                ║
║   4. Identify root causes of any failures          ║
║   5. Generate detailed report with evidence        ║
╚════════════════════════════════════════════════════╝

Report saved to: ${reportPath}
    `);

    return this.results;
  }
}

// Export for AI agent to use
module.exports = TestRunner;

// Allow direct execution
if (require.main === module) {
  const runner = new TestRunner();
  runner.runTest(process.argv[2] || 'quick');
}
