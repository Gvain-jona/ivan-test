# Codebase Review — Verification Pass v3

**Date:** 2026-07-13
**Method:** Direct file reads only (no sub-agents). Re-verification of every finding in `VERIFICATION_v2_2026-06-02.md` against current `main`/branch state.
**Supersedes:** `VERIFICATION_v2_2026-06-02.md` (kept as a historical snapshot). Where v2 and v3 disagree, **v3 is ground truth** — the codebase moved substantially since the v2 pass.

Legend: ✅ FIXED · 🔲 OPEN · ⚠️ PARTIAL / MITIGATED · ❌ REFUTED · ↔ UNCHANGED

> **Headline:** Of the 5 CRITICALs in v2, **4 are fixed** (SEC-01, SEC-02, SEC-05, and SEC-04's sibling routes) and **1 remains open** (SEC-04 IDOR, relies on RLS only — this is the deferred `SEC-05` item in `CLAUDE.md`). Both HIGH build-config findings (SEC-06, SEC-07) are fixed. Remaining open items are lower blast-radius: SEC-11 (RLS read of `allowed_emails`), NEW-03 (no app-level CSP), one un-hardened redirect in `auth/confirm`, dead-code directories, and two perf micro-issues.

---

## Module 1 — Authentication & Middleware

### SEC-01 · Middleware Does Not Enforce Authentication → ✅ FIXED
**`middleware.ts:7–19`** — Middleware now reads `user` back from `updateSession` and redirects protected paths:
```typescript
const { response, user } = await updateSession(request)
const { pathname } = request.nextUrl
const isPublic = PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))  // ['/auth/', '/api/healthz']
if (!user && !isPublic) {
  const signIn = new URL('/auth/signin', request.url)
  signIn.searchParams.set('next', pathname)
  return NextResponse.redirect(signIn)
}
```
Unauthenticated requests to `/dashboard/*` now redirect to `/auth/signin`. The v2 "unconditional pass-through" is gone.

### SEC-02 · XSS via Raw Template Literal in auth/verify → ✅ FIXED
**`app/auth/verify/route.ts`** — Route fully rewritten. No `<script>` HTML response, no template-literal interpolation of `email`/`next`. It now calls `verifyOtp` and issues a server redirect through `getSameOriginPath(rawNext, request.url)` (line 5–14, 35), which resolves the target against the request origin and falls back to `/dashboard/orders` on any cross-origin or malformed value. The injection sink no longer exists.

### SEC-03 · Open Redirect in auth/callback and auth/confirm → ⚠️ PARTIAL
- **`app/auth/callback/route.ts:84`** — ✅ Fixed. Now routes through `getSameOriginPath(next, request.url)` (line 10–19) before `redirect()`.
- **`app/auth/verify/route.ts`** — ✅ Fixed (same helper).
- **`app/auth/confirm/route.ts:66–78`** — 🔲 **Still vulnerable.** Retains the v2 pattern:
  ```typescript
  const formattedNext = next.startsWith('/') ? next : `/${next}`
  const redirectUrl = `${baseUrl}${formattedNext}`
  return redirect(redirectUrl)
  ```
  `?next=//evil.com` starts with `/`, passes the check, and yields a protocol-relative off-domain redirect. **Fix:** apply the same `getSameOriginPath` helper already used in `callback`/`verify`.

### SEC-05 · Mock Admin User Injected on Missing Session → ✅ FIXED
**`app/context/auth-context.tsx:252–255`** — The `isDevelopment` mock-admin block is gone. The no-session branch now simply:
```typescript
} else {
  setUser(null)
  setProfile(null)
  setIsLoading(false)
}
```
No fixed-UUID admin profile is fabricated in any environment.

### NEW-01 · authorization.ts Uses Browser Supabase Client in Auth Flow → ✅ FIXED
**`app/lib/auth/authorization.ts:2,17`** — Now imports the **server** client (`@/utils/supabase/server`) and `await createClient()`, using `.maybeSingle()`. The auth-gate lookup no longer depends on the browser anon client (and therefore no longer depends on the SEC-11 hole to function).

---

## Module 2 — API Layer

### SEC-04 · IDOR — No Ownership Verification → 🔲 OPEN
**`app/api/orders/[id]/route.ts:14–23`** — Authentication is checked (`getUser()`), ownership is not. The query is `…from('orders').select(…).eq('id', id).single()` with no `.eq('created_by', user.id)`, and the response still returns `created_by` (line 59). Protection relies entirely on RLS. This is the deferred **SEC-05** item tracked in `CLAUDE.md` ("do before first external user access") — confirm the RLS policy on `orders`/`expenses`/`material_purchases` actually scopes rows by `auth.uid()` before relying on it.

### SEC-08 · Order DELETE Has No Role Check → ✅ FIXED
**`app/api/orders/route.ts:161–168`** — DELETE now fetches the caller's profile role and rejects non-privileged users, matching the `expenses` pattern:
```typescript
if (!profile || !['admin', 'manager'].includes(profile.role)) {
  return handleApiError('FORBIDDEN', 'Only admins and managers can delete orders');
}
```

### SEC-10 · App Settings GET Returns Data Unauthenticated → ✅ FIXED
**`app/api/settings/app/route.ts:8–9`** — GET now performs the standard auth check (`getUser()` → `UNAUTHORIZED`) before reading `app_settings`. PUT still correctly requires `admin`.

### NEW-02 · PUT /api/orders Uses Type Cast Instead of Zod → ✅ FIXED
**`app/api/orders/route.ts:134–138`** — The `body as {…}` cast is replaced with `UpdateOrderSchema.safeParse(body)` and a `VALIDATION_ERROR` on failure, matching POST.

---

## Module 3 — Database & RLS

### SEC-11 · allowed_emails World-Readable by All Authenticated Users → 🔲 OPEN
Still present. **`supabase/migrations/20250901000000_auth_checkpoint_and_updates.sql:159`** creates `"Authenticated users can read allowed_emails"` with `USING (true)`, and the earlier **`supabase/migrations/20250407140712_add_allowed_emails.sql:18`** adds `"Allow public read access"`. No later migration drops or tightens either policy. Any authenticated user can still enumerate all privileged emails and roles. Tracked as the deferred **SEC-11** item in `CLAUDE.md`.

### PERF-01 · Analytics Full-Table Scan + JavaScript Aggregation → ⚠️ MITIGATED
**`app/api/orders/analytics/route.ts:5,34–43`** — Aggregation is still done in JS, but unbounded memory growth is now capped: `MAX_ANALYTICS_ROWS = 5000` with `query.range(0, MAX_ANALYTICS_ROWS - 1)` and a `truncated` flag returned to the caller. A `TODO` remains to move aggregation to a DB-level RPC. Risk downgraded from HIGH to LOW-MEDIUM (bounded, but still not a true `SUM/GROUP BY`).

### PERF-03 · Missing payment_status Indexes → ❌ REFUTED ↔
Unchanged from v2 — indexes confirmed present in the consolidated schema migrations. This finding remains incorrect.

---

## Module 4 — Build Config & Dead Code

### SEC-06 · Sentry DSN Hardcoded → ✅ FIXED
**`sentry.server.config.ts:4–5`** — DSN now reads `process.env.NEXT_PUBLIC_SENTRY_DSN`, and `tracesSampleRate` is `0.1` in production (`1.0` in dev) rather than a literal DSN at 100% sampling.

### SEC-07 · TypeScript and ESLint Errors Suppressed at Build → ✅ FIXED
**`next.config.js:6–11`** — Both flags are now `false` (`typescript.ignoreBuildErrors: false`, `eslint.ignoreDuringBuilds: false`). Type and lint errors block the build again. (`CLAUDE.md` explicitly warns not to loosen these back.)

### NEW-03 · dangerouslyAllowSVG Without App-Level CSP → 🔲 OPEN
**`next.config.js:14`** still sets `dangerouslyAllowSVG: true`. The `contentSecurityPolicy` on line 16 applies only to `next/image`-served images; there is still **no `headers()` block** in `next.config.js` returning an app-level `Content-Security-Policy`, `X-Frame-Options`, or `Strict-Transport-Security`. Unchanged from v2.

### ARCH-01 · Dead Code Directories in Production Builds → 🔲 OPEN ↔
All flagged paths still exist: `pages/`, `app/components/archive/`, `app/debug/`, `app/dashboard/notifications-test/`, `app/dashboard/sizes-test/`, `app/dashboard/calendar-demo/`, `app/dashboard/analytics/test/`, `app/dashboard/analytics/stock-demo/`. Unchanged from v2.

---

## Module 5 — State Management & Cache

### PERF-02 · 4× SWR Mutate Calls on Every Cache Invalidation → ✅ FIXED
**`app/lib/cache-utils.ts:15–19`** — `invalidateOrderCache()` was rewritten to a single optimistic set plus one predicate-based `mutate((key) => isOrderCacheKey(key, orderId), undefined, { revalidate: true })`. The duplicate `setTimeout` re-sweep is gone.

### PERF-07 · JSON.stringify on Full Order Per Keystroke → 🔲 OPEN
**`app/hooks/orders/useOrderForm.ts:124`** — The double `JSON.stringify(...) !== JSON.stringify(...)` dirty-check remains, inside a `useCallback` keyed on `order` (line 125), so it still re-serializes the whole order (items + payments) on every field edit. The file was refactored (137 lines now) but this specific comparison is unchanged. MEDIUM.

---

## Module 6 — Frontend React Patterns

### REACT-01 · Hook Called in Conditional Expression and Event Handler → ✅ FIXED
**`app/components/navigation/SideNav.tsx:311–320`** — `refreshProfile` is now destructured from `useAuth()` at the top level and referenced as a plain variable in the JSX guard and `onClick`. No `useAuth()` call inside JSX or the event handler. Rules-of-Hooks violation resolved.

### REACT-02 · 7 DOM Queries Inside React Event Handler → ⚠️ MOSTLY FIXED
**`app/components/orders/OrderRow.tsx:83`** — Interactivity detection is consolidated to a single `target.closest(...)` call; the per-click `document.querySelector` and the chain of `getAttribute`/`classList`/`hasAttribute` checks are gone. One `setTimeout` remains (lines 88, 177). Blast radius substantially reduced; downgraded to LOW.

### REACT-03 · Scroll Listener Without Debounce → ↔ UNCHANGED (LOW)
**`app/components/navigation/TopHeader.tsx:161–166`** — Still no debounce, but (as v2 already noted) `setScrolled` only flips a boolean so React bails on unchanged state. Remains LOW.

### Size Violations → ⚠️ MIXED
- `app/hooks/materials/useMaterialPurchases.ts` — **refactored** from 1159 lines to a 3-line re-export shim (logic split out).
- `app/lib/services/analytics-service.ts` (929), `app/components/orders/OrdersTableNew.tsx` (626), `app/components/orders/OrderFormModal/index.tsx` (290) — roughly unchanged.
- Note: `CLAUDE.md` now reframes the 200-line rule as a **non-blocking ESLint warning** that is widely and intentionally exceeded — treat as guidance for new code, not a correctness signal.

---

## Final Verification Scorecard (v3)

| ID | Finding | v2 Result | v3 Result | Current Severity |
|----|---------|-----------|-----------|------------------|
| SEC-01 | Middleware auth bypass | ✅ CONFIRMED | ✅ **FIXED** | — |
| SEC-02 | XSS in auth/verify template literal | ✅ CONFIRMED | ✅ **FIXED** | — |
| SEC-03 | Open redirect in callback/confirm/verify | ✅ CONFIRMED | ⚠️ **PARTIAL** (confirm still open) | MEDIUM |
| SEC-04 | IDOR — no ownership checks | ✅ CONFIRMED | 🔲 **OPEN** (RLS-only; deferred) | HIGH |
| SEC-05 | Mock admin user on missing session | ✅ CONFIRMED | ✅ **FIXED** | — |
| SEC-06 | Sentry DSN hardcoded in source | ✅ CONFIRMED | ✅ **FIXED** | — |
| SEC-07 | TS/ESLint build errors suppressed | ✅ CONFIRMED | ✅ **FIXED** | — |
| SEC-08 | Order DELETE no role authorization | ✅ CONFIRMED | ✅ **FIXED** | — |
| SEC-10 | App settings GET unauthenticated | ✅ CONFIRMED | ✅ **FIXED** | — |
| SEC-11 | allowed_emails readable by all users | ✅ CONFIRMED | 🔲 **OPEN** (deferred) | HIGH |
| PERF-01 | Analytics full-table JS aggregation | ✅ CONFIRMED | ⚠️ **MITIGATED** (5k cap) | LOW-MED |
| PERF-02 | 4× SWR mutate on every invalidation | ✅ CONFIRMED | ✅ **FIXED** | — |
| PERF-03 | Missing payment_status indexes | ❌ REFUTED | ❌ **REFUTED** | — |
| PERF-07 | JSON.stringify per keystroke in isDirty | ✅ CONFIRMED | 🔲 **OPEN** | MEDIUM |
| REACT-01 | Hook in conditional/event handler | ✅ CONFIRMED | ✅ **FIXED** | — |
| REACT-02 | 7 DOM queries per click in OrderRow | ✅ CONFIRMED | ⚠️ **MOSTLY FIXED** | LOW |
| REACT-03 | Scroll listener no debounce | ⚠️ DOWNGRADED | ↔ **UNCHANGED** | LOW |
| ARCH-01 | Dead code in production builds | ✅ CONFIRMED | 🔲 **OPEN** | MEDIUM |
| NEW-01 | Browser Supabase client in auth-gate | 🆕 NEW | ✅ **FIXED** | — |
| NEW-02 | PUT /api/orders uses type cast not Zod | 🆕 NEW | ✅ **FIXED** | — |
| NEW-03 | No app-level CSP headers + dangerouslyAllowSVG | 🆕 NEW | 🔲 **OPEN** | HIGH |

**Score: 11 fixed · 3 partial/mitigated · 5 open · 1 refuted · 1 unchanged-low**

---

## Overall Rating: 7.0 / 10 (up from 4.5 / 10)

All five v2 CRITICALs except SEC-04 are resolved, and SEC-04 is a known, documented deferral. The remaining open items are real but narrower in blast radius. The codebase is materially closer to production-ready than the v2 pass indicated.

### Remaining Action Priority (ordered)

1. **`app/auth/confirm/route.ts:66`** — Route `next` through the existing `getSameOriginPath` helper (already used in `callback`/`verify`). Small, self-contained.
2. **`[id]` resource routes (SEC-04)** — Verify RLS scopes rows by `auth.uid() = created_by`, or add explicit ownership filters. Gate before first external user (per `CLAUDE.md`).
3. **`allowed_emails` RLS (SEC-11)** — Replace `USING (true)` / "public read access" with an admin-only read policy.
4. **`next.config.js` (NEW-03)** — Add a `headers()` block (CSP, HSTS, X-Frame-Options); reconsider `dangerouslyAllowSVG`.
5. **Dead code (ARCH-01)** — Remove `pages/`, `app/debug/`, `app/components/archive/`, and the `*-test`/`*-demo` dashboard routes.
6. **`useOrderForm.ts:124` (PERF-07)** — Replace the double-`JSON.stringify` dirty check with a shallow/field-level comparison.
