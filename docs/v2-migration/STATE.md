# v2 platform migration — live state

Last updated: 2026-07-17 (branch `clerk-auth-transition`). This is the
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

`docs/v2-migration/CLERK_HOLD_AUDIT.md` (2026-07-12) analyzed Clerk absence
and recommended holding — **superseded 2026-07-17**: the hold was lifted and
Phase 1 shipped (see "Clerk transition" below). Keep it only as the rationale
record; its "keep holding" verdict no longer applies.

## Decided — do not relitigate

| Decision | Verdict |
|---|---|
| Auth end state | **Clerk** replaces Supabase Auth. **Phase 1 (identity swap) built 2026-07-17** on branch `clerk-auth-transition` — see "Clerk transition" section below. User-id strategy: **internal-UUID claim** (`internal_user_id` in the session token from Clerk `public_metadata`), existing users keep their old `auth.users` UUID so `organization_members` needed no remap. Clerk is **identity-only**: org membership + roles stay in `v2.organization_members`. Sign-in: Google + email code. Phase 2 (RLS flip via supabase-js `accessToken` callback + third-party auth) still pending, blocked on DB owner. |
| Naming | "v2" only in identifiers that literally reference the DB schema (see CLAUDE.md). No v2 folders/routes/UI copy. |
| Legacy code | Deleted at module cutover, rewound via git if needed. No parallel copies. |
| API paths | Plain (`/api/orders`, `/api/clients`, …) — migrated routes replaced legacy in place. |
| Activity log | **DB-side** (triggers), not app-side route logging — recommended to DB owner, deliberately not built in the app. |
| Testing stance | No live tenant data dependency; mock up a trial/playground org when a test bed is needed. **Since 2026-07-13 a Vitest suite is live** (`npm test`): unit tests on the `TenantDb` wrapper + route contract tests on all migrated routes against a fake tenant DB. Newly migrated modules add colocated `route.test.ts` files in the same PR — pattern in `test/README.md`. DB-integration tests blocked on a v2 schema dump (DB owner). |
| Scope discipline | Quality over quantity — ship the load-bearing pieces, park the rest as explicit follow-ups (below), don't half-build. |

## Module status

| Module | State |
|---|---|
| **Orders** | ✅ Cut over to v2 (list, quick filters wired to the store, create form, view sheet, payments, notes, status changes). Orders cleanup Phases 1–4 done 2026-07-13: dead tabs/hooks deleted, legacy FilterDrawer/Invoices tab/hollow actions removed, `useOrdersPage` façade collapsed into `useOrdersStore`/`useOrdersUI`. Item add/edit on existing orders is a follow-up. |
| **Clients** | ✅ Cut over (management page, inline creation from order form). |
| **Products** | ✅ New (management page; catalog feeds order items). |
| **Field setup** | ✅ New (per-entity registry admin at `/dashboard/fields`). |
| **Documents** | 🟡 `/api/documents` GET/POST/PATCH + `useDocuments`/`useDocumentMutations`, connected to a Documents tab on the order view sheet (list + create draft). No "issue" action yet — POST only ever creates `draft` status. POST is an **interim shim**: calls `next_number()` then inserts as two steps (not atomic) because `v2.issue_document()` doesn't exist yet — replace when it ships. The per-row "quick invoice" button was removed in orders cleanup Phase 2 (it opened nothing); a row-level document action returns with `issue_document()`. See `docs/v2-migration/orders-system-handoff.md` §6/§12. |
| Expenses, materials, accounts, invoicing (legacy PDF renderer), analytics | 🌑 **Dark since the Clerk swap (2026-07-17, explicit decision)** — their code is intact on the `public` schema but non-functional: the Supabase session they authenticated with no longer exists, so their API routes 401 and their browser-direct queries get RLS-denied. Each returns at its own v2 cutover. Do **not** delete their code. The orders-page façade stubs in `app/dashboard/orders/_context/` now serve only the unmigrated InvoicesTab (the Insights/Tasks tabs were deleted in orders cleanup Phase 1). `app/features/invoices/` is a separate, unrelated legacy client-side PDF generator — not part of the v2 documents module. |
| Home dashboard | 🗑 **Deleted 2026-07-13** — was unreachable (no nav link, `/dashboard` redirects to orders) and ran on sample data, not live queries. `app/dashboard/home/`, `sample-orders.ts`, `hooks/use-data.ts`, `hooks/useDashboardStats.ts` removed; rebuild on a v2 read layer when the home/metrics module gets its turn. |

## Clerk transition (Phase 1 built 2026-07-17)

The hold was lifted 2026-07-17; Phase 1 (identity swap, v2-only scope) is
built on branch `clerk-auth-transition`:

- **Identity**: Clerk session via `auth()` in `resolveTenant()`
  (`app/lib/auth/tenant.ts`). The app-facing user id is the
  `internal_user_id` **UUID claim** (session token, from Clerk
  `public_metadata.internal_user_id` — dashboard "Customize session token"
  config). Existing users carry their pre-Clerk `auth.users` UUID there, so
  `organization_members` needed **no remap** (DB owner: the previously
  flagged re-map item is obsolete). A signed-in user without the claim
  resolves to null → 401 (unprovisioned). Claim typing:
  `types/globals.d.ts`.
- **Gate**: root `middleware.ts` is `clerkMiddleware()`; public routes are
  `/auth(.*)` + `/api/healthz` (parity with before). Sign-in page is Clerk's
  `<SignIn />` at `app/auth/signin/[[...rest]]/page.tsx` (Google + email
  code; sign-ups restricted in the Clerk dashboard). All Supabase-auth
  routes/pages (callback/confirm/verify/fix-profile-rls/login/…) and
  `app/lib/auth/{session-utils,profile-utils,authorization,update-last-sign-in}.ts`
  are deleted; `app/context/auth-context.tsx` is now a thin Clerk façade
  preserving the `useAuth()` interface (legacy `profiles` roles are gone —
  `isAdmin`/`isManager` are hard false until roles come from v2 `orgRole`).
- **Data access unchanged**: `TenantDb` still wraps the service-role client;
  selects/updates auto-append `organization_id`, inserts inject it, no
  delete. The raw client never leaves `tenant.ts`.
- **Provisioning**: `scripts/clerk-backfill.js` (run manually with
  `CLERK_SECRET_KEY` + `SUPABASE_SERVICE_ROLE_KEY`) find-or-creates Clerk
  users for every `organization_members` row and sets their
  `internal_user_id` metadata. New-user provisioning (fresh UUID +
  membership + counters bootstrap) is still an open follow-up.
- **Legacy modules are dark** (explicit scope decision — see module table).

**Phase 2 (not started, blocked on DB owner)**: register Clerk as Supabase
third-party auth, v2 RLS policies reading the `internal_user_id` claim,
expose the `v2` schema, then back `TenantDb` with
`createV2Client(getToken)` and **drop the `create_order_as_org` shim**
(call `create_order` with real JWT claims). `resolveTenant()` remains the
single swap point. Order creation still goes through the
`v2.create_order_as_org(p_org, p_user, payload)` SECURITY DEFINER shim
(migration `20260710000000_…`), service_role-only, until then.

## Blocked / waiting on others

- **Clerk dashboard setup (user)**: create app (Google + email code,
  restricted sign-ups), add the `internal_user_id` session-token claim,
  put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` in `.env.local`
  and Vercel, run `scripts/clerk-backfill.js`. Nothing signs in until this
  is done.
- **Clerk Phase 2 (DB owner)**: third-party-auth registration, v2 RLS
  policies on the `internal_user_id` claim, expose `v2` schema (see above).
- **DB owner items** (flagged, not app work): trigger-based activity/audit log
  on orders/payments; tenant provisioning (new org must get counters +
  membership bootstrapped — `next_number` fails for orgs without seeded
  counters, **including a `document:<document_type>` counter per type now
  that `/api/documents` calls `next_number('document:invoice', ...)` etc. —
  confirm this counter_key naming with the DB owner, it's an app-side
  assumption, not a confirmed DB convention**); `validate_custom_data`
  search_path hardening; ~~re-map the 3 seeded `organization_members` rows when
  Clerk user ids exist~~ (obsolete 2026-07-17 — the internal-UUID claim keeps
  the existing UUIDs, no remap needed); `v2.issue_document()` RPC (blocked on credit-note +
  partial-invoicing decisions — see orders-system-handoff.md §6/§12); a `v2`
  schema dump (or migration mirror) so DB-integration tests can run against
  local Supabase (see `test/README.md` layer 3).

## Follow-up backlog (acknowledged, deliberately deferred)

Item add/edit/remove on existing orders; org settings editor (order statuses,
currency → needs `PATCH /api/organization`); order detail editing (date,
client, custom_data); searchable comboboxes for client/product pickers at
scale; attachments; payment/note edit+delete; currency-aware `formatCurrency`;
documents "issue" action + per-row quick-invoice sheet (both wait on
`issue_document()`); order-page metrics on a v2 read layer; **Next.js security
upgrade** (critical middleware/auth-bypass + SSRF/cache-poisoning CVEs — the
non-breaking `npm audit fix` bumps `next` 15.3→15.5 and breaks the build gate at
`app/actions/options.ts:234`, so it needs a scoped upgrade PR with a type fix;
full finding in `docs/code-review/AUDIT_PROGRESS.md` §"npm audit — dependency
CVEs (2026-07-14)").

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
