#!/usr/bin/env node

const testSuite = require('../recovery-strategy/production/test-suite.json');

// Configuration
const WEBHOOK_URL = 'http://localhost:5678/webhook/kajabi-leads';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test runner
async function runTest(testPayload) {
  const { test_id, description, payload } = testPayload;
  
  console.log(`\n${colors.bright}${colors.blue}Testing: ${test_id}${colors.reset}`);
  console.log(`${colors.cyan}Description: ${description}${colors.reset}`);
  console.log(`Payload fields: ${Object.keys(payload).join(', ')}`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Success: ${result.operation || 'processed'}${colors.reset}`);
      console.log(`  Email: ${result.email}`);
      console.log(`  Unmapped fields: ${result.unmapped_fields_count || 0}`);
      console.log(`  Mapping success rate: ${result.mapping_success_rate || 'N/A'}`);
      
      return {
        test_id,
        success: true,
        operation: result.operation,
        unmapped_fields_count: result.unmapped_fields_count || 0,
        mapping_success_rate: result.mapping_success_rate
      };
    } else {
      console.log(`${colors.red}✗ Failed: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`  Error: ${JSON.stringify(result)}`);
      
      return {
        test_id,
        success: false,
        error: result.message || result.error || 'Unknown error'
      };
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    
    return {
      test_id,
      success: false,
      error: error.message
    };
  }
}

// Main test execution
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}=== UYSP Field Normalization Test Suite ===${colors.reset}`);
  console.log(`Running ${testSuite.test_payloads.length} tests...\n`);
  
  const results = [];
  
  for (const testPayload of testSuite.test_payloads) {
    const result = await runTest(testPayload);
    results.push(result);
    
    // Add delay between tests to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}=== Test Summary ===${colors.reset}`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`${colors.green}Passed: ${successful.length}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed.length}${colors.reset}`);
  
  if (failed.length > 0) {
    console.log(`\n${colors.red}Failed tests:${colors.reset}`);
    failed.forEach(f => {
      console.log(`  - ${f.test_id}: ${f.error}`);
    });
  }
  
  // Check unmapped fields
  const testsWithUnmapped = successful.filter(r => r.unmapped_fields_count > 0);
  if (testsWithUnmapped.length > 0) {
    console.log(`\n${colors.yellow}Tests with unmapped fields:${colors.reset}`);
    testsWithUnmapped.forEach(t => {
      console.log(`  - ${t.test_id}: ${t.unmapped_fields_count} unmapped fields`);
    });
    console.log(`${colors.yellow}Check Field_Mapping_Log table in Airtable for details${colors.reset}`);
  }
  
  // Overall result
  if (failed.length === 0) {
    console.log(`\n${colors.bright}${colors.green}✓ ALL TESTS PASSED!${colors.reset}`);
    console.log('Field normalization is working correctly.');
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ SOME TESTS FAILED${colors.reset}`);
    console.log('Please check the errors above.');
  }
  
  return {
    total: results.length,
    passed: successful.length,
    failed: failed.length,
    testsWithUnmapped: testsWithUnmapped.length
  };
}

// Check if webhook is accessible
async function checkWebhook() {
  try {
    console.log(`Checking webhook availability at ${WEBHOOK_URL}...`);
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });
    
    if (response.status === 405) {
      console.log(`${colors.green}✓ Webhook endpoint is accessible${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ Unexpected response: ${response.status}${colors.reset}`);
      return true; // Continue anyway
    }
  } catch (error) {
    console.log(`${colors.red}✗ Cannot reach webhook: ${error.message}${colors.reset}`);
    console.log('Make sure n8n is running and the workflow is active.');
    return false;
  }
}

// Run tests
(async () => {
  console.log('UYSP Field Normalization Test Runner');
  console.log('====================================\n');
  
  // Check webhook first
  const webhookAvailable = await checkWebhook();
  if (!webhookAvailable) {
    console.log('\nPlease start n8n and activate the workflow before running tests.');
    process.exit(1);
  }
  
  console.log('');
  
  // Run all tests
  const summary = await runAllTests();
  
  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
})();