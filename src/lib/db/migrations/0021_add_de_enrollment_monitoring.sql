-- Migration: Add De-enrollment Monitoring and Performance Improvements
-- Phase 1: Campaign Manager Upgrade v2 - Production Hardening
-- Purpose: Add monitoring, checkpointing, and performance indexes for multi-client de-enrollment

BEGIN; -- TRANSACTION SAFETY

-- Create monitoring table for de-enrollment runs
CREATE TABLE IF NOT EXISTS de_enrollment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  run_type VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, manual, retry
  leads_evaluated INTEGER NOT NULL DEFAULT 0,
  leads_de_enrolled INTEGER NOT NULL DEFAULT 0,
  leads_skipped INTEGER NOT NULL DEFAULT 0,
  by_outcome JSONB NOT NULL DEFAULT '{"completed": 0, "booked": 0, "opted_out": 0}'::jsonb,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL, -- pending, running, success, failed, partial
  error_details TEXT,
  checkpoint_data JSONB, -- For resuming failed runs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for monitoring queries
CREATE INDEX idx_de_enrollment_runs_client_status
  ON de_enrollment_runs(client_id, status, run_at DESC);

CREATE INDEX idx_de_enrollment_runs_status_time
  ON de_enrollment_runs(status, run_at DESC);

CREATE INDEX idx_de_enrollment_runs_errors
  ON de_enrollment_runs(run_at DESC)
  WHERE status = 'failed';

-- Create table for tracking individual lead processing (for debugging)
CREATE TABLE IF NOT EXISTS de_enrollment_lead_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES de_enrollment_runs(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  client_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- de_enrolled, skipped, error
  outcome VARCHAR(50), -- completed, booked, opted_out
  messages_received INTEGER,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying individual lead processing
CREATE INDEX idx_de_enrollment_lead_log_run
  ON de_enrollment_lead_log(run_id, processed_at);

CREATE INDEX idx_de_enrollment_lead_log_lead
  ON de_enrollment_lead_log(lead_id, processed_at DESC);

-- Add missing performance indexes for de-enrollment queries
-- CRITICAL: These were missing and will cause performance issues at scale

-- Composite index for the main de-enrollment query
CREATE INDEX IF NOT EXISTS idx_leads_de_enrollment_check
  ON leads(client_id, is_active, processing_status, campaign_id, sms_sequence_position)
  WHERE is_active = true AND processing_status != 'Completed';

-- Index for finding leads by campaign
CREATE INDEX IF NOT EXISTS idx_leads_campaign_link
  ON leads(campaign_id, is_active)
  WHERE campaign_id IS NOT NULL;

-- Index for campaign message count queries
CREATE INDEX IF NOT EXISTS idx_campaigns_client_active
  ON campaigns(client_id, is_active)
  WHERE is_active = true;

-- Create function to get next batch of leads to process
-- This ensures consistent batching and prevents race conditions
CREATE OR REPLACE FUNCTION get_leads_for_de_enrollment(
  p_client_id UUID,
  p_batch_size INTEGER DEFAULT 100,
  p_last_processed_id UUID DEFAULT NULL
)
RETURNS TABLE (
  lead_id UUID,
  campaign_id UUID,
  campaign_name TEXT,
  current_position INTEGER,
  message_count INTEGER,
  is_booked BOOLEAN,
  is_opted_out BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH eligible_leads AS (
    SELECT
      l.id as lead_id,
      l.campaign_id as campaign_id,
      c.name as campaign_name,
      l.sms_sequence_position as current_position,
      COALESCE(l.enrolled_message_count, 0) as message_count, -- AUDIT FIX: Use enrolled count
      COALESCE(l.booked, false) as is_booked,
      COALESCE(l.sms_stop, false) as is_opted_out
    FROM leads l
    INNER JOIN campaigns c ON l.campaign_id = c.id
    WHERE
      l.client_id = p_client_id
      AND l.is_active = true
      AND l.processing_status != 'Completed'
      AND c.is_active = true
      AND l.sms_sequence_position > 0
      AND l.sms_sequence_position >= COALESCE(l.enrolled_message_count, 0) -- AUDIT FIX: Compare to enrolled count
      AND (p_last_processed_id IS NULL OR l.id > p_last_processed_id)
    ORDER BY l.id
    LIMIT p_batch_size
    FOR UPDATE OF l SKIP LOCKED -- Prevent concurrent processing
  )
  SELECT * FROM eligible_leads;
END;
$$;

-- Create function to process de-enrollment batch atomically
CREATE OR REPLACE FUNCTION process_de_enrollment_batch(
  p_run_id UUID,
  p_lead_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_processed_count INTEGER := 0;
BEGIN
  -- Update all leads in the batch atomically
  WITH updated AS (
    UPDATE leads
    SET
      is_active = false,
      processing_status = 'Completed',
      updated_at = NOW()
    WHERE
      id = ANY(p_lead_ids)
      AND is_active = true  -- Double-check to prevent double processing
      AND processing_status != 'Completed'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_processed_count FROM updated;

  RETURN v_processed_count;
END;
$$;

-- Create view for monitoring de-enrollment health
CREATE OR REPLACE VIEW de_enrollment_health AS
SELECT
  client_id,
  COUNT(*) FILTER (WHERE status = 'success' AND run_at > NOW() - INTERVAL '24 hours') as successful_runs_24h,
  COUNT(*) FILTER (WHERE status = 'failed' AND run_at > NOW() - INTERVAL '24 hours') as failed_runs_24h,
  COUNT(*) FILTER (WHERE status = 'partial' AND run_at > NOW() - INTERVAL '24 hours') as partial_runs_24h,
  MAX(run_at) FILTER (WHERE status = 'success') as last_success,
  MAX(run_at) FILTER (WHERE status = 'failed') as last_failure,
  AVG(duration_ms) FILTER (WHERE status = 'success' AND run_at > NOW() - INTERVAL '24 hours') as avg_duration_ms,
  SUM(leads_de_enrolled) FILTER (WHERE run_at > NOW() - INTERVAL '24 hours') as total_de_enrolled_24h
FROM de_enrollment_runs
GROUP BY client_id;

-- Add comments for documentation
COMMENT ON TABLE de_enrollment_runs IS 'Tracks each execution of the de-enrollment process for monitoring and debugging';
COMMENT ON TABLE de_enrollment_lead_log IS 'Detailed log of individual lead processing for debugging failed runs';
COMMENT ON FUNCTION get_leads_for_de_enrollment IS 'Safely retrieves next batch of leads to de-enroll with row locking';
COMMENT ON FUNCTION process_de_enrollment_batch IS 'Atomically processes a batch of leads for de-enrollment';
COMMENT ON VIEW de_enrollment_health IS 'Health metrics for de-enrollment process by client';

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE ON de_enrollment_runs TO your_app_user;
-- GRANT SELECT, INSERT ON de_enrollment_lead_log TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_leads_for_de_enrollment TO your_app_user;
-- GRANT EXECUTE ON FUNCTION process_de_enrollment_batch TO your_app_user;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'De-enrollment monitoring migration complete';
  RAISE NOTICE 'Created tables: de_enrollment_runs, de_enrollment_lead_log';
  RAISE NOTICE 'Created functions: get_leads_for_de_enrollment, process_de_enrollment_batch';
  RAISE NOTICE 'Created view: de_enrollment_health';
  RAISE NOTICE 'Added performance indexes for multi-client scaling';
END $$;

COMMIT; -- END TRANSACTION