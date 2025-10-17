// Action Handler v1.0 - Execute Actions Based on Intent
// Purpose: Update Airtable, send notifications, manage state
// Version: Product-grade for multiple clients
// Author: UYSP Development Team
// Created: October 17, 2025

// ============================================================================
// INPUT DATA
// ============================================================================

const responseData = $items('Generate Response')[0].json;
const intent = responseData.intent;
const action = responseData.action;
const leadCtx = responseData.lead_context;
const settings = responseData.client_settings;
const followUpDate = responseData.follow_up_date;
const extractedTiming = responseData.extracted_timing;

const now = new Date().toISOString();

// ============================================================================
// ACTION EXECUTION BY INTENT
// ============================================================================

let leadUpdates = {
  id: leadCtx.id,
  
  // Always update these
  'Last Reply At': now,
  'Last Reply Text': responseData.original_message,
  'Reply Count': (leadCtx.reply_count || 0) + 1,
  
  // Conversation state
  'Conversation Status': null,  // Set per intent below
  'Conversation Summary': null  // Set per intent below
};

let shouldNotifySlack = false;
let slackMessage = '';
let slackPriority = 'medium';
let shouldStopCampaign = false;
let shouldMarkBooked = false;
let shouldMarkCurrentClient = false;
let followUpRequired = false;
let followUpType = null;
let followUpNote = '';

// ============================================================================
// INTENT-SPECIFIC ACTIONS
// ============================================================================

switch (action) {
  
  // ---------------------------------------------------------------------------
  // EXISTING MEMBER/CLIENT
  // ---------------------------------------------------------------------------
  
  case 'mark_current_client':
    leadUpdates['Conversation Status'] = 'Manual Review Required';
    leadUpdates['Current Coaching Client'] = true;
    leadUpdates['SMS Stop'] = true;
    leadUpdates['SMS Stop Reason'] = `Existing member: ${responseData.original_message}`;
    leadUpdates['Processing Status'] = 'Complete';
    leadUpdates['Conversation Summary'] = `Lead indicated they are already a member/client. System apologized and unsubscribed. Message: "${responseData.original_message}"`;
    
    shouldStopCampaign = true;
    shouldMarkCurrentClient = true;
    shouldNotifySlack = true;
    slackPriority = 'medium';
    slackMessage = `⚠️ **Data Quality Alert - Existing Member Contacted**

**Lead**: ${leadCtx.full_name}
**Their message**: "${responseData.original_message}"
**Action taken**: Unsubscribed, marked as current client

**Data Issue**: This indicates a gap in Kajabi tag sync, booking detection, or enrollment tracking. Please review to prevent future occurrences.

[Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/${leadCtx.id}]`;
    break;
  
  // ---------------------------------------------------------------------------
  // ALREADY BOOKED
  // ---------------------------------------------------------------------------
  
  case 'confirm_booked':
    leadUpdates['Conversation Status'] = 'Engaged - Qualified';
    leadUpdates['Booked'] = true;
    leadUpdates['Booked At'] = leadUpdates['Booked At'] || now;
    leadUpdates['SMS Stop'] = true;
    leadUpdates['Processing Status'] = 'Complete';
    leadUpdates['Conversation Summary'] = `Lead confirmed they already booked a meeting. Message: "${responseData.original_message}"`;
    
    shouldStopCampaign = true;
    shouldMarkBooked = true;
    // No Slack needed - already handled
    break;
  
  // ---------------------------------------------------------------------------
  // HARD STOP
  // ---------------------------------------------------------------------------
  
  case 'unsubscribe_hard':
    leadUpdates['Conversation Status'] = 'Replied - Not Interested';
    leadUpdates['SMS Stop'] = true;
    leadUpdates['SMS Stop Reason'] = `Hard stop: ${responseData.original_message}`;
    leadUpdates['Processing Status'] = 'Stopped';
    leadUpdates['Conversation Summary'] = `Lead requested hard stop. Message: "${responseData.original_message}"`;
    
    shouldStopCampaign = true;
    // No Slack - normal churn, don't spam
    break;
  
  // ---------------------------------------------------------------------------
  // SOFT NO - Schedule Nurture
  // ---------------------------------------------------------------------------
  
  case 'schedule_nurture':
    // Detect reason category
    let nurt ureTag = 'Timing-Issue';
    if (classified.message_normalized.includes('budget')) nurtureTag = 'Budget-Constraint';
    if (classified.message_normalized.includes('job')) nurtureTag = 'Job-Change';
    if (classified.message_normalized.includes('busy')) nurtureTag = 'Too-Busy';
    if (classified.message_normalized.includes('priority')) nurtureTag = 'Other-Priority';
    
    leadUpdates['Conversation Status'] = 'Replied - Not Interested';
    leadUpdates['SMS Stop'] = true;
    leadUpdates['SMS Stop Reason'] = `Soft no - timing/situation: ${responseData.original_message}`;
    leadUpdates['Processing Status'] = 'Paused - Future Nurture';
    leadUpdates['Nurture Tag'] = nurtureTag;
    leadUpdates['Follow-up Date'] = followUpDate;
    leadUpdates['Follow-up Type'] = settings.auto_nurture_enabled ? 'Auto Message' : 'Manual Call';
    leadUpdates['Follow-up Note'] = `Lead said: "${responseData.original_message}". Requested follow-up ${extractedTiming || 'later'}. Reason: ${nurtureTag}.`;
    leadUpdates['Conversation Summary'] = `Soft no - timing issue. Will follow up on ${followUpDate}. Message: "${responseData.original_message}"`;
    
    shouldStopCampaign = true;
    shouldNotifySlack = true;
    slackPriority = 'low';
    slackMessage = `🟡 **Soft No - Nurture Opportunity**

**Lead**: ${leadCtx.full_name} (${leadCtx.company || 'No company'})
**Reason**: ${nurtureTag}
**Their message**: "${responseData.original_message}"
**Follow-up date**: ${followUpDate}
**Follow-up type**: ${leadUpdates['Follow-up Type']}

**Action**: ${settings.auto_nurture_enabled ? 'System will auto-send nurture message on scheduled date' : 'Sales team to call on scheduled date'}

[Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/${leadCtx.id}]`;
    break;
  
  // ---------------------------------------------------------------------------
  // POSITIVE INTEREST - Qualified
  // ---------------------------------------------------------------------------
  
  case 'send_booking_link':
    leadUpdates['Conversation Status'] = 'Engaged - Qualified';
    leadUpdates['Conversation Summary'] = `Lead expressed interest and received booking link. Reply: "${responseData.original_message}"`;
    
    // Don't stop campaign yet - wait to see if they book
    shouldNotifySlack = true;
    slackPriority = 'high';
    slackMessage = `✅ **Positive Interest - Booking Link Sent**

**Lead**: ${leadCtx.full_name} - ${leadCtx.job_title || 'Unknown title'} at ${leadCtx.company || 'Unknown company'}
**Email**: ${leadCtx.email}
**Phone**: ${leadCtx.phone}
**Their message**: "${responseData.original_message}"
**Action**: Sent booking link

**Next**: Watch for booking confirmation or follow-up questions

[Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/${leadCtx.id}]`;
    break;
  
  // ---------------------------------------------------------------------------
  // MAYBE/CONSIDERING
  // ---------------------------------------------------------------------------
  
  case 'provide_info_stay_engaged':
    leadUpdates['Conversation Status'] = 'Replied - Considering';
    leadUpdates['Conversation Summary'] = `Lead is considering. Sent info and offered booking link. Reply: "${responseData.original_message}"`;
    
    // Keep in campaign - warm lead
    shouldNotifySlack = true;
    slackPriority = 'medium';
    slackMessage = `🟡 **Warm Lead - Considering**

**Lead**: ${leadCtx.full_name}
**Status**: Considering options
**Their message**: "${responseData.original_message}"
**Action**: Sent info + booking link, keeping conversation open

**Next**: Monitor for response within 48 hours

[Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/${leadCtx.id}]`;
    break;
  
  // ---------------------------------------------------------------------------
  // QUESTIONS - AQA Framework
  // ---------------------------------------------------------------------------
  
  case 'answer_with_question':
    leadUpdates['Conversation Status'] = 'Replied - Question';
    leadUpdates['Conversation Summary'] = `Lead asked question. Used AQA framework to answer and qualify. Question: "${responseData.original_message}"`;
    
    // Continue conversation
    shouldNotifySlack = true;
    slackPriority = 'medium';
    slackMessage = `❓ **Question Asked - AQA Response Sent**

**Lead**: ${leadCtx.full_name}
**Question**: "${responseData.original_message}"
**Response**: Used AQA framework (answered + asked qualifying question)

**Next**: Waiting for their response to qualifying question

[Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/${leadCtx.id}]`;
    break;
  
  // ---------------------------------------------------------------------------
  // OUTREACH REQUEST - Notify Sales Team
  // ---------------------------------------------------------------------------
  
  case 'notify_sales_team':
    leadUpdates['Conversation Status'] = 'Engaged - Active';
    leadUpdates['Processing Status'] = 'Engaged - Manual Follow-up';
    leadUpdates['Manual Follow-up Required'] = true;
    leadUpdates['Follow-up Type'] = 'Manual Call';
    leadUpdates['Follow-up Date'] = addDays(new Date(), 0);  // Today!
    leadUpdates['Follow-up Note'] = `URGENT: Lead requested personal outreach. Said: "${responseData.original_message}". Call within 2-4 hours.`;
    leadUpdates['Conversation Summary'] = `Hot lead requested personal outreach. Confirmed team will call. Message: "${responseData.original_message}"`;
    
    followUpRequired = true;
    followUpType = 'Manual Call';
    followUpNote = leadUpdates['Follow-up Note'];
    
    shouldNotifySlack = true;
    slackPriority = 'urgent';
    slackMessage = `🔥 **HOT LEAD - Personal Outreach Requested**

**PRIORITY**: URGENT - Respond within 2-4 hours

**Lead**: ${leadCtx.full_name} - ${leadCtx.job_title || 'Unknown'} at ${leadCtx.company || 'Unknown'}
**Email**: ${leadCtx.email}
**Phone**: ${leadCtx.phone}
**ICP Score**: ${leadCtx.icp_score}

**Request**: "${responseData.original_message}"

**Context**:
- Campaign: ${leadCtx.campaign || 'Unknown'}
- Sequence position: ${leadCtx.sequence_position}
- Previous engagement: ${leadCtx.reply_count} replies

**Action Required**: 
Call or email within 2-4 hours to schedule strategy call

**System Responded**: "I'll have team reach out within few hours..."

[Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/${leadCtx.id}]
${leadCtx.linkedin_url ? `[LinkedIn: ${leadCtx.linkedin_url}]` : ''}`;
    break;
  
  // ---------------------------------------------------------------------------
  // UNCLEAR - Manual Review
  // ---------------------------------------------------------------------------
  
  case 'route_to_human':
    leadUpdates['Conversation Status'] = 'Manual Review Required';
    leadUpdates['Processing Status'] = 'Engaged - Manual Follow-up';
    leadUpdates['Manual Follow-up Required'] = true;
    leadUpdates['Follow-up Type'] = 'Manual Call';
    leadUpdates['Follow-up Note'] = `Unclear intent - needs human review. Message: "${responseData.original_message}"`;
    leadUpdates['Conversation Summary'] = `Unclear message received. Routed to sales team for manual response. Message: "${responseData.original_message}"`;
    
    followUpRequired = true;
    
    shouldNotifySlack = true;
    slackPriority = 'medium';
    slackMessage = `❓ **Manual Review Required - Unclear Intent**

**Lead**: ${leadCtx.full_name}
**Message**: "${responseData.original_message}"
**Classification**: Could not determine intent automatically
**System Response**: Told them team will reach out

**Action**: Review message and respond appropriately

[Airtable: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO/${leadCtx.id}]`;
    break;
}

// Helper function
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

// ============================================================================
// OUTPUT
// ============================================================================

const output = {
  // Lead updates for Airtable
  lead_updates: leadUpdates,
  
  // Notification data
  should_notify_slack: shouldNotifySlack,
  slack_message: slackMessage,
  slack_priority: slackPriority,
  slack_channel: 'uysp-ops-alerts',  // TODO: Make configurable per client
  
  // Campaign management
  should_stop_campaign: shouldStopCampaign,
  should_mark_booked: shouldMarkBooked,
  should_mark_current_client: shouldMarkCurrentClient,
  
  // Follow-up management
  follow_up_required: followUpRequired,
  follow_up_type: followUpType,
  follow_up_date: followUpDate,
  follow_up_note: followUpNote,
  
  // Pass through for sending
  response_text: responseData.response_text,
  to_number: responseData.to_number,
  from_number: responseData.from_number,
  
  // Metadata
  action_executed: action,
  executed_at: now
};

console.log('=== ACTION HANDLER ===');
console.log(`Action: ${action}`);
console.log(`Updates: ${Object.keys(leadUpdates).length} fields`);
console.log(`Stop campaign: ${shouldStopCampaign}`);
console.log(`Notify Slack: ${shouldNotifySlack} (Priority: ${slackPriority})`);
console.log(`Follow-up required: ${followUpRequired}`);
if (followUpDate) {
  console.log(`Follow-up date: ${followUpDate}`);
}
console.log('=== END ===');

return [{ json: output }];

