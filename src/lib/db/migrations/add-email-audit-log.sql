-- Email Audit Log
-- Track all system emails sent (reports, notifications, etc.)

CREATE TABLE IF NOT EXISTS email_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type VARCHAR(100) NOT NULL, -- 'weekly_report', 'password_setup', 'password_changed', etc.
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  sent_by_user_id UUID, -- User who triggered the email (if applicable)
  client_id UUID, -- Associated client (if applicable)
  status VARCHAR(50) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT, -- If failed, what was the error
  metadata JSONB, -- Additional context (e.g., report period, test mode, etc.)
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_email_audit_recipient ON email_audit_log(recipient, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_type ON email_audit_log(email_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_client ON email_audit_log(client_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_user ON email_audit_log(sent_by_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_status ON email_audit_log(status, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_sent_at ON email_audit_log(sent_at DESC);

-- Comments
COMMENT ON TABLE email_audit_log IS 'Audit log of all system emails sent for compliance and debugging';
COMMENT ON COLUMN email_audit_log.email_type IS 'Type of email: weekly_report, password_setup, password_changed, notification, etc.';
COMMENT ON COLUMN email_audit_log.status IS 'Status: sent (successfully sent), failed (send failed), pending (queued)';
COMMENT ON COLUMN email_audit_log.metadata IS 'JSON metadata like {testMode: true, reportPeriod: "2024-W42", recipientCount: 3}';
