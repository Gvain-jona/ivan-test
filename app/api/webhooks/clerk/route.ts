import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { clerkClient } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { createV2AdminClient } from '@/utils/supabase/server-v2';

/**
 * Syncs Clerk Organizations (source of truth for org identity,
 * membership, and roles) into the v2.organizations/organization_members
 * mirror. See app/lib/auth/tenant.ts for how the mirror is read.
 *
 * Also closes the "new-user provisioning" gap: `user.created` mints
 * the app-internal UUID and sets it as Clerk `public_metadata.
 * internal_user_id` immediately, instead of relying on the manual
 * scripts/clerk-backfill.js (which still exists for pre-Clerk
 * stragglers, but new signups no longer need it).
 *
 * All handlers are upsert/idempotent — Clerk retries failed
 * deliveries, and event ordering between related events (e.g.
 * organization.created vs. organizationMembership.created) isn't
 * guaranteed, so each handler resolves what it needs defensively
 * rather than assuming an earlier event already ran.
 *
 * Register this endpoint's URL + signing secret (CLERK_WEBHOOK_SIGNING_SECRET,
 * the name verifyWebhook() reads by default) in the Clerk dashboard.
 */

type Admin = ReturnType<typeof createV2AdminClient>;
type OrgEvent = { id: string; name: string; slug?: string | null; created_by?: string };
type MembershipEvent = {
  role: string;
  organization: { id: string };
  public_user_data?: { user_id: string };
};

async function getInternalUserId(clerkUserId: string): Promise<string | null> {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const existing = user.publicMetadata?.internal_user_id;
  return typeof existing === 'string' ? existing : null;
}

async function getOrCreateInternalUserId(clerkUserId: string): Promise<string> {
  const existing = await getInternalUserId(clerkUserId);
  if (existing) return existing;

  const internalUserId = randomUUID();
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { internal_user_id: internalUserId },
  });
  return internalUserId;
}

function stripOrgPrefix(role: string) {
  return role.replace(/^org:/, '');
}

async function findMirroredOrgId(admin: Admin, clerkOrgId: string) {
  const { data, error } = await admin
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', clerkOrgId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function handleOrganizationCreated(admin: Admin, org: OrgEvent) {
  if (!org.created_by) return; // no creator to attribute ownership to
  const ownerInternalId = await getOrCreateInternalUserId(org.created_by);

  const { error } = await admin.rpc('provision_organization', {
    p_clerk_org_id: org.id,
    p_name: org.name,
    p_owner_user_id: ownerInternalId,
    p_slug: org.slug ?? null,
  });
  if (error) throw error;
}

async function handleOrganizationUpdated(admin: Admin, org: OrgEvent) {
  const { error } = await admin
    .from('organizations')
    .update({ name: org.name, slug: org.slug ?? null })
    .eq('clerk_org_id', org.id);
  if (error) throw error;
}

async function handleOrganizationDeleted(admin: Admin, clerkOrgId: string) {
  // Archive, never hard-delete. The mirror row's internal uuid is the
  // FK anchor for the tenant's orders/clients/products/counters, so a
  // DELETE would cascade real business data into oblivion — the exact
  // thing the archive-not-delete convention exists to prevent. Flip
  // status to 'archived' and stamp deleted_at instead; access is
  // already cut off Clerk-side (the org leaves the user's session, so
  // resolveTenant() sees no orgId), this just keeps the mirror honest.
  const { error } = await admin
    .from('organizations')
    .update({ status: 'archived', deleted_at: new Date().toISOString() })
    .eq('clerk_org_id', clerkOrgId);
  if (error) throw error;
}

async function handleMembershipUpsert(admin: Admin, membership: MembershipEvent) {
  const clerkUserId = membership.public_user_data?.user_id;
  if (!clerkUserId) return;

  const internalUserId = await getOrCreateInternalUserId(clerkUserId);
  const role = stripOrgPrefix(membership.role);

  const orgId = await findMirroredOrgId(admin, membership.organization.id);
  // organization.created hasn't landed yet — Clerk retries failed
  // deliveries, and this event alone can't provision an org (no
  // counters/owner context), so fail and let the retry catch it up
  // once the org row exists.
  if (!orgId) throw new Error(`organization ${membership.organization.id} not yet mirrored`);

  const { error } = await admin
    .from('organization_members')
    .upsert(
      { organization_id: orgId, user_id: internalUserId, role },
      { onConflict: 'organization_id,user_id' },
    );
  if (error) throw error;
}

async function handleMembershipDeleted(admin: Admin, membership: MembershipEvent) {
  const clerkUserId = membership.public_user_data?.user_id;
  if (!clerkUserId) return;

  const internalUserId = await getInternalUserId(clerkUserId);
  if (!internalUserId) return;

  const orgId = await findMirroredOrgId(admin, membership.organization.id);
  if (!orgId) return;

  const { error } = await admin
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', internalUserId);
  if (error) throw error;
}

type ClerkEvent = Awaited<ReturnType<typeof verifyWebhook>>;

async function dispatch(admin: Admin, evt: ClerkEvent) {
  switch (evt.type) {
    case 'user.created':
      await getOrCreateInternalUserId(evt.data.id);
      break;
    case 'organization.created':
      await handleOrganizationCreated(admin, evt.data);
      break;
    case 'organization.updated':
      await handleOrganizationUpdated(admin, evt.data);
      break;
    case 'organization.deleted':
      if (evt.data.id) await handleOrganizationDeleted(admin, evt.data.id);
      break;
    case 'organizationMembership.created':
    case 'organizationMembership.updated':
      await handleMembershipUpsert(admin, evt.data);
      break;
    case 'organizationMembership.deleted':
      await handleMembershipDeleted(admin, evt.data);
      break;
    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  let evt: ClerkEvent;
  try {
    evt = await verifyWebhook(request);
  } catch (err) {
    console.error('Clerk webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    await dispatch(createV2AdminClient(), evt);
  } catch (error) {
    console.error(`Clerk webhook handler error for ${evt.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
