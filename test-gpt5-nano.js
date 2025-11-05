/**
 * Quick test for gpt-5-nano and other fast models
 */

require('dotenv').config();

const AZURE_OPENAI_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;

// Models to test in order of expected speed
const MODELS_TO_TEST = [
  'gpt-5-nano',      // Fastest (if available)
  'gpt-4.1-mini',    // Current primary
  'gpt-5-mini',      // Current fallback
  'gpt-4o-mini',     // Common fast model
];

async function testModel(model) {
  const separator = '='.repeat(80);
  console.log(`\n${separator}`);
  console.log(`Testing: ${model}`);
  console.log(separator);

  const startTime = Date.now();
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${model}/chat/completions?api-version=2024-08-01-preview`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
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
      console.log(`   Model version: ${data.model}`);
      return { model, elapsed, success: true, actualModel: data.model };
    } else {
      const error = await response.text();
      console.log(`❌ FAILED: ${response.status}`);
      const errorJson = JSON.parse(error);
      console.log(`   Error: ${errorJson.error?.code || 'Unknown'}`);
      return { model, elapsed, success: false, error: errorJson.error?.code };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`❌ ERROR: ${error.message}`);
    return { model, elapsed, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('Testing available fast models...\n');

  const results = [];

  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }

  const separator = '='.repeat(80);
  console.log(`\n${separator}`);
  console.log('SUMMARY');
  console.log(separator);

  const working = results.filter(r => r.success).sort((a, b) => a.elapsed - b.elapsed);

  if (working.length >= 2) {
    console.log('\n🏆 RECOMMENDED CONFIGURATION:\n');
    console.log(`Primary Model:  ${working[0].model} (${working[0].elapsed}ms)`);
    console.log(`Fallback Model: ${working[1].model} (${working[1].elapsed}ms)`);
    console.log(`\nUpdate in route.ts:`);
    console.log(`const PRIMARY_MODEL = '${working[0].model}';`);
    console.log(`const FALLBACK_MODEL = '${working[1].model}';`);
  } else if (working.length === 1) {
    console.log(`\n⚠️ Only one model available: ${working[0].model}`);
  } else {
    console.log('\n❌ No working models found');
  }

  console.log(`\n${separator}`);
}

runTests();
