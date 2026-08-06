import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { resolveTenant } from '@/lib/auth/tenant';
import {
  handleApiError,
  handleSupabaseError,
  handleUnexpectedError,
} from '@/lib/api/error-handler';
import {
  organizationSettingsPatchSchema,
  type OrganizationSettingsBlocks,
} from '@/lib/api/validators';
import type { OrganizationWritable } from '@/lib/auth/tenant-db';
import { resolveBrandColor } from '@/lib/theme/brand';
import type { Json } from '@/types/supabase-v2';

const ORG_COLUMNS = 'id, name, slug, status, settings, onboarding_completed_at';

/**
 * Merge one level into each named block, rather than replacing it.
 * organizations.settings is a map of blocks (locale, tax, documents,
 * identity); a caller patching settings.locale.currency must not lose
 * settings.locale.timezone, and patching one block must not drop another.
 * Blocks are flat, so one level of depth is the whole story.
 */
function mergeSettings(
  current: Record<string, unknown>,
  patch: OrganizationSettingsBlocks,
): Record<string, unknown> {
  const merged = { ...current };
  for (const [block, values] of Object.entries(patch)) {
    const existing = merged[block];
    merged[block] = {
      ...(existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {}),
      ...values,
    };
  }
  return merged;
}

/**
 * GET /api/organization — the caller's active org: name, slug, settings
 * blocks, whether first-run setup is done, and the brand colour. Org-level
 * config lives in settings; order status values live in field_definitions,
 * not here.
 *
 * brand_color is not a column — it comes from Clerk org metadata via
 * resolveBrandColor(), and is served here so the client has one contract for
 * org config rather than reaching into the Clerk SDK separately.
 */
export async function GET() {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await tenant.db
      .organization()
      .select(ORG_COLUMNS)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({
      organization: data,
      orgRole: tenant.orgRole,
      brand_color: await resolveBrandColor(),
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * Turn a validated patch into the row update it implies. Settings blocks
 * need the current jsonb read back first so the merge can preserve what the
 * patch didn't mention; a patch touching no settings skips that read
 * entirely.
 */
async function buildUpdate(
  tenant: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>,
  patch: z.infer<typeof organizationSettingsPatchSchema>,
) {
  const values: OrganizationWritable = {};

  if (patch.settings) {
    const { data: current, error } = await tenant.db
      .organization()
      .select('settings')
      .single();
    if (error) return { values, readError: error };

    values.settings = mergeSettings(
      (current?.settings as Record<string, unknown> | null) ?? {},
      patch.settings,
    ) as Json;
  }

  if (patch.onboarding_completed !== undefined) {
    values.onboarding_completed_at = patch.onboarding_completed
      ? new Date().toISOString()
      : null;
  }

  return { values, readError: null };
}

/**
 * The brand colour is the one patch key that does not touch the v2 row:
 * Clerk owns org visual identity (name, slug, logo), so the colour lives in
 * its public_metadata and reaches the app as a session claim. See
 * app/lib/theme/brand.ts.
 *
 * Uses the Clerk orgId from auth() rather than tenant.organizationId — the
 * latter is the v2 mirror's uuid, which Clerk's API would not recognise.
 */
async function writeBrandColor(brandColor: string): Promise<boolean> {
  const { orgId } = await auth();
  if (!orgId) return false;

  const client = await clerkClient();
  await client.organizations.updateOrganizationMetadata(orgId, {
    publicMetadata: { brand_color: brandColor },
  });
  return true;
}

/**
 * PATCH /api/organization — update org-level config. Owner only.
 *
 * Three destinations, deliberately: `settings` blocks are merged into the
 * settings jsonb (whose shape the DB trigger governs), `onboarding_completed`
 * writes its own column, and `brand_color` writes Clerk org metadata. Setup
 * progress is lifecycle state, and settings is config that gets frozen into
 * issued document snapshots — mixing them would let a wizard flag turn up on
 * an invoice. The brand colour belongs with the name and logo Clerk already
 * owns.
 *
 * Owner-edited + low-concurrency, so read-modify-write on the jsonb is
 * acceptable (no atomic jsonb merge needed). The read is skipped entirely
 * when the patch touches no settings.
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await resolveTenant();
    if (!tenant) return handleApiError('UNAUTHORIZED', 'Authentication required');
    if (tenant.orgRole === 'staff') {
      return handleApiError('FORBIDDEN', 'Only owners can change organization settings');
    }

    const parsed = organizationSettingsPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    if (parsed.data.brand_color !== undefined) {
      const written = await writeBrandColor(parsed.data.brand_color);
      if (!written) {
        return handleApiError('UNAUTHORIZED', 'No active organization');
      }
    }

    const { values, readError } = await buildUpdate(tenant, parsed.data);
    if (readError) return handleSupabaseError(readError);

    // A brand-colour-only patch touches nothing in the row; issuing an
    // empty update would be a pointless write, so read instead.
    const accessor = tenant.db.organization();
    const { data, error } =
      Object.keys(values).length > 0
        ? await accessor.update(values).select(ORG_COLUMNS).single()
        : await accessor.select(ORG_COLUMNS).single();

    if (error) return handleSupabaseError(error);

    // brand_color is echoed back so the client can repaint immediately —
    // the session claim it normally rides on refreshes on a delay.
    return NextResponse.json({
      organization: data,
      ...(parsed.data.brand_color !== undefined && { brand_color: parsed.data.brand_color }),
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
