-- Migration: Fix De-enrollment Function to Use Enrolled Message Count
-- Purpose: Update get_leads_for_de_enrollment function to use enrolled_message_count
-- Part of: Campaign Manager Upgrade V2 - De-enrollment Fix
-- Date: 2025-11-05
-- CRITICAL: This ensures leads are de-enrolled based on their enrolled sequence length,
--           not the current campaign sequence length (which may have changed)

BEGIN; -- TRANSACTION SAFETY

-- ============================================================================
-- STEP 1: Update the de-enrollment function
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Verification
-- ============================================================================

DO $$
DECLARE
  v_function_exists BOOLEAN;
  v_function_source TEXT;
BEGIN
  -- Check function exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_leads_for_de_enrollment'
  ) INTO v_function_exists;

  IF NOT v_function_exists THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: get_leads_for_de_enrollment function not found';
  END IF;

  -- Check that function contains the new logic
  SELECT pg_get_functiondef(p.oid) INTO v_function_source
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_leads_for_de_enrollment';

  IF v_function_source NOT LIKE '%enrolled_message_count%' THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: Function does not use enrolled_message_count';
  END IF;

  RAISE NOTICE '✅ Migration 0028 complete';
  RAISE NOTICE 'Updated function: get_leads_for_de_enrollment';
  RAISE NOTICE 'Now uses: l.enrolled_message_count instead of jsonb_array_length(c.messages)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICATION COMMANDS:';
  RAISE NOTICE '1. Check function: \df+ get_leads_for_de_enrollment';
  RAISE NOTICE '2. Test query: SELECT * FROM get_leads_for_de_enrollment(''<client_id>'', 5);';
END $$;

COMMIT; -- END TRANSACTION
