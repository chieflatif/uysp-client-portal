import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  index,
  date,
  jsonb,
  inet,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ==============================================================================
// USERS TABLE
// ==============================================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    role: varchar('role', { length: 50 }).notNull().default('CLIENT_USER'), // SUPER_ADMIN, CLIENT_ADMIN, CLIENT_USER
    clientId: uuid('client_id'),
    isActive: boolean('is_active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    // SECURITY: Password setup token fields
    passwordSetupToken: varchar('password_setup_token', { length: 255 }),
    passwordSetupTokenExpiry: timestamp('password_setup_token_expiry', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }), // FIXED: Add timezone support
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    clientIdIdx: index('idx_users_client_id').on(table.clientId),
    setupTokenIdx: index('idx_users_setup_token').on(table.passwordSetupToken),
  })
);

// ==============================================================================
// CLIENTS TABLE
// ==============================================================================
export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    airtableBaseId: varchar('airtable_base_id', { length: 255 }).notNull().unique(), // FIXED: Add unique constraint
    isActive: boolean('is_active').notNull().default(true),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }), // FIXED: Add timezone support
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    airtableBaseIdx: index('idx_clients_airtable_base').on(table.airtableBaseId),
  })
);

// ==============================================================================
// LEADS TABLE
// ==============================================================================
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull(),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(), // FIXED: Add unique constraint for upsert conflict detection
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    company: varchar('company', { length: 255 }),
    title: varchar('title', { length: 255 }),
    icpScore: integer('icp_score').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull().default('New'),
    claimedBy: uuid('claimed_by'),
    claimedAt: timestamp('claimed_at', { withTimezone: true }), // FIXED: Add timezone support
    campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'set null' }), // Foreign key to campaigns table - ENFORCED: All leads must belong to a campaign
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }), // FIXED: Add timezone support
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }), // Mini-CRM: Last activity timestamp (updated by activity log)
    isActive: boolean('is_active').notNull().default(true),

    // Campaign & Sequence Tracking (from Airtable)
    campaignName: varchar('campaign_name', { length: 255 }), // Maps from "SMS Campaign ID"
    campaignVariant: varchar('campaign_variant', { length: 10 }), // A or B (from "SMS Variant")
    campaignBatch: varchar('campaign_batch', { length: 100 }), // From "SMS Batch Control"
    smsSequencePosition: integer('sms_sequence_position').default(0),
    smsSentCount: integer('sms_sent_count').default(0),
    smsLastSentAt: timestamp('sms_last_sent_at', { withTimezone: true }), // FIXED: Add timezone support - CRITICAL for SMS scheduling
    smsEligible: boolean('sms_eligible').default(true), // From "SMS Eligible"

    // Status Fields (from Airtable)
    processingStatus: varchar('processing_status', { length: 50 }),
    hrqStatus: varchar('hrq_status', { length: 50 }),
    smsStop: boolean('sms_stop').default(false),
    smsStopReason: varchar('sms_stop_reason', { length: 500 }),
    booked: boolean('booked').default(false),
    bookedAt: timestamp('booked_at', { withTimezone: true }), // FIXED: Add timezone support

    // Click Tracking (from Airtable)
    shortLinkId: varchar('short_link_id', { length: 100 }),
    shortLinkUrl: varchar('short_link_url', { length: 500 }),
    clickCount: integer('click_count').default(0),
    clickedLink: boolean('clicked_link').default(false),
    firstClickedAt: timestamp('first_clicked_at', { withTimezone: true }), // FIXED: Add timezone support

    // LinkedIn & Enrichment (from Airtable)
    linkedinUrl: varchar('linkedin_url', { length: 500 }), // From "Linkedin URL - Person"
    companyLinkedin: varchar('company_linkedin', { length: 500 }), // From "Company LinkedIn"
    enrichmentOutcome: varchar('enrichment_outcome', { length: 100 }), // Success, No Match, etc.
    enrichmentAttemptedAt: timestamp('enrichment_attempted_at', { withTimezone: true }), // FIXED: Add timezone support

    // NEW WEBINAR FIELDS (Phase A)
    formId: varchar('form_id', { length: 255 }),
    webinarDatetime: timestamp('webinar_datetime', { withTimezone: true }),
    leadSource: varchar('lead_source', { length: 50 }).default('Standard Form'),
    // REMOVED: campaignLinkId (legacy field, replaced by campaignId)

    // CUSTOM CAMPAIGNS FIELDS (Phase B)
    kajabiTags: text('kajabi_tags').array(), // Array of tags from Kajabi (imported from Airtable "Kajabi Tags")
    engagementLevel: varchar('engagement_level', { length: 50 }), // High/Medium/Low (from Airtable "Engagement - Level")

    // VERSIONING & COMPLETION TRACKING (Phase V2 - Migrations 0019, 0022, 0029)
    completedAt: timestamp('completed_at', { withTimezone: true }), // When lead completed their campaign sequence
    campaignHistory: jsonb('campaign_history').default('[]'), // Array of all campaigns lead has been through
    enrolledCampaignVersion: integer('enrolled_campaign_version'), // Snapshot of campaign.version at enrollment time
    enrolledMessageCount: integer('enrolled_message_count').default(0).notNull(), // Snapshot of message count at enrollment for version-aware de-enrollment
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }), // When lead was enrolled in their current campaign (migration 0029)

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    clientIdIdx: index('idx_leads_client_id').on(table.clientId),
    emailIdx: index('idx_leads_email').on(table.email),
    formIdIdx: index('idx_leads_form_id').on(table.formId), // NEW: For campaign lookup
    leadSourceIdx: index('idx_leads_lead_source').on(table.leadSource), // NEW: For scheduler routing
    webinarDatetimeIdx: index('idx_leads_webinar_datetime').on(table.webinarDatetime), // NEW: For timing logic
    // REMOVED: campaignLinkIdx (legacy field, replaced by campaignId index)
    statusIdx: index('idx_leads_status').on(table.status),
    claimedByIdx: index('idx_leads_claimed_by').on(table.claimedBy),
    airtableRecordIdx: index('idx_leads_airtable_record').on(table.airtableRecordId),
    campaignNameIdx: index('idx_leads_campaign_name').on(table.campaignName),
    campaignVariantIdx: index('idx_leads_campaign_variant').on(table.campaignVariant),
    processingStatusIdx: index('idx_leads_processing_status').on(table.processingStatus),
    smsSequenceIdx: index('idx_leads_sms_sequence').on(table.smsSequencePosition),
    enrichmentOutcomeIdx: index('idx_leads_enrichment_outcome').on(table.enrichmentOutcome),
    // PERFORMANCE FIX: Compound index for deletion query (clientId + airtableRecordId NOT IN)
    clientAirtableIdx: index('idx_leads_client_airtable').on(table.clientId, table.airtableRecordId),
    // CUSTOM CAMPAIGNS: GIN index for array operations on kajabi_tags
    kajabiTagsIdx: index('idx_leads_kajabi_tags').using('gin', sql`${table.kajabiTags}`),
    engagementLevelIdx: index('idx_leads_engagement_level').on(table.engagementLevel),
    // MINI-CRM: Index for sorting/filtering by last activity time
    lastActivityAtIdx: index('idx_leads_last_activity_at').on(table.lastActivityAt),
  })
);

// ==============================================================================
// SMS TEMPLATES TABLE (Synced from Airtable)
// ==============================================================================
export const smsTemplates = pgTable(
  'sms_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(),
    
    campaign: varchar('campaign', { length: 255 }).notNull(),
    variant: varchar('variant', { length: 10 }), // A or B
    step: integer('step').notNull(),
    delayDays: integer('delay_days'),
    fastDelayMinutes: integer('fast_delay_minutes'),
    body: text('body').notNull(),
    templateType: varchar('template_type', { length: 50 }).default('Standard'), // NEW: Webinar or Standard

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    campaignIdx: index('idx_sms_templates_campaign').on(table.campaign),
    stepIdx: index('idx_sms_templates_step').on(table.step),
    typeIdx: index('idx_sms_templates_type').on(table.templateType), // NEW: Index for filtering
  })
);

// ==============================================================================
// CAMPAIGNS TABLE
// ==============================================================================
export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(),
    messageTemplate: text('message_template'),
    sendInterval: integer('send_interval').default(3600), // seconds
    isPaused: boolean('is_paused').notNull().default(false),
    
    // NEW WEBINAR FIELDS (Phase A)
    campaignType: varchar('campaign_type', { length: 50 }).default('Standard'),
    formId: varchar('form_id', { length: 255 }),
    webinarDatetime: timestamp('webinar_datetime', { withTimezone: true }),
    zoomLink: varchar('zoom_link', { length: 500 }),
    resourceLink: varchar('resource_link', { length: 500 }),
    resourceName: varchar('resource_name', { length: 255 }),
    autoDiscovered: boolean('auto_discovered').default(false),
    messagesSent: integer('messages_sent').default(0),
    totalLeads: integer('total_leads').default(0),
    bookingLink: varchar('booking_link', { length: 500 }), // Calendly/booking link for AI message generation

    // CUSTOM CAMPAIGNS FIELDS (Phase B)
    targetTags: text('target_tags').array(), // Tags to filter leads by (for Custom campaigns)
    messages: jsonb('messages'), // Message sequence: [{step: 1, delayMinutes: 60, text: '...'}]
    startDatetime: timestamp('start_datetime', { withTimezone: true }), // When to start enrolling leads (null = immediate)
    enrollmentStatus: varchar('enrollment_status', { length: 50 }).default('active'), // 'scheduled', 'active', 'paused', 'completed'
    maxLeadsToEnroll: integer('max_leads_to_enroll'), // Optional cap on number of leads to enroll
    leadsEnrolled: integer('leads_enrolled').default(0), // Counter for enrolled leads

    // VERSIONING & STATS (Phase V2 - Migrations 0020, 0022)
    version: integer('version').default(1).notNull(), // Campaign version (increments on message edits)
    isActive: boolean('is_active').default(true), // Whether campaign accepts new enrollments (false = archived)
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }), // When campaign was deactivated/archived
    lastEnrollmentAt: timestamp('last_enrollment_at', { withTimezone: true }), // Most recent lead enrollment
    activeLeadsCount: integer('active_leads_count').default(0), // Real-time count of active leads
    completedLeadsCount: integer('completed_leads_count').default(0), // Count of leads who completed
    optedOutCount: integer('opted_out_count').default(0), // Count of leads who opted out
    bookedCount: integer('booked_count').default(0), // Count of leads who booked

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    clientIdIdx: index('idx_campaigns_client_id').on(table.clientId),
    formIdIdx: index('idx_campaigns_form_id').on(table.formId), // NEW: For lead routing
    typeIdx: index('idx_campaigns_type').on(table.campaignType), // NEW: For filtering
    activeIdx: index('idx_campaigns_active').on(table.isPaused), // NEW: For active campaign queries
    // CUSTOM CAMPAIGNS: Indexes for scheduling and enrollment
    enrollmentStatusIdx: index('idx_campaigns_enrollment_status').on(table.enrollmentStatus),
    startDatetimeIdx: index('idx_campaigns_start_datetime').on(table.startDatetime),
    targetTagsIdx: index('idx_campaigns_target_tags').using('gin', sql`${table.targetTags}`),
  })
);

// ==============================================================================
// NOTES TABLE
// ==============================================================================
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    content: text('content').notNull(),
    type: varchar('type', { length: 50 }).notNull(), // Call, Email, Text, Meeting, General, Issue, Success
    isPrivate: boolean('is_private').notNull().default(false),
    isSystemGenerated: boolean('is_system_generated').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    leadIdIdx: index('idx_notes_lead_id').on(table.leadId),
    createdByIdx: index('idx_notes_created_by').on(table.createdBy),
  })
);

// ==============================================================================
// SMS AUDIT TABLE (Synced from Airtable)
// ==============================================================================
export const smsAudit = pgTable(
  'sms_audit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(),
    
    // Message identification  
    smsCampaignId: varchar('sms_campaign_id', { length: 255 }), // "SMS Campaign ID" from Airtable - KEY FIELD
    phone: varchar('phone', { length: 50 }).notNull(),
    leadRecordId: varchar('lead_record_id', { length: 255 }), // Airtable Lead Record ID
    
    // Message details
    event: varchar('event', { length: 100 }),
    text: text('text'),
    status: varchar('status', { length: 50 }), // Sent, Delivered, Failed, etc.
    carrier: varchar('carrier', { length: 100 }),
    
    // Timestamps
    sentAt: timestamp('sent_at', { withTimezone: true }), // FIXED: Add timezone support
    deliveryAt: timestamp('delivery_at', { withTimezone: true }), // FIXED: Add timezone support
    clickedAt: timestamp('clicked_at', { withTimezone: true }), // FIXED: Add timezone support

    // Flags
    clicked: boolean('clicked').default(false),

    // Raw data
    webhookRaw: text('webhook_raw'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    phoneIdx: index('idx_sms_audit_phone').on(table.phone),
    leadRecordIdx: index('idx_sms_audit_lead_record').on(table.leadRecordId),
    smsCampaignIdx: index('idx_sms_audit_sms_campaign').on(table.smsCampaignId),
    sentAtIdx: index('idx_sms_audit_sent_at').on(table.sentAt),
  })
);

// ==============================================================================
// ACTIVITY LOG TABLE
// ==============================================================================
export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    clientId: uuid('client_id'),
    leadId: uuid('lead_id'),
    action: varchar('action', { length: 255 }).notNull(),
    details: text('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    userIdIdx: index('idx_activity_user_id').on(table.userId),
    clientIdIdx: index('idx_activity_client_id').on(table.clientId),
    leadIdIdx: index('idx_activity_lead_id').on(table.leadId),
  })
);

// ==============================================================================
// PROJECT MANAGEMENT TABLES (Synced from Airtable)
// ==============================================================================
export const clientProjectTasks = pgTable(
  'client_project_tasks',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    clientId: uuid('client_id').notNull(),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(),
    task: varchar('task', { length: 500 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    priority: varchar('priority', { length: 50 }).notNull(),
    taskType: varchar('task_type', { length: 50 }).notNull().default('Task'), // Feature, Bug, Task, Improvement, Documentation, Research
    owner: varchar('owner', { length: 100 }),
    dueDate: timestamp('due_date', { withTimezone: true }), // FIXED: Add timezone support - CRITICAL for task scheduling
    notes: text('notes'),
    dependencies: text('dependencies'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    clientIdIdx: index('idx_project_tasks_client_id').on(table.clientId),
    statusIdx: index('idx_project_tasks_status').on(table.status),
    priorityIdx: index('idx_project_tasks_priority').on(table.priority),
    typeIdx: index('idx_project_tasks_type').on(table.taskType),
    airtableRecordIdx: index('idx_project_tasks_airtable_record').on(table.airtableRecordId),
  })
);

export const clientProjectBlockers = pgTable(
  'client_project_blockers',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    clientId: uuid('client_id').notNull(),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(),
    blocker: varchar('blocker', { length: 500 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull(),
    actionToResolve: text('action_to_resolve'),
    status: varchar('status', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    resolvedAt: timestamp('resolved_at', { withTimezone: true }), // FIXED: Add timezone support
  },
  (table) => ({
    clientIdIdx: index('idx_project_blockers_client_id').on(table.clientId),
    severityIdx: index('idx_project_blockers_severity').on(table.severity),
    statusIdx: index('idx_project_blockers_status').on(table.status),
    airtableRecordIdx: index('idx_project_blockers_airtable_record').on(table.airtableRecordId),
  })
);

export const clientProjectStatus = pgTable(
  'client_project_status',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    clientId: uuid('client_id').notNull(),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(),
    metric: varchar('metric', { length: 200 }).notNull(),
    value: text('value').notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    displayOrder: integer('display_order'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    clientIdIdx: index('idx_project_status_client_id').on(table.clientId),
    categoryIdx: index('idx_project_status_category').on(table.category),
    airtableRecordIdx: index('idx_project_status_airtable_record').on(table.airtableRecordId),
  })
);

// ==============================================================================
// TYPES EXPORTS
// ==============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type NewActivityLogEntry = typeof activityLog.$inferInsert;

export type SmsAudit = typeof smsAudit.$inferSelect;
export type NewSmsAudit = typeof smsAudit.$inferInsert;

export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type NewSmsTemplate = typeof smsTemplates.$inferInsert;

export type ClientProjectTask = typeof clientProjectTasks.$inferSelect;
export type NewClientProjectTask = typeof clientProjectTasks.$inferInsert;

export type ClientProjectBlocker = typeof clientProjectBlockers.$inferSelect;
export type NewClientProjectBlocker = typeof clientProjectBlockers.$inferInsert;

export type ClientProjectStatus = typeof clientProjectStatus.$inferSelect;
export type NewClientProjectStatus = typeof clientProjectStatus.$inferInsert;

// ==============================================================================
// USER ACTIVITY TRACKING TABLES
// ==============================================================================

export const userActivityLogs = pgTable(
  'user_activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    clientId: uuid('client_id'),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    eventCategory: varchar('event_category', { length: 50 }),
    eventData: jsonb('event_data'),
    pageUrl: varchar('page_url', { length: 500 }),
    referrer: varchar('referrer', { length: 500 }),
    sessionId: varchar('session_id', { length: 100 }),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    browser: varchar('browser', { length: 50 }),
    deviceType: varchar('device_type', { length: 50 }),
    os: varchar('os', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    userIdIdx: index('idx_activity_logs_user_id').on(table.userId, table.createdAt),
    clientIdIdx: index('idx_activity_logs_client_id').on(table.clientId, table.createdAt),
    eventTypeIdx: index('idx_activity_logs_event_type').on(table.eventType),
    eventCategoryIdx: index('idx_activity_logs_event_category').on(table.eventCategory),
    sessionIdIdx: index('idx_activity_logs_session_id').on(table.sessionId),
    createdAtIdx: index('idx_activity_logs_created_at').on(table.createdAt),
  })
);

export const userActivitySessions = pgTable(
  'user_activity_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: varchar('session_id', { length: 100 }).notNull().unique(),
    userId: uuid('user_id').notNull(),
    clientId: uuid('client_id'),
    sessionStart: timestamp('session_start', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    sessionEnd: timestamp('session_end', { withTimezone: true }), // FIXED: Add timezone support
    lastActivity: timestamp('last_activity', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    pageViews: integer('page_views').default(0),
    durationSeconds: integer('duration_seconds'),
    deviceType: varchar('device_type', { length: 50 }),
    browser: varchar('browser', { length: 50 }),
    os: varchar('os', { length: 50 }),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    userIdIdx: index('idx_activity_sessions_user_id').on(table.userId, table.sessionStart),
    clientIdIdx: index('idx_activity_sessions_client_id').on(table.clientId, table.sessionStart),
    sessionIdIdx: index('idx_activity_sessions_session_id').on(table.sessionId),
    startIdx: index('idx_activity_sessions_start').on(table.sessionStart),
    endIdx: index('idx_activity_sessions_end').on(table.sessionEnd),
  })
);

export const userActivitySummary = pgTable(
  'user_activity_summary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    clientId: uuid('client_id'),
    activityDate: date('activity_date').notNull(),
    totalSessions: integer('total_sessions').default(0),
    totalPageViews: integer('total_page_views').default(0),
    totalEvents: integer('total_events').default(0),
    totalDurationSeconds: integer('total_duration_seconds').default(0),
    firstActivity: timestamp('first_activity', { withTimezone: true }), // FIXED: Add timezone support
    lastActivity: timestamp('last_activity', { withTimezone: true }), // FIXED: Add timezone support
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    userDateIdx: index('idx_summary_user_date').on(table.userId, table.activityDate),
    clientDateIdx: index('idx_summary_client_date').on(table.clientId, table.activityDate),
    dateIdx: index('idx_summary_date').on(table.activityDate),
  })
);

// Type exports for activity tracking
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type NewUserActivityLog = typeof userActivityLogs.$inferInsert;

export type UserActivitySession = typeof userActivitySessions.$inferSelect;
export type NewUserActivitySession = typeof userActivitySessions.$inferInsert;

export type UserActivitySummary = typeof userActivitySummary.$inferSelect;
export type NewUserActivitySummary = typeof userActivitySummary.$inferInsert;

// ==============================================================================
// LEAD ACTIVITY LOG (Mini-CRM Activity Tracking)
// ==============================================================================

export const leadActivityLog = pgTable(
  'lead_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Event Classification
    eventType: varchar('event_type', { length: 100 }).notNull(),
    eventCategory: varchar('event_category', { length: 50 }).notNull(),

    // Lead Context
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    leadAirtableId: varchar('lead_airtable_id', { length: 255 }),
    clientId: uuid('client_id').references(() => clients.id),

    // Event Details
    description: text('description').notNull(),
    messageContent: text('message_content'),
    metadata: jsonb('metadata'),

    // Source Attribution
    source: varchar('source', { length: 100 }).notNull(),
    executionId: varchar('execution_id', { length: 255 }),
    createdBy: uuid('created_by').references(() => users.id),

    // Timestamps
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Performance indexes
    leadIdTimeIdx: index('idx_activity_lead_time').on(table.leadId, table.timestamp),
    leadAirtableIdx: index('idx_activity_lead_airtable').on(table.leadAirtableId),
    eventTypeIdx: index('idx_activity_event_type').on(table.eventType),
    eventCategoryIdx: index('idx_activity_event_category').on(table.eventCategory),
    timestampIdx: index('idx_activity_timestamp').on(table.timestamp),
    // Full-text search index on description + messageContent
    searchIdx: index('idx_activity_search').using(
      'gin',
      sql`to_tsvector('english', ${table.description} || ' ' || COALESCE(${table.messageContent}, ''))`
    ),
  })
);

export type LeadActivity = typeof leadActivityLog.$inferSelect;
export type NewLeadActivity = typeof leadActivityLog.$inferInsert;

// ==============================================================================
// EMAIL AUDIT LOG
// ==============================================================================

export const emailAuditLog = pgTable(
  'email_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailType: varchar('email_type', { length: 100 }).notNull(),
    recipient: varchar('recipient', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    sentByUserId: uuid('sent_by_user_id'),
    clientId: uuid('client_id'),
    status: varchar('status', { length: 50 }).notNull().default('sent'),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata'),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    recipientIdx: index('idx_email_audit_recipient').on(table.recipient, table.sentAt),
    typeIdx: index('idx_email_audit_type').on(table.emailType, table.sentAt),
    clientIdx: index('idx_email_audit_client').on(table.clientId, table.sentAt),
    userIdx: index('idx_email_audit_user').on(table.sentByUserId, table.sentAt),
    statusIdx: index('idx_email_audit_status').on(table.status, table.sentAt),
    sentAtIdx: index('idx_email_audit_sent_at').on(table.sentAt),
  })
);

export type EmailAuditLog = typeof emailAuditLog.$inferSelect;
export type NewEmailAuditLog = typeof emailAuditLog.$inferInsert;

// ==============================================================================
// CAMPAIGN TAGS CACHE (Auto-discovered from Leads)
// ==============================================================================

export const campaignTagsCache = pgTable(
  'campaign_tags_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().unique().references(() => clients.id, { onDelete: 'cascade' }),
    tags: jsonb('tags').notNull(), // JSON array of tag strings
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('idx_tags_cache_client').on(table.clientId),
  })
);

export type CampaignTagsCache = typeof campaignTagsCache.$inferSelect;
export type NewCampaignTagsCache = typeof campaignTagsCache.$inferInsert;

// ==============================================================================
// AIRTABLE SYNC QUEUE (Retry Failed Updates)
// ==============================================================================

export const airtableSyncQueue = pgTable(
  'airtable_sync_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }), // FIXED: Prevent accidental deletion
    tableName: varchar('table_name', { length: 100 }).notNull(), // 'Tasks', 'Blockers', etc.
    recordId: varchar('record_id', { length: 100 }).notNull(), // Airtable record ID
    operation: varchar('operation', { length: 20 }).notNull(), // 'update', 'create', 'delete'
    payload: jsonb('payload').notNull(), // Data to sync to Airtable
    status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'processing', 'failed', 'completed'
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    lastError: text('last_error'),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }), // FIXED: Add timezone support
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }), // FIXED: Add timezone support - CRITICAL for retry scheduling
    completedAt: timestamp('completed_at', { withTimezone: true }), // FIXED: Add timezone support
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    statusIdx: index('idx_sync_queue_status').on(table.status, table.nextRetryAt),
    clientIdx: index('idx_sync_queue_client').on(table.clientId, table.status),
    createdIdx: index('idx_sync_queue_created').on(table.createdAt),
  })
);

export type AirtableSyncQueue = typeof airtableSyncQueue.$inferSelect;
export type NewAirtableSyncQueue = typeof airtableSyncQueue.$inferInsert;

// ==============================================================================
// SECURITY AUDIT LOG TABLE
// ==============================================================================
export const securityAuditLog = pgTable(
  'security_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // Who performed the action
    userRole: varchar('user_role', { length: 50 }).notNull(), // Role at time of action
    action: varchar('action', { length: 100 }).notNull(), // 'PASSWORD_RESET', 'USER_CREATED', 'USER_DEACTIVATED', etc.
    resourceType: varchar('resource_type', { length: 50 }).notNull(), // 'USER', 'CLIENT', 'LEAD', etc.
    resourceId: uuid('resource_id').notNull(), // ID of affected resource
    clientId: uuid('client_id'), // Client context (null for SUPER_ADMIN actions)
    ipAddress: inet('ip_address'), // IP address of request
    userAgent: text('user_agent'), // Browser/client info
    metadata: jsonb('metadata'), // Additional context (non-sensitive)
    success: boolean('success').notNull().default(true), // Was action successful?
    errorMessage: text('error_message'), // If failed, why?
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // FIXED: Add timezone support
  },
  (table) => ({
    userIdx: index('idx_audit_user').on(table.userId),
    actionIdx: index('idx_audit_action').on(table.action),
    resourceIdx: index('idx_audit_resource').on(table.resourceType, table.resourceId),
    clientIdx: index('idx_audit_client').on(table.clientId),
    createdIdx: index('idx_audit_created').on(table.createdAt),
  })
);

export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type NewSecurityAuditLog = typeof securityAuditLog.$inferInsert;
