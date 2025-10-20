import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  boolean, 
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';

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
    role: varchar('role', { length: 50 }).notNull().default('CLIENT'), // SUPER_ADMIN, ADMIN, CLIENT
    clientId: uuid('client_id'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    clientIdIdx: index('idx_users_client_id').on(table.clientId),
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
    airtableBaseId: varchar('airtable_base_id', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastSyncAt: timestamp('last_sync_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    company: varchar('company', { length: 255 }),
    title: varchar('title', { length: 255 }),
    icpScore: integer('icp_score').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull().default('New'),
    claimedBy: uuid('claimed_by'),
    claimedAt: timestamp('claimed_at'),
    campaignId: uuid('campaign_id'),
    lastMessageAt: timestamp('last_message_at'),
    isActive: boolean('is_active').notNull().default(true),
    
    // Campaign & Sequence Tracking (from Airtable)
    campaignName: varchar('campaign_name', { length: 255 }), // Maps from "SMS Campaign ID"
    campaignVariant: varchar('campaign_variant', { length: 10 }), // A or B (from "SMS Variant")
    campaignBatch: varchar('campaign_batch', { length: 100 }), // From "SMS Batch Control"
    smsSequencePosition: integer('sms_sequence_position').default(0),
    smsSentCount: integer('sms_sent_count').default(0),
    smsLastSentAt: timestamp('sms_last_sent_at'),
    smsEligible: boolean('sms_eligible').default(true), // From "SMS Eligible"
    
    // Status Fields (from Airtable)
    processingStatus: varchar('processing_status', { length: 50 }),
    hrqStatus: varchar('hrq_status', { length: 50 }),
    smsStop: boolean('sms_stop').default(false),
    smsStopReason: varchar('sms_stop_reason', { length: 500 }),
    booked: boolean('booked').default(false),
    bookedAt: timestamp('booked_at'),
    
    // Click Tracking (from Airtable)
    shortLinkId: varchar('short_link_id', { length: 100 }),
    shortLinkUrl: varchar('short_link_url', { length: 500 }),
    clickCount: integer('click_count').default(0),
    clickedLink: boolean('clicked_link').default(false),
    firstClickedAt: timestamp('first_clicked_at'),
    
    // LinkedIn & Enrichment (from Airtable)
    linkedinUrl: varchar('linkedin_url', { length: 500 }), // From "Linkedin URL - Person"
    companyLinkedin: varchar('company_linkedin', { length: 500 }), // From "Company LinkedIn"
    enrichmentOutcome: varchar('enrichment_outcome', { length: 100 }), // Success, No Match, etc.
    enrichmentAttemptedAt: timestamp('enrichment_attempted_at'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('idx_leads_client_id').on(table.clientId),
    emailIdx: index('idx_leads_email').on(table.email),
    statusIdx: index('idx_leads_status').on(table.status),
    claimedByIdx: index('idx_leads_claimed_by').on(table.claimedBy),
    airtableRecordIdx: index('idx_leads_airtable_record').on(table.airtableRecordId),
    campaignNameIdx: index('idx_leads_campaign_name').on(table.campaignName),
    campaignVariantIdx: index('idx_leads_campaign_variant').on(table.campaignVariant),
    processingStatusIdx: index('idx_leads_processing_status').on(table.processingStatus),
    smsSequenceIdx: index('idx_leads_sms_sequence').on(table.smsSequencePosition),
    enrichmentOutcomeIdx: index('idx_leads_enrichment_outcome').on(table.enrichmentOutcome),
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
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    campaignIdx: index('idx_sms_templates_campaign').on(table.campaign),
    stepIdx: index('idx_sms_templates_step').on(table.step),
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
    airtableRecordId: varchar('airtable_record_id', { length: 255 }),
    messageTemplate: text('message_template'),
    sendInterval: integer('send_interval').default(3600), // seconds
    isPaused: boolean('is_paused').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('idx_campaigns_client_id').on(table.clientId),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
    sentAt: timestamp('sent_at'),
    deliveryAt: timestamp('delivery_at'),
    clickedAt: timestamp('clicked_at'),
    
    // Flags
    clicked: boolean('clicked').default(false),
    
    // Raw data
    webhookRaw: text('webhook_raw'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_activity_user_id').on(table.userId),
    clientIdIdx: index('idx_activity_client_id').on(table.clientId),
    leadIdIdx: index('idx_activity_lead_id').on(table.leadId),
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
