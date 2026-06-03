# Audit Progress Tracker
**Last updated:** 2026-06-02  
**Branch:** `claude/codebase-review-security-perf-sRWF6`  
**Session context:** [Full transcript at `/root/.claude/projects/-home-user-ivan-test/a42196d5-3e41-458a-a8cd-b528adf3022c.jsonl`]

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ FIXED | Applied, committed, verified in revalidation pass |
| ⏸ DEFERRED | Decision made to defer — reason documented below |
| 🔲 OPEN | Not yet addressed |

---

## Security Findings (SECURITY_OWASP_REPORT.md)

| ID | Severity | Finding | Status | Commit |
|----|----------|---------|--------|--------|
| SEC-01 | CRITICAL | XSS via unescaped template literals in `<script>` block (`auth/verify/route.ts`) | ✅ FIXED | `6afe05a` |
| SEC-02 | CRITICAL | Auth middleware never enforces authentication (`middleware.ts`) | ✅ FIXED | `6afe05a` |
| SEC-03 | CRITICAL | Mock admin grants full access without credentials (`auth-context.tsx`) | ✅ FIXED | `6afe05a` |
| SEC-04 | HIGH | Open redirect via protocol-relative URLs (`auth/callback/route.ts`) | ✅ FIXED | `6afe05a` |
| SEC-05 | HIGH | IDOR: no ownership check on resource endpoints | ⏸ DEFERRED | — |
| SEC-06 | HIGH | Unauthenticated GET `/api/settings/app` | ✅ FIXED | `756e3de` |
| SEC-07 | MEDIUM | PUT `/api/orders` uses unsafe type cast, no Zod validation | ✅ FIXED | `58c0410` |
| SEC-08 | MEDIUM | Falsy check on payment amount — no real type validation | ✅ FIXED | `58c0410` |
| SEC-09 | MEDIUM | PII (email, userId) logged to stdout in auth routes | ✅ FIXED | `58c0410` |
| SEC-10 | MEDIUM | Cron endpoint uses invalid `ApiErrorType` string (`AUTHENTICATION_ERROR`) | ✅ FIXED | `756e3de` |
| SEC-11 | LOW | `allowed_emails` RLS exposes full access-control list to all authenticated users | ⏸ DEFERRED | — |
| SEC-12 | LOW | Sentry traces 100% of production requests | ✅ FIXED | `19d2cad` |
| SEC-13 | LOW | DELETE `/api/orders` has no role check (any role can delete) | ✅ FIXED | `756e3de` |

### Deferred decisions

**SEC-05 (IDOR):** Requires a Supabase RLS migration (`supabase/migrations/`) to add ownership policies on `orders`, `expenses`, and `material_purchases`. Deferred because SQL migrations need to be run against the live database and validated against the existing RLS setup. The API-layer check (Option A in the report) is a safe interim but was not applied because it would require touching every `[id]` route. **Do before first external user access.**

**SEC-11 (allowed_emails RLS):** Requires a migration to replace the `"Authenticated users can read allowed_emails"` policy with an admin-only policy. Deferred alongside SEC-05. Low risk in current deployment (closed-user system). **Do before first external user access.**

---

## Error Handling & Reliability Findings (ERROR_HANDLING_REPORT.md)

| ID | Severity | Finding | Status | Commit |
|----|----------|---------|--------|--------|
| ERR-01 | HIGH | Invalid `ApiErrorType` strings in cron route cause silent HTTP 200 errors | ✅ FIXED | `756e3de` |
| ERR-02 | HIGH | Non-atomic payment insert + amount update (`material-purchases` and `expenses` payments) | ✅ FIXED | `95c30cd` |
| ERR-03 | HIGH | Full table scan in analytics route — unbounded memory | ✅ FIXED | `95c30cd` |
| ERR-04 | MEDIUM | Partial sub-resource failures silently swallowed in `orders/[id]/route.ts` | ✅ FIXED | `9fd8e6b` |
| ERR-05 | MEDIUM | Settings route uses bare `NextResponse.json` — inconsistent error shape | ✅ FIXED | `9fd8e6b` |
| ERR-06 | MEDIUM | Error handlers declared `async` without `await` + `'use server'` directive | ✅ FIXED | `19d2cad` |
| ERR-07 | MEDIUM | `setTimeout` race condition in cache invalidation (`cache-utils.ts`) | ✅ FIXED | `19d2cad` |
| ERR-08 | LOW | Auth error from `getUser()` silently discarded in middleware | ✅ FIXED | `6afe05a` |
| ERR-09 | LOW | N+1 query loop in recurring expenses cron job | ✅ FIXED | `79eb54d` |

**Revalidation finding (caught during verification pass):**

| ID | Severity | Finding | Status | Commit |
|----|----------|---------|--------|--------|
| ERR-10 | HIGH | `GET /api/material-purchases/[id]/payments` missing auth check; catch used invalid `'SERVER_ERROR'` type | ✅ FIXED | `3a06afa` |

---

## Configuration & Secrets Findings (CONFIG_AND_SECRETS.md)

| Finding | Status | Commit |
|---------|--------|--------|
| Hardcoded production URL `'https://ivan-test.vercel.app'` in `session-utils.ts` | ✅ FIXED | `9fd8e6b` |
| Sentry `org` and `project` hardcoded in `next.config.js` | ✅ FIXED | `9fd8e6b` |
| Debug `console.log` blocks in `session-utils.ts` | ✅ FIXED | `9fd8e6b` |

---

## Code Quality Findings (REFACTORING_GUIDE.md)

| Finding | Status | Commit |
|---------|--------|--------|
| `isDirty` in `useOrderForm.ts` uses `useCallback` (returns function) instead of `useMemo` (returns boolean) — type mismatch + performance | ✅ FIXED | `7dd776a` |
| 9 debug `console.log` blocks in `useOrderForm.ts` | ✅ FIXED | `7dd776a` |
| `document.querySelector` full-DOM scan on every row click (`OrderRow.tsx`) | ✅ FIXED | `7dd776a` |
| `useAuth()` called in JSX render path in `SideNav.tsx` — Rules of Hooks violation | ✅ FIXED | `9fd8e6b` |
| `authorization.ts` imported browser Supabase client in server-only file | ✅ FIXED | `9fd8e6b` |

### Deferred refactoring (all low-risk, high-effort)

| File | Lines | Issue | Decision |
|------|-------|-------|----------|
| `app/hooks/useData.ts` | 1,287 | God module — 13 hooks + 2 fetchers + 3 SWR configs in one file. Also contains live debug logs (line 144), `getSession()` instead of `getUser()` (line 113), `select('*')` overfetch, and unreachable code (line 521). | 🔲 Planned refactor — split into per-entity hook files. Do not touch `useOrders` fallback logic without full order-loading regression test. |
| `app/components/orders/OrderFormSheet.tsx` | 1,032 | Single file renders entire order creation/edit sheet | 🔲 Planned refactor |
| `app/hooks/materials/useMaterialPurchases.ts` | 1,159 | Combined list + detail + mutation logic | 🔲 Planned refactor |
| `app/lib/services/analytics-service.ts` | 919 | All analytics aggregation in one service | 🔲 Planned refactor |

---

## Dependency Audit (DEPENDENCY_REVIEW.md)

| Package | Issue | Status |
|---------|-------|--------|
| `@supabase/auth-helpers-nextjs` | Deprecated — replaced by `@supabase/ssr` (already in use) | ✅ REMOVED — `9182667` |
| `bcrypt` + `@types/bcrypt` | No active usage found in codebase | ✅ REMOVED — `9182667` |
| `react-icons` | No imports found; `lucide-react` used throughout | ✅ REMOVED — `9182667` |
| `node-fetch` | Built-in `fetch` available in Next.js 15 | ✅ REMOVED — `9182667` |
| `shadcn-ui` | Duplicate of `shadcn` package; CLI reference updated to `shadcn@latest` | ✅ REMOVED — `9182667` |
| `@types/jspdf` | jsPDF v3 ships its own types | ✅ REMOVED — `9182667` |
| `chart.js` + `react-chartjs-2` | Active usage in 4 analytics panels. Recharts already present — consolidation possible | 🔲 OPEN — needs component-by-component migration |
| `html2pdf.js` | Transitively provides `html2canvas` used by `exactPdfGenerator.ts`. Removing requires adding `html2canvas` as direct dep and deleting dead `pdfGenerator.ts` + `usePdfGeneration` hook | 🔲 OPEN — needs cleanup first |

---

## Added Capabilities

| Item | File | Commit |
|------|------|--------|
| Health check endpoint (`GET /api/healthz`) — DB latency, version, degraded status | `app/api/healthz/route.ts` | `1e7a63a` |
| `handleApiError` / `handleSupabaseError` / `handleUnexpectedError` standardized error shape | `app/lib/api/error-handler.ts` | existing + `19d2cad` |
| `UpdateOrderSchema` Zod schema | `app/lib/orders/validators.ts` | `58c0410` |
| `PaymentInputSchema` Zod schema (expenses + material-purchases) | both payment routes | `58c0410` |

---

## Overall Score

| Category | Before | After |
|----------|--------|-------|
| Critical security issues | 3 | 0 |
| High severity (security + reliability) | 6 | 0 |
| Medium severity | 7 | 0 |
| Low severity | 5 | 2 (SEC-05, SEC-11 — deferred, migration required) |
| Deferred (by decision) | — | 2 security (RLS migrations) + 4 refactoring files |
