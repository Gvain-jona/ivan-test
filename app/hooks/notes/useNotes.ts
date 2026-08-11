'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { SWR_CACHE_TIMES } from '@/lib/swr-config';
import { PLATFORM_API, buildKey, apiFetcher, apiRequest } from '@/lib/api/client';
import type { DatabaseV2 } from '@/types/supabase-v2';

type NoteRow = DatabaseV2['v2']['Tables']['notes']['Row'];

export type Note = Omit<NoteRow, 'organization_id' | 'source_id'>;

export type NoteEntityType = 'order' | 'client' | 'product' | 'expense' | 'material_purchase';

/**
 * Notes for one record via the polymorphic notes engine. Pass null ids
 * to pause fetching (e.g. while a sheet is closed).
 */
export function useNotes(entityType: NoteEntityType, entityId: string | null | undefined) {
  const key = entityId
    ? buildKey(PLATFORM_API.NOTES, { entity_type: entityType, entity_id: entityId })
    : null;

  const { data, error, isLoading, mutate } = useSWR<{ notes: Note[] }>(key, apiFetcher, {
    dedupingInterval: SWR_CACHE_TIMES.DETAIL_DEDUPE,
  });

  /**
   * `custom_data` carries the org's own note fields — the "type" the designs
   * group notes by lives there rather than in a column (migration
   * 20260807213900 added `notes.custom_data` and the `'note'` field entity for
   * exactly this). Omitted when empty, per the custom_data convention: the DB
   * rejects JSON nulls and an empty object is noise in the row.
   */
  const addNote = useCallback(
    async (content: string, customData?: Record<string, unknown>) => {
      if (!entityId) throw new Error('Cannot add a note without an entity id');
      const { note } = await apiRequest<{ note: Note }>(PLATFORM_API.NOTES, 'POST', {
        entity_type: entityType,
        entity_id: entityId,
        content,
        ...(customData && Object.keys(customData).length > 0
          ? { custom_data: customData }
          : {}),
      });
      await mutate();
      return note;
    },
    [entityType, entityId, mutate],
  );

  return { notes: data?.notes ?? [], isLoading, error, addNote, mutate };
}
