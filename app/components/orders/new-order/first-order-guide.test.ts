import { describe, expect, it } from 'vitest';
import { firstOrderPhase, shouldStartGuide } from './first-order-guide';

describe('shouldStartGuide', () => {
  it('starts only for a resolved, genuinely empty org', () => {
    expect(shouldStartGuide({ ready: true, clientCount: 0, productCount: 0 })).toBe(true);
  });

  it('never starts while the counts are still loading (total defaults to 0)', () => {
    // The critical invariant: a loading read reports 0, which must NOT read as
    // an empty org, or the guide would fire for an established one.
    expect(shouldStartGuide({ ready: false, clientCount: 0, productCount: 0 })).toBe(false);
  });

  it('does not start when either clients or products already exist', () => {
    expect(shouldStartGuide({ ready: true, clientCount: 1, productCount: 0 })).toBe(false);
    expect(shouldStartGuide({ ready: true, clientCount: 0, productCount: 5 })).toBe(false);
    expect(shouldStartGuide({ ready: true, clientCount: 3, productCount: 3 })).toBe(false);
  });
});

describe('firstOrderPhase', () => {
  it('is off when the org is not fresh (guide never latched on)', () => {
    expect(firstOrderPhase({ guiding: false, skipped: false, hasClient: false, itemCount: 0 })).toBe(
      'off',
    );
  });

  it('starts at the client step for a fresh org', () => {
    expect(firstOrderPhase({ guiding: true, skipped: false, hasClient: false, itemCount: 0 })).toBe(
      'client',
    );
  });

  it('advances to the product step once a client is chosen', () => {
    expect(firstOrderPhase({ guiding: true, skipped: false, hasClient: true, itemCount: 0 })).toBe(
      'product',
    );
  });

  it('reaches done once the first item is added', () => {
    expect(firstOrderPhase({ guiding: true, skipped: false, hasClient: true, itemCount: 1 })).toBe(
      'done',
    );
  });

  it('is off as soon as the user skips, whatever the step', () => {
    expect(firstOrderPhase({ guiding: true, skipped: true, hasClient: false, itemCount: 0 })).toBe(
      'off',
    );
    expect(firstOrderPhase({ guiding: true, skipped: true, hasClient: true, itemCount: 0 })).toBe(
      'off',
    );
  });

  it('does not skip the product step if items exist but no client (defensive ordering)', () => {
    // client is resolved before product regardless of item count — an order
    // can't hold items without a client in practice, but the ordering is fixed.
    expect(firstOrderPhase({ guiding: true, skipped: false, hasClient: false, itemCount: 3 })).toBe(
      'client',
    );
  });
});
