-- App-requested v2 change (mirrored here per the repo convention).
--
-- v2.issue_document() derives the tenant from v2.current_org_id(), i.e. from
-- request.jwt.claims. The app reaches Postgres over the service-role
-- connection, which carries no such claims, so the function raises
-- "no organization context" when called directly. Same problem
-- create_order_as_org() already solves for v2.create_order(), same shape of
-- fix — and it disappears at the same moment, when Phase 2 puts real Supabase
-- third-party auth claims on the connection and both shims can be dropped.
--
-- SECURITY DEFINER + service_role only, deliberately: the org id is an
-- ARGUMENT here, so anyone who can execute this can act as any tenant.
-- resolveTenant() is what proves the caller owns p_org. Never grant this to
-- `authenticated`.

CREATE OR REPLACE FUNCTION v2.issue_document_as_org(
  p_org           uuid,
  p_user          uuid,
  p_order_id      uuid,
  p_document_type text,
  p_options       jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
begin
  if p_org is null then
    raise exception 'issue_document_as_org: p_org is required';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('organization_id', p_org, 'sub', p_user, 'role', 'authenticated')::text,
    true
  );

  return v2.issue_document(p_order_id, p_document_type, p_options);
end;
$function$;

COMMENT ON FUNCTION v2.issue_document_as_org(uuid, uuid, uuid, text, jsonb) IS
  'Interim service-role shim: injects org/user claims, then delegates to v2.issue_document. Mirrors create_order_as_org. Drop both when Phase 2 puts real auth claims on the connection.';

REVOKE ALL ON FUNCTION v2.issue_document_as_org(uuid, uuid, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.issue_document_as_org(uuid, uuid, uuid, text, jsonb) TO service_role;

-- issue_document itself shipped with default PUBLIC execute. It reads its org
-- from claims rather than an argument, so it cannot be used to cross tenants —
-- but anon has no business holding EXECUTE on the function that mints invoice
-- numbers. Narrow it to the roles that will actually call it: service_role via
-- the shim today, authenticated directly once Phase 2 lands (matching the
-- grant next_number already carries).
REVOKE ALL ON FUNCTION v2.issue_document(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.issue_document(uuid, text, jsonb) TO service_role, authenticated;
