/**
 * Test GPT-4o (2024-11-20) - Latest GPT-4o version
 */

require('dotenv').config();

const MODELS_TO_TEST = [
  // GPT-4o variations
  { name: 'gpt-4o-2024-11-20', endpoint: 'https://cursor-agent.services.ai.azure.com', key: process.env.AZURE_OPENAI_KEY },
  { name: 'gpt-4o', endpoint: 'https://cursor-agent.services.ai.azure.com', key: process.env.AZURE_OPENAI_KEY },
  { name: 'gpt-4o-2024-11-20', endpoint: 'https://chief-1020-resource.cognitiveservices.azure.com', key: process.env.AZURE_OPENAI_KEY_FALLBACK },
  { name: 'gpt-4o', endpoint: 'https://chief-1020-resource.cognitiveservices.azure.com', key: process.env.AZURE_OPENAI_KEY_FALLBACK },

  // Current models for comparison
  { name: 'gpt-5-mini', endpoint: 'https://cursor-agent.services.ai.azure.com', key: process.env.AZURE_OPENAI_KEY },
  { name: 'gpt-5-nano', endpoint: 'https://chief-1020-resource.cognitiveservices.azure.com', key: process.env.AZURE_OPENAI_KEY_FALLBACK },
];

async function testModel(config) {
  console.log(`\nTesting: ${config.name} @ ${config.endpoint.includes('chief') ? 'chief-1020' : 'cursor-agent'}`);

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
      return { ...config, elapsed, success: true, actualModel: data.model };
    } else {
      const status = response.status;
      if (status === 404) {
        console.log(`  ❌ Not deployed`);
      } else if (status === 503) {
        console.log(`  ⚠️ Not ready (503)`);
      } else {
        console.log(`  ❌ Error: ${status}`);
      }
      return { ...config, success: false, status };
    }
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`  ⏱️ Timeout`);
    } else {
      console.log(`  ❌ ${error.message}`);
    }
    return { ...config, success: false };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('GPT-4o Speed Test');
  console.log('========================================');

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
    const badge = index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉';
    const endpoint = model.endpoint.includes('chief') ? 'chief-1020' : 'cursor-agent';
    console.log(`\n${badge} ${model.name} @ ${endpoint}`);
    console.log(`   Speed: ${model.elapsed}ms`);
    console.log(`   Model: ${model.actualModel}`);
  });

  // Check if GPT-4o is fastest
  const gpt4o = working.find(r => r.name.includes('gpt-4o'));

  if (gpt4o && working.indexOf(gpt4o) === 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 RECOMMENDATION: Switch to GPT-4o as PRIMARY');
    console.log('='.repeat(80));
    console.log(`\nGPT-4o is fastest at ${gpt4o.elapsed}ms`);
    console.log('\nUpdate route.ts:');
    console.log(`const PRIMARY_MODEL = '${gpt4o.name}';`);
    console.log(`const PRIMARY_ENDPOINT = '${gpt4o.endpoint}';`);
  }

  console.log('\n' + '='.repeat(80));
}

runTests();
