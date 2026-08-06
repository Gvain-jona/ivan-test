import { auth } from '@clerk/nextjs/server';
import {
  DEFAULT_BRAND_PRESET,
  brandCssText,
  isBrandPresetId,
  type BrandPresetId,
} from './brand-presets';

/**
 * Server-side resolution of the active organization's brand colour.
 *
 * Storage is Clerk organization public_metadata, not v2.organizations.
 * Clerk is already the authority for org visual identity — it owns name,
 * slug and logo (see app/lib/auth/tenant.ts, which calls the v2 row "a thin
 * mirror", and OrgLogo.tsx, which reads organization.imageUrl live). The
 * brand colour joins them rather than starting a second identity store.
 * It also sidesteps v2.validate_organization_settings, the DB-owned trigger
 * that whitelists settings blocks and would reject a new one until someone
 * else extends it.
 *
 * The value reaches us as a session-token custom claim
 * (`brand_color` <- {{org.public_metadata.brand_color}}, configured in the
 * Clerk dashboard exactly like internal_user_id — see types/globals.d.ts).
 * That keeps this free: auth() is deduped per request, so calling this
 * alongside resolveTenant() costs no extra round trip.
 *
 * Trade-off: session tokens refresh on roughly a minute, so a just-saved
 * colour lands on the next refresh. PATCH /api/organization returns the
 * resolved id so the client can apply it immediately — see
 * app/components/theme/apply-brand.ts.
 */
export async function resolveBrandColor(): Promise<BrandPresetId> {
  const { sessionClaims } = await auth();
  const claim = sessionClaims?.brand_color;
  return isBrandPresetId(claim) ? claim : DEFAULT_BRAND_PRESET;
}

/** The CSS text for the active org's brand. Unknown/absent falls back. */
export async function resolveBrandTokens(): Promise<string> {
  return brandCssText(await resolveBrandColor());
}
