-- Migration: Add booking_link field to campaigns table
-- Purpose: Allow each campaign to have its own booking/Calendly link for AI message generation
-- Date: 2025-11-04

-- Add booking_link column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS booking_link VARCHAR(500);

-- Add index for potential lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_booking_link ON campaigns(booking_link);

-- Set default UYSP booking link for existing campaigns (can be overridden)
UPDATE campaigns 
SET booking_link = 'https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr'
WHERE booking_link IS NULL;

-- Add comment to column
COMMENT ON COLUMN campaigns.booking_link IS 'Calendly or booking link to include in AI-generated messages';
