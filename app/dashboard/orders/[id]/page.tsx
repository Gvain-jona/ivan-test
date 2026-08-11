import OrderHubScreen from '@/components/orders/order-hub/OrderHubScreen';

export const metadata = { title: 'Order' };

/**
 * B4 — the order hub. A route rather than a sheet, per the carve-out in
 * CLAUDE.md: it is the order's own surface, opens five sheets of its own, and
 * is what a shared link to an order should land on.
 */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderHubScreen id={id} />;
}
