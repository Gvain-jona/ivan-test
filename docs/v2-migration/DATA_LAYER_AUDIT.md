# v2 data-layer audit — production readiness

**Date:** 2026-07-12  
**Scope:** How data is fetched, validated, isolated, cached, and mutated — not UI/UX polish.  
**Companion docs:** `STATE.md` (live status), `orders-system-handoff.md` (DB design),
`ORDERS_CLEANUP.md` (orders-page dead code / fix checklist),
`CLERK_HOLD_AUDIT.md` (Clerk absence impact / hold recommendation).  
**Update when:** the dual-stack situation changes, Clerk/RLS lands, or platform hooks/routes are consolidated.

---

## Overall grades

| Scope | Grade | One-line verdict |
|---|---|---|
| **v2 order-model slice** (orders, clients, products, fields, notes, documents API) | **B−** | Strong architecture under construction; not multi-tenant SaaS-ready |
| **App as a whole** (platform + legacy) | **C+** | Half platform, half legacy monolith |

**Deployment scenarios**

| Scenario | Ready? | Grade |
|---|---|---|
| Internal Ivan only — orders / clients / products daily use | Mostly yes, known gaps (docs issue path, line edits, metrics) | **B** |
| Multi-tenant beta (2–3 trusted orgs) | Risky until Clerk/RLS + dual-stack cleanup | **C** |
| Public SaaS / external customers / multi-tenant money path | No | **D+** |

---

## Scorecard

| Dimension | Grade | One-line verdict |
|---|---|---|
| Domain / data model (DB + money integrity) | **A−** | Best part of the system; correctness pushed down where it belongs |
| API contract & request handling (migrated routes) | **B+** | Consistent pattern; explicit columns; real error mapping |
| Fetch architecture (client → API → DB) | **B** | Clean platform path exists; still coexists with a second, heavier path |
| Cache / invalidation / consistency | **B−** | Works; coarse invalidation; SWR config is overbuilt and split-brained |
| Performance / scale assumptions | **C+** | Fine for small-tenant ops; pickers and list caps will bite |
| Bloat / dead code / dual stacks | **C** | Biggest drag on “production grade” feeling |
| Security of the data path | **C+** | Org filters present on v2 routes; isolation still app-enforced, not structural |
| Observability / testing / ops | **D+** | No real test suite; limited runtime proof of the new path |

---

## Architecture under review

```
UI (dashboard pages / sheets)
        │
        ▼
SWR hooks  app/hooks/{orders,clients,products,fields,notes,documents,organization}/
        │  (PLATFORM_API + apiFetcher / apiRequest)
        ▼
API routes  /api/{orders,clients,products,field-definitions,notes,documents,organization}
        │  resolveTenant() → tenant.db (service-role, schema v2)
        │  Zod structural validation
        │  .eq('organization_id', tenant.organizationId)  ← tenant boundary (interim)
        ▼
Postgres v2 schema
  tables / triggers / RPCs (create_order_as_org, next_number, validate_custom_data)
```

Platform stack is intentionally isolated from legacy (`app/lib/api/client.ts` does not touch `cache-keys` / old fetchers).

---

## What’s strong

### 1. The v2 connection model is right

The migrated path is a real vertical slice, not ad-hoc Supabase-from-the-browser:

- Zod for **structure**, DB trigger for **custom_data** (correct split of authority)
- Explicit column selects on list/detail (no `select('*')` on migrated routes)
- Money fields omitted from update schemas; payments return recomputed totals
- Atomic create via RPC (`create_order_as_org` → `create_order`)
- List pagination (`limit` / `offset` + count)
- Lazy detail on row expand (list stays light)

### 2. Error surface is disciplined

`handleApiError` / `handleSupabaseError` / `P0001` passthrough means DB validation can reach the user without every route reinventing Postgres mapping. Platform `ApiRequestError` preserves type / status / message.

### 3. Tenant boundary is consistently applied on migrated routes

Every v2 route path checked scopes with `organization_id`. Payments re-check parent order ownership before write. Correct interim habit for service-role.

### 4. Intentional scope discipline

Documents shim, create-order shim, deferred item-edit, no fake analytics layer — labeled stand-ins in `STATE.md`, not silent hacks.

---

## What keeps it out of production-hard

### 1. Dual stacks = structural bloat (grade killer)

Two data worlds in one tree:

| Platform (v2) | Legacy |
|---|---|
| `lib/api/client.ts` + `PLATFORM_API` | `api-endpoints` + `cache-keys` |
| `hooks/orders/useOrders.ts` | `hooks/useOrders.ts`, `hooks/useData.ts` (~1.2k-line god module) |
| `resolveTenant` + service role | cookie client + RLS assumptions |
| Typed to `DatabaseV2` | Typed to old order types / `public` schema |

**Live footgun:** `InsightsTab` still imports `@/hooks/useOrders` (legacy) while the orders store uses `@/hooks/orders/useOrders`. Different contracts and query param shapes (`paymentStatus` / `startDate` vs `payment_status` / `start_date`).

Also still in the graph: dead/duplicate type files, dead `app/middleware.ts`, legacy invoice feature vs v2 documents, fat analytics / expenses / materials modules. Phased migration makes some of this inevitable; production-grade implies the active path is unambiguous.

### 2. Tenancy is correct by convention, not by construction

`tenant.db` is service-role → **RLS is off**. Isolation is “every route remembers `.eq('organization_id', …)`.”

- One missed filter = cross-tenant data leak
- SEC-05 (IDOR / ownership) still deferred in `docs/code-review/AUDIT_PROGRESS.md`
- Clerk-ready `createV2Client(getToken)` exists but is not the live path

Largest architectural production risk for multi-tenant.

### 3. Cache strategy is good enough, not production-tuned

**Works:** SWR keys from URL; mutation → `keysUnder(PLATFORM_API.ORDERS)`; list/detail dedupe.

**Weak:**

- Coarse invalidation — any payment/status change invalidates every orders key
- Platform hooks only pass `dedupingInterval`; they do not use the full `createSWRConfig` path
- `SWRProvider` has a parallel global fetcher with different caching headers (`no-cache` on orders) — two fetch philosophies
- `swr-config.ts` is over-engineered (MIN_DEDUPE 15m vs LIST_DEDUPE 5m, reconnect/focus off) — scar tissue, not a deliberate multi-tenant cache policy

### 4. Scale assumptions are still single-shop

| Pattern | Reality |
|---|---|
| Client/product pickers | hard `limit: 100` — silent incomplete catalogs |
| Relation field inputs | same 100 cap |
| Order list | paginated (good) |
| Expand row | 2 extra requests per expand (detail + notes) — fine one-at-a-time |
| Search | `ilike` on `order_number` only — OK small, not search-at-scale |

### 5. Mutation error handling has soft failure modes

`OrdersStoreContext.updateOrderStatus` swallows errors and returns `false` — create/payment paths surface better. Documents POST is non-atomic by design (number then insert) until `issue_document()` lands.

### 6. No verification layer

There is no automated test suite. For money + multi-tenant, production grade usually needs at least:

- route contract tests (auth, org scope, validation)
- create_order payload / payment recompute smoke tests
- regression that legacy hooks are not still feeding orders UI

### 7. Performance “optimization” elsewhere is often cosmetic

`SWRProvider` compression headers / cache busters / slow-loading tracking while the platform path bypasses that fetcher via `apiFetcher`. Real wins already present: explicit columns, pagination, lazy detail, DB-side money recompute. Real gaps: picker search, selective invalidation, not carrying a second data stack.

---

## Fundamental models — grades

| Model | Grade | Notes |
|---|---|---|
| **Data fetch** | **B** | Server-mediated, tenant-resolved, SWR for UI cache, pause keys when closed/unexpanded. Dual clients/hooks/SWR philosophies remain. |
| **Data handling / correctness** | **A−** (v2 only) | DB owns invariants (totals, payment_status, custom_data). API refuses generated fields. Atomic order create. |
| **Bloat / dead code** | **C** | Naming + cutover policy are right; execution mid-pivot with legacy still imported on migrated surfaces. |
| **Optimization / performance** | **C+ / B−** | Sensible for small ops; not multi-tenant performance design. No load/query-plan evidence in app layer. |

---

## Raise-the-grade checklist (fundamentals only)

Ordered by impact on these grades, not UI:

1. ~~**Delete or quarantine legacy order fetchers**~~ — ✅ DONE 2026-07-13
   (orders cleanup Phases 1–4: legacy `useOrders`/`useData` bleed gone, one
   orders path only).
2. ~~**Structural tenancy**~~ — ✅ DONE 2026-07-13 (interim form): `tenant.db`
   is now a scoped `TenantDb` accessor, not the raw service-role client —
   selects/updates auto-scope to `organization_id`, inserts inject it, no
   hard delete, raw client never leaves `tenant.ts`. Verified with negative
   compile tests (`.delete()`, foreign `organization_id`, raw-client access,
   unscoped tables all rejected). RLS-backed enforcement still lands with
   Clerk; the interface is the swap point.
3. **Contract tests** on the platform routes (auth, scope, validation, create_order, payment recompute). ← **next**
4. **Reference data at scale** — searchable clients/products (not hard `limit: 100`).
5. **Targeted cache invalidation** — detail key + current list keys, not blanket `keysUnder(ORDERS)` forever.
6. **Ship or hide documents** — `issue_document` path blocked on DB owner; draft create is exposed and labeled interim.

Doing 1–3 moves the v2 slice toward **A− design / B+ production**.

---

## Key files (audit map)

| Layer | Path |
|---|---|
| Tenant resolve | `app/lib/auth/tenant.ts` |
| v2 admin / Clerk-ready clients | `app/utils/supabase/server-v2.ts` |
| Platform fetch client | `app/lib/api/client.ts` |
| Validators | `app/lib/api/validators.ts` |
| Error mapping | `app/lib/api/error-handler.ts` |
| Platform hooks | `app/hooks/{orders,clients,products,fields,notes,documents,organization}/` |
| Legacy hooks (debt) | `app/hooks/useOrders.ts`, `app/hooks/useData.ts` |
| Interim create-order shim | migration `20260710000000_create_order_as_org_interim_shim.sql` |
| Security debt tracker | `docs/code-review/AUDIT_PROGRESS.md` (SEC-05, SEC-11) |

---

## Bottom line

The **underlying connection for the migrated slice is thoughtfully designed** — better than the clunky UI suggests, and better than a typical “we added organization_id” migration. The fundamental model (server API, tenant resolve, DB as authority, isolated platform client) is the right one.

It is **not yet production-grade as a platform** because:

- tenancy is procedural, not structural
- two data stacks still fight on the same surfaces
- scale and cache policies are single-shop
- nothing automated proves the path

**Fair summary: solid B− architecture, incomplete C+/B− production system.**
