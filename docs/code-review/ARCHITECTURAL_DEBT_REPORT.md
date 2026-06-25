# Architectural Debt Report — Ivan Prints
**Date:** 2026-06-03 (re-audit)  
**Previous audit:** 2026-06-02  
**Scope:** Data layer, auth layer, caching layer, error handling, type safety, observability  
**Method:** Direct file reads + grep analysis across `app/`

> This report covers structural decisions — not individual bugs. The findings here are the reasons why bugs keep appearing in the same areas, why the same fix has to be applied in multiple places, and why adding features is getting harder over time.

---

## What Changed Since Last Audit

| Finding | Previous | Now | Status |
|---------|----------|-----|--------|
| Auth: getSession() vs getUser() | 3 stale getSession() calls in AuthHandler.tsx | middleware.ts and auth-context.tsx now use getUser() | **Partially fixed** — AuthHandler.tsx still exists |
| Direct Supabase in hooks | 6 hooks queried DB directly | No supabase.from() found in hooks/ | **Fixed** |
| SWR config inconsistency | 4 factories | Still 4+ factories, expenses still hardcoded | **Not fixed** |
| ignoreBuildErrors | true | Still true | **Not fixed** |
| select('*') overfetch | 95 | 95 | **Not fixed** |
| setTimeout coordination | 132 | 132 | **Not fixed** |
| Silent error swallowing | 20+ catch blocks | 9 in useData.ts alone + 833 console.error with no Sentry | **Not fixed — worsened** |
| God modules | Not previously counted | 44 files over 200 lines; 4 files over 1,000 lines | **New finding** |
| TypeScript any | Not previously counted | 218 total (176 `: any`, 42 `as any`) | **New finding** |
| Sentry coverage | Not previously measured | 1 captureException in entire codebase | **New finding** |

---

## Executive Summary

The codebase retains all eight structural findings from the previous audit. Three new findings have been added. The most significant change is that direct Supabase queries from hooks have been removed — a meaningful improvement — but the underlying dual-path architecture in `useData.ts` was not addressed, which means the fallback chain remains and silent failures continue to be invisible.

The Sentry finding is the sharpest new risk: 833 `console.error` calls exist across the codebase, but only one `Sentry.captureException` call. Production failures disappear into browser consoles and are never alerted on.

| Category | Finding | Blast Radius |
|----------|---------|--------------|
| Data layer | 4 independent implementations fetching the same `orders` data | Every page that shows orders |
| Auth layer | 2 auth state stores (Supabase SSR cookies, localStorage) + AuthHandler.tsx duplication | Login flow, session validation |
| SWR config | 4+ config factories with inconsistent values | Cache TTL, retry behavior across all hooks |
| Build safety | `ignoreBuildErrors: true` — TS errors invisible in CI | All TypeScript across the entire project |
| Overfetch | 95 `select('*')` calls | Every DB read in the application |
| Async band-aids | 132 `setTimeout` calls | Forms, sheets, loading states |
| Silent failures | 9+ catch blocks in useData.ts returning `{}`; 833 console.error with no Sentry | Error visibility, alerting, user feedback |
| God modules | 44 files over 200 lines; 4 over 1,000 lines | Every feature area |
| Type safety | 218 `any` annotations | Type correctness across all modules |
| Observability | 1 Sentry.captureException in entire codebase | Production error detection |

---

## Finding 1 — Four Independent Implementations of the Same Data Fetch

**This is the root cause of most other bugs. It has not changed.**

When a developer needs order data, there are four different code paths they can reach into. All four return something called `Order`. None of them return exactly the same shape.

### The four paths

**Path A — `lib/api.ts:32–101` (direct Supabase, JOIN)**
```typescript
// lib/api.ts:40-42
let query = supabase
  .from('orders')
  .select('*, clients:client_id(name)', { count: 'exact' });
//          ^^ JOIN to 'clients' table — assumes client_id is a FK to a 'clients' table
```
Uses a `clients` JOIN. If the `clients` table doesn't exist or the FK name changes, this silently returns `'Unknown Client'` for every order. Contains `fetchOrderById` which queries `order_notes` — the API route queries `notes`. Two different table names for the same data. (687 lines total.)

**Path B — `hooks/useData.ts:104–304` (direct Supabase fallback, no JOIN)**
```typescript
// useData.ts:134-136
let query = supabase
  .from('orders')
  .select('*', { count: 'exact' });
```
No JOIN. Also contains a development bypass (lines 117–127) that allows unauthenticated access. Fires an extra count-only query on every fetch. The fallback chain (lines 422–577) tries the API with a 20-second timeout, retries with smaller page sizes (50, then 20), then falls back to direct Supabase.

**Path C — `lib/supabase.ts:39–135` (`dataService`)**
```typescript
// lib/supabase.ts:48
catch (error) {
  console.error('Error fetching orders:', error);
  return [];  // ← swallows ALL errors silently
}
```
Wraps the API route. Swallows every error and returns `[]`. The caller gets an empty array whether the API is down, auth failed, or there are genuinely no orders.

**Path D — `GET /api/orders/route.ts` (the correct path)**
```typescript
// api/orders/route.ts:23-27
.select(
  `id, order_number, client_id, client_name, client_type, date, status,
   payment_status, total_amount, amount_paid, balance, created_by,
   delivery_date, is_delivered, created_at, updated_at`,
  { count: 'exact' },
)
```
Explicit columns. Server-side auth. Proper error propagation. This is the path that should be used everywhere.

### What this means in practice

| Scenario | Path A | Path B | Path C | Path D |
|----------|--------|--------|--------|--------|
| Schema column renamed | Silent wrong value | Silent wrong value | Propagates error (but swallows it) | ✅ Correct |
| Auth token expires | Depends on RLS | Dev bypass may pass | Returns `[]`, no signal | ✅ 401 returned |
| Notes table renamed | Breaks silently (queries `order_notes`) | Queries `notes` ✅ | Depends on API | ✅ Queries `notes` |
| New column added | Not included | Included via select* | Depends on API | ✅ Requires explicit add |
| Error occurs | Throws ApiError | Returns `{orders:[]}` | Returns `[]` | ✅ Returns 4xx/5xx |

**The consequence:** a fix applied to Path D (the API route) does not fix Paths A, B, or C. When Path B's fallback triggers, users get data that bypasses all server-side validation.

---

## Finding 2 — Auth State Duplication (Partially Fixed)

**Improvement since last audit:** `auth-context.tsx` and `middleware.ts` now use `getUser()` (server-validated) instead of `getSession()` (stale cache). This is the correct fix.

**Still unresolved:** `AuthHandler.tsx` (159 lines) exists and still re-implements logic already covered elsewhere:

- **OTP verification** — already handled in `auth/verify/route.ts`
- **Session checking** — already handled in middleware
- **Redirect-to-signin** — already handled in middleware
- **Redirect-to-dashboard** — already handled in `auth/callback/route.ts`

`AuthHandler.tsx` also writes six localStorage keys on every auth event:
```
auth_completed, auth_in_progress, auth_timestamp, auth_user_id, auth_email, auth_email_temp
```
`auth_email` and `auth_email_temp` are PII written to client storage and never explicitly invalidated on sign-out.

### localStorage spread (17 files, 169 references)

What was previously three auth stores has expanded. localStorage is now used for auth state, form persistence, dropdown caches, settings, and cleanup scheduling — across 17 different files. The keys are not centrally defined or documented:

| File | What it stores |
|------|---------------|
| `components/auth/AuthHandler.tsx` | 6 auth-related keys including PII |
| `context/auth-context.tsx` | `cached_user_profile` (role, identity — 1hr TTL) |
| `components/orders/OrderFormSheet.tsx` | Order form data |
| `components/orders/forms/InlinePaymentForm.tsx` | `payment-form-${formIndex}` |
| `context/GlobalDropdownCache.tsx` | Dropdown option cache |
| `context/DropdownCacheContext.tsx` | Dropdown cache (duplicate of above?) |
| `hooks/useSmartDropdown.ts` | Recent selections |
| `hooks/useSmartDropdownCached.ts` | Dropdown cache (third copy?) |
| `hooks/useSmartSizes.ts` | Size options |
| `context/settings/SettingsContext.tsx` | App settings |
| `app/lib/cache.ts` | Generic cache layer |
| `utils/form-storage.ts` | Form persistence utility |
| `components/CacheCleanupInitializer.tsx` | Cleanup scheduling |

There is no central registry of what keys exist, no TTL enforcement system, and no guarantee keys are cleared on sign-out. A stale `cached_user_profile` can present a downgraded user as having their old role until they clear browser storage manually.

---

## Finding 3 — Four SWR Configuration Factories That Can Disagree

**Unchanged from previous audit.**

| File | Method | `errorRetryCount` | dedupingInterval | Source |
|------|--------|-------------------|-----------------|--------|
| `lib/swr-config.ts:97` | `createSWRConfig()` | `SWR_RETRY.LIST_COUNT` (2) | `SWR_CACHE_TIMES.LIST_DEDUPE` (5 min) | constants |
| `hooks/materials/swr-config.ts` | `createMaterialSWRConfig()` | from constants | from constants | constants ✅ |
| `hooks/expenses/swr-config.ts:24` | `createExpenseSWRConfig()` | `3` (hardcoded) | `30 * 60 * 1000` (hardcoded) | inline literals |
| `hooks/useData.ts:29–52` | inline objects | `2` (hardcoded) | `30 * 60 * 1000` (hardcoded) | inline literals |

Beyond the four factories, at least 8 additional hooks define their own inline SWR configs with hardcoded values:

```
hooks/useReferenceData.ts:25    dedupingInterval: 300000
hooks/useOrderAnalytics.ts:75   dedupingInterval: 60000
hooks/useOrders.ts:58           dedupingInterval: 5 * 60 * 1000
hooks/useDropdownData.ts:269    dedupingInterval: 60 * 60 * 1000
hooks/useOrderMetrics.ts:68     dedupingInterval: 60000
hooks/materials/useMaterialPurchases.ts:68  dedupingInterval: 5 * 60 * 1000
hooks/expenses/useExpensesList.ts:56        dedupingInterval: 60 * 1000
features/invoices/hooks/useInvoiceSettingsV2.ts:44  dedupingInterval: 60000
```

Changing a global cache TTL requires auditing 12+ files to find every inline literal.

---

## Finding 4 — `ignoreBuildErrors: true` Hides Real Type Failures

**Unchanged from previous audit.**

```javascript
// next.config.js:7-10
typescript: {
  ignoreBuildErrors: true,   // all TS errors silently pass
},
eslint: {
  ignoreDuringBuilds: true,  // all ESLint errors silently pass
}
```

This setting is what allows 218 `any` annotations to compile without warning, why `select('*')` returns untyped `any[]` across 95 call sites, and why type mismatches are caught only in production or manual testing.

---

## Finding 5 — 95 `select('*')` Calls (Overfetch)

**Unchanged from previous audit.**

Every `select('*')` transfers every column in a table to the application layer and returns `any[]` in TypeScript. Top offenders:

| File | Count |
|------|-------|
| `hooks/useData.ts` | 6 |
| `lib/auth/profile-utils.ts` | 5 |
| `lib/api.ts` | 5 |
| `context/NotificationsContext.tsx` | 5 |
| `api/orders/[id]/route.ts` | 4 |
| `api/material-purchases/[id]/route.ts` | 4 |
| `api/material-purchases/[id]/optimized/route.ts` | 4 |
| `api/expenses/recurring/route.ts` | 4 |
| `api/expenses/[id]/route.ts` | 4 |

`GET /api/orders/route.ts` demonstrates the correct approach. The others haven't been updated to match.

---

## Finding 6 — 132 `setTimeout` Calls as Async Coordination

**Unchanged from previous audit.**

The most severe patterns:

**Triple-nested state coordination** (`OrderActions.tsx:65–74`):
```typescript
setTimeout(() => {
  setTimeout(() => {
    setTimeout(() => { ... }, 100);
  }, 200);
}, 300);
```
These are race condition guesses about React's reconciler timing, which varies by device and load.

**Form close sequencing** (`OrderFormSheet.tsx:1018`): `setTimeout` used to sequence a dialog close after a save action. This will race on slow devices.

**Async recalculation** (`OrderFormSheet.tsx:149`): Deferred state update to prevent circular re-render cycle — the correct fix is to break the circular dependency in state, not defer around it.

---

## Finding 7 — Silent Error Swallowing + No Sentry Integration

**This finding has worsened since the last audit.**

`useData.ts` alone has 9 locations that catch errors and return empty data:

```
Lines 122-126   no valid session → returns {orders:[], total:0}
Lines 188-192   fetch error → empty response
Lines 196-201   no data → empty response
Lines 298-302   general error → empty response
Lines 465-469   supabase fallback error → empty response
Lines 514-519   supabase fallback error → empty response
Lines 547-551   supabase fallback error → empty response
Lines 562-567   supabase fallback error → empty response
Lines 572-577   general error → empty response
```

**The new Sentry finding makes this structural:** there are 833 `console.error` calls across the codebase, but only **one** `Sentry.captureException` call — in `global-error.tsx`, which only fires for uncaught React render errors. Every error in every API route, every hook catch block, every service failure: all of them go to `console.error` and disappear from production observability entirely.

```
Top console.error concentrations:
  analytics-service.ts         — 41 calls
  hooks/useData.ts             — 27 calls
  lib/utils/error-handler.ts  — 19 calls
  lib/auth/profile-utils.ts   — 18 calls
  hooks/materials/useMaterialPurchases.ts — 15 calls
```

**Practical consequence:** when the orders API breaks, the orders table shows "No orders found." Sentry sees nothing. No alert fires. Developers find out from user support requests, then trace through browser console history.

---

## Finding 8 — God Modules (New Severity Assessment)

**44 files exceed the project's 200-line limit.** Four files exceed 1,000 lines:

| File | Lines | Problem |
|------|-------|---------|
| `hooks/useData.ts` | 1,287 | Fetching, mutations, retry logic, SWR config, UI state — all one file |
| `hooks/materials/useMaterialPurchases.ts` | 1,159 | 15+ exported hooks covering payments, notes, installments |
| `dashboard/settings/_components/AccountsSettingsTab.tsx` | 1,124 | Single component doing full settings CRUD |
| `components/orders/OrderFormSheet.tsx` | 1,032 | Form state, validation, submission, payment logic |

Additional large files that represent single-responsibility violations:

| File | Lines |
|------|-------|
| `lib/services/analytics-service.ts` | 919 |
| `context/GlobalDropdownCache.tsx` | 904 |
| `components/orders/order-view/hooks/useOrderUpdates.ts` | 829 |
| `dashboard/analytics/_components/OverviewPanel.tsx` | 793 |
| `dashboard/orders/_components/TasksTab.tsx` | 786 |
| `lib/services/database.ts` | 760 |
| `context/DropdownCacheContext.tsx` | 708 |
| `lib/api.ts` | 687 |

The CLAUDE.md file specifies a 200-line limit per file. Every file above this list violates that rule. The consequence is that changes to one feature (e.g., payment logic) require navigating 1,000+ line files where unrelated logic lives nearby.

---

## Finding 9 — TypeScript `any` Saturation

**218 total `any` annotations** (176 `: any` type annotations, 42 `as any` casts).

This is a direct consequence of Finding 4 (`ignoreBuildErrors: true`) and Finding 5 (`select('*')` returns untyped data). When queries return `any[]`, every downstream variable must also be `any`.

Top offenders:
```
hooks/materials/useMaterialPurchases.ts  — 9 occurrences
hooks/useData.ts                         — 6 occurrences
dashboard/expenses/view/useExpenseUpdates.ts — 6 occurrences
features/invoices/hooks/useInvoiceSettingsV2.ts — 5 occurrences
components/orders/OrderFormSheet.tsx     — 6 as any casts
components/orders/OrderFormModal/OrderPaymentsForm.tsx — 5 as any casts
```

`any` annotations are not in themselves bugs. But each one is a place where a type error can exist and TypeScript cannot catch it — and with `ignoreBuildErrors: true`, even the errors TypeScript could catch are suppressed.

---

## Failure Mode Map

How these findings interact in practice:

```
User action: API returns an error for 30 seconds (deploy, network blip)
  → Path D (API route): returns 503
  → Path B (useData.ts) fallback: retries with smaller page size → still 503
  → useData.ts supabase fallback: catches error → returns {orders: [], total: 0}
  → SWR sees a successful fetch (no throw) → isError = false, isLoading = false
  → User sees "No orders found" — same message as genuine empty state
  → Sentry sees nothing — no captureException called, no alert fires
  → Developer finds out from support ticket, has to trace console.log history

User action: changes role in admin panel
  → API updates 'profiles' table (correct)
  → localStorage 'cached_user_profile' still holds old role (1hr TTL)
  → auth-context.tsx reads from cache → presents user with old role UI
  → No invalidation mechanism exists for the cached profile
  → User sees wrong UI until cache expires or they clear localStorage

Developer updates SWR retry count globally
  → Updates SWR_RETRY.LIST_COUNT in lib/swr-config.ts
  → Materials hooks pick it up (imports constant ✅)
  → Expenses hooks do not (hardcoded '3' in expenses/swr-config.ts)
  → useData.ts inline config does not (hardcoded '2')
  → 8 inline configs in other hooks do not
  → Half the app has the new retry behavior, half doesn't

Developer adds a new column to 'orders' table
  → Path D (API route): requires explicit add to SELECT list → developer is forced to notice
  → Path B (useData.ts): select('*') picks it up automatically, untested
  → Path A (lib/api.ts): may conflict with clients JOIN alias
  → Path C (dataService): depends on what Path D returns
  → Three different behaviors from one schema change
```

---

## Root Cause

All findings trace back to the same three original decisions identified in the previous audit. They remain unaddressed:

1. **"Let me add a fallback in case the API is slow"** → `fetchOrdersFromSupabase` in `useData.ts` → second data path that diverged from the API route and now has 9 catch blocks suppressing errors

2. **"Never throw, just return empty data"** → `dataService` pattern in `lib/supabase.ts` → silent failures become invisible, SWR error states never fire, Sentry sees nothing

3. **"I'll come back and clean up this config"** → SWR configs copy-pasted across 12+ locations → every global config change requires multi-file audits

---

## Recommended Remediation Order

### Phase 1 — Stop the bleeding (no regressions, low risk)

1. **Turn on `ignoreBuildErrors: false`** (`next.config.js:7`) — fix the TS errors that surface, or suppress them deliberately with `// @ts-expect-error`. At minimum you will see the real scope of the type debt.

2. **Delete `AuthHandler.tsx`** — this component duplicates functionality already covered by middleware and `auth/callback/route.ts`. Verify where it's rendered first. Its deletion removes 6 PII localStorage keys and eliminates the duplicated auth logic.

3. **Add Sentry to `lib/utils/error-handler.ts`** — a single change to the shared error handler will route all `handleApiError`, `handleSupabaseError`, and `handleUnexpectedError` calls through Sentry. This gives immediate production visibility without touching individual catch blocks.

### Phase 2 — Fix error propagation (medium risk)

4. **Change `dataService` catch blocks to throw** — in `lib/supabase.ts`, replace `return []` with `throw error`. Update every caller. SWR `isError` will then work correctly and users will see error states instead of empty data.

5. **Remove `fetchOrdersFromSupabase` from `useData.ts`** — the direct Supabase fallback in the 20-second retry chain. If the API is unreliable, fix the API. Replace with proper SWR error state that surfaces failures to the user.

### Phase 3 — Unify configuration (low risk, high maintenance value)

6. **Delete `hooks/expenses/swr-config.ts`** — replace with `createSWRConfig()` from `lib/swr-config.ts`. Fix the hardcoded `errorRetryCount: 3` and `dedupingInterval` literals.

7. **Replace inline SWR configs** — 8 hooks define inline config objects. Move them to use `createSWRConfig()`. This is mechanical but needed before any cache tuning work is meaningful.

### Phase 4 — Unify the data layer (medium risk, needs testing)

8. **Deprecate `lib/api.ts`** — find every caller, redirect to API routes via `fetch`. It uses a `clients` JOIN that references a potentially wrong table name.

9. **Centralize localStorage keys** — create `lib/storage-keys.ts` as a const enum of every key written to localStorage, with owner and TTL documented. Add a sign-out cleanup function that clears all auth and profile keys.

### Phase 5 — Architectural cleanup (high risk, do last)

10. **Split god modules** — `useData.ts`, `useMaterialPurchases.ts`, `OrderFormSheet.tsx`. Do one at a time. Each split requires updating all consumers.

11. **Replace `select('*')` with explicit column lists** — systematic but low-risk if done entity by entity.

12. **Replace `any` annotations** — start with `as any` casts (42 instances) as these are the most likely to conceal real bugs.

---

## What Not to Touch Yet

- **`useOrders` fallback chain** in `useData.ts:401–577` — the most fragile code in the application. The other changes above will reduce or eliminate the need for it. Refactoring it before removing root causes will introduce regressions.
- **`useMaterialPurchases.ts` split** — 1,159 lines covering payments, notes, and installment logic. Safe to split only after Phase 2 stabilizes the data layer.
- **`analytics-service.ts`** — currently the only consumer of analytics data. Safe to leave until all other data paths are cleaned up.
