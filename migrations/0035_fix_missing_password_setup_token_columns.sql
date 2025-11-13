-- Migration: Add missing password setup token columns to users table
-- Date: 2025-11-13
-- Issue: Schema mismatch - Drizzle schema expects these columns but they don't exist in DB

-- Step 1: Add must_change_password
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'must_change_password'
    ) THEN
        ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added must_change_password column';
    ELSE
        RAISE NOTICE 'Column must_change_password already exists';
    END IF;
END $$;

-- Step 2: Add password_setup_token
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_setup_token'
    ) THEN
        ALTER TABLE users ADD COLUMN password_setup_token VARCHAR(255);
        RAISE NOTICE 'Added password_setup_token column';
    ELSE
        RAISE NOTICE 'Column password_setup_token already exists';
    END IF;
END $$;

-- Step 3: Add password_setup_token_expiry
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_setup_token_expiry'
    ) THEN
        ALTER TABLE users ADD COLUMN password_setup_token_expiry TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added password_setup_token_expiry column';
    ELSE
        RAISE NOTICE 'Column password_setup_token_expiry already exists';
    END IF;
END $$;

-- Step 4: Add index
CREATE INDEX IF NOT EXISTS idx_users_setup_token ON users (password_setup_token);
