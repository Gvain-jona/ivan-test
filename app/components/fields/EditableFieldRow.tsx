'use client';

import { useState } from 'react';
import { normalizeOptions } from '@/lib/fields/options';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import FieldEditor, { type FieldEdits } from './FieldEditor';
import FieldRow from './FieldRow';
import { useDebouncedSave } from './use-debounced-save';

interface EditableFieldRowProps {
  field: FieldDefinition;
  /** Singular entity noun, for the editor's copy. */
  entityLabel: string;
  expanded: boolean;
  onToggleExpand: () => void;
  /** True while the just-added flash is running, which also changes the subtitle. */
  justAdded?: boolean;
  onSave: (edits: FieldEdits) => Promise<void>;
  onArchive: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A field that exists in the org, with its editor attached and its edits
 * persisted as they settle. Shared by first-run setup and (from redesign
 * phase 7) the per-entity field manager, so a field is edited the same way
 * wherever it's met.
 *
 * The switch is locked on: an existing field is removed by archiving it from
 * the editor, which is reversible, rather than by a toggle that would imply
 * the data goes too.
 */
export default function EditableFieldRow({
  field,
  entityLabel,
  expanded,
  onToggleExpand,
  justAdded,
  onSave,
  onArchive,
  disabled,
  className,
}: EditableFieldRowProps) {
  const [edits, setEdits] = useState<FieldEdits>(() => ({
    field_label: field.field_label,
    options: normalizeOptions(field.options),
    is_required: field.is_required ?? false,
    show_in_documents: field.show_in_documents ?? false,
  }));

  const { status, failure, markDirty } = useDebouncedSave(edits, onSave, {
    // A field with no label can't be saved — its machine key came from one.
    blocked: edits.field_label.trim() === '',
  });

  return (
    <FieldRow
      className={className}
      label={field.field_label}
      fieldType={field.field_type}
      options={normalizeOptions(field.options)}
      checked
      locked
      lockedReason="already added to your workspace"
      badge="Added"
      flash={justAdded}
      subtitle={expanded ? (justAdded ? 'Just added · editing' : 'Editing') : undefined}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      disabled={disabled}
    >
      <FieldEditor
        value={edits}
        onChange={next => {
          markDirty();
          setEdits(next);
        }}
        fieldType={field.field_type}
        entityLabel={entityLabel}
        status={status}
        failure={failure}
        onArchive={onArchive}
        disabled={disabled}
      />
    </FieldRow>
  );
}
