import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCachedData, getAnalyticsCacheKey, parseAnalyticsDates } from '@/lib/cache/analytics-cache';
import { analyticsService } from '@/lib/services/analytics-service';

/**
 * GET /api/analytics/revenue
 * Returns revenue metrics by period
 *
 * Query parameters:
 * - period: Period type (day, week, month, year)
 * - startDate: Start date for the metrics (YYYY-MM-DD)
 * - endDate: End date for the metrics (YYYY-MM-DD)
 *
 * This endpoint uses a hybrid approach:
 * 1. For common queries, it uses pre-aggregated data from summary tables
 * 2. For less common queries, it falls back to on-demand calculations
 * 3. Results are cached to improve performance for repeated queries
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const { startDate, endDate } = parseAnalyticsDates(searchParams);

    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return NextResponse.json(
        { error: 'period must be one of: day, week, month, year' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = getAnalyticsCacheKey('revenue', { period, startDate, endDate });

    // Get data from cache or fetch it
    try {
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
      console.error('Error fetching revenue by period:', error);
      return NextResponse.json(
        { error: 'Failed to fetch revenue by period' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/analytics/revenue:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
