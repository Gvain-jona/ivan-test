/**
 * The first-run step model — the single list the rail, the panel counter and
 * the wizard's navigation all read from, so they can't drift apart.
 *
 * Welcome is an **intro, not a step**: it carries no numeral and the counter
 * starts at Currency. That's what resolves the design's apparent 1-6 vs
 * "STEP n OF 5" mismatch — the rail numerals and the counter are the same
 * number, and Welcome simply isn't one of them. See
 * docs/v2-migration/ONBOARDING_REDESIGN.md §4.
 */

/** The one route that renders the setup surface, shared by the gate and the
 *  layout that suppresses chrome for it. */
export const SETUP_PATH = '/dashboard/getting-started';

export type SetupStepId = 'welcome' | 'currency' | 'product' | 'client' | 'order' | 'records';

export interface SetupStep {
  id: SetupStepId;
  /** Rail label. */
  title: string;
  /** Rail sub-label — what the step is for, in the user's own terms. */
  hint: string;
}

export const SETUP_STEPS: readonly SetupStep[] = [
  { id: 'welcome', title: 'Welcome', hint: 'Quick intro' },
  { id: 'currency', title: 'Currency', hint: 'How you price' },
  { id: 'product', title: 'Products', hint: 'What you sell' },
  { id: 'client', title: 'Clients', hint: 'Who you sell to' },
  { id: 'order', title: 'Orders', hint: 'Your workflow' },
  { id: 'records', title: 'First records', hint: 'Optional' },
] as const;

/** The steps the counter counts — everything but the intro. */
export const NUMBERED_STEPS: readonly SetupStep[] = SETUP_STEPS.filter(s => s.id !== 'welcome');

/** The "of N" in "STEP n OF N". */
export const STEP_COUNT = NUMBERED_STEPS.length;

export function stepIndex(id: SetupStepId): number {
  return SETUP_STEPS.findIndex(s => s.id === id);
}

/** 1-based position among the numbered steps; null for the intro. */
export function stepNumber(id: SetupStepId): number | null {
  const index = NUMBERED_STEPS.findIndex(s => s.id === id);
  return index === -1 ? null : index + 1;
}

export function nextStep(id: SetupStepId): SetupStepId | null {
  return SETUP_STEPS[stepIndex(id) + 1]?.id ?? null;
}

export function previousStep(id: SetupStepId): SetupStepId | null {
  const index = stepIndex(id);
  return index > 0 ? SETUP_STEPS[index - 1].id : null;
}
