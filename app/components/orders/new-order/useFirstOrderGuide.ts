'use client';

import { useEffect, useRef, useState } from 'react';
import { useClients } from '@/hooks/clients/useClients';
import { useProducts } from '@/hooks/products/useProducts';
import { firstOrderPhase, type FirstOrderPhase } from './first-order-guide';

/**
 * Drives the guided first order (see `first-order-guide.ts` for the phase
 * logic). Detects a fresh org — **0 clients and 0 products** — and, once so,
 * latches the guide on for the life of this screen so that creating the first
 * client (which flips the client count to 1) can't cut the walk short.
 *
 * The counts come from `limit: 1` reads whose only purpose is the `total`; SWR
 * dedupes them against the pickers' own fetches, so this adds no real cost.
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
    if (clients.total === 0 && products.total === 0) setGuiding(true);
  }, [ready, clients.total, products.total]);

  const phase = firstOrderPhase({ guiding, skipped, hasClient, itemCount });

  return { phase, skip: () => setSkipped(true) };
}
