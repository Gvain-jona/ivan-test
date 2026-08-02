-- Un-break tenant provisioning.
--
-- A second provision_organization overload was added DB-side (the 5-arg
-- form, which also seeds settings.identity/tax/documents/platform_access
-- and an optional locale.currency). The original 4-arg function from
-- 20260724000000 was left in place, so both existed at once.
--
-- The Clerk webhook calls it with exactly the four named args
-- (p_clerk_org_id, p_name, p_owner_user_id, p_slug). p_currency defaults
-- to null on the 5-arg form, so that call matches BOTH candidates and
-- Postgres refuses it:
--
--   42725  function v2.provision_organization(p_clerk_org_id => text,
--          p_name => unknown, p_owner_user_id => uuid, p_slug => unknown)
--          is not unique
--
-- Consequence: every organization.created delivery 500s, no
-- v2.organizations row is ever written, resolveTenant() returns null, and
-- the new tenant is stuck on ProvisioningPendingScreen forever — first-run
-- onboarding is unreachable. organizationMembership.created then fails the
-- same way ("organization ... not yet mirrored").
--
-- The 5-arg form supersedes the 4-arg one entirely: same behaviour when
-- p_currency is omitted, plus the seeded settings blocks. Drop the old one
-- so the webhook's call resolves uniquely.
drop function if exists v2.provision_organization(text, text, uuid, text);

-- The 5-arg overload shipped with default (PUBLIC) execute. It is
-- SECURITY DEFINER and takes the owner's user id as an argument, so
-- EXECUTE on it is the right to mint an organization and make any user
-- its owner. Unreachable today only because the v2 schema isn't exposed
-- to PostgREST — Phase 2 exposes it. Lock it to service_role now, matching
-- create_order_as_org / issue_document_as_org / record_payment_as_org.
revoke all on function v2.provision_organization(text, text, uuid, text, text) from public;
revoke all on function v2.provision_organization(text, text, uuid, text, text) from anon;
revoke all on function v2.provision_organization(text, text, uuid, text, text) from authenticated;
grant execute on function v2.provision_organization(text, text, uuid, text, text) to service_role;

comment on function v2.provision_organization(text, text, uuid, text, text) is
  'Atomic first-provisioning for a new Clerk Organization: org row (with starter settings blocks) + owner membership + starter counters. Called from the Clerk webhook on organization.created. Idempotent by clerk_org_id. service_role only.';
