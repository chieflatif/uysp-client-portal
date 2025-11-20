/**
 * Detailed Grok-4-Fast Test
 *
 * Deployment confirmed in Azure:
 * - Name: grok-4-fast-non-reasoning
 * - Status: Succeeded
 * - Created: 2025-11-04
 * - Rate limit: 250K TPM, 250 RPM
 */

require('dotenv').config();

const ENDPOINT = 'https://chief-1020-resource.cognitiveservices.azure.com';
const API_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;
const MODEL = 'grok-4-fast-non-reasoning';

async function testGrokDetailed() {
  console.log('========================================');
  console.log('Grok-4-Fast Detailed Test');
  console.log('========================================\n');

  console.log('Deployment Info (from Azure):');
  console.log('  Name: grok-4-fast-non-reasoning');
  console.log('  Status: Succeeded');
  console.log('  Rate Limit: 250K TPM, 250 RPM');
  console.log('  Created: Today (Nov 4, 2025)\n');

  console.log('Test Configuration:');
  console.log(`  Endpoint: ${ENDPOINT}`);
  console.log(`  Model: ${MODEL}`);
  console.log(`  API Key: ${API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Timeout: 60 seconds\n`);

  if (!API_KEY) {
    console.error('❌ AZURE_OPENAI_KEY_FALLBACK not set');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('TEST 1: Simple Message (1 word response)');
  console.log('='.repeat(80));

  const url = `${ENDPOINT}/openai/deployments/${MODEL}/chat/completions?api-version=2024-08-01-preview`;

  console.log(`\n📤 Sending request to:\n${url}\n`);

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏱️ 60 second timeout reached, aborting...');
      controller.abort();
    }, 60000);

    console.log('⏳ Waiting for response...\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello!" in exactly one word.' }
        ],
        max_completion_tokens: 10,
        temperature: 0.1, // Lower temperature for faster response
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    console.log(`📥 Response received after ${elapsed}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (response.ok) {
      const data = await response.json();
      const message = data.choices?.[0]?.message?.content || '';

      console.log('\n✅ SUCCESS!\n');
      console.log(`Response: "${message}"`);
      console.log(`Model: ${data.model || 'unknown'}`);
      console.log(`Usage:`, JSON.stringify(data.usage, null, 2));

      // Speed test
      console.log('\n' + '='.repeat(80));
      console.log('PERFORMANCE');
      console.log('='.repeat(80));
      console.log(`\nResponse Time: ${elapsed}ms`);

      if (elapsed < 500) {
        console.log('Rating: 🚀 EXCELLENT (< 500ms)');
      } else if (elapsed < 1000) {
        console.log('Rating: ✅ GOOD (< 1s)');
      } else if (elapsed < 3000) {
        console.log('Rating: 👍 ACCEPTABLE (< 3s)');
      } else {
        console.log('Rating: ⚠️ SLOW (> 3s)');
      }

      // Compare to Azure models
      console.log('\nComparison:');
      console.log('  gpt-5-mini: ~470ms');
      console.log('  gpt-4.1-mini: ~590ms');
      console.log('  gpt-5-nano: ~1710ms');
      console.log(`  grok-4-fast: ${elapsed}ms`);

      return { success: true, elapsed, message };

    } else {
      const elapsed = Date.now() - startTime;
      const errorText = await response.text();

      console.log(`\n❌ FAILED after ${elapsed}ms\n`);
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${errorText.substring(0, 500)}`);

      try {
        const errorJson = JSON.parse(errorText);
        console.log('\nParsed Error:', JSON.stringify(errorJson, null, 2));
      } catch {
        // Plain text error
      }

      return { success: false, error: errorText };
    }

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`\n❌ ERROR after ${elapsed}ms\n`);
    console.log(`Type: ${error.name}`);
    console.log(`Message: ${error.message}`);

    if (error.name === 'AbortError') {
      console.log('\n⚠️ Request aborted due to 60s timeout');
      console.log('\nPossible causes:');
      console.log('  1. Model is cold-starting (first request after deployment)');
      console.log('  2. Model requires different API format');
      console.log('  3. Endpoint configuration issue');
      console.log('\nSuggestions:');
      console.log('  - Try again (second request often faster)');
      console.log('  - Check Azure portal for deployment status');
      console.log('  - Verify API key has access to this deployment');
    }

    return { success: false, timeout: true };
  }

  console.log('\n' + '='.repeat(80));
}

testGrokDetailed();
