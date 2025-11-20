-- Migration: Unify Campaign Model
-- Purpose: Migrate legacy messageTemplate to messages array format
-- Part of: Campaign Manager Upgrade v2 - Phase 2
-- Date: 2025-11-04

-- Step 1: Add isActive field for deactivation support (different from isPaused)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Migrate existing messageTemplate to messages array format
-- Only migrate if messages column is null/empty and messageTemplate exists
UPDATE campaigns
SET messages = jsonb_build_array(
    jsonb_build_object(
        'step', 1,
        'delayMinutes', 0,
        'text', message_template,
        'type', 'sms'
    )
)
WHERE
    message_template IS NOT NULL
    AND message_template != ''
    AND (messages IS NULL OR messages = '[]'::jsonb);

-- Step 3: Set default message for campaigns without any messages
UPDATE campaigns
SET messages = jsonb_build_array(
    jsonb_build_object(
        'step', 1,
        'delayMinutes', 0,
        'text', 'Hi {{firstName}}, this is your enrollment confirmation for ' || name || '. We''ll be in touch soon!',
        'type', 'sms'
    )
)
WHERE
    (message_template IS NULL OR message_template = '')
    AND (messages IS NULL OR messages = '[]'::jsonb);

-- Step 4: Add stats tracking fields
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS active_leads_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_leads_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS opted_out_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS booked_count INTEGER DEFAULT 0;

-- Step 5: Calculate initial stats from existing data
UPDATE campaigns c
SET
    active_leads_count = (
        SELECT COUNT(*) FROM leads l
        WHERE l.campaign_link_id = c.id AND l.completed_at IS NULL
    ),
    completed_leads_count = (
        SELECT COUNT(*) FROM leads l
        WHERE l.campaign_link_id = c.id AND l.completed_at IS NOT NULL
    ),
    opted_out_count = (
        SELECT COUNT(*) FROM leads l
        WHERE l.campaign_link_id = c.id AND l.sms_stop = true
    ),
    booked_count = (
        SELECT COUNT(*) FROM leads l
        WHERE l.campaign_link_id = c.id AND l.booked = true
    );

-- Step 6: Add index for active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);

-- Step 7: Add deactivated_at timestamp for audit trail
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Step 8: Add last_enrollment_at to track recent activity
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_enrollment_at TIMESTAMP WITH TIME ZONE;

-- Update last_enrollment_at based on existing data
UPDATE campaigns c
SET last_enrollment_at = (
    SELECT MAX(l.created_at)
    FROM leads l
    WHERE l.campaign_link_id = c.id
);

-- Add comments for documentation
COMMENT ON COLUMN campaigns.is_active IS 'Whether campaign accepts new enrollments (false = archived)';
COMMENT ON COLUMN campaigns.messages IS 'Unified message array format: [{step, delayMinutes, text, type}]';
COMMENT ON COLUMN campaigns.active_leads_count IS 'Count of leads currently in this campaign';
COMMENT ON COLUMN campaigns.completed_leads_count IS 'Count of leads who completed this campaign';
COMMENT ON COLUMN campaigns.opted_out_count IS 'Count of leads who opted out from this campaign';
COMMENT ON COLUMN campaigns.booked_count IS 'Count of leads who booked from this campaign';
COMMENT ON COLUMN campaigns.deactivated_at IS 'When the campaign was deactivated/archived';
COMMENT ON COLUMN campaigns.last_enrollment_at IS 'Most recent lead enrollment timestamp';

-- Log migration
INSERT INTO activity_log (user_id, action, details, ip_address)
VALUES (
    NULL,
    'MIGRATION',
    jsonb_build_object(
        'migration', '0020_unify_campaign_model',
        'timestamp', NOW(),
        'changes', 'Unified campaign model with messages array, added stats tracking'
    ),
    '127.0.0.1'
);