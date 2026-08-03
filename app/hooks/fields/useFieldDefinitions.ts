'use client';

import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, buildKey, keysUnder, apiFetcher, apiRequest } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';
import type { FieldOption } from '@/lib/fields/options';

export type FieldEntity = 'client' | 'order' | 'order_item' | 'product';

export const FIELD_ENTITIES: { value: FieldEntity; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'order', label: 'Order' },
  { value: 'order_item', label: 'Order Item' },
  { value: 'product', label: 'Product' },
];

type FieldDefinitionRow = DatabaseV2['v2']['Tables']['field_definitions']['Row'];

/** What GET /api/field-definitions returns per row. */
export type FieldDefinition = Omit<
  FieldDefinitionRow,
  'organization_id' | 'created_at' | 'updated_at'
>;

export interface FieldDefinitionInput {
  entity: FieldEntity;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'relation' | 'dimension';
  is_required?: boolean;
  is_unique?: boolean;
  is_system?: boolean;
  options?: string[] | FieldOption[];
  default_value?: unknown;
  related_entity?: string;
  display_field?: string;
  conditions?: Record<string, unknown>;
  field_group?: string;
  show_in_documents?: boolean;
  sort_order?: number;
}

export type FieldDefinitionUpdate = Partial<
  Omit<FieldDefinitionInput, 'entity' | 'field_name'>
> & { status?: 'active' | 'archived' };

interface FieldDefinitionsResponse {
  fieldDefinitions: FieldDefinition[];
}

/**
 * The field registry — the org's custom fields for one entity (or all
 * entities when omitted, as the field-setup screen needs). Forms read
 * this BEFORE rendering any custom_data section.
 */
export function useFieldDefinitions(
  entity?: FieldEntity,
  options?: { status?: 'active' | 'archived' | 'all' },
) {
  const key = buildKey(PLATFORM_API.FIELD_DEFINITIONS, {
    entity,
    status: options?.status,
  });
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

export function useFieldDefinitionMutations() {
  const { mutate } = useSWRConfig();
  const invalidate = useCallback(
    () => mutate(keysUnder(PLATFORM_API.FIELD_DEFINITIONS)),
    [mutate],
  );

  const createField = useCallback(
    async (input: FieldDefinitionInput) => {
      const { fieldDefinition } = await apiRequest<{ fieldDefinition: FieldDefinition }>(
        PLATFORM_API.FIELD_DEFINITIONS,
        'POST',
        input,
      );
      await invalidate();
      return fieldDefinition;
    },
    [invalidate],
  );

  const updateField = useCallback(
    async (id: string, input: FieldDefinitionUpdate) => {
      const { fieldDefinition } = await apiRequest<{ fieldDefinition: FieldDefinition }>(
        `${PLATFORM_API.FIELD_DEFINITIONS}/${id}`,
        'PATCH',
        input,
      );
      await invalidate();
      return fieldDefinition;
    },
    [invalidate],
  );

  /** Definitions are never hard-deleted; archiving removes them from forms. */
  const archiveField = useCallback(
    (id: string) => updateField(id, { status: 'archived' }),
    [updateField],
  );

  return { createField, updateField, archiveField };
}
