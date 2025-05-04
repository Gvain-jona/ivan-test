import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCachedData, getAnalyticsCacheKey } from '@/lib/cache/analytics-cache';
import { analyticsService } from '@/lib/services/analytics-service';

/**
 * GET /api/analytics/client-performance
 * Returns client performance metrics
 *
 * Query parameters:
 * - startDate: Start date for the metrics (YYYY-MM-DD)
 * - endDate: End date for the metrics (YYYY-MM-DD)
 * - limit: Maximum number of clients to return (default: 10)
 * 
 * This endpoint uses a hybrid approach:
 * 1. For common queries, it uses pre-aggregated data from summary tables
 * 2. For less common queries, it falls back to on-demand calculations
 * 3. Results are cached to improve performance for repeated queries
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2023-01-01';
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Create cache key
    const cacheKey = getAnalyticsCacheKey('client-performance', { startDate, endDate, limit });
    
    // Get data from cache or fetch it
    const data = await getCachedData(
      cacheKey,
      // Cache for 15 minutes
      900,
      async () => {
        // Use the analytics service which implements the hybrid approach
        return await analyticsService.getClientPerformance({ startDate, endDate }, limit);
      }
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching client performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client performance' },
      { status: 500 }
    );
  }
}
