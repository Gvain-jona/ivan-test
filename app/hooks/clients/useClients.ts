'use client';

import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, buildKey, keysUnder, apiFetcher, apiRequest } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';

type ClientRow = DatabaseV2['v2']['Tables']['clients']['Row'];

export type Client = Omit<ClientRow, 'organization_id' | 'source_ids' | 'created_by'>;

export type ClientListParams = {
  status?: 'active' | 'archived' | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ClientInput {
  name: string;
  status?: 'active' | 'archived';
  custom_data?: Record<string, unknown>;
}

export function useClients(params: ClientListParams = {}) {
  const key = buildKey(PLATFORM_API.CLIENTS, params);
  const { data, error, isLoading, mutate } = useSWR<{ clients: Client[]; total: number }>(
    key,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.LIST_DEDUPE },
  );

  return {
    clients: data?.clients ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useClient(id: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ client: Client }>(
    id ? `${PLATFORM_API.CLIENTS}/${id}` : null,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE },
  );

  return { client: data?.client ?? null, isLoading, error, mutate };
}

export function useClientMutations() {
  const { mutate } = useSWRConfig();
  const invalidate = useCallback(
    () => mutate(keysUnder(PLATFORM_API.CLIENTS)),
    [mutate],
  );

  const createClient = useCallback(
    async (input: ClientInput) => {
      const { client } = await apiRequest<{ client: Client }>(
        PLATFORM_API.CLIENTS,
        'POST',
        input,
      );
      await invalidate();
      return client;
    },
    [invalidate],
  );

  const updateClient = useCallback(
    async (id: string, input: Partial<ClientInput>) => {
      const { client } = await apiRequest<{ client: Client }>(
        `${PLATFORM_API.CLIENTS}/${id}`,
        'PATCH',
        input,
      );
      await invalidate();
      return client;
    },
    [invalidate],
  );

  /** Archiving IS deletion in v2 — records are never hard-deleted. */
  const archiveClient = useCallback(
    (id: string) => updateClient(id, { status: 'archived' }),
    [updateClient],
  );

  return { createClient, updateClient, archiveClient };
}
