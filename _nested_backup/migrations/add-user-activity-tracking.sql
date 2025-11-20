-- User Activity Tracking System
-- This migration adds comprehensive user activity and session tracking

-- User activity events table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50),
  event_data JSONB,
  page_url VARCHAR(500),
  referrer VARCHAR(500),
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  browser VARCHAR(50),
  device_type VARCHAR(50),
  os VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
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

-- Daily user activity summary (for fast reporting)
CREATE TABLE IF NOT EXISTS user_activity_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  activity_date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  first_activity TIMESTAMP,
  last_activity TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_client_id ON user_activity_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON user_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_category ON user_activity_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON user_activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON user_sessions(client_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON user_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_end ON user_sessions(session_end);

CREATE INDEX IF NOT EXISTS idx_summary_user_date ON user_activity_summary(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_summary_client_date ON user_activity_summary(client_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_summary_date ON user_activity_summary(activity_date DESC);

-- Comments for documentation
COMMENT ON TABLE user_activity_logs IS 'Tracks all user activity events including page views, clicks, and custom events';
COMMENT ON TABLE user_sessions IS 'Tracks user sessions with start/end times and activity metrics';
COMMENT ON TABLE user_activity_summary IS 'Daily aggregated user activity for fast reporting and dashboards';

COMMENT ON COLUMN user_activity_logs.event_type IS 'Type of event: page_view, button_click, task_created, lead_qualified, etc.';
COMMENT ON COLUMN user_activity_logs.event_category IS 'Category: navigation, interaction, system, custom';
COMMENT ON COLUMN user_activity_logs.event_data IS 'Flexible JSONB field for custom event metadata';
COMMENT ON COLUMN user_sessions.duration_seconds IS 'Total session duration calculated from last_activity - session_start';
