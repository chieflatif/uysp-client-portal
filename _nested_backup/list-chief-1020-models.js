/**
 * List all deployed models on chief-1020 endpoint
 */

require('dotenv').config();

const ENDPOINT = 'https://chief-1020-resource.cognitiveservices.azure.com';
const API_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;

async function listDeployments() {
  console.log('========================================');
  console.log('Chief-1020 Model Discovery');
  console.log('========================================\n');

  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`API Key: ${API_KEY ? '✅ Found' : '❌ Not found'}\n`);

  if (!API_KEY) {
    console.error('❌ AZURE_OPENAI_KEY_FALLBACK not set');
    process.exit(1);
  }

  // Try different API versions
  const apiVersions = [
    '2024-08-01-preview',
    '2024-10-21',
    '2024-06-01',
    '2023-12-01-preview',
  ];

  for (const apiVersion of apiVersions) {
    console.log(`\nTrying API version: ${apiVersion}`);
    console.log('-'.repeat(80));

    const url = `${ENDPOINT}/openai/deployments?api-version=${apiVersion}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'api-key': API_KEY,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          console.log(`✅ Found ${data.data.length} deployments:\n`);

          data.data.forEach((deployment, index) => {
            console.log(`${index + 1}. Deployment Name: "${deployment.id}"`);
            console.log(`   Model: ${deployment.model || 'unknown'}`);
            console.log(`   Status: ${deployment.status || 'unknown'}`);
            if (deployment.created_at) {
              console.log(`   Created: ${new Date(deployment.created_at * 1000).toLocaleString()}`);
            }
            console.log('');
          });

          return data.data;
        } else {
          console.log('⚠️ API returned successfully but no deployments found');
        }
      } else {
        const error = await response.text();
        console.log(`❌ Failed: ${response.status}`);
        try {
          const errorJson = JSON.parse(error);
          console.log(`   Error: ${errorJson.error?.message || errorJson.error?.code || 'Unknown'}`);
        } catch {
          console.log(`   Error: ${error.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('❌ Could not list deployments with any API version');
  console.log('='.repeat(80));
  console.log('\nThis endpoint may not support listing deployments.');
  console.log('Try checking your Azure dashboard directly:\n');
  console.log('https://portal.azure.com → Azure OpenAI → Deployments\n');
}

listDeployments();
