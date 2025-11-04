-- Migration: Add Missing Performance Indexes
-- Date: 2025-11-04
-- Description: Adds critical indexes identified in forensic audit for query performance
-- Related: Database performance issues - slow queries on large datasets

-- ==============================================================================
-- LEADS TABLE INDEXES (CRITICAL - Most accessed table)
-- ==============================================================================

-- Add index on client_id (CRITICAL for multi-tenant isolation)
-- Used in: Every leads query with WHERE client_id = X
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads (client_id);

-- Add index on email (for email lookups and duplicate detection)
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);

-- Add index on status (for filtering by lead status)
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);

-- Add index on claimed_by (for user's claimed leads queries)
CREATE INDEX IF NOT EXISTS idx_leads_claimed_by ON leads (claimed_by);

-- Add index on airtable_record_id (for sync operations)
CREATE INDEX IF NOT EXISTS idx_leads_airtable_record ON leads (airtable_record_id);

-- Add index on campaign_name (for campaign filtering)
CREATE INDEX IF NOT EXISTS idx_leads_campaign_name ON leads (campaign_name);

-- Add index on campaign_variant (for A/B testing)
CREATE INDEX IF NOT EXISTS idx_leads_campaign_variant ON leads (campaign_variant);

-- Add index on processing_status (for workflow queries)
CREATE INDEX IF NOT EXISTS idx_leads_processing_status ON leads (processing_status);

-- Add index on sms_sequence_position (for SMS scheduler)
CREATE INDEX IF NOT EXISTS idx_leads_sms_sequence ON leads (sms_sequence_position);

-- Add index on enrichment_outcome (for enrichment tracking)
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_outcome ON leads (enrichment_outcome);

-- Add compound index for deletion query (clientId + airtableRecordId NOT IN)
-- PERFORMANCE FIX: Speeds up sync deletion queries
CREATE INDEX IF NOT EXISTS idx_leads_client_airtable ON leads (client_id, airtable_record_id);

-- ==============================================================================
-- CAMPAIGNS TABLE INDEXES
-- ==============================================================================

-- Add index on client_id (CRITICAL for multi-tenant isolation)
-- Used in: Every campaigns query with WHERE client_id = X
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON campaigns (client_id);

-- ==============================================================================
-- NOTES TABLE INDEXES
-- ==============================================================================

-- Add index on lead_id (for fetching lead notes)
CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes (lead_id);

-- Add index on created_by (for user activity tracking)
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes (created_by);

-- ==============================================================================
-- ACTIVITY LOG INDEXES
-- ==============================================================================

-- Add index on user_id (for user activity queries)
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log (user_id);

-- Add index on client_id (for client activity queries)
CREATE INDEX IF NOT EXISTS idx_activity_client_id ON activity_log (client_id);

-- Add index on lead_id (for lead activity history)
CREATE INDEX IF NOT EXISTS idx_activity_lead_id ON activity_log (lead_id);

-- Add compound index on user_id + created_at (for recent activity queries)
CREATE INDEX IF NOT EXISTS idx_activity_user_recent ON activity_log (user_id, created_at DESC);

-- Add compound index on client_id + created_at (for client activity timeline)
CREATE INDEX IF NOT EXISTS idx_activity_client_recent ON activity_log (client_id, created_at DESC);

-- ==============================================================================
-- SMS AUDIT TABLE INDEXES
-- ==============================================================================

-- Add index on phone (for SMS lookup by phone number)
CREATE INDEX IF NOT EXISTS idx_sms_audit_phone ON sms_audit (phone);

-- Add index on lead_record_id (for lead SMS history)
CREATE INDEX IF NOT EXISTS idx_sms_audit_lead_record ON sms_audit (lead_record_id);

-- Add index on sms_campaign_id (for campaign SMS analytics)
CREATE INDEX IF NOT EXISTS idx_sms_audit_sms_campaign ON sms_audit (sms_campaign_id);

-- Add index on sent_at (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_sms_audit_sent_at ON sms_audit (sent_at);

-- ==============================================================================
-- SMS TEMPLATES TABLE INDEXES
-- ==============================================================================

-- Add compound index on campaign + step (for template lookup)
CREATE INDEX IF NOT EXISTS idx_sms_templates_campaign_step ON sms_templates (campaign, step);

-- Add index on template_type (for filtering by type)
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates (template_type);

-- ==============================================================================
-- USERS TABLE INDEXES (Additional)
-- ==============================================================================

-- Add index on is_active (for active users queries)
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- Add index on role (for role-based queries)
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Add compound index on client_id + is_active (for active users per client)
CREATE INDEX IF NOT EXISTS idx_users_client_active ON users (client_id, is_active) WHERE is_active = true;

-- ==============================================================================
-- PERFORMANCE ANALYSIS QUERIES (Run after migration to verify)
-- ==============================================================================

-- Analyze tables to update query planner statistics
ANALYZE leads;
ANALYZE campaigns;
ANALYZE notes;
ANALYZE activity_log;
ANALYZE users;
ANALYZE sms_audit;
ANALYZE sms_templates;

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

-- Verify indexes were created
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('leads', 'campaigns', 'users', 'notes', 'activity_log', 'sms_audit', 'sms_templates')
-- ORDER BY tablename, indexname;

-- Check index usage (after some queries run)
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;

-- Find unused indexes (to potentially remove later)
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND idx_scan = 0
--   AND indexname NOT LIKE '%_pkey'
--   AND indexname NOT LIKE '%_unique'
-- ORDER BY tablename, indexname;

-- ==============================================================================
-- PERFORMANCE IMPACT
-- ==============================================================================

-- Expected improvements:
-- - Leads list query: 50-90% faster (adds idx_leads_client_id)
-- - Lead detail query: 30-50% faster (adds idx_notes_lead_id for notes)
-- - Campaign filtering: 40-70% faster (adds multiple campaign indexes)
-- - SMS scheduler queries: 60-80% faster (adds SMS-related indexes)
-- - User activity queries: 50-70% faster (adds activity log indexes)
-- - Sync operations: 40-60% faster (adds compound indexes)

COMMENT ON INDEX idx_leads_client_id IS 'CRITICAL: Multi-tenant isolation for leads';
COMMENT ON INDEX idx_campaigns_client_id IS 'CRITICAL: Multi-tenant isolation for campaigns';
COMMENT ON INDEX idx_leads_client_airtable IS 'PERFORMANCE: Speeds up sync deletion queries';
COMMENT ON INDEX idx_activity_user_recent IS 'PERFORMANCE: Optimizes recent activity queries';
COMMENT ON INDEX idx_activity_client_recent IS 'PERFORMANCE: Optimizes client timeline queries';
