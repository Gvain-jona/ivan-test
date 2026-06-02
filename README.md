# Ivan Prints — Business Management System

A full-stack business management platform for a print shop. Manages orders, expenses, material purchases, invoicing, and analytics with role-based access control.

**Stack:** Next.js 15 · TypeScript · Supabase (PostgreSQL + Auth) · Shadcn UI · TailwindCSS · SWR · Zod

---

## Features

| Module | Description |
|--------|-------------|
| **Orders** | Create, track, and invoice print orders. Supports items, payments, notes, and status workflow |
| **Expenses** | Record one-off and recurring expenses. Payment tracking with partial-payment support |
| **Materials** | Track material purchases from suppliers. Installment plans and payment history |
| **Analytics** | Revenue, profit, cash flow, client retention, and expense ratio reports |
| **Invoicing** | Generate and send branded PDF invoices from orders |
| **Notifications** | Real-time in-app notifications via Supabase Realtime |
| **Settings** | App configuration, announcement banners, invoice templates |
| **RBAC** | Three roles: `admin`, `manager`, `staff` with per-feature permissions |

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 18 | [nvm](https://github.com/nvm-sh/nvm) recommended |
| npm | ≥ 9 | Comes with Node |
| Supabase CLI | ≥ 2.x | `npm install -g supabase` |
| Docker | Any | Required for local Supabase |
| Git | Any | |

---

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/Gvain-jona/ivan-test.git
cd ivan-test
npm install
```

### 2. Configure environment variables

```bash
cp .env.template .env.local
```

Open `.env.local` and fill in all required values (see `.env.template` for descriptions):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SENTRY_DSN=...   # optional in dev
CRON_SECRET=...              # optional in dev
```

### 3. Start local Supabase

```bash
# Start Docker first, then:
npx supabase start

# Reset DB and seed with test data:
npm run supabase:seed

# Check Supabase is running:
npx supabase status
```

The seed creates test users for each role:
- `admin@test.com` / password: `test123`
- `manager@test.com` / password: `test123`
- `staff@test.com` / password: `test123`

### 4. Start the development server

```bash
npm run dev        # with Turbo (recommended, faster HMR)
npm run dev:normal # without Turbo
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server (Turbo)
npm run build            # Production build
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Database
npm run supabase:seed    # Reset DB + seed test data
npm run env:local        # Switch .env to local Supabase
npm run env:cloud        # Switch .env to cloud Supabase

# UI Components (Shadcn)
npm run ui:add <name>    # Add a Shadcn component, e.g. npm run ui:add dialog
```

---

## Project Structure

```
ivan-test/
├── app/
│   ├── api/                    # REST API route handlers (Next.js App Router)
│   │   ├── orders/             # /api/orders and /api/orders/[id]/**
│   │   ├── expenses/           # /api/expenses and /api/expenses/[id]/**
│   │   ├── material-purchases/ # /api/material-purchases/**
│   │   ├── analytics/          # /api/analytics/** (summary, revenue, profit…)
│   │   ├── invoices/           # /api/invoices/**
│   │   ├── settings/           # /api/settings/**
│   │   └── cron/               # Background job endpoints
│   │
│   ├── auth/                   # Auth route handlers (callback, confirm, verify)
│   │
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # Base Shadcn components (button, input, dialog…)
│   │   ├── orders/             # Order-specific components
│   │   ├── materials/          # Material-specific components
│   │   ├── analytics/          # Chart and KPI components
│   │   ├── navigation/         # SideNav, TopHeader, FooterNav
│   │   └── notifications/      # Notification drawer and indicators
│   │
│   ├── context/                # React contexts (Auth, Settings, Notifications)
│   │
│   ├── dashboard/              # Page components (Next.js App Router pages)
│   │   ├── home/               # Dashboard home with KPIs
│   │   ├── orders/             # Orders list + view
│   │   ├── expenses/           # Expenses list + view
│   │   ├── material-purchases/ # Materials list + view
│   │   ├── analytics/          # Analytics dashboards
│   │   ├── settings/           # Settings pages
│   │   └── profile/            # User profile
│   │
│   ├── features/
│   │   └── invoices/           # Invoice feature (context, hooks, templates, utils)
│   │
│   ├── hooks/                  # Custom SWR data-fetching hooks
│   │   ├── orders/             # useOrdersList, useOrderDetail…
│   │   ├── expenses/           # useExpensesList, useRecurringExpenses…
│   │   ├── materials/          # useMaterialPurchasesList, useMaterialDetail…
│   │   └── analytics/          # useAnalyticsSummary, useRevenue…
│   │
│   ├── lib/                    # Core utilities and services
│   │   ├── api/                # API error handler, response handler
│   │   ├── auth/               # Auth utilities, session, authorization
│   │   ├── cache/              # SWR cache utilities and constants
│   │   ├── orders/             # Order-specific validators (Zod schemas)
│   │   ├── services/           # Business logic services (analytics, audit)
│   │   ├── supabase/           # Supabase client factories (client, server, storage)
│   │   ├── api-endpoints.ts    # Centralized API URL constants
│   │   ├── cache-keys.ts       # SWR cache key builders
│   │   ├── database.types.ts   # Auto-generated Supabase type definitions
│   │   └── swr-config.ts       # SWR global configuration
│   │
│   ├── schemas/                # Shared Zod validation schemas
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # General utility functions
│
├── supabase/
│   ├── migrations/             # Database migrations (run in order)
│   ├── functions/              # Supabase Edge Functions
│   └── seed.sql                # Seed data for local development
│
├── docs/
│   └── code-review/            # Review reports and guides
│
├── scripts/                    # Node.js utility scripts (env switching, deploy)
├── middleware.ts               # Next.js middleware (auth session refresh)
├── next.config.js              # Next.js configuration
└── .env.template               # Environment variable template (safe to commit)
```

---

## Data Flow

```
Browser
  │
  ├── SWR Hook (app/hooks/**) ─────────────────────► /api/** Route Handler
  │      │                                                  │
  │   Cache (SWR)                                    Supabase Server Client
  │      │                                                  │
  │   Component                                       PostgreSQL (RLS enforced)
  │
  └── Server Component ─────────────────────────────► Supabase Server Client
                                                              │
                                                       PostgreSQL (RLS enforced)
```

All database access goes through Supabase. Row-Level Security (RLS) is the last line of defense — every table has policies that restrict access by `auth.uid()` and role.

---

## Authentication Flow

```
User enters email
       │
       ▼
Magic link sent by Supabase
       │
       ▼
/auth/callback (exchanges code for session)
       │
       ▼
AuthProvider initializes (auth-context.tsx)
       │
       ├── Fetch profile from `profiles` table
       ├── Check role (admin / manager / staff)
       └── Redirect to /dashboard/orders
```

Access is restricted to emails listed in the `allowed_emails` table. New users must be added there before they can sign in.

---

## Adding a New Feature

### New API endpoint

1. Create `app/api/<feature>/route.ts`
2. Add auth check: `const { data: { user } } = await supabase.auth.getUser()`
3. Add Zod schema in `app/schemas/<feature>.ts` or `app/lib/<feature>/validators.ts`
4. Validate: `const parsed = Schema.safeParse(await request.json())`
5. Use `handleApiError` and `handleSupabaseError` from `@/lib/api/error-handler`
6. Add endpoint constant to `app/lib/api-endpoints.ts`

### New page

1. Create `app/dashboard/<feature>/page.tsx`
2. Add route to `SideNav` navigation array (`app/components/navigation/SideNav.tsx`)
3. Add `loading.tsx` next to `page.tsx` with skeleton
4. Create a SWR hook in `app/hooks/<feature>/use<Feature>List.ts`

### New database table

1. Create migration: `supabase/migrations/<timestamp>_add_<table>.sql`
2. Add RLS policies (SELECT, INSERT, UPDATE, DELETE per role)
3. Regenerate types: `npx supabase gen types typescript --local > app/lib/database.types.ts`
4. Update `app/types/` with derived TypeScript interfaces if needed

---

## Coding Standards

- **File size:** 200 lines maximum. Split larger files.
- **Validation:** All API inputs validated with Zod. No `as { field: type }` casts.
- **Auth:** Always call `supabase.auth.getUser()` server-side. Never trust client-sent user IDs.
- **Types:** Use `database.types.ts` row types. Avoid `any`.
- **Logging:** No `console.log` in production. Use `console.error` for actual errors.
- **Hooks:** Follow Rules of Hooks. Never call hooks inside conditions or callbacks.
- **Components:** One responsibility per component. Extract logic to custom hooks.
- **Supabase client:**
  - Server components/routes: `import { createClient } from '@/utils/supabase/server'`
  - Client components: `import { createClient } from '@/utils/supabase/client'`

---

## Deployment

The app is deployed on Vercel. Production environment variables are set in the Vercel project settings.

```bash
# Manual production build (test locally before deploying)
npm run build:prod

# Vercel deploys automatically on push to main
git push origin main
```

**Required Vercel environment variables** (match `.env.template`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `CRON_SECRET`

---

## Troubleshooting

**Auth loop / can't sign in locally**
```bash
npx supabase stop && npx supabase start
npm run supabase:seed
```

**Build fails with type errors**
```bash
npx tsc --noEmit 2>&1 | head -50
```
(Note: `next.config.js` has `ignoreBuildErrors: true` as a temporary workaround — the `tsc` check is authoritative.)

**SWR data not updating after mutation**
Check `app/lib/cache-utils.ts` — call `invalidateOrderCache(id)` (or the equivalent for your entity) after any create/update/delete.

**Supabase RLS error in API route**
The server client uses the user's session cookie. If you're getting permission errors, check that:
1. The RLS policy on the table allows the user's role
2. You're using `createClient()` from `@/utils/supabase/server` (not the browser client)

---

## License

Proprietary. All rights reserved. Not open for public use or redistribution.
