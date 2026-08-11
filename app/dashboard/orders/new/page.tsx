import NewOrderScreen from '@/components/orders/new-order/NewOrderScreen';

export const metadata = { title: 'New order' };

/**
 * B2 — composing an order is a screen, not a sheet (see the carve-out in
 * CLAUDE.md). It runs seven sections deep and opens four sheets of its own,
 * which need something to stack on.
 */
export default function NewOrderPage() {
  return <NewOrderScreen />;
}
