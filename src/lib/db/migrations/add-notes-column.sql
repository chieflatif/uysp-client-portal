-- Migration: Add notes column to leads table
-- Purpose: Enable internal note-taking for leads (synced bi-directionally with Airtable)
-- Date: 2025-11-12
-- Commit: 4 - Add notes column to schema + migration

BEGIN;

-- Add notes column (TEXT type, nullable)
-- Using IF NOT EXISTS for idempotency (safe to re-run)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN leads.notes IS 'Internal notes from portal users, synced bi-directionally with Airtable Notes field';

COMMIT;
