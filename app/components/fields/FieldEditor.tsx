'use client';

import { Archive, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldOption } from '@/lib/fields/options';
import { fieldTypeTagClasses } from '@/lib/fields/colors';
import { fieldTypeMeta } from './field-type-meta';
import FieldOptionsEditor from './FieldOptionsEditor';
import { EditorGroup, EditorRule, type SaveStatus } from './field-editor-parts';

/** What the editor can change. Type and machine key are not in here — see below. */
export interface FieldEdits {
  field_label: string;
  options: FieldOption[];
  is_required: boolean;
  show_in_documents: boolean;
}

interface FieldEditorProps {
  value: FieldEdits;
  onChange: (next: FieldEdits) => void;
  fieldType: string;
  /** Singular entity noun, for copy like "before a product can be saved". */
  entityLabel: string;
  /** Shown beside the Label group when the caller persists edits. */
  status?: SaveStatus;
  failure?: string | null;
  /** Absent when there's nothing to archive — a field that doesn't exist yet. */
  onArchive?: () => void;
  disabled?: boolean;
}

/**
 * Edit one field in place, inside the row it belongs to. Controlled, so the
 * same editor serves a field that already exists (the caller persists each
 * change) and a starter that doesn't yet (the caller stages them until
 * Continue).
 *
 * Type is shown but not editable. v2 has no guard against retyping a field
 * that already holds data, and nothing client-side can tell whether records
 * carry values for it — so the safe answer is the one the design's own
 * guardrail gives: archive it and add a new one, which loses nothing.
 */
export default function FieldEditor({
  value,
  onChange,
  fieldType,
  entityLabel,
  status,
  failure,
  onArchive,
  disabled,
}: FieldEditorProps) {
  const labelMissing = value.field_label.trim() === '';
  const isSelect = fieldType === 'select';
  const patch = (next: Partial<FieldEdits>) => onChange({ ...value, ...next });

  return (
    <div className="space-y-4 rounded-lg bg-setup-panel p-3">
      <EditorGroup label="Label" note="what people see on forms and documents" status={status}>
        <input
          value={value.field_label}
          onChange={event => patch({ field_label: event.target.value })}
          disabled={disabled}
          aria-label="Field label"
          aria-invalid={labelMissing}
          className={cn(
            'w-full rounded-lg border bg-card px-2.5 py-2 text-[13px] text-foreground outline-none disabled:opacity-50',
            labelMissing ? 'border-destructive' : 'border-border focus:border-primary',
          )}
        />
        {labelMissing && (
          <p className="text-[10.5px] font-semibold text-destructive">
            A label is required — the machine key is built from it.
          </p>
        )}
      </EditorGroup>

      <TypeGroup fieldType={fieldType} entityLabel={entityLabel} />

      {isSelect && (
        <EditorGroup label="Options" note="what people can choose from">
          <FieldOptionsEditor
            options={value.options}
            onChange={options => patch({ options })}
            disabled={disabled}
          />
          {value.options.length === 0 && (
            <p className="rounded-lg bg-warning-bg px-2.5 py-2 text-[11px] font-medium text-warning">
              This field is a Select but has no options yet. Add at least one, or people will have
              nothing to choose from.
            </p>
          )}
        </EditorGroup>
      )}

      <EditorGroup label="Rules">
        <EditorRule
          title="Required"
          description={`Must be filled before a ${entityLabel} can be saved`}
          checked={value.is_required}
          onCheckedChange={is_required => patch({ is_required })}
          disabled={disabled}
        />
        <EditorRule
          title="Show on documents"
          description="Appears on invoices and quotations"
          checked={value.show_in_documents}
          onCheckedChange={show_in_documents => patch({ show_in_documents })}
          disabled={disabled}
        />
      </EditorGroup>

      {failure && <p className="text-[10.5px] font-semibold text-destructive">{failure}</p>}

      {onArchive && <ArchiveRow entityLabel={entityLabel} onArchive={onArchive} disabled={disabled} />}
    </div>
  );
}

/** Type, shown as settled fact plus the way out if it's wrong. */
function TypeGroup({ fieldType, entityLabel }: { fieldType: string; entityLabel: string }) {
  const typeLabel = fieldTypeMeta(fieldType)?.label ?? fieldType;
  return (
    <EditorGroup label="Type" note="set when the field was created">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2">
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-semibold',
            fieldTypeTagClasses(fieldType),
          )}
        >
          {fieldType}
        </span>
        <span className="text-[13px] font-semibold text-foreground">{typeLabel}</span>
      </div>
      <p className="flex items-start gap-1 text-[10.5px] text-muted-foreground">
        <Info className="mt-px h-3 w-3 flex-shrink-0" />
        Type can&apos;t change once {entityLabel}s have data in this field. Archive it and add a new
        one instead — nothing is ever deleted.
      </p>
    </EditorGroup>
  );
}

function ArchiveRow({
  entityLabel,
  onArchive,
  disabled,
}: {
  entityLabel: string;
  onArchive: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onArchive}
      disabled={disabled}
      className="flex w-full items-start gap-2 rounded-lg bg-destructive/10 px-2.5 py-2 text-left transition-colors hover:bg-destructive/15 disabled:pointer-events-none disabled:opacity-50"
    >
      <Archive className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" />
      <span>
        <span className="block text-[13px] font-semibold text-destructive">
          Archive this field
        </span>
        <span className="block text-[11px] text-destructive/80">
          Hides it going forward — existing {entityLabel} data stays readable
        </span>
      </span>
    </button>
  );
}
