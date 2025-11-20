-- Migration: Add Foreign Key Constraints to Prevent Orphaned Records
-- Date: 2025-11-04
-- Description: Adds missing FK constraints identified in forensic audit
-- Related: Database integrity issues - prevent orphaned records and data corruption

-- ==============================================================================
-- SAFETY: This migration adds constraints to existing data
-- ==============================================================================
-- Before running, ensure:
-- 1. No orphaned records exist (run verification queries below)
-- 2. Database backup is created
-- 3. You have tested on staging environment
-- ==============================================================================

-- ==============================================================================
-- USERS TABLE FOREIGN KEYS
-- ==============================================================================

-- Add FK: users.client_id -> clients.id
-- ON DELETE RESTRICT: Cannot delete client if users exist
ALTER TABLE users
ADD CONSTRAINT fk_users_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE RESTRICT;

COMMENT ON CONSTRAINT fk_users_client_id ON users IS
'Prevents client deletion if users exist (data protection)';

-- ==============================================================================
-- LEADS TABLE FOREIGN KEYS
-- ==============================================================================

-- Add FK: leads.client_id -> clients.id
-- ON DELETE CASCADE: Delete leads when client is deleted
ALTER TABLE leads
ADD CONSTRAINT fk_leads_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_leads_client_id ON leads IS
'Cascade delete leads when client is deleted (cleanup)';

-- Add FK: leads.claimed_by -> users.id
-- ON DELETE SET NULL: Unclaim lead when user is deleted
ALTER TABLE leads
ADD CONSTRAINT fk_leads_claimed_by
FOREIGN KEY (claimed_by)
REFERENCES users(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_leads_claimed_by ON leads IS
'Set to NULL if claiming user is deleted (preserve lead)';

-- Add FK: leads.campaign_id -> campaigns.id
-- ON DELETE SET NULL: Keep lead but remove campaign reference
ALTER TABLE leads
ADD CONSTRAINT fk_leads_campaign_id
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_leads_campaign_id ON leads IS
'Set to NULL if campaign is deleted (preserve lead)';

-- ==============================================================================
-- CAMPAIGNS TABLE FOREIGN KEYS
-- ==============================================================================

-- Add FK: campaigns.client_id -> clients.id
-- ON DELETE CASCADE: Delete campaigns when client is deleted
ALTER TABLE campaigns
ADD CONSTRAINT fk_campaigns_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_campaigns_client_id ON campaigns IS
'Cascade delete campaigns when client is deleted (cleanup)';

-- ==============================================================================
-- CAMPAIGN TAGS CACHE TABLE FOREIGN KEYS
-- ==============================================================================

-- Add FK: campaign_tags_cache.client_id -> clients.id
-- ON DELETE CASCADE: Delete cache when client is deleted
ALTER TABLE campaign_tags_cache
ADD CONSTRAINT fk_campaign_tags_cache_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_campaign_tags_cache_client_id ON campaign_tags_cache IS
'Cascade delete cache when client is deleted (cleanup)';

-- ==============================================================================
-- NOTES TABLE FOREIGN KEYS
-- ==============================================================================

-- Add FK: notes.lead_id -> leads.id
-- ON DELETE CASCADE: Delete notes when lead is deleted
ALTER TABLE notes
ADD CONSTRAINT fk_notes_lead_id
FOREIGN KEY (lead_id)
REFERENCES leads(id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_notes_lead_id ON notes IS
'Cascade delete notes when lead is deleted (cleanup)';

-- Add FK: notes.created_by -> users.id
-- ON DELETE SET NULL: Keep note but remove author reference
ALTER TABLE notes
ADD CONSTRAINT fk_notes_created_by
FOREIGN KEY (created_by)
REFERENCES users(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_notes_created_by ON notes IS
'Set to NULL if note author is deleted (preserve note)';

-- ==============================================================================
-- ACTIVITY LOG TABLE FOREIGN KEYS
-- ==============================================================================

-- Add FK: activity_log.user_id -> users.id
-- ON DELETE SET NULL: Keep log but remove user reference
ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_log_user_id
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- Add FK: activity_log.client_id -> clients.id
-- ON DELETE CASCADE: Delete logs when client is deleted
ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_log_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

-- Add FK: activity_log.lead_id -> leads.id
-- ON DELETE CASCADE: Delete logs when lead is deleted
ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_log_lead_id
FOREIGN KEY (lead_id)
REFERENCES leads(id)
ON DELETE CASCADE;

-- ==============================================================================
-- PROJECT MANAGEMENT TABLES FOREIGN KEYS
-- ==============================================================================

-- Add FK: client_project_tasks.client_id -> clients.id
-- ON DELETE CASCADE: Delete tasks when client is deleted
ALTER TABLE client_project_tasks
ADD CONSTRAINT fk_project_tasks_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

-- Add FK: client_project_blockers.client_id -> clients.id
-- ON DELETE CASCADE: Delete blockers when client is deleted
ALTER TABLE client_project_blockers
ADD CONSTRAINT fk_project_blockers_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

-- Add FK: client_project_status.client_id -> clients.id
-- ON DELETE CASCADE: Delete status when client is deleted
ALTER TABLE client_project_status
ADD CONSTRAINT fk_project_status_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

-- ==============================================================================
-- USER ACTIVITY TRACKING TABLES FOREIGN KEYS
-- ==============================================================================

-- Add FK: user_activity_logs.user_id -> users.id
-- ON DELETE CASCADE: Delete activity logs when user is deleted
ALTER TABLE user_activity_logs
ADD CONSTRAINT fk_activity_logs_user_id
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Add FK: user_activity_logs.client_id -> clients.id
-- ON DELETE CASCADE: Delete activity logs when client is deleted
ALTER TABLE user_activity_logs
ADD CONSTRAINT fk_activity_logs_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

-- Add FK: user_activity_sessions.user_id -> users.id
-- ON DELETE CASCADE: Delete sessions when user is deleted
ALTER TABLE user_activity_sessions
ADD CONSTRAINT fk_activity_sessions_user_id
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Add FK: user_activity_sessions.client_id -> clients.id
-- ON DELETE CASCADE: Delete sessions when client is deleted
ALTER TABLE user_activity_sessions
ADD CONSTRAINT fk_activity_sessions_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

-- Add FK: user_activity_summary.user_id -> users.id
-- ON DELETE CASCADE: Delete summary when user is deleted
ALTER TABLE user_activity_summary
ADD CONSTRAINT fk_activity_summary_user_id
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Add FK: user_activity_summary.client_id -> clients.id
-- ON DELETE CASCADE: Delete summary when client is deleted
ALTER TABLE user_activity_summary
ADD CONSTRAINT fk_activity_summary_client_id
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

-- ==============================================================================
-- EMAIL AUDIT LOG FOREIGN KEYS (SKIPPED - table not created yet)
-- ==============================================================================

-- NOTE: email_audit_log table not created yet in production
-- Add these constraints when the table is created:
--
-- ALTER TABLE email_audit_log
-- ADD CONSTRAINT fk_email_audit_log_sent_by_user_id
-- FOREIGN KEY (sent_by_user_id)
-- REFERENCES users(id)
-- ON DELETE SET NULL;
--
-- ALTER TABLE email_audit_log
-- ADD CONSTRAINT fk_email_audit_log_client_id
-- FOREIGN KEY (client_id)
-- REFERENCES clients(id)
-- ON DELETE CASCADE;

-- ==============================================================================
-- SECURITY AUDIT LOG FOREIGN KEYS (SKIPPED - table not created yet)
-- ==============================================================================

-- NOTE: security_audit_log table not created yet in production
-- Add these constraints when the table is created:
--
-- ALTER TABLE security_audit_log
-- ADD CONSTRAINT fk_security_audit_log_user_id
-- FOREIGN KEY (user_id)
-- REFERENCES users(id)
-- ON DELETE SET NULL;
--
-- ALTER TABLE security_audit_log
-- ADD CONSTRAINT fk_security_audit_log_client_id
-- FOREIGN KEY (client_id)
-- REFERENCES clients(id)
-- ON DELETE SET NULL;

-- ==============================================================================
-- PASSWORD SETUP TOKENS FOREIGN KEYS
-- ==============================================================================

-- Add FK: password_setup_tokens.user_id -> users.id
-- ON DELETE CASCADE: Delete tokens when user is deleted
ALTER TABLE password_setup_tokens
ADD CONSTRAINT fk_password_setup_tokens_user_id
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Add FK: password_setup_tokens.created_by_user_id -> users.id
-- ON DELETE SET NULL: Keep token but remove creator reference
ALTER TABLE password_setup_tokens
ADD CONSTRAINT fk_password_setup_tokens_created_by_user_id
FOREIGN KEY (created_by_user_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- ==============================================================================
-- RATE LIMITS FOREIGN KEYS
-- ==============================================================================

-- Add FK: rate_limits.user_id -> users.id
-- ON DELETE CASCADE: Delete rate limits when user is deleted
ALTER TABLE rate_limits
ADD CONSTRAINT fk_rate_limits_user_id
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- ==============================================================================
-- VERIFICATION QUERIES (Run BEFORE migration to check for orphaned records)
-- ==============================================================================

-- Check for orphaned users (users with invalid client_id)
-- SELECT COUNT(*) FROM users WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM clients);

-- Check for orphaned leads (leads with invalid client_id)
-- SELECT COUNT(*) FROM leads WHERE client_id NOT IN (SELECT id FROM clients);

-- Check for orphaned leads (leads with invalid claimed_by)
-- SELECT COUNT(*) FROM leads WHERE claimed_by IS NOT NULL AND claimed_by NOT IN (SELECT id FROM users);

-- Check for orphaned leads (leads with invalid campaign_id)
-- SELECT COUNT(*) FROM leads WHERE campaign_id IS NOT NULL AND campaign_id NOT IN (SELECT id FROM campaigns);

-- Check for orphaned campaigns (campaigns with invalid client_id)
-- SELECT COUNT(*) FROM campaigns WHERE client_id NOT IN (SELECT id FROM clients);

-- Check for orphaned notes (notes with invalid lead_id)
-- SELECT COUNT(*) FROM notes WHERE lead_id NOT IN (SELECT id FROM leads);

-- Check for orphaned notes (notes with invalid created_by)
-- SELECT COUNT(*) FROM notes WHERE created_by NOT IN (SELECT id FROM users);

-- ==============================================================================
-- POST-MIGRATION VALIDATION QUERIES
-- ==============================================================================

-- Verify all foreign keys were created
-- SELECT
--   tc.table_name,
--   tc.constraint_name,
--   tc.constraint_type,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
-- ORDER BY tc.table_name, tc.constraint_name;

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==============================================================================

-- To rollback this migration, drop all constraints:
/*
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_client_id;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_client_id;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_claimed_by;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_campaign_id;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS fk_campaigns_client_id;
ALTER TABLE campaign_tags_cache DROP CONSTRAINT IF EXISTS fk_campaign_tags_cache_client_id;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS fk_notes_lead_id;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS fk_notes_created_by;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS fk_activity_log_user_id;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS fk_activity_log_client_id;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS fk_activity_log_lead_id;
ALTER TABLE client_project_tasks DROP CONSTRAINT IF EXISTS fk_project_tasks_client_id;
ALTER TABLE client_project_blockers DROP CONSTRAINT IF EXISTS fk_project_blockers_client_id;
ALTER TABLE client_project_status DROP CONSTRAINT IF EXISTS fk_project_status_client_id;
ALTER TABLE user_activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_user_id;
ALTER TABLE user_activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_client_id;
ALTER TABLE user_activity_sessions DROP CONSTRAINT IF EXISTS fk_activity_sessions_user_id;
ALTER TABLE user_activity_sessions DROP CONSTRAINT IF EXISTS fk_activity_sessions_client_id;
ALTER TABLE user_activity_summary DROP CONSTRAINT IF EXISTS fk_activity_summary_user_id;
ALTER TABLE user_activity_summary DROP CONSTRAINT IF EXISTS fk_activity_summary_client_id;
ALTER TABLE email_audit_log DROP CONSTRAINT IF EXISTS fk_email_audit_log_sent_by_user_id;
ALTER TABLE email_audit_log DROP CONSTRAINT IF EXISTS fk_email_audit_log_client_id;
ALTER TABLE security_audit_log DROP CONSTRAINT IF EXISTS fk_security_audit_log_user_id;
ALTER TABLE security_audit_log DROP CONSTRAINT IF EXISTS fk_security_audit_log_client_id;
ALTER TABLE password_setup_tokens DROP CONSTRAINT IF EXISTS fk_password_setup_tokens_user_id;
ALTER TABLE password_setup_tokens DROP CONSTRAINT IF EXISTS fk_password_setup_tokens_created_by_user_id;
ALTER TABLE rate_limits DROP CONSTRAINT IF EXISTS fk_rate_limits_user_id;
*/
