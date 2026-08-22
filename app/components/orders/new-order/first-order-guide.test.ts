import { describe, expect, it } from 'vitest';
import {
  firstOrderPhase,
  guideStepPosition,
  guideSteps,
  shouldStartGuide,
} from './first-order-guide';

describe('shouldStartGuide', () => {
  it('starts for a first order that is missing everything', () => {
    expect(
      shouldStartGuide({ ready: true, orderCount: 0, clientCount: 0, productCount: 0 }),
    ).toBe(true);
  });

  it('starts for a first order missing only products (has clients)', () => {
    expect(
      shouldStartGuide({ ready: true, orderCount: 0, clientCount: 4, productCount: 0 }),
    ).toBe(true);
  });

  it('does NOT start once the org has any order — the first-order gate', () => {
    // The key guard: an established org that never built a catalogue (uses
    // one-offs) must not be nagged on every order.
    expect(
      shouldStartGuide({ ready: true, orderCount: 1, clientCount: 5, productCount: 0 }),
    ).toBe(false);
  });

  it('does NOT start when the org already has both clients and products', () => {
    expect(
      shouldStartGuide({ ready: true, orderCount: 0, clientCount: 3, productCount: 3 }),
    ).toBe(false);
  });

  it('never starts while any count is still loading (total defaults to 0)', () => {
    expect(
      shouldStartGuide({ ready: false, orderCount: 0, clientCount: 0, productCount: 0 }),
    ).toBe(false);
  });
});

describe('firstOrderPhase', () => {
  const base = { guiding: true, skipped: false, orgHasClients: false, orgHasProducts: false };

  it('is off when the guide never started', () => {
    expect(firstOrderPhase({ ...base, guiding: false, hasClient: false, itemCount: 0 })).toBe('off');
  });

  it('is off once skipped, at any step', () => {
    expect(firstOrderPhase({ ...base, skipped: true, hasClient: false, itemCount: 0 })).toBe('off');
    expect(firstOrderPhase({ ...base, skipped: true, hasClient: true, itemCount: 0 })).toBe('off');
  });

  it('walks client → product → done for a fully fresh org', () => {
    expect(firstOrderPhase({ ...base, hasClient: false, itemCount: 0 })).toBe('client');
    expect(firstOrderPhase({ ...base, hasClient: true, itemCount: 0 })).toBe('product');
    expect(firstOrderPhase({ ...base, hasClient: true, itemCount: 1 })).toBe('done');
  });

  it('skips the client step when the org already has clients', () => {
    // Org has clients → the guide only covers the missing product; the client
    // is chosen through the normal field, not created.
    const hasClients = { ...base, orgHasClients: true };
    expect(firstOrderPhase({ ...hasClients, hasClient: false, itemCount: 0 })).toBe('product');
    expect(firstOrderPhase({ ...hasClients, hasClient: true, itemCount: 1 })).toBe('done');
  });

  it('skips the product step when the org already has products', () => {
    const hasProducts = { ...base, orgHasProducts: true };
    expect(firstOrderPhase({ ...hasProducts, hasClient: false, itemCount: 0 })).toBe('client');
  });

  it('does NOT claim done while the order is not yet savable', () => {
    // The creation step the org needed is finished, but the *selection* the
    // normal form owns isn't — so the guide steps aside (off), never "done".
    // Org has products, client created, but no line item yet:
    const hasProducts = { ...base, orgHasProducts: true };
    expect(firstOrderPhase({ ...hasProducts, hasClient: true, itemCount: 0 })).toBe('off');
    // Org has clients, product created, but no client selected yet:
    const hasClients = { ...base, orgHasClients: true };
    expect(firstOrderPhase({ ...hasClients, hasClient: false, itemCount: 1 })).toBe('off');
  });

  it('reaches done only once the order is actually savable', () => {
    // Same partial-org walks, now with both a client and a line present.
    const hasProducts = { ...base, orgHasProducts: true };
    expect(firstOrderPhase({ ...hasProducts, hasClient: true, itemCount: 1 })).toBe('done');
    const hasClients = { ...base, orgHasClients: true };
    expect(firstOrderPhase({ ...hasClients, hasClient: true, itemCount: 1 })).toBe('done');
  });
});

describe('guideSteps + guideStepPosition', () => {
  it('is a two-step walk for a fully fresh org, numbered in order', () => {
    const steps = guideSteps({ orgHasClients: false, orgHasProducts: false });
    expect(steps).toEqual(['client', 'product']);
    expect(guideStepPosition({ phase: 'client', steps })).toEqual({ number: 1, total: 2 });
    expect(guideStepPosition({ phase: 'product', steps })).toEqual({ number: 2, total: 2 });
  });

  it('is a single-step walk when only the product is missing', () => {
    const steps = guideSteps({ orgHasClients: true, orgHasProducts: false });
    expect(steps).toEqual(['product']);
    expect(guideStepPosition({ phase: 'product', steps })).toEqual({ number: 1, total: 1 });
  });

  it('has no counter for the done/off phases', () => {
    const steps = guideSteps({ orgHasClients: false, orgHasProducts: false });
    expect(guideStepPosition({ phase: 'done', steps })).toBeNull();
    expect(guideStepPosition({ phase: 'off', steps })).toBeNull();
  });
});
