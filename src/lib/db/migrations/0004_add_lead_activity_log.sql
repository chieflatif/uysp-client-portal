CREATE TABLE "campaign_tags_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"tags" jsonb NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_tags_cache_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "lead_activity_log" (
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
--> statement-breakpoint
CREATE TABLE "security_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid NOT NULL,
	"client_id" uuid,
	"ip_address" "inet",
	"user_agent" text,
	"metadata" jsonb,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" DROP CONSTRAINT "airtable_sync_queue_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ALTER COLUMN "last_attempt_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ALTER COLUMN "next_retry_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "airtable_record_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "client_project_blockers" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "client_project_blockers" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "client_project_blockers" ALTER COLUMN "resolved_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "client_project_status" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "client_project_status" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "client_project_tasks" ALTER COLUMN "due_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "client_project_tasks" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "client_project_tasks" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "client_project_tasks" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "client_project_tasks" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "last_sync_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "email_audit_log" ALTER COLUMN "sent_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_audit_log" ALTER COLUMN "sent_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "email_audit_log" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_audit_log" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "claimed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "last_message_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "sms_last_sent_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "booked_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "first_clicked_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "enrichment_attempted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sms_audit" ALTER COLUMN "sent_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_audit" ALTER COLUMN "delivery_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_audit" ALTER COLUMN "clicked_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_audit" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_audit" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sms_audit" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_audit" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sms_templates" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_templates" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sms_templates" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_templates" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_activity_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "session_start" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "session_start" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "session_end" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "last_activity" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "last_activity" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_sessions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_activity_summary" ALTER COLUMN "first_activity" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_summary" ALTER COLUMN "last_activity" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_summary" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_summary" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_activity_summary" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_activity_summary" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_login_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "campaign_type" varchar(50) DEFAULT 'Standard';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "form_id" varchar(255);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "webinar_datetime" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "zoom_link" varchar(500);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "resource_link" varchar(500);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "resource_name" varchar(255);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "auto_discovered" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "messages_sent" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "total_leads" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "booking_link" varchar(500);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "target_tags" text[];--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "messages" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "start_datetime" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "enrollment_status" varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "max_leads_to_enroll" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "leads_enrolled" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "last_enrollment_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "active_leads_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "completed_leads_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "opted_out_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "booked_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "last_activity_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "form_id" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "webinar_datetime" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "lead_source" varchar(50) DEFAULT 'Standard Form';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "kajabi_tags" text[];--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "engagement_level" varchar(50);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "campaign_history" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "enrolled_campaign_version" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "enrolled_message_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "enrolled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sms_templates" ADD COLUMN "template_type" varchar(50) DEFAULT 'Standard';--> statement-breakpoint
ALTER TABLE "campaign_tags_cache" ADD CONSTRAINT "campaign_tags_cache_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity_log" ADD CONSTRAINT "lead_activity_log_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity_log" ADD CONSTRAINT "lead_activity_log_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity_log" ADD CONSTRAINT "lead_activity_log_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tags_cache_client" ON "campaign_tags_cache" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_activity_lead_time" ON "lead_activity_log" USING btree ("lead_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_activity_lead_airtable" ON "lead_activity_log" USING btree ("lead_airtable_id");--> statement-breakpoint
CREATE INDEX "idx_activity_event_type" ON "lead_activity_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_activity_event_category" ON "lead_activity_log" USING btree ("event_category");--> statement-breakpoint
CREATE INDEX "idx_activity_timestamp" ON "lead_activity_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_activity_search" ON "lead_activity_log" USING gin (to_tsvector('english', "description" || ' ' || COALESCE("message_content", '')));--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "security_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "security_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_resource" ON "security_audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_client" ON "security_audit_log" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "security_audit_log" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "airtable_sync_queue" ADD CONSTRAINT "airtable_sync_queue_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaigns_form_id" ON "campaigns" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_type" ON "campaigns" USING btree ("campaign_type");--> statement-breakpoint
CREATE INDEX "idx_campaigns_active" ON "campaigns" USING btree ("is_paused");--> statement-breakpoint
CREATE INDEX "idx_campaigns_enrollment_status" ON "campaigns" USING btree ("enrollment_status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_start_datetime" ON "campaigns" USING btree ("start_datetime");--> statement-breakpoint
CREATE INDEX "idx_campaigns_target_tags" ON "campaigns" USING gin ("target_tags");--> statement-breakpoint
CREATE INDEX "idx_leads_form_id" ON "leads" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_leads_lead_source" ON "leads" USING btree ("lead_source");--> statement-breakpoint
CREATE INDEX "idx_leads_webinar_datetime" ON "leads" USING btree ("webinar_datetime");--> statement-breakpoint
CREATE INDEX "idx_leads_client_airtable" ON "leads" USING btree ("client_id","airtable_record_id");--> statement-breakpoint
CREATE INDEX "idx_leads_kajabi_tags" ON "leads" USING gin ("kajabi_tags");--> statement-breakpoint
CREATE INDEX "idx_leads_engagement_level" ON "leads" USING btree ("engagement_level");--> statement-breakpoint
CREATE INDEX "idx_sms_templates_type" ON "sms_templates" USING btree ("template_type");--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_airtable_record_id_unique" UNIQUE("airtable_record_id");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_airtable_base_id_unique" UNIQUE("airtable_base_id");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_airtable_record_id_unique" UNIQUE("airtable_record_id");