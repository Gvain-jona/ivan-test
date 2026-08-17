import type { Notification, NotificationType } from '@/types/notifications';
import type { InboxNotification } from '@/hooks/notifications/useNotifications';

/**
 * Renders a structured activity (verb + data) into display copy at read time
 * — the LABEL dimension (docs/v2-migration/NOTIFICATIONS_REBUILD.md §6/§12.3).
 * Nothing is a frozen string on the row; the sentence is produced here, so copy
 * can change (or later, translate) without touching stored data.
 *
 * The bell is the directed projection, so this speaks in the second person
 * where it fits. It maps onto the existing `Notification` shape the drawer/menu
 * components already consume.
 */

interface RenderData {
  order_number?: string;
  client_name?: string;
  amount?: number;
  from_status?: string;
  to_status?: string;
}

function verbToType(verb: string): NotificationType {
  switch (verb) {
    case 'order.status_changed':
      return 'status_change';
    case 'payment.recorded':
      return 'payment';
    case 'member.added':
      return 'invitation';
    case 'order.created':
      return 'assignment';
    default:
      return 'comment';
  }
}

function describe(verb: string, d: RenderData): { title: string; message: string } {
  const join = (...parts: (string | number | null | undefined)[]) =>
    parts.filter(p => p !== null && p !== undefined && p !== '').join(' · ');

  switch (verb) {
    case 'order.created':
      return { title: 'New order', message: join(d.client_name, d.order_number) || 'A new order was created' };
    case 'order.status_changed':
      return {
        title: 'Order status changed',
        message: `${d.order_number ?? 'Order'}${d.to_status ? ` → ${d.to_status}` : ''}`,
      };
    case 'payment.recorded':
      return {
        title: 'Payment recorded',
        message: join(typeof d.amount === 'number' ? d.amount.toLocaleString() : null, d.order_number)
          || 'A payment was recorded',
      };
    case 'member.added':
      return { title: 'Welcome to the team', message: 'You were added to the organization' };
    default:
      return { title: verb, message: '' };
  }
}

/**
 * The order a notification links to, if any — the click-through target.
 * A payment notification links to the *order it settles* (its `target`), not
 * the payment row; an order notification links to the order itself (its
 * `object`). Everything else (e.g. membership) has no order to open.
 */
function navigableOrderId(n: InboxNotification): string | null {
  if (n.target_type === 'order' && n.target_id) return n.target_id;
  if (n.object_type === 'order') return n.object_id;
  return null;
}

export function presentNotification(n: InboxNotification): Notification {
  const d = (n.data ?? {}) as RenderData;
  const { title, message } = describe(n.verb, d);
  const orderId = navigableOrderId(n);

  return {
    id: n.id,
    type: verbToType(n.verb),
    title,
    message,
    timestamp: n.created_at,
    created_at: n.created_at,
    status: n.state,
    sender: { id: n.actor_user_id ?? 'system', name: 'System' },
    // The reliable click-through target: the order to open (empty when there
    // is none, e.g. a membership event). title is what names it to a human.
    target: { id: orderId ?? '', type: 'order', title: d.order_number ?? '' },
  };
}

/**
 * The order id a presented notification should route to on click, or null if
 * it isn't order-linked. Read from the target the presenter resolved above, so
 * routing and display stay in agreement.
 */
export function notificationOrderId(n: Notification): string | null {
  return n.target?.type === 'order' && n.target.id ? n.target.id : null;
}
