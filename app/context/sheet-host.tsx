'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import OrderFormSheet from '@/components/orders/OrderFormSheet';
import OrderViewSheet from '@/components/orders/OrderViewSheet';
import ClientFormSheet from '@/components/clients/ClientFormSheet';
import ProductFormSheet from '@/components/products/ProductFormSheet';
import { useOrderMutations } from '@/hooks/orders/useOrders';
import type { OrderSummary, OrderCreateInput } from '@/hooks/orders/useOrders';
import { useToast } from '@/components/ui/use-toast';

/**
 * The single door for opening overlays (see DESIGN_PHILOSOPHY.md → "Overlays &
 * sheets" and INTERACTION_AUDIT.md → DECISION). Any surface — Home, the tab
 * bar, list rows — opens a sheet *in place* by calling this API; nothing
 * navigates to another page to pop a modal, and no surface re-implements
 * open/close state. One place owns it, so it can't diverge.
 */
type SheetState =
  | { type: 'create-order' }
  | { type: 'view-order'; order: OrderSummary }
  | { type: 'create-client' }
  | { type: 'create-product' }
  | null;

interface SheetHostApi {
  openCreateOrder: () => void;
  /** Open the order view sheet; the sheet hydrates full detail from the id. */
  openOrder: (id: string) => void;
  openCreateClient: () => void;
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
  const { toast } = useToast();
  const { createOrder } = useOrderMutations();

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
    openCreateOrder: () => open({ type: 'create-order' }),
    openOrder: (id) => open({ type: 'view-order', order: { id } as OrderSummary }),
    openCreateClient: () => open({ type: 'create-client' }),
    openCreateProduct: () => open({ type: 'create-product' }),
    close,
  };

  const handleSaveOrder = useCallback(
    async (input: OrderCreateInput): Promise<{ success: boolean; error?: unknown }> => {
      try {
        await createOrder(input);
        toast({ title: 'Order created', description: 'New order has been created' });
        close();
        return { success: true };
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save order',
          variant: 'destructive',
        });
        return { success: false, error };
      }
    },
    [createOrder, toast, close],
  );

  return (
    <SheetHostContext.Provider value={api}>
      {children}

      {/* Conditionally mounted so their internal data hooks don't run (and
          fetch) on every dashboard page — and so each "create" opens a fresh
          form. `open` is always true while mounted; closing unmounts. */}
      {sheet?.type === 'create-order' && (
        <OrderFormSheet
          open
          onOpenChange={(o) => !o && close()}
          onSave={handleSaveOrder}
          title="Create New Order"
        />
      )}

      {sheet?.type === 'view-order' && (
        <OrderViewSheet
          open
          onOpenChange={(o) => !o && close()}
          order={sheet.order}
          onClose={close}
          userRole="admin"
        />
      )}

      {sheet?.type === 'create-client' && (
        <ClientFormSheet
          open
          onOpenChange={(o) => !o && close()}
          client={null}
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
    </SheetHostContext.Provider>
  );
}
