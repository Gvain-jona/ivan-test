# Refactoring Guide — Ivan Prints
**Scope:** Top code smells per feature, with before/after and rationale.  
**Principle applied:** Single Responsibility, Extract Until You Drop, No Surprise Side-Effects.

---

## Feature 1 — Authentication

### Smell 1A · `getBaseUrl()` — 8 console.logs, 5 branches, one job
**File:** `app/lib/auth/session-utils.ts:28–68`

**Problem:** A utility that returns a URL string logs to console 4 times, has 5 conditional branches, and handles 3 different URL transformations. It also hardcodes the production URL as a string literal.

```typescript
// BEFORE — 40 lines, 8 console.logs, hardcoded production URL
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    console.log('Using NEXT_PUBLIC_APP_URL:', url);
    if (url.includes('localhost')) {
      console.log('Detected localhost, forcing HTTP protocol');
      return url.replace('https://', 'http://');
    }
    if (!url.startsWith('https://') && !url.includes('localhost')) {
      console.log('Non-localhost URL without HTTPS, adding HTTPS protocol');
      return url.startsWith('http://') ? url.replace('http://', 'https://') : `https://${url}`;
    }
    return url;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('No NEXT_PUBLIC_APP_URL, using window.location.origin:', origin);
    if (origin.includes('localhost')) {
      console.log('Detected localhost, forcing HTTP protocol');
      return origin.replace('https://', 'http://');
    }
    return origin;
  }
  const fallbackUrl = process.env.NODE_ENV === 'production'
    ? 'https://ivan-test.vercel.app'   // ← hardcoded
    : 'http://localhost:3000';
  console.log('Using environment-specific fallback URL:', fallbackUrl);
  return fallbackUrl;
}
```

```typescript
// AFTER — 12 lines, zero console.logs, no hardcoded URLs
// Requires: NEXT_PUBLIC_APP_URL in .env (see .env.template)
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL.trim());
  }
  if (typeof window !== 'undefined') {
    return normalizeUrl(window.location.origin);
  }
  return 'http://localhost:3000';
}

function normalizeUrl(url: string): string {
  if (url.includes('localhost')) return url.replace(/^https:\/\//, 'http://');
  if (!url.startsWith('https://')) return `https://${url.replace(/^http:\/\//, '')}`;
  return url;
}
```

**What changed:** Extracted the URL normalization rule into `normalizeUrl()` (used in both branches), removed all console.logs (this runs on every auth callback), removed the hardcoded production URL fallback — the env var is now required.

---

### Smell 1B · Mock admin block in `AuthProvider`
**File:** `app/context/auth-context.tsx:242–270`

**Problem:** A 28-line block creates a full admin session when no real user is found. It lives inside the main auth initialization, making the `else if` branch invisible to reviewers. The fixed UUID leaks into other parts of the app (`SettingsContext` checks for it at line 46 and 140).

```typescript
// BEFORE — mock user hidden inside initializeAuth()
} else if (isDevelopment) {
  const mockProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'admin',
    ...
  };
  setUser(mockUser);
  setProfile(mockProfile);
}
```

```typescript
// AFTER — delete the entire else-if block.
// For local dev, use: npx supabase db reset && npm run supabase:seed
// Then sign in with a seeded test user.
} else {
  setUser(null);
  setProfile(null);
  setIsLoading(false);
}
```

Also remove the mock-user checks from `SettingsContext.tsx:46` and `SettingsContext.tsx:140`:
```typescript
// DELETE these lines — they exist only to support the mock user
const isMockUser = profile?.id === '00000000-0000-0000-0000-000000000000';
```

**What changed:** The mock user pattern creates a security hole (SEC-05) and requires every consumer to be aware of the magic UUID. Use real seeded users in local Supabase instead.

---

## Feature 2 — Orders

### Smell 2A · `invalidateOrderCache()` — 4 mutations, 1 setTimeout, same keys twice
**File:** `app/lib/cache-utils.ts`

**Problem:** Fires 4 separate `mutate()` calls, the last inside a `setTimeout(100ms)`. Calls 3 and 4 match the same keys. This triggers 2 waves of network requests 100ms apart for every order mutation.

```typescript
// BEFORE — 62 lines, 4 mutates, race condition
export function invalidateOrderCache(orderId: string, optimisticData?: any) {
  console.log(`[Cache] Invalidating cache for order: ${orderId}`);
  if (optimisticData) {
    mutate(`${API_ENDPOINTS.ORDERS}/${orderId}`, optimisticData, false);
  } else {
    mutate(`${API_ENDPOINTS.ORDERS}/${orderId}`);
  }
  mutate(API_ENDPOINTS.ORDERS, undefined, { revalidate: true });
  mutate((key) => {
    if (typeof key === 'string') {
      if (key === API_ENDPOINTS.ORDERS) return true;
      if (key === `${API_ENDPOINTS.ORDERS}/${orderId}`) return true;
      if (key.startsWith(`${API_ENDPOINTS.ORDERS}?`)) return true;
      if (key.includes('/api/orders/optimized')) return true;
      if (key.includes(orderId)) return true;
    }
    return false;
  }, undefined, { revalidate: true });
  setTimeout(() => {
    mutate((key) => { /* identical sweep */ }, undefined, { revalidate: true });
  }, 100);
  console.log(`[Cache] Cache invalidation complete for order: ${orderId}`);
}
```

```typescript
// AFTER — 18 lines, 1 mutate call, no setTimeout
export function invalidateOrderCache(orderId: string, optimisticData?: unknown): void {
  mutate(
    (key) => isOrderCacheKey(key, orderId),
    optimisticData,
    { revalidate: !optimisticData },
  );
}

function isOrderCacheKey(key: unknown, orderId: string): boolean {
  if (typeof key !== 'string') return false;
  return (
    key === API_ENDPOINTS.ORDERS ||
    key === `${API_ENDPOINTS.ORDERS}/${orderId}` ||
    key.startsWith(`${API_ENDPOINTS.ORDERS}?`) ||
    key.includes('/api/orders/optimized') ||
    key.includes(orderId)
  );
}
```

**What changed:** Single `mutate()` with a filter function covers all cases. `optimisticData` is passed as the second argument — when provided, SWR uses it immediately without revalidating; when absent, it revalidates. The `setTimeout` second-wave is eliminated entirely.

---

### Smell 2B · `PUT /api/orders` — raw type cast masquerading as validation
**File:** `app/api/orders/route.ts:132–143`

**Problem:** `body as { id?: string; ... }` is a TypeScript-only assertion that vanishes at runtime. Any JSON object passes through. The same file's POST handler correctly uses `CreateOrderSchema.safeParse`.

```typescript
// BEFORE — no runtime validation
const body = await request.json();
const { id, clientId, date, status, items } = body as {
  id?: string;
  clientId?: string;
  date?: string;
  status?: string;
  items?: unknown[];
};
if (!id || !clientId || !date || !status || !items) {
  return handleApiError('VALIDATION_ERROR', 'Missing required fields: id, clientId, date, status, items');
}
```

```typescript
// AFTER — Zod schema (add to app/lib/orders/validators.ts alongside CreateOrderSchema)
import { z } from 'zod';

export const UpdateOrderSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
  clientId: z.string().uuid('Invalid client ID'),
  date: z.string().date('Invalid date format'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'delivered']),
  items: z.array(z.object({
    item_name: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    category_id: z.string().uuid().optional(),
    size: z.string().optional(),
  })).min(1, 'Order must have at least one item'),
});

// In PUT handler:
const parsed = UpdateOrderSchema.safeParse(await request.json());
if (!parsed.success) {
  return handleApiError('VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
}
const { id, clientId, date, status, items } = parsed.data;
```

**What changed:** Exact same shape, but now validated at runtime. UUID format, date format, status enum, and item structure are all enforced before hitting the database.

---

## Feature 3 — Expenses

### Smell 3A · Inline `reduce` grouping duplicated 3 times in GET handler
**File:** `app/api/expenses/route.ts:80–103`

**Problem:** The same "group array by foreign key" operation is written out three times in sequence for payments, expense_notes, and linked_notes. Each block is 4 lines of identical structure.

```typescript
// BEFORE — same pattern 3× in a row
const paymentsByExpenseId = (paymentsResult.data || []).reduce((acc, payment) => {
  if (!acc[payment.expense_id]) acc[payment.expense_id] = [];
  acc[payment.expense_id].push(payment);
  return acc;
}, {} as Record<string, any[]>);

const expenseNotesByExpenseId = (expenseNotesResult.data || []).reduce((acc, note) => {
  if (!acc[note.expense_id]) acc[note.expense_id] = [];
  acc[note.expense_id].push(note);
  return acc;
}, {} as Record<string, any[]>);

const linkedNotesByExpenseId = (linkedNotesResult.data || []).reduce((acc, note) => {
  if (!acc[note.linked_item_id]) acc[note.linked_item_id] = [];
  acc[note.linked_item_id].push(note);
  return acc;
}, {} as Record<string, any[]>);
```

```typescript
// AFTER — one utility function, used 3×
// Add to app/lib/utils/group-by-key.ts
export function groupByKey<T>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getKey(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

// In expenses/route.ts:
const paymentsByExpenseId    = groupByKey(paymentsResult.data ?? [],     p => p.expense_id);
const expenseNotesByExpenseId = groupByKey(expenseNotesResult.data ?? [], n => n.expense_id);
const linkedNotesByExpenseId  = groupByKey(linkedNotesResult.data ?? [],  n => n.linked_item_id);
```

**What changed:** 20 lines → 3 lines at the call site. `groupByKey` is now reusable across orders, materials, and any future feature that needs this pattern. The `??=` operator removes the explicit null check.

---

## Feature 4 — Materials

### Smell 4A · URL construction not memoized inside hook body
**File:** `app/hooks/materials/useMaterialPurchases.ts:39–58`

**Problem:** `new URLSearchParams()` and `.toString()` run on every render of every component that uses `useMaterialPurchasesList`. When filters haven't changed, this creates a new URL string and a new `cacheKey` string, breaking SWR's deduplication.

```typescript
// BEFORE — URLSearchParams rebuilt on every render
export function useMaterialPurchasesList(
  filters: MaterialPurchaseFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 },
  options = { includePayments: true, includeNotes: true, includeInstallments: true }
) {
  const queryParams = new URLSearchParams();
  queryParams.append('page', pagination.page.toString());
  queryParams.append('limit', pagination.limit.toString());
  if (filters.supplier) queryParams.append('supplier', filters.supplier);
  if (filters.startDate) queryParams.append('start_date', filters.startDate);
  if (filters.endDate) queryParams.append('end_date', filters.endDate);
  if (filters.paymentStatus) queryParams.append('payment_status', filters.paymentStatus);
  if (options.includePayments) queryParams.append('include_payments', 'true');
  if (options.includeNotes) queryParams.append('include_notes', 'true');
  if (options.includeInstallments) queryParams.append('include_installments', 'true');

  const url = `${API_ENDPOINTS.MATERIALS}/optimized?${queryParams.toString()}`;
  const cacheKey = `material-purchases-list-${queryParams.toString()}`;
```

```typescript
// AFTER — extract URL builder, memoize inside hook
// app/lib/materials/build-material-list-url.ts
export function buildMaterialListUrl(
  filters: MaterialPurchaseFilters,
  pagination: PaginationParams,
  options: MaterialListOptions,
): string {
  const params = new URLSearchParams({
    page: String(pagination.page),
    limit: String(pagination.limit),
    ...(filters.supplier      && { supplier:        filters.supplier }),
    ...(filters.startDate     && { start_date:      filters.startDate }),
    ...(filters.endDate       && { end_date:        filters.endDate }),
    ...(filters.paymentStatus && { payment_status:  filters.paymentStatus }),
    ...(options.includePayments     && { include_payments:     'true' }),
    ...(options.includeNotes        && { include_notes:        'true' }),
    ...(options.includeInstallments && { include_installments: 'true' }),
  });
  return `${API_ENDPOINTS.MATERIALS}/optimized?${params.toString()}`;
}

// In hook:
export function useMaterialPurchasesList(
  filters: MaterialPurchaseFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 },
  options: MaterialListOptions = DEFAULT_OPTIONS,
) {
  const url = useMemo(
    () => buildMaterialListUrl(filters, pagination, options),
    // Stringify objects so useMemo gets stable comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters), JSON.stringify(pagination), JSON.stringify(options)],
  );

  const { data, error, isLoading, mutate } = useLoadingSWR<MaterialPurchasesResponse>(
    url,
    fetchMaterialPurchases,
    MATERIAL_LIST_SWR_CONFIG,
  );
```

**What changed:** URL builder is a pure function — testable in isolation. `useMemo` ensures SWR sees the same key string across renders when inputs are unchanged, eliminating spurious cache misses. The `useMaterialPurchases.ts` file itself should be split into `useMaterialPurchasesList.ts`, `useMaterialPurchaseDetail.ts`, `useMaterialInstallments.ts`, and `useMaterialPayments.ts`.

---

## Feature 5 — Analytics

### Smell 5A · `getRevenueByPeriod()` — triple fallback cascade with console.logs
**File:** `app/lib/services/analytics-service.ts:198–229`

**Problem:** One method tries 3 different data sources (materialized view → summary table → RPC function) in a cascade, with `console.log` before each attempt. The fallback logic is implicit — if the materialized view returns empty data it silently continues, which hides real errors.

```typescript
// BEFORE — implicit cascade, silent empty-data fallback, 30+ lines per period type
async getRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year', dateRange: DateRange) {
  if (period === 'day') {
    const today = new Date();
    const ninetyDaysAgo = subDays(today, 90);
    const startDate = parseISO(dateRange.startDate);
    if (isWithinInterval(startDate, { start: ninetyDaysAgo, end: today })) {
      console.log('Using materialized view for daily revenue data');
      const { data, error } = await supabase.from('analytics_daily_revenue')...
      if (error) {
        console.error('Error fetching from materialized view:', error);
        // Fall back to the function if there's an error
      } else if (data && data.length > 0) {
        return data.map(...)
      }
    }
  }
  if (period === 'month') {
    console.log('Using summary table for monthly revenue data');
    const { data, error } = await supabase.from('analytics_monthly_revenue')...
    // more cascade...
  }
  // falls through to RPC
}
```

```typescript
// AFTER — strategy pattern, explicit source selection, no surprises
type RevenueSource = 'materialized' | 'summary' | 'rpc';

function selectRevenueSource(period: RevenuePeriod, startDate: Date): RevenueSource {
  if (period === 'day' && isWithinLast90Days(startDate)) return 'materialized';
  if (period === 'month') return 'summary';
  return 'rpc';
}

async getRevenueByPeriod(
  period: RevenuePeriod,
  dateRange: DateRange,
): Promise<RevenueByPeriod[]> {
  const source = selectRevenueSource(period, parseISO(dateRange.startDate));
  const supabase = createClient();

  switch (source) {
    case 'materialized':
      return fetchDailyRevenueFromView(supabase, dateRange);
    case 'summary':
      return fetchMonthlyRevenueFromSummary(supabase, dateRange);
    case 'rpc':
      return fetchRevenueFromRpc(supabase, period, dateRange);
  }
}

// Each fetch function is small, testable, and throws on error (no silent empty fallback)
async function fetchDailyRevenueFromView(
  supabase: SupabaseClient,
  dateRange: DateRange,
): Promise<RevenueByPeriod[]> {
  const { data, error } = await supabase
    .from('analytics_daily_revenue')
    .select('date as period, total_revenue, total_orders')
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate)
    .order('date');

  if (error) throw new AnalyticsError('Failed to fetch daily revenue', error);
  return (data ?? []).map(row => ({
    period: format(new Date(row.period), 'yyyy-MM-dd'),
    total_revenue: row.total_revenue,
    total_orders: row.total_orders,
  }));
}
```

**What changed:** `selectRevenueSource()` makes the strategy explicit and testable. Each fetch function has one responsibility. Errors throw instead of silently falling through — callers know when the data source fails. All `console.log` removed from the data path.

---

## Cross-Cutting Smell — `any` Types in API Response Handlers

Across all features, API responses are typed as `any[]`:
```typescript
// BEFORE — scattered across expenses, orders, materials
} as Record<string, any[]>);
const { data: allItems, error: itemsError } = await supabase...  // data inferred as any
```

```typescript
// AFTER — use the generated Supabase types
import type { Database } from '@/lib/database.types';
type ExpensePayment = Database['public']['Tables']['expense_payments']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

const paymentsByExpenseId = groupByKey<ExpensePayment>(
  paymentsResult.data ?? [],
  p => p.expense_id,
);
```

The `database.types.ts` is already generated — use it. Every `any` in the API layer can be replaced by a table Row type.
