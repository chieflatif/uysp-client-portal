/**
 * Test both Azure endpoints and find optimal primary/fallback
 */

require('dotenv').config();

// Endpoint 1: Original (cursor-agent)
const ENDPOINT_1 = 'https://cursor-agent.services.ai.azure.com';
const KEY_1 = process.env.AZURE_OPENAI_KEY;

// Endpoint 2: New (gpt-5-nano)
const ENDPOINT_2 = 'https://chief-1020-resource.cognitiveservices.azure.com';
const KEY_2 = process.env.AZURE_OPENAI_KEY_FALLBACK;

const MODELS_TO_TEST = [
  { endpoint: ENDPOINT_2, key: KEY_2, model: 'gpt-5-nano', name: 'gpt-5-nano (new endpoint)' },
  { endpoint: ENDPOINT_1, key: KEY_1, model: 'gpt-4.1-mini', name: 'gpt-4.1-mini (original)' },
  { endpoint: ENDPOINT_1, key: KEY_1, model: 'gpt-5-mini', name: 'gpt-5-mini (original)' },
];

async function testConfig(config) {
  const separator = '='.repeat(80);
  console.log(`\n${separator}`);
  console.log(`Testing: ${config.name}`);
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Model: ${config.model}`);
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
      console.log(`✅ SUCCESS in ${elapsed}ms`);
      console.log(`   Response: "${data.choices[0].message.content}"`);
      console.log(`   Model version: ${data.model || 'unknown'}`);
      return { ...config, elapsed, success: true, actualModel: data.model };
    } else {
      const error = await response.text();
      console.log(`❌ FAILED: ${response.status}`);
      try {
        const errorJson = JSON.parse(error);
        console.log(`   Error: ${errorJson.error?.code || errorJson.error?.message || 'Unknown'}`);
      } catch {
        console.log(`   Error: ${error.substring(0, 200)}`);
      }
      return { ...config, elapsed, success: false };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`❌ ERROR: ${error.message}`);
    return { ...config, elapsed, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('Testing dual-endpoint configuration...\n');
  console.log('Strategy: Primary on one endpoint, fallback on another = better redundancy\n');

  const results = [];

  for (const config of MODELS_TO_TEST) {
    const result = await testConfig(config);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const separator = '='.repeat(80);
  console.log(`\n${separator}`);
  console.log('SUMMARY');
  console.log(separator);

  const working = results.filter(r => r.success).sort((a, b) => a.elapsed - b.elapsed);

  if (working.length >= 2) {
    console.log('\n🏆 RECOMMENDED DUAL-ENDPOINT CONFIGURATION:\n');
    console.log(`Primary Model:  ${working[0].model} (${working[0].elapsed}ms)`);
    console.log(`Primary Endpoint: ${working[0].endpoint}`);
    console.log(`Primary Key: ${working[0].key.substring(0, 8)}...${working[0].key.slice(-4)}\n`);

    console.log(`Fallback Model:  ${working[1].model} (${working[1].elapsed}ms)`);
    console.log(`Fallback Endpoint: ${working[1].endpoint}`);
    console.log(`Fallback Key: ${working[1].key.substring(0, 8)}...${working[1].key.slice(-4)}\n`);

    console.log('Benefits of dual-endpoint:');
    console.log('  ✅ If one Azure service goes down, fallback still works');
    console.log('  ✅ Better geographic redundancy');
    console.log('  ✅ Separate rate limits per endpoint\n');

    console.log('Update in route.ts:');
    console.log(`const PRIMARY_ENDPOINT = '${working[0].endpoint}';`);
    console.log(`const PRIMARY_KEY = process.env.AZURE_OPENAI_KEY_PRIMARY;`);
    console.log(`const PRIMARY_MODEL = '${working[0].model}';`);
    console.log(``);
    console.log(`const FALLBACK_ENDPOINT = '${working[1].endpoint}';`);
    console.log(`const FALLBACK_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;`);
    console.log(`const FALLBACK_MODEL = '${working[1].model}';`);
  } else if (working.length === 1) {
    console.log(`\n⚠️ Only one model available: ${working[0].model}`);
  } else {
    console.log('\n❌ No working models found');
  }

  console.log(`\n${separator}`);
}

runTests();
