-- Migration: 0031_backfill_enrolled_at.sql
-- Purpose: Backfill enrolled_at field for all existing leads
-- Context: The enrolled_at field was added in Campaign V2 but never populated for pre-existing leads
--          This caused the "Date Enrolled" column to show blank for all 1,035 existing leads
-- Solution: Use created_at as the enrolled_at value for all leads where enrolled_at is NULL
-- Safety: Only updates rows where enrolled_at is NULL AND created_at is NOT NULL

BEGIN;

-- Backfill enrolled_at using created_at for all existing leads
UPDATE leads
SET enrolled_at = created_at
WHERE enrolled_at IS NULL
  AND created_at IS NOT NULL;

-- Verification query (optional - run separately to check results)
-- SELECT
--   COUNT(*) as total_leads,
--   COUNT(enrolled_at) as leads_with_enrolled_at,
--   COUNT(*) FILTER (WHERE enrolled_at IS NULL) as leads_missing_enrolled_at
-- FROM leads;

COMMIT;
