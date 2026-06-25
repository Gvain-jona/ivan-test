# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For a human-oriented setup guide (local dev, env vars, deployment), see `README.md` — it is accurate and actively maintained. This file focuses on conventions, gotchas, and ground truth that matter specifically for an AI assistant editing this code.

## Project Overview

Ivan Prints — a business management system for a print shop. Manages orders, expenses, material purchases, invoicing, and analytics with role-based access control (`admin` / `manager` / `staff`). Next.js 15 (App Router) + TypeScript + Supabase (Postgres + Auth) + Shadcn UI.

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

There is **no automated test suite**. `npm test` is a no-op (`echo "No tests specified"`). No jest/vitest/playwright config exists anywhere in the repo. `tests/javascript/*.js` and `tests/powershell/*.ps1` are one-off manual debug/seed scripts, not CI-run tests — don't assume changes are covered by them. Validate changes with `npx tsc --noEmit`, `npm run lint`, and manual exercise of the feature.

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
```

The route groups described in older docs/templates (`(auth)`, `(dashboard)`) do **not** exist in this codebase — `app/auth/` and `app/dashboard/` are ordinary folders.

## Gotchas: duplicate/dead files

This codebase accumulated parallel implementations during rapid iteration. When touching these areas, use the file named here — the others are dead leftovers, not alternatives to pick from:

- **Middleware — two files exist, only one runs.** Next.js only executes `middleware.ts` at the **project root**. That file (`/middleware.ts`) calls `updateSession()` and redirects unauthenticated users to `/auth/signin`. There is also `app/middleware.ts`, which Next.js never invokes — it's dead code, and its comments are actively misleading (it claims "No Authentication Required" and redirects auth routes away, the opposite of what actually runs). Don't edit `app/middleware.ts` expecting it to affect routing; don't trust its comments as a description of current auth behavior.
- **Supabase client factories — use the `utils/supabase/*` ones.** `app/utils/supabase/{client,server,middleware}.ts` are canonical and used everywhere (84+ imports of `@/utils/supabase/server`). Both `client.ts` and `server.ts` correctly use `getAll`/`setAll` cookie methods.
- **Database types — `app/types/supabase.ts` is canonical.** It's the ~2500-line auto-generated `Database` type from `supabase gen types`. `app/types/database.types.ts`, `app/types/database.ts`, and `app/lib/database.types.ts` are unused leftovers (0 live imports) — don't import from them or "fix" them, they're not wired to anything.
- **No `requireAuth()` helper exists.** Despite what older docs implied, every route inlines the auth check (see pattern below). If you're tempted to add a shared helper, check `docs/code-review/AUDIT_PROGRESS.md` first — this has likely already been discussed.

## Key Patterns

**API route auth + error handling** (this exact shape is used in essentially every route):
```typescript
const supabase = await createClient() // from '@/utils/supabase/server'
const { data: { user } } = await supabase.auth.getUser()
if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required')

const parsed = Schema.safeParse(await request.json())
if (!parsed.success) return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten())

const { data, error } = await supabase.from('orders').select('id, status, total_amount') // explicit columns, not select('*')
if (error) return handleSupabaseError(error)
```
`handleApiError`, `handleSupabaseError`, and `handleUnexpectedError` live in `app/lib/api/error-handler.ts`. `handleSupabaseError` maps known Postgres codes (`23505`, `42501`, `PGRST116`, FK/check constraint messages) to the right HTTP status — extend it there rather than handling Postgres codes ad hoc in a route.

**Supabase client creation**:
```typescript
// Server component / API route
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient()

// Client component
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
```

**SWR data hooks**: client hooks live under `app/hooks/<feature>/`, call `useSWR` with a key built from `app/lib/cache-keys.ts` and an endpoint constant from `app/lib/api-endpoints.ts` (`API_ENDPOINTS.ORDERS`, etc.). After a mutation, invalidate via the matching helper in `app/lib/cache/` (e.g. `invalidateOrderCache(id)`) rather than hand-rolling `mutate()` calls.

**Validation**: Zod schemas in `app/schemas/` or `app/lib/<feature>/validators.ts`, parsed with `safeParse` — avoid `as { field: type }` casts on request bodies.

**Component structure**: props interface at the top, single responsibility, complex logic extracted to a hook. New files should target well under 200 lines — but `max-lines` in `.eslintrc.json` is a **warning, not a build-blocking error**, and it is widely exceeded today (`MaterialPurchaseForm.tsx` is 1293 lines, `AccountsSettingsTab.tsx` 1124, `analytics-service.ts` 929). Don't assume a file under that size is "fine" or one over it is "broken" — use it as guidance for new/refactored code, not as a correctness signal for existing files.

**New UI components — log responsiveness status**: when you create a new component under `app/components/` (or anywhere else in `app/`), add one row to `docs/mobile-responsiveness/COMPONENT_REGISTRY.md` — just the component name/path and a `Yes` / `No` / `Partial` on whether it holds up across breakpoints (~375px phone through desktop). This is a visibility log, not a gate: a `No` is a perfectly valid entry. It does not require fixing the component, does not block the work, and isn't a request for a write-up — one line is enough. The point is being able to see how much of the app actually scales as it grows, not enforcing that every component must.

## Known architecture debt

`docs/code-review/AUDIT_PROGRESS.md` is the live tracker (security, error-handling, dependency findings with ✅ FIXED / ⏸ DEFERRED / 🔲 OPEN status and commit hashes) — check it before assuming an issue is unaddressed or before re-auditing something already covered. Two items are explicitly deferred and flagged "do before first external user access":
- **SEC-05**: no ownership/IDOR check on `[id]` resource routes — relies on RLS only.
- **SEC-11**: `allowed_emails` RLS policy lets any authenticated user read the full access-control list.

Other docs under `docs/` (e.g. `docs/index.md`, dated April 2025) are historical and stale — don't treat their dates or content as current state. `docs/code-review/` (dated June 2026) and `README.md` reflect the actual current architecture.

## Authentication

Real auth is enforced two ways: root `middleware.ts` redirects unauthenticated requests (except `/auth/*` and `/api/healthz`) to `/auth/signin`, and individual API routes additionally call `supabase.auth.getUser()` themselves (defense in depth — don't remove the route-level check because middleware "already handles it"). Sign-in is magic-link based; only emails present in the `allowed_emails` table can sign in. Roles (`admin`/`manager`/`staff`) live on the `profiles` table.

## Environment Configuration

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only). Also used: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `CRON_SECRET` (validated against `Authorization: Bearer <CRON_SECRET>` in `app/api/cron/*` routes — don't loosen that check to a format-only check). `npm run env:local`/`env:cloud` swap which Supabase project `.env.local` points at.

## Working with the Database

1. Add migration under `supabase/migrations/<timestamp>_description.sql`, including RLS policies for every role that needs access.
2. Regenerate types: `npx supabase gen types typescript --local > app/types/supabase.ts` (note: README's older instructions reference `app/lib/database.types.ts` — that file is dead; regenerate into `app/types/supabase.ts`, the file actually imported as `Database`).
3. Test locally against `npm run supabase:seed` before pushing to cloud.

## Deployment

Vercel, auto-deploys on push to `main`. `next.config.js` has `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false` — both type errors and lint errors currently fail the build (this was tightened after a recent push to zero out ~969 TypeScript errors; don't loosen it back to `true` to unblock a build, fix the underlying error instead).
