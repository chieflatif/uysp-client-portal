-- 0040_schema_parity.sql
-- Ensures critical auth + lead columns exist in every environment

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'password_setup_token'
  ) THEN
    ALTER TABLE users
      ADD COLUMN password_setup_token VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'password_setup_token_expiry'
  ) THEN
    ALTER TABLE users
      ADD COLUMN password_setup_token_expiry TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_setup_token ON users (password_setup_token);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE leads
      ADD COLUMN notes TEXT;
  END IF;
END $$;
