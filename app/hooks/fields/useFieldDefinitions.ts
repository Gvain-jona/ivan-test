'use client';

import useSWR from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, buildKey, apiFetcher } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';

export type FieldEntity = 'client' | 'order' | 'order_item' | 'product';

type FieldDefinitionRow = DatabaseV2['v2']['Tables']['field_definitions']['Row'];

/** What GET /api/v2/field-definitions returns per row. */
export type FieldDefinition = Omit<
  FieldDefinitionRow,
  'organization_id' | 'created_at' | 'updated_at'
>;

interface FieldDefinitionsResponse {
  fieldDefinitions: FieldDefinition[];
}

/**
 * The field registry for one entity — read this BEFORE rendering any
 * custom_data form; it defines which fields exist, their types,
 * options, grouping, and requiredness. Changes rarely, so it dedupes
 * on the dropdown cadence.
 */
export function useFieldDefinitions(entity: FieldEntity) {
  const key = buildKey(PLATFORM_API.FIELD_DEFINITIONS, { entity });
  const { data, error, isLoading, mutate } = useSWR<FieldDefinitionsResponse>(key, apiFetcher, {
    dedupingInterval: SWR_CACHE_TIMES.DROPDOWN_DEDUPE,
    revalidateOnFocus: false,
  });

  return {
    fieldDefinitions: data?.fieldDefinitions ?? [],
    isLoading,
    error,
    mutate,
  };
}
