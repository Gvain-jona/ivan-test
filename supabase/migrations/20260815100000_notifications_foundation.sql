-- Notifications foundation — the core activity stream + per-user read state.
--
-- Design: docs/v2-migration/NOTIFICATIONS_REBUILD.md (§6, §12).
-- One activity stream, projected by ACCESS (audience) and LABEL (voice).
-- A notification and an org-activity item are the same fact; there is no
-- per-recipient fan-out — one row carries its audience.
--
-- This is distinct from v2.activity_logs, which is an append-only *audit*
-- log (field-level old/new change tracking, no audience, no read state).
--
-- Scope note: additive only (two new tables, no touch to existing objects,
-- nothing money-adjacent). Mirrored here per CLAUDE.md; applying to the live
-- v2 project is a separate, deliberate step.

-- ---------------------------------------------------------------------------
-- v2.notifications — the fact. One row per event, structured (actor/verb/
-- object/target), not a frozen rendered string. Immutable by convention:
-- read state lives in v2.notification_reads, never on the fact.
-- ---------------------------------------------------------------------------
create table if not exists v2.notifications (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references v2.organizations(id) on delete cascade,

  -- Who did it. NULL = system. The actor is excluded from their own inbox at
  -- read time (you are not notified of your own action), so no write-time
  -- filtering is needed.
  actor_user_id      uuid,

  -- The activity type — drives rendering, routing and aggregation.
  -- e.g. order.created | order.status_changed | payment.recorded | member.added
  verb               text not null,

  -- Preference-grouping bucket. e.g. order_activity | payments | team.
  -- Present from day one so a preference matrix layers on with no migration.
  category           text not null,

  -- The entity the activity is about, and optional context (e.g. the order a
  -- payment settles). Gives a reliable click-through target without parsing text.
  object_type        text not null,
  object_id          uuid not null,
  target_type        text,
  target_id          uuid,

  -- A small denormalized render snapshot (order_number, client_name, amount,
  -- from_status/to_status …) — enough to render one row without N+1 lookups
  -- while the row stays structured.
  data               jsonb not null default '{}'::jsonb,

  -- Aggregation key, e.g. 'payments:order:<id>' — collapses "Sarah and 2
  -- others…" in the inbox and feeds later digests.
  group_key          text,

  -- ACCESS dimension. 'org' = everyone in the org; 'users' = a directed set.
  audience_scope     text not null default 'org'
                       check (audience_scope in ('org', 'users')),
  -- The directed set when scope='users'; empty for org-wide.
  recipient_user_ids uuid[] not null default '{}'::uuid[],

  -- Reserved for later channel routing (batched channels bypass on 'high').
  -- Unused by the in-app bell.
  priority           text not null default 'normal'
                       check (priority in ('normal', 'high')),

  created_at         timestamptz not null default now(),

  -- A directed activity must actually name recipients; an org one must not.
  constraint notifications_audience_shape check (
    (audience_scope = 'org'   and cardinality(recipient_user_ids) = 0) or
    (audience_scope = 'users' and cardinality(recipient_user_ids) > 0)
  )
);

-- Inbox reads are "my org, newest first"; the audience predicate (org-wide OR
-- I'm a recipient) rides on top.
create index if not exists notifications_org_created_idx
  on v2.notifications (organization_id, created_at desc);
-- Directed-audience membership test (recipient_user_ids @> array[me]).
create index if not exists notifications_recipients_gin
  on v2.notifications using gin (recipient_user_ids);
-- Aggregation lookups by group_key within an org.
create index if not exists notifications_group_idx
  on v2.notifications (organization_id, group_key);

-- ---------------------------------------------------------------------------
-- v2.notification_reads — per-user interaction state, sparse. A row exists
-- only once a user has acted on a notification (opened or dismissed it).
-- Carries organization_id so it is reachable through the org-scoped TenantDb.
-- ---------------------------------------------------------------------------
create table if not exists v2.notification_reads (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references v2.organizations(id) on delete cascade,
  notification_id  uuid not null references v2.notifications(id) on delete cascade,
  user_id          uuid not null,
  read_at          timestamptz,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  -- One state row per (notification, user).
  constraint notification_reads_unique unique (notification_id, user_id)
);

create index if not exists notification_reads_user_idx
  on v2.notification_reads (organization_id, user_id);

-- ---------------------------------------------------------------------------
-- RLS: enabled with NO policies. The v2 surface is accessed by the
-- service-role client through the org-scoped TenantDb wrapper, which IS the
-- tenant boundary until the Phase 2 RLS flip; service_role bypasses RLS, and
-- deny-by-default here means anon/authenticated get nothing. This is the
-- deliberate opposite of the legacy public.notifications leak (a
-- USING(true) SELECT policy) documented in NOTIFICATIONS_REBUILD.md §2.
-- Phase 2 adds real per-user policies here in the same change that flips the
-- rest of v2.
-- ---------------------------------------------------------------------------
alter table v2.notifications      enable row level security;
alter table v2.notification_reads enable row level security;
