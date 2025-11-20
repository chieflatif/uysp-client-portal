#!/usr/bin/env node

/**
 * Azure OpenAI API Test Script
 *
 * Tests the Azure OpenAI integration for SMS message generation
 * Run: node test-azure-openai.js
 */

require('dotenv').config({ path: '.env.local' });

const AZURE_OPENAI_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const PRIMARY_MODEL = 'gpt-5';
const FALLBACK_MODEL = 'gpt-5-mini';

// Test with fallback model first to isolate GPT-5 reasoning token issue
const TEST_MODEL = process.argv[2] || FALLBACK_MODEL;

console.log('🧪 Azure OpenAI API Test\n');
console.log('Configuration:');
console.log(`  Endpoint: ${AZURE_OPENAI_ENDPOINT}`);
console.log(`  API Key: ${AZURE_OPENAI_KEY ? '✅ Set (' + AZURE_OPENAI_KEY.substring(0, 10) + '...)' : '❌ NOT SET'}`);
console.log(`  Testing Model: ${TEST_MODEL}`);
console.log(`  Primary Model: ${PRIMARY_MODEL}`);
console.log(`  Fallback Model: ${FALLBACK_MODEL}\n`);

if (!AZURE_OPENAI_KEY) {
  console.error('❌ AZURE_OPENAI_KEY is not set in .env.local');
  process.exit(1);
}

async function testAzureOpenAI() {
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${TEST_MODEL}/chat/completions?api-version=2024-08-01-preview`;

  console.log(`📡 Testing connection to ${TEST_MODEL}...`);

  const testPrompt = `Write a short SMS message (under 160 characters) for a sales coaching campaign.
Target audience: Tech sales professionals
Goal: Book a strategy call
Tone: Friendly and professional
Include: {{first_name}} placeholder and Calendly link: https://calendly.com/example

Write ONLY the SMS message text.`;

  try {
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
            content: 'You are an expert SMS copywriter. Write concise, compelling messages.',
          },
          {
            role: 'user',
            content: testPrompt,
          },
        ],
        max_completion_tokens: TEST_MODEL === 'gpt-5' ? 8000 : 2000, // GPT-5 uses more tokens for reasoning + output
        // GPT-5 only supports default values for temperature, top_p, frequency_penalty, presence_penalty
      }),
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Error Response:');
      console.error(errorText);

      if (response.status === 401) {
        console.error('\n💡 Tip: API key may be invalid or expired');
      } else if (response.status === 404) {
        console.error('\n💡 Tip: Model deployment "gpt-5" may not exist. Check your Azure deployment names.');
      }

      process.exit(1);
    }

    const data = await response.json();
    const generatedMessage = data.choices?.[0]?.message?.content;

    if (!generatedMessage) {
      console.error('\n❌ No message generated');
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n✅ API Test Successful!\n');
    console.log('📝 Generated Message:');
    console.log('─'.repeat(60));
    console.log(generatedMessage);
    console.log('─'.repeat(60));
    console.log(`\n📊 Stats:`);
    console.log(`  Length: ${generatedMessage.length} characters`);
    console.log(`  Model: ${data.model || TEST_MODEL}`);
    console.log(`  Prompt Tokens: ${data.usage?.prompt_tokens || 'N/A'}`);
    console.log(`  Completion Tokens: ${data.usage?.completion_tokens || 'N/A'}`);
    if (data.usage?.completion_tokens_details?.reasoning_tokens) {
      console.log(`  Reasoning Tokens: ${data.usage.completion_tokens_details.reasoning_tokens}`);
    }
    console.log(`  Total Tokens: ${data.usage?.total_tokens || 'N/A'}`);

    console.log('\n✅ Azure OpenAI integration is working correctly!');
    console.log('\n💡 To test GPT-5: node test-azure-openai.js gpt-5');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

// Run test
testAzureOpenAI().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
