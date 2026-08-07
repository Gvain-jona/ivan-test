import { describe, expect, it } from 'vitest'
import { segmentOrders, semanticIndex } from './segment-orders'
import { ORDER_STATUS_WORKFLOW } from '@/lib/organization/presets'

const semantics = semanticIndex(ORDER_STATUS_WORKFLOW)

const order = (id: string, status: string, payment_status: string | null = 'unpaid') => ({
  id,
  status,
  payment_status,
})

describe('semanticIndex', () => {
  it('maps every shipped workflow status to a semantic', () => {
    expect(semantics.get('quotation')).toBe('open')
    expect(semantics.get('printing')).toBe('open')
    expect(semantics.get('delivered')).toBe('won')
    expect(semantics.get('cancelled')).toBe('lost')
    expect(semantics.size).toBe(ORDER_STATUS_WORKFLOW.length)
  })

  it('skips options that carry no semantic', () => {
    expect(semanticIndex([{ value: 'draft', label: 'Draft' }]).size).toBe(0)
  })
})

describe('segmentOrders', () => {
  /**
   * The regression this module exists for: the previous implementation matched
   * literal 'pending' / 'in_progress' / 'paused' / 'completed', so on the
   * shipped print-shop workflow every order between quotation and delivered
   * fell into a catch-all "Other".
   */
  it('puts the whole production workflow In progress, not Other', () => {
    const groups = segmentOrders(
      [
        order('a', 'quotation'),
        order('b', 'design'),
        order('c', 'printing'),
        order('d', 'finishing'),
        order('e', 'ready'),
      ],
      semantics,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('In progress')
    expect(groups[0].items).toHaveLength(5)
  })

  it('splits won orders by whether the money arrived', () => {
    const groups = segmentOrders(
      [order('a', 'delivered', 'paid'), order('b', 'delivered', 'partial')],
      semantics,
    )

    expect(groups.map(g => g.label)).toEqual(['Awaiting payment', 'Completed'])
    expect(groups[0].items[0].id).toBe('b')
    expect(groups[1].items[0].id).toBe('a')
  })

  it('keeps segment order and drops empty groups', () => {
    const groups = segmentOrders(
      [order('a', 'cancelled'), order('b', 'printing')],
      semantics,
    )
    expect(groups.map(g => g.key)).toEqual(['in_progress', 'cancelled'])
  })

  // A status removed from the workflow leaves orders still sitting in it.
  // They belong on screen, not silently dropped.
  it('collects statuses with no semantic into Other, last', () => {
    const groups = segmentOrders(
      [order('a', 'printing'), order('b', 'a_retired_stage')],
      semantics,
    )
    expect(groups.map(g => g.label)).toEqual(['In progress', 'Other'])
    expect(groups[1].items[0].id).toBe('b')
  })

  it('returns nothing for no orders', () => {
    expect(segmentOrders([], semantics)).toEqual([])
  })

  // Before the workflow loads there is no map, so nothing can be classified.
  // The caller renders a flat list in that case rather than a page of "Other".
  it('puts everything in Other when the workflow is unknown', () => {
    const groups = segmentOrders([order('a', 'printing')], new Map())
    expect(groups.map(g => g.key)).toEqual(['other'])
  })
})
