/**
 * Local Test Script for AI Message Generation
 *
 * Tests Azure OpenAI directly without going through the API endpoint
 *
 * Usage:
 *   node test-ai-message-local.js
 *
 * Requirements:
 *   - AZURE_OPENAI_KEY environment variable must be set
 */

require('dotenv').config();

const AZURE_OPENAI_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const PRIMARY_MODEL = 'gpt-4.1-mini';
const FALLBACK_MODEL = 'gpt-5-mini';

// Test data
const testCampaigns = [
  {
    name: 'Pricing Guide Download Follow-Up',
    targetAudience: 'tech sales professionals who downloaded pricing guide',
    messageGoal: 'book_call',
    tone: 'friendly',
    includeLink: true,
    bookingLink: 'https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr',
  },
  {
    name: 'Webinar Attendee Nurture',
    targetAudience: 'sales reps who attended our webinar on pipeline management',
    messageGoal: 'nurture',
    tone: 'professional',
    includeLink: false,
  },
];

/**
 * Build the AI prompt (same as production)
 */
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

  return `You are an expert SMS copywriter for Ian Koniak's sales coaching business "Untap Your Sales Potential" (UYSP).

Write an SMS message for the following campaign:

Campaign Name: ${data.campaignName}
Target Audience: ${data.targetAudience}
Message Goal: ${goalInstructions[data.messageGoal]}
Tone: ${toneGuidelines[data.tone]}
${data.customInstructions ? `Additional Instructions: ${data.customInstructions}` : ''}

CRITICAL SMS LENGTH RULES:
- TARGET: 280-320 characters (2 SMS segments) - THIS IS YOUR IDEAL RANGE
- HARD MAXIMUM: 350 characters (never exceed)
- Single SMS: 160 characters | Multi-part SMS: 153 characters per segment
- If it wouldn't fit on a phone screen in 2-3 bubbles, it's too long

PROVEN MESSAGE STRUCTURE (Follow this pattern):
1. Greeting: "Hi {{first_name}}, " (15-20 chars)
2. Identity: "Ian's assistant here" or "Ian Koniak's assistant here" (20-50 chars)
3. Acknowledgment: "Saw you grabbed our '[Resource Name]' guide" (40-80 chars)
4. CTA: "Want help implementing?" or "Interested in coaching?" (20-40 chars)
5. Link: "Book a call: [URL]" (80-90 chars)

ULTRA-SHORT TEMPLATE (240-280 chars - USE THIS):
"Hi {{first_name}}, Ian's assistant here. Saw you grabbed our "[Resource Name]" guide. Want help implementing? Book a call: ${data.bookingLink || 'https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr'}"

CHARACTER-SAVING SUBSTITUTIONS (Use these):
- "this is Ian Koniak's assistant" → "Ian's assistant here" (-10 chars)
- "If you want help implementing or are interested in exploring..." → "Want help implementing?" (-120 chars)
- "book a free strategy call with our team here:" → "Book a call:" (-30 chars)
- "Noticed you downloaded" → "Saw you grabbed" (-5 chars)
- "resource" → "guide" (-3 chars)

ACTION VERBS BY CONTENT TYPE:
- Guide/Download: "grabbed" or "downloaded"
- Video: "watched"
- Training/Webinar: "joined" or "attended"

Requirements:
- Use {{first_name}} placeholder for personalization (REQUIRED)
- ${data.includeLink ? `Include this booking link: ${data.bookingLink || 'https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr'}` : 'Do NOT include any links'}
- COUNT YOUR CHARACTERS - target 280-320, never exceed 350
- Remove ALL filler words - every word must serve a purpose
- Sound conversational (like a real assistant), NOT robotic
- Reference specific resource by exact name if known
- Use "if you want" language (permission-based, not pushy)

Brand Voice Guidelines:
- Ian Koniak is a former #1 sales rep and now helps tech sellers reach their potential
- UYSP focuses on coaching, not courses - personalized 1-on-1 support
- Speak to the challenges of ambitious sales professionals
- Be supportive and empowering, not condescending
- NEVER use spam trigger words: free, guaranteed, act now, limited time, buy now

WHAT NOT TO DO:
❌ Don't exceed 350 characters
❌ Don't use long-winded phrases like "If you want help implementing or are interested in exploring what it could be like to have a sales coach tackle your biggest challenges with you"
❌ Don't be pushy or create false urgency
❌ Don't forget {{first_name}} placeholder

Write ONLY the SMS message text, no explanations or meta-commentary. Keep it between 280-320 characters.`;
}

/**
 * Call Azure OpenAI API
 */
async function callAzureOpenAI(prompt, model) {
  const requestId = `TEST-${Date.now()}`;
  const startTime = Date.now();

  console.log(`\n[${requestId}] 🚀 Starting Azure OpenAI request`);
  console.log(`[${requestId}] Model: ${model}`);
  console.log(`[${requestId}] Endpoint: ${AZURE_OPENAI_ENDPOINT}`);
  console.log(`[${requestId}] API Key present: ${!!AZURE_OPENAI_KEY}`);
  console.log(`[${requestId}] API Key length: ${AZURE_OPENAI_KEY?.length || 0}`);

  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${model}/chat/completions?api-version=2024-08-01-preview`;

  const maxTokens = model === PRIMARY_MODEL ? 8000 : 2000;
  console.log(`[${requestId}] Max tokens: ${maxTokens}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[${requestId}] ⏱️ TIMEOUT: Request exceeded 30 seconds`);
    controller.abort();
  }, 30000);

  try {
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: 'You are an expert SMS copywriter. Write concise, compelling messages that drive action.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: maxTokens,
    };

    console.log(`[${requestId}] 📤 Sending request...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] 📥 Received response in ${elapsed}ms`);
    console.log(`[${requestId}] Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] ❌ API Error Response:`, errorText);
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;

    if (!message) {
      console.error(`[${requestId}] ❌ No message in response`);
      console.error(`[${requestId}] Full response:`, JSON.stringify(data, null, 2));
      throw new Error('No message generated by AI');
    }

    console.log(`[${requestId}] ✅ Success! Generated ${message.length} chars in ${elapsed}ms`);
    return message.trim();

  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] ❌ ERROR after ${elapsed}ms:`);
    console.error(`[${requestId}] Error name:`, error.name);
    console.error(`[${requestId}] Error message:`, error.message);
    throw error;
  }
}

/**
 * Run tests
 */
async function runTests() {
  console.log('========================================');
  console.log('AI Message Generation - Local Test');
  console.log('========================================\n');

  // Validate API key
  if (!AZURE_OPENAI_KEY) {
    console.error('❌ ERROR: AZURE_OPENAI_KEY environment variable is not set');
    console.error('Please set it in your .env file or environment');
    process.exit(1);
  }

  console.log('✅ API Key found\n');

  // Test each campaign
  for (const [index, campaign] of testCampaigns.entries()) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST ${index + 1}: ${campaign.name}`);
    console.log('='.repeat(80));
    console.log('Target:', campaign.targetAudience);
    console.log('Goal:', campaign.messageGoal);
    console.log('Tone:', campaign.tone);
    console.log('Include Link:', campaign.includeLink);

    try {
      const prompt = buildMessagePrompt(campaign);
      let message;
      let modelUsed;

      // Try primary model
      console.log(`\n🤖 Attempting with ${PRIMARY_MODEL}...`);
      try {
        message = await callAzureOpenAI(prompt, PRIMARY_MODEL);
        modelUsed = PRIMARY_MODEL;
      } catch (primaryError) {
        console.warn(`⚠️ Primary model failed: ${primaryError.message}`);
        console.log(`\n🔄 Trying fallback model ${FALLBACK_MODEL}...`);
        message = await callAzureOpenAI(prompt, FALLBACK_MODEL);
        modelUsed = FALLBACK_MODEL;
      }

      // Display results
      console.log('\n' + '='.repeat(80));
      console.log('✅ RESULT:');
      console.log('='.repeat(80));
      console.log(`Model Used: ${modelUsed}`);
      console.log(`Character Count: ${message.length}`);
      console.log(`SMS Segments: ${message.length > 160 ? Math.ceil(message.length / 153) : 1}`);
      console.log('\nGenerated Message:');
      console.log('-'.repeat(80));
      console.log(message);
      console.log('-'.repeat(80));

      // Check for issues
      const issues = [];
      if (!message.includes('{{first_name}}')) {
        issues.push('⚠️ Missing {{first_name}} placeholder');
      }
      if (campaign.includeLink && !message.includes('http')) {
        issues.push('⚠️ Missing booking link');
      }
      if (message.length > 350) {
        issues.push('❌ Exceeds 350 character limit');
      }

      if (issues.length > 0) {
        console.log('\n⚠️ Issues Found:');
        issues.forEach(issue => console.log(`  ${issue}`));
      } else {
        console.log('\n✅ No issues found');
      }

    } catch (error) {
      console.error(`\n❌ TEST FAILED: ${error.message}`);
      console.error('Full error:', error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Tests Complete');
  console.log('='.repeat(80));
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
