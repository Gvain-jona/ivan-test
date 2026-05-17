import { SupabaseClient } from '@supabase/supabase-js';
import { getPaymentStatus } from './calculations';

/**
 * Recalculates and persists total_amount, amount_paid, and payment_status
 * for an order by summing its current items and payments.
 *
 * Call this after any mutation to order_items or order_payments so the
 * orders row stays consistent with its children.
 */
export async function updateOrderTotals(
  supabase: SupabaseClient,
  orderId: string,
): Promise<void> {
  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase.from('order_items').select('total_amount').eq('order_id', orderId),
      supabase.from('order_payments').select('amount').eq('order_id', orderId),
    ]);

  if (itemsError || paymentsError) {
    console.error('updateOrderTotals: failed to fetch children', { itemsError, paymentsError });
    return;
  }

  const totalAmount = (items ?? []).reduce(
    (sum, i) => sum + (parseFloat(String(i.total_amount)) || 0),
    0,
  );
  const amountPaid = (payments ?? []).reduce(
    (sum, p) => sum + (parseFloat(String(p.amount)) || 0),
    0,
  );
  const paymentStatus = getPaymentStatus(totalAmount, amountPaid);

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      total_amount: totalAmount,
      amount_paid: amountPaid,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('updateOrderTotals: failed to persist totals', updateError);
  }
}
