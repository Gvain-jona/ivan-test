# v2 platform migration — live state

Last updated: 2026-07-24 (branch `clerk-auth-transition`). This is the
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
| Auth end state | **Clerk** replaces Supabase Auth. **Phase 1 (identity swap) built 2026-07-17**; **Phase 1.5 (Clerk Organizations as tenancy source of truth) built 2026-07-24** — see "Clerk transition" section below. User-id strategy: **internal-UUID claim** (`internal_user_id` in the session token from Clerk `public_metadata`), existing users keep their old `auth.users` UUID so `organization_members` needed no remap. Clerk Organizations (dashboard-enabled) is now authoritative for org identity/membership/roles — `v2.organizations` is a thin mirror (`clerk_org_id`, plus app-only `settings`/counters) synced by a webhook; `v2.organization_members` is written by that same webhook, not by hand. Sign-in: Google + email code. Phase 2 (RLS flip via supabase-js `accessToken` callback + third-party auth) still pending, blocked on DB owner — unrelated to the Organizations change above. |
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
| Notifications | 🌑 **Stubbed 2026-07-24** — `app/context/NotificationsContext.tsx` is now an interface-preserving stub (empty list, no-op mutations, `unreadCount` 0). The pre-stub implementation ran on the dead Supabase session and was defective anyway (unfiltered whole-table fetch + unfiltered realtime channel per session; an `if (loading)` guard deadlocked the initial fetch so it never rendered data). Consumers (FooterNav badge, NotificationsMenu/Drawer/Indicator) still mount against the stub as UI scaffold. `app/hooks/useRealNotifications.ts` is a second, parallel legacy implementation — dead, delete at this module's cutover. Real data layer comes with the v2 notifications module. |
| Home dashboard | 🟡 **Rebuilt as the mobile-only Home feed (2026-07-22/23)** on live v2 order queries — greeting hero, quick-add, quick-action chips (New client/product `?new=1` deep-links), a "sales this month" snapshot, and a workflow-segmented recent-orders list. Desktop lands on Orders instead; Home is `lg:hidden` (see `docs/mobile-responsiveness/DESIGN_PHILOSOPHY.md`). **Scaffolded metric awaiting a read layer:** "sales this month" (`app/components/home/HomeSnapshot.tsx`, summed in `app/dashboard/home/page.tsx`) sums a **bounded** client-side order fetch (≤200 of the month's orders) — the count badge is accurate, the sum is approximate. Wire it to a real aggregate accessor when the **analytics/metrics** module cuts over — same read layer as the deferred order-page metrics below. Don't invent a bespoke endpoint before then. |

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
  `internal_user_id` metadata — kept only for pre-Clerk stragglers.
- **Legacy modules are dark** (explicit scope decision — see module table).

### Phase 1.5 — Clerk Organizations as tenancy source of truth (2026-07-24)

New sign-ups go through Clerk's hosted org-creation flow (name, slug,
logo) automatically — that was Clerk-dashboard config nobody had wired
to the app's tenancy, so a new org owner finished onboarding and hit a
dashboard that silently 401'd (no `v2.organization_members` row was
ever created for them). Fixed by making Clerk Organizations
authoritative end-to-end:

- **`resolveTenant()`** (`app/lib/auth/tenant.ts`) now reads `orgId`/
  `orgRole` — default Clerk session claims, no custom claim config
  needed — instead of the old `user_settings.active_organization_id` +
  multi-membership lookup (that column/logic is retired; it was always
  read-only, nothing ever wrote to it). `orgRole`'s `org:` prefix is
  stripped to match the app's role strings — **Clerk's dashboard custom
  org roles must be keyed exactly** to match `OrgRole` in `tenant.ts`
  for this to be a straight match, not a translation. **Role model is
  currently just `owner`/`staff`, no `admin`** (trimmed 2026-07-24):
  Clerk's free plan only gives 2 free custom org roles before requiring
  the paid B2B Authentication add-on, and the built-in `org:admin`/
  `org:member` don't line up with this app's role semantics, so a third
  custom role was deferred rather than paid for. The org's Creator
  Role (Clerk Dashboard → Organizations → Settings) must be set to the
  custom `owner` role, not the default `org:admin`.
- **Schema**: `v2.organizations.clerk_org_id` (text, unique, nullable)
  maps Clerk's `org_...` id to the existing internal uuid `id` — the
  uuid stays the FK anchor everywhere (orders, clients, …), no PK
  change. New `v2.provision_organization(p_clerk_org_id, p_name,
  p_owner_user_id, p_slug)` RPC (SECURITY DEFINER, service_role only,
  idempotent by `clerk_org_id`) atomically creates the org row, the
  owner's membership, and starter counters. Migration:
  `supabase/migrations/20260724000000_add_clerk_org_mapping_and_provisioning.sql`.
  No logo column — logo stays Clerk-side, read live via `useOrganization()`.
- **Webhook**: `app/api/webhooks/clerk/route.ts` syncs
  `user.created` (mints `internal_user_id` — this is what closes the
  "new-user provisioning" gap below, going forward), `organization.created`
  (calls `provision_organization`), `organization.updated`,
  `organization.deleted` (archives the mirror row — `status='archived'`
  + `deleted_at`, never a hard delete, since the row's uuid is the FK
  anchor for the tenant's orders/clients/products), and
  `organizationMembership.created|updated|deleted` (note: the installed
  `@clerk/backend` SDK's `WebhookEvent` union uses **camelCase**
  `organizationMembership.*`, not the snake_case shown in Clerk's own
  docs table — verified against the installed package, not assumed).
  Needs `CLERK_WEBHOOK_SIGNING_SECRET` (the endpoint's signing secret
  from the Clerk dashboard) in env — added to `.env.template`.
  `middleware.ts`'s public-route matcher now includes `/api/webhooks(.*)`
  (found and fixed in the same session): Clerk's webhook deliveries
  carry no session, only svix signature headers, so `clerkMiddleware()`'s
  default `auth.protect()` would otherwise 401 every real delivery
  before `verifyWebhook()` runs — same reasoning as `/api/cron`'s
  bearer-token gate.
- **UI gate**: `app/dashboard/layout.tsx` now calls `resolveTenant()`
  and renders `ProvisioningPendingScreen` (auto-retries via
  `router.refresh()`) instead of a silently-broken dashboard during the
  few-second window before a brand-new org's webhook lands.
- **Display**: `TopHeader` reads org name/logo live from Clerk's
  `useOrganization()` (not the mirror) — display doesn't need
  transactional consistency with the DB. Authorization still comes
  **only** from server-resolved `orgRole`; the client-side Clerk claim
  is display-only (see the guardrail comment in `auth-context.tsx`).

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
  on orders/payments; ~~tenant provisioning (new org must get counters +
  membership bootstrapped)~~ (resolved 2026-07-24 — `v2.provision_organization`
  seeds `order`/`doc:invoice`/`doc:quotation` counters atomically on
  `organization.created`, see Phase 1.5 above); ~~`validate_custom_data`
  search_path hardening~~ (resolved 2026-07-25, migration `20260725164737`);
  ~~re-map the 3 seeded `organization_members` rows when
  Clerk user ids exist~~ (obsolete 2026-07-17 — the internal-UUID claim keeps
  the existing UUIDs, no remap needed); `v2.issue_document()` RPC (blocked on credit-note +
  partial-invoicing decisions — see orders-system-handoff.md §6/§12); a `v2`
  schema dump (or migration mirror) so DB-integration tests can run against
  local Supabase (see `test/README.md` layer 3).
- **Fixed (2026-07-24): the counter_key convention is `doc:<type>`
  (`doc:invoice`, `doc:quotation`), not `document:<type>`.** This had
  surfaced a real bug (confirmed against live DB data across all 3
  existing orgs): `/api/documents` (`route.ts:69`) called
  `next_number('document:${document_type}', …)` — the wrong prefix —
  so every document-create POST threw `next_number: no counter
  document:invoice for organization …` against real data. Fixed with
  the one-line `document:` → `doc:` change plus a hardened assertion
  in `route.test.ts` that checks the actual RPC key string passed
  (previously it asserted the buggy value, so the bug shipped without
  a failing test).
- **Live v2 data reality (2026-07-25): the DB is a clean test env, not "3
  orgs with real data."** Direct inspection of the live project
  (`giwurfpxxktfsdyitgvr`) shows **one** org — "Ephra test" — with empty
  `settings` (`{}`), and **zero** `field_definitions`/`clients`/`products`/
  `orders`. Earlier notes referencing "3 existing orgs" are stale; treat this
  as the ground truth for any backfill/migration risk assessment (currently:
  ~nil).
- **First-run/field-setup schema foundation landed (2026-07-25, migration
  `20260725164737`)** — see `docs/v2-migration/FIRST_RUN_AND_FIELD_SETUP.md`.
  Adds `field_definitions.is_system` + `default_value`; a shared
  `v2.value_in_options()` so select validation accepts object options
  (`{value,label,color,is_default,semantic}`) alongside legacy string arrays;
  and governs the `order.status` fixed column against an
  `entity='order', field_name='status'` select field-definition (enforced
  only when configured, so unconfigured orgs still transact). This is the
  DB half of retiring the hardcoded `DEFAULT_ORDER_STATUSES`/`UGX` fallbacks.
- **First-run app foundation (2026-07-25)** — `PATCH /api/organization`
  (owner-only, merges org-scalar settings: currency/locale; name/slug/logo
  stay Clerk-authoritative, status values stay in `field_definitions`) and a
  presets-as-data module (`app/lib/organization/presets.ts`: currency menu,
  print-shop status workflow, per-entity starter field sets — opt-in, applied
  only on user action, never a silent fallback). `TenantDb.organization()`
  gained a settings-only `update()`.
- **First-run wizard built (2026-07-25)** — `app/components/onboarding/`
  (`GettingStartedWizard`, `EntityFieldSetupStep`, `OnboardingGate`) + the
  `/dashboard/getting-started` surface. Walks currency → product → client →
  order, applies the starter field presets idempotently
  (`starterFieldsToApply`), and reuses `FieldDefinitionFormSheet` for custom
  fields. Object-shaped select options now flow end-to-end
  (`app/lib/fields/options.ts`, extended `fieldDefinitionCreateSchema`,
  `CustomFieldInput`). Onboarding completion persists in
  `settings.onboarding.completed`; `OnboardingGate` routes unfinished users
  in. **Visual QA pending** (no authed runtime here); pure logic unit-tested.
- **Hardcoded fallbacks removed (2026-07-25, step 4)** — this is the payoff of
  the "no mandatory conditioning" goal. `DEFAULT_ORDER_STATUSES` deleted;
  statuses now come from the order `status` field-definition via
  `useOrderStatuses()` (empty until configured). The `UGX` default is gone:
  `useOrganization().currency` is `null` until set, and the new
  `useFormatCurrency()` renders plain numbers until a currency is chosen (then
  `Intl` currency), wired into the live order/home/products surfaces. Legacy
  dark modules keep the `formatCurrency` util until cutover. Follow-up:
  data-driven status chips (`color`/`semantic`) — data present, UI still
  renders by value. **Still to build:** retire the standalone
  `/dashboard/fields` for per-entity editing (step 5).

## Follow-up backlog (acknowledged, deliberately deferred)

Item add/edit/remove on existing orders; org settings editor (order statuses,
currency → needs `PATCH /api/organization`); order detail editing (date,
client, custom_data); searchable comboboxes for client/product pickers at
scale; attachments; payment/note edit+delete; currency-aware `formatCurrency`;
documents "issue" action + per-row quick-invoice sheet (both wait on
`issue_document()`); order-page metrics **and Home's "sales this month" card**
on a v2 read layer (both currently scaffolded — Home sums a bounded client-side
fetch, see Module status → Home dashboard); **Next.js security
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
