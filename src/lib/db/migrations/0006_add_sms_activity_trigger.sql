-- Migration: Add SMS Activity Logger Trigger
-- Purpose: Automatically log SMS_SENT events to lead_activity_log when sms_sent_count increments
-- Created: 2025-11-11
-- Related: Data Integrity Restoration (Phase 1)

-- Create function to log SMS activity
CREATE OR REPLACE FUNCTION log_sms_activity_on_increment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if sms_sent_count actually increased (not just updated)
  IF NEW.sms_sent_count > OLD.sms_sent_count THEN
    INSERT INTO lead_activity_log (
      id,
      event_type,
      event_category,
      lead_id,
      lead_airtable_id,
      client_id,
      description,
      message_content,
      metadata,
      source,
      execution_id,
      timestamp,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'SMS_SENT',
      'MESSAGING',
      NEW.id,
      NEW.airtable_record_id,
      NEW.client_id,
      'SMS message sent (auto-logged via trigger)',
      NULL, -- message_content not available at trigger level
      jsonb_build_object(
        'sms_sent_count', NEW.sms_sent_count,
        'increment', NEW.sms_sent_count - OLD.sms_sent_count,
        'sequence_position', NEW.sms_sequence_position,
        'processing_status', NEW.processing_status,
        'campaign_id', NEW.campaign_id,
        'trigger_source', 'database_trigger'
      ),
      'system:database-trigger',
      NULL, -- execution_id not available at trigger level
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on leads table
DROP TRIGGER IF EXISTS sms_activity_logger ON leads;

CREATE TRIGGER sms_activity_logger
AFTER UPDATE OF sms_sent_count ON leads
FOR EACH ROW
EXECUTE FUNCTION log_sms_activity_on_increment();

-- Add comment for documentation
COMMENT ON FUNCTION log_sms_activity_on_increment() IS
'Automatically logs SMS_SENT events to lead_activity_log when sms_sent_count increments.
This ensures activity timeline is populated even if n8n workflow logging fails.';

COMMENT ON TRIGGER sms_activity_logger ON leads IS
'Auto-logs SMS activity events. Fires only when sms_sent_count increases, preventing duplicate entries.';
