-- INTERIM shim for the service-role data path while Clerk auth is not
-- yet wired. v2.create_order is SECURITY INVOKER and derives org/user
-- strictly from JWT claims, which the service key does not carry.
-- This wrapper injects those claims transaction-locally (is_local =>
-- true, so they revert on commit/rollback) and delegates.
-- Mirrors the p_org override pattern already used by v2.next_number.
-- DROP this function once authenticated requests carry real
-- organization_id claims (Clerk third-party auth).
--
-- Applied to the live project via MCP apply_migration on 2026-07-10;
-- this file mirrors it so the repo's migration history stays complete.

create or replace function v2.create_order_as_org(p_org uuid, p_user uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_org is null then
    raise exception 'create_order_as_org: p_org is required';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('organization_id', p_org, 'sub', p_user, 'role', 'authenticated')::text,
    true
  );

  return v2.create_order(payload);
end;
$$;

revoke all on function v2.create_order_as_org(uuid, uuid, jsonb) from public;
revoke all on function v2.create_order_as_org(uuid, uuid, jsonb) from anon;
revoke all on function v2.create_order_as_org(uuid, uuid, jsonb) from authenticated;
grant execute on function v2.create_order_as_org(uuid, uuid, jsonb) to service_role;

comment on function v2.create_order_as_org(uuid, uuid, jsonb) is
  'INTERIM service-role shim: injects org/user claims locally, delegates to v2.create_order. Drop when Clerk-issued JWTs carry organization_id.';
