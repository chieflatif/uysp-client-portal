-- ============================================================================
-- Mini-CRM Activity Logging - Combined Migrations
-- Apply these migrations to enable Mini-CRM features
-- ============================================================================
-- Migration 0004: Add lead_activity_log table
-- Migration 0005: Add last_activity_at index
-- ============================================================================

-- Create lead_activity_log table
CREATE TABLE IF NOT EXISTS "lead_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_category" varchar(50) NOT NULL,
	"lead_id" uuid,
	"lead_airtable_id" varchar(255),
	"client_id" uuid,
	"description" text NOT NULL,
	"message_content" text,
	"metadata" jsonb,
	"source" varchar(100) NOT NULL,
	"execution_id" varchar(255),
	"created_by" uuid,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "lead_activity_log"
ADD CONSTRAINT "lead_activity_log_lead_id_leads_id_fk"
FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "lead_activity_log"
ADD CONSTRAINT "lead_activity_log_client_id_clients_id_fk"
FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id")
ON DELETE no action ON UPDATE no action;

ALTER TABLE "lead_activity_log"
ADD CONSTRAINT "lead_activity_log_created_by_users_id_fk"
FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
ON DELETE no action ON UPDATE no action;

-- Create indexes for lead_activity_log
CREATE INDEX IF NOT EXISTS "idx_activity_lead_time" ON "lead_activity_log" USING btree ("lead_id","timestamp");
CREATE INDEX IF NOT EXISTS "idx_activity_lead_airtable" ON "lead_activity_log" USING btree ("lead_airtable_id");
CREATE INDEX IF NOT EXISTS "idx_activity_event_type" ON "lead_activity_log" USING btree ("event_type");
CREATE INDEX IF NOT EXISTS "idx_activity_event_category" ON "lead_activity_log" USING btree ("event_category");
CREATE INDEX IF NOT EXISTS "idx_activity_timestamp" ON "lead_activity_log" USING btree ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_activity_search" ON "lead_activity_log" USING gin (to_tsvector('english', "description" || ' ' || COALESCE("message_content", '')));

-- Add last_activity_at column to leads table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE "leads" ADD COLUMN "last_activity_at" timestamp with time zone;
    END IF;
END $$;

-- Create index for last_activity_at
CREATE INDEX IF NOT EXISTS "idx_leads_last_activity_at" ON "leads" USING btree ("last_activity_at");

-- Verify table was created
SELECT 'Mini-CRM migrations applied successfully!' as status;
SELECT COUNT(*) as lead_activity_log_count FROM lead_activity_log;
