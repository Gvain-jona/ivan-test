import { describe, expect, it, vi } from 'vitest'
import { createTenantDb } from './tenant-db'

/**
 * Unit tests for the real scoping wrapper, against a stub supabase
 * client that records calls. These prove the runtime behavior the
 * TenantDb types promise: org filter applied, org id injected, and
 * the injected value winning over anything a caller smuggles in.
 */

function stubClient() {
  const calls: Record<string, unknown[]> = { from: [], select: [], insert: [], update: [], eq: [], rpc: [] }
  const chain = {
    select: vi.fn((...args: unknown[]) => { calls.select.push(args); return chain }),
    insert: vi.fn((...args: unknown[]) => { calls.insert.push(args); return chain }),
    update: vi.fn((...args: unknown[]) => { calls.update.push(args); return chain }),
    eq: vi.fn((...args: unknown[]) => { calls.eq.push(args); return chain }),
  }
  const client = {
    from: vi.fn((table: string) => { calls.from.push([table]); return chain }),
    rpc: vi.fn((...args: unknown[]) => { calls.rpc.push(args); return { data: null, error: null } }),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, chain, calls }
}

describe('createTenantDb', () => {
  it('scopes selects to the organization', () => {
    const { client, calls } = stubClient()
    const db = createTenantDb(client, 'org-1')

    db.from('orders').select('id, status', { count: 'exact' })

    expect(calls.from).toEqual([['orders']])
    expect(calls.select).toEqual([['id, status', { count: 'exact' }]])
    expect(calls.eq).toEqual([['organization_id', 'org-1']])
  })

  it('scopes updates to the organization', () => {
    const { client, calls } = stubClient()
    const db = createTenantDb(client, 'org-1')

    db.from('clients').update({ status: 'archived' })

    expect(calls.update).toEqual([[{ status: 'archived' }]])
    expect(calls.eq).toEqual([['organization_id', 'org-1']])
  })

  it('scopes organization settings updates to the org id', () => {
    const { client, calls } = stubClient()
    const db = createTenantDb(client, 'org-1')

    db.organization().update({ settings: { currency: 'USD' } })

    expect(calls.from).toEqual([['organizations']])
    expect(calls.update).toEqual([[{ settings: { currency: 'USD' } }]])
    expect(calls.eq).toEqual([['id', 'org-1']])
  })

  it('injects organization_id into inserts', () => {
    const { client, calls } = stubClient()
    const db = createTenantDb(client, 'org-1')

    db.from('notes').insert({ entity_type: 'order', entity_id: 'x', content: 'hi' })

    expect(calls.insert).toEqual([
      [{ entity_type: 'order', entity_id: 'x', content: 'hi', organization_id: 'org-1' }],
    ])
  })

  it('overrides a smuggled organization_id (injected value is spread last)', () => {
    const { client, calls } = stubClient()
    const db = createTenantDb(client, 'org-1')

    // The Insert type forbids this; simulate a JS caller bypassing it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db.from('notes').insert({ content: 'hi', organization_id: 'attacker-org' } as any)

    const [inserted] = calls.insert[0] as [Record<string, unknown>]
    expect(inserted.organization_id).toBe('org-1')
  })

  it('scopes the organizations row by id', () => {
    const { client, calls } = stubClient()
    const db = createTenantDb(client, 'org-1')

    db.organization().select('id, name, settings')

    expect(calls.from).toEqual([['organizations']])
    expect(calls.eq).toEqual([['id', 'org-1']])
  })

  it('passes rpc through untouched', () => {
    const { client, calls } = stubClient()
    const db = createTenantDb(client, 'org-1')

    db.rpc('next_number', { p_counter_key: 'document:invoice', p_org: 'org-1' })

    expect(calls.rpc).toEqual([['next_number', { p_counter_key: 'document:invoice', p_org: 'org-1' }]])
  })
})
