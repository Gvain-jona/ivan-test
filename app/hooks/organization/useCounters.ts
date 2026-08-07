'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, apiFetcher, apiRequest } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';

type CounterRow = DatabaseV2['v2']['Tables']['counters']['Row'];

export type CounterRecord = Omit<CounterRow, 'organization_id'>;

export interface CounterUpdateInput {
  format?: string;
  reset_policy?: 'never' | 'yearly' | 'monthly';
  /** Increase-only — the route refuses to reissue a number already handed out. */
  current_value?: number;
}

/**
 * The org's numbering sequences (`order`, `doc:invoice`, `doc:quotation`, …).
 *
 * Also the org's list of legal document types: a `doc:{type}` counter is what
 * validate_document_type() looks for, so `documentTypes` here is the real
 * answer to "what can this org issue", not a hardcoded menu.
 */
export function useCounters() {
  const { data, error, isLoading, mutate } = useSWR<{ counters: CounterRecord[] }>(
    PLATFORM_API.COUNTERS,
    apiFetcher,
    { dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE },
  );

  const counters = data?.counters ?? [];

  const updateCounter = useCallback(
    async (counterKey: string, input: CounterUpdateInput) => {
      const { counter } = await apiRequest<{ counter: CounterRecord }>(
        PLATFORM_API.COUNTERS,
        'PATCH',
        { counter_key: counterKey, ...input },
      );
      await mutate();
      return counter;
    },
    [mutate],
  );

  return {
    counters,
    /** Document types this org can issue, derived from its `doc:` counters. */
    documentTypes: counters
      .filter(c => c.counter_key.startsWith('doc:'))
      .map(c => c.counter_key.slice('doc:'.length)),
    isLoading,
    error,
    updateCounter,
    mutate,
  };
}
