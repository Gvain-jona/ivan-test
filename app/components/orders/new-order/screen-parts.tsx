'use client';

import { ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The layout vocabulary of the redesigned order screens, transcribed from the
 * B2 frame on the Pencil canvas (`yoko`).
 *
 * Measurements are the frame's, not invented: field boxes are 40px tall with
 * 12px side padding and a 6px gap under an 11px label; list rows are 11/14 with
 * a 2px gap between their two lines; section heads pair an 11px label with a
 * 12.5px brand action. Where a value looks arbitrary it is because the design
 * says so.
 *
 * Colours are the one thing deliberately NOT transcribed. The frame is drawn
 * in light mode with literal hexes; those map onto theme tokens here so the
 * screens hold in both themes and so `--primary` stays the organization's
 * colour rather than the canvas's orange:
 *
 *   #FFFFFF page → background      #FAFAFA panel → card
 *   #FBFBFB summary → muted/40     #F5F5F5 track → muted
 *   #E5E5E5 → border               #0A0A0A → foreground
 *   #737373 → muted-foreground     #D93A00 → primary
 *
 * Status and note-type chips take their colour from the option's own `color`
 * via lib/fields/colors, so an org that recolours a stage recolours it here.
 */

/** An 11px uppercase field/section label. */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium text-muted-foreground">{children}</span>
  );
}

/**
 * A section heading with its one action — "ITEMS  + Add item". The action is
 * brand-coloured text rather than a button: it repeats down the screen, and
 * five buttons would compete with the footer's single primary.
 */
export function SectionHead({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <FieldLabel>{label}</FieldLabel>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded text-[12.5px] font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

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
      <FieldLabel>{label}</FieldLabel>
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
function ClearIcon() {
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
 * (a status stage). Choices whose options define no colour — delivery method —
 * select as neutral inverse instead, which is why that isn't brand-tinted: the
 * data doesn't say it should be.
 */
export function ChoiceChip({
  label,
  selected,
  onSelect,
  icon,
  chipClass,
  size = 'md',
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  chipClass?: string;
  size?: 'md' | 'wide';
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex flex-shrink-0 items-center gap-1.5 rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
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

/** The rounded, hairline-divided container every list on these screens uses. */
export function ListBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  );
}

/**
 * One list row: name and amount on the top line, meta and quantity below.
 *
 * The right-hand slot of the second line is the state column across every
 * redesigned list — quantity here, stage on Orders, order count on Clients.
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

export function RowDivider() {
  return <div className="h-px bg-border" />;
}

/** The back-and-title bar these screens open with. */
export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 bg-card">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="rounded text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
        <h1 className="text-[19px] font-semibold text-foreground">{title}</h1>
      </div>
      <div className="h-px bg-border" />
    </header>
  );
}

/**
 * The footer pattern shared by every composing screen: the figure that matters
 * on the left, the one forward action on the right. Sticky and safe-area aware
 * — it is the only primary action on the screen.
 */
export function ScreenFooter({
  figureLabel,
  figureValue,
  actionLabel,
  onAction,
  disabled,
  busy,
}: {
  figureLabel: string;
  figureValue: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <footer
      className="sticky bottom-0 z-10 bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="h-px bg-border" />
      <div className="flex items-center justify-between gap-2.5 px-4 py-3">
        <div className="flex flex-col gap-px">
          <span className="text-[10px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            {figureLabel}
          </span>
          <span className="text-base font-semibold text-foreground">{figureValue}</span>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={disabled || busy}
          className="h-11 w-[150px] rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {busy ? 'Saving…' : actionLabel}
        </button>
      </div>
    </footer>
  );
}
