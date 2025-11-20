-- Create user_activity_sessions table for activity tracking
-- Note: user_sessions table already exists for NextAuth, so we use a different name

CREATE TABLE IF NOT EXISTS user_activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  client_id UUID,
  session_start TIMESTAMP NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP,
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  page_views INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  device_type VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_id ON user_activity_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_client_id ON user_activity_sessions(client_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_session_id ON user_activity_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_start ON user_activity_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_end ON user_activity_sessions(session_end);

-- Add comments
COMMENT ON TABLE user_activity_sessions IS 'Tracks user activity sessions with start/end times and activity metrics (separate from NextAuth sessions)';
COMMENT ON COLUMN user_activity_sessions.duration_seconds IS 'Total session duration calculated from last_activity - session_start';
