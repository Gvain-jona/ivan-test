'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SETUP_STEPS, stepIndex, stepNumber, type SetupStepId } from '@/lib/onboarding/steps';

type StepState = 'done' | 'current' | 'upcoming';

interface StepTrackerProps {
  current: SetupStepId;
  /** 'vertical' is the desktop rail; 'horizontal' the strip shown below lg. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * Progress through first-run setup. Reads SETUP_STEPS, so the numerals here
 * are the same numbers the panel counter shows (Welcome carries a dot, not a
 * numeral — it isn't a counted step).
 */
export default function StepTracker({
  current,
  orientation = 'vertical',
  className,
}: StepTrackerProps) {
  const currentIndex = stepIndex(current);
  const stateOf = (index: number): StepState =>
    index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';

  if (orientation === 'horizontal') {
    return (
      <ol className={cn('flex items-center', className)}>
        {SETUP_STEPS.map((step, index) => (
          <li
            key={step.id}
            className={cn('flex items-center', index > 0 && 'min-w-0 flex-1')}
            aria-current={index === currentIndex ? 'step' : undefined}
          >
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  'h-0.5 min-w-2 flex-1',
                  stateOf(index - 1) === 'done' ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <Indicator step={step.id} state={stateOf(index)} />
            <span className="sr-only">{step.title}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn('flex flex-col', className)}>
      {SETUP_STEPS.map((step, index) => {
        const state = stateOf(index);
        const isLast = index === SETUP_STEPS.length - 1;
        return (
          <li
            key={step.id}
            className="flex gap-3"
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <div className="flex flex-col items-center">
              <Indicator step={step.id} state={state} />
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    'w-0.5 flex-1',
                    state === 'done' ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
            <div className={cn('min-w-0', isLast ? 'pb-0' : 'pb-5')}>
              <p
                className={cn(
                  'text-[13px] leading-tight',
                  state === 'upcoming'
                    ? 'font-medium text-muted-foreground'
                    : 'font-bold text-foreground',
                )}
              >
                {step.title}
              </p>
              <p className="text-[11px] leading-tight text-muted-foreground">{step.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Indicator({ step, state }: { step: SetupStepId; state: StepState }) {
  const number = stepNumber(step);
  return (
    <span
      className={cn(
        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
        state === 'done' && 'bg-primary text-primary-foreground',
        state === 'current' && 'border-2 border-primary bg-setup-surface text-primary',
        state === 'upcoming' && 'border border-border bg-setup-surface text-muted-foreground',
      )}
    >
      {state === 'done' ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      ) : number === null ? (
        // The intro has no numeral; a dot keeps the row visually anchored.
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            state === 'current' ? 'bg-primary' : 'bg-muted-foreground',
          )}
        />
      ) : (
        number
      )}
    </span>
  );
}
