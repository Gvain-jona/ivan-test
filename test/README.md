# Testing

`npm test` runs the suite once (Vitest); `npm run test:watch` watches.
Config: `vitest.config.ts` (node environment, aliases mirror
`tsconfig.json` paths — keep the two in sync).

## The layer model

Tests are organized around what they can prove, so the suite grows with
the platform instead of being rebuilt per module:

| Layer | Status | What it proves | Where |
|---|---|---|---|
| **1. Unit** | ✅ live | Pure logic, no framework — e.g. the `TenantDb` scoping wrapper | colocated `*.test.ts` next to the source |
| **2. Route contracts** | ✅ live | Each API route's auth gate, validation, role gates, org-scoped data flow, response shape | colocated `route.test.ts` next to each `route.ts` |
| **3. DB integration** | ⛔ blocked | Triggers, RPCs, generated columns against real Postgres | Blocked: the `v2` schema is owned DB-side and is **not** reproducible from `supabase/migrations/`. Needs a schema dump from the DB owner; then a project against local Supabase can be added. |
| **4. E2E (browser)** | 🔲 future | Full flows through the UI | Playwright, once a playground org exists (STATE.md testing stance: never against live tenant data) |

## How layer 2 works (the pattern every new module copies)

Route handlers are plain functions — import them, mock the tenant
boundary, assert. The only thing mocked is `resolveTenant()`; it
returns a `TenantContext` whose `db` is a programmable fake
(`test/helpers/fake-tenant.ts`) that mirrors the `TenantDb` interface
and records every call.

```ts
import { vi } from 'vitest'
import { GET } from './route'
import { createFakeTenant } from '@/test/helpers/fake-tenant'
import { getRequest } from '@/test/helpers/http'
import { resolveTenant } from '@/lib/auth/tenant'

vi.mock('@/lib/auth/tenant', () => ({ resolveTenant: vi.fn() }))
const resolveTenantMock = vi.mocked(resolveTenant)

it('lists things', async () => {
  const { tenant, db } = createFakeTenant()
  resolveTenantMock.mockResolvedValue(tenant)
  db.queue('select:things', { data: [{ id: 't-1' }], count: 1 })

  const res = await GET(getRequest('/api/things'))

  expect(res.status).toBe(200)
  expect(db.callsFor('select:things')[0].filters).toContainEqual(['eq', 'status', 'active'])
})
```

Helpers:

- `createFakeTenant({ userId?, organizationId?, orgRole? })` →
  `{ tenant, db }`. Program results with
  `db.queue('<op>:<table>', { data, error, count })`
  (`select:orders`, `insert:payments`, `delete:order_items`,
  `rpc:next_number`, `select:organization`); unqueued calls resolve
  empty. Inspect with
  `db.calls` / `db.callsFor(key)` — filters, modifiers, payloads,
  single/maybeSingle. The fake **throws** if a route passes
  `organization_id` to an insert (that's the accessor's job).
- `getRequest(path, params?)`, `jsonRequest(path, body, method?)`,
  `routeParams({ id })` in `test/helpers/http.ts`.

**When a module migrates to v2** (expenses, materials, …), its new
routes get a `route.test.ts` on this pattern in the same PR — minimum:
401 unauthenticated, 400 invalid body, any role gate, and the success
shape.

## Type-level enforcement

`test/types/tenant-scoping.ts` pins the tenant boundary at the type
level with `@ts-expect-error` assertions (no delete on entity tables —
`order_items` is the one `HardDeletableTable` exception — no smuggled
`organization_id`, no raw client, no unscoped tables). It runs under
`npx tsc --noEmit` and `next build` — not Vitest — so a regression
breaks the build itself. Extend it when `TenantDb` gains surface.

## Adding UI tests later

The config is node-only today. For component/hook tests, add a jsdom
project to `vitest.config.ts` (`npm i -D jsdom @testing-library/react`)
rather than switching the default environment — API tests must stay in
node.
