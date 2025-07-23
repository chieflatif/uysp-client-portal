#!/usr/bin/env node

/**
 * UYSP Platform Gotcha Detection Script
 * Automatically identifies common n8n platform issues
 */

const gotchaPatterns = {
  // UI-Only Settings
  'No output data returned': 'Gotcha #1: Enable "Always Output Data" in Settings tab (NOT Parameters)',
  'No authentication data defined': 'Gotcha #2: Credentials corrupted, needs UI re-selection',
  'authentication data defined on node': 'Gotcha #2: Credentials corrupted, needs UI re-selection',
  
  // Expression Syntax  
  'Expression error': 'Gotcha #3: Check expression spacing {{ $json.field }} with spaces',
  'Nested expressions are not supported': 'Gotcha #4: Build formula in Code node first, use simple reference',
  'filterByFormula: Nested expressions': 'Gotcha #4: Use Code node to build Airtable formula',
  
  // Webhook Testing
  'webhook-test': 'Gotcha #5: Webhook test mode - click Execute Workflow for each test',
  'webhook test': 'Gotcha #5: Manual Execute Workflow required before each webhook test',
  
  // Table References
  'Table not found': 'Gotcha #6: Use table ID (tblXXXXXXXXXXXXXX) not table name',
  'table does not exist': 'Gotcha #6: Table names fail randomly, use table IDs',
  
  // Data Types
  'boolean conversion': 'Gotcha #7: Normalize boolean strings in Smart Field Mapper',
  'Invalid date': 'Gotcha #8: Strip timezone for date fields: .toISOString().split("T")[0]',
  'date format': 'Gotcha #8: Airtable expects ISO without timezone for dates',
  
  // Error Handling
  'error workflow': 'Gotcha #9: Error workflows use $json.error and $json.payload structure',
  'Execution timeout': 'Gotcha #10: Break into smaller workflows, 5min limit per execution',
  
  // API Issues
  'OAuth token': 'Gotcha #11: OAuth tokens don\'t auto-refresh in test mode',
  'authentication failed': 'Gotcha #11: Re-authenticate OAuth manually in development',
  
  // Performance
  'heap out of memory': 'Gotcha #13: Process in batches, limit to 100 items per operation',
  'JavaScript heap': 'Gotcha #13: Memory limit exceeded, reduce batch size',
  
  // Code Restrictions
  'module not found': 'Gotcha #14: No external npm packages in Code nodes',
  'require is not defined': 'Gotcha #14: Use built-in Node.js only, no external libraries',
  
  // UI Issues
  'connections lost': 'Gotcha #16: Copy/paste loses connections, use duplicate instead',
  'settings not saved': 'Gotcha #15: Check Settings tab (hidden by default)'
};

const urgentGotchas = [
  'No output data returned',
  'No authentication data defined', 
  'Table not found',
  'Expression error',
  'Execution timeout'
];

function detectGotchas(errorMessage, context = '') {
  console.log('\n🔍 GOTCHA DETECTION ANALYSIS');
  console.log('================================');
  console.log(`Error: ${errorMessage}`);
  console.log(`Context: ${context}`);
  
  const matches = [];
  
  // Check for exact matches
  for (const [pattern, solution] of Object.entries(gotchaPatterns)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      matches.push({
        pattern,
        solution,
        urgent: urgentGotchas.some(urgent => 
          pattern.toLowerCase().includes(urgent.toLowerCase())
        )
      });
    }
  }
  
  console.log('\n📋 DETECTED GOTCHAS:');
  if (matches.length === 0) {
    console.log('❌ No known gotcha patterns detected');
    console.log('💡 Check: context/platform-gotchas/n8n-platform-gotchas-complete.md');
    return false;
  }
  
  matches.forEach((match, i) => {
    const urgentFlag = match.urgent ? '🚨 URGENT' : '⚠️ ';
    console.log(`\n${urgentFlag} Match ${i + 1}:`);
    console.log(`   Pattern: ${match.pattern}`);
    console.log(`   Solution: ${match.solution}`);
  });
  
  console.log('\n🔧 NEXT STEPS:');
  const urgentMatches = matches.filter(m => m.urgent);
  if (urgentMatches.length > 0) {
    console.log('⚡ URGENT: Address these gotchas first!');
    urgentMatches.forEach(match => {
      console.log(`   - ${match.solution}`);
    });
  }
  
  console.log('\n📖 Full Reference: context/platform-gotchas/n8n-platform-gotchas-complete.md');
  return true;
}

// CLI Usage
if (require.main === module) {
  const errorMsg = process.argv[2];
  const context = process.argv[3] || '';
  
  if (!errorMsg) {
    console.log('Usage: node detect-gotchas.js "error message" ["context"]');
    console.log('\nExample:');
    console.log('node detect-gotchas.js "No output data returned" "IF node"');
    process.exit(1);
  }
  
  detectGotchas(errorMsg, context);
}

// Export for programmatic use
module.exports = { detectGotchas, gotchaPatterns };

// Common Error Test Cases
if (process.argv.includes('--test')) {
  console.log('\n🧪 TESTING GOTCHA DETECTION:\n');
  
  const testCases = [
    'No output data returned from IF node',
    'Table not found: People',
    'Expression error in filterByFormula', 
    'No authentication data defined on node',
    'JavaScript heap out of memory'
  ];
  
  testCases.forEach(testCase => {
    console.log(`\nTesting: "${testCase}"`);
    detectGotchas(testCase);
    console.log('---');
  });
} 