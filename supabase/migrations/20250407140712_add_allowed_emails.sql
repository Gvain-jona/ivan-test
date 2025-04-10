-- Create allowed_emails table for access control
CREATE TABLE IF NOT EXISTS public.allowed_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admins full access" ON public.allowed_emails
    FOR ALL TO authenticated
    USING (is_admin());

CREATE POLICY "Allow public read access" ON public.allowed_emails
    FOR SELECT TO anon, authenticated
    USING (true);

-- Add initial admin email
INSERT INTO public.allowed_emails (email, role)
VALUES ('gavinjona2@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE
SET role = 'admin';

-- Create auth_audit_log table for tracking authentication events
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on auth_audit_log
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for auth_audit_log
CREATE POLICY "Allow admins full access to audit log" ON public.auth_audit_log
    FOR ALL TO authenticated
    USING (is_admin());

CREATE POLICY "Allow users to read their own audit logs" ON public.auth_audit_log
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Create function to log auth events
CREATE OR REPLACE FUNCTION log_auth_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_metadata_key TEXT DEFAULT NULL,
    p_metadata_value TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metadata JSONB;
    v_log_id UUID;
BEGIN
    -- Build metadata JSON if key/value provided
    IF p_metadata_key IS NOT NULL AND p_metadata_value IS NOT NULL THEN
        v_metadata = jsonb_build_object(p_metadata_key, p_metadata_value);
    END IF;

    -- Insert log entry
    INSERT INTO public.auth_audit_log (user_id, event_type, metadata)
    VALUES (p_user_id, p_event_type, v_metadata)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$; 