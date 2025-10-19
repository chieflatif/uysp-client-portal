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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('idx_leads_client_id').on(table.clientId),
    emailIdx: index('idx_leads_email').on(table.email),
    statusIdx: index('idx_leads_status').on(table.status),
    claimedByIdx: index('idx_leads_claimed_by').on(table.claimedBy),
    airtableRecordIdx: index('idx_leads_airtable_record').on(table.airtableRecordId),
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
