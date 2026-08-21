'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Screen furniture shared by the redesigned surfaces, transcribed from the
 * Pencil canvas (`yoko`) — B2 (New order) and F3 (Invoice settings) use
 * identical headers, section labels, list cards and footers.
 *
 * It is the vocabulary for the **sheets** too (B2a/B2a2, B2b, B2c, B8): those
 * frames are the same sections, cards and figure-plus-action footer, wrapped in
 * `AppSheet`'s chrome rather than a screen's. There is no separate sheet
 * vocabulary, and there must not be one — see the screen-vs-sheet carve-out in
 * CLAUDE.md.
 *
 * This file is the **furniture** — what content sits in. The things a person
 * picks or edits (field box, choice chip, list row) are `./controls`, split off
 * only for reading length: one vocabulary, two files, no third.
 *
 * Measurements are the frames': 16px header padding, a 22px gap between
 * sections and 8px under a section label, 16px card radius, 44px footer action.
 *
 * Colours are the one thing not transcribed. The frames are drawn light with
 * literal hexes; those map onto theme tokens so the screens hold in both
 * themes and `--primary` stays the organization's colour:
 *
 *   #FFFFFF page → background    #FAFAFA panel → card
 *   #F5F5F5 track → muted        #E5E5E5 → border
 *   #0A0A0A → foreground         #737373 → muted-foreground
 *   #D93A00 → primary
 */

/** An 11px uppercase section label. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium text-muted-foreground">{children}</p>;
}

/**
 * A labelled section: label, 8px gap, content. Sections sit 22px apart.
 *
 * `actionLabel`/`onAction` add the one action a section may carry — "ITEMS
 * + Add item". It is brand-coloured text rather than a button because it
 * repeats down the screen, and five buttons would compete with the footer's
 * single primary.
 */
export function Section({
  label,
  actionLabel,
  onAction,
  actionDisabled = false,
  children,
}: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Blocks the section action (e.g. while an order write is in flight). */
  actionDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <div className="flex w-full items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="rounded text-[12.5px] font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLabel}
          </button>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** The rounded, hairline-divided card every grouped list uses. */
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  );
}

export function RowDivider() {
  return <div className="h-px bg-border" />;
}

/** Renders children separated by hairlines, the way every card in the set does. */
export function Divided({ children }: { children: React.ReactNode }) {
  const rows = Array.isArray(children) ? children.flat() : [children];
  return (
    <>
      {rows.filter(Boolean).map((row, index) => (
        <div key={index}>
          {index > 0 && <RowDivider />}
          {row}
        </div>
      ))}
    </>
  );
}

/**
 * The back-and-title bar these screens open with. `action` is an optional
 * trailing slot (e.g. a record-actions menu) pinned to the right of the title.
 */
export function ScreenHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
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
        <h1 className="min-w-0 flex-1 truncate text-[19px] font-semibold text-foreground">
          {title}
        </h1>
        {action}
      </div>
      <RowDivider />
    </header>
  );
}

export interface FooterActionProps {
  figureLabel?: string;
  figureValue?: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  busy?: boolean;
}

/**
 * The figure-and-action row itself, with no chrome of its own.
 *
 * Two shapes in the frames: a key figure beside a fixed 150px action (B2), or
 * one action across the full width (F3). Passing a figure selects the first.
 *
 * Separate from `ScreenFooter` because the sheets need the same row without the
 * sticky/border/safe-area treatment — `AppSheet`'s own footer slot already
 * supplies all three, and nesting them would double the hairline and the
 * padding. One implementation, two mountings; don't copy this row into a sheet.
 */
export function FooterBar({
  figureLabel,
  figureValue,
  actionLabel,
  onAction,
  disabled,
  busy,
}: FooterActionProps) {
  const hasFigure = figureLabel !== undefined && figureValue !== undefined;
  return (
    <div className={cn('flex items-center gap-2.5', hasFigure ? 'justify-between' : '')}>
      {hasFigure && (
        <div className="flex flex-col gap-px">
          <span className="text-[10px] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            {figureLabel}
          </span>
          <span className="text-base font-semibold text-foreground">{figureValue}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onAction}
        disabled={disabled || busy}
        className={cn(
          'flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4',
          'text-sm font-medium text-primary-foreground transition-opacity',
          'disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          hasFigure ? 'w-[150px] flex-shrink-0' : 'flex-1',
        )}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {actionLabel}
      </button>
    </div>
  );
}

/** `FooterBar` pinned to the bottom of a screen, hairline and safe area included. */
export function ScreenFooter(props: FooterActionProps) {
  return (
    <footer
      className="sticky bottom-0 z-10 bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <RowDivider />
      <div className="px-4 py-3">
        <FooterBar {...props} />
      </div>
    </footer>
  );
}
