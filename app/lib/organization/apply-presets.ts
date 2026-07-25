import type { FieldDefinitionInput } from '@/hooks/fields/useFieldDefinitions';
import { STARTER_FIELDS, type StarterEntity } from './presets';

/**
 * Compute the field_definitions to create for one wizard step.
 *
 * Given the entity, the starter field_names the user chose to keep, and the
 * field_definitions the org already has, returns the POST payloads —
 * skipping any starter the user unchecked or that already exists (matched by
 * field_name). This makes re-entering a step idempotent: going back and
 * forward never double-creates a field.
 */
export function starterFieldsToApply(
  entity: StarterEntity,
  keep: ReadonlySet<string>,
  existing: ReadonlyArray<{ field_name: string }>,
): FieldDefinitionInput[] {
  const existingNames = new Set(existing.map(f => f.field_name));

  return STARTER_FIELDS[entity]
    .filter(f => keep.has(f.field_name) && !existingNames.has(f.field_name))
    .map(f => ({
      entity,
      field_name: f.field_name,
      field_label: f.field_label,
      field_type: f.field_type,
      ...(f.options ? { options: f.options } : {}),
      ...(f.is_required ? { is_required: true } : {}),
      ...(f.is_system ? { is_system: true } : {}),
      ...(f.conditions ? { conditions: f.conditions } : {}),
      ...(f.sort_order != null ? { sort_order: f.sort_order } : {}),
    }));
}
