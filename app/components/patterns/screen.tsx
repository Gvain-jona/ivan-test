'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Screen furniture shared by the redesigned full-screen surfaces, transcribed
 * from the Pencil canvas (`yoko`) — B2 (New order) and F3 (Invoice settings)
 * use identical headers, section labels, list cards and footers.
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

/** A labelled section: label, 8px gap, content. Sections sit 22px apart. */
export function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <SectionLabel>{label}</SectionLabel>
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
      <RowDivider />
    </header>
  );
}

/**
 * The sticky footer. Two shapes in the frames: a key figure beside a fixed
 * 150px action (B2), or one action across the full width (F3). Passing a
 * figure selects the first.
 */
export function ScreenFooter({
  figureLabel,
  figureValue,
  actionLabel,
  onAction,
  disabled,
  busy,
}: {
  figureLabel?: string;
  figureValue?: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const hasFigure = figureLabel !== undefined && figureValue !== undefined;
  return (
    <footer
      className="sticky bottom-0 z-10 bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <RowDivider />
      <div
        className={cn(
          'flex items-center gap-2.5 px-4 py-3',
          hasFigure ? 'justify-between' : '',
        )}
      >
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
    </footer>
  );
}
