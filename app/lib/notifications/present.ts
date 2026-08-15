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

export function presentNotification(n: InboxNotification): Notification {
  const d = (n.data ?? {}) as RenderData;
  const { title, message } = describe(n.verb, d);

  return {
    id: n.id,
    type: verbToType(n.verb),
    title,
    message,
    timestamp: n.created_at,
    created_at: n.created_at,
    status: n.state,
    sender: { id: n.actor_user_id ?? 'system', name: 'System' },
    // object_type/object_id is the reliable click-through target; title is
    // whatever names the object to a human.
    target: { id: n.object_id, type: 'order', title: d.order_number ?? '' },
  };
}
