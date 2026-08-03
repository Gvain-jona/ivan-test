'use client';

import { useRef, useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FIELD_NAME_PATTERN, slugifyFieldName } from '@/lib/fields/slug';
import { fieldTypeTagClasses, type FieldTypeName } from '@/lib/fields/colors';
import type { FieldEntity } from '@/hooks/fields/useFieldDefinitions';
import { COMPOSABLE_FIELD_TYPES, fieldTypeMeta } from './field-type-meta';

export interface ComposedField {
  field_name: string;
  field_label: string;
  field_type: FieldTypeName;
}

/**
 * A field the shop plausibly wants but the starter set doesn't ship, per
 * entity. Only ever a placeholder — it shows the *kind* of thing this list is
 * for without suggesting the user needs it.
 */
export const FIELD_EXAMPLE: Record<FieldEntity, string> = {
  product: 'Finishing',
  client: 'VAT number',
  order: 'Job ref',
  order_item: 'Artwork link',
};

interface FieldComposerProps {
  /** Example shown in the placeholder, e.g. "Finishing". */
  example: string;
  /** Existing machine keys for this entity — the duplicate pre-check. */
  taken: Set<string>;
  /** Singular entity noun for the duplicate message ("product"). */
  entityLabel: string;
  onAdd: (field: ComposedField) => Promise<void>;
  disabled?: boolean;
}

/**
 * Add a field without leaving the list: name it, say what kind of thing it is,
 * press Add or Enter. This replaces the create-field modal — the list stays on
 * screen, and the cursor stays here so several fields can be added in a row.
 *
 * A duplicate name is caught here rather than at the API, so the user gets
 * "already a product field" instead of a Postgres 23505 round-trip.
 */
export default function FieldComposer({
  example,
  taken,
  entityLabel,
  onAdd,
  disabled,
}: FieldComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldTypeName>('text');
  const [adding, setAdding] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const trimmed = label.trim();
  const fieldName = slugifyFieldName(trimmed);
  const duplicate = fieldName !== '' && taken.has(fieldName);
  const canAdd =
    !disabled && !adding && FIELD_NAME_PATTERN.test(fieldName) && !duplicate;

  const submit = async () => {
    if (!canAdd) return;
    setAdding(true);
    setFailure(null);
    // Clear straight away so the next field can be typed while this one saves.
    setLabel('');
    inputRef.current?.focus();
    try {
      await onAdd({ field_name: fieldName, field_label: trimmed, field_type: type });
    } catch (error) {
      setLabel(trimmed);
      setFailure(error instanceof Error ? error.message : 'Could not add that field');
    } finally {
      setAdding(false);
    }
  };

  const selected = fieldTypeMeta(type);

  return (
    <div className="space-y-1.5">
      {/*
        Below `sm` the name gets the full width and the type + Add pair drops
        beneath it. On one row at 375px the input was ~165px, which truncated
        the placeholder mid-word ("Add a field — e.g. Finis") — the example is
        the part that explains what the field is for, so losing it costs the
        hint its point.
      */}
      <form
        className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-setup-surface p-2 focus-within:border-primary"
        onSubmit={event => {
          event.preventDefault();
          void submit();
        }}
      >
        <Plus className="ml-1 hidden h-4 w-4 flex-shrink-0 text-muted-foreground sm:block" />
        <input
          ref={inputRef}
          value={label}
          onChange={event => {
            setLabel(event.target.value);
            setFailure(null);
          }}
          placeholder={`Add a field — e.g. ${example}`}
          aria-label="New field name"
          disabled={disabled}
          className="w-full min-w-0 bg-transparent px-1 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50 sm:w-auto sm:flex-1 sm:px-0 sm:py-0"
        />

        <Select value={type} onValueChange={value => setType(value as FieldTypeName)}>
          <SelectTrigger
            aria-label="Field type"
            className="h-11 w-auto flex-shrink-0 gap-1 border-0 bg-muted px-3 text-xs font-semibold sm:h-8 sm:px-2"
          >
            {selected?.label ?? 'Text'}
          </SelectTrigger>
          <SelectContent>
            {COMPOSABLE_FIELD_TYPES.map(({ value, label: typeLabel, description, Icon }) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded',
                      fieldTypeTagClasses(value),
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="block">
                    <span className="block text-[13px] font-semibold text-foreground">
                      {typeLabel}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{description}</span>
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="submit"
          size="sm"
          disabled={!canAdd}
          className="ml-auto h-11 flex-shrink-0 px-5 sm:ml-0 sm:h-8 sm:px-3"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
        </Button>
      </form>

      <ComposerHint
        duplicate={duplicate ? trimmed : null}
        entityLabel={entityLabel}
        failure={failure}
        typing={trimmed !== ''}
      />
    </div>
  );
}

/**
 * One line under the composer that changes with its state: what went wrong,
 * or what Enter will do, or the standing reassurance that added fields are
 * already saved.
 */
function ComposerHint({
  duplicate,
  entityLabel,
  failure,
  typing,
}: {
  duplicate: string | null;
  entityLabel: string;
  failure: string | null;
  typing: boolean;
}) {
  if (duplicate) {
    return (
      <p className="text-[10.5px] font-semibold text-destructive">
        &ldquo;{duplicate}&rdquo; is already a {entityLabel} field.
      </p>
    );
  }
  if (failure) {
    return <p className="text-[10.5px] font-semibold text-destructive">{failure}</p>;
  }
  if (typing) {
    return (
      <p className="text-[10.5px] font-semibold text-muted-foreground">
        Enter adds it and keeps the cursor here
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1 text-[10.5px] font-semibold text-success">
      <Check className="h-3 w-3" strokeWidth={3} />
      Changes save as you go
    </p>
  );
}
