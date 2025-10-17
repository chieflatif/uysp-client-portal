// Intent Classifier v1.0 - Pattern-Based with 3-Tier Stop Logic
// Purpose: Classify inbound SMS/WhatsApp messages into actionable intents
// Version: Product-grade for multiple clients
// Author: UYSP Development Team
// Created: October 17, 2025

// ============================================================================
// INTENT CLASSIFICATION ENGINE
// ============================================================================

const message = $json.body.toLowerCase().trim();
const lead = $items('Find Lead by Phone')[0]?.json || null;
const settings = $items('Get Settings')[0]?.json?.fields || {};

// Intent categories with priority weighting
const intents = {
  
  // TIER 1: EXISTING RELATIONSHIP (Highest Priority - Stop Immediately)
  EXISTING_MEMBER: {
    priority: 100,
    patterns: [
      /\b(already (member|client|enrolled|in|part of|have coaching))\b/i,
      /\b(current (member|client)|i'?m a (member|client))\b/i,
      /\b(paying customer|existing customer)\b/i,
      /\b(already (paid|paying|subscribed))\b/i
    ],
    action: 'mark_current_client',
    tier: 'relationship',
    response_type: 'apologize_and_stop'
  },
  
  ALREADY_BOOKED: {
    priority: 95,
    patterns: [
      /\b(already booked|have a (call|meeting)|meeting scheduled)\b/i,
      /\b(already set|on (the )?calendar|appointment (set|scheduled))\b/i,
      /\b(call is scheduled|booked (a|my) call)\b/i,
      /\b(waiting for (my|the) call)\b/i
    ],
    action: 'confirm_booked',
    tier: 'relationship',
    response_type: 'confirm_and_stop'
  },
  
  // TIER 2: HARD STOP (Immediate Unsubscribe)
  HARD_STOP: {
    priority: 90,
    patterns: [
      /\b(fuck|shit|piss|damn) (off|you)\b/i,  // Profanity
      /\b(stop|unsubscribe|remove me|delete|opt out)\b/i,  // Explicit stop
      /\b(never contact|don'?t (ever )?contact|leave me alone)\b/i,  // Strong rejection
      /\b(cease|lawyer|harassment|legal action)\b/i,  // Legal threats
      /\b(take me off|get me off)\b/i
    ],
    action: 'unsubscribe_hard',
    tier: 'stop',
    response_type: 'brief_confirmation'
  },
  
  // TIER 3: SOFT NO - TIMING/SITUATION (Pause for Nurture)
  SOFT_NO_TIMING: {
    priority: 85,
    patterns: [
      /\b(not (right )?now|not at this time|maybe later)\b/i,
      /\b(just changed jobs?|new (role|job|position))\b/i,
      /\b(too busy|crazy time|swamped|overwhelmed)\b/i,
      /\b(check back|reach out|follow up) (in|later|next)\b/i,
      /\b(after (the )?(holidays|quarter|[a-z]+))\b/i,
      /\b(in (a )?(few|couple) (weeks?|months?))\b/i,
      /\b(end of (the )?(month|quarter|year))\b/i
    ],
    action: 'schedule_nurture',
    tier: 'soft_no',
    response_type: 'warm_future_open'
  },
  
  SOFT_NO_BUDGET: {
    priority: 85,
    patterns: [
      /\b(can'?t afford|too expensive|no budget|don'?t have money)\b/i,
      /\b(budget (issue|constraint)|tight on money)\b/i,
      /\b(not in budget|no funds)\b/i
    ],
    action: 'schedule_nurture',
    tier: 'soft_no',
    response_type: 'warm_future_open'
  },
  
  SOFT_NO_PRIORITY: {
    priority: 85,
    patterns: [
      /\b(other priorities|focusing on|working on)\b/i,
      /\b(not (a |the )?(priority|focus) right now)\b/i,
      /\b(have to focus on)\b/i
    ],
    action: 'schedule_nurture',
    tier: 'soft_no',
    response_type: 'warm_future_open'
  },
  
  // TIER 4: POSITIVE INTEREST (Engage & Qualify)
  POSITIVE_INTEREST: {
    priority: 80,
    patterns: [
      /\b(yes|yeah|yep|sure|definitely)\b/i,
      /\b(interested|sounds good|sounds great|i'?m in)\b/i,
      /\b(let'?s talk|let'?s do it|count me in)\b/i,
      /\b(would love|i'?d like|sign me up)\b/i,
      /\b(tell me more|want to know more)\b/i
    ],
    action: 'qualify_and_book',
    tier: 'engagement',
    response_type: 'qualify_before_booking'
  },
  
  BOOKING_INTENT: {
    priority: 80,
    patterns: [
      /\b(book|schedule|set up (a |the )?(call|meeting))\b/i,
      /\b(when can|what times?|available)\b/i,
      /\b(calendar|calendly)\b/i
    ],
    action: 'send_booking_link',
    tier: 'engagement',
    response_type: 'direct_booking'
  },
  
  // TIER 5: NEUTRAL/MAYBE (Keep Conversation Open)
  MAYBE_CONSIDERING: {
    priority: 70,
    patterns: [
      /\b(maybe|possibly|not sure|i'?ll think)\b/i,
      /\b(let me (think|see|check))\b/i,
      /\b(considering|looking at options|evaluating)\b/i,
      /\b(send (me )?info|more details)\b/i
    ],
    action: 'provide_info_stay_engaged',
    tier: 'neutral',
    response_type: 'low_pressure_info'
  },
  
  // TIER 6: QUESTIONS (Answer with Question - AQA Framework)
  QUESTION_PROCESS: {
    priority: 75,
    patterns: [
      /\b(how long|what (is the |does the )?duration)\b/i,
      /\b(what (do we|will we) (talk|discuss))\b/i,
      /\b(what'?s (the |involved|included))\b/i,
      /\b(what happens (on|in|during))\b/i
    ],
    action: 'answer_with_question',
    tier: 'question',
    response_type: 'aqa_framework',
    question_type: 'process'
  },
  
  QUESTION_COST: {
    priority: 75,
    patterns: [
      /\b(how much|what'?s (the )?cost|what'?s (the )?price)\b/i,
      /\b(is (this|it) free|does (this|it) cost|any (cost|charge))\b/i,
      /\b(pricing|payment|pay)\b/i
    ],
    action: 'answer_with_question',
    tier: 'question',
    response_type: 'aqa_framework',
    question_type: 'cost'
  },
  
  QUESTION_CREDIBILITY: {
    priority: 75,
    patterns: [
      /\b(who (is|are) (you|this|ian))\b/i,
      /\b(does (this|it) work|is this legit|any proof)\b/i,
      /\b(testimonial|reference|review|result)\b/i,
      /\b(who else|other clients)\b/i
    ],
    action: 'answer_with_question',
    tier: 'question',
    response_type: 'aqa_framework',
    question_type: 'credibility'
  },
  
  // TIER 7: OUTREACH REQUEST (Hot Lead - Notify Team)
  OUTREACH_REQUEST: {
    priority: 85,
    patterns: [
      /\b(call me|reach out|contact me|email me)\b/i,
      /\b(have (someone|your team|them) (call|reach|contact))\b/i,
      /\b(get in touch|give me a call|talk to someone)\b/i,
      /\b(prefer (a )?(call|phone|email))\b/i
    ],
    action: 'notify_sales_team',
    tier: 'engagement',
    response_type: 'confirm_outreach'
  },
  
  // TIER 8: CONFUSION (Clarify & Offer Stop)
  CONFUSION: {
    priority: 60,
    patterns: [
      /\b(who (is this|are you)|wrong number|didn'?t sign up)\b/i,
      /\b(how did you get|where did you get (my |this )?number)\b/i,
      /\b(what (is )?this|why am i getting)\b/i,
      /\b(spam|scam|fraud)\b/i
    ],
    action: 'clarify_and_offer_stop',
    tier: 'neutral',
    response_type: 'explain_source'
  }
};

// ============================================================================
// CLASSIFICATION LOGIC
// ============================================================================

let detectedIntent = null;
let highestPriority = 0;

// Iterate through all intents and find highest priority match
for (const [intentName, config] of Object.entries(intents)) {
  for (const pattern of config.patterns) {
    if (pattern.test(message)) {
      if (config.priority > highestPriority) {
        highestPriority = config.priority;
        detectedIntent = {
          name: intentName,
          action: config.action,
          tier: config.tier,
          response_type: config.response_type,
          question_type: config.question_type || null,
          priority: config.priority,
          confidence: 90  // Pattern match = high confidence
        };
      }
    }
  }
}

// Default: UNCLEAR (route to human review)
if (!detectedIntent) {
  detectedIntent = {
    name: 'UNCLEAR',
    action: 'route_to_human',
    tier: 'neutral',
    response_type: 'manual_review',
    priority: 50,
    confidence: 0
  };
}

// ============================================================================
// CONTEXT ENRICHMENT
// ============================================================================

const leadContext = {
  id: lead?.id || null,
  first_name: lead?.['First Name'] || '',
  last_name: lead?.['Last Name'] || '',
  full_name: `${lead?.['First Name'] || ''} ${lead?.['Last Name'] || ''}`.trim(),
  email: lead?.['Email'] || '',
  company: lead?.['Company'] || '',
  job_title: lead?.['Job Title'] || '',
  phone: $json.from,
  campaign: lead?.['Campaign'] || lead?.['SMS Campaign ID'] || '',
  
  // Current state
  current_status: lead?.['Processing Status'] || '',
  sms_status: lead?.['SMS Status'] || '',
  sequence_position: lead?.['SMS Sequence Position'] || 0,
  
  // Conversation state
  conversation_status: lead?.['Conversation Status'] || 'No Reply',
  reply_count: lead?.['Reply Count'] || 0,
  last_reply_at: lead?.['Last Reply At'] || null,
  
  // Qualification data (if exists)
  pain_point: lead?.['Pain Point'] || null,
  coaching_preference: lead?.['Coaching Format Preference'] || null,
  
  // Enrichment data (for personalization)
  icp_score: lead?.['ICP Score'] || 0,
  location: lead?.['Location Country'] || '',
  
  // Existing relationship flags
  is_current_client: lead?.['Current Coaching Client'] || false,
  is_booked: lead?.['Booked'] || false,
  is_stopped: lead?.['SMS Stop'] || false
};

// ============================================================================
// TIMING EXTRACTION (for SOFT_NO scenarios)
// ============================================================================

function extractFollowUpDate(message) {
  const text = message.toLowerCase();
  const now = new Date();
  
  // Specific timeframe patterns
  const patterns = [
    {regex: /end of (the )?(month|this month)/i, days: daysUntilEndOfMonth()},
    {regex: /next month/i, days: 30},
    {regex: /few weeks?/i, days: 14},
    {regex: /couple weeks?/i, days: 14},
    {regex: /in (\d+) weeks?/i, handler: (m) => parseInt(m[1]) * 7},
    {regex: /in (\d+) months?/i, handler: (m) => parseInt(m[1]) * 30},
    {regex: /next quarter|q[1-4]/i, days: daysUntilNextQuarter()},
    {regex: /after (the )?holidays/i, days: daysUntilDate(new Date(now.getFullYear() + 1, 0, 7))},
    {regex: /beginning of next year|start of next year/i, days: daysUntilDate(new Date(now.getFullYear() + 1, 0, 1))}
  ];
  
  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match) {
      const days = p.handler ? p.handler(match) : p.days;
      return addDays(now, days);
    }
  }
  
  // Default: Use client setting or 60 days
  const defaultDelay = settings['Default Nurture Delay Days'] || 60;
  return addDays(now, defaultDelay);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];  // YYYY-MM-DD
}

function daysUntilEndOfMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.ceil((lastDay - now) / (1000 * 60 * 60 * 24));
}

function daysUntilNextQuarter() {
  const now = new Date();
  const month = now.getMonth();
  const quarterStart = [0, 3, 6, 9].find(m => m > month) || 0;
  const targetYear = quarterStart === 0 ? now.getFullYear() + 1 : now.getFullYear();
  const target = new Date(targetYear, quarterStart, 1);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function daysUntilDate(target) {
  const now = new Date();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// Extract timing if SOFT_NO intent
let extractedFollowUpDate = null;
let extractedTiming = null;

if (detectedIntent.tier === 'soft_no') {
  extractedFollowUpDate = extractFollowUpDate(message);
  
  // Extract human-readable timing phrase
  const timingPhrases = [
    {pattern: /end of month/i, text: 'end of the month'},
    {pattern: /next month/i, text: 'next month'},
    {pattern: /few weeks?/i, text: 'a few weeks'},
    {pattern: /couple weeks?/i, text: 'a couple weeks'},
    {pattern: /in (\d+) weeks?/i, handler: (m) => `in ${m[1]} weeks`},
    {pattern: /in (\d+) months?/i, handler: (m) => `in ${m[1]} months`},
    {pattern: /next quarter/i, text: 'next quarter'},
    {pattern: /after holidays/i, text: 'after the holidays'}
  ];
  
  for (const p of timingPhrases) {
    const match = message.match(p.pattern);
    if (match) {
      extractedTiming = p.handler ? p.handler(match) : p.text;
      break;
    }
  }
  
  if (!extractedTiming) {
    const defaultDays = settings['Default Nurture Delay Days'] || 60;
    extractedTiming = `in ${defaultDays} days`;
  }
}

// ============================================================================
// OUTPUT
// ============================================================================

const result = {
  // Classification
  intent: detectedIntent.name,
  action: detectedIntent.action,
  tier: detectedIntent.tier,
  response_type: detectedIntent.response_type,
  question_type: detectedIntent.question_type,
  priority: detectedIntent.priority,
  confidence: detectedIntent.confidence,
  
  // Original data
  original_message: $json.body,
  message_normalized: message,
  
  // Lead context
  lead_context: leadContext,
  
  // Timing data (for soft no)
  follow_up_date: extractedFollowUpDate,
  extracted_timing: extractedTiming,
  
  // Client settings
  client_settings: {
    two_way_enabled: settings['Two-Way Conversations Enabled'] || false,
    qualifying_enabled: settings['Enable Qualifying Questions'] || false,
    auto_nurture_enabled: settings['Auto-Nurture Enabled'] || false,
    personalization_level: settings['Personalization Level'] || 'Off',
    default_nurture_days: settings['Default Nurture Delay Days'] || 60,
    calendly_url: settings['Calendly URL'] || 'https://calendly.com/d/cwvn-dwy-v5k/sales-coaching-strategy-call-rrl'
  },
  
  // Metadata
  classified_at: new Date().toISOString(),
  classifier_version: 'v1.0-pattern-based'
};

console.log('=== INTENT CLASSIFICATION ===');
console.log(`Message: "${$json.body}"`);
console.log(`Lead: ${leadContext.full_name} (${leadContext.email})`);
console.log(`Intent: ${result.intent} (${result.tier})`);
console.log(`Action: ${result.action}`);
console.log(`Confidence: ${result.confidence}%`);
if (extractedFollowUpDate) {
  console.log(`Follow-up: ${extractedFollowUpDate} (${extractedTiming})`);
}
console.log('=== END CLASSIFICATION ===');

return [{ json: result }];

