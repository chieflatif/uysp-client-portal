/**
 * Event Types and Categories for Mini-CRM Activity Logging
 *
 * This file defines all event types that can be logged in the lead_activity_log table.
 * Each event type is associated with a category for filtering and organization.
 *
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.2
 */

export const EVENT_TYPES = {
  // SMS Events
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_FAILED: 'MESSAGE_FAILED',
  MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
  INBOUND_REPLY: 'INBOUND_REPLY',
  LINK_CLICKED: 'LINK_CLICKED',
  OPT_OUT: 'OPT_OUT',

  // Campaign Events
  CAMPAIGN_ENROLLED: 'CAMPAIGN_ENROLLED',
  CAMPAIGN_REMOVED: 'CAMPAIGN_REMOVED',
  CAMPAIGN_COMPLETED: 'CAMPAIGN_COMPLETED',

  // Booking Events
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED: 'BOOKING_RESCHEDULED',

  // Manual Events
  STATUS_CHANGED: 'STATUS_CHANGED',
  NOTE_ADDED: 'NOTE_ADDED',
  LEAD_CLAIMED: 'LEAD_CLAIMED',

  // Two-Way Conversation Events (Future)
  AI_RESPONSE_SENT: 'AI_RESPONSE_SENT',
  QUALIFYING_QUESTION_ASKED: 'QUALIFYING_QUESTION_ASKED',
  QUALIFYING_ANSWER_CAPTURED: 'QUALIFYING_ANSWER_CAPTURED',
  NURTURE_SCHEDULED: 'NURTURE_SCHEDULED',
  CIRCUIT_BREAKER_TRIGGERED: 'CIRCUIT_BREAKER_TRIGGERED',
  CONVERSATION_ESCALATED: 'CONVERSATION_ESCALATED',

  // System Events
  ENRICHMENT_COMPLETED: 'ENRICHMENT_COMPLETED',
  ICP_SCORE_UPDATED: 'ICP_SCORE_UPDATED',
} as const;

export const EVENT_CATEGORIES = {
  SMS: 'SMS',
  CAMPAIGN: 'CAMPAIGN',
  BOOKING: 'BOOKING',
  CONVERSATION: 'CONVERSATION',
  MANUAL: 'MANUAL',
  SYSTEM: 'SYSTEM',
} as const;

// Type exports for TypeScript type safety
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export type EventCategory = typeof EVENT_CATEGORIES[keyof typeof EVENT_CATEGORIES];

/**
 * Maps event types to their respective categories
 * Useful for automatic categorization and validation
 */
export const EVENT_TYPE_TO_CATEGORY: Record<EventType, EventCategory> = {
  // SMS
  MESSAGE_SENT: EVENT_CATEGORIES.SMS,
  MESSAGE_FAILED: EVENT_CATEGORIES.SMS,
  MESSAGE_DELIVERED: EVENT_CATEGORIES.SMS,
  INBOUND_REPLY: EVENT_CATEGORIES.SMS,
  LINK_CLICKED: EVENT_CATEGORIES.SMS,
  OPT_OUT: EVENT_CATEGORIES.SMS,

  // Campaign
  CAMPAIGN_ENROLLED: EVENT_CATEGORIES.CAMPAIGN,
  CAMPAIGN_REMOVED: EVENT_CATEGORIES.CAMPAIGN,
  CAMPAIGN_COMPLETED: EVENT_CATEGORIES.CAMPAIGN,

  // Booking
  BOOKING_CONFIRMED: EVENT_CATEGORIES.BOOKING,
  BOOKING_CANCELLED: EVENT_CATEGORIES.BOOKING,
  BOOKING_RESCHEDULED: EVENT_CATEGORIES.BOOKING,

  // Manual
  STATUS_CHANGED: EVENT_CATEGORIES.MANUAL,
  NOTE_ADDED: EVENT_CATEGORIES.MANUAL,
  LEAD_CLAIMED: EVENT_CATEGORIES.MANUAL,

  // Conversation
  AI_RESPONSE_SENT: EVENT_CATEGORIES.CONVERSATION,
  QUALIFYING_QUESTION_ASKED: EVENT_CATEGORIES.CONVERSATION,
  QUALIFYING_ANSWER_CAPTURED: EVENT_CATEGORIES.CONVERSATION,
  NURTURE_SCHEDULED: EVENT_CATEGORIES.CONVERSATION,
  CIRCUIT_BREAKER_TRIGGERED: EVENT_CATEGORIES.CONVERSATION,
  CONVERSATION_ESCALATED: EVENT_CATEGORIES.CONVERSATION,

  // System
  ENRICHMENT_COMPLETED: EVENT_CATEGORIES.SYSTEM,
  ICP_SCORE_UPDATED: EVENT_CATEGORIES.SYSTEM,
};

/**
 * Human-readable labels for event types (for UI display)
 */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  MESSAGE_SENT: 'SMS Sent',
  MESSAGE_FAILED: 'SMS Failed',
  MESSAGE_DELIVERED: 'SMS Delivered',
  INBOUND_REPLY: 'Inbound Reply',
  LINK_CLICKED: 'Link Clicked',
  OPT_OUT: 'Opted Out',

  CAMPAIGN_ENROLLED: 'Campaign Enrolled',
  CAMPAIGN_REMOVED: 'Campaign Removed',
  CAMPAIGN_COMPLETED: 'Campaign Completed',

  BOOKING_CONFIRMED: 'Booking Confirmed',
  BOOKING_CANCELLED: 'Booking Cancelled',
  BOOKING_RESCHEDULED: 'Booking Rescheduled',

  STATUS_CHANGED: 'Status Changed',
  NOTE_ADDED: 'Note Added',
  LEAD_CLAIMED: 'Lead Claimed',

  AI_RESPONSE_SENT: 'AI Response Sent',
  QUALIFYING_QUESTION_ASKED: 'Qualifying Question Asked',
  QUALIFYING_ANSWER_CAPTURED: 'Qualifying Answer Captured',
  NURTURE_SCHEDULED: 'Nurture Scheduled',
  CIRCUIT_BREAKER_TRIGGERED: 'Circuit Breaker Triggered',
  CONVERSATION_ESCALATED: 'Conversation Escalated',

  ENRICHMENT_COMPLETED: 'Enrichment Completed',
  ICP_SCORE_UPDATED: 'ICP Score Updated',
};

/**
 * Human-readable labels for event categories (for UI display)
 */
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  SMS: 'SMS Communication',
  CAMPAIGN: 'Campaign Management',
  BOOKING: 'Booking & Calendar',
  CONVERSATION: 'AI Conversation',
  MANUAL: 'Manual Action',
  SYSTEM: 'System Event',
};

/**
 * Icon mappings for event types (for UI display)
 * Using emoji for simplicity; can be replaced with icon library
 */
export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  MESSAGE_SENT: '💬',
  MESSAGE_FAILED: '❌',
  MESSAGE_DELIVERED: '✅',
  INBOUND_REPLY: '📥',
  LINK_CLICKED: '🔗',
  OPT_OUT: '🚫',

  CAMPAIGN_ENROLLED: '📊',
  CAMPAIGN_REMOVED: '📤',
  CAMPAIGN_COMPLETED: '🎉',

  BOOKING_CONFIRMED: '📅',
  BOOKING_CANCELLED: '❌',
  BOOKING_RESCHEDULED: '🔄',

  STATUS_CHANGED: '🔄',
  NOTE_ADDED: '📝',
  LEAD_CLAIMED: '👤',

  AI_RESPONSE_SENT: '🤖',
  QUALIFYING_QUESTION_ASKED: '❓',
  QUALIFYING_ANSWER_CAPTURED: '💡',
  NURTURE_SCHEDULED: '⏰',
  CIRCUIT_BREAKER_TRIGGERED: '⚠️',
  CONVERSATION_ESCALATED: '🆙',

  ENRICHMENT_COMPLETED: '✨',
  ICP_SCORE_UPDATED: '📈',
};

/**
 * Color mappings for event categories (for UI display)
 * Using Tailwind CSS color classes
 */
export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  SMS: 'blue',
  CAMPAIGN: 'purple',
  BOOKING: 'green',
  CONVERSATION: 'cyan',
  MANUAL: 'orange',
  SYSTEM: 'gray',
};
