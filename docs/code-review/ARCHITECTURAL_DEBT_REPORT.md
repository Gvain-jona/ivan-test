# Architectural Debt Report — Ivan Prints
**Date:** 2026-06-02  
**Scope:** Data layer, auth layer, caching layer, error handling architecture  
**Method:** Direct file reads + grep analysis across `app/`

> This report covers structural decisions — not individual bugs. The findings here are the reasons why bugs keep appearing in the same areas, why the same fix has to be applied in multiple places, and why adding features is getting harder over time.

---

## Executive Summary

The codebase has **three independent data-fetching implementations** for the same entities, **three separate auth state stores**, **four SWR configuration factories**, and build error suppression that hides type failures at compile time. Each of these started as a single reasonable shortcut. Together they mean that a schema change, an auth fix, or a caching change must be applied in 3–4 places or it silently doesn't take effect in some code paths.

| Category | Finding | Blast Radius |
|----------|---------|--------------|
| Data layer | 4 independent implementations fetching the same `orders` data | Every page that shows orders |
| Auth layer | 3 separate auth state stores (Supabase cookie, localStorage, context) | Login flow, session validation |
| SWR config | 4 separate config factories with inconsistent values | Cache TTL, retry behavior across all hooks |
| Build safety | `ignoreBuildErrors: true` — TS errors invisible in CI | All TypeScript across the entire project |
| Overfetch | 95 `select('*')` calls | Every DB read in the application |
| Async band-aids | 132 `setTimeout` calls | Forms, sheets, loading states |
| Silent failures | 20+ catch blocks returning `[]` or `null` | Error visibility, user feedback |
| Direct DB in hooks | 6 hooks query Supabase directly, bypassing API routes | RLS, validation, auth checks |

---

## Finding 1 — Four Independent Implementations of the Same Data Fetch

**This is the root cause of most other bugs.**

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
Uses a `clients` JOIN. If the `clients` table doesn't exist or the FK name changes, this silently returns `'Unknown Client'` for every order. Contains `fetchOrderById` which queries `order_notes` (line 164) — the API route queries `notes`. Two different table names for the same data.

**Path B — `hooks/useData.ts:104–304` (direct Supabase, no JOIN)**
```typescript
// useData.ts:134-136
let query = supabase
  .from('orders')
  .select('*', { count: 'exact' });
// ^ select('*'), no JOIN, reads client_name directly from orders table
```
No JOIN. Fires an extra count-only query on every single fetch (lines 139–147, the "DIRECT COUNT CHECK"). Also has a development bypass (line 117–127) that allows unauthenticated access.

**Path C — `lib/supabase.ts:39–135` (`dataService`)**
```typescript
// lib/supabase.ts:41-49
getOrders: async () => {
  try {
    const response = await fetchWithErrorHandling(API_ENDPOINTS.ORDERS);
    return response.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];  // ← swallows ALL errors silently
  }
},
```
Wraps the API route. BUT: swallows every error and returns `[]`. The caller gets an empty array whether the API is down, auth failed, or there are genuinely no orders. Also logs `Fetching data from: /api/orders` on every call (line 22).

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
| Notes table renamed | Breaks silently (queries `order_notes` not `notes`) | Queries `notes` ✅ | — | ✅ Queries `notes` |
| New column added to orders | Not included | Included (select*) | Depends on API | ✅ Requires explicit add |
| Error occurs | Throws `ApiError` | Returns `{orders:[]}` | Returns `[]` | ✅ Returns 4xx/5xx |

**The consequence:** a fix applied to Path D (the API route) does not fix Paths A, B, or C. Developers working on the hooks are not working on the API route. When Path B's fallback triggers (API unavailable), users get data that bypasses all server-side validation.

---

## Finding 2 — Three Auth State Stores Running Simultaneously

The application manages authentication identity in three places at once. They can disagree.

### Store 1 — Supabase SSR cookies (correct)
Managed by `utils/supabase/middleware.ts`. Refreshed on every request. `getUser()` re-validates with the server. This is what should be the single source of truth.

### Store 2 — localStorage (parallel, client-side)
Managed by `components/auth/AuthHandler.tsx`. Writes these keys on every auth event:
```
auth_completed       — boolean flag
auth_in_progress     — boolean flag  
auth_timestamp       — unix timestamp
auth_user_id         — UUID
auth_email           — PII: user's email address
auth_email_temp      — PII: duplicate email address
```
`AuthHandler.tsx` is a client component that runs `getSession()` (stale cache) to check auth, then independently redirects with `window.location.href` (hard reload, bypasses Next.js router). It also calls `verifyOtp()` client-side (line 42) — OTP verification is also handled server-side in `auth/verify/route.ts`. Both run on the same token.

### Store 3 — React context (`context/auth-context.tsx`)
Reads from the Supabase session AND from `localStorage.getItem('cached_user_profile')` to short-circuit the profile load. The context considers localStorage as a valid fallback for the user's role and identity.

### The divergence problem

```
Supabase cookie says:  user is authenticated, role = 'staff'
localStorage says:     auth_completed = true, role = 'admin'  (stale from last session)
React context reads:   localStorage first → presents user as 'admin'
```

This is not hypothetical. The localStorage values are written but never invalidated on role change. A user whose role is downgraded from `admin` to `staff` will still see admin UI until they clear their browser storage.

### `AuthHandler.tsx` is also a duplicate auth implementation

The component (159 lines) re-implements:
- OTP verification (already in `auth/verify/route.ts`)  
- Session checking (already in middleware)
- Redirect-to-signin logic (already in middleware since the SEC-02 fix)
- Redirect-to-dashboard logic (already in `auth/callback/route.ts`)

It uses `getSession()` at lines 66, 101, 153 — all three are the stale-token check. The server-verified `getUser()` is only called *after* `getSession()` passes, as a secondary step to get the email.

---

## Finding 3 — Four SWR Configuration Factories That Can Disagree

SWR controls cache TTL, retry count, and revalidation behavior. There are four places where this is configured:

| File | Method | `errorRetryCount` | List TTL | Source of values |
|------|--------|-------------------|----------|-----------------|
| `lib/swr-config.ts:97` | `createSWRConfig()` | `SWR_RETRY.DEFAULT_COUNT` | `SWR_CACHE_TIMES.LIST_DEDUPE` | constants |
| `hooks/materials/swr-config.ts:11` | `createMaterialSWRConfig()` | `SWR_RETRY.DEFAULT_COUNT` | `SWR_CACHE_TIMES.LIST_DEDUPE` | constants ✅ |
| `hooks/expenses/swr-config.ts:18` | `createExpenseSWRConfig()` | `3` (hardcoded) | `30 * 60 * 1000` (hardcoded) | **inline literals** |
| `hooks/useData.ts:29–52` | inline objects | `2` (hardcoded) | `30 * 60 * 1000` (hardcoded) | **inline literals** |

The expenses config (`hooks/expenses/swr-config.ts`) diverged from the global constants at some point. `errorRetryCount: 3` vs the global constant means expense hooks retry once more than everything else. `focusThrottleInterval: 5000` (line 30) vs the global `60000` means expense hooks revalidate on window focus 12x more aggressively.

If you need to change "retry 3 times → retry 5 times" across the whole app, you must update 4 files and know which ones use literals vs constants.

---

## Finding 4 — `ignoreBuildErrors: true` Hides Real Type Failures

```javascript
// next.config.js:6-11
typescript: {
  ignoreBuildErrors: true,   // all TS errors silently pass
},
eslint: {
  ignoreDuringBuilds: true,  // all ESLint errors silently pass
}
```

This is how `'SERVER_ERROR'` (not in `ApiErrorType`) compiled and shipped — we caught it in the ERR-10 revalidation finding. It's also why 95 `select('*')` calls return untyped `any[]` without a single compile warning, and why the `isDirty: boolean` interface mismatching a `useCallback` return value was never caught automatically.

The consequence is not just that errors are hidden. It's that **developers lose the feedback loop that tells them they broke something.** The only way bugs surface is in production or manual testing.

---

## Finding 5 — 95 `select('*')` Calls (Overfetch)

Every `select('*')` transfers every column in a table to the application layer. For the `orders` table this likely includes columns like `internal_notes`, `cost_breakdown`, raw invoice data, etc. — none of which are needed by list views.

Beyond bandwidth, the deeper problem is **shape uncertainty**. When a query returns `any[]` (which `select('*')` does in TypeScript without explicit generics), every access is untyped. That's why hooks like `useData.ts:210` declare `let allItems: any[]` — the data coming back from `select('*')` has no TypeScript shape, so `any` is the only honest annotation available.

The 95 instances are concentrated in:
- `app/hooks/useData.ts` — 8 instances  
- `app/api/orders/[id]/route.ts` — 3 instances (all sub-resources)
- `app/api/expenses/` — 8 instances across route files
- `app/api/material-purchases/` — 6 instances
- `app/hooks/useRealNotifications.ts` — 2 instances
- `app/lib/api.ts` — throughout

`GET /api/orders/route.ts` (Path D above) already demonstrates the correct approach with explicit column selection. The others haven't been updated to match.

---

## Finding 6 — 132 `setTimeout` Calls as Async Coordination

`setTimeout` is used throughout the codebase as a way to "let React finish" before triggering the next state update. Each one indicates a place where proper async coordination is missing.

The most severe patterns:

**Form state coordination** (`InstallmentPlanForm.tsx:152`):
```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```
A literal 500ms pause in form submission logic. If the user is on a fast machine, 500ms is wasteful. On a slow machine, it may not be enough. This is not a workaround — it is a guess.

**Nested setTimeout chains** (`OrderActions.tsx:65–74`):
```typescript
setTimeout(() => {
  setTimeout(() => {
    setTimeout(() => { ... }, 100);
  }, 200);
}, 300);
```
Three levels of nested delay to coordinate UI state transitions. These are inherently race conditions: the delays are guesses about how long React's reconciler takes, which varies by device, load, and React version.

**React depth workaround** (`OrderFormSheet.tsx:149`):
```typescript
// prevent React update depth issues
setTimeout(() => { setOrder(updatedOrder) }, 0);
```
`setTimeout(fn, 0)` defers execution to the next event loop tick. This is a common way to break a "too many re-renders" cycle — but the correct fix is to find the circular dependency in state updates and break it there.

The 132 instances make the UI behave differently under load and are the first thing to investigate when a form "sometimes works" bugs are reported.

---

## Finding 7 — Silent Error Swallowing Throughout the Data Layer

The `dataService` pattern in `lib/supabase.ts` established a template that spread everywhere:

```typescript
// lib/supabase.ts — repeated for every entity
getOrders: async () => {
  try { return response.orders || []; }
  catch (error) {
    console.error('Error fetching orders:', error);
    return [];   // ← caller receives [] whether 0 orders or complete failure
  }
}
```

The same pattern appears in `lib/api.ts` functions, and in the fetch fallback chains inside `hooks/useData.ts`. The UI has no way to distinguish "no data" from "fetch failed." SWR's `isError` flag never becomes `true` because the fetcher never throws — it catches and returns empty data.

**Practical consequence:** When the orders API is broken, the orders table shows "No orders found" — the same message as when there genuinely are no orders. Users file a support request ("where did all my orders go?"). Developers have to dig through console logs to find the error. Automatic alerting cannot trigger because no error propagates to Sentry.

---

## Finding 8 — Direct Supabase in 6 Hooks (Bypasses API Layer)

Six hooks import and use the browser Supabase client directly to query tables, bypassing the API routes entirely:

| Hook | Tables queried directly | What's bypassed |
|------|------------------------|-----------------|
| `hooks/useData.ts` | `orders`, `order_items`, `notes` | API pagination, column selection, auth check |
| `hooks/useDropdownData.ts` | `categories`, `items` | `/api/categories`, `/api/items` endpoints |
| `hooks/useOrderCreation.ts` | `orders`, `order_items`, `order_payments` | `create_complete_order` RPC validation |
| `hooks/usePermissions.ts` | `profiles`, `allowed_emails` | Server-side role validation |
| `hooks/useRealNotifications.ts` | `notifications` | — (no API route for notifications) |
| `hooks/useSmartSizes.ts` | `sizes` | — |

`hooks/usePermissions.ts` is particularly notable: it reads from `allowed_emails` and `profiles` directly in the browser. This is client-side role checking — the user's browser is making the authorization decision. A user who modifies their network responses can make this hook believe they have `admin` access.

---

## Failure Mode Map

How these findings interact in practice:

```
User action: changes role in admin panel
  → API updates 'profiles' table (correct)
  → localStorage 'cached_user_profile' still holds old role
  → auth-context.tsx reads localStorage first → shows old UI
  → usePermissions.ts queries profiles directly → gets new role
  → UI is now split: context says old role, permissions hook says new role
  
User action: adds a new column to 'orders' table
  → Path D (API route): requires explicit add to SELECT list → developer is forced to notice
  → Path B (useData.ts): select('*') picks it up automatically, untested
  → Path A (lib/api.ts): depends on whether it conflicts with the JOIN alias
  → Path C (dataService): depends on what Path D returns
  → Three different behaviors from one schema change
  
Developer changes SWR retry count for reliability
  → Updates SWR_RETRY.DEFAULT_COUNT in lib/swr-config.ts
  → Materials hooks pick it up (imports constant ✅)
  → Expenses hooks do not (hardcoded '3' on line 24 of expenses/swr-config.ts)
  → useData.ts inline config does not (hardcoded '2' on line 383)
  → Half the app has the new retry behavior, half doesn't
  
API is temporarily down (deploy, network blip)
  → Path D returns 503
  → Path C (dataService) catches, returns [] → SWR sees success, isError=false
  → useData.ts fallback chain: tries API → tries direct Supabase → returns {} 
  → Users see empty tables with no error message
  → No alert fires, no Sentry event, no user feedback
```

---

## Root Cause

All eight findings trace back to **three original decisions**:

1. **"Let me add a fallback in case the API is slow"** → `fetchOrdersFromSupabase` in `useData.ts` → second data path that diverged from the API route over time

2. **"Never throw, just return empty data"** → `dataService` pattern in `lib/supabase.ts` → silent failures become invisible, SWR error states never fire

3. **"I'll come back and clean up this config"** → SWR configs copy-pasted and never unified → four places to maintain one behavioral decision

None were wrong in isolation. The problem is that each one was a local optimization that created a hidden contract: *"there are now two ways to get this data, and both must be kept consistent forever."* That contract was never written down, so it was never maintained.

---

## Recommended Remediation Order

These are not small fixes. They require planning, migration, and regression testing. Sequence matters.

### Phase 1 — Stop the bleeding (no regressions, low risk)
1. **Turn on `ignoreBuildErrors: false`** — fix the TS errors that surface, or suppress them deliberately with `// @ts-expect-error` + comment. At minimum you will see the real scope of the type debt.
2. **Fix `AuthHandler.tsx` `getSession()` → `getUser()`** — 3-line change at lines 66, 101, 153. No architectural change, just the correct auth call.
3. **Delete `AuthHandler.tsx` entirely** — this component duplicates functionality already covered by the server-side middleware (SEC-02 fix) and `auth/callback/route.ts` (SEC-04 fix). Check where it's rendered in the component tree first. If it can be removed, the localStorage auth state issue largely resolves itself.

### Phase 2 — Unify the data layer (medium risk, needs testing)
4. **Deprecate `lib/api.ts`** — find every caller, redirect to API routes via `fetch`. It uses a `clients` JOIN that references a potentially wrong table name.
5. **Remove `fetchOrdersFromSupabase` from `useData.ts`** — the fallback to direct Supabase. The API route is the correct path. If the API is unreliable, fix the API. Replace with proper SWR error state that surfaces failures to the user.
6. **Replace `dataService.getOrders()` etc.** — update `lib/supabase.ts` so `dataService` re-exports the API fetch functions from Path D, not a fire-and-forget wrapper.

### Phase 3 — Unify configuration (low risk, high maintenance value)
7. **Delete `hooks/expenses/swr-config.ts`** — replace with `createSWRConfig()` from `lib/swr-config.ts`. Fix the hardcoded values.
8. **Replace inline SWR configs in `useData.ts`** — same constants.

### Phase 4 — Architectural cleanup (high risk, do last)
9. **Split god modules** — `useData.ts`, `MaterialPurchaseForm.tsx`, `useMaterialPurchases.ts`. Do one at a time. Each split requires updating all consumers.
10. **Replace `select('*')` with explicit column lists** — systematic but low-risk if done entity by entity.
11. **Fix error propagation** — change catch blocks to throw (or return `{data, error}` shape) so SWR error states work. This requires updating every component that consumes the affected hooks.

---

## What Not to Touch Yet

- **`useOrders` fallback chain** — the triple-fallback in `useData.ts:401–578` is the most fragile code in the application. The other changes above will reduce or eliminate the need for it. Attempting to refactor it before removing the root causes will introduce regressions.
- **`useMaterialPurchases.ts` split** — 1,159 lines covering payments, notes, and installment logic. Safe to split only after Phase 2 stabilizes the data layer.
- **`analytics-service.ts`** — currently the only consumer of analytics data. Safe to leave until all other data paths are cleaned up.
