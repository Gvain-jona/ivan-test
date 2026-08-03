'use client';

import EditableFieldRow from '@/components/fields/EditableFieldRow';
import type { FieldEdits } from '@/components/fields/FieldEditor';
import FieldRow from '@/components/fields/FieldRow';
import { normalizeOptions } from '@/lib/fields/options';
import type { FieldDefinition } from '@/hooks/fields/useFieldDefinitions';
import type { StarterEntity, StarterField } from '@/lib/organization/presets';
import StarterFieldRow from './StarterFieldRow';

interface EntityFieldListProps {
  entity: StarterEntity;
  /** The whole starter set, so a condition can name the field it depends on. */
  starters: readonly StarterField[];
  /** Starters that don't exist yet — the only ones there's a choice about. */
  pendingStarters: readonly StarterField[];
  /** Everything the org actually has, starters included once created. */
  orgFields: FieldDefinition[];
  isKept: (fieldName: string) => boolean;
  onToggleKeep: (fieldName: string) => void;
  draftFor: (field: StarterField) => FieldEdits;
  onDraftChange: (fieldName: string, next: FieldEdits) => void;
  /** field_name (staged) or id (created) of the open row, if any. */
  expanded: string | null;
  onExpand: (key: string | null) => void;
  /** Opens a system field's own surface. */
  onDrillIn: (fieldName: string) => void;
  justAdded: string | null;
  onSave: (id: string, edits: FieldEdits) => Promise<void>;
  onArchive: (id: string, label: string) => void;
  disabled?: boolean;
}

/**
 * One entity's fields as a single list: what's still a choice, then what the
 * org actually has. Keeping them in one list is the point — a created starter
 * reads as a field like any other rather than a locked leftover of the
 * template, and the list is the whole picture of what the entity tracks.
 */
export default function EntityFieldList({
  entity,
  starters,
  pendingStarters,
  orgFields,
  isKept,
  onToggleKeep,
  draftFor,
  onDraftChange,
  expanded,
  onExpand,
  onDrillIn,
  justAdded,
  onSave,
  onArchive,
  disabled,
}: EntityFieldListProps) {
  const toggleExpanded = (key: string) => onExpand(expanded === key ? null : key);

  return (
    <>
      {pendingStarters.map(field => {
        const key = field.field_name;
        return (
          <StarterFieldRow
            key={key}
            field={field}
            siblings={starters}
            entity={entity}
            checked={isKept(key)}
            onCheckedChange={() => onToggleKeep(key)}
            draft={draftFor(field)}
            onDraftChange={next => onDraftChange(key, next)}
            expanded={expanded === key}
            onToggleExpand={
              field.is_system ? () => onDrillIn(key) : () => toggleExpanded(key)
            }
            disabled={disabled}
          />
        );
      })}

      {orgFields.map(field =>
        field.is_system ? (
          // A system field opens its own surface, so the row carries the
          // chevron but no inline editor behind it.
          <FieldRow
            key={field.id}
            className="bg-setup-surface"
            label={field.field_label}
            fieldType={field.field_type}
            options={normalizeOptions(field.options)}
            checked
            locked
            lockedReason="system field, can't be removed"
            badge="Added"
            onToggleExpand={() => onDrillIn(field.field_name)}
            disabled={disabled}
          />
        ) : (
          <EditableFieldRow
            key={field.id}
            className="bg-setup-surface"
            field={field}
            entityLabel={entity}
            expanded={expanded === field.id}
            justAdded={justAdded === field.id}
            onToggleExpand={() => toggleExpanded(field.id)}
            onSave={edits => onSave(field.id, edits)}
            onArchive={() => onArchive(field.id, field.field_label)}
            disabled={disabled}
          />
        ),
      )}
    </>
  );
}
