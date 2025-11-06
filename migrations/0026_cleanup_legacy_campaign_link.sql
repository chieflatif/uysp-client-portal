-- Migration: Cleanup Legacy campaign_link_id Field
-- Purpose: Remove redundant campaign_link_id column and unify on campaign_id
-- Part of: Campaign Manager Upgrade v2 - Field Unification
-- Date: 2025-11-05
-- CRITICAL: This migration removes the legacy campaign_link_id field after data migration

BEGIN; -- TRANSACTION SAFETY

-- ============================================================================
-- STEP 1: Safety Check - Verify campaign_id field exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'campaign_id'
  ) THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: campaign_id column does not exist. Cannot proceed with cleanup.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Data Migration - Copy any potential data from campaign_link_id
-- ============================================================================

-- Safely migrate any data from campaign_link_id to campaign_id
-- This handles edge cases where campaign_link_id was set but campaign_id wasn't
UPDATE leads
SET campaign_id = campaign_link_id
WHERE campaign_id IS NULL
  AND campaign_link_id IS NOT NULL;

-- Log how many rows were migrated
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM leads
  WHERE campaign_id IS NOT NULL AND campaign_link_id IS NOT NULL;

  RAISE NOTICE 'Data migration: % leads had campaign_link_id data', migrated_count;
END $$;

-- ============================================================================
-- STEP 3: Drop the foreign key constraint first
-- ============================================================================

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_campaign_link_id_fkey;

RAISE NOTICE 'Dropped foreign key constraint: leads_campaign_link_id_fkey';

-- ============================================================================
-- STEP 4: Drop indexes that reference campaign_link_id
-- ============================================================================

DROP INDEX IF EXISTS idx_leads_campaign_link;
DROP INDEX IF EXISTS idx_leads_campaign_link_id;

RAISE NOTICE 'Dropped indexes: idx_leads_campaign_link, idx_leads_campaign_link_id';

-- ============================================================================
-- STEP 5: Remove the legacy column
-- ============================================================================

ALTER TABLE leads DROP COLUMN IF EXISTS campaign_link_id;

RAISE NOTICE 'Dropped column: campaign_link_id';

-- ============================================================================
-- STEP 6: Verification - Confirm column is gone
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'campaign_link_id'
  ) THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: campaign_link_id column still exists';
  ELSE
    RAISE NOTICE '✅ VERIFICATION SUCCESS: campaign_link_id column has been removed';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Log migration completion
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 0026 complete';
  RAISE NOTICE 'Removed legacy campaign_link_id field';
  RAISE NOTICE 'All code now uses campaign_id as the authoritative field';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICATION COMMANDS:';
  RAISE NOTICE '1. Check column is gone: \d leads';
  RAISE NOTICE '2. Verify data integrity: SELECT COUNT(*) FROM leads WHERE campaign_id IS NOT NULL;';
  RAISE NOTICE '3. Check foreign keys: SELECT conname FROM pg_constraint WHERE conrelid = ''leads''::regclass;';
END $$;

COMMIT; -- END TRANSACTION
