import { describe, expect, it } from 'vitest';
import { presentNotification, notificationOrderId } from './present';
import type { InboxNotification } from '@/hooks/notifications/useNotifications';

function make(partial: Partial<InboxNotification>): InboxNotification {
  return {
    id: 'n-1',
    actor_user_id: null,
    verb: 'order.created',
    category: 'order_activity',
    object_type: 'order',
    object_id: 'ord-1',
    target_type: null,
    target_id: null,
    data: null,
    group_key: null,
    priority: 'normal',
    created_at: '2026-08-15T10:00:00Z',
    state: 'unread',
    read_at: null,
    archived_at: null,
    ...partial,
  };
}

describe('presentNotification', () => {
  it('renders a new order from client + number, not a stored string', () => {
    const n = presentNotification(make({
      verb: 'order.created',
      data: { client_name: 'Kampala Press', order_number: 'ORD-1042' },
    }));
    expect(n.title).toBe('New order');
    expect(n.message).toBe('Kampala Press · ORD-1042');
    expect(n.type).toBe('assignment');
    expect(n.target).toMatchObject({ id: 'ord-1', title: 'ORD-1042' });
  });

  it('renders a status change as from→to', () => {
    const n = presentNotification(make({
      verb: 'order.status_changed',
      data: { order_number: 'ORD-1042', from_status: 'pending', to_status: 'ready' },
    }));
    expect(n.message).toBe('ORD-1042 → ready');
    expect(n.type).toBe('status_change');
  });

  it('renders a payment with its amount and links to the order it settles', () => {
    const n = presentNotification(make({
      verb: 'payment.recorded',
      object_type: 'payment',
      object_id: 'pay-1',
      target_type: 'order',
      target_id: 'ord-1',
      data: { amount: 20000, order_number: 'ORD-1042' },
    }));
    expect(n.title).toBe('Payment recorded');
    expect(n.message).toContain('20,000');
    expect(n.message).toContain('ORD-1042');
    expect(n.type).toBe('payment');
    // Links to the ORDER (target), not the payment row (object).
    expect(notificationOrderId(n)).toBe('ord-1');
  });

  it('speaks in the second person for a membership event and has no order link', () => {
    const n = presentNotification(make({
      verb: 'member.added',
      object_type: 'organization',
      object_id: 'org-1',
    }));
    expect(n.message).toBe('You were added to the organization');
    expect(n.type).toBe('invitation');
    expect(notificationOrderId(n)).toBeNull();
  });

  it('links an order notification to its own order', () => {
    const n = presentNotification(make({ verb: 'order.created', object_type: 'order', object_id: 'ord-9' }));
    expect(notificationOrderId(n)).toBe('ord-9');
  });

  it('carries per-user state through as status', () => {
    expect(presentNotification(make({ state: 'read' })).status).toBe('read');
    expect(presentNotification(make({ state: 'archived' })).status).toBe('archived');
  });

  it('falls back gracefully when data is missing', () => {
    const n = presentNotification(make({ verb: 'order.created', data: null }));
    expect(n.title).toBe('New order');
    expect(n.message).toBe('A new order was created');
  });
});
