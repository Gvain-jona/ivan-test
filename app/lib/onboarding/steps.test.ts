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
  it('runs welcome -> currency -> product -> client -> order -> records', () => {
    expect(SETUP_STEPS.map(s => s.id)).toEqual([
      'welcome',
      'currency',
      'product',
      'client',
      'order',
      'records',
    ]);
  });

  // The design's rail (1-6) and its panel counter ("STEP n OF 5") only agree
  // if the intro carries no numeral. This is what keeps them consistent.
  it('excludes the intro from the count, so rail numerals match the counter', () => {
    expect(STEP_COUNT).toBe(5);
    expect(NUMBERED_STEPS.some(s => s.id === 'welcome')).toBe(false);
    expect(stepNumber('welcome')).toBeNull();
    expect(stepNumber('currency')).toBe(1);
    expect(stepNumber('records')).toBe(STEP_COUNT);
  });

  it('walks forward and back through every step', () => {
    expect(nextStep('welcome')).toBe('currency');
    expect(nextStep('order')).toBe('records');
    expect(previousStep('currency')).toBe('welcome');
    expect(previousStep('records')).toBe('order');
  });

  // Back is absent only on the intro, and Continue only on the last step.
  it('has no step before the intro and none after the last', () => {
    expect(previousStep('welcome')).toBeNull();
    expect(nextStep('records')).toBeNull();
  });

  it('every step is reachable by walking forward from the intro', () => {
    const walked: string[] = ['welcome'];
    let cursor = nextStep('welcome');
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
