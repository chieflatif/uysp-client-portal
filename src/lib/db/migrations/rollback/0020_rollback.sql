-- Rollback Migration: 0020_unify_campaign_model
-- Purpose: Safely rollback unified campaign model changes
--
-- IMPORTANT: Create backup before running:
-- CREATE TABLE campaigns_backup_YYYYMMDD AS SELECT * FROM campaigns;

BEGIN; -- TRANSACTION SAFETY

-- Restore message_template from messages array (if it was migrated)
UPDATE campaigns
SET message_template = messages->0->>'text'
WHERE
  message_template IS NULL
  AND messages IS NOT NULL
  AND jsonb_array_length(messages) = 1;

-- Drop indexes
DROP INDEX IF EXISTS idx_campaigns_is_active;
DROP INDEX IF EXISTS idx_campaigns_auto_discovered;
DROP INDEX IF EXISTS idx_campaigns_last_enrollment;

-- Remove column comments
COMMENT ON COLUMN campaigns.is_active IS NULL;
COMMENT ON COLUMN campaigns.active_leads_count IS NULL;
COMMENT ON COLUMN campaigns.completed_leads_count IS NULL;
COMMENT ON COLUMN campaigns.opted_out_count IS NULL;
COMMENT ON COLUMN campaigns.booked_count IS NULL;
COMMENT ON COLUMN campaigns.deactivated_at IS NULL;
COMMENT ON COLUMN campaigns.last_enrollment_at IS NULL;
COMMENT ON COLUMN campaigns.auto_discovered IS NULL;

-- Drop the v2 columns
ALTER TABLE campaigns
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS active_leads_count,
DROP COLUMN IF EXISTS completed_leads_count,
DROP COLUMN IF EXISTS opted_out_count,
DROP COLUMN IF EXISTS booked_count,
DROP COLUMN IF EXISTS deactivated_at,
DROP COLUMN IF EXISTS last_enrollment_at,
DROP COLUMN IF EXISTS auto_discovered;

-- Log rollback
DO $$
DECLARE
  total_campaigns INTEGER;
  restored_templates INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_campaigns FROM campaigns;
  SELECT COUNT(*) INTO restored_templates
  FROM campaigns
  WHERE message_template IS NOT NULL;

  RAISE NOTICE 'Rollback 0020 complete. Total campaigns: %, Restored templates: %',
    total_campaigns, restored_templates;
END $$;

COMMIT;