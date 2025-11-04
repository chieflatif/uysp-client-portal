-- Add must_change_password column to users table
-- This tracks if user needs to change password on first login

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Set must_change_password to true for any users without a last_login_at
-- (they've never logged in, likely have auto-generated password)
UPDATE users 
SET must_change_password = TRUE 
WHERE last_login_at IS NULL 
  AND role != 'SUPER_ADMIN';

COMMENT ON COLUMN users.must_change_password IS 'TRUE if user must change password on next login (auto-generated or reset)';









