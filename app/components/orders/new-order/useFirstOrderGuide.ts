'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useClients } from '@/hooks/clients/useClients';
import { useProducts } from '@/hooks/products/useProducts';
import { useOrders } from '@/hooks/orders/useOrders';
import {
  firstOrderPhase,
  guideStepPosition,
  guideSteps,
  shouldStartGuide,
  type FirstOrderPhase,
} from './first-order-guide';

/** Per-browser dismissal, so a skipped guide stays skipped across reopens. */
const DISMISS_KEY = 'firstOrderGuide.dismissed';

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

interface GuideState {
  orgHasClients: boolean;
  orgHasProducts: boolean;
}

/**
 * Drives the guided first order (see `first-order-guide.ts` for the logic).
 * Detects a genuine first order — **no orders yet, and missing clients or
 * products** — then latches the org's facts for the life of the screen so that
 * creating the first record (which flips a count to 1) can't renumber the steps
 * or end the walk early.
 *
 * Three `limit: 1` reads back the detection; their only purpose is the `total`.
 * They do NOT share SWR keys with the pickers (those fetch `limit: 8`), so they
 * are small standalone reads on every new-order open — a deliberate trade of a
 * one-row-each cost for a clear "I want the count" intent. Match the pickers'
 * params if it ever needs to be free.
 */
export function useFirstOrderGuide({
  hasClient,
  itemCount,
}: {
  hasClient: boolean;
  itemCount: number;
}): {
  phase: FirstOrderPhase;
  step: { number: number; total: number } | null;
  skip: () => void;
} {
  const clients = useClients({ status: 'active', limit: 1 });
  const products = useProducts({ status: 'active', limit: 1 });
  const orders = useOrders({ limit: 1 });
  const ready = !clients.isLoading && !products.isLoading && !orders.isLoading;

  const [state, setState] = useState<GuideState | null>(null);
  const [skipped, setSkipped] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    // Decide exactly once, the first time all three counts have resolved. The
    // org facts are captured here and never re-read, so the walk is stable as
    // records are created underneath it.
    if (decided.current || !ready) return;
    decided.current = true;
    if (readDismissed()) return;
    if (
      shouldStartGuide({
        ready,
        orderCount: orders.total,
        clientCount: clients.total,
        productCount: products.total,
      })
    ) {
      setState({ orgHasClients: clients.total > 0, orgHasProducts: products.total > 0 });
    }
  }, [ready, orders.total, clients.total, products.total]);

  const skip = useCallback(() => {
    setSkipped(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode / storage disabled — the guide just reappears next open */
    }
  }, []);

  const orgHasClients = state?.orgHasClients ?? false;
  const orgHasProducts = state?.orgHasProducts ?? false;

  const phase = firstOrderPhase({
    guiding: state !== null,
    skipped,
    orgHasClients,
    orgHasProducts,
    hasClient,
    itemCount,
  });

  const step = state
    ? guideStepPosition({ phase, steps: guideSteps({ orgHasClients, orgHasProducts }) })
    : null;

  return { phase, step, skip };
}
