'use client';

import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The row vocabulary of the settings screens, transcribed from the F3 frame
 * (`k747O`) on the Pencil canvas.
 *
 * Two row shapes, and the difference is deliberate rather than incidental:
 *
 *   A **value row** (13/14 padding) states a fact — a quiet 12.5px label
 *   against a 13.5px medium value. Reading it is the common case.
 *
 *   A **switch row** (11/14 padding) is a decision — the label is 13.5px
 *   medium foreground, the same weight as a value, because the label *is* the
 *   thing you act on.
 *
 * Note where brand appears: a switch reads brand when on, but a "prints on the
 * document" chip selects **neutral**. That isn't inconsistency in the frame —
 * a switch is a setting the org turns on, while the chips are a multi-select
 * where brand on every selected item would drown the one primary action.
 */

/** Tap the value to edit it in place — no chevron, because nothing navigates. */
export function ValueRow({
  label,
  value,
  placeholder,
  onEdit,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  onEdit?: () => void;
}) {
  const body = (
    <>
      <span className="flex-shrink-0 text-[12.5px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          'truncate text-[13.5px] font-medium',
          value ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {value || placeholder}
      </span>
    </>
  );

  if (!onEdit) {
    return <div className="flex items-center justify-between gap-3 px-3.5 py-[13px]">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center justify-between gap-3 px-3.5 py-[13px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {body}
    </button>
  );
}

/** A value row turned into an input, in place. */
export function EditRow({
  label,
  value,
  onChange,
  onCommit,
  type = 'text',
  placeholder,
  autoFocus = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  type?: 'text' | 'number';
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-[9px]">
      <label
        htmlFor={`edit-${label}`}
        className="flex-shrink-0 text-[12.5px] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={`edit-${label}`}
        type={type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
        }}
        className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-right text-[13.5px] font-medium text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}

/**
 * A row that goes somewhere. The chevron is the difference from ValueRow and
 * it is load-bearing: on these screens a caret means navigation, and a row
 * without one edits in place.
 */
export function LinkRow({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-between gap-3 px-3.5 py-[13px] transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <span className="flex-shrink-0 text-[13.5px] font-medium text-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[12.5px] text-muted-foreground">{value}</span>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </span>
    </Link>
  );
}

export function SwitchRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-[11px]">
      <span className="text-[13.5px] font-medium text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-6 w-[42px] flex-shrink-0 items-center rounded-full p-[3px] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
          'disabled:opacity-50',
          checked ? 'justify-end bg-primary' : 'justify-start bg-muted',
        )}
      >
        <span
          className={cn(
            'h-[18px] w-[18px] rounded-full',
            checked ? 'bg-primary-foreground' : 'bg-background',
          )}
        />
      </button>
    </div>
  );
}

/**
 * A multi-select chip. Selected is neutral inverse, not brand — see the note at
 * the top of this file.
 */
export function ToggleChip({
  label,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-[7px] text-xs font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60',
        selected
          ? 'bg-foreground text-background'
          : 'bg-muted text-muted-foreground hover:text-foreground',
      )}
    >
      {selected && <Check className="h-[11px] w-[11px]" strokeWidth={3} />}
      {label}
    </button>
  );
}
