/**
 * Test o3-mini performance
 * User wants to compare o3-mini with gpt-4o and other models
 */

require('dotenv').config();

const ENDPOINT_1 = 'https://cursor-agent.services.ai.azure.com';
const KEY_1 = process.env.AZURE_OPENAI_KEY;

const ENDPOINT_2 = 'https://chief-1020-resource.cognitiveservices.azure.com';
const KEY_2 = process.env.AZURE_OPENAI_KEY_FALLBACK;

// Test all available models to find best primary/fallback combo
const MODELS_TO_TEST = [
  // Chief-1020 models
  { name: 'o3-mini', endpoint: ENDPOINT_2, key: KEY_2 },
  { name: 'gpt-4o', endpoint: ENDPOINT_2, key: KEY_2 },
  { name: 'gpt-5-nano', endpoint: ENDPOINT_2, key: KEY_2 },

  // Cursor-agent models
  { name: 'gpt-5-mini', endpoint: ENDPOINT_1, key: KEY_1 },
  { name: 'gpt-4.1-mini', endpoint: ENDPOINT_1, key: KEY_1 },
];

async function testModel(config) {
  const endpointName = config.endpoint.includes('chief') ? 'chief-1020' : 'cursor-agent';
  console.log(`\nTesting: ${config.name} @ ${endpointName}`);

  const url = `${config.endpoint}/openai/deployments/${config.name}/chat/completions?api-version=2024-08-01-preview`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hi" in one word.' }
        ],
        max_completion_tokens: 5,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const elapsed = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ ${elapsed}ms - Model: ${data.model || 'unknown'}`);
      return { ...config, elapsed, success: true, actualModel: data.model, endpointName };
    } else {
      const status = response.status;
      if (status === 404) {
        console.log(`  ❌ Not deployed`);
      } else if (status === 503) {
        console.log(`  ⚠️ Not ready (503)`);
      } else {
        console.log(`  ❌ Error: ${status}`);
      }
      return { ...config, success: false, status, endpointName };
    }
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`  ⏱️ Timeout`);
    } else {
      console.log(`  ❌ ${error.message}`);
    }
    return { ...config, success: false, endpointName };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Model Performance Comparison');
  console.log('========================================');
  console.log('Goal: Find best PRIMARY and FALLBACK on SEPARATE endpoints\n');

  const results = [];

  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const working = results.filter(r => r.success).sort((a, b) => a.elapsed - b.elapsed);

  console.log('\n' + '='.repeat(80));
  console.log('RESULTS (sorted by speed)');
  console.log('='.repeat(80));

  if (working.length === 0) {
    console.log('\n❌ No models responded successfully');
    return;
  }

  working.forEach((model, index) => {
    const badge = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
    console.log(`\n${badge} ${model.name} @ ${model.endpointName}`);
    console.log(`   Speed: ${model.elapsed}ms`);
    console.log(`   Model: ${model.actualModel}`);
  });

  // Find best primary/fallback on separate endpoints
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDED CONFIGURATION (separate endpoints)');
  console.log('='.repeat(80));

  // Group by endpoint
  const chief1020 = working.filter(m => m.endpointName === 'chief-1020');
  const cursorAgent = working.filter(m => m.endpointName === 'cursor-agent');

  if (chief1020.length > 0 && cursorAgent.length > 0) {
    const bestChief = chief1020[0];
    const bestCursor = cursorAgent[0];

    // Determine which should be primary (faster one)
    let primary, fallback;
    if (bestChief.elapsed <= bestCursor.elapsed) {
      primary = bestChief;
      fallback = bestCursor;
    } else {
      primary = bestCursor;
      fallback = bestChief;
    }

    console.log(`\nPRIMARY: ${primary.name} @ ${primary.endpointName}`);
    console.log(`  Speed: ${primary.elapsed}ms`);
    console.log(`  Endpoint: ${primary.endpoint}`);
    console.log(`  API Key: ${primary.endpointName === 'chief-1020' ? 'AZURE_OPENAI_KEY_FALLBACK' : 'AZURE_OPENAI_KEY'}`);

    console.log(`\nFALLBACK: ${fallback.name} @ ${fallback.endpointName}`);
    console.log(`  Speed: ${fallback.elapsed}ms`);
    console.log(`  Endpoint: ${fallback.endpoint}`);
    console.log(`  API Key: ${fallback.endpointName === 'chief-1020' ? 'AZURE_OPENAI_KEY_FALLBACK' : 'AZURE_OPENAI_KEY'}`);

    const speedDiff = fallback.elapsed - primary.elapsed;
    const percentSlower = Math.round((speedDiff / primary.elapsed) * 100);

    console.log(`\nPerformance Gap: ${speedDiff}ms (fallback is ${percentSlower}% slower)`);

    console.log('\n' + '='.repeat(80));
    console.log('UPDATE CODE WITH:');
    console.log('='.repeat(80));
    console.log(`\nconst PRIMARY_ENDPOINT = '${primary.endpoint}';`);
    console.log(`const PRIMARY_KEY = process.env.${primary.endpointName === 'chief-1020' ? 'AZURE_OPENAI_KEY_FALLBACK' : 'AZURE_OPENAI_KEY'};`);
    console.log(`const PRIMARY_MODEL = '${primary.name}';`);
    console.log('');
    console.log(`const FALLBACK_ENDPOINT = '${fallback.endpoint}';`);
    console.log(`const FALLBACK_KEY = process.env.${fallback.endpointName === 'chief-1020' ? 'AZURE_OPENAI_KEY_FALLBACK' : 'AZURE_OPENAI_KEY'};`);
    console.log(`const FALLBACK_MODEL = '${fallback.name}';`);

  } else {
    console.log('\n⚠️ Not enough models on both endpoints to create dual-endpoint configuration');

    if (chief1020.length > 0) {
      console.log(`\nOnly chief-1020 models available: ${chief1020.map(m => m.name).join(', ')}`);
    }
    if (cursorAgent.length > 0) {
      console.log(`\nOnly cursor-agent models available: ${cursorAgent.map(m => m.name).join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

runTests();
