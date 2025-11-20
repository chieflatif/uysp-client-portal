-- Migration: Add Campaign Versioning Support
-- Purpose: Enable message snapshotting and version tracking for in-place campaign upgrades
-- Part of: Campaign Manager Upgrade v2 - Phase 2 (Critical Versioning)
-- Date: 2025-11-05
-- CRITICAL: This migration adds the missing fields required for the versioning architecture

BEGIN; -- TRANSACTION SAFETY

-- ============================================================================
-- STEP 1: Add version field to campaigns table
-- ============================================================================

-- This field tracks the current version of the campaign's message sequence
-- Increments by 1 each time messages are edited
-- Used to detect when a campaign has been upgraded since a lead enrolled
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create index for version queries (used in de-enrollment logic)
CREATE INDEX IF NOT EXISTS idx_campaigns_version
ON campaigns(id, version);

-- Add documentation comment
COMMENT ON COLUMN campaigns.version IS
'Campaign version number (increments on message edits). Used to track which version leads enrolled in.';

-- ============================================================================
-- STEP 2: Add enrolled_campaign_version to leads table
-- ============================================================================

-- This field captures the campaign.version value at the moment of lead enrollment
-- CRITICAL: This is the "snapshot" mechanism - stores which version the lead is following
-- Enables in-progress leads to finish their original sequence even after campaign is upgraded
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS enrolled_campaign_version INTEGER;

-- Create index for version comparison queries (performance critical for de-enrollment)
CREATE INDEX IF NOT EXISTS idx_leads_enrolled_version
ON leads(campaign_id, enrolled_campaign_version)
WHERE campaign_id IS NOT NULL;

-- Add documentation comment
COMMENT ON COLUMN leads.enrolled_campaign_version IS
'Snapshot of campaigns.version at time of enrollment. Enables in-progress leads to complete original sequence when campaign is upgraded.';

-- ============================================================================
-- STEP 3: Backfill existing data
-- ============================================================================

-- For existing campaigns: Set version = 1 (already default, but explicit for clarity)
UPDATE campaigns
SET version = 1
WHERE version IS NULL;

-- For existing enrolled leads: Set enrolled_campaign_version = 1
-- (Assumes all existing leads were enrolled in version 1 of their campaigns)
UPDATE leads
SET enrolled_campaign_version = 1
WHERE campaign_id IS NOT NULL
  AND enrolled_campaign_version IS NULL;

-- ============================================================================
-- STEP 4: Verification queries (run these manually after migration)
-- ============================================================================

-- Verify campaigns.version field exists and is populated
-- Expected: All campaigns have version = 1
-- Run: SELECT id, name, version FROM campaigns LIMIT 10;

-- Verify leads.enrolled_campaign_version exists and is populated
-- Expected: All enrolled leads have enrolled_campaign_version = 1
-- Run: SELECT id, first_name, last_name, campaign_id, enrolled_campaign_version FROM leads WHERE campaign_id IS NOT NULL LIMIT 10;

-- ============================================================================
-- STEP 5: Log migration completion
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 0022 complete';
  RAISE NOTICE 'Added campaigns.version field (tracks campaign version number)';
  RAISE NOTICE 'Added leads.enrolled_campaign_version field (snapshot mechanism)';
  RAISE NOTICE 'Backfilled existing data with version = 1';
  RAISE NOTICE 'Created performance indexes for version queries';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 NEXT STEPS:';
  RAISE NOTICE '1. Verify fields: \d campaigns';
  RAISE NOTICE '2. Verify fields: \d leads';
  RAISE NOTICE '3. Test query: SELECT id, name, version FROM campaigns LIMIT 5;';
  RAISE NOTICE '4. Test query: SELECT id, campaign_id, enrolled_campaign_version FROM leads WHERE campaign_id IS NOT NULL LIMIT 5;';
END $$;

COMMIT; -- END TRANSACTION
