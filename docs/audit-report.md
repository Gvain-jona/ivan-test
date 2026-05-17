# Full App Audit Report — Ivan Prints Business Management System

**Date:** 2026-05-17  
**Scope:** Architecture debt, implementation quality, security vulnerabilities, and dependency bloat  
**Branch audited:** `main`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Findings](#security-findings)
3. [Architecture Debt](#architecture-debt)
4. [Implementation Debt — Feature by Feature](#implementation-debt)
5. [Dependency Bloat](#dependency-bloat)
6. [Priority Fix List](#priority-fix-list)

---

## Executive Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 4 | 7 | 3 | 1 |
| Architecture | 0 | 3 | 4 | 2 |
| Implementation | 1 | 8 | 6 | 3 |
| Bloat | 0 | 1 | 4 | 2 |
| **Total** | **5** | **19** | **17** | **8** |

The app has a working feature set but carries significant accumulated debt. The most urgent issues are unauthenticated API routes returning sensitive business data, debug/seed routes deployed to production with no access control, and a cron job with a broken authorization check that passes any Bearer token. Dependency and file-size bloat are secondary concerns but meaningfully slow iteration.

---

## Security Findings

### CRITICAL — Unauthenticated Routes Exposing Sensitive Data

Multiple GET endpoints return business-sensitive data without any `getUser()` call. RLS alone is insufficient because several of these routes use the service role client or anon key with policies that may not restrict reads.

| Route | Data Exposed | Auth Check |
|-------|-------------|------------|
| `GET /api/orders/route.ts:16` | All orders, amounts, payment status | None |
| `GET /api/expenses/route.ts:11` | All expenses (POST has check, GET does not) | None |
| `GET /api/material-purchases/route.ts:11` | Supplier names, costs, payment status | None |
| `GET /api/invoices/route.ts:9` | Invoice data including user IDs | None |
| `GET /api/clients/route.ts:8` | Client contact details | None |
| All `/api/analytics/*` routes | Revenue, profit, client lifetime value | None |

**Fix:** Add `const { data: { user }, error } = await supabase.auth.getUser()` at the top of every GET handler. Return `401` if no user.

---

### CRITICAL — Debug and Seed Routes Deployed to Production

Seven routes exist with no access control and should not be reachable in a production environment:

| Route | Risk |
|-------|------|
| `/api/seed/route.ts:14-20` | **Deletes all data** and re-seeds with test data. Uses `SUPABASE_SERVICE_ROLE_KEY`. No auth check. |
| `/api/debug/database-info/route.ts:8-10` | Returns database constraints, triggers, and function signatures. |
| `/api/debug/material-purchases/route.ts:9-12` | Dumps all purchase records with installments. |
| `/api/test-db/route.ts:9-10` | Exposes schema and table information. |
| `/api/test-supabase/route.ts:4-17` | Tests DB access publicly. |
| `/api/test-profiles/route.ts:4-29` | Returns id, email, full\_name, role, status for all profiles. |
| `/api/material-purchases/[id]/test/route.ts` | Empty file — orphaned test route. |

Routes guarded only by `NODE_ENV !== 'development'` (`/api/init-db`, `/api/init-admin`, `/api/enable-public-access`) are also dangerous — `NODE_ENV` can be misconfigured in deployment.

**Fix:** Delete all seven routes entirely. Replace any needed functionality with proper admin-authenticated equivalents or local-only scripts.

---

### CRITICAL — Cron Job Accepts Any Bearer Token

**File:** `app/api/cron/generate-recurring-expenses/route.ts:13-21`

```typescript
// CURRENT (broken)
const authHeader = request.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return handleApiError('AUTHENTICATION_ERROR', ...);
}
// passes for ANY "Bearer foo" value
```

The check only verifies the header format, not the token value. Any HTTP client can trigger recurring expense generation by sending `Authorization: Bearer anything`.

**Fix:**
```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

### CRITICAL — Deprecated Cookie Methods in Supabase Server Client

**File:** `app/lib/supabase/server.ts:54-78`

Uses deprecated `get()`, `set()`, `remove()` cookie methods. The correct pattern (`getAll`/`setAll`) is already used in `utils/supabase/middleware.ts:23-34` but not in the server client used by most API routes.

**Fix:** Replace the cookie adapter in `app/lib/supabase/server.ts` with the `getAll`/`setAll` pattern from `utils/supabase/middleware.ts`.

---

### HIGH — Deprecated Auth Package Used in 18 Files

`@supabase/auth-helpers-nextjs` is deprecated and replaced by `@supabase/ssr`. Both packages are installed. The deprecated package is imported in 18 files while only 7 files use the correct `@supabase/ssr`.

Files still importing `@supabase/auth-helpers-nextjs`:
- `app/components/auth/google-button.tsx`
- `app/hooks/usePermissions.ts`
- `app/services/profile.ts`
- `app/api/settings/route.ts`
- `app/api/settings/profit/route.ts`
- `app/api/account-rules/route.ts`
- `app/api/account-rules/[id]/route.ts`
- `app/api/announcements/route.ts`
- `app/api/announcements/active/route.ts`
- `app/api/accounts/route.ts`
- `app/api/accounts/[id]/route.ts`
- `app/api/accounts/[id]/transactions/route.ts`
- `app/lib/utils/account-allocations.ts`
- `app/api/settings/app/route.ts`
- `app/lib/auth/update-last-sign-in.ts`
- `app/dashboard/settings/_components/RolePermissionsSection.tsx`
- `app/dashboard/settings/_components/UserManagementTab.tsx`
- `app/context/settings/SettingsContext.tsx`

---

### HIGH — SQL Injection Risk via Unparameterized `ilike` Queries

Three routes interpolate user-supplied strings directly into Supabase filter methods:

- `app/api/orders/route.ts:63` — `or(\`order_number.ilike.%${search}%,...\`)`
- `app/api/expenses/route.ts:61` — `or(\`item_name.ilike.%${search}%,...\`)`
- `app/api/material-purchases/route.ts:35` — `ilike('supplier_name', \`%${supplier}%\`)`

While Supabase's JS client parameterizes most queries, the `or()` filter string is passed raw. Validate and sanitize these inputs, or use individual `.ilike()` chained calls instead of the combined `or()` string.

---

### HIGH — Middleware Does Not Block Unauthenticated Users

**File:** `middleware.ts:12-15`

The middleware calls `updateSession()` on all routes but contains no redirect logic. Unauthenticated users are not redirected to `/login`. Route-level auth checks are the only gate — and as documented above, most GET handlers have none.

**Fix:** Add auth check and redirect in `utils/supabase/middleware.ts` for all routes under `/(dashboard)/`.

---

### MEDIUM — Invoice Settings Route Has No Auth (v1)

**File:** `app/api/invoice-settings/route.ts`

The v1 route uses `createClient(cookies())` without `await` and has no `getUser()` check. Anyone can read or write invoice settings. The v2 route at `app/api/invoice-settings/v2/route.ts:18-26` has the correct auth check. V1 should be replaced by v2 or deleted.

---

## Architecture Debt

### HIGH — Dual Next.js Config Files

Both `next.config.js` (CommonJS, 118 lines, includes Sentry) and `next.config.mjs` (ESM, 54 lines, worker-loader only) exist at the root. Next.js behavior when both exist is undefined/version-dependent. The `.js` version contains critical Sentry and webpack configuration missing from `.mjs`.

**Fix:** Delete `next.config.mjs`. Merge worker-loader config into `next.config.js`.

---

### HIGH — 25 Files Violate the 200-Line Limit

The project's own rule (CLAUDE.md) caps files at 200 lines. 25 files exceed it, with the worst at 10x the limit:

| File | Lines |
|------|-------|
| `app/types/supabase.ts` | 1,738 |
| `app/components/materials/forms/MaterialPurchaseForm.tsx` | 1,292 |
| `app/hooks/useData.ts` | 1,287 |
| `app/hooks/materials/useMaterialPurchases.ts` | 1,159 |
| `app/dashboard/settings/_components/AccountsSettingsTab.tsx` | 1,124 |
| `app/components/orders/OrderFormSheet.tsx` | 1,032 |
| `app/lib/services/analytics-service.ts` | 919 |
| `app/context/GlobalDropdownCache.tsx` | 904 |
| `app/components/orders/invoice/utils/clientPdfGenerator.ts` | 845 |
| `app/dashboard/analytics/_components/OverviewPanel.tsx` | 834 |
| `app/components/orders/order-view/hooks/useOrderUpdates.ts` | 829 |
| `app/dashboard/orders/_components/TasksTab.tsx` | 791 |
| `app/dashboard/settings/_components/ProfitSettingsTab.tsx` | 763 |
| `app/lib/services/database.ts` | 760 |
| `app/api/expenses/route.ts` | 728 |
| `app/context/DropdownCacheContext.tsx` | 708 |
| `app/api/invoices/generate/route.ts` | 708 |
| `app/lib/api.ts` | 687 |
| *(7 more files 500–680 lines)* | — |

---

### HIGH — Duplicate Supabase Client Directories

Two parallel sets of Supabase client utilities exist:
- `app/lib/supabase/` — `server.ts`, `client.ts`, `admin.ts`, `unified-server.ts`
- `utils/supabase/` — `server.ts`, `client.ts`, `middleware.ts`

Different parts of the codebase import from different locations. The `utils/` versions use the correct modern `getAll`/`setAll` cookie pattern; `app/lib/supabase/server.ts` uses the deprecated individual cookie methods.

**Fix:** Consolidate to `utils/supabase/`. Update all imports. Delete `app/lib/supabase/`.

---

### MEDIUM — Pages Directory Alongside App Router

Three legacy pages coexist with the App Router:
- `pages/404.tsx`
- `pages/_error.jsx` (Sentry error handler)
- `pages/unauthorized.tsx`

**Fix:** Migrate to App Router equivalents (`app/not-found.tsx`, `app/error.tsx`). Delete the `pages/` directory.

---

### MEDIUM — No Real Test Suite

`package.json` test script: `"test": "echo \"No tests specified\" && exit 0"`. The `tests/` directory contains 15 JS integration/setup scripts and 12 PowerShell scripts — not unit or integration tests in any standard format (Jest, Vitest, Playwright). No `.test.ts` or `.spec.ts` files exist anywhere.

---

## Implementation Debt

### Feature: Orders

**`/api/orders/route.ts` vs `/api/orders/optimized/route.ts`**

Two overlapping implementations of order fetching. The main route defaults to `limit=500` (line 27) to "ensure all records" — defeating pagination. The optimized route uses `page`/`pageSize` parameters while the main route uses `limit`/`offset`. Cache-Control on the main route sets `stale-while-revalidate=600` — 10 minutes of potentially stale data for payment-critical records.

**Findings:**
- `app/api/orders/route.ts:27` — `limit` defaults to 500, should be 20–50
- `app/api/orders/route.ts:175` — 600s stale window too aggressive for financial data
- Pagination interface inconsistency between two routes (cannot be used interchangeably)
- Error shapes inconsistent: line 78 returns `{ error: string }`, line 250 returns `{ error: error.message }`

---

### Feature: Analytics

All 12+ analytics routes (`/api/analytics/*`) share the same boilerplate pattern but each file reimplements it independently:

```typescript
// Duplicated in every analytics route
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const startDate = startDateParam && startDateParam !== 'undefined'
  ? startDateParam
  : formatDate(thirtyDaysAgo);
```

Some routes use `getCachedData` helper (revenue, profit, expenses) while others make direct RPC calls with no caching (clients, summary). Analytics RPC functions may be called multiple times from the same dashboard load.

**Fix:** Extract date parsing + formatting to `app/lib/analytics/date-utils.ts`. Create a shared `buildAnalyticsDateRange()` utility. Standardize caching across all analytics routes.

---

### Feature: Invoice Settings

Three versions of the same feature exist simultaneously:

| Route | Auth | Mock Fallbacks | Status |
|-------|------|---------------|--------|
| `/api/invoice-settings/route.ts` | None | Yes (masks DB errors) | Active (should be removed) |
| `/api/invoice-settings/v2/route.ts` | Yes (proper 401) | No (returns null correctly) | Active (correct version) |
| `/api/invoice-settings/test/route.ts` | None | N/A | Debug only — remove |

V1 returns `mock-id-${Date.now()}` IDs on insert error (lines 126-134), which client code cannot distinguish from real IDs. This will cause data sync corruption if the DB recovers.

**Fix:** Delete v1 and test routes. Redirect clients to v2. Remove mock fallbacks.

---

### Feature: Material Purchases

Two overlapping routes:
- `/api/material-purchases/route.ts` — basic GET/POST
- `/api/material-purchases/optimized/route.ts` — adds `includePayments`, `includeNotes`, `includeInstallments` query params

Both are in use. The cache-keys file (`app/lib/cache-keys.ts:20`) points SWR hooks to the optimized endpoint, but the main route remains and handles POST. The optimized route has no POST handler — it is an incomplete refactor.

**Fix:** Merge optional-include params into the main route. Delete the optimized version. Update cache-keys if needed.

---

### Feature: Recurring Expense Generation

Beyond the auth issue documented in Security, the cron handler at `app/api/cron/generate-recurring-expenses/route.ts` accumulates errors silently (lines 43-44) — a failed expense generation does not fail the request, and notification failures (line 121) are fully swallowed. There is no idempotency guard against double-execution.

---

### Error Handling Inconsistency

A centralized error handler exists at `app/lib/api/error-handler.ts` with proper Supabase error code mapping (RLS=42501, unique=23505, etc.). Only half the routes use it:

| Route | Uses Centralized Handler |
|-------|--------------------------|
| `app/api/material-purchases/route.ts` | Yes |
| `app/api/expenses/route.ts` | Yes |
| `app/api/invoice-settings/v2/route.ts` | Yes |
| `app/api/orders/route.ts` | **No** — raw NextResponse.json throughout |
| `app/api/invoice-settings/route.ts` | **No** |
| `app/api/invoices/generate/route.ts` | **No** |

Error response shapes vary: `{ error: string }` vs `{ error: { type, message, details } }` — client code must handle multiple shapes.

---

### Duplicate Hook Files

- `app/hooks/materials/useMaterialPurchases.ts` (1,159 lines)
- `app/hooks/data/useMaterialPurchases.ts` (634 lines)

Two hooks for the same feature with different implementations. Unclear which is canonical.

- `app/components/orders/order-view/hooks/useOrderUpdates.ts` (829 lines)
- `app/components/orders/order-view/hooks/useOrderUpdates.enhanced.ts` (661 lines)

Enhanced version appears to be an in-progress refactor left alongside the original.

---

## Dependency Bloat

### Unused: `jotai`

Zero imports of `jotai` across the entire codebase. Remove from `package.json`.

### Redundant: Two Charting Libraries

- `chart.js` + `react-chartjs-2` — used by 8 analytics components
- `recharts` — used by shadcn/ui chart wrapper and 2 other components

Bundle cost: ~100KB combined. **Fix:** Standardize on `recharts` (the shadcn/ui default). Rewrite the 8 Chart.js components. Remove `chart.js` and `react-chartjs-2`.

### Redundant: Three PDF Libraries

| Library | Usage |
|---------|-------|
| `jspdf` + `jspdf-autotable` | 4 client-side invoice generators |
| `html2pdf.js` | 2 files (dynamic import) |
| `pdf-lib` | 1 server-side route (`/api/invoices/generate`) |

Three separate PDF strategies with no documented reason. **Fix:** Standardize on `jspdf` for client and server. Remove `html2pdf.js` and `pdf-lib`.

### Redundant: Deprecated Auth Package

`@supabase/auth-helpers-nextjs` is superseded by `@supabase/ssr` (already installed). Remove after migrating all 18 import sites.

### Bloat: `axios` alongside native fetch

`axios` is in dependencies but Next.js 15 has native fetch with all needed features. Check whether any file actually needs axios; if not, remove it.

### Bloat: `node-fetch` in browser app

`node-fetch` is a polyfill for Node.js environments. In a Next.js 15 app with native fetch available everywhere, this is dead weight.

### Bloat: `shadcn` + `shadcn-ui` both listed

`package.json` lists both `shadcn@^2.4.0` and `shadcn-ui@^0.9.5`. `shadcn-ui` is the legacy package name. Only one is needed.

---

## Priority Fix List

### Immediate (Block deployment / data loss risk)

1. **Delete** `/api/seed/`, `/api/test-*/`, `/api/debug/*`, `/api/enable-public-access/`, `/api/init-admin/`, `/api/init-db/` routes
2. **Fix cron auth** — `app/api/cron/generate-recurring-expenses/route.ts:15` — compare token to `CRON_SECRET` env var
3. **Add `getUser()` guard** to all GET handlers in: orders, expenses, material-purchases, invoices, clients, all analytics routes
4. **Delete** `/api/invoice-settings/route.ts` (v1) and `/api/invoice-settings/test/route.ts` — redirect clients to v2

### Short-term (Quality / correctness)

5. **Consolidate Supabase clients** — delete `app/lib/supabase/`, migrate all imports to `utils/supabase/`
6. **Fix deprecated cookie methods** — `app/lib/supabase/server.ts:54-78` — use `getAll`/`setAll`
7. **Migrate 18 files** from `@supabase/auth-helpers-nextjs` to `@supabase/ssr`
8. **Delete** `next.config.mjs` — merge worker-loader into `next.config.js`
9. **Merge** `app/api/material-purchases/optimized/route.ts` into main route, delete optimized
10. **Remove mock fallbacks** from invoice-settings v1 (after deleting it)

### Medium-term (Maintainability)

11. **Remove unused dependencies**: `jotai`, `node-fetch`, `shadcn-ui` (keep `shadcn`), `axios` (if unused)
12. **Standardize charting** on `recharts` — remove `chart.js`, `react-chartjs-2`
13. **Consolidate PDF** to `jspdf` — remove `html2pdf.js`, `pdf-lib`
14. **Extract analytics shared utilities** — date parsing, cache, error handling
15. **Standardize error handling** — adopt `app/lib/api/error-handler.ts` across all routes
16. **Resolve duplicate hooks** — pick canonical `useMaterialPurchases`, delete the other; same for `useOrderUpdates`/`useOrderUpdates.enhanced`
17. **Split files** exceeding 200 lines — priority: `MaterialPurchaseForm.tsx`, `useData.ts`, `useMaterialPurchases.ts`, `OrderFormSheet.tsx`

### Long-term (Structural)

18. **Migrate** `pages/` to App Router (`app/not-found.tsx`, `app/error.tsx`) — delete `pages/` directory
19. **Add middleware redirects** for unauthenticated users to `/login`
20. **Establish test suite** with Jest/Vitest — start with API route integration tests and utility unit tests
