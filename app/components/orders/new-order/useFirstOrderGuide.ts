'use client';

import { useEffect, useRef, useState } from 'react';
import { useClients } from '@/hooks/clients/useClients';
import { useProducts } from '@/hooks/products/useProducts';
import { firstOrderPhase, shouldStartGuide, type FirstOrderPhase } from './first-order-guide';

/**
 * Drives the guided first order (see `first-order-guide.ts` for the phase
 * logic). Detects a fresh org — **0 clients and 0 products** — and, once so,
 * latches the guide on for the life of this screen so that creating the first
 * client (which flips the client count to 1) can't cut the walk short.
 *
 * The counts are two `limit: 1` reads whose only purpose is the `total`. They
 * do NOT share SWR keys with the client/product pickers (those fetch `limit:
 * 8`), so they are two small standalone requests made on *every* new-order
 * open — established orgs included, even though the guide only acts for a fresh
 * one. That is a deliberate trade of a tiny, one-row-each cost for a clear
 * "I want the count" intent; if it ever needs to be free, match the pickers'
 * exact params (`status:'active', limit:8`) so SWR serves all three from one
 * request.
 */
export function useFirstOrderGuide({
  hasClient,
  itemCount,
}: {
  hasClient: boolean;
  itemCount: number;
}): { phase: FirstOrderPhase; skip: () => void } {
  const clients = useClients({ status: 'active', limit: 1 });
  const products = useProducts({ status: 'active', limit: 1 });
  const ready = !clients.isLoading && !products.isLoading;

  const [guiding, setGuiding] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    // Decide exactly once, the first time both counts have resolved. After
    // that the flag is frozen — live counts change as records are created.
    if (decided.current || !ready) return;
    decided.current = true;
    if (shouldStartGuide({ ready, clientCount: clients.total, productCount: products.total })) {
      setGuiding(true);
    }
  }, [ready, clients.total, products.total]);

  const phase = firstOrderPhase({ guiding, skipped, hasClient, itemCount });

  return { phase, skip: () => setSkipped(true) };
}
