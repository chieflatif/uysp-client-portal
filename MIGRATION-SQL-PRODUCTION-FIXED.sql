-- ============================================================================
-- PRODUCTION MIGRATION: 0009_add_webinar_campaigns (FIXED)
-- Date: 2025-11-03
-- Safe: Creates missing tables + extends existing tables
-- ============================================================================

-- ============================================================================
-- PHASE 1: Create SMS_Templates Table (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_record_id VARCHAR(255) NOT NULL UNIQUE,
  campaign VARCHAR(255) NOT NULL,
  variant VARCHAR(10),
  step INTEGER NOT NULL,
  delay_days INTEGER,
  fast_delay_minutes INTEGER,
  body TEXT NOT NULL,
  template_type VARCHAR(50) DEFAULT 'Standard' CHECK (template_type IN ('Webinar', 'Standard')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for sms_templates (only create if table was missing)
CREATE INDEX IF NOT EXISTS idx_sms_templates_campaign ON sms_templates(campaign);
CREATE INDEX IF NOT EXISTS idx_sms_templates_step ON sms_templates(step);
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(template_type);

-- If table already existed, add template_type column
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'Standard' CHECK (template_type IN ('Webinar', 'Standard'));

-- ============================================================================
-- PHASE 2: Extend Campaigns Table
-- ============================================================================
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50) DEFAULT 'Standard' CHECK (campaign_type IN ('Webinar', 'Standard')),
  ADD COLUMN IF NOT EXISTS form_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS webinar_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoom_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resource_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resource_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS auto_discovered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_leads INTEGER DEFAULT 0;

-- Add unique constraint (only if doesn't exist - try/catch pattern)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_airtable_record_id_unique'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_airtable_record_id_unique UNIQUE (airtable_record_id);
  END IF;
END $$;

-- Add form_id unique constraint (only if doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_form_id_per_client'
  ) THEN
    ALTER TABLE campaigns ADD CONSTRAINT unique_form_id_per_client UNIQUE(client_id, form_id);
  END IF;
END $$;

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_form_id ON campaigns(form_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_paused);

-- ============================================================================
-- PHASE 3: Extend Leads Table
-- ============================================================================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS form_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS webinar_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'Standard Form' CHECK (lead_source IN ('Webinar Form', 'Standard Form', 'Manual', 'Bulk Import')),
  ADD COLUMN IF NOT EXISTS campaign_link_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_form_id ON leads(form_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_webinar_datetime ON leads(webinar_datetime);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_link ON leads(campaign_link_id);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  campaigns_ok BOOLEAN;
  leads_ok BOOLEAN;
  templates_ok BOOLEAN;
BEGIN
  -- Check campaigns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'campaign_type'
  ) INTO campaigns_ok;

  -- Check leads  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lead_source'
  ) INTO leads_ok;
  
  -- Check sms_templates
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sms_templates' AND column_name = 'template_type'
  ) INTO templates_ok;

  IF campaigns_ok AND leads_ok AND templates_ok THEN
    RAISE NOTICE '✅ Migration 0009 completed successfully!';
    RAISE NOTICE '   - Campaigns table: % columns added', 9;
    RAISE NOTICE '   - Leads table: % columns added', 4;
    RAISE NOTICE '   - SMS_Templates table: % columns added', 1;
  ELSE
    RAISE WARNING '⚠️ Migration partially complete. Check: campaigns=%, leads=%, templates=%', campaigns_ok, leads_ok, templates_ok;
  END IF;
END $$;

