
## Overview of What We’re Building
Here’s the plan for our authentication system:
- **Database:** Two tables—one for allowed emails (`allowed_emails`) and one for user profiles (`profiles`) with hashed PINs.
- **Supabase Features:** Magic links, Row Level Security (RLS), database functions, and triggers—all within Supabase, no custom server needed.
- **Next.js App:** Email login with magic links, PIN setup, and PIN verification on app open, with server-side rendering (SSR) support.
- **Error Handling:** We’ll account for invalid emails, wrong PINs, expired sessions, network issues, and more.

By the end, you’ll have a secure, user-friendly auth system that’s robust enough for real-world use.

---

## Step 1: Project Setup
Let’s set up your Next.js app and install the packages we need.

### 1.1 Create a Next.js App
If you don’t already have a Next.js app, create one:
```bash
npx create-next-app@latest my-auth-app
cd my-auth-app
```

### 1.2 Install Required Packages
We’ll use:
- `@supabase/supabase-js`: For interacting with Supabase.
- `@supabase/ssr`: For secure session management with SSR in Next.js.
- `zod`: For validating user inputs like emails and PINs.

Run this command:
```bash
npm install @supabase/supabase-js @supabase/ssr zod
```

### 1.3 Set Up Environment Variables
In your Supabase Dashboard (after creating a project):
- Go to **Settings** > **API**.
- Copy the **URL** and **anon key**.

Create a `.env.local` file in your project root and add:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
**Note:** Keep these safe—don’t commit `.env.local` to Git!

---

## Step 2: Database Setup in Supabase
We’ll configure the database entirely in Supabase using SQL. Log into your Supabase Dashboard, go to **SQL Editor**, and run these commands one by one.

### 2.1 Create the `allowed_emails` Table
This table lists emails allowed to sign in and their roles.
```sql
CREATE TABLE allowed_emails (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee'))
);

ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (e.g., for admin tools)
CREATE POLICY "Authenticated users can read allowed_emails"
ON allowed_emails FOR SELECT
TO authenticated
USING (true);
```
- **What it does:** Stores emails like `user@example.com` with a role (`admin`, etc.).
- **Security:** RLS ensures only authenticated users can read it. For now, you’ll manually add emails via the Dashboard or SQL.

**Example:** Add some test emails:
```sql
INSERT INTO allowed_emails (email, role) VALUES
('alice@example.com', 'admin'),
('bob@example.com', 'employee');
```

### 2.2 Create the `profiles` Table
This stores user info, including a hashed PIN, linked to Supabase’s `auth.users`.
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  pin TEXT -- Will store the hashed PIN
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```
- **What it does:** Links to `auth.users` via `id`, stores the user’s email, role, and PIN.
- **Security:** RLS ensures users only access their own data.

### 2.3 Set Up PIN Hashing and Verification
We’ll use PostgreSQL’s `pgcrypto` to hash PINs securely.
```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash a PIN
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN crypt(pin, gen_salt('bf')); -- Blowfish hashing
END;
$$ LANGUAGE plpgsql;

-- Function to verify a PIN
CREATE OR REPLACE FUNCTION verify_pin(user_id UUID, input_pin TEXT) RETURNS BOOLEAN AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT pin INTO stored_pin FROM profiles WHERE id = user_id;
  RETURN stored_pin = crypt(input_pin, stored_pin);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```
- **`hash_pin`:** Takes a PIN (e.g., "1234") and returns a secure hash.
- **`verify_pin`:** Checks if an entered PIN matches the stored hash for a user.

### 2.4 Automate Profile Creation with a Trigger
When a user signs in with a magic link, we’ll auto-create their `profiles` entry if their email is allowed.
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM allowed_emails WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role)
    SELECT NEW.id, NEW.email, role FROM allowed_emails WHERE email = NEW.email;
  ELSE
    RAISE EXCEPTION 'Email not in allowed_emails';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
- **What it does:** When a new user is added to `auth.users` (via magic link), it checks `allowed_emails` and creates a `profiles` entry with their role.
- **Error Case:** If the email isn’t allowed, it throws an error (we’ll handle this in the app).

### 2.5 Function to Check Allowed Emails
This helps the app verify emails before sending magic links.
```sql
CREATE OR REPLACE FUNCTION public.is_email_allowed(input_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM allowed_emails WHERE email = input_email);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```
- **What it does:** Returns `true` if the email is in `allowed_emails`, `false` otherwise.

---

## Step 3: Supabase Configuration
Let’s configure Supabase Auth settings.

### 3.1 Enable Magic Links
- Go to **Supabase Dashboard** > **Authentication** > **Providers** > **Email**.
- Enable **Email** and **Magic Link**.
- Set **Token lifespan**:
  - **JWT:** 1 hour (3600 seconds).
  - **Refresh Token:** 30 days (2592000 seconds).
- **Save** the changes.

### 3.2 Test the Setup
Run this in the SQL Editor to ensure everything’s working:
```sql
SELECT hash_pin('1234'); -- Should return a hash
SELECT is_email_allowed('alice@example.com'); -- Should return true
SELECT is_email_allowed('random@xyz.com'); -- Should return false
```

---

## Step 4: Next.js App Implementation
Now, let’s build the frontend. We’ll create a Supabase client and implement the auth flows.

### 4.1 Create a Supabase Client
Create `lib/supabase.js`:
```javascript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}
```
- **What it does:** Sets up a Supabase client with SSR support, storing sessions securely in cookies.

### 4.2 Magic Link Login Page
Create `pages/auth.js`:
```javascript
import { useState } from 'react';
import { createClient } from '../lib/supabase';
import { z } from 'zod';

const emailSchema = z.string().email({ message: 'Please enter a valid email' });

export default function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleMagicLink = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      // Validate email format
      emailSchema.parse(email);

      const supabase = createClient();
      // Check if email is allowed
      const { data, error: rpcError } = await supabase.rpc('is_email_allowed', { input_email: email });
      if (rpcError || !data) {
        throw new Error('This email is not authorized to sign in.');
      }

      // Send magic link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: 'http://localhost:3000/welcome' },
      });
      if (authError) throw authError;

      setMessage('Check your email for a magic link!');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Sign In</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        disabled={loading}
      />
      <button
        onClick={handleMagicLink}
        disabled={loading}
        style={{ width: '100%', padding: '10px', background: loading ? '#ccc' : '#0070f3', color: 'white', border: 'none' }}
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
```
- **What it does:** 
  - Takes an email, validates it with Zod, checks if it’s allowed, and sends a magic link.
  - Redirects to `/welcome` after clicking the link (update the URL for production).
- **Errors Handled:**
  - Invalid email format (e.g., "not-an-email").
  - Unauthorized email (e.g., not in `allowed_emails`).
  - Network or Supabase errors.

### 4.3 PIN Setup Page
Create `pages/welcome.js`:
```javascript
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function Welcome() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('pin').eq('id', user.id).single();
      if (profile?.pin) {
        router.push('/app'); // Already has PIN, go to app
      } else {
        setLoading(false); // No PIN, stay here to set it
      }
    };
    checkUser();
  }, [router]);

  const handleSetPin = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: hashedPin } = await supabase.rpc('hash_pin', { pin });
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ pin: hashedPin })
        .eq('id', user.id);
      if (updateError) throw updateError;
      router.push('/app');
    } catch (err) {
      setError('Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Set Your PIN</h1>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter a PIN (min 4 digits)"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        disabled={loading}
      />
      <button
        onClick={handleSetPin}
        disabled={loading}
        style={{ width: '100%', padding: '10px', background: loading ? '#ccc' : '#0070f3', color: 'white', border: 'none' }}
      >
        {loading ? 'Setting...' : 'Set PIN'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
```
- **What it does:** 
  - After magic link login, checks if the user has a PIN.
  - If not, lets them set a 4+ digit PIN, hashes it, and saves it.
- **Errors Handled:**
  - No user session (redirects to `/auth`).
  - PIN too short.
  - Database update errors.

### 4.4 PIN Verification Page
Create `pages/app.js`:
```javascript
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function App() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleVerifyPin = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: isValid } = await supabase.rpc('verify_pin', { user_id: user.id, input_pin: pin });
      if (!isValid) {
        await supabase.auth.signOut();
        throw new Error('Invalid PIN');
      }
      setLoading(false); // PIN is valid, show app content
    } catch (err) {
      setError(err.message || 'Verification failed');
      router.push('/auth');
    }
  };

  if (loading) return <p>Verifying...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Enter Your PIN</h1>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter your PIN"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        disabled={loading}
      />
      <button
        onClick={handleVerifyPin}
        disabled={loading}
        style={{ width: '100%', padding: '10px', background: loading ? '#ccc' : '#0070f3', color: 'white', border: 'none' }}
      >
        {loading ? 'Verifying...' : 'Verify PIN'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {!loading && !error && <h2>Welcome to the App!</h2>}
    </div>
  );
}
```
- **What it does:** 
  - On app open, checks for a valid session.
  - Prompts for PIN and verifies it. If valid, shows app content; if not, logs out.
- **Errors Handled:**
  - No session (redirects to `/auth`).
  - Wrong PIN (logs out and redirects).
  - Network or RPC errors.

---

## Step 5: Error Handling and Real-Life Scenarios
Here’s how we handle common issues:

### 5.1 Invalid Emails
- **Scenario:** User enters `random@xyz.com` (not in `allowed_emails`).
- **Handling:** The `is_email_allowed` RPC returns `false`, and the auth page shows "This email is not authorized."

### 5.2 Incorrect PIN Entries
- **Scenario:** User enters "4321" but their PIN is "1234".
- **Handling:** `verify_pin` returns `false`, the app logs them out, and shows "Invalid PIN."

### 5.3 Expired Sessions
- **JWT Expires (e.g., after 1 hour):**
  - Supabase automatically refreshes it using the refresh token. User just enters their PIN.
- **Refresh Token Expires (e.g., after 30 days):**
  - No session is found, redirecting to `/auth` for a new magic link.

### 5.4 Network Issues
- **Scenario:** Internet drops during login or PIN setup.
- **Handling:** Try-catch blocks catch errors, showing "Something went wrong. Please try again."

### 5.5 Rate Limiting
- **Scenario:** User requests too many magic links.
- **Handling:** Supabase has built-in limits (check Dashboard > **Reports** > **Auth**). Tell users to wait if they hit it.

### 5.6 User Already Has a PIN
- **Scenario:** User logs in again after setting a PIN.
- **Handling:** `/welcome` detects the PIN and redirects to `/app`.

---

## Step 6: Testing and Debugging
Test these cases:
1. **Valid Email, First Login:** Enter `alice@example.com`, click the magic link, set a PIN, then verify it on `/app`.
2. **Invalid Email:** Try `random@xyz.com`—should fail on `/auth`.
3. **Wrong PIN:** Set PIN as "1234", then try "4321" on `/app`—should log out.
4. **Expired Session:** Wait 1 hour (or shorten JWT lifespan in Dashboard for testing), then check if refresh works.

If something breaks:
- Check the **Supabase Dashboard** > **Logs** for SQL or auth errors.
- Look at your browser console for frontend errors.
- Double-check your `.env.local` values.

---

## Step 7: Extra Tips
- **Secure Inputs:** PIN fields use `type="password"` to hide digits.
- **Validation:** Zod ensures emails are valid; add more rules (e.g., PIN must be numeric) if needed:
  ```javascript
  const pinSchema = z.string().min(4).regex(/^\d+$/, 'PIN must be numbers only');
  pinSchema.parse(pin); // Add to handleSetPin
  ```
- **Styling:** The CSS here is basic—tweak it for your app!
- **Production:** Update `emailRedirectTo` to your live URL (e.g., `https://your-app.com/welcome`).

---

sbp_8ff84e63e64e9339e82d21d791e256189c9cff81
