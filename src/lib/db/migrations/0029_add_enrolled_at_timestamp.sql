-- Migration: Add enrolled_at Timestamp to Leads Table
-- Purpose: Track when a lead was enrolled in their current campaign
-- Part of: Campaign Manager Upgrade V2 - Phase 1 UI Fixes
-- Date: 2025-11-05
-- CRITICAL: This enables tracking of actual enrollment time vs. lead creation time

BEGIN; -- TRANSACTION SAFETY

-- ============================================================================
-- STEP 1: Add enrolled_at column to leads table
-- ============================================================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN leads.enrolled_at IS 'Timestamp when lead was enrolled in their current campaign (campaign_id). NULL if never enrolled.';

-- ============================================================================
-- STEP 2: Backfill enrolled_at for existing enrolled leads
-- ============================================================================

-- For leads that are currently enrolled (have campaign_id), use updated_at as best estimate
-- This is an approximation since we don't have historical data
UPDATE leads
SET enrolled_at = updated_at
WHERE campaign_id IS NOT NULL
  AND enrolled_at IS NULL
  AND is_active = true;

-- ============================================================================
-- STEP 3: Create index for performance
-- ============================================================================

-- Index for querying leads by enrollment date within a campaign
CREATE INDEX IF NOT EXISTS idx_leads_enrolled_at
  ON leads(campaign_id, enrolled_at)
  WHERE campaign_id IS NOT NULL AND is_active = true;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_index_exists BOOLEAN;
  v_backfilled_count INTEGER;
BEGIN
  -- Check column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'enrolled_at'
  ) INTO v_column_exists;

  IF NOT v_column_exists THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: enrolled_at column not found';
  END IF;

  -- Check index exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'leads'
      AND indexname = 'idx_leads_enrolled_at'
  ) INTO v_index_exists;

  IF NOT v_index_exists THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: idx_leads_enrolled_at index not found';
  END IF;

  -- Count backfilled records
  SELECT COUNT(*)
  INTO v_backfilled_count
  FROM leads
  WHERE campaign_id IS NOT NULL
    AND enrolled_at IS NOT NULL;

  RAISE NOTICE '✅ Migration 0029 complete';
  RAISE NOTICE 'Added column: leads.enrolled_at (TIMESTAMP WITH TIME ZONE)';
  RAISE NOTICE 'Created index: idx_leads_enrolled_at';
  RAISE NOTICE 'Backfilled % existing enrolled leads', v_backfilled_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICATION COMMANDS:';
  RAISE NOTICE '1. Check column: \d leads';
  RAISE NOTICE '2. Check data: SELECT id, first_name, campaign_id, enrolled_at FROM leads WHERE campaign_id IS NOT NULL LIMIT 5;';
END $$;

COMMIT; -- END TRANSACTION
