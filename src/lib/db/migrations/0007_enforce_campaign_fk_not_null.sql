-- Migration: Enforce Campaign FK NOT NULL Constraint
-- Purpose: Make leads.campaign_id required after backfilling all legacy data
-- Created: 2025-11-11
-- Related: Data Integrity Restoration (Phase 1)
-- IMPORTANT: This migration should ONLY be run AFTER backfilling campaign_id values

-- First, verify there are no NULL campaign_id values
-- (This query will fail the migration if any NULLs exist)
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM leads
  WHERE campaign_id IS NULL AND is_active = true;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL constraint: % active leads have NULL campaign_id. Run backfill script first.', null_count;
  END IF;
END $$;

-- Add NOT NULL constraint
ALTER TABLE leads
ALTER COLUMN campaign_id SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN leads.campaign_id IS
'Required foreign key to campaigns table. All leads must belong to a campaign. Enforced via NOT NULL constraint.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully enforced NOT NULL constraint on leads.campaign_id';
END $$;
