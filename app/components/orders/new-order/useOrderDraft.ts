'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useOrderMutations } from '@/hooks/orders/useOrders';
import { useOrderStatuses } from '@/hooks/orders/useOrderStatuses';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import { todayISO } from '@/lib/orders/dates';
import { draftTotals } from '@/lib/orders/draft';
import type { DraftDiscount, DraftItem, DraftNote, DraftPayment } from '@/lib/orders/draft';
import type { CustomDataValue } from '@/lib/fields/visibility';

let sequence = 0;
/** Client-side row identity, so removing the second of two identical lines works. */
const nextKey = () => `d${(sequence += 1)}`;

/**
 * Everything B2 holds while an order is being composed, and what happens when
 * it is saved. Split from the screen so the screen is layout — the state, the
 * derived money and the two-step save are the part worth reading on their own.
 */
export function useOrderDraft() {
  const router = useRouter();
  const { toast } = useToast();
  const { createOrder } = useOrderMutations();
  const { defaultStatus } = useOrderStatuses();

  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [orderDate, setOrderDate] = useState(todayISO);
  const [customData, setCustomData] = useState<CustomDataValue>({});
  const [items, setItems] = useState<DraftItem[]>([]);
  const [payments, setPayments] = useState<DraftPayment[]>([]);
  const [notes, setNotes] = useState<DraftNote[]>([]);
  const [discount, setDiscount] = useState<DraftDiscount>({ type: null, value: 0 });
  const [saving, setSaving] = useState(false);
  // Synchronous double-submit latch. `saving`/`canSave` only disable the button
  // after the re-render commits, so two taps in one tick both reach `save()` and
  // post two orders — each with the inline payments duplicated. The ref flips
  // before the first await, so the second call returns immediately.
  const savingRef = useRef(false);

  // The workflow loads async and the person may have already chosen, so a
  // chosen value wins and the org's default only fills the gap. Deliberately
  // not an effect writing into state — that races with the first tap.
  const effectiveStatus = status || defaultStatus;

  const totals = useMemo(
    () => draftTotals({ items, discount, payments }),
    [items, discount, payments],
  );

  const canSave = clientId !== null && items.length > 0 && !saving;

  const save = async () => {
    if (!clientId || items.length === 0) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    try {
      const order = await createOrder({
        client_id: clientId,
        order_date: orderDate,
        ...(effectiveStatus ? { status: effectiveStatus } : {}),
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
        ...(discount.type ? { discount_type: discount.type, discount_value: discount.value } : {}),
        items: items.map(item => ({
          product_id: item.product_id,
          ...(item.product_name_raw ? { product_name_raw: item.product_name_raw } : {}),
          quantity: item.quantity,
          unit_price: item.unit_price,
          ...(item.discount ? { discount: item.discount } : {}),
          ...(item.custom_data ? { custom_data: item.custom_data } : {}),
        })),
        ...(payments.length > 0
          ? {
              payments: payments.map(payment => ({
                amount: payment.amount,
                payment_method: payment.payment_method,
                payment_date: payment.payment_date,
                ...(payment.reference ? { reference: payment.reference } : {}),
                ...(payment.notes ? { notes: payment.notes } : {}),
              })),
            }
          : {}),
      });

      // Notes aren't part of the create_order payload — they're rows against an
      // entity that has to exist first. So this is a second, non-atomic step,
      // and a failure here must not read as "the order didn't save": it did,
      // and the person is told exactly what didn't.
      const failed = await attachNotes(order.id, notes);

      if (failed > 0) {
        toast({
          title: 'Order created, notes not saved',
          description: `${failed} note${failed === 1 ? '' : 's'} could not be attached. Add ${
            failed === 1 ? 'it' : 'them'
          } again from the order.`,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Order created', description: order.order_number ?? undefined });
      }

      // Straight to the hub (B4). `replace`, not `push`: Back from a newly
      // created order should reach the list, not a create screen whose draft
      // has already been saved.
      router.replace(`/dashboard/orders/${order.id}`);
    } catch (error) {
      // Success navigates away (unmount), so the latch is only released on the
      // error path, where the person stays on the screen to retry.
      savingRef.current = false;
      setSaving(false);
      toast({
        title: 'Could not create the order',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return {
    client: { id: clientId, name: clientName },
    setClient: (next: { id: string; name: string } | null) => {
      setClientId(next?.id ?? null);
      setClientName(next?.name ?? null);
    },
    status: effectiveStatus,
    setStatus,
    orderDate,
    setOrderDate,
    customData,
    setCustomData,
    items,
    addItem: (item: Omit<DraftItem, 'key'>) =>
      setItems(rows => [...rows, { ...item, key: nextKey() }]),
    removeItem: (key: string) => setItems(rows => rows.filter(row => row.key !== key)),
    payments,
    addPayment: (payment: Omit<DraftPayment, 'key'>) =>
      setPayments(rows => [...rows, { ...payment, key: nextKey() }]),
    removePayment: (key: string) => setPayments(rows => rows.filter(row => row.key !== key)),
    notes,
    addNote: (note: Omit<DraftNote, 'key'>) =>
      setNotes(rows => [...rows, { ...note, key: nextKey() }]),
    removeNote: (key: string) => setNotes(rows => rows.filter(row => row.key !== key)),
    discount,
    setDiscount,
    totals,
    canSave,
    saving,
    save,
  };
}

/** Posts the draft notes against a saved order; returns how many failed. */
async function attachNotes(orderId: string, notes: DraftNote[]): Promise<number> {
  let failed = 0;
  for (const note of notes) {
    try {
      await apiRequest(PLATFORM_API.NOTES, 'POST', {
        entity_type: 'order',
        entity_id: orderId,
        content: note.content,
        ...(note.custom_data ? { custom_data: note.custom_data } : {}),
      });
    } catch {
      failed += 1;
    }
  }
  return failed;
}
