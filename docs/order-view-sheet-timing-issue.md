# OrderViewSheet Timing Issue Documentation

## Issue Description
When users quickly navigate from Orders table → View Order → Generate Invoice, the invoice may show data from the previously selected order instead of the current one.

## Root Cause
The OrderViewSheet component uses SWR for data fetching with the following behavior:

1. **Initial Data**: Uses `initialOrder` passed from the parent component as fallback
2. **Async Fetch**: SWR fetches fresh data from the API in the background
3. **Revalidation Logic**: Only revalidates on mount if `!initialOrder?.items || initialOrder.items.length === 0`
4. **Timing Gap**: If user clicks "Generate Invoice" before SWR completes fetching, they get stale data

## Code Location
- File: `/app/components/orders/order-view/OrderViewSheet.tsx`
- Lines: 79-86 (SWR configuration)
- Lines: 57-66 (orderId state update logic)

## Current Workaround
Users should wait 1-2 seconds after opening the OrderViewSheet before clicking "Generate Invoice" to ensure fresh data is loaded.

## Potential Fixes (For Future Implementation)

### Option 1: Show Loading State
- Disable "Generate Invoice" button while `isLoading === true`
- Show spinner or loading indicator on the button

### Option 2: Force Fresh Fetch
- Pass a timestamp or random key to force SWR to refetch
- Use `mutate()` to clear cache when sheet opens

### Option 3: Direct Data Pass
- Pass complete order data directly to InvoiceSheet
- Avoid relying on context state that might be stale

### Option 4: Prefetch on Hover
- Prefetch order data when user hovers over table row
- Data will be ready by the time they click

## Related Components
- `useOrderModals.ts` - Sets selectedOrder state
- `OrdersUIContext.tsx` - Manages global order state
- `InvoiceSheet.tsx` - Receives order data

## Impact
- Affects invoice generation accuracy
- Can lead to wrong invoice data being shown/printed
- Fixed by color contrast changes, but timing issue remains