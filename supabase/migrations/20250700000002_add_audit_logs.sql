-- Add audit logs table for security event tracking

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- Add RLS policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT WITH CHECK (true);

-- No one can update or delete audit logs
CREATE POLICY audit_logs_update_policy ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY audit_logs_delete_policy ON audit_logs
  FOR DELETE USING (false);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Security audit logs for tracking authentication and data access events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of audit event (e.g., LOGIN_ATTEMPT, DATA_ACCESSED)';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who triggered the event (if applicable)';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the event in JSON format';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent of the request';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when the event occurred';
