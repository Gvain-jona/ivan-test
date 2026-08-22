'use client';

import { Check } from 'lucide-react';
import type { FirstOrderPhase } from './first-order-guide';

interface FirstOrderGuideProps {
  phase: FirstOrderPhase;
  /** "n of total" for the current step, or null when the walk is a single step. */
  step: { number: number; total: number } | null;
  onAddClient: () => void;
  onAddProduct: () => void;
  onSkip: () => void;
}

/**
 * The guided-first-order banner — the visible half of `useFirstOrderGuide`.
 *
 * It rides the top of the New Order screen for a fresh org and narrates the
 * steps in order (client, then product), each a single primary action, with a
 * small progress indicator and an always-present Skip so it can never trap. When
 * the order is actually ready it turns into a one-line confirmation the user can
 * dismiss. Renders nothing once the guide is off.
 *
 * Deliberately a **calm, neutral card** (`bg-card` / `border-border`), not a
 * brand-tinted slab: `--primary` is the org's own colour and reads unpredictably
 * as a large fill across tenants and themes, so the brand shows only where it
 * always does — the single primary button, plus tiny step dots — while the
 * surface stays the same as every other card on the screen.
 */
/** Per-step copy, keyed by phase — keeps the render free of stacked ternaries. */
const STEP_COPY: Record<'client' | 'product', { title: string; body: string; actionLabel: string }> = {
  client: {
    title: 'Add your first client',
    body: 'Every order is for someone — start with who this one is for.',
    actionLabel: 'Add client',
  },
  product: {
    title: 'Add your first product',
    body: 'What are you selling? We’ll save it to your catalogue so the next order is faster.',
    actionLabel: 'Add product',
  },
};

/** Filled-to-current progress dots; the brand shows here only as a small accent. */
function StepDots({ number, total }: { number: number; total: number }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Step ${number} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < number ? 'bg-primary' : 'bg-border'}`}
        />
      ))}
    </div>
  );
}

export default function FirstOrderGuide({
  phase,
  step,
  onAddClient,
  onAddProduct,
  onSkip,
}: FirstOrderGuideProps) {
  if (phase === 'off') return null;

  if (phase === 'done') {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15">
          <Check className="h-3 w-3 text-success" strokeWidth={2.5} />
        </span>
        <p className="flex-1 text-[13px] font-medium text-foreground">
          You’re set up — review the order below and save when it’s ready.
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="flex-shrink-0 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Only show progress when the walk has more than one step; a product-only walk
  // (an org that already has clients) shouldn't read "Step 1 of 1".
  const multiStep = step !== null && step.total > 1;
  const progressLabel =
    multiStep && step ? `Step ${step.number} of ${step.total}` : 'Getting started';
  const { title, body, actionLabel } = STEP_COPY[phase];
  const action = phase === 'client' ? onAddClient : onAddProduct;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {multiStep && step && <StepDots number={step.number} total={step.total} />}
          <span className="text-[11px] font-medium text-muted-foreground">{progressLabel}</span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          Skip setup
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>

      <button
        type="button"
        onClick={action}
        className="self-start rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {actionLabel}
      </button>
    </div>
  );
}
