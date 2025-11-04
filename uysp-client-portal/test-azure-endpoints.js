/**
 * Azure AI Foundry Endpoint Discovery & Test Tool
 *
 * Tests different endpoint/model combinations to find what works
 *
 * Usage:
 *   node test-azure-endpoints.js
 *
 * Set these in .env:
 *   AZURE_OPENAI_KEY=your-key-here
 *   AZURE_OPENAI_ENDPOINT=https://your-endpoint.services.ai.azure.com (optional - we'll test multiple)
 */

require('dotenv').config();

const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;

// Common Azure AI endpoints (we'll test all of them)
const ENDPOINTS_TO_TEST = [
  process.env.AZURE_OPENAI_ENDPOINT, // Your configured endpoint
  'https://cursor-agent.services.ai.azure.com', // Current hardcoded value
  // Add more if you have them - the script will test all
];

// Common model deployment names (Azure uses deployment names, not model names)
const MODELS_TO_TEST = [
  'gpt-4.1-mini',      // Current primary
  'gpt-5-mini',        // Current fallback
  'gpt-4o-mini',       // Common Azure name
  'gpt-4o',            // Common Azure name
  'gpt-4-turbo',       // Common Azure name
  'gpt-4',             // Common Azure name
  'gpt-35-turbo',      // Common Azure name
  'o1-preview',        // Latest reasoning model
  'o1-mini',           // Latest mini reasoning model
];

// API versions to try
const API_VERSIONS = [
  '2024-08-01-preview', // Current
  '2024-10-21',         // Latest stable
  '2024-06-01',         // Previous stable
];

/**
 * Test if an endpoint/model combination works
 */
async function testEndpointModel(endpoint, model, apiVersion) {
  const requestId = `TEST-${Date.now()}`;
  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${requestId}] Testing: ${endpoint}`);
  console.log(`[${requestId}] Model: ${model}`);
  console.log(`[${requestId}] API Version: ${apiVersion}`);
  console.log('='.repeat(80));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for testing

  try {
    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: 'Say "Hello!" in exactly one word.',
          },
        ],
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    console.log(`[${requestId}] Response: ${response.status} ${response.statusText} (${elapsed}ms)`);

    if (response.ok) {
      const data = await response.json();
      const message = data.choices?.[0]?.message?.content;

      console.log(`[${requestId}] ✅ SUCCESS!`);
      console.log(`[${requestId}] Response: "${message}"`);
      console.log(`[${requestId}] Model: ${data.model || 'unknown'}`);
      console.log(`[${requestId}] Usage:`, JSON.stringify(data.usage || {}));

      return {
        success: true,
        endpoint,
        model,
        apiVersion,
        responseTime: elapsed,
        actualModel: data.model,
      };
    } else {
      const errorText = await response.text();
      console.log(`[${requestId}] ❌ FAILED: ${response.status}`);

      // Parse error for common issues
      try {
        const errorJson = JSON.parse(errorText);
        const errorCode = errorJson.error?.code;
        const errorMessage = errorJson.error?.message;

        console.log(`[${requestId}] Error Code: ${errorCode}`);
        console.log(`[${requestId}] Error Message: ${errorMessage}`);

        // Provide helpful hints
        if (response.status === 401) {
          console.log(`[${requestId}] 💡 Hint: API key is invalid or expired`);
        } else if (response.status === 404) {
          console.log(`[${requestId}] 💡 Hint: Model deployment "${model}" doesn't exist at this endpoint`);
        } else if (response.status === 429) {
          console.log(`[${requestId}] 💡 Hint: Rate limit exceeded or quota exhausted`);
        } else if (errorCode === 'DeploymentNotFound') {
          console.log(`[${requestId}] 💡 Hint: This deployment name doesn't exist - try listing deployments`);
        }
      } catch {
        console.log(`[${requestId}] Raw error: ${errorText.substring(0, 200)}`);
      }

      return {
        success: false,
        endpoint,
        model,
        apiVersion,
        status: response.status,
        error: errorText.substring(0, 200),
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.log(`[${requestId}] ❌ TIMEOUT: Request took longer than 10 seconds`);
      return {
        success: false,
        endpoint,
        model,
        apiVersion,
        error: 'Timeout',
      };
    }

    console.log(`[${requestId}] ❌ ERROR: ${error.message}`);
    return {
      success: false,
      endpoint,
      model,
      apiVersion,
      error: error.message,
    };
  }
}

/**
 * Try to list available deployments (may not work on all endpoints)
 */
async function listDeployments(endpoint, apiVersion) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Attempting to list deployments at: ${endpoint}`);
  console.log('='.repeat(80));

  const url = `${endpoint}/openai/deployments?api-version=${apiVersion}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': AZURE_OPENAI_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.data?.length || 0} deployments:`);

      if (data.data && data.data.length > 0) {
        data.data.forEach((deployment, index) => {
          console.log(`\n  ${index + 1}. Deployment Name: "${deployment.id}"`);
          console.log(`     Model: ${deployment.model}`);
          console.log(`     Status: ${deployment.status}`);
          console.log(`     Created: ${deployment.created_at ? new Date(deployment.created_at * 1000).toLocaleString() : 'unknown'}`);
        });

        return data.data.map(d => d.id);
      } else {
        console.log('  No deployments found');
        return [];
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed to list deployments: ${response.status}`);
      console.log(`   This endpoint may not support listing deployments`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error listing deployments: ${error.message}`);
    return null;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('========================================');
  console.log('Azure AI Foundry Endpoint Discovery Tool');
  console.log('========================================\n');

  // Validate API key
  if (!AZURE_OPENAI_KEY) {
    console.error('❌ ERROR: AZURE_OPENAI_KEY environment variable is not set');
    console.error('Please set it in your .env file');
    process.exit(1);
  }

  console.log(`✅ API Key found (length: ${AZURE_OPENAI_KEY.length})`);
  console.log(`   First 8 chars: ${AZURE_OPENAI_KEY.substring(0, 8)}...`);
  console.log(`   Last 4 chars: ...${AZURE_OPENAI_KEY.slice(-4)}\n`);

  const results = [];
  const workingConfigs = [];

  // Filter out null/undefined endpoints
  const endpoints = ENDPOINTS_TO_TEST.filter(e => e);

  if (endpoints.length === 0) {
    console.error('❌ No endpoints to test. Please set AZURE_OPENAI_ENDPOINT in .env');
    process.exit(1);
  }

  console.log(`Testing ${endpoints.length} endpoint(s)...\n`);

  // First, try to list deployments at each endpoint
  for (const endpoint of endpoints) {
    const deployments = await listDeployments(endpoint, API_VERSIONS[0]);

    if (deployments && deployments.length > 0) {
      console.log(`\n🎯 Testing discovered deployments at ${endpoint}...`);

      // Test each discovered deployment
      for (const deploymentName of deployments) {
        const result = await testEndpointModel(endpoint, deploymentName, API_VERSIONS[0]);
        results.push(result);

        if (result.success) {
          workingConfigs.push(result);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // Then test common model names at each endpoint
  console.log(`\n🔍 Testing ${MODELS_TO_TEST.length} common model names...`);

  for (const endpoint of endpoints) {
    for (const model of MODELS_TO_TEST) {
      // Use the latest API version for common models
      const result = await testEndpointModel(endpoint, model, API_VERSIONS[0]);
      results.push(result);

      if (result.success) {
        workingConfigs.push(result);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\nTotal tests: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (workingConfigs.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('✅ WORKING CONFIGURATIONS');
    console.log('='.repeat(80));

    workingConfigs.forEach((config, index) => {
      console.log(`\n${index + 1}. Model: ${config.model}`);
      console.log(`   Endpoint: ${config.endpoint}`);
      console.log(`   API Version: ${config.apiVersion}`);
      console.log(`   Response Time: ${config.responseTime}ms`);
      console.log(`   Actual Model: ${config.actualModel || 'unknown'}`);
    });

    // Pick the fastest one
    const fastest = workingConfigs.sort((a, b) => a.responseTime - b.responseTime)[0];

    console.log('\n' + '='.repeat(80));
    console.log('🏆 RECOMMENDED CONFIGURATION (fastest response)');
    console.log('='.repeat(80));
    console.log(`\nUpdate your code with these values:\n`);
    console.log(`const AZURE_OPENAI_ENDPOINT = '${fastest.endpoint}';`);
    console.log(`const PRIMARY_MODEL = '${fastest.model}';`);
    console.log(`const API_VERSION = '${fastest.apiVersion}';`);

    console.log(`\n.env file:`);
    console.log(`AZURE_OPENAI_ENDPOINT=${fastest.endpoint}`);
    console.log(`AZURE_OPENAI_KEY=${AZURE_OPENAI_KEY.substring(0, 8)}...${AZURE_OPENAI_KEY.slice(-4)}`);

    // Show all working models for fallback
    if (workingConfigs.length > 1) {
      console.log(`\n📝 Other working models (for fallback):`);
      workingConfigs.slice(1, 3).forEach((config, index) => {
        console.log(`   ${index + 2}. ${config.model} (${config.responseTime}ms)`);
      });
    }
  } else {
    console.log('\n❌ NO WORKING CONFIGURATIONS FOUND');
    console.log('\nCommon issues:');
    console.log('1. API key is invalid or expired');
    console.log('2. Model deployments don\'t exist at this endpoint');
    console.log('3. Endpoint URL is incorrect');
    console.log('\nNext steps:');
    console.log('1. Check your Azure AI Foundry dashboard: https://ai.azure.com');
    console.log('2. Verify your API key in the "Keys and Endpoint" section');
    console.log('3. Check "Deployments" to see which models are actually deployed');
    console.log('4. Copy the exact deployment name (case-sensitive!)');
  }

  console.log('\n' + '='.repeat(80));
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
