-- Migration: Add foreign key constraints for data integrity
-- Date: 2025-11-07
-- Purpose: Prevent orphaned records and ensure referential integrity

-- IMPORTANT: Run this migration during low-traffic period
-- Foreign key validation can take time on large tables

-- Add foreign keys to leads table
ALTER TABLE leads
  ADD CONSTRAINT IF NOT EXISTS fk_leads_client_id
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE RESTRICT;  -- Prevent deleting clients with leads

ALTER TABLE leads
  ADD CONSTRAINT IF NOT EXISTS fk_leads_claimed_by
  FOREIGN KEY (claimed_by)
  REFERENCES users(id)
  ON DELETE SET NULL;  -- Allow user deletion, just clear the claim

-- Add foreign keys to campaigns table
ALTER TABLE campaigns
  ADD CONSTRAINT IF NOT EXISTS fk_campaigns_client_id
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE CASCADE;  -- Delete campaigns when client is deleted

-- Add foreign keys to users table
ALTER TABLE users
  ADD CONSTRAINT IF NOT EXISTS fk_users_client_id
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE RESTRICT;  -- Prevent deleting clients with users

-- Add foreign keys to lead_activity_log table
ALTER TABLE lead_activity_log
  ADD CONSTRAINT IF NOT EXISTS fk_activity_lead_id
  FOREIGN KEY (lead_id)
  REFERENCES leads(id)
  ON DELETE CASCADE;  -- Delete activity when lead is deleted

-- Add foreign keys to notes table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    ALTER TABLE notes
      ADD CONSTRAINT IF NOT EXISTS fk_notes_lead_id
      FOREIGN KEY (lead_id)
      REFERENCES leads(id)
      ON DELETE CASCADE;

    ALTER TABLE notes
      ADD CONSTRAINT IF NOT EXISTS fk_notes_created_by
      FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- Comments for documentation
COMMENT ON CONSTRAINT fk_leads_client_id ON leads IS 'Ensures lead belongs to valid client';
COMMENT ON CONSTRAINT fk_leads_claimed_by ON leads IS 'Ensures claimed_by references valid user';
COMMENT ON CONSTRAINT fk_campaigns_client_id ON campaigns IS 'Ensures campaign belongs to valid client';
COMMENT ON CONSTRAINT fk_users_client_id ON users IS 'Ensures user belongs to valid client';
COMMENT ON CONSTRAINT fk_activity_lead_id ON lead_activity_log IS 'Ensures activity log references valid lead';
