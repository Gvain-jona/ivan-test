'use client';

import { useRef, useState } from 'react';
import { CornerDownLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { slugifyOptionValue } from '@/lib/fields/slug';
import { optionColorClasses } from '@/lib/fields/colors';
import type { FieldOption } from '@/lib/fields/options';

interface FieldOptionsEditorProps {
  options: FieldOption[];
  onChange: (next: FieldOption[]) => void;
  disabled?: boolean;
}

/**
 * The choices a select field offers. Adding is inline and repeated — Enter
 * commits and keeps the cursor here, because options are almost always
 * entered as a run rather than one at a time.
 *
 * Removing is immediate and unconfirmed by design: a confirm dialog here
 * would reintroduce the modal this whole surface removes. Undo lives with the
 * caller, which knows the previous list.
 */
export default function FieldOptionsEditor({
  options,
  onChange,
  disabled,
}: FieldOptionsEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');

  const trimmed = draft.trim();
  const value = slugifyOptionValue(trimmed);
  const duplicate = value !== '' && options.some(option => option.value === value);
  const canAdd = !disabled && value !== '' && !duplicate;

  const add = () => {
    if (!canAdd) return;
    onChange([...options, { value, label: trimmed }]);
    setDraft('');
    inputRef.current?.focus();
  };

  const remove = (target: string) => {
    onChange(options.filter(option => option.value !== target));
  };

  return (
    <div className="space-y-2">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map(option => (
            <span
              key={option.value}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
                optionColorClasses(option.color).chip
              }`}
            >
              {option.label}
              <button
                type="button"
                onClick={() => remove(option.value)}
                disabled={disabled}
                className="rounded-sm opacity-60 transition-opacity hover:opacity-100 disabled:pointer-events-none"
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={event => {
          event.preventDefault();
          add();
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Add an option"
          aria-label="New option"
          disabled={disabled}
          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary disabled:opacity-50"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!canAdd}>
          Add
        </Button>
      </form>

      {duplicate ? (
        <p className="text-[10.5px] font-semibold text-destructive">
          &ldquo;{trimmed}&rdquo; is already an option.
        </p>
      ) : (
        <p className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
          <CornerDownLeft className="h-3 w-3" />
          Enter adds another and keeps the cursor here
        </p>
      )}
    </div>
  );
}
