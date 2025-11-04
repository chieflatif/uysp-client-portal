-- Migration: Add Custom Tag-Based SMS Campaigns Support
-- Date: 2025-11-03
-- Description: Adds fields to support custom campaigns with tag filtering, AI message generation, and scheduled activation
-- Related: PRD-CUSTOM-TAG-CAMPAIGNS.md, FORENSIC-AUDIT.md

-- ==============================================================================
-- LEADS TABLE: Add Kajabi Tags and Engagement Level
-- ==============================================================================

-- Add kajabi_tags array field (synced from Airtable "Kajabi Tags" comma-separated string)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS kajabi_tags text[];

-- Add engagement_level field (synced from Airtable "Engagement - Level")
-- Values: 'High', 'Medium', 'Low' (mapped from 'Green', 'Yellow', 'Red')
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS engagement_level varchar(50);

-- Add GIN index for efficient array operations on kajabi_tags
CREATE INDEX IF NOT EXISTS idx_leads_kajabi_tags ON leads USING gin (kajabi_tags);

-- Add regular index for engagement_level filtering
CREATE INDEX IF NOT EXISTS idx_leads_engagement_level ON leads (engagement_level);

COMMENT ON COLUMN leads.kajabi_tags IS 'Array of Kajabi tags from Airtable (parsed from comma-separated string)';
COMMENT ON COLUMN leads.engagement_level IS 'Engagement level: High, Medium, or Low (mapped from Airtable Green/Yellow/Red)';

-- ==============================================================================
-- CAMPAIGNS TABLE: Add Custom Campaign Fields
-- ==============================================================================

-- Add target_tags array for filtering leads
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS target_tags text[];

-- Add messages JSONB for custom message sequences
-- Format: [{"step": 1, "delayMinutes": 60, "text": "Hi {{first_name}}..."}]
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS messages jsonb;

-- Add start_datetime for scheduled campaign activation
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS start_datetime timestamp with time zone;

-- Add enrollment_status for lifecycle management
-- Values: 'scheduled', 'active', 'paused', 'completed'
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS enrollment_status varchar(50) DEFAULT 'active';

-- Add max_leads_to_enroll for optional enrollment cap
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS max_leads_to_enroll integer;

-- Add leads_enrolled counter
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS leads_enrolled integer DEFAULT 0;

-- Add GIN index for target_tags array operations
CREATE INDEX IF NOT EXISTS idx_campaigns_target_tags ON campaigns USING gin (target_tags);

-- Add index for enrollment_status filtering (for cron job queries)
CREATE INDEX IF NOT EXISTS idx_campaigns_enrollment_status ON campaigns (enrollment_status);

-- Add index for start_datetime (for scheduled activation queries)
CREATE INDEX IF NOT EXISTS idx_campaigns_start_datetime ON campaigns (start_datetime);

COMMENT ON COLUMN campaigns.target_tags IS 'Array of Kajabi tags to filter leads by (for Custom campaign type)';
COMMENT ON COLUMN campaigns.messages IS 'JSONB array of message sequence steps with delays and text';
COMMENT ON COLUMN campaigns.start_datetime IS 'When to start enrolling leads (null = immediate, future = scheduled)';
COMMENT ON COLUMN campaigns.enrollment_status IS 'Lifecycle status: scheduled, active, paused, completed';
COMMENT ON COLUMN campaigns.max_leads_to_enroll IS 'Optional cap on number of leads to enroll (null = unlimited)';
COMMENT ON COLUMN campaigns.leads_enrolled IS 'Counter of leads enrolled in this campaign';

-- ==============================================================================
-- CAMPAIGN TAGS CACHE TABLE (Auto-Discovery)
-- ==============================================================================

-- Create table to store auto-discovered tags from leads
CREATE TABLE IF NOT EXISTS campaign_tags_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  tags JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for client lookups
CREATE INDEX IF NOT EXISTS idx_tags_cache_client ON campaign_tags_cache (client_id);

COMMENT ON TABLE campaign_tags_cache IS 'Auto-discovered Kajabi tags cache for campaign creation UI';
COMMENT ON COLUMN campaign_tags_cache.tags IS 'JSON array of valid Kajabi tags (form/webinar only, no operational tags)';
COMMENT ON COLUMN campaign_tags_cache.generated_at IS 'Timestamp when tags were last aggregated from leads';

-- ==============================================================================
-- DATA VALIDATION
-- ==============================================================================

-- Ensure all existing campaigns have enrollment_status set
UPDATE campaigns
SET enrollment_status = CASE
  WHEN is_paused = true THEN 'paused'
  ELSE 'active'
END
WHERE enrollment_status IS NULL;

-- Ensure all existing campaigns have leads_enrolled initialized
UPDATE campaigns
SET leads_enrolled = 0
WHERE leads_enrolled IS NULL;

-- ==============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ==============================================================================

-- Verify leads table updates
-- SELECT
--   COUNT(*) as total_leads,
--   COUNT(kajabi_tags) as leads_with_tags,
--   COUNT(engagement_level) as leads_with_engagement
-- FROM leads;

-- Verify campaigns table updates
-- SELECT
--   COUNT(*) as total_campaigns,
--   COUNT(target_tags) as campaigns_with_target_tags,
--   COUNT(messages) as campaigns_with_messages,
--   enrollment_status,
--   COUNT(*) as count_by_status
-- FROM campaigns
-- GROUP BY enrollment_status;

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==============================================================================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_leads_kajabi_tags;
-- DROP INDEX IF EXISTS idx_leads_engagement_level;
-- DROP INDEX IF EXISTS idx_campaigns_target_tags;
-- DROP INDEX IF EXISTS idx_campaigns_enrollment_status;
-- DROP INDEX IF EXISTS idx_campaigns_start_datetime;
-- ALTER TABLE leads DROP COLUMN IF EXISTS kajabi_tags;
-- ALTER TABLE leads DROP COLUMN IF EXISTS engagement_level;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS target_tags;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS messages;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS start_datetime;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS enrollment_status;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS max_leads_to_enroll;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS leads_enrolled;
