import { describe, expect, it } from 'vitest';
import {
  NUMBERED_STEPS,
  SETUP_STEPS,
  STEP_COUNT,
  nextStep,
  previousStep,
  stepIndex,
  stepNumber,
} from './steps';

describe('setup step model', () => {
  it('runs business -> product -> client -> order -> records', () => {
    expect(SETUP_STEPS.map(s => s.id)).toEqual([
      'business',
      'product',
      'client',
      'order',
      'records',
    ]);
  });

  // A1 replaced the un-numbered Welcome intro and the Currency step with one
  // Business details form, so every step now carries a numeral and the rail
  // and the panel counter are the same list.
  it('counts every step, the intro having been replaced by a real one', () => {
    expect(STEP_COUNT).toBe(5);
    expect(NUMBERED_STEPS).toHaveLength(SETUP_STEPS.length);
    expect(stepNumber('business')).toBe(1);
    expect(stepNumber('records')).toBe(STEP_COUNT);
  });

  it('walks forward and back through every step', () => {
    expect(nextStep('business')).toBe('product');
    expect(nextStep('order')).toBe('records');
    expect(previousStep('product')).toBe('business');
    expect(previousStep('records')).toBe('order');
  });

  // Back is absent only on the first step, and Continue only on the last.
  it('has no step before the first and none after the last', () => {
    expect(previousStep('business')).toBeNull();
    expect(nextStep('records')).toBeNull();
  });

  it('every step is reachable by walking forward from the first', () => {
    const walked: string[] = ['business'];
    let cursor = nextStep('business');
    while (cursor) {
      walked.push(cursor);
      cursor = nextStep(cursor);
    }
    expect(walked).toEqual(SETUP_STEPS.map(s => s.id));
  });

  it('indexes match array position', () => {
    SETUP_STEPS.forEach((step, index) => expect(stepIndex(step.id)).toBe(index));
  });
});
