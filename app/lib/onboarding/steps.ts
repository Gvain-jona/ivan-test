/**
 * The first-run step model — the single list the rail, the panel counter and
 * the wizard's navigation all read from, so they can't drift apart.
 *
 * Five steps, all numbered. There used to be six: an un-numbered Welcome intro
 * that narrated the data model, and a Currency step. A1 replaced both with one
 * **Business details** form — the frame's own note is "the form, no narration"
 * — so currency is now one field among the business's own details rather than
 * a stage of its own. See docs/v2-migration/APP_REDESIGN.md → A1.
 */

/** The one route that renders the setup surface, shared by the gate and the
 *  layout that suppresses chrome for it. */
export const SETUP_PATH = '/dashboard/getting-started';

export type SetupStepId = 'business' | 'product' | 'client' | 'order' | 'records';

export interface SetupStep {
  id: SetupStepId;
  /** Rail label. */
  title: string;
  /** Rail sub-label — what the step is for, in the user's own terms. */
  hint: string;
}

export const SETUP_STEPS: readonly SetupStep[] = [
  { id: 'business', title: 'Your business', hint: 'Name, contact, currency' },
  { id: 'product', title: 'Products', hint: 'What you sell' },
  { id: 'client', title: 'Clients', hint: 'Who you sell to' },
  { id: 'order', title: 'Orders', hint: 'Your workflow' },
  { id: 'records', title: 'First records', hint: 'Optional' },
] as const;

/** Every step is counted now that the un-numbered intro is gone. */
export const NUMBERED_STEPS: readonly SetupStep[] = SETUP_STEPS;

/** The "of N" in "STEP n OF N". */
export const STEP_COUNT = NUMBERED_STEPS.length;

export function stepIndex(id: SetupStepId): number {
  return SETUP_STEPS.findIndex(s => s.id === id);
}

/** 1-based position among the numbered steps. */
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
