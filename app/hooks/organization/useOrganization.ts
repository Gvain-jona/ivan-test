'use client';

import useSWR from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, apiFetcher } from '@/lib/api/client';
import { DEFAULT_BRAND_PRESET, isBrandPresetId } from '@/lib/theme/brand-presets';
import type { DatabaseV2 } from '@/types/supabase-v2';

type OrganizationRow = DatabaseV2['v2']['Tables']['organizations']['Row'];

export type Organization = Pick<
  OrganizationRow,
  'id' | 'name' | 'slug' | 'status' | 'settings' | 'onboarding_completed_at'
>;

/**
 * The caller's active organization and its config.
 *
 * organizations.settings is a DB-governed map of blocks (locale, tax,
 * documents, identity) — currency lives at settings.locale.currency, not
 * at the top level. Order statuses are not here at all: they live in the
 * order `status` field-definition (useOrderStatuses).
 *
 * brandColor is likewise not a settings key: it lives in Clerk org metadata
 * (app/lib/theme/brand.ts) and the route serves it alongside the row so the
 * client has one org-config contract.
 */
export function useOrganization() {
  const { data, error, isLoading, mutate } = useSWR<{
    organization: Organization;
    orgRole: 'owner' | 'staff';
    brand_color?: string;
  }>(PLATFORM_API.ORGANIZATION, apiFetcher, {
    dedupingInterval: SWR_CACHE_TIMES.DROPDOWN_DEDUPE,
    revalidateOnFocus: false,
  });

  const settings = (data?.organization.settings ?? {}) as {
    locale?: { currency?: string; date_format?: string; timezone?: string };
  };

  return {
    organization: data?.organization ?? null,
    orgRole: data?.orgRole ?? null,
    // Null until the org sets it (no silent UGX default); the formatter
    // (useFormatCurrency) renders plain numbers until then.
    currency: settings.locale?.currency ?? null,
    // Always a usable preset id: an org that never picked one renders the
    // default, same as the tokens globals.css ships with.
    brandColor: isBrandPresetId(data?.brand_color) ? data.brand_color : DEFAULT_BRAND_PRESET,
    onboardingCompleted: data?.organization.onboarding_completed_at != null,
    isLoading,
    error,
    mutate,
  };
}
