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
 * It rides the top of the New Order screen for a fresh org and narrates the two
 * steps in order (client, then product), each a single primary action, with a
 * running "Step n of 2" and an always-present Skip so it can never trap. When
 * both are done it turns into a one-line confirmation the user can dismiss.
 * Renders nothing once the guide is off.
 */
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
      <div className="flex items-center gap-2.5 rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
        <Check className="h-4 w-4 flex-shrink-0 text-success" strokeWidth={2.5} />
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

  // Only number the steps when the walk has more than one; a product-only walk
  // (an org that already has clients) shouldn't read "Step 1 of 1".
  const label = step && step.total > 1 ? `Step ${step.number} of ${step.total} · New here` : 'New here';
  const title = phase === 'client' ? 'Add your first client' : 'Add your first product';
  const body =
    phase === 'client'
      ? 'Every order is for someone — start with who this one is for.'
      : 'What are you selling? We’ll save it to your catalogue so the next order is faster.';
  const action = phase === 'client' ? onAddClient : onAddProduct;
  const actionLabel = phase === 'client' ? 'Add client' : 'Add product';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-primary">
          {label}
        </span>
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
