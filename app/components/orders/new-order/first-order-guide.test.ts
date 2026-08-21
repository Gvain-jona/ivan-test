import { describe, expect, it } from 'vitest';
import { firstOrderPhase } from './first-order-guide';

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
