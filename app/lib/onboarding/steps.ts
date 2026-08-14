/**
 * First-run is one screen now: A1, business details.
 *
 * It used to be a multi-step wizard (business → product → client → order →
 * first records), and before that six steps with an un-numbered Welcome intro.
 * Both are gone. The decision (2026-08-14): the app seeds the common baseline
 * for the org rather than making the owner configure what to collect — expert
 * knowledge most don't have on day one — so nothing needs to be set up before
 * entering. A1 collects the business's own details (its one required field,
 * currency, is what documents are priced in), and everything else is refined
 * in-app behind the "Continue setup" badge. See seed-defaults.ts, first-run.ts,
 * and docs/v2-migration/APP_REDESIGN.md → A1/H1.
 */

/** The one route that renders the setup surface (A1), shared by the gate and
 *  the layout that suppresses chrome for it. */
export const SETUP_PATH = '/dashboard/getting-started';
