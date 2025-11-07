-- Migration: Add Unique Constraint for target_tags in Lead Form Campaigns
-- Purpose: Enforce "1:1 rigid" rule - EXACTLY ONE campaign per Kajabi tag
-- Part of: Campaign Manager Upgrade V2 - Phase 2 Database Integrity
-- Date: 2025-11-05
-- CRITICAL: Prevents duplicate Lead Form campaigns targeting the same tag

BEGIN; -- TRANSACTION SAFETY

-- ============================================================================
-- STEP 1: Check for existing duplicate target_tags before adding constraint
-- ============================================================================

DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  -- Check for campaigns with duplicate target_tags (for Custom campaigns with single tag)
  -- Lead Form campaigns should have exactly 1 tag in their target_tags array
  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM (
    SELECT target_tags, client_id, COUNT(*) as count
    FROM campaigns
    WHERE campaign_type = 'Custom'
      AND target_tags IS NOT NULL
      AND array_length(target_tags, 1) = 1  -- Single-tag campaigns (Lead Form)
    GROUP BY target_tags, client_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_duplicate_count > 0 THEN
    RAISE NOTICE '⚠️ WARNING: Found % groups of duplicate single-tag campaigns', v_duplicate_count;
    RAISE NOTICE 'These must be manually resolved before adding unique constraint.';
    RAISE NOTICE 'Query to find duplicates:';
    RAISE NOTICE 'SELECT client_id, target_tags, COUNT(*) as count FROM campaigns WHERE campaign_type = ''Custom'' AND jsonb_array_length(target_tags) = 1 GROUP BY client_id, target_tags HAVING COUNT(*) > 1;';
    -- Don't raise exception - just warn for now
  ELSE
    RAISE NOTICE '✅ No duplicate single-tag campaigns found';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add partial unique index for single-tag Custom campaigns
-- ============================================================================
-- NOTE: PostgreSQL doesn't support unique constraints on JSONB arrays directly
-- We use a partial unique index as a workaround for Lead Form campaigns (1 tag)

-- Create unique index for single-tag Custom campaigns (Lead Form mode)
-- This ensures EXACTLY ONE campaign per tag per client for Lead Forms
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_target_tags_unique_single
  ON campaigns (client_id, target_tags)
  WHERE campaign_type = 'Custom'
    AND target_tags IS NOT NULL
    AND array_length(target_tags, 1) = 1;

COMMENT ON INDEX idx_campaigns_target_tags_unique_single IS 'Enforces 1:1 rule: Exactly one Lead Form campaign per Kajabi tag per client';

-- ============================================================================
-- STEP 3: Add application-level check function for validation
-- ============================================================================

-- Create function to check if a tag combination already exists
CREATE OR REPLACE FUNCTION check_target_tags_unique(
  p_client_id UUID,
  p_target_tags TEXT[],
  p_campaign_id UUID DEFAULT NULL  -- For updates, exclude self from check
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_tag_count INTEGER;
  v_existing_count INTEGER;
BEGIN
  -- Get tag array length
  v_tag_count := array_length(p_target_tags, 1);

  -- Only enforce for single-tag campaigns (Lead Form mode)
  IF v_tag_count != 1 THEN
    RETURN TRUE;  -- Multi-tag campaigns (Nurture mode) are allowed duplicates
  END IF;

  -- Check if this tag combination already exists for this client
  SELECT COUNT(*)
  INTO v_existing_count
  FROM campaigns
  WHERE client_id = p_client_id
    AND target_tags = p_target_tags
    AND campaign_type = 'Custom'
    AND (p_campaign_id IS NULL OR id != p_campaign_id);  -- Exclude self for updates

  RETURN v_existing_count = 0;
END;
$$;

COMMENT ON FUNCTION check_target_tags_unique IS 'Validates that single-tag campaigns (Lead Forms) have unique target_tags per client';

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
DECLARE
  v_index_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  -- Check unique index exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'campaigns'
      AND indexname = 'idx_campaigns_target_tags_unique_single'
  ) INTO v_index_exists;

  IF NOT v_index_exists THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: idx_campaigns_target_tags_unique_single index not found';
  END IF;

  -- Check function exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'check_target_tags_unique'
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: check_target_tags_unique function not found';
  END IF;

  RAISE NOTICE '✅ Migration 0030 complete';
  RAISE NOTICE 'Created unique index: idx_campaigns_target_tags_unique_single';
  RAISE NOTICE 'Created function: check_target_tags_unique()';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICATION COMMANDS:';
  RAISE NOTICE '1. Check index: \di idx_campaigns_target_tags_unique_single';
  RAISE NOTICE '2. Check function: \df check_target_tags_unique';
  RAISE NOTICE '3. Test constraint: Try creating duplicate Lead Form campaign with same tag';
END $$;

COMMIT; -- END TRANSACTION
