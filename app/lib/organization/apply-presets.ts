import type { FieldDefinitionInput } from '@/hooks/fields/useFieldDefinitions';
import type { FieldOption } from '@/lib/fields/options';
import { STARTER_FIELDS, type StarterEntity } from './presets';

/**
 * What the user changed about a starter before it was created. Keyed by
 * field_name. Absent keys keep the preset's own value — an override is a
 * deliberate edit, never a defaulted blank.
 */
export interface StarterFieldOverride {
  field_label?: string;
  options?: FieldOption[];
  is_required?: boolean;
  show_in_documents?: boolean;
}

/**
 * Compute the field_definitions to create for one wizard step.
 *
 * Given the entity, the starter field_names the user chose to keep, and the
 * field_definitions the org already has, returns the POST payloads —
 * skipping any starter the user unchecked or that already exists (matched by
 * field_name). This makes re-entering a step idempotent: going back and
 * forward never double-creates a field.
 *
 * `overrides` carries edits made to a starter while it was still staged, so a
 * relabelled field or a reworked option list is created as the user shaped it
 * rather than as the template shipped it.
 */
export function starterFieldsToApply(
  entity: StarterEntity,
  keep: ReadonlySet<string>,
  existing: ReadonlyArray<{ field_name: string }>,
  overrides: Readonly<Record<string, StarterFieldOverride>> = {},
): FieldDefinitionInput[] {
  const existingNames = new Set(existing.map(f => f.field_name));

  return STARTER_FIELDS[entity]
    .filter(f => keep.has(f.field_name) && !existingNames.has(f.field_name))
    .map(f => {
      const edit = overrides[f.field_name] ?? {};
      const label = edit.field_label?.trim() || f.field_label;
      // Options only mean anything for a select; carrying them onto a text
      // field would write a column the form renderer never reads.
      const options = f.field_type === 'select' ? (edit.options ?? f.options) : f.options;
      const required = edit.is_required ?? f.is_required;

      return {
        entity,
        field_name: f.field_name,
        field_label: label,
        field_type: f.field_type,
        ...(options ? { options } : {}),
        ...(required ? { is_required: true } : {}),
        ...(edit.show_in_documents ? { show_in_documents: true } : {}),
        ...(f.is_system ? { is_system: true } : {}),
        ...(f.conditions ? { conditions: f.conditions } : {}),
        ...(f.sort_order != null ? { sort_order: f.sort_order } : {}),
      };
    });
}
