-- App-requested v2 change (mirrored here per the repo convention).
--
-- Third and last of the interim claim-injecting shims, alongside
-- create_order_as_org and issue_document_as_org: v2.record_payment() reads
-- its tenant from request.jwt.claims, which the service-role connection does
-- not carry. All three retire together in Phase 2.
--
-- Why the app needs record_payment() at all rather than two inserts: the
-- 2026-07-29 rewrite split the cash event (payments) from what it settles
-- (payment_allocations), and orders.amount_paid is recomputed by a trigger on
-- the ALLOCATION. Writing the two separately can leave money recorded but
-- detached from the order the user was paying — recoverable, but silently
-- wrong until someone notices. record_payment() does both in one transaction.
--
-- SECURITY DEFINER + service_role only: p_org is an argument, so execute
-- rights here are rights to act as any tenant. resolveTenant() is what proves
-- the caller owns p_org. Never grant to `authenticated`.

CREATE OR REPLACE FUNCTION v2.record_payment_as_org(
  p_org   uuid,
  p_user  uuid,
  payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
begin
  if p_org is null then
    raise exception 'record_payment_as_org: p_org is required';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('organization_id', p_org, 'sub', p_user, 'role', 'authenticated')::text,
    true
  );

  return v2.record_payment(payload);
end;
$function$;

COMMENT ON FUNCTION v2.record_payment_as_org(uuid, uuid, jsonb) IS
  'Interim service-role shim: injects org/user claims, then delegates to v2.record_payment. Mirrors create_order_as_org and issue_document_as_org. Drop all three when Phase 2 puts real auth claims on the connection.';

REVOKE ALL ON FUNCTION v2.record_payment_as_org(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.record_payment_as_org(uuid, uuid, jsonb) TO service_role;

-- record_payment and void_document also shipped with default PUBLIC execute.
-- Both derive their org from claims so they cannot cross tenants, but anon
-- has no business holding EXECUTE on the functions that move money and void
-- documents.
REVOKE ALL ON FUNCTION v2.record_payment(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.record_payment(jsonb) TO service_role, authenticated;

REVOKE ALL ON FUNCTION v2.void_document(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.void_document(uuid) TO service_role, authenticated;
