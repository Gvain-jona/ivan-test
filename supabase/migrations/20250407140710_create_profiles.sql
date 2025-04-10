-- Create auth method enum
DO $$ BEGIN
    CREATE TYPE auth_method_type AS ENUM ('magic_link', 'email_password', 'otp');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    auth_method auth_method_type DEFAULT 'magic_link',
    is_mfa_enabled BOOLEAN DEFAULT false,
    last_sign_in TIMESTAMPTZ,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "allow_read_own_profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "allow_update_own_profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "allow_public_auth" ON public.profiles
    FOR SELECT TO anon
    USING (true); 