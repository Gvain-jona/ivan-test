'use client';

import { useMemo, useState } from 'react';
import { ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeOptions } from '@/lib/fields/options';
import type { FieldEntity } from '@/hooks/fields/useFieldDefinitions';
import EditableFieldRow from './EditableFieldRow';
import FieldComposer, { FIELD_EXAMPLE, type ComposedField } from './FieldComposer';
import FieldRow from './FieldRow';
import StatusWorkflowDrillIn from './StatusWorkflowDrillIn';
import { useFieldActions } from './use-field-actions';

interface EntityFieldsManagerProps {
  entity: FieldEntity;
  /** Singular human label for copy, e.g. "product". */
  entityLabel: string;
}

/**
 * Manage one entity's custom fields in place — the per-entity replacement for
 * the retired standalone /dashboard/fields page.
 *
 * Uses the same row, editor and composer as first-run setup, so a field is
 * added and edited identically whether it's someone's first day or their
 * hundredth. There is no create/edit dialog: adding is a line in the list and
 * editing happens inside the row.
 */
export default function EntityFieldsManager({ entity, entityLabel }: EntityFieldsManagerProps) {
  const { fieldDefinitions, isLoading, addField, saveField, saveOptions, restore, archive } =
    useFieldActions(entity);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [drillIn, setDrillIn] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = fieldDefinitions.filter(f => f.status === 'active');
  const archived = fieldDefinitions.filter(f => f.status === 'archived');
  // Archived names still occupy their machine key, so they count as taken.
  const taken = useMemo(
    () => new Set(fieldDefinitions.map(f => f.field_name)),
    [fieldDefinitions],
  );

  const handleAdd = async (field: ComposedField) => {
    const created = await addField({ entity, ...field });
    setJustAdded(created.id);
    setExpanded(created.id);
    window.setTimeout(
      () => setJustAdded(current => (current === created.id ? null : current)),
      1200,
    );
  };

  const drillField = drillIn ? fieldDefinitions.find(f => f.field_name === drillIn) : undefined;
  if (drillField) {
    return (
      <StatusWorkflowDrillIn
        entityLabel={entityLabel}
        persistence="immediate"
        initialOptions={normalizeOptions(drillField.options)}
        onSave={options => saveOptions(drillField.id, options)}
        onBack={() => setDrillIn(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Custom fields on every {entityLabel}. Validated by the database; archiving hides a field
        without touching saved data.
      </p>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading fields…</p>
      ) : (
        <div className="space-y-2">
          {active.map(field =>
            field.is_system ? (
              <FieldRow
                key={field.id}
                label={field.field_label}
                fieldType={field.field_type}
                options={normalizeOptions(field.options)}
                checked
                locked
                lockedReason="system field, can't be removed"
                onToggleExpand={() => setDrillIn(field.field_name)}
              />
            ) : (
              <EditableFieldRow
                key={field.id}
                field={field}
                entityLabel={entityLabel}
                expanded={expanded === field.id}
                justAdded={justAdded === field.id}
                onToggleExpand={() =>
                  setExpanded(current => (current === field.id ? null : field.id))
                }
                onSave={edits => saveField(field.id, edits)}
                onArchive={() => {
                  setExpanded(null);
                  void archive(field.id, field.field_label);
                }}
              />
            ),
          )}

          {active.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">
              No custom fields on {entityLabel}s yet — add one below.
            </p>
          )}
        </div>
      )}

      <FieldComposer
        example={FIELD_EXAMPLE[entity]}
        taken={taken}
        entityLabel={entityLabel}
        onAdd={handleAdd}
      />

      {archived.length > 0 && (
        <ArchivedFields
          fields={archived}
          open={showArchived}
          onToggle={() => setShowArchived(open => !open)}
          onRestore={id => void restore(id)}
        />
      )}
    </div>
  );
}

/**
 * Archived fields, folded away. They're kept visible-on-demand rather than
 * hidden outright because archiving is reversible and their data is still
 * readable — a field that vanished entirely would look deleted.
 */
function ArchivedFields({
  fields,
  open,
  onToggle,
  onRestore,
}: {
  fields: { id: string; field_label: string; field_type: string }[];
  open: boolean;
  onToggle: () => void;
  onRestore: (id: string) => void;
}) {
  return (
    <div className="space-y-2 border-t border-border pt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? 'Hide' : 'Show'} archived ({fields.length})
      </button>

      {open &&
        fields.map(field => (
          <div
            key={field.id}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-muted-foreground">{field.field_label}</p>
              <p className="text-[11px] text-muted-foreground">
                Archived · hidden from forms, saved data kept
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onRestore(field.id)}>
              <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
              Restore
            </Button>
          </div>
        ))}
    </div>
  );
}
