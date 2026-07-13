# v2 platform migration — live state

Last updated: 2026-07-11 (branch `claude/db-changes-review-r8zaar`). This is the
session-to-session ground truth for the v2 pivot: what has been decided, what is
built, what is blocked, and on whom. Update it when any of that changes — this
file exists so a fresh session doesn't have to re-derive the pivot from git
history. Conventions (naming, deletion policy) live in `CLAUDE.md`; this file
tracks *status*.

## The pivot, in three sentences

The app is being rebuilt from a single-shop tool ("Ivan Prints") into a
multi-tenant platform against the `v2` Postgres schema in the "Ivan Prints V2"
Supabase project (`giwurfpxxktfsdyitgvr`). Ivan is just the first tenant — never
the design center. Migration is module-by-module (orders first), legacy code is
deleted at each module's cutover (git is the archive), and the DB is the
validation authority (field registry + triggers), not the app.

For the full DB-side design of the order-model tables (clients, products,
orders, order_items, payments, documents, field_definitions — schema, triggers,
`create_order`/`next_number` RPCs, deferred `issue_document`), see
`docs/v2-migration/orders-system-handoff.md`. That doc is DB-authoritative
(confirmed live in `v2` schema); this file tracks what the *app* has actually
wired up against it.

For a graded audit of the app-side data path (fetch, tenancy, cache, bloat,
performance — not UI), see `docs/v2-migration/DATA_LAYER_AUDIT.md`
(2026-07-12). Security findings remain in `docs/code-review/AUDIT_PROGRESS.md`.

For orders-specific legacy attachment (dead code vs hollow UI vs what to
delete/fix), see `docs/v2-migration/ORDERS_CLEANUP.md` (2026-07-12).

For Clerk absence impact and hold-vs-now recommendation, see
`docs/v2-migration/CLERK_HOLD_AUDIT.md` (2026-07-12).

## Decided — do not relitigate

| Decision | Verdict |
|---|---|
| Auth end state | **Clerk** replaces Supabase Auth (supabase-js `accessToken` callback, third-party auth). Blocked on keys + a DB-side user-id decision (Clerk `sub` is not a UUID; recommended fix: internal-uuid claim, not text-column migration). |
| Naming | "v2" only in identifiers that literally reference the DB schema (see CLAUDE.md). No v2 folders/routes/UI copy. |
| Legacy code | Deleted at module cutover, rewound via git if needed. No parallel copies. |
| API paths | Plain (`/api/orders`, `/api/clients`, …) — migrated routes replaced legacy in place. |
| Activity log | **DB-side** (triggers), not app-side route logging — recommended to DB owner, deliberately not built in the app. |
| Testing stance | No live tenant data dependency; mock up a trial/playground org when a test bed is needed. |
| Scope discipline | Quality over quantity — ship the load-bearing pieces, park the rest as explicit follow-ups (below), don't half-build. |

## Module status

| Module | State |
|---|---|
| **Orders** | ✅ Cut over to v2 (list, quick filters wired to the store, create form, view sheet, payments, notes, status changes). Orders cleanup Phases 1–4 done 2026-07-13: dead tabs/hooks deleted, legacy FilterDrawer/Invoices tab/hollow actions removed, `useOrdersPage` façade collapsed into `useOrdersStore`/`useOrdersUI`. Item add/edit on existing orders is a follow-up. |
| **Clients** | ✅ Cut over (management page, inline creation from order form). |
| **Products** | ✅ New (management page; catalog feeds order items). |
| **Field setup** | ✅ New (per-entity registry admin at `/dashboard/fields`). |
| **Documents** | 🟡 `/api/documents` GET/POST/PATCH + `useDocuments`/`useDocumentMutations`, connected to a Documents tab on the order view sheet (list + create draft). No "issue" action yet — POST only ever creates `draft` status. POST is an **interim shim**: calls `next_number()` then inserts as two steps (not atomic) because `v2.issue_document()` doesn't exist yet — replace when it ships. The per-row "quick invoice" button was removed in orders cleanup Phase 2 (it opened nothing); a row-level document action returns with `issue_document()`. See `docs/v2-migration/orders-system-handoff.md` §6/§12. |
| Expenses, materials, accounts, invoicing (legacy PDF renderer), analytics | ⏳ Legacy, still on `public` schema, fully working — do not delete their code. The orders-page façade stubs in `app/dashboard/orders/_context/` now serve only the unmigrated InvoicesTab (the Insights/Tasks tabs were deleted in orders cleanup Phase 1). `app/features/invoices/` is a separate, unrelated legacy client-side PDF generator — not part of the v2 documents module. |
| Home dashboard | 🗑 **Deleted 2026-07-13** — was unreachable (no nav link, `/dashboard` redirects to orders) and ran on sample data, not live queries. `app/dashboard/home/`, `sample-orders.ts`, `hooks/use-data.ts`, `hooks/useDashboardStats.ts` removed; rebuild on a v2 read layer when the home/metrics module gets its turn. |

## Interim auth (until Clerk)

Identity comes from the existing Supabase-Auth session; `resolveTenant()` in
`app/lib/auth/tenant.ts` maps it to an org via `organization_members` and
returns `{ userId, organizationId, orgRole, db }`. **Since 2026-07-13, `db` is
a scoped accessor (`TenantDb`), not the raw service-role client**: selects and
updates auto-append the `organization_id` filter, inserts inject it (the type
rejects a caller-supplied one), hard `delete` isn't exposed (v2 archives via
status), and `organizations` reads go through `db.organization()`. Routes can
no longer forget the org filter — the boundary is by construction, not by
convention. The raw client never leaves `tenant.ts`. `resolveTenant()` is the
single Clerk swap point; when Clerk + RLS land, `TenantDb` gets backed by the
RLS client and the interface holds. Order creation goes through
the `v2.create_order_as_org(p_org, p_user, payload)` SECURITY DEFINER shim
(migration `20260710000000_…`), service_role-only; **drop the shim when Clerk
lands** and call `create_order` with real JWT claims.

**Hold stance (2026-07-12):** keep this interim for single-tenant Ivan work;
do not start Clerk until multi-org / external users or until keys + user-id
decision + third-party auth are unblocked. Full impact analysis:
`docs/v2-migration/CLERK_HOLD_AUDIT.md`.

## Blocked / waiting on others

- **Clerk integration (Layer 2)**: needs Clerk keys, the DB user-id decision
  above, Supabase third-party-auth registration.
- **DB owner items** (flagged, not app work): trigger-based activity/audit log
  on orders/payments; tenant provisioning (new org must get counters +
  membership bootstrapped — `next_number` fails for orgs without seeded
  counters, **including a `document:<document_type>` counter per type now
  that `/api/documents` calls `next_number('document:invoice', ...)` etc. —
  confirm this counter_key naming with the DB owner, it's an app-side
  assumption, not a confirmed DB convention**); `validate_custom_data`
  search_path hardening; re-map the 3 seeded `organization_members` rows when
  Clerk user ids exist; `v2.issue_document()` RPC (blocked on credit-note +
  partial-invoicing decisions — see orders-system-handoff.md §6/§12).

## Follow-up backlog (acknowledged, deliberately deferred)

Item add/edit/remove on existing orders; org settings editor (order statuses,
currency → needs `PATCH /api/organization`); order detail editing (date,
client, custom_data); searchable comboboxes for client/product pickers at
scale; attachments; payment/note edit+delete; currency-aware `formatCurrency`;
documents "issue" action + per-row quick-invoice sheet (both wait on
`issue_document()`); order-page metrics on a v2 read layer.

## v2 value differences vs legacy (easy to trip on)

- `payment_status`: `partial` (legacy said `partially_paid`); it and `balance`
  are **generated columns** — never write them.
- Payment methods: `cash | mobile_money | bank | credit`.
- Order statuses are org-configurable (`organizations.settings.order_statuses`)
  — read them via `useOrganization()`, don't hardcode the list.
- Delete is archive: orders "delete" = status `cancelled`; clients/products/
  fields have `status: archived`.
- `custom_data`: omit empty values (don't send `null`); the DB
  (`validate_custom_data`) is the validation authority — surface its P0001
  message verbatim (already mapped in `app/lib/api/error-handler.ts`).
