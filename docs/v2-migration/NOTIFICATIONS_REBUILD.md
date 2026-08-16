# Notifications — audit & v2 rebuild design

**Date:** 2026-08-15
**Status:** **working end to end** (2026-08-15, branch `notifications/foundation`, §13). Design settled §9; model §12. Tables live on `giwurfpxxktfsdyitgvr`; producers emit from the order/payment/webhook write paths; the bell reads the live inbox via SWR pull and renders structured rows. `tsc` clean, full suite (360+) green, `npm run lint` passes, `npm run build` succeeds. Remaining are refinements, not blockers (§13): unread-count endpoint, deep-link routing, digest/preferences/push (later tracks).
**Scope:** the notifications feature end-to-end — DB, API, hooks, context, UI, push. What exists, why it's non-functional, and how it must be rebuilt to fit the current stack.
**Companion docs:** `STATE.md` (module status — the "Notifications" row points here), `DATA_LAYER_AUDIT.md` (tenancy/service-role posture), `CLERK_HOLD_AUDIT.md` (Phase 1/2 phasing), `APP_REDESIGN.md` (the two governing principles), `CLAUDE.md` (migrated-module pattern, sheet guardrails).
**Verified against the live database** (`giwurfpxxktfsdyitgvr`), reading `pg_policies`, `pg_proc`, `pg_trigger`, and row counts directly — not against any doc.
**Update when:** the table is built, the security holes are closed, push is scoped, or the RLS flip (Phase 2) lands.

---

## Short answer

The notifications feature is **non-functional and partly a liability**. The live UI is an intentional stub (empty list, no-op mutations); the "real" data layer is dead orphaned code from before the Clerk cutover; push is a permission prompt wired to nothing; and the legacy DB table is **still live with 3,348 real rows behind a broken RLS policy that leaks every user's notifications to every other user**. There is **no `v2.notifications` table**, so the rebuild is greenfield.

The rebuild is not hard — it's a **standard migrated module** with a proven template (orders/clients). What makes it worth writing down is *why* the old system can't be salvaged: it was written for a stack that no longer exists, and the delivery mechanism it relied on (client-side Supabase realtime) is architecturally unavailable until Phase 2.

---

## 1. Current state — what's wired vs dead

| Layer | File | State |
|---|---|---|
| Context (live) | `app/context/NotificationsContext.tsx` | ✅ Mounted — but a **stub**: empty list, no-op mutations, `unreadCount=0`. Intentional (2026-07-24). |
| UI (live) | `NotificationsMenu`, `NotificationsDrawer`, `NotificationsIndicator`, `NotificationGroup`, `NotificationItem` | ✅ Mounted, consume the stub → always "all caught up". Usable as scaffold. |
| API route | `app/api/notifications/route.ts` | 💀 **Dead** — legacy `supabase.auth.getUser()` (never authenticates post-Clerk) and **never called by any client**. |
| "Real" hook | `app/hooks/useRealNotifications.ts` | 💀 **Orphaned** — imported nowhere; uses dead auth id; opens a realtime channel. |
| Push utils | `app/utils/push-notifications.ts` | ⚠️ Permission prompt is live; `registerServiceWorker()` **never called**, and it points at `/sw.js` while the file is `/service-worker.js`. |
| Service worker | `public/service-worker.js` | ⚠️ Has push handlers but is **never registered**. |
| Settings | `app/dashboard/settings/_components/NotificationsTab.tsx` | ⚠️ Toggles persist only to client Settings context; "Save Changes" button is unwired (decorative). |
| Test route | `app/dashboard/notifications-test/page.tsx` | 💀 Live prod route wired to the stub — shows nothing. Leftover. |
| DB (legacy) | `public.notifications` (3,348 rows), `public.notification_preferences` (0 rows) | 🔴 Live with **broken RLS** (see §2). |
| DB (v2) | — | **Does not exist.** Greenfield. |

Other dead bits: duplicate mock data (`app/data/mock-notifications.ts` + `app/dashboard/_data/mock-notifications.ts`); `NotificationsProvider` mounted twice (`app/providers.tsx` + `NotificationsWrapper` in `DashboardLayout`); a decorative push switch on `app/dashboard/profile/page.tsx`.

---

## 2. Security — live holes on the legacy table (deferred, not fixed)

The `public.notifications` table is live with 3,348 real rows (pre-Clerk, keyed to old `auth.users` ids). Its RLS is broken:

- **S1 (Critical) — world-readable.** Policy `public_read_notifications`: `SELECT … USING (true)` for role `public`. Postgres OR's permissive policies, so the correct `user_id = auth.uid()` policy is nullified — **any authenticated caller can read everyone's notifications** (order numbers, client names, messages). This orphan policy is **not in any migration file** — it exists only in the live DB, so a schema replay reproduces neither the hole nor a fix.
- **S2 (High) — forgeable.** `notifications_insert_policy`: `INSERT` for `public` with **no `WITH CHECK`** → any user can insert rows with an arbitrary `user_id`.

**Decision (2026-08-15):** deferred. The legacy table is to be folded into the v2 build later rather than patched now. This is a conscious deferral — the hole is open at the DB regardless of the app being stubbed. If the deferral window grows, the minimal fix is `DROP POLICY public_read_notifications` + add a `WITH CHECK` (or drop the legacy table wholesale once its data disposition is decided — see §7).

**Dormant landmines:** three legacy write-paths hardcode the dead role model (`profiles.role IN ('admin','manager','staff')`): the RPC `create_order_notification` and the triggers `create_order_deleted_notification` (on `public.orders`) and `create_overdue_task_notifications` (on `public.tasks`). The two triggers are still **enabled**, but only on legacy `public` tables (dead in v2), so they're dormant — they'd silently notify nobody if fired. Remove at cutover.

---

## 3. The core problem: the old design targeted a stack that no longer exists

Every defect traces to one thing — the notifications code was written for the *pre-migration* stack and never re-architected. The delta, verified against the migrated modules (`app/api/orders/route.ts`, `app/hooks/orders/useOrders.ts`) and the tenancy layer (`app/lib/auth/tenant.ts`, `tenant-db.ts`):

| Concern | Old notifications assumed | Current stack/architecture | Consequence for rebuild |
|---|---|---|---|
| **Identity** | Supabase session, `auth.uid()` | Clerk; app id is the `internal_user_id` **UUID claim** | `user_id = auth.uid()` is dead. Recipient is `internal_user_id`. |
| **Tenancy** | Single-shop `public`, **user-scoped only** | Multi-tenant `v2`, **org-scoped** by `organization_id`; org from Clerk Organizations | Needs a tenant boundary **and** a recipient — a shape no v2 table has yet. |
| **Data access** | Client Supabase client, RLS-scoped | Server-side **service-role `TenantDb`**; the browser has **no authenticated Supabase session** | All reads/writes go through a route + `TenantDb`, never the browser. |
| **Delivery** | Client Supabase **realtime** (`postgres_changes`) | **No v2 module uses realtime** — see §4 | Delivery = SWR pull until Phase 2. |
| **Lifecycle** | Hard `DELETE` | **Archive, never delete** (`tenant-db.ts` won't compile `.delete()` on entities) | "Delete" becomes archive/dismiss. |
| **Roles** | `profiles.role IN ('admin','manager','staff')` | `organization_members` `owner`/`staff` | Fan-out targets org members, not the dead role model. |

---

## 4. The decisive finding: realtime is blocked on Phase 2

A grep of the whole tree for `.channel(` / `postgres_changes` / `realtime` matches **only the dead notifications files**. No migrated module (orders, clients, products, documents) uses realtime — they're all SWR-pull with tuned dedupe intervals (`app/lib/swr-config.ts`; `refreshInterval: 0`, `revalidateOnFocus: false` by default).

Why the old realtime "worked" and can't be reused:
- It subscribed from the **browser** via the anon Supabase client. That only returned rows because of the **S1 world-open policy** — i.e. the leak *was* the delivery mechanism.
- Under the current stack the browser has no Clerk→Supabase-authenticated session. Client-side RLS-scoped realtime requires **Supabase third-party auth + the v2 RLS flip**, which is **Phase 2 and unstarted** (`resolveTenant()` docstring; `CLERK_HOLD_AUDIT.md`; `STATE.md`).

**So a realtime bell is not on the table until Phase 2.** The architecturally-consistent choice today is **SWR pull** — a notifications hook with a modest `refreshInterval` (~60–120s) and `revalidateOnFocus: true`, a deliberate, documented exception to the app-wide "don't auto-refresh" default. This matches how the rest of v2 behaves and needs zero new infra. It flips to realtime later as a single delivery-layer change.

---

## 5. The rebuild is a standard migrated module

No invention required — copy the proven pattern file-for-file:

- **Route** (`app/api/notifications/route.ts`, rewritten): `resolveTenant()` → `handleApiError('UNAUTHORIZED', …)` → `safeParse` a schema added to `app/lib/api/validators.ts` → `tenant.db.from('activities')` (org filter injected by construction) → `handleSupabaseError`. Plus a colocated `route.test.ts` against `createFakeTenant()` (pattern: `app/api/orders/route.test.ts`) — **required in the same PR** per CLAUDE.md. GET returns the caller's inbox projection (activities where the caller is in the audience, left-joined to their `activity_reads`, see §6); PATCH writes the caller's read/archived state (and the `last_seen_at` watermark); there is no hard DELETE (archive instead).
- **Hook** (`app/hooks/notifications/useNotifications.ts`): `useSWR` via `buildKey(PLATFORM_API.NOTIFICATIONS, …)` + `apiFetcher`, and a `useNotificationMutations()` invalidating with `keysUnder(...)` — exactly `useOrders.ts`. Add `NOTIFICATIONS: '/api/notifications'` to `PLATFORM_API` in `app/lib/api/client.ts`.
- **Types**: hand-add the `notifications` table to `DatabaseV2` (`app/types/supabase-v2.ts`) — it's hand-maintained, not gen'd (CLAUDE.md).
- **UI**: the existing drawer/menu/indicator are decent scaffold, but the drawer uses the old `SideDrawer`. The rebuild moves it onto the **`OrderSheet` primitive** via the sheet-host door (`app/context/sheet-host.tsx`, `useSheets`), per the "one sheet, one door" guardrail. The stub `NotificationsContext` is replaced by the hook (keep only the drawer-open UI state, if anything).

---

## 6. The core model — one activity stream, projected by access + label

**Refined 2026-08-15 (working-model review).** A notification and an org-activity item are the **same fact** — "actor did *verb* to *object*." They differ only in two dimensions:

- **Access** — is the fact addressed to specific people, or visible to the whole org?
- **Label** — is it rendered in *directed* voice ("*Your* order is ready") or *ambient* voice ("ORD-1042 moved to ready")?

So there is **one source of truth — an activity stream** — and the bell inbox and any org feed are *projections* of it, not separate systems. This **discards the earlier per-recipient fan-out** (one row per person per event): duplicating the fact once per recipient contradicts the unity above, and per-user state belongs beside the fact, not baked into copies of it.

The legacy row was doubly wrong — it froze a rendered `title`/`message` string **and** fanned out per `user_id`. Both go.

### Two tables

**`v2.activities`** — the fact, one row per event:

| Column | Purpose |
|---|---|
| `id` | PK |
| `organization_id` | Tenant boundary; injected/filtered by `TenantDb`, never trusted from the client. |
| `actor_user_id` | Who did it (null = system). Excluded from the directed audience — you don't notify yourself. |
| `verb` | `order.created` / `order.status_changed` / `payment.recorded` / `member.added`. Drives rendering, routing, aggregation. |
| `object_type`, `object_id` | The entity the activity is about. |
| `target_type`, `target_id` | Optional context (e.g. the order a payment settles). |
| `data` (jsonb) | Small denormalized render snapshot (`order_number`, `client_name`, `amount`, `from_status`/`to_status`) — renders a row without N+1 lookups while the row stays structured. |
| `category` | `order_activity` / `payments` / `team` — the preference bucket (§12.4); present day one so preferences layer on with **no migration**. |
| `group_key` | Aggregation key (e.g. `payments:order:<id>`) to collapse "Sarah and 2 others…" and later feed digests (§12.5). |
| **`audience_scope`** | **The access dimension**: `'org'` (everyone in the org) or `'users'` (a directed set). |
| **`recipient_user_ids`** (uuid[]) | The directed set when scope=`'users'`; empty for org-wide. GIN-indexed. |
| `priority` | `normal` / `high` — reserved for later channel routing. |
| `created_at` | — |

**`v2.activity_reads`** — per-user interaction state, **sparse** (a row exists only once a user acts on an item):

| Column | Purpose |
|---|---|
| `activity_id`, `user_id` | Who, on what. |
| `read_at` | Item opened. |
| `archived_at` | Dismissed. Archive, never delete. |

### How the projections read

- **Access** = the audience columns. The **bell inbox** = `activities` in my org where `audience_scope='org'` **or** I'm in `recipient_user_ids`, minus my own actions, left-joined to *my* `activity_reads`, not archived, newest first. An **org feed** (Home, if it ever adopts this) = the same `activities`, read ambiently. Same rows, two queries.
- **Label** = derived at render, never stored: if I'm in the directed set → directed voice; else ambient voice. One activity, two labels depending on who's looking.
- **Efficient read-state**: the unread **badge** rides a cheap per-user `last_seen_at` watermark (and "mark all read" just bumps it); **individual** read/archive writes a sparse `activity_reads` row. No fact is ever copied per recipient.

**Writing an activity** is a single insert with an audience, not a fan-out. Audience is settled per event in §9.2 (order/payment events → `audience_scope='org'`; `member.added` → `'users'` with the affected user). See §12 for the layered model and the market rationale this sits inside.

---

## 7. Forced design decision B — event source (app-layer emit vs DB trigger)

The old code used DB triggers on `public.orders`/`tasks`. Under the current posture (money functions are sacred; verify before touching — CLAUDE.md, `DB_ASKS.md`), the cleanest fit is **app-layer emit**: after `create_order` / `addPayment` / `issueDocument` succeed in their routes, insert notification rows via `TenantDb`.

- **Benefits:** no migration risk near `recompute_order_totals` / `issue_document`; logic stays in TypeScript; testable in `route.test.ts`.
- **Alternative:** a pure-insert `AFTER` trigger on `v2` tables is viable **only** if it never touches money math.
- **Also an event source:** the Clerk webhook (`app/api/webhooks/clerk/route.ts`) already handles membership/org events — e.g. "you were added to org X" fits there.

---

## 8. Effectively dead-on-arrival regardless of phasing

- **Push notifications** need real infra that doesn't exist: VAPID keys, a `push_subscriptions` table (org-scoped, endpoint-per-device), a server send path (`web-push`), and the SW actually registered *and* subscribed. Today it's a permission prompt wired to nothing (`registerServiceWorker()` never called; wrong path). That's a dark pattern. **Decided (§9.4): defer indefinitely and pull the prompt** (`NotificationPermissionRequest` in `DashboardLayout`) now, as part of cleanup. Web Push returns only as its own scoped track.
- **Preferences**: legacy `notification_preferences` (0 rows, user+category) doesn't fit the v2 settings model. **Decided (§9.5): no preferences in Phase 1** — the in-app bell has no channel to toggle. When email/push lands, preferences are **per-user** (stored per-user, not on `organizations.settings`). Today's unwired `NotificationsTab` toggles are removed/neutralized in cleanup.

---

## 9. Settled product decisions (2026-08-15)

These were open; they are now decided. Each is an MVP-minded call that keeps Phase 1 small and can widen later without rework — recorded here so the build doesn't relitigate them.

**1. Which v2 events notify (Phase 1):** three write-path events plus one webhook event.

| Event | Emit from | Why in |
|---|---|---|
| **Order created** | `POST /api/orders` (after `create_order_as_org` succeeds) | Team awareness — something new to produce. |
| **Order status changed** | `PATCH /api/orders/[id]` (only when `status` actually changes) | The core production-workflow signal (e.g. moved to "ready" → someone delivers / calls the client). |
| **Payment recorded** | `POST /api/orders/[id]/payments` | Money in — the owner's highest-signal event. |
| **Added to an organization** | Clerk webhook `organizationMembership.created` | "You were added to X." Near-zero cost; the source already runs. |

**Deferred events, and why (not "no", just "not Phase 1"):**
- **Document issued** — usually done deliberately by the person who'd be notified; low signal. Revisit if invoices start being issued by someone other than the owner.
- **Due-soon / overdue** — genuinely useful, but needs a **scheduler** (a cron route), not a write-path hook. Same "needs infra" class as push; defer to its own piece. (The dead legacy `create_overdue_task_notifications` is the ghost of this.)

**2. Audience (access dimension, §6):** the three order/payment events are written with `audience_scope='org'` — visible to the whole org, minus the actor (you never notify yourself). `member.added` is written `audience_scope='users'` with the affected user as the sole recipient. No owners-only tier in MVP — teams are small (`owner`/`staff` only); add a directed sub-audience later only if noise proves it necessary. (This replaces per-recipient fan-out: one activity row carries its audience, §6.)

**3. Legacy data:** **discard.** The 3,348 rows are pre-Clerk, single-tenant, and keyed to dead `auth.users` ids with no `organization_id` — they cannot be cleanly mapped to a tenant or a recipient, so a backfill would be inventing data. Drop `public.notifications` + `public.notification_preferences` (and the orphan policy + dead functions/triggers, §2) at cutover. No backfill.

**4. Push:** **deferred indefinitely; remove the prompt now.** No infra exists and the current permission prompt is a dark pattern (§8). Pull `NotificationPermissionRequest` from `DashboardLayout` as part of the dead-code cleanup, rather than leaving it asking for a capability that does nothing. Web Push returns only as its own scoped track.

**5. Preferences:** **none in Phase 1; per-user when they return.** The Phase-1 bell is in-app only — there is no email or push channel to toggle, so there is nothing to configure. When a delivery channel lands, notification preferences are **per-user** (a user is entitled to their own choice), stored per-user — not on `organizations.settings`. The unwired `NotificationsTab` toggles are removed/neutralized in cleanup rather than left pretending to work.

---

## 10. Phasing

- **Phase 1 — buildable now (no new infra, no RLS dependency):** `v2.notifications` table (org + recipient); migrated-pattern route + tests + SWR hook (pull, ~60–120s refresh); app-layer emit on the **three settled events** — order created, order status changed, payment recorded (§9.1), targeted at all org members except the actor (§9.2); the membership event on the Clerk webhook; drawer moved to `OrderSheet`. No preferences (§9.5). Delete the dead code, discard the legacy tables, and pull the push prompt (§11, §9.3–9.4).
- **Phase 2 — at the RLS flip:** swap pull → Supabase realtime once third-party auth lands. Single delivery-layer change; everything else holds.
- **Separate tracks (own infra, own decision):** Web Push (§9.4); due-soon/overdue via a scheduler (§9.1); per-user preferences once a delivery channel exists (§9.5).

---

## 11. Cleanup checklist

**Done — app-side dead code removed (2026-08-15):**
- ~~`app/api/notifications/route.ts`~~ — replaced with the migrated-pattern route (not deleted; rewritten).
- ~~`app/hooks/useRealNotifications.ts`~~ — **deleted** (orphaned).
- ~~`app/dashboard/notifications-test/page.tsx`~~ — **deleted** (leftover route).
- ~~`app/data/mock-notifications.ts` + `app/dashboard/_data/mock-notifications.ts`~~ — **deleted** (unused mocks).
- ~~Double `NotificationsProvider` mount~~ — **collapsed to the single global one** in `app/providers.tsx`; `NotificationsWrapper.tsx` deleted. (This also fixed a real bug: the local provider shadowed the global one, so `openDrawer()` from the header didn't reach the drawer.)
- ~~Push (dark pattern, never registered)~~ — **deleted** `NotificationPermissionRequest.tsx`, `app/utils/push-notifications.ts`, `public/service-worker.js`, and removed the prompt from `DashboardLayout`.
- ~~Unwired "Save" on `NotificationsTab`~~ — **removed** (settings persist live via `updateSettings`).

**Left in place, deliberately (not dead code):**
- The profile-page notification card + `NotificationsTab` toggles — unwired **preferences** UI, which belongs to the deferred preferences track (§9.5), not this pass. Removing live settings UI is a product change, not cleanup.
- **Legacy DB** — `public.notifications` (3,348 rows), `public.notification_preferences`, the orphan `public_read_notifications` policy, and the three dead role-model functions/triggers (§2). Dropping these is a **separate DB change needing explicit go-ahead**, and must also account for the two still-live legacy writers (`app/api/cron/generate-recurring-expenses`, `supabase/functions/create-or-update-order.ts`) that belong to unmigrated modules.

---

## 12. The model, reconsidered against market practice (2026-08-15)

The sections above describe *a working v2 module*. This section answers the harder question — **what a notification should *be*** — by reading how modern notification infrastructure (Knock, Novu, Courier, SuprSend, MagicBell) and production apps (GitHub, Linear, Slack) actually model it, and taking the parts that raise the ceiling without over-building for a small print-shop team.

**Governing principle: design the model wide, build the delivery narrow.** Adopt the *shape* the industry converged on (structured activity, categories, channels, aggregation keys, seen/read state) so the ceiling is high and later work slots into named seams — but implement Phase 1 as one channel (in-app), no preference UI, app-layer emit. Every deferral below is a seam, not a rewrite.

### 12.1 What the legacy model got wrong

The legacy row was a **frozen rendered string** (`title` + `message`) targeted at a single `user_id`, delivered by a client realtime channel that only worked because RLS was wide open. That shape can't aggregate, can't be re-labelled, can't route reliably, can't add a channel, and leaked across users. Every limitation traces to storing *a sentence* instead of *what happened*.

### 12.2 Four layers, not one path

Industry systems separate concerns the legacy code fused together. Keep them separate even when Phase 1 implements them thinly:

1. **Event** — a fact at the source ("order X moved pending→ready"). Emitted **once**, in the API write path.
2. **Workflow / fan-out + routing** — decides *who* should know (recipients minus actor), *which category/channels*, and any conditions. In Phase 1 this is a single app-layer helper — `notify(event)` — called after the write commits. It is the seam where preferences, digest, and extra channels plug in later **without touching the event sites**.
3. **Notification item** — the per-recipient inbox record (the §6 row: actor/verb/object/target + state). What the bell reads.
4. **Channel delivery** — in-app now; email/push/Slack later. The item is channel-agnostic, so a new channel is additive.

This is the Knock/Novu "trigger → workflow → channel step" split, scaled down to a function call.

### 12.3 The notification object: actor / verb / object / target

The canonical model (W3C Activity Streams, used by GitHub/Linear and every notification vendor) is **"actor did verb to object (in target)"** — stored structurally, rendered at read time. This is the single biggest upgrade and it's already reflected in the §6 table. It buys:

- **Aggregation** — a `group_key` collapses "Sarah **and 2 others** recorded payments on ORD-1042."
- **Re-rendering** — change the copy or translate it later without migrating stored rows.
- **Routing** — `object_type`/`object_id` gives a reliable click-through target (no parsing sentences).
- **A small `data` snapshot** rides along for render-without-lookups — the pragmatic middle ground production systems use (pure ids would force the pull-based inbox into N+1 joins).

### 12.4 Taxonomy — categories over ad-hoc types

Group verbs into a few **categories**, the unit preferences attach to (Knock's "categories", MagicBell's "categories", Courier's "topics"). For a print shop:

| Category | Verbs (Phase 1) | Later |
|---|---|---|
| `order_activity` | `order.created`, `order.status_changed` | assignment, cancellation |
| `payments` | `payment.recorded` | refunds, balance-due reminders |
| `team` | `member.added` | role changed, member removed |
| `documents` *(deferred)* | — | `document.issued` |
| `reminders` *(deferred, needs scheduler)* | — | due-soon / overdue |

Categories exist as a column from day one so the preference matrix (§12.6) is a pure add later.

### 12.5 Anti-noise: this is the "streamline" the request asked for

The market's consensus on reducing notification fatigue, mapped to us:

- **Notify only events where someone *other than the actor* needs to act or be aware** — already the §9 rule. This alone kills most legacy noise.
- **Aggregate in the inbox** via `group_key` — one collapsible row per (category, object) instead of five pings. Build this into the Phase-1 inbox rendering; it needs only the column.
- **Digest / batching** (time- or count-window) — *defer*, but it's why `group_key` + `category` exist now. It's the layer that lets the backend fire many events while the user sees few interrupts. Belongs with email/push, not the in-app bell.
- **Priority bypass** — urgent/transactional skips batching. `priority` column reserved; unused until a batched channel exists.
- **One stream, two projections — not two systems (§6).** "Concerns me" and "what's happening" are the *same* activity stream read through **access** (audience) and **label** (voice). The bell is the *directed/relevant-to-me* projection; a feed is the *org-visible* projection. The guardrail is therefore about **presentation, not storage**: don't dump the full ambient stream into the bell (the GitHub/Slack lesson — a merged firehose is unreadable), and render each projection in its own voice. Home stays feed-first; whether it *reads from* this same stream is the one open scoping call (§12.9).

### 12.6 Preferences — the shape now, the UI later

The vendor-standard is a **PreferenceSet**: a matrix of *category × channel* opt-outs per user (Knock). We adopt the *shape* (category column present; channel is an enum) but ship **no preference UI in Phase 1** — with only the in-app channel there is nothing to toggle (§9.5). When email/push lands, preferences are **per-user** (a personal PreferenceSet, not org-level), and they slot onto the existing categories with no change to the event sites.

### 12.7 Surfaces

Five in-app surfaces exist (persistent inbox, toast, banner, modal, badge). We use exactly two, plus one we already have:

- **Inbox** (bell → `OrderSheet` drawer) — the persistent record. Phase-1 surface.
- **Badge** — unread/seen count on the bell.
- **Toast** — already handled by the existing toast system for the *actor's own* immediate feedback ("Payment recorded"); it is **not** the inbox and the two shouldn't be conflated. No banners/modals for this feature.

### 12.8 What we adopt, shape-only, and decline

| Concept | Decision | Why |
|---|---|---|
| Unified activity stream (one model, projected by access + label) | **Adopt now** | Notifications and org activity are one fact; §6. Discards per-recipient fan-out. |
| Structured actor/verb/object/target | **Adopt now** | The core upgrade; free at DB level (§6). |
| Categories | **Adopt now** (column) | Enables preferences later, no migration. |
| `group_key` aggregation | **Adopt now** (column) + inbox collapsing | Streamlines the bell immediately. |
| seen / read / archived | **Adopt now** | Matches GitHub/Linear; archive-not-delete fits v2. |
| Channel as an enum | **Adopt now** (`in_app` only) | Makes email/push additive. |
| Layered event→workflow→item→channel | **Adopt now** (as functions) | The seams that prevent a later rewrite. |
| Preferences (category × channel) | **Shape now, UI later** | Nothing to toggle until a 2nd channel exists. |
| Digest / batching | **Defer** (seam ready) | Belongs with email/push; `group_key` reserved. |
| Email / push / Slack channels | **Defer** (own track) | Real infra; §8. |
| Quiet hours, rate limits, locale/i18n, provider fallback, delivery queues, observability | **Decline for now** | Over-engineering for an owner + few staff. Named here as known extension points, not planned work. |

### 12.9 Net effect on the plan

This doesn't change the phasing (§10) or the settled decisions (§9) — it **deepens the Phase-1 data model** from a per-recipient frozen-string row into a single structured, aggregatable, channel-ready **activity stream projected by access + label** (§6), and draws the seams (workflow helper, categories, channels, group_key) so the "wider area of effect" (digests, email/push, preferences, more event types) is later addition rather than redesign. Phase 1 still ships in-app-only with no new infrastructure.

**The one open scoping call this unified model creates: does Home read from the same stream?**

- **Recommended — build the stream for the bell now; Home adopts it later (or never).** Phase 1 needs only the *directed* projection (the bell). Home keeps its current live-order-query feed until there's a reason to move it. The model already supports both, so this is a free option, not a commitment.
- **Alternative — unify now:** back Home's feed with the *ambient* projection of the same stream in Phase 1. More scope (Home rework, an ambient render path, backfill of "what counts as feed-worthy"), but it collapses two surfaces onto one source immediately. Viable given the greenfield latitude — pull it into Phase 1 only if unifying the surfaces now is worth the extra build.

Everything else holds regardless of which way this goes.

### Sources

- W3C Activity Streams vocabulary (actor/verb/object/target): [w3.org/TR/activitystreams-vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/); overview: [GetStream — activity stream / W3C spec](https://getstream.io/blog/designing-activity-stream-newsfeed-w3c-spec/)
- Knock — [Workflows](https://docs.knock.app/concepts/workflows), [Preferences](https://docs.knock.app/concepts/preferences), [2026 guide to notification systems](https://knock.app/blog/guide-to-notification-systems-and-tooling)
- MagicBell — [Notification system design (object schema, fan-out, state)](https://www.magicbell.com/blog/notification-system-design)
- Batching / digest / anti-fatigue — [Courier](https://www.courier.com/blog/how-to-reduce-notification-fatigue-7-proven-product-strategies-for-saas), [SuprSend](https://www.suprsend.com/post/notification-batching-and-digest), [Novu](https://novu.co/blog/digest-notifications-best-practices-example/)
- In-app inbox patterns (GitHub / Linear / Slack) — [SuprSend in-app notification center](https://www.suprsend.com/post/in-app-notification-center)

---

## 13. Foundation build status (2026-08-15, branch `notifications/foundation`)

The bedrock — the model and its core plumbing — is built and proven, with no UI. "Present it and wire it into the UI" are later floors; this section is what stands.

### Built

| Piece | File | Notes |
|---|---|---|
| Schema | `supabase/migrations/20260815100000_notifications_foundation.sql` | `v2.notifications` (fact + audience) + `v2.notification_reads` (sparse per-user state). RLS **enabled, no policies** — deny-by-default, the deliberate opposite of the legacy leak (§2); service-role TenantDb is the boundary until Phase 2. Named apart from the existing audit `activity_logs`. |
| Types | `app/types/supabase-v2.ts` | Both tables hand-added to `DatabaseV2` (matches the DDL). Being org-scoped, they join `OrgScopedTable` automatically. |
| Write path | `app/lib/notifications/notify.ts` | `notify(db, input)` — one insert, one fact with an audience (no fan-out). Returns the error instead of throwing, so a failed notify never rolls back the primary write. Verbs/categories typed. |
| Read/mutate API | `app/api/notifications/route.ts` | GET = inbox projection (audience-filtered, actor-excluded, per-user state merged from a 2nd query — no fragile PostgREST embed). PATCH = read/archived state via update-then-insert (archive-not-delete). Legacy dead route replaced. |
| Validators / client | `app/lib/api/validators.ts`, `app/lib/api/client.ts` | `notificationPatchSchema`; `PLATFORM_API.NOTIFICATIONS`. |
| Tests | `app/lib/notifications/notify.test.ts`, `app/api/notifications/route.test.ts` | 11 tests (audience projection, actor exclusion, state merge, 401/400 gates, update-vs-insert). Full suite **354 passed**; `tsc --noEmit` clean; `npm run lint` passes (two complexity warnings on the route, in line with the codebase). |

### Done since (the floors that make it work end to end, 2026-08-15)

1. ~~**Apply the migration.**~~ **Done** — via MCP `apply_migration`; both tables live, RLS on / 0 policies, all 3 CHECKs and 6 indexes verified.
2. ~~**Wire producers.**~~ **Done** — `notify()` emits `order.created` (`app/api/orders/route.ts`), `order.status_changed` (`app/api/orders/[id]/route.ts`, only on a real transition, with from→to), `payment.recorded` (`app/api/orders/[id]/payments/route.ts`), and `member.added` (`app/api/webhooks/clerk/route.ts`, directed to the new member). Each non-fatal (a failed notify never fails the primary write) and asserted in the route's `route.test.ts`.
3. ~~**Read layer + UI.**~~ **Done** — SWR pull hook `app/hooks/notifications/useNotifications.ts` (`useNotificationInbox` + `useNotificationMutations`, ~90s refresh + revalidate-on-focus); presenter `app/lib/notifications/present.ts` (verb+data → display copy at read time, the LABEL dimension); the stub `NotificationsContext` rewritten to back the existing drawer/menu/indicator with live data (interface-preserving); `NotificationItem` trimmed of its social-app "X did Y to Z" line, which didn't fit the domain. Presenter tested.

### Remaining refinements (not blockers)

- **Unread-count endpoint** — the badge currently counts unread within the fetched page; a dedicated count endpoint is the clean version at scale. **"Mark all read"** loops per-item (fine at this scale; a `last_seen_at` watermark is the efficient form).
- ~~**Deep-link routing**~~ — **done 2026-08-15.** Clicking a notification opens its linked order via `useSheets().openOrder()` (the "one door" convention), from both the drawer (`NotificationItem` — closes the drawer first so it doesn't re-pop on back-nav) and the header popover (`NotificationsMenu`). Target resolved by `notificationOrderId()` in `present.ts`: a payment links to the *order it settles* (its `target`), not the payment row; membership events have no order link. Tested.
- **Inbox aggregation** via `group_key`, **archived-exclusion in SQL**, and the **upsert** primitive on `TenantDb` — all noted below.
- **Later tracks (own infra):** digest/batching, per-user preferences, email/push, the due-soon/overdue scheduler.

### Known foundation-level deferrals (documented, not accidental)

- **Unread-count endpoint** and **"mark all read"** — deferred to the UI floor; both are cheap adds (the latter wants a per-user `last_seen_at` watermark rather than writing a read row per item).
- **Archived-exclusion in SQL** — the inbox returns `state:'archived'` rather than filtering it server-side (needs the read-state join; would complicate paging). Revisit with an inbox view if paging over large archived sets ever matters.
- **Upsert** — the scoped accessor exposes none, so read-state uses update-then-insert. Fine at this scale; add `upsert` to `TenantDb` if a second consumer needs it.
