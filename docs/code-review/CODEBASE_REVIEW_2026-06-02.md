# Ivan Prints — Comprehensive Codebase Review
**Date:** 2026-06-02  
**Reviewer:** Automated multi-agent review (6 parallel modules)  
**Codebase:** Next.js 15 + TypeScript + Supabase + Shadcn UI  
**Scope:** 702 source files across 6 domain modules

---

## Review Methodology

Given the codebase size (702 TS/TSX files), the review was split into **6 parallel module scans**:

| Module | Scope |
|--------|-------|
| M1 — Security & Auth | middleware, auth routes, session, cookie, Supabase client patterns |
| M2 — API Layer | all route handlers, validation, error handling, RBAC |
| M3 — Frontend Components | React patterns, rendering, accessibility, memory |
| M4 — State Management | SWR hooks, contexts, Zustand, cache invalidation |
| M5 — Database & Supabase | migrations, RLS, indexes, query patterns |
| M6 — Build & Architecture | next.config, tsconfig, infra, dead code, bundle |

---

## Overall Rating: **4.5 / 10**

### Justification

The codebase demonstrates real product ambition and architectural intent (SWR, Zod, RLS, contexts, Sentry), but contains **critical security holes that would make it unsafe to expose publicly in its current form**. The rating breakdown:

| Dimension | Score | Reason |
|-----------|-------|--------|
| Security | 3/10 | Auth bypass in middleware, XSS in auth/verify, open redirects, IDOR across all resources, no CSRF, Sentry DSN hardcoded |
| Performance | 5/10 | Full-table analytics scans, triple SWR invalidation, redundant parallel fetches, no DB indexes on filter columns |
| Code Quality | 5/10 | 74+ `any` types, TS build errors suppressed, 3 components >600 lines, inconsistent patterns |
| Architecture | 6/10 | Good structure intent, undermined by dead code, mixed Pages/App router, monolithic service files |
| Maintainability | 5/10 | Good docs, but contradicted by archive dirs, debug routes, duplicated patterns |

---

## 1. Security Vulnerabilities

### CRITICAL

#### SEC-01 · Authentication Middleware Does Nothing
**File:** `middleware.ts`  
The middleware routes are configured but **no authentication enforcement exists**. Any visitor can navigate directly to `/dashboard/*` routes unauthenticated.

```typescript
// middleware.ts — only redirects, never validates auth
export async function middleware(request: NextRequest) {
  return updateSession(request)  // updateSession returns response without auth gate
}
```
`utils/supabase/middleware.ts` confirms `updateSession` does NOT redirect unauthenticated users — it only refreshes sessions.

**Fix:** Add explicit auth check before returning:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user && isProtectedRoute(request.nextUrl.pathname)) {
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
```

---

#### SEC-02 · XSS via Template Literal Injection in auth/verify
**File:** `app/auth/verify/route.ts` (~line 50–85)  
Server generates raw HTML with user-controlled values injected via template literals:

```typescript
const html = `
  <script>
    localStorage.setItem('auth_email', '${data.user?.email}');
    window.location.href = '${next}';  // next = unvalidated URL param
  </script>
`
```

An attacker can craft a URL where `email` or `next` contains closing quotes and arbitrary JS, or a `javascript:` URI.

**Fix:** Use `JSON.stringify()` for all injected values, validate `next` against an allowlist.

---

#### SEC-03 · Open Redirect in Auth Callback and Confirm
**Files:** `app/auth/callback/route.ts`, `app/auth/confirm/route.ts`  
The `next` query parameter is appended directly to the base URL without validating the destination:

```typescript
const redirectUrl = `${baseUrl}${formattedNext}`
return redirect(redirectUrl)
```

Attack: `?next=//attacker.com/steal` redirects to an external phishing site after successful authentication.

**Fix:**
```typescript
const allowedPaths = ['/dashboard', '/auth']
if (!allowedPaths.some(p => formattedNext.startsWith(p))) {
  formattedNext = '/dashboard/orders'
}
```

---

#### SEC-04 · IDOR — No Ownership Verification on Any Resource
**Files:** `app/api/orders/[id]/route.ts`, `app/api/expenses/[id]/route.ts`, `app/api/material-purchases/[id]/route.ts`, all sub-routes  
Every resource endpoint fetches by ID alone, with no check that the authenticated user owns or is authorized to view it:

```typescript
// orders/[id]/route.ts
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('id', id)  // No .eq('created_by', user.id)
  .single()
```

Any authenticated user can read, update, or delete any other user's orders/expenses/materials by guessing the UUID.

**Fix:** Either add `.eq('created_by', user.id)` to all queries OR implement database-level RLS policies with `auth.uid() = created_by`.

---

#### SEC-05 · Hardcoded Mock Admin User — Auth Bypass in Production
**File:** `app/context/auth-context.tsx` (~lines 242–270)  
In "development" mode, a mock admin user is auto-injected when no session exists:

```typescript
const mockProfile = {
  id: '00000000-0000-0000-0000-000000000000',
  role: 'admin',   // full admin access
  ...
}
setUser(mockUser)
setProfile(mockProfile)
```

`process.env.NODE_ENV` is checked client-side. If `NODE_ENV` is misconfigured in any deployment, all visitors get an admin session with UUID `00000000-0000-0000-0000-000000000000`.

**Fix:** Delete this block entirely. Use Supabase local development with real test users.

---

#### SEC-06 · Sentry DSN Hardcoded in Source
**Files:** `sentry.server.config.ts:8`, `sentry.edge.config.ts:8`  
The Sentry DSN is committed to the repository. Anyone with repo access can submit fake error events and read error telemetry.

**Fix:** Move to `process.env.NEXT_PUBLIC_SENTRY_DSN`, rotate the existing DSN.

---

#### SEC-07 · TypeScript + ESLint Build Errors Suppressed
**File:** `next.config.js`
```javascript
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true }
```
This means unsafe code, type holes, and security anti-patterns pass through CI silently.

**Fix:** Remove both flags, fix the ~50+ TypeScript errors surfaced.

---

### HIGH

#### SEC-08 · Order DELETE Endpoint Has No Role Check
**File:** `app/api/orders/route.ts`  
Expenses and materials check `role === 'admin' || 'manager'` before deletion. Orders do not — any authenticated staff member can delete any order.

---

#### SEC-09 · CSRF — No Token on State-Mutating Endpoints
No CSRF token validation exists on any POST/PUT/DELETE route, including `app/auth/fix-profile-rls/route.ts` which uses the service role key.

---

#### SEC-10 · App Settings GET — No Auth Check
**File:** `app/api/settings/app/route.ts`  
Returns app configuration to any unauthenticated caller:
```typescript
export async function GET(request: NextRequest) {
  // NO AUTH CHECK
  const { data } = await supabase.from('app_settings').select('settings').single()
  return NextResponse.json({ settings: data?.settings || {} })
}
```

---

#### SEC-11 · `allowed_emails` Table Readable by All Authenticated Users
**Migration:** `20250901000000_auth_checkpoint_and_updates.sql:159`
```sql
CREATE POLICY "Authenticated users can read allowed_emails"
ON allowed_emails FOR SELECT TO authenticated USING (true);
```
Any logged-in staff member can enumerate all privileged email addresses and their assigned roles.

---

#### SEC-12 · Note `created_by` Overridable by Client
**File:** `app/api/orders/[id]/inline-edit/route.ts`
```typescript
created_by: note.created_by ?? user.id  // Client can set created_by to any UUID
```

---

#### SEC-13 · Sensitive Data in localStorage
**File:** `app/lib/auth/session-utils.ts`  
Auth tokens, profile data, and email addresses cached in `localStorage`, vulnerable to XSS extraction.

---

### MEDIUM

| ID | Description | File |
|----|-------------|------|
| SEC-14 | Wildcard ILIKE search allows enumeration (`%` in `order_number.ilike.%${search}%`) | `orders/route.ts:36` |
| SEC-15 | Excessive console logging of emails, UUIDs, auth params in production | Multiple auth files |
| SEC-16 | Analytics date range not validated — reversed dates accepted | All analytics routes |
| SEC-17 | Cron endpoint secured only with bearer token (no IP/signature) | `cron/generate-recurring-expenses/route.ts` |
| SEC-18 | Sensitive backup tables (`profiles_backup_20250920`) never cleaned up | Migrations |
| SEC-19 | Account enumeration via different error messages for valid/invalid emails | `authorization.ts` |

---

## 2. Performance Bottlenecks

### CRITICAL

#### PERF-01 · Analytics Queries Load Entire Table into Memory
**Files:** `app/api/orders/analytics/route.ts`, `app/api/orders/metrics/route.ts`

```typescript
// Fetches ALL orders with no LIMIT, then aggregates in JS
const { data } = await query  // Could be 100k+ rows
const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
```

At scale this will exhaust memory and timeout. All aggregation should be pushed into SQL:
```sql
SELECT SUM(total_amount), COUNT(*), payment_status 
FROM orders 
WHERE date BETWEEN $1 AND $2
GROUP BY payment_status
```

---

#### PERF-02 · Triple SWR Cache Invalidation on Every Mutation
**File:** `app/lib/cache-utils.ts:9–62`

`invalidateOrderCache()` fires three sequential `mutate()` calls with 100ms setTimeout delays, triggering 3 separate refetches of the same data with race conditions between them.

**Fix:** Consolidate into one `mutate()` call with a key filter regex.

---

#### PERF-03 · Full Table Scan on `payment_status` Columns
**Database:** `orders.payment_status`, `material_purchases.payment_status`  
Both analytics and list endpoints filter on `payment_status`, but no indexes exist on these columns.

**Fix:**
```sql
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_material_purchases_payment_status ON material_purchases(payment_status);
```

---

#### PERF-04 · ILIKE Searches on Non-Indexed Text Columns
**Files:** `app/api/material-purchases/optimized/route.ts:39`
```typescript
query = query.ilike('supplier_name', `%${supplier}%`)  // Full table scan
```
Pattern with leading `%` cannot use a btree index. Needs either GIN/pg_trgm index or a search service.

---

### HIGH

| ID | Description | File |
|----|-------------|------|
| PERF-05 | Duplicate overlapping SWR fetches for installments (both optimized + direct endpoint called simultaneously) | `useMaterialPurchases.ts:1059` |
| PERF-06 | Scroll event listener fires without debounce on every pixel | `TopHeader.tsx:160` |
| PERF-07 | `isDirty()` calls `JSON.stringify(order)` on every render invocation | `useOrderForm.ts:157` |
| PERF-08 | `notifications.filter()` runs on every render without `useMemo` | `NotificationsDrawer.tsx:34` |
| PERF-09 | N+1 RLS policy evaluation — `is_admin()` subquery runs per row | `consolidated_rls.sql:140` |
| PERF-10 | `storage.listBuckets()` called on every bucket existence check | `storage.ts:27` |

### MEDIUM

| ID | Description |
|----|-------------|
| PERF-11 | No pagination/limit on analytics endpoints — unbounded response size |
| PERF-12 | `.in('purchase_id', purchaseIds)` with 1000+ IDs blows up PostgreSQL IN list |
| PERF-13 | `React.memo()` applied without custom comparator — fails silently for object props |
| PERF-14 | SWR `revalidateOnFocus: true` on high-frequency data triggers expensive re-fetches |
| PERF-15 | Sentry `tracesSampleRate: 1` (100%) adds overhead to every request in production |

---

## 3. Code Smell Detection

### Component Size Violations (200-line project limit)

| File | Lines | Overage |
|------|-------|---------|
| `OrdersTableNew.tsx` | 625 | +425 |
| `useMaterialPurchases.ts` | 1100+ | +900 |
| `analytics-service.ts` | 919 | +719 |
| `database.ts` | 760 | +560 |
| `api.ts` | 687 | +487 |
| `OrderPaymentsTab.tsx` | 382 | +182 |
| `OrderFormModal/index.tsx` | 293 | +93 |

### Dead Code

- `app/components/archive/` — InvoiceModal, OrderFormModal, OrderViewModal retained after refactor
- `app/dashboard/notifications-test/`, `sizes-test/`, `calendar-demo/` — Test routes in production
- `app/debug/material-purchases/` — Debug page accessible at runtime
- `app/test/page.tsx` — Test page in production
- `app/dashboard/analytics/test/` — Test analytics page
- `pages/` directory — Old Pages Router files (`404.tsx`, `_error.jsx`, `unauthorized.tsx`) alongside App Router

### Duplicated Patterns

- Payment form logic repeated across `OrderPaymentsForm`, `InlinePaymentForm`, `AddOrderPaymentForm`
- Note creation repeated across `OrderNotesForm`, `InlineNoteForm`, `AddOrderNoteForm`
- Payment deletion auth check duplicated in every DELETE handler (should be middleware)
- Two parallel SWR fetcher implementations (`fetcher.ts` vs `lib/fetcher.ts`)

### Debug Code Left in Production

- 47+ `console.log()` statements in API routes and components
- `console.log('Auth callback received with params:', Object.fromEntries(searchParams.entries()))` — logs full auth params including tokens
- `console.log('[NotificationsContext]...')` — verbose state logging in every event

### Type Safety Debt

- 74+ `any` type usages in `app/lib/` alone
- `as unknown as X` casts mask real type mismatches
- TypeScript and ESLint errors suppressed at build level (`next.config.js`)
- `Order` type missing `payments` field, causing runtime casts in components

---

## 4. Best Practice Violations

### React / Next.js

| Violation | Location |
|-----------|----------|
| `useAuth()` called inside event handler (violates Rules of Hooks) | `SideNav.tsx:311` |
| `useEffect` with missing dependencies (`updateOrderField` omitted) | `OrderGeneralInfoForm.tsx:71` |
| Direct DOM manipulation via `querySelector` in React component | `OrderRow.tsx:87–98` |
| `setTimeout` inside `useEffect` as initialization workaround | `OrderGeneralInfoForm.tsx:62` |
| Missing keys on list renders in multiple components | Various |
| `window.location.reload()` in ErrorBoundary instead of callback prop | `ErrorBoundary.tsx:82` |
| Props passed to component that doesn't declare them (silently ignored) | `DashboardLayout.tsx:37` |

### Supabase / Auth

| Violation | Location |
|-----------|----------|
| `get`/`set`/`remove` cookie methods instead of `getAll`/`setAll` | Legacy client files |
| Client component imports server-only Supabase client | Multiple |
| Service role key used in route accessible via `fetch()` from client | `fix-profile-rls/route.ts` |
| `NEXT_PUBLIC_` anon key used in server-side Server Actions | `order-actions.ts` |

### API Design

| Violation | Location |
|-----------|----------|
| `as { id?: string }` type assertion instead of Zod parse | `orders/route.ts PUT:126` |
| `parseFloat() \|\| 0` silently swallows invalid amounts | `expenses/route.ts:146` |
| Random UUID generated for unknown category IDs instead of rejecting | `inline-edit/route.ts:30` |
| `created_at` set client-side (should be database `DEFAULT NOW()`) | Multiple routes |
| Inconsistent HTTP response shapes across endpoints | All API routes |

---

## 5. Refactoring Suggestions

### Priority 1 — Security (Immediate)

1. **Enable middleware auth gate** — 10-line fix in `middleware.ts`, blocks unauthenticated dashboard access
2. **Delete mock user block** — Remove lines 242–270 in `auth-context.tsx`
3. **Fix XSS in auth/verify** — Replace template literal with `JSON.stringify()`, validate `next` URL
4. **Add IDOR ownership checks** — Add `.eq('created_by', user.id)` OR implement RLS with `auth.uid()` checks across all resource endpoints
5. **Validate redirect URLs** — Centralize redirect validation into one utility used by all auth routes
6. **Move Sentry DSN to env var** — Rotate, add to `.env`, update both Sentry config files

### Priority 2 — Architecture

7. **Split `useMaterialPurchases.ts`** — 1100+ lines, extract into `useMaterialList`, `useMaterialDetail`, `useMaterialInstallments`, `useMaterialPayments` (each < 200 lines)
8. **Centralize API error + auth middleware** — Create a `withAuth(handler)` HOF that handles auth + role checks, removing 40+ duplicated auth blocks
9. **Remove dead code** — Delete `app/components/archive/`, `app/debug/`, test pages, `pages/` directory
10. **Add security headers** — Add `headers()` to `next.config.js` with CSP, HSTS, X-Frame-Options

### Priority 3 — Performance

11. **Push analytics aggregation to SQL** — Replace JS `.reduce()` on full datasets with `SELECT SUM/COUNT/AVG GROUP BY` queries
12. **Add missing DB indexes** — `orders.payment_status`, `material_purchases.payment_status`, `expenses.client_id`
13. **Consolidate SWR cache invalidation** — Replace triple-setTimeout pattern with single `mutate(key => key?.includes('/orders'), undefined, { revalidate: true })`
14. **Add pagination to analytics** — Apply `.range(0, 999)` max limit and return pagination metadata

### Priority 4 — Code Quality

15. **Remove TypeScript suppression** — Remove `ignoreBuildErrors: true`, fix all type errors
16. **Replace `any` types** — Work through `app/lib/` replacing `any` with `unknown` + type guards or concrete interfaces
17. **Extract shared payment/note forms** — One `PaymentForm` + one `NoteForm` component used everywhere, eliminating 6 duplicate form implementations
18. **Remove debug logging** — Scrub 47+ `console.log()` statements, replace with structured logger (pino recommended for Next.js)

---

## 6. Module-by-Module Summary

### M1 — Security & Auth: **3/10**
- Middleware does not protect routes
- XSS in auth/verify HTML template
- Open redirects in callback/confirm
- Mock admin user can bypass auth
- localStorage caching sensitive tokens
- No CSRF on state-mutating endpoints

### M2 — API Layer: **4/10**
- IDOR on every resource (no ownership checks)
- Order DELETE with no role check
- App settings accessible without auth
- `notes.created_by` overridable by client
- Raw type assertions instead of Zod in PUT handlers
- Error messages leak Postgres error codes

### M3 — Frontend Components: **5/10**
- Rules of Hooks violation in SideNav
- Direct DOM manipulation in OrderRow
- Memory leak from unbounced scroll listener
- 3 components exceeding 600 lines
- Missing imports that would cause runtime errors
- `React.memo()` used incorrectly (no comparator)

### M4 — State Management: **5/10**
- Triple-setTimeout invalidation race condition
- Duplicate overlapping SWR fetches for same data
- NotificationsContext drops events under load
- No cache busting on user switch
- `isDirty()` serializes entire order on every call
- Stale closure in `useOrderUpdates`

### M5 — Database & Supabase: **4/10**
- `allowed_emails` fully readable by all authenticated users
- No row-level filtering (any staff reads all staff data)
- Analytics = full-table JS aggregation
- Missing indexes on `payment_status` filter columns
- `payment_method` vs `payment_type` column name mismatch across migrations
- Backup tables with sensitive data never cleaned

### M6 — Build & Architecture: **5/10**
- Sentry DSN hardcoded
- TS/ESLint build errors suppressed
- Test/debug pages in production builds
- Mixed Pages + App router
- No security headers configured
- Large monolithic service files (919, 760, 687 lines)

---

## Quick-Win Checklist

The following fixes address the highest severity issues with minimal code change:

- [ ] `middleware.ts` — add auth redirect for protected paths
- [ ] `auth-context.tsx:242–270` — delete mock user block
- [ ] `auth/verify/route.ts` — escape template literals with `JSON.stringify`, validate `next`
- [ ] `next.config.js` — remove `ignoreBuildErrors` and `ignoreDuringBuilds`
- [ ] `next.config.js` — add `headers()` with CSP, HSTS, X-Frame-Options
- [ ] `sentry.*.config.ts` — move DSN to env var, lower `tracesSampleRate` to `0.1`
- [ ] `api/settings/app/route.ts` — add `getUser()` auth check
- [ ] `api/orders/route.ts DELETE` — add role check matching expenses pattern
- [ ] All `[id]/route.ts` — add `.eq('created_by', user.id)` or confirm RLS covers IDOR
- [ ] `auth/callback/route.ts`, `auth/confirm/route.ts` — validate `next` against path allowlist
- [ ] `cache-utils.ts` — consolidate 3 mutate calls into 1
- [ ] Remove `app/components/archive/`, `app/debug/`, `app/test/`, `pages/`
- [ ] Add indexes: `orders.payment_status`, `material_purchases.payment_status`
- [ ] `inline-edit/route.ts:30` — reject unknown `category_id` instead of generating random UUID
- [ ] Scrub `console.log()` calls from auth routes (contain tokens/emails)

---

*Report generated by 6-module parallel review. Each module independently reviewed ~100–150 files.*
