'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import ClientFormSheet from '@/components/clients/ClientFormSheet';
import ProductFormSheet from '@/components/products/ProductFormSheet';
import type { Client } from '@/hooks/clients/useClients';
import type { Product } from '@/hooks/products/useProducts';

/**
 * The single door for opening overlays (see DESIGN_PHILOSOPHY.md → "Overlays &
 * sheets" and INTERACTION_AUDIT.md → DECISION). Any surface — Home, the tab
 * bar, list rows — opens a sheet *in place* by calling this API; no surface
 * re-implements open/close state. One place owns it, so it can't diverge.
 *
 * `openCreateOrder` and `openOrder` are the two intents that resolve to
 * **routes** rather than sheets, per the screen-vs-sheet carve-out in
 * CLAUDE.md: composing an order is B2 and an order itself is B4, each a
 * multi-section screen opening sheets of its own. They stay on this API rather
 * than becoming `<Link>`s at their call sites — the intent is still "start a
 * new order" / "open this order", and keeping them here meant the callers
 * never had to know the destination changed.
 */
/** Optional prefill + select-back for an inline "New client". */
type CreateClientOptions = { name?: string; onSaved?: (client: Client) => void };

type SheetState =
  | { type: 'create-client'; options?: CreateClientOptions }
  | { type: 'edit-client'; client: Client }
  | { type: 'create-product' }
  | { type: 'edit-product'; product: Product }
  | null;

interface SheetHostApi {
  /** Navigates to B2 (`/dashboard/orders/new`); not a sheet. */
  openCreateOrder: () => void;
  /** Navigates to B4 (`/dashboard/orders/[id]`); not a sheet. */
  openOrder: (id: string) => void;
  /**
   * Opens the client create form. `options.name` prefills it (the typed query
   * from an inline "New client") and `options.onSaved` receives the created
   * client — so the order form can select the walk-in it just created.
   */
  openCreateClient: (options?: CreateClientOptions) => void;
  /** Opens the client form in edit mode; the record's edits revalidate its keys. */
  openEditClient: (client: Client) => void;
  openCreateProduct: () => void;
  /** Opens the product form in edit mode. */
  openEditProduct: (product: Product) => void;
  close: () => void;
}

const SheetHostContext = createContext<SheetHostApi | undefined>(undefined);

export function useSheets(): SheetHostApi {
  const ctx = useContext(SheetHostContext);
  if (!ctx) throw new Error('useSheets must be used within a SheetHostProvider');
  return ctx;
}

export function SheetHostProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>(null);
  const router = useRouter();

  // History integration (INT-12): opening a sheet pushes a history entry, so
  // the hardware/browser Back button dismisses the sheet instead of leaving
  // the screen. Closing and Back both funnel through one path — history.back()
  // → popstate → setSheet(null) — so the two can never drift out of sync.
  const open = useCallback((next: NonNullable<SheetState>) => {
    setSheet(next);
    window.history.pushState({ __sheet: true }, '');
  }, []);

  const close = useCallback(() => {
    if (window.history.state?.__sheet) {
      window.history.back(); // fires popstate → clears the sheet
    } else {
      setSheet(null);
    }
  }, []);

  useEffect(() => {
    const onPop = () => setSheet(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const api: SheetHostApi = {
    openCreateOrder: () => router.push('/dashboard/orders/new'),
    openOrder: (id) => router.push(`/dashboard/orders/${id}`),
    openCreateClient: (options) => open({ type: 'create-client', options }),
    openEditClient: (client) => open({ type: 'edit-client', client }),
    openCreateProduct: () => open({ type: 'create-product' }),
    openEditProduct: (product) => open({ type: 'edit-product', product }),
    close,
  };

  return (
    <SheetHostContext.Provider value={api}>
      {children}

      {/* Conditionally mounted so their internal data hooks don't run (and
          fetch) on every dashboard page — and so each "create" opens a fresh
          form. `open` is always true while mounted; closing unmounts. */}
      {sheet?.type === 'create-client' && (
        <ClientFormSheet
          open
          onOpenChange={(o) => !o && close()}
          client={null}
          initialName={sheet.options?.name}
          // ClientFormSheet.handleSubmit calls onOpenChange(false) → close()
          // immediately before onSaved, so closing again here would fire a
          // second history.back() in the same tick and pop *past* the screen
          // underneath — which for the order flow would unmount the very screen
          // the created client is meant to land on. Only relay the client.
          onSaved={(client) => sheet.options?.onSaved?.(client)}
        />
      )}

      {sheet?.type === 'edit-client' && (
        <ClientFormSheet
          open
          onOpenChange={(o) => !o && close()}
          client={sheet.client}
          onSaved={close}
        />
      )}

      {sheet?.type === 'create-product' && (
        <ProductFormSheet
          open
          onOpenChange={(o) => !o && close()}
          product={null}
          onSaved={close}
        />
      )}

      {sheet?.type === 'edit-product' && (
        <ProductFormSheet
          open
          onOpenChange={(o) => !o && close()}
          product={sheet.product}
          onSaved={close}
        />
      )}
    </SheetHostContext.Provider>
  );
}
