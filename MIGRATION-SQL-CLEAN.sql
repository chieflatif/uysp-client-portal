-- ============================================================================
-- COPY/PASTE THIS ENTIRE FILE INTO RENDER DATABASE SHELL
-- ============================================================================
-- Migration: 0009_add_webinar_campaigns
-- Date: 2025-11-03
-- Safe: All commands use IF NOT EXISTS (idempotent)
-- ============================================================================

-- Extend SMS_Templates with Template Type
ALTER TABLE sms_templates
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'Standard'
    CHECK (template_type IN ('Webinar', 'Standard'));

CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(template_type);

-- Extend Campaigns with Webinar Fields
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

-- Unique constraint: one form_id per client
ALTER TABLE campaigns 
  ADD CONSTRAINT IF NOT EXISTS unique_form_id_per_client UNIQUE(client_id, form_id);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_form_id ON campaigns(form_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_paused);

-- Extend Leads with Webinar Routing Fields
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS form_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS webinar_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'Standard Form' 
    CHECK (lead_source IN ('Webinar Form', 'Standard Form', 'Manual', 'Bulk Import')),
  ADD COLUMN IF NOT EXISTS campaign_link_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_form_id ON leads(form_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_webinar_datetime ON leads(webinar_datetime);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_link ON leads(campaign_link_id);

-- ============================================================================
-- Verification (shows success message)
-- ============================================================================
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sms_templates' AND column_name = 'template_type'
  ) THEN
    missing_columns := array_append(missing_columns, 'sms_templates.template_type');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'campaign_type'
  ) THEN
    missing_columns := array_append(missing_columns, 'campaigns.campaign_type');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lead_source'
  ) THEN
    missing_columns := array_append(missing_columns, 'leads.lead_source');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migration incomplete. Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'Migration 0009 completed successfully. All webinar campaign fields added.';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

