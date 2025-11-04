import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
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

// Azure OpenAI configuration from user's account
const AZURE_OPENAI_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const PRIMARY_MODEL = 'gpt-5';
const FALLBACK_MODEL = 'gpt-5-mini';

// SECURITY: Validate API key is set at module load time
if (!AZURE_OPENAI_KEY) {
  console.error('❌ CRITICAL: AZURE_OPENAI_KEY environment variable is not set');
  // Note: This will be caught by the handler and return 500 to the client
}

// RATE LIMITING: Simple in-memory rate limiter
// BUG #11: ⚠️ KNOWN LIMITATION - NOT PRODUCTION-READY
// This in-memory rate limiter does NOT work across serverless instances in production.
// Each Vercel lambda has its own memory, so users can bypass limits by:
// 1. Refreshing the page (may hit different lambda)
// 2. Making concurrent requests (distributed across multiple lambdas)
// 3. Waiting for lambda cold start (clears memory)
//
// TODO: Migrate to Redis/Upstash for production (distributed rate limiting across serverless instances)
// Current implementation: 10 requests per hour per user (per lambda instance only)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; resetAt: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  // No previous requests or window expired
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  // Within window, check if under limit
  if (userLimit.count < RATE_LIMIT_MAX_REQUESTS) {
    userLimit.count++;
    return { allowed: true, resetAt: userLimit.resetAt };
  }

  // Rate limit exceeded
  return { allowed: false, resetAt: userLimit.resetAt };
}

// Cleanup expired entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimitStore.entries()) {
    if (now > limit.resetAt) {
      rateLimitStore.delete(userId);
    }
  }
}, 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Fail fast if API key is not configured
    if (!AZURE_OPENAI_KEY) {
      console.error('❌ Cannot generate message: AZURE_OPENAI_KEY not configured');
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

    // RATE LIMIT: Check if user has exceeded rate limit
    const { allowed, resetAt } = checkRateLimit(session.user.id);
    if (!allowed) {
      const resetDate = new Date(resetAt);
      const minutesUntilReset = Math.ceil((resetAt - Date.now()) / 60000);
      console.warn(`⚠️ Rate limit exceeded for user ${session.user.id}`);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `You can generate ${RATE_LIMIT_MAX_REQUESTS} messages per hour. Please try again in ${minutesUntilReset} minutes (resets at ${resetDate.toLocaleTimeString()}).`,
          resetAt: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)), // seconds
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)), // Unix timestamp
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
    let generatedMessage: string;
    let modelUsed: string;

    try {
      generatedMessage = await callAzureOpenAI(prompt, PRIMARY_MODEL);
      modelUsed = PRIMARY_MODEL;
    } catch (error) {
      console.warn(`⚠️ Primary model (${PRIMARY_MODEL}) failed, trying fallback...`);
      generatedMessage = await callAzureOpenAI(prompt, FALLBACK_MODEL);
      modelUsed = FALLBACK_MODEL;
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
    console.error('Error generating message:', error);
    return NextResponse.json(
      { error: 'Failed to generate message. Please try again or contact support.' },
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
 * Call Azure OpenAI API
 * BUG #20 FIX: Added 30-second timeout to prevent Vercel function timeout
 */
async function callAzureOpenAI(prompt: string, model: string): Promise<string> {
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${model}/chat/completions?api-version=2024-08-01-preview`;

  // GPT-5 uses extensive reasoning tokens (2000-3000+) before generating output
  // Must allocate enough tokens for both reasoning AND visible output
  const maxTokens = model === PRIMARY_MODEL ? 8000 : 2000;

  // BUG #20 FIX: Add timeout to prevent hanging requests
  // Vercel functions have 60s max execution time (serverless)
  // Set 30s timeout to allow for retries and error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY!,
      },
      body: JSON.stringify({
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
      }),
      signal: controller.signal, // Pass abort signal for timeout
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error (${model}): ${response.status} - ${error}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;

    if (!message) {
      throw new Error('No message generated by AI');
    }

    return message.trim();

  } catch (error: any) {
    clearTimeout(timeoutId); // Always clear timeout

    // Handle timeout specifically with user-friendly message
    if (error.name === 'AbortError') {
      throw new Error(
        `Azure OpenAI API timeout after 30 seconds. The AI service is taking longer than expected. Please try again or use the fallback model.`
      );
    }

    // Re-throw other errors
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
