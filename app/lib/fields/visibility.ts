import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';

export type CustomDataValue = Record<string, unknown>;

/**
 * Tolerant `conditions` interpreter, shared by every field renderer.
 *
 * The DB stores conditions as free jsonb with no consumer of its own, so this
 * is the app's reading of it and must stay in one place — two renderers with
 * two interpretations would show a field on one screen and hide it on another.
 *
 * Two shapes are supported: `{ "field": "type", "equals": "contract" }` (also
 * `"in"` arrays) and the shorthand map `{ "type": "contract" }` where every
 * pair must match. Unknown shapes **fail open** — a malformed condition can
 * never hide required data entry.
 */
export function isFieldVisible(field: FieldDefinition, values: CustomDataValue): boolean {
  const cond = field.conditions;
  if (cond == null || typeof cond !== 'object' || Array.isArray(cond)) return true;

  const record = cond as Record<string, unknown>;
  if (typeof record.field === 'string') {
    const actual = values[record.field];
    if ('equals' in record) return actual === record.equals;
    if (Array.isArray(record.in)) return record.in.includes(actual);
    return true;
  }

  return Object.entries(record).every(([key, expected]) => values[key] === expected);
}

/**
 * The active, currently-visible fields for an entity, in the org's order.
 *
 * `status` is excluded by name: it is governed by a field-definition but
 * stored in the `orders.status` **column**, and every surface renders it as
 * its own stage control rather than as one more custom field.
 */
export function visibleFields(
  fields: FieldDefinition[],
  values: CustomDataValue,
  { excludeStatus = false }: { excludeStatus?: boolean } = {},
): FieldDefinition[] {
  return fields
    .filter(field => field.status === 'active')
    .filter(field => !(excludeStatus && field.field_name === 'status'))
    .filter(field => isFieldVisible(field, values));
}
