#!/usr/bin/env node
/**
 * Single Test Runner - HONEST IMPLEMENTATION
 * 
 * This script can actually be run to test a single webhook payload
 * against the real n8n workflow and provide immediate feedback.
 * 
 * Usage: node tests/run-single-test.js [test-id]
 * Example: node tests/run-single-test.js B2.3
 */

const { execSync } = require('child_process');

// Real webhook configuration from workflow analysis
const WEBHOOK_CONFIG = {
  testUrl: 'https://rebelhq.app.n8n.cloud/webhook-test/kajabi-leads',
  prodUrl: 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads',
  useTestUrl: true // Change to false for production testing
};

// Test payloads - focused on critical cases
const TEST_CASES = {
  'A1.1': {
    description: 'Basic field mapping test',
    payload: {
      "email": "a1-1-basic@example.com",
      "name": "John Doe",
      "phone": "555-0001",
      "company": "Acme Corp",
      "request_id": "A1-1-basic-kajabi"
    },
    expected: "Should map all basic fields correctly"
  },
  'B2.3': {
    description: 'Boolean "0" conversion test (CRITICAL)',
    payload: {
      "email": "b2-3-zero@example.com",
      "name": "Zero Test",
      "interested_in_coaching": "0",
      "qualified_lead": "0", 
      "contacted": "0",
      "request_id": "B2-3-string-zero"
    },
    expected: "Should convert '0' to null for Airtable checkbox fields"
  },
  'B2.1': {
    description: 'Boolean "false" conversion test (CRITICAL)',
    payload: {
      "email": "b2-1-false@example.com",
      "name": "False Test",
      "interested_in_coaching": "false",
      "qualified_lead": "false",
      "contacted": "false", 
      "request_id": "B2-1-string-false"
    },
    expected: "Should convert 'false' to null for Airtable checkbox fields"
  },
  'B1.1': {
    description: 'Boolean "true" conversion test',
    payload: {
      "email": "b1-1-true@example.com",
      "name": "True Test",
      "interested_in_coaching": "true",
      "qualified_lead": "true",
      "contacted": "true",
      "request_id": "B1-1-string-true" 
    },
    expected: "Should convert 'true' to true for Airtable checkbox fields"
  },
  'A2.1': {
    description: 'Name splitting test',
    payload: {
      "email": "a2-1-split@example.com",
      "name": "David Michael Thompson",
      "phone": "555-0006",
      "request_id": "A2-1-name-splitting"
    },
    expected: "Should split name into first_name: 'David', last_name: 'Michael Thompson'"
  }
};

async function runSingleTest(testId) {
  console.log('🧪 SINGLE TEST RUNNER');
  console.log('====================');
  
  if (!testId) {
    console.log('📋 Available tests:');
    Object.entries(TEST_CASES).forEach(([id, test]) => {
      console.log(`   ${id}: ${test.description}`);
    });
    console.log('\\nUsage: node tests/run-single-test.js [test-id]');
    return;
  }

  const testCase = TEST_CASES[testId];
  if (!testCase) {
    console.log(`❌ Test ${testId} not found`);
    console.log('Available tests:', Object.keys(TEST_CASES).join(', '));
    return;
  }

  console.log(`\\n🎯 Running Test: ${testId}`);
  console.log(`📝 Description: ${testCase.description}`);
  console.log(`🎯 Expected: ${testCase.expected}`);
  
  const webhookUrl = WEBHOOK_CONFIG.useTestUrl ? WEBHOOK_CONFIG.testUrl : WEBHOOK_CONFIG.prodUrl;
  console.log(`📡 Webhook URL: ${webhookUrl}`);
  console.log(`📋 Payload:`, JSON.stringify(testCase.payload, null, 2));

  try {
    console.log('\\n⏳ Sending webhook...');
    
    const curlCommand = `curl -X POST "${webhookUrl}" \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify(testCase.payload)}'`;
    
    console.log('\\n💻 Curl command:');
    console.log(curlCommand);
    
    const response = execSync(curlCommand, { 
      encoding: 'utf8', 
      timeout: 15000 
    });
    
    console.log('\\n📨 Response:');
    console.log(response || 'Empty response');
    
    console.log('\\n✅ Webhook sent successfully!');
    console.log('🔍 Next steps:');
    console.log('   1. Check n8n execution logs for processing details');
    console.log('   2. Verify record creation in Airtable');
    console.log('   3. Validate field mapping and boolean conversion');
    
    // Wait a moment for processing
    console.log('\\n⏳ Waiting 5 seconds for processing...');
    await delay(5000);
    
    console.log('\\n📋 Manual verification required:');
    console.log(`   - Airtable Base: appuBf0fTe8tp8ZaF`);
    console.log(`   - Search for email: ${testCase.payload.email}`);
    console.log(`   - Verify expected outcome: ${testCase.expected}`);
    
  } catch (error) {
    console.log('\\n❌ Test failed:');
    console.log(error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\\n💡 Timeout suggests:');
      console.log('   - Webhook URL may be incorrect');
      console.log('   - n8n workflow may not be active');
      console.log('   - Network connectivity issues');
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
const testId = process.argv[2];
runSingleTest(testId).catch(console.error);