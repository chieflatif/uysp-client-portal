CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"client_id" uuid,
	"lead_id" uuid,
	"action" varchar(255) NOT NULL,
	"details" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"airtable_record_id" varchar(255),
	"message_template" text,
	"send_interval" integer DEFAULT 3600,
	"is_paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"airtable_base_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"airtable_record_id" varchar(255) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"company" varchar(255),
	"title" varchar(255),
	"icp_score" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'New' NOT NULL,
	"claimed_by" uuid,
	"claimed_at" timestamp,
	"campaign_id" uuid,
	"last_message_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"campaign_name" varchar(255),
	"campaign_batch" varchar(100),
	"sms_sequence_position" integer DEFAULT 0,
	"sms_sent_count" integer DEFAULT 0,
	"sms_last_sent_at" timestamp,
	"processing_status" varchar(50),
	"hrq_status" varchar(50),
	"sms_stop" boolean DEFAULT false,
	"sms_stop_reason" varchar(500),
	"booked" boolean DEFAULT false,
	"booked_at" timestamp,
	"short_link_id" varchar(100),
	"short_link_url" varchar(500),
	"click_count" integer DEFAULT 0,
	"clicked_link" boolean DEFAULT false,
	"first_clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_system_generated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"role" varchar(50) DEFAULT 'CLIENT' NOT NULL,
	"client_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "idx_activity_user_id" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_client_id" ON "activity_log" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_activity_lead_id" ON "activity_log" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_client_id" ON "campaigns" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_clients_airtable_base" ON "clients" USING btree ("airtable_base_id");--> statement-breakpoint
CREATE INDEX "idx_leads_client_id" ON "leads" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_leads_email" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_leads_claimed_by" ON "leads" USING btree ("claimed_by");--> statement-breakpoint
CREATE INDEX "idx_leads_airtable_record" ON "leads" USING btree ("airtable_record_id");--> statement-breakpoint
CREATE INDEX "idx_leads_campaign_name" ON "leads" USING btree ("campaign_name");--> statement-breakpoint
CREATE INDEX "idx_leads_processing_status" ON "leads" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_leads_sms_sequence" ON "leads" USING btree ("sms_sequence_position");--> statement-breakpoint
CREATE INDEX "idx_notes_lead_id" ON "notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_notes_created_by" ON "notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_client_id" ON "users" USING btree ("client_id");