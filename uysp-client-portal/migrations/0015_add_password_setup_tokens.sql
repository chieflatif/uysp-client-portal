-- Migration: Add Password Setup Tokens for Secure Password Reset
-- Date: 2025-11-04
-- Description: Creates secure token-based system for password setup to fix CVE 9.1 authentication bypass
-- Related: CRITICAL-AUDIT-FINDINGS.md - Password Setup Endpoint Vulnerability

-- ==============================================================================
-- PASSWORD SETUP TOKENS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS password_setup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE, -- Secure random token (UUID)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE, -- NULL if unused, timestamp if used
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL -- Admin who created this token
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_token ON password_setup_tokens (token);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_user_id ON password_setup_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_expires_at ON password_setup_tokens (expires_at);

-- Add comments
COMMENT ON TABLE password_setup_tokens IS 'Secure tokens for password setup - prevents authentication bypass';
COMMENT ON COLUMN password_setup_tokens.token IS 'Secure random token (UUID) for one-time password setup';
COMMENT ON COLUMN password_setup_tokens.expires_at IS 'Token expiration time (typically 24 hours from creation)';
COMMENT ON COLUMN password_setup_tokens.used_at IS 'Timestamp when token was used (NULL if unused)';
COMMENT ON COLUMN password_setup_tokens.created_by_user_id IS 'Admin user who generated this token';

-- ==============================================================================
-- CLEANUP OLD EXPIRED TOKENS (Run periodically via cron)
-- ==============================================================================

-- Function to clean up expired tokens (optional - can be run manually)
-- DELETE FROM password_setup_tokens WHERE expires_at < NOW() AND used_at IS NULL;

-- ==============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ==============================================================================

-- Verify table creation
-- SELECT COUNT(*) FROM password_setup_tokens;

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==============================================================================

-- To rollback this migration:
-- DROP TABLE IF EXISTS password_setup_tokens CASCADE;
