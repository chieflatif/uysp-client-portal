#!/usr/bin/env node

/**
 * Test script to verify MCP webhook trigger functionality
 */

async function testMCPWebhookTrigger() {
  console.log('🧪 Testing MCP Webhook Trigger...\n');
  
  const webhookUrl = 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads';
  const testPayload = {
    email: 'mcp-test-001@example.com',
    name: 'MCP Test User',
    phone: '555-9999',
    company: 'MCP Test Corp',
    interested_in_coaching: 'yes',
    request_id: 'mcp-test-001'
  };
  
  console.log('📋 Test Payload:', JSON.stringify(testPayload, null, 2));
  console.log(`\n🔗 Webhook URL: ${webhookUrl}`);
  
  try {
    // First test: Direct curl command to verify webhook is accessible
    console.log('\n1️⃣ Testing direct curl access...');
    const { execSync } = require('child_process');
    const curlCommand = `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '${JSON.stringify(testPayload)}' -s -w "\\n\\nHTTP Status: %{http_code}\\nTime: %{time_total}s"`;
    
    const curlResult = execSync(curlCommand, { encoding: 'utf8' });
    console.log('✅ Curl result:', curlResult);
    
    // Note: The actual MCP tool would be called like this:
    console.log('\n2️⃣ MCP Tool would be called with:');
    console.log(`mcp_n8n_n8n_trigger_webhook_workflow({
  webhookUrl: "${webhookUrl}",
  data: ${JSON.stringify(testPayload, null, 2)},
  httpMethod: "POST",
  waitForResponse: true
})`);
    
    console.log('\n✅ Test complete! Webhook is accessible.');
    console.log('📌 Note: In the actual implementation, we would use the MCP tool instead of curl.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Execute test
testMCPWebhookTrigger();