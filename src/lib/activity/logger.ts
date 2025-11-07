import { db } from '@/lib/db';
import { leadActivityLog, leads } from '@/lib/db/schema';
import { EVENT_TYPES, EVENT_CATEGORIES, EventType, EventCategory } from './event-types';
import { eq } from 'drizzle-orm';

/**
 * UI Logging Helper for Mini-CRM Activity Tracking
 *
 * This module provides helper functions for UI components to log lead activities.
 * These functions are server-side only (use in API routes, server actions, etc.).
 *
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.4
 */

interface LogActivityParams {
  eventType: EventType;
  eventCategory: EventCategory;
  leadId?: string; // PostgreSQL UUID (optional)
  leadAirtableId?: string; // Airtable record ID (optional)
  clientId?: string;
  description: string;
  messageContent?: string;
  metadata?: Record<string, any>;
  source: string;
  createdBy?: string;
  timestamp?: Date;
}

export interface LogActivityResult {
  success: boolean;
  activityId?: string;
  error?: string;
}

/**
 * Log a lead activity event
 *
 * This is a non-blocking function that logs activity to the database.
 * It will never throw errors to prevent breaking the application.
 *
 * Returns: { success: boolean, activityId?: string, error?: string }
 *
 * Usage:
 * ```ts
 * const result = await logLeadActivity({
 *   eventType: 'CAMPAIGN_ENROLLED',
 *   eventCategory: 'CAMPAIGN',
 *   leadId: lead.id,
 *   description: `Enrolled in ${campaign.name}`,
 *   metadata: { campaign_id: campaign.id },
 *   source: 'ui:campaign-enroll',
 *   createdBy: session.user.id
 * });
 *
 * if (result.success) {
 *   console.log('Activity logged:', result.activityId);
 * } else {
 *   console.error('Failed to log activity:', result.error);
 * }
 * ```
 */
export async function logLeadActivity(params: LogActivityParams): Promise<LogActivityResult> {
  try {
    // Require either leadId or leadAirtableId
    if (!params.leadId && !params.leadAirtableId) {
      console.error('[ACTIVITY-LOGGER] Must provide either leadId or leadAirtableId');
      return { success: false, error: 'Must provide either leadId or leadAirtableId' };
    }

    // Find lead if only Airtable ID provided
    let finalLeadId = params.leadId;
    if (!finalLeadId && params.leadAirtableId) {
      const lead = await db.query.leads.findFirst({
        where: eq(leads.airtableRecordId, params.leadAirtableId),
        columns: { id: true },
      });

      if (lead) {
        finalLeadId = lead.id;
      } else {
        console.warn('[ACTIVITY-LOGGER] Lead not found:', params.leadAirtableId);
        // Continue anyway - we'll log with Airtable ID only
      }
    }

    // Insert activity log and get the created activity ID
    const [activity] = await db
      .insert(leadActivityLog)
      .values({
        eventType: params.eventType,
        eventCategory: params.eventCategory,
        leadId: finalLeadId || null,
        leadAirtableId: params.leadAirtableId || null,
        clientId: params.clientId || null,
        description: params.description,
        messageContent: params.messageContent || null,
        metadata: params.metadata ? (params.metadata as any) : null,
        source: params.source,
        createdBy: params.createdBy || null,
        timestamp: params.timestamp || new Date(),
      })
      .returning({ id: leadActivityLog.id, timestamp: leadActivityLog.timestamp });

    // Update lead's last activity timestamp (if lead exists in PostgreSQL)
    // SECURITY: Use SAME timestamp as activity to prevent race condition (HIGH-005)
    if (finalLeadId) {
      await db
        .update(leads)
        .set({ lastActivityAt: activity.timestamp })
        .where(eq(leads.id, finalLeadId));
    }

    console.log('[ACTIVITY-LOGGER] Activity logged:', {
      activityId: activity.id,
      eventType: params.eventType,
      leadId: finalLeadId,
      description: params.description,
    });

    return { success: true, activityId: activity.id };
  } catch (error) {
    // CRITICAL: Activity logging must NEVER break the application
    console.error('[ACTIVITY-LOGGER] Failed to log event:', error);
    console.error('[ACTIVITY-LOGGER] Event params:', params);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Log multiple activities in batch
 *
 * This is useful when you need to log multiple events at once.
 * Failures in individual logs won't stop the batch.
 *
 * Returns: Array of results for each activity log attempt
 */
export async function logLeadActivitiesBatch(
  activities: LogActivityParams[]
): Promise<LogActivityResult[]> {
  const results: LogActivityResult[] = [];
  for (const activity of activities) {
    const result = await logLeadActivity(activity);
    results.push(result);
  }
  return results;
}

/**
 * Common activity logging shortcuts for UI actions
 * These make it easier to log common events with consistent formatting
 */

export async function logCampaignEnrolled(params: {
  leadId: string;
  campaignId: string;
  campaignName: string;
  createdBy?: string;
}) {
  return logLeadActivity({
    eventType: EVENT_TYPES.CAMPAIGN_ENROLLED,
    eventCategory: EVENT_CATEGORIES.CAMPAIGN,
    leadId: params.leadId,
    description: `Enrolled in campaign: ${params.campaignName}`,
    metadata: {
      campaign_id: params.campaignId,
      campaign_name: params.campaignName,
    },
    source: 'ui:campaign-enroll',
    createdBy: params.createdBy,
  });
}

export async function logCampaignRemoved(params: {
  leadId: string;
  campaignId: string;
  campaignName: string;
  reason?: string;
  createdBy?: string;
}) {
  return logLeadActivity({
    eventType: EVENT_TYPES.CAMPAIGN_REMOVED,
    eventCategory: EVENT_CATEGORIES.CAMPAIGN,
    leadId: params.leadId,
    description: `Removed from campaign: ${params.campaignName}${params.reason ? ` (${params.reason})` : ''}`,
    metadata: {
      campaign_id: params.campaignId,
      campaign_name: params.campaignName,
      reason: params.reason,
    },
    source: 'ui:campaign-remove',
    createdBy: params.createdBy,
  });
}

export async function logStatusChanged(params: {
  leadId: string;
  oldStatus: string;
  newStatus: string;
  createdBy?: string;
}) {
  return logLeadActivity({
    eventType: EVENT_TYPES.STATUS_CHANGED,
    eventCategory: EVENT_CATEGORIES.MANUAL,
    leadId: params.leadId,
    description: `Status changed: ${params.oldStatus} → ${params.newStatus}`,
    metadata: {
      old_status: params.oldStatus,
      new_status: params.newStatus,
    },
    source: 'ui:status-update',
    createdBy: params.createdBy,
  });
}

export async function logNoteAdded(params: {
  leadId: string;
  noteContent: string;
  createdBy?: string;
}) {
  return logLeadActivity({
    eventType: EVENT_TYPES.NOTE_ADDED,
    eventCategory: EVENT_CATEGORIES.MANUAL,
    leadId: params.leadId,
    description: 'Note added to lead',
    messageContent: params.noteContent,
    metadata: {
      note_length: params.noteContent.length,
    },
    source: 'ui:note-add',
    createdBy: params.createdBy,
  });
}

export async function logLeadClaimed(params: {
  leadId: string;
  claimedBy: string;
  claimedByName?: string;
}) {
  return logLeadActivity({
    eventType: EVENT_TYPES.LEAD_CLAIMED,
    eventCategory: EVENT_CATEGORIES.MANUAL,
    leadId: params.leadId,
    description: `Lead claimed${params.claimedByName ? ` by ${params.claimedByName}` : ''}`,
    metadata: {
      claimed_by: params.claimedBy,
      claimed_by_name: params.claimedByName,
    },
    source: 'ui:lead-claim',
    createdBy: params.claimedBy,
  });
}

export async function logBookingConfirmed(params: {
  leadId: string;
  bookingTime: Date;
  bookingType?: string;
  calendlyEventUri?: string;
}) {
  return logLeadActivity({
    eventType: EVENT_TYPES.BOOKING_CONFIRMED,
    eventCategory: EVENT_CATEGORIES.BOOKING,
    leadId: params.leadId,
    description: `Booking confirmed for ${params.bookingTime.toLocaleDateString()}`,
    metadata: {
      booking_time: params.bookingTime.toISOString(),
      booking_type: params.bookingType,
      calendly_event_uri: params.calendlyEventUri,
    },
    source: 'ui:booking-confirm',
  });
}
