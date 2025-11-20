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
--> statement-breakpoint
CREATE TABLE "email_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_type" varchar(100) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"sent_by_user_id" uuid,
	"client_id" uuid,
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"event_category" varchar(50),
	"event_data" jsonb,
	"page_url" varchar(500),
	"referrer" varchar(500),
	"session_id" varchar(100),
	"ip_address" "inet",
	"user_agent" text,
	"browser" varchar(50),
	"device_type" varchar(50),
	"os" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid,
	"session_start" timestamp DEFAULT now() NOT NULL,
	"session_end" timestamp,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"page_views" integer DEFAULT 0,
	"duration_seconds" integer,
	"device_type" varchar(50),
	"browser" varchar(50),
	"os" varchar(50),
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_activity_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "user_activity_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid,
	"activity_date" date NOT NULL,
	"total_sessions" integer DEFAULT 0,
	"total_page_views" integer DEFAULT 0,
	"total_events" integer DEFAULT 0,
	"total_duration_seconds" integer DEFAULT 0,
	"first_activity" timestamp,
	"last_activity" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CLIENT_USER';--> statement-breakpoint
ALTER TABLE "client_project_tasks" ADD COLUMN "task_type" varchar(50) DEFAULT 'Task' NOT NULL;--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ADD CONSTRAINT "airtable_sync_queue_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sync_queue_status" ON "airtable_sync_queue" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_client" ON "airtable_sync_queue" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_created" ON "airtable_sync_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_email_audit_recipient" ON "email_audit_log" USING btree ("recipient","sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_audit_type" ON "email_audit_log" USING btree ("email_type","sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_audit_client" ON "email_audit_log" USING btree ("client_id","sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_audit_user" ON "email_audit_log" USING btree ("sent_by_user_id","sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_audit_status" ON "email_audit_log" USING btree ("status","sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_audit_sent_at" ON "email_audit_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_user_id" ON "user_activity_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_client_id" ON "user_activity_logs" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_event_type" ON "user_activity_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_event_category" ON "user_activity_logs" USING btree ("event_category");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_session_id" ON "user_activity_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_created_at" ON "user_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_sessions_user_id" ON "user_activity_sessions" USING btree ("user_id","session_start");--> statement-breakpoint
CREATE INDEX "idx_activity_sessions_client_id" ON "user_activity_sessions" USING btree ("client_id","session_start");--> statement-breakpoint
CREATE INDEX "idx_activity_sessions_session_id" ON "user_activity_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_activity_sessions_start" ON "user_activity_sessions" USING btree ("session_start");--> statement-breakpoint
CREATE INDEX "idx_activity_sessions_end" ON "user_activity_sessions" USING btree ("session_end");--> statement-breakpoint
CREATE INDEX "idx_summary_user_date" ON "user_activity_summary" USING btree ("user_id","activity_date");--> statement-breakpoint
CREATE INDEX "idx_summary_client_date" ON "user_activity_summary" USING btree ("client_id","activity_date");--> statement-breakpoint
CREATE INDEX "idx_summary_date" ON "user_activity_summary" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "idx_project_tasks_type" ON "client_project_tasks" USING btree ("task_type");