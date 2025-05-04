import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCachedData, getAnalyticsCacheKey } from '@/lib/cache/analytics-cache';
import { analyticsService } from '@/lib/services/analytics-service';

/**
 * GET /api/analytics/client-frequency
 * Returns client order frequency metrics
 *
 * Query parameters:
 * - startDate: Start date for the metrics (YYYY-MM-DD)
 * - endDate: End date for the metrics (YYYY-MM-DD)
 * - minOrders: Minimum number of orders for a client to be included (default: 2)
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
    const minOrders = parseInt(searchParams.get('minOrders') || '2', 10);

    // Create cache key
    const cacheKey = getAnalyticsCacheKey('client-frequency', { startDate, endDate, minOrders });
    
    // Get data from cache or fetch it
    const data = await getCachedData(
      cacheKey,
      // Cache for 15 minutes
      900,
      async () => {
        // Use the analytics service which implements the hybrid approach
        return await analyticsService.getClientOrderFrequency({ startDate, endDate }, minOrders);
      }
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching client order frequency:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client order frequency' },
      { status: 500 }
    );
  }
}
