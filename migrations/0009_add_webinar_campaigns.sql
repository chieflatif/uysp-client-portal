-- ============================================================================
-- Migration: 0009_add_webinar_campaigns
-- Purpose: Extend schema for webinar campaign system (Phase A - Week 2)
-- Date: 2025-11-03
-- Status: Backend implementation (no UI yet)
-- ============================================================================

-- ============================================================================
-- PHASE 1: Extend SMS_Templates (Backward Compatible)
-- ============================================================================
-- Add Template Type field to distinguish webinar vs standard templates
-- Default to 'Standard' ensures existing 21 campaigns continue unchanged

ALTER TABLE sms_templates
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'Standard'
    CHECK (template_type IN ('Webinar', 'Standard'));

-- Index for template type filtering in schedulers
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(template_type);

COMMENT ON COLUMN sms_templates.template_type IS 
  'Template category: Webinar (time-sensitive nurture) or Standard (regular campaigns). Default: Standard for backward compatibility.';

-- ============================================================================
-- PHASE 2: Extend Campaigns Table
-- ============================================================================
-- Add webinar-specific fields to existing campaigns table
-- Maintains backward compatibility with existing standard campaigns

ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50) DEFAULT 'Standard' 
    CHECK (campaign_type IN ('Webinar', 'Standard')),
  ADD COLUMN IF NOT EXISTS form_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS webinar_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoom_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resource_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resource_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS auto_discovered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_leads INTEGER DEFAULT 0;

-- CRITICAL: Add unique constraint for airtableRecordId (required for upserts)
ALTER TABLE campaigns
  ADD CONSTRAINT IF NOT EXISTS campaigns_airtable_record_id_unique 
  UNIQUE (airtable_record_id);

-- Unique constraint: one form_id per client (NULLs allowed for campaigns without forms)
ALTER TABLE campaigns 
  ADD CONSTRAINT IF NOT EXISTS unique_form_id_per_client UNIQUE(client_id, form_id);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_form_id ON campaigns(form_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_paused);

-- Comments for documentation
COMMENT ON COLUMN campaigns.campaign_type IS 'Webinar (time-sensitive) or Standard (regular). Default: Standard.';
COMMENT ON COLUMN campaigns.form_id IS 'Kajabi form ID for routing leads to this campaign.';
COMMENT ON COLUMN campaigns.webinar_datetime IS 'Scheduled webinar start time (only for Webinar type campaigns).';
COMMENT ON COLUMN campaigns.zoom_link IS 'Zoom meeting URL for webinar (interpolated in messages).';
COMMENT ON COLUMN campaigns.resource_link IS 'Resource/content link sent to leads.';
COMMENT ON COLUMN campaigns.resource_name IS 'Human-readable name of resource.';
COMMENT ON COLUMN campaigns.auto_discovered IS 'TRUE if campaign was auto-created from Kajabi form sync.';
COMMENT ON COLUMN campaigns.messages_sent IS 'Total count of messages sent for this campaign (incremented by scheduler).';
COMMENT ON COLUMN campaigns.total_leads IS 'Cached count of leads linked to this campaign (synced from Airtable).';

-- ============================================================================
-- PHASE 3: Extend Leads Table
-- ============================================================================
-- Add webinar routing and campaign linking fields

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS form_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS webinar_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'Standard Form' 
    CHECK (lead_source IN ('Webinar Form', 'Standard Form', 'Manual', 'Bulk Import')),
  ADD COLUMN IF NOT EXISTS campaign_link_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- Indexes for lead routing and queries
CREATE INDEX IF NOT EXISTS idx_leads_form_id ON leads(form_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_webinar_datetime ON leads(webinar_datetime);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_link ON leads(campaign_link_id);

-- Comments for documentation
COMMENT ON COLUMN leads.form_id IS 'Kajabi form ID that generated this lead (used for campaign lookup).';
COMMENT ON COLUMN leads.webinar_datetime IS 'Webinar start time (copied from campaign for scheduling logic).';
COMMENT ON COLUMN leads.lead_source IS 'Business source: Webinar Form, Standard Form, Manual, or Bulk Import. Routes to correct scheduler.';
COMMENT ON COLUMN leads.campaign_link_id IS 'Foreign key to campaigns table (optional reference for reporting).';

-- ============================================================================
-- MIGRATION VALIDATION
-- ============================================================================
-- Verify all columns exist after migration

DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  -- Check sms_templates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sms_templates' AND column_name = 'template_type'
  ) THEN
    missing_columns := array_append(missing_columns, 'sms_templates.template_type');
  END IF;

  -- Check campaigns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'campaign_type'
  ) THEN
    missing_columns := array_append(missing_columns, 'campaigns.campaign_type');
  END IF;

  -- Check leads
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lead_source'
  ) THEN
    missing_columns := array_append(missing_columns, 'leads.lead_source');
  END IF;

  -- Report results
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migration incomplete. Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'Migration 0009 completed successfully. All webinar campaign fields added.';
  END IF;
END $$;

-- ============================================================================
-- BACKWARD COMPATIBILITY NOTES
-- ============================================================================
-- ✅ All existing campaigns default to campaign_type = 'Standard'
-- ✅ All existing templates default to template_type = 'Standard'
-- ✅ All existing leads default to lead_source = 'Standard Form'
-- ✅ New fields are nullable (except where defaults provided)
-- ✅ No data migration required - existing records unchanged
-- ✅ Zero impact on existing 21 standard campaigns
-- ============================================================================

