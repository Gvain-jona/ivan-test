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
type SheetState =
  | { type: 'create-client'; name?: string; onCreated?: (client: Client) => void }
  | { type: 'create-product' }
  | null;

interface SheetHostApi {
  /** Navigates to B2 (`/dashboard/orders/new`); not a sheet. */
  openCreateOrder: () => void;
  /** Navigates to B4 (`/dashboard/orders/[id]`); not a sheet. */
  openOrder: (id: string) => void;
  /**
   * Opens the create-client sheet. The optional `name` prefills it (the order
   * picker hands over the text already typed), and `onCreated` fires with the
   * saved client so the caller can select it in place — the create-and-return
   * flow. Both are omitted by the standalone "New client" entries, which just
   * need a blank sheet.
   */
  openCreateClient: (name?: string, onCreated?: (client: Client) => void) => void;
  openCreateProduct: () => void;
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
    openCreateClient: (name, onCreated) =>
      open({ type: 'create-client', name, onCreated }),
    openCreateProduct: () => open({ type: 'create-product' }),
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
          initialName={sheet.name}
          // ClientFormSheet.handleSubmit calls onOpenChange(false) → close()
          // immediately before onSaved, so closing again here would fire a
          // second history.back() in the same tick and pop *past* the screen
          // underneath — which for the order flow would unmount the very screen
          // the created client is meant to land on. Only relay the client.
          onSaved={(client) => sheet.onCreated?.(client)}
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
    </SheetHostContext.Provider>
  );
}
