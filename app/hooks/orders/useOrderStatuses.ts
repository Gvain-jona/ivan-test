'use client';

import { useMemo } from 'react';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import { normalizeOptions, type FieldOption } from '@/lib/fields/options';

/**
 * The org's order status workflow — sourced from the `entity='order',
 * field_name='status'` select field-definition (the single config
 * mechanism; see FIRST_RUN_AND_FIELD_SETUP.md). There is NO hardcoded
 * fallback: an org that hasn't configured its workflow gets an empty list,
 * and the DB governs the status column against these same options.
 *
 * Returns the rich options (value/label/color/semantic) plus a bare
 * `statusValues` string[] for the many places that only need the values.
 */
export function useOrderStatuses() {
  const { fieldDefinitions, isLoading, error } = useFieldDefinitions('order');

  const statuses = useMemo<FieldOption[]>(() => {
    const statusField = fieldDefinitions.find(
      f => f.field_name === 'status' && f.status === 'active',
    );
    return statusField ? normalizeOptions(statusField.options) : [];
  }, [fieldDefinitions]);

  const statusValues = useMemo(() => statuses.map(s => s.value), [statuses]);
  const defaultStatus = useMemo(
    () => statuses.find(s => s.is_default)?.value ?? statuses[0]?.value ?? '',
    [statuses],
  );

  return { statuses, statusValues, defaultStatus, isLoading, error };
}
