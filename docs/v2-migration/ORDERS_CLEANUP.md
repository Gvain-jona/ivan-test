# Orders system — legacy attachment & cleanup plan

**Date:** 2026-07-12  
**Scope:** What legacy / dead code is still attached to the orders surface after the v2 cutover — what to delete, what to fix, what to leave alone.  
**Companion docs:** `STATE.md` (module status), `DATA_LAYER_AUDIT.md` (graded data-path audit), `orders-system-handoff.md` (DB design).  
**Update when:** unmounted tabs are deleted, the page façade is collapsed, or documents replace the legacy invoice feature on this page.

---

## Short answer

The **core order data path is on v2**, but the **page shell is still a legacy façade**. Roughly **~4k LOC unmounted dead code** sits under orders, plus **~1.4k LOC still mounted but legacy-shaped**, and a separate **~5k LOC client-side invoice feature** still reachable from the page tree.

| Bucket | Approx size | Live on `/dashboard/orders`? | Risk |
|---|---|---|---|
| **A. Pure dead / unmounted** | ~3.8k LOC | No | Bundle noise, confusion |
| **B. Mounted but hollow (stubs)** | ~1.4k LOC + context façade | Yes | Looks real; no-ops or wrong data |
| **C. Invoice feature (legacy PDF)** | ~4.9k LOC under `app/features/invoices` | Partially (Invoices tab / row buttons) | Wrong model vs v2 `documents` |
| **D. Dual data path** | `hooks/useOrders.ts` + `@/types/orders` | Only via dead InsightsTab | Footgun if remounted |
| **E. Live v2 core** | store + form + view sheet + `hooks/orders` | Yes | This is the real system |

---

## Live vs legacy paths

### Keep — live v2 path

```
page → OrdersStoreContext → hooks/orders/useOrders
     → OrderFormSheet / OrderViewSheet (order-view/*)
     → /api/orders|clients|products|notes|documents
```

### Still in the gravity well — mounted legacy shell

```
page
 ├─ OrdersTab
 │    ├─ FilterDrawer          → apply calls no-op stub
 │    └─ OrdersTableNew
 │         └─ OrderActions → InvoiceSystem → features/invoices
 │              + LegacyOrder cast
 ├─ InvoicesTab               → filteredOrders always []
 ├─ OrdersInvoiceSettingsProvider  → fetches invoice settings every visit
 └─ useOrdersPage() façade    → ~25 legacy-compat stubs
```

### Unmounted but still in the tree

~~Deleted in Phase 1 (2026-07-13)~~ — Insights/Tasks tabs, analytics cards,
legacy `hooks/useOrders.ts`, `OrderViewModal`, `OrderFilters`, `dynamic-page`,
old header/filters. Still in tree: `_data/sample-orders.ts` (home still
imports it) and `hooks/use-data.ts` (live consumer on the home dashboard).

---

## Attachment diagram

```
                    ┌─────────────────────────────────────┐
                    │  LIVE v2                            │
                    │  Store → hooks/orders → /api/orders │
                    │  FormSheet / ViewSheet / payments   │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  LEGACY FAÇADE (still mounted)      │
                    │  useOrdersPage stubs                │
                    │  FilterDrawer (no-op apply)         │
                    │  InvoicesTab (always empty)         │
                    │  Invoice settings provider          │
                    │  OrderActions → features/invoices   │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  DEAD CLUSTER (not mounted)         │
                    │  InsightsTab + useOrders (legacy)   │
                    │  TasksTab, analytics cards          │
                    │  OrderViewModal, dynamic-page, …    │
                    └─────────────────────────────────────┘
```

**Share of “orders folder” still legacy-attached:** roughly half+ of `dashboard/orders` by LOC is dead or hollow. The mess is the **shell and satellite tabs**, not the v2 API/hooks.

---

## Fix now — live bugs / hollow UX

These are **wired into the page today** and misbehave because of cutover stubs.

| Issue | Where | What’s wrong | Fix |
|---|---|---|---|
| **Filter drawer is a no-op** | `OrdersTab` → `handleFilterChange` | Stub is `() => {}` while store has real `setFilters` | Map drawer fields → `OrderListFilters` (or replace drawer with v2 filters) |
| **Invoices tab is always empty** | `InvoicesTab` uses `filteredOrders` | Context hardcodes `filteredOrders: []` | Remove tab **or** feed v2 orders / documents; do not keep empty UI |
| **Invoice button opens nothing** | `handleGenerateInvoice` → `invoiceSheetOpen` | State flips; no sheet mounted (page TODO) | Wire to documents draft flow **or** remove button until `issue_document` |
| **Duplicate order is a no-op** | `handleDuplicateOrder` stub | UI still exposes action | Implement (create from detail) **or** hide action |
| **Pending badge always 0** | `stats.pendingOrders` stub | Badge on Orders tab | Compute from list/`total` or drop badge until metrics exist |
| **Status update errors swallowed** | `OrdersStoreContext.updateOrderStatus` | `catch { return false }` | Surface toast (cancel path is better) |
| **Payment status vocab mismatch** | InvoicesTab filters `partially_paid` | v2 uses `partial` | Use v2 values if tab stays |
| **Edit = View** | `OrdersTab` `onEdit={handleViewOrder}` | No edit form | OK temporary; hide Edit or implement header PATCH |

### Key façade file

`app/dashboard/orders/_context/index.tsx` — `useOrdersPage()` intentionally stubs:

- `filteredOrders: []`, `filteredTasks: []`
- `stats: { … pendingOrders: 0 }`
- `handleFilterChange`, `handleDuplicateOrder`, task handlers → no-ops
- `handleGenerateInvoice` cast for legacy invoice consumers

Real data/mutations live in `OrdersStoreContext` / `OrdersUIContext`; the façade is backward-compat for unmigrated tabs.

---

## Clean up — safe deletes / quarantines

### Safe to delete (after one grep confirm; Insights/Tasks not on `page.tsx`)

| Item | Notes |
|---|---|
| `app/dashboard/orders/_components/InsightsTab.tsx` | Unmounted; pulls **legacy** `useOrders` |
| `TasksTab.tsx` | Unmounted (~700 LOC) |
| `OrderAnalyticsCard`, `ClientPerformanceCard`, `AnalyticsBarChart` | Only Insights cluster |
| `PendingInvoicesCard`, `PendingInvoicesPanel` | Not on current page |
| `app/hooks/useOrders.ts` | After Insights gone — kills dual orders fetch path |
| `app/hooks/useOrderAnalytics.ts` | If unused |
| `OrderViewModal.tsx`, `OrderFilters.tsx` | Superseded by view sheet / FilterDrawer |
| `OrderViewSheet.tsx.new` | Leftover |
| `dynamic-page.tsx`, `OrdersHeader.tsx`, `OrdersFilters.tsx` | Alternate page shell |
| `_data/sample-orders.ts` | Only after home stops importing samples |
| `hooks/loading.ts` re-export of legacy `useOrders` | Update barrel when root hook is deleted |

### Do not delete wholesale yet

| Item | Why keep |
|---|---|
| `app/features/invoices/**` | Own module; still referenced; not the v2 documents module |
| `app/types/orders.ts` | Until InvoicesTab / FilterDrawer / cache-keys stop using it |
| `cache-keys` orders helpers | May still serve other legacy consumers |
| v2 documents API / hooks | Real path; incomplete UI only |

### Reshape — not delete, not full feature

| Work | Goal |
|---|---|
| **Collapse `useOrdersPage` façade** | Drop legacy-compat stubs; tabs call store/UI directly |
| **Drop or isolate `OrdersInvoiceSettingsProvider`** | Stops fetching invoice settings on every orders visit if sheet is dead |
| **`OrderActions` / InvoiceSystem** | Remove legacy PDF button; optional “Create document” → `useDocuments` |
| **FilterDrawer types** | Stop using `@/types/orders` / `OrderStatus`; align with v2 filter shape |
| **`userRole: 'admin' as const`** | ✅ Done 2026-07-15 — hardcoded role and the legacy `admin/manager/employee` prop chain deleted; `OrderActions` reads the live `orgRole` from `useOrganization()` (cancel = owner/admin, mirrored by a 403 gate in `PATCH /api/orders/[id]`); status changes open to all roles, so `StatusDropdown` lost its role prop |

---

## LOC inventory (approx, 2026-07-12)

### Dead / unmounted cluster

| Path | ~LOC |
|---|---|
| `app/hooks/useOrders.ts` | 147 |
| `app/hooks/useOrderAnalytics.ts` | 87 |
| `app/hooks/use-data.ts` | 187 |
| `app/components/orders/OrderViewModal.tsx` | 411 |
| `app/components/orders/OrderFilters.tsx` | 245 |
| `app/dashboard/orders/dynamic-page.tsx` | 40 |
| `app/dashboard/orders/OrdersFilters.tsx` | 54 |
| `app/dashboard/orders/OrdersHeader.tsx` | 19 |
| `app/dashboard/orders/_components/InsightsTab.tsx` | 370 |
| `app/dashboard/orders/_components/TasksTab.tsx` | 711 |
| `app/dashboard/orders/_components/PendingInvoicesCard.tsx` | 306 |
| `app/dashboard/orders/_components/PendingInvoicesPanel.tsx` | 264 |
| Analytics card/chart cluster under `_components/` | (with Insights) |
| **Cluster total** | **~3.8k** |

### Live but legacy-attached

| Path | ~LOC |
|---|---|
| `InvoicesTab.tsx` | 540 |
| `InvoiceSystem.tsx` | 70 |
| `OrdersInvoiceSettingsContext.tsx` | (provider) |
| `_context/index.tsx` façade | 107 |
| `FilterDrawer.tsx` | (types from `@/types/orders`) |
| `OrderActions.tsx` + legacy cast | — |
| `app/types/orders.ts` | 153 |
| **Attached total** | **~1.4k** |

### Separate module (not delete with orders dead code)

| Path | ~LOC |
|---|---|
| `app/features/invoices/**` | ~4.9k (26 files) |

---

## Cleanup sequence

### Phase 1 — Delete unmounted dead (low risk) — ✅ DONE 2026-07-13

Executed after re-verifying every delete candidate had zero importers.
Deleted: `InsightsTab`, `TasksTab`, `OrderAnalyticsCard`, `ClientPerformanceCard`,
`AnalyticsBarChart`, `PendingInvoicesCard`, `PendingInvoicesPanel`,
`hooks/useOrders.ts`, `hooks/useOrderAnalytics.ts`, `OrderViewModal`,
`OrderFilters`, `dynamic-page`, `OrdersHeader`, `OrdersFilters`; removed the
legacy `useOrders`/`useOrder` re-export from `hooks/loading.ts`. Grep confirms
no `@/hooks/useOrders` imports remain — the dual orders fetch path is gone.

Deviations from the original list:
- `OrderViewSheet.tsx.new` was already gone before Phase 1 (stale entry).
- `hooks/use-data.ts` and `_data/sample-orders.ts` were initially kept (their
  only importers were the home dashboard), then deleted the same day when the
  **entire home dashboard was removed** — it was unreachable (no nav link,
  `/dashboard` redirects to orders) and ran on sample data. See `STATE.md`
  module table.

### Phase 2 — Fix the live façade (high user impact) — ✅ DONE 2026-07-13

Resolutions chosen (user stance: no dead weight, no hollow UI):

1. **Filtering**: the legacy FilterDrawer was **deleted** (its fields were
   public-schema shapes; no v2 backend for most of them). The table's built-in
   quick filters (status from `useOrganization()`, payment `paid/partial/
   unpaid`, date range, search) are now wired straight to `store.setFilters`
   — filtering actually works. The client-type quick filter was removed from
   the table: the v2 orders API has no `client_type` param.
2. **Invoices tab deleted** and the page's Tabs wrapper collapsed — the orders
   page is a single view. The `partially_paid` vocab bug died with it.
3. **Dead actions removed** from the row dropdown: Generate Invoice (opened
   nothing), Duplicate (no-op), View/Edit (duplicated View). The pending
   badge (always 0) went with the tab bar. Each returns when its real
   implementation exists.
4. **Invoice settings provider deleted** (`OrdersInvoiceSettingsContext`) —
   nothing consumed a sheet; the orders page no longer fetches invoice
   settings.
5. **Status-change errors surfaced**: `handleOrderStatusChange` now toasts
   success and failure (matches the cancel path).

### Phase 3 — Cut invoice legacy off the order row — ✅ step 1+3 DONE 2026-07-13

1. ~~Remove `InvoiceSystem` / `features/invoices` from `OrderActions`~~ —
   done in Phase 2 (InvoiceSystem.tsx deleted; OrderActions no longer imports
   `@/types/orders`).
2. Point “document” actions at v2 `useDocuments` — **not done**: drafts are
   creatable from the view sheet's Documents tab; a per-row action waits on
   `issue_document()`.
3. `features/invoices` left in repo (unreferenced from the orders page now)
   until documents PDF rendering exists.

### Phase 4 — Collapse context — ✅ DONE 2026-07-13 (came free with Phase 2)

1. `useOrdersPage` mega-object deleted; consumers (`page.tsx`, `OrdersTab`)
   use `useOrdersStore` + `useOrdersUI` directly.
2. All stubs deleted; no `@/types/orders` usage remains on the orders page.
3. Page-local types already live next to the store.

---

## What not to treat as “orders legacy”

| Item | Why |
|---|---|
| `/api/orders` + `create_order_as_org` shim | Correct interim platform path |
| `OrderFormSheet` / `order-view/*` | Already on platform hooks |
| Expenses / materials / analytics APIs | Different modules; not orders cutover debt |
| Missing item-edit on existing orders | Product gap, not dead code (see `STATE.md` backlog) |
| Clerk / service-role tenancy | Platform-wide; see `DATA_LAYER_AUDIT.md` |

---

## Key files

| Role | Path |
|---|---|
| Page entry | `app/dashboard/orders/page.tsx` |
| Compat façade (stubs) | `app/dashboard/orders/_context/index.tsx` |
| Live list store | `app/dashboard/orders/_context/OrdersStoreContext.tsx` |
| Live UI actions | `app/dashboard/orders/_context/OrdersUIContext.tsx` |
| Invoice settings (legacy) | `app/dashboard/orders/_context/OrdersInvoiceSettingsContext.tsx` |
| Platform hooks | `app/hooks/orders/useOrders.ts` |
| Legacy hook (delete Phase 1) | `app/hooks/useOrders.ts` |
| Legacy types | `app/types/orders.ts` |
| Legacy invoice module | `app/features/invoices/` |
| v2 documents (replacement) | `app/hooks/documents/useDocuments.ts`, `/api/documents` |

---

## Bottom line

- **Data path for orders: mostly clean.**
- **Page integration: still ~30–50% legacy shell by surface area.**
- **Biggest real bugs:** filter apply no-op, invoices tab empty, invoice button dead-end, duplicate no-op, always-zero badge.
- **Biggest cleanup win:** delete unmounted Insights/Tasks/legacy `useOrders` + stop feeding the page through a stub façade.

Track module-level status in `STATE.md`; use this file for the orders-specific cleanup checklist.
