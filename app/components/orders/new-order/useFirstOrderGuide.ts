'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useClients } from '@/hooks/clients/useClients';
import { useProducts } from '@/hooks/products/useProducts';
import { useOrders } from '@/hooks/orders/useOrders';
import { useOrganization } from '@/hooks/organization/useOrganization';
import {
  firstOrderPhase,
  guideStepPosition,
  guideSteps,
  shouldStartGuide,
  type FirstOrderPhase,
} from './first-order-guide';

/**
 * Per-browser, **per-org** dismissal, so a skipped guide stays skipped across
 * reopens — but only for the org it was skipped in. This is a multi-tenant app:
 * one browser can hold several orgs, and a genuinely fresh org B must still get
 * the guide even after the user skipped it in org A. Keying on the org id keeps
 * the two independent.
 */
function dismissKey(orgId: string): string {
  return `firstOrderGuide.dismissed.${orgId}`;
}

function readDismissed(orgId: string): boolean {
  try {
    return window.localStorage.getItem(dismissKey(orgId)) === '1';
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
  // The org id scopes the per-org dismissal; it also gates the decision, since
  // reading (or writing) the wrong org's skip flag would carry a dismissal
  // across tenants. `useOrganization` is an app-wide, deduped read, so this
  // adds no fetch of its own.
  const { organization } = useOrganization();
  const orgId = organization && organization.id;
  const ready = !clients.isLoading && !products.isLoading && !orders.isLoading;

  const [state, setState] = useState<GuideState | null>(null);
  const [skipped, setSkipped] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    // Decide exactly once, the first time all three counts and the org id have
    // resolved. The org facts are captured here and never re-read, so the walk
    // is stable as records are created underneath it. The org id gates it too —
    // reading the wrong org's skip flag would carry a dismissal across tenants.
    if (decided.current || !ready || !orgId) return;
    decided.current = true;
    if (readDismissed(orgId)) return;
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
  }, [ready, orgId, orders.total, clients.total, products.total]);

  const skip = useCallback(() => {
    setSkipped(true);
    if (!orgId) return;
    try {
      window.localStorage.setItem(dismissKey(orgId), '1');
    } catch {
      /* private mode / storage disabled — the guide just reappears next open */
    }
  }, [orgId]);

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
