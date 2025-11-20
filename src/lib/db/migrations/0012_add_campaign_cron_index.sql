-- BUG #7 FIX: Add compound index for scheduled campaign activation cron job
-- Migration: 0012_add_campaign_cron_index.sql
-- Date: 2025-11-03
-- Purpose: Optimize cron query that fetches campaigns with enrollment_status='scheduled'
--          AND start_datetime <= NOW()
--
-- Without this index, the query performs a full table scan as the campaigns table scales.
-- This compound index enables efficient lookups for the cron job's WHERE clause.
--
-- Query being optimized:
-- SELECT * FROM campaigns
-- WHERE enrollment_status = 'scheduled'
-- AND start_datetime <= NOW();
--
-- Performance impact:
-- - Without index: O(n) full table scan
-- - With index: O(log n) B-tree lookup
-- - Critical for production when campaigns table has 10k+ records

-- Create compound index on campaigns table
-- Index columns ordered by:
-- 1. enrollment_status (equality filter - most selective)
-- 2. start_datetime (range filter - less selective)
CREATE INDEX IF NOT EXISTS idx_campaigns_cron_activation
ON campaigns (enrollment_status, start_datetime)
WHERE enrollment_status = 'scheduled';

-- Partial index with WHERE clause further optimizes by:
-- - Only indexing rows where enrollment_status = 'scheduled'
-- - Reducing index size (fewer entries to maintain)
-- - Faster index scans (smaller B-tree)
-- - Lower write overhead during INSERT/UPDATE

-- Verify index creation
-- Run this after applying migration to confirm:
-- SELECT * FROM pg_indexes WHERE indexname = 'idx_campaigns_cron_activation';

-- Expected result:
-- tablename | indexname                     | indexdef
-- ----------|-------------------------------|------------------------------------------
-- campaigns | idx_campaigns_cron_activation | CREATE INDEX idx_campaigns_cron_activation...

-- To test index is being used:
-- EXPLAIN ANALYZE SELECT * FROM campaigns
-- WHERE enrollment_status = 'scheduled'
-- AND start_datetime <= NOW();
--
-- Should show: "Index Scan using idx_campaigns_cron_activation"
