# Clerk absence — impact audit & hold recommendation

**Date:** 2026-07-12  
**Scope:** How much not having Clerk in place affects the current v2 design; whether to implement now or continue holding.  
**Companion docs:** `STATE.md` (auth decision + interim tenancy), `DATA_LAYER_AUDIT.md` (production grades / tenancy risk), `ORDERS_CLEANUP.md` (higher-ROI app work while holding).  
**Update when:** Clerk keys land, the DB user-id decision is locked, third-party auth is registered, or the service-role interim is replaced.

---

## Bottom line

**Clerk not being live has a large effect on security/tenancy maturity, and a small effect on domain design.** The order model, field registry, money integrity, and most of the API shape were designed *for* the Clerk end state. What’s interim is the **identity + isolation layer**, not the business logic.

**Recommendation: keep holding on Clerk for now** — unless onboarding a second real org or external users is imminent. Finish orders shell cleanup and module cutovers first; treat Clerk as a dedicated Layer 2 project when keys + the user-id decision are unblocked.

---

## What Clerk is supposed to change

| Concern | Today (interim) | After Clerk |
|---|---|---|
| **Who is the user?** | Supabase Auth magic link (`auth.users` UUID) | Clerk session / JWT |
| **How does the app talk to v2?** | `createV2AdminClient()` service role | `createV2Client(getToken)` — JWT in `accessToken` |
| **What enforces tenant isolation?** | App code: `.eq('organization_id', …)` on every query | Prefer **RLS** reading claims from JWT (+ app defense in depth) |
| **Order create** | `create_order_as_org(p_org, p_user, payload)` shim | Direct `create_order` with claims on the JWT |
| **Membership seed** | `organization_members.user_id` = Supabase UUIDs | Remap when Clerk IDs exist (or internal UUID claim) |
| **Sign-in product** | Magic link + `allowed_emails` | Clerk (org invites, SSO later, etc.) |

The design already assumes that swap is **localized**:

- `resolveTenant()` is the single identity swap point (`app/lib/auth/tenant.ts`)
- `createV2Client(getToken)` is already written with **no Clerk import** (token getter injected) — `app/utils/supabase/server-v2.ts`, `client-v2.ts`
- Routes stay plain `/api/*`; they should not care who issued the JWT

So the architecture is not “wrong without Clerk.” It is **intentionally half-finished at the auth boundary**.

---

## Impact by dimension

### 1. Domain / feature design — **low impact** (~10–15%)

Almost unaffected:

- clients / products / orders / payments / custom fields
- generated money columns, triggers, validation authority
- platform hooks, Zod structural validation, documents API shape

Domain work does **not** rot because Clerk is missing. Modules can (and should) keep shipping.

### 2. API route shape — **low–medium impact** (~20%)

Routes already look like production multi-tenant handlers. The only Clerk-shaped scars:

- every route must remember `organization_id` (and some ownership checks)
- one RPC shim: `create_order_as_org` instead of `create_order`
- `orgRole` is resolved but not heavily used for authorization on v2 routes

When Clerk lands, most route bodies stay; change **what `tenant.db` is** and drop the shim. Not a rewrite of the order system.

### 3. Security / multi-tenant production — **high impact** (~60–70% of “not production-ready as SaaS”)

This is where absence really bites:

| Risk | Why |
|---|---|
| **Service role bypasses RLS** | One missed `.eq('organization_id')` = cross-tenant leak |
| **IDOR deferred (SEC-05)** | App discipline + partial checks (e.g. payments ownership); not a universal structural boundary — see `docs/code-review/AUDIT_PROGRESS.md` |
| **No real multi-org product surface** | Active org is first membership / `user_settings`; fine for Ivan, weak for platform |
| **User id model undecided** | Clerk `sub` is not a UUID; membership remap or custom claim still blocked on DB owner |
| **Cannot trust DB policies as last line of defense** | Until third-party auth + exposed `v2` schema + JWT claims are live |

**For a single closed tenant (Ivan), impact is manageable.**  
**For a second org / external users, impact is blocking.**

### 4. Auth UX / ops — **medium impact**

Stuck with:

- Supabase magic link + `allowed_emails`
- No Clerk org invites / roles UI as product
- Dual mental model: legacy modules still on Supabase cookie auth; v2 on service role after session check

Does not break daily ops for a known email list. Blocks the “sell the platform” auth story.

### 5. Work accumulated by waiting — **medium, but bounded**

Technical debt that **grows slowly** while holding:

- More v2 routes written against **service-role** patterns (each is a place to forget the org filter)
- More reliance on `create_order_as_org`-style shims if other RPCs need claims
- Membership still seeded to Supabase UUIDs — remap gets slightly harder as users/orgs grow

Debt that **does not** require Clerk (clear anytime):

- orders page façade / dead hooks (`ORDERS_CLEANUP.md`)
- documents issue path
- expenses / materials migration
- picker search, cache invalidation

Those are **higher ROI than Clerk right now** for product quality.

---

## What is actually blocked on Clerk

True external blockers (from `STATE.md` + `server-v2.ts`):

1. **Clerk keys**
2. **DB user-id decision** — recommended: internal UUID claim in JWT, not rewriting every `uuid` column to text
3. **Supabase third-party auth registration** for Clerk JWTs
4. **`v2` exposed schema** (dashboard item)
5. **Remap** seeded `organization_members` when Clerk identities exist

Without those, “implement Clerk in the app” is **incomplete**: packages could wire and RLS-backed tenancy still would not land.

### Not blocked on Clerk (do not wait)

- orders dead-code cleanup (`ORDERS_CLEANUP.md`)
- filter / invoice hollow UI fixes
- documents module completion (DB `issue_document` is the blocker there)
- next module migrations
- hardening: shared helper that forces `organizationId` on every query even under service role

---

## Hold vs do-now decision

### Hold (recommended default)

**Hold if:**

- Still primarily **one tenant** (Ivan) with a closed allowlist
- Next goals are **orders polish, documents, cleanup, next modules**
- Clerk keys / user-id decision / third-party auth are **not** all unblocked this week
- Want to avoid a multi-week auth migration mid-cutover

**Why holding is coherent:**

1. Design already isolates the swap (`resolveTenant` + `createV2Client`).
2. Clerk work is **cross-cutting** (middleware, sign-in, membership, RPCs, seed data, edge cases on every migrated route). Doing it mid-module-cutover doubles thrash.
3. Biggest user-visible pain is **orders shell / hollow invoices / dead code**, not magic link vs Clerk.
4. Doing Clerk before the user-id decision risks **rewriting membership twice**.

**While holding, mitigate the real risk:**

- Never add a v2 query without org scope (code review rule)
- Prefer a small data-access helper that bakes in `organization_id` if service-role routes keep growing
- Do **not** open a second production org on this interim path without an explicit security review

### Do Clerk now (only if one of these is true)

**Do it now if:**

- About to onboard **org #2** or external customers
- Compliance / “RLS is the boundary” is a hard requirement for go-live
- Keys + DB user-id decision + Supabase third-party auth are **ready**
- Willing to pause module features for a focused auth sprint

**If doing it now, treat it as its own project:**

1. Lock the user-id strategy with DB owner (internal UUID claim preferred)
2. Register Clerk + expose `v2` schema
3. Swap identity in `resolveTenant` only first (still service role if needed)
4. Then flip `tenant.db` → RLS client and drop `create_order_as_org`
5. Remap memberships; dual-run or freeze signups during cutover

**Half-doing Clerk** (UI only, still service role) is **worse** than holding — migration cost without isolation gains.

---

## Practical decision rule

```
If only Ivan + closed emails  →  HOLD Clerk
                              →  do ORDERS_CLEANUP + documents + next module
                              →  keep service-role discipline strict

If second org or external users within ~4–6 weeks
                              →  START Clerk as a dedicated track
                              →  unblock keys + user-id claim first
                              →  don’t mix with big feature PRs
```

---

## Effect size summary

| Question | Answer |
|---|---|
| Does missing Clerk break the v2 domain design? | **No** |
| Does it force bad API shapes forever? | **No** — swap is localized |
| Does it leave a real security hole for multi-tenant? | **Yes** — service-role tenancy is the hole |
| Does it block orders/clients/products daily use for Ivan? | **No** |
| Does it block “platform ready for external orgs”? | **Yes** |
| Opportunity cost of doing Clerk now vs cleanup/modules? | **High** — Clerk is expensive; shell cleanup is cheaper user value |
| Should you hold? | **Yes**, until multi-org or auth blockers clear |

---

## Key files

| Role | Path |
|---|---|
| Interim tenant resolve | `app/lib/auth/tenant.ts` |
| Clerk-ready RLS client (unused live) | `app/utils/supabase/server-v2.ts` (`createV2Client`) |
| Live service-role client | `createV2AdminClient()` in same file |
| Browser-side Clerk-ready client | `app/utils/supabase/client-v2.ts` |
| Create-order shim | migration `20260710000000_create_order_as_org_interim_shim.sql`; call site `app/api/orders/route.ts` |
| Auth end-state decision | `STATE.md` — Decided / Interim auth / Blocked |
| Security debt (IDOR) | `docs/code-review/AUDIT_PROGRESS.md` — SEC-05 |

---

## Design verdict

The system was built to **tolerate** missing Clerk via a sanctioned interim. That interim is good enough for single-tenant product work and **not** good enough as the multi-tenant production security story. Holding is coherent; drifting into multi-org on service role is not.
