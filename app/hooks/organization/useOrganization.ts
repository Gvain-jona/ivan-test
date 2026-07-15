'use client';

import useSWR from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, apiFetcher } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';
import type { OrgRole } from '@/lib/auth/tenant';

/**
 * Re-exported (type-only, erased at compile time) so UI components have
 * one client-safe import for the v2 role vocabulary: owner/admin/staff.
 */
export type { OrgRole };

type OrganizationRow = DatabaseV2['v2']['Tables']['organizations']['Row'];

export type Organization = Pick<OrganizationRow, 'id' | 'name' | 'slug' | 'status' | 'settings'>;

/** Statuses every org gets when it hasn't customized the list. */
export const DEFAULT_ORDER_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'delivered',
  'cancelled',
];

/**
 * The caller's active organization and its settings. Order statuses
 * are org-configurable (organizations.settings.order_statuses) — read
 * them from here, never from a hardcoded enum.
 */
export function useOrganization() {
  const { data, error, isLoading, mutate } = useSWR<{
    organization: Organization;
    orgRole: OrgRole;
  }>(PLATFORM_API.ORGANIZATION, apiFetcher, {
    dedupingInterval: SWR_CACHE_TIMES.DROPDOWN_DEDUPE,
    revalidateOnFocus: false,
  });

  const settings = (data?.organization.settings ?? {}) as {
    order_statuses?: string[];
    currency?: string;
    locale?: string;
  };

  return {
    organization: data?.organization ?? null,
    orgRole: data?.orgRole ?? null,
    orderStatuses:
      Array.isArray(settings.order_statuses) && settings.order_statuses.length > 0
        ? settings.order_statuses
        : DEFAULT_ORDER_STATUSES,
    currency: settings.currency ?? 'UGX',
    isLoading,
    error,
    mutate,
  };
}
