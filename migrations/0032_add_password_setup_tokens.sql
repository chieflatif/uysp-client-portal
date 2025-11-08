-- Migration: Add password setup token fields for secure password setup flow
-- Date: 2025-11-07
-- Purpose: Prevent unauthorized password setup by requiring secure tokens

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_setup_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_setup_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_users_setup_token
  ON users(password_setup_token)
  WHERE password_setup_token IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN users.password_setup_token IS 'Secure token for one-time password setup (generated when user created)';
COMMENT ON COLUMN users.password_setup_token_expiry IS 'Expiry timestamp for password setup token (typically 24-48 hours)';
