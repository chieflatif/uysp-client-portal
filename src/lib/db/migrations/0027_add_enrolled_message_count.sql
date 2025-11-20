-- Migration: Add enrolled_message_count to leads table
-- Purpose: Store message count at enrollment time for version-aware de-enrollment
-- Part of: Campaign Manager Upgrade V2 - De-enrollment Fix
-- Date: 2025-11-05
-- CRITICAL: This field enables leads to be de-enrolled based on their enrolled sequence length,
--           not the current campaign sequence length (which may have changed due to upgrades)

BEGIN; -- TRANSACTION SAFETY

-- ============================================================================
-- STEP 1: Add enrolled_message_count column
-- ============================================================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS enrolled_message_count INTEGER DEFAULT 0 NOT NULL;

-- ============================================================================
-- STEP 2: Backfill existing data
-- ============================================================================

-- For leads currently enrolled (campaign_id IS NOT NULL), calculate their message count
-- from the current campaign. This is a one-time backfill for existing enrollments.
UPDATE leads l
SET enrolled_message_count = COALESCE(
  (SELECT jsonb_array_length(c.messages)
   FROM campaigns c
   WHERE c.id = l.campaign_id),
  0
)
WHERE l.campaign_id IS NOT NULL
  AND l.enrolled_message_count = 0;

-- ============================================================================
-- STEP 3: Create performance index
-- ============================================================================

-- Index for de-enrollment queries that compare position to enrolled message count
CREATE INDEX IF NOT EXISTS idx_leads_enrolled_message_count
  ON leads(campaign_id, enrolled_message_count, sms_sequence_position)
  WHERE campaign_id IS NOT NULL AND is_active = true;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_leads_with_count INTEGER;
  v_leads_enrolled INTEGER;
BEGIN
  -- Check column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
      AND column_name = 'enrolled_message_count'
  ) INTO v_column_exists;

  IF NOT v_column_exists THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: enrolled_message_count column not created';
  END IF;

  -- Check backfill
  SELECT COUNT(*) INTO v_leads_enrolled
  FROM leads
  WHERE campaign_id IS NOT NULL;

  SELECT COUNT(*) INTO v_leads_with_count
  FROM leads
  WHERE campaign_id IS NOT NULL
    AND enrolled_message_count > 0;

  RAISE NOTICE '✅ Migration 0027 complete';
  RAISE NOTICE 'Column: enrolled_message_count added';
  RAISE NOTICE 'Backfill: % leads enrolled, % have message count', v_leads_enrolled, v_leads_with_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICATION COMMANDS:';
  RAISE NOTICE '1. Check column: \d leads';
  RAISE NOTICE '2. Check data: SELECT campaign_id, enrolled_message_count FROM leads WHERE campaign_id IS NOT NULL LIMIT 5;';
  RAISE NOTICE '3. Check index: \di idx_leads_enrolled_message_count';
END $$;

COMMIT; -- END TRANSACTION
