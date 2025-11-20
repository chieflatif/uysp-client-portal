/**
 * Test Dual-Endpoint AI Message Generation
 *
 * Tests the new configuration:
 * - Primary: gpt-5-mini @ cursor-agent (460ms)
 * - Fallback: gpt-5-nano @ chief-1020 (1210ms, different endpoint)
 */

require('dotenv').config();

// Dual-endpoint configuration (same as route.ts)
const PRIMARY_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const PRIMARY_KEY = process.env.AZURE_OPENAI_KEY;
const PRIMARY_MODEL = 'gpt-5-mini';

const FALLBACK_ENDPOINT = 'https://chief-1020-resource.cognitiveservices.azure.com';
const FALLBACK_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;
const FALLBACK_MODEL = 'gpt-5-nano';

const testCampaign = {
  name: 'Pricing Guide Download Follow-Up',
  targetAudience: 'tech sales professionals who downloaded pricing guide',
  messageGoal: 'book_call',
  tone: 'friendly',
  includeLink: true,
  bookingLink: 'https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr',
};

function buildMessagePrompt(data) {
  const goalInstructions = {
    book_call: 'The primary goal is to get the lead to book a free strategy call.',
    provide_value: 'The primary goal is to provide value and position the sender as a trusted advisor.',
    nurture: 'The primary goal is to stay top-of-mind and build a relationship over time.',
    follow_up: 'The primary goal is to follow up on previous engagement and encourage next steps.',
  };

  const toneGuidelines = {
    professional: 'Use professional language, avoid slang, maintain formality.',
    friendly: 'Use warm, approachable language that feels personal but not overly casual.',
    casual: 'Use conversational language, contractions, and a relaxed tone.',
    urgent: 'Create a sense of urgency without being pushy or aggressive.',
  };

  return `You are an expert SMS copywriter for Ian Koniak's sales coaching business.

Write an SMS message for the following campaign:

Campaign Name: ${data.name}
Target Audience: ${data.targetAudience}
Message Goal: ${goalInstructions[data.messageGoal]}
Tone: ${toneGuidelines[data.tone]}

Requirements:
- Use {{first_name}} placeholder for personalization (REQUIRED)
- ${data.includeLink ? `Include this booking link: ${data.bookingLink}` : 'Do NOT include any links'}
- TARGET: 280-320 characters
- Sound conversational, NOT robotic

Write ONLY the SMS message text. Keep it between 280-320 characters.`;
}

async function callAzureOpenAI(prompt, model, endpoint, apiKey) {
  const requestId = `TEST-${Date.now()}`;
  const startTime = Date.now();

  console.log(`\n[${requestId}] 🚀 Starting request`);
  console.log(`[${requestId}] Model: ${model}`);
  console.log(`[${requestId}] Endpoint: ${endpoint}`);

  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=2024-08-01-preview`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an expert SMS copywriter.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 8000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      console.error(`[${requestId}] ❌ Failed: ${response.status}`);
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;

    if (!message) {
      throw new Error('No message in response');
    }

    console.log(`[${requestId}] ✅ Success in ${elapsed}ms`);
    return message.trim();

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Error after ${elapsed}ms:`, error.message);
    throw error;
  }
}

async function runTest() {
  console.log('========================================');
  console.log('Dual-Endpoint AI Message Test');
  console.log('========================================\n');

  // Validate keys
  if (!PRIMARY_KEY) {
    console.error('❌ AZURE_OPENAI_KEY not set');
    process.exit(1);
  }

  if (!FALLBACK_KEY) {
    console.error('❌ AZURE_OPENAI_KEY_FALLBACK not set');
    process.exit(1);
  }

  console.log('✅ Primary key found');
  console.log('✅ Fallback key found\n');

  console.log('Configuration:');
  console.log(`  Primary: ${PRIMARY_MODEL} @ ${PRIMARY_ENDPOINT}`);
  console.log(`  Fallback: ${FALLBACK_MODEL} @ ${FALLBACK_ENDPOINT}\n`);

  const separator = '='.repeat(80);
  console.log(separator);
  console.log('TEST: Pricing Guide Follow-Up');
  console.log(separator);

  const prompt = buildMessagePrompt(testCampaign);
  let message;
  let modelUsed;

  // Try primary
  console.log(`\n🤖 Attempting primary: ${PRIMARY_MODEL}...`);
  try {
    message = await callAzureOpenAI(prompt, PRIMARY_MODEL, PRIMARY_ENDPOINT, PRIMARY_KEY);
    modelUsed = PRIMARY_MODEL;
  } catch (primaryError) {
    console.warn(`⚠️ Primary failed: ${primaryError.message}`);
    console.log(`\n🔄 Trying fallback: ${FALLBACK_MODEL}...`);
    message = await callAzureOpenAI(prompt, FALLBACK_MODEL, FALLBACK_ENDPOINT, FALLBACK_KEY);
    modelUsed = FALLBACK_MODEL;
  }

  // Display results
  console.log(`\n${separator}`);
  console.log('✅ RESULT');
  console.log(separator);
  console.log(`Model Used: ${modelUsed}`);
  console.log(`Character Count: ${message.length}`);
  console.log(`SMS Segments: ${message.length > 160 ? Math.ceil(message.length / 153) : 1}\n`);
  console.log('Generated Message:');
  console.log('-'.repeat(80));
  console.log(message);
  console.log('-'.repeat(80));

  // Validation
  const issues = [];
  if (!message.includes('{{first_name}}')) {
    issues.push('⚠️ Missing {{first_name}} placeholder');
  }
  if (!message.includes('http')) {
    issues.push('⚠️ Missing booking link');
  }
  if (message.length > 350) {
    issues.push('❌ Exceeds 350 character limit');
  }

  if (issues.length > 0) {
    console.log('\n⚠️ Issues:');
    issues.forEach(issue => console.log(`  ${issue}`));
  } else {
    console.log('\n✅ All validations passed');
  }

  console.log(`\n${separator}`);
}

runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
