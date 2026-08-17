-- Close the two live RLS holes on the LEGACY public.notifications table.
--
-- Context: docs/v2-migration/NOTIFICATIONS_REBUILD.md §2. This table is the
-- pre-Clerk, single-shop notifications store (3,348 rows). The v2 rebuild
-- (v2.notifications) supersedes it, but the old table stays live until its
-- data is formally dropped (§9.3, no backfill). Until then its RLS must not
-- leak, and this migration closes both holes the audit found.
--
-- These are policy-only changes on an unmigrated public-schema table; nothing
-- money-adjacent, nothing in v2. Mirrored here per CLAUDE.md and applied to the
-- live project as a deliberate security fix.

-- ---------------------------------------------------------------------------
-- S1 (Critical) — world-readable.
-- `public_read_notifications` is `SELECT USING (true)` for PUBLIC (anon
-- included). Postgres OR's permissive policies, so it nullified the correct
-- `notifications_select_policy` (USING user_id = auth.uid()) and exposed every
-- user's notifications to any caller holding the public anon key. Drop it; the
-- scoped SELECT policy remains and becomes authoritative again.
-- ---------------------------------------------------------------------------
drop policy if exists public_read_notifications on public.notifications;

-- ---------------------------------------------------------------------------
-- S2 (High) — forgeable inserts.
-- The insert policy's WITH CHECK was only `auth.role() = 'authenticated'`,
-- which constrains WHO may insert but not the row's `user_id` — so any
-- authenticated caller could write notifications addressed to any user.
-- Replace it with an ownership check: a caller may only insert rows addressed
-- to themselves. Service-role writers bypass RLS and are unaffected; any
-- legitimate "notify another user" fan-out belongs to a service-role/DB path,
-- not a client-authenticated insert.
-- ---------------------------------------------------------------------------
drop policy if exists notifications_insert_policy on public.notifications;
create policy notifications_insert_policy on public.notifications
  for insert to authenticated
  with check (user_id = auth.uid());
