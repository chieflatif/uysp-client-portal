-- BUG #18 FIX: Add unique constraint on campaign names per client
-- Migration: 0013_add_unique_campaign_name_constraint.sql
-- Date: 2025-11-03
-- Purpose: Prevent duplicate campaign names for the same client
--
-- Without this constraint, two API requests can create campaigns with identical names
-- if they execute simultaneously (race condition). This causes confusion in UI and analytics.
--
-- Related Issue: BUG-AUDIT-CUSTOM-CAMPAIGNS-2025-11-03.md (BUG #18)

-- ==============================================================================
-- STEP 1: Check for existing duplicate names before adding constraint
-- ==============================================================================

-- Find any existing duplicates (should be none if system is working correctly)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT client_id, name, COUNT(*)
    FROM campaigns
    GROUP BY client_id, name
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate campaign names. These will be renamed before applying constraint.', duplicate_count;

    -- Rename duplicates by appending timestamp
    UPDATE campaigns c
    SET name = c.name || ' (' || TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') || ')'
    WHERE c.id IN (
      SELECT id
      FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY client_id, name
          ORDER BY created_at
        ) AS rn
        FROM campaigns
      ) ranked
      WHERE rn > 1
    );

    RAISE NOTICE 'Renamed duplicate campaign names. Proceeding with constraint creation.';
  ELSE
    RAISE NOTICE 'No duplicate campaign names found. Proceeding with constraint creation.';
  END IF;
END $$;

-- ==============================================================================
-- STEP 2: Create unique constraint
-- ==============================================================================

-- Create unique constraint on (client_id, name)
-- This prevents two campaigns for the same client from having identical names
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_client_name_unique
  ON campaigns (client_id, name);

-- Add constraint comment for documentation
COMMENT ON INDEX idx_campaigns_client_name_unique IS
  'Ensures campaign names are unique per client. Prevents duplicate campaign names from being created via race conditions.';

-- ==============================================================================
-- STEP 3: Verify constraint was created
-- ==============================================================================

-- Query to verify the constraint exists
-- Run this after migration:
-- SELECT
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename = 'campaigns' AND indexname = 'idx_campaigns_client_name_unique';

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==============================================================================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_campaigns_client_name_unique;

-- ==============================================================================
-- EXPECTED BEHAVIOR AFTER MIGRATION
-- ==============================================================================

-- Before migration:
-- INSERT INTO campaigns (client_id, name, ...) VALUES ('uuid1', 'Q4 Webinar', ...); -- SUCCESS
-- INSERT INTO campaigns (client_id, name, ...) VALUES ('uuid1', 'Q4 Webinar', ...); -- SUCCESS (duplicate!)

-- After migration:
-- INSERT INTO campaigns (client_id, name, ...) VALUES ('uuid1', 'Q4 Webinar', ...); -- SUCCESS
-- INSERT INTO campaigns (client_id, name, ...) VALUES ('uuid1', 'Q4 Webinar', ...); -- ERROR: duplicate key value violates unique constraint
-- INSERT INTO campaigns (client_id, name, ...) VALUES ('uuid2', 'Q4 Webinar', ...); -- SUCCESS (different client)

-- API Route should catch error code '23505' and return 409 Conflict with user-friendly message
