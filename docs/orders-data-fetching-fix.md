# Orders Data Fetching Fix

## Problem

The application was experiencing issues with orders data fetching, where only 20 records were being retrieved at a time. This led to:

1. Incomplete data in tables
2. Incorrect metrics in cards due to calculations based on partial data
3. Pagination issues where only a subset of records was visible

## Solution

We implemented a comprehensive solution to ensure all orders data is properly fetched and displayed:

### 1. Server-Side Metrics Calculation

- Created dedicated API endpoints for metrics and analytics that calculate values using the complete dataset
- Implemented `/api/orders/metrics` for basic metrics (total orders, revenue, etc.)
- Implemented `/api/orders/analytics` for more detailed analytics (client performance, etc.)

### 2. Client-Side Hooks for Accurate Data

- Created `useOrderMetrics` hook to fetch server-calculated metrics
- Created `useOrderAnalytics` hook for detailed analytics
- Updated components to use these hooks instead of calculating metrics from partial data

### 3. Increased Page Size for Complete Data

- Increased the default page size from 20 to 500 in the API route
- Updated the client-side hooks to use the larger page size
- Modified the OrdersPageContext to use the larger page size for fetching

### 4. Pagination Improvements

- Maintained the display page size of 10 for better UX
- Updated the pagination logic to work with the larger server fetch size
- Fixed issues with totalCount calculation to ensure proper pagination

## Benefits

1. **Accurate Metrics**: All metrics are now calculated on the server using the complete dataset
2. **Better Performance**: Reduced the number of API calls by fetching more data at once
3. **Improved UX**: Users can now see all their orders and accurate metrics
4. **Maintainable Code**: Separated data fetching from UI rendering for better maintainability

## Technical Details

### API Endpoints

- `/api/orders/metrics`: Returns basic metrics like total orders, revenue, etc.
- `/api/orders/analytics`: Returns detailed analytics including client performance

### Custom Hooks

- `useOrderMetrics`: Fetches metrics from the server with optional filtering
- `useOrderAnalytics`: Fetches detailed analytics from the server with optional filtering

### Configuration Changes

- Increased default page size from 20 to 500 in:
  - API routes
  - Client-side hooks
  - OrdersPageContext

### Components Updated

- `OrderMetricsCards`: Now uses server-calculated metrics
- `InsightsTab`: Uses server-calculated analytics for more accurate insights

## Future Improvements

1. Consider implementing server-side pagination with "load more" functionality for very large datasets
2. Add caching for metrics and analytics to reduce server load
3. Implement real-time updates for critical metrics
