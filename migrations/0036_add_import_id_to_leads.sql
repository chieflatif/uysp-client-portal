-- Migration 0036: Add import_id column to leads for bulk import reconciliation
-- Date: 2025-11-11
-- Purpose: Track the origin of bulk-imported leads so reconciliation jobs can
-- log historical activity accurately.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS import_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_leads_import_id
  ON leads(import_id);

COMMENT ON COLUMN leads.import_id IS 'Bulk import correlation ID (matches Airtable "Import ID" field).';
