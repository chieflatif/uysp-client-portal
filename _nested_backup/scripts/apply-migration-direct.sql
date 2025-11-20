-- UYSP Portal - Migration 0003: Airtable Sync Queue
-- Run this in Render Shell with: psql $DATABASE_URL -f scripts/apply-migration-direct.sql

-- Check if table already exists (to prevent duplicate errors)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'airtable_sync_queue'
    ) THEN
        -- Create the sync queue table
        CREATE TABLE "airtable_sync_queue" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "client_id" uuid NOT NULL,
            "table_name" varchar(100) NOT NULL,
            "record_id" varchar(100) NOT NULL,
            "operation" varchar(20) NOT NULL,
            "payload" jsonb NOT NULL,
            "status" varchar(50) DEFAULT 'pending' NOT NULL,
            "attempts" integer DEFAULT 0 NOT NULL,
            "max_attempts" integer DEFAULT 5 NOT NULL,
            "last_error" text,
            "last_attempt_at" timestamp,
            "next_retry_at" timestamp,
            "completed_at" timestamp,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
        );

        -- Add foreign key constraint
        ALTER TABLE "airtable_sync_queue"
        ADD CONSTRAINT "airtable_sync_queue_client_id_clients_id_fk"
        FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id")
        ON DELETE cascade ON UPDATE no action;

        -- Create indexes for performance
        CREATE INDEX "idx_sync_queue_status"
        ON "airtable_sync_queue" USING btree ("status","next_retry_at");

        CREATE INDEX "idx_sync_queue_client"
        ON "airtable_sync_queue" USING btree ("client_id","status");

        CREATE INDEX "idx_sync_queue_created"
        ON "airtable_sync_queue" USING btree ("created_at");

        RAISE NOTICE '✅ Successfully created airtable_sync_queue table and indexes';
    ELSE
        RAISE NOTICE '⚠️  Table airtable_sync_queue already exists, skipping creation';
    END IF;
END
$$;

-- Verify the table was created
SELECT
    'airtable_sync_queue' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('airtable_sync_queue')) as size
FROM airtable_sync_queue;

-- Show table structure
\d airtable_sync_queue
