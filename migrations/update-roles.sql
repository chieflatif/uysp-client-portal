-- Migration: Update user roles to new naming convention
-- Date: 2025-10-23
-- Purpose: Rename ADMIN -> CLIENT_ADMIN and CLIENT -> CLIENT_USER

-- Update existing roles
UPDATE users SET role = 'CLIENT_ADMIN' WHERE role = 'ADMIN';
UPDATE users SET role = 'CLIENT_USER' WHERE role = 'CLIENT';

-- Add constraint to ensure only valid roles
-- Note: This is optional and can be added later if needed
-- ALTER TABLE users ADD CONSTRAINT check_role
--   CHECK (role IN ('SUPER_ADMIN', 'CLIENT_ADMIN', 'CLIENT_USER'));
