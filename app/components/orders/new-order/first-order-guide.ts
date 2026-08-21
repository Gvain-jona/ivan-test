/**
 * The guided-first-order state machine, as a pure function so the whole
 * decision is unit-testable without SWR or a router.
 *
 * The guide is the just-in-time answer to a fresh org (no clients, no products)
 * opening New Order: rather than gate setup up front, it walks the one order
 * they came to make — client, then first product — and then gets out of the
 * way. Payments are deliberately absent: `payment_method` is a fixed enum, so
 * there is nothing to introduce.
 *
 * `guiding` is latched once at mount (see `useFirstOrderGuide`) — it must NOT
 * be re-derived from live counts, because creating the first client flips the
 * client count to 1 mid-walk and would otherwise end the guide before the
 * product step.
 */
export type FirstOrderPhase = 'off' | 'client' | 'product' | 'done';

/**
 * Whether to latch the guide on. Fresh means **both** counts are zero — but
 * only once the reads have resolved: `total` defaults to 0 while a read is in
 * flight, so without the `ready` gate a loading state would read as an empty
 * org and wrongly start the guide for an established one. This is the whole
 * safety of the detection; kept pure so that invariant is regression-tested.
 */
export function shouldStartGuide({
  ready,
  clientCount,
  productCount,
}: {
  ready: boolean;
  clientCount: number;
  productCount: number;
}): boolean {
  return ready && clientCount === 0 && productCount === 0;
}

export function firstOrderPhase({
  guiding,
  skipped,
  hasClient,
  itemCount,
}: {
  /** Latched at mount: was the org fresh (0 clients, 0 products) on arrival? */
  guiding: boolean;
  /** Did the user dismiss the guide? */
  skipped: boolean;
  /** Is a client selected on the draft? */
  hasClient: boolean;
  /** How many line items the draft holds. */
  itemCount: number;
}): FirstOrderPhase {
  if (!guiding || skipped) return 'off';
  if (!hasClient) return 'client';
  if (itemCount === 0) return 'product';
  return 'done';
}
