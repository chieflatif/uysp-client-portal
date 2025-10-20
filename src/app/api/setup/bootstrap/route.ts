import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- Raw SQL extracted from migration files ---
const MIGRATION_0000 = `CREATE TABLE "activity_log" (
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
CREATE INDEX "idx_users_client_id" ON "users" USING btree ("client_id");`;

const MIGRATION_0001 = `CREATE TABLE "sms_audit" (
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
CREATE INDEX "idx_leads_enrichment_outcome" ON "leads" USING btree ("enrichment_outcome");`;

function splitStatements(sql: string): string[] {
  return sql
    .replace(/-->/g, '\n')
    .replace(/statement-breakpoint/g, '\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function runMigrations(pool: Pool) {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
  const files = [MIGRATION_0000, MIGRATION_0001];
  for (const fileSql of files) {
    const statements = splitStatements(fileSql);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
  }
}

async function createAdmin(pool: Pool) {
  const client = await pool.connect();
  try {
    const hashed = await bcrypt.hash('RElH0rst89!', 10);

    const clientInsert = await client.query(
      'INSERT INTO clients (id, company_name, email, airtable_base_id, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING id',
      ['Rebel HQ', 'rebel@rebelhq.ai', process.env.AIRTABLE_BASE_ID || 'app4wIsBfpJTg7pWS']
    );

    let clientId = clientInsert.rows[0]?.id as string | undefined;
    if (!clientId) {
      const existing = await client.query('SELECT id FROM clients WHERE email = $1 LIMIT 1', ['rebel@rebelhq.ai']);
      clientId = existing.rows[0]?.id as string | undefined;
    }

    if (!clientId) {
      throw new Error('Failed to resolve client id');
    }

    await client.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, role, client_id, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING',
      ['rebel@rebelhq.ai', hashed, 'Rebel', 'Admin', 'SUPER_ADMIN', clientId]
    );
  } finally {
    client.release();
  }
}

function getSecret(req: NextRequest): string | null {
  const header = req.headers.get('x-setup-secret');
  if (header) return header;
  try {
    const url = new URL(req.url);
    const s = url.searchParams.get('secret');
    return s;
  } catch {
    return null;
  }
}

async function handle(req: NextRequest) {
  const secret = getSecret(req);
  const expected = process.env.SETUP_TOKEN || process.env.NEXTAUTH_SECRET || '';
  if (!secret || secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL not set' }, { status: 500 });
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    await runMigrations(pool);
    await createAdmin(pool);
    return NextResponse.json({ ok: true, message: 'Bootstrap complete: migrations applied and SUPER_ADMIN created' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}


