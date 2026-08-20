'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useOrder, useOrderMutations } from '@/hooks/orders/useOrders';
import { useNotes } from '@/hooks/notes/useNotes';
import { useDocuments, type DocumentType } from '@/hooks/documents/useDocuments';
import { discountAmount, type DraftDiscount, type DraftItem } from '@/lib/orders/draft';
import type { CustomDataValue } from '@/lib/fields/visibility';

/**
 * Everything the order hub reads and writes.
 *
 * The difference from `useOrderDraft` is the whole point of B4: nothing here is
 * held locally and saved at the end. Each action is a write, and the figures
 * come back from the DB — `recompute_order_totals()` owns the arithmetic, so
 * the screen never adds anything up that the server also adds up.
 */
export function useOrderHub(orderId: string) {
  const { toast } = useToast();
  const { order, payments, isLoading, error, mutate } = useOrder(orderId);
  const { updateOrder, addPayment, addItem, updateItem, removeItem } = useOrderMutations();
  const { notes, addNote, mutate: mutateNotes } = useNotes('order', orderId);
  const { documents, issueDocument, mutate: mutateDocuments } = useDocuments('order', orderId);

  const [busy, setBusy] = useState(false);
  // A synchronous re-entrancy latch. `busy` (React state) only latches after a
  // re-render, so two events in the same tick — a double-tap, a stalled main
  // thread — both read the old `false` and both fire the write. On the money
  // paths (payment, issue-document) that means a duplicate charge or a second
  // immutable invoice. The ref flips before any await, so the second caller is
  // rejected outright, and it also serializes the hub's writes: while one is in
  // flight the rest are dropped rather than interleaved (out-of-order refetches
  // were how a stale status could win).
  const inFlight = useRef(false);

  /**
   * One wrapper for every write: the DB is the authority on what the order now
   * says, so each action refetches rather than patching a local copy, and a
   * failure surfaces the DB's own message (P0001 validation text is written to
   * be read by the user).
   */
  const run = useCallback(
    async (action: () => Promise<unknown>, failure: string) => {
      if (inFlight.current) return false;
      inFlight.current = true;
      setBusy(true);
      try {
        await action();
        await mutate();
        return true;
      } catch (error) {
        toast({
          title: failure,
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });
        return false;
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [mutate, toast],
  );

  /** The order's lines in the shape every item component already speaks. */
  const items = useMemo<DraftItem[]>(
    () =>
      (order?.order_items ?? []).map(row => ({
        key: row.id,
        product_id: row.product_id,
        ...(row.product_name_raw ? { product_name_raw: row.product_name_raw } : {}),
        // The catalogue name when the line points at a product, the typed name
        // when it's a one-off. The last fallback covers a line whose product
        // was archived and no longer embeds — rare, but "Item" beats a blank.
        name: row.products?.name ?? row.product_name_raw ?? 'Item',
        quantity: Number(row.quantity),
        unit_price: Number(row.unit_price),
        discount: Number(row.discount) || undefined,
        custom_data: (row.custom_data ?? {}) as CustomDataValue,
      })),
    [order],
  );

  const discount: DraftDiscount = {
    type: (order?.discount_type as DraftDiscount['type']) ?? null,
    value: Number(order?.discount_value ?? 0),
  };

  // The subtotal is what the lines come to; `orders.total_amount` is already
  // net of the discount, so deriving the subtotal back out of it would be
  // arithmetic on arithmetic. Sum the rows the DB gave us instead.
  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.quantity * item.unit_price - (item.discount ?? 0)),
    0,
  );

  return {
    order,
    items,
    payments,
    notes,
    documents,
    discount,
    subtotal,
    discountAmount: discountAmount(subtotal, discount),
    total: Number(order?.total_amount ?? 0),
    paid: Number(order?.amount_paid ?? 0),
    balance: Number(order?.balance ?? 0),
    isLoading,
    error,
    /** Re-run the order fetch — used by the screen's error-state retry. */
    refresh: mutate,
    busy,

    setStatus: (status: string) =>
      run(() => updateOrder(orderId, { status }), 'Could not move the order'),

    setDiscount: (next: DraftDiscount) =>
      run(
        () =>
          updateOrder(orderId, {
            // null clears it; omitting the key would leave the old one in place.
            discount_type: next.type,
            discount_value: next.value,
          }),
        'Could not apply the discount',
      ),

    setCustomData: (custom_data: CustomDataValue) =>
      run(() => updateOrder(orderId, { custom_data }), 'Could not save that change'),

    addItem: (item: Omit<DraftItem, 'key'>) =>
      run(
        () =>
          addItem(orderId, {
            product_id: item.product_id,
            ...(item.product_name_raw ? { product_name_raw: item.product_name_raw } : {}),
            quantity: item.quantity,
            unit_price: item.unit_price,
            ...(item.discount ? { discount: item.discount } : {}),
            ...(item.custom_data ? { custom_data: item.custom_data } : {}),
          }),
        'Could not add the item',
      ),

    updateItem: (itemId: string, item: Omit<DraftItem, 'key'>) =>
      run(
        () =>
          updateItem(orderId, itemId, {
            quantity: item.quantity,
            unit_price: item.unit_price,
            ...(item.custom_data ? { custom_data: item.custom_data } : {}),
          }),
        'Could not save the item',
      ),

    removeItem: (itemId: string) =>
      run(() => removeItem(orderId, itemId), 'Could not remove the item'),

    addPayment: (input: Parameters<typeof addPayment>[1]) =>
      run(() => addPayment(orderId, input), 'Could not record the payment'),

    addNote: (content: string, custom_data?: CustomDataValue) =>
      run(async () => {
        await addNote(content, custom_data);
        await mutateNotes();
      }, 'Could not save the note'),

    issue: (input: { document_type: DocumentType; terms_days?: number }) =>
      run(async () => {
        await issueDocument(input);
        await mutateDocuments();
      }, 'Could not issue the document'),
  };
}
