-- Clerk Organizations becomes the source of truth for org identity
-- (name, logo, membership, roles); v2.organizations stays a thin
-- mirror for app-only fields (order_statuses, currency, counters).
-- clerk_org_id maps Clerk's org_... id to the existing internal uuid
-- PK, which stays the FK anchor everywhere (orders, clients, etc.) —
-- no PK type change. Standard UNIQUE constraint allows multiple NULLs,
-- so existing rows (no Clerk org yet) are unaffected.
--
-- Applied to the live project via MCP apply_migration on 2026-07-24;
-- this file mirrors it so the repo's migration history stays complete.

alter table v2.organizations add column clerk_org_id text unique;

-- Atomic provisioning for a brand-new Clerk organization: creates the
-- mirror row, the owner's membership, and seeds the counters
-- next_number() requires (it raises if a counter row is missing).
-- Idempotent by clerk_org_id so a retried webhook delivery is safe.
-- Mirrors the create_order_as_org shim's pattern: SECURITY DEFINER,
-- empty search_path, service_role only.
create or replace function v2.provision_organization(
  p_clerk_org_id text,
  p_name text,
  p_owner_user_id uuid,
  p_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  if p_clerk_org_id is null then
    raise exception 'provision_organization: p_clerk_org_id is required';
  end if;
  if p_owner_user_id is null then
    raise exception 'provision_organization: p_owner_user_id is required';
  end if;

  select id into v_org_id from v2.organizations where clerk_org_id = p_clerk_org_id;
  if v_org_id is not null then
    return v_org_id;
  end if;

  insert into v2.organizations (clerk_org_id, name, slug, owner_user_id, status)
  values (p_clerk_org_id, p_name, p_slug, p_owner_user_id, 'active')
  returning id into v_org_id;

  insert into v2.organization_members (organization_id, user_id, role)
  values (v_org_id, p_owner_user_id, 'owner')
  on conflict (organization_id, user_id) do nothing;

  -- Universal counter set confirmed against existing orgs' actual rows
  -- (doc:invoice / doc:quotation / order present on every org today;
  -- doc:proforma is optional/not universal, so not seeded by default).
  insert into v2.counters (organization_id, counter_key, current_value, format)
  values
    (v_org_id, 'order', 0, 'ORD-{YYYY}-{N5}'),
    (v_org_id, 'doc:invoice', 0, 'INV-{YYYY}-{N5}'),
    (v_org_id, 'doc:quotation', 0, 'QT-{YYYY}-{N5}')
  on conflict (organization_id, counter_key) do nothing;

  return v_org_id;
end;
$$;

revoke all on function v2.provision_organization(text, text, uuid, text) from public;
revoke all on function v2.provision_organization(text, text, uuid, text) from anon;
revoke all on function v2.provision_organization(text, text, uuid, text) from authenticated;
grant execute on function v2.provision_organization(text, text, uuid, text) to service_role;

comment on function v2.provision_organization(text, text, uuid, text) is
  'Atomic first-provisioning for a new Clerk Organization: org row + owner membership + starter counters. Called from the Clerk webhook on organization.created.';
