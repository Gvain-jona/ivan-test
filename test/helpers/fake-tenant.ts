import type { TenantContext, TenantDb, OrgRole } from '@/lib/auth/tenant'

/**
 * Programmable in-memory stand-in for TenantDb, for route contract
 * tests. It mirrors the accessor's shape (from().select/insert/update,
 * organization().select, rpc) with chainable, awaitable builders, and
 * records every call so tests can assert on filters, payloads, and
 * call order.
 *
 * Program results per operation key before invoking the route:
 *
 *   db.queue('select:orders', { data: [row], count: 1 })
 *   db.queue('rpc:next_number', { data: 'INV-0001' })
 *
 * Keys are `${op}:${table}` ('select:orders', 'insert:payments',
 * 'update:clients'), 'select:organization' for organization(), and
 * `rpc:${fn}`. Queued results are consumed in FIFO order; when the
 * queue is empty the default is { data: null } for single/maybeSingle
 * and { data: [], count: 0 } otherwise.
 */

export interface QueuedResult {
  data?: unknown
  error?: { code?: string; message?: string; details?: string } | null
  count?: number | null
}

export interface RecordedCall {
  key: string
  /** insert/update payload, or rpc args. */
  values?: unknown
  /** columns string passed to select (also post-insert/update select). */
  columns?: string
  /** chained filters, e.g. ['eq', 'id', 'o-1'], ['in', 'status', ['pending']]. */
  filters: [string, ...unknown[]][]
  /** chained modifiers, e.g. ['order', 'created_at', {...}], ['range', 0, 49]. */
  modifiers: [string, ...unknown[]][]
  single?: 'single' | 'maybeSingle'
}

class FakeQuery implements PromiseLike<QueuedResult> {
  constructor(
    private readonly db: FakeTenantDb,
    readonly call: RecordedCall,
  ) {}

  select(columns?: string) {
    this.call.columns = columns
    return this
  }
  eq(column: string, value: unknown) {
    this.call.filters.push(['eq', column, value])
    return this
  }
  in(column: string, values: unknown[]) {
    this.call.filters.push(['in', column, values])
    return this
  }
  ilike(column: string, pattern: string) {
    this.call.filters.push(['ilike', column, pattern])
    return this
  }
  gte(column: string, value: unknown) {
    this.call.filters.push(['gte', column, value])
    return this
  }
  lte(column: string, value: unknown) {
    this.call.filters.push(['lte', column, value])
    return this
  }
  order(column: string, options?: unknown) {
    this.call.modifiers.push(['order', column, options])
    return this
  }
  range(from: number, to: number) {
    this.call.modifiers.push(['range', from, to])
    return this
  }
  limit(n: number) {
    this.call.modifiers.push(['limit', n])
    return this
  }
  single() {
    this.call.single = 'single'
    return this
  }
  maybeSingle() {
    this.call.single = 'maybeSingle'
    return this
  }

  then<R1 = QueuedResult, R2 = never>(
    onfulfilled?: ((value: QueuedResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    const queued = this.db.take(this.call.key)
    const result: QueuedResult = queued ?? {
      data: this.call.single ? null : [],
      error: null,
      count: 0,
    }
    return Promise.resolve({ error: null, ...result }).then(onfulfilled, onrejected)
  }
}

export class FakeTenantDb {
  readonly calls: RecordedCall[] = []
  private readonly queues = new Map<string, QueuedResult[]>()

  queue(key: string, result: QueuedResult) {
    const list = this.queues.get(key) ?? []
    list.push(result)
    this.queues.set(key, list)
    return this
  }

  /** @internal */
  take(key: string): QueuedResult | undefined {
    return this.queues.get(key)?.shift()
  }

  /** Calls matching one key, in order. */
  callsFor(key: string) {
    return this.calls.filter(c => c.key === key)
  }

  private open(key: string, values?: unknown): FakeQuery {
    const call: RecordedCall = { key, values, filters: [], modifiers: [] }
    this.calls.push(call)
    return new FakeQuery(this, call)
  }

  from(table: string) {
    return {
      select: (columns?: string) => {
        const q = this.open(`select:${table}`)
        q.call.columns = columns
        return q
      },
      insert: (values: Record<string, unknown>) => {
        if (values && 'organization_id' in values) {
          // The real TenantDb injects organization_id itself; a route
          // passing one is a regression even if the spread would win.
          throw new Error(`insert into ${table} passed organization_id — the scoped accessor owns that`)
        }
        return this.open(`insert:${table}`, values)
      },
      update: (values: Record<string, unknown>) => this.open(`update:${table}`, values),
    }
  }

  organization() {
    return {
      select: (columns?: string) => {
        const q = this.open('select:organization')
        q.call.columns = columns
        return q
      },
    }
  }

  rpc(fn: string, args?: unknown) {
    return this.open(`rpc:${fn}`, args)
  }
}

export interface FakeTenantOptions {
  userId?: string
  organizationId?: string
  orgRole?: OrgRole
}

/** A TenantContext backed by a FakeTenantDb, for mocking resolveTenant(). */
export function createFakeTenant(options: FakeTenantOptions = {}) {
  const db = new FakeTenantDb()
  const tenant: TenantContext = {
    userId: options.userId ?? 'user-1',
    organizationId: options.organizationId ?? 'org-1',
    orgRole: options.orgRole ?? 'owner',
    db: db as unknown as TenantDb,
  }
  return { tenant, db }
}
