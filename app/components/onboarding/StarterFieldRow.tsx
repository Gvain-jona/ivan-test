'use client';

import FieldEditor, { type FieldEdits } from '@/components/fields/FieldEditor';
import FieldRow from '@/components/fields/FieldRow';
import type { StarterEntity, StarterField } from '@/lib/organization/presets';
import { conditionNote } from './starter-fields';

interface StarterFieldRowProps {
  field: StarterField;
  /** The whole starter set, so a condition can name the field it depends on. */
  siblings: readonly StarterField[];
  entity: StarterEntity;
  checked: boolean;
  onCheckedChange: () => void;
  /** The staged edits for this starter, defaulted from the preset. */
  draft: FieldEdits;
  onDraftChange: (next: FieldEdits) => void;
  expanded: boolean;
  /**
   * What the chevron does. The parent decides, because a system field opens
   * its own surface rather than the inline editor. Omit for a row with
   * nothing to edit — the chevron then isn't rendered at all.
   */
  onToggleExpand?: () => void;
  disabled?: boolean;
}

/**
 * A starter field that hasn't been created yet: kept or dropped by its switch,
 * and shaped by an editor whose changes are staged until Continue. The
 * counterpart to EditableFieldRow, which edits fields that already exist.
 *
 * A system field passes an `onToggleExpand` that opens its own surface instead
 * — its options carry colour and semantics the inline editor can't set.
 */
export default function StarterFieldRow({
  field,
  siblings,
  entity,
  checked,
  onCheckedChange,
  draft,
  onDraftChange,
  expanded,
  onToggleExpand,
  disabled,
}: StarterFieldRowProps) {
  // Nothing worth opening on a field the user has just dropped.
  const expandable = checked && !!onToggleExpand;

  return (
    <FieldRow
      className="bg-setup-surface"
      label={draft.field_label || field.field_label}
      fieldType={field.field_type}
      options={draft.options}
      checked={checked}
      onCheckedChange={onCheckedChange}
      locked={field.is_system}
      lockedReason="system field, can't be removed"
      note={conditionNote(field, siblings, entity)}
      subtitle={expanded ? 'Editing · saves when you continue' : undefined}
      expanded={expanded}
      onToggleExpand={expandable ? onToggleExpand : undefined}
      disabled={disabled}
    >
      <FieldEditor
        value={draft}
        onChange={onDraftChange}
        fieldType={field.field_type}
        entityLabel={entity}
        disabled={disabled}
      />
    </FieldRow>
  );
}
