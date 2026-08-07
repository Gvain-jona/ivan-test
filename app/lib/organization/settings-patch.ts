/**
 * Turning an edited settings block into a PATCH body.
 *
 * organizations.settings blocks are `.strict()` and most of their strings are
 * `.min(1)`, so an empty input is a validation error rather than a clear. Both
 * functions here exist because of that one fact: one decides what may be sent,
 * the other works out what the user tried to remove and couldn't, so the UI
 * can say so instead of reporting a save that silently didn't happen.
 */

/**
 * Drops what a block schema would reject. `false` and `0` survive — they are
 * real answers ("not registered for tax", "a 0% rate"), not absences.
 */
export function settingsBlockPayload<T extends Record<string, unknown>>(draft: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(draft).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>;
}

/**
 * Keys the user emptied that will keep their stored value anyway, because
 * omitting a key means "leave it alone" and sending `''` is a 400.
 *
 * A key already stored as `''` is not reported: nothing was lost, since it was
 * already empty.
 */
export function unclearableKeys(
  saved: Record<string, unknown>,
  payload: Record<string, unknown>,
): string[] {
  return Object.keys(saved).filter(key => !(key in payload) && saved[key] !== '');
}
