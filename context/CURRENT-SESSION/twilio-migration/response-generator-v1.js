// Response Generator v1.0 - AQA Framework with Personalization
// Purpose: Generate intelligent, conversational responses based on intent
// Sales Philosophy: Answer questions with questions (AQA Framework)
// Version: Product-grade for multiple clients
// Author: UYSP Development Team
// Created: October 17, 2025

// ============================================================================
// INPUT DATA
// ============================================================================

const classified = $items('Classify Intent')[0].json;
const intent = classified.intent;
const action = classified.action;
const responseType = classified.response_type;
const questionType = classified.question_type;
const leadCtx = classified.lead_context;
const settings = classified.client_settings;
const extractedTiming = classified.extracted_timing;
const followUpDate = classified.follow_up_date;

const firstName = leadCtx.first_name || 'there';
const bookingUrl = settings.calendly_url;
const personalizationLevel = settings.personalization_level;

// ============================================================================
// PERSONALIZATION ENGINE
// ============================================================================

function getPersonalizedGreeting() {
  // Future: Use enrichment data for context
  // For now: Simple first name
  return firstName;
}

function getPersonalizedContext() {
  // Based on personalization level, add relevant context
  
  if (personalizationLevel === 'Off' || personalizationLevel === 'Basic') {
    return '';  // No additional context
  }
  
  if (personalizationLevel === 'Moderate') {
    // Add company context if available
    if (leadCtx.company && leadCtx.job_title) {
      return ` I see you're ${leadCtx.job_title} at ${leadCtx.company}.`;
    }
  }
  
  if (personalizationLevel === 'Deep') {
    // Add rich context (job changes, company news, etc.)
    // Future: Pull from enrichment fields
    // For now: Company + title
    if (leadCtx.company && leadCtx.job_title) {
      return ` I see you're ${leadCtx.job_title} at ${leadCtx.company}.`;
    }
  }
  
  return '';
}

// ============================================================================
// RESPONSE TEMPLATES BY INTENT
// ============================================================================

let response = '';
let shouldSendBookingLink = false;
let shouldOfferPersonalOutreach = false;

switch (action) {
  
  // -------------------------------------------------------------------------
  // EXISTING RELATIONSHIP - Apologize & Stop
  // -------------------------------------------------------------------------
  
  case 'mark_current_client':
    response = `My sincere apologies ${firstName}! I see you're already part of the UYSP family. I'll make sure you don't receive these messages again. Really appreciate you being a valued member - looking forward to supporting your success!`;
    break;
  
  case 'confirm_booked':
    response = `Perfect ${firstName}! I see you're all set with your call. Looking forward to it. See you then!`;
    break;
  
  // -------------------------------------------------------------------------
  // HARD STOP - Brief Confirmation
  // -------------------------------------------------------------------------
  
  case 'unsubscribe_hard':
    response = `Removed ${firstName}. Apologies for the inconvenience.`;
    break;
  
  // -------------------------------------------------------------------------
  // SOFT NO - Warm Future Open
  // -------------------------------------------------------------------------
  
  case 'schedule_nurture':
    // Detect reason for soft no
    let reason = '';
    if (classified.message_normalized.includes('job')) reason = 'the new role';
    else if (classified.message_normalized.includes('busy')) reason = 'the busy season';
    else if (classified.message_normalized.includes('budget')) reason = 'budget timing';
    else if (classified.message_normalized.includes('priority')) reason = 'your current priorities';
    
    const reasonPhrase = reason ? ` with ${reason}` : '';
    const timingConfirm = extractedTiming ? `How about I drop you a note ${extractedTiming}?` : `I'll check back in a couple months.`;
    
    response = `Totally understand ${firstName} - timing is everything${reasonPhrase}. ${timingConfirm} If things change before then, feel free to reach out anytime. Best of luck!`;
    break;
  
  // -------------------------------------------------------------------------
  // POSITIVE INTEREST - Qualify Before Booking
  // -------------------------------------------------------------------------
  
  case 'qualify_and_book':
    // Check if qualifying questions are enabled
    if (settings.qualifying_enabled && !leadCtx.pain_point) {
      // Ask qualifying question BEFORE sending link
      response = `Great to hear ${firstName}!${getPersonalizedContext()} Quick question - what's driving your interest? Hitting quota, skill gaps, or something else?`;
      shouldSendBookingLink = false;  // Wait for their answer
    } else if (leadCtx.pain_point) {
      // Already qualified - send booking link with context
      response = `Awesome ${firstName}! Based on your interest in ${leadCtx.pain_point.toLowerCase()}, here's the strategy call link: ${bookingUrl}

Or if you'd prefer, I can have someone from my team reach out to schedule personally. What works better for you?`;
      shouldSendBookingLink = true;
      shouldOfferPersonalOutreach = true;
    } else {
      // Qualifying disabled - send link directly
      response = `Great to hear ${firstName}! Here's the link to book your strategy call: ${bookingUrl}

Or if you'd prefer to talk to someone first, I can have my team call you. Just let me know!`;
      shouldSendBookingLink = true;
      shouldOfferPersonalOutreach = true;
    }
    break;
  
  case 'send_booking_link':
    // Direct booking intent - send link immediately
    response = `Awesome ${firstName}! Here's the link: ${bookingUrl}

Pick any time that works for you. If you don't see something that fits, let me know and we'll find a time!`;
    shouldSendBookingLink = true;
    break;
  
  // -------------------------------------------------------------------------
  // MAYBE/NEUTRAL - Low Pressure Info
  // -------------------------------------------------------------------------
  
  case 'provide_info_stay_engaged':
    response = `No pressure ${firstName}. Here's the quick version:

I help AEs close bigger deals through mindset + skill work. Free 30-min strategy call to see if there's a fit: ${bookingUrl}

What questions can I answer for you?`;
    shouldSendBookingLink = true;
    break;
  
  // -------------------------------------------------------------------------
  // QUESTIONS - AQA Framework (Answer with Question)
  // -------------------------------------------------------------------------
  
  case 'answer_with_question':
    // AQA Framework: Acknowledge, Answer briefly, Ask qualifying question
    
    let answer = '';
    let qualifyingQuestion = '';
    
    if (questionType === 'process') {
      answer = "It's a 30-minute strategy call where we'd dive into what's working and what's not in your sales process.";
      qualifyingQuestion = "Quick question - what's your biggest challenge right now? Prospecting, closing, or something else?";
    }
    
    else if (questionType === 'cost') {
      answer = "Good question. The strategy call is completely free with zero obligation. Coaching investment varies based on your goals - we have Bronze/Silver/Gold tiers from a few hundred to a few thousand per month.";
      qualifyingQuestion = "Before we get into specifics - what kind of results are you trying to hit? President's Club, bigger deals, or something else?";
    }
    
    else if (questionType === 'credibility') {
      answer = "Great question! Ian was #1 AE at companies like Salesforce and ZoomInfo, now coaches AEs closing $1M+ deals. Clients typically see 20-40% lift in 3-6 months. Check testimonials: https://www.untapyoursalespotential.com/testimonials";
      qualifyingQuestion = "What would a 20-40% improvement mean for YOU - hitting quota vs President's Club, or bigger?";
    }
    
    response = `${answer}

**${qualifyingQuestion}**`;
    
    // If they've answered enough qualifying questions, offer booking
    if (leadCtx.pain_point && leadCtx.reply_count > 1) {
      response += `

Or if you're ready, here's the booking link: ${bookingUrl}`;
      shouldSendBookingLink = true;
    }
    break;
  
  // -------------------------------------------------------------------------
  // OUTREACH REQUEST - Confirm & Notify Team
  // -------------------------------------------------------------------------
  
  case 'notify_sales_team':
    response = `Absolutely ${firstName}! I'll have someone from my team reach out personally within the next few hours to get you scheduled.

In the meantime, anything specific you want to make sure we cover on the call?`;
    shouldOfferPersonalOutreach = true;
    break;
  
  // -------------------------------------------------------------------------
  // CONFUSION - Clarify Source & Offer Stop
  // -------------------------------------------------------------------------
  
  case 'clarify_and_offer_stop':
    const source = leadCtx.campaign ? `my ${leadCtx.campaign}` : 'my AI webinar training';
    response = `Hi ${firstName}, this is Ian Koniak from Untap Your Sales Potential. You registered for ${source}. If you'd like to be removed from our outreach, just reply STOP. Otherwise, here's the free strategy call link if you're interested: ${bookingUrl}`;
    shouldSendBookingLink = true;
    break;
  
  // -------------------------------------------------------------------------
  // UNCLEAR - Route to Human
  // -------------------------------------------------------------------------
  
  case 'route_to_human':
    response = `Thanks for your message ${firstName}. I want to make sure you get the right answer - let me have someone from my team reach out who can help. Is there anything specific you want them to know?`;
    shouldOfferPersonalOutreach = true;
    break;
}

// ============================================================================
// RESPONSE METADATA
// ============================================================================

const output = {
  // Response content
  response_text: response,
  response_length: response.length,
  sms_segments: Math.ceil(response.length / 160),
  
  // Response metadata
  should_send_booking_link: shouldSendBookingLink,
  should_offer_personal_outreach: shouldOfferPersonalOutreach,
  response_type: responseType,
  
  // Classification data (pass through)
  ...classified,
  
  // For Twilio send
  to_number: leadCtx.phone,
  from_number: '+18186990998',  // TODO: Make this dynamic per client
  
  // For logging
  generated_at: new Date().toISOString()
};

console.log('=== RESPONSE GENERATED ===');
console.log(`Response: "${response}"`);
console.log(`Length: ${response.length} chars (${output.sms_segments} segments)`);
console.log(`Booking link included: ${shouldSendBookingLink}`);
console.log(`Personal outreach offered: ${shouldOfferPersonalOutreach}`);
console.log('=== END ===');

return [{ json: output }];

