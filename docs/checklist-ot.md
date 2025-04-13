Below is a focused **client-side only checklist** for reviewing your Supabase OTP-based authentication code before running the app. This checklist ensures the JavaScript/TypeScript code is correctly set up to handle OTP authentication, store sessions in `localStorage` (as you emphasized), retrieve user data, and integrate with your `profiles` table, without relying on custom auth or premature `allowed_emails` checks. It assumes you’re using the Supabase JavaScript client (`@supabase/supabase-js`) and the OTP flow we discussed, aligned with your migration to remove PIN-based auth.

### Client-Side Checklist for Supabase OTP Auth

#### 1. Supabase Client Initialization
- [ ] **Correct Import**:
  - Imports `createClient` from `@supabase/supabase-js`:
    ```javascript
    import { createClient } from '@supabase/supabase-js';
    ```
- [ ] **Valid Credentials**:
  - Initializes client with `SUPABASE_URL` and `ANON_KEY`:
    ```javascript
    const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');
    ```
  - Ensure `YOUR_SUPABASE_URL` and `YOUR_ANON_KEY` are placeholders replaced with values from Supabase Dashboard > Settings > API (e.g., `https://abcd1234.supabase.co` and a long `anon` key).
  - No use of `SERVICE_ROLE_KEY` (which is for server-side).
- [ ] **Default Auth Settings**:
  - No `auth` options disable session persistence or change storage:
    ```javascript
    // Avoid:
    const supabase = createClient('URL', 'KEY', { auth: { persistSession: false } });
    ```
  - Either uses default settings or explicitly sets:
    ```javascript
    const supabase = createClient('URL', 'KEY', {
      auth: {
        persistSession: true,
        storage: window.localStorage, // Optional, as this is default
      },
    });
    ```
  - Ensures sessions are stored in `localStorage`.

#### 2. Request OTP Function
- [ ] **Correct Implementation**:
  - Defines a function using `supabase.auth.signInWithOtp`:
    ```javascript
    async function requestOtp(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Or false if restricting to existing users
        },
      });
      if (error) return { success: false, message: error.message };
      return { success: true };
    }
    ```
  - Takes `email` as input and sends OTP request.
- [ ] **Options**:
  - `options.shouldCreateUser` is set explicitly (`true` for new users, `false` for existing only).
  - Optional `emailRedirectTo` (e.g., `'https://yourapp.com/welcome'`) is either absent (not needed for OTP) or matches your app’s URL.
- [ ] **Error Handling**:
  - Returns errors for invalid emails or network issues:
    ```javascript
    if (error) return { success: false, message: error.message };
    ```
- [ ] **No `allowed_emails` Check**:
  - Since you’re not using `allowed_emails` yet, ensure no premature check:
    ```javascript
    // Avoid for now:
    const { data } = await supabase.from('allowed_emails').select('email').eq('email', email);
    ```
  - Function only calls `signInWithOtp`.

#### 3. Verify OTP Function
- [ ] **Correct Implementation**:
  - Defines a function using `supabase.auth.verifyOtp`:
    ```javascript
    async function verifyOtp(email, code) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (error) return { success: false, message: error.message };
      return { success: true, user: data.user };
    }
    ```
  - Takes `email` and `code` (OTP) as inputs.
  - Sets `type: 'email'` to match OTP delivery method.
- [ ] **Session Storage**:
  - Relies on Supabase’s default behavior to store session in `localStorage` after verification.
  - No manual token storage (e.g., no `localStorage.setItem('token', data.session.access_token)`).
- [ ] **Error Handling**:
  - Handles invalid OTPs, expired codes, or email mismatches:
    ```javascript
    if (error) return { success: false, message: error.message };
    ```
- [ ] **User Data**:
  - Returns `data.user` for use in profiles or UI:
    ```javascript
    return { success: true, user: data.user };
    ```

#### 4. Session Retrieval
- [ ] **Get Current User**:
  - Defines a function to retrieve the logged-in user:
    ```javascript
    async function getCurrentUser() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;
      return session.user;
    }
    ```
  - Uses `supabase.auth.getSession()` to read `localStorage`.
  - Returns `null` if no session exists.
  - Returns `session.user` with at least `id` and `email`.
- [ ] **Handles No Session**:
  - Gracefully handles cases where `localStorage` is empty or session is invalid:
    ```javascript
    if (error || !session) return null;
    ```

#### 5. Auth State Listener (Optional but Recommended)
- [ ] **wiei**Listener Setup**:
  - Includes a listener for auth state changes:
    ```javascript
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User logged in:', session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('User logged out');
      }
    });
    ```
  - Listens for `SIGNED_IN` and `SIGNED_OUT` events.
  - Uses `session.user` to update UI or state when logged in.
- [ ] **No Blocking Calls**:
  - Listener doesn’t make synchronous API calls that could delay execution.

#### 6. Profile Integration
- [ ] **Profile Fetch/Update**:
  - Defines a function to interact with `profiles` table:
    ```javascript
    async function updateUserProfile(user, profileData) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          role: profileData.role || 'staff',
          status: 'active',
        });
      if (error) return false;
      return true;
    }
    ```
  - Uses `user.id` from `getCurrentUser` or `verifyOtp`.
  - Matches `profiles` schema: `id`, `email`, `full_name`, `role`, `status`.
  - Uses `upsert` to create or update profile.
- [ ] **No PIN Fields**:
  - No references to dropped fields (`pin`, `verification_code`, `code_expiry`, `is_verified`, `failed_attempts`).
- [ ] **Error Handling**:
  - Handles query errors:
    ```javascript
    if (error) return false;
    ```

#### 7. UI Integration
- [ ] **OTP Request Form**:
  - HTML form triggers `requestOtp`:
    ```html
    <form onsubmit="event.preventDefault(); handleRequestOtp();">
      <input type="email" id="email" placeholder="Enter your email" required />
      <button type="submit">Send OTP</button>
    </form>
    <script>
      async function handleRequestOtp() {
        const email = document.getElementById('email').value;
        const result = await requestOtp(email);
        alert(result.success ? 'OTP sent!' : result.message);
      }
    </script>
    ```
  - `input type="email"` ensures valid email format.
  - `required` attribute prevents empty submissions.
  - Calls `requestOtp` with `email` value.
- [ ] **OTP Verify Form**:
  - HTML form triggers `verifyOtp`:
    ```html
    <form onsubmit="event.preventDefault(); handleVerifyOtp();">
      <input type="email" id="email" placeholder="Enter your email" required />
      <input type="text" id="code" placeholder="Enter OTP" required />
      <button type="submit">Verify OTP</button>
    </form>
    <script>
      async function handleVerifyOtp() {
        const email = document.getElementById('email').value;
        const code = document.getElementById('code').value;
        const result = await verifyOtp(email, code);
        alert(result.success ? 'Logged in!' : result.message);
      }
    </script>
    ```
  - Includes `email` and `code` inputs, both `required`.
  - Calls `verifyOtp` with correct parameters.
- [ ] **Feedback Mechanism**:
  - Forms provide user feedback (e.g., `alert`, updating UI, or console logs) for success/errors.

#### 8. Session Management
- [ ] **Relies on `localStorage`**:
  - No code overrides Supabase’s default `localStorage` storage (e.g., no manual `localStorage.setItem` or `clear`).
  - `getSession` and queries assume `sb-<project-id>-auth-token` in `localStorage`.
- [ ] **Logout Function** (Optional):
  - If implemented, uses `supabase.auth.signOut()`:
    ```javascript
    async function logout() {
      await supabase.auth.signOut();
    }
    ```
  - No manual `localStorage` clearing outside `signOut`.
- [ ] **No Premature Clears**:
  - No calls to `localStorage.clear()` or `localStorage.removeItem('sb-<project-id>-auth-token')` except in `logout`.

#### 9. Error Handling
- [ ] **Invalid Inputs**:
  - Forms use `required` to block empty emails/OTPs.
  - `requestOtp` handles Supabase errors (e.g., invalid email format).
- [ ] **OTP Verification Errors**:
  - `verifyOtp` handles:
    - Invalid OTP (`error.message` like “Invalid token”).
    - Expired OTP.
    - Email mismatch.
- [ ] **Network Issues**:
  - All async functions (`requestOtp`, `verifyOtp`, `getCurrentUser`, `updateUserProfile`) catch errors:
    ```javascript
    if (error) return { success: false, message: error.message };
    ```

#### 10. Code Hygiene
- [ ] **No Hardcoded Secrets**:
  - `SUPABASE_URL` and `ANON_KEY` are stored in environment variables (e.g., `.env` file, `process.env`) or config, not hardcoded:
    ```javascript
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    ```
- [ ] **Consistent Async/Await**:
  - All Supabase calls use `async/await`, no `.then()` mixing:
    ```javascript
    // Good:
    const { error } = await supabase.auth.signInWithOtp(...);
    // Avoid:
    supabase.auth.signInWithOtp(...).then(...);
    ```
- [ ] **No Unused Code**:
  - No leftover PIN-related logic (e.g., `verifyPin`, `setPin`).
  - No premature `allowed_emails` queries.

### Example Code to Match Checklist
Your client-side code should look like this (or equivalent):
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');

async function requestOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

async function verifyOtp(email, code) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });
  if (error) return { success: false, message: error.message };
  return { success: true, user: data.user };
}

async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.user;
}

async function updateUserProfile(user, profileData) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: profileData.full_name,
      role: profileData.role || 'staff',
      status: 'active',
    });
  if (error) return false;
  return true;
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User logged in:', session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User logged out');
  }
});
```

### HTML
```html
<!-- Request OTP -->
<form onsubmit="event.preventDefault(); handleRequestOtp();">
  <input type="email" id="email" placeholder="Enter your email" required />
  <button type="submit">Send OTP</button>
</form>

<!-- Verify OTP -->
<form onsubmit="event.preventDefault(); handleVerifyOtp();">
  <input type="email" id="email" placeholder="Enter your email" required />
  <input type="text" id="code" placeholder="Enter OTP" required />
  <button type="submit">Verify OTP</button>
</form>

<script>
async function handleRequestOtp() {
  const email = document.getElementById('email').value;
  const result = await requestOtp(email);
  alert(result.success ? 'OTP sent!' : result.message);
}

async function handleVerifyOtp() {
  const email = document.getElementById('email').value;
  const code = document.getElementById('code').value;
  const result = await verifyOtp(email, code);
  alert(result.success ? 'Logged in!' : result.message);
}
</script>
```

### What to Watch For
- **Credential Errors**: Incorrect `SUPABASE_URL` or `ANON_KEY` will cause 401/403 errors when tested.
- **Missing Imports**: Forgetting `createClient` import breaks everything.
- **Premature Restrictions**: Accidental `allowed_emails` checks will fail if the table doesn’t exist.
- **UI Disconnect**: Forms not calling `requestOtp`/`verifyOtp` correctly will do nothing.

### If Checklist Passes
If all items are checked, your client-side code should:
- Send OTPs via email.
- Verify OTPs and store sessions in `localStorage`.
- Retrieve user data (`id`, `email`) for profiles or queries.
- Update `profiles` table without PIN dependencies.
- Provide user feedback via UI.

### Next Steps
- **Linting**: Run ESLint or similar to catch typos or undefined variables.
- **Environment Setup**: Ensure `SUPABASE_URL` and `ANON_KEY` are in `.env` (e.g., using `dotenv`).
- **Static Analysis**: If using TypeScript, run `tsc --noEmit` to catch type errors.
- **Proceed to Testing**: Deploy locally (e.g., `http://localhost:3000`) and verify `localStorage` is populated after `verifyOtp`.

If you’re using a specific framework (e.g., React, Vue, Next.js), share it, and I can add framework-specific checks (e.g., React hooks, Next.js middleware). Otherwise, this checklist ensures your client-side OTP auth is ready for testing!