import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCachedData, getAnalyticsCacheKey, parseAnalyticsDates } from '@/lib/cache/analytics-cache';
import { analyticsService } from '@/lib/services/analytics-service';

/**
 * GET /api/analytics/expenses
 * Returns expense metrics by category
 *
 * Query parameters:
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

    const { startDate, endDate } = parseAnalyticsDates(searchParams);

    // Create cache key
    const cacheKey = getAnalyticsCacheKey('expenses', { startDate, endDate });

    // Get data from cache or fetch it
    try {
      const data = await getCachedData(
        cacheKey,
        // Cache for 15 minutes
        900,
        async () => {
          // Use the analytics service which implements the hybrid approach
          return await analyticsService.getExpensesByCategory({ startDate, endDate });
        }
      );

      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expenses by category' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/analytics/expenses:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
