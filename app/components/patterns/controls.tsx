'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionLabel } from './screen';

/**
 * The input vocabulary of the redesigned surfaces — the things a person picks
 * or edits, as opposed to the furniture they sit in (`./screen`).
 *
 * Same design language, same frames, split only by role so neither file grows
 * past reading length. Import from either; they are one vocabulary, and there
 * must not be a third. See the screen-vs-sheet carve-out in CLAUDE.md.
 *
 * Measurements are the frames': field boxes are 40px with 12px side padding
 * under an 11px label, list rows 11/14 with 2px between their lines, chips
 * 7/11. Colours are the one thing not transcribed — the frames are drawn light
 * with literal hexes, mapped here onto theme tokens so these hold in both
 * themes and `--primary` stays the organization's colour.
 */

/**
 * A 40px bordered box holding a resolved value and a trailing affordance.
 *
 * Every signifier here is wired, per the mobile guardrails: a chevron means the
 * box opens something, a clear icon means it clears. A box with neither renders
 * nothing on the right rather than a decorative caret.
 */
export function FieldBox({
  label,
  value,
  placeholder,
  onOpen,
  onClear,
  disabled,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  onOpen?: () => void;
  onClear?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3">
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled || !onOpen}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground disabled:cursor-default"
        >
          {value ?? <span className="text-muted-foreground">{placeholder}</span>}
        </button>
        {onClear && value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="ml-2 flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ClearIcon />
          </button>
        ) : onOpen ? (
          <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );
}

/** The frame's x-in-circle, at its 16px size. */
export function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z m3-13l-6 6m0-6l6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A pill in a single-choice row.
 *
 * `chipClass` carries the selected colour when the choice has one of its own
 * (a status stage, a note type). Choices whose options define no colour —
 * delivery method, payment method — select as neutral inverse instead, which is
 * why those aren't brand-tinted: the data doesn't say they should be.
 */
export function ChoiceChip({
  label,
  selected,
  onSelect,
  icon,
  chipClass,
  size = 'md',
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  chipClass?: string;
  size?: 'md' | 'wide';
  /** Blocks the tap while a write is in flight, so a second choice can't race it. */
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex flex-shrink-0 items-center gap-1.5 rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60',
        size === 'wide' ? 'px-3.5 py-[7px] text-xs' : 'px-[11px] py-[7px] text-[11.5px]',
        selected
          ? cn('font-semibold', chipClass ?? 'bg-foreground text-background')
          : 'border border-border bg-card font-medium text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * One list row: name and amount on the top line, meta and state below.
 *
 * The right-hand slot of the second line is the state column across every
 * redesigned list — quantity on an order's items, stage on Orders, order count
 * on Clients. Both lines truncate rather than wrap, so a long product name
 * never pushes the money out of alignment.
 */
export function ListRow({
  name,
  amount,
  meta,
  trailing,
  onClick,
  onRemove,
}: {
  name: string;
  amount: string;
  meta?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const body = (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        <span className="flex-shrink-0 text-[13.5px] font-medium text-foreground">{amount}</span>
      </div>
      <div className="mt-0.5 flex items-start justify-between gap-2">
        <span className="truncate text-[11px] text-muted-foreground">{meta}</span>
        <span className="flex-shrink-0 text-[11px] text-muted-foreground">{trailing}</span>
      </div>
    </div>
  );

  return (
    <div className="flex items-start gap-2 px-3.5 py-[11px]">
      {onClick ? (
        <button type="button" onClick={onClick} className="flex min-w-0 flex-1 text-left">
          {body}
        </button>
      ) : (
        body
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-destructive"
        >
          <ClearIcon />
        </button>
      )}
    </div>
  );
}
