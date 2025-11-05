-- Rollback Migration: 0019_add_campaign_completion_tracking
-- Purpose: Safely rollback campaign completion tracking changes
--
-- IMPORTANT: Create backup before running:
-- CREATE TABLE leads_backup_YYYYMMDD AS SELECT * FROM leads;

BEGIN; -- TRANSACTION SAFETY

-- Remove the stuck leads updates (restore original state)
UPDATE leads
SET
  is_active = true,
  completed_at = NULL,
  campaign_history = '[]'::jsonb
WHERE
  completed_at IS NOT NULL
  AND completed_at::date = CURRENT_DATE; -- Only revert today's changes

-- Drop indexes
DROP INDEX IF EXISTS idx_leads_campaign_history;
DROP INDEX IF EXISTS idx_leads_completed_at;

-- Remove column comments
COMMENT ON COLUMN leads.completed_at IS NULL;
COMMENT ON COLUMN leads.campaign_history IS NULL;

-- Drop the columns
ALTER TABLE leads
DROP COLUMN IF EXISTS completed_at,
DROP COLUMN IF EXISTS campaign_history;

-- Log rollback
DO $$
DECLARE
  reverted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO reverted_count
  FROM leads
  WHERE completed_at IS NULL
    AND updated_at::date = CURRENT_DATE;

  RAISE NOTICE 'Rollback 0019 complete. Reverted % leads', reverted_count;
END $$;

COMMIT;