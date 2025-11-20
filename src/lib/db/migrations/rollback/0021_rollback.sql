-- Rollback Migration: 0021_add_de_enrollment_monitoring
-- Purpose: Remove monitoring tables and functions

BEGIN; -- TRANSACTION SAFETY

-- Drop views first (depends on tables)
DROP VIEW IF EXISTS de_enrollment_health CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_leads_for_de_enrollment CASCADE;
DROP FUNCTION IF EXISTS process_de_enrollment_batch CASCADE;

-- Drop indexes on leads table
DROP INDEX IF EXISTS idx_leads_de_enrollment_check;
DROP INDEX IF EXISTS idx_leads_campaign_link;

-- Drop indexes on campaigns table
DROP INDEX IF EXISTS idx_campaigns_client_active;

-- Drop monitoring tables
DROP TABLE IF EXISTS de_enrollment_lead_log CASCADE;
DROP TABLE IF EXISTS de_enrollment_runs CASCADE;

-- Log rollback
RAISE NOTICE 'Rollback 0021 complete. Monitoring infrastructure removed.';

COMMIT;