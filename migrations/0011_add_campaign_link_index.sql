-- Migration: Add Index on leads.campaign_link_id for Custom Campaign Performance
-- Date: 2025-11-03
-- Description: Adds index to optimize queries for finding enrolled leads by campaign
-- Related: FORENSIC-AUDIT-FINAL.md (HIGH #6), Custom Tag-Based SMS Campaigns

-- ==============================================================================
-- PERFORMANCE FIX: Add Index on leads.campaign_link_id
-- ==============================================================================

-- ISSUE: Queries to find leads enrolled in a specific campaign perform full table scan
-- IMPACT: Without this index, queries like:
--   SELECT * FROM leads WHERE campaign_link_id = 'campaign-uuid';
-- Will scan millions of rows, causing:
--   - Slow campaign reporting/analytics
--   - Slow pause/resume campaign operations
--   - High database CPU usage
--   - Poor user experience in admin UI

-- USAGE: This index is used by:
--   - Campaign analytics/reporting endpoints
--   - Pause/resume campaign operations
--   - Lead management UI (filtering by campaign)
--   - Campaign performance dashboards

CREATE INDEX IF NOT EXISTS idx_leads_campaign_link ON leads (campaign_link_id)
WHERE campaign_link_id IS NOT NULL;

-- Use partial index (WHERE campaign_link_id IS NOT NULL) to:
-- 1. Reduce index size (only index leads actually enrolled in campaigns)
-- 2. Improve index maintenance performance
-- 3. Avoid indexing the majority of leads who have NULL campaign_link_id

COMMENT ON INDEX idx_leads_campaign_link IS 'Optimizes queries finding leads enrolled in specific campaigns. Partial index excludes NULL values.';

-- ==============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ==============================================================================

-- Verify index was created
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename = 'leads' AND indexname = 'idx_leads_campaign_link';

-- Check index size
-- SELECT pg_size_pretty(pg_relation_size('idx_leads_campaign_link')) as index_size;

-- Test query performance (should show index scan, not seq scan)
-- EXPLAIN ANALYZE
-- SELECT COUNT(*) FROM leads WHERE campaign_link_id = 'some-uuid';

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==============================================================================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_leads_campaign_link;
