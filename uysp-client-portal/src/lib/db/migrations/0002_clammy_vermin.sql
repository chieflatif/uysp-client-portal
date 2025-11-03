CREATE TABLE "client_project_blockers" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"airtable_record_id" varchar(255) NOT NULL,
	"blocker" varchar(500) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"action_to_resolve" text,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	CONSTRAINT "client_project_blockers_airtable_record_id_unique" UNIQUE("airtable_record_id")
);
--> statement-breakpoint
CREATE TABLE "client_project_status" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"airtable_record_id" varchar(255) NOT NULL,
	"metric" varchar(200) NOT NULL,
	"value" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"display_order" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_project_status_airtable_record_id_unique" UNIQUE("airtable_record_id")
);
--> statement-breakpoint
CREATE TABLE "client_project_tasks" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"airtable_record_id" varchar(255) NOT NULL,
	"task" varchar(500) NOT NULL,
	"status" varchar(50) NOT NULL,
	"priority" varchar(50) NOT NULL,
	"owner" varchar(100),
	"due_date" timestamp,
	"notes" text,
	"dependencies" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_project_tasks_airtable_record_id_unique" UNIQUE("airtable_record_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_project_blockers_client_id" ON "client_project_blockers" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_project_blockers_severity" ON "client_project_blockers" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_project_blockers_status" ON "client_project_blockers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_blockers_airtable_record" ON "client_project_blockers" USING btree ("airtable_record_id");--> statement-breakpoint
CREATE INDEX "idx_project_status_client_id" ON "client_project_status" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_project_status_category" ON "client_project_status" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_project_status_airtable_record" ON "client_project_status" USING btree ("airtable_record_id");--> statement-breakpoint
CREATE INDEX "idx_project_tasks_client_id" ON "client_project_tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_project_tasks_status" ON "client_project_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_tasks_priority" ON "client_project_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_project_tasks_airtable_record" ON "client_project_tasks" USING btree ("airtable_record_id");