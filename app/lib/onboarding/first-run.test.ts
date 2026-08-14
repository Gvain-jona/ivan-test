import { describe, expect, it } from 'vitest';
import { firstRunRedirect, POST_SETUP_PATH } from './first-run';
import { SETUP_PATH } from './steps';

describe('firstRunRedirect', () => {
  it('sends a user without currency to the setup screen', () => {
    expect(firstRunRedirect({ currency: null, pathname: '/dashboard/orders' })).toBe(SETUP_PATH);
  });

  it('lets a user without currency stay on the setup screen', () => {
    expect(firstRunRedirect({ currency: null, pathname: SETUP_PATH })).toBeNull();
  });

  it('sends a user who has finished A1 off the bare setup screen', () => {
    expect(firstRunRedirect({ currency: 'UGX', pathname: SETUP_PATH })).toBe(POST_SETUP_PATH);
  });

  it('leaves a set-up user where they are everywhere else', () => {
    expect(firstRunRedirect({ currency: 'UGX', pathname: '/dashboard/clients' })).toBeNull();
    expect(firstRunRedirect({ currency: 'UGX', pathname: '/dashboard/home' })).toBeNull();
  });

  it('treats currency, not onboarding completion, as the only gate', () => {
    // The whole point: a user with currency is in, regardless of whether they
    // ever dismissed the "Continue setup" badge.
    expect(firstRunRedirect({ currency: 'KES', pathname: '/dashboard/products' })).toBeNull();
  });
});
