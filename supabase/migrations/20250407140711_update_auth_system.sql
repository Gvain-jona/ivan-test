-- Clean up old auth-related functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_auth_user_creation();
DROP FUNCTION IF EXISTS verify_user_code();
DROP FUNCTION IF EXISTS generate_user_verification_code();

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_anon_policy" ON public.profiles;
DROP POLICY IF EXISTS "allow_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_public_auth" ON public.profiles;

-- Create auth method enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE auth_method_type AS ENUM ('magic_link', 'email_password', 'otp');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table with new auth fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_method auth_method_type DEFAULT 'magic_link',
ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        auth_method,
        is_mfa_enabled,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN NEW.email LIKE '%admin%' THEN 'admin'
            ELSE 'user'
        END,
        CASE 
            WHEN NEW.email LIKE '%admin%' THEN 'email_password'::auth_method_type
            ELSE 'magic_link'::auth_method_type
        END,
        NEW.email LIKE '%admin%',  -- Enable MFA for admin accounts by default
        'active',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile or any profile if they're admin
CREATE POLICY "allow_read_own_profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Policy for users to update their own profile
CREATE POLICY "allow_update_own_profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy for public access during signup/verification
CREATE POLICY "allow_public_auth" ON public.profiles
    FOR SELECT TO anon
    USING (true);

-- Function to handle MFA enrollment
CREATE OR REPLACE FUNCTION handle_mfa_enrollment(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles
    SET is_mfa_enabled = true
    WHERE id = user_id;
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET 
        failed_attempts = failed_attempts + 1,
        locked_until = CASE 
            WHEN failed_attempts >= 5 THEN NOW() + INTERVAL '30 minutes'
            ELSE locked_until
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed login attempts
CREATE OR REPLACE FUNCTION reset_failed_login(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET 
        failed_attempts = 0,
        locked_until = NULL
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
