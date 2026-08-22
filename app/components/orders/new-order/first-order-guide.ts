/**
 * The guided-first-order state machine, as pure functions so the whole
 * decision is unit-testable without SWR or a router.
 *
 * The guide is the just-in-time answer to a first order that still has
 * something to create: rather than gate setup up front, it walks the creation
 * of whatever the org is missing — a client, a product, or both — in the middle
 * of the one order they came to make, then gets out of the way. Payments are
 * deliberately absent: `payment_method` is a fixed enum, so there is nothing to
 * introduce.
 *
 * The org-level facts (`orgHasClients`/`orgHasProducts`) are latched once at
 * mount (see `useFirstOrderGuide`) — they must NOT be re-derived from live
 * counts, because creating the first client flips that count to 1 mid-walk and
 * would otherwise renumber the steps or end the guide early. The *draft* facts
 * (`hasClient`, `itemCount`) are live: they are what advance the walk.
 */
export type FirstOrderPhase = 'off' | 'client' | 'product' | 'done';

/**
 * Whether to latch the guide on. Two conditions, both load-bearing:
 *
 * - `orderCount === 0` — a genuine *first* order. This is what keeps the guide
 *   from nagging an established org that simply prefers one-off items and never
 *   built a catalogue; once they have a single order, it never appears again.
 * - `clientCount === 0 || productCount === 0` — there is actually something to
 *   create. An org that already has both needs selection, not creation, which
 *   the normal pickers already do.
 *
 * `ready` gates both: `total` defaults to 0 while a read is in flight, so
 * without it a loading state would read as an empty org and wrongly start.
 */
export function shouldStartGuide({
  ready,
  orderCount,
  clientCount,
  productCount,
}: {
  ready: boolean;
  orderCount: number;
  clientCount: number;
  productCount: number;
}): boolean {
  return ready && orderCount === 0 && (clientCount === 0 || productCount === 0);
}

export function firstOrderPhase({
  guiding,
  skipped,
  orgHasClients,
  orgHasProducts,
  hasClient,
  itemCount,
}: {
  /** Latched at mount: was the guide started at all? */
  guiding: boolean;
  /** Did the user dismiss the guide? */
  skipped: boolean;
  /** Latched at mount: did the org already have clients (→ don't guide creating one)? */
  orgHasClients: boolean;
  /** Latched at mount: did the org already have products? */
  orgHasProducts: boolean;
  /** Is a client selected on the draft? */
  hasClient: boolean;
  /** How many line items the draft holds. */
  itemCount: number;
}): FirstOrderPhase {
  if (!guiding || skipped) return 'off';
  // Only guide the *creation* of entity types the org lacks. An org that
  // already has clients selects one through the normal field; the guide there
  // is only about the product it is missing.
  if (!orgHasClients && !hasClient) return 'client';
  if (!orgHasProducts && itemCount === 0) return 'product';
  // Every creation step the org actually needed is done — but "done" is a claim
  // that the order is *ready*, which is only true once it has both a client and
  // a line (`useOrderDraft`'s own canSave rule). When the org already had one
  // side, the piece still missing is a *selection*, not a creation: the normal
  // field / "Add item" affordance owns that, so the guide steps aside rather
  // than congratulating the user into a form whose Save is still disabled.
  if (hasClient && itemCount > 0) return 'done';
  return 'off';
}

/**
 * Which creation steps this walk covers, in order — used to number the banner
 * ("Step 1 of 2") off the steps that actually apply, so a product-only walk
 * reads as one step, not "step 2 of 2".
 */
export function guideSteps({
  orgHasClients,
  orgHasProducts,
}: {
  orgHasClients: boolean;
  orgHasProducts: boolean;
}): Exclude<FirstOrderPhase, 'off' | 'done'>[] {
  const steps: Exclude<FirstOrderPhase, 'off' | 'done'>[] = [];
  if (!orgHasClients) steps.push('client');
  if (!orgHasProducts) steps.push('product');
  return steps;
}

/** The banner's "n of total" for the current phase, or null when it has no counter. */
export function guideStepPosition({
  phase,
  steps,
}: {
  phase: FirstOrderPhase;
  steps: Exclude<FirstOrderPhase, 'off' | 'done'>[];
}): { number: number; total: number } | null {
  if (phase !== 'client' && phase !== 'product') return null;
  const index = steps.indexOf(phase);
  if (index === -1) return null;
  return { number: index + 1, total: steps.length };
}
