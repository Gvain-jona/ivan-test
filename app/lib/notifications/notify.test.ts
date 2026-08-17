import { describe, expect, it } from 'vitest'
import { notify } from './notify'
import { createFakeTenant } from '@/test/helpers/fake-tenant'

describe('notify()', () => {
  it('records one org-audience fact, org injection left to the accessor', async () => {
    const { tenant, db } = createFakeTenant({ userId: 'actor-1' })

    const { error } = await notify(tenant.db, {
      verb: 'order.created',
      category: 'order_activity',
      actorUserId: 'actor-1',
      object: { type: 'order', id: 'ord-1' },
      data: { order_number: 'ORD-1042', client_name: 'Kampala Press' },
      groupKey: 'order:ord-1',
      audience: { scope: 'org' },
    })

    expect(error).toBeNull()
    const [call] = db.callsFor('insert:notifications')
    // The scoped accessor owns organization_id — notify() must not send one
    // (the fake throws if it does; assert intent explicitly too).
    expect(call.values).not.toHaveProperty('organization_id')
    expect(call.values).toMatchObject({
      actor_user_id: 'actor-1',
      verb: 'order.created',
      category: 'order_activity',
      object_type: 'order',
      object_id: 'ord-1',
      audience_scope: 'org',
      recipient_user_ids: [],
      priority: 'normal',
      group_key: 'order:ord-1',
    })
  })

  it('records a directed fact with named recipients', async () => {
    const { tenant, db } = createFakeTenant()

    await notify(tenant.db, {
      verb: 'member.added',
      category: 'team',
      actorUserId: null,
      object: { type: 'membership', id: 'mem-9' },
      audience: { scope: 'users', userIds: ['new-user-1'] },
    })

    const [call] = db.callsFor('insert:notifications')
    expect(call.values).toMatchObject({
      actor_user_id: null,
      audience_scope: 'users',
      recipient_user_ids: ['new-user-1'],
    })
  })

  it('returns the error instead of throwing, so a failed notify never fails the primary write', async () => {
    const { tenant, db } = createFakeTenant()
    db.queue('insert:notifications', { error: { message: 'boom' } })

    const { error } = await notify(tenant.db, {
      verb: 'payment.recorded',
      category: 'payments',
      actorUserId: 'actor-1',
      object: { type: 'payment', id: 'pay-1' },
      target: { type: 'order', id: 'ord-1' },
      audience: { scope: 'org' },
    })

    expect(error).toEqual({ message: 'boom' })
  })
})
