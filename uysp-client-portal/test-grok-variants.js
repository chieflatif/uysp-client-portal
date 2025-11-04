/**
 * Test various Grok model deployment name variations
 */

require('dotenv').config();

const ENDPOINT = 'https://chief-1020-resource.cognitiveservices.azure.com';
const API_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;

// Possible Grok deployment names
const GROK_VARIANTS = [
  'grok-4-fast-non-reasoning',
  'grok-4-fast',
  'grok-4',
  'grok-fast',
  'grok',
  'grok-2-latest',
  'grok-2',
  'grok-beta',
  'grok-mini',
  'grok-vision',
];

async function testDeployment(modelName) {
  const url = `${ENDPOINT}/openai/deployments/${modelName}/chat/completions?api-version=2024-08-01-preview`;

  console.log(`Testing: ${modelName}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        max_completion_tokens: 5,
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ FOUND! Model: ${data.model || 'unknown'}`);
      return { name: modelName, found: true, model: data.model };
    } else {
      const status = response.status;
      if (status === 404) {
        console.log(`  ❌ Not found (404)`);
      } else {
        console.log(`  ⚠️ Error: ${status}`);
      }
      return { name: modelName, found: false, status };
    }
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`  ⏱️ Timeout (>10s)`);
      return { name: modelName, found: false, timeout: true };
    }
    console.log(`  ❌ Error: ${error.message}`);
    return { name: modelName, found: false, error: error.message };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Grok Model Name Discovery');
  console.log('========================================\n');

  console.log(`Endpoint: ${ENDPOINT}\n`);

  if (!API_KEY) {
    console.error('❌ AZURE_OPENAI_KEY_FALLBACK not set');
    process.exit(1);
  }

  const results = [];

  for (const variant of GROK_VARIANTS) {
    const result = await testDeployment(variant);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const found = results.filter(r => r.found);

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  if (found.length > 0) {
    console.log(`\n✅ Found ${found.length} Grok deployment(s):\n`);
    found.forEach(r => {
      console.log(`  - Deployment name: "${r.name}"`);
      console.log(`    Actual model: ${r.model}`);
      console.log('');
    });
  } else {
    console.log('\n❌ No Grok models found at this endpoint\n');
    console.log('Suggestions:');
    console.log('  1. Check Azure Portal for exact deployment name');
    console.log('  2. Deployment name may be custom (not standard)');
    console.log('  3. Model might be on different endpoint');
  }

  console.log('='.repeat(80));
}

runTests();
