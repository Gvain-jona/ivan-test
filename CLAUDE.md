# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For a human-oriented setup guide (local dev, env vars, deployment), see `README.md` — it is accurate and actively maintained. This file focuses on conventions, gotchas, and ground truth that matter specifically for an AI assistant editing this code.

## Think before coding

Don't assume, and don't hide confusion. Before implementing:
- State assumptions explicitly rather than silently picking one.
- If multiple reasonable interpretations exist, present them instead of guessing.
- If a simpler approach exists than the one implied by the request, say so — push back when warranted.
- If something is genuinely unclear, stop and name what's confusing rather than coding around it.

## Project Overview

A business management platform for print shops, being rebuilt **multi-tenant** against the `v2` Postgres schema — orders, clients, products, and an org-defined custom-field registry are migrated; expenses, material purchases, invoicing, and analytics still run on the legacy single-shop (`public`-schema) code until their cutovers. "Ivan Prints" is the first tenant, not the product — never design around it. Next.js 15 (App Router) + TypeScript + Supabase (Postgres + Auth, Clerk planned) + Shadcn UI.

**Before working on anything migration-adjacent, read `docs/v2-migration/STATE.md`** — it is the live record of what's decided (don't relitigate), what's migrated, what's blocked on whom, and the v2 value differences that are easy to trip on. Update it when your work changes any of that.

## Key Development Commands

```bash
npm run dev              # Dev server with Turbo (recommended)
npm run dev:normal       # Dev server without Turbo
npm run build            # Production build
npm run build:prod       # Production build with NODE_ENV=production
npm run lint              # ESLint
npm run format           # Prettier --write
npm run clean:dev        # Clean build artifacts, reinstall, restart dev server
```

```bash
npm run supabase:start   # Start local Supabase (requires Docker)
npm run supabase:seed    # Reset local DB and seed test data
npm run env:local        # Point .env at local Supabase
npm run env:cloud        # Point .env at cloud Supabase
npm run dev:local         # env:local + dev
npm run dev:cloud        # env:cloud + dev
npm run ui:add <name>    # Add a Shadcn component, e.g. npm run ui:add dialog
```

**Tests exist (Vitest) — `npm test` runs them.** The suite covers the v2 platform slice: unit tests for the `TenantDb` scoping wrapper and route contract tests for every migrated API route (auth gate, validation, role gates, org-scoped data flow) via a fake tenant DB — see `test/README.md` for the layer model and the pattern every newly migrated module must copy (its routes get a colocated `route.test.ts` in the same PR). Type-level tenancy enforcement lives in `test/types/tenant-scoping.ts` (`@ts-expect-error` assertions run by `tsc --noEmit`/`next build`, not Vitest). There is no DB-integration or browser layer yet (v2 schema isn't locally reproducible; blocked on a DB-owner schema dump). `tests/javascript/*.js` and `tests/powershell/*.ps1` are unrelated one-off manual scripts, not part of the suite. Validate changes with `npm test`, `npx tsc --noEmit`, `npm run lint`, and manual exercise of the feature.

## Project Structure

```
app/
├── api/                 # Route handlers, one folder per resource (orders, expenses, ...)
├── auth/                # Auth routes: callback, confirm, verify, signin (plain folder, NOT a (auth) route group)
├── dashboard/           # Protected pages (plain folder, NOT a (dashboard) route group)
├── components/          # ui/ (Shadcn base), then one folder per feature
├── context/             # React contexts (Auth, Settings, Notifications, DropdownCache)
├── hooks/               # SWR data-fetching hooks, one folder per feature
├── lib/                 # Core utilities: api/, auth/, cache/, services/, supabase/, validation/
├── schemas/             # Shared Zod schemas
├── types/               # TypeScript types — see "Database types" below for the canonical file
└── utils/               # Helpers, including utils/supabase/ (the real Supabase client factories)

supabase/migrations/      # SQL migrations, applied in filename order
docs/code-review/        # Living architecture/security audit — see "Known debt" below
docs/v2-migration/       # STATE.md — live status of the v2 platform pivot (read first)
```

The route groups described in older docs/templates (`(auth)`, `(dashboard)`) do **not** exist in this codebase — `app/auth/` and `app/dashboard/` are ordinary folders.

## Gotchas: duplicate/dead files

This codebase accumulated parallel implementations during rapid iteration. When touching these areas, use the file named here — the others are dead leftovers, not alternatives to pick from:

- **Middleware — two files exist, only one runs.** Next.js only executes `middleware.ts` at the **project root**. That file (`/middleware.ts`) calls `updateSession()` and redirects unauthenticated users to `/auth/signin`. There is also `app/middleware.ts`, which Next.js never invokes — it's dead code, and its comments are actively misleading (it claims "No Authentication Required" and redirects auth routes away, the opposite of what actually runs). Don't edit `app/middleware.ts` expecting it to affect routing; don't trust its comments as a description of current auth behavior.
- **Supabase client factories — use the `utils/supabase/*` ones.** `app/utils/supabase/{client,server,middleware}.ts` are canonical and used everywhere (84+ imports of `@/utils/supabase/server`). Both `client.ts` and `server.ts` correctly use `getAll`/`setAll` cookie methods.
- **Database types — `app/types/supabase.ts` is canonical.** It's the ~2500-line auto-generated `Database` type from `supabase gen types`. `app/types/database.types.ts`, `app/types/database.ts`, and `app/lib/database.types.ts` are unused leftovers (0 live imports) — don't import from them or "fix" them, they're not wired to anything.
- **No `requireAuth()` helper exists.** Despite what older docs implied, every route inlines the auth check (see pattern below). If you're tempted to add a shared helper, check `docs/code-review/AUDIT_PROGRESS.md` first — this has likely already been discussed.

## Key Patterns

There are **two route patterns in the codebase** — which one applies depends on whether the module has been migrated to v2 (see `docs/v2-migration/STATE.md` for the module list). New platform work uses the migrated pattern; don't "modernize" a legacy route ahead of its module's cutover.

**Migrated (v2) API route** (orders, clients, products, field-definitions, notes, organization):
```typescript
const tenant = await resolveTenant() // from '@/lib/auth/tenant'
if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required')

const parsed = Schema.safeParse(await request.json()) // schemas in app/lib/api/validators.ts
if (!parsed.success) return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten())

const { data, error } = await tenant.db
  .from('orders')
  .select('id, status, total_amount') // explicit columns, not select('*')
  .eq('organization_id', tenant.organizationId) // REQUIRED: tenant.db is service-role, this IS the tenant boundary
if (error) return handleSupabaseError(error)
```
`tenant.db` bypasses RLS — **every query must filter by `tenant.organizationId` explicitly.** `resolveTenant()` is also the single swap point for the planned Clerk auth.

**Legacy API route** (unmigrated modules — expenses, materials, accounts, invoicing, analytics):
```typescript
const supabase = await createClient() // from '@/utils/supabase/server'
const { data: { user } } = await supabase.auth.getUser()
if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required')
// ...safeParse, explicit-column select, handleSupabaseError as above
```

`handleApiError`, `handleSupabaseError`, and `handleUnexpectedError` live in `app/lib/api/error-handler.ts`. `handleSupabaseError` maps known Postgres codes (`23505`, `42501`, `PGRST116`, `P0001` from the v2 field-validation trigger, FK/check constraint messages) to the right HTTP status — extend it there rather than handling Postgres codes ad hoc in a route.

**SWR data hooks**: client hooks live under `app/hooks/<feature>/`. Migrated modules build keys and fetch via `app/lib/api/client.ts` (`PLATFORM_API`, `buildKey`, `apiFetcher`, `keysUnder`) and expose a `use<Entity>Mutations()` hook that revalidates its own keys. Legacy modules use `app/lib/cache-keys.ts` + `app/lib/api-endpoints.ts` and invalidate via the helpers in `app/lib/cache/` — keep each module on its own convention.

**Validation**: migrated-module schemas live in `app/lib/api/validators.ts`; legacy schemas in `app/schemas/` or `app/lib/<feature>/validators.ts`. Always `safeParse` — avoid `as { field: type }` casts on request bodies. For v2 `custom_data`, the app schema is deliberately loose: the DB trigger (`validate_custom_data`) is the validation authority, and its P0001 message is surfaced verbatim.

**Component structure**: props interface at the top, single responsibility, complex logic extracted to a hook. New files should target well under 200 lines — but `max-lines` in `.eslintrc.json` is a **warning, not a build-blocking error**, and it is widely exceeded today (`MaterialPurchaseForm.tsx` is 1293 lines, `AccountsSettingsTab.tsx` 1124, `analytics-service.ts` 929). Don't assume a file under that size is "fine" or one over it is "broken" — use it as guidance for new/refactored code, not as a correctness signal for existing files.

**New UI components — log responsiveness status**: when you create a new component under `app/components/` (or anywhere else in `app/`), add one row to `docs/mobile-responsiveness/COMPONENT_REGISTRY.md` — just the component name/path and a `Yes` / `No` / `Partial` on whether it holds up across breakpoints (~375px phone through desktop). This is a visibility log, not a gate: a `No` is a perfectly valid entry. It does not require fixing the component, does not block the work, and isn't a request for a write-up — one line is enough. The point is being able to see how much of the app actually scales as it grows, not enforcing that every component must.

## Mobile UX & overlays — guardrails (read before UI work)

Hard-won rules from the mobile refinement pass; follow them so the same mishaps don't recur. Rationale/details in `docs/mobile-responsiveness/{DESIGN_PHILOSOPHY,INTERACTION_AUDIT}.md`.

- **Two products, shared modules.** Mobile is feed-first (Home is **mobile-only**, `lg:hidden`; desktop lands on Orders); desktop is module-pages + chrome (`TopHeader` is **desktop-only**). Don't converge them; don't put desktop chrome on mobile.
- **One sheet, one door.** Every overlay uses the `OrderSheet` primitive (`vaul`; bottom sheet on mobile / right panel on desktop) and opens via the sheet host — `useSheets()` (`openCreateOrder()`, `openOrder(id)`, …). **Never navigate to another page to pop a modal**, never re-implement open/close state, never hand-roll a new sheet/dialog.
- **Every signifier is wired.** A grab handle means the sheet drags; a leading icon means the action it depicts; the close **X is desktop-only** (mobile dismisses via drag / backdrop / Back). If you can't wire an affordance, don't show it.
- **Theme tokens, never hardcoded colors.** `text-foreground` / `border-border` / `bg-primary`, not `text-white` / `#2B2B40` / `orange-500` — screens must hold in light *and* dark. The theme now follows the OS (`defaultTheme="system"`), so light mode is a real surface, not a hypothetical. Two things to know before picking a token:
  - **`--primary` / `--primary-foreground` / `--accent` / `--accent-foreground` / `--ring` belong to the organization**, not to the codebase — they are overridden per tenant at runtime (`app/lib/theme/brand-presets.ts`, injected by `app/components/theme/BrandStyle.tsx`). Never assume the brand is orange, never pair `bg-primary` with a literal `text-white`, and never mix `--primary` with a palette colour in a gradient. Everything else — surfaces, `--status-*`, `--chart-*`, `opt-*` — is fixed.
  - **For a coloured chip or status pill, use `app/lib/fields/colors.ts`** (`OPTION_COLORS[...].chip` / `.dot`), not a hand-rolled `bg-x-500/15 text-x-400` pair. Those pairs carry measured AA contrast in both themes; hand-rolled ones were the single most common light-mode break. Legitimate exceptions: modal/drawer scrims stay `bg-black/50-80`, and PDF/print stylesheets stay fixed light (paper is always white).
- **Light mode is only fixed on the live v2 surface.** The dark legacy modules (invoices, expenses, materials, analytics, tasks, legacy settings tabs) still hold ~930 hardcoded colors and will look wrong in light mode until their cutovers. That is deliberate — don't "fix" one in passing; tokenize it as part of its migration.
- **No unlayered `globals.css` rule may set `display`/`position`/`visibility` on an element that also carries Tailwind utilities** — it silently overrides the utility (CSS-01 in `docs/code-review/AUDIT_PROGRESS.md`). Prefer the utility, or `@layer components`.
- **Missing module/data → scaffold + track, don't fake.** Build the UI, mark interim data `TODO(v2 read layer)`, and log it in `docs/v2-migration/STATE.md`.

## v2 platform migration — naming convention

The app is being rebuilt module-by-module against the multi-tenant `v2` Postgres schema (orders first). **Status, decisions, and blockers live in `docs/v2-migration/STATE.md`** — this section is only the naming rules:

- **"v2" appears ONLY in identifiers that literally reference the DB schema**: `.schema('v2')`, `DatabaseV2` (`app/types/supabase-v2.ts`), and the `createV2Client`/`createV2AdminClient` factories (`app/utils/supabase/{server,client}-v2.ts`). Nothing else — no `v2` folders, hooks, components, types, URL segments, or UI copy. New platform code takes plain domain names (`app/hooks/orders/useOrders.ts`, `app/components/fields/`, `app/lib/auth/tenant.ts`, `app/lib/api/{client,validators}.ts`).
- **Git is the archive, not the file tree.** Legacy files are deleted at their module's cutover, not kept alongside; rewind via git if ever needed. Do not create parallel copies of components/hooks "just in case".
- **Deletion is per-module at cutover, not global**: modules not yet migrated (expenses, materials, accounts, invoicing, analytics) keep their legacy code fully working against the `public` schema until their turn. Never delete a legacy file that a still-unmigrated module imports.
- API paths are plain (`/api/orders`, …): the migrated-module routes replaced their legacy counterparts in place at the orders cutover; new module routes take plain paths directly.

## Known architecture debt

`docs/code-review/AUDIT_PROGRESS.md` is the live tracker (security, error-handling, dependency findings with ✅ FIXED / ⏸ DEFERRED / 🔲 OPEN status and commit hashes) — check it before assuming an issue is unaddressed or before re-auditing something already covered. Two items are explicitly deferred and flagged "do before first external user access":
- **SEC-05**: no ownership/IDOR check on `[id]` resource routes — relies on RLS only.
- **SEC-11**: `allowed_emails` RLS policy lets any authenticated user read the full access-control list.

Other docs under `docs/` (e.g. `docs/index.md`, dated April 2025) are historical and stale — don't treat their dates or content as current state. `docs/code-review/` (dated June 2026) and `README.md` reflect the actual current architecture.

## Authentication

**Identity is Clerk** (since 2026-07-17, branch `clerk-auth-transition`): root `middleware.ts` is `clerkMiddleware()` and redirects unauthenticated requests (except `/auth/*` and `/api/healthz`) to the Clerk `<SignIn />` page at `/auth/signin`; v2 API routes additionally check auth via `resolveTenant()` themselves (defense in depth — don't remove the route-level check because middleware "already handles it"). Sign-in methods (Google + email code) and sign-up restriction (invite-only, replacing the old `allowed_emails` table) are Clerk-dashboard config, not code. The old Supabase-auth routes (`/auth/callback` etc.), magic-link flow, and `app/lib/auth/{session-utils,profile-utils,authorization}.ts` were deleted at the auth cutover.

**Session-token custom claims** are Clerk-dashboard config ("Customize session token"), not code, and both are typed in `types/globals.d.ts`: `internal_user_id` ← `{{user.public_metadata.internal_user_id}}` and `brand_color` ← `{{org.public_metadata.brand_color}}`. Adding a claim in code alone does nothing until it is added in the dashboard too. Claims are untrusted input — narrow them (`isBrandPresetId`, the UUID regex in `tenant.ts`) rather than trusting the value.

**User ids**: the app-facing user id is the `internal_user_id` **UUID claim** on the Clerk session token (set from `public_metadata.internal_user_id`, typed in `types/globals.d.ts`) — never use the raw Clerk `user_…` id against the DB. Existing users carry their pre-Clerk `auth.users` UUID, so `v2.organization_members` rows still match. `scripts/clerk-backfill.js` provisions this metadata. A signed-in user without the claim has no tenancy (v2 routes 401).

**Roles**: legacy `profiles` roles are dead (the client `useAuth()` façade in `app/context/auth-context.tsx` hard-codes `isAdmin`/`isManager` to false); v2 org roles live on `organization_members` and reach routes as `tenant.orgRole`. Currently just **`owner`/`staff`** — no `admin`, no `manager`. `admin` was deliberately dropped (2026-07-24): Clerk's free plan gives 2 free custom org roles before requiring the paid B2B add-on, and Clerk's own built-in `org:admin`/`org:member` don't match this app's role semantics, so the model was trimmed to fit rather than pay for a third custom role. Re-add `admin` as a custom Clerk role + in `app/lib/auth/tenant.ts`'s `OrgRole` type together if a middle tier becomes necessary.

**Legacy modules are dark**: expenses, materials, accounts, invoicing, and analytics depended on the Supabase session and are non-functional until their v2 cutovers (explicit decision — don't "fix" a legacy route's auth ad hoc; migrate the module).

**v2 tenancy** (until the RLS flip): `resolveTenant()` takes identity from Clerk, resolves the active org via `organization_members`, and returns the service-role-backed `TenantDb` — tenant isolation is the constructed `organization_id` scoping, not RLS. Phase 2 (Supabase third-party auth + v2 RLS + dropping the `create_order_as_org` shim) changes only `resolveTenant()` — see `docs/v2-migration/STATE.md`.

## Environment Configuration

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (server-only; build tolerates their absence but nothing can sign in without them). Also used: `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `CRON_SECRET` (validated against `Authorization: Bearer <CRON_SECRET>` in `app/api/cron/*` routes — don't loosen that check to a format-only check), `CLERK_WEBHOOK_SIGNING_SECRET` (server-only; verifies deliveries to `app/api/webhooks/clerk`, the Clerk-Organizations-to-`v2` sync — see `docs/v2-migration/STATE.md` Phase 1.5). `npm run env:local`/`env:cloud` swap which Supabase project `.env.local` points at.

## Working with the Database

1. Add migration under `supabase/migrations/<timestamp>_description.sql`, including RLS policies for every role that needs access.
2. Regenerate types: `npx supabase gen types typescript --local > app/types/supabase.ts` (note: README's older instructions reference `app/lib/database.types.ts` — that file is dead; regenerate into `app/types/supabase.ts`, the file actually imported as `Database`).
3. Test locally against `npm run supabase:seed` before pushing to cloud.

**v2 schema types are different**: `app/types/supabase-v2.ts` (`DatabaseV2`) is **hand-maintained** from live introspection of the v2 project — the gen-types command above only regenerates the legacy `public`-schema `Database` type and must not overwrite `supabase-v2.ts`. When the v2 schema changes, update `DatabaseV2` by hand to match. The v2 schema itself is owned DB-side; the repo's `supabase/migrations/` only mirrors app-requested v2 changes (e.g. the `create_order_as_org` shim), not the schema's own history.

**Verify against the live schema, not against a doc.** The v2 project (`giwurfpxxktfsdyitgvr`) is directly queryable through the Supabase MCP server, and function bodies are the ground truth for what a write path accepts:

```sql
select p.proname, p.prosrc from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'v2' and p.proname = 'create_order';
```

This is not optional diligence — `docs/v2-migration/orders-system-handoff.md` reads as authoritative and is stale in three places, and trusting it has already shipped two bugs (a route querying dropped columns; a validator that rejected the one payment field `create_order` stores and accepted the one it discards). A column diff is not enough either: duplicate function overloads and over-broad `SECURITY DEFINER` grants are invisible to one, and both have bitten here. Before encoding any claim about what a function accepts or a trigger enforces, read it.

**Applying schema changes is a decision, not a step.** Additive, mechanical changes (a column, a widened CHECK, a trigger registration) can be applied directly and mirrored into `supabase/migrations/`. Anything touching money — `recompute_order_totals`, `issue_document`, `validate_payment_allocation` — needs the owner's explicit go-ahead; those functions decide what a document says it's owed. Open asks live in `docs/v2-migration/DB_ASKS.md`.

**Check these three before writing any migration** — each was caught in review after being written wrong, and none is visible in a diff of the SQL alone:

1. **`CREATE OR REPLACE FUNCTION` resets attributes you don't restate.** Every `v2` function carries `set search_path = ''` (hardened in `20260725164737`). Replace one without restating it and the hardening is silently gone. **Parameter defaults count too, and are the easy one to miss** — `pg_get_function_identity_arguments()` does not show them, so copying its output into your `CREATE OR REPLACE` silently drops the default. Postgres refuses that particular case ("cannot remove parameter defaults from existing function"), but it will not save you on `search_path`. Use the query that shows everything:
   ```sql
   select proname, prosecdef, provolatile, proconfig,
          pg_get_function_arguments(oid) as args
   from pg_proc where pronamespace = 'v2'::regnamespace and proname = '…';
   ```
   Ownership and grants *are* preserved by `REPLACE`, so those need no restating.
2. **New functions get `PUBLIC EXECUTE` by default.** This project has been bitten twice (`provision_organization`, `next_number` — both take an org id as an *argument*). A new function that writes is a new hole.
3. **Prefer a trigger function over a callable helper for writes.** Trigger functions reject direct invocation ("trigger functions can only be called as triggers"), so the surface doesn't exist. A standalone `do_the_write(uuid)` helper can't be locked down usefully — the trigger path needs `EXECUTE` anyway, so `authenticated` ends up holding it.

## Deployment

Vercel, auto-deploys on push to `main`. `next.config.js` has `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false` — both type errors and lint errors currently fail the build (this was tightened after a recent push to zero out ~969 TypeScript errors; don't loosen it back to `true` to unblock a build, fix the underlying error instead).
