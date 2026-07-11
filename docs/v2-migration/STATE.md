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
| **Orders** | ✅ Cut over to v2 (list, create form, view sheet, payments, notes, status changes). Item add/edit on existing orders is a follow-up. |
| **Clients** | ✅ Cut over (management page, inline creation from order form). |
| **Products** | ✅ New (management page; catalog feeds order items). |
| **Field setup** | ✅ New (per-entity registry admin at `/dashboard/fields`). |
| Expenses, materials, accounts, invoicing, analytics, home dashboard | ⏳ Legacy, still on `public` schema, fully working — do not delete their code. Invoices/Tasks/Insights tabs on the orders page compile against explicitly-marked legacy-compat stubs in `app/dashboard/orders/_context/` and show empty data until their own cutovers. |

## Interim auth (until Clerk)

Identity comes from the existing Supabase-Auth session; `resolveTenant()` in
`app/lib/auth/tenant.ts` maps it to an org via `organization_members` and
returns a **service-role** client plus `{ userId, organizationId, orgRole }`.
Every migrated route filters by `organizationId` explicitly — the service-role
client bypasses RLS, so that explicit scoping is the tenant boundary right now.
`resolveTenant()` is the single Clerk swap point. Order creation goes through
the `v2.create_order_as_org(p_org, p_user, payload)` SECURITY DEFINER shim
(migration `20260710000000_…`), service_role-only; **drop the shim when Clerk
lands** and call `create_order` with real JWT claims.

## Blocked / waiting on others

- **Clerk integration (Layer 2)**: needs Clerk keys, the DB user-id decision
  above, Supabase third-party-auth registration.
- **DB owner items** (flagged, not app work): trigger-based activity/audit log
  on orders/payments; tenant provisioning (new org must get counters +
  membership bootstrapped — `next_number` fails for orgs without seeded
  counters); `validate_custom_data` search_path hardening; re-map the 3 seeded
  `organization_members` rows when Clerk user ids exist.

## Follow-up backlog (acknowledged, deliberately deferred)

Item add/edit/remove on existing orders; org settings editor (order statuses,
currency → needs `PATCH /api/organization`); order detail editing (date,
client, custom_data); searchable comboboxes for client/product pickers at
scale; attachments; payment/note edit+delete; currency-aware `formatCurrency`;
documents module (InvoiceSheet TODO on the orders page); order-page metrics on
a v2 read layer.

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
