-- Migration: Add Security Audit Log Table
-- Purpose: Track sensitive operations for compliance and security monitoring
-- Created: 2025-01-25

CREATE TABLE IF NOT EXISTS "security_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "user_role" varchar(50) NOT NULL,
  "action" varchar(100) NOT NULL,
  "resource_type" varchar(50) NOT NULL,
  "resource_id" uuid NOT NULL,
  "client_id" uuid,
  "ip_address" inet,
  "user_agent" text,
  "metadata" jsonb,
  "success" boolean NOT NULL DEFAULT true,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "security_audit_log" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "security_audit_log" ("action");
CREATE INDEX IF NOT EXISTS "idx_audit_resource" ON "security_audit_log" ("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "idx_audit_client" ON "security_audit_log" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "security_audit_log" ("created_at");

-- Comments for documentation
COMMENT ON TABLE "security_audit_log" IS 'Tracks sensitive security operations for compliance (GDPR, SOC2)';
COMMENT ON COLUMN "security_audit_log"."user_id" IS 'User who performed the action (not email for PII protection)';
COMMENT ON COLUMN "security_audit_log"."action" IS 'Type of action: PASSWORD_RESET, USER_CREATED, USER_DEACTIVATED, ROLE_CHANGED, etc.';
COMMENT ON COLUMN "security_audit_log"."metadata" IS 'Non-sensitive additional context (no PII)';
COMMENT ON COLUMN "security_audit_log"."ip_address" IS 'IP address of the request';

SELECT 'Security Audit Log table created successfully ✅' as status;
