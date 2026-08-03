'use client';

import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrganization as useClerkOrganization } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import OrgLogo from './OrgLogo';
import StepTracker from './StepTracker';
import type { SetupStepId } from '@/lib/onboarding/steps';

/**
 * Where a step's heading and footer are hoisted to. Steps still render them
 * wherever it reads naturally; the shell decides they belong outside the
 * scroll area. Null until mounted, which keeps the first client render
 * identical to the server's.
 */
const SetupSlots = createContext<{ heading: HTMLElement | null; footer: HTMLElement | null }>({
  heading: null,
  footer: null,
});

interface SetupShellProps {
  current: SetupStepId;
  children: React.ReactNode;
}

/**
 * The first-run setup surface: two full-height columns, not a floating card.
 *
 * The left column carries identity and progress and **never scrolls** — it's a
 * fixed frame of reference, so where you are in setup can't be scrolled out of
 * sight. Only the right column's content scrolls, and within it the step title
 * and the Back/Continue actions stay put: they're the two things you need
 * constantly, and a footer that scrolls away means hunting for Continue on
 * every long step.
 *
 * Below lg the columns stack, with the rail collapsing to a header band.
 */
export default function SetupShell({ current, children }: SetupShellProps) {
  const [heading, setHeading] = useState<HTMLElement | null>(null);
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  const { organization } = useClerkOrganization();

  return (
    <SetupSlots.Provider value={{ heading, footer }}>
      <div className="flex h-dvh flex-col overflow-hidden bg-setup-canvas lg:flex-row">
        <aside className="flex flex-shrink-0 flex-col gap-5 overflow-hidden border-b border-border bg-setup-surface p-5 sm:p-6 lg:h-full lg:w-[340px] lg:gap-9 lg:border-b-0 lg:border-r lg:p-10">
          <div className="flex items-center gap-2.5">
            <OrgLogo size={28} />
            <span className="truncate text-[15px] font-extrabold text-foreground">
              {organization?.name ?? ''}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Getting started
            </p>
            <h1 className="text-base font-bold text-foreground lg:text-xl">
              Set up your workspace
            </h1>
          </div>

          <StepTracker current={current} className="hidden lg:flex" />
          <StepTracker current={current} orientation="horizontal" className="lg:hidden" />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-setup-panel">
          {/* Pinned: the step title stays while its content scrolls under it. */}
          <div ref={setHeading} className="flex-shrink-0 px-5 pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:pt-10" />

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 lg:px-10">
            {children}
          </div>

          {/* Pinned: Continue is always one click away, never scrolled past. */}
          <div ref={setFooter} className="flex-shrink-0 px-5 pb-5 sm:px-6 sm:pb-6 lg:px-10 lg:pb-10" />
        </section>
      </div>
    </SetupSlots.Provider>
  );
}

/** The small uppercase label that heads a group inside a step. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * A step's heading block: the counter, an icon tile, the title and its hint.
 * Hoisted out of the scroll area by the shell.
 */
export function StepHeading({
  stepNumber,
  stepCount,
  icon,
  title,
  hint,
  tone = 'primary',
}: {
  stepNumber?: number | null;
  stepCount?: number;
  icon?: React.ReactNode;
  title: string;
  hint: string;
  /** 'success' marks the finished state on the final step. */
  tone?: 'primary' | 'success';
}) {
  const { heading } = useContext(SetupSlots);

  const content = (
    <div className="space-y-3 border-b border-border pb-4">
      {stepNumber != null && stepCount != null && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Step {stepNumber} of {stepCount}
        </p>
      )}
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
              tone === 'success' ? 'bg-success-bg text-success' : 'bg-primary/10 text-primary',
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-[13px] text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );

  return heading ? createPortal(content, heading) : content;
}

/**
 * The step footer: Back on the left, the step's primary action on the right.
 * Back is absent only on the intro, where there is nothing to go back to.
 * Hoisted out of the scroll area by the shell.
 */
export function StepFooter({
  onBack,
  disabled,
  children,
}: {
  onBack?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { footer } = useContext(SetupSlots);

  const content = (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack} disabled={disabled}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
      ) : (
        <span />
      )}
      {children}
    </div>
  );

  return footer ? createPortal(content, footer) : content;
}
