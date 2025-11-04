import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit';
import { z } from 'zod';

/**
 * POST /api/admin/campaigns/generate-message
 *
 * Generate SMS message using Azure OpenAI (GPT-5)
 * Hybrid approach: AI generates, human edits
 *
 * Body: GenerateMessageInput (see schema below)
 *
 * Returns:
 * - Generated message text
 * - Character count
 * - Suggestions for improvement
 */

const generateMessageSchema = z.object({
  campaignName: z.string().min(1),
  targetAudience: z.string().min(1), // e.g., "tech sales professionals who downloaded pricing guide"
  messageGoal: z.enum(['book_call', 'provide_value', 'nurture', 'follow_up']),
  tone: z.enum(['professional', 'friendly', 'casual', 'urgent']).default('friendly'),
  includeLink: z.boolean().default(true),
  bookingLink: z.string().url().optional(), // Campaign-specific booking link (defaults to UYSP link)
  customInstructions: z.string().optional(),
});

type GenerateMessageInput = z.infer<typeof generateMessageSchema>;

// Azure OpenAI configuration - DUAL ENDPOINT for redundancy
// Primary: GPT-4o on chief-1020 endpoint (355ms average - 43% faster than gpt-5-mini)
const PRIMARY_ENDPOINT = 'https://chief-1020-resource.cognitiveservices.azure.com';
const PRIMARY_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;
const PRIMARY_MODEL = 'gpt-4o';

// Fallback: gpt-5-mini on cursor-agent endpoint (621ms average - different geographic endpoint for redundancy)
const FALLBACK_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const FALLBACK_KEY = process.env.AZURE_OPENAI_KEY;
const FALLBACK_MODEL = 'gpt-5-mini';

// SECURITY: Validate API keys are set at module load time
if (!PRIMARY_KEY) {
  console.error('❌ CRITICAL: AZURE_OPENAI_KEY_FALLBACK environment variable is not set (primary endpoint)');
  // Note: This will be caught by the handler and return 500 to the client
}
if (!FALLBACK_KEY) {
  console.warn('⚠️ WARNING: AZURE_OPENAI_KEY not set - fallback endpoint will not work');
}

// RATE LIMITING: Database-based rate limiting (works across serverless instances)
// Fixed BUG #11: Previous in-memory implementation didn't work in serverless
// Now uses PostgreSQL for distributed rate limiting across all Vercel lambdas

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Fail fast if primary API key is not configured
    if (!PRIMARY_KEY) {
      console.error('❌ Cannot generate message: AZURE_OPENAI_KEY_FALLBACK not configured (primary endpoint)');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact system administrator.' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // RATE LIMIT: Check if user has exceeded rate limit (database-based)
    console.log(`🔒 Checking rate limit for user ${session.user.id}...`);
    const rateLimitResult = await checkRateLimit(
      session.user.id,
      RATE_LIMIT_CONFIGS.AI_MESSAGE_GENERATION
    );

    console.log(`🔒 Rate limit check: ${rateLimitResult.allowed ? '✅ ALLOWED' : '❌ BLOCKED'} (${rateLimitResult.remaining}/${rateLimitResult.limit} remaining)`);

    if (!rateLimitResult.allowed) {
      const minutesUntilReset = Math.ceil(
        (rateLimitResult.resetAt.getTime() - Date.now()) / 60000
      );
      console.warn(`⚠️ Rate limit exceeded for user ${session.user.id} - resets in ${minutesUntilReset} minutes`);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `You can generate ${rateLimitResult.limit} messages per hour. Please try again in ${minutesUntilReset} minutes (resets at ${rateLimitResult.resetAt.toLocaleTimeString()}).`,
          resetAt: rateLimitResult.resetAt.toISOString(),
          remaining: rateLimitResult.remaining,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
          },
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = generateMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Build prompt for AI
    const prompt = buildMessagePrompt(data);

    // Try primary model first, fallback to mini if it fails
    let generatedMessage: string | undefined;
    let modelUsed: string;

    console.log(`🤖 Attempting message generation with ${PRIMARY_MODEL} @ ${PRIMARY_ENDPOINT}...`);

    try {
      generatedMessage = await callAzureOpenAI(prompt, PRIMARY_MODEL, PRIMARY_ENDPOINT, PRIMARY_KEY!);
      modelUsed = PRIMARY_MODEL;
      console.log(`✅ Primary model (${PRIMARY_MODEL}) succeeded`);
    } catch (primaryError) {
      const primaryErrorMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn(`⚠️ Primary model (${PRIMARY_MODEL}) failed:`, primaryErrorMsg);
      console.warn(`🔄 Attempting fallback to ${FALLBACK_MODEL} @ ${FALLBACK_ENDPOINT}...`);

      // Check if fallback is configured
      if (!FALLBACK_KEY) {
        console.error(`❌ Fallback not available: AZURE_OPENAI_KEY_FALLBACK not configured`);
        throw primaryError; // Re-throw primary error since fallback unavailable
      }

      try {
        generatedMessage = await callAzureOpenAI(prompt, FALLBACK_MODEL, FALLBACK_ENDPOINT, FALLBACK_KEY);
        modelUsed = FALLBACK_MODEL;
        console.log(`✅ Fallback model (${FALLBACK_MODEL}) succeeded on different endpoint`);
      } catch (fallbackError) {
        const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error(`❌ Both endpoints/models failed!`);
        console.error(`Primary (${PRIMARY_ENDPOINT}):`, primaryErrorMsg);
        console.error(`Fallback (${FALLBACK_ENDPOINT}):`, fallbackErrorMsg);
        throw fallbackError; // Let outer catch handle it
      }
    }

    // SAFETY: Ensure message was generated (TypeScript safety check)
    if (!generatedMessage) {
      throw new Error('No message generated - both primary and fallback models failed or returned empty');
    }

    // BUG #17 FIX: Calculate SMS segments and cost warnings
    const charCount = generatedMessage.length;
    let segments = 1;
    let warning: string | null = null;

    // Hard limit - truncate if exceeds maximum
    if (charCount > 1600) {
      generatedMessage = generatedMessage.slice(0, 1597) + '...';
      warning = 'Message exceeded maximum length (1600 characters) and was truncated. Please review and edit.';
    } else if (charCount > 160) {
      // Calculate SMS segments (GSM-7 encoding)
      // Single SMS: 160 characters
      // Multi-part SMS: First segment 153 chars, subsequent 153 chars each
      // (7 characters reserved for concatenation headers in multi-part messages)
      segments = Math.ceil(charCount / 153);

      warning = `⚠️ Message is ${charCount} characters and will be sent as ${segments} SMS segments. Cost will be ${segments}x higher than a single SMS.`;
    }

    // Calculate estimated cost per message
    // Average SMS cost in US: $0.0075 per segment
    const estimatedCostPerMessage = segments * 0.0075;

    // Generate suggestions
    const suggestions = generateSuggestions(generatedMessage, data);

    return NextResponse.json({
      message: generatedMessage,
      charCount: generatedMessage.length,
      segments,
      estimatedCostPerMessage,
      warning,
      modelUsed,
      suggestions,
    });
  } catch (error) {
    console.error('❌ CRITICAL ERROR in generate-message endpoint:');

    // Safely extract error details
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Error name:', errorName);
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);

    // Serialize error object safely (Error objects don't stringify well)
    try {
      if (error instanceof Error) {
        console.error('Error details:', JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
        }, null, 2));
      } else {
        console.error('Error object:', JSON.stringify(error, null, 2));
      }
    } catch {
      // JSON.stringify can fail for circular references or non-serializable objects
      console.error('Could not stringify error:', String(error));
    }

    // Return detailed error information for debugging
    return NextResponse.json(
      {
        error: 'Failed to generate message',
        details: errorMessage,
        errorType: errorName,
        // In development, return full error details
        ...(process.env.NODE_ENV === 'development' && {
          stack: errorStack,
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * Build prompt for AI message generation
 */
function buildMessagePrompt(data: GenerateMessageInput): string {
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
 * Call Azure OpenAI API with dual-endpoint support
 * BUG #20 FIX: Added 30-second timeout to prevent Vercel function timeout
 * ENHANCED: Comprehensive error logging for production debugging
 * DUAL-ENDPOINT: Supports different endpoints for primary/fallback (geographic redundancy)
 */
async function callAzureOpenAI(
  prompt: string,
  model: string,
  endpoint: string,
  apiKey: string
): Promise<string> {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  console.log(`[AI-MSG ${requestId}] 🚀 Starting Azure OpenAI request`);
  console.log(`[AI-MSG ${requestId}] Model: ${model}`);
  console.log(`[AI-MSG ${requestId}] Endpoint: ${endpoint}`);
  console.log(`[AI-MSG ${requestId}] API Key present: ${!!apiKey}`);
  console.log(`[AI-MSG ${requestId}] API Key length: ${apiKey?.length || 0}`);
  console.log(`[AI-MSG ${requestId}] Prompt length: ${prompt.length} chars`);

  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=2024-08-01-preview`;

  // Token allocation by model:
  // - gpt-5-mini: Uses extensive reasoning tokens (2000-3000+) before generating output
  // - gpt-4o: Standard completion model, doesn't need as many tokens
  // - Other models: Standard 2000 tokens
  const maxTokens = model === 'gpt-5-mini' ? 8000 : 2000;
  console.log(`[AI-MSG ${requestId}] Max tokens: ${maxTokens}`);

  // TIMEOUT CONFIGURATION:
  // - Vercel/Render serverless functions: 60s max execution time
  // - Primary model (gpt-4o): Usually <1s response time (355ms average)
  // - Fallback model (gpt-5-mini): Usually 1-2s response time (621ms average)
  // - 30s timeout allows for slow responses while preventing full serverless timeout
  // - This leaves 30s buffer for fallback attempts + error handling + response serialization
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[AI-MSG ${requestId}] ⏱️ TIMEOUT: Request exceeded 30 seconds`);
    controller.abort();
  }, 30000); // 30 seconds

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
      // GPT-5 only supports default values for temperature (1), top_p, frequency_penalty, presence_penalty
    };

    console.log(`[AI-MSG ${requestId}] 📤 Sending request to Azure OpenAI...`);
    console.log(`[AI-MSG ${requestId}] Request body:`, JSON.stringify(requestBody).substring(0, 500));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal, // Pass abort signal for timeout
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const elapsed = Date.now() - startTime;
    console.log(`[AI-MSG ${requestId}] 📥 Received response in ${elapsed}ms`);
    console.log(`[AI-MSG ${requestId}] Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI-MSG ${requestId}] ❌ API Error Response:`, errorText);
      console.error(`[AI-MSG ${requestId}] Status: ${response.status}`);
      console.error(`[AI-MSG ${requestId}] Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));

      throw new Error(`Azure OpenAI API error (${model}): ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[AI-MSG ${requestId}] 📊 Response data keys:`, Object.keys(data));
    console.log(`[AI-MSG ${requestId}] Choices count:`, data.choices?.length || 0);

    if (data.choices && data.choices[0]) {
      console.log(`[AI-MSG ${requestId}] Choice 0 keys:`, Object.keys(data.choices[0]));
      console.log(`[AI-MSG ${requestId}] Message keys:`, Object.keys(data.choices[0].message || {}));
      console.log(`[AI-MSG ${requestId}] Content length:`, data.choices[0].message?.content?.length || 0);
    }

    const message = data.choices?.[0]?.message?.content;

    if (!message) {
      console.error(`[AI-MSG ${requestId}] ❌ No message in response`);
      console.error(`[AI-MSG ${requestId}] Full response:`, JSON.stringify(data, null, 2));
      throw new Error('No message generated by AI');
    }

    console.log(`[AI-MSG ${requestId}] ✅ Success! Generated ${message.length} chars in ${elapsed}ms`);
    console.log(`[AI-MSG ${requestId}] Message preview:`, message.substring(0, 100));
    return message.trim();

  } catch (error) {
    clearTimeout(timeoutId); // Always clear timeout

    const elapsed = Date.now() - startTime;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[AI-MSG ${requestId}] ❌ ERROR after ${elapsed}ms:`, error);
    console.error(`[AI-MSG ${requestId}] Error name:`, errorName);
    console.error(`[AI-MSG ${requestId}] Error message:`, errorMessage);
    console.error(`[AI-MSG ${requestId}] Error stack:`, errorStack);

    // Handle timeout specifically with user-friendly message
    if (errorName === 'AbortError') {
      console.error(`[AI-MSG ${requestId}] ⏱️ Request was aborted due to timeout`);
      throw new Error(
        `Azure OpenAI API timeout after 30 seconds. The AI service is taking longer than expected. Please try again or use the fallback model.`
      );
    }

    // Re-throw other errors with enhanced context
    throw error;
  }
}

/**
 * Generate suggestions for improving the message
 */
function generateSuggestions(message: string, data: GenerateMessageInput): string[] {
  const suggestions: string[] = [];

  // BUG #17 FIX: Enhanced length check with SMS segment details
  if (message.length > 160) {
    const segments = Math.ceil(message.length / 153);
    const charsToRemove = message.length - 160;

    suggestions.push(
      `Message will be sent as ${segments} SMS segments (${segments}x cost). ` +
      `Remove ${charsToRemove} characters to fit in a single SMS for optimal deliverability and cost.`
    );
  }

  // Personalization check
  if (!message.includes('{{first_name}}')) {
    suggestions.push('Consider adding {{first_name}} placeholder for personalization.');
  }

  // Link check
  if (data.includeLink && !message.includes('http')) {
    suggestions.push('Link may be missing - ensure the Calendly URL is included.');
  }

  // Call to action check
  const hasCallToAction = /book|schedule|reply|call|click|check out|visit/i.test(message);
  if (!hasCallToAction && data.messageGoal === 'book_call') {
    suggestions.push('Message may lack a clear call-to-action. Consider adding "book a call" or "schedule a chat".');
  }

  // Urgency check
  if (data.tone === 'urgent' && !/today|now|soon|limited|last chance/i.test(message)) {
    suggestions.push('Consider adding time-sensitive language to create urgency.');
  }

  // Spam word check
  const spamWords = ['free', 'guaranteed', 'limited time', 'act now', 'buy now', 'discount'];
  const foundSpamWords = spamWords.filter(word => message.toLowerCase().includes(word));
  if (foundSpamWords.length > 0) {
    suggestions.push(`Avoid spam trigger words: ${foundSpamWords.join(', ')}`);
  }

  return suggestions;
}
