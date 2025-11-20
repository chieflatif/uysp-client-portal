CREATE TABLE "sms_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airtable_record_id" varchar(255) NOT NULL,
	"sms_campaign_id" varchar(255),
	"phone" varchar(50) NOT NULL,
	"lead_record_id" varchar(255),
	"event" varchar(100),
	"text" text,
	"status" varchar(50),
	"carrier" varchar(100),
	"sent_at" timestamp,
	"delivery_at" timestamp,
	"clicked_at" timestamp,
	"clicked" boolean DEFAULT false,
	"webhook_raw" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sms_audit_airtable_record_id_unique" UNIQUE("airtable_record_id")
);
--> statement-breakpoint
CREATE TABLE "sms_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airtable_record_id" varchar(255) NOT NULL,
	"campaign" varchar(255) NOT NULL,
	"variant" varchar(10),
	"step" integer NOT NULL,
	"delay_days" integer,
	"fast_delay_minutes" integer,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sms_templates_airtable_record_id_unique" UNIQUE("airtable_record_id")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "campaign_variant" varchar(10);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "sms_eligible" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "linkedin_url" varchar(500);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "company_linkedin" varchar(500);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "enrichment_outcome" varchar(100);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "enrichment_attempted_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_sms_audit_phone" ON "sms_audit" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_sms_audit_lead_record" ON "sms_audit" USING btree ("lead_record_id");--> statement-breakpoint
CREATE INDEX "idx_sms_audit_sms_campaign" ON "sms_audit" USING btree ("sms_campaign_id");--> statement-breakpoint
CREATE INDEX "idx_sms_audit_sent_at" ON "sms_audit" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_sms_templates_campaign" ON "sms_templates" USING btree ("campaign");--> statement-breakpoint
CREATE INDEX "idx_sms_templates_step" ON "sms_templates" USING btree ("step");--> statement-breakpoint
CREATE INDEX "idx_leads_campaign_variant" ON "leads" USING btree ("campaign_variant");--> statement-breakpoint
CREATE INDEX "idx_leads_enrichment_outcome" ON "leads" USING btree ("enrichment_outcome");