-- Performance Optimization: Composite Database Indexes
-- Date: October 23, 2025
-- Purpose: Add composite indexes for common query patterns

-- Analytics queries (clientId + campaignName + status)
CREATE INDEX IF NOT EXISTS idx_leads_analytics
ON leads(client_id, campaign_name, processing_status);

-- Lead sorting by ICP score (clientId + icpScore DESC)
CREATE INDEX IF NOT EXISTS idx_leads_client_icp
ON leads(client_id, icp_score DESC);

-- SMS sequence tracking (clientId + sequencePosition + lastSentAt)
CREATE INDEX IF NOT EXISTS idx_leads_sequence
ON leads(client_id, sms_sequence_position, sms_last_sent_at DESC);

-- Project tasks by client and status
CREATE INDEX IF NOT EXISTS idx_tasks_client_status
ON client_project_tasks(client_id, status, priority);

-- Project tasks by client and due date (for upcoming tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_client_due_date
ON client_project_tasks(client_id, due_date) WHERE due_date IS NOT NULL;

-- Activity log by user and timestamp (for audit queries)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_time
ON activity_log(user_id, created_at DESC);

-- Notes by lead (for lead detail page)
CREATE INDEX IF NOT EXISTS idx_notes_lead
ON notes(lead_id, created_at DESC);

-- SMS audit log by lead (for lead detail page)
CREATE INDEX IF NOT EXISTS idx_sms_audit_lead
ON sms_audit_log(lead_id, sent_at DESC);

-- Campaign tracking
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status
ON leads(campaign_name, processing_status) WHERE campaign_name IS NOT NULL;

-- Click tracking
CREATE INDEX IF NOT EXISTS idx_leads_clicks
ON leads(clicked_link, short_link_id) WHERE clicked_link = true;

-- Print execution plan before indexes
-- Run this to verify improvement:
-- EXPLAIN ANALYZE SELECT * FROM leads WHERE client_id = 'xxx' AND campaign_name = 'Campaign A' AND processing_status = 'Qualified';
