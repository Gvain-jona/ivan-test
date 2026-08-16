# v2 platform migration — live state

Last updated: 2026-08-14 (first-run collapsed to A1; baseline seeded for the
org). This is the
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

For the DB-side *design reasoning* behind the order-model tables (clients,
products, orders, order_items, payments, documents, field_definitions), see
`docs/v2-migration/orders-system-handoff.md`.

**That doc is no longer DB-authoritative** (corrected 2026-08-07 — it carried
that claim until then, which is how it caused two shipped bugs). Its §5
Payments describes columns that were dropped in the 2026-07-29 money rewrite,
§6 says `issue_document()` isn't built when it is, and §9's `create_order`
payload omits `reference`. It now opens with a banner listing exactly what is
and isn't still true. Read it for *why* the model is shaped this way; read the
database for what it currently is.

**The live v2 schema is directly queryable** via the Supabase MCP server
(project `giwurfpxxktfsdyitgvr`). `select prosrc from pg_proc where …` settles
in seconds what a doc can only assert — and would have prevented both bugs
above. Verify before encoding any claim about what a function accepts.

For a graded audit of the app-side data path (fetch, tenancy, cache, bloat,
performance — not UI), see `docs/v2-migration/DATA_LAYER_AUDIT.md`
(2026-07-12). Security findings remain in `docs/code-review/AUDIT_PROGRESS.md`.

For orders-specific legacy attachment (dead code vs hollow UI vs what to
delete/fix), see `docs/v2-migration/ORDERS_CLEANUP.md` (2026-07-12).

For the surface redesign (26 Pencil frames covering orders, clients, products,
documents, home, settings) reconciled against schema and code — what the
screens require, what already exists, and the two DB asks that survive — see
`docs/v2-migration/APP_REDESIGN.md` (2026-08-07). It also carries the two
principles that govern the reconciliation: **the DB models correctly, the UI
speaks the user's language** (don't migrate to match UI vocabulary), and
**default to `field_definitions`, not new columns** (anything not core is a
starter field). Applying them cut the DB asks from four to two and a half.

**Live break found there, fixed 2026-08-07**: `GET /api/orders/[id]` was still
filtering `payments` on the dropped `entity_type`/`entity_id` — the sibling POST
was rewritten 2026-07-31, the GET was missed, and `route.test.ts` asserted the
broken filter so the suite stayed green. Second instance of the
test-ratifies-the-bug class, after `document:` vs `doc:`. It now reads through
`payment_allocations`, and two things the rewrite had to get right beyond the
column swap: it collects allocations against the order **and its documents**
(SINGLE RECEIVABLE moves the target to the invoice once one is live, so
order-only would report "paid nothing" on every invoiced order), and it reports
each payment at its **allocated** amount, since one payment can settle several
targets and `payments.amount` would sum past `orders.amount_paid` on a split.
The replacement tests assert the union and the allocated amount, plus a
regression guard that the `payments` table is never queried directly.

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
| Theme default | **System** (`defaultTheme="system" enableSystem`, 2026-08-06). Was forced dark with `enableSystem={false}`, which silently downgraded the "System" option in all three UIs that offered it. Flipped only after the live v2 surface was tokenized — see "Theming" below. |
| Brand colour storage | **Clerk organization `public_metadata.brand_color`**, not `v2.organizations` (2026-08-06). Clerk already owns org visual identity (name, slug, logo); putting the colour there needs no migration and no change to the DB-owned `validate_organization_settings` whitelist, which would otherwise have rejected a new `settings.branding` block. Reaches the app as the session claim `brand_color`. |
| Brand colour input | **A closed preset set**, not a free colour picker (8 presets in `app/lib/theme/brand-presets.ts`). Every light/dark pair is contrast-solved at authoring time and enforced by `brand-presets.test.ts`, so no org choice can produce unreadable buttons. A free picker later swaps the lookup in `resolveBrandTokens()` for oklch ramp generation behind the same seam — nothing downstream changes. |
| Testing stance | No live tenant data dependency; mock up a trial/playground org when a test bed is needed. **Since 2026-07-13 a Vitest suite is live** (`npm test`): unit tests on the `TenantDb` wrapper + route contract tests on all migrated routes against a fake tenant DB. Newly migrated modules add colocated `route.test.ts` files in the same PR — pattern in `test/README.md`. DB-integration tests blocked on a v2 schema dump (DB owner). |
| Scope discipline | Quality over quantity — ship the load-bearing pieces, park the rest as explicit follow-ups (below), don't half-build. |

## Module status

| Module | State |
|---|---|
| **Orders** | ✅ Cut over to v2 (list, quick filters wired to the store, view sheet, payments, notes, status changes). Orders cleanup Phases 1–4 done 2026-07-13: dead tabs/hooks deleted, legacy FilterDrawer/Invoices tab/hollow actions removed, `useOrdersPage` façade collapsed into `useOrdersStore`/`useOrdersUI`. **The whole order flow was rebuilt to the redesign 2026-08-10** — create → hub → issue → document. B2 is a screen at `/dashboard/orders/new` (`NewOrderScreen`) with its add-item / payment / note / discount sheets; B4 is the hub at `/dashboard/orders/[id]` (`OrderHubScreen`), one scrolling surface; B7 issues from it. `OrderFormSheet`, `OrderViewSheet` and `order-view/*` are deleted, and both `openCreateOrder()` and `openOrder()` in the sheet host now push routes rather than opening sheets — see `APP_REDESIGN.md`. **Item add/edit/remove on existing orders is done** (`/api/orders/[id]/items` + `/items/[itemId]`, 18 contract tests); it needed a narrow `delete` on `TenantDb`, type-restricted to `order_items` — see `DeletableTable`. **B1 + A2 landed the same day** (`OrdersListScreen`), so the module is complete on the redesign and every pre-redesign order file is deleted: `OrdersTableNew`, `OrderRow`, `OrderCard`, `OrdersFilterSheet`, `StatusDropdown`, `OrderActions`, `OrderDeleteConfirmation`, `CustomDropdown`, and the page's `_components`/`_context` tree. The list read gained two things: search across **client name as well as order number** (client ids resolved first, then one `or` over two real columns — PostgREST can't `or` across an embedded relation), and a **"due soon"** filter that resolves the org's *own* date field from `field_definitions` rather than trusting a caller-supplied jsonb key. |
| **Clients** | ✅ Cut over (management page, inline creation from order form). |
| **Products** | ✅ New (management page; catalog feeds order items). |
| **Field setup** | ✅ New. Per-entity — the standalone `/dashboard/fields` page was retired 2026-07-25; field editing lives inline on each entity page (Products/Clients/Orders) via `EntityFieldsManager` behind a "Fields" toggle, and the starter fields are seeded for the org at provisioning (2026-08-14; `seed-defaults.ts`), not applied through a wizard. Rebuilt dialog-free 2026-07-31 (inline composer + in-row editor + status workflow editor; `FieldDefinitionFormSheet` deleted) — same components in setup and steady state. |
| **Documents** | 🟡 **Built end to end (2026-08-10): issue → render.** `/api/documents` GET (list) + POST (issue) — no more PATCH/draft path. POST goes through the `issue_document_as_org` shim → `v2.issue_document()` (shipped), producing an **issued** document (numbered, immutable, snapshot-frozen), never a draft; the old non-atomic `next_number()` + insert shim is gone. `useDocuments` exposes `issueDocument` (single order) and `issueDocuments` (the multi-order/consolidated case, A3b/F2). Issued from the **order hub** via `IssueDocumentSheet` (B7 — **Quotation and Invoice only**; the Receipt chip is deliberately not drawn, A3c postponed to the payments cutover), and rendered from the frozen snapshot at `/dashboard/documents` (list) + `/dashboard/documents/[id]` (`DocumentPaper`, B9). The order-view sheet this used to hang off is deleted. Left: per-row quick-invoice sheet (F2). See `docs/v2-migration/orders-system-handoff.md` §6/§12. |
| Expenses, materials, accounts, invoicing (legacy PDF renderer), analytics | 🌑 **Dark since the Clerk swap (2026-07-17, explicit decision)** — their code is intact on the `public` schema but non-functional: the Supabase session they authenticated with no longer exists, so their API routes 401 and their browser-direct queries get RLS-denied. Each returns at its own v2 cutover. Do **not** delete their code. (The orders-page `_context/` façade stubs and the `InvoicesTab` they fed were **deleted in the 2026-08-10 order-module rebuild** — no legacy tab hangs off the orders page any more; earlier notes here referencing them are superseded.) `app/features/invoices/` is a separate, unrelated legacy client-side PDF generator — not part of the v2 documents module. |
| Notifications | 🌑 **Stubbed 2026-07-24** — `app/context/NotificationsContext.tsx` is now an interface-preserving stub (empty list, no-op mutations, `unreadCount` 0). The pre-stub implementation ran on the dead Supabase session and was defective anyway (unfiltered whole-table fetch + unfiltered realtime channel per session; an `if (loading)` guard deadlocked the initial fetch so it never rendered data). Consumers (FooterNav badge, NotificationsMenu/Drawer/Indicator) still mount against the stub as UI scaffold. `app/hooks/useRealNotifications.ts` is a second, parallel legacy implementation — dead, delete at this module's cutover. Real data layer comes with the v2 notifications module. **Rebuilt and working end to end 2026-08-15 → `NOTIFICATIONS_REBUILD.md`** (branch `notifications/foundation`). One **activity stream** projected by access+label (not fan-out): `v2.notifications` + `v2.notification_reads` live on the v2 project (RLS on / 0 policies — service-role TenantDb is the boundary). `notify()` emits from the order-create / status-change / payment routes + `member.added` on the Clerk webhook; the bell reads via SWR **pull** (~90s; realtime waits for the Phase 2 RLS flip) and renders structured rows through a presenter. `tsc`/suite/lint/build all green. The old stub context, dead route and orphaned `useRealNotifications` are replaced. Remaining = refinements (unread-count endpoint, deep-link routing) + later tracks (digest/preferences/push). ⚠️ Separately, the **legacy `public.notifications` (3,348 rows) is still live behind a world-readable RLS policy** (`public_read_notifications … USING(true)`) — a real cross-user leak, deferred (to be dropped with that schema), not fixed. |
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
- **Schema asks from the surface redesign (2026-08-07): `DB_ASKS.md`.** Five
  items plus two confirmation questions, each with what breaks without it.
  **A2 is done** (migration `20260807213900`, applied to the live project and
  mirrored into `supabase/migrations/`): `notes.custom_data`, `'note'` in the
  `field_definitions` entity whitelist, and a `trg_validate_note_cd`
  registration — `validate_custom_data()` needed no change, being already
  parameterised by `TG_ARGV[0]`. **A1 is done, both parts** (`20260807220500`
  part 1, applied by the DB owner; `20260809120000` part 2), unblocking B2, B4,
  B7 and B8. The order-level discount now exists as `orders.discount_type` /
  `discount_value` — the figure the user typed, never the money — with
  `v2.order_discount_amount()` as the single resolver shared by
  `recompute_order_totals()` and `issue_document()`, so an order and the
  document that freezes it cannot disagree. All money rounds at
  `v2.currency_scale()` rather than a hardcoded 2dp, which for UGX (zero minor
  units) is the difference between a printed document that adds up and one that
  doesn't. Verified live across all four tax modes — see `DB_ASKS.md` A1 for
  the measured table and for why `documents.total` being a generated column
  dictates the shape of the arithmetic.
  **A3a + A3b are done** (`20260809160000`), unblocking F2: `issue_document()`
  takes an order array, filing one order under `entity_type='order'` as before
  and several under `entity_type='client'` with the covered orders frozen in
  `snapshot.orders`. No link table — coverage is a GIN-indexed jsonb
  containment query. Cash on a consolidated invoice fills its covered orders
  **oldest first** (owner's decision, 2026-08-09), against the totals the
  snapshot froze, with the last order absorbing any remainder so overpayment
  stays visible. `orders.amount_paid` and `reconcile_money()` now share one
  formula, `v2.order_paid_amount()`, so the maintained value and the drift
  check cannot disagree. `recompute_order_paid_for(uuid)` was dropped in the
  process — a `PUBLIC EXECUTE` callable writer with no org check; its UPDATE
  lives in the trigger function now. **A3c (receipts) is postponed to the
  payments cutover** (decided 2026-08-09): a receipt is a document about a
  payment, sharing none of the lines/tax/receivable machinery above, and its
  snapshot shape is the payments module's to define — building it now would
  mean guessing that shape and rewriting it at the cutover. The one thing to
  honour meanwhile is that **B7 must not draw its Receipt chip**; Issue
  document offers Quotation and Invoice only. **A4 is done**
  (`20260809180000`): `create_order()` keeps an inline payment's `notes`, so
  the create-order payment sheet can offer that field. **A5 is done, and it was
  never a DB ask** — `validate_organization_settings` has no non-empty-string
  rule and always accepted a cleared value; the `.min(1)`s were ours, in
  `settingsBlocks`. Every settings key is now nullable, `null` removes it, and
  the route deletes the key rather than storing `''` (settings is frozen into
  document snapshots, and `"phone": ""` asserts a blank phone number).
  `locale.currency` stays non-nullable — an org that cannot name a currency
  cannot issue anything. **With that, every ask in `DB_ASKS.md` is closed
  except A3c**, which is postponed by decision rather than blocked.
  Both former "confirmation questions" are now answered from the source rather
  than inference: the `documents.snapshot` shape is recorded in
  `app/lib/documents/snapshot.ts`, and `issue_document` freezes the
  tax-exclusive presentation (`subtotal`, `discount_total`, `tax_total`) from
  which the generated `total` is computed.
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
  `organizations.onboarding_completed_at` (see the 2026-07-31 settings
  reconciliation below — it was `settings.onboarding.completed` until then);
  `OnboardingGate` routes unfinished users in. **Visual QA pending** (no
  authed runtime here); pure logic unit-tested.
- **Hardcoded fallbacks removed (2026-07-25, step 4)** — this is the payoff of
  the "no mandatory conditioning" goal. `DEFAULT_ORDER_STATUSES` deleted;
  statuses now come from the order `status` field-definition via
  `useOrderStatuses()` (empty until configured). The `UGX` default is gone:
  `useOrganization().currency` is `null` until set, and the new
  `useFormatCurrency()` renders plain numbers until a currency is chosen (then
  `Intl` currency), wired into the live order/home/products surfaces. Legacy
  dark modules keep the `formatCurrency` util until cutover. Follow-up:
  data-driven status chips (`color`/`semantic`) — data present, UI still
  renders by value.
- **`/dashboard/fields` retired (2026-07-25, step 5)** — field editing is now
  per-entity: `EntityFieldsManager` behind a "Fields" toggle on Products,
  Clients, and Orders (order + order_item). Global nav entries removed, page
  deleted. This completes the first-run/field-setup arc (steps 1–5); what
  remains is **visual QA of the whole flow in a running authed app** and the
  data-driven-status-chip follow-up.
- **Onboarding redesigned (2026-07-29 → 31)** — the wizard above was rebuilt
  against the Pencil canvas; see `ONBOARDING_REDESIGN.md` for the gap map,
  decisions and per-phase record. What changed materially:
  - **New setup surface** — `/dashboard/getting-started` renders without the
    dashboard chrome (`DashboardLayout` suppresses it for that route), as a
    rail + panel: `SetupShell`, `StepTracker`, and a 6-step model in
    `app/lib/onboarding/steps.ts` (welcome + 5 counted steps, ending in a
    **First records** step). Back on every step; `OnboardingGate` is now
    bidirectional and lifted into `app/dashboard/layout.tsx`, since a
    chrome-less route would otherwise trap a user who'd already finished.
  - **No dialogs left in field setup.** `FieldDefinitionFormSheet` is
    **deleted**. Adding is an inline `FieldComposer` (plain-language type
    picker, client-side duplicate check, add→flash→auto-expand); editing is
    `FieldEditor` inside the row; archiving is an **Undo toast, not a
    confirm**. `EntityFieldsManager` was rebuilt on the same components, so
    setup and steady state behave identically. Note the deleted sheet could
    never save a preset select — it filtered options to strings.
  - **Status workflow editor** (`StatusWorkflowEditor`) — rename, reorder,
    recolour, set the semantic tag and the starting stage. Renaming changes
    `label` only; `value` is frozen because it's what sits in `order.status`.
    This is the UI half of the data-driven-status follow-up above.
  - **New theme tokens** in `globals.css` + `tailwind.config.ts`: setup
    surfaces, `success`/`warning`/`info`, and an `opt-*` field-option palette
    (vivid dot / AA-contrast label / background per colour) consumed via
    `app/lib/fields/colors.ts`. The shared `Switch` primitive was fixed —
    it hardcoded `orange-600`/`gray-700` and only read correctly in dark.
  - **Known gaps**, all logged in `ONBOARDING_REDESIGN.md`: field type is
    read-only in the editor (v2 can't guard a retype over existing data);
    `relation` is absent from the composer until its target can be set;
    stage reorder is buttons, not drag; multi-select is out of scope. Visual
    QA in a running authed app is still outstanding.
  - **Trigger interaction to know about**: `validate_custom_data` checks
    `order.status` against the status field's `options` on every order write,
    so the workflow editor can lock orders out of saving. Emptying the stage
    list is now blocked (an empty `options` array is *not* "unconstrained" to
    `value_in_options` — only NULL is; `[]` rejects every status write).
    **Still open**: removing a stage that orders are currently in makes those
    orders un-saveable — needs a usage check before removal.
- **DB drift review + settings reconciliation (2026-07-31)** — the DB had moved
  15 migrations ahead of anything the app knew about (13 of them 2026-07-29/30):
  the money model was rewritten (`payments` lost `entity_type`/`entity_id`,
  gained `direction`/`party_*`; new `v2.payment_allocations`; `orders.amount_paid`
  now trigger-derived from allocations; new `record_payment`, `void_document`,
  `v_payment_unallocated`, `v_payment_breakdown`, `reconcile_money`), storage was
  locked down (buckets private, `attachments.file_url` → `bucket`+`storage_path`,
  org-folder-scoped `storage.objects` policies), `documents` became a real
  financial record (currency/tax/totals/`due_date`/`issued_at`, immutable once
  issued, `doc:{type}` counter required) with **`v2.issue_document()` now
  shipped**, and `counters` gained `period_key`/`reset_policy`.

  The one that reached the app: **`fix_04` made `organizations.settings` a
  governed schema** — a trigger whitelists the blocks `identity`, `tax`,
  `documents`, `locale`, `platform_access` and moved currency to
  `locale.currency`. Verified against the live DB: `{currency}`,
  `{onboarding:{...}}` and a string `locale` are all **rejected**, so the
  wizard's first write and its finish write both failed and `OnboardingGate`
  looped. Reconciled by moving in both directions rather than bending either:
  - the app now speaks the block shape — `PATCH /api/organization` takes
    `{settings:{locale|tax|documents|identity}}` and **deep-merges per block**
    (the old shallow spread would have wiped a block's untouched keys);
    `useOrganization` reads `settings.locale.currency`.
  - the DB learned about onboarding — new column
    `organizations.onboarding_completed_at`
    (`supabase/migrations/20260731054912_organizations_onboarding_state.sql`,
    applied to the live project 2026-07-31).
    Deliberately **not** a settings block: settings is config that gets frozen
    into issued document snapshots, and setup progress must never be able to
    land on an invoice.
  - `useFormatCurrency` no longer stores a BCP-47 tag. The DB's locale block
    defines currency/date_format/timezone and no format locale; grouping now
    follows the reader's runtime locale, which is the right owner for it.

  **Closed out the same day** (was listed here as still open):
  - `POST /api/documents` no longer hand-rolls next_number + insert (it would
    have failed on every call — `currency` is `NOT NULL` with the default
    dropped). It now issues via `issue_document()`, so numbering, the frozen
    snapshot and all financials are the DB's business. The route's input schema
    changed with it: `documentCreateSchema` → **`documentIssueSchema`**, which
    takes no caller-supplied snapshot (that was a forgery vector) — client hook
    renamed `createDocument` → `issueDocument`, UI copy "Create Draft" → "Issue".
  - `app/types/supabase-v2.ts` refreshed against live introspection:
    `payments`, `counters`, `documents`, `attachments` corrected and
    `payment_allocations` added. Re-verified 2026-08-02 — **all 15 v2 tables
    now match the live schema column-for-column, and all 11 declared RPC
    signatures match `pg_get_function_arguments`.**
  - Correcting the types surfaced a **silently broken production route**:
    `POST /api/orders/[id]/payments` was still inserting the dropped
    `entity_type`/`entity_id`. Rewritten to write the cash event and its
    allocation in one transaction via `record_payment_as_org`, resolving the
    allocation target up front (**SINGLE RECEIVABLE**: once an order has a live
    invoice, `validate_payment_allocation()` refuses an allocation aimed at the
    order, so the route targets the invoice rather than letting the trigger
    reject a payment the user already entered).

  **Two new claim-injecting shims** (`20260731055624_issue_document_as_org_shim`,
  `20260731070723_record_payment_as_org_shim`), same pattern and lifetime as
  `create_order_as_org`: the service-role connection carries no
  `request.jwt.claims`, so `v2.current_org_id()` is null and the underlying
  function can't resolve a tenant. Each shim `set_config`s the claims from
  `p_org` then delegates. **All three retire in Phase 2.** They take the org as
  an *argument*, so EXECUTE on them is the right to act as any tenant —
  `service_role` only, **never `authenticated`**; `resolveTenant()` is what
  proves the caller owns `p_org`.

  **Typing constraint to not undo**: `DatabaseV2['v2']['Views']` must stay
  empty (`{ [_ in never]: never }`). Declaring non-empty `Views` widens
  supabase-js's relation union and collapses every uninstantiated
  `from().select()` result to `{}`, breaking property access across the
  codebase. The two view row types are exported standalone at the bottom of the
  file instead (`PaymentUnallocatedRow`, `PaymentBreakdownRow`). Revisit only
  together with retyping `TenantDb`'s builders.
- **Onboarding audit vs. app + v2 schema (2026-08-02)** — full sweep of the
  first-run system against the live DB. Two breaks fixed, one still open.

  **P0, fixed: tenant provisioning was dead, so onboarding was unreachable.**
  `v2.provision_organization` existed **twice** — the repo's 4-arg form
  (`20260724000000`) and a 5-arg form added DB-side out-of-band (seeds the
  `identity`/`tax`/`documents`/`platform_access` settings blocks + optional
  `p_currency`). The Clerk webhook calls it with exactly four named args and
  `p_currency` defaults, so the call matched **both** candidates. Confirmed
  against the live DB, not inferred:
  `42725  function v2.provision_organization(...) is not unique`.
  Chain: every `organization.created` delivery 500s → no `v2.organizations`
  row is ever written → `resolveTenant()` returns null → the new tenant sits on
  `ProvisioningPendingScreen` forever, and `organizationMembership.created`
  then fails too (`organization … not yet mirrored`). The only existing org
  predates the second overload, which is why nothing surfaced.
  Fix: `20260802170231_fix_provision_organization_overload` drops the
  superseded 4-arg form (the 5-arg one is a strict superset) — no app change
  needed, the webhook's existing call now resolves uniquely. Verified by
  re-probing. **The 5-arg form had also shipped with default PUBLIC execute** —
  `SECURITY DEFINER` taking the owner's user id as a *parameter*, i.e. the
  right to mint an org and name any user its owner; unreachable only because
  `v2` isn't exposed to PostgREST yet, and Phase 2 exposes it. Same migration
  locks it to `service_role`.
  - **Lesson for the drift habit**: the earlier review compared *columns* and
    found nothing here. This class — duplicate overloads, and grants — is
    invisible to a column diff. Sweep `pg_proc` for
    `count(*) > 1 group by proname` and for PUBLIC/`anon`/`authenticated` on
    `SECURITY DEFINER` whenever checking DB drift.
  - **Still latent, flagged not fixed**: `v2.next_number(text, uuid)` is
    `SECURITY DEFINER`, takes `p_org` as an argument, and is granted to
    `authenticated`. Same shape of hole (burn another org's counter), lower
    severity, and unreachable until Phase 2 exposes `v2` — fix with the RLS flip.

  **P1, fixed: the app called currency optional; the DB requires it.**
  `v2.issue_document()` opens with
  `if v_currency is null then raise 'organization has no locale.currency
  configured - complete setup first'`. But `CurrencyStep` said "Choosing is
  optional" and the wizard did `if (!currency) return advance()` — so a user
  could skip it, get `onboarding_completed_at` stamped, then have every invoice
  and quotation fail while being told to complete setup they'd just finished.
  Currency is now required (Continue disabled without one), and the wizard
  prefills from `settings.locale.currency` so a second pass isn't blocked on a
  decision already made.

  **Verified sound, no change needed**: `field_definitions` entity/type/name
  checks all accept what `STARTER_FIELDS` sends; the `status` starter is locked
  on (`is_system` → `FieldRow locked`), so an org can't finish setup without a
  workflow; `create_order` defaults status to `'pending'`, which is *not* in
  `ORDER_STATUS_WORKFLOW`, but `OrderFormSheet` always sends the workflow's
  `is_default`, so the trigger never sees it; `orders.client_id` is `NOT NULL`,
  matching `FirstRecordsStep`'s "Needs a client first" lock.

  **Closed 2026-08-10 — A1 was the answer.** This item read: onboarding
  collects currency only, `identity` is never asked for, and `issue_document`
  snapshots `settings.identity` as the invoice issuer, so a finished setup
  still produced a blank letterhead. Building the A1 frame fixed it — the first
  step is now a **Business details** form (`BusinessDetailsStep`) collecting
  name, industry, location, phone, email and currency, writing
  `settings.identity` + `settings.locale`. `WelcomeStep` and `CurrencyStep` are
  deleted; the step model is five numbered steps. `tax` and `documents` are
  still not asked for at first run, deliberately — they live on the org
  settings surface (F3), which exists.
- **DB moved again on 2026-08-01 (5 migrations), app unaffected** —
  `v2_parent_composite_unique_keys` + four composite-FK migrations added
  `UNIQUE (id, organization_id)` on the parents and cross-org-proof FKs on the
  children: `orders(client_id, organization_id) → clients`,
  `order_items → orders` (cascade) and `→ products`,
  `documents(related_document_id, …) → documents`,
  `payment_allocations(payment_id, …) → payments` (cascade). Tenant isolation
  moving from convention into the schema. **Purely additive — no app change
  needed**, since every write path already sets `organization_id` from
  `tenant.organizationId` and resolves parents within the same org. Recorded
  here because the repo's `supabase/migrations/` only mirrors *app-requested*
  changes, so DB-owned work like this leaves no trace in the tree.
- **Onboarding is not enforced** — `OnboardingGate` is a client-side redirect
  that renders children first, fails open when `/api/organization` errors, and
  has no API-route counterpart. A user can reach the dashboard unconfigured;
  nothing leaks (tenancy is still server-side via `resolveTenant()`), but the
  app is degraded rather than blocked: no field_definitions, no statuses, no
  currency. Deliberate today ("unconfigured org still transacts"); revisit if
  onboarding needs to be a real gate.
- **Onboarding UX + data-layer pass (2026-08-13)** — a review of how the
  first-run flow uses sheets/selectors and loads its data, then the fixes.
  Behaviour and interaction only; no schema or route contract changed, so the
  route tests were untouched and all 314 still pass. **Visual QA in a running
  authed app is still outstanding** (no authed runtime in-session), same caveat
  the redesign carries.
  - **Industry and currency are sheets now, not nested screens.** Both fields
    on `BusinessDetailsStep` opened a hand-rolled full-screen `DrillIn` that
    unmounted the whole form to make one choice — a second overlay vocabulary
    beside the app's `AppSheet` primitive, against CLAUDE.md's "one sheet, one
    door" and its screen-vs-sheet rule (*deciding one thing is a sheet*). They
    now open `AppSheet` (a bottom drawer on mobile) with the form mounted
    underneath; `DrillIn` is deleted. `CurrencyPicker`/`IndustryPicker` are
    unchanged in logic — they're now the sheet body.
  - **`BusinessDetailsStep` renders in the shell on desktop.** It rendered
    outside `SetupShell`, so the viewport switched from a bare centered column
    (step 1) to the two-column rail (steps 2–5) and back. It now takes a
    `chrome` prop: `frame` keeps the bare A1 hero on mobile (its deliberate "no
    counter, form-no-narration" intent), `panel` renders it as step 1 inside
    `SetupShell` on desktop. One shared field block; the wizard picks by the
    `lg` breakpoint. **Mobile is unchanged**; only desktop gained the rail.
  - **Seed-before-paint.** `GettingStartedWizard` rendered the form immediately,
    so a returning org's saved name/currency flashed blank before Clerk and the
    settings fetch resolved, then filled in. It now holds a loading state until
    the seed has run (or errored), so the form appears already populated.
  - **Field-setup steps + First records wait for their own reads.** These
    computed off an empty `fieldDefinitions`/count list while their SWR fetch
    was in flight: created fields showed as un-created "pending" toggles, and a
    Continue pressed early re-POSTed already-existing starters into a
    unique-name violation (`starterFieldsToApply` saw an empty existing set).
    `EntityFieldSection` now surfaces its `isLoading`, shows a skeleton, and
    reports up via `onLoadingChange`; `EntityFieldSetupStep` holds Continue
    until every mounted section has loaded; `FirstRecordsStep` shows
    placeholders until its three counts land (they defaulted to 0, flashing
    Orders as locked "Needs a client first"). SWR reports loading only on a cold
    cache, so cached revisits don't re-flash or block.
  - **`OrgLogo` no longer distorts.** Its `<Image>` carried only the width/
    height HTML attributes, not CSS dimensions, so as a column-flex child
    (`align-items: stretch`) it stretched to container width into a squished
    oval. Pinned explicit CSS size + `object-cover`.
  - **Not a real defect, noted for honesty**: the starter-field apply loop got a
    `finally { mutate() }`, framed at commit time as fixing a retry hazard. On
    re-examination the raw `createField` already `await invalidate()`s per
    create, so a retry already excluded created fields. The change is defensive,
    not corrective; the actual parallel gap was the load guard above.

- **First-run collapsed to A1, baseline seeded for the org (2026-08-14)** — the
  multi-step wizard was retired. New decision: configuring what to collect is
  expert knowledge most owners lack on day one, so the app **seeds the print-
  shop baseline for them** rather than asking. Nothing in the DB design changed
  (core columns + org-editable `field_definitions` as before); only who does the
  setup, and when.
  - **Seed at provisioning.** The Clerk webhook, right after
    `provision_organization`, upserts every starter field from `presets.ts` via
    `app/lib/onboarding/seed-defaults.ts` (idempotent on the
    `(organization_id, entity, field_name)` unique index) — including the
    `is_system` order-`status` workflow, the one field the app can't run
    without. Safety net: `POST /api/organization/seed-defaults` (owner-only) runs
    the same seed on A1 save, for out-of-order/retried events or pre-existing
    orgs. `presets.ts` stays the single source of truth; its header flipped from
    "opt-in, never silent" to "applied for the user, editable after".
  - **A1 is the only gate.** `OnboardingGate` now keys on **currency presence**
    (`settings.locale.currency`) via the pure `app/lib/onboarding/first-run.ts`,
    not `onboarding_completed_at`. A1 saves → seed → land on `/dashboard/home`.
    The multi-step scaffolding is **deleted**: `EntityFieldSetupStep`,
    `EntityFieldSection`, `FirstRecordsStep`, `SetupShell`, `StepTracker`, and
    `steps.ts`'s step model (only `SETUP_PATH` remains). `BusinessDetailsStep`
    lost its `panel`/desktop-shell mode — it's one centered hero on both
    breakpoints.
  - **`onboarding_completed_at` now governs only the badge.** A new
    `ContinueSetupBanner` rides the dashboard chrome (owner-only, until
    dismissed) as the standing "Continue setup" invitation; dismissing it stamps
    the column. Entry no longer depends on it.
  - **Tests**: pure `first-run` + `seed-defaults` unit tests, a `seed-defaults`
    route contract test, and the webhook test asserts the post-provision seed —
    339 pass; `tsc` and lint clean. **Backfill for the one existing org (Ephra,
    already past the gate on currency) is still owed** — it won't hit the A1
    safety net, so its missing order/order_item/note fields need a one-off seed.
  - **Visual QA in a running authed app still outstanding**, same caveat as the
    rest of the redesign.

- **Home (H1) rebuilt to the frame + mobile-landing fix (2026-08-14)** — audit
  found the built Home diverged from the H1 canvas, and the root `/` landing
  hardcoded `/dashboard/orders` for everyone, so mobile never reached its Home
  feed.
  - **Routing**: `app/page.tsx` now routes authed users to the adaptive
    `/dashboard` index (mobile → Home, desktop → Orders) instead of hardcoding
    Orders. `app/dashboard/page.tsx` already split correctly; only the root was
    wrong.
  - **H1 content**: `HomeHero` gained the org identity row (mobile owns its own
    top; TopHeader is desktop-only) and dropped the search-bar create action;
    `HomeSnapshot` is now two figures (sales this month · still to collect) over
    two sub-stats; `HomeQuickActions` is New order / client / quote per the
    frame; new `QuotationsSection` (active quotations) and `ToDoSection`
    (**scaffolded** — no v2 task layer, honest empty state). `homeMetrics`
    (`lib/orders/home-metrics.ts`, pure + tested) derives to-collect, in-process
    count, and the quotation split from a bounded order book; the split is
    data-driven off the workflow's default status, and quotations are excluded
    from the orders feed so they aren't double-counted. Sums are approximate
    over the bounded fetch — TODO(v2 read layer), same basis as the sales
    figure.
  - Still owed: **visual QA in an authed runtime**, and wiring `ToDoSection`
    when a v2 tasks layer exists.

- **Canvas-fidelity refinements (2026-08-14)** — a second pass for the small
  misses.
  - **Mobile nav matched to the frame.** `MobileTabBar` was a full-width bordered
    bar with Home/Orders/Clients/**Documents**/More; the canvas draws a floating
    rounded pill with Home/Orders/Clients/**Alerts**/More. Restyled to the pill
    (centered, detached, safe-area gap) and swapped Documents for **Alerts**,
    which opens the notifications drawer (`useNotifications().openDrawer`);
    Documents moved into the More sheet. Desktop pill (FooterNav) untouched.
  - **Home section headers** now use the small uppercase label style the rest of
    the app uses (ORDERS / ACTIVE QUOTATIONS / TO DO), not `text-lg` headings.
  - **Left for the owner** (needs a spec, so deferred): the "···" overflow menu
    the frames show on the detail/compose headers (C2/D2/B4/B2) — a real
    edit/archive menu, not a visual tweak; `ScreenHeader` has no trailing slot
    yet.

## Theming — system default + per-org brand (2026-08-06)

**Requires a Clerk dashboard change to take effect.** Add a session-token
custom claim `brand_color` ← `{{org.public_metadata.brand_color}}` under
"Customize session token", same mechanism as `internal_user_id`. Without it
`resolveBrandColor()` always falls back to the `ember` default — the app works,
it just can't see an org's choice. (Fallback if that proves awkward: fetch the
org via `clerkClient()` in `app/dashboard/layout.tsx`, at one extra API call
per dashboard render.)

How it flows: claim → `resolveBrandColor()` (`app/lib/theme/brand.ts`) →
`brandCssText()` → `<BrandStyle />`, rendered in `app/dashboard/layout.tsx`
(which already awaits `resolveTenant()`, so it costs no extra round trip and
the root layout stays org-free — `/` and `/auth/signin` pay no auth cost).

Three cascade rules the injection depends on, each a real footgun:
1. It must be a `<style>` **element**, never a `style=""` attribute — an inline
   declaration outranks every selector, so `.dark` could never override
   `:root` and the brand would be stuck at its light value.
2. The block is **unlayered**, so it outranks `globals.css`'s `@layer base`
   tokens regardless of source order.
3. `.dark` must come **after** `:root` — equal specificity on the same
   `<html>`, so source order decides. Verified in-browser, and asserted in
   `app/lib/theme/brand-presets.test.ts`.

Brand reach is deliberately narrow: `--primary`, `--primary-foreground`,
`--accent`, `--accent-foreground`, `--ring`. Surfaces, `--status-*`, `--chart-*`
and the `opt-*` palette stay neutral and fixed. `--accent` was full-saturation
brand orange and is consumed as the **hover surface** by 13 shadcn primitives,
so every menu hover was a saturated block; it is now a low-chroma brand tint.

Owner-only writes go through `PATCH /api/organization` with a `brand_color`
key, which routes to Clerk rather than the row — the same "one endpoint, three
destinations" shape `onboarding_completed` already established. The response
echoes the id so the client can repaint before the session token refreshes
(~1 min), via `app/components/theme/apply-brand.ts`.

**Light-mode remediation was scoped to the live v2 surface only.** Of 1,409
hardcoded colour occurrences across 182 files, ~930 sit in modules that are
dark until their cutovers (invoices, expenses, materials, analytics, tasks,
the legacy settings tabs) and will be rewritten then — fixing them now is
throwaway work. They are deliberately untouched and light mode will look wrong
there until each module migrates. Status chips across the live surface now read
from `app/lib/fields/colors.ts`, the existing contrast-verified palette.

Known-and-accepted leftovers on the live surface: overlay scrims stay
`bg-black/50-80` (shadcn's own convention, correct on both canvases), and the
decorative category dots in `context-menu.tsx` sit inside the notifications and
search menus, both `disabled: true` in the nav.

New org settings surface at `/dashboard/organization` — brand picker (owner
only; staff sees it read-only) plus a working theme preference. It does **not**
extend `/dashboard/settings`, which is legacy throughout: it reads and writes
`public.user_settings` through the Supabase browser client (no session since
the Clerk cutover) and its Save button has no handler. The `identity` / `tax` /
`documents` blocks flagged below belong on this new page.

## Follow-up backlog (acknowledged, deliberately deferred)

~~Item add/edit/remove on existing orders~~ (done 2026-08-10 with B4);
org settings editor (order statuses,
currency → needs `PATCH /api/organization`); ~~order detail editing (date,
client, custom_data)~~ (custom_data and status now editable on B4; **date and
client are still not** — the hub renders them read-only in its header);
searchable comboboxes for client/product pickers at
scale; attachments; payment/note edit+delete (**`/api/notes` and the payments
route are still POST-only, which is why B4 draws no remove on either**);
currency-aware `formatCurrency`;
~~documents "issue" action~~ (done 2026-08-10 — B7) + per-row quick-invoice
sheet (that one is F2); order-page metrics **and Home's "sales this month" card**
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
