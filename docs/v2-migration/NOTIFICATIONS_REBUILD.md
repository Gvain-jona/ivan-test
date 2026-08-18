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

The `public.notifications` table is live with 3,348 real rows (pre-Clerk, keyed to old `auth.users` ids). Its RLS was broken; **both holes are now closed (2026-08-17)** — see the resolution below.

- **S1 (Critical) — world-readable.** Policy `public_read_notifications`: `SELECT … USING (true)` for role `public` (anon included). Postgres OR's permissive policies, so the correct `user_id = auth.uid()` policy was nullified — **any caller holding the public anon key could read everyone's notifications** (order numbers, client names, messages). The orphan policy existed only in the live DB, in no migration file.
- **S2 (High) — forgeable.** `notifications_insert_policy`: `INSERT` for role `public` with `WITH CHECK (auth.role() = 'authenticated')` — it constrained *who* could insert but not the row's `user_id`, so any authenticated caller could insert rows addressed to an arbitrary `user_id`.

**Resolution (2026-08-17, `20260817120000_close_legacy_notifications_rls_holes.sql`, applied live):**
- **S1 fixed** — `DROP POLICY public_read_notifications`. The scoped `notifications_select_policy` (`USING user_id = auth.uid()`) is authoritative again; reads are per-user.
- **S2 fixed** — insert policy replaced with `WITH CHECK (user_id = auth.uid())` for role `authenticated`. A caller may only insert notifications addressed to themselves; service-role writers bypass RLS and are unaffected.
- Verified against `pg_policy` on the live project after apply: the four remaining policies are all `user_id = auth.uid()`-scoped, no `USING(true)` remains.

The two legacy writers the drop-the-table decision must still account for (§11) were checked and are non-functional post-Clerk (an anon-role cron insert already blocked by RLS; an edge function that authenticates with a Supabase JWT the app no longer issues), so tightening the insert policy broke nothing reachable. Dropping the legacy table wholesale (§7, §9.3) remains the eventual endgame; these policy fixes close the live exposure in the meantime.

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
- **UI**: the full inbox is a **top-level screen**, `app/dashboard/notifications/page.tsx` (**decision 2026-08-17, superseding the earlier AppSheet plan** — see below). The header menu (`NotificationsMenu`) and badge (`NotificationsIndicator`) stay; `NotificationItem`/`NotificationGroup` are shared by the screen and the menu. The stub `NotificationsContext` is replaced by the hook (it still holds the badge/lazy-list plumbing).

  > **Screen, not sheet (2026-08-17).** An earlier pass moved the inbox onto the `AppSheet` primitive ("one sheet, one door"). On review that was the wrong call for this surface: a notification inbox is *browse-and-triage*, which the CLAUDE.md carve-out classifies as a **screen** (like Orders/Clients), not a one-decision sheet. A screen is a real destination — the Alerts tab lights when active, a deep-link out to an order returns here on Back, the full height fits an All/Unread filter, and vertical scroll never fights drag-to-dismiss. The Alerts tab (`MobileTabBar`) and the header menu's "View all" now route to `/dashboard/notifications`; `NotificationsDrawer.tsx` is deleted. The unused `openDrawer`/`closeDrawer`/`isDrawerOpen` remain on the context (the latter still gates the lazy list) — optional cleanup.

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

- **Push notifications** need real infra that doesn't exist: VAPID keys, a `push_subscriptions` table (org-scoped, endpoint-per-device), a server send path (`web-push`), and the SW actually registered *and* subscribed. Today it's a permission prompt wired to nothing (`registerServiceWorker()` never called; wrong path). That's a dark pattern. **Decided (§9.4): pull the prompt now** (`NotificationPermissionRequest` in `DashboardLayout`), as part of cleanup, and defer *building* push to its own scoped track. **The full delivery design — and the correction that Web Push is NOT blocked on Phase 2 — is now §14.** (This bullet's old "defer indefinitely" wording undersold it: the infra is modest and independent of the RLS flip; see §14.)
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

- **Phase 1 — buildable now (no new infra, no RLS dependency):** `v2.notifications` table (org + recipient); migrated-pattern route + tests + SWR hook (pull, ~60–120s refresh); app-layer emit on the **three settled events** — order created, order status changed, payment recorded (§9.1), targeted at all org members except the actor (§9.2); the membership event on the Clerk webhook; drawer moved to `AppSheet`. No preferences (§9.5). Delete the dead code, discard the legacy tables, and pull the push prompt (§11, §9.3–9.4).
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
- **Legacy DB** — `public.notifications` (3,348 rows), `public.notification_preferences`, and the three dead role-model functions/triggers (§2). **Update (2026-08-17): the RLS holes (S1/S2) are now closed** — the orphan `public_read_notifications` policy is dropped and the insert policy is ownership-scoped (§2). *Dropping the tables themselves* is still a **separate DB change needing explicit go-ahead**, and must account for the two legacy writers (`app/api/cron/generate-recurring-expenses`, `supabase/functions/create-or-update-order.ts`) — both verified non-functional post-Clerk, but the table drop is a data-disposition decision (§9.3), not a security one, and stays deferred.

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

- **Inbox** (Alerts tab / bell → `/dashboard/notifications` screen) — the persistent record. Phase-1 surface. (Was an `AppSheet` drawer; changed to a full screen 2026-08-17 — see §5.)
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

- ~~**Unread-count endpoint**~~ — **done 2026-08-15.** `GET /api/notifications/count` returns the true unread total (audience notifications the caller didn't cause, minus the ones they've resolved — two head COUNTs, no anti-join). `useUnreadCount()` feeds the badge; it shares the `/api/notifications` key prefix so marking one read invalidates it. Tested. **"Mark all read"** still loops per-item (fine at this scale; a `last_seen_at` watermark is the efficient form).
- ~~**Lazy inbox list**~~ — **done 2026-08-15.** `useNotificationInbox({ enabled })` fetches nothing (null SWR key) unless a list surface is active; the provider sets `enabled = isDrawerOpen || subscribers > 0`. So a page showing only the bell pulls just the cheap count, never the list. Surfaces opt in via `subscribeList()` (the drawer via its open state; `NotificationsMenu` on mount — currently gated off in `context-menu.tsx`, but wired so it works when re-enabled). Note: the header notifications menu and footer bell are **disabled** today (`context-menu.tsx` returns null for `notifications`; the indicator is `disabled`), so the drawer is the only live list surface.
- ~~**Deep-link routing**~~ — **done 2026-08-15.** Clicking a notification opens its linked order via `useSheets().openOrder()` (the "one door" convention), from both the inbox (`NotificationItem`) and the header popover (`NotificationsMenu`). Target resolved by `notificationOrderId()` in `present.ts`: a payment links to the *order it settles* (its `target`), not the payment row; membership events have no order link. Tested. *(From the screen the earlier "close the drawer first" step is moot — it's a forward navigation that Back returns from.)*
- **Per-item archive on mobile** — the clean screen (2026-08-17) reveals the row's overflow menu on hover/focus, so per-item Mark-read/Archive is desktop-first; the intended mobile affordance is **swipe-to-archive**, not yet built. Mobile triage today = tap-to-open (marks read) + header "Mark all read". Swipe is the next interaction floor.
- ~~**Mobile-first sheet primitive**~~ — **done 2026-08-15.** The shared sheet primitive was renamed `OrderSheet` → **`AppSheet`** (it was never order-specific — used by client/product forms, onboarding, the tab-bar More sheet; the name misled). `NotificationsDrawer` was rewritten off the legacy `SideDrawer` (fixed 450px right panel) onto `AppSheet`, so the Alerts tab now opens a **bottom sheet on mobile** / right panel on desktop, matching the tab bar's own More sheet. The dead "Clear all" archived button (called the no-op `deleteAllArchived`) was removed per "every signifier is wired". `SideDrawer` is no longer used by notifications.
- ~~**PATCH authorization (write-side IDOR)**~~ — **done 2026-08-17.** `PATCH /api/notifications` now verifies the target notification is in the caller's audience (same predicate GET projects with) before writing read-state, rather than trusting the body's `id`. Previously any caller could write a `notification_reads` row against an arbitrary notification id — contained (own state only, no cross-tenant read/tamper) but it let them skew their own unread count. Rejected with 404; tested.
- ~~**Webhook `member.added` idempotency**~~ — **done 2026-08-17.** The "you were added" notify is now gated on *genuine first-time membership* (a prior-existence check before the upsert) instead of the Clerk event type, so a retried `organizationMembership.created` delivery no longer re-sends the notification. Tested.
- **Inbox aggregation** via `group_key`, **archived-exclusion in SQL**, and the **upsert** primitive on `TenantDb` — all noted below.
- **Later tracks (own infra):** digest/batching, per-user preferences, email/push, the due-soon/overdue scheduler.

### Known foundation-level deferrals (documented, not accidental)

- **Unread-count endpoint** and **"mark all read"** — deferred to the UI floor; both are cheap adds (the latter wants a per-user `last_seen_at` watermark rather than writing a read row per item).
- **Archived-exclusion in SQL** — the inbox returns `state:'archived'` rather than filtering it server-side (needs the read-state join; would complicate paging). Revisit with an inbox view if paging over large archived sets ever matters.
- **Upsert** — the scoped accessor exposes none, so read-state uses update-then-insert. Fine at this scale; add `upsert` to `TenantDb` if a second consumer needs it.

---

## 14. Delivery & Web Push — the design (2026-08-18)

The foundation shipped the **model** and one **channel: in-app pull**. This
section is the honest answer to the question the rebuild kept deferring —
*"since this is a web app, how do notifications actually reach a user?"* — and
it corrects a framing error in §8.

### 14.1 The gap, stated plainly

Delivery today is SWR pull: `useNotifications.ts` polls every ~90s
(`REFRESH_MS`) plus revalidate-on-focus. That means a notification reaches a
user **only while they have the app tab open**, and even then up to ~90s late.
**Close the tab and nothing arrives.** For the highest-signal event this app
has — *payment recorded*, to the owner — "you'll see it next time you open the
tab" is not delivery. Pull is a freshness layer, not a delivery channel.

### 14.2 The three web delivery layers

| Layer | Reaches a user who… | Blocked on Phase 2? | Verdict |
|---|---|---|---|
| **Pull** (today) | has the tab open, ~90s lag | No | Keep as the in-app freshness layer. |
| **Realtime** (Supabase realtime / SSE / WebSocket) | has the tab open, instant | **Supabase realtime: yes** (browser has no Clerk→Supabase session until the RLS flip). SSE/WS from a Clerk-authed Next route: no — but long-lived connections are awkward on Vercel serverless. | **Skip as a stopgap.** It only upgrades the *already-open* case (90s → instant); it does not reach a user who isn't looking. Low value for the cost. |
| **Web Push** (Push API + Service Worker) | **has the app closed** | **No** | **This is the real answer.** Connectionless, closed-tab, server-driven. |

### 14.3 The correction: Web Push is independent of Phase 2

§4/§8/§10 tie the delivery story to Phase 2 ("swap pull → realtime at the RLS
flip"). That is true **only for client-side Supabase realtime**, which needs a
browser Supabase session (third-party auth + the RLS flip). **Web Push does not
touch any of that.** Its send path is entirely server-side: a Clerk-authed Next
route reads subscriptions via the service-role `TenantDb` and POSTs to the push
endpoints with the `web-push` library. It works with **today's** auth model.
Push was deferred *by choice* in the foundation PR, not *by dependency* — the
"defer indefinitely" wording in §8/§9.4 undersold it. It is buildable now.

Corollary: the phasing in §10 should read **"pull now → add Web Push (any
time, no RLS dependency) → optional in-app realtime at/after Phase 2"**, not
"pull until Phase 2 then realtime." Realtime is the least urgent of the three.

### 14.4 The one caveat that shapes everything: iOS

Web Push on iPhone works **only for an app added to the Home Screen** (an
installed PWA, iOS 16.4+). A plain Safari **tab gets no push at all.** There is
**no web manifest in the repo today**, so the app isn't installable and iOS push
is currently impossible until that's added. Desktop Chrome/Edge/Firefox and
Android Chrome need no install step.

For a shop owner on an iPhone this is real adoption friction ("Add to Home
Screen" first). The product fork:
- **Accept install-to-get-push on iOS** (ship a manifest + an install nudge), or
- **Add a non-web fallback** (email, later SMS) for the single highest-signal
  event — *payment recorded, to the owner* — so the money signal lands even
  without an installed PWA. Email is its own channel and its own track; naming
  it here so the iOS gap is a known, decided thing, not a silent hole.

This is an **owner decision**, recorded as open at the end of this section.

### 14.5 What building Web Push takes (all additive; the seams already exist)

The foundation was built "design wide, deliver narrow" (§12): `category`,
`priority`, channel-as-enum, and the `notify()` workflow seam are already
present, so this slots in **without touching the event sites**.

1. **`v2.push_subscriptions`** — one row per device/endpoint: `id`,
   `organization_id` (tenant boundary, reached via `TenantDb`), `user_id`,
   `endpoint` (unique), `p256dh`, `auth`, `user_agent`, `created_at`,
   `last_used_at`. RLS **enabled, deny-by-default** like the rest of v2 (§13).
   → this is the **DB ask** (see `DB_ASKS.md`).
2. **VAPID keypair** — `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client) +
   `VAPID_PRIVATE_KEY` (server-only), plus the `web-push` dependency.
3. **A real service worker** (`public/sw.js`) with `push` and
   `notificationclick` handlers — the click reuses `notificationOrderId()`
   (`present.ts`) to focus/open the deep-linked order, the same target the
   in-app row already routes to. Plus a **web manifest** for installability
   (also unlocks iOS, §14.4).
4. **A subscribe flow gated behind an explicit user action** — register the SW,
   `Notification.requestPermission()` on a deliberate tap (never the old
   auto-prompt dark pattern), `pushManager.subscribe({ applicationServerKey })`,
   POST the subscription to `POST /api/notifications/push/subscribe`
   (Clerk-authed, writes via `TenantDb`). An unsubscribe/prune route mirrors it.
5. **A `deliver()` step after `notify()`** — resolve recipients from the
   activity's audience (org members for `audience_scope='org'`; the listed
   users for `'users'`), look up their `push_subscriptions`, and
   `web-push.sendNotification()` to each. Non-fatal, exactly like the activity
   insert. Prune endpoints that return `404`/`410` (expired). This is the
   channel step of the four-layer model (§12.2) — it plugs into the existing
   seam, so the order/payment/webhook call sites don't change.
6. **Per-user preferences finally earn their place** — push is the first channel
   worth muting per category (§12.6). The `category` column is already there; a
   `notification_preferences`-style per-user matrix (per-user, not on
   `organizations.settings`, §9.5) becomes real work only when this channel
   ships.

None of the above blocks on Phase 2, and none of it touches money functions.

### 14.6 Recommended shape

- **Keep pull** as the in-app freshness layer (unchanged).
- **Build Web Push** as its own PR/track: the `push_subscriptions` DB ask, VAPID
  + `web-push`, SW + manifest, the gated subscribe flow, and the `deliver()`
  seam. Scope the first cut to **`payment.recorded` + `order.status_changed`**
  (the two a closed-tab user actually wants), widening to the rest for free once
  the channel exists.
- **Treat in-app realtime as optional** and later — it's the smallest win.
- **Decide the iOS path** (§14.4) before building, since it changes whether a
  manifest + install nudge (and possibly an email fallback) are in scope.

### 14.7 Open decisions for the owner

1. **iOS delivery** — accept "install the PWA to get push on iPhone," or add an
   **email fallback** for the money signal? (§14.4)
2. **Build trigger** — start the Web Push track now, or after the current
   inbox/UX PRs settle? (Independent of Phase 2 either way.)
3. **First-cut event scope** — push only `payment.recorded` (+ maybe
   `order.status_changed`), or all four from day one?
