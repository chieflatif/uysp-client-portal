-- Migration: Add composite indexes for performance optimization
-- Date: 2025-11-07
-- Purpose: Improve query performance for common access patterns

-- Campaign activation cron job optimization
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_activation
  ON campaigns(enrollment_status, start_datetime)
  WHERE enrollment_status = 'scheduled';

COMMENT ON INDEX idx_campaigns_scheduled_activation IS 'Optimizes cron job for activating scheduled campaigns';

-- Lead eligibility queries (for SMS campaigns)
CREATE INDEX IF NOT EXISTS idx_leads_eligibility
  ON leads(client_id, sms_stop, booked, sms_sequence_position)
  WHERE is_active = true;

COMMENT ON INDEX idx_leads_eligibility IS 'Optimizes queries for finding eligible leads for SMS campaigns';

-- Lead campaign tracking
CREATE INDEX IF NOT EXISTS idx_leads_campaign_sequence
  ON leads(campaign_id, sms_sequence_position)
  WHERE campaign_id IS NOT NULL;

COMMENT ON INDEX idx_leads_campaign_sequence IS 'Optimizes queries for tracking lead progress in campaigns';

-- Activity log filtering (by lead and category)
CREATE INDEX IF NOT EXISTS idx_activity_lead_category
  ON lead_activity_log(lead_id, event_category, timestamp DESC);

COMMENT ON INDEX idx_activity_lead_category IS 'Optimizes activity timeline queries with category filtering';

-- Sync queue processing
CREATE INDEX IF NOT EXISTS idx_sync_queue_processing
  ON airtable_sync_queue(status, created_at)
  WHERE status IN ('pending', 'processing');

COMMENT ON INDEX idx_sync_queue_processing IS 'Optimizes sync queue processing queries';
