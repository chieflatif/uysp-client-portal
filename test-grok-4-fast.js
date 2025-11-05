/**
 * Test Grok-4-Fast-Non-Reasoning Model
 *
 * Provider: xAI (different from Azure OpenAI)
 * Endpoint: chief-1020-resource.cognitiveservices.azure.com
 *
 * Benefits if it works:
 * - True provider diversity (xAI vs Azure)
 * - Different endpoint (chief-1020 vs cursor-agent)
 * - "Fast" in the name suggests speed optimization
 */

require('dotenv').config();

const ENDPOINT = 'https://chief-1020-resource.cognitiveservices.azure.com';
const API_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;
const MODEL = 'grok-4-fast-non-reasoning';

// Models to compare against
const MODELS_TO_TEST = [
  { name: 'grok-4-fast-non-reasoning (xAI)', model: 'grok-4-fast-non-reasoning', endpoint: ENDPOINT, key: API_KEY },
  { name: 'gpt-5-mini (Azure)', model: 'gpt-5-mini', endpoint: 'https://cursor-agent.services.ai.azure.com', key: process.env.AZURE_OPENAI_KEY },
  { name: 'gpt-5-nano (Azure)', model: 'gpt-5-nano', endpoint: ENDPOINT, key: API_KEY },
];

async function testModel(config) {
  const separator = '='.repeat(80);
  console.log(`\n${separator}`);
  console.log(`Testing: ${config.name}`);
  console.log(`Model: ${config.model}`);
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(separator);

  const startTime = Date.now();
  const url = `${config.endpoint}/openai/deployments/${config.model}/chat/completions?api-version=2024-08-01-preview`;

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
          { role: 'user', content: 'Say "Hello!" in exactly one word.' }
        ],
        max_completion_tokens: 10,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const elapsed = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const message = data.choices?.[0]?.message?.content || '';

      console.log(`✅ SUCCESS in ${elapsed}ms`);
      console.log(`   Response: "${message}"`);
      console.log(`   Model version: ${data.model || 'unknown'}`);
      console.log(`   Usage:`, JSON.stringify(data.usage || {}));

      return {
        ...config,
        elapsed,
        success: true,
        actualModel: data.model,
        response: message
      };
    } else {
      const error = await response.text();
      console.log(`❌ FAILED: ${response.status}`);

      try {
        const errorJson = JSON.parse(error);
        console.log(`   Error: ${errorJson.error?.code || errorJson.error?.message || 'Unknown'}`);
      } catch {
        console.log(`   Error: ${error.substring(0, 200)}`);
      }

      return { ...config, elapsed, success: false, error };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`❌ ERROR: ${error.message}`);
    return { ...config, elapsed, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('Grok-4-Fast Speed Test');
  console.log('========================================\n');

  console.log('Testing provider diversity strategy:');
  console.log('  Primary: Azure OpenAI (cursor-agent)');
  console.log('  Fallback: xAI Grok (chief-1020)\n');

  if (!API_KEY) {
    console.error('❌ AZURE_OPENAI_KEY_FALLBACK not set');
    process.exit(1);
  }

  if (!process.env.AZURE_OPENAI_KEY) {
    console.error('❌ AZURE_OPENAI_KEY not set');
    process.exit(1);
  }

  console.log('✅ API keys found\n');

  const results = [];

  for (const config of MODELS_TO_TEST) {
    const result = await testModel(config);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const separator = '='.repeat(80);
  console.log(`\n${separator}`);
  console.log('SUMMARY');
  console.log(separator);

  const working = results.filter(r => r.success).sort((a, b) => a.elapsed - b.elapsed);

  if (working.length === 0) {
    console.log('\n❌ No working models found');
    return;
  }

  console.log('\n✅ Working Models (sorted by speed):\n');
  working.forEach((model, index) => {
    const badge = index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉';
    console.log(`${badge} ${index + 1}. ${model.name}`);
    console.log(`   Speed: ${model.elapsed}ms`);
    console.log(`   Provider: ${model.name.includes('xAI') ? 'xAI (Grok)' : 'Azure OpenAI'}`);
    console.log(`   Endpoint: ${model.endpoint.includes('chief-1020') ? 'chief-1020' : 'cursor-agent'}`);
    console.log('');
  });

  // Check if Grok is available and fast
  const grokResult = working.find(r => r.model === 'grok-4-fast-non-reasoning');

  if (grokResult) {
    console.log(separator);
    console.log('🎯 GROK-4-FAST ANALYSIS');
    console.log(separator);

    const azureModels = working.filter(r => !r.model.includes('grok'));
    const grokRank = working.indexOf(grokResult) + 1;

    console.log(`\nPerformance Rank: #${grokRank} of ${working.length}`);
    console.log(`Speed: ${grokResult.elapsed}ms`);

    if (grokRank === 1) {
      console.log('\n✨ RECOMMENDATION: Use Grok-4-Fast as PRIMARY');
      console.log('   Reasons:');
      console.log('   ✅ Fastest model available');
      console.log('   ✅ Different provider (xAI vs Azure)');
      console.log('   ✅ Different endpoint (chief-1020)');
      console.log('   ✅ "Non-reasoning" = optimized for speed');

      if (azureModels.length > 0) {
        console.log(`\n   Suggested Fallback: ${azureModels[0].model} (${azureModels[0].elapsed}ms)`);
        console.log('   Benefits: Different provider ensures high availability');
      }
    } else {
      const fastest = working[0];
      const speedDiff = grokResult.elapsed - fastest.elapsed;
      const percentSlower = Math.round((speedDiff / fastest.elapsed) * 100);

      console.log(`\n   ${percentSlower}% slower than fastest (${fastest.model})`);

      if (percentSlower < 50) {
        console.log('\n✨ RECOMMENDATION: Use Grok-4-Fast as FALLBACK');
        console.log('   Reasons:');
        console.log('   ✅ Acceptable speed (<50% slower)');
        console.log('   ✅ Different provider = better redundancy');
        console.log('   ✅ Different endpoint');
      } else {
        console.log('\n⚠️ Grok-4-Fast may be too slow for primary use');
        console.log(`   Consider keeping Azure model as primary`);
      }
    }
  } else {
    console.log(separator);
    console.log('❌ GROK-4-FAST NOT AVAILABLE');
    console.log(separator);
    console.log('\nPossible reasons:');
    console.log('  - Model not deployed at chief-1020 endpoint');
    console.log('  - Deployment name is different');
    console.log('  - Model requires different API version');
  }

  console.log(`\n${separator}`);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
