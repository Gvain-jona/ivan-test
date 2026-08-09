/**
 * Turning an edited settings block into a PATCH body.
 *
 * An emptied field means "remove this", and the API says that with `null` —
 * which PATCH /api/organization deletes from the stored block rather than
 * writing back as an empty value (A5, 2026-08-09). Before that there was no
 * way to remove a value at all: the block schemas were `.min(1)` so `''` was a
 * 400, and omitting a key means "leave it alone", so emptying a field saved
 * nothing and the UI had to admit it.
 *
 * The one field this does not apply to is `locale.currency`, which the schema
 * refuses to make nullable — an org always bills in some currency, and
 * clearing it would surface as a failure later, at issue time.
 */

/**
 * Maps a draft to the patch it implies: `''` becomes `null` (clear this),
 * `undefined` is dropped (the form never touched it).
 *
 * `false` and `0` survive — they are real answers ("not registered for tax",
 * "a 0% rate"), not absences.
 */
export function settingsBlockPayload<T extends Record<string, unknown>>(
  draft: T,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(draft)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === '' ? null : value]),
  );
}
