#!/usr/bin/env node

// REAL FIELD NORMALIZATION TEST SUITE
// Tests actual record creation in Airtable, not just webhook responses

const testSuite = require('../recovery-strategy/production/test-suite.json');

// Configuration
const WEBHOOK_URL = 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg';
const AIRTABLE_BASE_ID = 'appuBf0fTe8tp8ZaF';
const AIRTABLE_TABLE_ID = 'tblSk2Ikg21932uE0';
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// n8n API for execution checking
const N8N_API_BASE = 'https://rebelhq.app.n8n.cloud/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY;

// Helper function to wait
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if execution completed successfully
async function checkExecutionStatus(executionId) {
  if (!N8N_API_KEY) {
    console.log(`${colors.yellow}⚠️  N8N_API_KEY not set - skipping execution verification${colors.reset}`);
    return { status: 'unknown', success: null };
  }

  try {
    const response = await fetch(`${N8N_API_BASE}/executions/${executionId}`, {
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { status: 'error', success: false, error: `API error: ${response.status}` };
    }

    const execution = await response.json();
    return {
      status: execution.finished ? 'completed' : 'running',
      success: execution.finished && !execution.stoppedAt,
      data: execution
    };
  } catch (error) {
    return { status: 'error', success: false, error: error.message };
  }
}

// Check if record was created in Airtable
async function checkRecordCreation(email, testId) {
  if (!AIRTABLE_TOKEN) {
    console.log(`${colors.yellow}⚠️  AIRTABLE_TOKEN not set - skipping record verification${colors.reset}`);
    return { found: false, recordId: null, error: 'No Airtable token' };
  }

  try {
    const filterFormula = `OR(FIND('${email}', {email}), FIND('${testId}', {source_form}))`;
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${encodeURIComponent(filterFormula)}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return { found: false, recordId: null, error: `Airtable API error: ${response.status}` };
    }

    const data = await response.json();
    const records = data.records || [];
    
    if (records.length > 0) {
      const record = records[0];
      return {
        found: true,
        recordId: record.id,
        fields: record.fields,
        total: records.length
      };
    } else {
      return { found: false, recordId: null, error: 'No matching records found' };
    }
  } catch (error) {
    return { found: false, recordId: null, error: error.message };
  }
}

// Real test runner that validates complete workflow
async function runRealTest(testPayload) {
  const { test_id, description, payload } = testPayload;
  const testEmail = payload.email || payload.Email || payload.EMAIL;
  
  console.log(`\n${colors.bright}${colors.blue}🧪 REAL TEST: ${test_id}${colors.reset}`);
  console.log(`${colors.gray}Description: ${description}${colors.reset}`);
  console.log(`${colors.gray}Email: ${testEmail}${colors.reset}`);

  const results = {
    test_id,
    webhook_response: false,
    execution_completed: false,
    record_created: false,
    execution_id: null,
    record_id: null,
    errors: []
  };

  try {
    // Step 1: Send webhook payload
    console.log(`${colors.yellow}📤 Sending webhook payload...${colors.reset}`);
    
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (webhookResponse.ok) {
      results.webhook_response = true;
      console.log(`${colors.green}✅ Webhook response: OK (${webhookResponse.status})${colors.reset}`);
      
      // Try to get execution ID from response
      const responseText = await webhookResponse.text();
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          results.execution_id = responseData.executionId;
        } catch (e) {
          // Response might be empty or not JSON
        }
      }
    } else {
      results.errors.push(`Webhook failed: ${webhookResponse.status}`);
      console.log(`${colors.red}❌ Webhook response: FAILED (${webhookResponse.status})${colors.reset}`);
    }

    // Step 2: Wait for workflow processing
    console.log(`${colors.yellow}⏳ Waiting 5 seconds for workflow processing...${colors.reset}`);
    await sleep(5000);

    // Step 3: Check execution status (if we have execution ID)
    if (results.execution_id) {
      console.log(`${colors.yellow}🔍 Checking execution status (ID: ${results.execution_id})...${colors.reset}`);
      const executionCheck = await checkExecutionStatus(results.execution_id);
      
      if (executionCheck.success === true) {
        results.execution_completed = true;
        console.log(`${colors.green}✅ Execution: COMPLETED successfully${colors.reset}`);
      } else if (executionCheck.success === false) {
        results.errors.push(`Execution failed: ${executionCheck.error}`);
        console.log(`${colors.red}❌ Execution: FAILED (${executionCheck.error})${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️  Execution: Status unknown${colors.reset}`);
      }
    }

    // Step 4: Check if record was actually created in Airtable
    console.log(`${colors.yellow}🔍 Checking Airtable for created record...${colors.reset}`);
    const recordCheck = await checkRecordCreation(testEmail, test_id);
    
    if (recordCheck.found) {
      results.record_created = true;
      results.record_id = recordCheck.recordId;
      console.log(`${colors.green}✅ Record created: YES (ID: ${recordCheck.recordId})${colors.reset}`);
      
      // Show mapped fields
      if (recordCheck.fields) {
        console.log(`${colors.cyan}📋 Mapped fields:${colors.reset}`);
        Object.entries(recordCheck.fields).forEach(([key, value]) => {
          if (value) {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
    } else {
      results.errors.push(`Record not found: ${recordCheck.error}`);
      console.log(`${colors.red}❌ Record created: NO (${recordCheck.error})${colors.reset}`);
    }

  } catch (error) {
    results.errors.push(`Test error: ${error.message}`);
    console.log(`${colors.red}💥 Test error: ${error.message}${colors.reset}`);
  }

  // Test result summary
  const passed = results.webhook_response && results.record_created;
  const status = passed ? `${colors.green}PASS` : `${colors.red}FAIL`;
  console.log(`\n${colors.bright}${status} ${test_id}${colors.reset}`);
  
  if (!passed) {
    console.log(`${colors.red}Errors:${colors.reset}`);
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return results;
}

// Main test runner
async function runAllRealTests() {
  console.log(`${colors.bright}${colors.blue}🚀 REAL FIELD NORMALIZATION TEST SUITE${colors.reset}`);
  console.log(`${colors.gray}Testing actual record creation in Airtable${colors.reset}`);
  console.log(`${colors.gray}Webhook: ${WEBHOOK_URL}${colors.reset}`);
  console.log(`${colors.gray}Airtable Base: ${AIRTABLE_BASE_ID}${colors.reset}\n`);

  const results = [];
  
  // Run first 3 tests from test suite
  const testsToRun = testSuite.test_payloads.slice(0, 3);
  
  for (const testPayload of testsToRun) {
    const result = await runRealTest(testPayload);
    results.push(result);
    
    // Wait between tests
    if (testPayload !== testsToRun[testsToRun.length - 1]) {
      console.log(`${colors.gray}Waiting 2 seconds before next test...${colors.reset}`);
      await sleep(2000);
    }
  }

  // Final summary
  console.log(`\n${colors.bright}${colors.blue}📊 FINAL TEST RESULTS${colors.reset}`);
  console.log(`${'='.repeat(50)}`);
  
  const passed = results.filter(r => r.webhook_response && r.record_created).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = (result.webhook_response && result.record_created) ? 
      `${colors.green}PASS` : `${colors.red}FAIL`;
    console.log(`${status} ${result.test_id} - Webhook: ${result.webhook_response ? '✅' : '❌'}, Record: ${result.record_created ? '✅' : '❌'}${colors.reset}`);
    
    if (result.record_id) {
      console.log(`     Record ID: ${result.record_id}`);
    }
    if (result.errors.length > 0) {
      console.log(`     Errors: ${result.errors.join(', ')}`);
    }
  });
  
  console.log(`\n${colors.bright}Overall Result: ${passed}/${total} tests passed${colors.reset}`);
  
  if (passed === total) {
    console.log(`${colors.green}🎉 ALL TESTS PASSED - Field normalization is working correctly!${colors.reset}`);
  } else {
    console.log(`${colors.red}💥 SOME TESTS FAILED - Check errors above for debugging${colors.reset}`);
  }

  return { passed, total, results };
}

// Environment check
function checkEnvironment() {
  console.log(`${colors.yellow}🔧 Environment Check:${colors.reset}`);
  console.log(`AIRTABLE_TOKEN: ${AIRTABLE_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`N8N_API_KEY: ${N8N_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (!AIRTABLE_TOKEN) {
    console.log(`${colors.red}⚠️  Warning: Without AIRTABLE_TOKEN, record verification will be skipped${colors.reset}`);
  }
  if (!N8N_API_KEY) {
    console.log(`${colors.red}⚠️  Warning: Without N8N_API_KEY, execution verification will be skipped${colors.reset}`);
  }
  console.log();
}

// Run the tests
if (require.main === module) {
  checkEnvironment();
  runAllRealTests().catch(error => {
    console.error(`${colors.red}💥 Test suite crashed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runRealTest, runAllRealTests, checkRecordCreation };