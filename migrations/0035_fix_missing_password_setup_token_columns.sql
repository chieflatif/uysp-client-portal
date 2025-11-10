-- Migration 0035: Fix Missing Password Setup Token Columns
-- Date: 2025-11-10
-- CRITICAL: Authentication failure - columns missing from production database
--
-- ROOT CAUSE:
-- - Migration 0032 (deleted as "duplicate") added columns to users table
-- - Migration 0015 (kept) creates SEPARATE password_setup_tokens table
-- - These are NOT duplicates - they implement different architectures
-- - Code expects columns on users table (migration 0032 approach)
-- - Production database never got the columns → "column does not exist" error
--
-- RESOLUTION:
-- - Re-add the columns from deleted migration 0032
-- - This unblocks authentication immediately

-- Add missing columns to users table (split into separate statements for safety)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_setup_token VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_setup_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for fast token lookup (partial index - only non-null tokens)
CREATE INDEX IF NOT EXISTS idx_users_setup_token
  ON users(password_setup_token)
  WHERE password_setup_token IS NOT NULL;

-- Add documentation comments
COMMENT ON COLUMN users.password_setup_token IS 'Secure token for one-time password setup (generated when user created)';
COMMENT ON COLUMN users.password_setup_token_expiry IS 'Expiry timestamp for password setup token (typically 24-48 hours)';

-- Verification query (run after migration)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name LIKE '%password_setup%';
