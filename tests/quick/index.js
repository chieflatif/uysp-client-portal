#!/usr/bin/env node
/**
 * Quick Test Script - NO API TOOLS
 * This just sends HTTP requests and reports responses
 * Wrapped in async/try-catch for robustness; expanded coverage (429 sim, anomalies, junk)
 */

const https = require('https');
const testMatrix = require('../data/shared/Test-matrix.json');

async function runQuickTests() {
  const results = {
    tests: [],
    timestamp: new Date().toISOString()
  };

  // Choose first email from pdl_success bucket if available, else fallback
  const firstEmail =
    (testMatrix && testMatrix.buckets && testMatrix.buckets.pdl_success && testMatrix.buckets.pdl_success[0] && testMatrix.buckets.pdl_success[0].email) ||
    'test@example.com';

  // Test 1: Send webhook payload (NO API verification here)
  console.log('🚀 Test 1: Sending webhook payload...');
  
  const testPayload = {
    email: firstEmail,
    first_name: "Test",
    last_name: "User",
    company: "Salesforce",
    title: "Account Executive",
    touchpoint_count: 3,
    interested_in_coaching: true
  };

  try {
    const response = await sendWebhookRequest(testPayload);
    results.tests.push({
      name: 'webhook_send',
      payload: testPayload,
      response: response,
      httpStatus: response.statusCode
    });
    console.log(`✓ Webhook responded: ${response.statusCode}`);
  } catch (error) {
    results.tests.push({
      name: 'webhook_send',
      payload: testPayload,
      error: error.message
    });
    console.log(`✗ Webhook error: ${error.message}`);
  }

  // Test 2: Simulate 429 rate limit (expanded coverage)
  console.log('🚀 Test 2: Simulating 429 rate limit...');
  try {
    const sim429Response = await sendWebhookRequest(testPayload, true); // Force 429 sim
    results.tests.push({
      name: 'simulate_429',
      payload: testPayload,
      response: sim429Response,
      httpStatus: sim429Response.statusCode
    });
  } catch (error) {
    results.tests.push({ name: 'simulate_429', error: error.message });
  }

  // Test 3: Anomaly variant (e.g., junk data)
  console.log('🚀 Test 3: Anomaly junk data...');
  const anomalyPayload = { email: 'junk@invalid', company: null, title: 'undefined' };
  try {
    const response = await sendWebhookRequest(anomalyPayload);
    results.tests.push({
      name: 'anomaly_junk',
      payload: anomalyPayload,
      response: response,
      httpStatus: response.statusCode
    });
  } catch (error) {
    results.tests.push({ name: 'anomaly_junk', error: error.message });
  }

  // Output results for AI agent to analyze
  console.log('\n📊 Script Results (needs API validation):');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

function sendWebhookRequest(payload, simulate429 = false) {
  // Pure HTTP request - no API tools
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'rebelhq.app.n8n.cloud',
      path: '/webhook/kajabi-leads-complete-clean',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    if (simulate429) {
      return resolve({ statusCode: 429, body: 'Rate limit exceeded (simulated)' });
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Run if called directly
if (require.main === module) {
  runQuickTests();
}

module.exports = { runQuickTests };
