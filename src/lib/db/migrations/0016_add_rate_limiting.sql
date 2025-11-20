-- Migration: Add Database-Based Rate Limiting
-- Date: 2025-11-04
-- Description: Creates rate limiting table to fix serverless rate limiting issue
-- Related: BUG #11 - In-memory rate limiting doesn't work across serverless instances

-- ==============================================================================
-- RATE LIMIT TRACKING TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL, -- e.g., 'ai-message-generation', 'login', 'api-sync'
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Unique constraint: one rate limit record per user+endpoint+window
  UNIQUE(user_id, endpoint, window_start)
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits (user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits (user_id, endpoint, window_end);

-- Add comments
COMMENT ON TABLE rate_limits IS 'Database-based rate limiting for serverless environment';
COMMENT ON COLUMN rate_limits.endpoint IS 'API endpoint or feature being rate limited';
COMMENT ON COLUMN rate_limits.request_count IS 'Number of requests made in current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start time of rate limit window';
COMMENT ON COLUMN rate_limits.window_end IS 'End time of rate limit window (expires_at)';

-- ==============================================================================
-- CLEANUP OLD RATE LIMIT RECORDS (Run periodically via cron)
-- ==============================================================================

-- Function to clean up expired rate limit windows (optional - run manually or via cron)
-- DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '7 days';

-- ==============================================================================
-- EXAMPLE USAGE
-- ==============================================================================

-- Check if user has exceeded rate limit:
-- SELECT request_count FROM rate_limits
-- WHERE user_id = $1 AND endpoint = $2 AND window_end > NOW()
-- ORDER BY window_start DESC LIMIT 1;

-- Increment rate limit counter:
-- INSERT INTO rate_limits (user_id, endpoint, request_count, window_start, window_end)
-- VALUES ($1, $2, 1, NOW(), NOW() + INTERVAL '1 hour')
-- ON CONFLICT (user_id, endpoint, window_start)
-- DO UPDATE SET request_count = rate_limits.request_count + 1, updated_at = NOW()
-- RETURNING request_count;

-- ==============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ==============================================================================

-- Verify table creation
-- SELECT COUNT(*) FROM rate_limits;

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==============================================================================

-- To rollback this migration:
-- DROP TABLE IF EXISTS rate_limits CASCADE;
