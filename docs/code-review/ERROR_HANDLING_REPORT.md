# Error Handling & Reliability Report — Ivan Prints
**Date:** 2026-06-02  
**Scope:** Critical code paths — database calls, auth flows, background jobs, payment mutations  
**Goal:** Identify paths that can crash the app, silently corrupt data, or surface raw errors to users

---

## Summary

| ID | Severity | File | Issue |
|----|----------|------|-------|
| ERR-01 | HIGH | `app/api/cron/generate-recurring-expenses/route.ts` | Invalid `ApiErrorType` strings cause TypeScript error swallowed by `ignoreBuildErrors` |
| ERR-02 | HIGH | `app/api/material-purchases/[id]/payments/route.ts` | Payment-insert + amount-update is not atomic — partial failure leaves data inconsistent |
| ERR-03 | HIGH | `app/api/orders/analytics/route.ts` | Full table scan in Node.js; no pagination, memory unbounded |
| ERR-04 | MEDIUM | `app/api/orders/[id]/route.ts` | Partial sub-resource failures (items/payments/notes) swallowed silently |
| ERR-05 | MEDIUM | `app/api/settings/app/route.ts` | Uses bare `NextResponse.json` instead of `handleApiError` — inconsistent error shape |
| ERR-06 | MEDIUM | `app/lib/api/error-handler.ts` | `handleApiError` and `handleSupabaseError` are declared `async` but have no `await` |
| ERR-07 | MEDIUM | `app/lib/cache-utils.ts` | `setTimeout(..., 100)` race condition in cache invalidation |
| ERR-08 | LOW | `utils/supabase/middleware.ts` | Auth error from `getUser()` is silently discarded |
| ERR-09 | LOW | `app/api/cron/generate-recurring-expenses/route.ts` | N+1 query loop — one DB write per recurring expense |

---

## ERR-01 — Invalid `ApiErrorType` Strings in Cron Route

**File:** `app/api/cron/generate-recurring-expenses/route.ts:13–17, 134–138`  
**Severity:** HIGH

**Problem:** The cron route calls `handleApiError('AUTHENTICATION_ERROR', ...)` and `handleApiError('SERVER_ERROR', ...)`. Neither `'AUTHENTICATION_ERROR'` nor `'SERVER_ERROR'` exist in the `ApiErrorType` union in `app/lib/api/error-handler.ts`. TypeScript would catch this as a type error, but `ignoreBuildErrors: true` in `next.config.js` suppresses it.

At runtime, `errorStatusCodes['AUTHENTICATION_ERROR']` is `undefined`, so `NextResponse.json(..., { status: undefined })` defaults to HTTP 200. This means authentication failures on the cron endpoint silently return 200 OK.

**Current code:**
```typescript
// cron/generate-recurring-expenses/route.ts:13-17
return handleApiError(
  'AUTHENTICATION_ERROR',   // ← not in ApiErrorType
  'Unauthorized',
  { status: 401 }           // ← passed as 'details', ignored by handler
);

// line 134
return handleApiError('SERVER_ERROR', ...);  // ← also not in ApiErrorType
```

**Fix:**
```typescript
// Use the correct type names from ApiErrorType
return handleApiError('UNAUTHORIZED', 'Invalid cron secret');    // was AUTHENTICATION_ERROR
return handleApiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred');  // was SERVER_ERROR
```

Also add `'UNAUTHORIZED'` to the `ApiErrorType` alias if it doesn't already exist — it does: checking `error-handler.ts:8–15` confirms `'UNAUTHORIZED'` is present.

---

## ERR-02 — Non-Atomic Payment Insert + Amount Update

**Files:** `app/api/material-purchases/[id]/payments/route.ts:112–153`, `app/api/expenses/[id]/payments/route.ts`  
**Severity:** HIGH

**Problem:** Adding a payment involves two sequential operations:
1. `INSERT` into `material_payments`
2. `UPDATE` `material_purchases.amount_paid`

If step 1 succeeds but step 2 fails (network blip, constraint violation, etc.), the system is in an inconsistent state: the payment record exists, but the purchase total is wrong. The code explicitly comments "Continue even if update fails, we'll return the payment" — meaning silent data corruption is by design.

**Current code:**
```typescript
// material-purchases/[id]/payments/route.ts:127-158
const { data: newPayment, error: paymentError } = await supabase
  .from('material_payments').insert({ ... }).select().single();

if (paymentError) {
  return handleSupabaseError(paymentError);
}

// This runs separately — if it fails, payment exists but amount is wrong
const { error: updateError } = await supabase
  .from('material_purchases')
  .update({ amount_paid: newAmountPaid, payment_status })
  .eq('id', id);

if (updateError) {
  console.error('Error updating material purchase:', updateError);
  // Continue even if update fails, we'll return the payment  ← silent corruption
}
```

**Fix — Option A (Supabase RPC transaction):**

Create a database function that handles both operations atomically:

```sql
-- supabase/migrations/<timestamp>_add_payment_rpc.sql
CREATE OR REPLACE FUNCTION add_material_payment(
  p_purchase_id UUID,
  p_amount NUMERIC,
  p_date DATE,
  p_payment_method TEXT,
  p_notes TEXT,
  p_user_id UUID
) RETURNS material_payments AS $$
DECLARE
  v_payment material_payments;
  v_new_amount_paid NUMERIC;
  v_total NUMERIC;
BEGIN
  INSERT INTO material_payments (purchase_id, amount, date, payment_method, notes, created_by)
  VALUES (p_purchase_id, p_amount, p_date, p_payment_method, p_notes, p_user_id)
  RETURNING * INTO v_payment;

  SELECT total_amount, amount_paid + p_amount
  INTO v_total, v_new_amount_paid
  FROM material_purchases WHERE id = p_purchase_id;

  UPDATE material_purchases SET
    amount_paid = v_new_amount_paid,
    payment_status = CASE
      WHEN v_new_amount_paid >= v_total THEN 'paid'
      WHEN v_new_amount_paid > 0 THEN 'partially_paid'
      ELSE 'unpaid'
    END,
    updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// route.ts POST handler
const { data: newPayment, error } = await supabase.rpc('add_material_payment', {
  p_purchase_id: id,
  p_amount: parsed.data.amount,
  p_date: parsed.data.date,
  p_payment_method: parsed.data.payment_method,
  p_notes: parsed.data.notes ?? null,
  p_user_id: user.id,
});
if (error) return handleSupabaseError(error);
```

**Fix — Option B (simpler, no migration):**

At minimum, if the update fails, roll back by deleting the inserted payment:
```typescript
if (updateError) {
  // Rollback: delete the payment we just inserted
  await supabase.from('material_payments').delete().eq('id', newPayment.id);
  return handleSupabaseError(updateError);
}
```

---

## ERR-03 — Full Table Scan in Analytics, Unbounded Memory

**File:** `app/api/orders/analytics/route.ts`  
**Severity:** HIGH

**Problem:** The analytics route fetches the entire `orders` table into Node.js memory with no `.range()` limit, then does aggregation in JavaScript. On a real print shop with years of data, this will exhaust the Node.js heap and crash the server process.

**Current pattern (inferred from previous review):**
```typescript
let query = supabase.from('orders').select('...', { count: 'exact' });
// NO .range() or .limit()
const { data } = await query;  // entire table
const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
```

**Fix:** Move aggregation to the database. Use a Supabase RPC or a direct aggregate query:
```typescript
// Option A: Database-level aggregation
const { data, error } = await supabase
  .rpc('get_order_analytics_summary', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

// Option B: If keeping in-JS, add a hard limit and document it
const { data } = await query
  .range(0, 9999)   // max 10k rows — document this limitation
  .order('created_at', { ascending: false });

if ((count ?? 0) > 10000) {
  console.warn(`Analytics: truncated at 10k rows (total: ${count})`);
}
```

---

## ERR-04 — Sub-Resource Fetch Failures Silently Return Incomplete Data

**File:** `app/api/orders/[id]/route.ts:39–41`  
**Severity:** MEDIUM

**Problem:** Order detail fetches items, payments, and notes in parallel with `Promise.all`. If any sub-resource fetch fails, the error is logged but the response still returns the order with an empty array for that field. The client has no way to know the data is incomplete.

**Current code:**
```typescript
if (itemsError) console.error('GET /api/orders/[id]: items fetch failed', itemsError);
if (paymentsError) console.error('GET /api/orders/[id]: payments fetch failed', paymentsError);
if (notesError) console.error('GET /api/orders/[id]: notes fetch failed', notesError);
// ← response still returns with empty arrays
```

**Fix — add a partial failure indicator:**
```typescript
const warnings: string[] = [];
if (itemsError) warnings.push('items_unavailable');
if (paymentsError) warnings.push('payments_unavailable');
if (notesError) warnings.push('notes_unavailable');

return NextResponse.json({
  order: orderDetails,
  ...(warnings.length > 0 && { warnings }),
});
```

This lets the client show a "Some data may be missing" banner rather than silently displaying empty sections.

---

## ERR-05 — Settings Route Uses Inconsistent Error Shape

**File:** `app/api/settings/app/route.ts`  
**Severity:** MEDIUM

**Problem:** This route returns `{ error: 'string' }` directly via `NextResponse.json` instead of using `handleApiError`. The SWR hooks and error handling utilities in `app/lib/api/` expect `{ error: { type, message } }` (the `ApiErrorResponse` shape). The settings route responses will not be handled correctly by these utilities.

**Fix:** Import and use the standard error handler:
```typescript
import { handleApiError, handleUnexpectedError } from '@/lib/api/error-handler';

// Replace:
return NextResponse.json({ error: 'Failed to fetch app settings' }, { status: 500 });

// With:
return handleApiError('DATABASE_ERROR', 'Failed to fetch app settings');
```

---

## ERR-06 — Error Handler Functions Declared Unnecessarily `async`

**File:** `app/lib/api/error-handler.ts:49, 81, 99`  
**Severity:** MEDIUM

**Problem:** `handleApiError`, `handleUnexpectedError`, and `handleSupabaseError` are all declared `async` but none contain any `await` expression. This forces all callers to `await` the result (or miss the return value), adds a Promise wrapping overhead on every API error, and is misleading about the function's behavior.

This also means ESLint's `@typescript-eslint/require-await` rule (if added later) will flag all three functions.

**Current:**
```typescript
export async function handleApiError(
  type: ApiErrorType,
  message: string,
  details?: any
): Promise<NextResponse<ApiErrorResponse>> {
  // no await anywhere
  return NextResponse.json(...);
}
```

**Fix:**
```typescript
export function handleApiError(
  type: ApiErrorType,
  message: string,
  details?: unknown,  // also fix: 'any' → 'unknown'
): NextResponse<ApiErrorResponse> {
  if (type !== 'VALIDATION_ERROR') {
    console.error(`API Error [${type}]:`, message, details ?? '');
  }
  return NextResponse.json(
    { error: { type, message, ...(details != null && { details }) } },
    { status: errorStatusCodes[type] },
  );
}
```

**Note:** All call sites use `return handleApiError(...)` not `return await handleApiError(...)`, so removing `async` is a non-breaking change.

---

## ERR-07 — Cache Invalidation Race Condition via `setTimeout`

**File:** `app/lib/cache-utils.ts`  
**Severity:** MEDIUM

**Problem:** After an order mutation, the cache is invalidated with four separate `mutate()` calls, one of which is delayed 100ms with `setTimeout`. This is an explicit race condition: if the component re-renders before the timeout fires, it fetches stale data and re-populates the cache with the old value. The correct pattern is a single `mutate()` with a predicate.

**Current code (race condition):**
```typescript
export async function invalidateOrderCache(orderId: string) {
  await mutate(CACHE_KEYS.orders.list);
  await mutate(CACHE_KEYS.orders.detail(orderId));
  await mutate(CACHE_KEYS.analytics.summary);
  setTimeout(() => {
    mutate(CACHE_KEYS.analytics.revenue);  // ← delayed, can race
  }, 100);
}
```

**Fix (single predicate-based invalidation):**
```typescript
import { mutate } from 'swr';

function isOrderCacheKey(key: unknown): boolean {
  if (typeof key === 'string') {
    return key.startsWith('/api/orders') || key.startsWith('/api/analytics');
  }
  if (Array.isArray(key)) {
    return typeof key[0] === 'string' && isOrderCacheKey(key[0]);
  }
  return false;
}

export async function invalidateOrderCache(_orderId?: string): Promise<void> {
  await mutate(isOrderCacheKey);
}
```

---

## ERR-08 — Auth Error from `getUser()` Silently Discarded in Middleware

**File:** `utils/supabase/middleware.ts:41`  
**Severity:** LOW

**Problem:** `supabase.auth.getUser()` returns `{ data: { user }, error }`. The middleware destructures only `user` and discards `error`. A Supabase connectivity failure during the auth check returns `user: null`, which (once SEC-02 is fixed) redirects the user to the sign-in page. This is the correct fallback, but the connectivity error is never logged anywhere.

**Current:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
// error is discarded
```

**Fix:**
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError) {
  console.error('middleware: auth check failed', authError.message);
}
// continue — treat auth error same as no user (redirect to sign-in)
```

---

## ERR-09 — N+1 Query Loop in Cron Job

**File:** `app/api/cron/generate-recurring-expenses/route.ts:43–87`  
**Severity:** LOW

**Problem:** The cron job iterates over all recurring expenses in a `for` loop and performs a DB write for each one. With 100 recurring expenses, this generates 200 sequential queries (insert + update). This does not cause data corruption but will be slow and may time out on Vercel's 10-second function limit.

**Fix:** Create a single RPC that processes all due expenses in one transaction:
```sql
-- supabase/functions or migrations
CREATE OR REPLACE FUNCTION process_due_recurring_expenses()
RETURNS TABLE(generated INT, errors TEXT[]) AS $$
BEGIN
  -- Insert occurrences for all due expenses in one statement
  WITH due_expenses AS (
    SELECT id, next_occurrence_date FROM expenses
    WHERE is_recurring = true
      AND next_occurrence_date <= NOW()
      AND (recurrence_end_date IS NULL OR recurrence_end_date >= NOW())
  )
  INSERT INTO recurring_expense_occurrences (parent_expense_id, occurrence_date, status)
  SELECT id, next_occurrence_date, 'pending' FROM due_expenses;

  -- Update next_occurrence_date for all processed expenses
  -- ... (depends on recurrence interval logic)
  
  GET DIAGNOSTICS generated = ROW_COUNT;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

---

## Error Handling Quality Gates Checklist

Use this as a PR review checklist for any new API route:

- [ ] Calls `supabase.auth.getUser()` before any data operation
- [ ] Returns `handleApiError('UNAUTHORIZED', ...)` if `!user`
- [ ] Validates request body with a Zod schema (`.safeParse()`, not `as { type }`)
- [ ] All Supabase errors returned via `handleSupabaseError(error)` not raw JSON
- [ ] Unexpected errors caught in `try/catch` and returned via `handleUnexpectedError(error)`
- [ ] No `console.log` in API routes (only `console.error` for actual errors)
- [ ] Multi-step mutations (insert + update) are wrapped in an RPC transaction
- [ ] Error type strings match `ApiErrorType` enum in `error-handler.ts`
