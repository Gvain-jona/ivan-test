# Ivan Prints Analytics System: Hybrid Approach Implementation

This document describes the implementation of a hybrid approach for the Ivan Prints analytics system, which combines pre-aggregated data with on-demand calculations to balance performance and flexibility.

## 1. Overview

The hybrid approach consists of:

1. **Summary Tables**: Pre-aggregated data for common, performance-critical analytics
2. **Materialized Views**: Regularly refreshed views for efficient querying
3. **Database Functions**: On-demand calculations for less frequent, ad hoc, or detailed analysis
4. **Server-Side Caching**: Caching of expensive calculations to improve performance
5. **Scheduled Jobs**: Automatic updates of summary tables and materialized views

## 2. Database Components

### 2.1 Materialized Views

Materialized views store pre-computed query results for efficient retrieval:

1. **analytics_daily_revenue**: Daily revenue metrics
   - `date`: Date of the orders
   - `total_revenue`: Total revenue for the day
   - `total_orders`: Number of orders for the day
   - `avg_order_value`: Average order value for the day

2. **analytics_daily_expenses**: Daily expense metrics by category
   - `date`: Date of the expenses
   - `category`: Expense category
   - `total_amount`: Total expense amount for the day and category
   - `expense_count`: Number of expenses for the day and category

3. **analytics_daily_materials**: Daily material purchase metrics by supplier
   - `date`: Date of the material purchases
   - `supplier_name`: Supplier name
   - `total_amount`: Total purchase amount for the day and supplier
   - `purchase_count`: Number of purchases for the day and supplier

4. **analytics_daily_profit**: Daily profit metrics
   - `date`: Date of the orders
   - `total_profit`: Total profit for the day
   - `total_revenue`: Total revenue for the day
   - `profit_margin`: Profit margin percentage for the day

### 2.2 Summary Tables

Summary tables store aggregated data at different time granularities:

1. **analytics_monthly_revenue**: Monthly revenue metrics
   - `month_key`: Month in YYYY-MM format
   - `year`: Year
   - `month_num`: Month number (1-12)
   - `total_revenue`: Total revenue for the month
   - `total_orders`: Number of orders for the month
   - `avg_order_value`: Average order value for the month
   - `last_updated`: Timestamp of the last update

2. **analytics_monthly_expenses**: Monthly expense metrics by category
   - `month_key`: Month in YYYY-MM format
   - `category`: Expense category
   - `year`: Year
   - `month_num`: Month number (1-12)
   - `total_amount`: Total expense amount for the month and category
   - `expense_count`: Number of expenses for the month and category
   - `last_updated`: Timestamp of the last update

3. **analytics_monthly_profit**: Monthly profit metrics
   - `month_key`: Month in YYYY-MM format
   - `year`: Year
   - `month_num`: Month number (1-12)
   - `total_profit`: Total profit for the month
   - `total_revenue`: Total revenue for the month
   - `profit_margin`: Profit margin percentage for the month
   - `last_updated`: Timestamp of the last update

4. **analytics_weekly_revenue**: Weekly revenue metrics
   - `week_key`: Week in YYYY-Www format
   - `year`: Year
   - `week_num`: Week number (1-53)
   - `start_date`: Start date of the week
   - `end_date`: End date of the week
   - `total_revenue`: Total revenue for the week
   - `total_orders`: Number of orders for the week
   - `avg_order_value`: Average order value for the week
   - `last_updated`: Timestamp of the last update

### 2.3 Database Functions

Database functions are used to update summary tables and perform on-demand calculations:

1. **update_monthly_revenue_summary**: Updates the monthly revenue summary table
2. **update_monthly_expenses_summary**: Updates the monthly expenses summary table
3. **update_monthly_profit_summary**: Updates the monthly profit summary table
4. **update_weekly_revenue_summary**: Updates the weekly revenue summary table
5. **update_all_monthly_summaries**: Updates all monthly summary tables
6. **update_all_weekly_summaries**: Updates all weekly summary tables
7. **update_current_month_summaries**: Updates summary tables for the current month
8. **update_current_week_summaries**: Updates summary tables for the current week

### 2.4 Scheduled Jobs

Scheduled jobs automatically update summary tables and materialized views:

1. **refresh-materialized-views**: Refreshes all materialized views daily at 1:00 AM
2. **update-weekly-summaries**: Updates weekly summary tables every Monday at 2:00 AM
3. **update-monthly-summaries**: Updates monthly summary tables on the 1st of each month at 3:00 AM

## 3. Frontend Components

### 3.1 Analytics Service

The analytics service (`app/lib/services/analytics-service.ts`) implements the hybrid approach:

1. For common queries, it uses pre-aggregated data from summary tables
2. For less common queries, it falls back to on-demand calculations
3. It handles data transformation and formatting

Example:

```typescript
async getRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year', dateRange: DateRange): Promise<RevenueByPeriod[]> {
  try {
    const supabase = createClient();
    
    // For daily data, use the materialized view for better performance
    if (period === 'day') {
      // Check if the date range is within the last 90 days
      const today = new Date();
      const ninetyDaysAgo = subDays(today, 90);
      const startDate = parseISO(dateRange.startDate);
      
      if (isWithinInterval(startDate, { start: ninetyDaysAgo, end: today })) {
        const { data, error } = await supabase
          .from('analytics_daily_revenue')
          .select('date as period, total_revenue, total_orders')
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate)
          .order('date');
          
        if (!error && data && data.length > 0) {
          return data.map(item => ({
            period: format(new Date(item.period), 'yyyy-MM-dd'),
            total_revenue: item.total_revenue,
            total_orders: item.total_orders
          }));
        }
      }
    }
    
    // For monthly data, use the summary table for better performance
    if (period === 'month') {
      const { data, error } = await supabase
        .from('analytics_monthly_revenue')
        .select('month_key as period, total_revenue, total_orders')
        .gte('month_key', dateRange.startDate.substring(0, 7))
        .lte('month_key', dateRange.endDate.substring(0, 7))
        .order('month_key');
        
      if (!error && data && data.length > 0) {
        return data;
      }
    }
    
    // Fall back to the database function for other periods or if the above queries return no data
    const { data, error } = await supabase.rpc('get_revenue_by_period', {
      period_type: period,
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getRevenueByPeriod:', error);
    throw error;
  }
}
```

### 3.2 Caching Utility

The caching utility (`app/lib/cache/analytics-cache.ts`) provides server-side caching for expensive calculations:

1. `getCachedData`: Gets data from cache or fetches it if not available
2. `invalidateCache`: Invalidates a specific cache entry
3. `invalidateAllCache`: Invalidates all cache entries
4. `getAnalyticsCacheKey`: Generates a cache key for analytics queries

Example:

```typescript
export async function getCachedData<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  
  // Check if data is in cache and not expired
  if (cache[key] && cache[key].expiresAt > now) {
    console.log(`Cache hit for key: ${key}`);
    return cache[key].data;
  }
  
  // Fetch fresh data
  console.log(`Cache miss for key: ${key}, fetching fresh data`);
  const data = await fetchFn();
  
  // Store in cache
  cache[key] = {
    data,
    expiresAt: now + (ttlSeconds * 1000)
  };
  
  return data;
}
```

### 3.3 API Routes

API routes use the analytics service and caching utility to implement the hybrid approach:

1. For common queries, they use pre-aggregated data from summary tables
2. For less common queries, they fall back to on-demand calculations
3. Results are cached to improve performance for repeated queries

Example:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate') || formatDate(thirtyDaysAgo);
    const endDate = searchParams.get('endDate') || formatDate(today);
    
    // Create cache key
    const cacheKey = getAnalyticsCacheKey('revenue', { period, startDate, endDate });
    
    // Get data from cache or fetch it
    const data = await getCachedData(
      cacheKey,
      // Cache for 5 minutes for day/week, 1 hour for month/year
      period === 'day' || period === 'week' ? 300 : 3600,
      async () => {
        // Use the analytics service which implements the hybrid approach
        return await analyticsService.getRevenueByPeriod(
          period as 'day' | 'week' | 'month' | 'year',
          { startDate, endDate }
        );
      }
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/analytics/revenue:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

## 4. Benefits of the Hybrid Approach

1. **Performance**: Pre-aggregated data provides fast response times for common queries
2. **Flexibility**: On-demand calculations allow for ad hoc analysis and detailed queries
3. **Scalability**: The approach scales well with increasing data volume
4. **Caching**: Server-side caching further improves performance for repeated queries
5. **Automatic Updates**: Scheduled jobs keep summary tables and materialized views up to date

## 5. Maintenance and Monitoring

### 5.1 Refreshing Materialized Views

Materialized views are refreshed daily at 1:00 AM by a scheduled job. They can also be refreshed manually:

```sql
REFRESH MATERIALIZED VIEW analytics_daily_revenue;
REFRESH MATERIALIZED VIEW analytics_daily_expenses;
REFRESH MATERIALIZED VIEW analytics_daily_materials;
REFRESH MATERIALIZED VIEW analytics_daily_profit;
```

### 5.2 Updating Summary Tables

Summary tables are updated automatically by scheduled jobs:

- Weekly summary tables are updated every Monday at 2:00 AM
- Monthly summary tables are updated on the 1st of each month at 3:00 AM

They can also be updated manually:

```sql
SELECT update_current_week_summaries();
SELECT update_current_month_summaries();
```

### 5.3 Monitoring Cache Performance

The caching utility logs cache hits and misses to the console. These logs can be used to monitor cache performance and adjust TTL values as needed.

## 6. Future Improvements

1. **More Summary Tables**: Add summary tables for other metrics (e.g., client performance, category performance)
2. **More Time Granularities**: Add summary tables for quarterly and yearly data
3. **Distributed Caching**: Replace in-memory cache with a distributed cache (e.g., Redis) for better scalability
4. **Cache Warming**: Implement cache warming for common queries to improve initial response times
5. **Adaptive TTL**: Implement adaptive TTL based on data volatility and query frequency
