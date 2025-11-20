-- Migration: Add Campaign Completion Tracking
-- Purpose: Track when leads complete campaigns and maintain campaign history
-- Part of: Campaign Manager Upgrade v2 - Phase 1
-- Date: 2025-11-04

-- Add completedAt timestamp to track when lead finishes a campaign
ALTER TABLE leads ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add campaignHistory to maintain full history of all campaigns a lead has been through
-- Structure: [{campaignId, campaignName, enrolledAt, completedAt, messagesReceived, outcome}]
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_history JSONB DEFAULT '[]'::jsonb;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_leads_completed_at ON leads(completed_at);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_history ON leads USING gin(campaign_history);

-- Add comment for documentation
COMMENT ON COLUMN leads.completed_at IS 'Timestamp when the lead completed their current campaign (received last message)';
COMMENT ON COLUMN leads.campaign_history IS 'JSON array of all campaigns the lead has been enrolled in with timestamps and outcomes';

-- Migrate existing data: Find leads that should have completed based on position
-- This identifies "stuck" leads who have received messages but aren't marked complete
UPDATE leads
SET
    completed_at = COALESCE(last_message_at, updated_at),
    campaign_history = jsonb_build_array(
        jsonb_build_object(
            'campaignId', campaign_id,
            'campaignName', campaign_name,
            'enrolledAt', created_at,
            'completedAt', COALESCE(last_message_at, updated_at),
            'messagesReceived', sms_sequence_position,
            'outcome', CASE
                WHEN booked = true THEN 'booked'
                WHEN sms_stop = true THEN 'opted_out'
                ELSE 'completed'
            END
        )
    )
WHERE
    campaign_id IS NOT NULL
    AND sms_sequence_position >= 1
    AND completed_at IS NULL;

-- Log migration completion
INSERT INTO activity_log (user_id, action, details, ip_address)
VALUES (
    NULL,
    'MIGRATION',
    jsonb_build_object(
        'migration', '0019_add_campaign_completion_tracking',
        'timestamp', NOW(),
        'changes', 'Added completed_at and campaign_history fields to leads table'
    ),
    '127.0.0.1'
);