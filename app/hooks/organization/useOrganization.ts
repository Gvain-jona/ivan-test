'use client';

import useSWR from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, apiFetcher } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';

type OrganizationRow = DatabaseV2['v2']['Tables']['organizations']['Row'];

export type Organization = Pick<OrganizationRow, 'id' | 'name' | 'slug' | 'status' | 'settings'>;

/**
 * The caller's active organization and its settings. Order statuses
 * are org-configurable (organizations.settings.order_statuses) — read
 * them from here, never from a hardcoded enum.
 */
export function useOrganization() {
  const { data, error, isLoading, mutate } = useSWR<{
    organization: Organization;
    orgRole: 'owner' | 'staff';
  }>(PLATFORM_API.ORGANIZATION, apiFetcher, {
    dedupingInterval: SWR_CACHE_TIMES.DROPDOWN_DEDUPE,
    revalidateOnFocus: false,
  });

  const settings = (data?.organization.settings ?? {}) as {
    currency?: string;
    locale?: string;
    onboarding?: { completed?: boolean };
  };

  return {
    organization: data?.organization ?? null,
    orgRole: data?.orgRole ?? null,
    // Order statuses now live in the order `status` field-definition, not
    // here — read them via useOrderStatuses(). No hardcoded fallback.
    // Currency is null until the org sets it (no silent UGX default); the
    // formatter (useFormatCurrency) renders plain numbers until then.
    currency: settings.currency ?? null,
    locale: settings.locale ?? null,
    onboardingCompleted: settings.onboarding?.completed === true,
    isLoading,
    error,
    mutate,
  };
}
